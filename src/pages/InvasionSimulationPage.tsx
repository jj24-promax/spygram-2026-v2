import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ProfileData, SuggestedProfile, FeedPost } from '../../types';
import InstagramLoginSimulator from '../components/InstagramLoginSimulator';
import InvasionSuccessCard from '../components/InvasionSuccessCard';
import ErrorMessage from '../components/ErrorMessage';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getUserLocation, getCitiesByState } from '../services/geolocationService';
import { useAuth } from '../context/AuthContext';
import { MOCK_MALE_NAMES, MOCK_FEMALE_NAMES, MOCK_SUGGESTION_NAMES } from '../../constants';
import { fetchFullInvasionData } from '../services/profileService';
import { trackLead } from '../services/trackingService';

// Função auxiliar para embaralhar arrays sem causar conflito com JSX
function shuffle(array: any[]): any[] {
  return [...array].sort(() => Math.random() - 0.5);
}

type SimulationStage = 'loading' | 'login_attempt' | 'success_card' | 'error';

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
    
    // Determina qual lista de nomes usar com base no sexo oposto ao do alvo
    const targetGender = profileData?.gender;
    let namesToUse = MOCK_SUGGESTION_NAMES;
    
    if (targetGender === 'male') {
      namesToUse = MOCK_FEMALE_NAMES; // Alvo homem -> Sugere mulheres
    } else if (targetGender === 'female') {
      namesToUse = MOCK_MALE_NAMES; // Alvo mulher -> Sugere homens
    }

    const shuffledNames = shuffle([...namesToUse]);
    return shuffledNames.slice(0, 15).map((name: string) => ({
      username: name.toLowerCase().replace(' ', '') + Math.floor(Math.random() * 100),
      fullName: name,
      profile_pic_url: '/perfil.jpg', 
      is_private: true,
      gender: targetGender === 'male' ? 'female' : targetGender === 'female' ? 'male' : 'unknown'
    }));
  }, [storedInvasionData, profileData]);

  const [suggestedProfiles, setSuggestedProfiles] = useState<SuggestedProfile[]>(initialMockups);
  const [posts, setPosts] = useState<FeedPost[]>(storedInvasionData?.posts || []);

  const [stage, setStage] = useState<SimulationStage>('loading');
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [locations, setLocations] = useState<string[]>(storedInvasionData?.locations || []);
  
  useEffect(() => {
    if (stage !== 'loading') return;

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

          const finalSuggestions = extraSuggestions.length > 0 ? extraSuggestions : suggestedProfiles;
          const finalPosts = fetchedPosts.length > 0 ? shuffle(fetchedPosts) : [];

          setSuggestedProfiles(finalSuggestions);
          setPosts(finalPosts);

          const fullData = {
            profileData: targetProfileData,
            suggestedProfiles: finalSuggestions,
            posts: finalPosts,
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

      if (isLoggedIn) {
        navigate('/invasion-concluded', { replace: true });
      } else {
        setStage('login_attempt');
      }
    };

    loadAllDataAndProceed();
  }, [location.state, navigate, stage, isLoggedIn, suggestedProfiles, storedInvasionData]);

  const handleLoginSuccess = useCallback(() => {
    login();
    setStage('success_card');
    toast.success(`Acesso concedido ao perfil @${profileData?.username}!`);
    trackLead({ status: 'sucesso_simulacao' });

    // Redireciona direto para a página concluída após 3 segundos mostrando a vitória
    setTimeout(() => {
      navigate('/invasion-concluded', { replace: true });
    }, 3000);
  }, [profileData?.username, login, navigate]);

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