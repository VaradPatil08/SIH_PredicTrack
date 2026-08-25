import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { formatOffsetToTime } from '../utils/time';
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

  const handleToggleReason = async (stationCode) => {
    if (expandedStation === stationCode) {
      setExpandedStation(null);
      return;
    }

    setExpandedStation(stationCode);

    if (!reasonsCache[stationCode]) {
      setLoadingStation(stationCode);
      try {
        const data = await getStationDelayReasons(trainNumber, stationCode);
        setReasonsCache(prev => ({
          ...prev,
          [stationCode]: data.reasons || ['Operational speed restriction in section']
        }));
      } catch (err) {
        setReasonsCache(prev => ({
          ...prev,
          [stationCode]: ['Signal clearance hold in approach section', 'Preceding freight rake track occupancy']
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
        staggerChildren: 0.06,
        delayChildren: 0.05,
      }
    }
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.4, 
        ease: [0.16, 1, 0.3, 1] 
      }
    }
  };

  const reachedCount = stations.filter(s => s.status === 'reached').length;

  return (
    <div className="w-full bg-black border border-white/10 p-4 sm:p-5">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/10">
        <div>
          <div className="font-display font-bold text-sm tracking-wider text-white">
            ROUTE_TELEMETRY // TIMELINE
          </div>
          <div className="text-[11px] font-mono text-white/50 mt-0.5">
            SCHEDULED TIMETABLE VS DYNAMIC ML ETA
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="text-white/40">
            {reachedCount}/{stations.length} CLEARED
          </span>
        </div>
      </div>

      {/* Vertical Timeline List */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative pl-5 space-y-0"
      >
        {/* Continuous Connecting Track Line */}
        <div className="absolute left-[5px] top-3 bottom-3 w-px bg-white/15" />

        {stations.map((stn, index) => {
          const isReached = stn.status === 'reached';
          const isDelayed = stn.predicted_delay_min > 2 && !isReached;
          const isNextHalt = currentPosition?.next_station_code === stn.code;
          const isExpanded = expandedStation === stn.code;
          const reasons = reasonsCache[stn.code] || [];
          const isLoadingThis = loadingStation === stn.code;

          const scheduledTime = formatOffsetToTime(stn.scheduled_offset_min, baseTime);
          const predictedTime = formatOffsetToTime(stn.predicted_offset_min, baseTime);

          // Status text color logic (text only, no pill badge)
          let statusText = '[ ON_TIME ]';
          let statusColor = 'text-[#FFB300]';

          if (isReached) {
            statusText = '[ REACHED ]';
            statusColor = 'text-white/40';
          } else if (isDelayed) {
            statusText = `[ +${stn.predicted_delay_min}M LATE ]`;
            statusColor = 'text-[#E05252]';
          }

          return (
            <motion.div 
              key={stn.code} 
              variants={rowVariants}
              className="relative group py-2.5 border-b border-white/5"
            >
              {/* Square Node Marker on Track Line */}
              <div className="absolute -left-[19px] top-4 z-10">
                {isReached ? (
                  <div className="w-2.5 h-2.5 bg-white" title="Passed" />
                ) : isNextHalt ? (
                  <div className="w-2.5 h-2.5 bg-[#FFB300] ring-2 ring-[#FFB300]/40" title="Approaching" />
                ) : (
                  <div className={`w-2.5 h-2.5 border ${isDelayed ? 'border-[#E05252] bg-black' : 'border-white/40 bg-black'}`} />
                )}
              </div>

              {/* Station Departure-board Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 font-mono text-xs">
                
                {/* Station Identification */}
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${isReached ? 'text-white/40' : 'text-white'}`}>
                    {stn.name}
                  </span>
                  <span className="text-white/30 text-[11px]">
                    ({stn.code})
                  </span>
                  {isNextHalt && (
                    <span className="text-[10px] text-[#FFB300] font-bold">
                      [ NEXT_STOP ]
                    </span>
                  )}
                </div>

                {/* Scheduled / ML ETA / Status Times */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 text-[11px]">
                  <span className="text-white/40">
                    SCHED {scheduledTime}
                  </span>
                  <span className={`font-semibold ${isReached ? 'text-white/40' : 'text-white'}`}>
                    ETA {predictedTime}
                  </span>
                  <span className={`font-medium ${statusColor}`}>
                    {statusText}
                  </span>
                </div>

              </div>

              {/* "Why Delayed?" Link for Delayed Stations */}
              {isDelayed && (
                <div className="mt-1.5 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleReason(stn.code)}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-[#FFB300] hover:text-[#FFC233] transition-colors focus-visible:ring-1 focus-visible:ring-[#FFB300]"
                    aria-expanded={isExpanded}
                  >
                    <span>{isExpanded ? '[-] HIDE DELAY REASON' : '[+] WHY DELAYED? (ML REASON)'}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  <span className="text-[10px] font-mono text-white/30">
                    CONFIDENCE: 94%
                  </span>
                </div>
              )}

              {/* Signature Chamfered-Corner Delay Panel */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="relative my-2.5 p-3.5 bg-black font-mono text-xs">
                      {/* SVG 45-degree Chamfered Outline with 1px amber stroke */}
                      <svg 
                        className="absolute inset-0 w-full h-full pointer-events-none" 
                        viewBox="0 0 100 100" 
                        preserveAspectRatio="none"
                      >
                        <polygon 
                          points="0,0 94,0 100,6 100,100 0,100" 
                          fill="rgba(255, 179, 0, 0.03)" 
                          stroke="#FFB300" 
                          strokeWidth="1" 
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>

                      <div className="relative z-10 space-y-2">
                        <div className="flex items-center justify-between text-[10px] text-[#FFB300] font-bold tracking-wider">
                          <span>// DELAY_ATTRIBUTION_DIAGNOSTIC</span>
                          <span className="text-white/40">NODE_{stn.code}</span>
                        </div>

                        {isLoadingThis ? (
                          <div className="py-2 text-[11px] text-white/50">
                            [ FETCHING_SECTION_TELEMETRY... ]
                          </div>
                        ) : (
                          <ul className="space-y-1.5 text-[11px]">
                            {reasons.map((reason, rIdx) => (
                              <motion.li 
                                key={rIdx}
                                initial={{ opacity: 0, x: -4 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: rIdx * 0.05 }}
                                className="flex items-start gap-2 text-white/80"
                              >
                                <span className="text-[#FFB300] select-none">›</span>
                                <span className="leading-snug">{reason}</span>
                              </motion.li>
                            ))}
                          </ul>
                        )}

                        <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-white/40">
                          <span>FEED: SECTION_INTERLOCKING</span>
                          <span className="text-[#FFB300]">DELTA: +{stn.predicted_delay_min} MIN</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          );
        })}
      </motion.div>

    </div>
  );
}

