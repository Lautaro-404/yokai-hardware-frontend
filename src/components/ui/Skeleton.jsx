import React from 'react';

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col justify-between p-space-md rounded bg-surface-container-low border border-outline-variant/50 animate-pulse">
      <div>
        <div className="w-full aspect-square rounded bg-surface-container-lowest border border-outline-variant/30 mb-space-md" />
        <div className="h-3 w-28 bg-surface-container-high rounded mb-2" />
        <div className="h-5 w-full bg-surface-container-high rounded mb-1.5" />
        <div className="h-4 w-3/4 bg-surface-container-high rounded" />
      </div>
      <div className="mt-space-md pt-space-sm border-t border-outline-variant/40 flex flex-col gap-2">
        <div className="h-6 w-32 bg-surface-container-high rounded" />
        <div className="h-3 w-44 bg-surface-container-high rounded" />
        <div className="h-10 w-full bg-surface-container-high rounded mt-2" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="w-full max-w-[1440px] mx-auto px-gutter py-space-xl animate-pulse">
      <div className="h-4 w-64 bg-surface-container-high rounded mb-space-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl">
        <div className="lg:col-span-6 aspect-square rounded bg-surface-container-low border border-outline-variant/50" />
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="h-4 w-36 bg-surface-container-high rounded" />
          <div className="h-9 w-4/5 bg-surface-container-high rounded" />
          <div className="h-20 w-full bg-surface-container-high rounded" />
          <div className="h-12 w-48 bg-surface-container-high rounded" />
          <div className="h-12 w-full bg-surface-container-high rounded mt-4" />
        </div>
      </div>
    </div>
  );
}
