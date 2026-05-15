import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

const FreeTimeFloatingButton: React.FC = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    // Busca o tempo de término do armazenamento
    const storedEndTime = sessionStorage.getItem('invasionEndTime');
    if (!storedEndTime) return;

    const endTime = parseInt(storedEndTime, 10);

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        // Limpa o tempo de término ao concluir e redireciona
        sessionStorage.removeItem('invasionEndTime');
        navigate('/invasion-concluded');
      }
    };

    updateTimer(); // Chamada inicial imediata
    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [navigate]);

  const formatTime = (seconds: number) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  // Não renderiza se o tempo não estiver definido (ainda carregando ou não iniciado)
  if (timeLeft === null) return null;

  return (
    <motion.button
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      onClick={() => navigate('/invasion-concluded')}
      className="fixed bottom-20 md:bottom-8 left-0 right-0 mx-auto w-[90%] max-w-[350px] z-[100] bg-red-600/95 backdrop-blur-md border-2 border-red-500 rounded-xl p-3 shadow-[0_0_30px_rgba(220,38,38,0.6)] flex flex-col items-center justify-center cursor-pointer hover:bg-red-700 transition-all active:scale-95"
    >
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-5 h-5 text-white animate-pulse" />
        <span className="text-white font-bold text-sm">
          TEMPO GRÁTIS: <span className="text-yellow-300">{formatTime(timeLeft)}</span>
        </span>
      </div>
      <div className="bg-yellow-500 hover:bg-yellow-400 text-black font-black text-sm uppercase px-4 py-2 rounded-lg w-full text-center transition-colors">
        Desbloquear Acesso Completo
      </div>
    </motion.button>
  );
};

export default FreeTimeFloatingButton;