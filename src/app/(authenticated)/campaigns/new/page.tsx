'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FormError, FormBanner } from '@/components/FormError';
import { useToast } from '@/components/Toast';
import { validateRequired, validateCampaignCode, getFieldError, type ValidationError } from '@/lib/validation';
import type { MaterialType } from '@/types';

export default function NewCampaignPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ValidationError[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    legoCampaignCode: '',
    materialType: 'PCR' as MaterialType,
    description: '',
  });

  // Validate a single field
  const validateField = useCallback((field: string, value: string): ValidationError | null => {
    switch (field) {
      case 'legoCampaignCode': {
        const required = validateRequired(value, 'Campaign code');
        if (required) return required;
        return validateCampaignCode(value);
      }
      default:
        return null;
    }
  }, []);

  // Handle field blur - run validation
  const handleBlur = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    
    const error = validateField(field, formData[field as keyof typeof formData] as string);
    
    setFieldErrors((prev) => {
      // Remove existing error for this field
      const filtered = prev.filter((e) => e.field !== field);
      // Add new error if exists
      return error ? [...filtered, error] : filtered;
    });
  }, [formData, validateField]);

  // Handle field change
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear field error when user types (if touched)
    if (touched[field]) {
      const error = validateField(field, value);
      setFieldErrors((prev) => {
        const filtered = prev.filter((e) => e.field !== field);
        return error ? [...filtered, error] : filtered;
      });
    }
  };

  // Validate all fields before submit
  const validateAll = (): boolean => {
    const errors: ValidationError[] = [];
    
    // Campaign code
    const codeError = validateField('legoCampaignCode', formData.legoCampaignCode);
    if (codeError) errors.push(codeError);

    // Material type is always valid (select with default)
    
    setFieldErrors(errors);
    setTouched({ legoCampaignCode: true, materialType: true });
    
    return errors.length === 0;
  };

  // Check if form can be submitted
  const canSubmit = formData.legoCampaignCode.trim().length > 0 && fieldErrors.length === 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Validate all fields
    if (!validateAll()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: 'CampaignCreated',
          eventData: {
            legoCampaignCode: formData.legoCampaignCode.trim(),
            materialType: formData.materialType,
            description: formData.description.trim() || undefined,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific field errors from server
        if (data.field) {
          setFieldErrors([{ field: data.field, message: data.error }]);
          setTouched((prev) => ({ ...prev, [data.field]: true }));
        } else if (response.status === 401) {
          // Session expired
          showToast('error', 'Your session has expired. Please log in again.', 'Session Expired');
          router.push('/login');
          return;
        } else {
          setError(data.error || 'Failed to create campaign');
        }
        setLoading(false);
        return;
      }

      showToast('success', 'Campaign created successfully');
      router.push(`/campaigns/${data.campaignId}`);
    } catch {
      // Network error
      showToast('error', 'Unable to connect to server. Please check your connection.', 'Network Error');
      setLoading(false);
    }
  }

  // Get CSS class for input based on error state
  const getInputClass = (field: string) => {
    const hasError = touched[field] && getFieldError(fieldErrors, field);
    const baseClass = 'w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:border-transparent';
    const errorClass = hasError
      ? 'border-red-300 dark:border-red-700 focus:ring-red-500'
      : 'border-zinc-300 dark:border-zinc-700 focus:ring-blue-500';
    return `${baseClass} ${errorClass}`;
  };

  return (
    <div className="max-w-xl mx-auto sm:mx-0">
      {/* Header with back link */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to campaigns
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          New Campaign
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Create a new campaign to track material through the supply chain
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
          {/* Form-level error banner */}
          {error && (
            <FormBanner
              title="Failed to create campaign"
              message={error}
              onDismiss={() => setError(null)}
            />
          )}

          {/* LEGO Campaign Code */}
          <div>
            <label
              htmlFor="legoCampaignCode"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              LEGO Campaign Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="legoCampaignCode"
              value={formData.legoCampaignCode}
              onChange={(e) => handleChange('legoCampaignCode', e.target.value)}
              onBlur={() => handleBlur('legoCampaignCode')}
              placeholder="e.g., REPLAY-2026-001"
              className={getInputClass('legoCampaignCode')}
              aria-invalid={touched.legoCampaignCode && !!getFieldError(fieldErrors, 'legoCampaignCode')}
              aria-describedby="legoCampaignCode-error legoCampaignCode-hint"
            />
            {touched.legoCampaignCode && (
              <FormError message={getFieldError(fieldErrors, 'legoCampaignCode')} />
            )}
            {!getFieldError(fieldErrors, 'legoCampaignCode') && (
              <p id="legoCampaignCode-hint" className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                The unique identifier from LEGO for this campaign
              </p>
            )}
          </div>

          {/* Material Type */}
          <div>
            <label
              htmlFor="materialType"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Material Type <span className="text-red-500">*</span>
            </label>
            <select
              id="materialType"
              value={formData.materialType}
              onChange={(e) => handleChange('materialType', e.target.value)}
              className={getInputClass('materialType') + ' appearance-none cursor-pointer'}
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px' }}
            >
              <option value="PCR">PCR - Post-Consumer Recycled</option>
              <option value="PI">PI - Post-Industrial</option>
            </select>
            <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              The type of recycled material being processed
            </p>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Description
              <span className="text-zinc-400 dark:text-zinc-500 font-normal ml-2">(optional)</span>
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Optional notes about this campaign..."
              rows={3}
              className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <Link
            href="/"
            className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating...
              </>
            ) : (
              'Create Campaign'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
