import React from 'react';
import { motion } from 'framer-motion';
import { ProfileData } from '../../types';
import ProfileMapPin from './ProfileMapPin';
import ShineButton from './ui/ShineButton';

interface RealTimeLocationCardProps {
  profileData: ProfileData;
  userCity: string;
  onUnlockClick: () => void;
}

const RealTimeLocationCard: React.FC<RealTimeLocationCardProps> = ({ profileData, userCity, onUnlockClick }) => {
  // Se a cidade for o fallback, exibe 'SUA LOCALIZAÇÃO', caso contrário, exibe a cidade real.
  const locationText = userCity.toLowerCase() === 'sua localização' 
    ? 'SUA LOCALIZAÇÃO' 
    : userCity.toUpperCase();
    
  // Verifica se a cidade é válida para exibição da frase extra
  const showFoundNearText = userCity.toLowerCase() !== 'são paulo' && userCity.toLowerCase() !== 'sua localização';

  // URL de satélite dinâmico baseado na cidade do visitante (t=k ativa o satélite)
  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(userCity)}&t=k&z=14&ie=UTF8&iwloc=&output=embed`;

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      className="mt-16 mb-12 p-0 text-center w-full mx-auto animate-fade-in"
    >
      <h2 className="text-3xl font-extrabold text-white mb-4">
        <span className="bg-gradient-to-r from-red-500 to-pink-600 text-transparent bg-clip-text">
          RASTREAMENTO DE LOCALIZAÇÃO EM TEMPO REAL
        </span>
      </h2>
      <p className="text-gray-300 mb-4 max-w-md mx-auto text-lg font-medium">
        **PROVA IRREFUTÁVEL!** Nosso sistema de rastreamento de IP de última geração capturou a localização exata do alvo.
        <span className="block mt-2 text-yellow-400 font-bold">
          Desbloqueie agora e veja onde ele está neste exato momento!
        </span>
      </p>
      
      {/* Nova frase condicional */}
      {showFoundNearText && (
        <p className="text-sm text-gray-400 font-semibold mb-8">
          Perfil encontrado perto de <span className="text-white font-bold">{userCity}</span>
        </p>
      )}
      
      {/* Map Mockup with Real Satellite View of their city */}
      <div className="relative w-full max-w-xs mx-auto aspect-square bg-[#0a0a0c] rounded-[2rem] overflow-hidden mb-6 border-2 border-red-700/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
        
        {/* Wrapper do Iframe maior para recortar e ocultar as bordas nativas do Google (Abrir no Maps, Termos e Logos) */}
        <div className="absolute inset-0 w-full h-full scale-[1.35] origin-center pointer-events-none">
          {/* Real Live Satellite Map Iframe */}
          <iframe
            title="Satellite Tracker Map"
            src={mapUrl}
            className="w-full h-full border-0"
            style={{
              filter: 'grayscale(25%) brightness(65%) contrast(120%) hue-rotate(340deg)',
            }}
            loading="lazy"
          />
        </div>

        {/* Dark Vignette Overlay to blend the map edges gracefully */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/85 pointer-events-none" />
        <div className="absolute inset-0 bg-radial-vignette pointer-events-none" style={{
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.9)'
        }} />
        
        {/* Animated Radar Effect */}
        <motion.div
          animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="w-2/3 h-2/3 border-2 border-red-500 rounded-full opacity-40"></div>
        </motion.div>
        
        {/* Profile Map Pin Marker */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[60%] z-10 pointer-events-none drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]">
          <ProfileMapPin 
            profilePicUrl={profileData.profilePicUrl} 
            username={profileData.username} 
            size={52}
          />
        </div>

        {/* BOTÃO DESCOBRIR LOCALIZAÇÃO (Interno) */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-[75%] z-20">
          <button
            onClick={onUnlockClick}
            className="w-full py-2.5 px-4 text-xs font-black text-black rounded-xl bg-white shadow-xl hover:scale-[1.03] transition-all duration-300 focus:outline-none active:scale-95 uppercase tracking-wider"
          >
            DESCOBRIR LOCALIZAÇÃO
          </button>
        </div>
      </div>
      
      <p className="text-sm text-red-400 font-semibold mb-8">
        Atenção: A localização é atualizada a cada 5 minutos. Não perca essa chance!
      </p>

      {/* Novo CTA de Destaque */}
      <ShineButton 
        onClick={onUnlockClick} 
        className="w-full bg-red-600 focus:ring-red-500 active:scale-95"
        shineColorClasses="bg-red-600"
      >
        RASTREAR LOCALIZAÇÃO AGORA
      </ShineButton>
    </motion.div>
  );
};

export default RealTimeLocationCard;