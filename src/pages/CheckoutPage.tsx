import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ChevronRight, QrCode, ShieldCheck, Lock, Check, Clock, CreditCard, Mail, User, Phone, FileText } from 'lucide-react';
import SalesNotification from '../components/SalesNotification';
import PixPaymentDisplay from '../components/PixPaymentDisplay';
import { supabase } from '../integrations/supabase/client';
import toast from 'react-hot-toast';
import { trackLead } from '../services/trackingService';

const CHECKOUT_URL = 'https://go.perfectpay.com.br/PPU38CPUD1S';

const maskCPFOrCNPJ = (value: string) => {
  const v = value.replace(/\D/g, '');
  if (v.length <= 11) {
    return v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
  } else {
    return v.replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
  }
};

const maskPhone = (value: string) => {
  const v = value.replace(/\D/g, '');
  return v.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1');
};

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(240); // 4 minutos
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'boleto' | 'picpay'>('pix');
  
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
    window.scrollTo(0, 0);
  }, []);

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
    pro: { title: 'ACESSO VITALÍCIO PRO', price: 9.90, img: '/order-bumps/vitalicio.jpg', desc: 'Tenha acesso permanente a ferramenta SpyGram PRO!', checkText: 'ADQUIRIR TAMBÉM ACESSO VITALÍCIO AO SPYGRAM PRO ✅ À VISTA POR R$ 9,90' },
    social: { title: 'ESPIÃO SOCIAL COMPLETO', price: 19.90, img: '/order-bumps/social.jpg', desc: 'Tenha acesso a todas as redes sociais de quem você quiser!', checkText: 'ADQUIRIR TAMBÉM ESPIÃO INSTAGRAM + FACEBOOK + WHATSAPP À VISTA POR R$ 19,90' },
    recover: { title: 'RECUPERADOR DE MENSAGENS', price: 15.90, img: '/order-bumps/recover.jpg', desc: 'Recupere todas as mensagens apagadas do instagram!', checkText: 'ADQUIRIR TAMBÉM RECUPERADOR DE MENSAGENS APAGADAS À VISTA POR R$ 15,90' },
    track: { title: 'RASTREAMENTO 24H', price: 15.90, img: '/order-bumps/track.jpg', desc: 'Rastreie a pessoa que quiser usando somente o celular por tempo ilimitado! Saiba cada passo dela!', checkText: 'ADQUIRIR TAMBÉM RASTREAMENTO 24 HORAS À VISTA POR R$ 15,90' }
  };

  const adicionais = Object.keys(bumps).reduce((acc, key) => {
    return bumps[key as keyof typeof bumps] ? acc + (bumpDetails[key as keyof typeof bumpDetails]?.price || 0) : acc;
  }, 0);

  const total = basePrice + adicionais;

  const handleFinalize = async () => {
    if (!formData.nome || !formData.email || !formData.documento) {
        toast.error("Preencha todos os dados.");
        return;
    }

    if (paymentMethod !== 'pix') {
      window.location.href = CHECKOUT_URL;
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading("Gerando PIX...");

    const currentLeadId = sessionStorage.getItem('current_lead_id');
    const invasionDataRaw = sessionStorage.getItem('invasionData');
    const invasionData = invasionDataRaw ? JSON.parse(invasionDataRaw) : null;

    await trackLead({
      username_searched: invasionData?.profileData?.username,
      profile_pic: invasionData?.profileData?.profilePicUrl,
      email: formData.email,
      phone: formData.whatsapp,
      full_name: formData.nome,
      document: formData.documento,
      status: 'gerou_pix',
      amount: total
    });

    try {
        const { data, error } = await supabase.functions.invoke('royal-banking-payment', {
            body: { 
                name: formData.nome,
                email: formData.email,
                document: formData.documento,
                phone: formData.whatsapp,
                amount: total,
                leadId: currentLeadId
            },
        });

        if (error) throw error;

        if (data.paymentCode) {
            setPixData({
              paymentCode: data.paymentCode,
              paymentCodeBase64: data.paymentCodeBase64,
              idTransaction: data.idTransaction,
              amount: total,
              leadInfo: { 
                ...formData,
                username_searched: invasionData?.profileData?.username,
                profile_pic: invasionData?.profileData?.profilePicUrl
              }
            });
            toast.success("PIX Gerado!", { id: toastId });
        } else {
            window.location.href = CHECKOUT_URL;
        }

    } catch (err) {
        toast.error("Erro ao gerar PIX. Redirecionando...", { id: toastId });
        setTimeout(() => window.location.href = CHECKOUT_URL, 2000);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let maskedValue = value;
    if (name === 'documento') maskedValue = maskCPFOrCNPJ(value);
    else if (name === 'whatsapp') maskedValue = maskPhone(value);
    setFormData(prev => ({ ...prev, [name]: maskedValue }));
  };

  const toggleBump = (key: keyof typeof bumps) => {
    setBumps(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (pixData) {
    return (
      <div className="min-h-screen bg-[#f4f4f4] py-12 px-4">
        <PixPaymentDisplay 
          paymentCode={pixData.paymentCode}
          paymentCodeBase64={pixData.paymentCodeBase64}
          transactionId={pixData.idTransaction}
          amount={pixData.amount}
          leadData={pixData.leadInfo}
          onConfirm={() => toast.success("Aguardando confirmação...")}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4] text-[#333] font-sans pb-20">
      <SalesNotification />
      
      {/* Timer Header */}
      <div className="w-full bg-[#f15c5c] text-white py-3 px-4 flex flex-col items-center justify-center sticky top-0 z-50 shadow-md">
        <span className="text-[14px] font-black uppercase mb-1">{formatTimer(timeLeft)}</span>
        <div className="flex items-center gap-2">
           <Clock size={16} />
           <span className="text-[11px] font-bold uppercase tracking-tight">SUA VAGA ESTÁ GARANTIDA ENQUANTO ESTIVER NESSA PÁGINA!</span>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 flex flex-col items-center">
        
        {/* Adquirindo Card */}
        <div className="w-full bg-white rounded-xl shadow-sm p-4 flex items-center gap-4 mb-6 border border-gray-100">
           <div className="p-2 bg-gray-50 rounded-lg"><ShoppingCart size={20} className="text-gray-400" /></div>
           <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-gray-400">Você está adquirindo:</span>
              <span className="text-xs font-bold">Relatório SpyGram Completo</span>
           </div>
        </div>

        {/* Banner principal */}
        <img src="/banner-topo.png" alt="Banner" className="w-full h-auto mb-8 rounded-2xl shadow-lg" />

        {/* Form Container */}
        <div className="w-full space-y-8">
          
          {/* Section 1: Dados Pessoais */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="bg-gray-100/50 p-4 border-b border-gray-100 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white font-black">1</div>
                <h3 className="font-black text-gray-400 uppercase tracking-widest text-xs">Dados Pessoais</h3>
             </div>
             <div className="p-6 space-y-4">
                <div className="space-y-1">
                   <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Nome completo</label>
                   <input type="text" name="nome" value={formData.nome} onChange={handleChange} placeholder="Seu nome aqui" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#78cc6d] outline-none transition-all" />
                </div>
                <div className="space-y-1">
                   <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">E-mail</label>
                   <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="seu@email.com" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#78cc6d] outline-none transition-all" />
                </div>
                <div className="space-y-1">
                   <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Telefone</label>
                   <input type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="(21) 998510231" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#78cc6d] outline-none transition-all" />
                </div>
             </div>
          </div>

          {/* Section 2: Pagamento */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="bg-gray-100/50 p-4 border-b border-gray-100 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white font-black">2</div>
                <h3 className="font-black text-gray-400 uppercase tracking-widest text-xs">Pagamento</h3>
             </div>
             
             {/* Payment Tabs */}
             <div className="p-6">
                <div className="grid grid-cols-2 gap-2 mb-6">
                   <button onClick={() => setPaymentMethod('card')} className={`flex items-center gap-2 p-3 border-2 rounded-xl text-[10px] font-bold uppercase transition-all ${paymentMethod === 'card' ? 'border-[#78cc6d] bg-green-50' : 'border-gray-100'}`}>
                      <CreditCard size={18} className={paymentMethod === 'card' ? 'text-[#78cc6d]' : 'text-gray-400'} /> Cartão de Crédito
                   </button>
                   <button onClick={() => setPaymentMethod('boleto')} className={`flex items-center gap-2 p-3 border-2 rounded-xl text-[10px] font-bold uppercase transition-all ${paymentMethod === 'boleto' ? 'border-[#78cc6d] bg-green-50' : 'border-gray-100'}`}>
                      <FileText size={18} className={paymentMethod === 'boleto' ? 'text-[#78cc6d]' : 'text-gray-400'} /> Boleto
                   </button>
                   <button onClick={() => setPaymentMethod('pix')} className={`flex items-center justify-between p-3 border-2 rounded-xl text-[10px] font-bold uppercase transition-all ${paymentMethod === 'pix' ? 'border-[#78cc6d] bg-green-50' : 'border-gray-100'}`}>
                      <div className="flex items-center gap-2"><QrCode size={18} className={paymentMethod === 'pix' ? 'text-[#78cc6d]' : 'text-gray-400'} /> Pix</div>
                      {paymentMethod === 'pix' && <Check size={14} className="text-[#78cc6d]" />}
                   </button>
                   <button onClick={() => setPaymentMethod('picpay')} className={`flex items-center gap-2 p-3 border-2 rounded-xl text-[10px] font-bold uppercase transition-all ${paymentMethod === 'picpay' ? 'border-[#78cc6d] bg-green-50' : 'border-gray-100'}`}>
                      <img src="https://logodownload.org/wp-content/uploads/2018/05/picpay-logo.png" className="h-4" alt="PicPay" /> PicPay
                   </button>
                </div>

                {/* PIX Instructions */}
                {paymentMethod === 'pix' && (
                  <div className="space-y-4 mb-6">
                     <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-[11px] text-gray-500 space-y-3">
                        <p>01. Pagamento em segundos, sem complicações</p>
                        <p>02. Basta escanear, com o aplicativo do seu banco, o QRCode que iremos gerar sua compra</p>
                        <p>03. O PIX foi desenvolvido pelo Banco Central para facilitar suas compras e é 100% seguro.</p>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">CPF ou CNPJ</label>
                        <input type="text" name="documento" value={formData.documento} onChange={handleChange} placeholder="CPF ou CNPJ" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#78cc6d] outline-none transition-all" />
                     </div>
                  </div>
                )}
             </div>
          </div>

          {/* Section 3: Compre Junto */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="bg-gray-100/50 p-4 border-b border-gray-100 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white font-black">3</div>
                <h3 className="font-black text-gray-400 uppercase tracking-widest text-xs">Compre Junto</h3>
             </div>
             
             <div className="p-6">
                <div className="bg-[#78cc6d] text-white py-1.5 px-3 rounded-lg text-[10px] font-black uppercase inline-block mb-4">Aproveite!</div>
                <p className="text-xs font-bold mb-6 leading-tight">70% das pessoas que compraram <span className="text-gray-800">Relatório SpyGram Completo</span> também se interessaram por:</p>
                
                <div className="space-y-6">
                  {Object.entries(bumpDetails).map(([key, item]) => (
                    <div key={key} onClick={() => toggleBump(key as keyof typeof bumps)} className={`p-4 border border-gray-100 rounded-2xl transition-all cursor-pointer ${bumps[key as keyof typeof bumps] ? 'bg-green-50 border-[#78cc6d]' : 'bg-[#fcfcfc]'}`}>
                       <div className="flex items-start gap-4 mb-4">
                          <img src={item.img} className="w-20 h-20 rounded-xl object-cover shadow-sm" alt="Order Bump" />
                          <div className="flex-1">
                             <div className="flex justify-between items-start">
                                <p className="text-[10px] font-black leading-tight text-gray-600 uppercase max-w-[140px]">{item.checkText}</p>
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${bumps[key as keyof typeof bumps] ? 'bg-[#78cc6d] border-[#78cc6d]' : 'bg-white border-gray-300'}`}>
                                   {bumps[key as keyof typeof bumps] && <Check size={12} className="text-white" />}
                                </div>
                             </div>
                             <p className="text-[11px] font-black text-[#78cc6d] mt-2">POR R$ {item.price.toFixed(2).replace('.', ',')}</p>
                          </div>
                       </div>
                       <p className="text-[10px] text-red-500 font-bold leading-tight">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <button onClick={handleFinalize} disabled={isProcessing} className="w-full mt-8 bg-[#78cc6d] hover:bg-[#6ab961] text-white py-4 rounded-xl font-black text-base uppercase shadow-lg shadow-green-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                   {isProcessing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Finalizar Compra <ChevronRight size={18} /></>}
                </button>
                
                <div className="flex flex-col items-center gap-2 mt-4">
                   <div className="flex items-center gap-2 text-[10px] font-bold text-green-600">
                      <Lock size={12} /> Pagamento 100% seguro, processado com criptografia 128bits.
                   </div>
                   <p className="text-[9px] text-gray-400 text-center leading-tight">Produto digital, os dados para acesso serão enviados por email.</p>
                </div>
             </div>
          </div>

          {/* Section: Resumo da Compra */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="bg-gray-100/50 p-4 border-b border-gray-100 flex items-center gap-4">
                <h3 className="font-black text-gray-400 uppercase tracking-widest text-xs">Resumo da Compra</h3>
             </div>
             <div className="p-8 flex flex-col items-center">
                <img src="/spygram_transparentebranco.png" className="h-24 brightness-0 opacity-80 mb-8" alt="SpyGram Logo" />
                <div className="w-full border-t border-gray-100 pt-6">
                   <div className="flex justify-between items-center mb-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-800">Relatório SpyGram Completo</span>
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Relatório Completo SpyGram® 🕵️ ✅</span>
                      </div>
                      <span className="text-sm font-bold text-gray-400">R$ 29,90</span>
                   </div>
                   
                   {/* Itens adicionais no resumo */}
                   {Object.entries(bumps).map(([key, isActive]) => isActive && (
                     <div key={key} className="flex justify-between items-center mb-4 animate-fade-in">
                       <span className="text-sm font-black text-gray-800">{bumpDetails[key as keyof typeof bumpDetails].title}</span>
                       <span className="text-sm font-bold text-gray-400">R$ {bumpDetails[key as keyof typeof bumpDetails].price.toFixed(2).replace('.', ',')}</span>
                     </div>
                   ))}

                   <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center mt-6">
                      <span className="text-xs font-black text-gray-400 uppercase">Total Hoje:</span>
                      <span className="text-base font-black text-[#78cc6d]">R$ {total.toFixed(2).replace('.', ',')}</span>
                   </div>
                </div>
             </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="mt-12 w-full space-y-6 text-center">
           <p className="text-[11px] font-bold text-gray-400">E-MAIL DE SUPORTE: contato@spygram.com.br</p>
           <div className="bg-[#78cc6d] text-white py-2 px-4 rounded-lg inline-flex items-center gap-2 text-xs font-black uppercase">
              <Check size={14} /> COMPRA 100% SEGURA
           </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;