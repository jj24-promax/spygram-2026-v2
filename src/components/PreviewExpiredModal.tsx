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
        O que você viu foi só o começo
      </h2>

      <p className="preview-expired-modal__text">
        A prévia gratuita acabou, mas o relatório completo está pronto. Libere agora{' '}
        <strong>mensagens, fotos, localizações</strong> e tudo que ficou oculto neste perfil.
      </p>

      <button type="button" onClick={onCheckout} className="preview-expired-modal__cta">
        <Lock className="w-4 h-4 shrink-0" />
        Desbloquear acesso completo agora
      </button>

      <p className="preview-expired-modal__note">
        Acesso liberado na hora · Pagamento 100% seguro
      </p>
    </motion.div>
  </div>
);

export default PreviewExpiredModal;
