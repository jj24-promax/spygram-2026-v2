import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (role?: 'admin' | 'user') => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Persistência básica de sessão para facilitar o uso
  useEffect(() => {
    const auth = sessionStorage.getItem('auth_session');
    if (auth) {
      const { loggedIn, admin } = JSON.parse(auth);
      setIsLoggedIn(loggedIn);
      setIsAdmin(admin);
    }
  }, []);

  const login = (role: 'admin' | 'user' = 'user') => {
    const isAdm = role === 'admin';
    setIsLoggedIn(true);
    setIsAdmin(isAdm);
    sessionStorage.setItem('auth_session', JSON.stringify({ loggedIn: true, admin: isAdm }));
  };

  const logout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    sessionStorage.removeItem('auth_session');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};