import React from 'react';

export function TrainRowSkeleton() {
  return (
    <div className="p-4 border-b border-white/10 bg-[#111111] animate-pulse flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 flex-1">
        <div className="h-5 w-16 bg-white/10"></div>
        <div className="h-4 w-48 bg-white/10"></div>
      </div>
      <div className="h-4 w-40 bg-white/10 hidden md:block"></div>
      <div className="h-4 w-20 bg-white/10"></div>
    </div>
  );
}

export function TrainCardSkeleton() {
  return (
    <div className="p-4 border border-white/10 bg-[#111111] border-t-2 border-t-[#FFB300] animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-5 w-20 bg-white/10"></div>
        <div className="h-4 w-12 bg-white/10"></div>
      </div>
      <div className="h-5 w-3/4 bg-white/10"></div>
      <div className="h-4 w-1/2 bg-white/10"></div>
    </div>
  );
}

export function TrackingHeaderSkeleton() {
  return (
    <div className="p-5 border border-white/10 border-t-2 border-t-[#FFB300] bg-[#111111] animate-pulse space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-3">
            <div className="h-7 w-28 bg-white/10"></div>
            <div className="h-5 w-24 bg-white/10"></div>
          </div>
          <div className="h-6 w-80 bg-white/10"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-14 w-28 bg-white/10"></div>
          <div className="h-14 w-28 bg-white/10"></div>
        </div>
      </div>
    </div>
  );
}

export function TimelineSkeleton() {
  return (
    <div className="border border-white/10 border-t-2 border-t-[#FFB300] bg-[#111111] p-4 space-y-3 animate-pulse">
      <div className="h-5 w-32 bg-white/10 mb-4"></div>
      {[1, 2, 3, 4, 5, 6].map((idx) => (
        <div key={idx} className="flex items-center justify-between py-2.5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-white/20"></div>
            <div className="h-4 w-32 bg-white/10"></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-4 w-16 bg-white/10"></div>
            <div className="h-4 w-16 bg-white/10"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div className="w-full h-[450px] lg:h-[620px] border border-white/10 border-t-2 border-t-[#FFB300] bg-[#111111] animate-pulse flex flex-col items-center justify-center p-6 text-white/40 font-mono text-xs space-y-3">
      <div className="w-8 h-8 border-2 border-[#FFB300] border-t-transparent animate-spin"></div>
      <p className="font-sora uppercase tracking-widest">[ INITIALIZING_GIS_SATELLITE_FEED ]</p>
    </div>
  );
}

