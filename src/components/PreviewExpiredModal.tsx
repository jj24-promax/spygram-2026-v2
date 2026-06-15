import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Lock } from 'lucide-react';
import './PreviewTrial.css';

interface PreviewExpiredModalProps {
  onCheckout: () => void;
}

const PreviewExpiredModal: React.FC<PreviewExpiredModalProps> = ({ onCheckout }) => (
  <div
    className="preview-expired-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="preview-expired-title"
  >
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="preview-expired-modal__backdrop"
    />
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className="preview-expired-modal__card"
    >
      <div className="preview-expired-modal__icon-wrap">
        <Clock className="w-7 h-7 text-red-500" />
      </div>

      <h2 id="preview-expired-title" className="preview-expired-modal__title">
        Sua prévia encerrou
      </h2>

      <p className="preview-expired-modal__text">
        O tempo gratuito de acesso acabou. Siga para o checkout e desbloqueie o relatório
        completo com <strong>mensagens, fotos, localizações</strong> e muito mais.
      </p>

      <button type="button" onClick={onCheckout} className="preview-expired-modal__cta">
        <Lock className="w-4 h-4 shrink-0" />
        Ir para o checkout
      </button>

      <p className="preview-expired-modal__note">
        Acesso imediato após a confirmação do pagamento.
      </p>
    </motion.div>
  </div>
);

export default PreviewExpiredModal;
