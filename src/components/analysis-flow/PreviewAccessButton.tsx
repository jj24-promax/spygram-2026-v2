import type { FC } from 'react';
import { PREVIEW_TRIAL_LABEL } from '../../constants/analysisFlow';
import { Eye } from 'lucide-react';
import './analysis-flow.css';

interface PreviewAccessButtonProps {
  onClick: () => void;
}

const PreviewAccessButton: FC<PreviewAccessButtonProps> = ({ onClick }) => (
  <button type="button" onClick={onClick} className="preview-access-btn analysis-cta-pulse hero-neon-border--cta">
    <Eye className="w-5 h-5 shrink-0" />
    Acessar prévia do Instagram ({PREVIEW_TRIAL_LABEL})
  </button>
);

export default PreviewAccessButton;
