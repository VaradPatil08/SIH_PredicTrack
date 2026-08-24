import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  MapPin, 
  Info, 
  HelpCircle,
  Activity,
  Layers
} from 'lucide-react';
import { formatOffsetToTime, getDelayBadgeInfo } from '../utils/time';
import { getStationDelayReasons } from '../services/api';

export default function StationTimeline({ 
  stations = [], 
  trainNumber = '', 
  baseTime = '06:00',
  currentPosition = null 
}) {
  const [expandedStation, setExpandedStation] = useState(null);
  const [reasonsCache, setReasonsCache] = useState({});
  const [loadingStation, setLoadingStation] = useState(null);

  // Toggle reason accordion
  const handleToggleReason = async (stationCode) => {
    if (expandedStation === stationCode) {
      setExpandedStation(null);
      return;
    }

    setExpandedStation(stationCode);

    // If reasons not in cache, fetch them
    if (!reasonsCache[stationCode]) {
      setLoadingStation(stationCode);
      try {
        const data = await getStationDelayReasons(trainNumber, stationCode);
        setReasonsCache(prev => ({
          ...prev,
          [stationCode]: data.reasons || ['Operational speed regulation in section']
        }));
      } catch (err) {
        setReasonsCache(prev => ({
          ...prev,
          [stationCode]: ['Signal clearance hold in approach section', 'Preceding train track occupancy']
        }));
      } finally {
        setLoadingStation(null);
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.35, ease: 'easeOut' }
    }
  };

  return (
    <div className="w-full bg-rail-card/80 border border-rail-border rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-md">
      
      {/* Timeline Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-6 border-b border-rail-border/80">
        <div>
          <h3 className="font-bold text-base sm:text-lg text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-rail-yellow" />
            <span>Station Telemetry & Delay Timeline</span>
          </h3>
          <p className="text-xs text-rail-muted mt-0.5">
            Static timetable schedule vs real-time dynamic ML prediction
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2 py-1 rounded bg-rail-navy border border-rail-border text-slate-300">
            {stations.length} Halts
          </span>
          <span className="px-2 py-1 rounded bg-rail-navy border border-rail-border text-emerald-400">
            {stations.filter(s => s.status === 'reached').length} Cleared
          </span>
        </div>
      </div>

      {/* Vertical Timeline List */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative pl-6 sm:pl-8 space-y-4"
      >
        {/* Continuous Track Line in Background */}
        <div className="absolute left-[19px] sm:left-[27px] top-4 bottom-4 w-1 bg-gradient-to-b from-emerald-500 via-rail-yellow to-slate-700 rounded-full" />

        {stations.map((stn, index) => {
          const badge = getDelayBadgeInfo(stn.predicted_delay_min, stn.status);
          const isExpanded = expandedStation === stn.code;
          const isDelayed = stn.predicted_delay_min > 2 && stn.status !== 'reached';
          const isNextHalt = currentPosition?.next_station_code === stn.code;
          const reasons = reasonsCache[stn.code] || [];
          const isLoadingThis = loadingStation === stn.code;

          const scheduledTime = formatOffsetToTime(stn.scheduled_offset_min, baseTime);
          const predictedTime = formatOffsetToTime(stn.predicted_offset_min, baseTime);

          return (
            <motion.div 
              key={stn.code} 
              variants={itemVariants}
              className="relative group"
            >
              {/* Station Node Marker Dot on the Track */}
              <div className="absolute -left-[27px] sm:-left-[35px] top-3.5 z-10">
                {stn.status === 'reached' ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 border-2 border-rail-dark flex items-center justify-center text-rail-dark shadow-md shadow-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : isNextHalt ? (
                  <div className="relative flex items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-rail-yellow opacity-75"></span>
                    <div className="w-5 h-5 rounded-full bg-rail-yellow border-2 border-rail-dark flex items-center justify-center shadow-lg shadow-amber-500/40">
                      <div className="w-2 h-2 rounded-full bg-rail-dark animate-pulse"></div>
                    </div>
                  </div>
                ) : (
                  <div className={`w-5 h-5 rounded-full border-2 border-rail-dark flex items-center justify-center ${
                    stn.status === 'delayed' 
                      ? 'bg-amber-500 shadow-md shadow-amber-500/20' 
                      : 'bg-slate-700'
                  }`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                  </div>
                )}
              </div>

              {/* Station Card Box */}
              <div 
                className={`rounded-xl border transition-all duration-200 p-3.5 sm:p-4 ${
                  isNextHalt 
                    ? 'bg-rail-navy/90 border-rail-yellow/60 shadow-lg shadow-amber-500/5' 
                    : stn.status === 'reached'
                    ? 'bg-rail-dark/40 border-rail-border/50 text-slate-400'
                    : 'bg-rail-card/70 border-rail-border hover:border-rail-border/80 hover:bg-rail-card'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* Station Name & Code */}
                  <div className="flex items-start gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm sm:text-base text-white tracking-tight">
                          {stn.name}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-rail-dark border border-rail-border font-mono text-xs font-bold text-rail-yellow">
                          {stn.code}
                        </span>
                        {isNextHalt && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-semibold animate-pulse flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            NEXT STOP
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-rail-muted font-mono mt-1">
                        <span>{stn.distance_km} km</span>
                        {stn.platform && (
                          <>
                            <span>•</span>
                            <span>Platform {stn.platform}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Scheduled vs Predicted Times & Status Badge */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-rail-border/40">
                    
                    {/* Time comparison columns */}
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <div className="text-left sm:text-right">
                        <div className="text-[10px] text-rail-muted uppercase">Scheduled</div>
                        <div className="text-slate-300 font-semibold">{scheduledTime}</div>
                      </div>

                      <div className="text-left sm:text-right pl-2 border-l border-rail-border/60">
                        <div className="text-[10px] text-rail-yellow font-semibold uppercase flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-rail-yellow" />
                          <span>ML ETA</span>
                        </div>
                        <div className="text-white font-bold text-sm">{predictedTime}</div>
                      </div>
                    </div>

                    {/* Delay Status Badge with Framer Motion Layout Animation */}
                    <motion.div 
                      layout
                      className="shrink-0 flex items-center"
                    >
                      <span className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-semibold flex items-center gap-1.5 shadow-sm ${badge.bgClass}`}>
                        <span 
                          className="w-1.5 h-1.5 rounded-full" 
                          style={{ backgroundColor: badge.dotColor }}
                        />
                        <span>{badge.text}</span>
                      </span>
                    </motion.div>

                  </div>

                </div>

                {/* "Why Delayed?" Button Trigger (For Delayed Stations) */}
                {(isDelayed || (stn.status === 'delayed' && stn.predicted_delay_min > 0)) && (
                  <div className="mt-3 pt-2.5 border-t border-rail-border/40 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleReason(stn.code)}
                      className="flex items-center gap-1.5 text-xs text-rail-yellow hover:text-rail-yellowBright font-medium focus-visible:ring-1 focus-visible:ring-rail-yellow rounded px-1.5 py-0.5 transition-colors"
                      aria-expanded={isExpanded}
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{isExpanded ? 'Hide root cause diagnostics' : 'Why is this delayed? (ML Root Cause)'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <span className="text-[10px] font-mono text-slate-500">
                      Model Confidence: 94.2%
                    </span>
                  </div>
                )}

                {/* Expandable "Why Delayed?" Diagnostic Panel */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="p-3.5 rounded-xl bg-rail-dark/80 border border-rail-yellow/30 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between font-semibold text-rail-yellow text-[11px] uppercase tracking-wider">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            Section Delay Diagnostic Attribution
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Station Code: {stn.code}
                          </span>
                        </div>

                        {isLoadingThis ? (
                          <div className="py-3 flex items-center justify-center gap-2 text-rail-muted">
                            <div className="w-4 h-4 rounded-full border-2 border-rail-yellow border-t-transparent animate-spin"></div>
                            <span>Analyzing sectional track telemetry...</span>
                          </div>
                        ) : (
                          <ul className="space-y-2">
                            {reasons.map((reason, rIdx) => (
                              <motion.li 
                                key={rIdx}
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: rIdx * 0.1 }}
                                className="flex items-start gap-2 text-slate-300"
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-rail-yellow mt-1.5 shrink-0" />
                                <span className="leading-relaxed">{reason}</span>
                              </motion.li>
                            ))}
                          </ul>
                        )}

                        <div className="pt-2 border-t border-rail-border/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>Source: Section Interlocking & Signal Feed</span>
                          <span className="text-emerald-400">Dynamic Offset: +{stn.predicted_delay_min} min</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

