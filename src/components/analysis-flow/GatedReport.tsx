import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BadgeCheck,
  ChevronDown,
  Eye,
  Headphones,
  Lock,
  MapPin,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAnalysisFlow } from '../../context/AnalysisFlowContext';
import { getFeedStockImageForUser } from '../../utils/feedStockImages';
import './analysis-flow.css';

function hashSeed(username: string): number {
  let h = 0;
  for (let i = 0; i < username.length; i++) {
    h = (h + username.charCodeAt(i) * (i + 1)) % 997;
  }
  return h;
}

function formatCountdown(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

const GatedReport: React.FC = () => {
  const navigate = useNavigate();
  const { profileData, suggestedProfiles, reportRemainingMs } = useAnalysisFlow();

  const stats = useMemo(() => {
    if (!profileData) {
      return { messages: 70, photos: 35, audios: 12, locations: 3 };
    }
    const seed = hashSeed(profileData.username);
    return {
      messages: 52 + (seed % 28),
      photos: 24 + (seed % 18),
      audios: 8 + (seed % 10),
      locations: 2 + (seed % 5),
    };
  }, [profileData]);

  const mediaImages = useMemo(() => {
    if (!profileData) return [];
    return Array.from({ length: 6 }, (_, i) =>
      getFeedStockImageForUser(
        `${profileData.username}-report-${i}`,
        profileData.username,
        profileData.fullName,
        suggestedProfiles
      )
    );
  }, [profileData, suggestedProfiles]);

  const keywords = useMemo(
    () => [
      { word: 'amor', count: 14 + (hashSeed(profileData?.username ?? '') % 8) },
      { word: 'saudade', count: 9 + (hashSeed(profileData?.username ?? 'x') % 6) },
      { word: 'segredo', count: 6 + (hashSeed(profileData?.username ?? 'y') % 5) },
      { word: 'encontro', count: 4 + (hashSeed(profileData?.username ?? 'z') % 4) },
    ],
    [profileData]
  );

  if (!profileData) return null;

  const today = new Date().toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={{ duration: 0.6 }}
      className="space-y-4 overflow-hidden"
    >
      <div className="bg-red-600 text-white text-center text-xs font-bold py-2 rounded-xl">
        Acesso ao relatório expira em: {formatCountdown(reportRemainingMs)}
      </div>

      <div className="bg-white rounded-3xl shadow-md p-5 text-center">
        <div className="flex items-center justify-center gap-1 mb-4">
          <span className="font-bold">{profileData.username}</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
        <div className="w-24 h-24 mx-auto rounded-full p-[3px] bg-gradient-to-tr from-pink-500 to-orange-400 mb-3">
          <img
            src={profileData.profilePicUrl}
            alt=""
            className="w-full h-full rounded-full object-cover border-2 border-white"
          />
        </div>
        <div className="flex justify-center gap-6 text-xs mb-4">
          <div>
            <p className="font-black text-lg">{profileData.postsCount}</p>
            <p className="text-gray-500 uppercase">posts</p>
          </div>
          <div>
            <p className="font-black text-lg">{profileData.followers.toLocaleString('pt-BR')}</p>
            <p className="text-gray-500 uppercase">seguidores</p>
          </div>
          <div>
            <p className="font-black text-lg">{profileData.following.toLocaleString('pt-BR')}</p>
            <p className="text-gray-500 uppercase">seguindo</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1 text-xs text-gray-600 mb-3">
          <BadgeCheck className="w-4 h-4 text-blue-500" />
          Relatório autenticado em {today}
        </div>
        <span className="inline-block bg-red-50 text-red-600 text-xs font-bold px-3 py-1.5 rounded-full border border-red-200">
          4 Atividades suspeitas detectadas
        </span>
        <p className="text-xs text-green-600 font-semibold mt-3">
          {180 + (hashSeed(profileData.username) % 120)} pessoas usando o sistema agora
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-4 space-y-3">
        <h3 className="font-black text-gray-900">Resumo da Análise</h3>
        {[
          { label: 'Mensagens de Direct suspeitas', value: stats.messages },
          { label: 'Fotos e vídeos privados', value: stats.photos },
          { label: 'Áudios comprometedores', value: stats.audios },
          { label: 'Localizações suspeitas', value: stats.locations },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{row.label}</span>
            <span className="font-black text-red-500">{row.value}</span>
          </div>
        ))}
      </div>

      {/* Direct messages — blurred */}
      <div className="bg-white rounded-2xl shadow-md p-4">
        <h3 className="font-black text-gray-900 mb-2">Mensagens de Direct</h3>
        <p className="text-xs text-gray-500 mb-3">Conversas suspeitas detectadas no histórico</p>
        <div className="relative space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 blur-md select-none">
              <div className="w-10 h-10 rounded-full bg-gray-300" />
              <div className="flex-1">
                <p className="text-sm font-bold">████████</p>
                <p className="text-xs text-gray-500">███████████████</p>
              </div>
              <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded">
                MENSAGEM SUSPEITA
              </span>
            </div>
          ))}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Lock className="w-10 h-10 text-white drop-shadow-lg" />
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/checkout')}
          className="analysis-btn-gradient w-full mt-4 rounded-2xl py-3.5 text-white font-black text-xs flex items-center justify-center gap-2"
        >
          <Eye className="w-4 h-4" />
          DESBLOQUEAR ACESSO COMPLETO
        </button>
      </div>

      {/* Private media grid */}
      <div className="bg-white rounded-2xl shadow-md p-4">
        <h3 className="font-black text-gray-900 mb-3">Mídia Privada</h3>
        <div className="grid grid-cols-3 gap-1 relative">
          {mediaImages.map((src, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-lg">
              <img src={src} alt="" className="w-full h-full object-cover blur-lg scale-110" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Lock className="w-6 h-6 text-white" />
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => navigate('/checkout')}
          className="analysis-btn-gradient w-full mt-4 rounded-2xl py-3.5 text-white font-black text-xs flex items-center justify-center gap-2"
        >
          <Eye className="w-4 h-4" />
          VER FOTOS SUSPEITAS
        </button>
      </div>

      {/* Audio */}
      <div className="bg-gray-900 rounded-2xl p-4 relative overflow-hidden">
        <h3 className="font-black text-white mb-3 flex items-center gap-2">
          <Headphones className="w-4 h-4" />
          Áudios Comprometedores
        </h3>
        <div className="space-y-2 blur-md select-none">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-pink-500" />
              <div className="flex-1 h-6 bg-gray-700 rounded" />
              <span className="text-xs text-gray-400">0:{12 + i}</span>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Lock className="w-10 h-10 text-white/90" />
        </div>
        <button
          type="button"
          onClick={() => navigate('/checkout')}
          className="analysis-btn-gradient w-full mt-4 rounded-2xl py-3.5 text-white font-black text-xs flex items-center justify-center gap-2 relative z-10"
        >
          <Headphones className="w-4 h-4" />
          OUVIR ÁUDIOS COMPLETOS
        </button>
      </div>

      {/* Keywords */}
      <div className="bg-white rounded-2xl shadow-md p-4">
        <h3 className="font-black text-gray-900 mb-3">Palavras-chave detectadas</h3>
        <div className="flex flex-wrap gap-2 blur-sm select-none">
          {keywords.map((k) => (
            <span
              key={k.word}
              className="text-sm bg-gray-100 px-3 py-1.5 rounded-full text-gray-700"
            >
              {k.word}{' '}
              <strong className="text-red-500">×{k.count}</strong>
            </span>
          ))}
        </div>
      </div>

      {/* Locations */}
      <div className="bg-gray-900 rounded-2xl p-4 relative">
        <h3 className="font-black text-white mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Localizações Suspeitas
        </h3>
        <div className="h-32 bg-gray-800 rounded-xl blur-md flex items-center justify-center">
          <div className="flex gap-4">
            <MapPin className="w-6 h-6 text-red-500" />
            <MapPin className="w-6 h-6 text-red-500" />
            <MapPin className="w-6 h-6 text-red-500" />
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none pt-10">
          <Lock className="w-10 h-10 text-white/90" />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-white via-white/95 to-transparent">
        <button
          type="button"
          onClick={() => navigate('/checkout')}
          className="analysis-cta-pulse analysis-btn-gradient w-full max-w-md mx-auto block rounded-2xl py-4 text-white font-black text-sm tracking-wide shadow-lg"
        >
          <span className="flex items-center justify-center gap-2">
            <Lock className="w-5 h-5" />
            DESBLOQUEAR RELATÓRIO COMPLETO
          </span>
        </button>
      </div>
    </motion.div>
  );
};

export default GatedReport;
