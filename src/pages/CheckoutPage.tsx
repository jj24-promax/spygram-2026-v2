import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ChevronRight, QrCode, ShieldCheck, Lock, Check, Clock, CreditCard, Mail, User, Phone, FileText, Star } from 'lucide-react';
import SalesNotification from '../components/SalesNotification';
import PixPaymentDisplay from '../components/PixPaymentDisplay';
import CheckoutHero from '../components/CheckoutHero';
import CheckoutSidebar from '../components/CheckoutSidebar';
import CheckoutSummaryMobile from '../components/CheckoutSummaryMobile';
import PaymentSuccessDisplay from '../components/PaymentSuccessDisplay';
import { supabase } from '../integrations/supabase/client';
import toast from 'react-hot-toast';
import { trackLead } from '../services/trackingService';
import { trackFacebookEvent } from '../services/facebookService'; 
import { addUtmsToUrl } from '../utils/utm'; // Importando propagação de UTMs

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
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  
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
  }, [pixData, paymentConfirmed]);

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

  const basePrice = 37.90; 
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

  // Disparo de InitiateCheckout Inicial
  useEffect(() => {
    trackFacebookEvent('InitiateCheckout', {}, { value: total });
  }, []);

  const handleFinalize = async () => {
    if (!formData.nome || !formData.email || !formData.confirmarEmail || !formData.documento) {
        toast.error("Preencha todos os dados.");
        return;
    }

    if (formData.email.trim().toLowerCase() !== formData.confirmarEmail.trim().toLowerCase()) {
        toast.error("Os e-mails não coincidem.");
        return;
    }

    setIsProcessing(true);
    const toastId = toast.loading("Gerando PIX...");

    const currentLeadId = sessionStorage.getItem('current_lead_id');
    const invasionDataRaw = sessionStorage.getItem('invasionData');
    const invasionData = invasionDataRaw ? JSON.parse(invasionDataRaw) : null;

    // Constrói lista exata de itens comprados
    const purchasedItems = [
      'Relatório SpyGram 🕵️',
      ...Object.keys(bumps)
        .filter(k => bumps[k as keyof typeof bumps])
        .map(k => bumpDetails[k as keyof typeof bumpDetails].title)
    ];

    // Disparar InitiateCheckout enriquecido com email e whatsapp para excelente taxa de correspondência
    trackFacebookEvent('InitiateCheckout', {
      email: formData.email,
      phone: formData.whatsapp
    }, {
      value: total,
      currency: 'BRL'
    });

    try {
        const { data, error } = await supabase.functions.invoke('royal-banking-payment', {
            body: { 
                name: formData.nome,
                email: formData.email,
                document: formData.documento,
                phone: formData.whatsapp,
                amount: total,
                leadId: currentLeadId,
                items: purchasedItems
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
            // Se houver redirecionamento forçado, anexa as UTMs para passar ao PerfectPay
            window.location.href = addUtmsToUrl(CHECKOUT_URL);
        }

    } catch (err) {
        toast.error("Erro ao gerar PIX. Redirecionando...");
        // Se falhar e precisar de redirecionamento de emergência, anexa as UTMs
        setTimeout(() => window.location.href = addUtmsToUrl(CHECKOUT_URL), 2000);
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

  if (paymentConfirmed) {
    return (
      <div className="min-h-screen bg-[#f4f4f4] py-12 px-4 flex items-center justify-center">
        <PaymentSuccessDisplay email={formData.email} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4] text-[#333] font-sans pb-20">
      <SalesNotification />
      
      {/* BARRA DE URGÊNCIA */}
      <div className="w-full bg-[#f15c5c] text-white py-3 px-4 flex flex-col items-center justify-center sticky top-0 z-50 shadow-md">
        <span className="text-[14px] font-black uppercase mb-1">{formatTimer(timeLeft)}</span>
        <div className="flex items-center gap-2">
           <Clock size={16} />
           <span className="text-[11px] font-bold uppercase tracking-tight">SUA VAGA ESTÁ GARANTIDA ENQUANTO ESTIVER NESSA PÁGINA!</span>
        </div>
      </div>

      <CheckoutHero />

      {/* BANNER MOBILE */}
      {!pixData && (
        <div className="w-full overflow-hidden shadow-lg mb-6 md:hidden relative flex items-center justify-center">
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center scale-[1.35] blur-[15px] opacity-70"
            style={{ backgroundImage: 'url(/banner-topo.png)' }}
          />
          <img src="/banner-topo.png" alt="Banner" className="relative z-10 w-full h-auto block" />
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 flex flex-col lg:flex-row gap-10 items-start">
        <div className="flex-1 w-full space-y-8">
          
          {/* CONTEÚDO DINÂMICO: FORMULÁRIO OU PIX */}
          {pixData ? (
            <div className="animate-fade-in">
              <PixPaymentDisplay 
                paymentCode={pixData.paymentCode}
                paymentCodeBase64={pixData.paymentCodeBase64}
                transactionId={pixData.idTransaction}
                amount={pixData.amount}
                leadData={pixData.leadInfo}
                onSuccess={() => setPaymentConfirmed(true)}
                onConfirm={async () => {
                  const leadId = sessionStorage.getItem('current_lead_id');
                  const { data } = await supabase.from('leads').select('status').eq('id', leadId).single();
                  if (data?.status === 'pagou') {
                    setPaymentConfirmed(true);
                  } else {
                    toast.error("Pagamento ainda não identificado.");
                  }
                }}
              />
            </div>
          ) : (
            <>
              <div className="w-full mb-6 overflow-hidden rounded-2xl shadow-lg">
                 <img src="/banner-checkout-final.jpg" alt="Finalize sua compra" className="w-full h-auto block" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-fit">
                  <div className="bg-gray-200/50 p-4 border-b border-gray-100 flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white font-black text-sm">1</div>
                      <h3 className="font-black text-gray-400 uppercase tracking-widest text-[10px]">Dados Pessoais</h3>
                  </div>
                  <div className="p-6 space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Nome completo</label>
                        <input type="text" name="nome" value={formData.nome} onChange={handleChange} placeholder="Seu nome aqui" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#78cc6d] outline-none transition-all" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">E-mail</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="seu@email.com" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#78cc6d] outline-none transition-all" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Confirme seu e-mail</label>
                        <input type="email" name="confirmarEmail" value={formData.confirmarEmail} onChange={handleChange} placeholder="Repita seu e-mail" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#78cc6d] outline-none transition-all" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Telefone</label>
                        <input type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="(21) 998510231" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#78cc6d] outline-none transition-all" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">CPF ou CNPJ</label>
                        <input type="text" name="documento" value={formData.documento} onChange={handleChange} placeholder="Digite seu documento" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#78cc6d] outline-none transition-all" />
                      </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gray-200/50 p-4 border-b border-gray-100 flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white font-black text-sm">2</div>
                      <h3 className="font-black text-gray-400 uppercase tracking-widest text-[10px]">Pagamento</h3>
                  </div>
                  
                  <div className="p-6">
                      <div className="flex flex-wrap gap-2 mb-6">
                        <div className="w-full p-3 border-2 border-[#78cc6d] bg-green-50 rounded-xl text-[10px] font-black uppercase flex flex-col items-center gap-1 text-[#78cc6d]">
                           <QrCode size={18} /> Pix
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-[9px] text-gray-500 space-y-2 uppercase font-bold tracking-tight">
                            <p>01. Pagamento em segundos, sem complicações</p>
                            <p>02. Basta escanear, com o aplicativo do seu banco, o QRCode que iremos gerar sua compra</p>
                            <p>03. O PIX foi desenvolvido pelo Banco Central para facilitar suas compras e é 100% seguro.</p>
                        </div>
                      </div>
                  </div>
                </div>
              </div>

              {/* ORDER BUMPS */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                 <div className="bg-gray-200/50 p-4 border-b border-gray-100 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white font-black text-sm">3</div>
                    <h3 className="font-black text-gray-400 uppercase tracking-widest text-[10px]">Compre Junto</h3>
                 </div>
                 
                 <div className="p-8">
                    <div className="bg-[#78cc6d] text-white py-1 px-3 rounded-lg text-[9px] font-black uppercase inline-block mb-4">Aproveite!</div>
                    <p className="text-xs font-bold mb-8 leading-tight">70% das pessoas que compraram <span className="text-gray-800">Relatório SpyGram Completo</span> também se interessaram por:</p>
                    
                    <div className="space-y-6">
                      {Object.entries(bumpDetails).map(([key, item]) => (
                        <div key={key} onClick={() => toggleBump(key as keyof typeof bumps)} className={`p-5 border border-gray-100 rounded-2xl transition-all cursor-pointer ${bumps[key as keyof typeof bumps] ? 'bg-green-50 border-[#78cc6d]' : 'bg-[#fcfcfc]'}`}>
                           <div className="flex items-start gap-4 mb-4">
                              <img src={item.img} className="w-24 h-24 rounded-2xl object-cover shadow-sm flex-shrink-0" alt="Order Bump" />
                              <div className="flex-1 min-w-0">
                                 <div className="flex justify-between items-start gap-2">
                                    <p className="text-[10px] font-black leading-tight text-gray-600 uppercase flex-1">{item.checkText}</p>
                                    <div className={`w-6 h-6 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${bumps[key as keyof typeof bumps] ? 'bg-[#78cc6d] border-[#78cc6d]' : 'bg-white border-gray-300'}`}>
                                       {bumps[key as keyof typeof bumps] && <Check size={14} className="text-white" />}
                                    </div>
                                 </div>
                                 <p className="text-[11px] font-black text-[#78cc6d] mt-2">POR R$ {item.price.toFixed(2).replace('.', ',')}</p>
                              </div>
                           </div>
                           <p className="text-[10px] text-red-500 font-bold leading-tight">{item.desc}</p>
                        </div>
                      ))}
                    </div>

                    <button onClick={handleFinalize} disabled={isProcessing} className="w-full mt-10 bg-[#78cc6d] hover:bg-[#6ab961] text-white py-5 rounded-2xl font-black text-lg uppercase shadow-lg shadow-green-500/20 active:scale-95 transition-all flex items-center justify-center gap-3">
                       {isProcessing ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Finalizar Compra <ChevronRight size={22} /></>}
                    </button>
                    
                    <div className="flex flex-col items-center gap-3 mt-6">
                       <div className="flex items-center gap-3 text-[11px] font-bold text-green-600">
                          <Lock size={14} /> Pagamento 100% seguro, processado com criptografia 128bits.
                       </div>
                       <p className="text-[10px] text-gray-400 text-center leading-tight">Produto digital, os dados para acesso serão enviados por email.</p>
                    </div>
                 </div>
              </div>
            </>
          )}

          {/* RESUMO MOBILE (DINÂMICO) */}
          <CheckoutSummaryMobile 
            total={total} 
            basePrice={basePrice} 
            selectedBumps={bumps} 
            bumpDetails={bumpDetails} 
          />
        </div>

        {/* SIDEBAR DESKTOP */}
        <CheckoutSidebar 
          total={total} 
          basePrice={basePrice} 
          selectedBumps={bumps} 
          bumpDetails={bumpDetails} 
        />
      </div>

      {/* RODAPÉ DE SUPORTE (FIXO NA PÁGINA) */}
      <div className="max-w-6xl mx-auto px-4 mt-16 space-y-12">
        <div className="w-full bg-white border border-gray-100 rounded-2xl py-6 px-10 flex flex-col md:flex-row justify-between items-center gap-8 shadow-sm">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">E-MAIL DE SUPORTE: contato@spygram.com.br</p>
           <div className="flex items-center gap-8">
              <div className="bg-[#78cc6d] text-white py-2 px-6 rounded-full inline-flex items-center gap-3 text-[10px] font-black uppercase shadow-sm">
                <ShieldCheck size={16} /> COMPRA 100% SEGURA
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;