import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import TrackingPage from './pages/TrackingPage';
import AboutPage from './pages/AboutPage';

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
    <div className="min-h-screen flex flex-col bg-rail-dark text-rail-text font-sans selection:bg-rail-yellow selection:text-rail-dark">
      <ScrollToTop />
      
      {/* Top Brand Navigation */}
      <Navbar />

      {/* Main Routed Content with Smooth Framer Motion Page Transitions */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            
            <Route 
              path="/" 
              element={
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <LandingPage />
                </motion.div>
              } 
            />

            <Route 
              path="/train/:trainNumber" 
              element={
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <TrackingPage />
                </motion.div>
              } 
            />

            <Route 
              path="/about" 
              element={
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
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
  );
}

