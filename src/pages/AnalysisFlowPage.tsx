import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProfileData } from '../services/profileService';
import { getUserLocation } from '../services/geolocationService';
import { trackLead } from '../services/trackingService';
import { trackFacebookEvent } from '../services/facebookService';
import { captureUtms } from '../utils/utm';
import { useAuth } from '../context/AuthContext';
import {
  canStartFreeConsultation,
  getFreeConsultationBlockedMessage,
  hasActiveInvasionTrial,
  hasOngoingInvasionFlow,
  markFreeConsultationUsed,
} from '../utils/invasionSession';
import { resolveTargetGender } from '../utils/genderClassifier';
import { enrichSuggestedProfilesWithPeoplePhotos } from '../utils/feedStockImages';
import { AnalysisFlowProvider, useAnalysisFlow } from '../context/AnalysisFlowContext';
import HeroSection from '../components/analysis-flow/HeroSection';
import ConversionQuiz from '../components/analysis-flow/ConversionQuiz';
import FetchingOverlay from '../components/analysis-flow/FetchingOverlay';
import ConfirmationModal from '../components/analysis-flow/ConfirmationModal';
import VslScreen from '../components/analysis-flow/VslScreen';
import TestWarningModal from '../components/TestWarningModal';

const QUIZ_DONE_KEY = 'spygram_quiz_done';

const AnalysisFlowInner: React.FC = () => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizDone, setQuizDone] = useState(
    () => sessionStorage.getItem(QUIZ_DONE_KEY) === 'true'
  );
  const { logout, isLoggedIn } = useAuth();
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

  const overlayCompleteRef = useRef<(() => void) | null>(null);

  const waitForFetchingOverlay = useCallback(
    () =>
      new Promise<void>((resolve) => {
        overlayCompleteRef.current = resolve;
      }),
    []
  );

  const handleFetchingOverlayComplete = useCallback(() => {
    overlayCompleteRef.current?.();
    overlayCompleteRef.current = null;
  }, []);

  useEffect(() => {
    const activeInvasion = localStorage.getItem('spygram_active_invasion');
    if (!activeInvasion) return;

    sessionStorage.setItem('invasionData', activeInvasion);

    const vslActive = sessionStorage.getItem('spygram_vsl_active') === 'true';
    if (vslActive) return;

    if (hasActiveInvasionTrial() || hasOngoingInvasionFlow()) {
      navigate('/instagram', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (isLoggedIn || canStartFreeConsultation(isLoggedIn)) return;
    setError(getFreeConsultationBlockedMessage());
  }, [isLoggedIn]);

  const handleSubmit = useCallback(async () => {
    const clean = username.replace(/^@/, '').trim();
    if (!clean) {
      setError('Por favor, insira um nome de usuário.');
      return;
    }

    setIsLoading(true);
    setError(null);

    if (!canStartFreeConsultation(isLoggedIn)) {
      setError(getFreeConsultationBlockedMessage());
      setStage('landing');
      setIsLoading(false);
      return;
    }

    setStage('fetching');

    try {
      logout();
      sessionStorage.removeItem('invasionData');
      sessionStorage.removeItem('current_lead_id');

      const [fetchResult, locationData] = await Promise.all([
        fetchProfileData(clean),
        getUserLocation(),
        waitForFetchingOverlay(),
      ]);

      setProfileResult(
        fetchResult.profile,
        fetchResult.suggestions,
        fetchResult.posts,
        locationData.city
      );

      if (!isLoggedIn) {
        markFreeConsultationUsed(fetchResult.profile.username);
      }

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
      overlayCompleteRef.current?.();
      overlayCompleteRef.current = null;
      setError('Sistema sobrecarregado, tente novamente mais tarde');
      setStage('landing');
    } finally {
      setIsLoading(false);
    }
  }, [username, logout, isLoggedIn, setStage, setProfileResult, waitForFetchingOverlay]);

  const handleConfirm = useCallback(() => {
    if (!profileData) return;

    const enrichedSuggestions = enrichSuggestedProfilesWithPeoplePhotos(
      suggestedProfiles,
      resolveTargetGender(profileData)
    );

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

  const handleQuizComplete = useCallback(() => {
    sessionStorage.setItem(QUIZ_DONE_KEY, 'true');
    setQuizDone(true);
    trackFacebookEvent('Lead');
  }, []);

  if (stage === 'vsl' || stage === 'report') {
    return <VslScreen />;
  }

  return (
    <>
      <TestWarningModal />
      {!quizDone ? (
        <ConversionQuiz onComplete={handleQuizComplete} />
      ) : (
        <HeroSection
          username={username}
          onUsernameChange={setUsername}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          error={error}
        />
      )}
      {stage === 'fetching' && (
        <FetchingOverlay username={username} onComplete={handleFetchingOverlayComplete} />
      )}
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
