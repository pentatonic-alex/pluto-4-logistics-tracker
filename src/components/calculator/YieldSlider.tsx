'use client';

interface YieldSliderProps {
  label: string;
  value: number; // 0-1
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  isFromHistorical?: boolean;
}

export function YieldSlider({
  label,
  value,
  onChange,
  min = 0.5,
  max = 1.0,
  isFromHistorical = false,
}: YieldSliderProps) {
  const percentage = Math.round(value * 100);

  // Get color based on yield value
  const getColor = () => {
    if (value >= 0.9) return 'text-green-600 dark:text-green-400';
    if (value >= 0.75) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold tabular-nums ${getColor()}`}>
            {percentage}%
          </span>
          {isFromHistorical && (
            <span className="text-[10px] text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded">
              historical
            </span>
          )}
        </div>
      </div>

      <div className="relative">
        <input
          type="range"
          min={min * 100}
          max={max * 100}
          value={percentage}
          onChange={(e) => onChange(parseInt(e.target.value, 10) / 100)}
          className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-4
                     [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:bg-white
                     [&::-webkit-slider-thumb]:border-2
                     [&::-webkit-slider-thumb]:border-zinc-400
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:shadow-sm
                     [&::-webkit-slider-thumb]:hover:border-zinc-500
                     [&::-moz-range-thumb]:w-4
                     [&::-moz-range-thumb]:h-4
                     [&::-moz-range-thumb]:bg-white
                     [&::-moz-range-thumb]:border-2
                     [&::-moz-range-thumb]:border-zinc-400
                     [&::-moz-range-thumb]:rounded-full
                     [&::-moz-range-thumb]:cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${value >= 0.9 ? '#22c55e' : value >= 0.75 ? '#eab308' : '#ef4444'} 0%, ${value >= 0.9 ? '#22c55e' : value >= 0.75 ? '#eab308' : '#ef4444'} ${((value - min) / (max - min)) * 100}%, #e4e4e7 ${((value - min) / (max - min)) * 100}%, #e4e4e7 100%)`,
          }}
          aria-label={`${label} yield`}
        />
      </div>

      <div className="flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500">
        <span>{Math.round(min * 100)}%</span>
        <span>{Math.round(max * 100)}%</span>
      </div>
    </div>
  );
}
