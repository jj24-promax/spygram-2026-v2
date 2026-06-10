import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, MessageSquare, Trash2, Lock, ShieldAlert } from 'lucide-react';
import ShineButton from './ui/ShineButton';
import { SuggestedProfile } from '../../types';

interface RecoveredDataCardProps {
  onUnlockClick: () => void;
  suggestedProfiles?: SuggestedProfile[];
}

// Função para gerar um número aleatório dentro de um intervalo
const getRandomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Lista com os caminhos das imagens
const ALL_RECOVERED_IMAGES = [
  '/recovered/img_1.jpg',
  '/recovered/img_2.png',
  '/recovered/img_3.jpg',
  '/recovered/img_4.jpg',
  '/recovered/img_5.jpg',
  '/recovered/img_6.jpeg',
  '/recovered/img_7.jpg',
  '/recovered/img_8.jpg',
  '/recovered/img_9.jpg',
  '/recovered/img_10.jpg',
  '/recovered/img_11.jpg',
  '/recovered/img_12.jpg',
  '/recovered/img_13.jpg'
];

// Mensagens deletadas forjadas com gatilhos de curiosidade extremamente fortes
const CHAT_TEMPLATES = [
  {
    time: "Ontem, 23:14",
    snippet: "Oi bebê, já chegou em casa? Queria repetir aquilo de ontem...",
  },
  {
    time: "2 dias atrás",
    snippet: "Por favor, apaga essa conversa pra ninguém ver nosso papo.",
  },
  {
    time: "3 dias atrás",
    snippet: "Amei o nosso encontro de ontem, você é incrível na cama...",
  }
];

// Função para ofuscar o nome de usuário (ex: neymarjr -> neym****)
const maskUsername = (username: string) => {
  if (!username) return '*****';
  if (username.length <= 4) return `${username.substring(0, 2)}**`;
  return `${username.substring(0, 4)}****`;
};

const RecoveredDataCard: React.FC<RecoveredDataCardProps> = ({ onUnlockClick, suggestedProfiles = [] }) => {
  const [photosCount, setPhotosCount] = useState(0);
  const [chatsCount, setChatsCount] = useState(0);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  useEffect(() => {
    // Fotos: 21 a 37 no total
    const totalPhotos = getRandomNumber(21, 37);
    setPhotosCount(totalPhotos);
    
    // Conversas: 5 a 15
    setChatsCount(getRandomNumber(5, 15));

    // Selecionar 3 imagens aleatórias do array para as miniaturas
    const shuffled = [...ALL_RECOVERED_IMAGES].sort(() => 0.5 - Math.random());
    setSelectedImages(shuffled.slice(0, 3));
  }, []);

  // Mapeia os templates de conversa usando especificamente os primeiros perfis (gênero oposto)
  const dynamicChats = CHAT_TEMPLATES.map((template, idx) => {
    const profile = suggestedProfiles[idx] || {
      username: `contato_oculto_${idx}`,
      profile_pic_url: '/perfil.jpg',
      fullName: 'Contato Deletado'
    };

    return {
      sender: `@${maskUsername(profile.username)} (Deletado)`,
      avatar: profile.profile_pic_url,
      time: template.time,
      snippet: template.snippet
    };
  });

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 1.6 }}
      className="mt-12 mb-12 p-0 text-center w-full max-w-md mx-auto relative overflow-hidden"
    >
      <div className="relative z-10 px-4">
        
        {/* Título e Ícone de Lixeira */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <Trash2 className="w-10 h-10 text-red-500" />
          <h2 className="text-3xl font-extrabold text-white">
            <span className="bg-gradient-to-r from-pink-400 via-red-500 to-yellow-400 text-transparent bg-clip-text">
              DADOS APAGADOS RECUPERADOS
            </span>
          </h2>
        </div>

        <p className="text-gray-200 mb-8 max-sm mx-auto text-lg font-medium">
          **IMPERDÍVEL!** Nosso sistema encontrou arquivos que o alvo pensou ter deletado.
        </p>
        
        {/* Contadores de Dados Recuperados */}
        <div className="grid grid-cols-2 gap-4 mb-8 w-full max-w-[360px] mx-auto">
            
            {/* Card de Fotos */}
            <div className="p-4 bg-black/50 border border-yellow-700 rounded-2xl flex flex-col items-center transition-all duration-300 hover:scale-[1.03] cursor-default">
                <ImageIcon className="w-8 h-8 text-yellow-400 mb-2 animate-pulse-slow" />
                <p className="text-5xl font-extrabold text-yellow-300 tabular-nums">{photosCount}</p>
                <p className="text-xs uppercase font-black text-gray-400 mt-1 tracking-widest">Fotos</p>
            </div>

            {/* Card de Conversas */}
            <div className="p-4 bg-black/50 border border-pink-700 rounded-2xl flex flex-col items-center transition-all duration-300 hover:scale-[1.03] cursor-default">
                <MessageSquare className="w-8 h-8 text-pink-400 mb-2 animate-pulse-slow" />
                <p className="text-5xl font-extrabold text-pink-300 tabular-nums">{chatsCount}</p>
                <p className="text-xs uppercase font-black text-gray-400 mt-1 tracking-widest">Conversas</p>
            </div>
        </div>

        {/* Galeria de Fotos Recuperadas */}
        {selectedImages.length > 0 && (
          <div className="flex flex-col items-center justify-center gap-4 mb-8 bg-black/60 p-6 rounded-2xl border border-red-700/50 w-full max-w-[360px] mx-auto shadow-2xl shadow-red-500/10">
            {/* Miniaturas com sobreposição */}
            <div className="flex -space-x-6 ml-4">
              {selectedImages.map((src, index) => (
                <motion.div 
                  key={index} 
                  animate={{ 
                    y: [0, -8, 0],
                    rotate: [0, index % 2 === 0 ? 2 : -2, 0]
                  }}
                  transition={{ 
                    duration: 4 + index, 
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.5 
                  }}
                  className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-pink-500 shadow-2xl bg-gray-900"
                  style={{ zIndex: 3 - index }}
                >
                  <img 
                    src={src} 
                    alt="Recuperada" 
                    className="w-full h-full object-cover blur-[3.6px] scale-110" 
                    onError={(e) => { e.currentTarget.src = '/perfil.jpg' }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Lock className="w-10 h-10 text-white/90 drop-shadow-lg" />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Informações de Contagem */}
            <div className="text-center">
              <span className="text-5xl font-black text-pink-400 animate-pulse">+{photosCount - 3}</span>
              <p className="text-xs text-gray-300 font-black uppercase mt-2 tracking-widest">Fotos apagadas encontradas</p>
            </div>
          </div>
        )}

        {/* Trechos de Conversas Deletadas Comprometedoras (Dinâmico) */}
        <div className="w-full max-w-[360px] mx-auto mb-8 bg-black/60 border border-pink-700/50 rounded-2xl p-4 text-left shadow-2xl relative">
          <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
            <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Histórico de Chats Interceptados</span>
          </div>

          <div className="space-y-4">
            {dynamicChats.map((chat, idx) => {
              const isFallbackAvatar = chat.avatar === '/perfil.jpg' || !chat.avatar;

              return (
                <div 
                  key={idx} 
                  onClick={onUnlockClick} 
                  className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/5 hover:border-pink-500/20 transition-all cursor-pointer relative overflow-hidden group"
                >
                  {/* Foto real do perfil em comum carregado */}
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-red-500/30 flex-shrink-0 relative bg-gray-900">
                    <img 
                      src={chat.avatar} 
                      alt={chat.sender} 
                      className={`w-full h-full object-cover opacity-90 blur-[1px] ${isFallbackAvatar ? 'brightness-75' : ''}`} 
                    />
                    
                    {/* Condicional: Cadeado em cima do avatar cinza se não for perfil real */}
                    {isFallbackAvatar && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Lock className="w-4 h-4 text-red-500 drop-shadow-[0_0_4px_rgba(239,68,68,0.8)]" />
                      </div>
                    )}

                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border border-black animate-pulse" />
                  </div>

                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs font-black text-white truncate">{chat.sender}</p>
                      <span className="text-[8px] font-bold text-gray-500 uppercase">{chat.time}</span>
                    </div>
                    {/* Mensagem borrada de forma tantalizante */}
                    <p className="text-[11px] text-gray-300 leading-snug blur-[2.4px] select-none pointer-events-none transition-all group-hover:blur-[1.8px]">
                      {chat.snippet}
                    </p>
                  </div>

                  {/* Cadeado de bloqueio */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-pink-500">
                    <Lock size={14} className="animate-pulse" />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 text-center">
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
              +{chatsCount - 3} outras conversas deletadas extraídas
            </span>
          </div>
        </div>

        <p className="text-xl text-red-400 font-black mb-8 px-2 uppercase italic">
          Desbloqueie agora e veja o que ele(a) estava escondendo!
        </p>

        <div className="w-full flex justify-center pb-4">
          <ShineButton 
            onClick={onUnlockClick} 
            className="w-full max-w-[320px] bg-pink-600 focus:ring-pink-500 active:scale-95"
            shineColorClasses="bg-pink-600"
          >
            <span className="text-lg font-black leading-tight uppercase tracking-tighter">
              VER FOTOS E CONVERSAS APAGADAS
            </span>
          </ShineButton>
        </div>
      </div>
    </motion.div>
  );
};

export default RecoveredDataCard;