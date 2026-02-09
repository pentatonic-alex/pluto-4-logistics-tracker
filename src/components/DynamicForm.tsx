'use client';

import { FormError } from '@/components/FormError';
import { getFieldError, type ValidationError } from '@/lib/validation';
import type { FieldConfig } from '@/lib/event-form';

export interface DynamicFormProps {
  fields: FieldConfig[];
  formData: Record<string, string>;
  fieldErrors: ValidationError[];
  touched: Record<string, boolean>;
  onChange: (name: string, value: string) => void;
  onBlur: (name: string) => void;
}

/**
 * Dynamic form component for rendering fields based on FieldConfig array
 *
 * Renders form fields with validation error display, hint text, and
 * required/optional indicators. Used by both the log event page and
 * the log event modal.
 */
export function DynamicForm({
  fields,
  formData,
  fieldErrors,
  touched,
  onChange,
  onBlur,
}: DynamicFormProps) {
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
