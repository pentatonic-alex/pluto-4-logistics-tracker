'use client';

import type { BreakdownStep } from '@/lib/calculator';

interface BreakdownDisplayProps {
  breakdown: BreakdownStep[];
  direction: 'forward' | 'reverse';
}

export function BreakdownDisplay({ breakdown, direction }: BreakdownDisplayProps) {
  if (breakdown.length === 0) return null;

  // For forward calculation, show in reverse order (from target back to input)
  // For reverse calculation, show in forward order (from input to output)
  const displaySteps = direction === 'forward' ? [...breakdown].reverse() : breakdown;

  return (
    <div className="space-y-1">
      <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
        Step-by-Step Breakdown
      </h4>

      <div className="space-y-0">
        {displaySteps.map((step, index) => {
          const isFirst = index === 0;
          const isLast = index === displaySteps.length - 1;

          return (
            <div key={step.step} className="flex items-center">
              {/* Vertical line connector */}
              <div className="flex flex-col items-center mr-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isFirst
                      ? 'bg-blue-500'
                      : isLast
                        ? 'bg-green-500'
                        : 'bg-zinc-300 dark:bg-zinc-600'
                  }`}
                />
                {!isLast && (
                  <div className="w-0.5 h-8 bg-zinc-200 dark:bg-zinc-700" />
                )}
              </div>

              {/* Step content */}
              <div
                className={`flex-1 flex items-center justify-between py-2 ${
                  isFirst || isLast ? 'font-medium' : ''
                }`}
              >
                <span
                  className={`text-sm ${
                    isFirst
                      ? 'text-blue-700 dark:text-blue-300'
                      : isLast
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {step.step}
                </span>
                <span
                  className={`text-sm tabular-nums ${
                    isFirst
                      ? 'text-blue-700 dark:text-blue-300'
                      : isLast
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {step.kg.toLocaleString(undefined, {
                    maximumFractionDigits: 1,
                    minimumFractionDigits: 0,
                  })}{' '}
                  kg
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
