import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from './authService';

const SESSION_KEY = 'arthniti_session';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; } catch { return null; }
  });

  useEffect(() => {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else localStorage.removeItem(SESSION_KEY);
  }, [user]);

  const value = useMemo(() => ({
    user, isAuthenticated: Boolean(user),
    login: async (identifier, password) => { const nextUser = await authService.login(identifier, password); setUser(nextUser); return nextUser; },
    signup: async (details) => { const nextUser = await authService.signup(details); setUser(nextUser); return nextUser; },
    logout: async () => { await authService.logout(); setUser(null); },
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
