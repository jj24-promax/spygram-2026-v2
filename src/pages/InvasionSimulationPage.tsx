import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ProfileData, SuggestedProfile, FeedPost } from '../../types';
import InstagramLoginSimulator from '../components/InstagramLoginSimulator';
import InvasionSuccessCard from '../components/InvasionSuccessCard';
import ErrorMessage from '../components/ErrorMessage';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import InstagramFeedMockup from '../components/InstagramFeedMockup';
import InstagramFeedContent from '../components/InstagramFeedContent';
import WebSidebar from '../components/WebSidebar';
import WebSuggestions from '../components/WebSuggestions';
import { getUserLocation, getCitiesByState } from '../services/geolocationService';
import LockedFeatureModal from '../components/LockedFeatureModal';
import { useAuth } from '../context/AuthContext';
import { fetchFullInvasionData } from '../services/profileService';
import FreeTimeFloatingButton from '../components/FreeTimeFloatingButton';
import { trackLead } from '../services/trackingService';

// Função auxiliar para embaralhar arrays sem causar conflito com JSX
function shuffle(array: any[]): any[] {
  return [...array].sort(() => Math.random() - 0.5);
}

type SimulationStage = 'loading' | 'login_attempt' | 'success_card' | 'feed_locked' | 'error';

const InvasionSimulationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, login } = useAuth();

  const storedInvasionData = useMemo(() => {
    const data = sessionStorage.getItem('invasionData');
    return data ? JSON.parse(data) : null;
  }, []);

  const [profileData, setProfileData] = useState<ProfileData | undefined>(storedInvasionData?.profileData || location.state?.profileData);

  const initialMockups = useMemo(() => {
    if (storedInvasionData?.suggestedProfiles?.length > 0) return storedInvasionData.suggestedProfiles;
    return []; // Removemos completamente a criação de perfis falsos de fallback
  }, [storedInvasionData]);

  const [suggestedProfiles, setSuggestedProfiles] = useState<SuggestedProfile[]>(initialMockups);
  const [posts, setPosts] = useState<FeedPost[]>(storedInvasionData?.posts || []);

  const [stage, setStage] = useState<SimulationStage>(
    isLoggedIn && (storedInvasionData || location.state?.profileData) ? 'feed_locked' : 'loading'
  );
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [locations, setLocations] = useState<string[]>(storedInvasionData?.locations || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalFeatureName, setModalFeatureName] = useState('');
  
  useEffect(() => {
    if (stage === 'feed_locked') return;

    const loadAllDataAndProceed = async () => {
      let dataFromNav;
      if (location.state?.profileData) {
        dataFromNav = location.state;
      } else {
        dataFromNav = storedInvasionData;
      }

      if (!dataFromNav?.profileData) {
        setErrorMessage('Nenhum dado de perfil encontrado. Redirecionando...');
        toast.error('Nenhum dado de perfil encontrado. Redirecionando...');
        setTimeout(() => navigate('/'), 3000);
        setStage('error');
        return;
      }

      const targetProfileData = dataFromNav.profileData;
      setProfileData(targetProfileData);

      trackLead({ status: 'simulando' });

      const startBackgroundLoading = async () => {
        try {
          if (storedInvasionData?.posts?.length > 0 && storedInvasionData?.suggestedProfiles?.length > 0) {
            return;
          }

          let userCity = 'São Paulo';
          let cityList: string[] = [];
          
          try {
            const locationData = await getUserLocation();
            cityList = getCitiesByState(locationData.city, locationData.state);
            userCity = locationData.city;
          } catch (e) {
            cityList = getCitiesByState('São Paulo', 'São Paulo');
          }
          setLocations(cityList);

          // Busca dados completos incluindo posts de perfis públicos
          const { suggestions: extraSuggestions, posts: fetchedPosts } = await fetchFullInvasionData(targetProfileData);

          setSuggestedProfiles(extraSuggestions);
          setPosts(fetchedPosts.length > 0 ? shuffle(fetchedPosts) : []);

          const fullData = {
            profileData: targetProfileData,
            suggestedProfiles: extraSuggestions,
            posts: fetchedPosts,
            userCity: userCity,
            locations: cityList,
          };

          sessionStorage.setItem('invasionData', JSON.stringify(fullData));
          localStorage.setItem('spygram_active_invasion', JSON.stringify(fullData));
        } catch (error) {
          console.error("Erro silencioso no background loading:", error);
        }
      };

      startBackgroundLoading();

      if (!isLoggedIn) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // Altera o tempo gratuito para 2 minutos (120 segundos)
      if (!sessionStorage.getItem('invasionEndTime')) {
        const endTime = Date.now() + 120 * 1000;
        sessionStorage.setItem('invasionEndTime', endTime.toString());
      }

      if (isLoggedIn) {
        setStage('feed_locked');
      } else {
        setStage('login_attempt');
      }
    };

    if (stage === 'loading') {
      loadAllDataAndProceed();
    }
  }, [location.state, navigate, stage, isLoggedIn, storedInvasionData]);

  const handleLoginSuccess = useCallback(() => {
    login();
    setStage('success_card');
    toast.success(`Acesso concedido ao perfil @${profileData?.username}!`);
    trackLead({ status: 'sucesso_simulacao' });

    setTimeout(() => {
      setStage('feed_locked');
    }, 2000);
  }, [profileData?.username, login]);

  const handleLockedFeatureClick = useCallback((featureName: string) => {
    setModalFeatureName(featureName);
    setIsModalOpen(true);
  }, []);

  const closeModal = () => setIsModalOpen(false);

  if (!profileData || stage === 'loading') {
    if (errorMessage) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <ErrorMessage message={errorMessage} />
        </div>
      );
    }
    return <div className="min-h-screen bg-black" />;
  }

  if (stage === 'feed_locked') {
    return (
      <div className="min-h-screen bg-black md:bg-[#121212] text-white font-sans w-full relative flex flex-col items-center">
        <LockedFeatureModal isOpen={isModalOpen} onClose={closeModal} featureName={modalFeatureName} />
        <FreeTimeFloatingButton />

        {/* Mobile Mockup */}
        <div className="block md:hidden fixed inset-0 z-10 bg-black">
          <InstagramFeedMockup 
            profileData={profileData} 
            suggestedProfiles={suggestedProfiles} 
            posts={posts}
            locations={locations}
            onLockedFeatureClick={handleLockedFeatureClick}
          />
        </div>

        {/* Desktop View */}
        <div className="hidden md:flex w-full h-screen justify-center overflow-hidden">
          <WebSidebar profileData={profileData} onLockedFeatureClick={handleLockedFeatureClick} />
          <main className="w-full max-w-[630px] border-x border-gray-800 md:ml-64 overflow-y-auto h-full scrollbar-hide">
            <InstagramFeedContent 
              profileData={profileData} 
              suggestedProfiles={suggestedProfiles} 
              posts={posts}
              locations={locations}
              onLockedFeatureClick={handleLockedFeatureClick}
            />
          </main>
          <WebSuggestions profileData={profileData} onLockedFeatureClick={handleLockedFeatureClick} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans w-full">
      <AnimatePresence mode="wait">
        <div className="flex items-center justify-center min-h-screen">
          {stage === 'login_attempt' && (
            <motion.div key="login" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full">
              <InstagramLoginSimulator 
                profileData={profileData} 
                onSuccess={handleLoginSuccess}
              />
            </motion.div>
          )}
          {stage === 'success_card' && (
            <motion.div key="success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-md">
              <InvasionSuccessCard profileData={profileData} />
            </motion.div>
          )}
        </div>
      </AnimatePresence>
    </div>
  );
};

export default InvasionSimulationPage;