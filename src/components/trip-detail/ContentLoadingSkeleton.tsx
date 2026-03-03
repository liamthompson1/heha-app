"use client";

export default function ContentLoadingSkeleton() {
  return (
    <div className="space-y-12 animate-pulse">
      {/* Things to Do skeleton */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-6 h-6 rounded-full glass-panel" />
          <div className="h-6 w-32 glass-panel rounded-xl" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-panel rounded-2xl p-5 space-y-3">
              <div className="h-4 w-3/4 glass-panel rounded-lg" />
              <div className="h-3 w-full glass-panel rounded-lg" />
              <div className="h-3 w-2/3 glass-panel rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Local Knowledge skeleton */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-6 h-6 rounded-full glass-panel" />
          <div className="h-6 w-40 glass-panel rounded-xl" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-panel rounded-2xl p-5 flex gap-3">
              <div className="w-8 h-8 rounded-full glass-panel flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 glass-panel rounded-lg" />
                <div className="h-3 w-full glass-panel rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Food & Drink skeleton */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-6 h-6 rounded-full glass-panel" />
          <div className="h-6 w-32 glass-panel rounded-xl" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="glass-panel rounded-2xl p-5 space-y-2">
              <div className="h-4 w-1/2 glass-panel rounded-lg" />
              <div className="h-3 w-full glass-panel rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
