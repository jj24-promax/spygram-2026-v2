import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ClarityTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Verifica se o script do Clarity está carregado globalmente no navegador
    if (typeof window !== 'undefined' && (window as any).clarity) {
      const currentPath = location.pathname;
      
      // Envia o caminho atual para o Clarity como uma Tag Personalizada (Custom Tag)
      // Isso permite que você filtre as gravações e mapas de calor por página no painel do Clarity!
      (window as any).clarity("set", "PagePath", currentPath);
      
      // Adicionalmente, podemos enviar um evento de visualização de página virtual
      (window as any).clarity("event", "virtual_pageview", { path: currentPath });
    }
  }, [location]);

  return null;
};

export default ClarityTracker;