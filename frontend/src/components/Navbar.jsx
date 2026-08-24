import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Train, Radio, Cpu, Menu, X, Zap, Compass } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Train Search', path: '/', icon: Train },
    { name: 'Live Tracking', path: '/train/12951', icon: Radio },
    { name: 'ML Methodology', path: '/about', icon: Cpu },
  ];

  return (
    <header className="sticky top-0 z-50 bg-rail-dark/90 backdrop-blur-md border-b border-rail-border/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo with Railway Signal Identity */}
          <Link 
            to="/" 
            className="flex items-center gap-3 group focus-visible:ring-2 focus-visible:ring-rail-yellow rounded-lg p-1"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-rail-yellowDark to-rail-yellow text-rail-dark shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform duration-200">
              <Train className="w-5 h-5 text-rail-dark stroke-[2.5]" />
              {/* Radar pulse dot */}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-rail-dark"></span>
              </span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-rail-yellow transition-colors">
                  Rail<span className="text-rail-yellow">Pulse</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-rail-navy border border-rail-border text-rail-yellow">
                  SIH
                </span>
              </div>
              <span className="text-[11px] font-mono text-rail-muted tracking-wide flex items-center gap-1">
                Dynamic ML ETA Network
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path || 
                (link.path.startsWith('/train') && location.pathname.startsWith('/train'));

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'text-white' 
                      : 'text-rail-muted hover:text-white hover:bg-rail-card/50'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navbar-active-pill"
                      className="absolute inset-0 bg-rail-navy border border-rail-border rounded-lg -z-10 shadow-sm"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-4 h-4 ${isActive ? 'text-rail-yellow' : 'text-rail-muted'}`} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Status Badge */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rail-card border border-rail-border text-xs font-mono text-rail-muted">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300">TELEMETRY: <strong className="text-emerald-400">ONLINE</strong></span>
            </div>
            
            <Link
              to="/train/12951"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rail-yellow hover:bg-rail-yellowBright text-rail-dark font-semibold text-xs tracking-wide shadow-sm hover:shadow transition-all"
            >
              <Zap className="w-3.5 h-3.5 fill-rail-dark" />
              <span>Live Express Track</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-rail-muted hover:text-white hover:bg-rail-card border border-rail-border"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-b border-rail-border bg-rail-dark/95 backdrop-blur-xl px-4 pt-2 pb-4 space-y-1.5"
          >
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path || 
                (link.path.startsWith('/train') && location.pathname.startsWith('/train'));

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-rail-navy text-white border border-rail-border'
                      : 'text-rail-muted hover:text-white hover:bg-rail-card'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-rail-yellow' : 'text-rail-muted'}`} />
                  <span>{link.name}</span>
                </Link>
              );
            })}

            <div className="pt-2 border-t border-rail-border flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
                <span>TELEMETRY: ONLINE</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

