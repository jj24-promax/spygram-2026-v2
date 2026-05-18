import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BackgroundLayout from '../components/BackgroundLayout';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Credenciais fixas para o sistema
    const correctUsername = 'user403@spygram.com';
    const correctPassword = 'spygram1234';

    if (username.trim() === '' || password.trim() === '') {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (username === correctUsername && password === correctPassword) {
      login();
      // Se o usuário veio de uma tentativa de acessar o admin, ou se queremos ir para o admin por padrão
      navigate('/admin'); 
    } else {
      setError('Nome de usuário ou senha incorretos.');
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4">
      {/* Logo Superior Pequeno */}
      <header className="absolute top-8 flex items-center gap-2">
        <img src="/spygram_transparentebranco.png" alt="SpyGram Logo" className="h-6" />
        <span className="text-xl font-bold text-white">SpyGram</span>
      </header>

      {/* Card de Login Centralizado */}
      <div className="bg-[#0f1218]/90 backdrop-blur-xl border border-gray-800 rounded-[2rem] p-10 w-full max-w-[380px] flex flex-col items-center shadow-2xl relative z-10">
        
        {/* Logo do App Centralizado */}
        <div className="mb-8 flex flex-col items-center">
          <img src="/spygram_transparentebranco.png" alt="Logo" className="h-20 drop-shadow-[0_0_15px_rgba(225,48,108,0.3)]" />
          <h2 className="text-3xl font-black text-white mt-4 tracking-tighter">LOGIN</h2>
          <p className="text-gray-400 text-xs mt-2 text-center">Acesse sua conta administrativa</p>
        </div>

        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
          <input
            type="text"
            placeholder="NOME DE USUÁRIO"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-[#1c222d] text-white px-5 py-4 rounded-xl border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-pink-500/50 placeholder-gray-600 text-sm font-medium uppercase tracking-wider transition-all"
          />
          <input
            type="password"
            placeholder="SENHA"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#1c222d] text-white px-5 py-4 rounded-xl border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-pink-500/50 placeholder-gray-600 text-sm font-medium uppercase tracking-wider transition-all"
          />

          {error && (
            <p className="text-red-400 text-xs text-center font-bold animate-shake">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-4 mt-2 rounded-xl font-black text-lg text-white
                       bg-gradient-to-r from-[#e11d48] to-[#be123c]
                       shadow-[0_4px_15px_rgba(225,29,72,0.4)]
                       hover:scale-[1.02] active:scale-95 transition-all uppercase"
          >
            ENTRAR
          </button>
        </form>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-2 text-green-500/80 text-[10px] font-bold uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Site Seguro</span>
          </div>
          <p className="text-gray-600 text-[10px] mt-2 uppercase font-medium">Todos os direitos reservados a SpyGram</p>
        </div>
      </div>
    </div>
  );
};

const LoginPageWithBackground = () => (
  <BackgroundLayout>
    <LoginPage />
  </BackgroundLayout>
);

export default LoginPageWithBackground;