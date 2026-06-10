import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Lock } from 'lucide-react';
import { SuggestedProfile } from '../../types';

interface InteractionProfilesCarouselProps {
  profiles: SuggestedProfile[];
}

// Função para marcar usernames de forma segura (ex: biel****)
const maskUsername = (username: string) => {
  if (!username) return '*****';
  if (username.length <= 4) return username;
  return `${username.substring(0, 4)}****`;
};

const InteractionProfilesCarousel: React.FC<InteractionProfilesCarouselProps> = ({ profiles }) => {
  // Se não houver perfis, não renderiza nada
  if (!profiles || profiles.length === 0) return null;

  // Duplicamos os perfis para criar um loop de rolagem infinito e fluido
  const duplicatedProfiles = [...profiles, ...profiles, ...profiles];

  // Configuração da animação de rolagem linear acelerada
  const containerVariants: Variants = {
    animate: {
      x: ['0%', '-50%'], 
      transition: {
        x: {
          repeat: Infinity,
          ease: "linear",
          duration: profiles.length * 1.2, // Reduzido de 3.5 para 1.2 para passar muito mais rápido
        },
      },
    },
  };

  return (
    <div className="w-full overflow-hidden py-4">
      <motion.div
        className="flex space-x-5"
        variants={containerVariants}
        animate="animate"
      >
        {duplicatedProfiles.map((profile, index) => {
          // Identifica se é um perfil fictício/mock (imagem padrão do sistema)
          const isMockProfile = profile.profile_pic_url === '/perfil.jpg';
          
          return (
            <div 
              key={`${profile.username}-${index}`} 
              className="flex flex-col items-center flex-shrink-0 w-24 text-center group"
            >
              {/* Container da foto de perfil */}
              <div className="relative w-20 h-24 mb-2">
                 {/* Moldura de Perfil */}
                 <div className={`absolute inset-0 rounded-2xl border-2 ${isMockProfile ? 'border-red-500/30' : 'border-green-500/30'}`}></div>
                 
                 <div className="absolute inset-1.5 rounded-xl overflow-hidden bg-gray-900 shadow-2xl">
                    <img 
                      src={profile.profile_pic_url} 
                      alt={profile.username} 
                      // Aplica blur somente se for mockado de fallback
                      className={`w-full h-full object-cover transition-all ${
                        isMockProfile ? 'blur-[5px] opacity-80' : 'blur-0 opacity-100'
                      }`}
                    />
                    
                    {/* Exibe o cadeado de bloqueio somente se o perfil real não foi encontrado */}
                    {isMockProfile && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                        <Lock className="w-6 h-6 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                      </div>
                    )}
                 </div>
              </div>

              {/* Nome do perfil (Mascarado se for mock) */}
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter truncate w-full px-1">
                @{isMockProfile ? maskUsername(profile.username) : profile.username}
              </p>
              
              {/* Tag de Relacionamento */}
              <div className={`mt-1 px-2 py-0.5 rounded-full border ${
                isMockProfile 
                  ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                  : 'bg-green-500/10 border-green-500/20 text-green-400'
              }`}>
                <span className="text-[8px] font-bold uppercase tracking-widest">
                  {isMockProfile ? 'Bloqueado' : 'Interação Alta'}
                </span>
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default InteractionProfilesCarousel;