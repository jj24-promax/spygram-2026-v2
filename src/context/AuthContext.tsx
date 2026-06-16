import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (role?: 'admin' | 'user') => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readAuthSession(): { loggedIn: boolean; admin: boolean } {
  const auth = localStorage.getItem('auth_session') || sessionStorage.getItem('auth_session');
  if (!auth) return { loggedIn: false, admin: false };

  try {
    const parsed = JSON.parse(auth);
    const hasMemberEmail = !!(
      localStorage.getItem('logged_in_email') || sessionStorage.getItem('logged_in_email')
    );
    // Sessão do simulador do Instagram não conta como membro pago.
    if (parsed.loggedIn && !hasMemberEmail && !parsed.admin) {
      return { loggedIn: false, admin: false };
    }
    return { loggedIn: !!parsed.loggedIn, admin: !!parsed.admin };
  } catch {
    return { loggedIn: false, admin: false };
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => readAuthSession().loggedIn);

  const [isAdmin, setIsAdmin] = useState<boolean>(() => readAuthSession().admin);

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