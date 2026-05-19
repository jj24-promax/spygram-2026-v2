import React from 'react';
import { ShoppingBag } from 'lucide-react';

interface CheckoutSidebarProps {
  total: number;
}

const CheckoutSidebar: React.FC<CheckoutSidebarProps> = ({ total }) => {
  return (
    <aside className="hidden lg:block w-80 flex-shrink-0 sticky top-32 h-fit">
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/50 overflow-hidden">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-50">
            <div className="p-2 bg-green-50 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-[#78cc6d]" />
            </div>
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">Resumo do Pedido</h3>
          </div>

          <div className="flex flex-col items-center mb-8">
            <div className="bg-gray-50 p-4 rounded-2xl mb-6">
              <img src="/spygram_transparentebranco.png" className="h-10 brightness-0 opacity-60" alt="SpyGram" />
            </div>

            <div className="w-full text-center">
              <h4 className="text-[13px] font-black text-gray-800 leading-tight">Relatório SpyGram Completo</h4>
              <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-tight">Acesso Vitalício + Monitoramento ✅</p>
            </div>
          </div>

          <div className="w-full space-y-4 pt-6 border-t border-gray-50">
            <div className="flex justify-between items-center text-[11px] font-medium text-gray-500">
              <span>Subtotal</span>
              <span>R$ 29,90</span>
            </div>
            
            <div className="flex justify-between items-center text-[11px] font-medium text-gray-500">
              <span>Taxas de Processamento</span>
              <span className="text-green-500">GRÁTIS</span>
            </div>
            
            <div className="bg-gray-50 p-5 rounded-2xl flex justify-between items-center mt-8 border border-gray-100/50">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total a pagar:</span>
              <span className="text-lg font-black text-[#78cc6d]">R$ {total.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 py-3 bg-gray-50/50 rounded-xl">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Aguardando Pagamento</span>
          </div>
        </div>
      </div>
      
      {/* Selo de Garantia Extra na Sidebar */}
      <div className="mt-6 p-6 bg-white/40 backdrop-blur-sm rounded-[2rem] border border-gray-100 flex items-center gap-4">
        <img src="https://img.icons8.com/color/48/000000/guarantee.png" className="w-10 h-10 grayscale opacity-50" alt="Garantia" />
        <p className="text-[9px] font-bold text-gray-400 uppercase leading-tight tracking-tight">
          Sua compra está protegida pela <span className="text-gray-600">Garantia de Satisfação de 7 dias</span>.
        </p>
      </div>
    </aside>
  );
};

export default CheckoutSidebar;