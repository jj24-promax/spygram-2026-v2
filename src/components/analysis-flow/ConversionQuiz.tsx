import React, { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronRight, ShieldAlert, Sparkles, UserRound } from 'lucide-react';
import './analysis-flow.css';

const QUIZ_STEPS = [
  {
    id: 1,
    eyebrow: 'Diagnóstico rápido',
    question: 'Você sente que algo está sendo escondido de você no Instagram?',
    options: [
      { id: 'a', label: 'Sim — tenho suspeitas fortes', hint: 'Sua intuição raramente erra' },
      { id: 'b', label: 'Às vezes — isso me incomoda', hint: 'A dúvida consome mais do que a verdade' },
      { id: 'c', label: 'Quero ter certeza antes de agir', hint: 'Informação é poder' },
    ],
  },
  {
    id: 2,
    eyebrow: 'O que mais pesa',
    question: 'Se pudesse descobrir agora, o que mais te preocupa?',
    options: [
      { id: 'a', label: 'Conversas secretas e mensagens apagadas', hint: 'DMs que você nunca viu' },
      { id: 'b', label: 'Fotos, stories e conteúdo oculto', hint: 'O que foi escondido do seu olhar' },
      { id: 'c', label: 'Localização e movimentos suspeitos', hint: 'Onde esteve e com quem' },
    ],
  },
  {
    id: 3,
    eyebrow: 'Última pergunta',
    question: 'Quanto tempo você aguenta conviver com essa incerteza?',
    options: [
      { id: 'a', label: 'Não aguento mais — quero resolver hoje', hint: 'A clareza não pode esperar' },
      { id: 'b', label: 'Prefiro a verdade à dúvida', hint: 'Chega de imaginar o pior' },
      { id: 'c', label: 'Estou pronto(a) para descobrir tudo', hint: 'Hora de ver o que está escondido' },
    ],
  },
] as const;

interface ConversionQuizProps {
  onComplete: () => void;
}

const ConversionQuiz: React.FC<ConversionQuizProps> = ({ onComplete }) => {
  const [logoFailed, setLogoFailed] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const step = QUIZ_STEPS[stepIndex];
  const progress = showResult ? 100 : ((stepIndex + (selectedId ? 1 : 0)) / QUIZ_STEPS.length) * 100;

  const handleSelect = useCallback(
    (optionId: string) => {
      if (selectedId) return;
      setSelectedId(optionId);

      window.setTimeout(() => {
        if (stepIndex < QUIZ_STEPS.length - 1) {
          setStepIndex((prev) => prev + 1);
          setSelectedId(null);
        } else {
          setShowResult(true);
        }
      }, 420);
    },
    [selectedId, stepIndex]
  );

  return (
    <div className="hero-page conversion-quiz">
      <div className="hero-page__glow hero-page__glow--left" aria-hidden />
      <div className="hero-page__glow hero-page__glow--right" aria-hidden />

      <div className="hero-page__content">
        <div className="hero-card hero-neon-surface conversion-quiz__card">
          <div className="conversion-quiz__header">
            <div className="hero-card__logo">
              <div className="hero-card__logo-icon analysis-btn-gradient">
                {!logoFailed ? (
                  <img
                    src="/spygram_transparentebranco.png"
                    alt=""
                    className="hero-card__logo-img"
                    onError={() => setLogoFailed(true)}
                  />
                ) : (
                  <UserRound className="hero-card__logo-fallback" aria-hidden />
                )}
              </div>
              <span className="hero-card__logo-text">
                <span className="hero-card__logo-spy">SPY</span>
                <span className="hero-card__logo-gram">GRAM</span>
              </span>
            </div>

            <div className="conversion-quiz__progress" aria-hidden>
              <div className="conversion-quiz__progress-track">
                <motion.div
                  className="conversion-quiz__progress-fill"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                />
              </div>
              <p className="conversion-quiz__progress-label">
                {showResult ? 'Análise personalizada pronta' : `Pergunta ${stepIndex + 1} de ${QUIZ_STEPS.length}`}
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!showResult ? (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="conversion-quiz__body"
              >
                <p className="conversion-quiz__eyebrow">
                  <Sparkles className="conversion-quiz__eyebrow-icon" aria-hidden />
                  {step.eyebrow}
                </p>
                <h1 className="conversion-quiz__question">{step.question}</h1>

                <div className="conversion-quiz__options" role="list">
                  {step.options.map((option) => {
                    const isSelected = selectedId === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="listitem"
                        onClick={() => handleSelect(option.id)}
                        disabled={!!selectedId}
                        className={`conversion-quiz__option hero-neon-border${isSelected ? ' conversion-quiz__option--selected' : ''}`}
                      >
                        <span className="conversion-quiz__option-copy">
                          <span className="conversion-quiz__option-label">{option.label}</span>
                          <span className="conversion-quiz__option-hint">{option.hint}</span>
                        </span>
                        <ChevronRight className="conversion-quiz__option-chevron" aria-hidden />
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                className="conversion-quiz__result"
              >
                <div className="conversion-quiz__result-icon" aria-hidden>
                  <ShieldAlert className="w-7 h-7 text-white" />
                </div>
                <p className="conversion-quiz__result-badge">Perfil de risco identificado</p>
                <h2 className="conversion-quiz__result-title">
                  Você está a <span className="hero-card__title-accent">um passo</span> da verdade
                </h2>
                <p className="conversion-quiz__result-text">
                  Com base nas suas respostas, o SpyGram pode mapear conversas, fotos e movimentos
                  suspeitos em <strong>menos de 2 minutos</strong>. Informe o @ e inicie sua análise
                  gratuita agora.
                </p>

                <ul className="conversion-quiz__result-list">
                  <li>Monitoramento em tempo real</li>
                  <li>Conteúdo oculto revelado</li>
                  <li>1 análise grátis por dispositivo</li>
                </ul>

                <button
                  type="button"
                  onClick={onComplete}
                  className="conversion-quiz__cta analysis-cta-pulse hero-neon-border hero-neon-border--cta"
                >
                  <ArrowRight className="w-5 h-5 shrink-0" aria-hidden />
                  Continuar para análise grátis
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="conversion-quiz__footer">
          Respostas confidenciais · Leva menos de 20 segundos
        </p>
      </div>
    </div>
  );
};

export default ConversionQuiz;
