import React, { useState } from 'react';

interface FrameSelectorProps {
  frames: string[];
  onGenerate: (selectedFrames: string[]) => void;
  onCancel: () => void;
}

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
    </svg>
);


const FrameSelector: React.FC<FrameSelectorProps> = ({ frames, onGenerate, onCancel }) => {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(() => new Set(frames.map((_, i) => i)));

  const toggleSelection = (index: number) => {
    setSelectedIndices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedIndices(new Set(frames.map((_, i) => i)));
  };

  const handleDeselectAll = () => {
    setSelectedIndices(new Set());
  };

  const handleSubmit = () => {
    const selectedFrames = frames.filter((_, index) => selectedIndices.has(index));
    onGenerate(selectedFrames);
  };

  return (
    <div className="w-full max-w-7xl bg-white rounded-xl shadow-lg border border-slate-200/80 animate-fade-in">
      <div className="p-8 text-center border-b border-slate-200">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Selecione os Melhores Frames</h2>
        <p className="mt-4 text-lg text-slate-600 max-w-3xl mx-auto">
          Escolha as imagens que melhor representam os pontos-chave do seu vídeo. Elas serão usadas para ilustrar os capítulos do seu ebook.
        </p>
      </div>

      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="font-medium text-slate-700">
                <span className="font-semibold text-blue-600">{selectedIndices.size}</span> de {frames.length} frames selecionados
            </div>
            <div className="flex gap-3">
                <button onClick={handleSelectAll} className="bg-white text-slate-700 hover:bg-slate-100 font-semibold py-2 px-4 rounded-md text-sm transition-colors border border-slate-300">
                    Marcar Todos
                </button>
                <button onClick={handleDeselectAll} className="bg-white text-slate-700 hover:bg-slate-100 font-semibold py-2 px-4 rounded-md text-sm transition-colors border border-slate-300">
                    Desmarcar Todos
                </button>
            </div>
        </div>
        
        {frames.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {frames.map((frame, index) => {
                    const isSelected = selectedIndices.has(index);
                    return (
                    <button
                        key={index}
                        onClick={() => toggleSelection(index)}
                        className={`relative aspect-video rounded-lg overflow-hidden focus:outline-none transition-all duration-200 group ring-4 ${isSelected ? 'ring-blue-500' : 'ring-transparent hover:ring-blue-500/50'}`}
                        aria-pressed={isSelected}
                        aria-label={`Selecionar frame ${index + 1}`}
                    >
                        <img src={frame} alt={`Frame ${index + 1}`} className="w-full h-full object-cover" />
                        <div className={`absolute inset-0 transition-colors ${isSelected ? 'bg-black/20' : 'bg-black/40 group-hover:bg-black/20'}`}></div>
                        {isSelected && (
                        <div className="absolute top-2 right-2 transform scale-100 transition-transform duration-200">
                            <CheckCircleIcon className="h-7 w-7 text-white bg-blue-600 rounded-full border-2 border-white" />
                        </div>
                        )}
                    </button>
                    )
                })}
            </div>
            ) : (
            <p className="text-center text-slate-500 py-10">Nenhum frame foi extraído do vídeo.</p>
        )}
      </div>

      <div className="p-6 border-t border-slate-200 bg-slate-50/50 flex flex-col md:flex-row justify-center items-center gap-4">
        <button
          onClick={onCancel}
          className="w-full md:w-auto bg-white hover:bg-slate-100 text-slate-700 font-semibold py-3 px-8 rounded-lg transition-colors border border-slate-300 shadow-sm"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={selectedIndices.size === 0}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-lg transition-all transform hover:scale-105 shadow-md focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
          Gerar Ebook com {selectedIndices.size} Imagens
        </button>
      </div>
    </div>
  );
};

export default FrameSelector;