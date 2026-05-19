"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import BackgroundLayout from '../components/BackgroundLayout';
import { supabase } from '../integrations/supabase/client';
import toast from 'react-hot-toast';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }
    
    setIsLoading(true);
    try {
      // 1. Verifica se o e-mail está bloqueado na tabela de leads
      const { data: leadCheck } = await supabase
        .from('leads')
        .select('status')
        .eq('email', email.trim().toLowerCase())
        .eq('status', 'banido')
        .limit(1);

      if (leadCheck && leadCheck.length > 0) {
        toast.error('Acesso bloqueado, entre em contato com o suporte', {
            duration: 5000,
            style: { background: '#ef4444', color: '#fff', fontWeight: 'bold' }
        });
        return;
      }

      // 2. Procede com o login normal
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .eq('password', password.trim())
        .single();

      if (error || !data) {
        toast.error('Acesso negado. Verifique seus dados.');
        return;
      }

      login('user');
      toast.success('Acesso liberado!');
      navigate('/servers');
      
    } catch (err) {
      toast.error('Erro ao validar acesso.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-[420px] relative"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-500 to-yellow-500 rounded-[2.5rem] blur opacity-20"></div>
        
        <div className="relative bg-[#0a0c10]/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 flex flex-col items-center shadow-2xl">
          
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="mb-10"
          >
            <img 
              src="/spygram_transparentebranco.png" 
              alt="SpyGram Logo" 
              className="h-20 drop-shadow-[0_0_15px_rgba(236,72,153,0.4)]" 
            />
          </motion.div>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">
              Área de <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-yellow-500">Membros</span>
            </h1>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em] opacity-80">
              Autenticação Criptografada
            </p>
          </div>

          <form onSubmit={handleLogin} className="w-full space-y-5">
            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-pink-500 transition-colors" />
              <input
                type="email"
                placeholder="E-MAIL DE COMPRA"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full bg-white/5 text-white pl-14 pr-6 py-4 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/10 placeholder-gray-600 text-xs font-bold uppercase tracking-widest transition-all"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-pink-500 transition-colors" />
              <input
                type="password"
                placeholder="CÓDIGO DE ACESSO"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full bg-white/5 text-white pl-14 pr-6 py-4 rounded-2xl border border-white/10 focus:outline-none focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/10 placeholder-gray-600 text-xs font-bold uppercase tracking-widest transition-all"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className={`w-full py-5 mt-4 rounded-2xl font-black text-sm text-white
                         bg-gradient-to-r from-purple-600 via-pink-500 to-pink-600
                         shadow-xl shadow-pink-500/20
                         flex items-center justify-center gap-3
                         transition-all uppercase tracking-[0.2em]
                         ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110'}`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Entrar no Painel
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-12 flex items-center gap-3 px-6 py-2 rounded-full bg-green-500/5 border border-green-500/10">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span className="text-green-500/80 font-bold text-[9px] uppercase tracking-[0.2em]">
              Servidor 100% Protegido
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const LoginPageWithBackground = () => (
  <BackgroundLayout>
    <LoginPage />
  </BackgroundLayout>
);

export default LoginPageWithBackground;