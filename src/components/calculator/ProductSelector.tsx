'use client';

import { useState } from 'react';
import { CALCULATOR_DEFAULTS, type ProductPreset } from '@/lib/calculator';

interface ProductSelectorProps {
  value: ProductPreset;
  onChange: (preset: ProductPreset) => void;
}

export function ProductSelector({ value, onChange }: ProductSelectorProps) {
  const [isCustom, setIsCustom] = useState(
    !Object.values(CALCULATOR_DEFAULTS.products).some(
      (p) => p.name === value.name && p.materialKg === value.materialKg
    )
  );
  const [customKg, setCustomKg] = useState(value.materialKg);

  const presets = Object.values(CALCULATOR_DEFAULTS.products);

  const handlePresetChange = (presetName: string) => {
    if (presetName === 'custom') {
      setIsCustom(true);
      onChange({ name: 'Custom', materialKg: customKg });
    } else {
      setIsCustom(false);
      const preset = presets.find((p) => p.name === presetName);
      if (preset) {
        onChange(preset);
      }
    }
  };

  const handleCustomKgChange = (kg: number) => {
    setCustomKg(kg);
    onChange({ name: 'Custom', materialKg: kg });
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Product Type
      </label>

      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.name}
            onClick={() => handlePresetChange(preset.name)}
            className={`
              px-3 py-2 text-sm rounded-lg border transition-colors
              ${
                !isCustom && value.name === preset.name
                  ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
              }
            `}
          >
            {preset.name}
            <span className="ml-1 text-xs text-zinc-500 dark:text-zinc-400">
              ({preset.materialKg} kg)
            </span>
          </button>
        ))}
        <button
          onClick={() => handlePresetChange('custom')}
          className={`
            px-3 py-2 text-sm rounded-lg border transition-colors
            ${
              isCustom
                ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
            }
          `}
        >
          Custom
        </button>
      </div>

      {isCustom && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={customKg}
            onChange={(e) => handleCustomKgChange(parseFloat(e.target.value) || 0)}
            min={0.1}
            step={0.1}
            className="w-24 px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Custom material per unit"
          />
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            kg per unit
          </span>
        </div>
      )}

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Material weight per finished product unit
      </p>
    </div>
  );
}
