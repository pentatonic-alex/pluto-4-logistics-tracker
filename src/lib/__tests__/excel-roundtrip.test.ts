import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import {
  buildCampaignWorkbook,
  workbookToBuffer,
} from '../excel-exporter';
import { parseExcelFile, getAllCampaignCodes } from '../excel-parser';
import type { Campaign, BaseEvent } from '@/types';

/**
 * Round-trip Tests
 *
 * These tests verify that data exported via excel-exporter can be
 * correctly imported via excel-parser, ensuring compatibility.
 */

// Test data factory functions
function createMockCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: 'cmp_01TEST00000000000000000000',
    legoCampaignCode: 'REPLAY-2026-001',
    status: 'extrusion_complete',
    currentStep: 'Extrusion',
    currentWeightKg: 890,
    materialType: 'PCR',
    description: 'Round-trip test campaign',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-02-01T14:30:00Z',
    completedAt: null,
    lastEventType: 'ExtrusionCompleted',
    lastEventAt: '2026-02-01T14:30:00Z',
    nextExpectedStep: 'ECHA Approval',
    echaApproved: false,
    ...overrides,
  };
}

function createMockEvent(
  eventType: BaseEvent['eventType'],
  eventData: Record<string, unknown>,
  overrides: Partial<BaseEvent> = {}
): BaseEvent {
  return {
    id: 'evt_01TEST00000000000000000000',
    streamType: 'campaign',
    streamId: 'cmp_01TEST00000000000000000000',
    eventType,
    eventData,
    metadata: {
      userId: 'test@example.com',
      timestamp: '2026-01-16T14:30:00Z',
    },
    createdAt: '2026-01-16T14:30:00Z',
    ...overrides,
  };
}

describe('Excel Round-trip Tests', () => {
  describe('Export → Import → Verify', () => {
    it('preserves campaign code through round-trip', () => {
      const campaign = createMockCampaign();
      const event = createMockEvent('InboundShipmentRecorded', {
        grossWeightKg: 1000,
        netWeightKg: 950,
      });

      const eventsMap = new Map<string, BaseEvent[]>();
      eventsMap.set(campaign.id, [event]);

      // Export
      const workbook = buildCampaignWorkbook([campaign], eventsMap);
      const buffer = workbookToBuffer(workbook);

      // Import
      const parsed = parseExcelFile(buffer);
      const campaignCodes = getAllCampaignCodes(parsed);

      // Verify
      expect(campaignCodes).toContain('REPLAY-2026-001');
    });

    it('preserves inbound shipment data through round-trip', () => {
      const campaign = createMockCampaign();
      const event = createMockEvent('InboundShipmentRecorded', {
        grossWeightKg: 1000,
        netWeightKg: 950,
        estimatedAbsKg: 900,
        trackingRef: 'TRACK-001',
        carrier: 'DHL Express',
        shipDate: '2026-01-10',
        arrivalDate: '2026-01-15',
      });

      const eventsMap = new Map<string, BaseEvent[]>();
      eventsMap.set(campaign.id, [event]);

      // Export
      const workbook = buildCampaignWorkbook([campaign], eventsMap);
      const buffer = workbookToBuffer(workbook);

      // Import
      const parsed = parseExcelFile(buffer);

      // Verify
      expect(parsed.inboundShipments).toHaveLength(1);
      const shipment = parsed.inboundShipments[0];
      expect(shipment.campaignCode).toBe('REPLAY-2026-001');
      expect(shipment.grossWeightKg).toBe(1000);
      expect(shipment.netWeightKg).toBe(950);
      expect(shipment.estimatedAbsKg).toBe(900);
      expect(shipment.trackingRef).toBe('TRACK-001');
      expect(shipment.carrier).toBe('DHL Express');
      expect(shipment.shipDate).toBe('2026-01-10');
      expect(shipment.arrivalDate).toBe('2026-01-15');
    });

    it('preserves granulation data through round-trip', () => {
      const campaign = createMockCampaign();
      const event = createMockEvent('GranulationCompleted', {
        ticketNumber: 'GR-001',
        shippingId: 'SHIP-001',
        date: '2026-01-20',
        site: 'MBA Hamburg',
        location: 'Line 1',
        process: 'Granulation',
        startingWeightKg: 950,
        outputWeightKg: 920,
        polymerComposition: 'ABS 100%',
        processHours: 8.5,
        yieldPercent: 96.8,
        lossPercent: 3.2,
        wasteCode: 'W001',
        deliveryLocation: 'Storage A',
        notes: 'Good quality',
      });

      const eventsMap = new Map<string, BaseEvent[]>();
      eventsMap.set(campaign.id, [event]);

      // Export
      const workbook = buildCampaignWorkbook([campaign], eventsMap);
      const buffer = workbookToBuffer(workbook);

      // Import
      const parsed = parseExcelFile(buffer);

      // Verify
      expect(parsed.granulations).toHaveLength(1);
      const granulation = parsed.granulations[0];
      expect(granulation.campaignCode).toBe('REPLAY-2026-001');
      expect(granulation.ticketNumber).toBe('GR-001');
      expect(granulation.startingWeightKg).toBe(950);
      expect(granulation.outputWeightKg).toBe(920);
      expect(granulation.polymerComposition).toBe('ABS 100%');
      expect(granulation.yieldPercent).toBe(96.8);
    });

    it('preserves extrusion data with boolean through round-trip', () => {
      const campaign = createMockCampaign();
      const event = createMockEvent('ExtrusionCompleted', {
        ticketNumber: 'EX-001',
        date: '2026-01-26',
        startingWeightKg: 900,
        outputWeightKg: 890,
        batchNumber: 'BATCH-2026-001',
        echaComplete: true,
      });

      const eventsMap = new Map<string, BaseEvent[]>();
      eventsMap.set(campaign.id, [event]);

      // Export
      const workbook = buildCampaignWorkbook([campaign], eventsMap);
      const buffer = workbookToBuffer(workbook);

      // Import
      const parsed = parseExcelFile(buffer);

      // Verify
      expect(parsed.extrusions).toHaveLength(1);
      const extrusion = parsed.extrusions[0];
      expect(extrusion.campaignCode).toBe('REPLAY-2026-001');
      expect(extrusion.batchNumber).toBe('BATCH-2026-001');
      expect(extrusion.echaComplete).toBe(true);
    });

    it('preserves transfer data through round-trip', () => {
      const campaign = createMockCampaign();
      const event = createMockEvent('TransferToRGERecorded', {
        trackingRef: 'TRANS-001',
        carrier: 'FedEx',
        receivedDate: '2026-02-01',
        receivedGrossWeightKg: 895,
        receivedNetWeightKg: 890,
      });

      const eventsMap = new Map<string, BaseEvent[]>();
      eventsMap.set(campaign.id, [event]);

      // Export
      const workbook = buildCampaignWorkbook([campaign], eventsMap);
      const buffer = workbookToBuffer(workbook);

      // Import
      const parsed = parseExcelFile(buffer);

      // Verify
      expect(parsed.transfers).toHaveLength(1);
      const transfer = parsed.transfers[0];
      expect(transfer.campaignCode).toBe('REPLAY-2026-001');
      expect(transfer.trackingRef).toBe('TRANS-001');
      expect(transfer.carrier).toBe('FedEx');
      expect(transfer.receivedDate).toBe('2026-02-01');
      expect(transfer.receivedGrossWeightKg).toBe(895);
      expect(transfer.receivedNetWeightKg).toBe(890);
    });

    it('preserves manufacturing data through round-trip', () => {
      const campaign = createMockCampaign();
      const startEvent = createMockEvent(
        'ManufacturingStarted',
        {
          poNumber: 'PO-2026-001',
          poQuantity: 50000,
          startDate: '2026-02-05',
        },
        { id: 'evt_01' }
      );
      const completeEvent = createMockEvent(
        'ManufacturingCompleted',
        {
          endDate: '2026-02-15',
        },
        { id: 'evt_02' }
      );

      const eventsMap = new Map<string, BaseEvent[]>();
      eventsMap.set(campaign.id, [startEvent, completeEvent]);

      // Export
      const workbook = buildCampaignWorkbook([campaign], eventsMap);
      const buffer = workbookToBuffer(workbook);

      // Import
      const parsed = parseExcelFile(buffer);

      // Verify
      expect(parsed.manufacturing).toHaveLength(1);
      const mfg = parsed.manufacturing[0];
      expect(mfg.campaignCode).toBe('REPLAY-2026-001');
      expect(mfg.poNumber).toBe('PO-2026-001');
      expect(mfg.poQuantity).toBe(50000);
      expect(mfg.startDate).toBe('2026-02-05');
      expect(mfg.endDate).toBe('2026-02-15');
    });

    it('handles multiple campaigns in round-trip', () => {
      const campaign1 = createMockCampaign({
        id: 'cmp_01',
        legoCampaignCode: 'REPLAY-2026-001',
      });
      const campaign2 = createMockCampaign({
        id: 'cmp_02',
        legoCampaignCode: 'REPLAY-2026-002',
      });

      const event1 = createMockEvent(
        'InboundShipmentRecorded',
        { grossWeightKg: 1000, netWeightKg: 950 },
        { streamId: 'cmp_01' }
      );
      const event2 = createMockEvent(
        'InboundShipmentRecorded',
        { grossWeightKg: 2000, netWeightKg: 1900 },
        { streamId: 'cmp_02' }
      );

      const eventsMap = new Map<string, BaseEvent[]>();
      eventsMap.set('cmp_01', [event1]);
      eventsMap.set('cmp_02', [event2]);

      // Export
      const workbook = buildCampaignWorkbook([campaign1, campaign2], eventsMap);
      const buffer = workbookToBuffer(workbook);

      // Import
      const parsed = parseExcelFile(buffer);
      const campaignCodes = getAllCampaignCodes(parsed);

      // Verify
      expect(campaignCodes).toContain('REPLAY-2026-001');
      expect(campaignCodes).toContain('REPLAY-2026-002');
      expect(parsed.inboundShipments).toHaveLength(2);
    });

    it('produces valid xlsx file structure', () => {
      const campaign = createMockCampaign();
      const eventsMap = new Map<string, BaseEvent[]>();

      // Export
      const workbook = buildCampaignWorkbook([campaign], eventsMap);
      const buffer = workbookToBuffer(workbook);

      // Re-read and verify structure
      const reReadWorkbook = XLSX.read(buffer, { type: 'buffer' });

      expect(reReadWorkbook.SheetNames).toHaveLength(7);
      expect(reReadWorkbook.SheetNames).toEqual([
        'Inbound Shipment',
        'Granulation',
        'Metal Removal',
        'Polymer purification',
        'Extrusion',
        'Transfer MBA-RGE',
        'RGE Manufacturing',
      ]);
    });

    it('handles empty events gracefully in round-trip', () => {
      const campaign = createMockCampaign();
      const eventsMap = new Map<string, BaseEvent[]>();

      // Export with no events
      const workbook = buildCampaignWorkbook([campaign], eventsMap);
      const buffer = workbookToBuffer(workbook);

      // Import - should not throw
      const parsed = parseExcelFile(buffer);

      // Only inbound shipment sheet should have campaign (with empty event data)
      expect(parsed.inboundShipments).toHaveLength(1);
      expect(parsed.inboundShipments[0].campaignCode).toBe('REPLAY-2026-001');
      // Other sheets should be empty (only headers)
      expect(parsed.granulations).toHaveLength(0);
      expect(parsed.metalRemovals).toHaveLength(0);
    });
  });

  describe('Data type preservation', () => {
    it('preserves numeric values', () => {
      const campaign = createMockCampaign();
      const event = createMockEvent('InboundShipmentRecorded', {
        grossWeightKg: 1234.56,
        netWeightKg: 1200.5,
      });

      const eventsMap = new Map<string, BaseEvent[]>();
      eventsMap.set(campaign.id, [event]);

      const workbook = buildCampaignWorkbook([campaign], eventsMap);
      const buffer = workbookToBuffer(workbook);
      const parsed = parseExcelFile(buffer);

      expect(parsed.inboundShipments[0].grossWeightKg).toBe(1234.56);
      expect(parsed.inboundShipments[0].netWeightKg).toBe(1200.5);
    });

    it('preserves date formats', () => {
      const campaign = createMockCampaign();
      const event = createMockEvent('InboundShipmentRecorded', {
        shipDate: '2026-01-10',
        arrivalDate: '2026-12-31',
      });

      const eventsMap = new Map<string, BaseEvent[]>();
      eventsMap.set(campaign.id, [event]);

      const workbook = buildCampaignWorkbook([campaign], eventsMap);
      const buffer = workbookToBuffer(workbook);
      const parsed = parseExcelFile(buffer);

      expect(parsed.inboundShipments[0].shipDate).toBe('2026-01-10');
      expect(parsed.inboundShipments[0].arrivalDate).toBe('2026-12-31');
    });

    it('preserves string values with special characters', () => {
      const campaign = createMockCampaign();
      const event = createMockEvent('GranulationCompleted', {
        notes: 'Contains "quotes" and special chars: <>&',
        contaminationNotes: 'Line 1\nLine 2',
      });

      const eventsMap = new Map<string, BaseEvent[]>();
      eventsMap.set(campaign.id, [event]);

      const workbook = buildCampaignWorkbook([campaign], eventsMap);
      const buffer = workbookToBuffer(workbook);
      const parsed = parseExcelFile(buffer);

      expect(parsed.granulations[0].notes).toBe(
        'Contains "quotes" and special chars: <>&'
      );
    });
  });
});
