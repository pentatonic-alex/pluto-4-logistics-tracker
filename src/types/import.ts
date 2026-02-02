import type { 
  EventType, 
  MaterialType, 
  Campaign,
  CampaignCreatedPayload,
  InboundShipmentPayload,
  ProcessingStepPayload,
  GranulationPayload,
  PolymerPurificationPayload,
  ExtrusionPayload,
  TransferToRGEPayload,
  ManufacturingStartedPayload,
  ManufacturingCompletedPayload,
} from './index';

// Preview for creating a new campaign
export interface CreatePreview {
  id: string; // Temporary ID for UI reference
  campaignCode: string;
  materialType: MaterialType;
  source: 'inbound_shipment' | 'granulation'; // Which sheet it came from
  payload: CampaignCreatedPayload;
  inboundShipmentPayload?: InboundShipmentPayload;
  selected: boolean;
}

// Preview for adding an event to an existing campaign
export interface EventPreview {
  id: string; // Temporary ID for UI reference
  campaignId: string;
  campaignCode: string;
  eventType: EventType;
  source: string; // Sheet name
  payload: 
    | InboundShipmentPayload
    | ProcessingStepPayload
    | GranulationPayload
    | PolymerPurificationPayload
    | ExtrusionPayload
    | TransferToRGEPayload
    | ManufacturingStartedPayload
    | ManufacturingCompletedPayload;
  selected: boolean;
}

// A single field change for updates
export interface FieldChange {
  field: string;
  label: string;
  current: unknown;
  proposed: unknown;
}

// Preview for updating/correcting existing data
export interface UpdatePreview {
  id: string; // Temporary ID for UI reference
  campaignId: string;
  campaignCode: string;
  eventType: 'EventCorrected';
  correctsEventId: string;
  correctsEventType: EventType;
  source: string; // Sheet name
  changes: FieldChange[];
  selected: boolean;
}

// Skipped row with reason
export interface SkippedRow {
  id: string;
  source: string; // Sheet name
  rowNumber: number;
  campaignCode?: string;
  reason: string;
  rawData: Record<string, unknown>;
}

// Full preview response from the API
export interface ImportPreviewResponse {
  creates: CreatePreview[];
  events: EventPreview[];
  updates: UpdatePreview[];
  skipped: SkippedRow[];
  summary: {
    totalRows: number;
    newCampaigns: number;
    newEvents: number;
    updates: number;
    skipped: number;
  };
}

// Request to apply selected changes
export interface ImportApplyRequest {
  creates: string[]; // IDs of selected creates
  events: string[]; // IDs of selected events
  updates: string[]; // IDs of selected updates
  previewData: ImportPreviewResponse; // Full preview data to reference
}

// Response from apply
export interface ImportApplyResponse {
  success: boolean;
  created: {
    campaignId: string;
    campaignCode: string;
    eventIds: string[];
  }[];
  events: {
    campaignId: string;
    eventId: string;
    eventType: EventType;
  }[];
  corrections: {
    campaignId: string;
    eventId: string;
    correctsEventId: string;
  }[];
  errors: {
    id: string;
    error: string;
  }[];
}

// Parsed data sent from client to preview API
export interface ImportPreviewRequest {
  inboundShipments: {
    campaignCode: string;
    grossWeightKg?: number;
    netWeightKg?: number;
    estimatedAbsKg?: number;
    trackingRef?: string;
    carrier?: string;
    shipDate?: string;
    arrivalDate?: string;
  }[];
  granulations: {
    campaignCode: string;
    ticketNumber?: string;
    materialType?: MaterialType;
    startingWeightKg?: number;
    outputWeightKg?: number;
    processHours?: number;
    polymerComposition?: string;
    contaminationNotes?: string;
    wasteCode?: string;
    notes?: string;
  }[];
  metalRemovals: {
    campaignCode: string;
    ticketNumber?: string;
    startingWeightKg?: number;
    outputWeightKg?: number;
    processHours?: number;
    polymerComposition?: string;
    wasteCode?: string;
    notes?: string;
  }[];
  polymerPurifications: {
    campaignCode: string;
    ticketNumber?: string;
    startingWeightKg?: number;
    outputWeightKg?: number;
    processHours?: number;
    polymerComposition?: string;
    wasteComposition?: string;
    wasteCode?: string;
    notes?: string;
  }[];
  extrusions: {
    campaignCode: string;
    ticketNumber?: string;
    startingWeightKg?: number;
    outputWeightKg?: number;
    processHours?: number;
    batchNumber?: string;
    echaComplete?: boolean;
    notes?: string;
  }[];
  transfers: {
    campaignCode: string;
    trackingRef?: string;
    carrier?: string;
    receivedDate?: string;
    receivedWeightKg?: number;
  }[];
  manufacturing: {
    campaignCode: string;
    poNumber?: string;
    poQuantity?: number;
    startDate?: string;
    endDate?: string;
  }[];
}

// Helper type for campaign matching result
export interface CampaignMatch {
  campaign: Campaign;
  existingEvents: {
    eventType: EventType;
    eventId: string;
    eventData: Record<string, unknown>;
  }[];
}

// UI state for import page
export interface ImportState {
  step: 'upload' | 'parsing' | 'previewing' | 'applying' | 'complete' | 'error';
  fileName?: string;
  preview?: ImportPreviewResponse;
  error?: string;
  result?: ImportApplyResponse;
}
