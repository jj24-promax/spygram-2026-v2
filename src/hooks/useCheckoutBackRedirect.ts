import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/** Intercepta o botão voltar do navegador na página de checkout e envia para o back redirect. */
export function useCheckoutBackRedirect(enabled = true) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!enabled) return;

    window.history.pushState({ checkoutBackTrap: true }, '', window.location.href);

    const handlePopState = () => {
      navigate('/back-redirect');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [enabled, navigate]);
}
