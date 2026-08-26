import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getUserProfile, 
  getUserPreferences, 
  addUserPreference, 
  removeUserPreference 
} from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('railpulse_token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('railpulse_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [favorites, setFavorites] = useState([]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  // Sync token changes to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('railpulse_token', token);
      fetchProfileAndPreferences(token);
    } else {
      localStorage.removeItem('railpulse_token');
      localStorage.removeItem('railpulse_user');
      setUser(null);
      setFavorites([]);
    }
  }, [token]);

  const fetchProfileAndPreferences = async (authToken) => {
    try {
      setLoadingFavorites(true);
      const [profileData, prefsData] = await Promise.all([
        getUserProfile(authToken),
        getUserPreferences(authToken)
      ]);

      if (profileData) {
        setUser(profileData);
        localStorage.setItem('railpulse_user', JSON.stringify(profileData));
      }

      if (Array.isArray(prefsData)) {
        setFavorites(prefsData.map(p => p.train_number));
      }
    } catch (err) {
      console.warn('Failed to load user profile or preferences:', err);
    } finally {
      setLoadingFavorites(false);
    }
  };

  const login = (newToken, userData) => {
    setToken(newToken);
    if (userData) {
      setUser(userData);
      localStorage.setItem('railpulse_user', JSON.stringify(userData));
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setFavorites([]);
    localStorage.removeItem('railpulse_token');
    localStorage.removeItem('railpulse_user');
  };

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  const toggleFavorite = async (trainNumber) => {
    if (!token) {
      openLoginModal();
      return false;
    }

    const isAlreadyFav = favorites.includes(trainNumber);
    // Optimistic UI update
    const updated = isAlreadyFav 
      ? favorites.filter(t => t !== trainNumber) 
      : [...favorites, trainNumber];
    setFavorites(updated);

    try {
      if (isAlreadyFav) {
        await removeUserPreference(token, trainNumber);
      } else {
        await addUserPreference(token, trainNumber);
      }
      return true;
    } catch (err) {
      console.error('Failed to update favorite preference on backend:', err);
      // Revert optimistic update
      setFavorites(favorites);
      return false;
    }
  };

  const isFavorite = (trainNumber) => favorites.includes(trainNumber);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        favorites,
        loadingFavorites,
        login,
        logout,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        toggleFavorite,
        isFavorite,
        refreshPreferences: () => token && fetchProfileAndPreferences(token)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}