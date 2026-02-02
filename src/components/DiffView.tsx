'use client';

import type { FieldChange } from '@/types/import';

interface DiffViewProps {
  changes: FieldChange[];
  className?: string;
}

/**
 * Side-by-side diff view for field changes
 */
export function DiffView({ changes, className = '' }: DiffViewProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {changes.map((change, index) => (
        <div
          key={`${change.field}-${index}`}
          className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center text-sm"
        >
          {/* Current value */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-zinc-500 dark:text-zinc-400 shrink-0">
              {change.label}:
            </span>
            <span className="px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded truncate">
              {formatValue(change.current)}
            </span>
          </div>
          
          {/* Arrow */}
          <svg className="w-4 h-4 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          
          {/* Proposed value */}
          <span className="px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded truncate">
            {formatValue(change.proposed)}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Compact diff view for table cells
 */
export function CompactDiffView({ changes }: { changes: FieldChange[] }) {
  if (changes.length === 0) return null;
  
  return (
    <div className="text-xs space-y-1">
      {changes.slice(0, 3).map((change, index) => (
        <div key={`${change.field}-${index}`} className="flex items-center gap-1">
          <span className="text-zinc-500 dark:text-zinc-400">{change.label}:</span>
          <span className="text-red-600 dark:text-red-400 line-through">
            {formatValue(change.current, true)}
          </span>
          <span className="text-zinc-400">→</span>
          <span className="text-green-600 dark:text-green-400">
            {formatValue(change.proposed, true)}
          </span>
        </div>
      ))}
      {changes.length > 3 && (
        <div className="text-zinc-400">+{changes.length - 3} more changes</div>
      )}
    </div>
  );
}

/**
 * Format a value for display
 */
function formatValue(value: unknown, compact = false): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') {
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  const str = String(value);
  if (compact && str.length > 15) return str.slice(0, 15) + '...';
  return str;
}
