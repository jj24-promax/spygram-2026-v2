import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { 
  Users, DollarSign, Search, ShieldCheck, 
  CreditCard, LogOut, RotateCcw,
  Trash2, MessageCircle, Key, BarChart3, 
  Map as MapIcon, QrCode, Download, X, FileText, Check, Save, ShieldAlert, ShieldOff, Coins, ShoppingBag, Terminal, Eye, BadgeCheck, Lock, Sparkles, Image as ImageIcon
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { fetchProfileData, fetchFullInvasionData } from '../services/profileService';
import { MOCK_MALE_NAMES, MOCK_FEMALE_NAMES, MOCK_SUGGESTION_NAMES } from '../constants';

interface Lead {
  id: string;
  username_searched: string;
  full_name: string;
  profile_pic: string;
  email: string;
  phone: string;
  document: string;
  status: string;
  total_amount: number;
  city: string;
  state: string;
  user_agent: string;
  created_at: string;
  updated_at: string;
}

interface Payment {
  id: string;
  transaction_id: string;
  lead_id: string;
  status: string;
  payload: any;
  created_at: string;
}

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leads' | 'analytics' | 'sales' | 'test-profile'>('leads');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [showPixModal, setShowPixModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  // Estados para o PIX
  const [pixAmount, setPixAmount] = useState('29.90');
  const [generatedPix, setGeneratedPix] = useState<any>(null);
  const [pixLoading, setPixLoading] = useState(false);
  const pixPdfRef = useRef<HTMLDivElement>(null);

  // Estados para o Acesso
  const [accessEmail, setAccessEmail] = useState('');
  const [accessPassword, setAccessPassword] = useState('123456');
  const [accessLoading, setAccessLoading] = useState(false);

  // Estados para Créditos
  const [creditAmount, setCreditAmount] = useState<number>(49.50);

  // Estados para o Laboratório de Testes de Perfil
  const [testUsername, setTargetUsername] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const fetchLeadsAndPayments = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-admin-data');

      if (error) throw error;
      setLeads(data?.leads || []);
      setPayments(data?.payments || []);
      if (silent) toast.success('Dados sincronizados!');
    } catch (error: any) {
      toast.error('Erro ao buscar dados do painel.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadsAndPayments();
    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        fetchLeadsAndPayments(true);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleDeleteLead = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este lead permanentemente? Todos os dados vinculados serão apagados.")) return;
    
    try {
      const { error } = await supabase.functions.invoke('delete-lead', {
        body: { leadId: id },
      });

      if (error) throw error;
      toast.success("Lead excluído com sucesso.");
      fetchLeadsAndPayments(true);
    } catch (err) {
      toast.error("Erro ao excluir lead.");
    }
  };

  // Métricas
  const metrics = useMemo(() => {
    const total = leads.length || 0;
    const paid = leads.filter(l => l.status === 'pagou');
    const revenue = paid.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
    
    const geoMap: Record<string, { count: number, cities: Record<string, number> }> = {};
    leads.forEach(l => {
      const st = l.state || 'Outros';
      const ct = l.city || 'Desconhecida';
      if (!geoMap[st]) geoMap[st] = { count: 0, cities: {} };
      geoMap[st].count++;
      geoMap[st].cities[ct] = (geoMap[st].cities[ct] || 0) + 1;
    });

    const geoData = Object.entries(geoMap)
      .map(([uf, data]) => ({
        uf,
        count: data.count,
        percent: total > 0 ? ((data.count / total) * 100).toFixed(1) : "0",
        mainCities: Object.entries(data.cities)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([city, count]) => `${city} (${count})`)
          .join(' • ')
      }))
      .sort((a, b) => b.count - a.count);

    const salesByDate: Record<string, number> = {};
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    last7Days.forEach(date => salesByDate[date] = 0);
    paid.forEach(l => {
      const date = l.updated_at?.split('T')[0];
      if (date && salesByDate[date] !== undefined) {
        salesByDate[date] += Number(l.total_amount);
      }
    });

    return { 
      total, 
      paidCount: paid.length, 
      revenue, 
      geoData, 
      chartData: Object.entries(salesByDate).map(([date, amount]) => ({
        date: date.split('-').slice(1).reverse().join('/'),
        amount
      }))
    };
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const searchLower = searchTerm.toLowerCase().trim();
    return leads.filter(lead => {
      const matchesSearch = searchLower === '' || 
        (lead.username_searched || '').toLowerCase().includes(searchLower) ||
        (lead.email || '').toLowerCase().includes(searchLower) ||
        (lead.full_name || '').toLowerCase().includes(searchLower) ||
        (lead.document || '').includes(searchLower);
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leads, searchTerm, statusFilter]);

  // Função inteligente para analisar itens comprados com base no valor e payload
  const getPurchasedItems = (lead: Lead) => {
    const successStatuses = ['paid', 'saquepago', 'approved', 'success', 'pago'];
    const leadPayments = payments.filter(p => p.lead_id === lead.id && successStatuses.includes(String(p.status).toLowerCase()));
    
    if (leadPayments.length === 0 && lead.status !== 'pagou') return [];

    const items: string[] = [];
    
    // Se o status for pago, assume pelo menos o Relatório Base caso não haja registros de pagamentos detalhados
    let hasBaseReport = lead.status === 'pagou';
    
    leadPayments.forEach(payment => {
      if (payment.payload?.items && Array.isArray(payment.payload.items)) {
        payment.payload.items.forEach((item: string) => {
          if (!items.includes(item)) {
            items.push(item);
          }
        });
        return;
      }

      const amount = Number(payment.payload?.amount) || 0;
      
      if (amount === 49.50) {
        items.push("Recarga: 10 Créditos 🪙");
      } else if (amount === 79.50) {
        items.push("Recarga: 30 Créditos 🪙");
      } else if (amount === 149.00) {
        items.push("Recarga: Créditos Ilimitados 🪙");
      } else {
        hasBaseReport = true;
        let remaining = Math.round((amount - 37.90) * 100) / 100;
        
        if (remaining > 0) {
          const bumps = [
            { title: 'Espião Social 👥', price: 19.90 },
            { title: 'Recuperador Mensagens 💬', price: 15.90 },
            { title: 'Rastreamento 24h 📍', price: 15.90 },
            { title: 'Vitalício PRO ⚡', price: 9.90 },
          ];
          
          bumps.forEach(bump => {
            if (remaining >= bump.price - 0.05) {
              items.push(bump.title);
              remaining = Math.round((remaining - bump.price) * 100) / 100;
            }
          });
        }
      }
    });

    const hasExplicitReport = items.some(i => i.includes("Relatório") || i.includes("SpyGram"));
    if (hasBaseReport && !hasExplicitReport) {
      items.unshift("Relatório SpyGram 🕵️");
    }

    return items;
  };

  const handleGeneratePix = async () => {
    if (!selectedLead) return;
    setPixLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('royal-banking-payment', {
        body: { 
          name: selectedLead.full_name || selectedLead.username_searched,
          email: selectedLead.email,
          document: selectedLead.document,
          phone: selectedLead.phone,
          amount: parseFloat(pixAmount),
          leadId: selectedLead.id
        },
      });

      if (error || !data.paymentCode) throw new Error('Falha no pagamento');
      setGeneratedPix(data);
      toast.success('PIX Manual Gerado');
    } catch (err) {
      toast.error('Erro ao processar');
    } finally {
      setPixLoading(false);
    }
  };

  const downloadPixPdf = async () => {
    if (!pixPdfRef.current) return;
    const canvas = await html2canvas(pixPdfRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`SpyGram-PIX-${selectedLead?.username_searched}.pdf`);
  };

  const handleOpenAccessModal = async (lead: Lead) => {
    setSelectedLead(lead);
    setAccessEmail(lead.email || '');
    setAccessPassword('123456');
    
    if (lead.email) {
      const { data } = await supabase.from('members').select('password').eq('email', lead.email).single();
      if (data) setAccessPassword(data.password);
    }
    
    setShowAccessModal(true);
  };

  const handleSaveAccess = async (liberate: boolean = false) => {
    if (!selectedLead || !accessEmail.trim()) {
      toast.error("E-mail é obrigatório.");
      return;
    }

    setAccessLoading(true);
    try {
      const { error: memberError } = await supabase
        .from('members')
        .upsert({ 
          email: accessEmail.trim().toLowerCase(), 
          password: accessPassword.trim() 
        }, { onConflict: 'email' });

      if (memberError) throw memberError;

      if (liberate || accessEmail !== selectedLead.email) {
        const updateData: any = { email: accessEmail.trim().toLowerCase() };
        if (liberate) updateData.status = 'pagou';
        
        const { error: leadError } = await supabase
          .from('leads')
          .update(updateData)
          .eq('id', selectedLead.id);
        
        if (leadError) throw leadError;
      }

      toast.success(liberate ? "Acesso Liberado e Senha Definida!" : "Dados de Acesso Atualizados!");
      setShowAccessModal(false);
      fetchLeadsAndPayments(true);
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setAccessLoading(false);
    }
  };

  const handleToggleBlock = async () => {
    if (!selectedLead) return;
    
    const isBanned = selectedLead.status === 'banido';
    const newStatus = isBanned ? 'pagou' : 'banido';
    
    setAccessLoading(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', selectedLead.id);

      if (error) throw error;
      
      toast.success(isBanned ? "Acesso desbloqueado!" : "Acesso bloqueado!");
      setShowAccessModal(false);
      fetchLeadsAndPayments(true);
    } catch (err: any) {
      toast.error("Erro ao alterar status de bloqueio.");
    } finally {
      setAccessLoading(false);
    }
  };

  const handleAddCredits = async () => {
    if (!selectedLead) return;
    setAccessLoading(true);
    try {
      const { error } = await supabase.functions.invoke('manage-credits', {
        body: { 
          leadId: selectedLead.id,
          action: 'add',
          amount: creditAmount
        },
      });

      if (error) throw error;

      toast.success("Créditos injetados com sucesso!");
      setShowCreditsModal(false);
      fetchLeadsAndPayments(true);
    } catch (err: any) {
      toast.error("Erro ao processar: " + err.message);
    } finally {
      setAccessLoading(false);
    }
  };

  const handleRemoveCredits = async () => {
    if (!selectedLead) return;
    if (!window.confirm("Deseja realmente remover TODOS os créditos deste lead?")) return;
    
    setAccessLoading(true);
    try {
      const { error } = await supabase.functions.invoke('manage-credits', {
        body: { 
          leadId: selectedLead.id,
          action: 'remove'
        },
      });

      if (error) throw error;

      toast.success("Todos os créditos foram removidos!");
      setShowCreditsModal(false);
      fetchLeadsAndPayments(true);
    } catch (err: any) {
      toast.error("Erro ao processar: " + err.message);
    } finally {
      setAccessLoading(false);
    }
  };

  // Executa o teste interativo de raspagem e análise de perfil
  const handleRunProfileTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testUsername.trim()) {
      toast.error("Digite o @ do Instagram para testar.");
      return;
    }
    setTestLoading(true);
    setTestResult(null);
    try {
      const cleanInput = testUsername.replace(/@/g, '').trim();
      const profileResponse = await fetchProfileData(cleanInput);
      
      let suggestions: SuggestedProfile[] = [];
      let posts: FeedPost[] = [];

      try {
        const fullResponse = await fetchFullInvasionData(profileResponse.profile);
        suggestions = fullResponse.suggestions || [];
        posts = fullResponse.posts || [];
      } catch (fullError) {
        console.warn("API de posts/sugestões em comum offline ou erro 500. Iniciando fallback de gênero oposto...");
      }

      // ESPELHAMENTO DE SEGURANÇA: Se a API falhou ou veio vazia, aplica a mesma IA de gênero oposto do funil real!
      if (suggestions.length === 0) {
        const targetGender = profileResponse.profile.gender;
        let namesToUse = MOCK_SUGGESTION_NAMES;
        
        if (targetGender === 'male') {
          namesToUse = MOCK_FEMALE_NAMES; // Homem -> sugere mulheres fakes de alta qualidade
        } else if (targetGender === 'female') {
          namesToUse = MOCK_MALE_NAMES; // Mulher -> sugere homens fakes de alta qualidade
        }

        const shuffledNames = [...namesToUse].sort(() => Math.random() - 0.5);
        suggestions = shuffledNames.slice(0, 12).map((name: string) => ({
          username: name.toLowerCase().replace(' ', '') + Math.floor(Math.random() * 100),
          fullName: name,
          profile_pic_url: '/perfil.jpg',
          is_private: true,
          gender: targetGender === 'male' ? 'female' : targetGender === 'female' ? 'male' : 'unknown'
        }));
      }

      setTestResult({
        profile: profileResponse.profile,
        suggestions: suggestions,
        posts: posts
      });
      
      toast.success("Análise de diagnóstico concluída!");
    } catch (err: any) {
      toast.error("Erro de busca: " + err.message);
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f0f12] flex flex-col items-center justify-center gap-4">
      <Loader />
      <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Iniciando Sistemas...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f0f12] text-gray-200 font-sans selection:bg-purple-500/30">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 border-b border-white/5 pb-8">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl shadow-xl">
                <ShieldCheck className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Command Center</h1>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.3em]">Operador Autenticado</p>
              </div>
            </div>
            
            <nav className="flex flex-wrap gap-2">
              <TabButton active={activeTab === 'leads'} onClick={() => setActiveTab('leads')} icon={Users} label="Leads" />
              <TabButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={MapIcon} label="Geolocalização" />
              <TabButton active={activeTab === 'sales'} onClick={() => setActiveTab('sales')} icon={BarChart3} label="Vendas" />
              <TabButton active={activeTab === 'test-profile'} onClick={() => setActiveTab('test-profile')} icon={Terminal} label="Testar Perfil 🧪" />
            </nav>
          </div>

          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="flex-1 lg:flex-none flex flex-col items-end px-6 py-4 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-3xl shadow-2xl">
               <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Faturamento</span>
               <span className="text-2xl font-black text-green-500 tabular-nums">R$ {metrics.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <button onClick={() => { localStorage.removeItem('spygram_admin_auth'); navigate('/admin-login'); }} className="p-5 bg-red-600/10 border border-red-600/20 text-red-500 rounded-2xl hover:bg-red-600/20 transition-all shadow-lg">
              <LogOut size={22} />
            </button>
          </div>
        </header>

        {activeTab === 'leads' && (
          <section className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-6 backdrop-blur-3xl shadow-2xl overflow-hidden">
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Filtrar por alvo ou dados do lead..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-sm focus:border-purple-500 outline-none transition-all placeholder:text-gray-600"
                />
              </div>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-[10px] font-black uppercase outline-none cursor-pointer hover:bg-black/60"
              >
                <option value="all">Todos Status</option>
                <option value="pesquisou">Pesquisou</option>
                <option value="gerou_pix">Gerou PIX</option>
                <option value="pagou">Pago</option>
                <option value="banido">Banido</option>
              </select>
              <button onClick={() => fetchLeadsAndPayments(true)} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 text-gray-400 transition-colors">
                <RotateCcw size={20} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] text-gray-600 uppercase font-black border-b border-white/5">
                    <th className="pb-4 px-4">Alvo</th>
                    <th className="pb-4 px-4">Informações do Lead</th>
                    <th className="pb-4 px-4">Localização</th>
                    <th className="pb-4 px-4">Produtos Comprados</th>
                    <th className="pb-4 px-4">Status</th>
                    <th className="pb-4 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {filteredLeads.length > 0 ? (
                    filteredLeads.map((lead) => {
                      const purchasedItems = getPurchasedItems(lead);
                      return (
                        <tr key={lead.id} className="group hover:bg-white/[0.02] transition-colors">
                          <td className="py-5 px-4">
                            <div className="flex items-center gap-4">
                              <img src={lead.profile_pic || '/perfil.jpg'} className="w-12 h-12 rounded-2xl object-cover border border-white/10 shadow-lg" />
                              <div>
                                <p className="text-sm font-black text-white tracking-tight">@{lead.username_searched}</p>
                                <p className="text-[10px] text-gray-500 font-bold">
                                  {new Date(lead.created_at).toLocaleDateString('pt-BR')} - {new Date(lead.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-5 px-4">
                            <p className="text-xs font-black text-gray-300 uppercase truncate max-w-[150px]">{lead.full_name || 'Anônimo'}</p>
                            <p className="text-[11px] text-gray-500 lowercase opacity-60">{lead.email || '---'}</p>
                            <div className="flex gap-2 mt-1">
                                <p className="text-[10px] text-gray-400 font-bold">{lead.phone || 'S/ Tel'}</p>
                                <p className="text-[10px] text-gray-400 font-bold">| {lead.document || 'S/ CPF'}</p>
                            </div>
                          </td>
                          <td className="py-5 px-4">
                            <p className="text-xs font-bold text-gray-300">{lead.city || '???'}</p>
                            <p className="text-[10px] text-gray-500 uppercase font-black">{lead.state || '???'}</p>
                          </td>
                          <td className="py-5 px-4 max-w-[200px]">
                            {purchasedItems.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {purchasedItems.map((item, idx) => (
                                  <span key={idx} className="text-[8px] font-black px-2 py-1 bg-white/5 border border-white/5 rounded-md text-purple-400 uppercase tracking-tight">
                                    {item}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] text-gray-600 font-bold italic">Nenhum</span>
                            )}
                          </td>
                          <td className="py-5 px-4">
                            <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border ${
                              lead.status === 'pagou' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                              lead.status === 'banido' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                              lead.status === 'gerou_pix' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' : 'bg-gray-800/50 text-gray-500 border-white/5'
                            }`}>
                              {lead.status}
                            </span>
                          </td>
                          <td className="py-5 px-4">
                            <div className="flex items-center justify-center gap-3">
                              <ActionButton onClick={() => handleOpenAccessModal(lead)} icon={Key} color="text-purple-400" title="Gerenciar Acesso" />
                              <ActionButton onClick={() => { setSelectedLead(lead); setCreditAmount(49.50); setShowCreditsModal(true); }} icon={Coins} color="text-yellow-400" title="Adicionar/Remover Créditos" />
                              <ActionButton onClick={() => { setSelectedLead(lead); setShowPixModal(true); setGeneratedPix(null); }} icon={QrCode} color="text-yellow-500" title="Gerar PIX" />
                              <ActionButton onClick={() => window.open(`https://wa.me/55${lead.phone?.replace(/\D/g, '')}`, '_blank')} icon={MessageCircle} color="text-green-500" title="WhatsApp" />
                              <ActionButton onClick={() => handleDeleteLead(lead.id)} icon={Trash2} color="text-red-500" title="Excluir Lead" />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-gray-600 font-bold uppercase tracking-widest text-xs">Nenhum registro encontrado</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'analytics' && (
          <section className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-3xl shadow-2xl">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-10 flex items-center gap-4">
              <MapIcon className="text-purple-500" /> Distribuição Geográfica
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {metrics.geoData.length > 0 ? metrics.geoData.map((item, idx) => (
                <div key={idx} className="bg-black/40 border border-white/10 rounded-[2rem] p-6 hover:border-purple-500/30 transition-all shadow-xl">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-black text-white">{item.uf}</span>
                      <span className="text-[10px] font-black text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full uppercase">{item.percent}%</span>
                    </div>
                    <span className="text-2xl font-black text-white">{item.count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-6">
                    <div className="h-full bg-gradient-to-r from-purple-600 to-pink-500" style={{ width: `${item.percent}%` }} />
                  </div>
                  <div className="flex flex-col gap-1">
                     <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Principais Cidades</span>
                     <p className="text-[10px] text-gray-400 font-bold uppercase leading-relaxed">{item.mainCities}</p>
                  </div>
                </div>
              )) : <div className="col-span-full py-10 text-center text-gray-600 font-bold uppercase">Aguardando novos leads...</div>}
            </div>
          </section>
        )}

        {activeTab === 'sales' && (
          <section className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-3xl shadow-2xl">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-10 flex items-center gap-4">
              <BarChart3 className="text-green-500" /> Performance Operacional
            </h2>
            <div className="h-[450px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.chartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis dataKey="date" stroke="#525252" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#525252" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#a78bfa', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={5} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* NOVA ABA: Diagnóstico e Teste de Perfis em tempo real */}
        {activeTab === 'test-profile' && (
          <section className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-3xl shadow-2xl">
            <div className="max-w-3xl mb-8">
              <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-4 flex items-center gap-3">
                <Terminal className="text-purple-500 animate-pulse" /> Laboratório de Diagnóstico do Instagram
              </h2>
              <p className="text-xs text-gray-400 font-medium leading-relaxed">
                Digite um username válido do Instagram abaixo para simular exatamente as informações e perfis em comum de sexo oposto higienizados que serão entregues ao usuário na página de conclusões.
              </p>
            </div>

            <form onSubmit={handleRunProfileTest} className="flex flex-col sm:flex-row gap-4 mb-10 w-full max-w-xl">
              <div className="relative flex-1">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">@</span>
                <input 
                  type="text" 
                  placeholder="neymarjr" 
                  value={testUsername}
                  onChange={(e) => setTargetUsername(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-10 pr-6 text-sm focus:border-purple-500 outline-none transition-all placeholder:text-gray-600 font-bold uppercase tracking-widest"
                />
              </div>
              <button 
                type="submit" 
                disabled={testLoading}
                className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-purple-600/20 active:scale-95 transition-all flex items-center gap-2"
              >
                {testLoading ? 'ANALISANDO...' : <><Eye size={14} /> RODAR DIAGNÓSTICO</>}
              </button>
            </form>

            <AnimatePresence>
              {testLoading && (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest animate-pulse">Raspando dados e filtrando estrangeiros da API...</span>
                </div>
              )}

              {testResult && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-10 animate-fade-in"
                >
                  {/* Bloco 1: Dados do Alvo */}
                  <div className="bg-black/40 border border-white/5 rounded-3xl p-6">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2 pb-3 border-b border-white/5">
                      <BadgeCheck size={14} className="text-purple-500" /> 1. DADOS DE ANALÍTICA DO ALVO
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="flex items-center gap-4 md:col-span-2">
                        <img src={testResult.profile.profilePicUrl} className="w-20 h-20 rounded-full object-cover border border-white/10" />
                        <div>
                          <p className="text-lg font-black text-white">@{testResult.profile.username}</p>
                          <p className="text-xs text-gray-400">{testResult.profile.fullName}</p>
                          <span className={`inline-block text-[9px] font-black px-2 py-0.5 mt-2 rounded-full border ${
                            testResult.profile.gender === 'male' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            testResult.profile.gender === 'female' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' :
                            'bg-gray-800 text-gray-500 border-white/10'
                          }`}>
                            Gênero Classificado: {testResult.profile.gender}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1 text-center bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                        <p className="text-lg font-black text-white">{testResult.profile.followers.toLocaleString('pt-BR')}</p>
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Seguidores</p>
                      </div>

                      <div className="space-y-1 text-center bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                        <p className="text-xs font-black text-purple-400 truncate max-w-[120px]">{testResult.profile.isPrivate ? 'PRIVADO 🔒' : 'PÚBLICO 🔓'}</p>
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Privacidade</p>
                      </div>
                    </div>

                    {testResult.profile.biography && (
                      <div className="mt-6 bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Biografia Extraída</p>
                        <p className="text-xs text-gray-400 font-medium whitespace-pre-wrap leading-relaxed">{testResult.profile.biography}</p>
                      </div>
                    )}
                  </div>

                  {/* Bloco 2: Perfis em Comum (Exclusivo brasileiros / sexo oposto) */}
                  <div className="bg-black/40 border border-white/5 rounded-3xl p-6">
                    <div className="flex justify-between items-center mb-6 pb-3 border-b border-white/5">
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Users size={14} className="text-pink-500" /> 2. CÍRCULO ÍNTIMO (PERFIS EM COMUM BRASILEIROS)
                      </h3>
                      <span className="text-[10px] font-black text-green-400 uppercase bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
                        Estrangeiros Filtrados / Fallback IA Ativa ✅
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                      {testResult.suggestions.length > 0 ? testResult.suggestions.map((p: any, idx: number) => (
                        <div key={idx} className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex flex-col items-center text-center">
                          <img src={p.profile_pic_url} className="w-12 h-12 rounded-full object-cover mb-3 border border-white/10" />
                          <p className="text-[10px] font-black text-white truncate w-full">@{p.username}</p>
                          <p className="text-[9px] text-gray-500 truncate w-full mt-0.5">{p.fullName}</p>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 mt-2 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 uppercase`}>
                            {p.gender}
                          </span>
                        </div>
                      )) : <p className="col-span-full py-6 text-center text-gray-600 font-bold uppercase text-xs">Nenhum perfil em comum encontrado</p>}
                    </div>
                  </div>

                  {/* Bloco 3: Posts Reais Extraídos */}
                  <div className="bg-black/40 border border-white/5 rounded-3xl p-6">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2 pb-3 border-b border-white/5">
                      <ImageIcon size={14} className="text-purple-400" /> 3. POSTS CAPTURADOS DO TIMELINE
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {testResult.posts.length > 0 ? testResult.posts.map((p: any, idx: number) => (
                        <div key={idx} className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-3">
                          <div className="flex items-center gap-2 mb-2">
                            <img src={p.de_usuario.profile_pic_url} className="w-6 h-6 rounded-full object-cover border border-white/10" />
                            <span className="text-[10px] font-black text-white truncate max-w-[120px]">@{p.de_usuario.username}</span>
                          </div>
                          
                          {p.post.is_video && p.post.video_url ? (
                            <div className="relative aspect-square rounded-xl overflow-hidden bg-black flex items-center justify-center">
                              <video src={p.post.video_url} className="w-full h-full object-cover" muted />
                              <span className="absolute top-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[8px] font-black text-purple-400 uppercase">Vídeo</span>
                            </div>
                          ) : (
                            <img src={p.post.image_url} className="aspect-square rounded-xl object-cover" />
                          )}

                          <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase mt-2">
                            <span>Likes: {p.post.like_count}</span>
                            <span>Comments: {p.post.comment_count}</span>
                          </div>
                        </div>
                      )) : (
                        <div className="col-span-full py-10 text-center text-gray-600 bg-white/[0.01] border border-dashed border-white/5 rounded-2xl font-bold uppercase text-xs">
                          Alvo Privado ou Sem Timeline de Posts Públicos para Mostrar
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}
      </div>

      <AnimatePresence>
        {showAccessModal && selectedLead && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0f0f12] border border-white/10 w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 flex justify-between items-center bg-[#0f0f12] border-b border-white/5 sticky top-0 z-10">
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Gestão de Acesso</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Painel do Operador</p>
                </div>
                <button onClick={() => setShowAccessModal(false)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X size={20} /></button>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto flex-1 scrollbar-hide">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                  <img src={selectedLead.profile_pic || '/perfil.jpg'} className="w-14 h-14 rounded-xl object-cover" />
                  <div>
                    <p className="text-white font-black text-sm tracking-tight">@{selectedLead.username_searched}</p>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        selectedLead.status === 'pagou' ? 'text-green-500 border-green-500/20 bg-green-500/5' : 
                        selectedLead.status === 'banido' ? 'text-red-500 border-red-500/20 bg-red-500/5' : 
                        'text-gray-500 border-white/10'
                    }`}>
                      Status: {selectedLead.status}
                    </span>
                  </div>
                </div>

                <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ShoppingBag size={14} className="text-purple-500" /> Histórico de Compras do Cliente
                  </h4>
                  {getPurchasedItems(selectedLead).length > 0 ? (
                    <ul className="space-y-2">
                      {getPurchasedItems(selectedLead).map((item, i) => (
                        <li key={i} className="text-xs font-bold text-gray-300 flex items-center gap-2">
                          <Check size={12} className="text-green-500" /> {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-600 italic">Nenhum produto adquirido ainda.</p>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">E-mail do Lead</label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input 
                        type="email" 
                        value={accessEmail}
                        onChange={(e) => setAccessEmail(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-xs font-bold text-white outline-none focus:border-purple-500 transition-all"
                        placeholder="E-mail de acesso"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Senha de Acesso</label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input 
                        type="text" 
                        value={accessPassword}
                        onChange={(e) => setAccessPassword(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-xs font-bold text-white outline-none focus:border-purple-500 transition-all"
                        placeholder="Nova senha"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => handleSaveAccess(false)}
                        disabled={accessLoading}
                        className="bg-white/5 border border-white/10 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all text-[10px] uppercase tracking-widest"
                      >
                        <Save size={14} /> Apenas Salvar
                      </button>
                      <button 
                        onClick={() => handleSaveAccess(true)}
                        disabled={accessLoading || selectedLead.status === 'pagou'}
                        className={`font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all text-[10px] uppercase tracking-widest shadow-lg
                                   ${selectedLead.status === 'pagou' ? 'bg-green-500/10 text-green-500/50 border border-green-500/10 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-500 shadow-green-600/20'}`}
                      >
                        <Check size={14} /> Liberar Acesso
                      </button>
                    </div>

                    <button 
                        onClick={handleToggleBlock}
                        disabled={accessLoading}
                        className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all border
                                   ${selectedLead.status === 'banido' 
                                      ? 'bg-blue-600/10 border-blue-500/20 text-blue-500 hover:bg-blue-600/20' 
                                      : 'bg-red-600/10 border-red-500/20 text-red-500 hover:bg-red-600/20'}`}
                    >
                        {selectedLead.status === 'banido' ? <><ShieldOff size={14} /> Desbloquear Acesso</> : <><ShieldAlert size={14} /> Bloquear Acesso</>}
                    </button>
                </div>
                
                {selectedLead.status === 'pagou' && (
                  <p className="text-center text-[9px] text-green-500 font-bold uppercase tracking-widest animate-pulse">Este lead já possui acesso vitalício ativo.</p>
                )}
                {selectedLead.status === 'banido' && (
                  <p className="text-center text-[9px] text-red-500 font-bold uppercase tracking-widest">Este acesso está bloqueado manualmente pelo operador.</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreditsModal && selectedLead && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0f0f12] border border-white/10 w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8 flex justify-between items-center bg-[#0f0f12] border-b border-white/5">
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Gerenciar Créditos</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Injetar ou Remover Créditos</p>
                </div>
                <button onClick={() => setShowCreditsModal(false)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X size={20} /></button>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                  <img src={selectedLead.profile_pic || '/perfil.jpg'} className="w-14 h-14 rounded-xl object-cover" />
                  <div>
                    <p className="text-white font-black text-sm tracking-tight">@{selectedLead.username_searched}</p>
                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{selectedLead.email}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1 block">Selecione o Pacote de Créditos para Adicionar</label>
                  
                  <div className="space-y-3">
                    <button 
                      type="button"
                      onClick={() => setCreditAmount(49.50)}
                      className={`w-full p-4 rounded-2xl border text-left flex justify-between items-center transition-all ${
                        creditAmount === 49.50 ? 'border-yellow-500 bg-yellow-500/10' : 'border-white/5 bg-white/[0.02] hover:bg-white/5'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-black text-white">10 CRÉDITOS</p>
                        <p className="text-[10px] text-gray-400">Protocolo Lite</p>
                      </div>
                      <span className="text-xs font-black text-yellow-500">R$ 49,50</span>
                    </button>

                    <button 
                      type="button"
                      onClick={() => setCreditAmount(79.50)}
                      className={`w-full p-4 rounded-2xl border text-left flex justify-between items-center transition-all ${
                        creditAmount === 79.50 ? 'border-yellow-500 bg-yellow-500/10' : 'border-white/5 bg-white/[0.02] hover:bg-white/5'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-black text-white">30 CRÉDITOS</p>
                        <p className="text-[10px] text-gray-400">Protocolo Elite</p>
                      </div>
                      <span className="text-xs font-black text-yellow-500">R$ 79,50</span>
                    </button>

                    <button 
                      type="button"
                      onClick={() => setCreditAmount(149.00)}
                      className={`w-full p-4 rounded-2xl border text-left flex justify-between items-center transition-all ${
                        creditAmount === 149.00 ? 'border-yellow-500 bg-yellow-500/10' : 'border-white/5 bg-white/[0.02] hover:bg-white/5'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-black text-white">ILIMITADO</p>
                        <p className="text-[10px] text-gray-400">Dominação Total</p>
                      </div>
                      <span className="text-xs font-black text-yellow-500">R$ 149,00</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={handleRemoveCredits}
                    disabled={accessLoading}
                    className="w-full bg-red-600/10 border border-red-500/20 hover:bg-red-600/20 text-red-500 font-black py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all text-xs uppercase tracking-widest"
                  >
                    {accessLoading ? (
                      <div className="w-5 h-5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                    ) : (
                      <><Trash2 size={14} /> Limpar Saldo</>
                    )}
                  </button>

                  <button 
                    onClick={handleAddCredits}
                    disabled={accessLoading}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-yellow-500/20 active:scale-95 transition-all text-xs uppercase tracking-widest"
                  >
                    {accessLoading ? (
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                      <><Check size={14} /> Injetar Saldo</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPixModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0f0f12] border border-white/10 w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 pb-4 flex justify-between items-center bg-[#0f0f12] sticky top-0 z-10">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Gerar Invasão Manual</h3>
                <button onClick={() => setShowPixModal(false)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X size={20} /></button>
              </div>

              <div className="p-8 pt-0 overflow-y-auto flex-1 scrollbar-hide">
                {!generatedPix ? (
                  <div className="space-y-10">
                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-6">
                      <img src={selectedLead?.profile_pic || '/perfil.jpg'} className="w-16 h-16 rounded-2xl object-cover border border-white/10" />
                      <div>
                        <p className="text-xl font-black text-white tracking-tight">@{selectedLead?.username_searched}</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{selectedLead?.email}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4 block">Definir Valor do Acesso (R$)</label>
                      <input 
                        type="number" 
                        value={pixAmount}
                        onChange={(e) => setPixAmount(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-6 px-10 text-white text-3xl font-black outline-none focus:border-purple-500 transition-all text-center"
                      />
                    </div>
                    <button 
                      onClick={handleGeneratePix}
                      disabled={pixLoading}
                      className="w-full bg-white text-black font-black py-6 rounded-2xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-xl"
                    >
                      {pixLoading ? <div className="w-6 h-6 border-4 border-black/20 border-t-black rounded-full animate-spin" /> : <><QrCode size={20} /> LIBERAR QR CODE</>}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8 flex flex-col items-center">
                    <div ref={pixPdfRef} className="bg-white p-10 rounded-[2.5rem] text-black w-full text-center shadow-2xl">
                      <div className="flex justify-center mb-8">
                        <img src="/spygram_transparentebranco.png" alt="SpyGram" className="h-8 brightness-0" />
                      </div>
                      <div className="mb-8">
                        <h4 className="text-2xl font-black uppercase tracking-tighter">Protocolo de Pagamento</h4>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">SISTEMA SPYGRAM INTELLIGENCE</p>
                      </div>
                      
                      <div className="bg-gray-50 p-8 rounded-[2rem] inline-block mb-8 border border-gray-100">
                        {generatedPix.paymentCodeBase64 && (
                          <img 
                            src={generatedPix.paymentCodeBase64.startsWith('data:') ? generatedPix.paymentCodeBase64 : `data:image/png;base64,${generatedPix.paymentCodeBase64}`} 
                            alt="QR Code"
                            className="w-48 h-48" 
                          />
                        )}
                      </div>
                      
                      <div className="text-left space-y-6 border-t border-gray-100 pt-8">
                        <div className="flex justify-between items-end">
                           <div>
                             <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Beneficiário</p>
                             <p className="text-sm font-black uppercase">SpyGram Intelligence</p>
                           </div>
                           <div className="text-right">
                             <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Valor Final</p>
                             <p className="text-3xl font-black">R$ {parseFloat(pixAmount).toFixed(2)}</p>
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full">
                      <button 
                        onClick={() => { navigator.clipboard.writeText(generatedPix.paymentCode); toast.success('Copiado!'); }}
                        className="flex-1 bg-white/5 border border-white/10 text-white font-black py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all text-xs"
                      >
                        <FileText size={18} /> COPIAR CÓDIGO
                      </button>
                      <button 
                        onClick={downloadPixPdf}
                        className="flex-1 bg-purple-600 text-white font-black py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-purple-500 shadow-2xl shadow-purple-600/30 transition-all text-xs"
                      >
                        <Download size={18} /> SALVAR PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all font-black text-[10px] uppercase tracking-[0.2em] border
      ${active ? 'bg-white text-black border-white shadow-xl' : 'bg-white/5 text-gray-500 border-white/5 hover:bg-white/10'}`}
  >
    <Icon size={14} />
    {label}
  </button>
);

const ActionButton = ({ onClick, icon: Icon, color, title }: any) => (
  <button 
    onClick={onClick}
    title={title}
    className={`p-3 bg-white/5 border border-white/10 rounded-2xl transition-all hover:bg-white/10 shadow-lg ${color}`}
  >
    <Icon size={18} />
  </button>
);

export default AdminPage;