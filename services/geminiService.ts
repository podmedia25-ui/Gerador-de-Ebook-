import { GoogleGenAI, Part, Type } from "@google/genai";
import type { GeneratedEbook, Chapter, EbookImage } from '../types';

const getGeminiApiKey = (): string => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API key for Gemini is not configured. Please set the API_KEY environment variable.");
  }
  return apiKey;
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
    mediaFile: File,
    onProgress: (message: string, progress?: number) => void
): Promise<string> => {
    onProgress("Iniciando transcrição...");
    const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
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
    transcription: string,
    frames: string[],
    onProgress: (message: string, progress?: number) => void,
    language: string,
): Promise<GeneratedEbook> => {
    const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
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
            ...ebookContent,
            chapters: fullChapters,
        };

    } catch (error) {
        console.error("Erro ao gerar ebook (Modo Detalhado):", error);
        throw new Error("Falha ao gerar o ebook a partir da transcrição. Verifique o console para mais detalhes.");
    }
}

export const generateEbookFromVideo = async (
  videoFile: File,
  frames: string[],
  onProgress: (message: string, progress?: number) => void,
  language: string,
): Promise<GeneratedEbook> => {
  const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });

  try {
    onProgress("Processando o vídeo para análise...");
    const videoPart = await fileToPart(videoFile);

    onProgress("Gerando a estrutura do ebook a partir do vídeo...");
    const contentGenerationPrompt = `
        Analise este vídeo de uma aula e gere o conteúdo para um ebook no idioma ${language}.
        Sua resposta DEVE ser um objeto JSON válido.
        O conteúdo dos capítulos deve ser em formato Markdown, bem estruturado e fiel ao vídeo.
        O formato do JSON deve ser o definido no schema.
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: "Um título conciso e informativo para o ebook" },
            introduction: { type: Type.STRING, description: "Um parágrafo de introdução que resume o conteúdo do vídeo." },
            chapters: {
                type: Type.ARRAY,
                description: "Uma lista de capítulos baseada nos tópicos do vídeo.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "O título do capítulo." },
                        content: { type: Type.STRING, description: "Conteúdo detalhado do capítulo em formato Markdown." },
                    },
                    required: ["title", "content"],
                }
            }
        },
        required: ["title", "introduction", "chapters"],
    };

    const contentResult = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ parts: [ { text: contentGenerationPrompt }, videoPart] }],
        config: { responseMimeType: "application/json", responseSchema: schema }
    });

    const ebookContent = JSON.parse(contentResult.text) as Omit<GeneratedEbook, "chapters"> & { chapters: Omit<Chapter, "images">[] };

    const frameParts: Part[] = frames.map(frameDataUrl => ({
        inlineData: { mimeType: "image/jpeg", data: dataURLtoBase64(frameDataUrl) }
    }));
    const fullChapters = await placeImagesInEbook(ai, ebookContent, frames, frameParts, onProgress, language);

    return { ...ebookContent, chapters: fullChapters };

  } catch (error: any) {
    console.error("Erro ao gerar ebook:", error);
    throw new Error("Falha ao gerar o ebook. Verifique o console para mais detalhes e certifique-se que sua API Key está configurada.");
  }
};

async function placeImagesInEbook(
    ai: GoogleGenAI,
    ebookContent: Omit<GeneratedEbook, "chapters"> & { chapters: Omit<Chapter, "images">[] },
    frames: string[],
    frameParts: Part[],
    onProgress: (message: string, progress?: number) => void,
    language: string,
): Promise<Chapter[]> {
    let finalChapters: Chapter[] = ebookContent.chapters.map((c) => ({...c, images: []}));

    if (frames.length > 0) {
        onProgress("Analisando e posicionando imagens nos capítulos...");
        
        const imagePlacementPrompt = `
            Você receberá o conteúdo de um ebook em JSON e uma série de imagens.
            Sua tarefa é analisar cada imagem, criar uma legenda descritiva no idioma ${language} e determinar em qual capítulo ela se encaixa melhor.
            Apenas posicione imagens que sejam realmente relevantes para o conteúdo do capítulo.
            Retorne um objeto JSON com a estrutura definida no schema.
        `;

        const imagePlacementSchema = {
            type: Type.OBJECT,
            properties: {
                placements: {
                    type: Type.ARRAY,
                    description: "Lista de posicionamentos de imagem.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            chapterIndex: { type: Type.NUMBER, description: "O índice do capítulo (baseado em zero) onde a imagem deve ser colocada." },
                            imageIndex: { type: Type.NUMBER, description: "O índice da imagem (baseado em zero) a ser colocada." },
                            caption: { type: Type.STRING, description: "Uma legenda descritiva e concisa para a imagem." },
                        },
                        required: ["chapterIndex", "imageIndex", "caption"],
                    }
                }
            },
            required: ["placements"],
        };

        const imagePlacementResult = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ parts: [{text: imagePlacementPrompt }, { text: JSON.stringify(ebookContent) }, ...frameParts] }],
            config: { responseMimeType: "application/json", responseSchema: imagePlacementSchema }
        });
        const imagePlacementData = JSON.parse(imagePlacementResult.text) as { placements: { chapterIndex: number, imageIndex: number, caption: string }[] };

        if (imagePlacementData.placements) {
            for (const placement of imagePlacementData.placements) {
              const chapterIndex = placement.chapterIndex;
              const imageIndex = placement.imageIndex;
              if (finalChapters[chapterIndex] && frames[imageIndex]) {
                finalChapters[chapterIndex].images.push({
                  url: frames[imageIndex],
                  caption: placement.caption,
                });
              }
            }
        }
    }

    onProgress("Finalizando...", 100);
    return finalChapters;
}