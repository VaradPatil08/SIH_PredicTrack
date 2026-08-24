import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Train, 
  ArrowLeft, 
  RefreshCw, 
  Clock, 
  Compass, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Radio, 
  ShieldAlert,
  Zap,
  Activity,
  Layers,
  Map as MapIcon,
  List
} from 'lucide-react';
import { getTrainETA, getTrainRoute } from '../services/api';
import TrainMap from '../components/TrainMap';
import StationTimeline from '../components/StationTimeline';
import { TrackingHeaderSkeleton, MapSkeleton, TimelineSkeleton } from '../components/SkeletonLoader';
import { formatDuration } from '../utils/time';

const POLL_INTERVAL_SECONDS = 6;

export default function TrackingPage() {
  const { trainNumber } = useParams();
  const [etaData, setEtaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(POLL_INTERVAL_SECONDS);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'map', 'timeline' (for mobile)

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
  const maxDelay = stations.reduce((max, s) => Math.max(max, s.predicted_delay_min || 0), 0);
  const isDelayedOverall = (activeStation?.predicted_delay_min || 0) > 5;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Breadcrumb & Live Polling Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-rail-muted hover:text-rail-yellow transition-colors focus-visible:ring-1 focus-visible:ring-rail-yellow rounded p-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Trains</span>
        </Link>

        {/* Polling Heartbeat Badge & Refresh Button */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rail-card border border-rail-border text-xs font-mono text-slate-300 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>SYNCING IN: <strong className="text-rail-yellow">{countdown}s</strong></span>
          </div>

          <button
            onClick={() => fetchTelemetry(false)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rail-navy hover:bg-rail-card border border-rail-border text-xs font-mono text-white hover:text-rail-yellow transition-all disabled:opacity-50 shadow-sm"
            title="Force refresh telemetry now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-rail-yellow' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-6">
          <TrackingHeaderSkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 xl:col-span-7">
              <MapSkeleton />
            </div>
            <div className="lg:col-span-6 xl:col-span-5">
              <TimelineSkeleton />
            </div>
          </div>
        </div>
      )}

      {/* Error View */}
      {!loading && error && (
        <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-4 max-w-lg mx-auto">
          <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Telemetry Feed Unavailable</h2>
          <p className="text-xs text-rose-200">{error}</p>
          <button
            onClick={() => fetchTelemetry(false)}
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-mono text-xs font-bold transition-colors shadow-lg"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Live Train Board & Content */}
      {!loading && !error && etaData && (
        <>
          {/* Indian Railways Style Train Overview Banner */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl bg-gradient-to-br from-rail-card via-rail-navy to-rail-card border border-rail-border p-5 sm:p-6 shadow-xl relative overflow-hidden"
          >
            {/* Background train badge watermark */}
            <div className="absolute -right-8 -bottom-8 opacity-5 pointer-events-none">
              <Train className="w-64 h-64 text-white" />
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              
              {/* Left Column: Train Info & Board */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Yellow Indian Railways Station/Train Enamel Plaque */}
                  <span className="px-3.5 py-1 rounded-lg ir-board text-base sm:text-lg font-mono font-extrabold tracking-wider">
                    {etaData.train_number}
                  </span>
                  
                  <span className="px-2.5 py-1 rounded-full bg-rail-dark/80 border border-rail-border text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    ACTIVE IN SECTION
                  </span>

                  {etaData.is_mock && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[10px]">
                      SIH SIMULATION MODE
                    </span>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                  {etaData.name}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-rail-muted pt-1">
                  {etaData.current_position?.speed_kmh !== undefined && (
                    <span className="flex items-center gap-1 text-white">
                      <Compass className="w-4 h-4 text-rail-yellow" />
                      Speed: <strong className="text-rail-yellow">{etaData.current_position.speed_kmh} km/h</strong>
                    </span>
                  )}
                  {etaData.elapsed_min && (
                    <span className="flex items-center gap-1 text-slate-300">
                      <Clock className="w-4 h-4 text-rail-muted" />
                      Elapsed Time: {formatDuration(etaData.elapsed_min)}
                    </span>
                  )}
                  {etaData.current_position?.next_station_name && (
                    <span className="flex items-center gap-1 text-slate-300">
                      <MapPin className="w-4 h-4 text-emerald-400" />
                      Approaching: <strong className="text-white">{etaData.current_position.next_station_name}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Right Column: Live Prediction Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
                
                {/* Overall Delay Status */}
                <div className={`p-3.5 rounded-xl border text-center font-mono ${
                  isDelayedOverall 
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-rail-muted mb-1">
                    Current Delay
                  </div>
                  <div className="text-lg sm:text-xl font-extrabold">
                    {activeStation?.predicted_delay_min > 2 
                      ? `+${activeStation.predicted_delay_min} min` 
                      : 'On Time'}
                  </div>
                  <div className="text-[10px] text-rail-muted mt-0.5">
                    {isDelayedOverall ? 'Compounding' : 'Running Normal'}
                  </div>
                </div>

                {/* Next Halt Distance */}
                <div className="p-3.5 rounded-xl bg-rail-dark/80 border border-rail-border text-center font-mono">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-rail-muted mb-1">
                    Next Stop Dist
                  </div>
                  <div className="text-lg sm:text-xl font-extrabold text-white">
                    {etaData.current_position?.distance_to_next_km || 18} <span className="text-xs font-normal text-rail-muted">km</span>
                  </div>
                  <div className="text-[10px] text-rail-yellow truncate">
                    {etaData.current_position?.next_station_code || 'NDLS'}
                  </div>
                </div>

                {/* Total Journey Progress */}
                <div className="p-3.5 rounded-xl bg-rail-dark/80 border border-rail-border text-center font-mono col-span-2 sm:col-span-1">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-rail-muted mb-1">
                    Route Progress
                  </div>
                  <div className="text-lg sm:text-xl font-extrabold text-emerald-400">
                    {Math.round((reachedCount / Math.max(1, stations.length)) * 100)}%
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {reachedCount} / {stations.length} Halts
                  </div>
                </div>

              </div>

            </div>
          </motion.div>

          {/* Mobile View Toggle Buttons */}
          <div className="flex lg:hidden rounded-xl bg-rail-card border border-rail-border p-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-2 rounded-lg text-xs font-mono font-medium transition-colors ${
                activeTab === 'all' ? 'bg-rail-navy text-white shadow' : 'text-rail-muted'
              }`}
            >
              Both Views
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`flex-1 py-2 rounded-lg text-xs font-mono font-medium transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'map' ? 'bg-rail-navy text-white shadow' : 'text-rail-muted'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Map Only</span>
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex-1 py-2 rounded-lg text-xs font-mono font-medium transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'timeline' ? 'bg-rail-navy text-white shadow' : 'text-rail-muted'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
          </div>

          {/* Telemetry Dashboard: Left Map + Right Station Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left: Leaflet Interactive GIS Route Map */}
            <div className={`lg:col-span-6 xl:col-span-7 lg:sticky lg:top-20 ${
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
            <div className={`lg:col-span-6 xl:col-span-5 ${
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

