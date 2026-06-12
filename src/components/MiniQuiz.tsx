import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TypingText from './TypingText'; // Componente de digitação
import { ArrowLeft, ArrowRight, Lightbulb, MessageSquare, CheckCircle, Clock, Eye } from 'lucide-react'; // Importar Eye e Clock
import { cn } from '../lib/utils';
import { InstagramNotification } from './InstagramNotification';
import { trackFacebookEvent } from '../services/facebookService';

interface MiniQuizProps {
  onComplete: (answers: Record<string, string>) => void;
}

interface Question {
  id: string;
  question: string;
  options: string[];
}

const questions: Question[] = [
  {
    id: 'q1',
    question: 'O que fez você procurar essa ferramenta hoje?',
    options: [
      'Suspeito de uma traição',
      'Quero verificar alguém',
      'Acho que estão escondendo algo de mim',
      'Apenas quero descobrir a verdade',
    ],
  },
  {
    id: 'q2',
    question: 'Qual foi o principal sinal de alerta?',
    options: [
      'Mudança repentina de comportamento',
      'Mensagens apagadas',
      'Horários estranhos online',
      'Distanciamento emocional',
      'Ainda não tenho provas',
    ],
  },
  {
    id: 'q3',
    question: 'Há quanto tempo você tem essa suspeita?',
    options: [
      'Menos de 1 semana',
      'Entre 1 e 4 semanas',
      'Entre 1 e 3 meses',
      'Mais de 3 meses',
    ],
  },
  {
    id: 'q4',
    question: 'Se pudesse descobrir a verdade agora, o que seria mais importante?',
    options: [
      'Conversas ocultas',
      'Mensagens apagadas',
      'Localização',
      'Fotos e mídias',
      'Confirmar ou descartar a suspeita',
    ],
  },
  {
    id: 'q5',
    question: 'Você está preparado para ver o que realmente está acontecendo?', // Pré-CTA
    options: [
      'Sim, preciso saber a verdade',
      'Tenho receio, mas preciso descobrir',
    ],
  },
];

const MiniQuiz: React.FC<MiniQuizProps> = ({ onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [typingComplete, setTypingComplete] = useState(false);

  useEffect(() => {
    // Dispara a notificação após a primeira pergunta ser exibida e o TypingText ser concluído
    if (currentQuestionIndex === 0 && typingComplete) {
      const timer = setTimeout(() => {
        setNotificationMessage('Responda algumas perguntas para liberarmos a busca de seu alvo.');
        setShowNotification(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentQuestionIndex, typingComplete]);

  const handleSelectOption = (option: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questions[currentQuestionIndex].id]: option,
    }));

    // Fecha a notificação ao responder a primeira pergunta
    if (currentQuestionIndex === 0) {
      setShowNotification(false);
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setTypingComplete(false); // Reinicia o estado de digitação para a próxima pergunta
    } else {
      // Quiz finalizado, dispara evento do Facebook Pixel
      trackFacebookEvent('QuizCompleted', {}, {
        quizAnswer1: answers['q1'] || option, // Garante que a última resposta seja incluída
        quizAnswer5: option // A resposta da última pergunta
      });
      onComplete({ ...answers, [questions[currentQuestionIndex].id]: option });
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setTypingComplete(false);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      setTypingComplete(false);
    }
  };

  const handleTypingComplete = () => {
    setTypingComplete(true);
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-black/90 backdrop-blur-md z-50">
      <AnimatePresence>
        {showNotification && (
          <InstagramNotification key="quiz-notification" message={notificationMessage} />
        )}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-8 relative"
      >
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-yellow-500 text-purple-900 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
          QUALIQUICK
        </div>

        <div className="text-center mb-6">
          <motion.div
            key={currentQuestion.id + '-icon'}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-3 mb-4 text-white"
          >
            {currentQuestion.id === 'q1' && <Lightbulb size={36} />}
            {currentQuestion.id === 'q2' && <MessageSquare size={36} />}
            {currentQuestion.id === 'q3' && <Clock size={36} />}
            {currentQuestion.id === 'q4' && <CheckCircle size={36} />}
            {currentQuestion.id === 'q5' && <Eye size={36} />} {/* Lucide's Eye for Q5 */}
          </motion.div>
          <h2 className="text-xl font-bold text-white mb-2">
            <TypingText
              key={currentQuestion.id + '-text'}
              text={currentQuestion.question}
              speed={40}
              className="text-white text-center"
              onComplete={handleTypingComplete}
            />
          </h2>
        </div>

        <div className="space-y-4">
          {typingComplete && (
            <AnimatePresence>
              {currentQuestion.options.map((option, index) => (
                <motion.button
                  key={option}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleSelectOption(option)}
                  className={cn(
                    'w-full py-3 px-4 rounded-xl text-white font-medium',
                    'bg-white/10 hover:bg-white/20 border border-white/5 transition-all text-sm',
                    answers[currentQuestion.id] === option &&
                      'bg-purple-600 border-purple-500 text-white'
                  )}
                  disabled={!typingComplete}
                >
                  {option}
                </motion.button>
              ))}
            </AnimatePresence>
          )}
        </div>

        <div className="flex justify-between mt-8">
          <button
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50 text-sm"
          >
            <ArrowLeft size={16} /> Voltar
          </button>
          <span className="text-gray-500 text-sm">
            {currentQuestionIndex + 1} / {questions.length}
          </span>
          <button
            onClick={handleNextQuestion}
            disabled={!answers[currentQuestion.id] || currentQuestionIndex === questions.length - 1}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50 text-sm"
          >
            Avançar <ArrowRight size={16} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default MiniQuiz;