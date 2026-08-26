import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User as UserIcon, LogOut, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, favorites, openLoginModal, logout } = useAuth();

  const navItems = [
    { num: '01', label: 'TRACK_TRAIN', path: '/' },
    { num: '02', label: 'LIVE_MAP', path: '/train/12951' },
    { num: '03', label: 'ABOUT', path: '/about' },
  ];

  const menuContainerVariants = {
    closed: { opacity: 0 },
    open: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05,
        ease: [0.76, 0, 0.24, 1],
      },
    },
  };

  const menuItemVariants = {
    closed: { opacity: 0, y: 16 },
    open: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.35,
        ease: [0.76, 0, 0.24, 1],
      },
    },
  };

  return (
    <header className="sticky top-0 z-50 bg-black border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          
          {/* Wordmark in Sora */}
          <Link 
            to="/" 
            className="flex items-center gap-2 group focus-visible:ring-1 focus-visible:ring-[#FFB300]"
          >
            <span className="font-sora font-bold text-lg tracking-wider text-white group-hover:text-[#FFB300] transition-colors">
              RAILPULSE <span className="text-[#FFB300]">//</span> ETA
            </span>
          </Link>

          {/* Desktop Navigation Links (Sora label-sm format) */}
          <nav className="hidden md:flex items-center space-x-6 font-sora">
            {navItems.map((item) => {
              const isActive = item.path === '/' 
                ? location.pathname === '/' 
                : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`group text-xs uppercase tracking-[0.1em] font-medium transition-colors focus-visible:ring-1 focus-visible:ring-[#FFB300] py-1 ${
                    isActive ? 'text-white' : 'text-white/60 hover:text-[#FFB300]'
                  }`}
                >
                  <span className="text-[#FFB300]/80 mr-1.5 font-sans font-semibold">{item.num}.</span>
                  <span className={`transition-colors ${isActive ? 'text-white underline decoration-[#FFB300] underline-offset-4 decoration-2' : 'group-hover:text-[#FFB300]'}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}

            {/* Auth / Profile Link */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3 pl-2 border-l border-white/15">
                <Link
                  to="/"
                  className="flex items-center gap-1.5 text-xs text-white/80 hover:text-[#FFB300] uppercase tracking-wider font-sora transition-colors"
                  title="View Saved Trains"
                >
                  <Star className="w-3.5 h-3.5 text-[#FFB300] fill-[#FFB300]" />
                  <span>SAVED [{favorites.length}]</span>
                </Link>

                <div className="flex items-center gap-1.5 text-xs text-white/50 font-sora truncate max-w-[140px]">
                  <span className="text-[11px] truncate">{user?.phone_number || 'USER'}</span>
                </div>

                <button
                  onClick={logout}
                  className="p-1 text-white/40 hover:text-[#B22222] transition-colors"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={openLoginModal}
                className="flex items-center gap-1.5 text-xs uppercase tracking-[0.1em] font-medium text-white/60 hover:text-[#FFB300] py-1 transition-colors pl-2 border-l border-white/15"
              >
                <span className="text-[#FFB300]/80 font-sans font-semibold">04.</span>
                <span>LOGIN</span>
              </button>
            )}
          </nav>

          {/* Right Status Indicator: Signal-Light Square & Telemetry Status */}
          <div className="hidden lg:flex items-center gap-4 text-xs font-sora uppercase tracking-wider">
            <div className="flex items-center gap-2 text-white/50">
              <span className="w-2 h-2 bg-[#FFB300] inline-block" />
              <span className="text-[11px]">[ LIVE_TELEMETRY ]</span>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-white/70 hover:text-white border border-white/10 hover:border-white/30 focus-visible:ring-1 focus-visible:ring-[#FFB300]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Fullscreen Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 top-14 bg-black z-40 md:hidden flex flex-col justify-between p-6 border-t border-white/10 font-sora"
          >
            <motion.nav
              variants={menuContainerVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="space-y-6 pt-4"
            >
              {navItems.map((item) => {
                const isActive = item.path === '/' 
                  ? location.pathname === '/' 
                  : location.pathname.startsWith(item.path);

                return (
                  <motion.div key={item.label} variants={menuItemVariants}>
                    <Link
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-sm uppercase tracking-widest font-medium text-white hover:text-[#FFB300] py-2 border-b border-white/10"
                    >
                      <span className="text-[#FFB300]/80 mr-2 font-sans">{item.num}.</span>
                      <span className={isActive ? 'text-[#FFB300]' : 'text-white'}>{item.label}</span>
                    </Link>
                  </motion.div>
                );
              })}

              {/* Mobile Auth Item */}
              <motion.div variants={menuItemVariants}>
                {isAuthenticated ? (
                  <div className="pt-2 space-y-3">
                    <div className="text-xs text-white/60 font-sans">
                      LOGGED IN AS: <strong className="text-white">{user?.phone_number}</strong>
                    </div>
                    <button
                      onClick={() => { logout(); setMobileMenuOpen(false); }}
                      className="w-full py-2 bg-black border border-[#B22222] text-[#B22222] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>DISCONNECT_SESSION</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setMobileMenuOpen(false); openLoginModal(); }}
                    className="w-full py-2 bg-[#111111] hover:bg-[#FFB300] hover:text-black border border-white/20 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>04. AUTHENTICATE_USER</span>
                  </button>
                )}
              </motion.div>
            </motion.nav>

            <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#FFB300] inline-block" />
                <span>STATUS: OPERATIONAL</span>
              </div>
              <span>SIH 2026</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}


