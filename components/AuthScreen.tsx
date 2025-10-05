import React from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';

const GoogleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg className="w-5 h-5 mr-3" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512" {...props}><path fill="currentColor" d="M488 261.8C488 403.3 381.7 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.2 64.5C308.6 102.3 282.7 90 248 90c-82.1 0-148.9 66.8-148.9 148.9s66.8 148.9 148.9 148.9c94.9 0 131.3-64.8 135.2-99.2H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path></svg>
);


const AuthScreen: React.FC = () => {
  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      // @google/genai-fix: Cast `window` to `any` to access DOM properties without DOM lib types.
      (window as any).alert("Falha ao entrar. Por favor, tente novamente.");
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200/80 p-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Bem-vindo!</h2>
            <p className="mt-4 text-slate-600">
                Faça login para salvar seu histórico de ebooks e acessá-los de qualquer lugar.
            </p>
            <div className="mt-8">
                <button
                    onClick={handleSignIn}
                    className="w-full inline-flex items-center justify-center bg-white hover:bg-slate-50 text-slate-700 font-medium py-3 px-4 rounded-lg transition-colors border border-slate-300 shadow-sm"
                >
                    <GoogleIcon />
                    Entrar com Google
                </button>
            </div>
        </div>
    </div>
  );
};

export default AuthScreen;
