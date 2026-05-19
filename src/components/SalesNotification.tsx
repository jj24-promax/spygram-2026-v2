import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const NAMES = ['Ana Souza', 'Carlos M.', 'Fernanda Oliveira', 'Lucas G.', 'Ricardo Silva', 'Juliana P.', 'Gabriel M.', 'Mariana L.'];
const CITIES = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Salvador', 'Fortaleza', 'Brasília', 'Porto Alegre'];

const SalesNotification: React.FC = () => {
  const [notification, setNotification] = useState<{ name: string; city: string; time: string } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Inicializa o áudio com um novo som de notificação (Sucess/Chime)
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    audioRef.current.volume = 0.4;

    const showRandomNotification = () => {
      const name = NAMES[Math.floor(Math.random() * NAMES.length)];
      const city = CITIES[Math.floor(Math.random() * CITIES.length)];
      setNotification({ name, city, time: 'agora mesmo' });
      
      // Toca o som de venda
      if (audioRef.current) {
        audioRef.current.play().catch(() => {
          // Navegadores bloqueiam autoplay sem interação prévia
          console.log("Som bloqueado pelo navegador. Interaja com a página primeiro.");
        });
      }

      // Oculta após 5 segundos
      setTimeout(() => setNotification(null), 5000);
    };

    // Primeira notificação após 3 segundos
    const initialTimer = setTimeout(showRandomNotification, 3000);

    // Intervalo entre notificações (10 a 20 segundos)
    const interval = setInterval(() => {
      showRandomNotification();
    }, Math.random() * 10000 + 10000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="fixed bottom-4 left-4 z-[100] bg-white text-black p-3 rounded-lg shadow-2xl flex items-center gap-3 border-l-4 border-green-500 max-w-[280px]"
        >
          <div className="bg-green-100 p-2 rounded-full">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs font-bold leading-tight">Venda Aprovada!</p>
            <p className="text-[10px] text-gray-600">
              <span className="font-bold">{notification.name}</span> de {notification.city} acabou de adquirir o SpyGram.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SalesNotification;