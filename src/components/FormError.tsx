'use client';

import { ReactNode } from 'react';

interface FormErrorProps {
  message?: string | null;
  children?: ReactNode;
}

/**
 * Inline field-level error message
 * Display below form inputs to show validation errors
 */
export function FormError({ message, children }: FormErrorProps) {
  const content = message || children;
  
  if (!content) return null;

  return (
    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-start gap-1.5">
      <svg
        className="w-4 h-4 mt-0.5 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01"
        />
      </svg>
      <span>{content}</span>
    </p>
  );
}

interface FormBannerProps {
  title?: string;
  message: string;
  onDismiss?: () => void;
}

/**
 * Form-level error banner
 * Display at top of form for API/submission errors
 */
export function FormBanner({ title = 'Error', message, onDismiss }: FormBannerProps) {
  return (
    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            {title}
          </p>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
            {message}
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
