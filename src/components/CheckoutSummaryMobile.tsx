import React from 'react';

interface CheckoutSummaryMobileProps {
  total: number;
  basePrice: number;
  selectedBumps: {
    pro: boolean;
    social: boolean;
    recover: boolean;
    track: boolean;
  };
  bumpDetails: any;
}

const CheckoutSummaryMobile: React.FC<CheckoutSummaryMobileProps> = ({ total, basePrice, selectedBumps, bumpDetails }) => {
  return (
    <div className="md:hidden w-full max-w-sm mx-auto mb-10 relative mt-6">
      {/* Badge Superior */}
      <div className="absolute -top-3 left-4 z-10 bg-[#d1d1d1] text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
        RESUMO DA COMPRA
      </div>

      {/* Card Principal */}
      <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100 flex flex-col items-center">
        
        {/* Logo */}
        <div className="w-full aspect-square max-w-[180px] bg-gray-50/50 rounded-3xl mb-8 flex items-center justify-center p-6">
          <img 
            src="/spygram_transparentebranco.png" 
            alt="SpyGram Logo" 
            className="w-full h-auto brightness-0 opacity-80"
          />
        </div>

        {/* Textos de Identificação */}
        <div className="text-center mb-8">
          <h3 className="text-base font-black text-gray-800 leading-tight">
            Relatório SpyGram Completo
          </h3>
          <p className="text-[11px] text-gray-400 font-bold mt-1 uppercase">
            Relatório Completo SpyGram® 🕵️ ✅
          </p>
        </div>

        {/* Lista de Itens Dinâmica */}
        <div className="w-full space-y-3 mb-6 border-b border-gray-50 pb-6">
          {/* Produto Base */}
          <div className="flex justify-between items-center text-[11px] font-bold">
            <span className="text-gray-500 uppercase tracking-tighter">Relatório SpyGram Completo</span>
            <span className="text-[#78cc6d]">R$ {basePrice.toFixed(2).replace('.', ',')}</span>
          </div>

          {/* Order Bumps Selecionados */}
          {Object.entries(selectedBumps).map(([key, isSelected]) => {
            if (!isSelected) return null;
            const item = bumpDetails[key];
            return (
              <div key={key} className="flex justify-between items-center text-[11px] font-bold animate-fade-in">
                <span className="text-gray-500 uppercase tracking-tighter">{item.title}</span>
                <span className="text-[#78cc6d]">R$ {item.price.toFixed(2).replace('.', ',')}</span>
              </div>
            );
          })}
        </div>

        {/* Total Hoje */}
        <div className="w-full bg-[#f2f2f2] rounded-xl px-4 py-3 flex justify-between items-center">
          <span className="text-[12px] font-bold text-gray-600 uppercase">Total Hoje:</span>
          <span className="text-[12px] font-black text-[#78cc6d]">R$ {total.toFixed(2).replace('.', ',')}</span>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSummaryMobile;