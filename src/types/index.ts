// Campaign status progression
export type CampaignStatus =
  | 'created'
  | 'inbound_shipment_recorded'
  | 'granulation_complete'
  | 'metal_removal_complete'
  | 'polymer_purification_complete'
  | 'extrusion_complete'
  | 'echa_approved'
  | 'transferred_to_rge'
  | 'manufacturing_started'
  | 'manufacturing_complete'
  | 'returned_to_lego'
  | 'completed';

// Material type
export type MaterialType = 'PI' | 'PCR'; // Post-Industrial or Post-Consumer Recycled

// Event types
export type EventType =
  | 'CampaignCreated'
  | 'InboundShipmentRecorded'
  | 'GranulationCompleted'
  | 'MetalRemovalCompleted'
  | 'PolymerPurificationCompleted'
  | 'ExtrusionCompleted'
  | 'ECHAApprovalRecorded'
  | 'TransferToRGERecorded'
  | 'ManufacturingStarted'
  | 'ManufacturingCompleted'
  | 'ReturnToLEGORecorded'
  | 'CampaignCompleted';

// Base event structure
export interface BaseEvent {
  id: string;
  streamType: 'campaign';
  streamId: string; // campaign ID
  eventType: EventType;
  eventData: Record<string, unknown>;
  metadata: {
    userId: string;
    timestamp: string;
  };
  createdAt: string;
}

// Campaign projection (current state)
export interface Campaign {
  id: string;
  legoCampaignCode: string;
  status: CampaignStatus;
  currentStep: string | null;
  currentWeightKg: number | null;
  materialType: MaterialType;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  lastEventType: EventType | null;
  lastEventAt: string | null;
  nextExpectedStep: string | null;
  echaApproved: boolean;
}

// Event payloads
export interface CampaignCreatedPayload {
  legoCampaignCode: string;
  materialType: MaterialType;
  description?: string;
}

export interface InboundShipmentPayload {
  grossWeightKg: number;
  netWeightKg: number;
  estimatedAbsKg?: number;
  carrier: string;
  trackingRef: string;
  shipDate: string;
  arrivalDate: string;
}

export interface ProcessingStepPayload {
  ticketNumber: string;
  startingWeightKg: number;
  outputWeightKg: number;
  processHours?: number;
  polymerComposition?: string;
  wasteCode?: string;
  notes?: string;
}

export interface GranulationPayload extends ProcessingStepPayload {
  contaminationNotes?: string;
}

export interface PolymerPurificationPayload extends ProcessingStepPayload {
  wasteComposition?: string;
}

export interface ExtrusionPayload extends ProcessingStepPayload {
  batchNumber: string;
}

export interface ECHAApprovalPayload {
  approvedBy: string;
  approvalDate: string;
  notes?: string;
}

export interface TransferToRGEPayload {
  trackingRef: string;
  carrier: string;
  shipDate: string;
  receivedDate?: string;
  receivedWeightKg?: number;
}

export interface ManufacturingStartedPayload {
  poNumber: string;
  poQuantity: number;
  startDate: string;
}

export interface ManufacturingCompletedPayload {
  endDate: string;
  actualQuantity: number;
  notes?: string;
}

export interface ReturnToLEGOPayload {
  trackingRef: string;
  carrier: string;
  shipDate: string;
  receivedDate?: string;
  quantity: number;
}

export interface CampaignCompletedPayload {
  completionNotes?: string;
}
