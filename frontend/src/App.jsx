import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import LandingPage from './pages/LandingPage';
import TrackingPage from './pages/TrackingPage';
import AboutPage from './pages/AboutPage';
import { AuthProvider } from './context/AuthContext';

// Scroll to top helper on route navigation
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const location = useLocation();

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-black text-white font-sans selection:bg-[#FFB300] selection:text-black">
        <ScrollToTop />
        
        {/* Global Auth Modal */}
        <AuthModal />

        {/* Top Brand Navigation */}
        <Navbar />

        {/* Main Routed Content with Smooth Framer Motion Page Transitions */}
        <main className="flex-1 bg-black">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              
              <Route 
                path="/" 
                element={
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, ease: [0.76, 0, 0.24, 1] }}
                  >
                    <LandingPage />
                  </motion.div>
                } 
              />

              <Route 
                path="/train/:trainNumber" 
                element={
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, ease: [0.76, 0, 0.24, 1] }}
                  >
                    <TrackingPage />
                  </motion.div>
                } 
              />

              <Route 
                path="/about" 
                element={
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, ease: [0.76, 0, 0.24, 1] }}
                  >
                    <AboutPage />
                  </motion.div>
                } 
              />

              {/* Fallback to Home */}
              <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
          </AnimatePresence>
        </main>

        {/* Global Footer */}
        <Footer />
      </div>
    </AuthProvider>
  );
}


