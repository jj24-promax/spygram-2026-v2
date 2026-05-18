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
import FreeTimeFloatingButton from '../components/FreeTimeFloatingButton';

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
  
  useEffect(() => {
    const loadAllDataAndProceed = async () => {
      const storedData = sessionStorage.getItem('invasionData');
      
      // Se já estiver logado e tiver dados, vai direto para o feed
      if (isLoggedIn && storedData) {
        const data = JSON.parse(storedData);
        if (data.profileData) {
          setProfileData(data.profileData);
          setSuggestedProfiles(data.suggestedProfiles || []);
          setPosts(data.posts || []);
          setLocations(data.locations || []);
          
          // Garante que o timer exista
          if (!sessionStorage.getItem('invasionEndTime')) {
            const endTime = Date.now() + 90 * 1000;
            sessionStorage.setItem('invasionEndTime', endTime.toString());
          }
          
          setStage('feed_locked');
          return;
        }
      }

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

      const fetchDataPromise = async () => {
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

        const { suggestions: extraSuggestions, posts: fetchedPosts } = await fetchFullInvasionData(targetProfileData);

        let finalSuggestions = dataFromNav.suggestions || [];
        if (finalSuggestions.length === 0) finalSuggestions = extraSuggestions;

        if (finalSuggestions.length === 0) {
            const shuffledNames = [...MOCK_SUGGESTION_NAMES].sort(() => 0.5 - Math.random());
            finalSuggestions = shuffledNames.slice(0, 15).map((name) => ({
              username: name.toLowerCase().replace(' ', '') + Math.floor(Math.random() * 100),
              fullName: name,
              profile_pic_url: '/perfil.jpg', 
            }));
        }

        setSuggestedProfiles(finalSuggestions);
        setPosts(fetchedPosts);

        sessionStorage.setItem('invasionData', JSON.stringify({
          profileData: targetProfileData,
          suggestedProfiles: finalSuggestions,
          posts: fetchedPosts,
          userCity: userCity,
          locations: cityList,
        }));
      };

      const minLoadingPromise = new Promise(resolve => setTimeout(resolve, 2000));
      fetchDataPromise();
      await minLoadingPromise;

      // Inicia o timer de 90 segundos para acesso grátis
      if (!sessionStorage.getItem('invasionEndTime')) {
        const endTime = Date.now() + 90 * 1000;
        sessionStorage.setItem('invasionEndTime', endTime.toString());
      }

      setStage('login_attempt');
    };

    if (stage === 'loading') {
      loadAllDataAndProceed();
    }
  }, [location.state, navigate, stage, isLoggedIn]);

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

  if (stage === 'feed_locked') {
    return (
      <div className="min-h-screen bg-black md:bg-[#121212] text-white font-sans w-full relative flex flex-col items-center">
        <LockedFeatureModal isOpen={isModalOpen} onClose={closeModal} featureName={modalFeatureName} />
        <FreeTimeFloatingButton />

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