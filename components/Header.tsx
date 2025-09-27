
import React from 'react';

const BookIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
);

interface HeaderProps {
    onGoToHome: () => void;
}

const Header: React.FC<HeaderProps> = ({ onGoToHome }) => {
  return (
    <header className="bg-white/75 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-20">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
            <button
                onClick={onGoToHome}
                className="flex items-center space-x-2 group focus:outline-none"
                aria-label="Voltar para a página inicial"
            >
                <BookIcon className="h-5 w-5 text-blue-600" />
                <h1 className="text-md font-semibold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                    Gerador de Ebook a Partir de Vídeo
                </h1>
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;