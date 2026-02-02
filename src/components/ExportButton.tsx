'use client';

import { useState, useCallback } from 'react';

interface ExportButtonProps {
  /**
   * Campaign ID for single export. If not provided, exports all campaigns.
   */
  campaignId?: string;
  /**
   * Status filter for bulk export (e.g., 'active')
   */
  statusFilter?: string;
  /**
   * Button variant - affects styling
   */
  variant?: 'primary' | 'secondary';
  /**
   * Button label
   */
  label?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Export button component with loading state and error handling.
 * Triggers download of Excel file from the export API.
 */
export function ExportButton({
  campaignId,
  statusFilter,
  variant = 'secondary',
  label = 'Export',
  className = '',
}: ExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build URL based on props
      let url = '/api/export';
      if (campaignId) {
        url = `/api/export/${campaignId}`;
      } else if (statusFilter) {
        url = `/api/export?status=${statusFilter}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Export failed');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : 'export.xlsx';

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
      setIsLoading(false);
    }
  }, [campaignId, statusFilter]);

  const baseClasses =
    'px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses =
    variant === 'primary'
      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200'
      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700';

  return (
    <div className="relative">
      <button
        onClick={handleExport}
        disabled={isLoading}
        className={`${baseClasses} ${variantClasses} ${className}`}
        title={error || undefined}
      >
        {isLoading ? (
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
        {isLoading ? 'Exporting...' : label}
      </button>

      {/* Error toast */}
      {error && (
        <div className="absolute top-full left-0 mt-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 whitespace-nowrap z-10">
          {error}
        </div>
      )}
    </div>
  );
}
