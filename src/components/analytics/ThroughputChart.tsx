'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface ThroughputDataPoint {
  month: string;
  processedKg: number;
}

interface ThroughputChartProps {
  data: ThroughputDataPoint[];
}

export function ThroughputChart({ data }: ThroughputChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-4">
          Throughput Over Time
        </h3>
        <div className="flex items-center justify-center h-64 text-zinc-500 dark:text-zinc-400">
          <div className="text-center">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
              />
            </svg>
            <p className="text-sm">No throughput data available yet</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              Data will appear after processing shipments
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Format month for display (2026-01 → Jan 26)
  const formattedData = data.map((d) => ({
    ...d,
    monthLabel: formatMonth(d.month),
  }));

  const totalKg = data.reduce((sum, d) => sum + d.processedKg, 0);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Throughput Over Time
        </h3>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Total: {totalKg.toLocaleString()} kg
        </span>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={formattedData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="throughputGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e4e4e7"
              vertical={false}
            />
            <XAxis
              dataKey="monthLabel"
              tick={{ fontSize: 11, fill: '#71717a' }}
              axisLine={{ stroke: '#e4e4e7' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#71717a' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) =>
                value >= 1000 ? `${(value / 1000).toFixed(0)}t` : `${value}kg`
              }
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const kg = payload[0].value as number;
                  return (
                    <div className="bg-zinc-900 dark:bg-zinc-800 text-white text-xs p-2 rounded shadow-lg">
                      <p className="font-medium">{label}</p>
                      <p>{kg.toLocaleString()} kg processed</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="processedKg"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#throughputGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function formatMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-');
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${months[parseInt(month, 10) - 1]} ${year.slice(-2)}`;
}

export function ThroughputChartSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 animate-pulse">
      <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-40 mb-4" />
      <div className="h-64 bg-zinc-200 dark:bg-zinc-700 rounded" />
    </div>
  );
}
