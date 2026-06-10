import React from 'react';
import { motion } from 'framer-motion';
import { Car, MapPin, Radio } from 'lucide-react';
import ShineButton from './ui/ShineButton';

interface LicensePlateLocationCardProps {
  onUnlockClick: () => void;
  userCity: string;
}

const LicensePlateLocationCard: React.FC<{ onUnlockClick: () => void; userCity: string }> = ({ onUnlockClick, userCity }) => {
  const formattedCity = userCity.toLowerCase() === 'sua localização' ? 'Sua Cidade' : userCity;
  
  // URL de satélite dinâmico utilizando a sintaxe oficial de categoria/localização (Motel,Cidade) para busca precisa e zoom de aproximação 16
  const motelMapUrl = `https://maps.google.com/maps?q=Motel,${encodeURIComponent(formattedCity)}&t=k&z=16&ie=UTF8&iwloc=&output=embed`;

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

        <p className="text-gray-200 mb-8 max-w-md mx-auto text-lg font-medium">
          **NOVIDADE!** Descubra a localização exata do veículo do seu alvo apenas com a placa. Rastreamento em tempo real via satélite militar.
        </p>
        
        {/* RASTREADOR DE MOTEL VIA SATÉLITE REAL DA CIDADE */}
        <div className="relative w-full max-w-md mx-auto aspect-video bg-[#0a0a0c] rounded-[2rem] overflow-hidden mb-8 border-2 border-blue-500/40 shadow-[0_0_40px_rgba(59,130,246,0.2)]">
          
          {/* Wrapper com zoom e deslocamento negativo para ocultar logos/botoes Google */}
          <div className="absolute inset-0 w-full h-full scale-[1.4] origin-center pointer-events-none">
            <iframe
              title="Satellite Motel Tracker"
              src={motelMapUrl}
              className="w-full h-full border-0"
              style={{
                filter: 'grayscale(15%) brightness(55%) contrast(125%) hue-rotate(200deg)',
              }}
              loading="lazy"
            />
          </div>

          {/* Efeitos de Sombreamento Escuro HUD */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/80 pointer-events-none" />
          
          {/* Mira de Detecção e Target HUD */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {/* Círculo do Alvo do Laser */}
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0.4, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-24 h-24 border-2 border-dashed border-red-500 rounded-full flex items-center justify-center"
            >
              <div className="w-12 h-12 border border-red-500/50 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
              </div>
            </motion.div>
          </div>

          {/* Badges de Status do Satélite no HUD */}
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/80 px-3 py-1 rounded-full border border-blue-500/30">
            <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">SATÉLITE LATAM-403</span>
          </div>

          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/80 px-3 py-1 rounded-full border border-red-500/30 animate-pulse">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
            <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">ALVO ADJACENTE DETECTADO</span>
          </div>
        </div>

        <p className="text-xl text-yellow-300 font-bold mb-6">
          Não viva sob a dúvida. Saiba onde o carro está estacionado agora!
        </p>

        <ShineButton 
          onClick={onUnlockClick} 
          className="w-full bg-blue-600 focus:ring-blue-500 active:scale-95"
          shineColorClasses="bg-blue-600"
        >
          RASTREAR PLACA DO VEÍCULO AGORA
        </ShineButton>
      </div>
    </motion.div>
  );
};

export default LicensePlateLocationCard;