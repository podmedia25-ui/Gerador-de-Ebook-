import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Ebook } from './types';
import { generateEbookFromVideo, transcribeVideo, generateEbookFromTranscriptAndFrames } from './services/geminiService';
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

type AppMode = 'simple' | 'advanced';
type AppState = 'history' | 'uploading' | 'selecting' | 'generating' | 'viewing' | 'editing' | 'error';
const LOCAL_STORAGE_KEY = 'ebook-generator-history';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('history');
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
  
  const updateLoader = (message: string, progressValue?: number) => {
    setLoadingMessage(message);
    if (progressValue !== undefined) {
        setProgress(progressValue);
    }
  };


  useEffect(() => {
    try {
      // FIX: Explicitly use window.localStorage to avoid type errors with missing DOM library.
      // @google/genai-fix: Cast `window` to `any` to access DOM properties without DOM lib types.
      const storedEbooks = (window as any).localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedEbooks) setSavedEbooks(JSON.parse(storedEbooks));
    } catch (e) {
      console.error("Falha ao carregar ebooks do localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
      // FIX: Explicitly use window.localStorage to avoid type errors with missing DOM library.
      // @google/genai-fix: Cast `window` to `any` to access DOM properties without DOM lib types.
      (window as any).localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(savedEbooks));
    } catch (e) {
      console.error("Falha ao salvar ebooks no localStorage", e);
    }
  }, [savedEbooks]);

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
      const fileForTranscription = files.audioFile || files.videoFile;
      if (!fileForTranscription) throw new Error("Nenhum arquivo de vídeo ou áudio fornecido para o Modo Detalhado.");

      const transcript = await transcribeVideo(fileForTranscription, updateLoader);
      setTranscription(transcript);

      let frames: string[] = [];
      if (files.videoFile) {
        setLoadingMessage("Extraindo frames do vídeo...");
        frames = await extractFrames(files.videoFile, 30);
        setAllFrames(frames);
        setAppState('selecting');
      } else {
        // Se for apenas áudio, pulamos a seleção de frames
        setAllFrames([]);
        handleEbookGeneration([]);
      }

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido ao processar o(s) arquivo(s).');
      setAppState('error');
    }
  }, [appMode]);
  
  const handleEbookGeneration = useCallback(async (selectedFrames: string[]) => {
    if (appMode === 'simple' && !videoFile) {
      setError("Arquivo de vídeo não encontrado.");
      setAppState('error');
      return;
    }
    
    generationCancelled.current = false;
    setAppState('generating');
    setError(null);

    try {
      let generatedContent;
      if (appMode === 'simple') {
        if (!videoFile) throw new Error("Arquivo de vídeo não encontrado para o modo simples.");
        updateLoader("Iniciando a geração do ebook (Modo Rápido)...");
        generatedContent = await generateEbookFromVideo(videoFile, selectedFrames, (msg) => updateLoader(msg), outputLanguage);
      } else {
        if (!transcription) {
          setError("Transcrição não encontrada para o Modo Detalhado.");
          setAppState('error');
          return;
        }
        updateLoader("Gerando ebook a partir da transcrição e imagens...", 0);
        generatedContent = await generateEbookFromTranscriptAndFrames(transcription, selectedFrames, updateLoader, outputLanguage);
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
  }, [videoFile, appMode, transcription, outputLanguage]);

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
    // @google/genai-fix: Cast `window` to `any` to access DOM properties without DOM lib types.
    if ((window as any).confirm("Tem certeza que deseja excluir este ebook? Esta ação não pode ser desfeita.")) {
      setSavedEbooks(prev => prev.filter(ebook => ebook.id !== id));
    }
  };

  const renderContent = () => {
    switch (appState) {
      case 'history':
        return <ProfileScreen ebooks={savedEbooks} onView={handleViewEbook} onDelete={handleDeleteEbook} onCreateNew={handleCreateNew} />;
      case 'uploading':
        return <VideoUploader onProcessFiles={handleFilesUpload} mode={appMode}/>;
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
      <Header onGoToHome={handleGoToHistory} />
      <main className="flex-grow w-full flex flex-col items-center p-4 sm:p-6 lg:p-8">
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
};

export default App;