import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, MessageSquare, Trash2, Lock } from 'lucide-react';
import ShineButton from './ui/ShineButton';

interface RecoveredDataCardProps {
  onUnlockClick: () => void;
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

const RecoveredDataCard: React.FC<RecoveredDataCardProps> = ({ onUnlockClick }) => {
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

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 1.6 }}
      className="mt-12 mb-12 p-0 text-center w-full mx-auto relative overflow-hidden"
    >
      <div className="relative z-10">
        
        {/* Título e Ícones */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <Trash2 className="w-10 h-10 text-red-500" />
          <h2 className="text-3xl font-extrabold text-white">
            <span className="bg-gradient-to-r from-pink-400 via-red-500 to-yellow-400 text-transparent bg-clip-text">
              DADOS APAGADOS RECUPERADOS
            </span>
          </h2>
        </div>

        <p className="text-gray-200 mb-8 max-w-md mx-auto text-lg font-medium">
          **IMPERDÍVEL!** Nosso sistema de recuperação encontrou arquivos que o alvo pensou ter deletado para sempre.
        </p>
        
        {/* Contadores de Dados Recuperados em Layout de Grade */}
        <div className="grid grid-cols-2 gap-4 mb-6 max-w-sm mx-auto">
            
            {/* Card de Fotos */}
            <div className="p-4 bg-black/50 border border-yellow-700 rounded-xl flex flex-col items-center transition-all duration-300 hover:scale-[1.03] cursor-default">
                <ImageIcon className="w-12 h-12 text-yellow-400 mb-2 animate-pulse-slow" />
                <p className="text-6xl font-extrabold text-yellow-300">{photosCount}</p>
                <p className="text-sm text-gray-400 mt-1">Fotos Recuperadas</p>
            </div>

            {/* Card de Conversas */}
            <div className="p-4 bg-black/50 border border-pink-700 rounded-xl flex flex-col items-center transition-all duration-300 hover:scale-[1.03] cursor-default">
                <MessageSquare className="w-12 h-12 text-pink-400 mb-2 animate-pulse-slow" />
                <p className="text-6xl font-extrabold text-pink-300">{chatsCount}</p>
                <p className="text-sm text-gray-400 mt-1">Conversas Secretas</p>
            </div>
        </div>

        {/* Mini Galeria de Fotos Recuperadas */}
        {selectedImages.length > 0 && (
          <div className="flex items-center justify-center gap-8 mb-8 bg-black/60 p-6 rounded-xl border border-red-700/50 max-w-sm mx-auto shadow-lg shadow-red-500/10">
            <div className="flex -space-x-8"> 
              {selectedImages.map((src, index) => (
                <div 
                  key={index} 
                  className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-pink-500 shadow-xl bg-gray-900"
                  style={{ zIndex: 3 - index }}
                >
                  <img 
                    src={src} 
                    alt="Recuperada" 
                    className="w-full h-full object-cover blur-[4px] scale-110" 
                    onError={(e) => { e.currentTarget.src = '/perfil.jpg' }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Lock className="w-10 h-10 text-white/90 drop-shadow-md" />
                  </div>
                </div>
              ))}
            </div>
            <div className="text-left leading-tight">
              {/* Agora exibe o total menos 3 */}
              <span className="text-4xl font-black text-pink-400 animate-pulse">+{photosCount - 3}</span>
              <p className="text-xs text-gray-300 font-bold uppercase mt-1">Fotos apagadas<br/>encontradas</p>
            </div>
          </div>
        )}

        <p className="text-xl text-red-400 font-bold mb-6">
          Desbloqueie agora e veja o que ele(a) estava escondendo!
        </p>

        {/* Contêiner para forçar a centralização do botão */}
        <div className="w-full flex justify-center">
          <ShineButton 
            onClick={onUnlockClick} 
            className="w-full max-w-[280px] bg-pink-600 focus:ring-pink-500 active:scale-95"
            shineColorClasses="bg-pink-600"
          >
            <span className="text-lg font-extrabold leading-tight">
              VER FOTOS E CONVERSAS<br/>APAGADAS
            </span>
          </ShineButton>
        </div>
      </div>
    </motion.div>
  );
};

export default RecoveredDataCard;