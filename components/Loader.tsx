
import React from 'react';

interface LoaderProps {
  message: string;
  onCancel?: () => void;
  progress?: number | null;
}

const Loader: React.FC<LoaderProps> = ({ message, onCancel, progress }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 w-full max-w-md animate-fade-in">
      <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-blue-600"></div>
      <h3 className="text-2xl font-semibold mt-6 text-slate-900 tracking-tight">Processando...</h3>
      <p className="text-slate-600 mt-2">{message}</p>
      
      {progress !== null && progress !== undefined && (
        <div className="w-full mt-4">
            <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <p className="text-sm text-slate-500 mt-2 font-medium">{Math.round(progress)}%</p>
        </div>
      )}

      {onCancel && (
          <div className="mt-8">
              <button
                onClick={onCancel}
                className="bg-white hover:bg-slate-100 text-slate-700 font-semibold py-2 px-6 rounded-lg transition-colors border border-slate-300 shadow-sm"
              >
                  Cancelar
              </button>
          </div>
      )}
    </div>
  );
};

export default Loader;