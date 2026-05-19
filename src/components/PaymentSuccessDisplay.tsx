import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, ShieldCheck, Mail, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PaymentSuccessDisplayProps {
  email: string;
}

const PaymentSuccessDisplay: React.FC<PaymentSuccessDisplayProps> = ({ email }) => {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 text-gray-800 animate-fade-in">
      <div className="p-10 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle size={40} className="text-green-500" />
        </motion.div>

        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-2">
          Pagamento Confirmado!
        </h2>
        <p className="text-sm text-gray-500 font-medium mb-8">
          Sua conta SpyGram já está ativa e pronta para uso.
        </p>

        <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left border border-gray-100">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Dados de Acesso</h3>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                <Mail size={16} className="text-purple-500" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase">E-mail</p>
                <p className="text-sm font-bold text-gray-800">{email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                <Lock size={16} className="text-purple-500" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase">Senha Padrão</p>
                <p className="text-sm font-bold text-gray-800">123456</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-[#78cc6d] hover:bg-[#6ab961] text-white py-4 rounded-xl font-black text-sm uppercase shadow-lg shadow-green-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            Acessar Painel SpyGram
            <ArrowRight size={18} />
          </button>

          <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            <ShieldCheck size={14} className="text-green-500" />
            Acesso 100% Seguro
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessDisplay;