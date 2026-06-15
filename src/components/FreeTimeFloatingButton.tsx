import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { usePreviewTrial } from '../context/PreviewTrialContext';

const FreeTimeFloatingButton: React.FC = () => {
  const navigate = useNavigate();
  const { timeLeft, isPreviewActive } = usePreviewTrial();

  const formatTime = (seconds: number) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!isPreviewActive || timeLeft === null) return null;

  return (
    <motion.button
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      onClick={() => navigate('/checkout')}
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
