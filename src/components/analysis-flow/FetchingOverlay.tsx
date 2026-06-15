import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import './analysis-flow.css';

const STEPS = [
  'Conectando ao Instagram',
  'Encontrando perfil',
  'Carregando informações',
  'Finalizando',
];

interface FetchingOverlayProps {
  username: string;
}

const FetchingOverlay: React.FC<FetchingOverlayProps> = ({ username }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(12);

  useEffect(() => {
    const stepTimer = window.setInterval(() => {
      setActiveIndex((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 1400);

    const progressTimer = window.setInterval(() => {
      setProgress((prev) => (prev < 92 ? prev + Math.random() * 8 : prev));
    }, 500);

    return () => {
      window.clearInterval(stepTimer);
      window.clearInterval(progressTimer);
    };
  }, []);

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
            const isActive = index === activeIndex;
            const isDone = index < activeIndex;
            const label =
              index === 1 ? step.replace('perfil', `@${username}`) : step;
            const pct =
              index < activeIndex ? 100 : index === activeIndex ? Math.round(progress) : 0;

            return (
              <div key={step}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {isActive ? (
                      <Loader2 className="w-5 h-5 text-pink-500 animate-spin shrink-0" />
                    ) : (
                      <span
                        className={`w-5 h-5 rounded-full border-2 shrink-0 ${
                          isDone ? 'border-pink-500 bg-pink-500' : 'border-gray-200'
                        }`}
                      />
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
                      isActive ? 'text-pink-500' : 'text-gray-300'
                    }`}
                  >
                    {pct}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <motion.div
                    className="h-full analysis-progress-gradient rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.4 }}
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
