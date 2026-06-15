import React, { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play } from 'lucide-react';
import { getVslEmbedUrl, VSL_LOCAL_VIDEO_URL } from '../../constants/analysisFlow';
import './analysis-flow.css';

type PlayerMode = 'checking' | 'local' | 'youtube';

interface VslVideoPlayerProps {
  forcePaused?: boolean;
}

const VslVideoPlayer: React.FC<VslVideoPlayerProps> = ({ forcePaused = false }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wasPlayingRef = useRef(false);
  const [mode, setMode] = React.useState<PlayerMode>('checking');
  const [showOverlay, setShowOverlay] = React.useState(true);

  const embedUrl = React.useMemo(() => getVslEmbedUrl(window.location.origin), []);

  useEffect(() => {
    let cancelled = false;

    fetch(VSL_LOCAL_VIDEO_URL, { method: 'HEAD' })
      .then((res) => {
        if (cancelled) return;
        setMode(res.ok ? 'local' : 'youtube');
      })
      .catch(() => {
        if (!cancelled) setMode('youtube');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const sendYoutubeCommand = useCallback((func: string, args = '') => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args }),
      '*'
    );
  }, []);

  const activateWithSound = useCallback(() => {
    if (mode === 'local' && videoRef.current) {
      videoRef.current.muted = false;
      void videoRef.current.play();
      setShowOverlay(false);
      return;
    }

    sendYoutubeCommand('unMute');
    sendYoutubeCommand('playVideo');
    setShowOverlay(false);
  }, [mode, sendYoutubeCommand]);

  useEffect(() => {
    if (mode === 'checking') return;

    if (forcePaused) {
      if (mode === 'local' && videoRef.current) {
        wasPlayingRef.current = !videoRef.current.paused;
        videoRef.current.pause();
      } else if (mode === 'youtube') {
        wasPlayingRef.current = !showOverlay;
        sendYoutubeCommand('pauseVideo');
      }
      return;
    }

    if (mode === 'local' && videoRef.current && wasPlayingRef.current) {
      wasPlayingRef.current = false;
      void videoRef.current.play();
      setShowOverlay(false);
    } else if (mode === 'youtube' && wasPlayingRef.current) {
      wasPlayingRef.current = false;
      sendYoutubeCommand('playVideo');
    }
  }, [forcePaused, mode, sendYoutubeCommand, showOverlay]);

  const handleVideoPlay = useCallback(() => {
    if (videoRef.current && !videoRef.current.muted) {
      setShowOverlay(false);
    }
  }, []);

  const handleVideoPause = useCallback(() => {
    if (!forcePaused) {
      setShowOverlay(true);
    }
  }, [forcePaused]);

  if (mode === 'checking') {
    return (
      <div className="vsl-player vsl-player--loading">
        <div className="vsl-player__loader" />
      </div>
    );
  }

  return (
    <div className="vsl-player">
      {mode === 'local' ? (
        <video
          ref={videoRef}
          className="vsl-player__native"
          src={VSL_LOCAL_VIDEO_URL}
          autoPlay
          muted
          playsInline
          preload="auto"
          onPlay={handleVideoPlay}
          onPause={handleVideoPause}
          onClick={activateWithSound}
        />
      ) : (
        <>
          <div className="vsl-player__crop">
            <iframe
              ref={iframeRef}
              src={embedUrl}
              title="Vídeo SpyGram"
              className="vsl-player__iframe"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
          <div className="vsl-player__shade vsl-player__shade--top" aria-hidden />
          <div className="vsl-player__shade vsl-player__shade--bottom" aria-hidden />
        </>
      )}

      {showOverlay && !forcePaused && (
        <button
          type="button"
          className="vsl-player__tap"
          onClick={activateWithSound}
          aria-label="Reproduzir vídeo com som"
        >
          <span className="vsl-player__play">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </span>
          <span className="vsl-player__tap-text">Toque para assistir com som</span>
        </button>
      )}
    </div>
  );
};

export default VslVideoPlayer;
