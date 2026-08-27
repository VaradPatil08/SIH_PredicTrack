import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  LayoutGrid, 
  List,
  Sparkles
} from 'lucide-react';
import { getTrains } from '../services/api';
import { TrainCardSkeleton } from '../components/SkeletonLoader';
import AnimatedNumber from '../components/AnimatedNumber';
import { useSettings } from '../context/SettingsContext';

// Subtle Animation Variants (Staggered, professional, non-bouncy)
const heroContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

const heroItem = {
  hidden: { opacity: 0, y: 14 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
  },
};

const gridContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

const cardItem = {
  hidden: { opacity: 0, y: 18 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] }
  },
};

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useSettings();
  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'grid' | 'table'

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

  const handleSelectTrain = (trainNumber) => {
    navigate(`/train/${trainNumber}`);
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col justify-between font-sans text-foreground dark:text-slate-100 transition-colors">
      
      {/* Hero Header & Quick Select Section with Staggered Entrance */}
      <motion.section 
        variants={heroContainer}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-2 w-full space-y-5"
      >
        
        {/* Header Title & Context */}
        <div className="space-y-2.5 sm:space-y-3 max-w-3xl">
          <motion.div variants={heroItem} className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-navy-subtle dark:bg-blue-950/60 border border-navy-border dark:border-blue-800 text-navy dark:text-blue-300 text-xs font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-transit-green inline-block animate-pulse"></span>
            <span>{t('portalBadge')}</span>
          </motion.div>

          <motion.h1 variants={heroItem} className="font-bold text-2xl sm:text-3xl lg:text-4xl text-navy dark:text-blue-400 tracking-tight leading-tight">
            {t('heroTitle')}
          </motion.h1>

          <motion.p variants={heroItem} className="text-sm sm:text-base text-muted dark:text-slate-400 leading-relaxed">
            {t('heroSubtitle')}
          </motion.p>
        </div>

        {/* Quick Presets & View Switcher */}
        <motion.div variants={heroItem} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted dark:text-slate-400 font-medium mr-1">{t('quickSelect')}</span>
            {[
              { number: '12951', label: '12951 Tejas Rajdhani' },
              { number: '22436', label: '22436 Vande Bharat' },
              { number: '12009', label: '12009 Shatabdi Express' },
              { number: '12301', label: '12301 Howrah Rajdhani' },
              { number: '12626', label: '12626 Kerala Express' },
              { number: '20608', label: '20608 MYS-MAS VB' },
            ].map((chip) => (
              <button
                key={chip.number}
                onClick={() => handleSelectTrain(chip.number)}
                className="px-3 py-1.5 min-h-[36px] rounded-md bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-muted dark:text-slate-300 hover:text-navy dark:hover:text-white border border-border dark:border-slate-700 transition-all duration-200 font-medium text-xs shadow-xs hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-600 active:scale-95 flex items-center"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center self-start sm:self-auto gap-1 p-0.5 rounded bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded transition-all duration-200 ${
                viewMode === 'grid' 
                  ? 'bg-white dark:bg-slate-700 text-navy dark:text-white shadow-xs font-bold' 
                  : 'text-muted dark:text-slate-400 hover:text-navy dark:hover:text-white'
              }`}
              title={t('cardView')}
              aria-label={t('cardView')}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded transition-all duration-200 ${
                viewMode === 'table' 
                  ? 'bg-white dark:bg-slate-700 text-navy dark:text-white shadow-xs font-bold' 
                  : 'text-muted dark:text-slate-400 hover:text-navy dark:hover:text-white'
              }`}
              title={t('tableView')}
              aria-label={t('tableView')}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

      </motion.section>

      {/* Train Fleet Directory Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-4">
        
        {/* Section Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-navy dark:text-blue-400 text-sm sm:text-base">{t('activeCoachingTrains')}</span>
          </div>
          <span className="text-muted dark:text-slate-400 text-xs">
            {t('showing')} <strong className="text-navy dark:text-blue-400 font-bold"><AnimatedNumber value={trains.length} /></strong> {t('liveTrains')}
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

        {/* View Mode: Cards Grid with Staggered Scroll-In & Hover Lift */}
        {!loading && viewMode === 'grid' && (
          <motion.div 
            variants={gridContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence>
              {trains.map((train) => (
                <motion.div
                  key={train.train_number}
                  variants={cardItem}
                  layout
                  onClick={() => handleSelectTrain(train.train_number)}
                  className="railway-card group p-4 sm:p-5 cursor-pointer space-y-3.5 sm:space-y-4 flex flex-col justify-between"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSelectTrain(train.train_number)}
                >
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-navy-subtle dark:bg-blue-950/60 text-navy dark:text-blue-300 font-bold text-xs font-mono transition-colors group-hover:bg-navy group-hover:text-white dark:group-hover:bg-blue-600">
                        #{train.train_number}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-muted dark:text-slate-300 border border-border dark:border-slate-700">
                        {train.type || 'Express'}
                      </span>
                    </div>

                    <span className="text-[11px] font-semibold text-transit-green dark:text-emerald-400 flex items-center gap-1.5 shrink-0">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-transit-green opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-transit-green"></span>
                      </span>
                      <span>{t('liveTrack')}</span>
                    </span>
                  </div>

                  {/* Train Name */}
                  <div className="space-y-0.5">
                    <h2 className="font-bold text-base text-navy dark:text-blue-400 group-hover:text-railway-red dark:group-hover:text-blue-300 transition-colors leading-snug line-clamp-1">
                      {train.name}
                    </h2>
                    <p className="text-xs text-muted dark:text-slate-400">
                      {train.zone || 'Indian Railways'}
                    </p>
                  </div>

                  {/* Route & Distance */}
                  <div className="p-3 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs transition-colors group-hover:border-slate-300 dark:group-hover:border-slate-600">
                    <div className="flex items-center justify-between font-semibold text-foreground dark:text-slate-200 gap-1">
                      <span className="truncate">{train.origin}</span>
                      <span className="text-navy dark:text-blue-400 font-bold mx-1.5 group-hover:translate-x-0.5 transition-transform shrink-0">→</span>
                      <span className="truncate">{train.destination}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted dark:text-slate-400 pt-1.5 border-t border-slate-200 dark:border-slate-700">
                      <span>{t('departs')} <strong className="text-foreground dark:text-slate-200">{train.scheduled_departure || '17:00'}</strong></span>
                      <span>{t('distance')} <strong className="text-foreground dark:text-slate-200">{train.total_distance_km || 1000} {t('km')}</strong></span>
                    </div>
                  </div>

                  {/* CTA button */}
                  <div className="pt-1 flex items-center justify-between text-xs font-semibold text-navy dark:text-blue-400">
                    <span className="flex items-center gap-1.5 group-hover:text-navy-light dark:group-hover:text-blue-300 transition-colors">
                      <span>{t('viewRouteEta')}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                    </span>
                  </div>

                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* View Mode: Tabular Directory with Contained Horizontal Scroll */}
        {!loading && viewMode === 'table' && (
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-lg border border-border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card overflow-hidden"
          >
            <div className="overflow-x-auto w-full">
              <div className="min-w-[620px]">
                
                <div className="grid grid-cols-12 gap-4 py-3 px-5 bg-slate-50 dark:bg-slate-800/80 border-b border-border dark:border-slate-800 text-xs font-semibold text-muted dark:text-slate-400">
                  <div className="col-span-2">{t('trainNumber')}</div>
                  <div className="col-span-4">{t('serviceZone')}</div>
                  <div className="col-span-4">{t('originDestination')}</div>
                  <div className="col-span-2 text-right">{t('action')}</div>
                </div>

                <div className="divide-y divide-border dark:divide-slate-800">
                  <AnimatePresence>
                    {trains.map((train, idx) => (
                      <motion.div
                        key={train.train_number}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.2) }}
                        onClick={() => handleSelectTrain(train.train_number)}
                        className="py-3.5 px-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer grid grid-cols-12 gap-3 items-center text-xs group"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleSelectTrain(train.train_number)}
                      >
                        <div className="col-span-2 flex items-center gap-2">
                          <span className="font-mono font-bold text-navy dark:text-blue-400 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                            #{train.train_number}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-muted dark:text-slate-300 md:hidden">
                            {train.type}
                          </span>
                        </div>

                        <div className="col-span-4">
                          <div className="font-semibold text-foreground dark:text-slate-200 group-hover:text-navy dark:group-hover:text-blue-300 transition-colors truncate">
                            {train.name}
                          </div>
                          <div className="text-[11px] text-muted dark:text-slate-400 truncate">
                            {train.zone} • {train.type}
                          </div>
                        </div>

                        <div className="col-span-4 text-xs text-muted dark:text-slate-400">
                          <span className="text-foreground dark:text-slate-200 font-medium">{train.origin}</span>
                          <span className="text-navy dark:text-blue-400 font-bold mx-2">→</span>
                          <span className="text-foreground dark:text-slate-200 font-medium">{train.destination}</span>
                          {train.total_distance_km && (
                            <span className="text-muted dark:text-slate-400 text-[11px] ml-2">
                              ({train.total_distance_km} {t('km')})
                            </span>
                          )}
                        </div>

                        <div className="col-span-2 flex items-center justify-end">
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 min-h-[36px] rounded bg-navy dark:bg-blue-600 text-white text-xs font-semibold hover:bg-navy-light dark:hover:bg-blue-500 transition-all duration-200 shadow-xs group-hover:shadow-sm">
                            <span>{t('track')}</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </motion.div>
                    ))}
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




