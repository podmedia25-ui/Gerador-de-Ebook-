import React, { useState, useRef, useCallback } from 'react';

interface VideoUploaderProps {
  onProcessFiles: (files: { videoFile?: File | null, audioFile?: File | null }, language: string) => void;
  mode: 'simple' | 'advanced';
}

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

const AudioIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M7 3a1 1 0 000 2v6a1 1 0 100 2v-2a1 1 0 10-2 0v2a1 1 0 100 2V5a3 3 0 016 0v6a1 1 0 100-2V5a1 1 0 10-2 0v6a1 1 0 100 2V5a3 3 0 01-3-2zM13 5a1 1 0 10-2 0v6a1 1 0 102 0V5z" />
    </svg>
);


const FileInfo: React.FC<{ file: File, onClear: () => void }> = ({ file, onClear }) => (
    <div className="flex items-center justify-between bg-slate-100 p-2 rounded-md w-full">
        <div className="flex items-center min-w-0">
            {file.type.startsWith('video/') ? <VideoIcon className="text-slate-500 flex-shrink-0" /> : <AudioIcon className="text-slate-500 flex-shrink-0" />}
            <p className="text-slate-800 font-medium truncate ml-2 text-sm" title={file.name}>{file.name}</p>
        </div>
        <button onClick={onClear} className="text-slate-500 hover:text-red-600 font-bold text-lg px-2 flex-shrink-0">&times;</button>
    </div>
);


const VideoUploader: React.FC<VideoUploaderProps> = ({ onProcessFiles, mode }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<string>('pt-BR');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const isAdvancedMode = mode === 'advanced';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'audio') => {
    // @google/genai-fix: Cast `e.currentTarget` to `any` to access `files` property.
    const files = (e.currentTarget as any).files;
    if (files && files.length > 0) {
      if (type === 'video') setVideoFile(files[0]);
      else setAudioFile(files[0]);
    }
  };

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, type: 'enter' | 'leave' | 'over' | 'drop') => {
      e.preventDefault();
      e.stopPropagation();
      if (type === 'enter' || type === 'over') setIsDragging(true);
      if (type === 'leave' || type === 'drop') setIsDragging(false);
      if (type === 'drop') {
          // @google/genai-fix: Cast dataTransfer to `any` as a workaround for missing DOM lib types.
          const files = Array.from((e.dataTransfer as any).files as FileList);
          const video = files.find(f => f.type.startsWith('video/'));
          const audio = files.find(f => f.type.startsWith('audio/'));
          if (video) setVideoFile(video);
          if (audio) setAudioFile(audio);
      }
  };

  const handleSubmit = () => {
    if(isAdvancedMode) {
      if (videoFile || audioFile) {
        onProcessFiles({ videoFile, audioFile }, language);
      }
    } else {
      if (videoFile) {
        onProcessFiles({ videoFile }, language);
      }
    }
  };
  
  const modeDescription = isAdvancedMode
    ? 'Ideal para vídeos longos. Envie um vídeo (para imagens), um áudio (para transcrição), ou ambos.' 
    : 'Analisa o vídeo diretamente para criar o ebook de forma rápida.';
  
  const simpleModeUploader = (
    <>
      <div
          className={`mt-4 border-2 border-dashed rounded-xl p-8 transition-colors duration-300 cursor-pointer ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'}`}
          onDragEnter={(e) => handleDragEvents(e, 'enter')}
          onDragLeave={(e) => handleDragEvents(e, 'leave')}
          onDragOver={(e) => handleDragEvents(e, 'over')}
          onDrop={(e) => handleDragEvents(e, 'drop')}
          onClick={() => (videoInputRef.current as any)?.click()}
      >
          <input type="file" accept="video/*" ref={videoInputRef} onChange={(e) => handleFileChange(e, 'video')} className="hidden" />
          <div className="flex flex-col items-center justify-center space-y-4">
              <div className={`transition-colors p-4 rounded-full ${isDragging ? 'bg-blue-100' : 'bg-slate-100'}`}>
                <UploadIcon className={`transition-colors ${isDragging ? 'text-blue-600' : 'text-slate-500'}`} />
              </div>
            {videoFile ? (
                <div>
                    <p className="text-slate-800 font-medium">{videoFile.name}</p>
                    <p className="text-sm text-slate-500">{(videoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
            ) : (
                <div>
                  <p className="font-medium text-slate-700">Arraste e solte um vídeo aqui</p>
                  <p className="text-slate-500">ou clique para selecionar o vídeo</p>
                </div>
            )}
            </div>
        </div>
        {videoFile && (
            <div className="mt-8">
                <button onClick={handleSubmit} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-10 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 shadow-md">
                    Processar Vídeo
                </button>
            </div>
        )}
    </>
  );

  const advancedModeUploader = (
    <>
        <div
          className={`mt-4 border-2 border-dashed rounded-xl p-8 transition-colors duration-300 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300'}`}
          onDragEnter={(e) => handleDragEvents(e, 'enter')}
          onDragLeave={(e) => handleDragEvents(e, 'leave')}
          onDragOver={(e) => handleDragEvents(e, 'over')}
          onDrop={(e) => handleDragEvents(e, 'drop')}
        >
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className={`transition-colors p-3 rounded-full ${isDragging ? 'bg-blue-100' : 'bg-slate-100'}`}>
              <UploadIcon className={`transition-colors h-8 w-8 ${isDragging ? 'text-blue-600' : 'text-slate-500'}`} />
            </div>
            <p className="font-medium text-slate-700">Arraste vídeo e/ou áudio aqui</p>
            <p className="text-slate-500">ou selecione os arquivos abaixo</p>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Video Input */}
            <div className="flex flex-col items-center gap-3 p-4 bg-slate-50/80 rounded-lg">
                <input type="file" accept="video/*" ref={videoInputRef} onChange={(e) => handleFileChange(e, 'video')} className="hidden" />
                {videoFile ? (
                    <FileInfo file={videoFile} onClear={() => setVideoFile(null)} />
                ) : (
                    <button onClick={() => (videoInputRef.current as any)?.click()} className="w-full flex items-center justify-center bg-white hover:bg-slate-100 text-slate-700 font-semibold py-2 px-4 rounded-md transition-colors border border-slate-300 shadow-sm">
                        <VideoIcon /> Carregar Vídeo
                    </button>
                )}
            </div>
            {/* Audio Input */}
            <div className="flex flex-col items-center gap-3 p-4 bg-slate-50/80 rounded-lg">
                <input type="file" accept="audio/*" ref={audioInputRef} onChange={(e) => handleFileChange(e, 'audio')} className="hidden" />
                {audioFile ? (
                    <FileInfo file={audioFile} onClear={() => setAudioFile(null)} />
                ) : (
                    <button onClick={() => (audioInputRef.current as any)?.click()} className="w-full flex items-center justify-center bg-white hover:bg-slate-100 text-slate-700 font-semibold py-2 px-4 rounded-md transition-colors border border-slate-300 shadow-sm">
                        <AudioIcon /> Carregar Áudio
                    </button>
                )}
            </div>
          </div>
        </div>
        {(videoFile || audioFile) && (
            <div className="mt-8">
                <button onClick={handleSubmit} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-10 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 shadow-md">
                    Processar Arquivos
                </button>
            </div>
        )}
    </>
  );

  return (
    <div className="w-full max-w-3xl animate-fade-in">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200/80 p-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Transforme Mídia em Conhecimento</h2>
        <p className="mt-4 text-lg text-blue-700 font-semibold bg-blue-50 px-3 py-1 inline-block rounded-full">
            Modo {isAdvancedMode ? 'Detalhado' : 'Rápido'}
        </p>
        <p className="mt-3 text-base text-slate-600">
           {modeDescription}
        </p>
        
        <div className="mt-6 flex justify-center">
            <div className="flex items-center gap-2">
                <label htmlFor="language-select" className="text-sm font-medium text-slate-700">Idioma de Saída:</label>
                <select 
                    id="language-select" 
                    value={language}
                    // @google/genai-fix: Cast `e.currentTarget` to `any` to access the `value` property, which resolves potential DOM lib type issues.
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

        <p className="mt-4 text-sm text-slate-500">
            Dica: O processamento ocorre inteiramente no seu navegador para maior privacidade.
        </p>
        
        {isAdvancedMode ? advancedModeUploader : simpleModeUploader}
      </div>
    </div>
  );
};

export default VideoUploader;