
import React from 'react';
import type { Ebook } from '../types';

interface ProfileScreenProps {
  ebooks: Ebook[];
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateNew: (mode: 'simple' | 'advanced') => void;
}

const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
);

const ViewIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
    </svg>
);

const DeleteIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);


const ProfileScreen: React.FC<ProfileScreenProps> = ({ ebooks, onView, onDelete, onCreateNew }) => {
  return (
    <div className="w-full max-w-7xl animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Seu Histórico</h1>
          <p className="mt-1 text-lg text-slate-600">Seu histórico de ebooks gerados fica salvo no seu navegador.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
             <button
              onClick={() => onCreateNew('simple')}
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg transition-all transform hover:scale-105 shadow-md focus:outline-none focus:ring-4 focus:ring-blue-300 flex-shrink-0"
            >
              <PlusIcon className="mr-2" />
              Criar (Rápido)
            </button>
             <button
              onClick={() => onCreateNew('advanced')}
              className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-lg transition-all transform hover:scale-105 shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-300 flex-shrink-0"
            >
              <PlusIcon className="mr-2" />
              Criar (Detalhado)
            </button>
        </div>
      </div>

      {ebooks.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-lg border border-slate-200/80">
          <h3 className="text-2xl font-semibold text-slate-800">Seu histórico está vazio.</h3>
          <p className="mt-4 text-slate-600 max-w-md mx-auto">
            Crie um ebook usando um dos modos acima. Eles ficarão registrados aqui para você acessar novamente.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {ebooks.map(ebook => (
            <div key={ebook.id} className="bg-white rounded-xl shadow-md border border-slate-200/80 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-blue-300 transition-colors">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-slate-900 truncate" title={ebook.title}>{ebook.title}</h3>
                <p className="text-sm text-slate-500">
                  Criado em: {new Date(ebook.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  {' | '}
                  Atualizado em: {new Date(ebook.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="flex-shrink-0 flex items-center gap-2">
                <button onClick={() => onView(ebook.id)} className="inline-flex items-center text-sm bg-white hover:bg-slate-100 text-slate-700 font-medium py-2 px-3 rounded-md transition-colors border border-slate-300">
                    <ViewIcon /> Visualizar
                </button>
                <button onClick={() => onDelete(ebook.id)} className="inline-flex items-center text-sm bg-white hover:bg-red-50 text-red-600 font-medium py-2 px-3 rounded-md transition-colors border border-slate-300 hover:border-red-300">
                    <DeleteIcon /> Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileScreen;