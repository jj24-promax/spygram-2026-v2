/** Duração total da sessão VSL (15 min) */
export const VSL_SESSION_MS = 15 * 60 * 1000;

/** Tempo até liberar prévia / relatório (3 min) */
export const ANALYSIS_COMPLETE_MS = 3 * 60 * 1000;

/** Countdown de urgência no relatório após liberar (15 min) */
export const REPORT_ACCESS_MS = 15 * 60 * 1000;

/** Duração da prévia gratuita no Instagram simulado */
export const PREVIEW_TRIAL_MS = 60 * 1000;

/**
 * Vídeo VSL local — public/videos/vsl.mp4 (~76 MB, web-optimized)
 */
export const VSL_LOCAL_VIDEO_URL = '/videos/vsl.mp4';

/** Fallback YouTube — https://youtu.be/OfpbkyFQEtc */
export const VSL_VIDEO_ID = 'OfpbkyFQEtc';

export function getVslEmbedUrl(origin?: string): string {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    controls: '0',
    modestbranding: '1',
    rel: '0',
    playsinline: '1',
    enablejsapi: '1',
    iv_load_policy: '3',
    fs: '0',
    disablekb: '1',
    cc_load_policy: '1',
  });

  if (origin) params.set('origin', origin);

  return `https://www.youtube-nocookie.com/embed/${VSL_VIDEO_ID}?${params.toString()}`;
}

export const VSL_EMBED_URL = getVslEmbedUrl();
