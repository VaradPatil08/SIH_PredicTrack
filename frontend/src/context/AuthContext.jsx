import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getUserProfile,
  getUserPreferences,
  addUserPreference,
  removeUserPreference,
  resetSimulationOverrides,
} from '../services/api';

const AuthContext = createContext();

function decodeJwtExpiry(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const encoded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = encoded.padEnd(encoded.length + ((4 - encoded.length % 4) % 4), '=');
    const payload = JSON.parse(atob(padded));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

function isStoredTokenValid(token) {
  if (!token || token.startsWith('mock-')) return false;
  const exp = decodeJwtExpiry(token);
  return exp !== null && exp * 1000 > Date.now();
}

function readStoredUser() {
  try {
    const saved = localStorage.getItem('railpulse_user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    localStorage.removeItem('railpulse_user');
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [adminLoginInitialError, setAdminLoginInitialError] = useState(null);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setFavorites([]);
    resetSimulationOverrides();
    localStorage.removeItem('railpulse_token');
    localStorage.removeItem('railpulse_user');
  }, []);

  const fetchProfileAndPreferences = useCallback(async (authToken) => {
    try {
      setLoadingFavorites(true);
      const [profileData, prefsData] = await Promise.all([
        getUserProfile(authToken),
        getUserPreferences(authToken),
      ]);

      if (!profileData) {
        logout();
        return false;
      }

      setUser(profileData);
      localStorage.setItem('railpulse_user', JSON.stringify(profileData));
      setFavorites(Array.isArray(prefsData) ? prefsData.map(p => p.train_number) : []);
      return true;
    } finally {
      setLoadingFavorites(false);
    }
  }, [logout]);

  // Validate any persisted session before exposing authenticated UI. A new browser
  // profile has no token, so it becomes ready in the logged-out state immediately
  // after this check without ever rendering a logged-in navbar.
  useEffect(() => {
    let cancelled = false;

    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('railpulse_token');
      if (!storedToken || !isStoredTokenValid(storedToken)) {
        localStorage.removeItem('railpulse_token');
        localStorage.removeItem('railpulse_user');
        if (!cancelled) setAuthChecking(false);
        return;
      }

      setToken(storedToken);
      const storedUser = readStoredUser();
      if (storedUser) setUser(storedUser);

      try {
        if (!cancelled) await fetchProfileAndPreferences(storedToken);
      } finally {
        if (!cancelled) setAuthChecking(false);
      }
    };

    initializeAuth().catch(() => {
      if (!cancelled) {
        logout();
        setAuthChecking(false);
      }
    });

    return () => { cancelled = true; };
  }, [fetchProfileAndPreferences, logout]);

  // Keep token persistence in sync for newly logged-in sessions.
  useEffect(() => {
    if (token) localStorage.setItem('railpulse_token', token);
  }, [token]);

  const login = useCallback((newToken, userData) => {
    setToken(newToken);
    setAuthChecking(false);
    if (userData) {
      setUser(userData);
      localStorage.setItem('railpulse_user', JSON.stringify(userData));
    }
  }, []);

  const loginAsAdmin = useCallback((newToken, userData) => {
    const adminData = userData ? { ...userData, role: 'station_admin' } : { role: 'station_admin' };
    setToken(newToken);
    setAuthChecking(false);
    setUser(adminData);
    localStorage.setItem('railpulse_user', JSON.stringify(adminData));
  }, []);

  const openLoginModal = useCallback(() => setIsLoginModalOpen(true), []);
  const closeLoginModal = useCallback(() => setIsLoginModalOpen(false), []);
  const openAdminLoginModal = useCallback((errorMsg = null) => {
    setAdminLoginInitialError(typeof errorMsg === 'string' ? errorMsg : null);
    setIsAdminLoginModalOpen(true);
  }, []);
  const closeAdminLoginModal = useCallback(() => {
    setIsAdminLoginModalOpen(false);
    setAdminLoginInitialError(null);
  }, []);

  const role = user?.role || 'passenger';
  const isStationAdmin = role === 'station_admin';

  const toggleFavorite = useCallback(async (trainNumber) => {
    if (!token) {
      openLoginModal();
      return false;
    }

    const isAlreadyFav = favorites.includes(trainNumber);
    const previous = favorites;
    const updated = isAlreadyFav ? favorites.filter(t => t !== trainNumber) : [...favorites, trainNumber];
    setFavorites(updated);

    try {
      if (isAlreadyFav) await removeUserPreference(token, trainNumber);
      else await addUserPreference(token, trainNumber);
      return true;
    } catch {
      setFavorites(previous);
      return false;
    }
  }, [token, favorites, openLoginModal]);

  const isFavorite = useCallback((trainNumber) => favorites.includes(trainNumber), [favorites]);
  const refreshPreferences = useCallback(() => token && fetchProfileAndPreferences(token), [token, fetchProfileAndPreferences]);

  return (
    <AuthContext.Provider value={{
      token,
      user,
      role,
      isStationAdmin,
      isAuthenticated: !!token && !authChecking,
      authChecking,
      favorites,
      loadingFavorites,
      login,
      loginAsAdmin,
      logout,
      isLoginModalOpen,
      openLoginModal,
      closeLoginModal,
      isAdminLoginModalOpen,
      adminLoginInitialError,
      openAdminLoginModal,
      closeAdminLoginModal,
      toggleFavorite,
      isFavorite,
      refreshPreferences,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
