import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, Clock, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { trackLead } from '../services/trackingService';
import { supabase } from '../integrations/supabase/client';

interface PixPaymentDisplayProps {
  paymentCode: string;
  paymentCodeBase64: string;
  transactionId: string;
  amount: number;
  onConfirm: () => void;
  onSuccess?: () => void; // Callback para quando o pagamento for detectado
  leadData?: {
    nome: string;
    email: string;
    whatsapp: string;
    documento: string;
    username_searched?: string;
    profile_pic?: string;
  };
}

const PixPaymentDisplay: React.FC<PixPaymentDisplayProps> = ({ 
  paymentCode, 
  paymentCodeBase64, 
  transactionId, 
  amount,
  onConfirm,
  onSuccess,
  leadData
}) => {
  const TOTAL_TIME = 600; // 10 minutos em segundos
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [copied, setCopied] = useState(false);
  const hasTracked = useRef(false);

  // 1. Salvamento automático do lead ao carregar a página
  useEffect(() => {
    if (!hasTracked.current && leadData) {
      trackLead({
        full_name: leadData.nome,
        email: leadData.email,
        phone: leadData.whatsapp,
        document: leadData.documento,
        username_searched: leadData.username_searched,
        profile_pic: leadData.profile_pic,
        status: 'gerou_pix',
        amount: amount
      });
      hasTracked.current = true;
    }
  }, [leadData, amount]);

  // 2. Verificação Automática (Polling) de status de pagamento
  useEffect(() => {
    const currentLeadId = sessionStorage.getItem('current_lead_id');
    if (!currentLeadId) return;

    // Função que checa o status no banco
    const checkPaymentStatus = async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('status')
        .eq('id', currentLeadId)
        .single();

      if (!error && data?.status === 'pagou') {
        if (onSuccess) onSuccess();
      }
    };

    // Intervalo de checagem a cada 5 segundos
    const interval = setInterval(checkPaymentStatus, 5000);
    
    // Inscrição em tempo real como reforço
    const channel = supabase
      .channel('pix-status-check')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'leads',
        filter: `id=eq.${currentLeadId}`
      }, (payload) => {
        if (payload.new.status === 'pagou') {
          if (onSuccess) onSuccess();
        }
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [onSuccess]);

  // 3. Timer regressivo
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const cleanBase64 = paymentCodeBase64?.replace(/\s/g, '') || '';
  const qrCodeSrc = cleanBase64.startsWith('data:image') 
    ? cleanBase64 
    : `data:image/png;base64,${cleanBase64}`;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(paymentCode);
    setCopied(true);
    toast.success("Código Copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const progressPercentage = (timeLeft / TOTAL_TIME) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden border border-gray-100 text-gray-800 animate-fade-in">
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-400 font-bold uppercase">Pedido: <span className="text-gray-600">{transactionId.substring(0, 15).toUpperCase()}</span></span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-500">Valor: <span className="text-[#00bcd4]">R$ {amount.toFixed(2).replace('.', ',')}</span></span>
          <img src="https://logopng.com.br/logos/pix-106.png" alt="Pix" className="h-4 grayscale opacity-50" />
        </div>
      </div>

      <div className="p-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Realize o pagamento do PIX</h2>
            <ol className="space-y-3 text-sm text-gray-600 mb-8">
              <li>1. <span className="font-bold">Copie</span> o código abaixo</li>
              <li>2. Abra o <span className="font-bold">app do seu banco</span></li>
              <li>3. Cole o código na opção <span className="font-bold">PIX Copia e Cola</span> ou escaneie o QR Code ao lado.</li>
            </ol>

            <div className="relative group">
              <textarea
                readOnly
                value={paymentCode}
                className="w-full h-24 bg-[#fcfcfc] border border-gray-200 rounded-lg p-3 text-[10px] font-mono text-gray-500 resize-none focus:outline-none scrollbar-hide"
              />
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 bg-white border border-gray-200 px-3 py-1.5 rounded-md text-[10px] font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm"
              >
                {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-4 border border-gray-100 rounded-xl bg-white shadow-sm min-w-[180px] min-h-[180px]">
            {paymentCodeBase64 ? (
              <img 
                src={qrCodeSrc} 
                alt="QR Code Pix" 
                className="w-40 h-40 object-contain"
              />
            ) : (
              <div className="w-40 h-40 flex items-center justify-center bg-gray-50 text-gray-300 text-[10px] text-center p-4 uppercase font-bold">
                Carregando QR Code...
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onConfirm}
          className="w-full mt-8 bg-[#28a745] hover:bg-[#218838] text-white py-3.5 rounded-lg font-bold text-base flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
        >
          Confirmar Compra <ChevronRight size={18} />
        </button>

        <div className="mt-8 bg-[#fff5f5] border border-[#ffeded] rounded-lg p-4">
          <div className="flex items-center gap-3 text-[#f15c5c] text-xs font-bold mb-3">
            <Clock size={16} />
            <span>Faltam <span className="font-mono">{formatTime(timeLeft)}</span> minutos para o pix expirar...</span>
          </div>
          
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#f15c5c] transition-all duration-1000 ease-linear" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          <p className="text-[10px] text-gray-400 mt-4 text-center">
            A compra será confirmada automaticamente após o pagamento e você receberá imediatamente sua compra.
          </p>
        </div>

        <div className="mt-12 text-left">
          <h3 className="text-sm font-bold text-gray-800 mb-6">Está com dúvidas de como realizar o pagamento?</h3>
          <ul className="space-y-4 text-[11px] text-gray-500">
            <li className="flex gap-2">1. <p>Abra o aplicativo do seu banco;</p></li>
            <li className="flex gap-2">2. <p>Selecione a opção <span className="font-bold">PIX copia e cola</span>, e cole o código. Ou você pode escanear o QR Code utilizando a opção de <span className="font-bold">Pagar com Pix / Escanear QR code</span></p></li>
            <li className="flex gap-2">3. <p>Após o pagamento, você receberá por email os dados de acesso à sua compra. Lembre-se de verificar a caixa de SPAM.</p></li>
          </ul>
        </div>
      </div>
      
      <div className="w-full h-1 bg-gradient-to-r from-transparent via-gray-100 to-transparent mb-8 mx-auto max-w-[80%]" />
    </div>
  );
};

export default PixPaymentDisplay;