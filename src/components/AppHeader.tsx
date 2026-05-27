import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';

const AppHeader: React.FC = () => {
  const [credits, setCredits] = useState<string | number>('0');
  const [username, setUsername] = useState<string>('OPERADOR-403');
  const [isPaid, setIsPaid] = useState<boolean>(false);

  const fetchLeadCredits = useCallback(async () => {
    const email = sessionStorage.getItem('logged_in_email');
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
        
        if (lead.status === 'pagou') {
          setIsPaid(true);

          // Busca os pagamentos aprovados (bypass RLS)
          const { data: edgeData, error: edgeError } = await supabase.functions.invoke('manage-credits', {
            body: { leadId: lead.id, action: 'get' }
          });

          if (edgeError) throw edgeError;

          const paymentsData = edgeData?.payments || [];
          const successStatuses = ['paid', 'saquepago', 'approved', 'success', 'pago'];
          
          const creditPayments = paymentsData.filter((p: any) => {
            const isSuccess = successStatuses.includes(String(p.status).toLowerCase());
            const amt = Number(p.payload?.amount) || 0;
            const itemsStr = Array.isArray(p.payload?.items) ? p.payload.items.join(' ').toLowerCase() : '';
            
            // Verificação robusta: aceita o valor aproximado (para erros de float JS) ou a presença da tag no payload
            const isCreditValue = Math.abs(amt - 49.5) < 0.1 || Math.abs(amt - 79.5) < 0.1 || Math.abs(amt - 149) < 0.1;
            const isCreditItem = itemsStr.includes('recarga') || itemsStr.includes('crédito') || itemsStr.includes('ilimitado');
            
            return isSuccess && (isCreditValue || isCreditItem);
          });

          if (creditPayments.length > 0) {
            let totalCredits = 0;
            let isUnlimited = false;

            // Soma os pacotes acumulativamente de forma robusta
            creditPayments.forEach((p: any) => {
              const amt = Number(p.payload?.amount) || 0;
              const itemsStr = Array.isArray(p.payload?.items) ? p.payload.items.join(' ').toLowerCase() : '';

              if (Math.abs(amt - 149) < 0.1 || itemsStr.includes('ilimitado') || itemsStr.includes('dominação')) {
                isUnlimited = true;
              } else if (Math.abs(amt - 79.5) < 0.1 || itemsStr.includes('elite') || itemsStr.includes('30')) {
                totalCredits += 30;
              } else if (Math.abs(amt - 49.5) < 0.1 || itemsStr.includes('lite') || itemsStr.includes('10')) {
                totalCredits += 10;
              } else {
                // Fallback de segurança: se o admin injetou mas não bateu exatamente
                totalCredits += 10;
              }
            });
            
            setCredits(isUnlimited ? 'Ilimitado' : totalCredits.toString());
          } else {
            setCredits('0');
          }
        } else {
          setCredits('0');
        }
      }
    } catch (err) {
      console.error("Erro ao carregar créditos:", err);
    }
  }, []);

  useEffect(() => {
    fetchLeadCredits();

    // Atualiza a cada 5 segundos para refletir injeções manuais sem precisar de refresh
    const interval = setInterval(fetchLeadCredits, 5000);
    return () => clearInterval(interval);
  }, [fetchLeadCredits]);

  return (
    <header className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-12 sm:mb-16 w-full">
      <div className="flex items-center gap-4 sm:gap-6">
        <motion.div 
          initial={{ rotate: -10, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          className="relative group"
        >
          <div className="absolute -inset-3 bg-purple-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative p-3.5 sm:p-5 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl">
            <img src="/spygram_transparentebranco.png" alt="SpyGram" className="h-10 sm:h-14 w-auto object-contain" />
          </div>
        </motion.div>
        
        <div className="flex flex-col">
          <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tighter leading-none">
            Spy<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Gram</span>
          </h1>
          <span className="text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-[0.4em] mt-2">Intelligence</span>
        </div>
      </div>
      
      <motion.div 
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="flex items-center gap-0.5 p-0.5 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full sm:rounded-[1.5rem] shadow-2xl"
      >
        <div className="flex flex-col items-end px-3 sm:px-4 py-1">
          <div className="flex items-center gap-1">
            <span className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest">Créditos</span>
            <Coins className="w-2 sm:w-2.5 h-2 sm:h-2.5 text-yellow-500" />
          </div>
          <span className={`text-xs sm:text-sm font-black tabular-nums transition-colors duration-500 ${isPaid && credits !== '0' ? 'text-green-400' : 'text-white'}`}>
            {credits}
          </span>
        </div>

        <div className="w-px h-6 sm:h-8 bg-white/10 mx-0.5"></div>

        <div className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-2 pr-3 sm:pr-4 py-1 cursor-pointer hover:bg-white/5 rounded-full transition-colors">
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full animate-pulse opacity-50"></div>
            <div className="relative w-7 sm:w-9 h-7 sm:h-9 rounded-full bg-black border border-white/10 flex items-center justify-center overflow-hidden">
              <img src="/perfil.jpg" alt="User" className="w-full h-full object-cover opacity-60 grayscale" />
              <div className="absolute inset-0 bg-purple-500/10"></div>
            </div>
          </div>
          
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs font-black text-white tracking-tight">{username}</span>
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[7px] sm:text-[8px] font-black text-green-500 uppercase tracking-widest">Online</span>
            </div>
          </div>
        </div>
      </motion.div>
    </header>
  );
};

export default AppHeader;