import React from 'react';

interface ErrorDisplayProps {
  message: string;
  onRetry: () => void;
}

const ErrorIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
);


const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry }) => {
  return (
    <div className="w-full max-w-2xl text-center p-8 bg-white rounded-xl shadow-lg border border-red-200/80 animate-fade-in">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <ErrorIcon />
        </div>
        <h3 className="mt-6 text-2xl font-semibold text-red-900 tracking-tight">Ocorreu um Erro</h3>
        <p className="mt-2 text-red-700">{message}</p>
        <div className="mt-8">
            <button
                onClick={onRetry}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-red-300"
            >
                Tentar Novamente
            </button>
        </div>
    </div>
  );
};

export default ErrorDisplay;