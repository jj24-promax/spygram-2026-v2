import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '../../src/lib/utils'; // Importando a função cn
import { addUtmsToUrl } from '../../src/utils/utm'; // Importando propagação de UTMs

interface SparkleButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  checkoutUrl?: string; // Nova prop para o URL de checkout
}

const SparkleButton: React.FC<SparkleButtonProps> = ({ children, onClick, disabled = false, checkoutUrl }) => {
  const baseButtonClasses = `
    relative z-10 flex items-center justify-center gap-2 rounded-full border-none
    px-6 py-3 text-sm font-bold text-white w-full
    bg-gradient-to-r from-purple-600 via-pink-500 to-yellow-400
    transition-all duration-300 ease-in-out
    focus:outline-none 
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const interactiveClasses = `
    cursor-pointer
    active:scale-95
    hover:brightness-110
  `;

  const handleButtonClick = () => {
    if (checkoutUrl) {
      const activeCheckoutUrl = addUtmsToUrl(checkoutUrl);
      window.open(activeCheckoutUrl, '_blank'); // Abre o URL com as UTMs preservadas
    } else if (onClick) {
      onClick(); // Executa o onClick padrão se não houver checkoutUrl
    }
  };

  return (
    <div className={cn("relative w-full overflow-visible", !disabled && "group")}>
      {/* Efeito de brilho externo */}
      <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 via-purple-600 to-yellow-500 rounded-full opacity-0 group-hover:opacity-100 blur-md transition duration-500 animate-pulse"></div>
      
      <button
        onClick={handleButtonClick}
        disabled={disabled}
        className={cn(
          baseButtonClasses,
          !disabled && interactiveClasses
        )}
      >
        <Sparkles className="w-4 h-4 text-white" />
        <span className="text-center uppercase tracking-widest">{children}</span>
      </button>
    </div>
  );
};

export default SparkleButton;