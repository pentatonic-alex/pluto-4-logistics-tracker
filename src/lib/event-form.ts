/**
 * Shared event form configuration and utilities
 *
 * This module provides form field definitions and helper functions for the event
 * logging forms used in both the log event page and the log event modal.
 */

import type { EventType } from '@/types';

// Field input types supported by the dynamic form
export type FieldType = 'text' | 'number' | 'date' | 'textarea';

// Configuration for a single form field
export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  step?: string;
  validationType?: 'weight' | 'positiveNumber' | 'date';
}

// Event type to form fields mapping (excludes CampaignCreated and EventCorrected)
export const EVENT_FORM_FIELDS: Partial<Record<EventType, FieldConfig[]>> = {
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

// Date field pairs for order validation (later date field -> validation config)
export const DATE_ORDER_VALIDATIONS: Record<string, { earlier: string; later: string }> = {
  arrivalDate: { earlier: 'shipDate', later: 'arrivalDate' },
  receivedDate: { earlier: 'shipDate', later: 'receivedDate' },
};

/**
 * Convert form values (strings) to event data (proper types)
 *
 * @param fields - The field configurations for the event type
 * @param formData - The raw form data with string values
 * @returns Event data with properly typed values
 */
export function formToEventData(
  fields: FieldConfig[],
  formData: Record<string, string>
): Record<string, unknown> {
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

/**
 * Get the fields configuration for an event type
 *
 * @param eventType - The event type
 * @returns Array of field configurations, or empty array if not found
 */
export function getFieldsForEventType(eventType: EventType | ''): FieldConfig[] {
  if (!eventType) return [];
  return EVENT_FORM_FIELDS[eventType] || [];
}

/**
 * Get the list of loggable event types (excludes CampaignCreated and EventCorrected)
 *
 * @returns Array of event types that can be logged via the form
 */
export function getLoggableEventTypes(): EventType[] {
  return Object.keys(EVENT_FORM_FIELDS) as EventType[];
}
