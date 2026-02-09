import { getAnalyticsData } from '@/lib/analytics';
import { MetricCard } from '@/components/analytics/MetricCard';
import { CO2eMetric } from '@/components/analytics/CO2eMetric';
import { YieldWaterfall } from '@/components/analytics/YieldWaterfall';
import { ThroughputChart } from '@/components/analytics/ThroughputChart';
import { AnalyticsExportButtons } from './AnalyticsExportButtons';
import { CALCULATOR_DEFAULTS } from '@/lib/calculator';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const { overview, yields, throughput } = await getAnalyticsData();

  // Calculate coal equivalent for CO2e metric
  const coalPreventedLbs =
    (overview.co2eSavedKg / CALCULATOR_DEFAULTS.co2e.savingsPerUnit) *
    CALCULATOR_DEFAULTS.co2e.coalLbsPerUnit;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Analytics
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Supply chain performance metrics and trends
          </p>
        </div>
        <AnalyticsExportButtons />
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Total Processed"
          value={overview.totalProcessedKg}
          unit="kg"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
              />
            </svg>
          }
        />

        <MetricCard
          label="Active Campaigns"
          value={overview.activeCampaigns}
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          }
        />

        <MetricCard
          label="Completed"
          value={overview.completedCampaigns}
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />

        <MetricCard
          label="Units Produced"
          value={overview.totalUnitsProduced}
          unit="units"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          }
        />
      </div>

      {/* CO2e Savings - Full width highlight */}
      <div className="mb-8">
        <CO2eMetric
          co2eSavedKg={overview.co2eSavedKg}
          coalPreventedLbs={coalPreventedLbs}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <YieldWaterfall yields={yields} />
        <ThroughputChart data={throughput} />
      </div>

      {/* Yield Summary */}
      <div className="mt-8">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-4">
            Average Yields by Step
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <YieldStat
              label="Granulation"
              value={yields.granulation}
              fallback={CALCULATOR_DEFAULTS.yields.granulation}
            />
            <YieldStat
              label="Metal Removal"
              value={yields.metalRemoval}
              fallback={CALCULATOR_DEFAULTS.yields.metalRemoval}
            />
            <YieldStat
              label="Purification"
              value={yields.purification}
              fallback={CALCULATOR_DEFAULTS.yields.purification}
            />
            <YieldStat
              label="Extrusion"
              value={yields.extrusion}
              fallback={CALCULATOR_DEFAULTS.yields.extrusion}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function YieldStat({
  label,
  value,
  fallback,
}: {
  label: string;
  value: number | null;
  fallback: number;
}) {
  const displayValue = value ?? fallback;
  const isFallback = value === null;

  return (
    <div className="text-center">
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">{label}</p>
      <p
        className={`text-lg font-semibold tabular-nums ${
          isFallback
            ? 'text-zinc-400 dark:text-zinc-500'
            : 'text-zinc-900 dark:text-zinc-100'
        }`}
      >
        {Math.round(displayValue * 100)}%
      </p>
      {isFallback && (
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500">estimate</p>
      )}
    </div>
  );
}
