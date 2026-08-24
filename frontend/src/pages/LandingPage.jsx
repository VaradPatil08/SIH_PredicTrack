import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Train, 
  ArrowRight, 
  Clock, 
  Zap, 
  ShieldCheck, 
  Radio, 
  Activity, 
  Compass, 
  MapPin, 
  TrendingUp, 
  AlertCircle,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { getTrains } from '../services/api';
import { TrainCardSkeleton } from '../components/SkeletonLoader';

export default function LandingPage() {
  const navigate = useNavigate();
  const [trains, setTrains] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    async function loadTrains() {
      try {
        setLoading(true);
        const data = await getTrains();
        setTrains(data || []);
      } catch (err) {
        setError('Unable to reach train directory. Showing cached express services.');
      } finally {
        setLoading(false);
      }
    }
    loadTrains();
  }, []);

  // Filter trains by number or name or origin or destination
  const filteredTrains = trains.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      t.train_number.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      (t.origin && t.origin.toLowerCase().includes(q)) ||
      (t.destination && t.destination.toLowerCase().includes(q))
    );
  });

  const handleSelectTrain = (trainNumber) => {
    navigate(`/train/${trainNumber}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && filteredTrains.length > 0) {
      handleSelectTrain(filteredTrains[0].train_number);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      
      {/* Top Banner / Ticker */}
      <div className="bg-gradient-to-r from-rail-navy via-rail-card to-rail-navy border-b border-rail-border/80 py-2.5 px-4 text-xs font-mono text-rail-muted">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 font-semibold">LIVE SECTION TELEMETRY:</span>
            <span>Western, Northern & Eastern Railway Corridors Connected</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-slate-400">
            <span>Model: <strong className="text-rail-yellow">XGB-Ensemble v3.2</strong></span>
            <span>Avg ETA Latency: <strong className="text-emerald-400">&lt; 140ms</strong></span>
            <span>SIH 2026</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24 overflow-hidden">
        
        {/* Background Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-rail-yellow/10 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto text-center space-y-6">
          
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rail-card border border-rail-border shadow-md"
          >
            <span className="flex h-2 w-2 rounded-full bg-rail-yellow animate-pulse"></span>
            <span className="text-xs font-semibold text-rail-yellow tracking-wide uppercase">
              Smart India Hackathon 2026 Project
            </span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight"
          >
            Dynamic ML ETA Predictions for <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rail-yellow via-amber-300 to-amber-500">
              Indian Coaching Trains
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-rail-muted max-w-2xl mx-auto leading-relaxed"
          >
            Say goodbye to static timetables. RailPulse continuously models sectional track occupancy, 
            signal precedence, and cascade delays to predict real arrival times down to the minute.
          </motion.p>

          {/* Interactive Search Bar Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="max-w-2xl mx-auto pt-4 text-left"
          >
            <div className={`relative rounded-2xl bg-rail-card/90 border transition-all duration-300 shadow-2xl p-2 sm:p-2.5 ${
              isSearchFocused 
                ? 'border-rail-yellow ring-4 ring-rail-yellow/10 shadow-amber-500/10' 
                : 'border-rail-border hover:border-slate-600'
            }`}>
              <div className="flex items-center gap-3 px-3">
                <Search className={`w-5 h-5 transition-colors ${isSearchFocused ? 'text-rail-yellow' : 'text-rail-muted'}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter Train Number (e.g. 12951) or Name (Rajdhani, Vande Bharat)..."
                  className="w-full bg-transparent text-white placeholder:text-rail-muted text-sm sm:text-base font-medium focus:outline-none py-2"
                  aria-label="Search Indian Railway trains"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-rail-muted hover:text-white px-2 py-1 rounded bg-rail-dark border border-rail-border"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={() => filteredTrains.length > 0 && handleSelectTrain(filteredTrains[0].train_number)}
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rail-yellow hover:bg-rail-yellowBright text-rail-dark font-bold text-xs tracking-wider uppercase transition-colors shrink-0 shadow-md"
                >
                  <span>Track</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Suggestions Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-3 text-xs">
              <span className="text-rail-muted font-mono flex items-center gap-1">
                <Zap className="w-3 h-3 text-rail-yellow" /> Popular:
              </span>
              {[
                { number: '12951', label: '12951 Mumbai Rajdhani' },
                { number: '22436', label: '22436 Vande Bharat' },
                { number: '12009', label: '12009 Shatabdi' },
                { number: '12301', label: '12301 Howrah Rajdhani' },
              ].map((chip) => (
                <button
                  key={chip.number}
                  onClick={() => handleSelectTrain(chip.number)}
                  className="px-2.5 py-1 rounded-lg bg-rail-card/70 hover:bg-rail-navy border border-rail-border hover:border-rail-yellow/50 text-slate-300 hover:text-rail-yellow transition-all font-mono text-[11px]"
                >
                  {chip.label}
                </button>
              ))}
            </div>

          </motion.div>

        </div>
      </section>

      {/* Train Directory / Live Results Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-rail-border">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Train className="w-5 h-5 text-rail-yellow" />
              <span>Available Coaching Trains</span>
            </h2>
            <p className="text-xs text-rail-muted">
              {searchQuery ? `Matching results for "${searchQuery}"` : 'Select any train to view live route telemetry & dynamic ETA prediction'}
            </p>
          </div>

          <span className="text-xs font-mono text-slate-400 bg-rail-card px-3 py-1.5 rounded-lg border border-rail-border self-start sm:self-auto">
            Showing <strong className="text-rail-yellow">{filteredTrains.length}</strong> express trains
          </span>
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <TrainCardSkeleton key={n} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredTrains.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-rail-card/40 border border-rail-border space-y-3">
            <AlertCircle className="w-10 h-10 text-rail-muted mx-auto" />
            <h3 className="text-white font-semibold text-base">No trains found matching "{searchQuery}"</h3>
            <p className="text-xs text-rail-muted max-w-sm mx-auto">
              Try searching by train number (e.g. 12951, 22436) or major cities like Mumbai, Delhi, Varanasi, Howrah.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-2 px-3 py-1.5 rounded-lg bg-rail-navy border border-rail-border text-rail-yellow text-xs font-mono font-medium"
            >
              Reset Search Filter
            </button>
          </div>
        )}

        {/* Train Cards Grid with Framer Motion Layout Animations */}
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence>
            {!loading && filteredTrains.map((train) => (
              <motion.div
                key={train.train_number}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
                onClick={() => handleSelectTrain(train.train_number)}
                className="group p-5 rounded-2xl bg-rail-card/70 hover:bg-rail-card border border-rail-border hover:border-rail-yellow/50 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-amber-500/5 flex flex-col justify-between"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleSelectTrain(train.train_number)}
              >
                <div>
                  
                  {/* Top Bar: Train Number Badge & Type */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-rail-yellow text-rail-dark font-mono font-extrabold text-sm shadow-sm group-hover:scale-105 transition-transform">
                        {train.train_number}
                      </span>
                      {train.type && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rail-navy border border-rail-border text-slate-300">
                          {train.type}
                        </span>
                      )}
                    </div>

                    <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      LIVE
                    </span>
                  </div>

                  {/* Train Name */}
                  <h3 className="font-bold text-base text-white group-hover:text-rail-yellow transition-colors leading-snug line-clamp-2 mb-3">
                    {train.name}
                  </h3>

                  {/* Route Origin -> Destination */}
                  <div className="p-3 rounded-xl bg-rail-dark/60 border border-rail-border/60 text-xs space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-slate-300">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
                      <span className="truncate">{train.origin || 'Source'}</span>
                    </div>
                    <div className="w-0.5 h-2 bg-rail-border ml-1"></div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <div className="w-2 h-2 rounded-full bg-rail-yellow shrink-0"></div>
                      <span className="truncate">{train.destination || 'Destination'}</span>
                    </div>
                  </div>

                </div>

                {/* Card Footer Action */}
                <div className="pt-3 border-t border-rail-border/60 flex items-center justify-between text-xs font-mono">
                  <span className="text-rail-muted">
                    {train.total_distance_km ? `${train.total_distance_km} km route` : 'Full Section'}
                  </span>
                  <div className="flex items-center gap-1 text-rail-yellow font-bold group-hover:translate-x-1 transition-transform">
                    <span>Track Live</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

      </section>

      {/* Feature Value Grid */}
      <section className="bg-rail-card/30 border-t border-rail-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <h2 className="text-2xl font-bold text-white">Why Dynamic ML Prediction?</h2>
            <p className="text-xs sm:text-sm text-rail-muted">
              Static railway timetables do not account for dynamic variables on the tracks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-rail-card/60 border border-rail-border space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-rail-yellow">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Section Congestion Tracking</h3>
              <p className="text-xs text-rail-muted leading-relaxed">
                Models live block-section clearance, freight rake crossings, and headway intervals to anticipate delays before they compound.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-rail-card/60 border border-rail-border space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Station-by-Station Root Causes</h3>
              <p className="text-xs text-rail-muted leading-relaxed">
                Transparent attribution explaining why delays occur — platform occupancy, speed restrictions, OHE maintenance, or weather visibility.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-rail-card/60 border border-rail-border space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Historical Recovery Curves</h3>
              <p className="text-xs text-rail-muted leading-relaxed">
                Learns typical slack time recovery across quad-track sections (e.g. Kota-Mathura) where express trains frequently make up lost minutes.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

