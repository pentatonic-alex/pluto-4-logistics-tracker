'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  LabelList,
} from 'recharts';
import { CALCULATOR_DEFAULTS, formatYieldPercent } from '@/lib/calculator';

interface YieldWaterfallProps {
  yields: {
    granulation: number | null;
    metalRemoval: number | null;
    purification: number | null;
    extrusion: number | null;
    overall: number | null;
  };
  startingKg?: number; // Optional: show actual kg flow
}

interface WaterfallDataPoint {
  name: string;
  yield: number;
  start: number;
  end: number;
  loss: number;
  isLoss: boolean;
}

export function YieldWaterfall({ yields, startingKg = 1000 }: YieldWaterfallProps) {
  // Use fallback yields where data is missing
  const effectiveYields = {
    granulation: yields.granulation ?? CALCULATOR_DEFAULTS.yields.granulation,
    metalRemoval: yields.metalRemoval ?? CALCULATOR_DEFAULTS.yields.metalRemoval,
    purification: yields.purification ?? CALCULATOR_DEFAULTS.yields.purification,
    extrusion: yields.extrusion ?? CALCULATOR_DEFAULTS.yields.extrusion,
  };

  // Calculate material flow through each step
  const steps = [
    { name: 'Inbound', yield: 1.0 },
    { name: 'Granulation', yield: effectiveYields.granulation },
    { name: 'Metal Removal', yield: effectiveYields.metalRemoval },
    { name: 'Purification', yield: effectiveYields.purification },
    { name: 'Extrusion', yield: effectiveYields.extrusion },
  ];

  let currentKg = startingKg;
  const data: WaterfallDataPoint[] = [];

  // Build waterfall data
  for (let i = 0; i < steps.length; i++) {
    if (i === 0) {
      // Starting point
      data.push({
        name: steps[i].name,
        yield: 1.0,
        start: 0,
        end: currentKg,
        loss: 0,
        isLoss: false,
      });
    } else {
      const previousKg = currentKg;
      currentKg = currentKg * steps[i].yield;
      const loss = previousKg - currentKg;

      data.push({
        name: steps[i].name,
        yield: steps[i].yield,
        start: currentKg,
        end: previousKg,
        loss: loss,
        isLoss: true,
      });
    }
  }

  // Add final output
  data.push({
    name: 'Output',
    yield: yields.overall ?? Object.values(effectiveYields).reduce((a, b) => a * b, 1),
    start: 0,
    end: currentKg,
    loss: 0,
    isLoss: false,
  });

  const hasRealData = Object.values(yields).some((y) => y !== null);

  if (!hasRealData) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-4">
          Yield Waterfall
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <p className="text-sm">No yield data available yet</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              Showing fallback estimates
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Yield Waterfall
        </h3>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Overall: {formatYieldPercent(yields.overall ?? 0)}
        </span>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#71717a' }}
              axisLine={{ stroke: '#e4e4e7' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#71717a' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value.toLocaleString()} kg`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as WaterfallDataPoint;
                  return (
                    <div className="bg-zinc-900 dark:bg-zinc-800 text-white text-xs p-2 rounded shadow-lg">
                      <p className="font-medium">{data.name}</p>
                      {data.isLoss ? (
                        <>
                          <p>Yield: {formatYieldPercent(data.yield)}</p>
                          <p className="text-red-400">
                            Loss: {data.loss.toFixed(0)} kg
                          </p>
                        </>
                      ) : (
                        <p>Material: {data.end.toFixed(0)} kg</p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine y={0} stroke="#e4e4e7" />

            {/* Stacked bars for waterfall effect */}
            <Bar dataKey="start" stackId="a" fill="transparent" />
            <Bar dataKey="loss" stackId="a" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isLoss ? '#ef4444' : '#22c55e'}
                />
              ))}
              <LabelList
                dataKey="yield"
                position="top"
                formatter={(value) => {
                  const numValue = Number(value);
                  return numValue < 1 ? formatYieldPercent(numValue) : '';
                }}
                style={{ fontSize: 10, fill: '#71717a' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span>Material remaining</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span>Material loss</span>
        </div>
      </div>
    </div>
  );
}

export function YieldWaterfallSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 animate-pulse">
      <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-32 mb-4" />
      <div className="h-64 bg-zinc-200 dark:bg-zinc-700 rounded" />
    </div>
  );
}
