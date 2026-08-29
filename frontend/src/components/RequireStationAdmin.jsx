import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route guard component for Station Admin protected pages.
 * If user is not authenticated as a station_admin, redirects to "/"
 * and opens the Station Admin Login modal immediately.
 * Prevents AdminPage from mounting at all for unauthorized users.
 */
export default function RequireStationAdmin({ children }) {
  const { isStationAdmin, openAdminLoginModal } = useAuth();

  useEffect(() => {
    if (!isStationAdmin) {
      openAdminLoginModal();
    }
  }, [isStationAdmin, openAdminLoginModal]);

  if (!isStationAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

