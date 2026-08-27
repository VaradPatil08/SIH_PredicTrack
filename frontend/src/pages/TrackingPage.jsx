import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  RefreshCw, 
  Map as MapIcon, 
  List, 
  Clock, 
  Train, 
  Gauge, 
  AlertTriangle,
  Radio
} from 'lucide-react';
import { getTrainETA, getDisruptionReportSummary } from '../services/api';
import TrainMap from '../components/TrainMap';
import StationTimeline from '../components/StationTimeline';
import DelaySparkline from '../components/DelaySparkline';
import ReportModal from '../components/ReportModal';
import { TrackingHeaderSkeleton, MapSkeleton, TimelineSkeleton } from '../components/SkeletonLoader';
import AnimatedNumber from '../components/AnimatedNumber';
import { formatDuration } from '../utils/time';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';

const POLL_INTERVAL_SECONDS = 6;

export default function TrackingPage() {
  const { trainNumber } = useParams();
  const { t } = useSettings();
  const { isAuthenticated, openLoginModal } = useAuth();
  const [etaData, setEtaData] = useState(null);
  const [reportSummary, setReportSummary] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(POLL_INTERVAL_SECONDS);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'map' | 'timeline'
  const [flashHighlight, setFlashHighlight] = useState(false);


  const timerRef = useRef(null);
  const countdownRef = useRef(null);

  const fetchTelemetry = async (isBackground = false) => {
    if (!isBackground) {
      setRefreshing(true);
    }
    try {
      const [data, summary] = await Promise.all([
        getTrainETA(trainNumber),
        getDisruptionReportSummary(trainNumber).catch(() => null)
      ]);
      setEtaData(data);
      if (summary) setReportSummary(summary);
      setError(null);
      
      if (isBackground) {
        setFlashHighlight(true);
        setTimeout(() => setFlashHighlight(false), 800);
      }
    } catch (err) {
      console.error('Error fetching ETA telemetry:', err);
      if (!etaData) {
        setError(t('telemetryOffline', { trainNumber }));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setCountdown(POLL_INTERVAL_SECONDS);
    }
  };

  const handleOpenReportModal = () => {
    if (!isAuthenticated) {
      openLoginModal();
    } else {
      setIsReportModalOpen(true);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchTelemetry(false);

    timerRef.current = setInterval(() => {
      fetchTelemetry(true);
    }, POLL_INTERVAL_SECONDS * 1000);

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : POLL_INTERVAL_SECONDS));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [trainNumber]);

  const stations = etaData?.stations || [];
  const reachedCount = stations.filter(s => s.status === 'reached').length;
  const currentStationIndex = stations.findIndex(s => s.status !== 'reached');
  const activeStation = currentStationIndex !== -1 ? stations[currentStationIndex] : stations[stations.length - 1];
  const activeDelay = activeStation?.predicted_delay_min || 0;
  const isDelayedOverall = activeDelay > 2;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans text-foreground dark:text-slate-100 transition-colors">
      
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border dark:border-slate-800">
        
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 min-h-[40px] text-xs sm:text-sm font-semibold text-muted dark:text-slate-400 hover:text-navy dark:hover:text-blue-400 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-navy rounded p-1 group active:scale-95 self-start"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>{t('backToDirectory')}</span>
        </Link>

        {/* Polling Heartbeat Badge, Report Button & Refresh Button */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 text-xs w-full sm:w-auto flex-wrap">
          
          {/* Report Disruption Button */}
          <button
            onClick={handleOpenReportModal}
            className="flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg bg-red-500/10 hover:bg-red-500/20 text-transit-red dark:text-red-400 border border-transit-red/30 font-semibold text-xs transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-95"
            title="Report track delay or disruption"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse text-transit-red" />
            <span>REPORT DISRUPTION</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-2 min-h-[40px] rounded-full bg-white dark:bg-slate-800 border border-border dark:border-slate-700 text-muted dark:text-slate-300 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-transit-green inline-block animate-pulse" />
            <span className="text-[11px] font-medium">
              {t('autoSync')} <strong>{countdown}s</strong>
            </span>
          </div>

          <button
            onClick={() => fetchTelemetry(false)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-navy dark:text-blue-400 border border-border dark:border-slate-700 font-semibold text-xs transition-all duration-200 disabled:opacity-50 shadow-2xs hover:shadow-xs active:scale-95"
            title={t('syncTelemetry')}
            aria-label={t('syncTelemetry')}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? t('syncing') : t('syncTelemetry')}</span>
          </button>
        </div>

      </div>


      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-6">
          <TrackingHeaderSkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_390px] gap-6">
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
        <div className="p-6 sm:p-8 rounded-lg border border-transit-red-border dark:border-red-900 bg-white dark:bg-slate-900 text-center space-y-4 max-w-lg mx-auto shadow-card">
          <div className="text-transit-red dark:text-red-400 font-bold text-sm flex items-center justify-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchTelemetry(false)}
            className="px-4 py-2.5 min-h-[44px] rounded-lg bg-navy dark:bg-blue-600 text-white text-xs font-semibold transition-colors active:scale-95"
          >
            {t('retryConnection')}
          </button>
        </div>
      )}

      {/* Live Train Cockpit */}
      {!loading && !error && etaData && (
        <>
          {/* Top Key Metrics Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={`rounded-lg border p-4 sm:p-6 transition-all duration-300 shadow-card ${
              flashHighlight 
                ? 'bg-blue-50/70 dark:bg-blue-950/40 border-navy dark:border-blue-400 shadow-md' 
                : 'bg-white dark:bg-slate-900 border-border dark:border-slate-800'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
              
              {/* Left Column: Train Info & Identity */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="px-2.5 py-1 rounded bg-navy dark:bg-blue-600 text-white font-mono font-bold text-sm shadow-2xs">
                    #{etaData.train_number}
                  </span>
                  
                  {/* Status Pill */}
                  <span className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                    isDelayedOverall 
                      ? 'bg-transit-orange-light dark:bg-amber-950/60 text-transit-orange dark:text-amber-400 border border-transit-orange-border dark:border-amber-800' 
                      : 'bg-transit-green-light dark:bg-emerald-950/60 text-transit-green dark:text-emerald-400 border border-transit-green-border dark:border-emerald-800'
                  }`}>
                    {isDelayedOverall ? t('delayedBy', { delay: activeDelay }) : t('runningOnTime')}
                  </span>

                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-muted dark:text-slate-300 text-[11px] font-medium border border-border dark:border-slate-700">
                    {t('liveGpsTelemetry')}
                  </span>
                </div>

                {/* Train Name */}
                <h1 className="font-bold text-xl sm:text-2xl lg:text-3xl text-navy dark:text-blue-400 tracking-tight leading-tight">
                  {etaData.name}
                </h1>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-muted dark:text-slate-400 pt-1">
                  {etaData.current_position?.speed_kmh !== undefined && (
                    <span className="flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-navy dark:text-blue-400 shrink-0" />
                      <span>{t('currentSpeed')}: <strong className="text-foreground dark:text-slate-200 font-semibold"><AnimatedNumber value={etaData.current_position.speed_kmh} /> {t('km')}/h</strong></span>
                    </span>
                  )}
                  {etaData.elapsed_min && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-navy dark:text-blue-400 shrink-0" />
                      <span>{t('elapsedJourney')}: <strong className="text-foreground dark:text-slate-200 font-semibold">{formatDuration(etaData.elapsed_min)}</strong></span>
                    </span>
                  )}
                  {etaData.current_position?.next_station_name && (
                    <span className="flex items-center gap-1.5">
                      <Train className="w-3.5 h-3.5 text-navy dark:text-blue-400 shrink-0" />
                      <span>{t('nextStation')}: <strong className="text-navy dark:text-blue-300 font-semibold">{etaData.current_position.next_station_name}</strong></span>
                    </span>
                  )}
                </div>
              </div>

              {/* Right Column: Telemetry Summary Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 shrink-0 text-xs w-full lg:w-auto">
                
                {/* Delay Delta */}
                <div className={`p-3 rounded-lg border transition-all ${
                  isDelayedOverall 
                    ? 'bg-transit-orange-light/50 dark:bg-amber-950/40 border-transit-orange-border dark:border-amber-800' 
                    : 'bg-slate-50 dark:bg-slate-800/60 border-border dark:border-slate-700'
                }`}>
                  <div className="text-[11px] text-muted dark:text-slate-400 font-medium mb-0.5">{t('peakDelay')}</div>
                  <div className={`text-xl font-bold ${isDelayedOverall ? 'text-transit-orange dark:text-amber-400' : 'text-transit-green dark:text-emerald-400'}`}>
                    <AnimatedNumber 
                      value={activeDelay} 
                      prefix={isDelayedOverall ? '+' : ''} 
                      suffix="m" 
                    />
                  </div>
                  <div className="text-[10px] text-muted dark:text-slate-400 mt-0.5">
                    {isDelayedOverall ? 'Cascade Propagation' : 'Nominal Transit'}
                  </div>
                </div>

                {/* Distance to Next Halt */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-border dark:border-slate-700">
                  <div className="text-[11px] text-muted dark:text-slate-400 font-medium mb-0.5">{t('nextHaltDistance')}</div>
                  <div className="text-xl font-bold text-navy dark:text-blue-400">
                    <AnimatedNumber value={etaData.current_position?.distance_to_next_km || 18} /> <span className="text-xs text-muted dark:text-slate-400 font-normal">{t('km')}</span>
                  </div>
                  <div className="text-[10px] text-muted dark:text-slate-400 truncate">
                    {etaData.current_position?.next_station_code || 'NDLS'}
                  </div>
                </div>

                {/* Route Progress */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-border dark:border-slate-700">
                  <div className="text-[11px] text-muted dark:text-slate-400 font-medium mb-0.5">{t('routeProgress')}</div>
                  <div className="text-xl font-bold text-navy dark:text-blue-400">
                    <AnimatedNumber value={Math.round((reachedCount / Math.max(1, stations.length)) * 100)} suffix="%" />
                  </div>
                  <div className="text-[10px] text-muted dark:text-slate-400">
                    {reachedCount} / {stations.length} {t('halt')}
                  </div>
                </div>

              </div>

            </div>
          </motion.div>

          {/* Mobile View Switcher with 44px Touch Targets */}
          <div className="flex lg:hidden rounded-lg border border-border dark:border-slate-800 p-1 bg-white dark:bg-slate-900 shadow-sm">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-2.5 min-h-[44px] rounded-md text-xs font-semibold transition-colors flex items-center justify-center ${
                activeTab === 'all' ? 'bg-navy dark:bg-blue-600 text-white shadow-xs' : 'text-muted dark:text-slate-400 hover:text-navy dark:hover:text-white'
              }`}
            >
              {t('allViews')}
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`flex-1 py-2.5 min-h-[44px] rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'map' ? 'bg-navy dark:bg-blue-600 text-white shadow-xs' : 'text-muted dark:text-slate-400 hover:text-navy dark:hover:text-white'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>{t('routeMap')}</span>
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex-1 py-2.5 min-h-[44px] rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'timeline' ? 'bg-navy dark:bg-blue-600 text-white shadow-xs' : 'text-muted dark:text-slate-400 hover:text-navy dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>{t('stationTimeline')}</span>
            </button>
          </div>


          {/* Crowdsourced Disruption Alert Banner */}
          {reportSummary && reportSummary.report_count > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3.5 sm:p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans ${
                reportSummary.flagged
                  ? 'bg-red-500/10 border-transit-red text-transit-red dark:text-red-300'
                  : 'bg-amber-500/10 border-amber-500/40 text-amber-800 dark:text-amber-300'
              }`}
            >
              <div className="flex items-start sm:items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0 text-transit-red" />
                <div>
                  <span className="font-sora font-bold tracking-wide">
                    {reportSummary.flagged ? '[ SECTION_ALERT // FLAGGED DISRUPTION ] ' : '[ CROWDSOURCED_REPORTS ] '}
                  </span>
                  <span>
                    {reportSummary.report_count} verified passenger {reportSummary.report_count === 1 ? 'report' : 'reports'} received in the last {reportSummary.window_hours}h.
                  </span>
                </div>
              </div>
              <button
                onClick={handleOpenReportModal}
                className="px-3 py-1.5 rounded bg-black/20 hover:bg-black/40 font-sora font-bold text-[11px] uppercase tracking-wider self-start sm:self-auto transition-colors border border-current"
              >
                + ADD REPORT
              </button>
            </motion.div>
          )}

          {/* Telemetry Main Grid: Left Map + Right Station Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_390px] gap-6 items-start">
            
            {/* Left: Leaflet Interactive GIS Route Map + Delay Sparkline */}
            <div className={`space-y-4 lg:sticky lg:top-20 ${
              activeTab === 'timeline' ? 'hidden lg:block' : 'block'
            }`}>
              <TrainMap
                stations={stations}
                currentPosition={etaData.current_position}
                trainNumber={etaData.train_number}
                trainName={etaData.name}
              />

              {/* Delay Progression Sparkline Graph */}
              <DelaySparkline stations={stations} />
            </div>

            {/* Right: Dynamic Vertical Station Timeline */}
            <div className={`${
              activeTab === 'map' ? 'hidden lg:block' : 'block'
            }`}>
              <StationTimeline
                stations={stations}
                trainNumber={etaData.train_number}
                baseTime={etaData.scheduled_departure || '06:00'}
                currentPosition={etaData.current_position}
              />
            </div>

          </div>
        </>
      )}

      {/* Crowdsourced Disruption Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        trainNumber={etaData?.train_number || trainNumber}
        trainName={etaData?.name || ''}
        stations={stations}
        onReportSubmitted={() => {
          fetchTelemetry(true);
        }}
      />

    </div>
  );
}





