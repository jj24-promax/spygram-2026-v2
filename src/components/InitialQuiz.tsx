import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, CheckCircle, HelpCircle } from 'lucide-react';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
}

const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "O que fez você procurar essa ferramenta hoje?",
    options: [
      "Suspeito de uma traição",
      "Quero verificar alguém",
      "Acho que estão escondendo algo de mim",
      "Apenas quero descobrir a verdade",
    ],
  },
  {
    id: 2,
    question: "Qual foi o principal sinal de alerta?",
    options: [
      "Mudança repentina de comportamento",
      "Mensagens apagadas",
      "Horários estranhos online",
      "Distanciamento emocional",
      "Ainda não tenho provas",
    ],
  },
  {
    id: 3,
    question: "Há quanto tempo você tem essa suspeita?",
    options: ["Menos de 1 semana", "Entre 1 e 4 semanas", "Entre 1 e 3 meses", "Mais de 3 meses"],
  },
  {
    id: 4,
    question: "Se pudesse descobrir a verdade agora, o que seria mais importante?",
    options: [
      "Conversas ocultas",
      "Mensagens apagadas",
      "Localização",
      "Fotos e mídias",
      "Confirmar ou descartar a suspeita",
    ],
  },
  {
    id: 5,
    question: "Você está preparado para ver o que realmente está acontecendo?",
    options: ["Sim, preciso saber a verdade", "Tenho receio, mas preciso descobrir"],
  },
];

interface InitialQuizProps {
  onQuizComplete: () => void;
}

const InitialQuiz: React.FC<InitialQuizProps> = ({ onQuizComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [lastQuestionAnswered, setLastQuestionAnswered] = useState(false); // Novo estado

  const handleAnswer = (answer: string) => {
    setAnswers((prev) => [...prev, answer]);
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setLastQuestionAnswered(true); // Marca que a última pergunta foi respondida
    }
  };

  const currentQuestion = quizQuestions[currentQuestionIndex];

  return (
    <div className="relative z-20 text-white flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4 pt-12">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-lg bg-black/80 backdrop-blur-lg border border-white/10 rounded-[2.5rem] p-8 text-center shadow-2xl relative"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <HelpCircle className="w-8 h-8 text-yellow-500" />
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
              {`Pergunta ${currentQuestion.id}/${quizQuestions.length}`}
            </h2>
          </div>

          <p className="text-xl font-bold mb-8 leading-relaxed text-gray-200">
            {currentQuestion.question}
          </p>

          <div className="space-y-4">
            {currentQuestion.options.map((option, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.1 }}
                onClick={() => handleAnswer(option)}
                className="w-full py-4 px-6 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between text-lg font-semibold hover:bg-white/10 transition-colors active:scale-98"
              >
                <span className="text-gray-200 text-left flex-1">{option}</span>
                <ChevronRight className="w-6 h-6 text-gray-400" />
              </motion.button>
            ))}
          </div>

          {/* O botão 'INICIAR ANÁLISE DO PERFIL' só aparece se a última pergunta foi respondida */}
          {currentQuestion.id === quizQuestions.length && lastQuestionAnswered && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              onClick={onQuizComplete}
              className="w-full py-5 mt-8 rounded-2xl font-black text-lg text-white
                         bg-gradient-to-r from-purple-600 via-pink-500 to-yellow-500
                         shadow-xl shadow-pink-500/20
                         flex items-center justify-center gap-3
                         transition-all uppercase tracking-[0.2em] hover:brightness-110 active:scale-95"
            >
              <CheckCircle className="w-5 h-5" />
              INICIAR ANÁLISE DO PERFIL
            </motion.button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default InitialQuiz;