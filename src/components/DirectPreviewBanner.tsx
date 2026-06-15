import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { usePreviewTrial } from '../context/PreviewTrialContext';

const DirectPreviewBanner: React.FC = () => {
  const navigate = useNavigate();
  const { timeLeft, isPreviewActive } = usePreviewTrial();

  if (!isPreviewActive || timeLeft === null) return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="direct-preview-banner">
      <div className="direct-preview-banner-content">
        <span className="direct-preview-timer">
          <Zap size={16} className="direct-preview-zap" />
          Prévia disponível por {formatTime(timeLeft)}
        </span>
        <button
          type="button"
          className="direct-preview-vip-btn"
          onClick={() => navigate('/checkout')}
        >
          Virar VIP
        </button>
      </div>
    </div>
  );
};

export default DirectPreviewBanner;
