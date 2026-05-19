import React from 'react';
import { ShoppingCart } from 'lucide-react';

const CheckoutHero: React.FC = () => {
  return (
    <div className="hidden md:flex flex-col items-center w-full max-w-6xl mx-auto pt-12 pb-4 px-4">
      {/* Imagem de Destaque Fornecida */}
      <div className="w-full mb-8 overflow-hidden rounded-[2.5rem]">
        <img 
          src="/checkout-hero-web.png" 
          alt="SpyGram Reviews" 
          className="w-full h-auto block" 
        />
      </div>

      {/* Identificação do Produto */}
      <div className="w-full bg-white border border-gray-100 rounded-xl px-6 py-3 flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">
        <ShoppingCart size={16} />
        <span>VOCÊ ESTÁ ADQUIRINDO:</span>
        <span className="text-gray-800">Relatório SpyGram Completo</span>
      </div>
    </div>
  );
};

export default CheckoutHero;