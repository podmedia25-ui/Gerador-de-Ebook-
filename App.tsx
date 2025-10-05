import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Ebook, GeneratedEbook } from './types';
import { getGeminiApiKey, generateEbookFromVideo, transcribeVideo, generateEbookFromTranscriptAndFrames } from './services/geminiService';
import { extractFrames } from './utils/videoUtils';
import Header from './components/Header';
import Footer from './components/Footer';
import VideoUploader from './components/VideoUploader';
import FrameSelector from './components/FrameSelector';
import Loader from './components/Loader';
import EbookDisplay from './components/EbookDisplay';
import EbookEditor from './components/EbookEditor';
import ErrorDisplay from './components/ErrorDisplay';
import ProfileScreen from './components/ProfileScreen';
import MediaTextUploader from './components/MultiAudioUploader';
import AuthScreen from './components/AuthScreen';
import { useAuth } from './hooks/useAuth';

type AppMode = 'simple' | 'advanced' | 'media-text';
type AppState = 'loading_key' | 'missing_key' | 'authenticating' | 'history' | 'uploading' | 'selecting' | 'generating' | 'viewing' | 'editing' | 'error';


const AlertTriangleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
);

const ApiKeySetup: React.FC = () => {
  return (
    <div className="w-full max-w-2xl text-center p-8 bg-white rounded-xl shadow-lg border border-amber-200/80 animate-fade-in">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangleIcon />
        </div>
        <h3 className="mt-6 text-2xl font-semibold text-amber-900 tracking-tight">Chave da API Necessária</h3>
        <div className="mt-4 text-left text-slate-700 space-y-3">
            <p>
                Esta aplicação precisa de uma chave da API do Google Gemini para funcionar.
            </p>
            <p>
                Por motivos de segurança, a chave deve ser configurada como uma <strong>variável de ambiente</strong> no sistema onde a aplicação está sendo executada. Ela <strong>não pode</strong> ser inserida diretamente aqui.
            </p>
            <p className="font-medium">Como configurar:</p>
            <ol className="list-decimal list-inside bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm">
                <li>Acesse as configurações de ambiente da sua plataforma (ex: Vercel, Netlify, ou seu ambiente local).</li>
                <li>Crie uma nova variável de ambiente com o nome:</li>
                <li className="my-2">
                    <code className="bg-slate-200 text-slate-800 font-mono text-base py-1 px-2 rounded">API_KEY</code>
                </li>
                <li>Cole a sua chave da API do Google Gemini como o valor dessa variável.</li>
                <li>Salve as alterações e reinicie ou refaça o deploy da sua aplicação.</li>
            </ol>
            <p>
                Após a configuração correta, recarregue esta página para começar a usar a aplicação.
            </p>
        </div>
    </div>
  );
};


const App: React.FC = () => {
  const { user, isAuthLoading } = useAuth();
  const [appState, setAppState] = useState<AppState>('loading_key');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [appMode, setAppMode] = useState<AppMode>('simple');
  const [savedEbooks, setSavedEbooks] = useState<Ebook[]>([]);
  const [currentEbook, setCurrentEbook] = useState<Ebook | null>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [allFrames, setAllFrames] = useState<string[]>([]);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [outputLanguage, setOutputLanguage] = useState<string>('pt-BR');

  const generationCancelled = useRef(false);

  const LOCAL_STORAGE_KEY = user ? `ebook-generator-history-${user.uid}` : null;
  
  const updateLoader = (message: string, progressValue?: number) => {
    setLoadingMessage(message);
    if (progressValue !== undefined) {
        setProgress(progressValue);
    }
  };
  
  useEffect(() => {
    const key = getGeminiApiKey();
    if (!key) {
        setAppState('missing_key');
        return;
    }
    setApiKey(key);

    if (isAuthLoading) {
        setAppState('authenticating');
    } else if (user) {
        setAppState('history');
    } else {
        // Not logged in, show auth screen and clear user data
        setAppState('authenticating');
        setSavedEbooks([]);
        setCurrentEbook(null);
    }
  }, [isAuthLoading, user]);


  useEffect(() => {
    if (!LOCAL_STORAGE_KEY) return;
    try {
      const storedEbooks = (window as any).localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedEbooks) {
          setSavedEbooks(JSON.parse(storedEbooks));
      } else {
          setSavedEbooks([]); 
      }
    } catch (e) {
      console.error("Falha ao carregar ebooks do localStorage", e);
    }
  }, [LOCAL_STORAGE_KEY]);

  useEffect(() => {
    if (!LOCAL_STORAGE_KEY) return;
    try {
      (window as any).localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(savedEbooks));
    } catch (e) {
      console.error("Falha ao salvar ebooks no localStorage", e);
    }
  }, [savedEbooks, LOCAL_STORAGE_KEY]);

  const resetState = () => {
    setCurrentEbook(null);
    setVideoFile(null);
    setAudioFile(null);
    setAllFrames([]);
    setError(null);
    setLoadingMessage('');
    setProgress(null);
    setTranscription(null);
    generationCancelled.current = false;
  };

  const handleGoToHistory = () => {
    resetState();
    setAppState('history');
  };
  
  const handleCancelGeneration = () => {
    generationCancelled.current = true;
    handleGoToHistory();
  };
  
  const handleCreateNew = (mode: AppMode) => {
    resetState();
    setAppMode(mode);
    setAppState('uploading');
  };

  const handleEbookGeneration = useCallback(async (selectedFrames: string[], fileForTranscriptionOverride: File | null = null) => {
    if (!apiKey) {
      setError("Chave da API não encontrada.");
      setAppState('error');
      return;
    }

    if (appMode === 'simple' && !videoFile) {
      setError("Arquivo de vídeo não encontrado.");
      setAppState('error');
      return;
    }
    
    generationCancelled.current = false;
    setAppState('generating');
    setError(null);

    try {
      let generatedContent: GeneratedEbook;
      if (appMode === 'simple') {
        if (!videoFile) throw new Error("Arquivo de vídeo não encontrado para o modo simples.");
        updateLoader("Iniciando a geração do ebook (Modo Rápido)...");
        generatedContent = await generateEbookFromVideo(apiKey, videoFile, selectedFrames, (msg) => updateLoader(msg), outputLanguage);
      } else {
        const fileForTranscription = fileForTranscriptionOverride || audioFile || videoFile;
        if (!fileForTranscription) {
          setError("Arquivo de vídeo ou áudio para transcrição não encontrado.");
          setAppState('error');
          return;
        }

        updateLoader("Iniciando transcrição do áudio...", 0);
        const transcript = await transcribeVideo(apiKey, fileForTranscription, (msg) => updateLoader(msg));
        setTranscription(transcript);

        if (generationCancelled.current) return;
        
        updateLoader("Gerando ebook a partir da transcrição e imagens...", 0);
        generatedContent = await generateEbookFromTranscriptAndFrames(apiKey, transcript, selectedFrames, updateLoader, outputLanguage);
      }

      if (generationCancelled.current) return;
      
      const newEbook: Ebook = {
        ...generatedContent,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setSavedEbooks(prev => [newEbook, ...prev]);
      setCurrentEbook(newEbook);
      setAppState(appMode === 'advanced' ? 'editing' : 'viewing');

    } catch (err) {
      if (generationCancelled.current) return;
      console.error(err);
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido. Por favor, tente novamente.');
      setAppState('error');
    }
  }, [videoFile, audioFile, appMode, outputLanguage, apiKey]);

  const handleFilesUpload = useCallback(async (files: { videoFile?: File | null, audioFile?: File | null }, language: string) => {
    setAppState('generating');
    setError(null);
    setOutputLanguage(language);
    setVideoFile(files.videoFile || null);
    setAudioFile(files.audioFile || null);

    try {
      if (appMode === 'simple') {
        if (!files.videoFile) throw new Error("Nenhum arquivo de vídeo fornecido para o Modo Rápido.");
        setLoadingMessage("Extraindo frames do vídeo...");
        const frames = await extractFrames(files.videoFile, 30);
        setAllFrames(frames);
        setAppState('selecting');
        return;
      }
      
      // Modo Detalhado
      if (!files.videoFile && !files.audioFile) {
        throw new Error("Nenhum arquivo de vídeo ou áudio fornecido para o Modo Detalhado.");
      }

      if (files.videoFile) {
        // Primeiro extrai os frames e vai para a tela de seleção
        setLoadingMessage("Extraindo frames do vídeo...");
        const frames = await extractFrames(files.videoFile, 30);
        setAllFrames(frames);
        setAppState('selecting');
      } else {
        // Se for apenas áudio, pulamos a seleção de frames e vamos direto para a geração
        setAllFrames([]);
        // Passamos o arquivo de áudio diretamente para evitar problemas de estado obsoleto
        await handleEbookGeneration([], files.audioFile);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido ao processar o(s) arquivo(s).');
      setAppState('error');
    }
  }, [appMode, handleEbookGeneration]);
  
  const handleMediaTextUpload = useCallback(async (files: { videos: File[], texts: File[], pastedText: string }, language: string) => {
    if (!apiKey) {
        setError("Chave da API não encontrada.");
        setAppState('error');
        return;
    }
    if (files.texts.length === 0 && files.pastedText.trim() === '') {
        setError("É necessário fornecer ao menos um arquivo de texto ou colar um texto para o conteúdo.");
        setAppState('error');
        setTimeout(handleGoToHistory, 0); 
        return;
    }

    setAppState('generating');
    setError(null);
    setOutputLanguage(language);
    generationCancelled.current = false;

    try {
        updateLoader("Lendo conteúdo de texto...", 10);
        const textContents = await Promise.all(files.texts.map(file => file.text()));
        if (files.pastedText) {
            textContents.push(files.pastedText);
        }
        const combinedTranscription = textContents.join('\n\n---\n\n');
        setTranscription(combinedTranscription);

        if (generationCancelled.current) return;

        let combinedFrames: string[] = [];
        if (files.videos.length > 0) {
            updateLoader(`Extraindo frames de ${files.videos.length} vídeo(s)...`, 30);
            const frameArrays = await Promise.all(files.videos.map(video => extractFrames(video, 30)));
            combinedFrames = frameArrays.flat();
            setAllFrames(combinedFrames);
        }

        if (generationCancelled.current) return;

        updateLoader("Gerando ebook a partir do conteúdo combinado...", 60);

        const generatedContent = await generateEbookFromTranscriptAndFrames(apiKey, combinedTranscription, combinedFrames, updateLoader, language);

        if (generationCancelled.current) return;

        const newEbook: Ebook = {
            ...generatedContent,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        setSavedEbooks(prev => [newEbook, ...prev]);
        setCurrentEbook(newEbook);
        setAppState('editing');

    } catch (err) {
        if (generationCancelled.current) return;
        console.error(err);
        setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido ao processar os arquivos.');
        setAppState('error');
    }
  }, [apiKey]);


  const handleViewEbook = (id: string) => {
    const ebookToView = savedEbooks.find(ebook => ebook.id === id);
    if (ebookToView) {
      setCurrentEbook(ebookToView);
      setAppState('viewing');
    }
  };
  
  const handleEditEbook = (id: string) => {
    const ebookToEdit = savedEbooks.find(ebook => ebook.id === id);
    if (ebookToEdit) {
      setCurrentEbook(ebookToEdit);
      setAppState('editing');
    }
  };

  const handleSaveEbook = (updatedEbook: Ebook) => {
    const finalEbook = { ...updatedEbook, updatedAt: new Date().toISOString() };
    setSavedEbooks(prev => prev.map(e => e.id === finalEbook.id ? finalEbook : e));
    handleGoToHistory();
  };

  const handleDeleteEbook = (id: string) => {
    if ((window as any).confirm("Tem certeza que deseja excluir este ebook? Esta ação não pode ser desfeita.")) {
      setSavedEbooks(prev => prev.filter(ebook => ebook.id !== id));
    }
  };

  const renderContent = () => {
    switch (appState) {
      case 'loading_key':
        return <Loader message="Verificando configuração..." />;
      case 'missing_key':
        return <ApiKeySetup />;
      case 'authenticating':
        if (isAuthLoading) return <Loader message="Autenticando..." />;
        return <AuthScreen />;
      case 'history':
        return <ProfileScreen ebooks={savedEbooks} onView={handleViewEbook} onDelete={handleDeleteEbook} onCreateNew={handleCreateNew} />;
      case 'uploading':
        if (appMode === 'media-text') {
          return <MediaTextUploader onProcessFiles={handleMediaTextUpload} />;
        }
        return <VideoUploader onProcessFiles={handleFilesUpload} mode={appMode as 'simple' | 'advanced'}/>;
      case 'selecting':
        return <FrameSelector frames={allFrames} onCancel={handleGoToHistory} onGenerate={handleEbookGeneration} />;
      case 'generating':
        return <Loader message={loadingMessage} onCancel={handleCancelGeneration} progress={progress} />;
      case 'viewing':
        return currentEbook ? <EbookDisplay ebook={currentEbook} onBack={handleGoToHistory} onEdit={() => handleEditEbook(currentEbook.id)} /> : <ErrorDisplay message="Ebook não encontrado." onRetry={handleGoToHistory} />;
      case 'editing':
        return currentEbook ? <EbookEditor ebook={currentEbook} onSave={handleSaveEbook} onBack={handleGoToHistory} /> : <ErrorDisplay message="Ebook não encontrado para edição." onRetry={handleGoToHistory} />;
      case 'error':
        return <ErrorDisplay message={error || 'Ocorreu um erro desconhecido.'} onRetry={handleGoToHistory} />;
      default:
        return <div>Estado desconhecido</div>;
    }
  };

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen flex flex-col font-sans">
      <Header onGoToHome={handleGoToHistory} user={user} />
      <main className="flex-grow w-full flex flex-col items-center p-4 sm:p-6 lg:p-8">
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
};

export default App;
