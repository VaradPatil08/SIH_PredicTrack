import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  ArrowLeft, 
  ChevronRight, 
  RefreshCw, 
  Clock, 
  AlertTriangle, 
  Building2, 
  Train,
  X, 
  ExternalLink,
  ArrowUpDown,
  Trash2
} from 'lucide-react';
import { getAdminStations, getAdminStationArrivals, getAdminReports, deleteAdminReport } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { translateStationName, translateTrainName } from '../locales/trainNames';

// Convert a station's schedule offset (relative to the train's origin departure)
// into the actual HH:MM clock time used by the tracking page.
function offsetToTime(baseOffsetMin, delayMin = 0, scheduledDeparture = '00:00', scheduledArrivalTime = null) {
  const absoluteParts = String(scheduledArrivalTime || '').split(':');
  if (absoluteParts.length >= 2) {
    const absoluteHour = Number.parseInt(absoluteParts[0], 10);
    const absoluteMinute = Number.parseInt(absoluteParts[1], 10);
    if (Number.isFinite(absoluteHour) && Number.isFinite(absoluteMinute)) {
      const total = Math.max(0, absoluteHour * 60 + absoluteMinute + (delayMin || 0));
      const h = Math.floor(total / 60) % 24;
      const m = total % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }

  const departureParts = String(scheduledDeparture || '00:00').split(':');
  const departureHour = Number.parseInt(departureParts[0], 10);
  const departureMinute = Number.parseInt(departureParts[1], 10);
  const departureTotal = Number.isFinite(departureHour) && Number.isFinite(departureMinute)
    ? departureHour * 60 + departureMinute
    : 0;
  const total = Math.max(0, departureTotal + (baseOffsetMin || 0) + (delayMin || 0));
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * 1. STATUS BADGE LOGIC
 * Computes status per row based on current time vs scheduled/expected arrival and halt duration:
 * - APPROACHING: current time is before the train's expected arrival
 * - AT PLATFORM: current time is between expected arrival and (expected arrival + halt duration)
 * - DEPARTED: current time is past (expected arrival + halt duration)
 */
function computeTrainStatus(scheduledOffsetMin, delayMin, haltMin = 2, scheduledDeparture = '00:00') {
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const departureParts = String(scheduledDeparture || '00:00').split(':');
  const departureHour = Number.parseInt(departureParts[0], 10);
  const departureMinute = Number.parseInt(departureParts[1], 10);
  const departureTotal = Number.isFinite(departureHour) && Number.isFinite(departureMinute)
    ? departureHour * 60 + departureMinute
    : 0;
  const expTotalMin = Math.max(0, departureTotal + (scheduledOffsetMin || 0) + (delayMin || 0));
  const expMin = expTotalMin % 1440;
  const halt = haltMin > 0 ? haltMin : 2;

  // Circular 24-hour difference to handle midnight crossing
  let diffToArrival = expMin - currentMin;
  if (diffToArrival < -720) diffToArrival += 1440;
  if (diffToArrival > 720) diffToArrival -= 1440;

  if (diffToArrival > 0) {
    return 'APPROACHING';
  } else if (diffToArrival >= -halt) {
    return 'AT_PLATFORM';
  } else {
    return 'DEPARTED';
  }
}

/**
 * Visual Status Badge Component
 */
function StatusBadge({ status }) {
  const { t } = useSettings();
  if (status === 'APPROACHING') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border border-blue-200 text-navy bg-blue-50 shadow-2xs tracking-wide">
        {t('approaching')}
      </span>
    );
  }
  if (status === 'AT_PLATFORM') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-navy text-white shadow-xs tracking-wide">
        {t('atPlatform')}
      </span>
    );
  }
  // DEPARTED (faded/quiet visual state)
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border border-slate-200 text-muted bg-slate-100 tracking-wide">
      {t('departedStatus')}
    </span>
  );
}

/**
 * 2. DELAY SEVERITY LOGIC (computed independently of status badge)
 */
function getDelaySeverity(delayMinutes = 0, t = (k) => k) {
  const d = Math.max(0, delayMinutes || 0);

  if (d <= 5) {
    return {
      severity: 'on_time',
      textClass: 'text-transit-green',
      badgeClass: 'bg-emerald-50 border border-emerald-200 text-transit-green',
      borderLeftClass: 'border-l-transit-green',
      dotColor: '#2E7D32',
      label: d === 0 ? t('onTimeStatus') : `+${d}m`,
    };
  }
  if (d <= 15) {
    return {
      severity: 'moderate',
      textClass: 'text-transit-orange',
      badgeClass: 'bg-amber-50 border border-amber-200 text-transit-orange',
      borderLeftClass: 'border-l-transit-orange',
      dotColor: '#ED8B00',
      label: `+${d}m`,
    };
  }
  return {
    severity: 'severe',
    textClass: 'text-railway-red',
    badgeClass: 'bg-red-50 border border-red-200 text-railway-red',
    borderLeftClass: 'border-l-railway-red',
    dotColor: '#D32F2F',
    label: `+${d}m`,
  };
}

function DelaySeverityBadge({ delayMinutes }) {
  const { t } = useSettings();
  const sev = getDelaySeverity(delayMinutes, t);
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold font-mono ${sev.badgeClass}`}>
      {sev.label}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-[#D9DEE5] dark:border-slate-800 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
        </td>
      ))}
    </tr>
  );
}

// ---------------------------------------------------------------------------
// 1. Station Picker View (/admin)
// ---------------------------------------------------------------------------
function StationPickerView() {
  const navigate = useNavigate();
  const { t, language } = useSettings();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');
  const [debouncedFilterQuery, setDebouncedFilterQuery] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedFilterQuery(filterQuery), 250);
    return () => window.clearTimeout(timer);
  }, [filterQuery]);

  useEffect(() => {
    getAdminStations().then(data => {
      setStations(data || []);
      setLoading(false);
    });
  }, []);

  const filtered = debouncedFilterQuery.trim().length === 0
    ? stations
    : stations.filter(s =>
        s.name.toLowerCase().includes(debouncedFilterQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(debouncedFilterQuery.toLowerCase())
      );

  return (
    <div className="min-h-screen bg-[#F5F6F8] dark:bg-[#0F172A] text-[#1F2933] dark:text-[#F1F5F9] font-sans transition-colors">
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 space-y-6">

        {/* Section Header & Subtitle */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#17324D] dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#17324D] dark:bg-blue-400 inline-block" />
            <span>{t('adminPanel')}</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="font-normal text-muted dark:text-slate-400">{t('liveArrivalsBoard')}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-[#17324D] dark:text-[#93C5FD] tracking-tight">
            {t('adminStationBoard')}
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] dark:text-[#94A3B8] max-w-2xl">
            {t('adminSubtitle')}
          </p>
        </div>

        {/* Station Search Input Card */}
        <div className="p-4 sm:p-5 rounded-lg border border-[#D9DEE5] dark:border-[#334155] bg-white dark:bg-[#1E293B] shadow-card">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667085] dark:text-slate-400" />
            <input
              type="text"
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              placeholder={t('searchStationPlaceholder')}
              className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-[#D9DEE5] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800/50 text-[#1F2933] dark:text-slate-100 placeholder:text-[#667085] dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-blue-500 transition-all"
              aria-label="Filter stations"
              autoFocus
            />
            {filterQuery && (
              <button 
                onClick={() => setFilterQuery('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#667085] hover:text-[#17324D] dark:text-slate-400 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Station Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-16 bg-white dark:bg-slate-800 animate-pulse rounded-lg border border-[#D9DEE5] dark:border-slate-700 shadow-card" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#1E293B] rounded-lg border border-dashed border-[#D9DEE5] dark:border-slate-700 space-y-3 shadow-card">
            <Building2 className="w-10 h-10 text-[#667085] dark:text-slate-500 mx-auto opacity-60" />
            <p className="text-sm font-semibold text-[#1F2933] dark:text-slate-200">
              {t('noMatchingServices', { query: filterQuery })}
            </p>
            <button 
              onClick={() => setFilterQuery('')} 
              className="px-4 py-2 rounded-lg bg-[#17324D] dark:bg-blue-600 hover:bg-[#24476B] text-white text-xs font-semibold transition-colors"
            >
              {t('clearSearchFilter')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[#667085] dark:text-[#94A3B8]">
              <span className="font-semibold uppercase tracking-wider">
                {t('coveredTrainsCount')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[65vh] overflow-y-auto pr-1">
              {filtered.slice(0, 300).map(station => (
                <button
                  key={station.code}
                  onClick={() => navigate(`/admin/${station.code}`)}
                  className="railway-card group flex items-center justify-between p-3.5 bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-[#D9DEE5] dark:border-[#334155] rounded-lg transition-all text-left shadow-card"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#17324D] dark:text-[#93C5FD] group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                        {station.code}
                      </span>
                    </div>
                    <div className="text-xs text-[#1F2933] dark:text-slate-300 font-medium truncate max-w-[200px]">
                      {translateStationName(station.name, language)}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#667085] dark:text-slate-400 group-hover:text-[#17324D] dark:group-hover:text-blue-300 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Arrivals Board View (/admin/:stationCode)
// ---------------------------------------------------------------------------
function ArrivalsBoard({ stationCode }) {
  const navigate = useNavigate();
  const { t, language } = useSettings();
  const { token } = useAuth();
  const [arrivals, setArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('time'); // 'time' | 'delay'
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportError, setReportError] = useState(null);
  const pollingRef = useRef(null);

  const fetchArrivals = useCallback(async ({ background = false } = {}) => {
    if (background) setIsRefreshing(true);
    try {
      const data = await getAdminStationArrivals(stationCode);
      setArrivals(data || []);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      // Preserve the last successful arrivals during background refresh failures.
      setError({ key: 'telemetryOffline', params: { trainNumber: stationCode } });
    } finally {
      setLoading(false);
      if (background) setIsRefreshing(false);
    }
  }, [stationCode]);

  const fetchReports = useCallback(async () => {
    if (!token) return;
    setReportsLoading(true);
    try {
      const data = await getAdminReports(token, stationCode);
      setReports(data || []);
      setReportError(null);
    } catch (err) {
      setReportError(err?.message || t('deleteReportFailed'));
    } finally {
      setReportsLoading(false);
    }
  }, [token, stationCode, t]);

  const handleDeleteAdminReport = useCallback(async (report) => {
    if (!report?.id || !token) return;
    if (!window.confirm(t('deleteReportConfirm'))) return;
    try {
      await deleteAdminReport(report.id, token);
      setReports(prev => prev.filter(r => r.id !== report.id));
    } catch (err) {
      setReportError(err?.message || t('deleteReportFailed'));
    }
  }, [token, t]);

  useEffect(() => {
    setLoading(true);
    setArrivals([]);
    setError(null);
    setSearchQuery('');
    fetchArrivals();
    fetchReports();
    pollingRef.current = setInterval(() => fetchArrivals({ background: true }), 60000);
    return () => clearInterval(pollingRef.current);
  }, [fetchArrivals, fetchReports]);

  // 4. SUMMARY STRIP COMPUTATION
  const { onTimeCount, moderateCount, severeCount } = useMemo(() => {
    let onTime = 0;
    let moderate = 0;
    let severe = 0;

    arrivals.forEach((arr) => {
      const d = arr.predicted_delay_min || 0;
      if (d <= 5) onTime += 1;
      else if (d <= 15) moderate += 1;
      else severe += 1;
    });

    return { onTimeCount: onTime, moderateCount: moderate, severeCount: severe };
  }, [arrivals]);

  // 6. SORT LOGIC
  const processedArrivals = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const list = arrivals.map((arr) => {
      const status = computeTrainStatus(
        arr.scheduled_arrival_offset_min,
        arr.predicted_delay_min,
        arr.halt_min,
        arr.scheduled_departure
      );
      const severity = getDelaySeverity(arr.predicted_delay_min, t);
      const localizedTrainName = translateTrainName(arr.train_name, language, arr.train_number);
      const localizedDirection = arr.direction
        ? arr.direction.split(/[-–—→]/).map(part => translateStationName(part.trim(), language)).join(' → ')
        : '';
      return {
        ...arr,
        computedStatus: status,
        severity,
        localizedTrainName,
        localizedDirection,
      };
    }).filter((arr) => {
      if (!query) return true;
      return [
        arr.train_number,
        arr.train_name,
        arr.localizedTrainName,
        arr.direction,
        arr.localizedDirection,
      ].some(value => String(value || '').toLowerCase().includes(query));
    });

    if (sortBy === 'delay') {
      return list.sort((a, b) => (b.predicted_delay_min || 0) - (a.predicted_delay_min || 0));
    }
    return list.sort((a, b) => (a.predicted_arrival_offset_min || 0) - (b.predicted_arrival_offset_min || 0));
  }, [arrivals, sortBy, searchQuery, language, t]);

  return (
    <div className="min-h-screen bg-[#F5F6F8] dark:bg-[#0F172A] text-[#1F2933] dark:text-[#F1F5F9] font-sans transition-colors">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 space-y-6">

        {/* Back Link & Header */}
        <div className="space-y-3 pb-3 border-b border-[#D9DEE5] dark:border-slate-800">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-1.5 min-h-[36px] text-xs sm:text-sm font-semibold text-[#667085] dark:text-slate-400 hover:text-[#17324D] dark:hover:text-blue-400 transition-colors rounded p-1 group active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>{t('backToDirectory')}</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-[#17324D] dark:text-[#93C5FD] border border-[#D9DEE5] dark:border-slate-700">
                  {stationCode}
                </span>
                <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-[#17324D] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {t('liveArrivalsBoard')}
                </span>
                <span className="text-[11px] font-semibold text-[#2E7D32] dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2E7D32] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2E7D32]"></span>
                  </span>
                  <span>{t('irSatOperational')}</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-[#17324D] dark:text-[#93C5FD] tracking-tight">
                {translateStationName(stationCode, language)} {t('liveArrivalsBoard')}
              </h1>

              {/* 4. SUMMARY STRIP (under heading, above table) */}
              {!loading && arrivals.length > 0 && (
                <div className="flex items-center gap-4 text-xs font-medium pt-0.5 text-[#1F2933] dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#639922] inline-block" />
                    <span><strong>{onTimeCount}</strong> {t('onTime')}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#BA7517] inline-block" />
                    <span><strong>{moderateCount}</strong> {t('delayed')}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#A32D2D] inline-block" />
                    <span><strong>{severeCount}</strong> {t('delayLabel')}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Right Status / Actions */}
            <div className="flex items-center gap-2.5 text-xs flex-wrap">
              {/* Train Search */}
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#667085] dark:text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchTrainPlaceholder')}
                  className="w-full pl-9 pr-8 py-1.5 rounded-lg border border-[#D9DEE5] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#1F2933] dark:text-slate-100 placeholder:text-[#667085] dark:placeholder:text-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-blue-500 transition-all"
                  aria-label={t('searchTrainPlaceholder')}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#667085] hover:text-[#17324D] dark:text-slate-400 dark:hover:text-white"
                    aria-label={t('clearSearchFilter')}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sort Toggle */}
              <button
                onClick={() => setSortBy(prev => prev === 'time' ? 'delay' : 'time')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold text-xs transition-all shadow-2xs active:scale-95 ${
                  sortBy === 'delay'
                    ? 'bg-[#17324D] dark:bg-blue-600 text-white border-[#17324D] dark:border-blue-600'
                    : 'bg-white dark:bg-slate-800 text-[#17324D] dark:text-blue-300 border-[#D9DEE5] dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title={t(sortBy === 'delay' ? 'sortedByDelayTooltip' : 'sortByDelayTooltip')}
              >
                <ArrowUpDown className={`w-3.5 h-3.5 ${sortBy === 'delay' ? 'rotate-180' : ''}`} />
                <span>{t(sortBy === 'delay' ? 'sortedByDelay' : 'sortByDelay')}</span>
              </button>

              {/* Auto-Refresh Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-[#D9DEE5] dark:border-slate-700 text-[#667085] dark:text-slate-300 shadow-2xs">
                {isRefreshing ? (
                  <RefreshCw className="w-3 h-3 animate-spin text-[#17324D] dark:text-blue-400" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-[#2E7D32] inline-block animate-pulse" />
                )}
                <span className="text-[11px] font-medium">{t('autoRefresh60')}</span>
              </div>

              {lastUpdated && (
                <div className="hidden md:flex items-center gap-1.5 text-[11px] text-[#667085] dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{t('updatedAt', { time: lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) })}</span>
                </div>
              )}

              <button
                onClick={() => fetchArrivals({ background: true })}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#17324D] dark:text-blue-400 border border-[#D9DEE5] dark:border-slate-700 font-semibold text-xs transition-all shadow-2xs active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t('syncTelemetry')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs rounded-lg flex items-center gap-2 shadow-2xs">
            <AlertTriangle className="w-4 h-4 text-[#ED8B00] shrink-0" />
            <span>{typeof error === 'string' ? error : t(error.key, error.params)}</span>
          </div>
        )}

        {/* Arrivals Table Card */}
        <div className="rounded-lg border border-[#D9DEE5] dark:border-[#334155] bg-white dark:bg-[#1E293B] shadow-card overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-xs font-sans border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-[#D9DEE5] dark:border-slate-800 text-[11px] font-semibold text-[#667085] dark:text-slate-400">
                  <th className="text-left px-4 py-3.5">{t('tableTrain')}</th>
                  <th className="text-left px-4 py-3.5">{t('tablePlatform')}</th>
                  <th className="text-left px-4 py-3.5">{t('tableExpected')}</th>
                  <th className="text-left px-4 py-3.5">{t('tableStatus')} / {t('tableDelay')}</th>
                  <th className="text-left px-4 py-3.5">{t('halt')}</th>
                  <th className="text-left px-4 py-3.5">{t('originDestination')}</th>
                  <th className="text-right px-4 py-3.5">{t('action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9DEE5] dark:divide-slate-800">
                {loading && [...Array(8)].map((_, i) => <SkeletonRow key={i} />)}

                {!loading && error && processedArrivals.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-muted dark:text-slate-400">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-[#ED8B00]" />
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                        Couldn't load arrivals for {stationCode}
                      </p>
                      <p className="text-xs text-muted dark:text-slate-400 mb-4 max-w-sm mx-auto">
                        {error}
                      </p>
                      <button
                        onClick={fetchArrivals}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#17324D] dark:bg-blue-600 hover:opacity-90 text-white font-semibold text-xs transition-all shadow-xs active:scale-95"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Retry Loading</span>
                      </button>
                    </td>
                  </tr>
                )}

                {!loading && !error && processedArrivals.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-muted dark:text-slate-400">
                      <Train className="w-8 h-8 mx-auto mb-2 opacity-50 text-[#17324D] dark:text-blue-400" />
                      {searchQuery.trim() ? (
                        <>
                          <p className="text-xs font-semibold mb-3">
                            {t('noMatchingTrains', { query: searchQuery })}
                          </p>
                          <button
                            onClick={() => setSearchQuery('')}
                            className="px-4 py-2 rounded-lg bg-[#17324D] dark:bg-blue-600 hover:bg-[#24476B] text-white text-xs font-semibold transition-colors"
                          >
                            {t('clearSearchFilter')}
                          </button>
                        </>
                      ) : (
                        <p className="text-xs font-semibold">
                          {t('noArrivalsFound')}
                        </p>
                      )}
                    </td>
                  </tr>
                )}

                {!loading && processedArrivals.map((arrival, idx) => {
                  const isDeparted = arrival.computedStatus === 'DEPARTED';
                  const localizedTrainName = arrival.localizedTrainName || translateTrainName(arrival.train_name, language, arrival.train_number);
                  const localizedDirection = arrival.direction 
                    ? arrival.direction.split(/[-–—→]/).map(s => translateStationName(s.trim(), language)).join(' → ')
                    : '';

                  return (
                    <motion.tr
                      key={`${arrival.train_number}-${idx}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                      className={`transition-colors border-l-4 ${arrival.severity.borderLeftClass} ${
                        isDeparted 
                          ? 'opacity-55 hover:opacity-80 bg-slate-50/40 dark:bg-slate-900/20' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {/* TRAIN: Train Number & Name */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link
                            to={`/train/${arrival.train_number}`}
                            className={`font-bold font-mono text-sm inline-block transition-colors ${
                              isDeparted 
                                ? 'text-[#667085] dark:text-slate-400 hover:text-navy dark:hover:text-blue-300' 
                                : 'text-[#17324D] dark:text-[#93C5FD] hover:text-blue-600 dark:hover:text-blue-300'
                            }`}
                          >
                            #{arrival.train_number}
                          </Link>
                          {arrival.live_source === 'railradar' && (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-2xs"
                              title={arrival.live_synced_at ? `RailRadar Live Telemetry (Synced at ${new Date(arrival.live_synced_at).toLocaleTimeString()})` : 'RailRadar Live Telemetry'}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                              <span>{arrival.speed_kmh != null ? `${Math.round(arrival.speed_kmh)} km/h` : 'RailRadar Live'}</span>
                            </span>
                          )}
                        </div>
                        <div className={`text-[11px] truncate max-w-[220px] ${
                          isDeparted ? 'text-slate-400 dark:text-slate-500' : 'text-[#667085] dark:text-slate-400'
                        }`}>
                          {localizedTrainName}
                        </div>
                      </td>

                      {/* PLATFORM: Platform Chip */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded font-mono font-bold text-xs border ${
                          isDeparted
                            ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                            : 'bg-slate-100 dark:bg-slate-800 border-[#D9DEE5] dark:border-slate-700 text-[#17324D] dark:text-slate-200'
                        }`}>
                          {t('platform')} {arrival.platform ?? '—'}{arrival.platform_is_estimated ? ' (est.)' : ''}
                        </span>
                      </td>

                      {/* EXP ARRIVAL: Expected Arrival Time vs Scheduled */}
                      <td className="px-4 py-3.5">
                        <div className={`font-mono text-sm font-bold ${
                          isDeparted ? 'text-slate-500 dark:text-slate-400' : 'text-[#1F2933] dark:text-slate-100'
                        }`}>
                          {offsetToTime(arrival.scheduled_arrival_offset_min, arrival.predicted_delay_min, arrival.scheduled_departure, arrival.scheduled_arrival_time)}
                        </div>
                        <div className="text-[10px] text-[#667085] dark:text-slate-400 font-mono">
                          {t('schedHalt')}: {offsetToTime(arrival.scheduled_arrival_offset_min, 0, arrival.scheduled_departure, arrival.scheduled_arrival_time)}
                        </div>
                      </td>

                      {/* 1. STATUS & 2. DELAY SEVERITY BADGES (independent) */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col items-start gap-1">
                          <StatusBadge status={arrival.computedStatus} />
                          <DelaySeverityBadge delayMinutes={arrival.predicted_delay_min} />
                        </div>
                      </td>

                      {/* HALT: Halt duration */}
                      <td className="px-4 py-3.5">
                        <span className={`font-mono text-xs font-semibold ${
                          arrival.halt_min > 0 
                            ? isDeparted ? 'text-slate-400 dark:text-slate-500' : 'text-[#1F2933] dark:text-slate-200'
                            : 'text-[#667085] dark:text-slate-500'
                        }`}>
                          {arrival.halt_min > 0 ? `${arrival.halt_min} ${t('minuteSuffix')}` : '—'}
                        </span>
                      </td>

                      {/* DIRECTION */}
                      <td className="px-4 py-3.5">
                        <span className={`text-xs truncate max-w-[180px] block ${
                          isDeparted ? 'text-slate-400 dark:text-slate-500' : 'text-[#667085] dark:text-slate-300'
                        }`}>
                          {localizedDirection || arrival.direction}
                        </span>
                      </td>

                      {/* ACTION: Track Button */}
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          to={`/train/${arrival.train_number}`}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-all shadow-2xs ${
                            isDeparted
                              ? 'bg-slate-200 dark:bg-slate-800 text-[#17324D] dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                              : 'bg-[#17324D] dark:bg-blue-600 text-white hover:bg-[#24476B] dark:hover:bg-blue-500'
                          }`}
                        >
                          <span>{t('track')}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {!loading && processedArrivals.length > 0 && (
          <p className="text-[11px] text-[#667085] dark:text-slate-400 text-right">
            Showing {processedArrivals.length} upcoming arrivals · {sortBy === 'delay' ? 'Sorted by delay severity' : 'Sorted by expected arrival time'}
          </p>
        )}


        {/* Station Admin Report Moderation */}
        <section className="bg-white dark:bg-[#1E293B] border border-[#D9DEE5] dark:border-slate-700 rounded-xl shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-[#D9DEE5] dark:border-slate-700 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#17324D] dark:text-blue-300">{t('recentReports')}</h2>
              <p className="text-[11px] text-[#667085] dark:text-slate-400">{t('adminDeleteReport')}</p>
            </div>
            <button onClick={fetchReports} className="p-1.5 rounded-lg border border-[#D9DEE5] dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800" title={t('syncTelemetry')}>
              <RefreshCw className={`w-3.5 h-3.5 ${reportsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {reportError && <div className="px-4 py-2 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40">{reportError}</div>}
          {!reportsLoading && reports.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-[#667085] dark:text-slate-400">{t('noReports')}</div>
          ) : (
            <div className="divide-y divide-[#E5E7EB] dark:divide-slate-700">
              {reports.map(report => (
                <div key={report.id} className="px-4 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap text-xs font-semibold">
                      <span className="font-mono">#{report.train_number}</span>
                      {report.station_code && <span>{report.station_code}</span>}
                      <span className="capitalize">{String(report.issue_type || '').replaceAll('_', ' ')}</span>
                      <span>{report.delay_bucket}</span>
                    </div>
                    {report.description && <p className="text-[11px] text-[#667085] dark:text-slate-400 truncate mt-1">{report.description}</p>}
                  </div>
                  <button onClick={() => handleDeleteAdminReport(report)} className="inline-flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 text-[11px] font-semibold">
                    <Trash2 className="w-3.5 h-3.5" />
                    {t('deleteReport')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root Export — Dispatches based on :stationCode
// ---------------------------------------------------------------------------
export default function AdminPage() {
  const { stationCode } = useParams();
  if (stationCode) return <ArrivalsBoard stationCode={stationCode.toUpperCase()} />;
  return <StationPickerView />;
}
