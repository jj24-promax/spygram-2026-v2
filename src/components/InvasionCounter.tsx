import React, { useState, useEffect, useMemo } from 'react';
import { Users } from 'lucide-react';

const InvasionCounter: React.FC = () => {
  // Fixamos o valor inicial e final para evitar mudanças durante a digitação
  const startValue = 62410;
  const targetValue = useMemo(() => 63200 + Math.floor(Math.random() * 200), []);
  
  const [count, setCount] = useState(startValue);

  // Pega o dia da semana atual em português
  const dayOfWeek = useMemo(() => {
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const dayIndex = new Date().getDay();
    return days[dayIndex];
  }, []);

  useEffect(() => {
    const duration = 2000; // Animação mais curta (2 segundos)
    const startTime = Date.now();

    const animateCount = () => {
      const now = Date.now();
      const elapsedTime = now - startTime;
      
      if (elapsedTime < duration) {
        const progress = elapsedTime / duration;
        // Função de easing para suavizar o final
        const easeOutQuad = 1 - (1 - progress) * (1 - progress);
        const currentVal = Math.floor(startValue + easeOutQuad * (targetValue - startValue));
        
        setCount(currentVal);
        requestAnimationFrame(animateCount);
      } else {
        setCount(targetValue);
      }
    };

    const animationFrame = requestAnimationFrame(animateCount);
    return () => cancelAnimationFrame(animationFrame);
  }, [targetValue]); // Só depende do targetValue que é memoizado

  return (
    <div className="mt-6 text-center text-sm text-gray-300 flex items-center justify-center gap-2 animate-fade-in pointer-events-none select-none">
      <Users className="w-4 h-4 text-green-500" />
      <span>
        Mais de <span className="font-bold text-white tabular-nums">{count.toLocaleString('pt-BR')}</span> perfis invadidos nesta {dayOfWeek}.
      </span>
    </div>
  );
};

export default InvasionCounter;