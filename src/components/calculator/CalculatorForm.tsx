'use client';

import { useState, useCallback } from 'react';
import { YieldSlider } from './YieldSlider';
import { ProductSelector } from './ProductSelector';
import { BreakdownDisplay } from './BreakdownDisplay';
import { CO2eMetric } from '@/components/analytics/CO2eMetric';
import {
  CALCULATOR_DEFAULTS,
  calculateRequiredInput,
  calculatePossibleOutput,
  getDefaultYields,
  type YieldAssumptions,
  type ProductPreset,
  type ForwardCalculationResult,
  type ReverseCalculationResult,
} from '@/lib/calculator';
import type { YieldAverages } from '@/lib/analytics';

type Mode = 'forward' | 'reverse';

interface CalculatorFormProps {
  initialYields?: YieldAverages;
}

export function CalculatorForm({ initialYields }: CalculatorFormProps) {
  const [mode, setMode] = useState<Mode>('forward');
  const [targetUnits, setTargetUnits] = useState(100);
  const [availableKg, setAvailableKg] = useState(1000);
  const [product, setProduct] = useState<ProductPreset>(
    CALCULATOR_DEFAULTS.products.storageBox
  );

  // Initialize yields from historical data if available
  const [yields, setYields] = useState<YieldAssumptions>(() => {
    const defaults = getDefaultYields();
    if (initialYields) {
      return {
        granulation: initialYields.granulation ?? defaults.granulation,
        metalRemoval: initialYields.metalRemoval ?? defaults.metalRemoval,
        purification: initialYields.purification ?? defaults.purification,
        extrusion: initialYields.extrusion ?? defaults.extrusion,
        contaminationBuffer: defaults.contaminationBuffer,
      };
    }
    return defaults;
  });

  const [isFromHistorical, setIsFromHistorical] = useState(
    initialYields !== undefined &&
      Object.values(initialYields).some((v) => v !== null)
  );
  const [isLoadingYields, setIsLoadingYields] = useState(false);

  // Calculate results
  const forwardResult: ForwardCalculationResult =
    mode === 'forward'
      ? calculateRequiredInput(targetUnits, product.materialKg, yields)
      : { requiredInputKg: 0, co2eSavedKg: 0, coalPreventedLbs: 0, breakdown: [] };

  const reverseResult: ReverseCalculationResult =
    mode === 'reverse'
      ? calculatePossibleOutput(availableKg, product.materialKg, yields)
      : { possibleUnits: 0, co2eSavedKg: 0, coalPreventedLbs: 0, breakdown: [] };

  const result = mode === 'forward' ? forwardResult : reverseResult;

  // Fetch latest averages
  const fetchLatestAverages = useCallback(async () => {
    setIsLoadingYields(true);
    try {
      const response = await fetch('/api/analytics?includeLatestYields=true');
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      const latestYields = data.latestYields || data.yields;

      if (latestYields) {
        const defaults = getDefaultYields();
        setYields({
          granulation: latestYields.granulation ?? defaults.granulation,
          metalRemoval: latestYields.metalRemoval ?? defaults.metalRemoval,
          purification: latestYields.purification ?? defaults.purification,
          extrusion: latestYields.extrusion ?? defaults.extrusion,
          contaminationBuffer: yields.contaminationBuffer,
        });
        setIsFromHistorical(true);
      }
    } catch (error) {
      console.error('Failed to fetch latest yields:', error);
    } finally {
      setIsLoadingYields(false);
    }
  }, [yields.contaminationBuffer]);

  // Reset to defaults
  const resetToDefaults = () => {
    setYields(getDefaultYields());
    setIsFromHistorical(false);
  };

  return (
    <div className="space-y-8">
      {/* Mode Toggle */}
      <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-fit">
        <button
          onClick={() => setMode('forward')}
          className={`
            px-4 py-2 text-sm font-medium rounded-md transition-colors
            ${
              mode === 'forward'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }
          `}
        >
          Units → kg
        </button>
        <button
          onClick={() => setMode('reverse')}
          className={`
            px-4 py-2 text-sm font-medium rounded-md transition-colors
            ${
              mode === 'reverse'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }
          `}
        >
          kg → Units
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Inputs */}
        <div className="space-y-6">
          {/* Main Input */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
            {mode === 'forward' ? (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Target Units
                </label>
                <input
                  type="number"
                  value={targetUnits}
                  onChange={(e) =>
                    setTargetUnits(Math.max(0, parseInt(e.target.value, 10) || 0))
                  }
                  min={0}
                  className="w-full px-4 py-3 text-lg font-semibold border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Target units to produce"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  How many finished product units do you want to produce?
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Available Material (kg)
                </label>
                <input
                  type="number"
                  value={availableKg}
                  onChange={(e) =>
                    setAvailableKg(Math.max(0, parseFloat(e.target.value) || 0))
                  }
                  min={0}
                  className="w-full px-4 py-3 text-lg font-semibold border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Available material in kg"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  How much inbound material do you have available?
                </p>
              </div>
            )}
          </div>

          {/* Product Selection */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
            <ProductSelector value={product} onChange={setProduct} />
          </div>

          {/* Yield Sliders */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Yield Assumptions
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchLatestAverages}
                  disabled={isLoadingYields}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingYields ? 'Loading...' : 'Use Latest Averages'}
                </button>
                <span className="text-zinc-300 dark:text-zinc-600">|</span>
                <button
                  onClick={resetToDefaults}
                  className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="space-y-5">
              <YieldSlider
                label="Granulation"
                value={yields.granulation}
                onChange={(v) => {
                  setYields((y) => ({ ...y, granulation: v }));
                  setIsFromHistorical(false);
                }}
                isFromHistorical={isFromHistorical}
              />
              <YieldSlider
                label="Metal Removal"
                value={yields.metalRemoval}
                onChange={(v) => {
                  setYields((y) => ({ ...y, metalRemoval: v }));
                  setIsFromHistorical(false);
                }}
                isFromHistorical={isFromHistorical}
              />
              <YieldSlider
                label="Purification"
                value={yields.purification}
                onChange={(v) => {
                  setYields((y) => ({ ...y, purification: v }));
                  setIsFromHistorical(false);
                }}
                isFromHistorical={isFromHistorical}
              />
              <YieldSlider
                label="Extrusion"
                value={yields.extrusion}
                onChange={(v) => {
                  setYields((y) => ({ ...y, extrusion: v }));
                  setIsFromHistorical(false);
                }}
                isFromHistorical={isFromHistorical}
              />

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <YieldSlider
                  label="Contamination Buffer"
                  value={yields.contaminationBuffer}
                  onChange={(v) => setYields((y) => ({ ...y, contaminationBuffer: v }))}
                  min={0}
                  max={0.2}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="space-y-6">
          {/* Main Result */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
            <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
              {mode === 'forward' ? 'Required Inbound Material' : 'Possible Output'}
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-blue-900 dark:text-blue-100 tabular-nums">
                {mode === 'forward'
                  ? forwardResult.requiredInputKg.toLocaleString()
                  : reverseResult.possibleUnits.toLocaleString()}
              </span>
              <span className="text-lg text-blue-600 dark:text-blue-400">
                {mode === 'forward' ? 'kg' : 'units'}
              </span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              {mode === 'forward'
                ? `to produce ${targetUnits.toLocaleString()} ${product.name} units`
                : `from ${availableKg.toLocaleString()} kg of inbound material`}
            </p>
          </div>

          {/* CO2e Projection */}
          <CO2eMetric
            co2eSavedKg={result.co2eSavedKg}
            coalPreventedLbs={result.coalPreventedLbs}
          />

          {/* Breakdown */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
            <BreakdownDisplay breakdown={result.breakdown} direction={mode} />
          </div>

          {/* Overall Yield */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Overall Yield
              </span>
              <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                {Math.round(
                  yields.granulation *
                    yields.metalRemoval *
                    yields.purification *
                    yields.extrusion *
                    (1 - yields.contaminationBuffer) *
                    100
                )}
                %
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Combined effect of all processing steps and buffer
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
