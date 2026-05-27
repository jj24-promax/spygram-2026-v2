import React, { useState, useEffect } from 'react';
import { Zap, Infinity, Star, Check, ShieldAlert, Search, Sparkles, Coins, Eye, ShieldCheck, X, User, Mail, CreditCard, Phone, QrCode, Terminal } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../integrations/supabase/client';
import PixPaymentDisplay from '../components/PixPaymentDisplay';
import { trackLead } from '../services/trackingService';
import { useNavigate } from 'react-router-dom';
import { fetchProfileData } from '../services/profileService';

interface CreditPackage {
  id: number;
  amount: number | string;
  title: string;
  price: string;
  numericPrice: number;
  description: string;
  checkoutUrl: string;
  icon: React.ElementType;
  highlight?: boolean;
  features: string[];
}

const CreditsPage: React.FC = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<'idle' | 'searching' | 'firewall_lock' | 'upsell_data_recovery' | 'error' | 'success'>('idle');
  const [targetUsername, setTargetUsername] = useState('');
  const [searchLogs, setSearchLogs] = useState<string[]>([]);
  const [isPaidUser, setIsPaidUser] = useState<boolean>(false);
  const [hasCredits, setHasCredits] = useState<boolean>(false);
  
  // Dados do lead logado para reutilização automática (One-Click)
  const [leadDetails, setLeadDetails] = useState<{
    id: string;
    full_name: string;
    email: string;
    document: string;
    phone: string;
  } | null>(null);

  // Estados para o Checkout PIX (Pacotes de Créditos Comuns)
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [pixResult, setPixResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    documento: '',
    whatsapp: ''
  });

  const creditPackages: CreditPackage[] = [
    {
      id: 1,
      amount: 10,
      title: "PROTOCOLO LITE",
      price: "R$ 49,50",
      numericPrice: 49.50,
      description: "Infiltração básica para monitoramento rápido.",
      checkoutUrl: "https://checkout.perfectpay.com.br/pay/PPU38COTFU1",
      icon: Zap,
      features: ['Acesso a Mensagens Diretas', 'Ver Fotos do Feed Privado', 'Invisibilidade 100% Garantida', 'Suporte Técnico']
    },
    {
      id: 2,
      amount: 30,
      title: "PROTOCOLO ELITE",
      price: "R$ 79,50",
      numericPrice: 79.50,
      description: "Vigilância avançada com recuperação de arquivos.",
      checkoutUrl: "https://checkout.perfectpay.com.br/pay/PPU38COTFU6",
      icon: Star,
      highlight: true,
      features: ['Tudo do Protocolo Lite', 'Recuperar Mensagens Apagadas', 'Localização GPS em Tempo Real', 'Ver Fotos Temporárias', 'Acesso ao Close Friends']
    },
    {
      id: 3,
      amount: "Ilimitados",
      title: "DOMINAÇÃO TOTAL",
      price: "R$ 149,00",
      numericPrice: 149.00,
      description: "Controle absoluto e permanente sem restrições.",
      checkoutUrl: "https://checkout.perfectpay.com.br/pay/PPU38COTFU8",
      icon: Infinity,
      features: ['Acesso Vitalício', 'Recuperar TODO o Histórico', 'Monitorar Vários Perfis', 'Notificações em Tempo Real', 'Rastreamento por Placa']
    },
  ];

  // Verifica se o usuário possui créditos de pacotes de créditos comprados
  useEffect(() => {
    const checkPayment = async () => {
      const email = sessionStorage.getItem('logged_in_email');
      if (!email) return;
      try {
        const { data: leadsData } = await supabase
          .from('leads')
          .select('id, status, full_name, email, document, phone')
          .eq('email', email.trim().toLowerCase())
          .order('created_at', { ascending: false })
          .limit(1);

        if (leadsData && leadsData.length > 0) {
          const lead = leadsData[0];
          const paid = lead.status === 'pagou';
          setIsPaidUser(paid);
          
          // Salva os dados do lead logado para uso automático (One-Click Buy)
          setLeadDetails({
            id: lead.id,
            full_name: lead.full_name || '',
            email: lead.email || '',
            document: lead.document || '',
            phone: lead.phone || ''
          });

          if (paid) {
            const { data: edgeData, error: edgeError } = await supabase.functions.invoke('manage-credits', {
              body: { leadId: lead.id, action: 'get' }
            });

            if (!edgeError && edgeData) {
              const paymentsData = edgeData.payments || [];
              const successStatuses = ['paid', 'saquepago', 'approved', 'success', 'pago'];
              const hasValidCreditPayment = paymentsData.some((p: any) => {
                const isSuccess = successStatuses.includes(String(p.status).toLowerCase());
                const payAmt = Number(p.payload?.amount) || 0;
                return isSuccess && (payAmt === 49.50 || payAmt === 79.50 || payAmt === 149.00);
              });

              setHasCredits(hasValidCreditPayment);
            } else {
              setHasCredits(false);
            }
          } else {
            setHasCredits(false);
          }
        }
      } catch (e) {
        console.error("Erro ao validar créditos:", e);
        setHasCredits(false);
      }
    };
    checkPayment();
  }, []);

  const handleStartInvasion = () => {
    if (!targetUsername.trim()) {
      toast.error("Insira o @ do alvo.");
      return;
    }
    setStage('searching');
    setSearchLogs([]);
  };

  useEffect(() => {
    if (stage === 'searching') {
      const cleanUser = targetUsername.replace(/^@+/, '').trim();
      const logs = hasCredits 
        ? [
            `Estabelecendo ponte segura de criptografia com Instagram...`,
            `Alvo identificado: @${cleanUser}`,
            `Injetando exploit do SpyGram no servidor central da Meta...`,
            `Quebrando chaves de criptografia RSA-2048 do banco de dados...`,
            `[SUCESSO] 42 Conversas secretas recuperadas com êxito!`,
            `[SUCESSO] 14 Fotos deletadas do direct restauradas!`,
            `[SUCESSO] Localização via GPS do Alvo interceptada!`,
            `⚠️ INSTABILIDADE DE IP DETECTADA: O Firewall da Meta bloqueou o download das mídias.`,
            `⚠️ ALERTA: Desvio do Firewall necessário para que o Alvo não receba alertas de segurança.`
          ]
        : [
            `Estabelecendo ponte segura de criptografia com Instagram...`,
            `Alvo identificado: @${cleanUser}`,
            `Injetando exploit do SpyGram no servidor central da Meta...`,
            `Verificando credenciais e créditos do operador...`,
            `ERRO CRÍTICO: Chave de acesso SpyGram sem créditos para novo alvo.`,
            `SISTEMA: Operação interrompida por falta de saldo de recarga.`
          ];

      let currentLog = 0;
      const interval = setInterval(() => {
        if (currentLog < logs.length) {
          const nextLog = logs[currentLog];
          if (nextLog) {
            setSearchLogs(prev => [...prev, nextLog]);
          }
          currentLog++;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            if (hasCredits) {
              setStage('firewall_lock');
              toast.error("DOWNLOAD BLOQUEADO PELO FIREWALL DA META", {
                duration: 5000,
                style: { background: '#ef4444', color: '#fff', fontWeight: 'bold' }
              });
            } else {
              setStage('error');
              toast.error("SISTEMA: CRÉDITOS INSUFICIENTES", { 
                  style: { background: '#ef4444', color: '#fff', fontWeight: 'bold' } 
              });
            }
          }, 1000);
        }
      }, 1200);

      return () => clearInterval(interval);
    }
  }, [stage, targetUsername, hasCredits]);

  const handlePackageSelection = (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
    setShowCheckoutModal(true);
  };

  const runRealInvasionRelease = async () => {
    try {
      const fetchResult = await fetchProfileData(targetUsername.trim());
      const invasionData = {
        profileData: fetchResult.profile,
        suggestedProfiles: fetchResult.suggestions,
        posts: fetchResult.posts,
      };
      sessionStorage.setItem('invasionData', JSON.stringify(invasionData));
      localStorage.setItem('spygram_active_invasion', JSON.stringify(invasionData));
      navigate('/instagram');
    } catch (e) {
      navigate('/');
    }
  };

  // ONE-CLICK BUY: Função para gerar PIX instantâneo (Firewall e Upsell) usando os dados do Lead Logado
  const handleBypassPayment = async (type: 'firewall' | 'upsell') => {
    if (!leadDetails) {
      toast.error("Sua sessão inspirou. Faça login novamente para prosseguir.");
      return;
    }

    setIsGeneratingPix(true);
    const toastId = toast.loading("Gerando seu PIX de liberação...");

    const amountToCharge = type === 'upsell' ? 9.90 : 19.90;
    const purchasedItems = type === 'upsell' 
      ? ['Resgate de Dados Apagados 🗑️'] 
      : ['Firewall Bypass SSL 🛡️'];
    const status = type === 'upsell' ? 'gerou_pix_upsell_dados' : 'gerou_pix_firewall';

    // Fallbacks simples caso faltem dados no banco de dados para evitar erro na API do Banco
    const safeDocument = leadDetails.document || '00000000000';
    const safePhone = leadDetails.phone || '11999999999';
    const safeName = leadDetails.full_name || leadDetails.email || 'Cliente SpyGram';

    try {
      await trackLead({
        full_name: safeName,
        email: leadDetails.email,
        phone: safePhone,
        document: safeDocument,
        status: status,
        amount: amountToCharge
      });

      const { data, error } = await supabase.functions.invoke('royal-banking-payment', {
        body: { 
          name: safeName,
          email: leadDetails.email,
          document: safeDocument,
          phone: safePhone,
          amount: amountToCharge,
          leadId: leadDetails.id,
          items: purchasedItems
        },
      });

      if (error || !data.paymentCode) throw new Error('Falha ao gerar pagamento');

      setPixResult({
        paymentCode: data.paymentCode,
        paymentCodeBase64: data.paymentCodeBase64,
        idTransaction: data.idTransaction,
        amount: amountToCharge
      });

      toast.success("PIX Gerado com sucesso!", { id: toastId });
    } catch (err) {
      toast.error("Erro no servidor. Tente novamente.", { id: toastId });
    } finally {
      setIsGeneratingPix(false);
    }
  };

  const handleGeneratePix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.email || !formData.documento) {
      toast.error("Preencha todos os campos.");
      return;
    }

    setIsGeneratingPix(true);
    const toastId = toast.loading("Gerando seu PIX...");

    const amountToCharge = selectedPackage?.numericPrice || 49.50;
    const purchasedItems = [`Recarga: ${selectedPackage?.title} 🪙`];

    try {
      const currentLeadId = sessionStorage.getItem('current_lead_id');
      
      await trackLead({
        full_name: formData.nome,
        email: formData.email,
        phone: formData.whatsapp,
        document: formData.documento,
        status: 'gerou_pix_creditos',
        amount: amountToCharge
      });

      const { data, error } = await supabase.functions.invoke('royal-banking-payment', {
        body: { 
          name: formData.nome,
          email: formData.email,
          document: formData.documento,
          phone: formData.whatsapp,
          amount: amountToCharge,
          leadId: currentLeadId,
          items: purchasedItems
        },
      });

      if (error || !data.paymentCode) throw new Error('Falha ao gerar pagamento');

      setPixResult({
        paymentCode: data.paymentCode,
        paymentCodeBase64: data.paymentCodeBase64,
        idTransaction: data.idTransaction,
        amount: amountToCharge
      });

      toast.success("PIX Gerado com sucesso!", { id: toastId });
    } catch (err) {
      toast.error("Erro no servidor. Tente novamente.", { id: toastId });
    } finally {
      setIsGeneratingPix(false);
    }
  };

  const maskCPF = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length <= 11) {
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return v;
  };

  if (pixResult) {
    return (
      <div className="min-h-screen bg-[#0f0f12] flex flex-col items-center justify-center p-4">
        <PixPaymentDisplay 
          paymentCode={pixResult.paymentCode}
          paymentCodeBase64={pixResult.paymentCodeBase64}
          transactionId={pixResult.idTransaction}
          amount={pixResult.amount}
          onConfirm={() => toast.success("Aguardando confirmação do banco...")}
          onSuccess={() => {
            if (pixResult.amount === 19.90) {
              setPixResult(null);
              setStage('upsell_data_recovery');
              toast.success("Firewall Desativado! Oferta especial liberada.");
            } else if (pixResult.amount === 9.90) {
              setPixResult(null);
              runRealInvasionRelease();
            } else {
              setPixResult(null);
              window.location.reload();
            }
          }}
        />
        <button 
          onClick={() => setPixResult(null)}
          className="mt-8 text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest"
        >
          Voltar para o Painel
        </button>
      </div>
    );
  }

  const cleanTargetUsername = targetUsername.replace(/^@+/, '').trim();

  return (
    <div className="min-h-screen bg-transparent text-white font-sans overflow-x-hidden selection:bg-blue-500/30">
      
      {/* Modal de Checkout (Para Pacotes de Crédito Comuns) */}
      <AnimatePresence>
        {showCheckoutModal && selectedPackage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0f0f12] border border-white/10 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Finalizar Recarga</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{selectedPackage.title}</p>
                  </div>
                  <button onClick={() => setShowCheckoutModal(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X size={20} /></button>
                </div>

                <form onSubmit={handleGeneratePix} className="space-y-4">
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                      type="text" 
                      placeholder="NOME COMPLETO"
                      required
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-xs font-bold outline-none focus:border-blue-500 transition-all uppercase"
                    />
                  </div>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                      type="email" 
                      placeholder="E-MAIL"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-xs font-bold outline-none focus:border-blue-500 transition-all lowercase"
                    />
                  </div>
                  <div className="relative group">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                      type="text" 
                      placeholder="CPF"
                      required
                      value={formData.documento}
                      onChange={(e) => setFormData({...formData, documento: maskCPF(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-xs font-bold outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                      type="tel" 
                      placeholder="WHATSAPP"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-xs font-bold outline-none focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div className="py-6 border-t border-white/5 mt-6">
                    <div className="flex justify-between items-center mb-6">
                       <span className="text-xs font-bold text-gray-500 uppercase">Total:</span>
                       <span className="text-2xl font-black text-white">{selectedPackage.price}</span>
                    </div>
                    
                    <button 
                      type="submit"
                      disabled={isGeneratingPix}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
                    >
                      {isGeneratingPix ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><QrCode size={18} /> GERAR PIX AGORA</>}
                    </button>
                  </div>
                </form>

                <div className="flex items-center justify-center gap-2 mt-2">
                  <ShieldCheck className="w-3 h-3 text-green-500" />
                  <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">Pagamento 100% Criptografado</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="relative z-10 max-w-xl mx-auto px-6 py-12 flex flex-col items-center">
        
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-8">
           <div className="p-3 bg-black/60 border border-white/10 rounded-2xl mb-4 shadow-2xl">
              <img src="/spygram_transparentebranco.png" alt="SpyGram" className="h-10 w-auto" />
           </div>
           <h1 className="text-2xl font-black tracking-tighter uppercase">
             Spy<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Gram</span>
           </h1>
           <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mt-1">SISTEMA DE VIGILÂNCIA</p>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full p-1 mb-12 shadow-2xl">
           <div className="flex flex-col items-end px-4 py-1">
              <div className="flex items-center gap-1">
                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Créditos</span>
                <Coins className="w-2.5 h-2.5 text-yellow-500" />
              </div>
              <span className="text-sm font-black tabular-nums">{hasCredits ? 'Ativo' : '0'}</span>
           </div>
           <div className="w-px h-6 bg-white/10 mx-1"></div>
           <div className="flex items-center gap-3 pl-1 pr-4 py-1">
              <div className="w-8 h-8 rounded-full bg-gray-800 border border-white/10 overflow-hidden grayscale opacity-30">
                 <img src="/perfil.jpg" alt="User" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black tracking-tight">OPERADOR-403</span>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[7px] font-black text-green-500 uppercase tracking-widest">ONLINE</span>
                </div>
              </div>
           </div>
        </div>

        <AnimatePresence mode="wait">
          {stage === 'idle' && (
            <motion.div 
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full text-center"
            >
              <h2 className="text-4xl sm:text-5xl font-black mb-4 leading-tight tracking-tighter uppercase">
                VIGILÂNCIA <span className="text-[#3b82f6]">TOTAL</span>
              </h2>
              <p className="text-gray-300 text-lg font-bold mb-10 max-w-md mx-auto leading-tight">
                Extraia conversas secretas, fotos apagadas e localização exata. <span className="text-blue-500">A verdade está a um clique.</span>
              </p>
              
              <div className="space-y-6 w-full max-w-md mx-auto">
                <div className="relative group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#3b82f6] transition-colors" />
                  <input 
                    type="text" 
                    placeholder="DIGITE O @ DO ALVO"
                    value={targetUsername}
                    onChange={(e) => setTargetUsername(e.target.value.replace(/@/g, ''))}
                    className="w-full bg-black/60 border border-white/10 rounded-full py-5 pl-14 pr-6 text-white outline-none focus:border-[#3b82f6]/50 transition-all font-black tracking-widest uppercase text-sm shadow-inner"
                  />
                </div>

                <button 
                  onClick={handleStartInvasion}
                  className="w-full h-16 rounded-full flex items-center justify-center gap-3 bg-gradient-to-r from-[#2563eb] to-[#4f46e5] hover:brightness-110 transition-all active:scale-95 shadow-xl shadow-blue-600/30"
                >
                  <Eye className="w-5 h-5 text-white" />
                  <span className="text-white font-black text-sm uppercase tracking-widest">EXPOR VERDADE AGORA</span>
                </button>
              </div>
            </motion.div>
          )}

          {stage === 'searching' && (
            <motion.div 
              key="searching"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full bg-black/80 border border-white/10 rounded-[2rem] p-6 font-mono text-left max-w-md mx-auto shadow-2xl relative"
            >
              <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-4">
                <Terminal className="w-4 h-4 text-purple-400" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Terminal de Infiltração</span>
              </div>
              <div className="space-y-3 min-h-[160px]">
                {searchLogs.map((log, idx) => {
                  if (!log) return null;
                  const isError = log.includes('ERRO') || log.includes('⚠️');
                  return (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`text-xs ${isError ? 'text-red-400 font-bold animate-pulse' : 'text-purple-300'}`}
                    >
                      {log.startsWith('SPY') || log.startsWith('ESTA') || log.startsWith('ALVO') ? '[+]' : '[-]'} {log}
                    </motion.div>
                  );
                })}
              </div>
              <div className="mt-8 flex justify-center">
                 <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </motion.div>
          )}

          {stage === 'firewall_lock' && (
            <motion.div
              key="firewall_lock"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md bg-[#0c0d12]/95 border-2 border-red-500/30 rounded-[2.5rem] p-8 text-center shadow-[0_0_50px_rgba(239,68,68,0.15)] relative overflow-hidden"
            >
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-500/10 blur-[80px] rounded-full" />
              
              <div className="relative w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-md animate-pulse" />
                <ShieldAlert className="relative w-8 h-8 text-red-500" />
              </div>

              <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">
                Firewall Detectado (META)
              </h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-6">Protocolo de Bloqueio Ativo</p>

              <div className="bg-black/60 border border-white/5 rounded-2xl p-4 font-mono text-left text-[11px] text-red-400/90 leading-relaxed mb-6 space-y-2">
                 <p className="text-gray-400 border-b border-white/5 pb-2 mb-2 font-bold">[SPYGRAM INJECTOR ENGINE 4.0]</p>
                 <p className="font-bold">STATUS DA CONTA: @{cleanTargetUsername} [EXTRAÍDO]</p>
                 <p>CONVERSAS SECRETA: 42 Recuperadas [Bloqueado]</p>
                 <p>FOTOS APAGADAS: 14 Mídias [Bloqueado]</p>
                 <p>GPS RASTREADO: Coordenadas Gravadas [Bloqueado]</p>
                 <p className="text-white border-t border-white/5 pt-2 mt-2">CÓDIGO DO ERRO: 403-META-SECURITY-BYPASS-REQUIRED</p>
              </div>

              <p className="text-gray-300 text-sm leading-relaxed mb-6 font-medium text-left">
                Os dados de espionagem do alvo foram extraídos com sucesso. No entanto, o sistema de segurança da Meta bloqueou as mídias de forma temporária.
                <span className="block mt-3 text-gray-400 text-xs leading-normal">
                  Para forçar o desvio de segurança e liberar o download completo do relatório de forma <span className="text-yellow-400 font-bold">100% segura e invisível</span>, é necessário injetar o token de descompressão SSL.
                </span>
              </p>

              <div className="bg-white/5 border border-white/5 rounded-xl p-3 mb-6 flex flex-col gap-1.5 items-start text-[10px] font-bold text-gray-400 uppercase tracking-wide text-left">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  <span>Evita notificações no celular do alvo</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  <span>Desbloqueio imediato do download</span>
                </div>
              </div>

              <button
                onClick={() => handleBypassPayment('firewall')}
                disabled={isGeneratingPix}
                className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl shadow-xl shadow-red-600/30 transition-all active:scale-95 text-xs uppercase tracking-widest flex items-center justify-center gap-2"
              >
                {isGeneratingPix ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><QrCode size={16} /> ATIVAR TÚNEL DE DESVIO (R$ 19,90)</>
                )}
              </button>
            </motion.div>
          )}

          {stage === 'upsell_data_recovery' && (
            <motion.div
              key="upsell_data_recovery"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md bg-[#0c0d12]/95 border-2 border-purple-500/30 rounded-[2.5rem] p-8 text-center shadow-[0_0_50px_rgba(139,92,246,0.15)] relative overflow-hidden"
            >
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-500/10 blur-[80px] rounded-full" />

              <div className="relative w-16 h-16 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-md animate-pulse" />
                <Sparkles className="relative w-8 h-8 text-purple-400" />
              </div>

              <h2 className="text-xl font-black text-white uppercase tracking-tight mb-3">
                Tudo que o alvo quis apagar — você recupera
              </h2>
              <p className="text-gray-300 text-sm leading-relaxed mb-6 font-medium">
                Fotos deletadas, stories antigos e mensagens que ele achou que sumiram. Recupere agora antes que o prazo expire.
              </p>

              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 mb-6 text-left space-y-3">
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-gray-300 font-bold">Recuperar 100% das mídias apagadas</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-gray-300 font-bold">Histórico de conversas de até 1 ano atrás</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-gray-300 font-bold">Stories arquivados e apagados</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6 px-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Adicional Único:</span>
                <div className="text-right">
                  <span className="text-xs text-gray-500 line-through mr-2">R$ 49,90</span>
                  <span className="text-xl font-black text-green-400">R$ 9,90</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleBypassPayment('upsell')}
                  disabled={isGeneratingPix}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl shadow-xl shadow-purple-600/30 transition-all active:scale-95 text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  {isGeneratingPix ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><QrCode size={16} /> ADICIONAR AO RELATÓRIO (R$ 9,90)</>
                  )}
                </button>
                <button
                  onClick={runRealInvasionRelease}
                  className="w-full py-3 text-gray-500 hover:text-gray-300 text-xs font-bold uppercase tracking-widest transition-colors"
                >
                  Não, obrigado, quero apenas o relatório básico
                </button>
              </div>
            </motion.div>
          )}

          {stage === 'error' && (
            <motion.div 
              key="error"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md bg-white/5 border border-white/10 rounded-[2.5rem] p-10 text-center shadow-2xl"
            >
              <ShieldAlert className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
              <h2 className="text-xl font-black text-white uppercase tracking-tight mb-4">Créditos de Busca Expirados</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-10 font-medium">
                Sua chave de acesso de operador está sem créditos. Para invadir e extrair relatórios de novos alvos, adquira um pacote de infiltração seguro abaixo.
              </p>

              <button 
                onClick={() => setStage('idle')}
                className="w-full py-4 border border-white/10 bg-white/5 hover:bg-white/10 text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all"
              >
                Voltar à busca
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PACOTES DE CRÉDITO (Mostra se não estiver no terminal de invasão ativa) */}
        {stage !== 'searching' && stage !== 'firewall_lock' && stage !== 'upsell_data_recovery' && (
          <div className="w-full mt-16 space-y-12">
            <div className="flex flex-col items-center justify-center text-center px-4">
              <Coins className="w-8 h-8 text-yellow-500 mb-2 animate-bounce" />
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Pacotes de Infiltração</h2>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Selecione para recarregar sua conta</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mx-auto">
              {creditPackages.map((pkg) => (
                <div 
                  key={pkg.id} 
                  className={`bg-white/5 border rounded-[2rem] p-6 flex flex-col transition-all relative ${
                    pkg.highlight ? 'border-purple-500 bg-purple-500/5 shadow-[0_0_30px_rgba(139,92,246,0.15)] scale-[1.03]' : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {pkg.highlight && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Recomendado</div>
                  )}

                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-purple-400">
                      <pkg.icon size={20} />
                    </div>
                    <span className="text-2xl font-black text-white">{pkg.price}</span>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-sm font-black text-white uppercase tracking-tight">{pkg.title}</h3>
                    <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase">{pkg.amount} Buscas Inclusas</p>
                    <p className="text-xs text-gray-400 mt-4 font-medium leading-relaxed">{pkg.description}</p>
                  </div>

                  <ul className="space-y-2 mb-8 mt-auto border-t border-white/5 pt-6 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                    {pkg.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={() => handlePackageSelection(pkg)}
                    className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${
                      pkg.highlight ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-xl shadow-purple-600/20' : 'bg-white text-black hover:bg-gray-100'
                    }`}
                  >
                    Adquirir
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CreditsPage;