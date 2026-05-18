import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { isLoggedIn, isAdmin } = useAuth();
  const location = useLocation();

  if (!isLoggedIn) {
    // Redireciona para login, salvando a página que tentou acessar
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    // Se for rota de admin e não for admin, volta para a home ou dashboard comum
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;