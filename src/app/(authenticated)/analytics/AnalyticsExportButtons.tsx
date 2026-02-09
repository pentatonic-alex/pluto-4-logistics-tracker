'use client';

import { useState, useCallback } from 'react';

/**
 * Export buttons for analytics data with format selection (Excel or CSV).
 * Follows the pattern from ExportButton.tsx but customized for analytics endpoint.
 */
export function AnalyticsExportButtons() {
  const [loadingFormat, setLoadingFormat] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = useCallback(async (format: 'xlsx' | 'csv') => {
    setLoadingFormat(format);
    setError(null);

    try {
      const url = `/api/analytics/export?format=${format}`;
      const response = await fetch(url);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Export failed');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch
        ? filenameMatch[1]
        : `analytics-export.${format}`;

      // Download file
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed';
      setError(message);
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoadingFormat(null);
    }
  }, []);

  const baseClasses =
    'px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses =
    'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700';

  return (
    <div className="relative flex gap-2">
      {/* Excel Export Button */}
      <button
        onClick={() => handleExport('xlsx')}
        disabled={loadingFormat !== null}
        className={`${baseClasses} ${variantClasses}`}
        title={error || undefined}
      >
        {loadingFormat === 'xlsx' ? (
          // Loading spinner
          <svg
            className="w-4 h-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          // Download icon
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
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        )}
        {loadingFormat === 'xlsx' ? 'Exporting...' : 'Export Excel'}
      </button>

      {/* CSV Export Button */}
      <button
        onClick={() => handleExport('csv')}
        disabled={loadingFormat !== null}
        className={`${baseClasses} ${variantClasses}`}
        title={error || undefined}
      >
        {loadingFormat === 'csv' ? (
          // Loading spinner
          <svg
            className="w-4 h-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          // Download icon
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
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        )}
        {loadingFormat === 'csv' ? 'Exporting...' : 'Export CSV'}
      </button>

      {/* Error toast */}
      {error && (
        <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 whitespace-nowrap z-10">
          {error}
        </div>
      )}
    </div>
  );
}
