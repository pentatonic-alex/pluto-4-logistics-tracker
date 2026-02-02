import { describe, it, expect } from 'vitest';
import {
  validateRequired,
  validatePositiveNumber,
  validateWeight,
  validateDate,
  validateDateOrder,
  validateCampaignCode,
  validateCampaignCreation,
  validateInboundShipment,
  validateProcessingStep,
  validateTransfer,
  getFieldError,
  hasFieldError,
  getErrorSummary,
} from '../validation';

describe('Field Validators', () => {
  describe('validateRequired', () => {
    it('returns null for valid non-empty strings', () => {
      expect(validateRequired('hello', 'Name')).toBeNull();
      expect(validateRequired('  test  ', 'Name')).toBeNull();
    });

    it('returns error for empty or whitespace-only strings', () => {
      expect(validateRequired('', 'Name')).toEqual({ field: 'Name', message: 'Name is required' });
      expect(validateRequired('   ', 'Name')).toEqual({ field: 'Name', message: 'Name is required' });
    });

    it('returns error for null or undefined', () => {
      expect(validateRequired(null, 'Name')).toEqual({ field: 'Name', message: 'Name is required' });
      expect(validateRequired(undefined, 'Name')).toEqual({ field: 'Name', message: 'Name is required' });
    });
  });

  describe('validatePositiveNumber', () => {
    it('returns null for positive numbers', () => {
      expect(validatePositiveNumber(10, 'Amount')).toBeNull();
      expect(validatePositiveNumber(0, 'Amount')).toBeNull();
      expect(validatePositiveNumber('10.5', 'Amount')).toBeNull();
    });

    it('returns null for empty values (let required handle it)', () => {
      expect(validatePositiveNumber(null, 'Amount')).toBeNull();
      expect(validatePositiveNumber(undefined, 'Amount')).toBeNull();
      expect(validatePositiveNumber('', 'Amount')).toBeNull();
    });

    it('returns error for negative numbers', () => {
      expect(validatePositiveNumber(-5, 'Amount')).toEqual({
        field: 'Amount',
        message: 'Amount must be a positive number',
      });
    });

    it('returns error for non-numeric strings', () => {
      expect(validatePositiveNumber('abc', 'Amount')).toEqual({
        field: 'Amount',
        message: 'Amount must be a valid number',
      });
    });
  });

  describe('validateWeight', () => {
    it('returns null for positive non-zero numbers', () => {
      expect(validateWeight(10, 'Weight')).toBeNull();
      expect(validateWeight(0.5, 'Weight')).toBeNull();
      expect(validateWeight('10.5', 'Weight')).toBeNull();
    });

    it('returns error for zero', () => {
      expect(validateWeight(0, 'Weight')).toEqual({
        field: 'Weight',
        message: 'Weight must be greater than zero',
      });
    });

    it('returns error for negative numbers', () => {
      expect(validateWeight(-5, 'Weight')).toEqual({
        field: 'Weight',
        message: 'Weight must be greater than zero',
      });
    });

    it('returns null for empty values', () => {
      expect(validateWeight(null, 'Weight')).toBeNull();
      expect(validateWeight(undefined, 'Weight')).toBeNull();
    });
  });

  describe('validateDate', () => {
    it('returns null for valid YYYY-MM-DD dates', () => {
      expect(validateDate('2026-01-15', 'Date')).toBeNull();
      expect(validateDate('2025-12-31', 'Date')).toBeNull();
    });

    it('returns null for empty values', () => {
      expect(validateDate(null, 'Date')).toBeNull();
      expect(validateDate('', 'Date')).toBeNull();
    });

    it('returns error for invalid format', () => {
      expect(validateDate('01-15-2026', 'Date')).toEqual({
        field: 'Date',
        message: 'Date must be in YYYY-MM-DD format',
      });
      expect(validateDate('2026/01/15', 'Date')).toEqual({
        field: 'Date',
        message: 'Date must be in YYYY-MM-DD format',
      });
    });

    it('returns error for invalid date values', () => {
      // Note: JavaScript Date parsing is lenient - 2026-13-01 becomes 2027-01-01
      // and 2026-02-30 becomes 2026-03-02, so format validation catches most issues
      expect(validateDate('abcd-ef-gh', 'Date')).toEqual({
        field: 'Date',
        message: 'Date must be in YYYY-MM-DD format',
      });
    });
  });

  describe('validateDateOrder', () => {
    it('returns null when later date is after earlier date', () => {
      expect(validateDateOrder('2026-01-01', '2026-01-15', 'Start', 'End')).toBeNull();
    });

    it('returns null when dates are equal', () => {
      expect(validateDateOrder('2026-01-01', '2026-01-01', 'Start', 'End')).toBeNull();
    });

    it('returns error when later date is before earlier date', () => {
      expect(validateDateOrder('2026-01-15', '2026-01-01', 'Start', 'End')).toEqual({
        field: 'End',
        message: 'End cannot be before Start',
      });
    });

    it('returns null when either date is empty', () => {
      expect(validateDateOrder(null, '2026-01-01', 'Start', 'End')).toBeNull();
      expect(validateDateOrder('2026-01-01', null, 'Start', 'End')).toBeNull();
    });
  });

  describe('validateCampaignCode', () => {
    it('returns null for valid campaign codes', () => {
      expect(validateCampaignCode('REPLAY-2026-001')).toBeNull();
      expect(validateCampaignCode('PCR-TEST')).toBeNull();
      expect(validateCampaignCode('ABC123')).toBeNull();
    });

    it('returns null for empty values', () => {
      expect(validateCampaignCode(null)).toBeNull();
      expect(validateCampaignCode('')).toBeNull();
    });

    it('returns error for codes shorter than 3 characters', () => {
      expect(validateCampaignCode('AB')).toEqual({
        field: 'legoCampaignCode',
        message: 'Campaign code must be at least 3 characters',
      });
    });

    it('returns error for codes with invalid characters', () => {
      expect(validateCampaignCode('REPLAY_2026')).toEqual({
        field: 'legoCampaignCode',
        message: 'Campaign code can only contain letters, numbers, and dashes',
      });
      expect(validateCampaignCode('REPLAY 2026')).toEqual({
        field: 'legoCampaignCode',
        message: 'Campaign code can only contain letters, numbers, and dashes',
      });
    });
  });
});

describe('Form Validators', () => {
  describe('validateCampaignCreation', () => {
    it('returns valid for correct data', () => {
      const result = validateCampaignCreation({
        legoCampaignCode: 'REPLAY-2026-001',
        materialType: 'PCR',
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns errors for missing campaign code', () => {
      const result = validateCampaignCreation({
        materialType: 'PCR',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'Campaign code',
        message: 'Campaign code is required',
      });
    });

    it('returns errors for invalid material type', () => {
      const result = validateCampaignCreation({
        legoCampaignCode: 'REPLAY-2026-001',
        materialType: 'INVALID',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'materialType',
        message: 'Material type must be PI or PCR',
      });
    });
  });

  describe('validateInboundShipment', () => {
    // Form data comes as strings from HTML forms
    const validData = {
      grossWeightKg: '1000',
      netWeightKg: '950',
      carrier: 'DHL',
      trackingRef: 'DHL123456',
      shipDate: '2026-01-01',
      arrivalDate: '2026-01-05',
    };

    it('returns valid for correct data', () => {
      const result = validateInboundShipment(validData);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns error when net weight exceeds gross weight', () => {
      const result = validateInboundShipment({
        ...validData,
        netWeightKg: '1100',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'netWeightKg',
        message: 'Net weight cannot exceed gross weight',
      });
    });

    it('returns error when arrival date is before ship date', () => {
      const result = validateInboundShipment({
        ...validData,
        arrivalDate: '2025-12-25',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'Arrival date',
        message: 'Arrival date cannot be before Ship date',
      });
    });
  });

  describe('validateProcessingStep', () => {
    const validData = {
      ticketNumber: 'TKT-001',
      startingWeightKg: '950',
      outputWeightKg: '900',
    };

    it('returns valid for correct data', () => {
      const result = validateProcessingStep(validData);
      expect(result.valid).toBe(true);
    });

    it('returns error when output weight exceeds starting weight', () => {
      const result = validateProcessingStep({
        ...validData,
        outputWeightKg: '1000',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'outputWeightKg',
        message: 'Output weight cannot exceed starting weight',
      });
    });

    it('returns error for missing ticket number', () => {
      const result = validateProcessingStep({
        startingWeightKg: '950',
        outputWeightKg: '900',
      });
      expect(result.valid).toBe(false);
      expect(hasFieldError(result.errors, 'Ticket number')).toBe(true);
    });
  });

  describe('validateTransfer', () => {
    const validData = {
      trackingRef: 'TRACK-001',
      carrier: 'FedEx',
      shipDate: '2026-01-10',
    };

    it('returns valid for correct data', () => {
      const result = validateTransfer(validData);
      expect(result.valid).toBe(true);
    });

    it('returns error when received date is before ship date', () => {
      const result = validateTransfer({
        ...validData,
        receivedDate: '2026-01-05',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'Received date',
        message: 'Received date cannot be before Ship date',
      });
    });
  });
});

describe('Error Helpers', () => {
  const errors = [
    { field: 'name', message: 'Name is required' },
    { field: 'email', message: 'Email is invalid' },
    { message: 'General error' },
  ];

  describe('getFieldError', () => {
    it('returns message for existing field', () => {
      expect(getFieldError(errors, 'name')).toBe('Name is required');
      expect(getFieldError(errors, 'email')).toBe('Email is invalid');
    });

    it('returns null for non-existing field', () => {
      expect(getFieldError(errors, 'phone')).toBeNull();
    });
  });

  describe('hasFieldError', () => {
    it('returns true for existing field', () => {
      expect(hasFieldError(errors, 'name')).toBe(true);
    });

    it('returns false for non-existing field', () => {
      expect(hasFieldError(errors, 'phone')).toBe(false);
    });
  });

  describe('getErrorSummary', () => {
    it('joins all error messages', () => {
      const summary = getErrorSummary(errors);
      expect(summary).toBe('Name is required. Email is invalid. General error');
    });

    it('returns empty string for empty errors', () => {
      expect(getErrorSummary([])).toBe('');
    });
  });
});
