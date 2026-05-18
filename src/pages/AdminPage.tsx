import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { 
  Users, DollarSign, Search, MapPin, ShieldCheck, 
  CreditCard, Filter, LogOut, RotateCcw, Beaker
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
      toast.error('Erro ao carregar dados: ' + (error.message || 'Erro desconhecido'));
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

  const handleCreateTestLead = async () => {
    const testData = {
      username_searched: 'neymarjr',
      full_name: 'Neymar Jr (Teste)',
      profile_pic: 'https://images.weserv.nl/?url=https://instagram.fria3-1.fna.fbcdn.net/v/t51.2885-19/44884218_345707102882504_2046091888143237120_n.jpg?_nc_ht=instagram.fria3-1.fna.fbcdn.net&_nc_cat=1&_nc_ohc=1&edm=AAAAAA&ccb=7-5&oh=00_AfC-jL5Lz-f5z5-f5z5-f5z5-f5z5-f5z5-f5z5-f5z5&oe=65C5C5C5&_nc_sid=AAAAAA',
      email: 'teste@spygram.com',
      phone: '(11) 99999-9999',
      document: '123.456.789-00',
      status: 'checkout',
      total_amount: 29.90,
      city: 'Santos',
      state: 'São Paulo',
      user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    };

    const { error } = await supabase.from('leads').insert([testData]);
    
    if (error) {
      toast.error('Erro ao gerar lead teste.');
    } else {
      setSearchTerm('');
      setStatusFilter('all');
      toast.success('Lead de teste gerado!');
      fetchLeads(true);
    }
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
      // Filtragem segura para evitar erros com campos nulos
      const username = (lead.username_searched || '').toLowerCase();
      const email = (lead.email || '').toLowerCase();
      const phone = (lead.phone || '');
      const document = (lead.document || '');
      const fullName = (lead.full_name || '').toLowerCase();

      const matchesSearch = searchLower === '' || 
        username.includes(searchLower) ||
        email.includes(searchLower) ||
        phone.includes(searchLower) ||
        document.includes(searchLower) ||
        fullName.includes(searchLower);
      
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      
      return matchesSearch && matchesStatus;
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
              <span className="text-red-500 text-[10px] font-black tracking-widest">LIVE</span>
            </div>
          </div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Monitoramento Tático de Leads e Conversões</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={handleCreateTestLead} className="flex items-center gap-2 px-4 py-2.5 bg-purple-600/10 border border-purple-600/20 text-purple-400 rounded-xl hover:bg-purple-600/20 transition-all text-xs font-bold uppercase tracking-widest">
            <Beaker className="w-4 h-4" />
            <span className="hidden sm:inline">Gerar Lead Teste</span>
          </button>
          <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-widest">
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
          <div className="bg-purple-600 px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-purple-600/20">
            <DollarSign className="w-4 h-4 text-white" />
            <span className="font-black text-white text-sm">R$ {metrics.revenue.toFixed(2)}</span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2.5 bg-red-600/10 border border-red-600/20 text-red-500 rounded-xl hover:bg-red-600/20 transition-all text-xs font-bold uppercase tracking-widest">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard title="Visitantes Únicos" value={metrics.total} icon={Users} color="text-blue-500" />
        <StatCard title="Checkouts" value={metrics.checkoutCount} icon={CreditCard} color="text-yellow-500" subtitle={`${((metrics.checkoutCount/metrics.total)*100).toFixed(1)}% do tráfego`} />
        <StatCard title="Pix Gerados" value={metrics.pixCount} icon={CreditCard} color="text-pink-500" subtitle={`${((metrics.pixCount/metrics.checkoutCount)*100 || 0).toFixed(1)}% dos checkouts`} />
        <StatCard title="Vendas Pagas" value={metrics.paidCount} icon={ShieldCheck} color="text-green-500" subtitle={`${metrics.conversion.toFixed(1)}% de conversão final`} />
      </div>

      <div className="lg:col-span-3 space-y-6">
        <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Buscar por @username, Nome, Email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/50 border border-gray-800 rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-purple-500 outline-none transition-all"
              />
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-black/50 border border-gray-800 rounded-2xl py-3 pl-12 pr-8 text-xs font-bold uppercase appearance-none outline-none"
                >
                  <option value="all">Todos Status</option>
                  <option value="pesquisou">Pesquisou</option>
                  <option value="confirmou_alvo">Confirmou Alvo</option>
                  <option value="checkout">No Checkout</option>
                  <option value="gerou_pix">Gerou Pix</option>
                  <option value="pagou">Pago</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] text-gray-500 uppercase font-black border-b border-gray-800/50">
                  <th className="pb-4 px-4">Alvo / Localização</th>
                  <th className="pb-4 px-4">Identificação do Lead</th>
                  <th className="pb-4 px-4">E-mail / WhatsApp</th>
                  <th className="pb-4 px-4">Status / Valor</th>
                  <th className="pb-4 px-4">Data/Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/30">
                {filteredLeads.length > 0 ? filteredLeads.map((lead) => (
                  <tr key={lead.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="py-5 px-4">
                      <div className="flex items-center gap-3">
                        <img src={lead.profile_pic || '/perfil.jpg'} className="w-10 h-10 rounded-xl object-cover border border-white/5" />
                        <div>
                          <p className="text-sm font-bold text-white">@{lead.username_searched}</p>
                          <div className="flex items-center gap-1 text-[10px] text-gray-500">
                            <MapPin size={10} className="text-purple-500" />
                            <span>{lead.city || 'Desconhecida'}, {lead.state || '??'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <div className="space-y-1">
                        <p className="text-xs font-black text-gray-200 uppercase">{lead.full_name || 'Visitante Anônimo'}</p>
                        <p className="text-[10px] font-bold text-purple-400 font-mono tracking-tighter">DOC: {lead.document || '---'}</p>
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <div className="space-y-1">
                        <p className="text-[11px] font-medium text-blue-300 lowercase">{lead.email || '---'}</p>
                        <p className="text-[11px] font-bold text-green-400">{lead.phone || '---'}</p>
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <div className="flex flex-col gap-1.5">
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg w-fit uppercase ${
                          lead.status === 'pagou' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                          lead.status === 'gerou_pix' ? 'bg-pink-500/10 text-pink-500 border border-pink-500/20' :
                          lead.status === 'checkout' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                          'bg-gray-800/50 text-gray-400'
                        }`}>
                          {lead.status}
                        </span>
                        {lead.total_amount > 0 && (
                          <p className="text-xs font-black text-white">R$ {Number(lead.total_amount).toFixed(2)}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <p className="text-[10px] text-gray-500">{new Date(lead.created_at).toLocaleDateString('pt-BR')}</p>
                      <p className="text-[10px] font-bold text-gray-400">{new Date(lead.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-gray-600 font-bold uppercase tracking-widest text-xs">
                      Nenhum lead encontrado com os filtros atuais
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
  <div className="bg-gray-900/40 border border-gray-800 p-6 rounded-3xl relative overflow-hidden group hover:border-white/10 transition-all">
    <div className={`absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity`}>
      <Icon size={80} />
    </div>
    <div className="relative z-10">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-xl bg-white/5 ${color}`}>
          <Icon size={18} />
        </div>
        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{title}</span>
      </div>
      <p className="text-3xl font-black text-white mb-1">{value}</p>
      {subtitle && <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">{subtitle}</p>}
    </div>
  </div>
);

export default AdminPage;