import React from 'react';
import { Star, ShoppingCart } from 'lucide-react';

const CheckoutHero: React.FC = () => {
  return (
    <div className="hidden md:flex flex-col items-center w-full max-w-6xl mx-auto py-12 px-4">
      {/* Perfil Circles Mockup */}
      <div className="relative w-full max-w-2xl h-48 mb-8">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Logo Central */}
            <div className="bg-white p-4 rounded-3xl shadow-xl z-20 relative border border-gray-100">
               <img src="/spygram_transparentebranco.png" alt="SpyGram" className="h-10 brightness-0" />
            </div>
            
            {/* Círculos Flutuantes (Simulados) */}
            {[...Array(12)].map((_, i) => {
              const angle = (i / 12) * Math.PI * 2;
              const radius = 120 + (i % 2 === 0 ? 30 : 0);
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              return (
                <div 
                  key={i}
                  className="absolute w-12 h-12 rounded-full border-2 border-white shadow-lg overflow-hidden bg-gray-200"
                  style={{ 
                    left: `calc(50% + ${x}px)`, 
                    top: `calc(50% + ${y}px)`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <img src={`https://i.pravatar.cc/100?u=${i}`} alt="User" className="w-full h-full object-cover" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="text-center space-y-4 mb-10">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">
          +12,3mil pessoas utilizam e aprovam o SpyGram®.
        </h1>
        <p className="text-gray-500 font-medium text-lg">
          Este aplicativo foi testado e aprovado por profissionais, <br />
          contando com o selo de confiança 'Google Reviews'.
        </p>
      </div>

      {/* Google Reviews Card */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 flex items-center gap-8 shadow-sm w-full max-w-2xl mb-12">
        <div className="bg-white p-2 rounded-full shadow-sm border border-gray-100">
          <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" alt="Google" className="h-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-800 text-xl">GOOGLE REVIEWS:</h3>
          <p className="text-gray-500 font-bold">(12,3mil) Avaliações</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex gap-0.5 text-yellow-400">
            {[...Array(5)].map((_, i) => <Star key={i} fill="currentColor" size={24} />)}
          </div>
          <span className="text-gray-400 font-bold mt-1">(4,9)</span>
        </div>
      </div>

      {/* Identificação do Produto */}
      <div className="w-full bg-white border border-gray-100 rounded-xl px-6 py-3 flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-12">
        <ShoppingCart size={16} />
        <span>VOCÊ ESTÁ ADQUIRINDO:</span>
        <span className="text-gray-800">Relatório SpyGram Completo</span>
      </div>
    </div>
  );
};

export default CheckoutHero;