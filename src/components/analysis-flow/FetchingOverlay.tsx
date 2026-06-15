import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import './analysis-flow.css';

export const FETCHING_STEP_MS = 1600;
export const FETCHING_OVERLAY_MS = FETCHING_STEP_MS * 4;

const STEPS = [
  'Conectando ao Instagram',
  'Encontrando perfil',
  'Carregando informações',
  'Finalizando',
];

interface FetchingOverlayProps {
  username: string;
  onComplete: () => void;
}

const FetchingOverlay: React.FC<FetchingOverlayProps> = ({ username, onComplete }) => {
  const [progresses, setProgresses] = useState<number[]>(() => STEPS.map(() => 0));
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const stepIndex = Math.min(STEPS.length - 1, Math.floor(elapsed / FETCHING_STEP_MS));
      const stepElapsed = elapsed - stepIndex * FETCHING_STEP_MS;
      const stepPct = Math.min(100, Math.round((stepElapsed / FETCHING_STEP_MS) * 100));

      setActiveIndex(stepIndex);
      setProgresses(
        STEPS.map((_, index) => {
          if (index < stepIndex) return 100;
          if (index === stepIndex) return stepPct;
          return 0;
        })
      );

      if (elapsed >= FETCHING_OVERLAY_MS) {
        setProgresses(STEPS.map(() => 100));
        setActiveIndex(STEPS.length - 1);
        onComplete();
        return true;
      }
      return false;
    };

    if (tick()) return;

    const intervalId = window.setInterval(() => {
      if (tick()) window.clearInterval(intervalId);
    }, 40);

    return () => window.clearInterval(intervalId);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/30 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
          <span className="font-bold text-gray-900">Acessando perfil</span>
        </div>

        <div className="space-y-5">
          {STEPS.map((step, index) => {
            const pct = progresses[index] ?? 0;
            const isActive = index === activeIndex && pct < 100;
            const isDone = pct >= 100;
            const label =
              index === 1 ? step.replace('perfil', `@${username}`) : step;

            return (
              <div key={step}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {isActive ? (
                      <Loader2 className="w-5 h-5 text-pink-500 animate-spin shrink-0" />
                    ) : isDone ? (
                      <span className="w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full border-2 border-gray-200 shrink-0" />
                    )}
                    <span
                      className={`text-sm truncate ${
                        isActive || isDone ? 'text-gray-900 font-medium' : 'text-gray-400'
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-bold shrink-0 ${
                      isDone ? 'text-pink-500' : isActive ? 'text-pink-500' : 'text-gray-300'
                    }`}
                  >
                    {pct}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <motion.div
                    className="h-full analysis-progress-gradient rounded-full"
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.15, ease: 'linear' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default FetchingOverlay;
