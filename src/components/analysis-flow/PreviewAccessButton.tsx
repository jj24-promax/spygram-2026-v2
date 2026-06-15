import React from 'react';
import { Eye } from 'lucide-react';
import './analysis-flow.css';

interface PreviewAccessButtonProps {
  onClick: () => void;
}

const PreviewAccessButton: React.FC<PreviewAccessButtonProps> = ({ onClick }) => (
  <button type="button" onClick={onClick} className="preview-access-btn analysis-cta-pulse hero-neon-border--cta">
    <Eye className="w-5 h-5 shrink-0" />
    Acessar prévia do Instagram (1 min)
  </button>
);

export default PreviewAccessButton;
