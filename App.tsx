import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import LoginPage from '@/src/pages/LoginPage';
import AdminLoginPage from '@/src/pages/AdminLoginPage';
import ServersPage from '@/src/pages/ServersPage';
import CreditsPage from '@/src/pages/CreditsPage';
import MessagesPage from '@/src/pages/MessagesPage';
import NotificationsPage from '@/src/pages/NotificationsPage';
import ChatPage from '@/src/pages/ChatPage';
import CheckoutPage from '@/src/pages/CheckoutPage';
import BackRedirectPage from '@/src/pages/BackRedirectPage';
import AdminPage from '@/src/pages/AdminPage';
import InvasionSimulationPage from '@/src/pages/InvasionSimulationPage';
import InvasionConcludedPage from '@/src/pages/InvasionConcludedPage';
import AnalysisFlowPage from '@/src/pages/AnalysisFlowPage';
import { AuthProvider, useAuth } from './src/context/AuthContext'; 
import ProtectedRoute from './src/components/ProtectedRoute';
import AdminProtectedRoute from './src/components/AdminProtectedRoute';
import BackgroundLayout from './src/components/BackgroundLayout';
import DevToolsPanel from '@/src/components/DevToolsPanel';
import AnalyticsTracker from '@/src/components/AnalyticsTracker';
import {
  hasActiveInvasionTrial,
  isInvasionDemoPath,
} from './src/utils/invasionSession';
import { PreviewTrialProvider } from './src/context/PreviewTrialContext';

const TrialGuard: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isTrialExpired = localStorage.getItem('spygram_trial_expired') === 'true';
    const onDemoPath = isInvasionDemoPath(location.pathname);
    const activeTrial = hasActiveInvasionTrial();

    if (isTrialExpired && !isLoggedIn && !(onDemoPath && activeTrial)) {
      const allowedPaths = [
        '/invasion-concluded',
        '/checkout',
        '/back-redirect',
        '/login',
        '/admin-login',
        '/admin',
        ...['/instagram', '/messages', '/notifications', '/chat'],
      ];
      const isAllowed = allowedPaths.some((path) => location.pathname.startsWith(path));
      if (!isAllowed) {
        navigate('/invasion-concluded', { replace: true });
      }
    }
  }, [location.pathname, isLoggedIn, navigate]);

  return null;
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <PreviewTrialProvider>
          <AnalyticsTracker />
          <TrialGuard />
          <Routes>
          <Route path="/" element={<AnalysisFlowPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/back-redirect" element={<BackRedirectPage />} />
          <Route path="/admin" element={<AdminProtectedRoute><AdminPage /></AdminProtectedRoute>} />
          <Route path="/instagram" element={<InvasionSimulationPage />} />
          <Route path="/invasion-concluded" element={<BackgroundLayout><InvasionConcludedPage /></BackgroundLayout>} />
          <Route path="/servers" element={<ProtectedRoute><BackgroundLayout><ServersPage /></BackgroundLayout></ProtectedRoute>} />
          <Route path="/credits" element={<ProtectedRoute><BackgroundLayout><CreditsPage /></BackgroundLayout></ProtectedRoute>} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/chat/:id" element={<ChatPage />} />
        </Routes>
        <DevToolsPanel />
        </PreviewTrialProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;