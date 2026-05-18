import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BackgroundLayout from '../components/BackgroundLayout';
import toast from 'react-hot-toast';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Lógica de Login de Usuário (Simulada para quem comprou)
    const hasPurchased = sessionStorage.getItem('hasPurchased') === 'true';
    
    // Verificação de acesso para membros (ex: senha padrão ou flag de compra)
    if (hasPurchased || password === 'membro2024') {
      login('user');
      toast.success('Bem-vindo à Área de Membros');
      navigate('/servers');
    } else {
      setError('Acesso negado. Esta área é restrita para membros que realizaram a compra.');
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4">
      <div className="bg-[#0f1218]/95 backdrop-blur-2xl border border-gray-800 rounded-[2.5rem] p-10 w-full max-w-[400px] flex flex-col items-center shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10">
        
        {/* Logo SpyGram */}
        <div className="mb-8 flex flex-col items-center">
          <img 
            src="/spygram_transparentebranco.png" 
            alt="SpyGram Logo" 
            className="h-16 drop-shadow-[0_0_10px_rgba(225,48,108,0.3)]" 
          />
        </div>

        {/* Textos de Acesso */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">ACESSO</h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest opacity-70">
            Área exclusiva para membros
          </p>
        </div>

        <form onSubmit={handleLogin} className="w-full flex flex-col gap-5">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="USUÁRIO OU E-MAIL"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#1c222d]/50 text-white px-6 py-4 rounded-2xl border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-pink-500/30 placeholder-gray-600 text-xs font-black uppercase tracking-widest transition-all"
            />
            <input
              type="password"
              placeholder="SENHA"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1c222d]/50 text-white px-6 py-4 rounded-2xl border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-pink-500/30 placeholder-gray-600 text-xs font-black uppercase tracking-widest transition-all"
            />
          </div>

          {error && (
            <p className="text-red-400 text-[10px] text-center font-black uppercase tracking-tighter animate-pulse">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-5 mt-4 rounded-2xl font-black text-sm text-white
                       bg-gradient-to-r from-purple-600 to-pink-500
                       shadow-[0_0_25px_rgba(236,72,153,0.3)]
                       hover:brightness-110 active:scale-95 transition-all uppercase tracking-[0.2em]"
          >
            ACESSAR SISTEMA
          </button>
        </form>

        <div className="mt-10">
          <div className="flex items-center justify-center gap-2 text-green-500 font-black text-[10px] uppercase tracking-[0.2em] opacity-80">
            <ShieldCheck className="w-4 h-4" />
            <span>SITE SEGURO</span>
          </div>
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