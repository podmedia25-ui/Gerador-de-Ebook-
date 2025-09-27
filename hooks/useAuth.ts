// O hook de autenticação foi desativado pois a funcionalidade do Firebase foi removida.
export const useAuth = () => {
  const user: null = null;
  const isAuthLoading = false;

  return { user, isAuthLoading };
};
