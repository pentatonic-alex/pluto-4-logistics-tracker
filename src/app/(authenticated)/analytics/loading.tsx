import { MetricCardSkeleton } from '@/components/analytics/MetricCard';
import { CO2eMetricSkeleton } from '@/components/analytics/CO2eMetric';
import { YieldWaterfallSkeleton } from '@/components/analytics/YieldWaterfall';
import { ThroughputChartSkeleton } from '@/components/analytics/ThroughputChart';

export default function AnalyticsLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-32 mb-2 animate-pulse" />
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-64 animate-pulse" />
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>

      {/* CO2e Savings */}
      <div className="mb-8">
        <CO2eMetricSkeleton />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <YieldWaterfallSkeleton />
        <ThroughputChartSkeleton />
      </div>

      {/* Yield Summary */}
      <div className="mt-8">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 animate-pulse">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-40 mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center">
                <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-16 mx-auto mb-2" />
                <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-12 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
