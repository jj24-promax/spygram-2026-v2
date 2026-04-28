import React from 'react';
import { motion } from 'framer-motion';
import { Car, MapPin, Lock } from 'lucide-react';
import ShineButton from './ui/ShineButton';

interface LicensePlateLocationCardProps {
  onUnlockClick: () => void;
}

const LicensePlateLocationCard: React.FC<LicensePlateLocationCardProps> = ({ onUnlockClick }) => {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 1.2 }}
      className="mt-12 mb-12 p-6 text-center w-full mx-auto relative overflow-hidden"
    >
      <div className="relative z-10">
        <div className="flex items-center justify-center gap-4 mb-4">
          <Car className="w-10 h-10 text-blue-400 animate-pulse" />
          <h2 className="text-3xl font-extrabold text-white">
            <span className="bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 text-transparent bg-clip-text">
              RASTREAMENTO VEICULAR
            </span>
          </h2>
          <MapPin className="w-10 h-10 text-purple-400 animate-pulse" />
        </div>

        <p className="text-gray-200 mb-6 max-w-md mx-auto text-lg font-medium">
          **NOVIDADE!** Descubra a localização exata do veículo do seu alvo, apenas com a placa. Rastreamento em tempo real via satélite.
        </p>
        
        {/* Mockup de Imagem com Bloqueio */}
        <div className="relative w-full max-w-md mx-auto mb-8 rounded-2xl overflow-hidden">
          
          {/* Imagem de Fundo (Com Blur) */}
          <div className="relative w-full h-auto bg-white/5 rounded-2xl overflow-hidden border border-gray-800 shadow-xl blur-[4px] select-none pointer-events-none p-4">
            <img 
              src="/autosat-monitoramento-rastreamento.png" 
              alt="Rastreamento Veicular" 
              className="w-full h-auto object-contain drop-shadow-2xl" 
            />
          </div>

          {/* Overlay de Bloqueio (Sem Blur) focado no meio */}
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none">
             <div className="bg-black/70 p-5 rounded-full backdrop-blur-sm border-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]">
               <Lock className="w-12 h-12 text-blue-500" />
             </div>
             <div className="mt-3 bg-black/80 px-4 py-1.5 rounded-full border border-blue-500/50">
                <span className="text-blue-400 font-bold text-sm">LOCALIZAÇÃO ENCONTRADA</span>
             </div>
          </div>

        </div>

        <p className="text-xl text-yellow-300 font-bold mb-6">
          Não deixe rastros. Saiba onde o carro está agora!
        </p>

        <ShineButton 
          onClick={onUnlockClick} 
          // Sobrescreve o BG e o anel de foco (ring)
          className="w-full bg-blue-600 focus:ring-blue-500 active:scale-95"
          shineColorClasses="bg-blue-600"
        >
          RASTREAR PLACA AGORA
        </ShineButton>
      </div>
    </motion.div>
  );
};

export default LicensePlateLocationCard;