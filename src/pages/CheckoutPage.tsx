import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Lock, CreditCard, QrCode, Check } from 'lucide-react';

const CHECKOUT_URL = 'https://go.perfectpay.com.br/PPU38CPUD1S';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<'cartao' | 'pix'>('pix');
  
  // Estado dos Order Bumps
  const [bumps, setBumps] = useState({
    pro: false,
    social: false,
    recover: false,
    track: false
  });

  const basePrice = 29.90;
  
  const bumpDetails = {
    pro: { price: 9.90 },
    social: { price: 19.90 },
    recover: { price: 15.90 },
    track: { price: 15.90 }
  };

  const calculateAdicionais = () => {
    let total = 0;
    if (bumps.pro) total += bumpDetails.pro.price;
    if (bumps.social) total += bumpDetails.social.price;
    if (bumps.recover) total += bumpDetails.recover.price;
    if (bumps.track) total += bumpDetails.track.price;
    return total;
  };

  const adicionais = calculateAdicionais();
  const total = basePrice + adicionais;

  const handleToggleBump = (key: keyof typeof bumps) => {
    setBumps(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFinalize = () => {
    window.location.href = CHECKOUT_URL;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 font-sans pb-10">
      {/* Topbar */}
      <div className="w-full bg-[#111] border-b border-gray-800 flex items-center justify-between px-4 sm:px-8 py-3">
        <button onClick={() => navigate(-1)} className="flex items-center text-xs text-gray-400 hover:text-white transition-colors uppercase tracking-wider font-semibold">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Voltar
        </button>
        <span className="text-xs tracking-widest text-gray-500 font-bold uppercase">Pagamento Seguro</span>
        <Lock className="w-4 h-4 text-gray-500" />
      </div>

      {/* Banner Imagem */}
      <div className="w-full max-w-4xl mx-auto flex justify-center bg-black">
        <img 
          src="/banner-topo.png" 
          alt="Finalize a compra do Relatório Completo" 
          className="w-full h-auto object-cover"
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column - Forms */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Produto Info Mobile */}
            <div className="flex items-center justify-between bg-[#111] border border-gray-800 rounded-xl p-4 lg:hidden">
              <span className="text-xs text-gray-500 font-bold uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-yellow-600" /> Você está adquirindo:
              </span>
              <span className="text-sm font-semibold text-white">Acesso Completo SpyGram</span>
            </div>

            {/* 1. DADOS PESSOAIS */}
            <section className="bg-[#111] border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-[#222] text-[#d4af37] flex items-center justify-center font-bold border border-[#333]">1</div>
                <h2 className="text-xl font-bold text-white uppercase tracking-wide">Dados Pessoais</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nome Completo</label>
                  <input type="text" placeholder="Digite seu nome completo" className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-4 py-3 text-white focus:border-[#d4af37] focus:outline-none transition-colors" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">E-mail</label>
                    <input type="email" placeholder="seu@email.com" className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-4 py-3 text-white focus:border-[#d4af37] focus:outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Confirmar E-mail</label>
                    <input type="email" placeholder="repita seu e-mail" className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-4 py-3 text-white focus:border-[#d4af37] focus:outline-none transition-colors" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">WhatsApp</label>
                    <input type="text" placeholder="(00) 00000-0000" className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-4 py-3 text-white focus:border-[#d4af37] focus:outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">CPF ou CNPJ</label>
                    <input type="text" placeholder="000.000.000-00" className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-4 py-3 text-white focus:border-[#d4af37] focus:outline-none transition-colors" />
                  </div>
                </div>
              </div>
            </section>

            {/* 2. PAGAMENTO */}
            <section className="bg-[#111] border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-[#222] text-[#d4af37] flex items-center justify-center font-bold border border-[#333]">2</div>
                <h2 className="text-xl font-bold text-white uppercase tracking-wide">Pagamento</h2>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <button 
                  onClick={() => setPaymentMethod('cartao')}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${paymentMethod === 'cartao' ? 'bg-[#1a1a1a] border-[#d4af37] text-[#d4af37]' : 'bg-[#0a0a0a] border-gray-800 text-gray-500 hover:border-gray-600'}`}
                >
                  <CreditCard className="w-6 h-6 mb-2" />
                  <span className="text-xs font-bold uppercase">Cartão</span>
                </button>
                <button 
                  onClick={() => setPaymentMethod('pix')}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${paymentMethod === 'pix' ? 'bg-[#1a1a1a] border-[#d4af37] text-[#d4af37]' : 'bg-[#0a0a0a] border-gray-800 text-gray-500 hover:border-gray-600'}`}
                >
                  <QrCode className="w-6 h-6 mb-2" />
                  <span className="text-xs font-bold uppercase">PIX</span>
                </button>
              </div>

              {paymentMethod === 'pix' && (
                <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-5">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                    <QrCode className="w-4 h-4 text-green-500" /> INSTRUÇÕES DO PIX
                  </h3>
                  <p className="text-sm text-gray-400">
                    Pagamento 100% seguro e processado instantaneamente para garantir o envio imediato.
                  </p>
                </div>
              )}
            </section>

            {/* 3. ORDER BUMPS */}
            <section className="bg-[#111] border border-gray-800 rounded-xl overflow-hidden relative">
              {/* Oportunidade Unica Label */}
              <div className="bg-[#0f1c13] border-b border-green-900/30 px-4 py-2">
                <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Oportunidade Única
                </span>
              </div>
              
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-[#222] text-[#d4af37] flex items-center justify-center font-bold border border-[#333]">3</div>
                  <h2 className="text-xl font-bold text-white uppercase tracking-wide">Adicione ao seu pedido</h2>
                </div>

                <div className="space-y-4">
                  {/* BUMP 1: SpyGram PRO (Vitalício) */}
                  <div onClick={() => handleToggleBump('pro')} className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3 sm:gap-4 ${bumps.pro ? 'bg-[#1a1a1a] border-[#d4af37]' : 'bg-[#0a0a0a] border-gray-800 hover:border-gray-700'}`}>
                    <div className="flex-shrink-0 bg-white/5 rounded-md p-1.5 flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16">
                      <img src="/Vitalicio.png" alt="SpyGram PRO" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[11px] sm:text-[13px] font-bold text-white uppercase leading-tight">ADQUIRIR TAMBÉM ACESSO VITALÍCIO AO SPYGRAM PRO</h3>
                      <p className="text-[12px] sm:text-[14px] font-bold text-green-500 mt-1">À VISTA POR R$ 9,90</p>
                      <p className="text-[10px] sm:text-[12px] font-semibold text-red-500 mt-1 leading-tight">Tenha acesso permanente a ferramenta SpyGram PRO!</p>
                    </div>
                    <div className={`w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0 rounded flex items-center justify-center border transition-colors ${bumps.pro ? 'bg-[#d4af37] border-[#d4af37]' : 'bg-[#111] border-gray-600'}`}>
                      {bumps.pro && <Check className="w-4 h-4 sm:w-5 sm:h-5 text-black" />}
                    </div>
                  </div>

                  {/* BUMP 2: Redes Sociais */}
                  <div onClick={() => handleToggleBump('social')} className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3 sm:gap-4 ${bumps.social ? 'bg-[#1a1a1a] border-[#d4af37]' : 'bg-[#0a0a0a] border-gray-800 hover:border-gray-700'}`}>
                    <div className="flex-shrink-0 bg-white/5 rounded-md p-1.5 flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16">
                      <img src="/orderredesociais.png" alt="Redes Sociais" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[11px] sm:text-[13px] font-bold text-white uppercase leading-tight">ADQUIRIR TAMBÉM ESPIÃO INSTAGRAM + FACEBOOK + WHATSAPP</h3>
                      <p className="text-[12px] sm:text-[14px] font-bold text-green-500 mt-1">À VISTA POR R$ 19,90</p>
                      <p className="text-[10px] sm:text-[12px] font-semibold text-red-500 mt-1 leading-tight">Tenha acesso a todas as redes sociais de quem você quiser!</p>
                    </div>
                    <div className={`w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0 rounded flex items-center justify-center border transition-colors ${bumps.social ? 'bg-[#d4af37] border-[#d4af37]' : 'bg-[#111] border-gray-600'}`}>
                      {bumps.social && <Check className="w-4 h-4 sm:w-5 sm:h-5 text-black" />}
                    </div>
                  </div>

                  {/* BUMP 3: Mensagens Apagadas */}
                  <div onClick={() => handleToggleBump('recover')} className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3 sm:gap-4 ${bumps.recover ? 'bg-[#1a1a1a] border-[#d4af37]' : 'bg-[#0a0a0a] border-gray-800 hover:border-gray-700'}`}>
                    <div className="flex-shrink-0 bg-white/5 rounded-md p-1.5 flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16">
                      <img src="/orderlixeira.png" alt="Recuperar Apagadas" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[11px] sm:text-[13px] font-bold text-white uppercase leading-tight">ADQUIRIR TAMBÉM RECUPERADOR DE MENSAGENS APAGADAS</h3>
                      <p className="text-[12px] sm:text-[14px] font-bold text-green-500 mt-1">À VISTA POR R$ 15,90</p>
                      <p className="text-[10px] sm:text-[12px] font-semibold text-red-500 mt-1 leading-tight">Recupere todas as mensagens apagadas do instagram!</p>
                    </div>
                    <div className={`w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0 rounded flex items-center justify-center border transition-colors ${bumps.recover ? 'bg-[#d4af37] border-[#d4af37]' : 'bg-[#111] border-gray-600'}`}>
                      {bumps.recover && <Check className="w-4 h-4 sm:w-5 sm:h-5 text-black" />}
                    </div>
                  </div>

                  {/* BUMP 4: Rastreamento */}
                  <div onClick={() => handleToggleBump('track')} className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3 sm:gap-4 ${bumps.track ? 'bg-[#1a1a1a] border-[#d4af37]' : 'bg-[#0a0a0a] border-gray-800 hover:border-gray-700'}`}>
                    <div className="flex-shrink-0 bg-white/5 rounded-md p-1.5 flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16">
                      <img src="/orderlocalizacao.png" alt="Rastreamento" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[11px] sm:text-[13px] font-bold text-white uppercase leading-tight">ADQUIRIR TAMBÉM RASTREAMENTO 24 HORAS</h3>
                      <p className="text-[12px] sm:text-[14px] font-bold text-green-500 mt-1">À VISTA POR R$ 15,90</p>
                      <p className="text-[10px] sm:text-[12px] font-semibold text-red-500 mt-1 leading-tight">Rastreie a pessoa que quiser usando somente o celular por tempo ilimitado!</p>
                    </div>
                    <div className={`w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0 rounded flex items-center justify-center border transition-colors ${bumps.track ? 'bg-[#d4af37] border-[#d4af37]' : 'bg-[#111] border-gray-600'}`}>
                      {bumps.track && <Check className="w-4 h-4 sm:w-5 sm:h-5 text-black" />}
                    </div>
                  </div>

                </div>
              </div>
            </section>
          </div>

          {/* Right Column - Resumo */}
          <div className="lg:col-span-4">
            <div className="bg-[#111] border border-gray-800 rounded-xl p-6 sticky top-6">
              
              {/* Product Placeholder / Image */}
              <div className="w-full aspect-square bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-lg flex items-center justify-center mb-6">
                <img src="/logoapp.png" alt="SpyGram Logo" className="w-1/2 opacity-90 object-contain" />
              </div>

              <h2 className="text-lg font-black text-white uppercase tracking-wider mb-6 border-b border-gray-800 pb-4">
                Resumo da Compra
              </h2>

              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between text-gray-300">
                  <span>Plano</span>
                  <span className="font-semibold text-white">Acesso Completo</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Subtotal (1 un)</span>
                  <span className="font-semibold text-white">R$ {basePrice.toFixed(2).replace('.', ',')}</span>
                </div>
                {adicionais > 0 && (
                  <div className="flex justify-between text-yellow-500 font-medium">
                    <span>Adicionais</span>
                    <span>+ R$ {adicionais.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-300">
                  <span>Frete</span>
                  <span className="font-bold text-green-500 uppercase text-xs">Grátis</span>
                </div>
              </div>

              <div className="border-t border-gray-800 pt-4 mb-6 flex justify-between items-end">
                <span className="text-lg font-bold text-white">Total Hoje:</span>
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-[#f3e5ab]">
                  R$ {total.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <button 
                onClick={handleFinalize}
                className="w-full py-4 rounded-lg font-black text-black uppercase tracking-wider bg-gradient-to-b from-[#d4af37] via-[#c5a059] to-[#a67c00] hover:brightness-110 transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] active:scale-95"
              >
                Finalizar Compra
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                <Lock className="w-3 h-3" />
                <span>Ambiente Seguro e Criptografado</span>
              </div>
            </div>
          </div>

        </div>

        {/* Imagem do Final / Reviews */}
        <div className="mt-16 w-full max-w-2xl mx-auto flex justify-center">
          <img 
            src="/embaixodobanner.png" 
            alt="Mais de 12 mil pessoas aprovam" 
            className="w-full h-auto object-contain rounded-xl shadow-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;