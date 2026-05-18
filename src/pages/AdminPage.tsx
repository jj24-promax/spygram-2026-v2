import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { 
  Users, DollarSign, Search, MapPin, ShieldCheck, 
  CreditCard, LogOut, RotateCcw,
  Trash2, MessageCircle
} from 'lucide-react';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchLeads = async (silent = false) => {
    if (!silent) setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setLeads(data);
      
      if (silent) toast.success('Dados atualizados!');
    } catch (error: any) {
      console.error('Erro ao buscar leads:', error);
      toast.error('Erro ao carregar dados: ' + (error.message || ''));
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

  const handleLogout = () => {
    localStorage.removeItem('spygram_admin_auth');
    toast.success('Sessão encerrada.');
    navigate('/admin-login');
  };

  const handleDeleteLead = async (id: string, username: string) => {
    if (!window.confirm(`Tem certeza que deseja deletar o lead @${username}?`)) return;

    try {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
      toast.success(`Lead @${username} deletado.`);
      setLeads(prev => prev.filter(l => l.id !== id));
    } catch (error: any) {
      toast.error('Erro ao deletar: ' + error.message);
    }
  };

  const handleWhatsAppMessage = (phone: string) => {
    if (!phone) {
      toast.error('Número de WhatsApp não disponível.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const message = `Olá! 😊 Tudo bem?\n\nMeu nome é Lukas, sou do suporte SpyGram.\n\nSe você tiver qualquer dúvida sobre, pode me chamar aqui que eu te ajudo rapidinho.\n\nE se quiser garantir seu acesso, também já te explico como fazer`;
    
    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const metrics = useMemo(() => {
    const total = leads.length;
    const paid = leads.filter(l => l.status === 'pagou');
    const pixGenerated = leads.filter(l => l.status === 'gerou_pix' || l.status === 'pagou');
    const checkouts = leads.filter(l => l.status === 'checkout' || l.status === 'gerou_pix' || l.status === 'pagou');
    const revenue = paid.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
    
    return {
      total,
      paidCount: paid.length,
      pixCount: pixGenerated.length,
      checkoutCount: checkouts.length,
      revenue,
      conversion: total > 0 ? (paid.length / total) * 100 : 0
    };
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const searchLower = searchTerm.toLowerCase().trim();
    return leads.filter(lead => {
      const matchesSearch = searchLower === '' || 
        (lead.username_searched || '').toLowerCase().includes(searchLower) ||
        (lead.email || '').toLowerCase().includes(searchLower) ||
        (lead.phone || '').includes(searchLower) ||
        (lead.document || '').includes(searchLower) ||
        (lead.full_name || '').toLowerCase().includes(searchLower);
      return matchesSearch && (statusFilter === 'all' || lead.status === statusFilter);
    });
  }, [leads, searchTerm, statusFilter]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader /></div>;

  return (
    <div className="min-h-screen bg-[#080808] text-gray-200 p-4 md:p-8 font-sans">
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">SpyGram Command Center</h1>
            <div className="bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-500 text-[10px] font-black tracking-widest">SISTEMA ATIVO</span>
            </div>
          </div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Monitoramento Tático de Leads e Conversões</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={() => fetchLeads(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-widest">
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
          <div className="bg-purple-600 px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-purple-600/20">
            <DollarSign className="w-4 h-4 text-white" />
            <span className="font-black text-white text-sm">R$ {metrics.revenue.toFixed(2)}</span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2.5 bg-red-600/10 border border-red-600/20 text-red-500 rounded-xl hover:bg-red-600/20 transition-all text-xs font-bold uppercase tracking-widest">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard title="Visitantes" value={metrics.total} icon={Users} color="text-blue-500" />
        <StatCard title="Checkouts" value={metrics.checkoutCount} icon={CreditCard} color="text-yellow-500" subtitle={`${((metrics.checkoutCount/metrics.total)*100 || 0).toFixed(1)}% de conv.`} />
        <StatCard title="Pix Gerados" value={metrics.pixCount} icon={CreditCard} color="text-pink-500" />
        <StatCard title="Pagos" value={metrics.paidCount} icon={ShieldCheck} color="text-green-500" subtitle={`${metrics.conversion.toFixed(1)}% conv. final`} />
      </div>

      <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar lead..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/50 border border-gray-800 rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-purple-500 outline-none transition-all"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-black/50 border border-gray-800 rounded-2xl py-3 px-6 text-xs font-bold uppercase outline-none"
          >
            <option value="all">Todos Status</option>
            <option value="pesquisou">Pesquisou</option>
            <option value="checkout">No Checkout</option>
            <option value="gerou_pix">Gerou Pix</option>
            <option value="pagou">Pago</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] text-gray-500 uppercase font-black border-b border-gray-800/50">
                <th className="pb-4 px-4">Alvo</th>
                <th className="pb-4 px-4">Lead</th>
                <th className="pb-4 px-4">E-mail / WhatsApp</th>
                <th className="pb-4 px-4">Status / Valor</th>
                <th className="pb-4 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/30">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="group hover:bg-white/[0.02]">
                  <td className="py-5 px-4">
                    <div className="flex items-center gap-3">
                      <img src={lead.profile_pic || '/perfil.jpg'} className="w-10 h-10 rounded-xl object-cover border border-white/5" />
                      <div>
                        <p className="text-sm font-bold text-white">@{lead.username_searched}</p>
                        <p className="text-[10px] text-gray-500">{lead.city || 'Desconhecido'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-4 text-xs font-black text-gray-200 uppercase">{lead.full_name || 'Anônimo'}</td>
                  <td className="py-5 px-4">
                    <p className="text-[11px] font-medium text-blue-300 lowercase">{lead.email || '---'}</p>
                    <p className="text-[11px] font-bold text-green-400">{lead.phone || '---'}</p>
                  </td>
                  <td className="py-5 px-4">
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase ${
                      lead.status === 'pagou' ? 'bg-green-500/10 text-green-500' :
                      lead.status === 'gerou_pix' ? 'bg-pink-500/10 text-pink-500' : 'bg-gray-800/50 text-gray-400'
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="py-5 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleWhatsAppMessage(lead.phone)}
                        className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20 transition-all"
                        title="Enviar mensagem WhatsApp"
                      >
                        <MessageCircle size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteLead(lead.id, lead.username_searched)}
                        className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-all"
                        title="Deletar Lead"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
  <div className="bg-gray-900/40 border border-gray-800 p-6 rounded-3xl relative group">
    <div className="relative z-10">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-xl bg-white/5 ${color}`}><Icon size={18} /></div>
        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{title}</span>
      </div>
      <p className="text-3xl font-black text-white mb-1">{value}</p>
      {subtitle && <p className="text-[10px] text-gray-500 font-bold uppercase">{subtitle}</p>}
    </div>
  </div>
);

export default AdminPage;