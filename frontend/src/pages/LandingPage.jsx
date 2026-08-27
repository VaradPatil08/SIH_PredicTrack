import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, CornerDownLeft, Star, Ticket, AlertCircle, RefreshCw, ChevronDown } from 'lucide-react';
import { getTrains, lookupPNR } from '../services/api';
import { TrainRowSkeleton } from '../components/SkeletonLoader';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { favorites, isFavorite, toggleFavorite, isAuthenticated, openLoginModal } = useAuth();

  const [trains, setTrains] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('train'); // 'train' | 'pnr'
  const [pnrQuery, setPnrQuery] = useState('');
  const [pnrLoading, setPnrLoading] = useState(false);
  const [pnrResult, setPnrResult] = useState(null);
  const [activeDirectoryTab, setActiveDirectoryTab] = useState('all'); // 'all' | 'saved'
  const [loading, setLoading] = useState(true);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  // Homepage shows only featured trains by default.
  // The full network is one click away via "SHOW FULL NETWORK".
  const [showAllTrains, setShowAllTrains] = useState(false);

  useEffect(() => {
    async function loadTrains() {
      try {
        setLoading(true);
        const data = await getTrains();
        setTrains(data || []);
      } catch (err) {
        console.error('Failed to load trains directory:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTrains();
  }, []);


  // Derive featured count dynamically from API data — no hardcoded train numbers
  const featuredCount = trains.filter(t => Boolean(t.featured)).length;
  const isSearchActive = searchQuery.trim().length > 0;

  const filteredTrains = trains.filter((t) => {
    if (activeDirectoryTab === 'saved' && !favorites.includes(t.train_number)) return false;
    // When not showing all and no search is active, restrict to featured trains on homepage.
    // A search query automatically reveals the full network so users can find any train.
    if (!showAllTrains && !isSearchActive && activeDirectoryTab !== 'saved') {
      if (!t.featured) return false;
    }
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      t.train_number.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      (t.origin && t.origin.toLowerCase().includes(q)) ||
      (t.destination && t.destination.toLowerCase().includes(q))
    );
  });


  const savedTrainsList = trains.filter(t => favorites.includes(t.train_number));

  const handleSelectTrain = (trainNumber) => {
    navigate(`/train/${trainNumber}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (searchMode === 'train' && filteredTrains.length > 0) {
        handleSelectTrain(filteredTrains[0].train_number);
      } else if (searchMode === 'pnr' && pnrQuery.trim().length === 10) {
        handlePNRLookup();
      }
    }
  };

  const handlePNRLookup = async (e) => {
    if (e) e.preventDefault();
    const cleanPnr = pnrQuery.trim();
    if (cleanPnr.length !== 10) {
      setPnrResult({
        found: false,
        message: 'Please enter a valid 10-digit Indian Railways PNR number.'
      });
      return;
    }

    try {
      setPnrLoading(true);
      const res = await lookupPNR(cleanPnr);
      setPnrResult(res);
      if (res.found && res.train_number) {
        navigate(`/train/${res.train_number}`);
      }
    } catch (err) {
      setPnrResult({
        found: false,
        message: err.message || "PNR lookup isn't available yet — please enter your train number manually."
      });
    } finally {
      setPnrLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col justify-between font-sans bg-black text-white">
      
      {/* 2px Horizontal Signal Amber Section Divider */}
      <div className="w-full h-[2px] bg-[#FFB300]" />

      {/* Hero Section with Sora Display Headings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8 w-full">
        <div className="space-y-6 max-w-4xl">
          
          {/* Status Flag with Signal-Light Square */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.76, 0, 0.24, 1] }}
            className="flex items-center gap-2.5 text-xs font-sora uppercase tracking-[0.1em] text-white/60"
          >
            <span className="w-2 h-2 bg-[#FFB300] inline-block" />
            <span className="text-white font-semibold">[ SYSTEM_ACTIVE ]</span>
            <span className="text-white/30">|</span>
            <span>INDIAN RAILWAYS ML TELEMETRY</span>
          </motion.div>

          {/* Display Wordmark Title in Sora */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="font-sora font-bold text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.1]"
          >
            DYNAMIC ML TRAIN ETA <br />
            <span className="text-[#FFB300]">// CONTROL DIRECTORY</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-xs sm:text-sm text-white/70 max-w-2xl leading-relaxed font-sans"
          >
            Real-time sectional track occupancy, junction precedence modeling, and cascade delay mitigation for coaching services. Select a train to view live GIS telemetry.
          </motion.p>

          {/* Search Mode Selector (Train Number vs PNR Number) */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="pt-2 space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="text-[12px] font-sora font-medium uppercase tracking-[0.1em] text-white/70">
                [ QUERY_MODE ]:
              </div>
              <div className="flex border border-white/20 p-0.5 bg-[#111111] text-xs font-sora">
                <button
                  onClick={() => { setSearchMode('train'); setPnrResult(null); }}
                  className={`px-3 py-1 uppercase tracking-wider transition-colors ${
                    searchMode === 'train' ? 'bg-[#FFB300] text-black font-bold' : 'text-white/60 hover:text-white'
                  }`}
                >
                  01. TRAIN_NUMBER
                </button>
                <button
                  onClick={() => setSearchMode('pnr')}
                  className={`px-3 py-1 uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                    searchMode === 'pnr' ? 'bg-[#FFB300] text-black font-bold' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>02. PNR_LOOKUP</span>
                </button>
              </div>
            </div>

            {/* Mode A: Train Number Search */}
            {searchMode === 'train' && (
              <div className="space-y-3">
                <div className={`relative border bg-black transition-colors ${
                  isSearchFocused ? 'border-[#FFB300] ring-1 ring-[#FFB300]' : 'border-white/20'
                }`}>
                  <div className="flex items-center px-3.5 py-2.5 gap-3">
                    <Search className={`w-4 h-4 shrink-0 ${isSearchFocused ? 'text-[#FFB300]' : 'text-white/40'}`} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                      onKeyDown={handleKeyDown}
                      placeholder="QUERY_BY_TRAIN_NUMBER_OR_NAME (E.G. 12951, VANDE BHARAT, RAJDHANI)..."
                      className="w-full bg-transparent text-white placeholder:text-white/30 text-xs sm:text-sm font-sans tracking-wide focus:outline-none uppercase"
                      aria-label="Search trains by number or name"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-[11px] font-sora uppercase text-white/50 hover:text-white border border-white/10 px-2 py-0.5"
                      >
                        CLEAR
                      </button>
                    )}
                    <button
                      onClick={() => filteredTrains.length > 0 && handleSelectTrain(filteredTrains[0].train_number)}
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-black border border-white/20 hover:bg-[#FFB300] hover:text-black hover:border-[#FFB300] text-white font-sora font-bold text-xs uppercase tracking-wider transition-colors shrink-0"
                    >
                      <span>EXECUTE</span>
                      <CornerDownLeft className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Quick Filter Chips */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-sora uppercase">
                  <span className="text-white/40 tracking-wider">[ PRESETS ]:</span>
                  {[
                    { number: '12951', label: '12951 RAJDHANI' },
                    { number: '22436', label: '22436 VANDE BHARAT' },
                    { number: '12009', label: '12009 SHATABDI' },
                    { number: '12301', label: '12301 HOWRAH EXP' },
                    { number: '12841', label: '12841 COROMANDEL' },
                    { number: '12621', label: '12621 TAMIL NADU' },
                    { number: '20608', label: '20608 MYSURU VB' },
                    { number: '17057', label: '17057 DEVAGIRI' },
                  ].map((chip) => (
                    <button
                      key={chip.number}
                      onClick={() => handleSelectTrain(chip.number)}
                      className="px-2 py-0.5 bg-[#111111] hover:bg-[#FFB300] hover:text-black text-white/80 transition-colors focus-visible:ring-1 focus-visible:ring-[#FFB300]"
                    >
                      {chip.label}
                    </button>
                  ))}
                  <span className="text-white/30 text-[10px]">+ {Math.max(0, trains.length - 8)} more via search</span>
                </div>

              </div>
            )}

            {/* Mode B: PNR Lookup */}
            {searchMode === 'pnr' && (
              <div className="space-y-3">
                <form onSubmit={handlePNRLookup} className="space-y-3">
                  <div className={`relative border bg-black transition-colors ${
                    isSearchFocused ? 'border-[#FFB300] ring-1 ring-[#FFB300]' : 'border-white/20'
                  }`}>
                    <div className="flex items-center px-3.5 py-2.5 gap-3">
                      <Ticket className={`w-4 h-4 shrink-0 ${isSearchFocused ? 'text-[#FFB300]' : 'text-white/40'}`} />
                      <input
                        type="text"
                        maxLength={10}
                        value={pnrQuery}
                        onChange={(e) => {
                          setPnrQuery(e.target.value.replace(/\D/g, ''));
                          setPnrResult(null);
                        }}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        onKeyDown={handleKeyDown}
                        placeholder="ENTER_10_DIGIT_PNR_NUMBER (E.G. 4234567890)..."
                        className="w-full bg-transparent text-white placeholder:text-white/30 text-xs sm:text-sm font-mono tracking-widest focus:outline-none"
                        aria-label="Search by 10-digit PNR number"
                      />
                      <span className="text-[11px] font-mono text-white/40 shrink-0">
                        [{pnrQuery.length}/10]
                      </span>
                      <button
                        type="submit"
                        disabled={pnrLoading || pnrQuery.length !== 10}
                        className="flex items-center gap-1.5 px-4 py-1 bg-black border border-white/20 hover:bg-[#FFB300] hover:text-black hover:border-[#FFB300] text-white font-sora font-bold text-xs uppercase tracking-wider transition-colors shrink-0 disabled:opacity-40"
                      >
                        {pnrLoading ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>RESOLVING...</span>
                          </>
                        ) : (
                          <>
                            <span>LOOKUP</span>
                            <CornerDownLeft className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>

                {/* PNR Response Callout */}
                {pnrResult && !pnrResult.found && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-[#111111] border border-white/20 border-l-4 border-l-[#FFB300] space-y-2 text-xs font-sans"
                  >
                    <div className="flex items-center gap-2 text-[#FFB300] font-sora font-bold uppercase tracking-wider">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>[ PNR_LOOKUP_STATUS: STUB_NOTICE ]</span>
                    </div>
                    <p className="text-white/80 leading-relaxed font-sans">
                      {pnrResult.message}
                    </p>
                    <div className="pt-1">
                      <button
                        onClick={() => { setSearchMode('train'); setPnrResult(null); }}
                        className="px-3 py-1 bg-black border border-white/20 hover:bg-[#FFB300] hover:text-black text-white font-sora text-[11px] font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
                      >
                        <span>› SWITCH_TO_MANUAL_TRAIN_NUMBER_ENTRY</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

          </motion.div>

        </div>
      </section>

      {/* 2px Horizontal Signal Amber Section Divider before Departure Board */}
      <div className="w-full h-[2px] bg-[#FFB300]" />

      {/* Train Departure Board Table Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        
        {/* Table Title & Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/20 text-xs font-sora uppercase tracking-[0.1em] text-white/70">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-[#FFB300] inline-block" />
            <span className="text-white font-bold">DEPARTURE_BOARD // DIRECTORY</span>
            {!showAllTrains && !searchQuery.trim() && activeDirectoryTab !== 'saved' && (
              <span className="text-[10px] text-white/40 border border-white/10 px-1.5 py-0.5">
                FEATURED · {featuredCount}/{trains.length} SERVICES
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Show Full Network / Show Featured toggle — only when on "all" tab without active search */}
            {activeDirectoryTab !== 'saved' && !searchQuery.trim() && (
              <button
                onClick={() => setShowAllTrains(v => !v)}
                className="flex items-center gap-1.5 px-2.5 py-0.5 border border-white/20 text-[11px] hover:bg-[#FFB300] hover:text-black hover:border-[#FFB300] text-white/70 transition-colors"
              >
                <ChevronDown className={`w-3 h-3 transition-transform ${showAllTrains ? 'rotate-180' : ''}`} />
                {showAllTrains ? `SHOW FEATURED [${featuredCount}]` : `SHOW FULL NETWORK [${trains.length}]`}
              </button>
            )}


            {/* Directory Filter Tabs: All vs Saved Favorites */}
            <div className="flex border border-white/20 p-0.5 bg-[#111111] text-[11px]">
              <button
                onClick={() => setActiveDirectoryTab('all')}
                className={`px-2.5 py-0.5 uppercase tracking-wider transition-colors ${
                  activeDirectoryTab === 'all' ? 'bg-[#FFB300] text-black font-bold' : 'text-white/60 hover:text-white'
                }`}
              >
                {showAllTrains || searchQuery.trim() ? `ALL [${filteredTrains.length}]` : `FEATURED [${filteredTrains.length}]`}
              </button>
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    openLoginModal();
                  } else {
                    setActiveDirectoryTab('saved');
                  }
                }}
                className={`px-2.5 py-0.5 uppercase tracking-wider transition-colors flex items-center gap-1 ${
                  activeDirectoryTab === 'saved' ? 'bg-[#FFB300] text-black font-bold' : 'text-white/60 hover:text-white'
                }`}
              >
                <Star className="w-3 h-3 text-[#FFB300] fill-[#FFB300]" />
                <span>MY_TRAINS [{favorites.length}]</span>
              </button>
            </div>
          </div>
        </div>


        {/* Departure Board Table Headers (Desktop) */}
        <div className="hidden md:grid grid-cols-12 gap-4 py-2.5 px-4 bg-[#111111] border-b border-white/10 text-[11px] text-white/50 font-sora tracking-widest uppercase">
          <div className="col-span-2">TRAIN_NO</div>
          <div className="col-span-4">SERVICE_IDENTIFIER</div>
          <div className="col-span-4">ORIGIN → DESTINATION</div>
          <div className="col-span-2 text-right">ACTION</div>
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="divide-y divide-white/10 border-b border-white/10">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <TrainRowSkeleton key={n} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredTrains.length === 0 && (
          <div className="p-12 text-center border-b border-white/10 space-y-3 bg-[#111111]">
            <p className="text-xs text-white/50 tracking-wider font-sora uppercase">
              {activeDirectoryTab === 'saved'
                ? '[ NO_SAVED_FAVORITES_FOUND // STAR_A_TRAIN_TO_ADD_HERE ]'
                : `[ NO_MATCHES_FOUND_FOR_QUERY: "${searchQuery.toUpperCase()}" ]`}
            </p>
            {activeDirectoryTab === 'saved' ? (
              <button
                onClick={() => setActiveDirectoryTab('all')}
                className="px-3 py-1 border border-white/20 hover:bg-[#FFB300] hover:text-black hover:border-[#FFB300] text-white text-xs font-sora uppercase"
              >
                VIEW_ALL_TRAINS
              </button>
            ) : (
              <button
                onClick={() => setSearchQuery('')}
                className="px-3 py-1 border border-white/20 hover:bg-[#FFB300] hover:text-black hover:border-[#FFB300] text-white text-xs font-sora uppercase"
              >
                RESET_FILTER
              </button>
            )}
          </div>
        )}

        {/* Staggered Monospace Table Rows with Framer Motion Layout Reordering */}
        <div className="divide-y divide-white/10 border-b border-white/10">
          <AnimatePresence>
            {!loading && filteredTrains.map((train, idx) => (
              <motion.div
                key={train.train_number}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.2), ease: [0.76, 0, 0.24, 1] }}
                onClick={() => handleSelectTrain(train.train_number)}
                className="group py-3.5 px-4 bg-black hover:bg-[#111111] transition-colors duration-150 cursor-pointer grid grid-cols-1 md:grid-cols-12 gap-3 items-center font-sans text-xs"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleSelectTrain(train.train_number)}
              >
                {/* Train Number & Favorite Status */}
                <div className="col-span-2 flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(train.train_number);
                    }}
                    className="p-1 text-white/30 hover:text-[#FFB300] transition-colors"
                    title={isFavorite(train.train_number) ? 'Remove from Saved Trains' : 'Save to My Trains'}
                    aria-label="Toggle favorite"
                  >
                    <Star className={`w-3.5 h-3.5 ${
                      isFavorite(train.train_number) ? 'text-[#FFB300] fill-[#FFB300]' : ''
                    }`} />
                  </button>
                  <span className="font-bold text-white group-hover:text-[#FFB300] transition-colors tracking-wide font-sans text-sm">
                    [{train.train_number}]
                  </span>
                  <span className="text-[10px] text-white/40 md:hidden font-sora uppercase">
                    {train.type}
                  </span>
                </div>

                {/* Train Name & Type */}
                <div className="col-span-4">
                  <div className="text-white group-hover:text-[#FFB300] transition-colors font-medium text-sm truncate">
                    {train.name}
                  </div>
                  <div className="text-[11px] text-white/40 truncate hidden md:block">
                    {train.zone || 'INDIAN RAILWAYS'} • {train.type || 'EXPRESS'}
                  </div>
                </div>

                {/* Origin -> Destination */}
                <div className="col-span-4 text-white/70 text-xs">
                  <span className="text-white font-medium">{train.origin}</span>
                  <span className="text-[#FFB300] mx-1.5">→</span>
                  <span className="text-white font-medium">{train.destination}</span>
                  {train.total_distance_km && (
                    <span className="text-white/40 text-[11px] ml-2">
                      ({train.total_distance_km} KM)
                    </span>
                  )}
                </div>

                {/* Action Link */}
                <div className="col-span-2 flex items-center justify-end text-right">
                  <span className="inline-flex items-center gap-1 text-[#FFB300] font-sora font-semibold text-xs tracking-wider group-hover:underline">
                    <span>TRACK</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>

              </motion.div>
            ))}
          </AnimatePresence>
        </div>

      </section>

    </div>
  );
}


