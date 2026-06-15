import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageIcon, Loader2, Lock, MapPin, MessageCircle } from 'lucide-react';
import { useAnalysisFlow } from '../../context/AnalysisFlowContext';
import { ANALYSIS_COMPLETE_MS } from '../../constants/analysisFlow';
import { getAnalysisStats, getTrackerProgress } from '../../utils/analysisStats';
import { getRandomSuspiciousPreviewImages } from '../../utils/suspiciousStockImages';
import './analysis-flow.css';

interface TrackerItem {
  id: 'messages' | 'images' | 'locations';
  label: string;
  icon: React.ElementType;
}

const TRACKER_ITEMS: TrackerItem[] = [
  { id: 'messages', label: 'Mensagens suspeitas', icon: MessageCircle },
  { id: 'images', label: 'Imagens suspeitas', icon: ImageIcon },
  { id: 'locations', label: 'Localizações suspeitas', icon: MapPin },
];

function countLabel(id: TrackerItem['id'], count: number): string {
  if (id === 'messages') {
    return count === 1
      ? 'mensagem suspeita identificada'
      : 'mensagens suspeitas identificadas';
  }
  if (id === 'images') {
    return count === 1 ? 'imagem suspeita identificada' : 'imagens suspeitas identificadas';
  }
  return count === 1
    ? 'localização suspeita identificada'
    : 'localizações suspeitas identificadas';
}

const VslTracker: React.FC = () => {
  const { profileData, vslElapsedMs, isAnalysisComplete } = useAnalysisFlow();

  const stats = useMemo(
    () => (profileData ? getAnalysisStats(profileData.username) : null),
    [profileData]
  );

  const trackerState = useMemo(() => {
    if (!stats) return null;
    return getTrackerProgress(vslElapsedMs, ANALYSIS_COMPLETE_MS, isAnalysisComplete, {
      messages: stats.messages,
      images: stats.images,
      locations: stats.locations,
    });
  }, [stats, vslElapsedMs, isAnalysisComplete]);

  const [previewImages] = useState(() => getRandomSuspiciousPreviewImages(3));

  const showImageThumbs = useMemo(() => {
    if (!trackerState) return false;
    const { count, isScanning } = trackerState.images;
    return isAnalysisComplete || count > 0 || isScanning;
  }, [trackerState, isAnalysisComplete]);

  return (
    <div className="space-y-3">
      {isAnalysisComplete && (
        <div className="vsl-complete-bar">
          <p className="vsl-complete-bar__label">
            <span className="text-green-600 font-bold">✓ Análise concluída</span>
            <span className="text-red-500 font-black">100%</span>
          </p>
          <div className="vsl-complete-bar__track">
            <div className="vsl-complete-bar__fill" />
          </div>
        </div>
      )}

      <h3 className="font-black text-gray-900 text-sm">Dados suspeitos detectados:</h3>

      {TRACKER_ITEMS.map((item, index) => {
        const Icon = item.icon;
        const state = trackerState?.[item.id];
        const pct = state?.progress ?? 0;
        const count = state?.count ?? 0;
        const isScanning = state?.isScanning ?? false;
        const showCount = count > 0;

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.12 }}
            className="vsl-tracker-card"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-900">{item.label}</p>

                <AnimatePresence mode="wait">
                  {showCount ? (
                    <motion.p
                      key={count}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="text-xs font-bold text-red-500 mt-0.5"
                    >
                      🚨 {count} {countLabel(item.id, count)}
                      {isScanning && (
                        <span className="text-gray-400 font-semibold"> — analisando...</span>
                      )}
                    </motion.p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {isScanning ? 'Iniciando varredura...' : 'Aguardando análise...'}
                    </p>
                  )}
                </AnimatePresence>

                <div className="mt-2 h-1 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-pink-500 via-orange-400 to-purple-500"
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>
              {isScanning && <Loader2 className="w-5 h-5 text-red-500 animate-spin shrink-0" />}
            </div>

            {item.id === 'images' && showImageThumbs && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="vsl-tracker-thumbs"
              >
                {previewImages.map((src, i) => (
                  <div key={src} className="vsl-tracker-thumb">
                    <img src={src} alt="" className="vsl-tracker-thumb__img" />
                    <Lock className="vsl-tracker-thumb__lock" />
                  </div>
                ))}
              </motion.div>
            )}

            {item.id === 'locations' && stats && count > 0 && (state?.isDone || isAnalysisComplete) && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="vsl-tracker-location"
              >
                <div className="vsl-tracker-location__row">
                  <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="font-semibold text-sm text-gray-800 truncate">
                    {stats.locationLabel}
                  </span>
                  <span className="vsl-tracker-location__count">{count}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Nos últimos {stats.locationDays} dias</p>
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default VslTracker;
