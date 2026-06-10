import React, { useRef } from 'react';
import { MessageSquareQuote, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const CustomerTestimonials: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const screenshots = [
    { src: '/testimonials/mariana.png', name: 'Mariana' },
    { src: '/testimonials/rafael.png', name: 'Rafael' },
    { src: '/testimonials/juliana.png', name: 'Juliana' }
  ];

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 296; // Largura do card (280px) + gap (16px)
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

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

      {/* Galeria Horizontal com Navegação por Setas */}
      <div className="relative w-full px-4 group">
        
        {/* Botão de Navegação Esquerda */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/70 hover:bg-purple-600 border border-white/10 text-white p-2.5 rounded-full transition-all active:scale-90 shadow-xl"
          aria-label="Depoimento Anterior"
        >
          <ChevronLeft size={20} className="stroke-[2.5]" />
        </button>

        {/* Botão de Navegação Direita */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/70 hover:bg-purple-600 border border-white/10 text-white p-2.5 rounded-full transition-all active:scale-90 shadow-xl"
          aria-label="Próximo Depoimento"
        >
          <ChevronRight size={20} className="stroke-[2.5]" />
        </button>

        {/* Container com Scroll Horizontal */}
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-4 pb-10 scrollbar-hide snap-x snap-mandatory scroll-smooth"
        >
          {screenshots.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="flex-shrink-0 w-[280px] snap-center relative"
            >
              {/* Efeito de brilho ao redor do print */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-[2rem] blur-xl opacity-20 transition duration-500"></div>
              
              <div className="relative rounded-[1.8rem] overflow-hidden border border-white/10 shadow-2xl bg-black/40">
                <img 
                  src={item.src} 
                  alt={`Depoimento de ${item.name}`} 
                  className="w-full h-auto block object-contain"
                />

                {/* Camada inteligente de desfoque posicionada perfeitamente sobre o nome no cabeçalho */}
                <div 
                  className="absolute bg-white/5 backdrop-blur-[6px] rounded-md border border-white/5"
                  style={{
                    top: '5.5%',
                    left: '28%',
                    width: '38%',
                    height: '5%'
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