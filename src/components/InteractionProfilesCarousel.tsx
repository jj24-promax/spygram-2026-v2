import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Lock } from 'lucide-react';
import { SuggestedProfile } from '../../types';

interface InteractionProfilesCarouselProps {
  profiles: SuggestedProfile[];
}

// Função para mascarar usernames (ex: biel****)
const maskUsername = (username: string) => {
  if (!username) return '*****';
  if (username.length <= 4) return username;
  return `${username.substring(0, 4)}****`;
};

const InteractionProfilesCarousel: React.FC<InteractionProfilesCarouselProps> = ({ profiles }) => {
  // Se não houver perfis reais, o componente pai já deve lidar com o fallback ou passar uma lista vazia
  if (!profiles || profiles.length === 0) return null;

  // Duplicamos os perfis para criar um loop de rolagem infinito e fluido
  const duplicatedProfiles = [...profiles, ...profiles, ...profiles];

  // Configuração da animação de rolagem linear
  const containerVariants: Variants = {
    animate: {
      x: ['0%', '-50%'], 
      transition: {
        x: {
          repeat: Infinity,
          ease: "linear",
          duration: profiles.length * 3.5, // Velocidade proporcional à quantidade de itens
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
          // Mantemos uma estética de 'protegido' mas usamos os dados REAIS
          // Alternamos o nível de blur para dar profundidade - VALORES AUMENTADOS
          const isMoreBlurred = (index % 3) === 0;
          
          return (
            <div 
              key={`${profile.username}-${index}`} 
              className="flex flex-col items-center flex-shrink-0 w-24 text-center group"
            >
              {/* Container da foto real com overlay de bloqueio */}
              <div className="relative w-20 h-24 mb-2">
                 {/* Moldura de Perfil */}
                 <div className="absolute inset-0 rounded-2xl border-2 border-purple-500/30 group-hover:border-purple-500 transition-colors duration-500"></div>
                 
                 <div className="absolute inset-1.5 rounded-xl overflow-hidden bg-gray-900 shadow-2xl">
                    <img 
                      src={profile.profile_pic_url} 
                      alt={profile.username} 
                      className={`w-full h-full object-cover transition-all duration-700 ${isMoreBlurred ? 'blur-[12px]' : 'blur-[8px]'} group-hover:blur-0 opacity-80 group-hover:opacity-100`}
                    />
                    
                    {/* Overlay de Cadeado/Bloqueio (Somente visual) */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[3px] group-hover:bg-transparent group-hover:backdrop-blur-none transition-all">
                      <Lock className="w-6 h-6 text-white/70 drop-shadow-lg" />
                    </div>
                 </div>
              </div>

              {/* Nome Real Mascarado */}
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter transition-colors group-hover:text-white">
                @{maskUsername(profile.username)}
              </p>
              
              {/* Tag de Relacionamento (Mock para contexto) */}
              <div className="mt-1 px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-full">
                <span className="text-[8px] font-bold text-purple-400 uppercase tracking-widest">Interação Alta</span>
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default InteractionProfilesCarousel;