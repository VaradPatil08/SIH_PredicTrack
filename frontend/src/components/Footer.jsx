import React from 'react';
import { Link } from 'react-router-dom';
import { Train, ShieldCheck, Activity, Github, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-rail-border bg-rail-card/40 backdrop-blur-sm text-sm text-rail-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rail-yellow flex items-center justify-center text-rail-dark font-bold">
                <Train className="w-4 h-4" />
              </div>
              <span className="font-bold text-white text-lg tracking-tight">
                Rail<span className="text-rail-yellow">Pulse</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rail-navy border border-rail-border text-rail-yellow">
                SIH Edition
              </span>
            </div>
            <p className="text-xs text-rail-muted leading-relaxed max-w-md">
              Dynamic Machine Learning ETA prediction engine for Indian coaching trains. 
              Eliminating static timetable assumptions with real-time sectional track occupancy, 
              junction precedence modeling, and cascade delay mitigation.
            </p>
            <div className="flex items-center gap-3 pt-1 text-xs font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <Activity className="w-3.5 h-3.5" />
                Live Telemetry Stream
              </span>
              <span className="text-rail-border">•</span>
              <span className="flex items-center gap-1 text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-rail-yellow" />
                Smart India Hackathon Prototype
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-2">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider">Navigation</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link to="/" className="hover:text-rail-yellow transition-colors">
                  Live Train Search
                </Link>
              </li>
              <li>
                <Link to="/train/12951" className="hover:text-rail-yellow transition-colors">
                  12951 Mumbai Rajdhani
                </Link>
              </li>
              <li>
                <Link to="/train/22436" className="hover:text-rail-yellow transition-colors">
                  22436 Vande Bharat Exp
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-rail-yellow transition-colors">
                  ML Architecture & Methodology
                </Link>
              </li>
            </ul>
          </div>

          {/* Tech Stack Spec */}
          <div className="space-y-2">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider">Architecture</h4>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['FastAPI Backend', 'React 18', 'TailwindCSS', 'Framer Motion', 'Leaflet GIS', 'Gradient Boosting'].map((tech) => (
                <span
                  key={tech}
                  className="text-[11px] font-mono px-2 py-0.5 rounded bg-rail-navy/80 border border-rail-border/80 text-slate-300"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

        </div>

        <div className="pt-6 border-t border-rail-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-slate-400">
            © 2026 RailPulse Team. Built for Smart India Hackathon. Dedicated to modernizing Indian Railways commuter telemetry.
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="hover:text-white transition-colors cursor-pointer">FastAPI REST Contract</span>
            <span>•</span>
            <Link to="/about" className="hover:text-white transition-colors">
              Simulation Disclaimer
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

