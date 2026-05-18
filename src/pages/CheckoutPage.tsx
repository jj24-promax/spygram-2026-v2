import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Lock, CreditCard, QrCode, Check, Clock, Star, Mail, ShieldCheck, ChevronRight, ShoppingCart, Banknote, LayoutList } from 'lucide-react';
import SalesNotification from '../components/SalesNotification';

const CHECKOUT_URL = 'https://go.perfectpay.com.br/PPU38CPUD1S';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(252); // 04:12 inicial conforme imagem
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
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
      titlePart1: 'ADQUIRIR TAMBÉM ACESSO VITALÍCIO AO SPYGRAM PRO ✅',
      priceText: 'À VISTA POR R$ 9,90',
      price: 9.90, 
      img: '/order-bumps/vitalicio.jpg',
      desc: 'Tenha acesso permanente a ferramenta SpyGram PRO!'
    },
    social: { 
      titlePart1: 'ADQUIRIR TAMBÉM ESPIÃO INSTAGRAM + FACEBOOK + WHATSAPP',
      priceText: 'À VISTA POR R$ 19,90',
      price: 19.90, 
      img: '/order-bumps/social.jpg',
      desc: 'Tenha acesso a todas as redes sociais de quem você quiser!'
    },
    recover: { 
      titlePart1: 'ADQUIRIR TAMBÉM RECUPERADOR DE MENSAGENS APAGADAS',
      priceText: 'À VISTA POR R$ 15,90',
      price: 15.90, 
      img: '/order-bumps/recover.jpg',
      desc: 'Recupere todas as mensagens apagadas do instagram!'
    },
    track: { 
      titlePart1: 'ADQUIRIR TAMBÉM RASTREAMENTO 24 HORAS',
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

  const maskPhone = (value: string) => value.replace(/\D/g, "").replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2").substring(0, 15);
  const maskCPFCNPJ = (value: string) => {
    const raw = value.replace(/\D/g, "");
    if (raw.length <= 11) return raw.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    return raw.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2").substring(0, 18);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;
    if (name === 'whatsapp') formattedValue = maskPhone(value);
    else if (name === 'documento') formattedValue = maskCPFCNPJ(value);
    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4] text-[#333] font-sans pb-20">
      <SalesNotification />
      
      {/* Top Countdown Banner */}
      <div className="w-full bg-[#f15c5c] text-white py-3 text-center text-[12px] font-bold uppercase flex flex-col items-center justify-center gap-1 px-4 opacity-90 relative z-10">
        <span className="text-base font-mono">{formatTimer(timeLeft)}</span>
        <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>ESSA PROMOÇÃO SE ENCERRA AO ZERAR O CRONÔMETRO!</span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="w-full bg-white pb-8 relative overflow-hidden">
        {/* Background Blurred Banner */}
        <div 
          className="absolute inset-0 z-0 opacity-30 grayscale blur-3xl scale-110 pointer-events-none"
          style={{ 
            backgroundImage: 'url(/banner-topo.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center top'
          }}
        />

        <div className="w-full max-w-lg mx-auto flex flex-col items-center relative z-10">
            {/* Collage and Texts */}
            <div className="w-full relative px-4 pt-4">
                <img src="/banner-topo.png" alt="SpyGram Community" className="w-full h-auto relative z-10" />
                <div className="text-center mt-4">
                    <h1 className="text-xl font-black text-[#111] mb-1.5">+12,3mil pessoas utilizam e aprovam o SpyGram®.</h1>
                    <p className="text-[#888] text-[11px] font-medium max-w-[320px] mx-auto leading-snug">
                        Este aplicativo foi testado e aprovado por profissionais, contando com o selo de confiança 'Google Reviews'.
                    </p>
                </div>
            </div>

            {/* Acquiring Bar */}
            <div className="w-full max-w-[92%] mt-6 bg-white border border-gray-100 rounded-[1.25rem] p-4 flex items-center gap-4 shadow-md">
                <div className="bg-[#f8f8f8] p-2 rounded-lg">
                    <ShoppingCart className="w-5 h-5 text-gray-800" />
                </div>
                <div className="text-left">
                    <p className="text-[10px] font-bold text-[#888] uppercase leading-none tracking-tight">VOCÊ ESTÁ ADQUIRINDO:</p>
                    <p className="text-[12px] font-black text-[#111] mt-0.5">Relatório SpyGram Completo</p>
                </div>
            </div>

            {/* Dark Promo Banner */}
            <div className="w-full px-4 mt-6">
                <img src="/embaixodobanner.png" alt="Promo" className="w-full h-auto rounded-2xl shadow-xl" />
            </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 mt-8 space-y-12">
        
        {/* Step 1: Personal Data */}
        <section className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-gray-100">
          <div className="px-6 pt-6 pb-2">
            <div className="bg-[#bdbdbd] text-white px-6 py-1 rounded-full w-fit flex items-center gap-3 mb-6">
                <span className="font-black text-sm">1</span>
                <h2 className="text-xs font-black uppercase tracking-widest">DADOS PESSOAIS</h2>
            </div>
            <div className="space-y-5 px-1">
                <div>
                    <label className="text-sm font-black text-gray-700 mb-1.5 block">Nome completo</label>
                    <input type="text" name="nome" value={formData.nome} onChange={handleChange} placeholder="Digite seu nome completo" className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-purple-500 outline-none" />
                </div>
                <div>
                    <label className="text-sm font-black text-gray-700 mb-1.5 block">E-mail</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="E-mail" className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-purple-500 outline-none" />
                </div>
                <div className="pb-6">
                    <label className="text-sm font-black text-gray-700 mb-1.5 block">Telefone</label>
                    <input type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="Telefone" className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-purple-500 outline-none" />
                </div>
            </div>
          </div>
        </section>

        {/* Step 2: Payment */}
        <section className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-gray-100">
          <div className="px-6 pt-6 pb-6">
            <div className="bg-[#bdbdbd] text-white px-6 py-1 rounded-full w-fit flex items-center gap-3 mb-6">
                <span className="font-black text-sm">2</span>
                <h2 className="text-xs font-black uppercase tracking-widest">PAGAMENTO</h2>
            </div>
            
            <div className="bg-[#fcfcfc] border border-gray-100 rounded-lg p-4 mb-6">
                <div className="text-[11px] text-gray-500 font-medium space-y-4">
                    <p>01. Pagamento em segundos, sem complicações</p>
                    <p>02. Basta escanear, com o aplicativo do seu banco, o QRCode que iremos gerar sua compra</p>
                    <p>03. O PIX foi desenvolvido pelo Banco Central para facilitar suas compras e é 100% seguro.</p>
                </div>
            </div>

            <div className="px-1">
                <label className="text-sm font-black text-gray-700 mb-1.5 block">CPF ou CNPJ</label>
                <input type="tel" name="documento" value={formData.documento} onChange={handleChange} placeholder="CPF ou CNPJ" className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm focus:border-purple-500 outline-none" />
            </div>
          </div>
        </section>

        {/* Step 3: Order Bumps */}
        <section className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-gray-100">
          <div className="px-6 pt-6 pb-8">
            <div className="bg-[#bdbdbd] text-white px-6 py-1 rounded-full w-fit flex items-center gap-3 mb-6">
                <span className="font-black text-sm">3</span>
                <h2 className="text-xs font-black uppercase tracking-widest">COMPRE JUNTO</h2>
            </div>

            <div className="bg-[#78cc6d] text-white px-4 py-1 rounded-sm text-[11px] font-black uppercase w-fit mb-4 -ml-6 relative">
                APROVEITE!
                <div className="absolute top-full left-0 w-0 h-0 border-t-[6px] border-t-[#5a9c51] border-l-[6px] border-l-transparent"></div>
            </div>

            <p className="text-xs font-medium text-[#444] mb-6">
                <span className="font-bold text-[#111]">70% das pessoas</span> que compraram Relatório SpyGram Completo também se interessaram por:
            </p>

            <div className="space-y-4">
                {(Object.keys(bumps) as Array<keyof typeof bumps>).map((key) => (
                    <div 
                      key={key} 
                      onClick={() => handleToggleBump(key)}
                      className="bg-[#f7f7f7] border border-gray-100 rounded-2xl p-4 flex gap-4 shadow-sm cursor-pointer select-none active:scale-[0.98] transition-transform"
                    >
                        {/* Left: Image */}
                        <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center">
                            <img src={bumpDetails[key].img} alt="" className="w-full h-full object-contain pointer-events-none" />
                        </div>
                        
                        {/* Right: Content */}
                        <div className="flex-1 flex flex-col">
                            <div className="bg-[#f8f8f8] p-3 rounded-xl flex flex-col gap-2">
                                <input 
                                    type="checkbox" 
                                    checked={bumps[key]} 
                                    readOnly
                                    className="w-6 h-6 rounded border-gray-300 text-green-600 cursor-pointer self-start pointer-events-none" 
                                />
                                <p className="text-[10px] font-black text-gray-700 uppercase leading-tight">
                                    {bumpDetails[key].titlePart1}{' '}
                                    <span className="text-[#22c55e]">{bumpDetails[key].priceText}</span>
                                </p>
                            </div>
                            <p className="text-[11px] font-black text-[#f15c5c] mt-2 leading-tight">
                                {bumpDetails[key].desc}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 flex flex-col items-center">
                <button onClick={handleFinalize} className="w-full bg-[#78cc6d] hover:bg-[#6ab961] text-white py-4 px-8 rounded-xl font-black text-lg uppercase flex items-center justify-center gap-3 shadow-lg shadow-green-200 transition-all active:scale-[0.98]">
                    Finalizar Compra <ChevronRight className="w-5 h-5" />
                </button>
                <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-[#78cc6d] uppercase">
                    <ShieldCheck className="w-4 h-4" />
                    Pagamento 100% seguro, processado com criptografia 128bits.
                </div>
                <p className="mt-3 text-[10px] text-gray-400 font-medium text-center">
                    Produto digital, os dados para acesso serão enviados por email.
                </p>
            </div>
          </div>
        </section>

        {/* Resumo Mobile */}
        <section className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-gray-100">
          <div className="px-6 pt-6 pb-6">
            <div className="bg-[#bdbdbd] text-white px-6 py-1 rounded-full w-fit mx-auto flex items-center gap-3 mb-8">
                <h2 className="text-xs font-black uppercase tracking-widest">RESUMO DA COMPRA</h2>
            </div>
            
            <div className="flex flex-col items-center">
                <img src="/logoapp.png" alt="SpyGram" className="h-32 mb-6" />
                <h3 className="text-base font-black text-[#111] uppercase mb-1">Relatório SpyGram Completo</h3>
                <p className="text-[11px] text-gray-500 font-medium mb-8">Relatório Completo SpyGram® 🕵️ ✅</p>

                <div className="w-full space-y-4 pt-4">
                    <div className="flex justify-between text-xs font-medium text-gray-600">
                        <span>Relatório SpyGram Completo</span>
                        <span className="font-black">R$ {basePrice.toFixed(2).replace('.', ',')}</span>
                    </div>
                    {adicionais > 0 && (
                        <div className="flex justify-between text-xs font-medium text-gray-600">
                            <span>Adicionais</span>
                            <span className="font-black">+ R$ {adicionais.toFixed(2).replace('.', ',')}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center bg-[#fcfcfc] border border-gray-100 p-4 rounded-xl mt-4">
                        <span className="text-sm font-black text-[#111]">Total Hoje:</span>
                        <span className="text-sm font-black text-green-600">R$ {total.toFixed(2).replace('.', ',')}</span>
                    </div>
                </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer Branding Refinado */}
      <footer className="mt-20 border-t border-gray-200 pt-10 px-6 flex flex-col items-center max-w-lg mx-auto">
        <div className="text-center space-y-1 mb-8">
            <p className="text-xs font-bold text-gray-500">E-MAIL DE SUPORTE: contato@spygram.com.br</p>
        </div>

        <div className="bg-[#78cc6d] text-white py-2 px-6 rounded-sm text-[11px] font-black uppercase flex items-center gap-2 shadow-sm mb-10 relative">
            <div className="absolute bottom-full right-4 w-0 h-0 border-b-[6px] border-b-[#5a9c51] border-l-[6px] border-l-transparent"></div>
            <ShieldCheck className="w-5 h-5" /> COMPRA 100% SEGURA
        </div>
      </footer>
    </div>
  );
};

export default CheckoutPage;