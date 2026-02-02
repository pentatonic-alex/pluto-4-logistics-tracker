'use client';

import { useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EventTypeSelector, getEventTypeLabel } from '@/components/EventTypeSelector';
import { FormError, FormBanner } from '@/components/FormError';
import { useToast } from '@/components/Toast';
import {
  validateRequired,
  validateWeight,
  validatePositiveNumber,
  validateDate,
  validateDateOrder,
  getFieldError,
  type ValidationError,
} from '@/lib/validation';
import type { EventType } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Field definitions for each event type
type FieldType = 'text' | 'number' | 'date' | 'textarea';

interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  step?: string;
  validationType?: 'weight' | 'positiveNumber' | 'date';
}

// Event type to form fields mapping (excludes CampaignCreated)
const EVENT_FORM_FIELDS: Partial<Record<EventType, FieldConfig[]>> = {
  InboundShipmentRecorded: [
    { name: 'grossWeightKg', label: 'Gross Weight (kg)', type: 'number', required: true, placeholder: '0.00', step: '0.01', validationType: 'weight' },
    { name: 'netWeightKg', label: 'Net Weight (kg)', type: 'number', required: true, placeholder: '0.00', step: '0.01', validationType: 'weight' },
    { name: 'estimatedAbsKg', label: 'Estimated ABS (kg)', type: 'number', placeholder: '0.00', step: '0.01', validationType: 'positiveNumber', hint: 'Estimated ABS content' },
    { name: 'carrier', label: 'Carrier', type: 'text', required: true, placeholder: 'e.g., DHL, FedEx' },
    { name: 'trackingRef', label: 'Tracking Reference', type: 'text', required: true, placeholder: 'Shipment tracking number' },
    { name: 'shipDate', label: 'Ship Date', type: 'date', required: true, validationType: 'date' },
    { name: 'arrivalDate', label: 'Arrival Date', type: 'date', required: true, validationType: 'date' },
  ],

  GranulationCompleted: [
    { name: 'ticketNumber', label: 'Ticket Number', type: 'text', required: true, placeholder: 'Processing ticket ID' },
    { name: 'startingWeightKg', label: 'Starting Weight (kg)', type: 'number', required: true, placeholder: '0.00', step: '0.01', validationType: 'weight' },
    { name: 'outputWeightKg', label: 'Output Weight (kg)', type: 'number', required: true, placeholder: '0.00', step: '0.01', validationType: 'weight' },
    { name: 'contaminationNotes', label: 'Contamination Notes', type: 'textarea', placeholder: 'Notes about contamination found...' },
    { name: 'polymerComposition', label: 'Polymer Composition', type: 'text', placeholder: 'e.g., 85% ABS, 15% other' },
    { name: 'processHours', label: 'Process Hours', type: 'number', placeholder: '0.0', step: '0.1', validationType: 'positiveNumber' },
    { name: 'wasteCode', label: 'Waste Code', type: 'text', placeholder: 'e.g., 19 12 04' },
  ],

  MetalRemovalCompleted: [
    { name: 'ticketNumber', label: 'Ticket Number', type: 'text', required: true, placeholder: 'Processing ticket ID' },
    { name: 'startingWeightKg', label: 'Starting Weight (kg)', type: 'number', required: true, placeholder: '0.00', step: '0.01', validationType: 'weight' },
    { name: 'outputWeightKg', label: 'Output Weight (kg)', type: 'number', required: true, placeholder: '0.00', step: '0.01', validationType: 'weight' },
    { name: 'processHours', label: 'Process Hours', type: 'number', placeholder: '0.0', step: '0.1', validationType: 'positiveNumber' },
    { name: 'wasteCode', label: 'Waste Code', type: 'text', placeholder: 'e.g., 19 12 02' },
  ],

  PolymerPurificationCompleted: [
    { name: 'ticketNumber', label: 'Ticket Number', type: 'text', required: true, placeholder: 'Processing ticket ID' },
    { name: 'startingWeightKg', label: 'Starting Weight (kg)', type: 'number', required: true, placeholder: '0.00', step: '0.01', validationType: 'weight' },
    { name: 'outputWeightKg', label: 'Output Weight (kg)', type: 'number', required: true, placeholder: '0.00', step: '0.01', validationType: 'weight' },
    { name: 'polymerComposition', label: 'Polymer Composition', type: 'text', placeholder: 'e.g., 95% ABS' },
    { name: 'wasteComposition', label: 'Waste Composition', type: 'text', placeholder: 'e.g., 5% contaminants' },
    { name: 'processHours', label: 'Process Hours', type: 'number', placeholder: '0.0', step: '0.1', validationType: 'positiveNumber' },
    { name: 'wasteCode', label: 'Waste Code', type: 'text', placeholder: 'e.g., 19 12 04' },
  ],

  ExtrusionCompleted: [
    { name: 'ticketNumber', label: 'Ticket Number', type: 'text', required: true, placeholder: 'Processing ticket ID' },
    { name: 'startingWeightKg', label: 'Starting Weight (kg)', type: 'number', required: true, placeholder: '0.00', step: '0.01', validationType: 'weight' },
    { name: 'outputWeightKg', label: 'Output Weight (kg)', type: 'number', required: true, placeholder: '0.00', step: '0.01', validationType: 'weight' },
    { name: 'batchNumber', label: 'Batch Number', type: 'text', required: true, placeholder: 'Pellet batch ID' },
    { name: 'processHours', label: 'Process Hours', type: 'number', placeholder: '0.0', step: '0.1', validationType: 'positiveNumber' },
  ],

  ECHAApprovalRecorded: [
    { name: 'approvedBy', label: 'Approved By', type: 'text', required: true, placeholder: 'Name of approving authority' },
    { name: 'approvalDate', label: 'Approval Date', type: 'date', required: true, validationType: 'date' },
    { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Approval details or conditions...' },
  ],

  TransferToRGERecorded: [
    { name: 'trackingRef', label: 'Tracking Reference', type: 'text', required: true, placeholder: 'Shipment tracking number' },
    { name: 'carrier', label: 'Carrier', type: 'text', required: true, placeholder: 'e.g., DHL, FedEx' },
    { name: 'shipDate', label: 'Ship Date', type: 'date', required: true, validationType: 'date' },
    { name: 'receivedDate', label: 'Received Date', type: 'date', placeholder: 'Date received at RGE', validationType: 'date' },
    { name: 'receivedWeightKg', label: 'Received Weight (kg)', type: 'number', placeholder: '0.00', step: '0.01', validationType: 'weight' },
  ],

  ManufacturingStarted: [
    { name: 'poNumber', label: 'PO Number', type: 'text', required: true, placeholder: 'Purchase order number' },
    { name: 'poQuantity', label: 'PO Quantity', type: 'number', required: true, placeholder: '0', hint: 'Number of units ordered', validationType: 'positiveNumber' },
    { name: 'startDate', label: 'Start Date', type: 'date', required: true, validationType: 'date' },
  ],

  ManufacturingCompleted: [
    { name: 'endDate', label: 'End Date', type: 'date', required: true, validationType: 'date' },
    { name: 'actualQuantity', label: 'Actual Quantity', type: 'number', required: true, placeholder: '0', hint: 'Number of units produced', validationType: 'positiveNumber' },
    { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Production notes...' },
  ],

  ReturnToLEGORecorded: [
    { name: 'trackingRef', label: 'Tracking Reference', type: 'text', required: true, placeholder: 'Shipment tracking number' },
    { name: 'carrier', label: 'Carrier', type: 'text', required: true, placeholder: 'e.g., DHL, FedEx' },
    { name: 'shipDate', label: 'Ship Date', type: 'date', required: true, validationType: 'date' },
    { name: 'receivedDate', label: 'Received Date', type: 'date', placeholder: 'Date received at LEGO', validationType: 'date' },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, placeholder: '0', hint: 'Number of units shipped', validationType: 'positiveNumber' },
  ],

  CampaignCompleted: [
    { name: 'completionNotes', label: 'Completion Notes', type: 'textarea', placeholder: 'Final notes about the campaign...' },
  ],
};

// Date field pairs for order validation
const DATE_ORDER_VALIDATIONS: Record<string, { earlier: string; later: string }> = {
  arrivalDate: { earlier: 'shipDate', later: 'arrivalDate' },
  receivedDate: { earlier: 'shipDate', later: 'receivedDate' },
};

// Helper to convert form values to event data
function formToEventData(fields: FieldConfig[], formData: Record<string, string>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  
  for (const field of fields) {
    const value = formData[field.name];
    
    if (value === '' || value === undefined) {
      continue; // Skip empty optional fields
    }
    
    switch (field.type) {
      case 'number':
        data[field.name] = parseFloat(value);
        break;
      default:
        data[field.name] = value;
    }
  }
  
  return data;
}

// Dynamic form component for rendering fields
function DynamicForm({
  fields,
  formData,
  fieldErrors,
  touched,
  onChange,
  onBlur,
}: {
  fields: FieldConfig[];
  formData: Record<string, string>;
  fieldErrors: ValidationError[];
  touched: Record<string, boolean>;
  onChange: (name: string, value: string) => void;
  onBlur: (name: string) => void;
}) {
  const getInputClass = (fieldName: string) => {
    const hasError = touched[fieldName] && getFieldError(fieldErrors, fieldName);
    const baseClass = 'w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:border-transparent';
    const errorClass = hasError
      ? 'border-red-300 dark:border-red-700 focus:ring-red-500'
      : 'border-zinc-300 dark:border-zinc-700 focus:ring-blue-500';
    return `${baseClass} ${errorClass}`;
  };

  return (
    <div className="space-y-4">
      {fields.map((field) => {
        const fieldError = touched[field.name] ? getFieldError(fieldErrors, field.name) : null;
        
        return (
          <div key={field.name}>
            <label
              htmlFor={field.name}
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              {field.label}
              {field.required ? (
                <span className="text-red-500 ml-1">*</span>
              ) : (
                <span className="text-zinc-400 dark:text-zinc-500 font-normal ml-2">(optional)</span>
              )}
            </label>

            {field.type === 'textarea' ? (
              <textarea
                id={field.name}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={(e) => onChange(field.name, e.target.value)}
                onBlur={() => onBlur(field.name)}
                placeholder={field.placeholder}
                rows={3}
                className={`${getInputClass(field.name)} resize-none`}
                aria-invalid={!!fieldError}
              />
            ) : field.type === 'date' ? (
              <input
                type="date"
                id={field.name}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={(e) => onChange(field.name, e.target.value)}
                onBlur={() => onBlur(field.name)}
                className={getInputClass(field.name)}
                aria-invalid={!!fieldError}
              />
            ) : field.type === 'number' ? (
              <input
                type="number"
                id={field.name}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={(e) => onChange(field.name, e.target.value)}
                onBlur={() => onBlur(field.name)}
                placeholder={field.placeholder}
                step={field.step || 'any'}
                min="0"
                className={getInputClass(field.name)}
                aria-invalid={!!fieldError}
              />
            ) : (
              <input
                type="text"
                id={field.name}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={(e) => onChange(field.name, e.target.value)}
                onBlur={() => onBlur(field.name)}
                placeholder={field.placeholder}
                className={getInputClass(field.name)}
                aria-invalid={!!fieldError}
              />
            )}

            {fieldError ? (
              <FormError message={fieldError} />
            ) : field.hint ? (
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">{field.hint}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
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
  const fields = selectedEventType ? EVENT_FORM_FIELDS[selectedEventType] || [] : [];

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
