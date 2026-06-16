import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
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
import LockedFeatureModal from '../components/LockedFeatureModal';
import { useAuth } from '../context/AuthContext';
import { MOCK_MALE_NAMES, MOCK_FEMALE_NAMES, MOCK_SUGGESTION_NAMES } from '../../constants';
import FreeTimeFloatingButton from '../components/FreeTimeFloatingButton';
import { trackLead } from '../services/trackingService';
import {
  markInstagramDemoSeen,
  ensurePreviewTrialSession,
} from '../utils/invasionSession';
import {
  type InvasionData,
  isInvasionDataComplete,
  loadInvasionFeedData,
  readInvasionData,
} from '../utils/invasionDataLoader';
import { enrichSuggestedProfilesWithPeoplePhotos } from '../utils/feedStockImages';
import { resolveTargetGender } from '../utils/genderClassifier';

function shuffle(array: any[]): any[] {
  return [...array].sort(() => Math.random() - 0.5);
}

type SimulationStage = 'loading' | 'login_attempt' | 'success_card' | 'feed_locked' | 'error';

const InvasionSimulationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, login } = useAuth();

  const storedInvasionData = useMemo(() => readInvasionData(), []);

  const instantLogin = useMemo(
    () => sessionStorage.getItem('spygram_instant_login') === 'true',
    []
  );

  const hasProfileData = !!(
    storedInvasionData?.profileData || location.state?.profileData
  );

  const [profileData, setProfileData] = useState<ProfileData | undefined>(
    storedInvasionData?.profileData || location.state?.profileData
  );

  const initialMockups = useMemo(() => {
    const targetGender = profileData ? resolveTargetGender(profileData) : undefined;

    if (storedInvasionData?.suggestedProfiles?.length > 0) {
      return enrichSuggestedProfilesWithPeoplePhotos(
        storedInvasionData.suggestedProfiles,
        targetGender
      );
    }

    let namesToUse = MOCK_SUGGESTION_NAMES;

    if (targetGender === 'male') {
      namesToUse = MOCK_FEMALE_NAMES;
    } else if (targetGender === 'female') {
      namesToUse = MOCK_MALE_NAMES;
    }

    const shuffledNames = shuffle([...namesToUse]);
    return enrichSuggestedProfilesWithPeoplePhotos(
      shuffledNames.slice(0, 15).map((name: string) => ({
        username: name.toLowerCase().replace(' ', '') + Math.floor(Math.random() * 100),
        fullName: name,
        profile_pic_url: '/perfil.jpg',
        is_private: true,
        gender: targetGender === 'male' ? 'female' : targetGender === 'female' ? 'male' : 'unknown',
      })),
      targetGender
    );
  }, [storedInvasionData, profileData]);

  const [suggestedProfiles, setSuggestedProfiles] = useState<SuggestedProfile[]>(initialMockups);
  const [posts, setPosts] = useState<FeedPost[]>(storedInvasionData?.posts || []);

  const [stage, setStage] = useState<SimulationStage>(() => {
    if (instantLogin && hasProfileData) return 'feed_locked';
    if (isLoggedIn && hasProfileData) return 'feed_locked';
    return 'loading';
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [locations, setLocations] = useState<string[]>(storedInvasionData?.locations || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalFeatureName, setModalFeatureName] = useState('');

  const applyInvasionData = useCallback((data: InvasionData) => {
    if (data.profileData) setProfileData(data.profileData);
    if (data.suggestedProfiles?.length) setSuggestedProfiles(data.suggestedProfiles);
    if (data.posts?.length) setPosts(data.posts);
    if (data.locations?.length) setLocations(data.locations);
  }, []);

  useLayoutEffect(() => {
    if (hasProfileData) {
      ensurePreviewTrialSession();
    }
  }, [hasProfileData]);

  useLayoutEffect(() => {
    if (!instantLogin || stage !== 'feed_locked') return;
    login();
    sessionStorage.removeItem('spygram_instant_login');
    markInstagramDemoSeen();
  }, [instantLogin, stage, login]);

  useEffect(() => {
    const onUpdated = () => {
      const data = readInvasionData();
      if (data) applyInvasionData(data);
    };

    window.addEventListener('spygram:invasion-data-updated', onUpdated);
    return () => window.removeEventListener('spygram:invasion-data-updated', onUpdated);
  }, [applyInvasionData]);

  useEffect(() => {
    if (stage === 'feed_locked') {
      const data = readInvasionData();
      if (data && profileData && !isInvasionDataComplete(data)) {
        void loadInvasionFeedData(profileData, data).then(applyInvasionData);
      }
      return;
    }

    if (stage !== 'loading') return;

    const loadAllDataAndProceed = async () => {
      const dataFromNav =
        location.state?.profileData != null
          ? location.state
          : storedInvasionData;

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
      ensurePreviewTrialSession();

      try {
        const fullData = await loadInvasionFeedData(targetProfileData, storedInvasionData);
        applyInvasionData(fullData);
      } catch (error) {
        console.error('Erro ao carregar dados da invasão:', error);
      }

      if (isLoggedIn) {
        setStage('feed_locked');
      } else {
        setStage('login_attempt');
      }
    };

    loadAllDataAndProceed();
  }, [
    applyInvasionData,
    isLoggedIn,
    location.state,
    navigate,
    profileData,
    stage,
    storedInvasionData,
  ]);

  useEffect(() => {
    if (stage === 'feed_locked') {
      markInstagramDemoSeen();
    }
  }, [stage]);

  const handleLoginSuccess = useCallback(() => {
    sessionStorage.removeItem('spygram_instant_login');
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

        <div className="block md:hidden fixed inset-0 z-10 bg-black">
          <InstagramFeedMockup
            profileData={profileData}
            suggestedProfiles={suggestedProfiles}
            posts={posts}
            locations={locations}
            onLockedFeatureClick={handleLockedFeatureClick}
          />
        </div>

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
                instantAccess={false}
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
