import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PreviewExpiredModal from '../components/PreviewExpiredModal';
import {
  expireInvasionTrial,
  hasActiveInvasionTrial,
  isInvasionDemoPath,
  isPreviewTrialExpired,
} from '../utils/invasionSession';

interface PreviewTrialContextValue {
  timeLeft: number | null;
  isPreviewActive: boolean;
}

const PreviewTrialContext = createContext<PreviewTrialContextValue>({
  timeLeft: null,
  isPreviewActive: false,
});

export const PreviewTrialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showExpiredModal, setShowExpiredModal] = useState(false);

  const onDemoPath = isInvasionDemoPath(location.pathname);

  const handleExpire = useCallback(() => {
    expireInvasionTrial();
    setTimeLeft(0);
    if (isInvasionDemoPath(location.pathname)) {
      setShowExpiredModal(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!onDemoPath) {
      setShowExpiredModal(false);
      return;
    }

    if (isPreviewTrialExpired() && !hasActiveInvasionTrial()) {
      setTimeLeft(0);
      setShowExpiredModal(true);
      return;
    }

    const storedEndTime = sessionStorage.getItem('invasionEndTime');
    if (!storedEndTime) {
      setTimeLeft(null);
      setShowExpiredModal(false);
      return;
    }

    const endTime = parseInt(storedEndTime, 10);

    const tick = () => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        handleExpire();
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [onDemoPath, location.pathname, handleExpire]);

  const goToCheckout = useCallback(() => {
    setShowExpiredModal(false);
    navigate('/checkout');
  }, [navigate]);

  const value = useMemo(
    () => ({
      timeLeft,
      isPreviewActive: timeLeft !== null && timeLeft > 0,
    }),
    [timeLeft]
  );

  return (
    <PreviewTrialContext.Provider value={value}>
      {children}
      {showExpiredModal && onDemoPath && <PreviewExpiredModal onCheckout={goToCheckout} />}
    </PreviewTrialContext.Provider>
  );
};

export function usePreviewTrial() {
  return useContext(PreviewTrialContext);
}
