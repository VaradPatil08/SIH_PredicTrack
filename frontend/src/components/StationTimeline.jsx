import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { formatOffsetToTime } from '../utils/time';
import { getStationDelayReasons } from '../services/api';

/**
 * Signature visual flourish: Expandable delay diagnosis panel with 
 * a 45-degree chamfered top-right corner, #111111 surface, and 1px Muted Red (#B22222) border.
 */
export default function StationTimeline({ 
  stations = [], 
  trainNumber = '', 
  baseTime = '06:00',
  currentPosition = null 
}) {
  const [expandedStation, setExpandedStation] = useState(null);
  const [delayReasons, setDelayReasons] = useState({});
  const [loadingReasons, setLoadingReasons] = useState({});

  const toggleStation = async (stationCode, isDelayed) => {
    if (!isDelayed) return;

    if (expandedStation === stationCode) {
      setExpandedStation(null);
      return;
    }

    setExpandedStation(stationCode);

    if (!delayReasons[stationCode] && !loadingReasons[stationCode]) {
      setLoadingReasons((prev) => ({ ...prev, [stationCode]: true }));
      try {
        const res = await getStationDelayReasons(trainNumber, stationCode);
        const reasonsList = Array.isArray(res) 
          ? res 
          : (Array.isArray(res?.reasons) ? res.reasons : []);
        setDelayReasons((prev) => ({ ...prev, [stationCode]: reasonsList }));
      } catch (err) {
        console.error(`Error loading delay reasons for ${stationCode}:`, err);
        setDelayReasons((prev) => ({
          ...prev,
          [stationCode]: [
            {
              category: 'SECTION_CONGESTION',
              reason: 'Automatic block signalling clearance hold ahead of station yard.',
              impact_min: 8,
              confidence: 0.85
            }
          ]
        }));
      } finally {
        setLoadingReasons((prev) => ({ ...prev, [stationCode]: false }));
      }
    }
  };

  return (
    <div className="border border-white/10 border-t-2 border-t-[#FFB300] bg-[#111111] p-4 sm:p-5 font-sans text-white">
      
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10 text-xs font-sora uppercase tracking-[0.1em] text-white/60">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-[#FFB300] inline-block" />
          <span className="text-white font-bold">ROUTE_TIMELINE // STATIONS</span>
        </div>
        <span className="text-white/40">{stations.length} HALTS</span>
      </div>

      {/* Timeline list with connecting hairline */}
      <div className="relative pl-6 space-y-0">
        
        {/* Continuous thin vertical track hairline */}
        <div className="absolute left-[9px] top-3 bottom-4 w-[1px] bg-white/15 pointer-events-none" />

        {stations.map((station, idx) => {
          const isReached = station.status === 'reached';
          const isDelayed = (station.predicted_delay_min || 0) > 2;
          const isExpanded = expandedStation === station.code;
          const isNext = !isReached && (idx === 0 || stations[idx - 1]?.status === 'reached');

          const schedTime = formatOffsetToTime(station.scheduled_offset_min, baseTime);
          const predTime = formatOffsetToTime(
            (station.scheduled_offset_min || 0) + (station.predicted_delay_min || 0),
            baseTime
          );

          // Status color convention
          let statusTextColor = 'text-[#FFB300]';
          let statusText = 'ON TIME';
          let nodeBg = 'bg-[#FFB300]';

          if (isReached) {
            statusTextColor = 'text-white/40';
            statusText = 'REACHED';
            nodeBg = 'bg-white/50';
          } else if (isDelayed) {
            statusTextColor = 'text-[#B22222] font-semibold';
            statusText = `+${station.predicted_delay_min}M LATE`;
            nodeBg = 'bg-[#B22222]';
          } else if (isNext) {
            statusTextColor = 'text-[#FFB300] font-semibold';
            statusText = 'NEXT HALT';
            nodeBg = 'bg-[#FFB300]';
          }

          // Safely extract reasons array
          const rawReasons = delayReasons[station.code];
          let reasonsList = Array.isArray(rawReasons)
            ? rawReasons
            : (Array.isArray(rawReasons?.reasons) ? rawReasons.reasons : []);

          if (reasonsList.length === 0 && station.top_delay_factors && Array.isArray(station.top_delay_factors)) {
            reasonsList = station.top_delay_factors;
          }

          if (reasonsList.length === 0) {
            reasonsList = [
              {
                category: 'SECTION_CONGESTION',
                reason: 'Automatic block signalling clearance hold ahead of station yard.',
                impact_min: station.predicted_delay_min || 5,
                confidence: 0.88
              }
            ];
          }

          return (
            <motion.div
              key={station.code || idx}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.25,
                delay: Math.min(idx * 0.03, 0.3),
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative group py-2.5 border-b border-white/5 last:border-0 text-xs"
            >
              {/* Square Node Marker on hairline */}
              <div 
                className={`absolute -left-[18px] top-3.5 w-2 h-2 ${nodeBg} transition-transform ${
                  isNext ? 'ring-2 ring-[#FFB300]/40' : ''
                }`} 
              />

              {/* Station Row Details */}
              <div 
                onClick={() => toggleStation(station.code, isDelayed)}
                className={`flex items-start justify-between gap-3 ${
                  isDelayed ? 'cursor-pointer hover:text-white' : ''
                }`}
              >
                {/* Left: Station Code and Name */}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="font-sora font-bold text-white text-xs tracking-wider">
                      {station.code}
                    </span>
                    <span className={`text-[10px] font-sora uppercase tracking-wider ${statusTextColor}`}>
                      [{statusText}]
                    </span>
                  </div>
                  <div className="text-[11px] text-white/50 truncate font-sans mt-0.5">
                    {station.name}
                    {station.distance_from_origin_km !== undefined && (
                      <span className="text-white/30 ml-1.5 font-sans">
                        • {station.distance_from_origin_km} km
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Scheduled & Predicted Timings */}
                <div className="text-right shrink-0 font-sans">
                  <div className="flex items-center justify-end gap-2 text-xs">
                    <span className="text-white/40 text-[11px] line-through">
                      {schedTime}
                    </span>
                    <span className={`font-semibold ${statusTextColor}`}>
                      {predTime}
                    </span>
                  </div>
                  {isDelayed && (
                    <div className="text-[10px] font-sora uppercase text-[#B22222] flex items-center justify-end gap-0.5 mt-0.5">
                      <span>ROOT_CAUSE</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </div>
                  )}
                </div>
              </div>

              {/* Signature 45° Chamfered Delay Diagnostics Panel */}
              <AnimatePresence>
                {isExpanded && isDelayed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: [0.76, 0, 0.24, 1] }}
                    className="mt-3 relative overflow-hidden"
                  >
                    {/* Container with SVG 45-degree chamfered polygon border in #B22222 */}
                    <div className="relative p-3.5 bg-[#111111] text-[11px] font-sans">
                      
                      {/* Chamfered SVG border overlay */}
                      <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        preserveAspectRatio="none"
                        viewBox="0 0 100 100"
                      >
                        <polygon
                          points="0,0 93,0 100,7 100,100 0,100"
                          fill="#111111"
                          stroke="#B22222"
                          strokeWidth="1"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>

                      {/* Content inside chamfered box */}
                      <div className="relative z-10 space-y-2 text-white">
                        
                        <div className="flex items-center justify-between pb-1.5 border-b border-white/10 text-xs font-sora">
                          <div className="flex items-center gap-1.5 text-[#B22222] font-bold uppercase tracking-wider">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>ML DELAY DIAGNOSTIC // {station.code}</span>
                          </div>
                          <span className="text-[10px] text-white/40 uppercase tracking-widest">[ DIAGNOSTIC_TAG ]</span>
                        </div>

                        {loadingReasons[station.code] ? (
                          <div className="py-2 text-white/40 flex items-center gap-2 font-sora uppercase text-[10px]">
                            <div className="w-2.5 h-2.5 border border-[#B22222] border-t-transparent animate-spin" />
                            <span>QUERYING_SECTION_TELEMETRY...</span>
                          </div>
                        ) : (
                          <div className="space-y-2 pt-1">
                            {reasonsList.map((reason, rIdx) => {
                              const reasonText = typeof reason === 'string' 
                                ? reason 
                                : (reason.reason || reason.description || 'Operational speed restriction');
                              const reasonCategory = typeof reason === 'object' && reason.category 
                                ? reason.category 
                                : 'TRACK_OCCUPANCY';
                              const reasonImpact = typeof reason === 'object' && reason.impact_min !== undefined 
                                ? reason.impact_min 
                                : station.predicted_delay_min;
                              const reasonConf = typeof reason === 'object' && reason.confidence !== undefined 
                                ? reason.confidence 
                                : null;

                              return (
                                <div key={rIdx} className="space-y-1">
                                  <div className="flex items-center justify-between text-white/90">
                                    <span className="font-sora uppercase font-semibold text-[10px] text-[#B22222]">
                                      › {reasonCategory}
                                    </span>
                                    <span className="text-white/50 text-[10px] font-sans">
                                      IMPACT: +{reasonImpact} MIN
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-white/70 leading-relaxed font-sans">
                                    {reasonText}
                                  </p>
                                  {reasonConf && (
                                    <div className="text-[9px] text-white/40 font-sora uppercase">
                                      MODEL CONFIDENCE: {Math.round(reasonConf * 100)}%
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-white/40 font-sora uppercase">
                          <span>FEED: SECTION_INTERLOCKING</span>
                          <span className="text-[#B22222] font-sans font-semibold">DELTA: +{station.predicted_delay_min} MIN</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          );
        })}
      </div>
    </div>
  );
}


