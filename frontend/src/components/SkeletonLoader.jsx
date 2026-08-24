import React from 'react';

export function TrainCardSkeleton() {
  return (
    <div className="p-4 rounded-xl bg-rail-card/60 border border-rail-border animate-pulse flex flex-col justify-between">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-2 flex-1">
          <div className="h-5 w-24 bg-rail-border/80 rounded-md"></div>
          <div className="h-4 w-48 bg-rail-border/60 rounded"></div>
        </div>
        <div className="h-6 w-16 bg-rail-border/80 rounded-full"></div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-rail-border/40">
        <div className="h-3 w-32 bg-rail-border/50 rounded"></div>
        <div className="h-4 w-12 bg-rail-border/60 rounded"></div>
      </div>
    </div>
  );
}

export function TrackingHeaderSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-rail-card/80 border border-rail-border animate-pulse mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-28 bg-rail-border/80 rounded-lg"></div>
            <div className="h-6 w-24 bg-rail-border/60 rounded-full"></div>
          </div>
          <div className="h-6 w-72 bg-rail-border/70 rounded-md"></div>
          <div className="h-4 w-52 bg-rail-border/50 rounded"></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-16 w-32 bg-rail-border/60 rounded-xl"></div>
          <div className="h-16 w-32 bg-rail-border/60 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
}

export function TimelineSkeleton() {
  return (
    <div className="space-y-4 animate-pulse p-4">
      {[1, 2, 3, 4, 5].map((idx) => (
        <div key={idx} className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-rail-border/80 shrink-0"></div>
          <div className="flex-1 p-4 rounded-xl bg-rail-card/50 border border-rail-border/40 space-y-2">
            <div className="flex justify-between items-center">
              <div className="h-4 w-36 bg-rail-border/70 rounded"></div>
              <div className="h-5 w-20 bg-rail-border/60 rounded-full"></div>
            </div>
            <div className="flex gap-4">
              <div className="h-3 w-24 bg-rail-border/50 rounded"></div>
              <div className="h-3 w-28 bg-rail-border/50 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div className="w-full h-full min-h-[400px] rounded-2xl bg-rail-card/60 border border-rail-border animate-pulse flex flex-col items-center justify-center p-6 text-rail-muted">
      <div className="w-12 h-12 rounded-full border-4 border-rail-yellow/30 border-t-rail-yellow animate-spin mb-4"></div>
      <p className="font-medium text-sm">Rendering Railway GIS Route & Satellite Nodes...</p>
    </div>
  );
}

