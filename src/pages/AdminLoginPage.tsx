"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, User, Info } from 'lucide-react';
import BackgroundLayout from '../components/BackgroundLayout';
import { supabase } from '../integrations/supabase/client';
import toast from 'react-hot-toast';

const AdminLoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [defaultCredentials, setDefaultCredentials] = useState<{user: string, pass: string} | null>(null);
  const navigate = useNavigate();

  // Verifica se há administradores e cria um padrão caso a tabela esteja vazia
  useEffect(() => {
    const seedAdmin = async () => {
      try {
        const { data: existingAdmins, error: selectError } = await supabase
          .from('admins')
          .select('id')
          .limit(1);

        if (!selectError && (!existingAdmins || existingAdmins.length === 0)) {
          // Nenhum admin encontrado, insere o padrão
          const { error: insertError } = await supabase
            .from('admins')
            .insert([
              { username: 'admin', password: 'admin123' }
            ]);

          if (!insertError) {
            console.log("Administrador padrão criado com sucesso: admin / admin123");
          }
        }
        
        // Exibe as credenciais padrão na tela para ajudar o usuário
        setDefaultCredentials({ user: 'admin', pass: 'admin123' });
      } catch (err) {
        console.error("Erro ao verificar/criar administrador padrão", err);
      }
    };

    seedAdmin();
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Preencha todos os campos.');
      return;
    }

    setIsLoading(true);

    try {
      // Consulta a tabela de admins ignorando case no username
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .ilike('username', username.trim()) // ilike ignora maiúsculas/minúsculas
        .eq('password', password.trim())
        .single();

      if (error || !data) {
        toast.error('Credenciais administrativas inválidas.');
        return;
      }

      // Autenticação bem-sucedida para o admin
      localStorage.setItem('spygram_admin_auth', 'true');
      toast.success('Bem-vindo, Operador.');
      navigate('/admin');
      
    } catch (err) {
      toast.error('Erro na conexão com o servidor de segurança.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#050505]/90 backdrop-blur-2xl border-2 border-red-900/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(255,0,0,0.1)] relative">
        <div className="text-center mb-6">
          <ShieldAlert className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Painel de Comando</h1>
          <p className="text-gray-500 text-[10px] font-bold uppercase mt-1 tracking-widest">Acesso de Operador</p>
        </div>

        {/* Card de Informação com as Credenciais */}
        {defaultCredentials && (
          <div className="mb-6 p-4 bg-blue-950/40 border border-blue-800/30 rounded-2xl flex items-start gap-3 text-left">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-blue-300 uppercase tracking-wider">Acesso Rápido de Testes</p>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                Utilize as credenciais automáticas abaixo para acessar:
                <br />
                <span className="text-white font-bold">Usuário:</span> <code className="bg-black/40 px-1.5 py-0.5 rounded text-blue-300 font-mono text-xs">{defaultCredentials.user}</code>
                <br />
                <span className="text-white font-bold">Senha:</span> <code className="bg-black/40 px-1.5 py-0.5 rounded text-blue-300 font-mono text-xs">{defaultCredentials.pass}</code>
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-6">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-700" />
            <input
              type="text"
              placeholder="IDENTIFICAÇÃO"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              className="w-full bg-black/50 border border-gray-800 rounded-xl py-4 pl-12 pr-4 text-white outline-none focus:border-red-600 text-sm font-bold tracking-widest uppercase"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-700" />
            <input
              type="password"
              placeholder="CHAVE DE ACESSO"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full bg-black/50 border border-gray-800 rounded-xl py-4 pl-12 pr-4 text-white outline-none focus:border-red-600 text-sm font-bold tracking-widest uppercase"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl shadow-lg shadow-red-600/20 transition-all active:scale-95 uppercase tracking-widest
                        ${isLoading ? 'opacity-50' : ''}`}
          >
            {isLoading ? 'AUTENTICANDO...' : 'LIBERAR ACESSO'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default () => <BackgroundLayout><AdminLoginPage /></BackgroundLayout>;