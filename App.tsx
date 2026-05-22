import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import CustomSearchBar from '@/src/components/ui/CustomSearchBar';
import SparkleButton from '@/src/components/ui/SparkleButton';
import ErrorMessage from '@/src/components/ErrorMessage';
import ConsentCheckbox from '@/src/components/ConsentCheckbox';
import { Lock, AlertTriangle, ShieldCheck } from 'lucide-react';
import LoginPage from '@/src/pages/LoginPage';
import AdminLoginPage from '@/src/pages/AdminLoginPage';
import ServersPage from '@/src/pages/ServersPage';
import CreditsPage from '@/src/pages/CreditsPage';
import MessagesPage from '@/src/pages/MessagesPage';
import ChatPage from '@/src/pages/ChatPage';
import CheckoutPage from '@/src/pages/CheckoutPage';
import AdminPage from '@/src/pages/AdminPage';
import ProgressBar from '@/src/components/ProgressBar';
import InvasionSimulationPage from '@/src/pages/InvasionSimulationPage';
import InvasionConcludedPage from '@/src/pages/InvasionConcludedPage';
import ProfileConfirmationCard from '@/src/components/ProfileConfirmationCard';
import { MIN_LOADING_DURATION } from './constants';
import { fetchProfileData } from './src/services/profileService';
import { AuthProvider, useAuth } from './src/context/AuthContext'; 
import ProtectedRoute from './src/components/ProtectedRoute';
import AdminProtectedRoute from './src/components/AdminProtectedRoute';
import { ProfileData, SuggestedProfile, FeedPost } from './types';
import BackgroundLayout from './src/components/BackgroundLayout';
import InvasionCounter from '@/src/components/InvasionCounter';
import { getUserLocation } from './src/services/geolocationService';
import { trackLead } from './src/services/trackingService';
import WhatsAppButton from '@/src/components/WhatsAppButton';
import AnalyticsTracker from '@/src/components/AnalyticsTracker';
import { trackFacebookEvent } from './src/services/facebookService';
import { motion, AnimatePresence } from 'framer-motion';

const MainAppContent: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasConsented, setHasConsented] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [progressBarProgress, setProgressBarProgress] = useState(0);
  const [confirmedProfileData, setConfirmedProfileData] = useState<ProfileData | null>(null);
  const [confirmedSuggestions, setConfirmedSuggestions] = useState<SuggestedProfile[]>([]);
  const [confirmedPosts, setConfirmedPosts] = useState<FeedPost[]>([]);
  const [showIntroPopup, setShowIntroPopup] = useState<boolean>(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Redireciona imediatamente se já existir uma invasão ativa salva de forma persistente
  useEffect(() => {
    const activeInvasion = localStorage.getItem('spygram_active_invasion');
    if (activeInvasion) {
      sessionStorage.setItem('invasionData', activeInvasion);
      navigate('/invasion-concluded', { replace: true });
    } else {
      // Se não houver invasão ativa, verifica se deve exibir o popup informativo de entrada única
      const introShown = sessionStorage.getItem('spygram_intro_popup_shown');
      if (!introShown) {
        setShowIntroPopup(true);
      }
    }
  }, [navigate]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isLoading) {
      setProgressBarProgress(0);
      interval = setInterval(() => {
        setProgressBarProgress((prev: number) => (prev < 95 ? prev + 1 : prev));
      }, 1000);
    } else {
      setProgressBarProgress(100);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isLoading]);

  const handleDismissIntro = () => {
    setShowIntroPopup(false);
    sessionStorage.setItem('spygram_intro_popup_shown', 'true');
  };

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setError('Por favor, insira um nome de usuário.');
      return;
    }
    if (!hasConsented) {
      setError('Você precisa consentir para acessar o perfil.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // RESET TOTAL PARA NOVA PESQUISA
      logout(); 
      sessionStorage.removeItem('invasionEndTime');
      sessionStorage.removeItem('invasionData');
      sessionStorage.removeItem('current_lead_id');
      localStorage.removeItem('spygram_banned_session');

      const [fetchResult, locationData] = await Promise.all([
        fetchProfileData(searchQuery.trim()),
        getUserLocation(),
        new Promise(resolve => setTimeout(resolve, MIN_LOADING_DURATION))
      ]);
      
      setConfirmedProfileData(fetchResult.profile);
      setConfirmedSuggestions(fetchResult.suggestions);
      setConfirmedPosts(fetchResult.posts);

      // Salva o lead inicial no banco
      trackLead({
        username_searched: fetchResult.profile.username,
        profile_pic: fetchResult.profile.profilePicUrl,
        city: locationData.city,
        state: locationData.state,
        ip_address: locationData.ip,
        status: 'pesquisou'
      });

      // DISPARAR EVENTO DE LEAD NO FACEBOOK (PIXEL + CAPI)
      trackFacebookEvent('Lead', {}, { value: 0 });

    } catch (err) {
      setError("Sistema sobrecarregado, tente novamente mais tarde");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, hasConsented, logout]);

  const handleConfirmInvasion = useCallback(() => {
    if (confirmedProfileData) {
      const invasionData = {
        profileData: confirmedProfileData,
        suggestedProfiles: confirmedSuggestions,
        posts: confirmedPosts,
      };
      
      sessionStorage.setItem('invasionData', JSON.stringify(invasionData));
      // Salva de forma persistente para bloquear novas pesquisas deste mesmo navegador
      localStorage.setItem('spygram_active_invasion', JSON.stringify(invasionData));
      
      // Atendimento do lead
      trackLead({ status: 'confirmou_alvo' });
      
      navigate('/instagram', { state: invasionData });
    }
  }, [confirmedProfileData, confirmedSuggestions, confirmedPosts, navigate]);

  if (confirmedProfileData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 relative z-10">
        <ProfileConfirmationCard
          profileData={confirmedProfileData}
          onConfirm={handleConfirmInvasion}
          onCorrect={() => setConfirmedProfileData(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <ProgressBar progress={progressBarProgress} isVisible={isLoading} />
      
      {/* POPUP DE AVISO DE ENTRADA ÚNICA */}
      <AnimatePresence>
        {showIntroPopup && (
          <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#121214] border-2 border-red-500/30 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden text-white"
            >
              {/* Efeito de brilho de fundo */}
              <div className="absolute top-[-30px] left-[-30px] w-24 h-24 bg-red-500/10 blur-xl rounded-full" />
              
              <AlertTriangle className="w-14 h-14 text-red-500 mx-auto mb-4 animate-bounce-slow" />
              
              <h2 className="text-xl font-black uppercase tracking-tight mb-3">
                AVISO DE CRÉDITO LIMITADO
              </h2>
              
              <p className="text-gray-300 text-xs sm:text-sm font-medium leading-relaxed mb-6">
                Devido ao alto custo de processamento e quebra de criptografia via satélite, <span className="text-yellow-400 font-bold">cada IP/Dispositivo possui direito a apenas 1 (uma) consulta teste</span> de perfil.
                <br /><br />
                Escolha e digite o alvo de seu interesse com extrema responsabilidade.
              </p>
              
              <button
                onClick={handleDismissIntro}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 text-white"
              >
                ENTENDIDO, PROSSEGUIR
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="relative z-20 text-white flex flex-col items-center px-4 pt-12 pb-8 w-full"> 
        <header className="text-center mb-8 w-full max-xl">
          <img src="/spygram_transparentebranco.png" alt="Logo" className="h-24 mx-auto mb-6" />
          <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 text-transparent bg-clip-text uppercase">SpyGram</h1>
          <p className="text-xl font-bold">ACESSE O <span className="text-pink-500">INSTAGRAM</span> DE QUALQUER PESSOA <span className="text-yellow-500">SEM SENHA</span></p>
        </header>
        <main className="w-full flex flex-col items-center">
          <CustomSearchBar query={searchQuery} setQuery={setSearchQuery} isLoading={isLoading} />
          <InvasionCounter />
          <div className="mt-6"><ConsentCheckbox checked={hasConsented} onChange={setHasConsented} /></div>
          <div className="mt-6"><SparkleButton onClick={handleSearch} disabled={isLoading || !hasConsented}>{isLoading ? 'Buscando...' : 'Invadir Conta'}</SparkleButton></div>
          <div className="w-full mt-4">{error && <ErrorMessage message={error} />}</div>
        </main>
        <footer className="mt-16 flex items-center gap-1 text-gray-500 text-sm"><Lock className="w-4 h-4 text-green-500" /> SSL Verificado</footer>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AnalyticsTracker /> {/* Rastreador de Analytics Ativo */}
        <Routes>
          <Route path="/" element={<BackgroundLayout><MainAppContent /></BackgroundLayout>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/admin" element={<AdminProtectedRoute><AdminPage /></AdminProtectedRoute>} />
          <Route path="/instagram" element={<InvasionSimulationPage />} />
          <Route path="/invasion-concluded" element={<BackgroundLayout><InvasionConcludedPage /></BackgroundLayout>} />
          <Route path="/servers" element={<ProtectedRoute><BackgroundLayout><ServersPage /></BackgroundLayout></ProtectedRoute>} />
          <Route path="/credits" element={<ProtectedRoute><BackgroundLayout><CreditsPage /></BackgroundLayout></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
          <Route path="/chat/:id" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        </Routes>
        <WhatsAppButton />
      </AuthProvider>
    </Router>
  );
};

export default App;