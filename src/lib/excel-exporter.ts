import * as XLSX from 'xlsx';
import type { Campaign, BaseEvent, EventType, MaterialType } from '@/types';
import { SHEET_NAMES } from './excel-parser';

/**
 * Excel Export Module
 *
 * Inverse of excel-parser.ts - builds Excel workbooks from campaign data.
 * Column order must exactly match the parser for round-trip compatibility.
 */

// Type for event data with typed payloads
interface InboundShipmentEventData {
  grossWeightKg?: number;
  netWeightKg?: number;
  estimatedAbsKg?: number;
  materialPortfolioLink?: string;
  requestedArrivalDate?: string;
  acceptedArrivalDate?: string;
  trackingRef?: string;
  carrier?: string;
  shipDate?: string;
  arrivalDate?: string;
}

interface ProcessingEventData {
  ticketNumber?: string;
  shippingId?: string;
  materialType?: MaterialType;
  date?: string;
  site?: string;
  location?: string;
  process?: string;
  startingWeightKg?: number;
  outputWeightKg?: number;
  contaminationNotes?: string;
  polymerComposition?: string;
  processHours?: number;
  yieldPercent?: number;
  lossPercent?: number;
  wasteCode?: string;
  deliveryLocation?: string;
  deliveryDate?: string;
  notes?: string;
  // Polymer purification specific
  outputPolymerComposition?: string;
  wasteComposition?: string;
  // Extrusion specific
  batchNumber?: string;
  echaComplete?: boolean;
}

interface TransferEventData {
  trackingRef?: string;
  carrier?: string;
  receivedDate?: string;
  receivedGrossWeightKg?: number;
  receivedNetWeightKg?: number;
  receivedWeightKg?: number;
}

interface ManufacturingEventData {
  poNumber?: string;
  poQuantity?: number;
  startDate?: string;
  endDate?: string;
  requestedPickupDate?: string;
  actualPickupDate?: string;
}

interface ECHAApprovalEventData {
  approvedBy?: string;
  approvalDate?: string;
  notes?: string;
}

// Header rows for each sheet (must match parser column order)
const HEADERS = {
  INBOUND_SHIPMENT: [
    'Campaign Code',
    'Requested Arrival Date',
    'Gross Weight (kg)',
    'Net Weight (kg)',
    'Estimated ABS (kg)',
    'Material Portfolio Link',
    'Accepted Arrival Date',
    'Tracking Ref',
    'Carrier',
    'Ship Date',
    'Arrival Date',
  ],
  GRANULATION: [
    'Ticket Number',
    'Shipping ID',
    'Material Type',
    'Campaign Code',
    'Date',
    'Site',
    'Location',
    'Process',
    'Starting Weight (kg)',
    'Output Weight (kg)',
    'Contamination Notes',
    'Polymer Composition',
    'Process Hours',
    'Yield %',
    'Loss %',
    'Waste Code',
    'Delivery Location',
    'Delivery Date',
    'Notes',
  ],
  METAL_REMOVAL: [
    'Ticket Number',
    'Campaign Code',
    'Date',
    'Site',
    'Location',
    'Process',
    'Starting Weight (kg)',
    'Polymer Composition',
    'Output Weight (kg)',
    'Process Hours',
    'Yield %',
    'Loss %',
    'Waste Code',
    'Delivery Location',
    'Notes',
  ],
  POLYMER_PURIFICATION: [
    'Ticket Number',
    'Campaign Code',
    'Date',
    'Site',
    'Location',
    'Process',
    'Starting Weight (kg)',
    'Polymer Composition',
    'Output Weight (kg)',
    'Output Polymer Composition',
    'Waste Composition',
    'Process Hours',
    'Yield %',
    'Loss %',
    'Waste Code',
    'Delivery Location',
    'Notes',
  ],
  EXTRUSION: [
    'Ticket Number',
    'Campaign Code',
    'Date',
    'Site',
    'Location',
    'Process',
    'Starting Weight (kg)',
    'Polymer Composition',
    'Output Weight (kg)',
    'Process Hours',
    'Yield %',
    'Loss %',
    'Batch Number',
    'Delivery Location',
    'ECHA Complete',
    'Delivery Date',
    'Notes',
  ],
  ECHA_COMPLIANCE: [
    'Campaign Code',
    'ECHA Status',
    'Approval Date',
    'Approved By',
    'Notes',
  ],
  TRANSFER_MBA_RGE: [
    'Campaign Code',
    'Tracking Ref',
    'Carrier',
    'Received Date',
    'Received Gross Weight (kg)',
    'Received Net Weight (kg)',
  ],
  RGE_MANUFACTURING: [
    'Campaign Code',
    'PO Number',
    'PO Quantity',
    'Start Date',
    'End Date',
    'Requested Pickup Date',
    'Actual Pickup Date',
  ],
} as const;

/**
 * Format a date for Excel output
 */
function formatDate(isoDate: string | undefined | null): string | undefined {
  if (!isoDate) return undefined;
  // Return as ISO date string (YYYY-MM-DD)
  return isoDate.split('T')[0];
}

/**
 * Format a boolean for Excel output
 */
function formatBoolean(value: boolean | undefined | null): string | undefined {
  if (value === undefined || value === null) return undefined;
  return value ? 'Yes' : 'No';
}

/**
 * Get events of specific types for a campaign from the events map
 */
function getEventsByType(
  events: BaseEvent[],
  types: EventType | EventType[]
): BaseEvent[] {
  const typeArray = Array.isArray(types) ? types : [types];
  return events.filter((e) => typeArray.includes(e.eventType));
}

/**
 * Build Inbound Shipment sheet data
 */
function buildInboundShipmentRows(
  campaigns: Campaign[],
  eventsMap: Map<string, BaseEvent[]>
): unknown[][] {
  const rows: unknown[][] = [[...HEADERS.INBOUND_SHIPMENT]];

  for (const campaign of campaigns) {
    const events = eventsMap.get(campaign.id) || [];
    const shipmentEvents = getEventsByType(events, 'InboundShipmentRecorded');

    if (shipmentEvents.length === 0) {
      // Still include campaign with empty data
      rows.push([campaign.legoCampaignCode]);
    } else {
      for (const event of shipmentEvents) {
        const data = event.eventData as InboundShipmentEventData;
        rows.push([
          campaign.legoCampaignCode,
          formatDate(data.requestedArrivalDate),
          data.grossWeightKg,
          data.netWeightKg,
          data.estimatedAbsKg,
          data.materialPortfolioLink,
          formatDate(data.acceptedArrivalDate),
          data.trackingRef,
          data.carrier,
          formatDate(data.shipDate),
          formatDate(data.arrivalDate),
        ]);
      }
    }
  }

  return rows;
}

/**
 * Build Granulation sheet data
 */
function buildGranulationRows(
  campaigns: Campaign[],
  eventsMap: Map<string, BaseEvent[]>
): unknown[][] {
  const rows: unknown[][] = [[...HEADERS.GRANULATION]];

  for (const campaign of campaigns) {
    const events = eventsMap.get(campaign.id) || [];
    const granulationEvents = getEventsByType(events, 'GranulationCompleted');

    for (const event of granulationEvents) {
      const data = event.eventData as ProcessingEventData;
      rows.push([
        data.ticketNumber,
        data.shippingId,
        data.materialType || campaign.materialType,
        campaign.legoCampaignCode,
        formatDate(data.date),
        data.site,
        data.location,
        data.process,
        data.startingWeightKg,
        data.outputWeightKg,
        data.contaminationNotes,
        data.polymerComposition,
        data.processHours,
        data.yieldPercent,
        data.lossPercent,
        data.wasteCode,
        data.deliveryLocation,
        formatDate(data.deliveryDate),
        data.notes,
      ]);
    }
  }

  return rows;
}

/**
 * Build Metal Removal sheet data
 */
function buildMetalRemovalRows(
  campaigns: Campaign[],
  eventsMap: Map<string, BaseEvent[]>
): unknown[][] {
  const rows: unknown[][] = [[...HEADERS.METAL_REMOVAL]];

  for (const campaign of campaigns) {
    const events = eventsMap.get(campaign.id) || [];
    const metalRemovalEvents = getEventsByType(events, 'MetalRemovalCompleted');

    for (const event of metalRemovalEvents) {
      const data = event.eventData as ProcessingEventData;
      rows.push([
        data.ticketNumber,
        campaign.legoCampaignCode,
        formatDate(data.date),
        data.site,
        data.location,
        data.process,
        data.startingWeightKg,
        data.polymerComposition,
        data.outputWeightKg,
        data.processHours,
        data.yieldPercent,
        data.lossPercent,
        data.wasteCode,
        data.deliveryLocation,
        data.notes,
      ]);
    }
  }

  return rows;
}

/**
 * Build Polymer Purification sheet data
 */
function buildPolymerPurificationRows(
  campaigns: Campaign[],
  eventsMap: Map<string, BaseEvent[]>
): unknown[][] {
  const rows: unknown[][] = [[...HEADERS.POLYMER_PURIFICATION]];

  for (const campaign of campaigns) {
    const events = eventsMap.get(campaign.id) || [];
    const purificationEvents = getEventsByType(
      events,
      'PolymerPurificationCompleted'
    );

    for (const event of purificationEvents) {
      const data = event.eventData as ProcessingEventData;
      rows.push([
        data.ticketNumber,
        campaign.legoCampaignCode,
        formatDate(data.date),
        data.site,
        data.location,
        data.process,
        data.startingWeightKg,
        data.polymerComposition,
        data.outputWeightKg,
        data.outputPolymerComposition,
        data.wasteComposition,
        data.processHours,
        data.yieldPercent,
        data.lossPercent,
        data.wasteCode,
        data.deliveryLocation,
        data.notes,
      ]);
    }
  }

  return rows;
}

/**
 * Build Extrusion sheet data
 */
function buildExtrusionRows(
  campaigns: Campaign[],
  eventsMap: Map<string, BaseEvent[]>
): unknown[][] {
  const rows: unknown[][] = [[...HEADERS.EXTRUSION]];

  for (const campaign of campaigns) {
    const events = eventsMap.get(campaign.id) || [];
    const extrusionEvents = getEventsByType(events, 'ExtrusionCompleted');

    for (const event of extrusionEvents) {
      const data = event.eventData as ProcessingEventData;
      rows.push([
        data.ticketNumber,
        campaign.legoCampaignCode,
        formatDate(data.date),
        data.site,
        data.location,
        data.process,
        data.startingWeightKg,
        data.polymerComposition,
        data.outputWeightKg,
        data.processHours,
        data.yieldPercent,
        data.lossPercent,
        data.batchNumber,
        data.deliveryLocation,
        formatBoolean(data.echaComplete),
        formatDate(data.deliveryDate),
        data.notes,
      ]);
    }
  }

  return rows;
}

/**
 * Build ECHA Compliance sheet data
 */
function buildEchaComplianceRows(
  campaigns: Campaign[],
  eventsMap: Map<string, BaseEvent[]>
): unknown[][] {
  const rows: unknown[][] = [[...HEADERS.ECHA_COMPLIANCE]];

  for (const campaign of campaigns) {
    const events = eventsMap.get(campaign.id) || [];
    const echaEvents = getEventsByType(events, 'ECHAApprovalRecorded');

    if (echaEvents.length === 0) {
      // Campaign without ECHA approval
      rows.push([
        campaign.legoCampaignCode,
        campaign.echaApproved ? 'Approved' : 'Pending',
        undefined,
        undefined,
        undefined,
      ]);
    } else {
      // Use the most recent ECHA approval event
      const latestEvent = echaEvents[echaEvents.length - 1];
      const data = latestEvent.eventData as ECHAApprovalEventData;
      rows.push([
        campaign.legoCampaignCode,
        'Approved',
        formatDate(data.approvalDate),
        data.approvedBy,
        data.notes,
      ]);
    }
  }

  return rows;
}

/**
 * Build Transfer MBA-RGE sheet data
 */
function buildTransferRows(
  campaigns: Campaign[],
  eventsMap: Map<string, BaseEvent[]>
): unknown[][] {
  const rows: unknown[][] = [[...HEADERS.TRANSFER_MBA_RGE]];

  for (const campaign of campaigns) {
    const events = eventsMap.get(campaign.id) || [];
    const transferEvents = getEventsByType(events, 'TransferToRGERecorded');

    for (const event of transferEvents) {
      const data = event.eventData as TransferEventData;
      rows.push([
        campaign.legoCampaignCode,
        data.trackingRef,
        data.carrier,
        formatDate(data.receivedDate),
        data.receivedGrossWeightKg || data.receivedWeightKg,
        data.receivedNetWeightKg,
      ]);
    }
  }

  return rows;
}

/**
 * Build RGE Manufacturing sheet data
 */
function buildManufacturingRows(
  campaigns: Campaign[],
  eventsMap: Map<string, BaseEvent[]>
): unknown[][] {
  const rows: unknown[][] = [[...HEADERS.RGE_MANUFACTURING]];

  for (const campaign of campaigns) {
    const events = eventsMap.get(campaign.id) || [];
    const startEvents = getEventsByType(events, 'ManufacturingStarted');
    const completeEvents = getEventsByType(events, 'ManufacturingCompleted');

    // Combine start and complete events into single rows
    // If we have a start event, use its data as base
    if (startEvents.length > 0) {
      for (let i = 0; i < startEvents.length; i++) {
        const startData = startEvents[i].eventData as ManufacturingEventData;
        const completeData = (completeEvents[i]?.eventData ||
          {}) as ManufacturingEventData;

        rows.push([
          campaign.legoCampaignCode,
          startData.poNumber,
          startData.poQuantity,
          formatDate(startData.startDate),
          formatDate(completeData.endDate),
          formatDate(startData.requestedPickupDate),
          formatDate(completeData.actualPickupDate),
        ]);
      }
    }
  }

  return rows;
}

/**
 * Build a complete workbook from campaigns and their events
 */
export function buildCampaignWorkbook(
  campaigns: Campaign[],
  eventsMap: Map<string, BaseEvent[]>
): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  // Build each sheet
  const sheets = [
    {
      name: SHEET_NAMES.INBOUND_SHIPMENT,
      data: buildInboundShipmentRows(campaigns, eventsMap),
    },
    {
      name: SHEET_NAMES.GRANULATION,
      data: buildGranulationRows(campaigns, eventsMap),
    },
    {
      name: SHEET_NAMES.METAL_REMOVAL,
      data: buildMetalRemovalRows(campaigns, eventsMap),
    },
    {
      name: SHEET_NAMES.POLYMER_PURIFICATION,
      data: buildPolymerPurificationRows(campaigns, eventsMap),
    },
    {
      name: SHEET_NAMES.EXTRUSION,
      data: buildExtrusionRows(campaigns, eventsMap),
    },
    {
      name: SHEET_NAMES.ECHA_COMPLIANCE,
      data: buildEchaComplianceRows(campaigns, eventsMap),
    },
    {
      name: SHEET_NAMES.TRANSFER_MBA_RGE,
      data: buildTransferRows(campaigns, eventsMap),
    },
    {
      name: SHEET_NAMES.RGE_MANUFACTURING,
      data: buildManufacturingRows(campaigns, eventsMap),
    },
  ];

  for (const sheet of sheets) {
    const worksheet = XLSX.utils.aoa_to_sheet(sheet.data);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  }

  return workbook;
}

/**
 * Convert a workbook to a Buffer for API response
 */
export function workbookToBuffer(workbook: XLSX.WorkBook): Buffer {
  const arrayBuffer = XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
  });
  return Buffer.from(arrayBuffer);
}

/**
 * Generate a filename for export
 */
export function generateExportFilename(
  campaignCode?: string,
  date: Date = new Date()
): string {
  const dateStr = date.toISOString().split('T')[0];
  if (campaignCode) {
    return `campaign-${campaignCode}-${dateStr}.xlsx`;
  }
  return `campaigns-export-${dateStr}.xlsx`;
}

// Re-export HEADERS for testing
export { HEADERS };
