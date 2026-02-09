'use client';

import { useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EventTypeSelector, getEventTypeLabel } from '@/components/EventTypeSelector';
import { FormBanner } from '@/components/FormError';
import { DynamicForm } from '@/components/DynamicForm';
import { useToast } from '@/components/Toast';
import {
  EVENT_FORM_FIELDS,
  DATE_ORDER_VALIDATIONS,
  formToEventData,
  type FieldConfig,
} from '@/lib/event-form';
import {
  validateRequired,
  validateWeight,
  validatePositiveNumber,
  validateDate,
  validateDateOrder,
  type ValidationError,
} from '@/lib/validation';
import type { EventType } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function LogEventPage({ params }: PageProps) {
  const { id: campaignId } = use(params);
  const router = useRouter();
  const { showToast } = useToast();

  const [selectedEventType, setSelectedEventType] = useState<EventType | ''>('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<ValidationError[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get fields for selected event type
  const fields: FieldConfig[] = selectedEventType ? EVENT_FORM_FIELDS[selectedEventType] || [] : [];

  // Validate a single field
  const validateField = useCallback((fieldName: string, value: string, allData: Record<string, string>): ValidationError[] => {
    const errors: ValidationError[] = [];
    const field = fields.find((f) => f.name === fieldName);

    if (!field) return errors;

    // Required validation
    if (field.required) {
      const required = validateRequired(value, field.label);
      if (required) {
        errors.push({ ...required, field: fieldName });
        return errors; // Don't continue if required fails
      }
    }

    // Skip further validation if empty and not required
    if (!value || value.trim() === '') return errors;

    // Type-specific validation
    switch (field.validationType) {
      case 'weight': {
        const weightError = validateWeight(value, field.label);
        if (weightError) errors.push({ ...weightError, field: fieldName });
        break;
      }
      case 'positiveNumber': {
        const numError = validatePositiveNumber(value, field.label);
        if (numError) errors.push({ ...numError, field: fieldName });
        break;
      }
      case 'date': {
        const dateError = validateDate(value, field.label);
        if (dateError) errors.push({ ...dateError, field: fieldName });

        // Check date order if this field has a pair
        const orderConfig = DATE_ORDER_VALIDATIONS[fieldName];
        if (orderConfig && allData[orderConfig.earlier]) {
          const earlierField = fields.find((f) => f.name === orderConfig.earlier);
          const orderError = validateDateOrder(
            allData[orderConfig.earlier],
            value,
            earlierField?.label || orderConfig.earlier,
            field.label
          );
          if (orderError) errors.push({ ...orderError, field: fieldName });
        }
        break;
      }
    }

    // Special case: output weight vs starting weight
    if (fieldName === 'outputWeightKg' && allData.startingWeightKg && value) {
      const output = parseFloat(value);
      const start = parseFloat(allData.startingWeightKg);
      if (!isNaN(output) && !isNaN(start) && output > start) {
        errors.push({ field: fieldName, message: 'Output weight cannot exceed starting weight' });
      }
    }

    // Special case: net weight vs gross weight
    if (fieldName === 'netWeightKg' && allData.grossWeightKg && value) {
      const net = parseFloat(value);
      const gross = parseFloat(allData.grossWeightKg);
      if (!isNaN(net) && !isNaN(gross) && net > gross) {
        errors.push({ field: fieldName, message: 'Net weight cannot exceed gross weight' });
      }
    }

    return errors;
  }, [fields]);

  // Reset form when event type changes
  function handleEventTypeChange(eventType: EventType) {
    setSelectedEventType(eventType);
    setFormData({});
    setFieldErrors([]);
    setTouched({});
    setError(null);
  }

  // Handle field blur - run validation
  const handleBlur = useCallback((name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));

    const errors = validateField(name, formData[name] || '', formData);

    setFieldErrors((prev) => {
      // Remove existing errors for this field
      const filtered = prev.filter((e) => e.field !== name);
      // Add new errors
      return [...filtered, ...errors];
    });
  }, [formData, validateField]);

  // Update form field
  const handleFieldChange = useCallback((name: string, value: string) => {
    const newData = { ...formData, [name]: value };
    setFormData(newData);

    // Re-validate if field was touched
    if (touched[name]) {
      const errors = validateField(name, value, newData);
      setFieldErrors((prev) => {
        const filtered = prev.filter((e) => e.field !== name);
        return [...filtered, ...errors];
      });
    }
  }, [formData, touched, validateField]);

  // Validate all fields before submit
  const validateAll = useCallback((): boolean => {
    const allErrors: ValidationError[] = [];
    const allTouched: Record<string, boolean> = {};

    for (const field of fields) {
      allTouched[field.name] = true;
      const errors = validateField(field.name, formData[field.name] || '', formData);
      allErrors.push(...errors);
    }

    setFieldErrors(allErrors);
    setTouched(allTouched);

    return allErrors.length === 0;
  }, [fields, formData, validateField]);

  // Check if form is valid (for button state)
  function isFormValid(): boolean {
    if (!selectedEventType || fields.length === 0) return false;

    for (const field of fields) {
      if (field.required) {
        const value = formData[field.name];
        if (!value || value.trim() === '') {
          return false;
        }
      }
    }

    // Also check if there are any validation errors
    return fieldErrors.length === 0;
  }

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedEventType) return;

    // Validate all fields
    if (!validateAll()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const eventData = formToEventData(fields, formData);

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: selectedEventType,
          campaignId,
          eventData,
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
          setError(data.error || 'Failed to log event');
        }
        setLoading(false);
        return;
      }

      showToast('success', `${getEventTypeLabel(selectedEventType)} logged successfully`);
      router.push(`/campaigns/${campaignId}`);
    } catch {
      // Network error
      showToast('error', 'Unable to connect to server. Please check your connection.', 'Network Error');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
      {/* Header with back link */}
      <div className="mb-8">
        <Link
          href={`/campaigns/${campaignId}`}
          className="inline-flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to campaign
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Log Event
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Record a new event for this campaign
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
          {/* Form-level error banner */}
          {error && (
            <FormBanner
              title="Failed to log event"
              message={error}
              onDismiss={() => setError(null)}
            />
          )}

          {/* Event Type Selector */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Event Type <span className="text-red-500">*</span>
            </label>
            <EventTypeSelector
              value={selectedEventType}
              onChange={handleEventTypeChange}
              showDescriptions
            />
          </div>

          {/* Dynamic form fields */}
          {selectedEventType && fields.length > 0 && (
            <>
              <hr className="border-zinc-200 dark:border-zinc-700" />

              <div>
                <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-4">
                  {getEventTypeLabel(selectedEventType)} Details
                </h2>
                <DynamicForm
                  fields={fields}
                  formData={formData}
                  fieldErrors={fieldErrors}
                  touched={touched}
                  onChange={handleFieldChange}
                  onBlur={handleBlur}
                />
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <Link
            href={`/campaigns/${campaignId}`}
            className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || !isFormValid()}
            className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              'Log Event'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
