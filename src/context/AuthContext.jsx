import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/services';
import { onUnauthorized, tokenStore } from '../api/client';
import { ROLES } from '../utils/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // "booting" covers the initial token -> session restore round trip so the
  // router never flashes the login page for an already signed-in user.
  const [booting, setBooting] = useState(true);

  const signOut = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const login = useCallback(async (credentials) => {
    const response = await authApi.login(credentials);
    const { token, user: profile } = response.data;
    tokenStore.set(token);
    setUser(profile);
    return profile;
  }, []);

  const refresh = useCallback(async () => {
    const response = await authApi.me();
    setUser(response.data.user);
    return response.data.user;
  }, []);

  // Restore the session on first paint.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!tokenStore.get()) {
        setBooting(false);
        return;
      }
      try {
        const response = await authApi.me();
        if (!cancelled) setUser(response.data.user);
      } catch {
        tokenStore.clear();
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Any 401 from the API tears the session down.
  useEffect(() => onUnauthorized(() => signOut()), [signOut]);

  const value = useMemo(
    () => ({
      user,
      vendor: user?.vendor || null,
      role: user?.role || null,
      isAuthenticated: Boolean(user),
      isSuperAdmin: user?.role === ROLES.SUPER_ADMIN,
      isVendorAdmin: user?.role === ROLES.VENDOR_ADMIN,
      isVendorStaff: user?.role === ROLES.VENDOR_STAFF,
      booting,
      login,
      signOut,
      refresh,
      setUser,
    }),
    [user, booting, login, signOut, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider');
  return ctx;
}
