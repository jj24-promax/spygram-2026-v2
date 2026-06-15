import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useAnalysisFlow } from '../../context/AnalysisFlowContext';
import VslVideoPlayer from './VslVideoPlayer';
import { startPreviewTrialSession } from '../../utils/invasionSession';
import { trackLead } from '../../services/trackingService';
import VslTracker from './VslTracker';
import GatedReport from './GatedReport';
import PostAnalysisReveal from './PostAnalysisReveal';
import VslStickyAccessBar from './VslStickyAccessBar';
import { ANALYSIS_COMPLETE_MS } from '../../constants/analysisFlow';
import './analysis-flow.css';

const formatStat = (n: number) => n.toLocaleString('pt-BR');

const VslScreen: React.FC = () => {
  const navigate = useNavigate();
  const {
    profileData,
    vslElapsedMs,
    isAnalysisComplete,
    previewChoice,
    choosePreviewAccess,
  } = useAnalysisFlow();

  const [revealModalOpen, setRevealModalOpen] = useState(false);

  useEffect(() => {
    if (isAnalysisComplete && previewChoice === 'pending') {
      setRevealModalOpen(true);
    }
  }, [isAnalysisComplete, previewChoice]);

  const authProgress = useMemo(() => {
    if (isAnalysisComplete) return 100;
    return Math.min(96, Math.round((vslElapsedMs / ANALYSIS_COMPLETE_MS) * 100));
  }, [vslElapsedMs, isAnalysisComplete]);

  const launchPreview = useCallback(() => {
    if (!profileData) return;
    choosePreviewAccess();
    sessionStorage.setItem('spygram_instant_login', 'true');
    startPreviewTrialSession();
    trackLead({
      username_searched: profileData.username,
      status: 'acessou_previa',
    });
    navigate('/instagram');
  }, [profileData, choosePreviewAccess, navigate]);

  const handleContinueVideo = useCallback(() => {
    setRevealModalOpen(false);
  }, []);

  if (!profileData) return null;

  const showStickyBar = isAnalysisComplete && previewChoice !== 'preview' && !revealModalOpen;
  const showGatedReport = isAnalysisComplete && previewChoice === 'video';

  return (
    <div className="analysis-flow-bg w-full min-h-screen pb-36">
      <div className="max-w-md mx-auto px-4 py-6 space-y-5">
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 text-xs font-black text-white analysis-btn-gradient rounded-full px-4 py-2 uppercase tracking-wide">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_rgba(74,222,128,0.9)]" />
            Análise em tempo real
          </span>
        </div>

        <div className="rounded-3xl overflow-hidden bg-gray-900 shadow-xl">
          <div className="px-4 py-3 text-center text-xs leading-relaxed">
            <span className="text-red-500 font-bold">ASSISTA O VÍDEO ENQUANTO </span>
            <span className="text-gray-300">
              o perfil é rastreado e as conversas são processadas para{' '}
            </span>
            <span className="text-red-500 font-bold">@{profileData.username}</span>
          </div>
          <VslVideoPlayer forcePaused={revealModalOpen} />
        </div>

        <div className="bg-white rounded-2xl shadow-md p-4 flex gap-3 items-start border border-pink-50">
          <img
            src={profileData.profilePicUrl}
            alt={profileData.username}
            className="w-14 h-14 rounded-full object-cover border-2 border-pink-200 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="font-black text-gray-900">@{profileData.username}</p>
            <div className="mt-1 flex flex-nowrap items-baseline gap-x-3 text-[11px] leading-tight whitespace-nowrap overflow-hidden">
              <span className="shrink-0">
                <span className="font-black text-gray-900">{formatStat(profileData.postsCount)}</span>{' '}
                <span className="text-gray-500">posts</span>
              </span>
              <span className="shrink-0">
                <span className="font-black text-gray-900">{formatStat(profileData.followers)}</span>{' '}
                <span className="text-gray-500">seguidores</span>
              </span>
              <span className="shrink-0 min-w-0 truncate">
                <span className="font-black text-gray-900">{formatStat(profileData.following)}</span>{' '}
                <span className="text-gray-500">seguindo</span>
              </span>
            </div>
            {profileData.biography?.trim() && (
              <p className="vsl-profile-card__bio">{profileData.biography}</p>
            )}
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-1" />
        </div>

        {!isAnalysisComplete && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-purple-700">🔑 Autenticando chave de acesso...</p>
              <span className="text-sm font-black text-red-500">{authProgress}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
              <motion.div
                className="h-full analysis-auth-gradient rounded-full"
                animate={{ width: `${authProgress}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        <VslTracker />

        <p className="text-center text-[11px] text-gray-400 font-bold px-2 pb-2">
          Os dados são processados em tempo real e são estritamente confidenciais.
        </p>

        {showGatedReport && <GatedReport />}
      </div>

      {showStickyBar && (
        <VslStickyAccessBar username={profileData.username} onAccessPreview={launchPreview} />
      )}

      <AnimatePresence>
        {revealModalOpen && (
          <PostAnalysisReveal
            username={profileData.username}
            onAccessPreview={launchPreview}
            onContinueVideo={handleContinueVideo}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default VslScreen;
