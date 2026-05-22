import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';

const AppHeader: React.FC = () => {
  const [credits, setCredits] = useState<string | number>('0');
  const [username, setUsername] = useState<string>('user-403');
  const [isPaid, setIsPaid] = useState<boolean>(false);

  useEffect(() => {
    const fetchLeadCredits = async () => {
      const email = sessionStorage.getItem('logged_in_email');
      if (!email) return;

      try {
        const { data, error } = await supabase
          .from('leads')
          .select('status, total_amount, username_searched')
          .eq('email', email.trim().toLowerCase())
          .order('created_at', { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0) {
          const lead = data[0];
          if (lead.username_searched) {
            setUsername(lead.username_searched);
          }
          
          if (lead.status === 'pagou') {
            setIsPaid(true);
            const amount = Number(lead.total_amount) || 0;
            if (amount >= 140) {
              setCredits('Ilimitado');
            } else if (amount >= 70) {
              setCredits(30);
            } else {
              setCredits(10);
            }
          } else {
            setCredits('0');
          }
        }
      } catch (err) {
        console.error("Erro ao carregar créditos:", err);
      }
    };

    fetchLeadCredits();
  }, []);

  return (
    <header className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-12 sm:mb-16 w-full">
      {/* Lado Esquerdo: Logo e Nome */}
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
      
      {/* Lado Direito: Status do Operador */}
      <motion.div 
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="flex items-center gap-0.5 p-0.5 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full sm:rounded-[1.5rem] shadow-2xl"
      >
        {/* Seção de Créditos */}
        <div className="flex flex-col items-end px-3 sm:px-4 py-1">
          <div className="flex items-center gap-1">
            <span className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest">Créditos</span>
            <Coins className="w-2 sm:w-2.5 h-2 sm:h-2.5 text-yellow-500" />
          </div>
          <span className={`text-xs sm:text-sm font-black tabular-nums ${isPaid ? 'text-green-400' : 'text-white'}`}>
            {credits}
          </span>
        </div>

        {/* Divisor */}
        <div className="w-px h-6 sm:h-8 bg-white/10 mx-0.5"></div>

        {/* Seção do Perfil */}
        <div className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-2 pr-3 sm:pr-4 py-1 cursor-pointer hover:bg-white/5 rounded-full transition-colors">
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full animate-pulse opacity-50"></div>
            <div className="relative w-7 sm:w-9 h-7 sm:h-9 rounded-full bg-black border border-white/10 flex items-center justify-center overflow-hidden">
              <img src="/perfil.jpg" alt="User" className="w-full h-full object-cover opacity-60 grayscale" />
              <div className="absolute inset-0 bg-purple-500/10"></div>
            </div>
          </div>
          
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs font-black text-white tracking-tight">@{username}</span>
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