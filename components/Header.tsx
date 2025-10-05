import React from 'react';
import { User } from 'firebase/auth';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

const BookIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
);

interface HeaderProps {
    onGoToHome: () => void;
    user: User | null;
}

const Header: React.FC<HeaderProps> = ({ onGoToHome, user }) => {
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
            {user && (
                <div className="flex items-center space-x-4">
                    <span className="text-sm text-slate-600 hidden sm:block" title={user.email || ''}>
                        {user.email}
                    </span>
                    <button
                        onClick={() => signOut(auth)}
                        className="bg-white hover:bg-slate-100 text-slate-700 font-semibold py-1.5 px-3 rounded-md transition-colors border border-slate-300 shadow-sm text-sm"
                    >
                        Sair
                    </button>
                </div>
            )}
        </div>
      </div>
    </header>
  );
};

export default Header;