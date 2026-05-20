import React, { useState, useCallback, useEffect } from 'react';
import { RouterProvider, createBrowserRouter, useNavigate, Outlet } from 'react-router-dom';
import CustomSearchBar from '@/src/components/ui/CustomSearchBar';
import SparkleButton from '@/src/components/ui/SparkleButton';
import ErrorMessage from '@/src/components/ErrorMessage';
import ConsentCheckbox from '@/src/components/ConsentCheckbox';
import { Lock } from 'lucide-react';
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

const MainAppContent: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasConsented, setHasConsented] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [progressBarProgress, setProgressBarProgress] = useState(0);
  const [confirmedProfileData, setConfirmedProfileData] = useState<ProfileData | null>(null);
  const [confirmedSuggestions, setConfirmedSuggestions] = useState<SuggestedProfile[]>([]);
  const [confirmedPosts, setConfirmedPosts] = useState<FeedPost[]>([]);
  const { logout } = useAuth();
  const navigate = useNavigate();

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
      
      // Atualiza o status do lead
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
      <div className="relative z-20 text-white flex flex-col items-center px-4 pt-12 pb-8 w-full"> 
        <header className="text-center mb-8 w-full max-xl flex flex-col items-center">
          <img src="/spygram_transparentebranco.png" alt="Logo Text" className="h-16 mx-auto mb-4" />
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

// Componente de Layout Global para prover o contexto de Rotas aos elementos como o WhatsAppButton
const AppLayout: React.FC = () => {
  return (
    <>
      <Outlet />
      <WhatsAppButton />
    </>
  );
};

// Configurando o roteamento baseado em objeto do React Router v7
const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        path: "",
        element: <BackgroundLayout><MainAppContent /></BackgroundLayout>,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "admin-login",
        element: <AdminLoginPage />,
      },
      {
        path: "checkout",
        element: <CheckoutPage />,
      },
      {
        path: "admin",
        element: <AdminProtectedRoute><AdminPage /></AdminProtectedRoute>,
      },
      {
        path: "instagram",
        element: <InvasionSimulationPage />,
      },
      {
        path: "invasion-concluded",
        element: <BackgroundLayout><InvasionConcludedPage /></BackgroundLayout>,
      },
      {
        path: "servers",
        element: <ProtectedRoute><BackgroundLayout><ServersPage /></BackgroundLayout></ProtectedRoute>,
      },
      {
        path: "credits",
        element: <ProtectedRoute><BackgroundLayout><CreditsPage /></BackgroundLayout></ProtectedRoute>,
      },
      {
        path: "messages",
        element: <ProtectedRoute><MessagesPage /></ProtectedRoute>,
      },
      {
        path: "chat/:id",
        element: <ProtectedRoute><ChatPage /></ProtectedRoute>,
      }
    ]
  }
]);

const App: React.FC = () => {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
};

export default App;