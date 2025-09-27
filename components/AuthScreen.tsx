import React from 'react';

const AuthScreen: React.FC = () => {
  return (
    <div className="w-full max-w-md animate-fade-in">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200/80 p-8 text-center">
            <h2 className="text-2xl font-semibold text-slate-800">Funcionalidade Removida</h2>
            <p className="mt-4 text-slate-600">
                A autenticação de usuário foi removida deste aplicativo.
            </p>
        </div>
    </div>
  );
};

export default AuthScreen;
