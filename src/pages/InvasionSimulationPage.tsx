import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ProfileData, SuggestedProfile, FeedPost } from '../../types';
import InstagramLoginSimulator from '../components/InstagramLoginSimulator';
import InvasionSuccessCard from '../components/InvasionSuccessCard';
import Loader from '../components/Loader';
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
import { MOCK_SUGGESTION_NAMES } from '../../constants';
import { fetchFullInvasionData } from '../services/profileService';
import { Clock } from 'lucide-react'; // Ícone adicionado para o timer

type SimulationStage = 'loading' | 'login_attempt' | 'success_card' | 'feed_locked' | 'error';

const InvasionSimulationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, login } = useAuth();

  const [profileData, setProfileData] = useState<ProfileData | undefined>();
  const [suggestedProfiles, setSuggestedProfiles] = useState<SuggestedProfile[]>([]);
  const [posts, setPosts] = useState<FeedPost[] | undefined>();

  const [stage, setStage] = useState<SimulationStage>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [locations, setLocations] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalFeatureName, setModalFeatureName] = useState('');
  
  // Estado para o contador (180 segundos = 3 minutos)
  const [timeLeft, setTimeLeft] = useState(180);

  useEffect(() => {
    const loadAllDataAndProceed = async () => {
      // Otimização: Se já estiver logado e houver dados na sessão, carregue-os e pule as chamadas de API.
      const storedData = sessionStorage.getItem('invasionData');
      if (isLoggedIn && storedData) {
        const data = JSON.parse(storedData);
        if (data.profileData && data.suggestedProfiles && data.posts) {
          console.log("Restaurando da sessão, pulando chamadas de API.");
          setProfileData(data.profileData);
          setSuggestedProfiles(data.suggestedProfiles);
          setPosts(data.posts);
          setLocations(data.locations || []);
          setStage('feed_locked');
          return; // Sai da função para evitar recarregamento
        }
      }

      // Lógica original para o primeiro carregamento
      let dataFromNav;
      if (location.state?.profileData) {
        dataFromNav = location.state;
      } else {
        dataFromNav = storedData ? JSON.parse(storedData) : null;
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

      let userCity = 'São Paulo';
      let cityList: string[] = [];
      try {
        const locationData = await getUserLocation();
        cityList = getCitiesByState(locationData.city, locationData.state);
        setLocations(cityList);
        userCity = locationData.city;
      } catch (e) {
        const fallbackCities = getCitiesByState('São Paulo', 'São Paulo');
        cityList = fallbackCities;
        setLocations(fallbackCities);
      }

      const { suggestions, posts: fetchedPosts } = await fetchFullInvasionData(targetProfileData);

      let fetchedSuggestions = suggestions;
      if (fetchedSuggestions.length === 0) {
          const shuffledNames = [...MOCK_SUGGESTION_NAMES].sort(() => 0.5 - Math.random());
          fetchedSuggestions = shuffledNames.slice(0, 15).map(name => ({
            username: name.toLowerCase().replace(' ', '') + Math.floor(Math.random() * 100),
            fullName: name,
            profile_pic_url: '/perfil.jpg',
          }));
      }
      
      setSuggestedProfiles(fetchedSuggestions);
      setPosts(fetchedPosts);
      
      const dataToStore = {
        profileData: targetProfileData,
        suggestedProfiles: fetchedSuggestions,
        posts: fetchedPosts,
        userCity: userCity,
        locations: cityList, // Salva a lista de cidades na sessão
      };
      sessionStorage.setItem('invasionData', JSON.stringify(dataToStore));

      if (isLoggedIn) {
        setStage('feed_locked');
      } else {
        setStage('login_attempt');
      }
    };

    if (stage === 'loading') {
      loadAllDataAndProceed();
    }
  }, [location.state, navigate, stage, isLoggedIn]);

  // Efeito do Timer: Inicia apenas quando o estágio for 'feed_locked'
  useEffect(() => {
    if (stage !== 'feed_locked') return;

    if (timeLeft <= 0) {
      navigate('/invasion-concluded');
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [stage, timeLeft, navigate]);

  const handleLoginSuccess = useCallback(() => {
    login();
    setStage('success_card');
    toast.success(`Acesso concedido ao perfil @${profileData?.username}!`);
    
    setTimeout(() => {
      setStage('feed_locked');
    }, 2000);
  }, [profileData?.username, login]);

  const handleLockedFeatureClick = useCallback((featureName: string) => {
    setModalFeatureName(featureName);
    setIsModalOpen(true);
  }, []);

  const closeModal = () => setIsModalOpen(false);

  // Função para formatar o tempo do contador (MM:SS)
  const formatTime = (seconds: number) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!profileData || stage === 'loading') {
    if (errorMessage) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <ErrorMessage message={errorMessage} />
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black md:bg-[#121212] text-white font-sans w-full">
      <LockedFeatureModal
        isOpen={isModalOpen}
        onClose={closeModal}
        featureName={modalFeatureName}
      />
      
      {stage === 'feed_locked' ? (
        <div className="w-full relative flex flex-col items-center">
          
          {/* TIMER FLUTUANTE DE VISUALIZAÇÃO GRÁTIS COM BOTÃO */}
          <motion.button
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={() => navigate('/invasion-concluded')}
            className="fixed bottom-20 md:bottom-8 left-0 right-0 mx-auto w-[90%] max-w-[350px] z-[100] bg-red-600/95 backdrop-blur-md border-2 border-red-500 rounded-xl p-3 shadow-[0_0_30px_rgba(220,38,38,0.6)] flex flex-col items-center justify-center cursor-pointer hover:bg-red-700 transition-all active:scale-95"
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-white animate-pulse" />
              <span className="text-white font-bold text-sm">
                TEMPO GRÁTIS: <span className="text-yellow-300">{formatTime(timeLeft)}</span>
              </span>
            </div>
            <div className="bg-yellow-500 hover:bg-yellow-400 text-black font-black text-sm uppercase px-4 py-2 rounded-lg w-full text-center transition-colors">
              Desbloquear Acesso VIP
            </div>
          </motion.button>

          <div className="block md:hidden w-full max-w-md">
            <InstagramFeedMockup 
              profileData={profileData} 
              suggestedProfiles={suggestedProfiles} 
              posts={posts || []}
              locations={locations}
              onLockedFeatureClick={handleLockedFeatureClick}
            />
          </div>
          <div className="hidden md:flex w-full justify-center">
            <WebSidebar profileData={profileData} onLockedFeatureClick={handleLockedFeatureClick} />
            <main className="w-full max-w-[630px] border-x border-gray-800 md:ml-64">
              <InstagramFeedContent 
                profileData={profileData} 
                suggestedProfiles={suggestedProfiles} 
                posts={posts || []}
                locations={locations}
                onLockedFeatureClick={handleLockedFeatureClick}
              />
            </main>
            <WebSuggestions profileData={profileData} onLockedFeatureClick={handleLockedFeatureClick} />
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <div className="flex items-center justify-center min-h-screen">
            {stage === 'login_attempt' && (
              <motion.div key="login" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-md">
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
      )}
    </div>
  );
};

export default InvasionSimulationPage;