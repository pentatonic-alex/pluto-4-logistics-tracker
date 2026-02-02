/**
 * Form validation utilities
 * 
 * Provides both client-side and server-side validation for forms.
 * Returns structured error responses for consistent error handling.
 */

export interface ValidationError {
  field?: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// ============================================================================
// Field Validators
// ============================================================================

/**
 * Validate that a field is not empty
 */
export function validateRequired(value: string | null | undefined, fieldName: string): ValidationError | null {
  if (!value || value.trim() === '') {
    return { field: fieldName, message: `${fieldName} is required` };
  }
  return null;
}

/**
 * Validate that a number is positive
 */
export function validatePositiveNumber(
  value: string | number | null | undefined,
  fieldName: string
): ValidationError | null {
  if (value === null || value === undefined || value === '') {
    return null; // Let required validation handle empty
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return { field: fieldName, message: `${fieldName} must be a valid number` };
  }

  if (num < 0) {
    return { field: fieldName, message: `${fieldName} must be a positive number` };
  }

  return null;
}

/**
 * Validate that a weight is positive and non-zero
 */
export function validateWeight(
  value: string | number | null | undefined,
  fieldName: string
): ValidationError | null {
  if (value === null || value === undefined || value === '') {
    return null; // Let required validation handle empty
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return { field: fieldName, message: `${fieldName} must be a valid number` };
  }

  if (num <= 0) {
    return { field: fieldName, message: `${fieldName} must be greater than zero` };
  }

  return null;
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function validateDate(
  value: string | null | undefined,
  fieldName: string
): ValidationError | null {
  if (!value || value.trim() === '') {
    return null; // Let required validation handle empty
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(value)) {
    return { field: fieldName, message: `${fieldName} must be in YYYY-MM-DD format` };
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return { field: fieldName, message: `${fieldName} is not a valid date` };
  }

  return null;
}

/**
 * Validate that a date comes after another date
 */
export function validateDateOrder(
  earlierDate: string | null | undefined,
  laterDate: string | null | undefined,
  earlierFieldName: string,
  laterFieldName: string
): ValidationError | null {
  if (!earlierDate || !laterDate) {
    return null; // Skip if either is empty
  }

  const earlier = new Date(earlierDate);
  const later = new Date(laterDate);

  if (isNaN(earlier.getTime()) || isNaN(later.getTime())) {
    return null; // Let individual date validation handle invalid dates
  }

  if (later < earlier) {
    return {
      field: laterFieldName,
      message: `${laterFieldName} cannot be before ${earlierFieldName}`,
    };
  }

  return null;
}

/**
 * Validate campaign code format
 * Expected format: alphanumeric with dashes, e.g., REPLAY-2026-001
 */
export function validateCampaignCode(
  value: string | null | undefined
): ValidationError | null {
  if (!value || value.trim() === '') {
    return null; // Let required validation handle empty
  }

  const trimmed = value.trim();

  // Must be at least 3 characters
  if (trimmed.length < 3) {
    return {
      field: 'legoCampaignCode',
      message: 'Campaign code must be at least 3 characters',
    };
  }

  // Only allow alphanumeric and dashes
  const codeRegex = /^[A-Za-z0-9-]+$/;
  if (!codeRegex.test(trimmed)) {
    return {
      field: 'legoCampaignCode',
      message: 'Campaign code can only contain letters, numbers, and dashes',
    };
  }

  return null;
}

// ============================================================================
// Form Validators
// ============================================================================

/**
 * Validate campaign creation form
 */
export function validateCampaignCreation(data: {
  legoCampaignCode?: string;
  materialType?: string;
}): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields
  const codeRequired = validateRequired(data.legoCampaignCode, 'Campaign code');
  if (codeRequired) errors.push(codeRequired);

  // Campaign code format
  const codeFormat = validateCampaignCode(data.legoCampaignCode);
  if (codeFormat) errors.push(codeFormat);

  // Material type
  if (!data.materialType || !['PI', 'PCR'].includes(data.materialType)) {
    errors.push({ field: 'materialType', message: 'Material type must be PI or PCR' });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate inbound shipment event data
 */
export function validateInboundShipment(data: Record<string, unknown>): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields
  const requiredFields = ['grossWeightKg', 'netWeightKg', 'carrier', 'trackingRef', 'shipDate', 'arrivalDate'];
  for (const field of requiredFields) {
    const error = validateRequired(data[field] as string, field);
    if (error) errors.push(error);
  }

  // Weight validation
  const grossWeight = validateWeight(data.grossWeightKg as number, 'Gross weight');
  if (grossWeight) errors.push(grossWeight);

  const netWeight = validateWeight(data.netWeightKg as number, 'Net weight');
  if (netWeight) errors.push(netWeight);

  const estimatedAbs = validatePositiveNumber(data.estimatedAbsKg as number, 'Estimated ABS');
  if (estimatedAbs) errors.push(estimatedAbs);

  // Net weight should not exceed gross weight
  if (data.grossWeightKg && data.netWeightKg) {
    const gross = typeof data.grossWeightKg === 'string' ? parseFloat(data.grossWeightKg) : data.grossWeightKg as number;
    const net = typeof data.netWeightKg === 'string' ? parseFloat(data.netWeightKg) : data.netWeightKg as number;
    if (net > gross) {
      errors.push({ field: 'netWeightKg', message: 'Net weight cannot exceed gross weight' });
    }
  }

  // Date validation
  const shipDateError = validateDate(data.shipDate as string, 'Ship date');
  if (shipDateError) errors.push(shipDateError);

  const arrivalDateError = validateDate(data.arrivalDate as string, 'Arrival date');
  if (arrivalDateError) errors.push(arrivalDateError);

  // Date order
  const dateOrder = validateDateOrder(
    data.shipDate as string,
    data.arrivalDate as string,
    'Ship date',
    'Arrival date'
  );
  if (dateOrder) errors.push(dateOrder);

  return { valid: errors.length === 0, errors };
}

/**
 * Validate processing step event data (Granulation, Metal Removal, Polymer Purification, Extrusion)
 */
export function validateProcessingStep(data: Record<string, unknown>): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields
  const ticketRequired = validateRequired(data.ticketNumber as string, 'Ticket number');
  if (ticketRequired) errors.push(ticketRequired);

  // Weight validation
  const startWeight = validateWeight(data.startingWeightKg as number, 'Starting weight');
  if (startWeight) errors.push(startWeight);

  const outputWeight = validateWeight(data.outputWeightKg as number, 'Output weight');
  if (outputWeight) errors.push(outputWeight);

  // Output weight should not exceed starting weight
  if (data.startingWeightKg && data.outputWeightKg) {
    const start = typeof data.startingWeightKg === 'string' ? parseFloat(data.startingWeightKg) : data.startingWeightKg as number;
    const output = typeof data.outputWeightKg === 'string' ? parseFloat(data.outputWeightKg) : data.outputWeightKg as number;
    if (output > start) {
      errors.push({ field: 'outputWeightKg', message: 'Output weight cannot exceed starting weight' });
    }
  }

  // Process hours (optional but must be positive)
  const processHours = validatePositiveNumber(data.processHours as number, 'Process hours');
  if (processHours) errors.push(processHours);

  return { valid: errors.length === 0, errors };
}

/**
 * Validate transfer event data (TransferToRGE, ReturnToLEGO)
 */
export function validateTransfer(data: Record<string, unknown>): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields
  const trackingRef = validateRequired(data.trackingRef as string, 'Tracking reference');
  if (trackingRef) errors.push(trackingRef);

  const carrier = validateRequired(data.carrier as string, 'Carrier');
  if (carrier) errors.push(carrier);

  const shipDate = validateRequired(data.shipDate as string, 'Ship date');
  if (shipDate) errors.push(shipDate);

  // Date validation
  const shipDateError = validateDate(data.shipDate as string, 'Ship date');
  if (shipDateError) errors.push(shipDateError);

  const receivedDateError = validateDate(data.receivedDate as string, 'Received date');
  if (receivedDateError) errors.push(receivedDateError);

  // Date order (if received date provided)
  if (data.receivedDate) {
    const dateOrder = validateDateOrder(
      data.shipDate as string,
      data.receivedDate as string,
      'Ship date',
      'Received date'
    );
    if (dateOrder) errors.push(dateOrder);
  }

  // Weight validation (optional)
  const receivedWeight = validatePositiveNumber(data.receivedWeightKg as number, 'Received weight');
  if (receivedWeight) errors.push(receivedWeight);

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// Error Helpers
// ============================================================================

/**
 * Get error message for a specific field
 */
export function getFieldError(errors: ValidationError[], field: string): string | null {
  const error = errors.find((e) => e.field === field);
  return error?.message || null;
}

/**
 * Check if a field has an error
 */
export function hasFieldError(errors: ValidationError[], field: string): boolean {
  return errors.some((e) => e.field === field);
}

/**
 * Get all errors as a single message
 */
export function getErrorSummary(errors: ValidationError[]): string {
  return errors.map((e) => e.message).join('. ');
}
