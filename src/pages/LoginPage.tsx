import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BackgroundLayout from '../components/BackgroundLayout';
import toast from 'react-hot-toast';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Credenciais fixas de Admin
    const adminUser = 'user403@spygram.com';
    const adminPass = 'spygram1234';

    if (username.trim() === '' || password.trim() === '') {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    // Lógica de Login Admin
    if (username === adminUser && password === adminPass) {
      login('admin');
      toast.success('Acesso Administrativo Concedido');
      navigate('/admin');
      return;
    }

    // Lógica de Login de Usuário (Simulada para quem comprou)
    // Aqui você pode adicionar lógica real ou manter a verificação de compra
    const hasPurchased = sessionStorage.getItem('hasPurchased') === 'true';
    
    // Por enquanto, se não for admin, permitimos login se houver flag de compra
    // ou apenas simulamos o redirecionamento para o dashboard do cliente
    if (hasPurchased || password === 'membro2024') {
      login('user');
      toast.success('Bem-vindo à Área de Membros');
      navigate('/servers');
    } else {
      setError('Acesso negado. Apenas membros pagantes podem acessar esta área.');
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4">
      <header className="absolute top-8 flex items-center gap-2">
        <img src="/spygram_transparentebranco.png" alt="SpyGram Logo" className="h-6" />
        <span className="text-xl font-bold text-white">SpyGram</span>
      </header>

      <div className="bg-[#0f1218]/90 backdrop-blur-xl border border-gray-800 rounded-[2rem] p-10 w-full max-w-[380px] flex flex-col items-center shadow-2xl relative z-10">
        <div className="mb-8 flex flex-col items-center">
          <img src="/spygram_transparentebranco.png" alt="Logo" className="h-20 drop-shadow-[0_0_15px_rgba(225,48,108,0.3)]" />
          <h2 className="text-3xl font-black text-white mt-4 tracking-tighter uppercase">Acesso</h2>
          <p className="text-gray-400 text-xs mt-2 text-center">Área de membros e administração</p>
        </div>

        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
          <input
            type="text"
            placeholder="USUÁRIO OU E-MAIL"
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
            <p className="text-red-400 text-xs text-center font-bold">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-4 mt-2 rounded-xl font-black text-lg text-white
                       bg-gradient-to-r from-purple-600 to-pink-600
                       shadow-[0_4px_15px_rgba(147,51,234,0.4)]
                       hover:scale-[1.02] active:scale-95 transition-all uppercase"
          >
            Acessar Sistema
          </button>
        </form>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-2 text-green-500/80 text-[10px] font-bold uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Site Seguro</span>
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