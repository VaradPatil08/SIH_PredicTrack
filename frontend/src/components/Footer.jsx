import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-black text-xs font-mono-ui text-white/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-sm tracking-wider text-white">
              RAILPULSE <span className="text-[#FFB300]">//</span> ETA
            </span>
            <span className="text-white/20">|</span>
            <span className="text-[11px] text-white/40">SIH 2026</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[11px]">
            <Link to="/" className="hover:text-[#FFB300] transition-colors">
              01. SEARCH
            </Link>
            <Link to="/train/12951" className="hover:text-[#FFB300] transition-colors">
              02. LIVE_MAP
            </Link>
            <Link to="/about" className="hover:text-[#FFB300] transition-colors">
              03. ABOUT_SYSTEM
            </Link>
          </div>

        </div>

        <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] text-white/30">
          <p>INDIAN RAILWAYS COACHING TRAIN DYNAMIC ETA PREDICTION ENGINE</p>
          <p>FASTAPI REST + GRADIENT BOOSTED PROPAGATION MODEL</p>
        </div>
      </div>
    </footer>
  );
}

