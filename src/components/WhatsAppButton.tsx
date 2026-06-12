import React from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const WhatsAppButton: React.FC = () => {
  const location = useLocation();
  let isLoggedIn = false;
  
  try {
    const auth = useAuth();
    isLoggedIn = auth.isLoggedIn;
  } catch (error) {
    isLoggedIn = false;
  }

  // Lista de caminhos onde o botão do WhatsApp DEVE ser ocultado (Mockup do Instagram)
  const hiddenPaths = ['/instagram', '/messages', '/chat'];
  
  // Verifica se a rota atual começa com algum dos caminhos a ocultar
  const shouldHide = hiddenPaths.some(path => {
    const currentPath = location.pathname.toLowerCase();
    return currentPath === path || currentPath.startsWith(path + '/');
  });

  if (shouldHide) {
    return null;
  }

  const phoneNumber = "5532987026150"; // Atualizado para o novo número (32) 98702-6150
  const message = isLoggedIn 
    ? "Olá, já comprei o acesso SpyGram e estou com dúvidas"
    : "Olá, vim pelo site do SpyGram, estou com dúvidas!";

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <div className="fixed bottom-6 right-6 z-[999999] flex items-center justify-center">
      {/* Anel de Pulso Luminoso (Glow) */}
      <motion.div
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.6, 0, 0.6]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute w-16 h-16 bg-[#25D366] rounded-full blur-md"
      />

      {/* Botão Principal do WhatsApp */}
      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.1, y: -3 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(37,211,102,0.4)] border border-white/20 group cursor-pointer"
        aria-label="Contato via WhatsApp"
      >
        {/* Tooltip moderno */}
        <span className="absolute right-full mr-4 bg-black/90 text-white text-[10px] font-black py-2 px-4 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 whitespace-nowrap pointer-events-none uppercase tracking-widest border border-white/10 shadow-2xl">
          Suporte Online
        </span>
        
        {/* Vetor Oficial do WhatsApp Redesenhado e Corrigido */}
        <svg 
          viewBox="0 0 448 512" 
          className="w-7 h-7 fill-white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L3 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-117zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
        </svg>
      </motion.a>
    </div>
  );
};

export default WhatsAppButton;