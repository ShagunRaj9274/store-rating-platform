import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { tokenStore } from '../api/client';
import { authApi } from '../api/services';

const AuthContext = createContext(null);

export const homeFor = (role) => ({ ADMIN: '/admin', OWNER: '/owner', USER: '/stores' })[role] ?? '/login';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  // Restore the session on first load.
  useEffect(() => {
    if (!tokenStore.get()) return;
    authApi
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const startSession = useCallback(({ user, token }) => {
    tokenStore.set(token);
    setUser(user);
    return user;
  }, []);

  const login = useCallback(async (creds) => startSession(await authApi.login(creds)), [startSession]);
  const register = useCallback(async (body) => startSession(await authApi.register(body)), [startSession]);
  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
