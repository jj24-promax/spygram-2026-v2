import React, { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, FastForward, Lock, RotateCcw, Wrench } from 'lucide-react';
import { PREVIEW_TRIAL_MS } from '../constants/analysisFlow';
import { usePreviewTrial } from '../context/PreviewTrialContext';
import {
  getDevPreviewLockedSeconds,
  isDevPreviewTimeLocked,
  resetSpygramDevSession,
  setDevPreviewTimeLocked,
} from '../utils/invasionSession';

const DevToolsPanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [previewLocked, setPreviewLocked] = useState(() => isDevPreviewTimeLocked());
  const { timeLeft } = usePreviewTrial();

  useEffect(() => {
    const syncLock = () => setPreviewLocked(isDevPreviewTimeLocked());
    window.addEventListener('spygram:dev-preview-lock-changed', syncLock);
    return () => window.removeEventListener('spygram:dev-preview-lock-changed', syncLock);
  }, []);

  const notifyPreviewLockChanged = () => {
    window.dispatchEvent(new Event('spygram:dev-preview-lock-changed'));
  };

  const handleSkipAnalysis = useCallback(() => {
    window.dispatchEvent(new Event('spygram:dev-skip-analysis'));
  }, []);

  const handleTogglePreviewLock = useCallback(() => {
    const next = !previewLocked;

    if (next) {
      const seconds =
        timeLeft !== null && timeLeft > 0
          ? timeLeft
          : Math.floor(PREVIEW_TRIAL_MS / 1000);
      setDevPreviewTimeLocked(true, seconds);
    } else {
      setDevPreviewTimeLocked(false);
    }

    setPreviewLocked(next);
    notifyPreviewLockChanged();
  }, [previewLocked, timeLeft]);

  const handleReset = useCallback(() => {
    resetSpygramDevSession();
    window.location.href = '/';
  }, []);

  if (!import.meta.env.DEV) return null;

  const lockedLabel = previewLocked
    ? `${String(Math.floor(getDevPreviewLockedSeconds() / 60)).padStart(2, '0')}:${String(
        getDevPreviewLockedSeconds() % 60
      ).padStart(2, '0')}`
    : null;

  return (
    <div className="fixed bottom-3 left-3 z-[9999] flex flex-col items-start gap-2">
      {open && (
        <div className="w-56 rounded-xl border border-dashed border-violet-400/70 bg-white/95 p-3 shadow-lg backdrop-blur-sm">
          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-violet-600">
            Ferramentas de teste
          </p>

          <button
            type="button"
            onClick={handleSkipAnalysis}
            className="mb-2 flex w-full items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-2 text-left text-[11px] font-bold text-orange-700 transition-colors hover:bg-orange-100"
          >
            <FastForward className="h-3.5 w-3.5 shrink-0" />
            Pular análise (VSL)
          </button>

          <button
            type="button"
            onClick={handleTogglePreviewLock}
            className={`mb-2 flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-left text-[11px] font-bold transition-colors ${
              previewLocked
                ? 'border-green-300 bg-green-50 text-green-800 hover:bg-green-100'
                : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              Travar tempo da prévia
            </span>
            <span className="text-[9px] font-black uppercase">
              {previewLocked ? 'ON' : 'OFF'}
            </span>
          </button>

          {previewLocked && lockedLabel && (
            <p className="mb-2 text-[10px] font-semibold text-green-700">
              Congelado em {lockedLabel}
            </p>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-left text-[11px] font-bold text-gray-600 transition-colors hover:border-pink-300 hover:text-pink-600"
          >
            <RotateCcw className="h-3.5 w-3.5 shrink-0" />
            Resetar sessão
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        title="Ferramentas de desenvolvimento"
        className="flex items-center gap-1.5 rounded-lg border border-dashed border-violet-400/80 bg-violet-600 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide text-white shadow-sm hover:bg-violet-700 transition-colors"
      >
        <Wrench className="h-3 w-3" />
        Dev
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
      </button>
    </div>
  );
};

export default DevToolsPanel;
