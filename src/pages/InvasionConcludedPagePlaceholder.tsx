import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hasSeenInstagramDemo } from '../utils/invasionSession';
import ShineButton from '../components/ui/ShineButton';

/** Placeholder temporário — substituir pelo novo design de vendas. */
const InvasionConcludedPagePlaceholder: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const storedDataRaw = sessionStorage.getItem('invasionData');
    if (!storedDataRaw) {
      navigate('/');
      return;
    }

    if (hasSeenInstagramDemo()) {
      localStorage.setItem('spygram_trial_expired', 'true');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="w-full max-w-md space-y-6">
        <img
          src="/instagram-logo.png"
          alt="SpyGram"
          className="h-10 mx-auto opacity-90"
          style={{ filter: 'invert(1)' }}
        />
        <h1 className="text-2xl font-black text-white uppercase tracking-tight">
          Nova página em breve
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed">
          Estamos atualizando a experiência de desbloqueio. Enquanto isso, você pode seguir para o checkout.
        </p>
        <ShineButton
          onClick={() => navigate('/checkout')}
          className="w-full bg-purple-600 focus:ring-purple-500 active:scale-95 py-4"
          shineColorClasses="bg-white/20"
        >
          Ir para o checkout
        </ShineButton>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-gray-500 text-xs uppercase tracking-widest font-bold hover:text-gray-300 transition-colors"
        >
          Nova busca
        </button>
      </div>
    </div>
  );
};

export default InvasionConcludedPagePlaceholder;
