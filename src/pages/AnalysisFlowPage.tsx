import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MIN_LOADING_DURATION } from '../../constants';
import { fetchProfileData } from '../services/profileService';
import { getUserLocation } from '../services/geolocationService';
import { trackLead } from '../services/trackingService';
import { trackFacebookEvent } from '../services/facebookService';
import { captureUtms } from '../utils/utm';
import { useAuth } from '../context/AuthContext';
import {
  clearInvasionTrialState,
  hasActiveInvasionTrial,
} from '../utils/invasionSession';
import { enrichSuggestedProfilesWithPeoplePhotos } from '../utils/feedStockImages';
import { AnalysisFlowProvider, useAnalysisFlow } from '../context/AnalysisFlowContext';
import HeroSection from '../components/analysis-flow/HeroSection';
import FetchingOverlay from '../components/analysis-flow/FetchingOverlay';
import ConfirmationModal from '../components/analysis-flow/ConfirmationModal';
import VslScreen from '../components/analysis-flow/VslScreen';
import TestWarningModal from '../components/TestWarningModal';

const AnalysisFlowInner: React.FC = () => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const {
    stage,
    profileData,
    suggestedProfiles,
    posts,
    userCity,
    setStage,
    setProfileResult,
    startVslSession,
  } = useAnalysisFlow();

  useEffect(() => {
    captureUtms();
    trackFacebookEvent('PageView');
  }, []);

  useEffect(() => {
    const activeInvasion = localStorage.getItem('spygram_active_invasion');
    if (!activeInvasion) return;

    sessionStorage.setItem('invasionData', activeInvasion);

    const vslActive = sessionStorage.getItem('spygram_vsl_active') === 'true';
    if (vslActive) return;

    if (hasActiveInvasionTrial()) {
      navigate('/instagram', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = useCallback(async () => {
    const clean = username.replace(/^@/, '').trim();
    if (!clean) {
      setError('Por favor, insira um nome de usuário.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStage('fetching');

    try {
      logout();
      sessionStorage.removeItem('invasionData');
      sessionStorage.removeItem('current_lead_id');
      localStorage.removeItem('spygram_banned_session');
      clearInvasionTrialState();

      const [fetchResult, locationData] = await Promise.all([
        fetchProfileData(clean),
        getUserLocation(),
        new Promise((resolve) => setTimeout(resolve, MIN_LOADING_DURATION)),
      ]);

      setProfileResult(
        fetchResult.profile,
        fetchResult.suggestions,
        fetchResult.posts,
        locationData.city
      );

      trackLead({
        username_searched: fetchResult.profile.username,
        profile_pic: fetchResult.profile.profilePicUrl,
        city: locationData.city,
        state: locationData.state,
        ip_address: locationData.ip,
        status: 'pesquisou',
      });

      setStage('confirm');
    } catch {
      setError('Sistema sobrecarregado, tente novamente mais tarde');
      setStage('landing');
    } finally {
      setIsLoading(false);
    }
  }, [username, logout, setStage, setProfileResult]);

  const handleConfirm = useCallback(() => {
    if (!profileData) return;

    const enrichedSuggestions = enrichSuggestedProfilesWithPeoplePhotos(suggestedProfiles);

    const invasionData = {
      profileData,
      suggestedProfiles: enrichedSuggestions,
      posts,
      userCity,
    };

    sessionStorage.setItem('invasionData', JSON.stringify(invasionData));
    localStorage.setItem('spygram_active_invasion', JSON.stringify(invasionData));

    trackLead({
      username_searched: profileData.username,
      profile_pic: profileData.profilePicUrl,
      city: userCity,
      status: 'confirmou_alvo',
    });

    startVslSession();
  }, [profileData, suggestedProfiles, posts, userCity, startVslSession]);

  const handleReject = useCallback(() => {
    setStage('landing');
    setUsername('');
  }, [setStage]);

  if (stage === 'vsl' || stage === 'report') {
    return <VslScreen />;
  }

  return (
    <>
      <TestWarningModal />
      <HeroSection
        username={username}
        onUsernameChange={setUsername}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        error={error}
      />
      {stage === 'fetching' && <FetchingOverlay username={username} />}
      {stage === 'confirm' && profileData && (
        <ConfirmationModal
          isOpen
          profile={profileData}
          suggestedProfiles={suggestedProfiles}
          posts={posts}
          onConfirm={handleConfirm}
          onReject={handleReject}
        />
      )}
    </>
  );
};

const AnalysisFlowPage: React.FC = () => (
  <AnalysisFlowProvider>
    <AnalysisFlowInner />
  </AnalysisFlowProvider>
);

export default AnalysisFlowPage;
