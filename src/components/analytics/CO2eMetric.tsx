'use client';

import { useState } from 'react';
import { CALCULATOR_DEFAULTS, formatCO2e } from '@/lib/calculator';

interface CO2eMetricProps {
  co2eSavedKg: number;
  coalPreventedLbs?: number;
}

export function CO2eMetric({ co2eSavedKg, coalPreventedLbs }: CO2eMetricProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Calculate coal if not provided
  const coalLbs =
    coalPreventedLbs ??
    (co2eSavedKg / CALCULATOR_DEFAULTS.co2e.savingsPerUnit) *
      CALCULATOR_DEFAULTS.co2e.coalLbsPerUnit;

  const tooltipText = `CO2e savings based on:
• Recycled plastic: ${CALCULATOR_DEFAULTS.co2e.recycledPerUnit} kg CO2e/unit
• Virgin plastic: ${CALCULATOR_DEFAULTS.co2e.virginPerUnit} kg CO2e/unit
• Net savings: ${CALCULATOR_DEFAULTS.co2e.savingsPerUnit} kg CO2e/unit
• Coal equivalent: ${CALCULATOR_DEFAULTS.co2e.coalLbsPerUnit} lbs/unit prevented`;

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl border border-green-200 dark:border-green-800 p-5 relative">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm font-medium text-green-700 dark:text-green-300">
              CO2e Savings
            </p>
            <button
              className="text-green-500 dark:text-green-400 hover:text-green-700 dark:hover:text-green-200 transition-colors"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
              aria-label="CO2e calculation assumptions"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          </div>

          <div className="flex items-baseline gap-1 mb-1">
            <p className="text-2xl font-semibold text-green-900 dark:text-green-100 tabular-nums">
              {formatCO2e(co2eSavedKg)}
            </p>
            <span className="text-sm text-green-600 dark:text-green-400">
              saved
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
              />
            </svg>
            <span>{coalLbs.toLocaleString()} lbs coal prevented</span>
          </div>
        </div>

        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-10 top-full left-0 mt-2 p-3 bg-zinc-900 dark:bg-zinc-800 text-white text-xs rounded-lg shadow-lg max-w-xs whitespace-pre-line">
          {tooltipText}
        </div>
      )}
    </div>
  );
}

export function CO2eMetricSkeleton() {
  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl border border-green-200 dark:border-green-800 p-5 animate-pulse">
      <div className="h-4 bg-green-200 dark:bg-green-800 rounded w-24 mb-3" />
      <div className="h-8 bg-green-200 dark:bg-green-800 rounded w-32 mb-2" />
      <div className="h-4 bg-green-200 dark:bg-green-800 rounded w-40" />
    </div>
  );
}
