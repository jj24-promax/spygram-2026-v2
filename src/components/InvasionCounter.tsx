import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';

const InvasionCounter: React.FC = () => {
  const [count, setCount] = useState(62500); // Começa perto do final para um efeito mais rápido
  const targetCount = 63000 + Math.floor(Math.random() * 500); // Randomiza um pouco o alvo

  // Pega o dia da semana atual em português
  const getDayOfWeek = () => {
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const dayIndex = new Date().getDay();
    return days[dayIndex];
  };

  const dayOfWeek = getDayOfWeek();

  useEffect(() => {
    const duration = 3000; // Duração da animação em ms
    const startTime = Date.now();

    const animateCount = () => {
      const now = Date.now();
      const elapsedTime = now - startTime;
      
      if (elapsedTime < duration) {
        const progress = elapsedTime / duration;
        const currentVal = Math.floor(62500 + progress * (targetCount - 62500));
        setCount(currentVal);
        requestAnimationFrame(animateCount);
      } else {
        setCount(targetCount);
      }
    };

    requestAnimationFrame(animateCount);
  }, [targetCount]);

  return (
    <div className="mt-6 text-center text-sm text-gray-300 flex items-center justify-center gap-2 animate-fade-in">
      <Users className="w-4 h-4 text-green-500" />
      <span>
        Mais de <span className="font-bold text-white">{count.toLocaleString('pt-BR')}</span> perfis invadidos nesta {dayOfWeek}.
      </span>
    </div>
  );
};

export default InvasionCounter;