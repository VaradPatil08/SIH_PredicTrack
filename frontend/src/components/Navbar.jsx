import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

