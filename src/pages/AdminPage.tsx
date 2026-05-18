import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../integrations/supabase/client';
import { 
  Users, DollarSign, Target, TrendingUp, Search, Calendar, 
  MapPin, ExternalLink, Smartphone, Monitor, ShieldCheck, 
  CreditCard, Eye, ArrowUpRight, Filter, Download
} from 'lucide-react';
import Loader from '../components/Loader';

interface Lead {
  id: string;
  username_searched: string;
  full_name: string;
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
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchLeads();
    
    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        fetchLeads();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchLeads = async () => {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setLeads(data);
    setLoading(false);
  };

  // Métricas Calculadas
  const metrics = useMemo(() => {
    const total = leads.length;
    const paid = leads.filter(l => l.status === 'pagou');
    const pixGenerated = leads.filter(l => l.status === 'gerou_pix' || l.status === 'pagou');
    const checkouts = leads.filter(l => l.status === 'checkout' || l.status === 'gerou_pix' || l.status === 'pagou');
    const revenue = paid.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
    
    // Contagem por cidade
    const cities: {[key: string]: number} = {};
    leads.forEach(l => { if(l.city) cities[l.city] = (cities[l.city] || 0) + 1 });
    const topCities = Object.entries(cities).sort((a,b) => b[1] - a[1]).slice(0, 5);

    // Contagem por dispositivo
    let mobile = 0;
    leads.forEach(l => { if(l.user_agent?.toLowerCase().includes('mobile')) mobile++ });

    return {
      total,
      paidCount: paid.length,
      pixCount: pixGenerated.length,
      checkoutCount: checkouts.length,
      revenue,
      conversion: total > 0 ? (paid.length / total) * 100 : 0,
      topCities,
      mobilePercentage: total > 0 ? (mobile / total) * 100 : 0
    };
  }, [leads]);

  // Filtro de Busca
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = 
        (lead.username_searched?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.phone?.includes(searchTerm));
      
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [leads, searchTerm, statusFilter]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader /></div>;

  return (
    <div className="min-h-screen bg-[#080808] text-gray-200 p-4 md:p-8 font-sans">
      
      {/* Header Fixo */}
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
        
        <div className="flex gap-2">
          <button onClick={() => window.location.reload()} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
            <Calendar className="w-5 h-5" />
          </button>
          <div className="bg-purple-600 px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-purple-600/20">
            <DollarSign className="w-5 h-5" />
            <span className="font-black text-white">R$ {metrics.revenue.toFixed(2)}</span>
          </div>
        </div>
      </header>

      {/* Grid de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard title="Visitantes Únicos" value={metrics.total} icon={Users} color="text-blue-500" />
        <StatCard title="Checkouts" value={metrics.checkoutCount} icon={CreditCard} color="text-yellow-500" subtitle={`${((metrics.checkoutCount/metrics.total)*100).toFixed(1)}% do tráfego`} />
        <StatCard title="Pix Gerados" value={metrics.pixCount} icon={QrCode} color="text-pink-500" subtitle={`${((metrics.pixCount/metrics.checkoutCount)*100 || 0).toFixed(1)}% dos checkouts`} />
        <StatCard title="Vendas Pagas" value={metrics.paidCount} icon={ShieldCheck} color="text-green-500" subtitle={`${metrics.conversion.toFixed(1)}% de conversão final`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        
        {/* Lado Esquerdo: Filtros e Tabela */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Buscar por @username, email ou telefone..." 
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
                    <th className="pb-4 px-4">Alvo / Origem</th>
                    <th className="pb-4 px-4">Dados do Lead</th>
                    <th className="pb-4 px-4">Status / Valor</th>
                    <th className="pb-4 px-4">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/30">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-5 px-4">
                        <div className="flex items-center gap-3">
                          <img src={lead.profile_pic || '/perfil.jpg'} className="w-10 h-10 rounded-xl object-cover border border-white/5" />
                          <div>
                            <p className="text-sm font-bold text-white">@{lead.username_searched}</p>
                            <div className="flex items-center gap-1 text-[10px] text-gray-500">
                              {lead.user_agent?.toLowerCase().includes('mobile') ? <Smartphone size={10} /> : <Monitor size={10} />}
                              <span>{lead.city}, {lead.state}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-300">{lead.full_name || 'Anônimo'}</p>
                          <p className="text-[10px] text-gray-500">{lead.email || 'E-mail não informado'}</p>
                          <p className="text-[10px] text-gray-500">{lead.phone || 'Sem contato'}</p>
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Lado Direito: Informações Secundárias */}
        <div className="space-y-8">
          
          {/* Top Cidades */}
          <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
              <MapPin size={14} className="text-purple-500" /> Geografia dos Leads
            </h3>
            <div className="space-y-4">
              {metrics.topCities.map(([city, count]) => (
                <div key={city} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span>{city}</span>
                    <span className="text-purple-400">{count} leads</span>
                  </div>
                  <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500" style={{ width: `${(count/metrics.total)*100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Análise de Dispositivo */}
          <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
              <Smartphone size={14} className="text-blue-500" /> Plataforma de Acesso
            </h3>
            <div className="flex items-center gap-6">
              <div className="relative w-20 h-20">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" className="stroke-gray-800" strokeWidth="4" />
                  <circle cx="18" cy="18" r="16" fill="none" className="stroke-blue-500" strokeWidth="4" 
                    strokeDasharray={`${metrics.mobilePercentage} 100`} strokeLinecap="round" transform="rotate(-90 18 18)" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black">
                  {metrics.mobilePercentage.toFixed(0)}%
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" /> Mobile
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold">
                  <div className="w-2 h-2 bg-gray-800 rounded-full" /> Desktop
                </div>
              </div>
            </div>
          </div>

          {/* Segurança */}
          <div className="bg-purple-600/10 border border-purple-500/20 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="text-purple-500 w-8 h-8" />
              <div>
                <p className="text-xs font-black text-white uppercase tracking-tight">Sistema Seguro</p>
                <p className="text-[10px] text-purple-400 font-bold uppercase">Criptografia Militar</p>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Todos os dados capturados são processados via Edge Functions e armazenados em tabelas privadas no Supabase.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

// Componente Auxiliar para Cards de Estatística
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

// Ícone Auxiliar QrCode
const QrCode = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16h.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v.01"/>
  </svg>
);

export default AdminPage;