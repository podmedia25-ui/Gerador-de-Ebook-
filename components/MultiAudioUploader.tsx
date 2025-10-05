import React, { useState, useRef } from 'react';

const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const VideoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 001.553.832l3-2a1 1 0 000-1.664l-3-2z" />
    </svg>
);

const TextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 1h8v2H6V5zm0 4h8v2H6V9zm0 4h5v2H6v-2z" clipRule="evenodd" />
    </svg>
);


const FileInfo: React.FC<{ file: File, onRemove: () => void }> = ({ file, onRemove }) => {
    const isVideo = file.type.startsWith('video/');
    const isText = file.type.startsWith('text/') || file.name.endsWith('.md');
    return (
        <div className="flex items-center justify-between bg-slate-100 p-2 pl-4 rounded-md w-full animate-fade-in">
            <div className="flex items-center min-w-0">
                {isVideo && <VideoIcon className="text-slate-500 flex-shrink-0" />}
                {isText && <TextIcon className="text-slate-500 flex-shrink-0" />}
                <p className="text-slate-800 font-medium truncate ml-2 text-sm" title={file.name}>{file.name}</p>
            </div>
            <button onClick={onRemove} className="text-slate-500 hover:text-red-600 font-bold text-lg px-2 flex-shrink-0" aria-label={`Remover ${file.name}`}>&times;</button>
        </div>
    );
};

interface MediaTextUploaderProps {
  onProcessFiles: (files: { videos: File[], texts: File[], pastedText: string }, language: string) => void;
}

const MediaTextUploader: React.FC<MediaTextUploaderProps> = ({ onProcessFiles }) => {
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [textFiles, setTextFiles] = useState<File[]>([]);
  const [pastedText, setPastedText] = useState<string>('');
  const [language, setLanguage] = useState<string>('pt-BR');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'text') => {
    const newFiles = Array.from((e.currentTarget as any).files as FileList);
    if (newFiles.length > 0) {
        if (type === 'video') {
            setVideoFiles(prev => [...prev, ...newFiles.filter(f => f.type.startsWith('video/'))]);
        } else {
            setTextFiles(prev => [...prev, ...newFiles.filter(f => f.type.startsWith('text/') || f.name.endsWith('.md'))]);
        }
    }
    if(e.currentTarget) e.currentTarget.value = '';
  };

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, type: 'enter' | 'leave' | 'over' | 'drop') => {
      e.preventDefault();
      e.stopPropagation();
      if (type === 'enter' || type === 'over') setIsDragging(true);
      if (type === 'leave' || type === 'drop') setIsDragging(false);
      if (type === 'drop') {
          const droppedFiles = Array.from((e.dataTransfer as any).files as FileList);
          const videos = droppedFiles.filter(f => f.type.startsWith('video/'));
          const texts = droppedFiles.filter(f => f.type.startsWith('text/') || f.name.endsWith('.md'));
          if (videos.length > 0) setVideoFiles(prev => [...prev, ...videos]);
          if (texts.length > 0) setTextFiles(prev => [...prev, ...texts]);
      }
  };

  const handleRemoveFile = (indexToRemove: number, type: 'video' | 'text') => {
    if (type === 'video') {
        setVideoFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    } else {
        setTextFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    }
  };

  const handleSubmit = () => {
    if (videoFiles.length > 0 || textFiles.length > 0 || pastedText.trim() !== '') {
        onProcessFiles({ videos: videoFiles, texts: textFiles, pastedText: pastedText.trim() }, language);
    }
  };
  
  return (
    <div className="w-full max-w-4xl animate-fade-in">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200/80 p-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Criação a Partir de Mídia e Texto</h2>
        <p className="mt-4 text-lg text-purple-700 font-semibold bg-purple-50 px-3 py-1 inline-block rounded-full">
            Modo Composição
        </p>
        <p className="mt-3 text-base text-slate-600 max-w-2xl mx-auto">
           Forneça arquivos de vídeo para extrair imagens e arquivos de texto (.txt, .md) para o conteúdo. A IA irá estruturar tudo em um ebook coeso.
        </p>
        
        <div className="mt-6 flex justify-center">
            <div className="flex items-center gap-2">
                <label htmlFor="language-select" className="text-sm font-medium text-slate-700">Idioma de Saída:</label>
                <select 
                    id="language-select" 
                    value={language}
                    onChange={(e) => setLanguage((e.currentTarget as any).value)}
                    className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en-US">English</option>
                    <option value="es-ES">Español (España)</option>
                    <option value="es-AR">Español (Argentina)</option>
                </select>
            </div>
        </div>
        
        <div
          className={`mt-4 border-2 border-dashed rounded-xl p-6 transition-colors duration-300 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300'}`}
          onDragEnter={(e) => handleDragEvents(e, 'enter')}
          onDragLeave={(e) => handleDragEvents(e, 'leave')}
          onDragOver={(e) => handleDragEvents(e, 'over')}
          onDrop={(e) => handleDragEvents(e, 'drop')}
        >
            <div className="flex flex-col items-center justify-center space-y-4">
                 <div className={`transition-colors p-3 rounded-full ${isDragging ? 'bg-blue-100' : 'bg-slate-100'}`}>
                    <UploadIcon className={`transition-colors h-8 w-8 ${isDragging ? 'text-blue-600' : 'text-slate-500'}`} />
                </div>
                <p className="font-medium text-slate-700">Arraste seus vídeos e textos aqui</p>
                <p className="text-slate-500">ou selecione os arquivos abaixo</p>
            </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div>
                <h3 className="font-semibold text-slate-800 mb-2">Vídeos (para imagens)</h3>
                <input type="file" accept="video/*" ref={videoInputRef} onChange={(e) => handleFileChange(e, 'video')} className="hidden" multiple />
                <button onClick={() => (videoInputRef.current as any)?.click()} className="w-full flex items-center justify-center bg-white hover:bg-slate-100 text-slate-700 font-semibold py-2 px-4 rounded-md transition-colors border border-slate-300 shadow-sm mb-3">
                    <VideoIcon /> Adicionar Vídeos
                </button>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {videoFiles.length > 0 ? videoFiles.map((file, index) => (
                        <FileInfo key={`${file.name}-v-${index}`} file={file} onRemove={() => handleRemoveFile(index, 'video')} />
                    )) : <p className="text-sm text-slate-500 text-center py-4">Nenhum vídeo adicionado.</p>}
                </div>
            </div>

            <div>
                <h3 className="font-semibold text-slate-800 mb-2">Textos (para conteúdo)</h3>
                <input type="file" accept="text/*,.md" ref={textInputRef} onChange={(e) => handleFileChange(e, 'text')} className="hidden" multiple />
                <button onClick={() => (textInputRef.current as any)?.click()} className="w-full flex items-center justify-center bg-white hover:bg-slate-100 text-slate-700 font-semibold py-2 px-4 rounded-md transition-colors border border-slate-300 shadow-sm mb-3">
                    <TextIcon /> Adicionar Arquivos de Texto
                </button>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-2 mb-3">
                    {textFiles.length > 0 ? textFiles.map((file, index) => (
                        <FileInfo key={`${file.name}-t-${index}`} file={file} onRemove={() => handleRemoveFile(index, 'text')} />
                    )) : <p className="text-sm text-slate-500 text-center py-2">Nenhum arquivo de texto adicionado.</p>}
                </div>
                <label htmlFor="pasted-text" className="text-sm font-medium text-slate-700">Ou cole o texto aqui:</label>
                <textarea
                    id="pasted-text"
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    rows={6}
                    className="mt-1 block w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition sm:text-sm"
                    placeholder="Cole o conteúdo aqui..."
                />
            </div>
        </div>
        
        {(videoFiles.length > 0 || textFiles.length > 0 || pastedText.trim() !== '') && (
            <div className="mt-8">
                <button onClick={handleSubmit} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-10 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 shadow-md">
                    Gerar Ebook
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default MediaTextUploader;