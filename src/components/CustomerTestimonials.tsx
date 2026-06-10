import React from 'react';
import { MessageSquareQuote, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const CustomerTestimonials: React.FC = () => {
  const screenshots = [
    { src: '/testimonials/mariana.png', name: 'Mariana' },
    { src: '/testimonials/rafael.png', name: 'Rafael' },
    { src: '/testimonials/juliana.png', name: 'Juliana' }
  ];

  return (
    <div className="mt-16 w-full">
      {/* Título Centralizado */}
      <div className="flex flex-col items-center justify-center gap-2 mb-8 text-center px-4">
        <div className="flex items-center gap-3">
          <MessageSquareQuote className="w-7 h-7 text-purple-400" />
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">O QUE DIZEM NOSSOS CLIENTES</h2>
        </div>
        <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
          <CheckCircle2 className="w-3 h-3 text-green-500" />
          <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Depoimentos Reais</span>
        </div>
      </div>

      {/* Galeria Horizontal */}
      <div className="relative w-full">
        {/* Indicador de Scroll */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-purple-600/80 p-1.5 rounded-full animate-pulse md:hidden">
          <ChevronRight size={16} className="text-white" />
        </div>

        <div className="flex overflow-x-auto gap-4 px-4 pb-10 scrollbar-hide snap-x snap-mandatory">
          {screenshots.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="flex-shrink-0 w-[280px] snap-center group relative"
            >
              {/* Efeito de brilho ao redor do print */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-[2rem] blur-xl opacity-20 group-hover:opacity-100 transition duration-500"></div>
              
              <div className="relative rounded-[1.8rem] overflow-hidden border border-white/10 shadow-2xl bg-black/40">
                <img 
                  src={item.src} 
                  alt={`Depoimento de ${item.name}`} 
                  className="w-full h-auto block object-contain" // Mantém proporção e nitidez
                />

                {/* Camada inteligente de desfoque posicionada sobre o nome nos chats dos prints */}
                <div 
                  className="absolute bg-white/5 backdrop-blur-[6px] rounded-md border border-white/5"
                  style={{
                    top: '9%',       // Altura exata do cabeçalho do WhatsApp
                    left: '28%',     // Começa logo após a foto de perfil
                    width: '38%',    // Cobre o primeiro e segundo nome
                    height: '5.5%'   // Cobre exatamente a linha do nome
                  }}
                />
                
                {/* Overlay de Verificado */}
                <div className="absolute top-3 right-3 bg-green-500 text-white p-1 rounded-full shadow-lg z-10">
                  <CheckCircle2 size={12} />
                </div>
              </div>
              
              {/* Nome discreto abaixo */}
              <p className="mt-3 text-center text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">
                Cliente: {item.name} ✅
              </p>
            </motion.div>
          ))}
        </div>
      </div>
      
      <div className="mx-4 p-6 bg-white/5 border border-dashed border-white/10 rounded-3xl text-center">
        <p className="text-gray-400 text-[11px] font-bold leading-relaxed italic uppercase tracking-tighter">
          "Milhares de usuários já descobriram a verdade. Não seja o último a saber."
        </p>
      </div>
    </div>
  );
};

export default CustomerTestimonials;