import React, { useState } from 'react';
import { playClickSound, playCorrectSound, playWrongSound } from '../utils/audio';

interface LoginProps {
  onLogin: (username: string, password: string) => Promise<{success: boolean, message?: string}>;
  onRegister: (username: string, password: string) => Promise<{success: boolean, message?: string}>;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic Validation
    if (!username.trim() || !password.trim()) {
      playWrongSound();
      setError('Vyplň prosím všechna pole.');
      return;
    }

    if (username.length < 3) {
      playWrongSound();
      setError('Jméno musí mít alespoň 3 znaky.');
      return;
    }

    if (password.length < 4) {
      playWrongSound();
      setError('Heslo musí mít alespoň 4 znaky.');
      return;
    }

    setIsLoading(true);
    
    try {
        let result;
        if (isRegistering) {
            result = await onRegister(username, password);
        } else {
            result = await onLogin(username, password);
        }

        if (result.success) {
            playCorrectSound();
        } else {
            playWrongSound();
            setError(result.message || 'Něco se pokazilo.');
        }
    } catch (e) {
        setError('Chyba aplikace.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 animate-fade-in relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-cermat-blue/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-cermat-green/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="text-8xl mb-4 animate-bounce-short">🦉</div>
          <h1 className="text-3xl font-extrabold text-gray-800 mb-2">CermatLingo</h1>
          <p className="text-gray-500 font-medium">
             {isRegistering ? 'Vytvoř si účet a začni.' : 'Vítej zpět!'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              Přezdívka
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Např. Student2025"
              className="w-full p-4 rounded-2xl bg-gray-100 border-2 border-gray-200 text-lg font-bold text-gray-700 focus:outline-none focus:border-cermat-blue focus:bg-white transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
              Heslo
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-4 rounded-2xl bg-gray-100 border-2 border-gray-200 text-lg font-bold text-gray-700 focus:outline-none focus:border-cermat-blue focus:bg-white transition-all"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-cermat-red text-sm font-bold p-3 rounded-xl flex items-center gap-2 animate-shake border border-red-100">
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`
                w-full py-4 mt-2 bg-cermat-blue text-white rounded-2xl font-bold uppercase tracking-widest text-lg shadow-lg border-b-4 border-cermat-blue-dark active:border-b-0 active:translate-y-1 transition-all
                ${isLoading ? 'opacity-70 cursor-wait' : 'hover:brightness-105'}
            `}
          >
            {isLoading ? 'Pracuji...' : (isRegistering ? 'Zaregistrovat' : 'Přihlásit se')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => {
                playClickSound();
                setIsRegistering(!isRegistering);
                setError('');
                setPassword('');
            }}
            className="text-cermat-blue font-bold uppercase text-xs tracking-widest hover:underline"
          >
            {isRegistering ? 'Mám už účet? Přihlásit' : 'Nemáš účet? Vytvořit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;