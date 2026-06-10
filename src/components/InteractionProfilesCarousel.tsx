import React from 'react';
import { Lock } from 'lucide-react';
import { SuggestedProfile } from '../../types';

interface InteractionProfilesCarouselProps {
  profiles: SuggestedProfile[];
}

// Função para ofuscar o nome de usuário (ex: neymarjr -> neym****)
const maskUsername = (username: string) => {
  if (!username) return '*****';
  if (username.length <= 4) return `${username.substring(0, 2)}**`;
  return `${username.substring(0, 4)}****`;
};

const InteractionProfilesCarousel: React.FC<InteractionProfilesCarouselProps> = ({ profiles }) => {
  // Se não houver perfis, não renderiza nada
  if (!profiles || profiles.length === 0) return null;

  // Duplicamos os perfis exatamente em 2 blocos para um loop de transição de 50% perfeito
  const duplicatedProfiles = [...profiles, ...profiles];
  
  // Ritmo moderado proporcional à quantidade de perfis
  const duration = Math.max(12, profiles.length * 1.5); 

  return (
    <div className="w-full overflow-hidden py-4">
      <style>{`
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          display: flex;
          width: max-content;
          animation: marquee-scroll ${duration}s linear infinite;
        }
      `}</style>
      
      <div className="marquee-track">
        {duplicatedProfiles.map((profile, index) => {
          return (
            <div 
              key={`${profile.username}-${index}`} 
              className="flex flex-col items-center flex-shrink-0 w-24 text-center group mr-5 animate-fade-in"
            >
              {/* Container da foto de perfil */}
              <div className="relative w-20 h-24 mb-2">
                 {/* Moldura de Perfil com Tema do Sistema */}
                 <div className="absolute inset-0 rounded-2xl border-2 border-red-500/30"></div>
                 
                 <div className="absolute inset-1.5 rounded-xl overflow-hidden bg-gray-900 shadow-2xl">
                    {/* Blur diminuído de 3px para 1.5px para ficar mais nítido */}
                    <img 
                      src={profile.profile_pic_url} 
                      alt={profile.username} 
                      className="w-full h-full object-cover blur-[1.5px] opacity-75 scale-105 select-none pointer-events-none"
                    />
                    
                    {/* Cadeado centralizado */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-[0.5px]">
                      <Lock className="w-5 h-5 text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.7)]" />
                    </div>
                 </div>
              </div>

              {/* Nome do perfil mascarado */}
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter truncate w-full px-1">
                @{maskUsername(profile.username)}
              </p>
              
              {/* Tag de Relacionamento Bloqueada */}
              <div className="mt-1 px-2 py-0.5 rounded-full border bg-red-500/10 border-red-500/20 text-red-400">
                <span className="text-[8px] font-bold uppercase tracking-widest">
                  Bloqueado
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InteractionProfilesCarousel;