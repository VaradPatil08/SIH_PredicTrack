import React from 'react';
import { motion } from 'framer-motion';

/**
 * Signature visual moment: Engineering architecture specification & honesty disclosure 
 * in the interface's own voice with Space Grotesk section titles and monospace technical grids.
 */
export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 font-mono text-white bg-black">
      
      {/* Header Banner */}
      <div className="space-y-4 max-w-3xl">
        <div className="flex items-center gap-2 text-xs font-mono text-[#FFB300]">
          <span className="w-2 h-2 bg-[#FFB300] inline-block" />
          <span>[ SPECIFICATION // SYSTEM_ARCHITECTURE ]</span>
        </div>

        <h1 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight leading-tight">
          DYNAMIC ML ETA ENGINE <br />
          <span className="text-[#FFB300]">// METHODOLOGY & SCOPE</span>
        </h1>

        <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
          Standard Indian Railways passenger tracking relies on static scheduled timetable extrapolation or basic linear speed averages. RailPulse applies section-level Machine Learning to model live track block clearance, precedence conflicts, and cascade recovery.
        </p>
      </div>

      {/* Honest Disclosure: Real vs Simulated for SIH Evaluation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.76, 0, 0.24, 1] }}
        className="p-5 sm:p-6 border border-white/15 bg-black space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
          <span className="font-bold text-white tracking-wider">[ TRANSPARENCY // DEMO_EVALUATION_SCOPE ]</span>
          <span className="text-white/40">SIH_2026_DISCLOSURE</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          
          <div className="p-4 border border-white/10 space-y-2 bg-black">
            <div className="font-bold text-[#FFB300] text-[11px]">
              // IMPLEMENTED_ARCHITECTURE (ACTIVE)
            </div>
            <ul className="space-y-1.5 text-white/70 text-[11px]">
              <li>› FastAPI REST service exposing live query endpoints.</li>
              <li>› Leaflet GIS spatial coordinate routing with speed metrics.</li>
              <li>› Reactive client polling loop updating telemetry state.</li>
              <li>› Station-level root-cause diagnostic mapping engine.</li>
            </ul>
          </div>

          <div className="p-4 border border-white/10 space-y-2 bg-black">
            <div className="font-bold text-white/80 text-[11px]">
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

      {/* High-Level ML Pipeline */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-white/10 text-xs">
          <span className="font-display font-bold text-base text-white">01. MACHINE LEARNING PIPELINE</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          
          <div className="p-4 border border-white/10 space-y-2 bg-black">
            <div className="text-[#FFB300] text-xs font-bold">[ STAGE_01 ]</div>
            <div className="font-bold text-xs text-white">Section Ingestion</div>
            <p className="text-[11px] text-white/60 leading-normal">
              Ingests live coordinate streams, sectional velocity, origin elapsed minutes, and base timetable offsets.
            </p>
          </div>

          <div className="p-4 border border-white/10 space-y-2 bg-black">
            <div className="text-[#FFB300] text-xs font-bold">[ STAGE_02 ]</div>
            <div className="font-bold text-xs text-white">Precedence Matrix</div>
            <p className="text-[11px] text-white/60 leading-normal">
              Factors in preceding rake occupancy, freight vs superfast precedence, and temporary speed restrictions (TSR).
            </p>
          </div>

          <div className="p-4 border border-white/10 space-y-2 bg-black">
            <div className="text-[#FFB300] text-xs font-bold">[ STAGE_03 ]</div>
            <div className="font-bold text-xs text-white">Delay Regression</div>
            <p className="text-[11px] text-white/60 leading-normal">
              Gradient Boosted Regressor estimates compound delay propagation and quad-track buffer recovery curves.
            </p>
          </div>

          <div className="p-4 border border-white/10 space-y-2 bg-black">
            <div className="text-[#FFB300] text-xs font-bold">[ STAGE_04 ]</div>
            <div className="font-bold text-xs text-white">Attribution Mapping</div>
            <p className="text-[11px] text-white/60 leading-normal">
              Maps feature importance vectors to human-readable station delay reasons (platform wait, maintenance block).
            </p>
          </div>

        </div>
      </section>

      {/* Feature Weighting Breakdown */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-white/10 text-xs">
          <span className="font-display font-bold text-base text-white">02. MODEL FEATURE SET</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 border border-white/10 bg-black">
            <div className="text-[#FFB300] font-bold text-[11px]">HEADWAY_DELTA_MIN</div>
            <div className="text-white/50 text-[10px] mt-1">Time headway gap to preceding rake in active block section.</div>
          </div>
          
          <div className="p-3 border border-white/10 bg-black">
            <div className="text-[#FFB300] font-bold text-[11px]">QUAD_TRACK_BUFFER_RECOVERY</div>
            <div className="text-white/50 text-[10px] mt-1">Statistical probability of recovering slack time along quad-line corridors.</div>
          </div>

          <div className="p-3 border border-white/10 bg-black">
            <div className="text-[#FFB300] font-bold text-[11px]">PLATFORM_DWELL_INDEX</div>
            <div className="text-white/50 text-[10px] mt-1">Expected terminus yard interlocking hold time and platform clearing delay.</div>
          </div>

          <div className="p-3 border border-white/10 bg-black">
            <div className="text-[#FFB300] font-bold text-[11px]">VISIBILITY_RESTRICTION_FLAG</div>
            <div className="text-white/50 text-[10px] mt-1">Fog and monsoon speed reduction cautions along Northern/Western rail zones.</div>
          </div>

          <div className="p-3 border border-white/10 bg-black">
            <div className="text-[#FFB300] font-bold text-[11px]">OHE_VOLTAGE_STABILITY</div>
            <div className="text-white/50 text-[10px] mt-1">Substation power block clearances and overhead catenary maintenance.</div>
          </div>

          <div className="p-3 border border-white/10 bg-black">
            <div className="text-[#FFB300] font-bold text-[11px]">RAKE_CLASS_PRECEDENCE</div>
            <div className="text-white/50 text-[10px] mt-1">Vande Bharat / Rajdhani priority weights against freight and passenger services.</div>
          </div>
        </div>
      </section>

      {/* Backend API Endpoints Contract */}
      <section className="space-y-3 pb-8">
        <div className="flex items-center gap-2 pb-2 border-b border-white/10 text-xs">
          <span className="font-display font-bold text-base text-white">03. REST API CONTRACT</span>
        </div>

        <div className="p-4 border border-white/10 bg-black font-mono text-xs space-y-2 overflow-x-auto">
          <div className="flex items-center gap-3">
            <span className="text-[#FFB300] font-bold">GET</span>
            <span className="text-white">/trains</span>
            <span className="text-white/40">→ Returns all available coaching trains</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[#FFB300] font-bold">GET</span>
            <span className="text-white">/trains/{'{train_number}'}/route</span>
            <span className="text-white/40">→ Returns full station list with coordinates</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[#FFB300] font-bold">GET</span>
            <span className="text-white">/trains/{'{train_number}'}/eta</span>
            <span className="text-white/40">→ Returns dynamic delay predictions and current GPS position</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[#FFB300] font-bold">GET</span>
            <span className="text-white">/trains/{'{train_number}'}/eta/{'{station_code}'}/reasons</span>
            <span className="text-white/40">→ Returns station root cause diagnostic reasons</span>
          </div>
        </div>
      </section>

    </div>
  );
}

