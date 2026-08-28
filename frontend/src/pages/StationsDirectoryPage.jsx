import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  Star, 
  ArrowRight, 
  Table, 
  LayoutGrid, 
  Building2, 
  Sparkles,
  MapPin,
  Clock,
  Radio,
  Layers
} from 'lucide-react';
import { getStations, searchStations } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';

// Staggered motion container variants
const gridContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 }
  }
};

const cardVariant = {
  hidden: { opacity: 0, y: 12 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
  }
};

const SEARCH_PRESETS = ['Major Junctions', 'Northern', 'Western', 'Southern', 'Eastern', 'Central'];

export default function StationsDirectoryPage() {
  const navigate = useNavigate();
  const { t } = useSettings();
  const { isAuthenticated, openLoginModal } = useAuth();

  const [stations, setStations] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [activeTab, setActiveTab] = useState('featured'); // 'featured' | 'all' | 'saved'
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  // Local saved stations in localStorage
  const [savedStations, setSavedStations] = useState(() => {
    try {
      const saved = localStorage.getItem('predictrack_saved_stations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const debounceTimer = useRef(null);

  const toggleSaveStation = (code) => {
    setSavedStations((prev) => {
      const next = prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code];
      try {
        localStorage.setItem('predictrack_saved_stations', JSON.stringify(next));
      } catch (err) {
        console.error('Failed to save station favorites:', err);
      }
      return next;
    });
  };

  const isStationSaved = (code) => savedStations.includes(code);

  // Initial load: featured major junctions
  useEffect(() => {
    async function loadInitial() {
      try {
        setInitialLoading(true);
        const data = await getStations({ featured: true });
        setStations(data || []);
      } catch (err) {
        console.error('Failed to load stations:', err);
      } finally {
        setInitialLoading(false);
      }
    }
    loadInitial();
  }, []);

  // Debounced search
  const runSearch = useCallback(async (q) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    try {
      const results = await searchStations(trimmed, 30);
      setSearchResults(results || []);
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => runSearch(val), 300);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
  };

  const handleSelectStation = (stationCode) => {
    navigate(`/station/${stationCode.toUpperCase()}`);
  };

  // Determine displayed station list
  const isSearchActive = searchQuery.trim().length >= 2;
  let displayedStations = [];

  if (isSearchActive) {
    displayedStations = searchResults;
  } else if (activeTab === 'saved') {
    displayedStations = stations.filter((s) => savedStations.includes(s.code));
  } else if (activeTab === 'all') {
    displayedStations = stations;
  } else {
    // 'featured' tab
    displayedStations = stations.filter((s) => s.featured);
  }

  return (
    <div className="min-h-screen bg-[#F5F6F8] dark:bg-[#0F172A] font-sans text-foreground dark:text-slate-100 transition-colors">
      
      {/* Hero / Directory Search Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 space-y-6">
        
        {/* Title & Tagline */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-navy/10 dark:bg-blue-900/40 text-navy dark:text-blue-400">
              <Building2 className="w-5 h-5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted dark:text-slate-400">
              Network Station Directory
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy dark:text-blue-400 tracking-tight">
            Station Live Boards & Platform Status
          </h1>
          <p className="text-xs sm:text-sm text-muted dark:text-slate-400">
            Real-time live arrival/departure boards, platform occupancy, and ML delay forecasts across Indian Railways junctions.
          </p>
        </div>

        {/* Search Bar Container */}
        <div className="p-4 sm:p-5 rounded-xl border border-border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted dark:text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search station by name (e.g. New Delhi, Howrah, Mumbai) or station code (NDLS, HWH, MMCT)..."
              className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-border dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-foreground dark:text-slate-100 placeholder:text-muted dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-foreground dark:text-slate-400 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted dark:text-slate-400 font-medium">Quick Filter:</span>
            {SEARCH_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  if (preset === 'Major Junctions') {
                    clearSearch();
                    setActiveTab('featured');
                  } else if (searchQuery.toLowerCase() === preset.toLowerCase()) {
                    clearSearch();
                  } else {
                    setSearchQuery(preset);
                    runSearch(preset);
                  }
                }}
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                  (preset === 'Major Junctions' && !searchQuery && activeTab === 'featured') ||
                  searchQuery.toLowerCase() === preset.toLowerCase()
                    ? 'bg-navy dark:bg-blue-600 text-white border-navy dark:border-blue-600 shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-muted dark:text-slate-300 border-border dark:border-slate-700 hover:border-slate-400'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

      </section>

      {/* Directory & Results Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full space-y-4">
        
        {/* Sub-header Bar: Segmented Tabs & Grid/Table Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          
          {/* Segmented Tab Pill Control */}
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center gap-1 text-xs">
              <button
                onClick={() => {
                  clearSearch();
                  setActiveTab('featured');
                }}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  !isSearchActive && activeTab === 'featured'
                    ? 'bg-white dark:bg-slate-900 text-navy dark:text-blue-300 shadow-xs'
                    : 'text-muted dark:text-slate-400 hover:text-foreground'
                }`}
              >
                Major Junctions ({stations.filter((s) => s.featured).length || 20})
              </button>

              <button
                onClick={() => {
                  clearSearch();
                  setActiveTab('all');
                }}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  !isSearchActive && activeTab === 'all'
                    ? 'bg-white dark:bg-slate-900 text-navy dark:text-blue-300 shadow-xs'
                    : 'text-muted dark:text-slate-400 hover:text-foreground'
                }`}
              >
                All Stations ({stations.length})
              </button>

              <button
                onClick={() => {
                  clearSearch();
                  setActiveTab('saved');
                }}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                  !isSearchActive && activeTab === 'saved'
                    ? 'bg-white dark:bg-slate-900 text-navy dark:text-blue-300 shadow-xs'
                    : 'text-muted dark:text-slate-400 hover:text-foreground'
                }`}
              >
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>My Saved ({savedStations.length})</span>
              </button>
            </div>

            {/* Active Search Result Pill */}
            {isSearchActive && (
              <span className="text-xs px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-navy dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold hidden md:inline-block">
                Search Results ({displayedStations.length})
              </span>
            )}
          </div>

          {/* Right View Toggle (Grid / List Table) */}
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center gap-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white dark:bg-slate-900 text-navy dark:text-blue-400 shadow-2xs' 
                    : 'text-muted dark:text-slate-400 hover:text-foreground'
                }`}
                title="Grid Card View"
                aria-label="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>

              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-white dark:bg-slate-900 text-navy dark:text-blue-400 shadow-2xs' 
                    : 'text-muted dark:text-slate-400 hover:text-foreground'
                }`}
                title="Table Directory View"
                aria-label="Table View"
              >
                <Table className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Loading Skeletons */}
        {(initialLoading || searchLoading) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="p-5 rounded-lg border border-border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card animate-pulse space-y-4">
                <div className="flex justify-between items-center">
                  <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
                </div>
                <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
                <div className="h-20 bg-slate-100 dark:bg-slate-800/60 rounded"></div>
                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded"></div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!initialLoading && !searchLoading && displayedStations.length === 0 && (
          <div className="p-12 text-center rounded-lg border border-dashed border-border dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-card">
            <Building2 className="w-10 h-10 text-muted dark:text-slate-500 mx-auto opacity-60" />
            <p className="text-sm font-semibold text-foreground dark:text-slate-200">
              {activeTab === 'saved'
                ? 'No saved stations found. Star any station to pin it to your saved list.'
                : `No stations matching "${searchQuery}"`}
            </p>
            {activeTab === 'saved' ? (
              <button
                onClick={() => setActiveTab('featured')}
                className="px-4 py-2 rounded-lg bg-navy dark:bg-blue-600 text-white text-xs font-semibold hover:bg-navy-light transition-all"
              >
                Browse Major Junctions
              </button>
            ) : (
              <button
                onClick={clearSearch}
                className="px-4 py-2 rounded-lg bg-navy dark:bg-blue-600 text-white text-xs font-semibold hover:bg-navy-light transition-all"
              >
                Reset Search
              </button>
            )}
          </div>
        )}

        {/* View Mode 1: 3-Column Responsive Card Grid */}
        {!initialLoading && !searchLoading && viewMode === 'grid' && displayedStations.length > 0 && (
          <motion.div 
            variants={gridContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {displayedStations.map((station) => {
                const isSaved = isStationSaved(station.code);

                return (
                  <motion.div
                    key={station.code}
                    variants={cardVariant}
                    layout
                    onClick={() => handleSelectStation(station.code)}
                    className="railway-card group relative p-5 rounded-lg border border-[#D9DEE5] dark:border-[#334155] bg-white dark:bg-[#1E293B] cursor-pointer flex flex-col justify-between space-y-4"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleSelectStation(station.code)}
                  >
                    
                    {/* Top Row: Save Icon + Station Code + Category Chip | Live Track Status Pill */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSaveStation(station.code);
                          }}
                          className="p-1 text-slate-300 hover:text-amber-500 dark:text-slate-600 dark:hover:text-amber-400 transition-colors"
                          title={isSaved ? 'Remove from Saved' : 'Save Station'}
                          aria-label="Toggle favorite station"
                        >
                          <Star className={`w-4 h-4 ${
                            isSaved ? 'text-amber-500 fill-amber-500' : ''
                          }`} />
                        </button>

                        <span className="font-mono font-bold text-[#17324D] dark:text-[#93C5FD] text-sm">
                          {station.code}
                        </span>

                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-[#667085] dark:text-[#94A3B8] border border-[#D9DEE5] dark:border-[#334155]">
                          {station.category || 'Junction'}
                        </span>
                      </div>

                      {/* Live Track Pill */}
                      <span className="text-[11px] font-semibold text-[#2E7D32] dark:text-emerald-400 flex items-center gap-1.5 shrink-0">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2E7D32] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2E7D32]"></span>
                        </span>
                        <span>Live Track</span>
                      </span>
                    </div>

                    {/* Title: Full Station Name */}
                    <div className="space-y-0.5">
                      <h2 className="font-bold text-base text-[#17324D] dark:text-[#93C5FD] group-hover:text-[#24476B] dark:group-hover:text-blue-300 transition-colors leading-snug line-clamp-1">
                        {station.name}
                      </h2>
                      <p className="text-xs text-[#667085] dark:text-[#94A3B8]">
                        {station.zone || 'Indian Railways'}
                      </p>
                    </div>

                    {/* Repurposed Nested Info Box (#F8FAFC / dark:slate-800) */}
                    <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/60 border border-[#D9DEE5] dark:border-slate-700 space-y-2 text-xs transition-colors group-hover:border-slate-300 dark:group-hover:border-slate-600">
                      
                      {/* Row 1: Platforms & Trains Today */}
                      <div className="flex items-center justify-between font-semibold text-[#1F2933] dark:text-slate-200 gap-1">
                        <span>Platforms: <strong className="text-[#17324D] dark:text-blue-400">{station.platforms}</strong></span>
                        <span className="text-slate-300 dark:text-slate-600">|</span>
                        <span>Trains today: <strong className="text-[#17324D] dark:text-blue-400">{station.trains_today}</strong></span>
                      </div>

                      {/* Row 2: Next Arrival & Avg Delay */}
                      <div className="flex items-center justify-between text-[11px] text-[#667085] dark:text-[#94A3B8] pt-1.5 border-t border-[#D9DEE5] dark:border-slate-700">
                        <span>Next arrival: <strong className="text-[#1F2933] dark:text-slate-200">{station.next_arrival_time || '14:32'}</strong></span>
                        <span>Avg delay: <strong className={station.avg_delay_min > 10 ? 'text-[#ED8B00] dark:text-amber-400' : 'text-[#2E7D32] dark:text-emerald-400'}>
                          {station.avg_delay_min} min
                        </strong></span>
                      </div>
                    </div>

                    {/* Footer Link: View Live Board */}
                    <div className="pt-1 flex items-center justify-between text-xs font-semibold text-[#17324D] dark:text-[#93C5FD]">
                      <span className="flex items-center gap-1.5 group-hover:text-[#24476B] dark:group-hover:text-blue-300 transition-colors">
                        <span>View Live Board</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                      </span>
                    </div>

                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* View Mode 2: Modern Tabular Directory View */}
        {!initialLoading && !searchLoading && viewMode === 'table' && displayedStations.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-lg border border-[#D9DEE5] dark:border-[#334155] bg-white dark:bg-[#1E293B] shadow-card overflow-hidden"
          >
            <div className="overflow-x-auto w-full">
              <div className="min-w-[680px]">
                
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 py-3 px-5 bg-slate-50 dark:bg-slate-800/80 border-b border-border dark:border-slate-800 text-xs font-semibold text-muted dark:text-slate-400">
                  <div className="col-span-3">Station Code</div>
                  <div className="col-span-4">Station & Division</div>
                  <div className="col-span-3">Traffic & Delay</div>
                  <div className="col-span-2 text-right">Action</div>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-border dark:divide-slate-800">
                  <AnimatePresence mode="popLayout">
                    {displayedStations.map((station, idx) => {
                      const isSaved = isStationSaved(station.code);

                      return (
                        <motion.div
                          key={station.code}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.2) }}
                          onClick={() => handleSelectStation(station.code)}
                          className="py-3.5 px-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer grid grid-cols-12 gap-3 items-center text-xs group"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && handleSelectStation(station.code)}
                        >
                          {/* Station Code & Favorite */}
                          <div className="col-span-3 flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSaveStation(station.code);
                              }}
                              className="p-1 text-slate-300 hover:text-amber-500 dark:text-slate-600 dark:hover:text-amber-400 transition-colors"
                              aria-label="Toggle favorite"
                            >
                              <Star className={`w-3.5 h-3.5 ${
                                isSaved ? 'text-amber-500 fill-amber-500' : ''
                              }`} />
                            </button>

                            <span className="font-mono font-bold text-[#17324D] dark:text-[#93C5FD] text-sm group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                              {station.code}
                            </span>

                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-muted dark:text-slate-300 border border-border dark:border-slate-700 hidden sm:inline-block">
                              {station.category || 'A1'}
                            </span>
                          </div>

                          {/* Station Name & Zone */}
                          <div className="col-span-4">
                            <div className="font-semibold text-foreground dark:text-slate-200 group-hover:text-navy dark:group-hover:text-blue-300 transition-colors truncate">
                              {station.name}
                            </div>
                            <div className="text-[11px] text-muted dark:text-slate-400 truncate">
                              {station.zone}
                            </div>
                          </div>

                          {/* Stats Info */}
                          <div className="col-span-3 text-xs text-muted dark:text-slate-400">
                            <div className="flex items-center gap-1 text-foreground dark:text-slate-200 font-medium truncate">
                              <span>{station.platforms} Platforms</span>
                              <span className="text-slate-300 dark:text-slate-600 mx-1">•</span>
                              <span>{station.trains_today} Trains</span>
                            </div>
                            <div className="text-muted dark:text-slate-400 text-[11px]">
                              Next: {station.next_arrival_time || '14:32'} • Avg delay: {station.avg_delay_min}m
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="col-span-2 flex items-center justify-end">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg bg-[#17324D] dark:bg-blue-600 text-white text-xs font-semibold hover:bg-[#24476B] dark:hover:bg-blue-500 transition-all shadow-xs group-hover:shadow-sm">
                              <span>Live Board</span>
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </span>
                          </div>

                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

              </div>
            </div>
          </motion.div>
        )}

      </section>

    </div>
  );
}
