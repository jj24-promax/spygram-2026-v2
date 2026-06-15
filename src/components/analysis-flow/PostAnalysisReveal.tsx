import React from 'react';
import { motion } from 'framer-motion';
import { Eye, PlayCircle } from 'lucide-react';
import './analysis-flow.css';

interface PostAnalysisRevealProps {
  username: string;
  onAccessPreview: () => void;
  onContinueVideo?: () => void;
  showContinueOption?: boolean;
}

const PostAnalysisReveal: React.FC<PostAnalysisRevealProps> = ({
  username,
  onAccessPreview,
  onContinueVideo,
  showContinueOption = true,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    className="post-reveal"
  >
    <div className="post-reveal__alert">
      <p className="post-reveal__alert-title">
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

    {showContinueOption && onContinueVideo && (
      <button type="button" onClick={onContinueVideo} className="post-reveal__continue">
        <PlayCircle className="w-4 h-4 shrink-0" />
        Continuar vendo o vídeo
      </button>
    )}
  </motion.div>
);

export default PostAnalysisReveal;
