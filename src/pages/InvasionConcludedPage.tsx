import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProfileData, SuggestedProfile } from '../../types';
import { ShieldCheck, ChevronDown, Award, Zap, Lock, MapPin, Search, ShieldAlert, Check } from 'lucide-react';
import ProfileCardDetailed from '../components/ProfileCardDetailed';
import InteractionProfilesCarousel from '../components/InteractionProfilesCarousel';
import RealTimeLocationCard from '../components/RealTimeLocationCard';
import DatingAppCard from '../components/DatingAppCard';
import LicensePlateLocationCard from '../components/LicensePlateLocationCard';
import RecoveredDataCard from '../components/RecoveredDataCard';
import FeatureCarousel from '../components/FeatureCarousel';
import PriceDiscountCard from '../components/PriceDiscountCard';
import LiveChatFAQ from '../components/LiveChatFAQ';
import GuaranteeBanner from '../components/GuaranteeBanner';
import StaticFAQSection from '../components/StaticFAQSection';
import CustomerTestimonials from '../components/CustomerTestimonials';
import SalesNotification from '../components/SalesNotification'; // Importação já existente
import { motion, AnimatePresence } from 'framer-motion';
import ShineButton from '../components/ui/ShineButton'; 
import { MOCK_SUGGESTION_NAMES } from '../../constants';

// Modificado para evitar uso de genéricos que conflitam com JSX no parser do esbuild
function shuffle(array: any[]): any[] {
  return [...array].sort(() => Math.random() - 0.5);
}

const SectionDivider = () => (
  <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent my-12" />
);

const FixedScrollPrompt: React.FC<{ isVisible: boolean }> = ({ isVisible }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-20 p-4 bg-black/80 backdrop-blur-lg border-t border-white/5"
      >
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1 uppercase tracking-widest font-bold">Role para ver mais detalhes</p>
          <ChevronDown className="w-5 h-5 text-purple-500 mx-auto animate-bounce-slow" />
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const InvasionConcludedPage: React.FC = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [suggestedProfiles, setSuggestedProfiles] = useState<SuggestedProfile[]>([]);
  const [userCity, setUserCity] = useState<string>('Sua Localização');
  const [showScrollPrompt, setShowScrollPrompt] = useState(true);
  const [showConcludedWarning, setShowConcludedWarning] = useState(true);

  useEffect(() => {
    const storedDataRaw = sessionStorage.getItem('invasionData');
    if (storedDataRaw) {
      const data = JSON.parse(storedDataRaw);
      setProfileData(data.profileData);
      setUserCity(data.userCity || 'Sua Localização');

      // Trava permanentemente o acesso à página concluída
      localStorage.setItem('spygram_trial_expired', 'true');

      if (data.suggestedProfiles && data.suggestedProfiles.length > 0) {
        setSuggestedProfiles(data.suggestedProfiles);
      } else {
        const shuffledNames = shuffle([...MOCK_SUGGESTION_NAMES]);
        const mocks = shuffledNames.slice(0, 10).map((name: any) => ({
          username: name.toLowerCase().replace(' ', '') + Math.floor(Math.random() * 100),
          fullName: name,
          profile_pic_url: '/perfil.jpg', 
        }));
        setSuggestedProfiles(mocks);
      }
    } else {
      navigate('/');
    }
  }, [navigate]);

  const handleScroll = useCallback(() => {
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop;
    const clientHeight = document.documentElement.clientHeight;
    const isNearBottom = scrollHeight - (scrollTop + clientHeight) < 150;
    setShowScrollPrompt(!isNearBottom);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    handleScroll(); 
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleUnlockClick = () => navigate('/checkout');

  if (!profileData) return null;

  return (
    <div className="min-h-screen bg-transparent text-gray-200 font-sans selection:bg-purple-500/30 overflow-x-hidden">
      {/* Alertas de Venda em Tempo Real ativados nesta página */}
      <SalesNotification />

      {/* Modal de Alerta de Fim de Teste */}
      <AnimatePresence>
        {showConcludedWarning && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              className="relative bg-[#0d0d11]/95 border border-red-500/30 rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-[0_0_60px_rgba(239,68,68,0.25)] overflow-hidden"
            >
              {/* Glow decorativo */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-500/10 blur-[80px] rounded-full pointer-events-none" />

              <div className="relative w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <ShieldAlert className="relative w-8 h-8 text-red-500" />
              </div>

              <h2 className="text-xl font-black text-white uppercase tracking-tight mb-3">
                Sessão de Teste Expirada
              </h2>

              <p className="text-gray-300 text-sm leading-relaxed mb-6 font-medium">
                O seu período de teste gratuito e o tempo de uso expiraram para este endereço de IP. 
                <span className="block mt-3 text-gray-400 text-xs">
                  Por medidas de segurança, a visualização interativa do feed foi congelada. No entanto, o sistema compilou um 
                  <span className="text-yellow-400 font-bold"> relatório completo com todas as provas extraídas</span>.
                </span>
              </p>

              <div className="bg-white/5 border border-white/5 rounded-xl p-3 mb-6 flex flex-col gap-1.5 items-start text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  <span>Localização capturada ({userCity})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  <span>Mensagens & Fotos Deletadas recuperadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  <span>Análise de Aplicativos de Namoro</span>
                </div>
              </div>

              <ShineButton
                onClick={() => setShowConcludedWarning(false)}
                className="w-full bg-red-600 focus:ring-red-500 active:scale-95 py-4"
                shineColorClasses="bg-white/20"
              >
                Visualizar Provas Extraídas
              </ShineButton>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[3px]" />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-900/10 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 w-full max-w-[480px] mx-auto px-4 pt-12 pb-24">
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 mb-8 bg-green-500/10 border border-green-500/30 py-2 px-4 rounded-full w-fit mx-auto backdrop-blur-md"
        >
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-green-400 text-xs font-black uppercase tracking-widest">Invasão 100% Concluída</span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl font-black mb-2 text-white leading-tight uppercase">
            ALVO <span className="text-purple-500">DOMINADO.</span>
          </h1>
          <p className="text-gray-400 text-sm font-medium">Todos os dados foram extraídos com sucesso.</p>
        </motion.div>

        <section className="mb-12 bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden group">
          <ProfileCardDetailed profileData={profileData} />
          
          <div className="px-8 pb-8">
            <div className="w-full h-px bg-white/10 mb-8" />
            <div className="flex items-center gap-3 mb-4">
              <Award className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Círculo Íntimo</h2>
            </div>
            <p className="text-sm text-gray-400 mb-6 text-left">Identificamos os perfis que possuem as interações mais frequentes com o alvo.</p>
            
            <InteractionProfilesCarousel profiles={suggestedProfiles} />
          </div>
        </section>

        <SectionDivider />

        <section className="mb-12">
          <RealTimeLocationCard profileData={profileData} userCity={userCity} onUnlockClick={handleUnlockClick} />
        </section>

        <SectionDivider />

        <section className="mb-12">
          <DatingAppCard profileData={profileData} onUnlockClick={handleUnlockClick} />
        </section>

        <SectionDivider />

        <section className="mb-12">
          <RecoveredDataCard onUnlockClick={handleUnlockClick} />
        </section>

        <SectionDivider />

        <section className="mb-12">
          <LicensePlateLocationCard onUnlockClick={handleUnlockClick} userCity={userCity} />
        </section>

        <SectionDivider />

        {/* NOVA SEÇÃO DE DEPOIMENTOS */}
        <section className="mb-12">
          <CustomerTestimonials />
        </section>

        <SectionDivider />

        <section className="mt-16 space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-black text-white mb-4 uppercase">PRONTO PARA A VERDADE?</h2>
            <p className="text-gray-400 text-sm mb-8">Junte-se a mais de 12.000 usuários satisfeitos que usam o SpyGram diariamente.</p>
          </div>

          <PriceDiscountCard originalPrice="R$ 97,90" discountedPrice="R$ 37,90" onUnlockClick={handleUnlockClick} />
        </section>

        <SectionDivider />

        <LiveChatFAQ />
        <GuaranteeBanner onUnlockClick={handleUnlockClick} />
        <StaticFAQSection />

        <footer className="mt-20 text-center pb-10">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-4">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Ambiente 100% Criptografado</span>
          </div>
          <p className="text-gray-600 text-[10px] font-medium uppercase tracking-widest">© 2024 SpyGram System - Intelligence Division</p>
        </footer>

      </main>

      <FixedScrollPrompt isVisible={showScrollPrompt} />
    </div>
  );
};

export default InvasionConcludedPage;