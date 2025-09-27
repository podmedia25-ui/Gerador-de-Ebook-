import type { Ebook } from '../types';

// O hook de ebooks do Firebase foi desativado. O aplicativo agora usa o localStorage.
export const useEbooks = (userId?: string) => {
  const ebooks: Ebook[] = [];
  const pendingEbooks: Ebook[] = [];
  const isLoading = false;
  const error: string | null = null;
  
  const updateEbook = async (ebookId: string, data: Partial<Ebook>) => {
      console.warn("Funcionalidade de atualizar ebook no servidor foi removida.");
      return Promise.resolve();
  };
  
  const deleteEbook = async (ebookId: string) => {
      console.warn("Funcionalidade de deletar ebook no servidor foi removida.");
      return Promise.resolve();
  };

  return { ebooks, pendingEbooks, isLoading, error, updateEbook, deleteEbook };
};
