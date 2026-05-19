import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { 
  Users, DollarSign, Search, ShieldCheck, 
  CreditCard, LogOut, RotateCcw,
  Trash2, MessageCircle, Key, BarChart3, 
  Map as MapIcon, QrCode, Download, X, FileText, Check, Save, ShieldAlert, ShieldOff
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

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leads' | 'analytics' | 'sales'>('leads');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [showPixModal, setShowPixModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
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

  const fetchLeads = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
      if (silent) toast.success('Dados sincronizados!');
    } catch (error: any) {
      toast.error('Erro de conexão com o banco');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        fetchLeads(true);
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
      fetchLeads(true);
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
      fetchLeads(true);
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setAccessLoading(false);
    }
  };

  // Função para bloquear acesso
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
      fetchLeads(true);
    } catch (err: any) {
      toast.error("Erro ao alterar status de bloqueio.");
    } finally {
      setAccessLoading(false);
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
            
            <nav className="flex gap-2">
              <TabButton active={activeTab === 'leads'} onClick={() => setActiveTab('leads')} icon={Users} label="Leads" />
              <TabButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={MapIcon} label="Geolocalização" />
              <TabButton active={activeTab === 'sales'} onClick={() => setActiveTab('sales')} icon={BarChart3} label="Vendas" />
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
              <button onClick={() => fetchLeads(true)} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 text-gray-400 transition-colors">
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
                    <th className="pb-4 px-4">Status</th>
                    <th className="pb-4 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {filteredLeads.length > 0 ? (
                    filteredLeads.map((lead) => (
                      <tr key={lead.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="py-5 px-4">
                          <div className="flex items-center gap-4">
                            <img src={lead.profile_pic || '/perfil.jpg'} className="w-12 h-12 rounded-2xl object-cover border border-white/10 shadow-lg" />
                            <div>
                              <p className="text-sm font-black text-white tracking-tight">@{lead.username_searched}</p>
                              <p className="text-[10px] text-gray-500 font-bold">{new Date(lead.created_at).toLocaleDateString()}</p>
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
                            <ActionButton onClick={() => { setSelectedLead(lead); setShowPixModal(true); setGeneratedPix(null); }} icon={QrCode} color="text-yellow-500" title="Gerar PIX" />
                            <ActionButton onClick={() => window.open(`https://wa.me/55${lead.phone?.replace(/\D/g, '')}`, '_blank')} icon={MessageCircle} color="text-green-500" title="WhatsApp" />
                            <ActionButton onClick={() => handleDeleteLead(lead.id)} icon={Trash2} color="text-red-500" title="Excluir Lead" />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-gray-600 font-bold uppercase tracking-widest text-xs">Nenhum registro encontrado</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ... manter outras abas se necessário */}
      </div>

      {/* MODAL DE GESTÃO DE ACESSO */}
      <AnimatePresence>
        {showAccessModal && selectedLead && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0f0f12] border border-white/10 w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8 flex justify-between items-center bg-[#0f0f12] border-b border-white/5">
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Gestão de Acesso</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Painel do Operador</p>
                </div>
                <button onClick={() => setShowAccessModal(false)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X size={20} /></button>
              </div>

              <div className="p-8 space-y-6">
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

                    {/* BOTÃO DE BLOQUEIO / DESBLOQUEIO */}
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

      {/* MODAL DE PIX MANUAL */}
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