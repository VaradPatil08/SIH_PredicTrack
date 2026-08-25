import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  RefreshCw, 
  Map as MapIcon,
  List
} from 'lucide-react';
import { getTrainETA } from '../services/api';
import TrainMap from '../components/TrainMap';
import StationTimeline from '../components/StationTimeline';
import { TrackingHeaderSkeleton, MapSkeleton, TimelineSkeleton } from '../components/SkeletonLoader';
import { formatDuration } from '../utils/time';

const POLL_INTERVAL_SECONDS = 6;

/**
 * Signature visual moment: Control-room departure-board telemetry view 
 * with live value update highlight flashes during periodic polling, 
 * paired with the station timeline and dark GIS route map.
 */
export default function TrackingPage() {
  const { trainNumber } = useParams();
  const [etaData, setEtaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(POLL_INTERVAL_SECONDS);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'map', 'timeline' (for mobile)
  const [flashHighlight, setFlashHighlight] = useState(false);

  const timerRef = useRef(null);
  const countdownRef = useRef(null);

  // Core fetch function
  const fetchTelemetry = async (isBackground = false) => {
    if (!isBackground) {
      setRefreshing(true);
    }
    try {
      const data = await getTrainETA(trainNumber);
      setEtaData(data);
      setError(null);
      
      // Trigger live value highlight flash (background flashes to amber/15 and fades over 600ms)
      if (isBackground) {
        setFlashHighlight(true);
        setTimeout(() => setFlashHighlight(false), 600);
      }
    } catch (err) {
      console.error('Error fetching ETA telemetry:', err);
      if (!etaData) {
        setError(`Unable to retrieve live telemetry for Train ${trainNumber}.`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setCountdown(POLL_INTERVAL_SECONDS);
    }
  };

  // Initial load and polling setup
  useEffect(() => {
    setLoading(true);
    fetchTelemetry(false);

    // Polling interval
    timerRef.current = setInterval(() => {
      fetchTelemetry(true);
    }, POLL_INTERVAL_SECONDS * 1000);

    // 1-second countdown ticker
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : POLL_INTERVAL_SECONDS));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [trainNumber]);

  // Overall journey metrics
  const stations = etaData?.stations || [];
  const reachedCount = stations.filter(s => s.status === 'reached').length;
  const currentStationIndex = stations.findIndex(s => s.status !== 'reached');
  const activeStation = currentStationIndex !== -1 ? stations[currentStationIndex] : stations[stations.length - 1];
  const activeDelay = activeStation?.predicted_delay_min || 0;
  const isDelayedOverall = activeDelay > 2;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-mono text-white bg-black">
      
      {/* Top Header & Heartbeat Synchronizer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono-ui text-white/60 hover:text-[#FFB300] transition-colors focus-visible:ring-1 focus-visible:ring-[#FFB300]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>[ 01. RETURN_TO_DIRECTORY ]</span>
        </Link>

        {/* Polling Heartbeat Badge & Refresh Button */}
        <div className="flex items-center gap-3 self-end sm:self-auto text-xs">
          <div className="flex items-center gap-2 px-2.5 py-1 bg-black border border-white/15 text-white/70">
            <span className="w-2 h-2 bg-[#FFB300] inline-block" />
            <span>SYNC_TICK: <strong className="text-[#FFB300]">{countdown}S</strong></span>
          </div>

          <button
            onClick={() => fetchTelemetry(false)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-black hover:bg-white/5 border border-white/15 hover:border-white/30 text-white transition-colors disabled:opacity-40 focus-visible:ring-1 focus-visible:ring-[#FFB300]"
            title="Force refresh telemetry now"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin text-[#FFB300]' : ''}`} />
            <span>POLL</span>
          </button>
        </div>

      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-6">
          <TrackingHeaderSkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
            <div>
              <MapSkeleton />
            </div>
            <div>
              <TimelineSkeleton />
            </div>
          </div>
        </div>
      )}

      {/* Error View */}
      {!loading && error && (
        <div className="p-8 border border-[#E05252]/40 bg-black text-center space-y-4 max-w-lg mx-auto">
          <div className="text-[#E05252] font-bold text-sm tracking-wider">[ TELEMETRY_FEED_UNAVAILABLE ]</div>
          <p className="text-xs text-white/60">{error}</p>
          <button
            onClick={() => fetchTelemetry(false)}
            className="px-4 py-2 bg-[#E05252] hover:bg-[#E05252]/80 text-white font-mono text-xs font-bold transition-colors"
          >
            RETRY_LINK
          </button>
        </div>
      )}

      {/* Live Train Board & Content */}
      {!loading && !error && etaData && (
        <>
          {/* Header Control-Room Block */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.76, 0, 0.24, 1] }}
            className={`border border-white/10 p-5 sm:p-6 bg-black transition-colors duration-500 ${
              flashHighlight ? 'bg-[#FFB300]/10 border-[#FFB300]/40' : 'bg-black border-white/10'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              
              {/* Left Column: Train Info */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 flex-wrap text-xs">
                  <span className="px-2 py-0.5 bg-[#FFB300] text-black font-mono font-bold tracking-wider">
                    {etaData.train_number}
                  </span>
                  
                  {/* Bracketed Status Line */}
                  <span className={`font-mono font-bold tracking-wider ${
                    isDelayedOverall ? 'text-[#E05252]' : 'text-[#FFB300]'
                  }`}>
                    {isDelayedOverall ? `[ ${activeDelay} MIN LATE ]` : '[ ON_TIME ]'}
                  </span>

                  <span className="text-white/40 font-mono text-[11px]">
                    [ LIVE_TRACKING ]
                  </span>

                  {etaData.is_mock && (
                    <span className="text-white/30 font-mono text-[10px]">
                      [ SIMULATION_FEED ]
                    </span>
                  )}
                </div>

                {/* Train Name in Space Grotesk */}
                <h1 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight leading-tight">
                  {etaData.name}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-white/50 pt-1 font-mono">
                  {etaData.current_position?.speed_kmh !== undefined && (
                    <span>
                      SPEED: <strong className="text-white">{etaData.current_position.speed_kmh} KM/H</strong>
                    </span>
                  )}
                  {etaData.elapsed_min && (
                    <span>
                      ELAPSED: <strong className="text-white">{formatDuration(etaData.elapsed_min)}</strong>
                    </span>
                  )}
                  {etaData.current_position?.next_station_name && (
                    <span>
                      NEXT_HALT: <strong className="text-[#FFB300]">{etaData.current_position.next_station_name}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Right Column: Telemetry Data Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 shrink-0 text-xs font-mono">
                
                {/* Delay State Card */}
                <div className={`p-3 border text-center transition-colors duration-500 ${
                  flashHighlight ? 'bg-[#FFB300]/15' : 'bg-black'
                } ${
                  isDelayedOverall ? 'border-[#E05252]/40 text-[#E05252]' : 'border-white/10 text-[#FFB300]'
                }`}>
                  <div className="text-[10px] text-white/40 uppercase mb-1">Status Delta</div>
                  <div className="text-base font-bold">
                    {isDelayedOverall ? `+${activeDelay} MIN` : 'ON TIME'}
                  </div>
                  <div className="text-[9px] text-white/30 mt-0.5">
                    {isDelayedOverall ? 'CASCADE_DELAY' : 'NOMINAL'}
                  </div>
                </div>

                {/* Distance to Next Halt */}
                <div className="p-3 bg-black border border-white/10 text-center">
                  <div className="text-[10px] text-white/40 uppercase mb-1">Next Halt Dist</div>
                  <div className="text-base font-bold text-white">
                    {etaData.current_position?.distance_to_next_km || 18} <span className="text-[10px] text-white/40 font-normal">KM</span>
                  </div>
                  <div className="text-[9px] text-[#FFB300] truncate">
                    {etaData.current_position?.next_station_code || 'NDLS'}
                  </div>
                </div>

                {/* Journey Cleared Progress */}
                <div className="p-3 bg-black border border-white/10 text-center col-span-2 sm:col-span-1">
                  <div className="text-[10px] text-white/40 uppercase mb-1">Route Progress</div>
                  <div className="text-base font-bold text-white">
                    {Math.round((reachedCount / Math.max(1, stations.length)) * 100)}%
                  </div>
                  <div className="text-[9px] text-white/40">
                    {reachedCount}/{stations.length} STATIONS
                  </div>
                </div>

              </div>

            </div>
          </motion.div>

          {/* Mobile View Toggle Buttons */}
          <div className="flex lg:hidden border border-white/10 p-0.5 bg-black">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-1.5 text-xs font-mono transition-colors ${
                activeTab === 'all' ? 'bg-[#FFB300] text-black font-bold' : 'text-white/60 hover:text-white'
              }`}
            >
              ALL
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`flex-1 py-1.5 text-xs font-mono transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'map' ? 'bg-[#FFB300] text-black font-bold' : 'text-white/60 hover:text-white'
              }`}
            >
              <MapIcon className="w-3 h-3" />
              <span>MAP</span>
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex-1 py-1.5 text-xs font-mono transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'timeline' ? 'bg-[#FFB300] text-black font-bold' : 'text-white/60 hover:text-white'
              }`}
            >
              <List className="w-3 h-3" />
              <span>TIMELINE</span>
            </button>
          </div>

          {/* Telemetry Dashboard: Left Map (1fr) + Right Station Timeline (380px) on Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
            
            {/* Left: Leaflet Interactive GIS Route Map */}
            <div className={`lg:sticky lg:top-20 ${
              activeTab === 'timeline' ? 'hidden lg:block' : 'block'
            }`}>
              <TrainMap
                stations={stations}
                currentPosition={etaData.current_position}
                trainNumber={etaData.train_number}
                trainName={etaData.name}
              />
            </div>

            {/* Right: Dynamic Vertical Station Timeline */}
            <div className={`${
              activeTab === 'map' ? 'hidden lg:block' : 'block'
            }`}>
              <StationTimeline
                stations={stations}
                trainNumber={etaData.train_number}
                baseTime="06:00"
                currentPosition={etaData.current_position}
              />
            </div>

          </div>
        </>
      )}

    </div>
  );
}

