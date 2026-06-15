import React from 'react';
import { motion } from 'framer-motion';
import { Eye, PlayCircle } from 'lucide-react';
import './analysis-flow.css';

interface PreviewAccessChoiceProps {
  username: string;
  onContinueVideo: () => void;
  onAccessPreview: () => void;
}

const PreviewAccessChoice: React.FC<PreviewAccessChoiceProps> = ({
  username,
  onContinueVideo,
  onAccessPreview,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="preview-choice hero-neon-surface"
  >
    <div className="preview-choice__badge">Análise concluída</div>
    <h3 className="preview-choice__title">Prévia liberada para @{username}</h3>
    <p className="preview-choice__text">
      Gostaria de <strong>continuar vendo o vídeo</strong> ou ter{' '}
      <strong>acesso às prévias</strong> do Instagram?
    </p>
    <p className="preview-choice__hint">
      A prévia inclui feed, Direct e notificações por <strong>1 minuto</strong>.
    </p>

    <div className="preview-choice__actions">
      <button type="button" onClick={onAccessPreview} className="preview-choice__btn preview-choice__btn--primary analysis-btn-gradient-alt">
        <Eye className="w-5 h-5 shrink-0" />
        Acessar prévia agora
      </button>
      <button type="button" onClick={onContinueVideo} className="preview-choice__btn preview-choice__btn--secondary">
        <PlayCircle className="w-5 h-5 shrink-0" />
        Continuar vendo o vídeo
      </button>
    </div>
  </motion.div>
);

export default PreviewAccessChoice;
