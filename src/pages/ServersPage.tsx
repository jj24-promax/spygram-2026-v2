import React, { useState, useEffect, useCallback } from 'react';
import { Server, Globe, Users as UsersIcon, Zap, Activity, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AppHeader from '../components/AppHeader';
import { supabase } from '../integrations/supabase/client';

interface ServerCardProps {
  serverNumber: number;
  ping: number;
  onClick: () => void;
}

const ServerCard: React.FC<ServerCardProps> = ({ serverNumber, ping, onClick }) => {
  const getPingColor = (p: number) => {
    if (p < 30) return 'text-green-400';
    if (p < 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusColor = (p: number) => {
    if (p < 30) return 'bg-green-500';
    if (p < 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02, translateY: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 w-full flex flex-col items-start transition-all duration-300 hover:border-purple-500/50 hover:bg-white/10 overflow-hidden shadow-2xl"
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-0 group-hover:opacity-10 transition duration-500"></div>
      
      <div className="flex justify-between items-start w-full mb-6">
        <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
          <Server className="w-5 h-5 text-purple-400" />
        </div>
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/40 border border-white/5">
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${getStatusColor(ping)}`}></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Online</span>
        </div>
      </div>

      <div className="mb-4 text-left">
        <h3 className="text-white font-black text-sm uppercase tracking-tighter">Servidor #{serverNumber}</h3>
        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Localização: LATAM-BR</p>
      </div>

      <div className="w-full space-y-2 mt-auto">
        <div className="flex justify-between items-end">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Latência</span>
          <span className={`text-xs font-black tabular-nums ${getPingColor(ping)}`}>{ping}ms</span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(10, 100 - ping)}%` }}
            className={`h-full rounded-full ${ping < 60 ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-red-500'}`}
          ></motion.div>
        </div>
      </div>
    </motion.button>
  );
};

const ServersPage: React.FC = () => {
  const navigate = useNavigate();
  const [onlineUsers, setOnlineUsers] = useState(423);
  const [isPaid, setIsPaid] = useState<boolean | null>(null);
  const [hasCredits, setHasCredits] = useState<boolean>(false);
  const [servers, setServers] = useState([
    { id: 0, ping: 24 }, { id: 1, ping: 42 }, { id: 2, ping: 18 },
    { id: 3, ping: 35 }, { id: 4, ping: 51 }, { id: 5, ping: 12 }
  ]);

  const checkPaymentStatus = useCallback(async () => {
    const email = localStorage.getItem('logged_in_email') || sessionStorage.getItem('logged_in_email');
    if (!email) return;

    try {
      const { data: leadsData, error: leadError } = await supabase
        .from('leads')
        .select('id, status')
        .eq('email', email.trim().toLowerCase())
        .order('created_at', { ascending: false })
        .limit(1);

      if (!leadError && leadsData && leadsData.length > 0) {
        const lead = leadsData[0];
        const paid = lead.status === 'pagou';
        setIsPaid(paid);

        if (paid) {
          const { data: edgeData, error: edgeError } = await supabase.functions.invoke('manage-credits', {
            body: { leadId: lead.id, action: 'get' }
          });

          if (!edgeError && edgeData) {
            const paymentsData = edgeData.payments || [];
            const successStatuses = ['paid', 'saquepago', 'approved', 'success', 'pago'];
            
            const creditPayments = paymentsData.filter((p: any) => {
              const isSuccess = successStatuses.includes(String(p.status).toLowerCase());
              const amt = Number(p.payload?.amount) || 0;
              const itemsStr = Array.isArray(p.payload?.items) ? p.payload.items.join(' ').toLowerCase() : '';
              
              const isCreditValue = Math.abs(amt - 49.5) < 0.1 || Math.abs(amt - 79.5) < 0.1 || Math.abs(amt - 149) < 0.1;
              const isCreditItem = itemsStr.includes('recarga') || itemsStr.includes('crédito') || itemsStr.includes('ilimitado');
              
              return isSuccess && (isCreditValue || isCreditItem);
            });

            setHasCredits(creditPayments.length > 0);
          } else {
            setHasCredits(false);
          }
        } else {
          setHasCredits(false);
        }
      } else {
        setIsPaid(false);
        setHasCredits(false);
      }
    } catch (err) {
      setIsPaid(false);
      setHasCredits(false);
    }
  }, []);

  useEffect(() => {
    checkPaymentStatus();

    // Checa a cada 5 segundos para atualização em tempo real
    const statusInterval = setInterval(checkPaymentStatus, 5000);

    const pingInterval = setInterval(() => {
      setServers(prev => prev.map(s => ({
        ...s,
        ping: Math.floor(Math.random() * (70 - 10 + 1)) + 10
      })));
      setOnlineUsers(prev => prev + (Math.random() > 0.5 ? 1 : -1));
    }, 3000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(pingInterval);
    };
  }, [checkPaymentStatus]);

  return (
    <div className="min-h-screen bg-transparent text-gray-300 font-sans selection:bg-purple-500/30 overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[4px]"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-900/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <AppHeader />

        {isPaid !== null && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`w-full max-w-4xl mx-auto mb-10 p-5 rounded-2xl border-2 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-xl shadow-2xl transition-colors duration-500 ${
              hasCredits 
                ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
            }`}
          >
            <div className="flex items-center gap-4">
              {hasCredits ? (
                <CheckCircle2 className="w-10 h-10 text-green-500 animate-pulse flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-10 h-10 text-yellow-500 animate-bounce flex-shrink-0" />
              )}
              <div className="text-center sm:text-left">
                <h3 className="text-white font-black uppercase tracking-tight text-lg">
                  {hasCredits ? 'Acesso Confirmado!' : 'Aguardando Pagamento ou Recarga'}
                </h3>
                <p className="text-xs text-gray-400 font-medium mt-1">
                  {hasCredits 
                    ? 'Sua conta possui créditos ativos. Selecione qualquer servidor abaixo para iniciar o rastreamento.' 
                    : 'Você precisa recarregar seus créditos para liberar a busca de novos alvos no painel.'
                  }
                </p>
              </div>
            </div>

            {!hasCredits && (
              <button 
                onClick={() => navigate('/credits')}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-black text-xs uppercase px-6 py-3 rounded-xl transition-all shadow-lg active:scale-95 whitespace-nowrap"
              >
                Comprar Créditos
              </button>
            )}
          </motion.div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-16">
          <div className="max-w-2xl text-center lg:text-left">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center lg:justify-start gap-3 mb-4"
            >
              <Activity className="w-5 h-5 text-pink-500" />
              <span className="text-xs font-black text-pink-500 uppercase tracking-[0.3em]">Status da Rede</span>
            </motion.div>
            <h1 className="text-4xl sm:text-6xl font-black text-white mb-6 tracking-tighter leading-tight">
              NÓS <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">SERVERS.</span>
            </h1>
            <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-lg mx-auto lg:mx-0">
              Arquitetura de rede distribuída globalmente. Selecione o ponto de entrada com a menor latência para garantir uma infiltração estável.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <div className="flex flex-col items-center p-4 sm:p-6 bg-white/5 border border-white/10 rounded-[1.5rem] sm:rounded-[2rem] backdrop-blur-xl">
               <UsersIcon className="w-5 h-5 text-purple-400 mb-2" />
               <span className="text-xl sm:text-2xl font-black text-white tabular-nums">{onlineUsers}</span>
               <span className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest mt-1">Operadores</span>
            </div>
            <div className="flex flex-col items-center p-4 sm:p-6 bg-white/5 border border-white/10 rounded-[1.5rem] sm:rounded-[2rem] backdrop-blur-xl">
               <Zap className="w-5 h-5 text-yellow-400 mb-2" />
               <span className="text-xl sm:text-2xl font-black text-white tabular-nums">99.9%</span>
               <span className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest mt-1">Uptime</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
          <Globe className="w-4 h-4 text-purple-500" />
          <h2 className="text-[10px] sm:text-sm font-black text-white uppercase tracking-widest">Ponto de entrada seguro</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-16 sm:mb-20">
          {servers.map((server) => (
            <ServerCard 
              key={server.id} 
              serverNumber={server.id} 
              ping={server.ping} 
              onClick={() => navigate('/credits')} 
            />
          ))}
        </div>

        <footer className="pt-12 border-t border-white/5 flex flex-col items-center">
          <div className="inline-flex items-center gap-3 bg-green-500/10 border border-green-500/20 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full mb-6 backdrop-blur-md">
            <ShieldCheck className="w-4 sm:w-5 h-4 sm:h-5 text-green-500" />
            <span className="text-[9px] sm:text-xs font-black text-green-500 uppercase tracking-widest">Conexão Criptografada</span>
          </div>
          <p className="text-gray-600 text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.5em]">© 2024 SpyGram Intelligence</p>
        </footer>
      </div>
    </div>
  );
};

export default ServersPage;