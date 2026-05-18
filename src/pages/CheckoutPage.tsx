import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ChevronRight, ShoppingCart, Clock, Star, Check, Mail, Phone, User, CreditCard, Banknote, QrCode } from 'lucide-react';
import SalesNotification from '../components/SalesNotification';

const CHECKOUT_URL = 'https://go.perfectpay.com.br/PPU38CPUD1S';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(252);
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    confirmarEmail: '',
    whatsapp: '',
    documento: ''
  });
  
  const [bumps, setBumps] = useState({
    pro: false,
    social: false,
    recover: false,
    track: false
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const basePrice = 29.90;
  
  const bumpDetails = {
    pro: { 
      title: 'ADQUIRIR TAMBÉM ACESSO VITALÍCIO AO SPYGRAM PRO',
      priceText: 'À VISTA POR R$ 9,90',
      price: 9.90, 
      img: '/order-bumps/vitalicio.jpg',
      desc: 'Tenha acesso permanente a ferramenta SpyGram PRO!'
    },
    social: { 
      title: 'ADQUIRIR TAMBÉM ESPIÃO INSTAGRAM + FACEBOOK + WHATSAPP',
      priceText: 'À VISTA POR R$ 19,90',
      price: 19.90, 
      img: '/order-bumps/social.jpg',
      desc: 'Tenha acesso a todas as redes sociais de quem você quiser!'
    },
    recover: { 
      title: 'ADQUIRIR TAMBÉM RECUPERADOR DE MENSAGENS APAGADAS',
      priceText: 'À VISTA POR R$ 15,90',
      price: 15.90, 
      img: '/order-bumps/recover.jpg',
      desc: 'Recupere todas as mensagens apagadas do instagram!'
    },
    track: { 
      title: 'ADQUIRIR TAMBÉM RASTREAMENTO 24 HORAS',
      priceText: 'À VISTA POR R$ 15,90',
      price: 15.90, 
      img: '/order-bumps/track.jpg',
      desc: 'Rastreie a pessoa que quiser usando somente o celular por tempo ilimitado! Saiba cada passo dela!'
    }
  };

  const adicionais = Object.keys(bumps).reduce((acc, key) => {
    return bumps[key as keyof typeof bumps] ? acc + bumpDetails[key as keyof typeof bumps].price : acc;
  }, 0);

  const total = basePrice + adicionais;

  const handleToggleBump = (key: keyof typeof bumps) => {
    setBumps(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFinalize = () => {
    sessionStorage.setItem('hasPurchased', 'true');
    window.location.href = CHECKOUT_URL;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Componente de Ordem Bump Reaproveitável para Desktop
  const DesktopOrderBump = ({ id, details, checked }: { id: keyof typeof bumps, details: any, checked: boolean }) => (
    <div 
      onClick={() => handleToggleBump(id)}
      className={`relative bg-white border-2 rounded-lg p-4 flex gap-4 cursor-pointer transition-all ${checked ? 'border-[#78cc6d]' : 'border-gray-100'}`}
    >
      <div className="w-16 h-16 flex-shrink-0">
        <img src={details.img} alt="" className="w-full h-full object-contain" />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <p className="text-[11px] font-black text-gray-700 uppercase leading-tight pr-8">
            {details.title} <span className="text-[#22c55e]">{details.priceText}</span>
          </p>
          <input type="checkbox" checked={checked} readOnly className="w-5 h-5 rounded border-gray-300 text-green-600" />
        </div>
        <p className="text-[10px] font-bold text-[#f15c5c] mt-1 italic">{details.desc}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f4f4] text-[#333] font-sans">
      <SalesNotification />

      {/* HEADER FIXO (COMUM) */}
      <div className="w-full bg-[#f15c5c] text-white py-2 text-center text-[11px] font-bold uppercase sticky top-0 z-50">
        SUA VAGA ESTÁ GARANTIDA ENQUANTO ESTIVER NESSA PÁGINA! <span className="ml-2 font-mono">{formatTimer(timeLeft)}</span>
      </div>

      {/* --- VERSÃO WEB (DESKTOP) --- */}
      <div className="hidden md:block">
        {/* HERO WEB - AGORA APENAS O BANNER COMPLETO */}
        <div className="bg-white border-b border-gray-100 relative overflow-hidden">
          {/* Background Blur mantido sutilmente ao redor */}
          <div className="absolute inset-0 z-0 opacity-10 grayscale blur-[100px] scale-150 pointer-events-none" 
               style={{ backgroundImage: 'url(/banner-topo.png)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
          
          <div className="w-full max-w-6xl mx-auto relative z-10">
              <img src="/banner-topo.png" alt="SpyGram Banner" className="w-full h-auto block" />
          </div>
        </div>

        {/* CART BAR WEB */}
        <div className="bg-white border-b border-gray-100 py-4 mb-10">
            <div className="max-w-5xl mx-auto px-4 flex items-center gap-4">
                <ShoppingCart size={20} className="text-gray-400" />
                <div className="text-[11px] uppercase">
                    <span className="text-gray-400 font-bold mr-2">VOCÊ ESTÁ ADQUIRINDO:</span>
                    <span className="text-gray-800 font-black">Relatório SpyGram Completo</span>
                </div>
            </div>
        </div>

        {/* MAIN GRID WEB */}
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-12 gap-8 items-start pb-20">
            
            {/* COLUNA ESQUERDA (FORM E CONTEUDO) */}
            <div className="col-span-8 space-y-8">
                
                {/* Promo Banner Desktop - Redimensionado */}
                <div className="rounded-2xl overflow-hidden shadow-2xl relative">
                    <img src="/embaixodobanner.png" className="w-full h-auto block" alt="SpyGram PRO" />
                </div>

                {/* Step 1: Personal Data Desktop */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-8 h-8 rounded-full bg-gray-300 text-white flex items-center justify-center font-black">1</div>
                            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">DADOS PESSOAIS</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="text-xs font-black text-gray-700 uppercase mb-2 block">Nome completo</label>
                                <input type="text" name="nome" value={formData.nome} onChange={handleChange} placeholder="Digite seu nome completo" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-purple-500 outline-none" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-black text-gray-700 uppercase mb-2 block">CPF ou CNPJ</label>
                                <input type="text" name="documento" value={formData.documento} onChange={handleChange} placeholder="CPF ou CNPJ" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-purple-500 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-700 uppercase mb-2 block">E-mail</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="E-mail" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-purple-500 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-700 uppercase mb-2 block">Confirmar E-mail</label>
                                <input type="email" name="confirmarEmail" value={formData.confirmarEmail} onChange={handleChange} placeholder="Confirmar E-mail" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-purple-500 outline-none" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-black text-gray-700 uppercase mb-2 block">Telefone</label>
                                <input type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="Telefone" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-purple-500 outline-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Step 2: Payment Desktop (SOMENTE PIX) */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-8 h-8 rounded-full bg-gray-300 text-white flex items-center justify-center font-black">2</div>
                            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">PAGAMENTO</h2>
                        </div>
                        
                        {/* Tabs Mockup - Somente Pix */}
                        <div className="grid grid-cols-1 gap-2 mb-6 max-w-[150px]">
                            <div className="border-2 border-green-500 rounded-lg py-3 flex flex-col items-center gap-1 bg-white relative">
                                <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5"><Check size={10} /></div>
                                <QrCode size={18} className="text-green-500" /> <span className="text-[10px] font-bold">Pix</span>
                            </div>
                        </div>

                        <div className="bg-[#fcfcfc] border border-gray-100 rounded-lg p-6 mb-8 text-[11px] text-gray-500 space-y-4">
                            <p>01. Pagamento em segundos, sem complicações</p>
                            <p>02. Basta escanear, com o aplicativo do seu banco, o QRCode que iremos gerar sua compra</p>
                            <p>03. O PIX foi desenvolvido pelo Banco Central para facilitar suas compras e é 100% seguro.</p>
                        </div>
                    </div>
                </div>

                {/* Step 3: Bumps Desktop */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-8 h-8 rounded-full bg-gray-300 text-white flex items-center justify-center font-black">3</div>
                            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">COMPRE JUNTO</h2>
                        </div>

                        <div className="bg-[#78cc6d] text-white px-4 py-1 rounded-sm text-[10px] font-black uppercase w-fit mb-4">APROVEITE!</div>
                        <p className="text-xs font-medium text-gray-500 mb-6">70% das pessoas que compraram Relatório SpyGram Completo também se interessaram por:</p>

                        <div className="space-y-4 mb-10">
                            <DesktopOrderBump id="pro" details={bumpDetails.pro} checked={bumps.pro} />
                            <DesktopOrderBump id="social" details={bumpDetails.social} checked={bumps.social} />
                            <DesktopOrderBump id="recover" details={bumpDetails.recover} checked={bumps.recover} />
                            <DesktopOrderBump id="track" details={bumpDetails.track} checked={bumps.track} />
                        </div>

                        <button onClick={handleFinalize} className="w-full bg-[#78cc6d] hover:bg-[#6ab961] text-white py-4 rounded-xl font-black text-xl uppercase flex items-center justify-center gap-3 shadow-xl transition-transform active:scale-[0.98]">
                            Finalizar Compra <ChevronRight />
                        </button>
                        
                        <div className="mt-4 flex flex-col items-center gap-2">
                             <div className="flex items-center gap-2 text-[11px] font-bold text-[#78cc6d] uppercase">
                                <ShieldCheck size={16} /> Pagamento 100% seguro, processado com criptografia 128bits.
                            </div>
                            <p className="text-[10px] text-gray-400 text-center">Produto digital, os dados para acesso serão enviados por email.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* COLUNA DIREITA (RESUMO SIDEBAR) */}
            <div className="col-span-4 sticky top-16">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="bg-[#bdbdbd]/20 py-3 text-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">RESUMO DA COMPRA</span>
                    </div>
                    <div className="p-8 flex flex-col items-center">
                        <img src="/spygram_transparentebranco.png" className="h-20 brightness-0 mb-6" alt="SpyGram" />
                        <h3 className="text-sm font-black text-gray-800 uppercase text-center mb-1">Relatório SpyGram Completo</h3>
                        <p className="text-[10px] text-gray-400 font-bold mb-8">Relatório Completo SpyGram® 🕵️ ✅</p>

                        <div className="w-full space-y-4 text-xs">
                            <div className="flex justify-between font-bold text-gray-500">
                                <span>Relatório SpyGram Completo</span>
                                <span className="text-gray-800">R$ {basePrice.toFixed(2).replace('.', ',')}</span>
                            </div>
                            {adicionais > 0 && (
                                <div className="flex justify-between font-bold text-gray-500">
                                    <span>Adicionais</span>
                                    <span className="text-gray-800">+ R$ {adicionais.toFixed(2).replace('.', ',')}</span>
                                </div>
                            )}
                            <div className="pt-4 border-t border-gray-100 flex justify-between items-center bg-gray-50 -mx-8 px-8 py-4">
                                <span className="font-black text-gray-800">Total Hoje:</span>
                                <span className="text-base font-black text-green-600">R$ {total.toFixed(2).replace('.', ',')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* FOOTER WEB */}
        <footer className="bg-white border-t border-gray-100 py-12">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                    <p className="text-[11px] font-bold text-gray-400 uppercase">E-MAIL DE SUPORTE: contato@spygram.com.br</p>
                    <div className="bg-[#78cc6d] text-white px-4 py-2 rounded-md flex items-center gap-2 text-[10px] font-black uppercase">
                        <ShieldCheck size={14} /> COMPRA 100% SEGURA
                    </div>
                </div>
            </div>
        </footer>
      </div>

      {/* --- VERSÃO MOBILE --- */}
      <div className="md:hidden">
        {/* Hero Section Mobile */}
        <div className="w-full bg-white pb-8 relative overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-30 grayscale blur-3xl scale-110 pointer-events-none" style={{ backgroundImage: 'url(/banner-topo.png)', backgroundSize: 'cover', backgroundPosition: 'center top' }} />
          <div className="w-full max-w-lg mx-auto flex flex-col items-center relative z-10">
              <div className="w-full relative px-4 pt-4">
                  <img src="/banner-topo.png" alt="SpyGram Community" className="w-full h-auto relative z-10" />
              </div>
              <div className="w-full max-w-[92%] mt-6 bg-white border border-gray-100 rounded-[1.25rem] p-4 flex items-center gap-4 shadow-md">
                  <div className="bg-[#f8f8f8] p-2 rounded-lg"><ShoppingCart className="w-5 h-5 text-gray-800" /></div>
                  <div className="text-left">
                      <p className="text-[10px] font-bold text-[#888] uppercase leading-none tracking-tight">VOCÊ ESTÁ ADQUIRINDO:</p>
                      <p className="text-[12px] font-black text-[#111] mt-0.5">Relatório SpyGram Completo</p>
                  </div>
              </div>
              <div className="w-full px-4 mt-6">
                  <img src="/embaixodobanner.png" alt="Promo" className="w-full h-auto rounded-2xl shadow-xl" />
              </div>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 mt-8 space-y-12">
          {/* Step 1 Mobile */}
          <section className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 pt-6 pb-6">
              <div className="bg-[#bdbdbd] text-white px-6 py-1 rounded-full w-fit flex items-center gap-3 mb-6">
                  <span className="font-black text-sm">1</span><h2 className="text-xs font-black uppercase tracking-widest">DADOS PESSOAIS</h2>
              </div>
              <div className="space-y-5">
                  <div><label className="text-sm font-black text-gray-700 mb-1.5 block">Nome completo</label><input type="text" name="nome" value={formData.nome} onChange={handleChange} placeholder="Digite seu nome completo" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none" /></div>
                  <div><label className="text-sm font-black text-gray-700 mb-1.5 block">CPF ou CNPJ</label><input type="text" name="documento" value={formData.documento} onChange={handleChange} placeholder="CPF ou CNPJ" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none" /></div>
                  <div><label className="text-sm font-black text-gray-700 mb-1.5 block">E-mail</label><input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="E-mail" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none" /></div>
                  <div><label className="text-sm font-black text-gray-700 mb-1.5 block">Confirmar E-mail</label><input type="email" name="confirmarEmail" value={formData.confirmarEmail} onChange={handleChange} placeholder="Confirmar E-mail" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none" /></div>
                  <div><label className="text-sm font-black text-gray-700 mb-1.5 block">Telefone</label><input type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="Telefone" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none" /></div>
              </div>
            </div>
          </section>

          {/* Step 2 Mobile (SOMENTE PIX EM TEXTO) */}
          <section className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 pt-6 pb-6">
              <div className="bg-[#bdbdbd] text-white px-6 py-1 rounded-full w-fit flex items-center gap-3 mb-6">
                  <span className="font-black text-sm">2</span><h2 className="text-xs font-black uppercase tracking-widest">PAGAMENTO</h2>
              </div>
              <div className="bg-[#fcfcfc] border border-gray-100 rounded-lg p-4 mb-6 text-[11px] text-gray-500 space-y-4">
                  <p>01. Pagamento em segundos, sem complicações (PIX)</p><p>02. Basta escanear o QRCode que iremos gerar sua compra</p><p>03. O PIX é 100% seguro.</p>
              </div>
            </div>
          </section>

          {/* Step 3 Mobile */}
          <section className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 pt-6 pb-8">
              <div className="bg-[#bdbdbd] text-white px-6 py-1 rounded-full w-fit flex items-center gap-3 mb-6">
                  <span className="font-black text-sm">3</span><h2 className="text-xs font-black uppercase tracking-widest">COMPRE JUNTO</h2>
              </div>
              <div className="space-y-4">
                  {(Object.keys(bumps) as Array<keyof typeof bumps>).map((key) => (
                      <div key={key} onClick={() => handleToggleBump(key)} className={`bg-[#f7f7f7] border-2 rounded-2xl p-4 flex gap-4 transition-all duration-300 ${bumps[key] ? 'border-[#78cc6d] shadow-md' : 'border-gray-100'}`}>
                          <div className="w-20 h-20 flex-shrink-0"><img src={bumpDetails[key].img} alt="" className="w-full h-full object-contain" /></div>
                          <div className="flex-1">
                              <div className="bg-[#f8f8f8] p-3 rounded-xl flex flex-col gap-2">
                                  <input type="checkbox" checked={bumps[key]} readOnly className="w-6 h-6 rounded border-gray-300 text-green-600" />
                                  <p className="text-[10px] font-black text-gray-700 uppercase leading-tight">{bumpDetails[key].title} <span className="text-[#22c55e]">{bumpDetails[key].priceText}</span></p>
                              </div>
                              <p className="text-[11px] font-black text-[#f15c5c] mt-2 italic">{bumpDetails[key].desc}</p>
                          </div>
                      </div>
                  ))}
              </div>
              <div className="mt-8 flex flex-col items-center">
                  <button onClick={handleFinalize} className="w-full bg-[#78cc6d] text-white py-4 rounded-xl font-black text-lg uppercase flex items-center justify-center gap-3 shadow-lg active:scale-[0.98]">Finalizar Compra <ChevronRight /></button>
                  <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-[#78cc6d] uppercase"><ShieldCheck size={16} /> Pagamento 100% seguro.</div>
              </div>
            </div>
          </section>

          {/* Resumo Mobile */}
          <section className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 pt-6 pb-6 flex flex-col items-center">
                <div className="bg-[#bdbdbd] text-white px-6 py-1 rounded-full w-fit mb-8 uppercase text-xs font-black">RESUMO DA COMPRA</div>
                <img src="/logoapp.png" alt="SpyGram" className="h-32 mb-6" />
                <h3 className="text-base font-black text-[#111] uppercase mb-1">Relatório SpyGram Completo</h3>
                <div className="w-full space-y-4 pt-4 border-t border-gray-100 mt-4">
                    <div className="flex justify-between text-xs font-medium text-gray-600"><span>Subtotal</span><span className="font-black">R$ {total.toFixed(2).replace('.', ',')}</span></div>
                    <div className="flex justify-between items-center bg-[#fcfcfc] border border-gray-100 p-4 rounded-xl">
                        <span className="text-sm font-black text-[#111]">Total Hoje:</span><span className="text-sm font-black text-green-600">R$ {total.toFixed(2).replace('.', ',')}</span>
                    </div>
                </div>
            </div>
          </section>
        </div>

        <footer className="mt-20 border-t border-gray-200 pt-10 px-6 flex flex-col items-center pb-10">
          <p className="text-xs font-bold text-gray-500 mb-8">E-MAIL DE SUPORTE: contato@spygram.com.br</p>
          <div className="bg-[#78cc6d] text-white py-2 px-6 rounded-sm text-[11px] font-black uppercase flex items-center gap-2 shadow-sm mb-10"><ShieldCheck size={20} /> COMPRA 100% SEGURA</div>
        </footer>
      </div>
    </div>
  );
};

export default CheckoutPage;