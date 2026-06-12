import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ReelFullscreenViewProps {
  isOpen: boolean;
  videoSrc: string;
  onClose: () => void;
}

const ReelFullscreenView: React.FC<ReelFullscreenViewProps> = ({ isOpen, videoSrc, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isOpen) {
        videoRef.current.play().catch(e => console.error("Error playing video:", e));
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isOpen, videoSrc]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] bg-black flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="relative w-full h-full max-w-xl max-h-[90vh] bg-black flex items-center justify-center"
            onClick={(e) => e.stopPropagation()} // Evita fechar ao clicar no vídeo
          >
            <video
              ref={videoRef}
              src={videoSrc}
              controls
              autoPlay
              loop
              playsInline
              className="max-w-full max-h-full object-contain rounded-lg shadow-xl"
            />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <X size={24} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReelFullscreenView;