import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Flame, Lock } from 'lucide-react';
import ShineButton from './ui/ShineButton';
import { ProfileData } from '../../types';

interface DatingAppCardProps {
  profileData: ProfileData;
  onUnlockClick: () => void;
}

const DatingAppCard: React.FC<DatingAppCardProps> = ({ profileData, onUnlockClick }) => {
  // Pega o primeiro nome (ou o username se não tiver nome completo)
  const firstName = profileData.fullName 
    ? profileData.fullName.split(' ')[0] 
    : profileData.username;

  // Idade fictícia para o mockup
  const fakeAge = 24;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="mt-12 mb-12 p-6 text-center w-full mx-auto relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'radial-gradient(circle at center, rgba(255, 0, 0, 0.5) 0%, transparent 70%)',
      }}></div>

      <div className="relative z-10">
        <div className="flex items-center justify-center gap-4 mb-4">
          <Flame className="w-10 h-10 text-red-400 animate-pulse" />
          <h2 className="text-3xl font-extrabold text-white">
            <span className="bg-gradient-to-r from-yellow-300 via-pink-400 to-red-500 text-transparent bg-clip-text">
              O SEGREDO MAIS QUENTE
            </span>
          </h2>
          <Heart className="w-10 h-10 text-pink-400 animate-pulse" />
        </div>

        <p className="text-gray-200 mb-6 max-w-md mx-auto text-lg font-medium">
          **DESMASCARADO!** Descubra agora se o seu alvo está ativo no **Tinder, Badoo, Happn** ou qualquer outro aplicativo de relacionamento.
        </p>
        
        {/* Mockup Realista do Tinder */}
        <div className="relative w-full max-w-[280px] mx-auto mb-8">
          
          {/* Container do Tinder (Com Blur) */}
          <div className="relative w-full aspect-[1/2.16] rounded-[2rem] overflow-hidden border border-gray-800 shadow-xl blur-[4px] select-none pointer-events-none bg-white">
            
            {/* A Moldura da UI do Tinder */}
            <img 
              src="/tinder.png" 
              alt="Tinder UI" 
              className="absolute inset-0 w-full h-full object-contain z-10" 
            />

            {/* A Foto do Perfil posicionada exatamente na área branca da moldura */}
            {/* Ajustes finos de top, bottom, left e right para encaixar perfeitamente na moldura branca */}
            <div className="absolute top-[8.5%] left-[3.5%] right-[3.5%] bottom-[20.5%] z-20 rounded-[10px] overflow-hidden bg-gray-900">
               <img 
                 src={profileData.profilePicUrl} 
                 alt="Profile" 
                 className="w-full h-full object-cover" 
               />
               
               {/* Gradiente escuro embaixo para o texto aparecer com contraste */}
               <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
               
               {/* Texto Nome + Idade (Canto inferior esquerdo) */}
               <div className="absolute bottom-3 left-4 text-white flex items-end gap-2">
                 <span className="text-3xl font-bold tracking-tight">{firstName}</span>
                 <span className="text-2xl font-normal mb-0.5">{fakeAge}</span>
               </div>
            </div>
          </div>

          {/* Overlay de Bloqueio (Sem Blur) focado no meio */}
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none">
             <div className="bg-black/70 p-5 rounded-full backdrop-blur-sm border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]">
               <Lock className="w-12 h-12 text-red-500" />
             </div>
             <div className="mt-3 bg-black/80 px-4 py-1.5 rounded-full border border-red-500/50">
                <span className="text-red-400 font-bold text-sm">PERFIL ENCONTRADO</span>
             </div>
          </div>

        </div>

        <p className="text-xl text-yellow-300 font-bold mb-6">
          Não viva na dúvida. Obtenha a verdade que pode mudar tudo!
        </p>

        <ShineButton 
          onClick={onUnlockClick} 
          className="w-full bg-red-600 focus:ring-red-500 active:scale-95"
          shineColorClasses="bg-red-600"
        >
          VERIFICAR APPS DE NAMORO AGORA
        </ShineButton>
      </div>
    </motion.div>
  );
};

export default DatingAppCard;