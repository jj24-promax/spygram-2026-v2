import React from 'react';
import { motion } from 'framer-motion';
import { Eye, PlayCircle } from 'lucide-react';
import './analysis-flow.css';

interface PostAnalysisRevealProps {
  username: string;
  onAccessPreview: () => void;
  onContinueVideo: () => void;
}

const PostAnalysisReveal: React.FC<PostAnalysisRevealProps> = ({
  username,
  onAccessPreview,
  onContinueVideo,
}) => (
  <div className="post-reveal-modal" role="dialog" aria-modal="true" aria-labelledby="post-reveal-title">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="post-reveal-modal__backdrop"
    />
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className="post-reveal-modal__card post-reveal"
    >
      <div className="post-reveal__alert">
        <p id="post-reveal-title" className="post-reveal__alert-title">
          <span className="post-reveal__alert-dot" />
          Conteúdo suspeito identificado
        </p>
        <p className="post-reveal__alert-text">
          A análise de <strong>@{username}</strong> foi concluída. Foram encontradas{' '}
          <strong>conversas, fotos e localizações suspeitas</strong> que exigem sua atenção
          imediata.
        </p>
      </div>

      <button type="button" onClick={onAccessPreview} className="post-reveal__cta analysis-btn-gradient-alt">
        <Eye className="w-5 h-5 shrink-0" />
        <span className="post-reveal__cta-text">
          <span className="post-reveal__cta-main">Clique aqui para ver tudo</span>
          <span className="post-reveal__cta-sub">Acesse todo o conteúdo monitorado de @{username}</span>
        </span>
      </button>

      <button type="button" onClick={onContinueVideo} className="post-reveal__continue">
        <PlayCircle className="w-4 h-4 shrink-0" />
        Continuar vendo o vídeo
      </button>
    </motion.div>
  </div>
);

export default PostAnalysisReveal;
