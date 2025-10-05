import { GoogleGenAI, Part, Type } from "@google/genai";
import type { GeneratedEbook, Chapter, EbookImage } from '../types';

export const getGeminiApiKey = (): string | null => {
  // A chave da API deve ser fornecida através da variável de ambiente API_KEY.
  // O componente ApiKeySetup em App.tsx orienta o usuário sobre como configurá-la.
  return process.env.API_KEY || null;
};

const dataURLtoBase64 = (dataurl: string): string => {
    return dataurl.split(',')[1];
}

const fileToPart = async (file: File): Promise<Part> => {
    const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
    return {
        inlineData: {
            mimeType: file.type || "video/mp4",
            data: base64,
        },
    };
}

export const transcribeVideo = async (
    apiKey: string,
    mediaFile: File,
    onProgress: (message: string, progress?: number) => void
): Promise<string> => {
    onProgress("Iniciando transcrição...");
    const ai = new GoogleGenAI({ apiKey });
    try {
        const mediaPart = await fileToPart(mediaFile);
        const prompt = `
            Transcreva o áudio deste arquivo de forma detalhada e completa.
            A transcrição deve ser um texto contínuo em formato Markdown.
            Insira marcações de tempo (ex: [00:05:23]) no início de parágrafos ou falas significativas.
        `;
        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ parts: [ { text: prompt }, mediaPart] }],
        });
        onProgress("Transcrição concluída.");
        return result.text;
    } catch (error) {
        console.error("Erro ao transcrever o arquivo:", error);
        throw new Error("Falha ao transcrever o arquivo. A IA pode não ter conseguido processar o áudio.");
    }
};

const generateChapterTitles = async (ai: GoogleGenAI, transcription: string, language: string): Promise<string[]> => {
    const prompt = `
        Analise a seguinte transcrição de uma aula e sugira uma lista de títulos para os capítulos de um ebook.
        Os títulos devem ser concisos, refletir os principais tópicos abordados e estar no idioma: ${language}.
        Retorne APENAS um objeto JSON com uma chave "titles" contendo um array de strings.

        TRANSCRIÇÃO:
        ${transcription}
    `;
    const schema = {
        type: Type.OBJECT,
        properties: {
            titles: {
                type: Type.ARRAY,
                description: "Lista de títulos dos capítulos.",
                items: { type: Type.STRING }
            }
        },
        required: ["titles"]
    };

    const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json", responseSchema: schema }
    });
    const parsed = JSON.parse(result.text) as { titles: string[] };
    return parsed.titles;
};

const generateChapterContent = async (ai: GoogleGenAI, title: string, transcription: string, language: string): Promise<Omit<Chapter, "images">> => {
    const prompt = `
        Com base na transcrição completa fornecida, escreva o conteúdo para o capítulo intitulado "${title}".
        O conteúdo deve ser detalhado e bem estruturado em formato Markdown, focando APENAS nas partes da transcrição relevantes para este título.
        O texto deve ser escrito no idioma: ${language}.

        REGRAS ESTRITAS DE FORMATAÇÃO:
        1.  Sua resposta deve ser APENAS o conteúdo do capítulo em formato Markdown.
        2.  NÃO inclua nenhuma frase introdutória ou explicativa como "Aqui está o conteúdo..." ou similar.
        3.  NÃO envolva a resposta em um bloco de código (usando \`\`\`). A resposta deve ser o texto Markdown puro.
        4.  A resposta deve começar diretamente com o primeiro título ou parágrafo do capítulo.

        TRANSCRIÇÃO COMPLETA PARA CONTEXTO:
        ${transcription}
    `;
    const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
    });
    
    let content = result.text.trim();

    // Tenta extrair o conteúdo de dentro de um bloco de código Markdown, caso o modelo o tenha adicionado.
    const codeBlockRegex = /^```(?:markdown|md)?\s*([\s\S]+?)\s*```$/;
    const match = content.match(codeBlockRegex);

    if (match && match[1]) {
        content = match[1].trim();
    }

    return { title, content };
};

export const generateEbookFromTranscriptAndFrames = async (
    apiKey: string,
    transcription: string,
    frames: string[],
    onProgress: (message: string, progress?: number) => void,
    language: string,
): Promise<GeneratedEbook> => {
    const ai = new GoogleGenAI({ apiKey });
    try {
        onProgress("Definindo os capítulos...", 5);
        const chapterTitles = await generateChapterTitles(ai, transcription, language);
        
        const chapterTitlesString = chapterTitles.join('\n - ');
        const introTitlePrompt = `
            Baseado na seguinte lista de capítulos de um ebook, escreva um título principal conciso e informativo para o ebook e um parágrafo de introdução.
            O idioma de saída deve ser ${language}.
            Sua resposta DEVE ser um objeto JSON válido com as chaves "title" e "introduction".

            TÍTULOS DOS CAPÍTULOS:
            - ${chapterTitlesString}
        `;

        const introTitleSchema = {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "Título do ebook." },
                introduction: { type: Type.STRING, description: "Introdução do ebook." },
            },
            required: ["title", "introduction"],
        };
        
        onProgress("Gerando título e introdução...", 15);
        const introTitleResult = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ parts: [{ text: introTitlePrompt }] }],
            config: { responseMimeType: "application/json", responseSchema: introTitleSchema }
        });
        
        const ebookScaffold = JSON.parse(introTitleResult.text) as { title: string, introduction: string };

        const chaptersWithoutImages: Omit<Chapter, "images">[] = [];
        for (let i = 0; i < chapterTitles.length; i++) {
            const title = chapterTitles[i];
            const progress = 20 + ((i + 1) / chapterTitles.length) * 50; // Progress from 20% to 70%
            onProgress(`Escrevendo capítulo ${i + 1}/${chapterTitles.length}: "${title}"`, progress);
            const chapterContent = await generateChapterContent(ai, title, transcription, language);
            chaptersWithoutImages.push(chapterContent);
        }

        const ebookContent = {
            ...ebookScaffold,
            chapters: chaptersWithoutImages,
        };

        const frameParts: Part[] = frames.map(frameDataUrl => ({
            inlineData: { mimeType: "image/jpeg", data: dataURLtoBase64(frameDataUrl) }
        }));
        
        const imagePlacementProgressCallback = (message: string) => {
            if (message.toLowerCase().includes('finalizando')) return; 
            onProgress(message, 75); 
        };
        
        const fullChapters = await placeImagesInEbook(ai, ebookContent, frames, frameParts, imagePlacementProgressCallback, language);
        
        onProgress("Finalizando...", 100);
        return {
            title: ebookScaffold.title,
            introduction: ebookScaffold.introduction,
            chapters: fullChapters,
        };

    } catch (error) {
        console.error("Erro ao gerar o ebook:", error);
        throw new Error("Falha ao gerar o conteúdo do ebook. A IA pode ter retornado um formato inesperado.");
    }
};


const placeImagesInEbook = async (
    ai: GoogleGenAI,
    ebookContent: Omit<GeneratedEbook, "chapters"> & { chapters: Omit<Chapter, "images">[] },
    frames: string[],
    frameParts: Part[],
    onProgress: (message: string) => void,
    language: string,
): Promise<Chapter[]> => {
    if (frames.length === 0) {
        onProgress("Finalizando (sem imagens)...");
        return ebookContent.chapters.map(c => ({ ...c, images: [] }));
    }

    onProgress("Analisando o melhor local para as imagens...");

    const prompt = `
      Você receberá o conteúdo de um ebook (título, introdução, capítulos) e uma série de imagens (frames de um vídeo).
      Sua tarefa é determinar a melhor localização para cada imagem dentro dos capítulos.
      Para cada capítulo, decida quais imagens são mais relevantes.
      Retorne um objeto JSON com uma chave "chapters". O valor deve ser um array, onde cada elemento representa um capítulo e contém:
      1. "title": O título original do capítulo (string).
      2. "images": Um array de objetos, onde cada objeto tem:
         - "imageIndex": O índice da imagem no array de frames original (number).
         - "caption": Uma legenda curta e descritiva para a imagem, no idioma ${language} (string).

      EBOOK COMPLETO:
      ${JSON.stringify(ebookContent)}
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            chapters: {
                type: Type.ARRAY,
                description: "Array de capítulos com as imagens e legendas associadas.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        images: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    imageIndex: { type: Type.INTEGER, description: "Índice da imagem no array original." },
                                    caption: { type: Type.STRING, description: "Legenda para a imagem." }
                                },
                                required: ["imageIndex", "caption"]
                            }
                        }
                    },
                    required: ["title", "images"]
                }
            }
        },
        required: ["chapters"]
    };

    const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
            { parts: [{ text: prompt }, ...frameParts] }
        ],
        config: { responseMimeType: "application/json", responseSchema: schema }
    });
    
    onProgress("Finalizando a alocação de imagens...");

    const imagePlacement = JSON.parse(result.text) as { chapters: { title: string, images: { imageIndex: number; caption: string }[] }[] };

    return ebookContent.chapters.map(originalChapter => {
        const placementInfo = imagePlacement.chapters.find(p => p.title === originalChapter.title);
        const images: EbookImage[] = placementInfo?.images
            ?.filter(img => img.imageIndex >= 0 && img.imageIndex < frames.length)
            .map(img => ({
                url: frames[img.imageIndex],
                caption: img.caption
            })) || [];

        return {
            ...originalChapter,
            images,
        };
    });
};


export const generateEbookFromVideo = async (
  apiKey: string,
  videoFile: File,
  selectedFrames: string[],
  onProgress: (message: string) => void,
  language: string,
): Promise<GeneratedEbook> => {
    onProgress("Iniciando a análise do vídeo...");
    const ai = new GoogleGenAI({ apiKey });

    // FIX: Define an explicit type for the AI's JSON response to correctly type `imageIndex`.
    type EbookFromVideoResponse = {
        title: string;
        introduction: string;
        chapters: {
            title: string;
            content: string;
            images: { imageIndex: number; caption: string; }[];
        }[];
    };

    try {
        const videoPart = await fileToPart(videoFile);
        const frameParts: Part[] = selectedFrames.map(frame => ({
            inlineData: { mimeType: 'image/jpeg', data: dataURLtoBase64(frame) }
        }));

        const prompt = `
            Analise este vídeo e as imagens de frames fornecidas.
            Sua tarefa é criar um ebook bem estruturado baseado no conteúdo falado no vídeo.
            O ebook deve ser escrito no idioma: ${language}.
            
            Sua resposta DEVE ser um objeto JSON válido, seguindo estritamente a estrutura abaixo:
            {
              "title": "Um título conciso e informativo para o ebook",
              "introduction": "Um parágrafo de introdução que resume o conteúdo.",
              "chapters": [
                {
                  "title": "Título do Capítulo 1",
                  "content": "O conteúdo do capítulo em formato Markdown. O conteúdo deve ser uma transcrição e elaboração do que foi dito no vídeo, fiel ao conteúdo original.",
                  "images": [
                    {
                      "imageIndex": <índice da imagem no array de frames (ex: 0, 1, 2)>,
                      "caption": "Uma legenda curta e descritiva para a imagem."
                    }
                  ]
                }
              ]
            }
        `;
        
        const schema = {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                introduction: { type: Type.STRING },
                chapters: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            content: { type: Type.STRING },
                            images: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        imageIndex: { type: Type.INTEGER },
                                        caption: { type: Type.STRING }
                                    },
                                    required: ["imageIndex", "caption"]
                                }
                            }
                        },
                        required: ["title", "content", "images"]
                    }
                }
            },
            required: ["title", "introduction", "chapters"]
        };
        
        onProgress("Gerando conteúdo do ebook com a IA...");
        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ parts: [{ text: prompt }, videoPart, ...frameParts] }],
            config: { responseMimeType: "application/json", responseSchema: schema }
        });

        onProgress("Finalizando e formatando o ebook...");
        const parsedResult = JSON.parse(result.text) as EbookFromVideoResponse;

        // Mapeia os índices das imagens para as URLs reais dos frames
        const chaptersWithImageUrls = parsedResult.chapters.map(chapter => ({
            ...chapter,
            images: chapter.images
                .filter(img => img.imageIndex >= 0 && img.imageIndex < selectedFrames.length)
                .map(img => ({
                    // FIX: Construct the EbookImage object correctly by omitting `imageIndex`, which is not part of the final type.
                    caption: img.caption,
                    url: selectedFrames[img.imageIndex]
                }))
        }));

        return {
            ...parsedResult,
            chapters: chaptersWithImageUrls,
        };

    } catch (error) {
        console.error("Erro ao gerar o ebook a partir do vídeo:", error);
        throw new Error("Falha ao gerar o ebook. A IA pode não ter conseguido processar o vídeo.");
    }
};
