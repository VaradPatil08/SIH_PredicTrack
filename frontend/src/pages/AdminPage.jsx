import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowLeft, ChevronRight, RefreshCw, Clock, AlertTriangle, CheckCircle, MinusCircle } from 'lucide-react';
import { getAdminStations, getAdminStationArrivals } from '../services/api';

// Convert scheduled_offset_min + delay into a HH:MM clock string
function offsetToTime(baseOffsetMin, delayMin = 0) {
  const total = Math.max(0, (baseOffsetMin || 0) + (delayMin || 0));
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function StatusBadge({ status }) {
  if (status === 'on_time') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-sora font-bold uppercase tracking-wider bg-emerald-950/60 border border-emerald-800 text-emerald-400">
      <CheckCircle className="w-3 h-3" /> ON TIME
    </span>
  );
  if (status === 'delayed') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-sora font-bold uppercase tracking-wider bg-amber-950/60 border border-amber-700 text-[#FFB300]">
      <AlertTriangle className="w-3 h-3" /> DELAYED
    </span>
  );
  if (status === 'departed') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-sora font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-white/40">
      <MinusCircle className="w-3 h-3" /> DEPARTED
    </span>
  );
  return <span className="text-white/30 text-[10px]">{status}</span>;
}

function SkeletonRow() {
  return (
    <tr className="border-b border-white/10 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-3 py-3">
          <div className="h-3 bg-white/10 rounded w-full" />
        </td>
      ))}
    </tr>
  );
}

// Station Picker screen (/admin)
function StationPickerView() {
  const navigate = useNavigate();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    getAdminStations().then(data => {
      setStations(data || []);
      setLoading(false);
    });
  }, []);

  const filtered = filterQuery.trim().length === 0
    ? stations
    : stations.filter(s =>
        s.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(filterQuery.toLowerCase())
      );

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-black text-white font-sans">
      <div className="w-full h-[2px] bg-[#FFB300]" />

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 space-y-8">

        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 text-xs font-sora uppercase tracking-[0.1em] text-white/60">
            <span className="w-2 h-2 bg-[#FFB300] inline-block" />
            <span className="text-white font-semibold">[ STATION_ADMIN ]</span>
            <span className="text-white/30">|</span>
            <span>ARRIVALS CONTROL BOARD</span>
          </div>
          <h1 className="font-sora font-bold text-3xl sm:text-4xl text-white tracking-tight">
            SELECT STATION<br />
            <span className="text-[#FFB300]">// ARRIVALS BOARD</span>
          </h1>
          <p className="text-xs text-white/50 font-sans max-w-xl leading-relaxed">
            Pick a station from the index below to view real-time arrivals, predicted delays, platform assignments, and halt durations.
            {!loading && stations.length > 0 && <span className="ml-1 text-white/30">{stations.length.toLocaleString()} stations indexed.</span>}
          </p>
        </div>

        {/* Station search input */}
        <div className={`border bg-black transition-colors ${focused ? 'border-[#FFB300] ring-1 ring-[#FFB300]' : 'border-white/20'}`}>
          <div className="flex items-center px-3.5 py-2.5 gap-3">
            <Search className={`w-4 h-4 shrink-0 ${focused ? 'text-[#FFB300]' : 'text-white/40'}`} />
            <input
              type="text"
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="FILTER BY STATION NAME OR CODE (E.G. NDLS, KANPUR, CNB)..."
              className="w-full bg-transparent text-white placeholder:text-white/30 text-xs sm:text-sm font-sans tracking-wide focus:outline-none uppercase"
              aria-label="Filter stations"
              autoFocus
            />
            {filterQuery && (
              <button onClick={() => setFilterQuery('')} className="text-[11px] font-sora uppercase text-white/50 hover:text-white border border-white/10 px-2 py-0.5">
                CLEAR
              </button>
            )}
          </div>
        </div>

        {/* Station grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-14 bg-white/5 animate-pulse border border-white/10" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-[#111111] border border-white/10 space-y-3">
            <p className="text-xs text-white/50 font-sora uppercase tracking-wider">[ NO_STATIONS_MATCHED: "{filterQuery.toUpperCase()}" ]</p>
            <button onClick={() => setFilterQuery('')} className="px-3 py-1 border border-white/20 hover:bg-[#FFB300] hover:text-black text-white text-xs font-sora uppercase">CLEAR_FILTER</button>
          </div>
        ) : (
          <>
            <p className="text-[11px] text-white/40 font-sora uppercase tracking-wider">
              {filtered.length < stations.length ? `SHOWING ${filtered.length} OF ${stations.length} STATIONS` : `ALL ${stations.length.toLocaleString()} STATIONS`}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin">
              {filtered.slice(0, 300).map(station => (
                <button
                  key={station.code}
                  onClick={() => navigate(`/admin/${station.code}`)}
                  className="flex items-center justify-between px-3 py-3 bg-[#111111] hover:bg-[#FFB300] hover:text-black border border-white/10 hover:border-[#FFB300] transition-colors group text-left"
                >
                  <div>
                    <div className="text-xs font-sora font-bold text-white group-hover:text-black tracking-wider">{station.code}</div>
                    <div className="text-[11px] text-white/60 group-hover:text-black/70 font-sans truncate max-w-[14ch]">{station.name}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-black shrink-0" />
                </button>
              ))}
              {filtered.length > 300 && (
                <div className="col-span-full text-center text-[11px] text-white/30 font-sora uppercase py-3">
                  + {filtered.length - 300} more — narrow your filter
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

// Arrivals board (/admin/:stationCode)
function ArrivalsBoard({ stationCode }) {
  const navigate = useNavigate();
  const [arrivals, setArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const pollingRef = useRef(null);

  const fetchArrivals = useCallback(async () => {
    try {
      const data = await getAdminStationArrivals(stationCode);
      setArrivals(data || []);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError('Failed to load arrivals. Retrying...');
    } finally {
      setLoading(false);
    }
  }, [stationCode]);

  useEffect(() => {
    setLoading(true);
    setArrivals([]);
    setError(null);
    fetchArrivals();
    pollingRef.current = setInterval(fetchArrivals, 12000); // auto-refresh every 12 seconds
    return () => clearInterval(pollingRef.current);
  }, [fetchArrivals]);

  const stationDisplayName = arrivals[0]?.direction?.replace('Towards ', '') || stationCode;

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-black text-white font-sans">
      <div className="w-full h-[2px] bg-[#FFB300]" />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 space-y-6">

        {/* Breadcrumb + Header */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-1.5 text-[11px] font-sora uppercase tracking-wider text-white/50 hover:text-[#FFB300] transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            STATION_PICKER
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 text-xs font-sora uppercase tracking-[0.1em] text-white/60">
                <span className="w-2 h-2 bg-[#FFB300] inline-block" />
                <span className="text-white font-semibold">[ STATION_ADMIN ]</span>
                <span className="text-white/30">|</span>
                <span>LIVE ARRIVALS</span>
              </div>
              <h1 className="font-sora font-bold text-2xl sm:text-3xl text-white tracking-tight">
                <span className="text-[#FFB300]">[{stationCode}]</span> ARRIVALS BOARD
              </h1>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Auto-refresh indicator */}
              <div className="flex items-center gap-1.5 text-[10px] font-sora uppercase text-white/40 border border-white/10 px-2.5 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                AUTO-REFRESH 12s
              </div>
              {lastUpdated && (
                <div className="flex items-center gap-1.5 text-[10px] font-sora uppercase text-white/30">
                  <Clock className="w-3 h-3" />
                  UPDATED {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              )}
              <button
                onClick={fetchArrivals}
                className="flex items-center gap-1.5 px-2.5 py-1.5 border border-white/20 text-[11px] font-sora uppercase text-white/60 hover:text-white hover:border-white/40 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                REFRESH
              </button>
            </div>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="p-3 bg-amber-950/40 border border-amber-800 text-[#FFB300] text-xs font-sora uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Arrivals Table */}
        <div className="overflow-x-auto border border-white/10">
          <table className="w-full text-xs font-sans border-collapse">
            <thead>
              <tr className="bg-[#111111] border-b border-white/20 text-[11px] font-sora uppercase tracking-widest text-white/50">
                <th className="text-left px-3 py-3">TRAIN</th>
                <th className="text-left px-3 py-3">PLATFORM</th>
                <th className="text-left px-3 py-3">EXP ARRIVAL</th>
                <th className="text-left px-3 py-3">DELAY</th>
                <th className="text-left px-3 py-3">HALT</th>
                <th className="text-left px-3 py-3">DIRECTION</th>
              </tr>
            </thead>
            <tbody>
              {loading && [...Array(8)].map((_, i) => <SkeletonRow key={i} />)}

              {!loading && arrivals.length === 0 && !error && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <p className="text-xs text-white/40 font-sora uppercase tracking-wider">
                      [ NO_TRAINS_CURRENTLY_SCHEDULED_THROUGH_{stationCode} ]
                    </p>
                  </td>
                </tr>
              )}

              {!loading && arrivals.map((arrival, idx) => (
                <motion.tr
                  key={`${arrival.train_number}-${idx}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                  className={`border-b border-white/10 transition-colors hover:bg-white/5 ${arrival.status === 'departed' ? 'opacity-50' : ''}`}
                >
                  {/* Train */}
                  <td className="px-3 py-3">
                    <Link
                      to={`/train/${arrival.train_number}`}
                      onClick={e => e.stopPropagation()}
                      className="font-bold text-white hover:text-[#FFB300] transition-colors font-sora text-sm"
                    >
                      [{arrival.train_number}]
                    </Link>
                    <div className="text-[10px] text-white/50 truncate max-w-[20ch]">{arrival.train_name}</div>
                  </td>

                  {/* Platform */}
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center justify-center w-7 h-7 border border-[#FFB300]/50 text-[#FFB300] font-sora font-bold text-xs">
                      {arrival.platform}
                    </span>
                  </td>

                  {/* Expected Arrival (clock format) */}
                  <td className="px-3 py-3">
                    <div className="font-mono text-white text-sm font-bold">
                      {offsetToTime(arrival.scheduled_arrival_offset_min, arrival.predicted_delay_min)}
                    </div>
                    <div className="text-[10px] text-white/40 font-mono">
                      SCH: {offsetToTime(arrival.scheduled_arrival_offset_min)}
                    </div>
                  </td>

                  {/* Delay status badge */}
                  <td className="px-3 py-3">
                    <StatusBadge status={arrival.status} />
                    {arrival.predicted_delay_min > 0 && arrival.status !== 'departed' && (
                      <div className="text-[10px] text-[#FFB300] font-mono mt-0.5">+{arrival.predicted_delay_min}m</div>
                    )}
                  </td>

                  {/* Halt duration */}
                  <td className="px-3 py-3">
                    <span className={`font-mono text-sm ${arrival.halt_min > 0 ? 'text-white' : 'text-white/30'}`}>
                      {arrival.halt_min > 0 ? `${arrival.halt_min}m` : '—'}
                    </span>
                  </td>

                  {/* Direction */}
                  <td className="px-3 py-3">
                    <span className="text-[11px] text-white/60 truncate max-w-[16ch] block">{arrival.direction}</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && arrivals.length > 0 && (
          <p className="text-[10px] text-white/30 font-sora uppercase tracking-wider text-right">
            SHOWING {arrivals.length} UPCOMING ARRIVALS · SORTED BY PREDICTED ARRIVAL TIME · SERVER-SORTED
          </p>
        )}
      </section>
    </div>
  );
}

// Root AdminPage — dispatches based on :stationCode param
export default function AdminPage() {
  const { stationCode } = useParams();
  if (stationCode) return <ArrivalsBoard stationCode={stationCode.toUpperCase()} />;
  return <StationPickerView />;
}
