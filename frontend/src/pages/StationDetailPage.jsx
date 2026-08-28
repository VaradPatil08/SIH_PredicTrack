import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  RefreshCw, 
  Building2, 
  Clock, 
  Train, 
  AlertTriangle,
  Radio,
  Layers,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MapPin,
  Circle,
  Filter
} from 'lucide-react';
import { getStationLiveBoard } from '../services/api';
import ReportModal from '../components/ReportModal';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';

const POLL_INTERVAL_SECONDS = 6;

export default function StationDetailPage() {
  const { stationCode } = useParams();
  const navigate = useNavigate();
  const { t } = useSettings();
  const { isAuthenticated, openLoginModal } = useAuth();

  const [boardData, setBoardData] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(POLL_INTERVAL_SECONDS);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'delayed' | 'critical' | 'ontime'
  const [expandedTrain, setExpandedTrain] = useState(null);
  const [flashHighlight, setFlashHighlight] = useState(false);

  const timerRef = useRef(null);
  const countdownRef = useRef(null);

  const fetchBoard = async (isBackground = false) => {
    if (!isBackground) {
      setRefreshing(true);
    }
    try {
      const data = await getStationLiveBoard(stationCode);
      setBoardData(data);
      setError(null);

      if (isBackground) {
        setFlashHighlight(true);
        setTimeout(() => setFlashHighlight(false), 800);
      }
    } catch (err) {
      console.error('Error fetching station live board:', err);
      if (!boardData) {
        setError(`Unable to connect to live telemetry feed for station ${stationCode}.`);
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
    fetchBoard(false);

    timerRef.current = setInterval(() => {
      fetchBoard(true);
    }, POLL_INTERVAL_SECONDS * 1000);

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : POLL_INTERVAL_SECONDS));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [stationCode]);

  const toggleExpandTrain = (trainNo) => {
    setExpandedTrain((prev) => (prev === trainNo ? null : trainNo));
  };

  const arrivals = boardData?.arrivals || [];
  const onTimeCount = arrivals.filter((a) => a.status === 'on_time').length;
  const delayedCount = arrivals.filter((a) => a.status === 'delayed').length;
  const criticalCount = arrivals.filter((a) => a.status === 'critical').length;

  const filteredArrivals = arrivals.filter((a) => {
    if (activeFilter === 'ontime') return a.status === 'on_time';
    if (activeFilter === 'delayed') return a.status === 'delayed';
    if (activeFilter === 'critical') return a.status === 'critical';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F5F6F8] dark:bg-[#0F172A] font-sans text-foreground dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Top Header Bar: Back Link | Status Pills | Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#D9DEE5] dark:border-slate-800">
          
          <Link
            to="/stations"
            className="inline-flex items-center gap-1.5 min-h-[40px] text-xs sm:text-sm font-semibold text-[#667085] dark:text-slate-400 hover:text-[#17324D] dark:hover:text-blue-400 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-navy rounded p-1 group active:scale-95 self-start"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Station Directory</span>
          </Link>

          {/* Polling Heartbeat Badge, Report Button & Refresh Button */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5 text-xs w-full sm:w-auto flex-wrap">
            
            {/* Report Disruption Button */}
            <button
              onClick={handleOpenReportModal}
              className="flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg bg-red-500/10 hover:bg-red-500/20 text-[#C62828] dark:text-red-400 border border-[#C62828]/30 font-semibold text-xs transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-95"
              title="Report station yard hold or track disruption"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse text-[#C62828] dark:text-red-400" />
              <span>REPORT DISRUPTION</span>
            </button>

            {/* Auto-Sync Countdown Pill */}
            <div className="flex items-center gap-2 px-3 py-2 min-h-[40px] rounded-full bg-white dark:bg-slate-800 border border-[#D9DEE5] dark:border-slate-700 text-[#667085] dark:text-slate-300 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#2E7D32] inline-block animate-pulse" />
              <span className="text-[11px] font-medium">
                Auto-sync in <strong>{countdown}s</strong>
              </span>
            </div>

            {/* Sync Refresh Button */}
            <button
              onClick={() => fetchBoard(false)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#17324D] dark:text-blue-400 border border-[#D9DEE5] dark:border-slate-700 font-semibold text-xs transition-all duration-200 disabled:opacity-50 shadow-2xs hover:shadow-xs active:scale-95"
              title="Refresh live board"
              aria-label="Refresh live board"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Syncing...' : 'Sync Feed'}</span>
            </button>
          </div>

        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="space-y-6">
            <div className="p-6 rounded-lg border border-[#D9DEE5] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card animate-pulse space-y-4">
              <div className="h-6 w-64 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded"></div>
                <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded"></div>
                <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded"></div>
                <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded"></div>
              </div>
            </div>
            <div className="p-6 rounded-lg border border-[#D9DEE5] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card animate-pulse space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded"></div>
              ))}
            </div>
          </div>
        )}

        {/* Error View */}
        {!loading && error && (
          <div className="p-6 sm:p-8 rounded-lg border border-red-200 dark:border-red-900 bg-white dark:bg-slate-900 text-center space-y-4 max-w-lg mx-auto shadow-card">
            <div className="text-[#C62828] dark:text-red-400 font-bold text-sm flex items-center justify-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchBoard(false)}
              className="px-4 py-2.5 min-h-[44px] rounded-lg bg-[#17324D] dark:bg-blue-600 text-white text-xs font-semibold transition-colors active:scale-95"
            >
              Retry Live Telemetry
            </button>
          </div>
        )}

        {/* Live Station Board View */}
        {!loading && !error && boardData && (
          <>
            {/* Top Station Metric Cockpit Card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={`rounded-lg border p-4 sm:p-6 transition-all duration-300 shadow-card ${
                flashHighlight 
                  ? 'bg-blue-50/70 dark:bg-blue-950/40 border-navy dark:border-blue-400 shadow-md' 
                  : 'bg-white dark:bg-[#1E293B] border-[#D9DEE5] dark:border-[#334155]'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D9DEE5] dark:border-slate-700">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-[#17324D] dark:text-[#93C5FD] border border-[#D9DEE5] dark:border-slate-700">
                      {boardData.code}
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-[#17324D] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {boardData.category}
                    </span>
                    <span className="text-[11px] font-semibold text-[#2E7D32] dark:text-emerald-400 flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2E7D32] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2E7D32]"></span>
                      </span>
                      <span>Live Yard Feeds Active</span>
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#17324D] dark:text-[#93C5FD] tracking-tight">
                    {boardData.name}
                  </h1>
                  <p className="text-xs text-[#667085] dark:text-[#94A3B8]">
                    {boardData.zone} • Indian Railways
                  </p>
                </div>

                {/* Avg Delay Badge */}
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/80 border border-[#D9DEE5] dark:border-slate-700 text-right min-w-[130px]">
                    <div className="text-[11px] text-[#667085] dark:text-[#94A3B8] font-medium">Station Avg Delay</div>
                    <div className={`text-lg font-bold ${
                      boardData.avg_delay_min > 15 
                        ? 'text-[#C62828] dark:text-red-400' 
                        : boardData.avg_delay_min > 5 
                        ? 'text-[#ED8B00] dark:text-amber-400' 
                        : 'text-[#2E7D32] dark:text-emerald-400'
                    }`}>
                      {boardData.avg_delay_min > 0 ? `+${boardData.avg_delay_min} min` : 'On Time'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stat Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
                <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/50 border border-[#D9DEE5] dark:border-slate-700">
                  <div className="text-[#667085] dark:text-[#94A3B8] font-medium">Platforms</div>
                  <div className="text-base font-bold text-[#17324D] dark:text-slate-100">{boardData.platforms} Tracks</div>
                </div>
                <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/50 border border-[#D9DEE5] dark:border-slate-700">
                  <div className="text-[#667085] dark:text-[#94A3B8] font-medium">Daily Services</div>
                  <div className="text-base font-bold text-[#17324D] dark:text-slate-100">{boardData.trains_today} Trains</div>
                </div>
                <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/50 border border-[#D9DEE5] dark:border-slate-700">
                  <div className="text-[#667085] dark:text-[#94A3B8] font-medium">On-Time Services</div>
                  <div className="text-base font-bold text-[#2E7D32] dark:text-emerald-400">{onTimeCount} Trains</div>
                </div>
                <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/50 border border-[#D9DEE5] dark:border-slate-700">
                  <div className="text-[#667085] dark:text-[#94A3B8] font-medium">Delayed Services</div>
                  <div className="text-base font-bold text-[#ED8B00] dark:text-amber-400">{delayedCount + criticalCount} Trains</div>
                </div>
              </div>
            </motion.div>

            {/* Live Board Table Card with Timeline Visual Language */}
            <div className="rounded-lg border border-[#D9DEE5] dark:border-[#334155] bg-white dark:bg-[#1E293B] shadow-card p-4 sm:p-6 space-y-4">
              
              {/* Filter Tabs Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D9DEE5] dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#17324D] dark:bg-blue-400 inline-block" />
                  <h2 className="font-bold text-sm sm:text-base text-[#17324D] dark:text-[#93C5FD]">
                    Live Arrival & Departure Schedule
                  </h2>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs overflow-x-auto">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-3 py-1 rounded-md font-semibold transition-all ${
                      activeFilter === 'all'
                        ? 'bg-white dark:bg-slate-900 text-[#17324D] dark:text-blue-300 shadow-xs'
                        : 'text-[#667085] dark:text-slate-400 hover:text-foreground'
                    }`}
                  >
                    All ({arrivals.length})
                  </button>
                  <button
                    onClick={() => setActiveFilter('ontime')}
                    className={`px-3 py-1 rounded-md font-semibold transition-all ${
                      activeFilter === 'ontime'
                        ? 'bg-white dark:bg-slate-900 text-[#2E7D32] dark:text-emerald-400 shadow-xs'
                        : 'text-[#667085] dark:text-slate-400 hover:text-foreground'
                    }`}
                  >
                    On Time ({onTimeCount})
                  </button>
                  <button
                    onClick={() => setActiveFilter('delayed')}
                    className={`px-3 py-1 rounded-md font-semibold transition-all ${
                      activeFilter === 'delayed'
                        ? 'bg-white dark:bg-slate-900 text-[#ED8B00] dark:text-amber-400 shadow-xs'
                        : 'text-[#667085] dark:text-slate-400 hover:text-foreground'
                    }`}
                  >
                    Delayed ({delayedCount})
                  </button>
                  {criticalCount > 0 && (
                    <button
                      onClick={() => setActiveFilter('critical')}
                      className={`px-3 py-1 rounded-md font-semibold transition-all ${
                        activeFilter === 'critical'
                          ? 'bg-white dark:bg-slate-900 text-[#C62828] dark:text-red-400 shadow-xs'
                          : 'text-[#667085] dark:text-slate-400 hover:text-foreground'
                      }`}
                    >
                      Critical ({criticalCount})
                    </button>
                  )}
                </div>
              </div>

              {/* Station Timeline-Styled Arrivals List */}
              <div className="relative pl-6 sm:pl-8 space-y-2 pt-2">
                
                {/* Vertical connecting line */}
                <div className="absolute left-[11px] sm:left-[15px] top-4 bottom-4 w-[2px] bg-slate-200 dark:bg-slate-800 pointer-events-none" />

                {filteredArrivals.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#667085] dark:text-slate-400">
                    No services currently match the selected filter.
                  </div>
                ) : (
                  filteredArrivals.map((arr) => {
                    const isExpanded = expandedTrain === arr.train_number;
                    const isCritical = arr.status === 'critical';
                    const isDelayed = arr.status === 'delayed';

                    // Node styling
                    let nodeColor = 'bg-[#2E7D32]';
                    let badgeClass = 'badge-ontime';
                    let badgeLabel = 'ON TIME';

                    if (isCritical) {
                      nodeColor = 'bg-[#C62828]';
                      badgeClass = 'badge-critical';
                      badgeLabel = `+${arr.delay_min} MIN DELAY`;
                    } else if (isDelayed) {
                      nodeColor = 'bg-[#ED8B00]';
                      badgeClass = 'badge-delayed';
                      badgeLabel = `+${arr.delay_min} MIN DELAY`;
                    }

                    return (
                      <div key={arr.train_number} className="relative group">
                        
                        {/* Status node on the vertical track */}
                        <div className={`absolute -left-[19px] sm:-left-[23px] top-3.5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${nodeColor} shadow-xs`} />

                        {/* Main Arrival Card Row */}
                        <div className="p-3.5 rounded-lg border border-[#D9DEE5] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 shadow-2xs space-y-2">
                          
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            
                            {/* Left: Platform Chip + Train Number + Train Name */}
                            <div className="flex items-center gap-2.5 flex-wrap flex-1 min-w-0">
                              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-200 dark:bg-slate-700 text-[#17324D] dark:text-slate-100 border border-slate-300 dark:border-slate-600 shrink-0">
                                PF {arr.platform}
                              </span>

                              <span className="font-mono font-bold text-[#17324D] dark:text-[#93C5FD] text-sm shrink-0">
                                #{arr.train_number}
                              </span>

                              <span className="font-semibold text-foreground dark:text-slate-200 truncate max-w-sm">
                                {arr.train_name}
                              </span>
                            </div>

                            {/* Right: Scheduled / Predicted Time + Delay Badge + Track CTA */}
                            <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                              
                              <div className="text-right">
                                <div className="font-mono font-bold text-xs text-[#1F2933] dark:text-slate-200">
                                  {arr.predicted_time}
                                </div>
                                <div className="text-[10px] text-[#667085] dark:text-slate-400">
                                  Sched: {arr.scheduled_time}
                                </div>
                              </div>

                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${badgeClass}`}>
                                {badgeLabel}
                              </span>

                              <button
                                onClick={() => navigate(`/train/${arr.train_number}`)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#17324D] dark:bg-blue-600 text-white text-[11px] font-semibold hover:bg-[#24476B] dark:hover:bg-blue-500 transition-all shadow-2xs"
                                title="Open live train telemetry"
                              >
                                <span>Track</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>

                              {arr.top_delay_factors.length > 0 && (
                                <button
                                  onClick={() => toggleExpandTrain(arr.train_number)}
                                  className="p-1 text-[#667085] hover:text-[#17324D] dark:text-slate-400 dark:hover:text-white transition-colors"
                                  title="View root-cause delay reasons"
                                  aria-label="Toggle root-cause delay reasons"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </button>
                              )}

                            </div>

                          </div>

                          {/* Route Origin -> Destination Subtitle */}
                          <div className="flex items-center gap-1.5 text-[11px] text-[#667085] dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700/60">
                            <span>Route: <strong className="text-foreground dark:text-slate-200">{arr.origin || 'Origin'}</strong></span>
                            <span className="text-[#17324D] dark:text-blue-400 font-bold mx-1">→</span>
                            <span><strong className="text-foreground dark:text-slate-200">{arr.destination || 'Destination'}</strong></span>
                            <span className="text-slate-300 dark:text-slate-600 mx-1">•</span>
                            <span>{arr.zone}</span>
                          </div>

                          {/* Expandable Root-Cause Delay Reasons */}
                          <AnimatePresence>
                            {isExpanded && arr.top_delay_factors.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden pt-2"
                              >
                                <div className="p-3 rounded bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-300 space-y-1.5">
                                  <div className="font-semibold flex items-center gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5 text-[#ED8B00]" />
                                    <span>ML Delay Root-Cause Factors:</span>
                                  </div>
                                  <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                                    {arr.top_delay_factors.map((factor, fIdx) => (
                                      <li key={fIdx}>{factor}</li>
                                    ))}
                                  </ul>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                        </div>

                      </div>
                    );
                  })
                )}

              </div>

            </div>
          </>
        )}

        {/* Global Disruption Reporting Modal */}
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          trainNumber={stationCode}
          stations={[{ code: stationCode, name: boardData?.name || stationCode }]}
          onReportSubmitted={() => {
            fetchBoard(false);
          }}
        />

      </div>
    </div>
  );
}
