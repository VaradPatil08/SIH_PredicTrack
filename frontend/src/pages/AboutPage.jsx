import React from 'react';
import { motion } from 'framer-motion';
import { 
  Cpu, 
  Database, 
  Network, 
  ShieldCheck, 
  AlertTriangle, 
  Layers, 
  Activity, 
  Zap, 
  CheckCircle2,
  Server,
  GitBranch,
  Train
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Header Banner */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rail-card border border-rail-border shadow-sm text-xs font-mono text-rail-yellow">
          <Cpu className="w-3.5 h-3.5" />
          <span>SMART INDIA HACKATHON 2026 ARCHITECTURE</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          How <span className="text-rail-yellow">RailPulse</span> Predicts Dynamic ETAs
        </h1>

        <p className="text-sm sm:text-base text-rail-muted leading-relaxed">
          Traditional train tracking systems rely on static timetables or basic speed extrapolation. 
          RailPulse applies section-level Machine Learning to predict realistic delay propagation 
          across the Indian Railways network.
        </p>
      </div>

      {/* Honest Disclosure: Real vs Simulated for SIH Demo */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="p-6 rounded-2xl bg-gradient-to-br from-rail-card via-rail-navy to-rail-card border border-rail-border shadow-xl space-y-4"
      >
        <div className="flex items-center gap-3 pb-3 border-b border-rail-border">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-rail-yellow">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Transparency & SIH Demo Scope</h2>
            <p className="text-xs text-rail-muted">Clarifying what is running live vs simulated for evaluation</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Real Architecture In Place</span>
            </div>
            <ul className="space-y-1.5 text-slate-300">
              <li>• FastAPI REST API layer running with dedicated endpoint schemas.</li>
              <li>• Leaflet GIS coordinate routing for realistic track lines.</li>
              <li>• Real-time reactive polling loop updating client-side state without page reload.</li>
              <li>• Root-cause attribution engine mapping section diagnostics to station codes.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
            <div className="flex items-center gap-2 font-bold text-rail-yellow">
              <Activity className="w-4 h-4" />
              <span>Simulated Factors for Hackathon Demo</span>
            </div>
            <ul className="space-y-1.5 text-slate-300">
              <li>• Block section occupancy feeds are simulated from historical Western/Northern railway patterns.</li>
              <li>• Synthetic live GPS drift is jittered in-memory to demonstrate smooth map animation.</li>
              <li>• Offline fallback dataset seamlessly preserves full demonstration if localhost API is offline.</li>
            </ul>
          </div>

        </div>
      </motion.div>

      {/* High-Level ML Pipeline */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-rail-yellow" />
            <span>The Dynamic ETA ML Pipeline</span>
          </h2>
          <p className="text-xs text-rail-muted">
            Four key stages from live section telemetry ingestion to user arrival ETA output.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-5 rounded-xl bg-rail-card/70 border border-rail-border space-y-3">
            <div className="w-8 h-8 rounded-lg bg-rail-navy border border-rail-border text-rail-yellow font-mono font-bold flex items-center justify-center text-xs">
              01
            </div>
            <h3 className="font-bold text-sm text-white">Section Telemetry Ingestion</h3>
            <p className="text-xs text-rail-muted leading-relaxed">
              Ingests real-time train coordinate streams, current sectional speed, time elapsed since origin, and scheduled timetable offsets.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-rail-card/70 border border-rail-border space-y-3">
            <div className="w-8 h-8 rounded-lg bg-rail-navy border border-rail-border text-rail-yellow font-mono font-bold flex items-center justify-center text-xs">
              02
            </div>
            <h3 className="font-bold text-sm text-white">Congestion & Priority Matrix</h3>
            <p className="text-xs text-rail-muted leading-relaxed">
              Factors in preceding rake occupancy, freight vs mail/express precedence rules, and automated section speed restrictions (TSR/PSR).
            </p>
          </div>

          <div className="p-5 rounded-xl bg-rail-card/70 border border-rail-border space-y-3">
            <div className="w-8 h-8 rounded-lg bg-rail-navy border border-rail-border text-rail-yellow font-mono font-bold flex items-center justify-center text-xs">
              03
            </div>
            <h3 className="font-bold text-sm text-white">Cascade Delay Regression</h3>
            <p className="text-xs text-rail-muted leading-relaxed">
              Gradient Boosted Regressor (XGBoost / LightGBM) estimates downstream delay propagation and quad-track buffer recovery curves.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-rail-card/70 border border-rail-border space-y-3">
            <div className="w-8 h-8 rounded-lg bg-rail-navy border border-rail-border text-rail-yellow font-mono font-bold flex items-center justify-center text-xs">
              04
            </div>
            <h3 className="font-bold text-sm text-white">Root Cause Attribution</h3>
            <p className="text-xs text-rail-muted leading-relaxed">
              Maps feature importance weights to human-readable delay diagnostics (e.g. platform wait, bridge speed limit, yard crossover).
            </p>
          </div>

        </div>
      </section>

      {/* Feature Weighting Breakdown */}
      <section className="p-6 rounded-2xl bg-rail-card/50 border border-rail-border space-y-4">
        <h3 className="font-bold text-base text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-rail-yellow" />
          <span>Key Features In The ML Model</span>
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg bg-rail-dark/80 border border-rail-border">
            <div className="text-rail-yellow font-bold">Section Headway Delta</div>
            <div className="text-rail-muted text-[11px] mt-1 font-sans">Time gap between current train and preceding rake in block.</div>
          </div>
          
          <div className="p-3 rounded-lg bg-rail-dark/80 border border-rail-border">
            <div className="text-rail-yellow font-bold">Historical Buffer Recovery</div>
            <div className="text-rail-muted text-[11px] mt-1 font-sans">Likelihood of making up time based on section speed margins.</div>
          </div>

          <div className="p-3 rounded-lg bg-rail-dark/80 border border-rail-border">
            <div className="text-rail-yellow font-bold">Junction Platform Turnaround</div>
            <div className="text-rail-muted text-[11px] mt-1 font-sans">Predicted platform occupancy dwell at major terminus stations.</div>
          </div>

          <div className="p-3 rounded-lg bg-rail-dark/80 border border-rail-border">
            <div className="text-rail-yellow font-bold">Seasonal Weather Visibility</div>
            <div className="text-rail-muted text-[11px] mt-1 font-sans">Fog and monsoon speed caution flags along Northern/Western rail grids.</div>
          </div>

          <div className="p-3 rounded-lg bg-rail-dark/80 border border-rail-border">
            <div className="text-rail-yellow font-bold">OHE Power Stability</div>
            <div className="text-rail-muted text-[11px] mt-1 font-sans">Substation maintenance and overhead catenary clearance signals.</div>
          </div>

          <div className="p-3 rounded-lg bg-rail-dark/80 border border-rail-border">
            <div className="text-rail-yellow font-bold">Rake Priority Classification</div>
            <div className="text-rail-muted text-[11px] mt-1 font-sans">Rajdhani / Vande Bharat precedence weights over freight / MEMU rakes.</div>
          </div>
        </div>
      </section>

      {/* Backend API Endpoints Contract */}
      <section className="space-y-4">
        <h3 className="font-bold text-base text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-400" />
          <span>FastAPI Backend Contract (`http://localhost:8000`)</span>
        </h3>

        <div className="p-4 rounded-xl bg-rail-dark border border-rail-border font-mono text-xs space-y-2.5 overflow-x-auto">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">GET</span>
            <span className="text-white">/trains</span>
            <span className="text-rail-muted">→ Returns all available coaching trains</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">GET</span>
            <span className="text-white">/trains/{'{train_number}'}/route</span>
            <span className="text-rail-muted">→ Returns full station list with lat, lng, and distance</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">GET</span>
            <span className="text-white">/trains/{'{train_number}'}/eta</span>
            <span className="text-rail-muted">→ Returns dynamic delay predictions and current GPS position</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">GET</span>
            <span className="text-white">/trains/{'{train_number}'}/eta/{'{station_code}'}/reasons</span>
            <span className="text-rail-muted">→ Returns root cause diagnostic reasons</span>
          </div>
        </div>
      </section>

    </div>
  );
}

