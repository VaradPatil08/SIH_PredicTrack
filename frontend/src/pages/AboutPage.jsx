import React from 'react';
import { motion } from 'framer-motion';

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 font-sans text-white bg-black">
      
      {/* 2px Horizontal Signal Amber Section Divider */}
      <div className="w-full h-[2px] bg-[#FFB300]" />

      {/* Header Banner */}
      <div className="space-y-4 max-w-3xl">
        <div className="flex items-center gap-2 text-xs font-sora text-[#FFB300] uppercase tracking-[0.1em]">
          <span className="w-2 h-2 bg-[#FFB300] inline-block" />
          <span>[ SPECIFICATION // SYSTEM_ARCHITECTURE ]</span>
        </div>

        <h1 className="font-sora font-bold text-3xl sm:text-4xl text-white tracking-tight leading-tight">
          DYNAMIC ML ETA ENGINE <br />
          <span className="text-[#FFB300]">// METHODOLOGY & SCOPE</span>
        </h1>

        <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-sans">
          Standard Indian Railways passenger tracking relies on static scheduled timetable extrapolation or basic linear speed averages. RailPulse applies section-level Machine Learning to model live track block clearance, precedence conflicts, and cascade recovery.
        </p>
      </div>

      {/* 2px Horizontal Signal Amber Section Divider */}
      <div className="w-full h-[2px] bg-[#FFB300]" />

      {/* Honest Disclosure: Real vs Simulated for SIH Evaluation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.76, 0, 0.24, 1] }}
        className="p-5 sm:p-6 border border-white/15 border-t-2 border-t-[#FFB300] bg-[#111111] space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs font-sora">
          <span className="font-bold text-white tracking-wider">[ TRANSPARENCY // DEMO_EVALUATION_SCOPE ]</span>
          <span className="text-white/40 uppercase">SIH_2026_DISCLOSURE</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
          
          <div className="p-4 border border-white/10 space-y-2 bg-[#111111]">
            <div className="font-sora font-bold text-[#FFB300] text-[11px] uppercase tracking-wider">
              // IMPLEMENTED_ARCHITECTURE (ACTIVE)
            </div>
            <ul className="space-y-1.5 text-white/70 text-[11px]">
              <li>› FastAPI REST service exposing live query endpoints.</li>
              <li>› Leaflet GIS spatial coordinate routing with speed metrics.</li>
              <li>› Reactive client polling loop updating telemetry state.</li>
              <li>› Station-level root-cause diagnostic mapping engine.</li>
            </ul>
          </div>

          <div className="p-4 border border-white/10 space-y-2 bg-[#111111]">
            <div className="font-sora font-bold text-white/80 text-[11px] uppercase tracking-wider">
              // SIMULATED_FACTORS (FOR_DEMO)
            </div>
            <ul className="space-y-1.5 text-white/60 text-[11px]">
              <li>› Block section occupancy feeds are simulated from historical corridor patterns.</li>
              <li>› Synthetic GPS coordinate interpolation is jittered to demonstrate live animation.</li>
              <li>› Client offline fallback data guarantees demo resilience if local backend is stopped.</li>
            </ul>
          </div>

        </div>
      </motion.div>

      {/* 2px Horizontal Signal Amber Section Divider */}
      <div className="w-full h-[2px] bg-[#FFB300]" />

      {/* High-Level ML Pipeline */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-white/10 text-xs font-sora">
          <span className="font-bold text-base text-white uppercase tracking-wider">01. MACHINE LEARNING PIPELINE</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          
          <div className="p-4 border border-white/10 border-t-2 border-t-[#FFB300] space-y-2 bg-[#111111]">
            <div className="text-[#FFB300] text-xs font-sora font-bold uppercase">[ STAGE_01 ]</div>
            <div className="font-sora font-bold text-xs text-white">Section Ingestion</div>
            <p className="text-[11px] text-white/60 leading-normal font-sans">
              Ingests live coordinate streams, sectional velocity, origin elapsed minutes, and base timetable offsets.
            </p>
          </div>

          <div className="p-4 border border-white/10 border-t-2 border-t-[#FFB300] space-y-2 bg-[#111111]">
            <div className="text-[#FFB300] text-xs font-sora font-bold uppercase">[ STAGE_02 ]</div>
            <div className="font-sora font-bold text-xs text-white">Precedence Matrix</div>
            <p className="text-[11px] text-white/60 leading-normal font-sans">
              Factors in preceding rake occupancy, freight vs superfast precedence, and temporary speed restrictions (TSR).
            </p>
          </div>

          <div className="p-4 border border-white/10 border-t-2 border-t-[#FFB300] space-y-2 bg-[#111111]">
            <div className="text-[#FFB300] text-xs font-sora font-bold uppercase">[ STAGE_03 ]</div>
            <div className="font-sora font-bold text-xs text-white">Delay Regression</div>
            <p className="text-[11px] text-white/60 leading-normal font-sans">
              Gradient Boosted Regressor estimates compound delay propagation and quad-track buffer recovery curves.
            </p>
          </div>

          <div className="p-4 border border-white/10 border-t-2 border-t-[#FFB300] space-y-2 bg-[#111111]">
            <div className="text-[#FFB300] text-xs font-sora font-bold uppercase">[ STAGE_04 ]</div>
            <div className="font-sora font-bold text-xs text-white">Attribution Mapping</div>
            <p className="text-[11px] text-white/60 leading-normal font-sans">
              Maps feature importance vectors to human-readable station delay reasons (platform wait, maintenance block).
            </p>
          </div>

        </div>
      </section>

      {/* 2px Horizontal Signal Amber Section Divider */}
      <div className="w-full h-[2px] bg-[#FFB300]" />

      {/* Feature Weighting Breakdown */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-white/10 text-xs font-sora">
          <span className="font-bold text-base text-white uppercase tracking-wider">02. MODEL FEATURE SET</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-sans">
          <div className="p-3 border border-white/10 border-l-4 border-l-[#FFB300] bg-[#111111]">
            <div className="text-[#FFB300] font-sora font-bold text-[11px] uppercase">HEADWAY_DELTA_MIN</div>
            <div className="text-white/50 text-[10px] mt-1 font-sans">Time headway gap to preceding rake in active block section.</div>
          </div>
          
          <div className="p-3 border border-white/10 border-l-4 border-l-[#FFB300] bg-[#111111]">
            <div className="text-[#FFB300] font-sora font-bold text-[11px] uppercase">QUAD_TRACK_BUFFER_RECOVERY</div>
            <div className="text-white/50 text-[10px] mt-1 font-sans">Statistical probability of recovering slack time along quad-line corridors.</div>
          </div>

          <div className="p-3 border border-white/10 border-l-4 border-l-[#FFB300] bg-[#111111]">
            <div className="text-[#FFB300] font-sora font-bold text-[11px] uppercase">PLATFORM_DWELL_INDEX</div>
            <div className="text-white/50 text-[10px] mt-1 font-sans">Expected terminus yard interlocking hold time and platform clearing delay.</div>
          </div>

          <div className="p-3 border border-white/10 border-l-4 border-l-[#FFB300] bg-[#111111]">
            <div className="text-[#FFB300] font-sora font-bold text-[11px] uppercase">VISIBILITY_RESTRICTION_FLAG</div>
            <div className="text-white/50 text-[10px] mt-1 font-sans">Fog and monsoon speed reduction cautions along Northern/Western rail zones.</div>
          </div>

          <div className="p-3 border border-white/10 border-l-4 border-l-[#FFB300] bg-[#111111]">
            <div className="text-[#FFB300] font-sora font-bold text-[11px] uppercase">OHE_VOLTAGE_STABILITY</div>
            <div className="text-white/50 text-[10px] mt-1 font-sans">Substation power block clearances and overhead catenary maintenance.</div>
          </div>

          <div className="p-3 border border-white/10 border-l-4 border-l-[#FFB300] bg-[#111111]">
            <div className="text-[#FFB300] font-sora font-bold text-[11px] uppercase">RAKE_CLASS_PRECEDENCE</div>
            <div className="text-white/50 text-[10px] mt-1 font-sans">Vande Bharat / Rajdhani priority weights against freight and passenger services.</div>
          </div>
        </div>
      </section>

      {/* 2px Horizontal Signal Amber Section Divider */}
      <div className="w-full h-[2px] bg-[#FFB300]" />

      {/* Backend API Endpoints Contract */}
      <section className="space-y-3 pb-8">
        <div className="flex items-center gap-2 pb-2 border-b border-white/10 text-xs font-sora">
          <span className="font-bold text-base text-white uppercase tracking-wider">03. REST API CONTRACT</span>
        </div>

        <div className="p-4 border border-white/10 bg-[#111111] font-sans text-xs space-y-2.5 overflow-x-auto">
          <div className="flex items-center gap-3">
            <span className="text-[#FFB300] font-sora font-bold text-[11px]">GET</span>
            <span className="text-white font-mono">/trains</span>
            <span className="text-white/40">→ Returns all available coaching trains</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[#FFB300] font-sora font-bold text-[11px]">GET</span>
            <span className="text-white font-mono">/trains/{'{train_number}'}/route</span>
            <span className="text-white/40">→ Returns full station list with coordinates</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[#FFB300] font-sora font-bold text-[11px]">GET</span>
            <span className="text-white font-mono">/trains/{'{train_number}'}/eta</span>
            <span className="text-white/40">→ Returns dynamic delay predictions and current GPS position</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[#FFB300] font-sora font-bold text-[11px]">GET</span>
            <span className="text-white font-mono">/trains/{'{train_number}'}/eta/{'{station_code}'}/reasons</span>
            <span className="text-white/40">→ Returns station root cause diagnostic reasons</span>
          </div>
        </div>
      </section>

    </div>
  );
}

