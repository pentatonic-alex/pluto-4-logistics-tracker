/**
 * Seed Script - Create example campaigns with realistic data
 * 
 * Creates campaigns at each stage of the logistics process:
 * LEGO Warehouse → MBA (Compounder) → RGE (Manufacturer) → LEGO Warehouse
 * 
 * Run with: npx tsx scripts/seed.ts
 */

import { sql } from '../src/lib/db';
import { appendEvent } from '../src/lib/events';
import { updateProjection } from '../src/lib/projections';
import { generateCampaignId, generateEventId } from '../src/lib/ids';
import type { EventType } from '../src/types';

interface SeedCampaign {
  legoCampaignCode: string;
  materialType: 'PI' | 'PCR';
  description: string;
  events: Array<{
    eventType: EventType;
    eventData: Record<string, unknown>;
    daysAgo: number; // How many days ago this event occurred
  }>;
}

// Helper to get a date N days ago
function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

// Helper to format a date N days ago as YYYY-MM-DD
function dateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

// Seed campaigns at various stages
const SEED_CAMPAIGNS: SeedCampaign[] = [
  // 1. Just created - waiting for inbound shipment
  {
    legoCampaignCode: 'PCR-2026-001',
    materialType: 'PCR',
    description: 'Q1 2026 Post-Consumer Recycled collection - Denmark pilot',
    events: [
      {
        eventType: 'CampaignCreated',
        eventData: {
          legoCampaignCode: 'PCR-2026-001',
          materialType: 'PCR',
          description: 'Q1 2026 Post-Consumer Recycled collection - Denmark pilot',
        },
        daysAgo: 2,
      },
    ],
  },

  // 2. Inbound shipment recorded - ready for granulation
  {
    legoCampaignCode: 'PCR-2025-012',
    materialType: 'PCR',
    description: 'December 2025 collection - UK schools program',
    events: [
      {
        eventType: 'CampaignCreated',
        eventData: {
          legoCampaignCode: 'PCR-2025-012',
          materialType: 'PCR',
          description: 'December 2025 collection - UK schools program',
        },
        daysAgo: 14,
      },
      {
        eventType: 'InboundShipmentRecorded',
        eventData: {
          grossWeightKg: 5250,
          netWeightKg: 5100,
          estimatedAbsKg: 4800,
          carrier: 'DHL Freight',
          trackingRef: 'DHL-UK-2025-78234',
          shipDate: dateDaysAgo(10),
          arrivalDate: dateDaysAgo(7),
        },
        daysAgo: 7,
      },
    ],
  },

  // 3. Granulation complete - ready for metal removal
  {
    legoCampaignCode: 'PCR-2025-011',
    materialType: 'PCR',
    description: 'November 2025 collection - German retail returns',
    events: [
      {
        eventType: 'CampaignCreated',
        eventData: {
          legoCampaignCode: 'PCR-2025-011',
          materialType: 'PCR',
          description: 'November 2025 collection - German retail returns',
        },
        daysAgo: 30,
      },
      {
        eventType: 'InboundShipmentRecorded',
        eventData: {
          grossWeightKg: 8400,
          netWeightKg: 8200,
          estimatedAbsKg: 7800,
          carrier: 'Schenker',
          trackingRef: 'SCH-DE-2025-45123',
          shipDate: dateDaysAgo(28),
          arrivalDate: dateDaysAgo(25),
        },
        daysAgo: 25,
      },
      {
        eventType: 'GranulationCompleted',
        eventData: {
          ticketNumber: 'MBA-GRN-2025-0234',
          startingWeightKg: 8200,
          outputWeightKg: 7950,
          processHours: 16,
          contaminationNotes: 'Minor paper contamination removed',
        },
        daysAgo: 20,
      },
    ],
  },

  // 4. Metal removal complete - ready for polymer purification
  {
    legoCampaignCode: 'PCR-2025-010',
    materialType: 'PCR',
    description: 'October 2025 collection - French community centers',
    events: [
      {
        eventType: 'CampaignCreated',
        eventData: {
          legoCampaignCode: 'PCR-2025-010',
          materialType: 'PCR',
          description: 'October 2025 collection - French community centers',
        },
        daysAgo: 45,
      },
      {
        eventType: 'InboundShipmentRecorded',
        eventData: {
          grossWeightKg: 6800,
          netWeightKg: 6600,
          estimatedAbsKg: 6200,
          carrier: 'Geodis',
          trackingRef: 'GEO-FR-2025-91234',
          shipDate: dateDaysAgo(43),
          arrivalDate: dateDaysAgo(40),
        },
        daysAgo: 40,
      },
      {
        eventType: 'GranulationCompleted',
        eventData: {
          ticketNumber: 'MBA-GRN-2025-0198',
          startingWeightKg: 6600,
          outputWeightKg: 6400,
          processHours: 12,
          contaminationNotes: 'Clean batch',
        },
        daysAgo: 35,
      },
      {
        eventType: 'MetalRemovalCompleted',
        eventData: {
          ticketNumber: 'MBA-MTL-2025-0198',
          startingWeightKg: 6400,
          outputWeightKg: 6380,
          processHours: 4,
          notes: 'Minimal metal content detected',
        },
        daysAgo: 30,
      },
    ],
  },

  // 5. Polymer purification complete - ready for extrusion
  {
    legoCampaignCode: 'PCR-2025-009',
    materialType: 'PCR',
    description: 'September 2025 collection - Dutch LEGO stores',
    events: [
      {
        eventType: 'CampaignCreated',
        eventData: {
          legoCampaignCode: 'PCR-2025-009',
          materialType: 'PCR',
          description: 'September 2025 collection - Dutch LEGO stores',
        },
        daysAgo: 60,
      },
      {
        eventType: 'InboundShipmentRecorded',
        eventData: {
          grossWeightKg: 4200,
          netWeightKg: 4050,
          estimatedAbsKg: 3800,
          carrier: 'PostNL',
          trackingRef: 'PNL-NL-2025-12789',
          shipDate: dateDaysAgo(58),
          arrivalDate: dateDaysAgo(55),
        },
        daysAgo: 55,
      },
      {
        eventType: 'GranulationCompleted',
        eventData: {
          ticketNumber: 'MBA-GRN-2025-0156',
          startingWeightKg: 4050,
          outputWeightKg: 3920,
          processHours: 8,
          contaminationNotes: 'Some non-LEGO plastic removed',
        },
        daysAgo: 50,
      },
      {
        eventType: 'MetalRemovalCompleted',
        eventData: {
          ticketNumber: 'MBA-MTL-2025-0156',
          startingWeightKg: 3920,
          outputWeightKg: 3900,
          processHours: 3,
          notes: 'Standard processing',
        },
        daysAgo: 45,
      },
      {
        eventType: 'PolymerPurificationCompleted',
        eventData: {
          ticketNumber: 'MBA-PUR-2025-0156',
          startingWeightKg: 3900,
          outputWeightKg: 3750,
          processHours: 24,
          polymerComposition: 'ABS 94%, other 6%',
          wasteComposition: 'Non-ABS plastics, dust',
        },
        daysAgo: 40,
      },
    ],
  },

  // 6. Extrusion complete - ready for ECHA approval
  {
    legoCampaignCode: 'PCR-2025-008',
    materialType: 'PCR',
    description: 'August 2025 collection - Scandinavian returns',
    events: [
      {
        eventType: 'CampaignCreated',
        eventData: {
          legoCampaignCode: 'PCR-2025-008',
          materialType: 'PCR',
          description: 'August 2025 collection - Scandinavian returns',
        },
        daysAgo: 90,
      },
      {
        eventType: 'InboundShipmentRecorded',
        eventData: {
          grossWeightKg: 7200,
          netWeightKg: 7000,
          estimatedAbsKg: 6600,
          carrier: 'DSV',
          trackingRef: 'DSV-SE-2025-34567',
          shipDate: dateDaysAgo(88),
          arrivalDate: dateDaysAgo(85),
        },
        daysAgo: 85,
      },
      {
        eventType: 'GranulationCompleted',
        eventData: {
          ticketNumber: 'MBA-GRN-2025-0123',
          startingWeightKg: 7000,
          outputWeightKg: 6800,
          processHours: 14,
          contaminationNotes: 'Clean batch from store returns',
        },
        daysAgo: 80,
      },
      {
        eventType: 'MetalRemovalCompleted',
        eventData: {
          ticketNumber: 'MBA-MTL-2025-0123',
          startingWeightKg: 6800,
          outputWeightKg: 6780,
          processHours: 4,
          notes: 'Very low metal content',
        },
        daysAgo: 75,
      },
      {
        eventType: 'PolymerPurificationCompleted',
        eventData: {
          ticketNumber: 'MBA-PUR-2025-0123',
          startingWeightKg: 6780,
          outputWeightKg: 6500,
          processHours: 28,
          polymerComposition: 'ABS 96%, other 4%',
          wasteComposition: 'Non-ABS plastics',
        },
        daysAgo: 70,
      },
      {
        eventType: 'ExtrusionCompleted',
        eventData: {
          ticketNumber: 'MBA-EXT-2025-0123',
          batchNumber: 'MBA-BATCH-2025-0089',
          startingWeightKg: 6500,
          outputWeightKg: 6450,
          processHours: 8,
          notes: 'Good pellet quality',
        },
        daysAgo: 65,
      },
    ],
  },

  // 7. ECHA approved - ready for transfer to RGE
  {
    legoCampaignCode: 'PCR-2025-007',
    materialType: 'PCR',
    description: 'July 2025 collection - UK LEGO House event',
    events: [
      {
        eventType: 'CampaignCreated',
        eventData: {
          legoCampaignCode: 'PCR-2025-007',
          materialType: 'PCR',
          description: 'July 2025 collection - UK LEGO House event',
        },
        daysAgo: 120,
      },
      {
        eventType: 'InboundShipmentRecorded',
        eventData: {
          grossWeightKg: 3200,
          netWeightKg: 3100,
          estimatedAbsKg: 2900,
          carrier: 'DHL Express',
          trackingRef: 'DHL-UK-2025-56789',
          shipDate: dateDaysAgo(118),
          arrivalDate: dateDaysAgo(115),
        },
        daysAgo: 115,
      },
      {
        eventType: 'GranulationCompleted',
        eventData: {
          ticketNumber: 'MBA-GRN-2025-0098',
          startingWeightKg: 3100,
          outputWeightKg: 3000,
          processHours: 6,
          contaminationNotes: 'High quality input',
        },
        daysAgo: 110,
      },
      {
        eventType: 'MetalRemovalCompleted',
        eventData: {
          ticketNumber: 'MBA-MTL-2025-0098',
          startingWeightKg: 3000,
          outputWeightKg: 2990,
          processHours: 2,
          notes: 'Minimal metal',
        },
        daysAgo: 105,
      },
      {
        eventType: 'PolymerPurificationCompleted',
        eventData: {
          ticketNumber: 'MBA-PUR-2025-0098',
          startingWeightKg: 2990,
          outputWeightKg: 2880,
          processHours: 20,
          polymerComposition: 'ABS 97%, other 3%',
          wasteComposition: 'Minor contaminants',
        },
        daysAgo: 100,
      },
      {
        eventType: 'ExtrusionCompleted',
        eventData: {
          ticketNumber: 'MBA-EXT-2025-0098',
          batchNumber: 'MBA-BATCH-2025-0067',
          startingWeightKg: 2880,
          outputWeightKg: 2850,
          processHours: 5,
          notes: 'Excellent pellet quality',
        },
        daysAgo: 95,
      },
      {
        eventType: 'ECHAApprovalRecorded',
        eventData: {
          approvedBy: 'Dr. Klaus Schmidt',
          approvalDate: dateDaysAgo(90),
          notes: 'All chemical safety tests passed',
        },
        daysAgo: 90,
      },
    ],
  },

  // 8. Transferred to RGE - ready for manufacturing
  {
    legoCampaignCode: 'PCR-2025-006',
    materialType: 'PCR',
    description: 'June 2025 collection - Spanish retail network',
    events: [
      {
        eventType: 'CampaignCreated',
        eventData: {
          legoCampaignCode: 'PCR-2025-006',
          materialType: 'PCR',
          description: 'June 2025 collection - Spanish retail network',
        },
        daysAgo: 150,
      },
      {
        eventType: 'InboundShipmentRecorded',
        eventData: {
          grossWeightKg: 5500,
          netWeightKg: 5350,
          estimatedAbsKg: 5000,
          carrier: 'SEUR',
          trackingRef: 'SEUR-ES-2025-23456',
          shipDate: dateDaysAgo(148),
          arrivalDate: dateDaysAgo(145),
        },
        daysAgo: 145,
      },
      {
        eventType: 'GranulationCompleted',
        eventData: {
          ticketNumber: 'MBA-GRN-2025-0078',
          startingWeightKg: 5350,
          outputWeightKg: 5180,
          processHours: 10,
          contaminationNotes: 'Standard processing',
        },
        daysAgo: 140,
      },
      {
        eventType: 'MetalRemovalCompleted',
        eventData: {
          ticketNumber: 'MBA-MTL-2025-0078',
          startingWeightKg: 5180,
          outputWeightKg: 5150,
          processHours: 3,
          notes: 'Normal metal content',
        },
        daysAgo: 135,
      },
      {
        eventType: 'PolymerPurificationCompleted',
        eventData: {
          ticketNumber: 'MBA-PUR-2025-0078',
          startingWeightKg: 5150,
          outputWeightKg: 4950,
          processHours: 26,
          polymerComposition: 'ABS 95%, other 5%',
          wasteComposition: 'Mixed polymer waste',
        },
        daysAgo: 130,
      },
      {
        eventType: 'ExtrusionCompleted',
        eventData: {
          ticketNumber: 'MBA-EXT-2025-0078',
          batchNumber: 'MBA-BATCH-2025-0056',
          startingWeightKg: 4950,
          outputWeightKg: 4900,
          processHours: 7,
          notes: 'Good quality output',
        },
        daysAgo: 125,
      },
      {
        eventType: 'ECHAApprovalRecorded',
        eventData: {
          approvedBy: 'Dr. Maria Santos',
          approvalDate: dateDaysAgo(120),
          notes: 'Meets all regulatory requirements',
        },
        daysAgo: 120,
      },
      {
        eventType: 'TransferToRGERecorded',
        eventData: {
          trackingRef: 'MBA-RGE-2025-0056',
          carrier: 'MBA Internal Logistics',
          shipDate: dateDaysAgo(115),
          receivedDate: dateDaysAgo(113),
          receivedWeightKg: 4890,
        },
        daysAgo: 113,
      },
    ],
  },

  // 9. Manufacturing started - in production
  {
    legoCampaignCode: 'PCR-2025-005',
    materialType: 'PCR',
    description: 'May 2025 collection - Italian charity drive',
    events: [
      {
        eventType: 'CampaignCreated',
        eventData: {
          legoCampaignCode: 'PCR-2025-005',
          materialType: 'PCR',
          description: 'May 2025 collection - Italian charity drive',
        },
        daysAgo: 180,
      },
      {
        eventType: 'InboundShipmentRecorded',
        eventData: {
          grossWeightKg: 4800,
          netWeightKg: 4650,
          estimatedAbsKg: 4400,
          carrier: 'Bartolini',
          trackingRef: 'BRT-IT-2025-78901',
          shipDate: dateDaysAgo(178),
          arrivalDate: dateDaysAgo(175),
        },
        daysAgo: 175,
      },
      {
        eventType: 'GranulationCompleted',
        eventData: {
          ticketNumber: 'MBA-GRN-2025-0056',
          startingWeightKg: 4650,
          outputWeightKg: 4500,
          processHours: 9,
          contaminationNotes: 'Minor dust removed',
        },
        daysAgo: 170,
      },
      {
        eventType: 'MetalRemovalCompleted',
        eventData: {
          ticketNumber: 'MBA-MTL-2025-0056',
          startingWeightKg: 4500,
          outputWeightKg: 4480,
          processHours: 3,
          notes: 'Low metal content',
        },
        daysAgo: 165,
      },
      {
        eventType: 'PolymerPurificationCompleted',
        eventData: {
          ticketNumber: 'MBA-PUR-2025-0056',
          startingWeightKg: 4480,
          outputWeightKg: 4300,
          processHours: 22,
          polymerComposition: 'ABS 95.5%, other 4.5%',
          wasteComposition: 'Non-ABS materials',
        },
        daysAgo: 160,
      },
      {
        eventType: 'ExtrusionCompleted',
        eventData: {
          ticketNumber: 'MBA-EXT-2025-0056',
          batchNumber: 'MBA-BATCH-2025-0045',
          startingWeightKg: 4300,
          outputWeightKg: 4260,
          processHours: 6,
          notes: 'Standard quality',
        },
        daysAgo: 155,
      },
      {
        eventType: 'ECHAApprovalRecorded',
        eventData: {
          approvedBy: 'Dr. Paolo Rossi',
          approvalDate: dateDaysAgo(150),
          notes: 'Full compliance achieved',
        },
        daysAgo: 150,
      },
      {
        eventType: 'TransferToRGERecorded',
        eventData: {
          trackingRef: 'MBA-RGE-2025-0045',
          carrier: 'MBA Internal Logistics',
          shipDate: dateDaysAgo(145),
          receivedDate: dateDaysAgo(143),
          receivedWeightKg: 4250,
        },
        daysAgo: 143,
      },
      {
        eventType: 'ManufacturingStarted',
        eventData: {
          poNumber: 'RGE-PO-2025-1234',
          poQuantity: 50000,
          startDate: dateDaysAgo(140),
        },
        daysAgo: 140,
      },
    ],
  },

  // 10. Manufacturing complete - ready for return to LEGO
  {
    legoCampaignCode: 'PCR-2025-004',
    materialType: 'PCR',
    description: 'April 2025 collection - Belgian schools program',
    events: [
      {
        eventType: 'CampaignCreated',
        eventData: {
          legoCampaignCode: 'PCR-2025-004',
          materialType: 'PCR',
          description: 'April 2025 collection - Belgian schools program',
        },
        daysAgo: 210,
      },
      {
        eventType: 'InboundShipmentRecorded',
        eventData: {
          grossWeightKg: 3600,
          netWeightKg: 3500,
          estimatedAbsKg: 3300,
          carrier: 'Bpost',
          trackingRef: 'BPOST-BE-2025-45678',
          shipDate: dateDaysAgo(208),
          arrivalDate: dateDaysAgo(205),
        },
        daysAgo: 205,
      },
      {
        eventType: 'GranulationCompleted',
        eventData: {
          ticketNumber: 'MBA-GRN-2025-0034',
          startingWeightKg: 3500,
          outputWeightKg: 3380,
          processHours: 7,
          contaminationNotes: 'Clean batch',
        },
        daysAgo: 200,
      },
      {
        eventType: 'MetalRemovalCompleted',
        eventData: {
          ticketNumber: 'MBA-MTL-2025-0034',
          startingWeightKg: 3380,
          outputWeightKg: 3370,
          processHours: 2,
          notes: 'Minimal metal',
        },
        daysAgo: 195,
      },
      {
        eventType: 'PolymerPurificationCompleted',
        eventData: {
          ticketNumber: 'MBA-PUR-2025-0034',
          startingWeightKg: 3370,
          outputWeightKg: 3250,
          processHours: 18,
          polymerComposition: 'ABS 96.5%, other 3.5%',
          wasteComposition: 'Dust and non-ABS',
        },
        daysAgo: 190,
      },
      {
        eventType: 'ExtrusionCompleted',
        eventData: {
          ticketNumber: 'MBA-EXT-2025-0034',
          batchNumber: 'MBA-BATCH-2025-0034',
          startingWeightKg: 3250,
          outputWeightKg: 3220,
          processHours: 5,
          notes: 'High quality pellets',
        },
        daysAgo: 185,
      },
      {
        eventType: 'ECHAApprovalRecorded',
        eventData: {
          approvedBy: 'Dr. Jan De Vries',
          approvalDate: dateDaysAgo(180),
          notes: 'Excellent test results',
        },
        daysAgo: 180,
      },
      {
        eventType: 'TransferToRGERecorded',
        eventData: {
          trackingRef: 'MBA-RGE-2025-0034',
          carrier: 'MBA Internal Logistics',
          shipDate: dateDaysAgo(175),
          receivedDate: dateDaysAgo(173),
          receivedWeightKg: 3210,
        },
        daysAgo: 173,
      },
      {
        eventType: 'ManufacturingStarted',
        eventData: {
          poNumber: 'RGE-PO-2025-1122',
          poQuantity: 38000,
          startDate: dateDaysAgo(170),
        },
        daysAgo: 170,
      },
      {
        eventType: 'ManufacturingCompleted',
        eventData: {
          endDate: dateDaysAgo(155),
          actualQuantity: 37500,
          notes: 'Minor quality rejects',
        },
        daysAgo: 155,
      },
    ],
  },

  // 11. Returned to LEGO - ready for completion
  {
    legoCampaignCode: 'PCR-2025-003',
    materialType: 'PCR',
    description: 'March 2025 collection - Swiss LEGO stores',
    events: [
      {
        eventType: 'CampaignCreated',
        eventData: {
          legoCampaignCode: 'PCR-2025-003',
          materialType: 'PCR',
          description: 'March 2025 collection - Swiss LEGO stores',
        },
        daysAgo: 240,
      },
      {
        eventType: 'InboundShipmentRecorded',
        eventData: {
          grossWeightKg: 2800,
          netWeightKg: 2700,
          estimatedAbsKg: 2500,
          carrier: 'Swiss Post',
          trackingRef: 'SWP-CH-2025-12345',
          shipDate: dateDaysAgo(238),
          arrivalDate: dateDaysAgo(235),
        },
        daysAgo: 235,
      },
      {
        eventType: 'GranulationCompleted',
        eventData: {
          ticketNumber: 'MBA-GRN-2025-0023',
          startingWeightKg: 2700,
          outputWeightKg: 2620,
          processHours: 5,
          contaminationNotes: 'Very clean batch',
        },
        daysAgo: 230,
      },
      {
        eventType: 'MetalRemovalCompleted',
        eventData: {
          ticketNumber: 'MBA-MTL-2025-0023',
          startingWeightKg: 2620,
          outputWeightKg: 2610,
          processHours: 2,
          notes: 'Almost no metal',
        },
        daysAgo: 225,
      },
      {
        eventType: 'PolymerPurificationCompleted',
        eventData: {
          ticketNumber: 'MBA-PUR-2025-0023',
          startingWeightKg: 2610,
          outputWeightKg: 2520,
          processHours: 16,
          polymerComposition: 'ABS 97.5%, other 2.5%',
          wasteComposition: 'Minor contaminants',
        },
        daysAgo: 220,
      },
      {
        eventType: 'ExtrusionCompleted',
        eventData: {
          ticketNumber: 'MBA-EXT-2025-0023',
          batchNumber: 'MBA-BATCH-2025-0023',
          startingWeightKg: 2520,
          outputWeightKg: 2500,
          processHours: 4,
          notes: 'Premium quality pellets',
        },
        daysAgo: 215,
      },
      {
        eventType: 'ECHAApprovalRecorded',
        eventData: {
          approvedBy: 'Dr. Hans Mueller',
          approvalDate: dateDaysAgo(210),
          notes: 'All tests passed with excellent margins',
        },
        daysAgo: 210,
      },
      {
        eventType: 'TransferToRGERecorded',
        eventData: {
          trackingRef: 'MBA-RGE-2025-0023',
          carrier: 'MBA Internal Logistics',
          shipDate: dateDaysAgo(205),
          receivedDate: dateDaysAgo(203),
          receivedWeightKg: 2495,
        },
        daysAgo: 203,
      },
      {
        eventType: 'ManufacturingStarted',
        eventData: {
          poNumber: 'RGE-PO-2025-1011',
          poQuantity: 30000,
          startDate: dateDaysAgo(200),
        },
        daysAgo: 200,
      },
      {
        eventType: 'ManufacturingCompleted',
        eventData: {
          endDate: dateDaysAgo(185),
          actualQuantity: 29800,
          notes: 'Excellent yield',
        },
        daysAgo: 185,
      },
      {
        eventType: 'ReturnToLEGORecorded',
        eventData: {
          trackingRef: 'RGE-LEGO-2025-0023',
          carrier: 'DHL Express',
          shipDate: dateDaysAgo(180),
          receivedDate: dateDaysAgo(178),
          quantity: 29800,
        },
        daysAgo: 178,
      },
    ],
  },

  // 12. COMPLETED campaign (full cycle)
  {
    legoCampaignCode: 'PCR-2025-002',
    materialType: 'PCR',
    description: 'February 2025 collection - Nordic pilot batch',
    events: [
      {
        eventType: 'CampaignCreated',
        eventData: {
          legoCampaignCode: 'PCR-2025-002',
          materialType: 'PCR',
          description: 'February 2025 collection - Nordic pilot batch',
        },
        daysAgo: 300,
      },
      {
        eventType: 'InboundShipmentRecorded',
        eventData: {
          grossWeightKg: 6000,
          netWeightKg: 5850,
          estimatedAbsKg: 5500,
          carrier: 'PostNord',
          trackingRef: 'PN-NO-2025-67890',
          shipDate: dateDaysAgo(298),
          arrivalDate: dateDaysAgo(295),
        },
        daysAgo: 295,
      },
      {
        eventType: 'GranulationCompleted',
        eventData: {
          ticketNumber: 'MBA-GRN-2025-0012',
          startingWeightKg: 5850,
          outputWeightKg: 5680,
          processHours: 11,
          contaminationNotes: 'Some packaging material removed',
        },
        daysAgo: 290,
      },
      {
        eventType: 'MetalRemovalCompleted',
        eventData: {
          ticketNumber: 'MBA-MTL-2025-0012',
          startingWeightKg: 5680,
          outputWeightKg: 5650,
          processHours: 3,
          notes: 'Standard metal content',
        },
        daysAgo: 285,
      },
      {
        eventType: 'PolymerPurificationCompleted',
        eventData: {
          ticketNumber: 'MBA-PUR-2025-0012',
          startingWeightKg: 5650,
          outputWeightKg: 5450,
          processHours: 24,
          polymerComposition: 'ABS 95%, other 5%',
          wasteComposition: 'Mixed polymer waste',
        },
        daysAgo: 280,
      },
      {
        eventType: 'ExtrusionCompleted',
        eventData: {
          ticketNumber: 'MBA-EXT-2025-0012',
          batchNumber: 'MBA-BATCH-2025-0012',
          startingWeightKg: 5450,
          outputWeightKg: 5400,
          processHours: 8,
          notes: 'Good quality output',
        },
        daysAgo: 275,
      },
      {
        eventType: 'ECHAApprovalRecorded',
        eventData: {
          approvedBy: 'Dr. Erik Larsson',
          approvalDate: dateDaysAgo(270),
          notes: 'Compliant with all ECHA requirements',
        },
        daysAgo: 270,
      },
      {
        eventType: 'TransferToRGERecorded',
        eventData: {
          trackingRef: 'MBA-RGE-2025-0012',
          carrier: 'MBA Internal Logistics',
          shipDate: dateDaysAgo(265),
          receivedDate: dateDaysAgo(263),
          receivedWeightKg: 5390,
        },
        daysAgo: 263,
      },
      {
        eventType: 'ManufacturingStarted',
        eventData: {
          poNumber: 'RGE-PO-2025-1001',
          poQuantity: 65000,
          startDate: dateDaysAgo(260),
        },
        daysAgo: 260,
      },
      {
        eventType: 'ManufacturingCompleted',
        eventData: {
          endDate: dateDaysAgo(240),
          actualQuantity: 64200,
          notes: 'Minor yield loss within acceptable range',
        },
        daysAgo: 240,
      },
      {
        eventType: 'ReturnToLEGORecorded',
        eventData: {
          trackingRef: 'RGE-LEGO-2025-0012',
          carrier: 'DHL Express',
          shipDate: dateDaysAgo(235),
          receivedDate: dateDaysAgo(233),
          quantity: 64200,
        },
        daysAgo: 233,
      },
      {
        eventType: 'CampaignCompleted',
        eventData: {
          completionNotes: 'First successful full-cycle PCR campaign. Excellent results.',
        },
        daysAgo: 230,
      },
    ],
  },

  // 13. Campaign with a CORRECTED EVENT (weight correction example)
  {
    legoCampaignCode: 'PCR-2025-001',
    materialType: 'PCR',
    description: 'January 2025 collection - First batch with weight correction',
    events: [
      {
        eventType: 'CampaignCreated',
        eventData: {
          legoCampaignCode: 'PCR-2025-001',
          materialType: 'PCR',
          description: 'January 2025 collection - First batch with weight correction',
        },
        daysAgo: 330,
      },
      {
        eventType: 'InboundShipmentRecorded',
        eventData: {
          grossWeightKg: 4500,
          netWeightKg: 4350,
          estimatedAbsKg: 4100,
          carrier: 'FedEx',
          trackingRef: 'FDX-UK-2025-11111',
          shipDate: dateDaysAgo(328),
          arrivalDate: dateDaysAgo(325),
        },
        daysAgo: 325,
      },
      {
        eventType: 'GranulationCompleted',
        eventData: {
          ticketNumber: 'MBA-GRN-2025-0001',
          startingWeightKg: 4350,
          outputWeightKg: 4200, // This will be corrected
          processHours: 8,
          contaminationNotes: 'First batch processing',
        },
        daysAgo: 320,
      },
      // This event will have its weight corrected
      {
        eventType: 'MetalRemovalCompleted',
        eventData: {
          ticketNumber: 'MBA-MTL-2025-0001',
          startingWeightKg: 4200,
          outputWeightKg: 4150, // INCORRECT - will be corrected to 4180
          processHours: 3,
          notes: 'Standard processing',
        },
        daysAgo: 315,
      },
      {
        eventType: 'PolymerPurificationCompleted',
        eventData: {
          ticketNumber: 'MBA-PUR-2025-0001',
          startingWeightKg: 4150, // Based on incorrect weight
          outputWeightKg: 4000,
          processHours: 20,
          polymerComposition: 'ABS 94%, other 6%',
          wasteComposition: 'Non-ABS plastics',
        },
        daysAgo: 310,
      },
      {
        eventType: 'ExtrusionCompleted',
        eventData: {
          ticketNumber: 'MBA-EXT-2025-0001',
          batchNumber: 'MBA-BATCH-2025-0001',
          startingWeightKg: 4000,
          outputWeightKg: 3960,
          processHours: 6,
          notes: 'Good quality',
        },
        daysAgo: 305,
      },
    ],
  },

  // 14. Post-Industrial (PI) material example - different material type
  {
    legoCampaignCode: 'PI-2025-001',
    materialType: 'PI',
    description: 'Post-Industrial scrap from LEGO factory floor',
    events: [
      {
        eventType: 'CampaignCreated',
        eventData: {
          legoCampaignCode: 'PI-2025-001',
          materialType: 'PI',
          description: 'Post-Industrial scrap from LEGO factory floor',
        },
        daysAgo: 75,
      },
      {
        eventType: 'InboundShipmentRecorded',
        eventData: {
          grossWeightKg: 12000,
          netWeightKg: 11800,
          estimatedAbsKg: 11500,
          carrier: 'LEGO Internal',
          trackingRef: 'LEGO-INT-2025-001',
          shipDate: dateDaysAgo(73),
          arrivalDate: dateDaysAgo(70),
        },
        daysAgo: 70,
      },
      {
        eventType: 'GranulationCompleted',
        eventData: {
          ticketNumber: 'MBA-GRN-PI-2025-0001',
          startingWeightKg: 11800,
          outputWeightKg: 11700,
          processHours: 20,
          contaminationNotes: 'Factory floor scrap - very clean',
        },
        daysAgo: 65,
      },
      {
        eventType: 'MetalRemovalCompleted',
        eventData: {
          ticketNumber: 'MBA-MTL-PI-2025-0001',
          startingWeightKg: 11700,
          outputWeightKg: 11680,
          processHours: 5,
          notes: 'Minimal metal - factory scrap',
        },
        daysAgo: 60,
      },
      {
        eventType: 'PolymerPurificationCompleted',
        eventData: {
          ticketNumber: 'MBA-PUR-PI-2025-0001',
          startingWeightKg: 11680,
          outputWeightKg: 11500,
          processHours: 30,
          polymerComposition: 'ABS 99%, other 1%',
          wasteComposition: 'Dust only',
        },
        daysAgo: 55,
      },
    ],
  },
];

// Store event IDs for correction reference
const eventIdMap = new Map<string, string>();

async function seedCampaign(campaign: SeedCampaign): Promise<void> {
  const campaignId = generateCampaignId();
  console.log(`\nCreating campaign: ${campaign.legoCampaignCode} (${campaignId})`);

  for (const event of campaign.events) {
    const timestamp = daysAgo(event.daysAgo);
    
    // Append the event
    const createdEvent = await appendEvent({
      streamType: 'campaign',
      streamId: campaignId,
      eventType: event.eventType,
      eventData: event.eventData,
      userId: 'seed-script',
    });

    // Store event ID for potential corrections
    const key = `${campaignId}-${event.eventType}`;
    eventIdMap.set(key, createdEvent.id);

    // Update projection
    await updateProjection(event.eventType, campaignId, event.eventData, timestamp);
    
    console.log(`  - ${event.eventType} (${event.daysAgo} days ago)`);
  }

  // For the campaign with weight correction, add the correction event
  if (campaign.legoCampaignCode === 'PCR-2025-001') {
    const metalRemovalEventId = eventIdMap.get(`${campaignId}-MetalRemovalCompleted`);
    if (metalRemovalEventId) {
      const correctionTimestamp = daysAgo(300);
      const correctionData = {
        correctsEventId: metalRemovalEventId,
        correctsEventType: 'MetalRemovalCompleted',
        reason: 'Scale calibration error discovered - re-weighed output',
        changes: {
          outputWeightKg: {
            was: 4150,
            now: 4180,
          },
        },
      };

      await appendEvent({
        streamType: 'campaign',
        streamId: campaignId,
        eventType: 'EventCorrected',
        eventData: correctionData,
        userId: 'seed-script',
      });

      await updateProjection('EventCorrected', campaignId, correctionData, correctionTimestamp);
      
      console.log(`  - EventCorrected (weight correction: 4150 → 4180 kg)`);
    }
  }
}

async function clearExistingData(): Promise<void> {
  console.log('Clearing existing data...');
  await sql`DELETE FROM events`;
  await sql`DELETE FROM campaign_projections`;
  console.log('Existing data cleared.');
}

async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('LEGO REPLAY Logistics Tracker - Seed Script');
  console.log('='.repeat(60));

  try {
    await clearExistingData();

    for (const campaign of SEED_CAMPAIGNS) {
      await seedCampaign(campaign);
    }

    console.log('\n' + '='.repeat(60));
    console.log('Seeding complete!');
    console.log(`Created ${SEED_CAMPAIGNS.length} campaigns with events`);
    console.log('='.repeat(60));
    
    // Summary
    console.log('\nCampaign Summary:');
    console.log('-'.repeat(60));
    console.log('1.  PCR-2026-001 - Just created (waiting for shipment)');
    console.log('2.  PCR-2025-012 - Inbound shipment recorded');
    console.log('3.  PCR-2025-011 - Granulation complete');
    console.log('4.  PCR-2025-010 - Metal removal complete');
    console.log('5.  PCR-2025-009 - Polymer purification complete');
    console.log('6.  PCR-2025-008 - Extrusion complete');
    console.log('7.  PCR-2025-007 - ECHA approved');
    console.log('8.  PCR-2025-006 - Transferred to RGE');
    console.log('9.  PCR-2025-005 - Manufacturing in progress');
    console.log('10. PCR-2025-004 - Manufacturing complete');
    console.log('11. PCR-2025-003 - Returned to LEGO');
    console.log('12. PCR-2025-002 - COMPLETED (full cycle)');
    console.log('13. PCR-2025-001 - Extrusion complete (WITH weight correction)');
    console.log('14. PI-2025-001  - Post-Industrial material example');
    console.log('-'.repeat(60));
    
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
