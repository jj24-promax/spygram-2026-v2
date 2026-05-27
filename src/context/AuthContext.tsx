import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (role?: 'admin' | 'user') => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Inicialização síncrona: evita que o F5 redirecione o usuário por causa do delay do useEffect.
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const auth = localStorage.getItem('auth_session') || sessionStorage.getItem('auth_session');
    if (auth) {
      try { return JSON.parse(auth).loggedIn; } catch (e) { return false; }
    }
    return false;
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    const auth = localStorage.getItem('auth_session') || sessionStorage.getItem('auth_session');
    if (auth) {
      try { return JSON.parse(auth).admin; } catch (e) { return false; }
    }
    return false;
  });

  const login = (role: 'admin' | 'user' = 'user') => {
    const isAdm = role === 'admin';
    setIsLoggedIn(true);
    setIsAdmin(isAdm);
    const authData = JSON.stringify({ loggedIn: true, admin: isAdm });
    // Salvamos no LocalStorage para que o login não seja perdido nem ao fechar a aba
    localStorage.setItem('auth_session', authData);
    sessionStorage.setItem('auth_session', authData);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    localStorage.removeItem('auth_session');
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