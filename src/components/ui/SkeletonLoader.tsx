import React from 'react';

export const SkeletonCard = () => (
  <div className="card p-6 border-none bg-surface-2 animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="w-12 h-12 rounded-xl bg-surface-3" />
      <div className="w-16 h-6 rounded-full bg-surface-3" />
    </div>
    <div className="space-y-3">
      <div className="w-24 h-4 rounded bg-surface-3" />
      <div className="w-32 h-8 rounded bg-surface-3" />
      <div className="w-full h-2 rounded-full bg-surface-3 mt-4" />
    </div>
  </div>
);

export const SkeletonList = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-surface-2 animate-pulse">
        <div className="w-10 h-10 rounded-full bg-surface-3 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="w-1/3 h-4 rounded bg-surface-3" />
          <div className="w-1/4 h-3 rounded bg-surface-3" />
        </div>
        <div className="w-16 h-6 rounded-full bg-surface-3" />
      </div>
    ))}
  </div>
);

export const SkeletonDashboard = () => (
  <div className="space-y-8 animate-in fade-in duration-500">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 card p-6 h-[400px] border-none bg-surface-2 animate-pulse" />
      <div className="card p-6 h-[400px] border-none bg-surface-2 animate-pulse" />
    </div>
  </div>
);
