import React from 'react';
import { RotateCcw } from 'lucide-react';
import { resetSpygramDevSession } from '../utils/invasionSession';

const DevResetButton: React.FC = () => {
  if (!import.meta.env.DEV) return null;

  const handleReset = () => {
    resetSpygramDevSession();
    window.location.href = '/';
  };

  return (
    <button
      type="button"
      onClick={handleReset}
      title="Limpa cache de sessão e reinicia o fluxo"
      className="fixed bottom-3 left-3 z-[9999] flex items-center gap-1.5 rounded-lg border border-dashed border-gray-400/60 bg-white/90 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-500 shadow-sm backdrop-blur-sm hover:border-pink-400 hover:text-pink-600 hover:bg-white transition-colors"
    >
      <RotateCcw className="w-3 h-3" />
      Dev: reset
    </button>
  );
};

export default DevResetButton;
