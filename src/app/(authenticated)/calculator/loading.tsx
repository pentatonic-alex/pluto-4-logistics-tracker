export default function CalculatorLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-48 mb-2 animate-pulse" />
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-80 animate-pulse" />
      </div>

      {/* Mode Toggle Skeleton */}
      <div className="h-10 bg-zinc-200 dark:bg-zinc-700 rounded-lg w-48 mb-8 animate-pulse" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Input Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 animate-pulse">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-24 mb-3" />
            <div className="h-12 bg-zinc-200 dark:bg-zinc-700 rounded" />
          </div>

          {/* Product Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 animate-pulse">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-24 mb-3" />
            <div className="flex gap-2">
              <div className="h-10 bg-zinc-200 dark:bg-zinc-700 rounded w-28" />
              <div className="h-10 bg-zinc-200 dark:bg-zinc-700 rounded w-20" />
            </div>
          </div>

          {/* Yield Sliders */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 animate-pulse">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-32 mb-5" />
            <div className="space-y-6">
              {[...Array(5)].map((_, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-2">
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-20" />
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-12" />
                  </div>
                  <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Result Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border border-blue-200 dark:border-blue-800 p-6 animate-pulse">
            <div className="h-4 bg-blue-200 dark:bg-blue-800 rounded w-40 mb-3" />
            <div className="h-12 bg-blue-200 dark:bg-blue-800 rounded w-32" />
          </div>

          {/* CO2e Card */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl border border-green-200 dark:border-green-800 p-5 animate-pulse">
            <div className="h-4 bg-green-200 dark:bg-green-800 rounded w-24 mb-3" />
            <div className="h-8 bg-green-200 dark:bg-green-800 rounded w-32" />
          </div>

          {/* Breakdown Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 animate-pulse">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-40 mb-4" />
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-32" />
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
