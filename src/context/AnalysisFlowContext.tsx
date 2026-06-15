import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ProfileData, SuggestedProfile, FeedPost } from '../../types';
import { ANALYSIS_COMPLETE_MS, VSL_SESSION_MS } from '../constants/analysisFlow';

export type AnalysisFlowStage = 'landing' | 'fetching' | 'confirm' | 'vsl' | 'report';
export type PreviewChoice = 'locked' | 'pending' | 'video' | 'preview';

interface AnalysisFlowContextValue {
  stage: AnalysisFlowStage;
  profileData: ProfileData | null;
  suggestedProfiles: SuggestedProfile[];
  posts: FeedPost[];
  userCity: string;
  isAnalysisComplete: boolean;
  previewChoice: PreviewChoice;
  vslElapsedMs: number;
  vslRemainingMs: number;
  reportRemainingMs: number;
  setStage: (stage: AnalysisFlowStage) => void;
  setProfileResult: (
    profile: ProfileData,
    suggestions: SuggestedProfile[],
    posts: FeedPost[],
    city?: string
  ) => void;
  resetFlow: () => void;
  startVslSession: () => void;
  chooseContinueVideo: () => void;
  choosePreviewAccess: () => void;
}

const AnalysisFlowContext = createContext<AnalysisFlowContextValue | null>(null);

export const AnalysisFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stage, setStage] = useState<AnalysisFlowStage>('landing');
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [suggestedProfiles, setSuggestedProfiles] = useState<SuggestedProfile[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [userCity, setUserCity] = useState('Sua Localização');
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);
  const [previewChoice, setPreviewChoice] = useState<PreviewChoice>('locked');
  const [vslElapsedMs, setVslElapsedMs] = useState(0);
  const [reportRemainingMs, setReportRemainingMs] = useState(0);

  const vslStartedAt = useRef<number | null>(null);
  const reportStartedAt = useRef<number | null>(null);

  const setProfileResult = useCallback(
    (profile: ProfileData, suggestions: SuggestedProfile[], postList: FeedPost[], city?: string) => {
      setProfileData(profile);
      setSuggestedProfiles(suggestions);
      setPosts(postList);
      if (city) setUserCity(city);
    },
    []
  );

  const resetFlow = useCallback(() => {
    setStage('landing');
    setProfileData(null);
    setSuggestedProfiles([]);
    setPosts([]);
    setIsAnalysisComplete(false);
    setPreviewChoice('locked');
    setVslElapsedMs(0);
    setReportRemainingMs(0);
    vslStartedAt.current = null;
    reportStartedAt.current = null;
    sessionStorage.removeItem('spygram_vsl_active');
  }, []);

  const startVslSession = useCallback(() => {
    vslStartedAt.current = Date.now();
    setStage('vsl');
    setIsAnalysisComplete(false);
    setPreviewChoice('locked');
    setVslElapsedMs(0);
    reportStartedAt.current = null;
    setReportRemainingMs(0);
    sessionStorage.setItem('spygram_vsl_active', 'true');
  }, []);

  const chooseContinueVideo = useCallback(() => {
    setPreviewChoice('video');
  }, []);

  const choosePreviewAccess = useCallback(() => {
    setPreviewChoice('preview');
    sessionStorage.removeItem('spygram_vsl_active');
  }, []);

  useEffect(() => {
    if (stage !== 'vsl' && stage !== 'report') return;
    if (!vslStartedAt.current) return;

    const tick = () => {
      const started = vslStartedAt.current!;
      const elapsed = Date.now() - started;
      setVslElapsedMs(elapsed);

      if (!isAnalysisComplete && elapsed >= ANALYSIS_COMPLETE_MS) {
        setIsAnalysisComplete(true);
        setStage('report');
        setPreviewChoice('pending');
        reportStartedAt.current = Date.now();
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [stage, isAnalysisComplete]);

  useEffect(() => {
    if (!isAnalysisComplete || !reportStartedAt.current) return;

    const tick = () => {
      const elapsed = Date.now() - reportStartedAt.current!;
      const remaining = Math.max(0, VSL_SESSION_MS - elapsed);
      setReportRemainingMs(remaining);
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [isAnalysisComplete]);

  const vslRemainingMs = Math.max(0, VSL_SESSION_MS - vslElapsedMs);

  const value = useMemo(
    () => ({
      stage,
      profileData,
      suggestedProfiles,
      posts,
      userCity,
      isAnalysisComplete,
      previewChoice,
      vslElapsedMs,
      vslRemainingMs,
      reportRemainingMs,
      setStage,
      setProfileResult,
      resetFlow,
      startVslSession,
      chooseContinueVideo,
      choosePreviewAccess,
    }),
    [
      stage,
      profileData,
      suggestedProfiles,
      posts,
      userCity,
      isAnalysisComplete,
      previewChoice,
      vslElapsedMs,
      vslRemainingMs,
      reportRemainingMs,
      setProfileResult,
      resetFlow,
      startVslSession,
      chooseContinueVideo,
      choosePreviewAccess,
    ]
  );

  return <AnalysisFlowContext.Provider value={value}>{children}</AnalysisFlowContext.Provider>;
};

export function useAnalysisFlow() {
  const ctx = useContext(AnalysisFlowContext);
  if (!ctx) throw new Error('useAnalysisFlow must be used within AnalysisFlowProvider');
  return ctx;
}
