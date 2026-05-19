import React, { useState, useEffect } from 'react';
import { Coins, Zap, Infinity, Star, ChevronRight, Check, ShieldCheck, Sparkles, Terminal, ShieldAlert, Search, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import AppHeader from '../components/AppHeader';

interface CreditPackage {
  id: number;
  amount: number | string;
  title: string;
  price: string;
  description: string;
  checkoutUrl: string;
  icon: React.ElementType;
  highlight?: boolean;
  features: string[];
}

const CreditsPage: React.FC = () => {
  const [stage, setStage] = useState<'idle' | 'searching' | 'error'>('idle');
  const [targetUsername, setTargetUsername] = useState('');
  const [searchLogs, setSearchLogs] = useState<string[]>([]);

  const creditPackages: CreditPackage[] = [
    {
      id: 1,
      amount: 10,
      title: "Pacote Lite",
      price: "R$ 49,50",
      description: "Ideal para invasões pontuais e rápidas.",
      checkoutUrl: "https://checkout.perfectpay.com.br/pay/PPU38COTFU1",
      icon: Zap,
      features: ['10 Créditos de Invasão', 'Acesso 24h', 'Suporte Padrão']
    },
    {
      id: 2,
      amount: 30,
      title: "Pacote Premium",
      price: "R$ 79,50",
      description: "O favorito dos investigadores profissionais.",
      checkoutUrl: "https://checkout.perfectpay.com.br/pay/PPU38COTFU6",
      icon: Star,
      highlight: true,
      features: ['30 Créditos de Invasão', 'Recuperador de Mensagens', 'Localização em Tempo Real', 'Suporte VIP']
    },
    {
      id: 3,
      amount: "Ilimitados",
      title: "Acesso Vitalício",
      price: "R$ 149,00",
      description: "Controle total e permanente sem limites.",
      checkoutUrl: "https://checkout.perfectpay.com.br/pay/PPU38COTFU8",
      icon: Infinity,
      features: ['Créditos Ilimitados', 'Todas as Ferramentas Pro', 'Acesso Vitalício', 'Suporte Prioritário 24/7']
    },
  ];

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
      const logs = [
        `Estabelecendo conexão com servidor LATAM...`,
        `Injetando scripts de bypass em @${targetUsername}...`,
        `Quebrando criptografia ponta-a-ponta...`,
        `Validando tokens de sessão...`,
        `Acesso parcial detectado. Aguardando autorização de créditos...`,
      ];

      let currentLog = 0;
      const interval = setInterval(() => {
        if (currentLog < logs.length) {
          setSearchLogs(prev => [...prev, logs[currentLog]]);
          currentLog++;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            setStage('error');
            toast.error("CRÉDITOS INSUFICIENTES", { duration: 4000 });
          }, 1000);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [stage, targetUsername]);

  const handleCardClick = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* Matrix background is implied by BackgroundLayout in App.tsx */}
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <AppHeader />

        <AnimatePresence mode="wait">
          {stage === 'idle' && (
            <motion.div 
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-xl mx-auto text-center mt-16"
            >
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 uppercase tracking-tighter">
                INICIAR <span className="text-blue-500">INFILTRAÇÃO</span>
              </h2>
              <p className="text-gray-500 text-sm font-medium mb-12">
                Identifique o alvo para iniciar a extração remota de dados.
              </p>
              
              <div className="space-y-6 max-w-md mx-auto">
                <div className="relative group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500/50 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="EX: NEYMARJR"
                    value={targetUsername}
                    onChange={(e) => setTargetUsername(e.target.value.replace('@', '').toLowerCase())}
                    className="w-full bg-black/40 border border-blue-500/30 rounded-full py-5 pl-14 pr-6 text-white outline-none focus:border-blue-500 transition-all font-black tracking-widest uppercase text-sm"
                  />
                </div>

                <button 
                  onClick={handleStartInvasion}
                  className="w-full h-16 rounded-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-blue-600/20"
                >
                  <Sparkles className="w-5 h-5 text-white" />
                  <span className="text-white font-black text-sm uppercase tracking-widest">Iniciar Infiltração</span>
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
              className="max-w-md mx-auto mt-24 p-8 bg-[#0a0a0a]/80 border border-blue-500/20 rounded-[2rem] backdrop-blur-3xl"
            >
              <div className="flex flex-col items-center gap-6 mb-10">
                <div className="w-12 h-12 border-2 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
                <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">Sincronizando...</h3>
              </div>
              <div className="space-y-4 font-mono text-[10px] text-blue-400/60 text-left">
                {searchLogs.map((log, i) => (
                  <motion.p initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} key={i} className="flex gap-3">
                    <span className="text-blue-500/40">{'>'}</span> {log}
                  </motion.p>
                ))}
              </div>
            </motion.div>
          )}

          {stage === 'error' && (
            <motion.div 
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full mt-8"
            >
              {/* Alerta Clean */}
              <div className="max-w-xl mx-auto bg-red-600/5 border border-red-600/20 rounded-[2.5rem] p-8 mb-16 backdrop-blur-xl text-center">
                <ShieldAlert className="w-10 h-10 text-red-600 mx-auto mb-4" />
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Acesso Negado</h2>
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-8">Saldo de Créditos Insuficiente</p>
                
                <div className="inline-flex items-center gap-6 px-8 py-4 bg-black/40 border border-white/5 rounded-2xl">
                  <div className="text-left">
                    <span className="block text-[8px] font-black text-gray-600 uppercase tracking-widest">Status</span>
                    <span className="text-xs font-black text-red-500">SEM SALDO</span>
                  </div>
                  <div className="w-px h-6 bg-white/10"></div>
                  <div className="text-left">
                    <span className="block text-[8px] font-black text-gray-600 uppercase tracking-widest">Alvo Detectado</span>
                    <span className="text-xs font-black text-white uppercase tracking-tight">@{targetUsername}</span>
                  </div>
                </div>
              </div>

              {/* Grid de Planos Minimalista */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mb-20">
                {creditPackages.map((pkg) => (
                  <motion.div
                    key={pkg.id}
                    whileHover={{ translateY: -5 }}
                    onClick={() => handleCardClick(pkg.checkoutUrl)}
                    className={`relative bg-[#0a0a0a]/60 border rounded-[2rem] p-8 flex flex-col transition-all duration-300 cursor-pointer
                      ${pkg.highlight ? 'border-blue-500' : 'border-white/5 hover:border-blue-500/40'}`}
                  >
                    <div className="flex items-center gap-4 mb-8">
                      <div className={`p-3 rounded-xl ${pkg.highlight ? 'bg-blue-500/10 text-blue-500' : 'bg-white/5 text-gray-500'}`}>
                        <pkg.icon size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-tighter">{pkg.title}</h3>
                        <p className="text-lg font-black text-white">{pkg.price}</p>
                      </div>
                    </div>

                    <div className="space-y-4 mb-8 flex-1">
                      {pkg.features.map((feature, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-3">
                          <div className={`w-1 h-1 rounded-full ${pkg.highlight ? 'bg-blue-500' : 'bg-gray-700'}`} />
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all
                      ${pkg.highlight ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 text-gray-400 group-hover:text-white'}`}>
                      Selecionar
                      <ChevronRight size={14} />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Footer Minimalista */}
              <div className="flex flex-col items-center gap-6">
                <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/5">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Criptografia de 256 bits Ativa</span>
                </div>
                <p className="text-[8px] font-black text-gray-700 uppercase tracking-[0.5em]">SpyGram Intelligence Systems</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CreditsPage;