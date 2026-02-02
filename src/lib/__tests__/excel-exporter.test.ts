import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import {
  buildCampaignWorkbook,
  workbookToBuffer,
  generateExportFilename,
  HEADERS,
} from '../excel-exporter';
import { SHEET_NAMES } from '../excel-parser';
import type { Campaign, BaseEvent } from '@/types';

// Test data factory functions
function createMockCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: 'cmp_01TEST00000000000000000000',
    legoCampaignCode: 'REPLAY-2026-001',
    status: 'inbound_shipment_recorded',
    currentStep: 'Inbound Shipment',
    currentWeightKg: 950,
    materialType: 'PCR',
    description: 'Test campaign',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-16T14:30:00Z',
    completedAt: null,
    lastEventType: 'InboundShipmentRecorded',
    lastEventAt: '2026-01-16T14:30:00Z',
    nextExpectedStep: 'Granulation',
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

describe('excel-exporter', () => {
  describe('buildCampaignWorkbook', () => {
    it('creates a workbook with all 7 sheets', () => {
      const campaigns = [createMockCampaign()];
      const eventsMap = new Map<string, BaseEvent[]>();

      const workbook = buildCampaignWorkbook(campaigns, eventsMap);

      expect(workbook.SheetNames).toHaveLength(7);
      expect(workbook.SheetNames).toContain(SHEET_NAMES.INBOUND_SHIPMENT);
      expect(workbook.SheetNames).toContain(SHEET_NAMES.GRANULATION);
      expect(workbook.SheetNames).toContain(SHEET_NAMES.METAL_REMOVAL);
      expect(workbook.SheetNames).toContain(SHEET_NAMES.POLYMER_PURIFICATION);
      expect(workbook.SheetNames).toContain(SHEET_NAMES.EXTRUSION);
      expect(workbook.SheetNames).toContain(SHEET_NAMES.TRANSFER_MBA_RGE);
      expect(workbook.SheetNames).toContain(SHEET_NAMES.RGE_MANUFACTURING);
    });

    it('creates valid workbook with empty campaigns', () => {
      const workbook = buildCampaignWorkbook([], new Map());

      expect(workbook.SheetNames).toHaveLength(7);
      // Each sheet should have at least the header row
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        expect(data.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('Inbound Shipment sheet', () => {
    it('includes campaign code even without shipment event', () => {
      const campaign = createMockCampaign();
      const eventsMap = new Map<string, BaseEvent[]>();

      const workbook = buildCampaignWorkbook([campaign], eventsMap);
      const sheet = workbook.Sheets[SHEET_NAMES.INBOUND_SHIPMENT];
      const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

      // Header + 1 campaign row
      expect(data.length).toBe(2);
      expect(data[0]).toEqual(HEADERS.INBOUND_SHIPMENT);
      expect(data[1][0]).toBe('REPLAY-2026-001');
    });

    it('exports inbound shipment event data correctly', () => {
      const campaign = createMockCampaign();
      const event = createMockEvent('InboundShipmentRecorded', {
        grossWeightKg: 1000,
        netWeightKg: 950,
        estimatedAbsKg: 900,
        requestedArrivalDate: '2026-01-15T00:00:00Z',
        trackingRef: 'TRACK-001',
        carrier: 'DHL',
        shipDate: '2026-01-10T00:00:00Z',
        arrivalDate: '2026-01-15T00:00:00Z',
      });

      const eventsMap = new Map<string, BaseEvent[]>();
      eventsMap.set(campaign.id, [event]);

      const workbook = buildCampaignWorkbook([campaign], eventsMap);
      const sheet = workbook.Sheets[SHEET_NAMES.INBOUND_SHIPMENT];
      const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

      expect(data[1][0]).toBe('REPLAY-2026-001'); // Campaign code
      expect(data[1][1]).toBe('2026-01-15'); // Requested arrival date
      expect(data[1][2]).toBe(1000); // Gross weight
      expect(data[1][3]).toBe(950); // Net weight
      expect(data[1][4]).toBe(900); // Estimated ABS
      expect(data[1][7]).toBe('TRACK-001'); // Tracking ref
      expect(data[1][8]).toBe('DHL'); // Carrier
    });
  });

  describe('Granulation sheet', () => {
    it('exports granulation event data correctly', () => {
      const campaign = createMockCampaign();
      const event = createMockEvent('GranulationCompleted', {
        ticketNumber: 'GR-001',
        shippingId: 'SHIP-001',
        date: '2026-01-20T00:00:00Z',
        site: 'MBA Hamburg',
        location: 'Line 1',
        process: 'Granulation',
        startingWeightKg: 950,
        outputWeightKg: 920,
        polymerComposition: 'ABS 100%',
        processHours: 8,
        yieldPercent: 96.8,
        lossPercent: 3.2,
      });

      const eventsMap = new Map<string, BaseEvent[]>();
      eventsMap.set(campaign.id, [event]);

      const workbook = buildCampaignWorkbook([campaign], eventsMap);
      const sheet = workbook.Sheets[SHEET_NAMES.GRANULATION];
      const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

      expect(data[1][0]).toBe('GR-001'); // Ticket number
      expect(data[1][3]).toBe('REPLAY-2026-001'); // Campaign code (col 3)
      expect(data[1][4]).toBe('2026-01-20'); // Date
      expect(data[1][5]).toBe('MBA Hamburg'); // Site
      expect(data[1][8]).toBe(950); // Starting weight
      expect(data[1][9]).toBe(920); // Output weight
      expect(data[1][13]).toBe(96.8); // Yield %
    });

    it('returns only header when no granulation events', () => {
      const campaign = createMockCampaign();
      const eventsMap = new Map<string, BaseEvent[]>();

      const workbook = buildCampaignWorkbook([campaign], eventsMap);
      const sheet = workbook.Sheets[SHEET_NAMES.GRANULATION];
      const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

      expect(data.length).toBe(1); // Header only
      expect(data[0]).toEqual(HEADERS.GRANULATION);
    });
  });

  describe('Metal Removal sheet', () => {
    it('exports metal removal event data correctly', () => {
      const campaign = createMockCampaign();
      const event = createMockEvent('MetalRemovalCompleted', {
        ticketNumber: 'MR-001',
        date: '2026-01-22T00:00:00Z',
        site: 'MBA Hamburg',
        startingWeightKg: 920,
        outputWeightKg: 915,
      });

      const eventsMap = new Map<string, BaseEvent[]>();
      eventsMap.set(campaign.id, [event]);

      const workbook = buildCampaignWorkbook([campaign], eventsMap);
      const sheet = workbook.Sheets[SHEET_NAMES.METAL_REMOVAL];
      const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

      expect(data[1][0]).toBe('MR-001'); // Ticket number
      expect(data[1][1]).toBe('REPLAY-2026-001'); // Campaign code (col 1)
      expect(data[1][6]).toBe(920); // Starting weight
      expect(data[1][8]).toBe(915); // Output weight
    });
  });

  describe('Polymer Purification sheet', () => {
    it('exports polymer purification event data correctly', () => {
      const campaign = createMockCampaign();
      const event = createMockEvent('PolymerPurificationCompleted', {
        ticketNumber: 'PP-001',
        date: '2026-01-24T00:00:00Z',
        startingWeightKg: 915,
        outputWeightKg: 900,
        outputPolymerComposition: 'ABS 99.5%',
        wasteComposition: 'Mixed 0.5%',
      });

      const eventsMap = new Map<string, BaseEvent[]>();
      eventsMap.set(campaign.id, [event]);

      const workbook = buildCampaignWorkbook([campaign], eventsMap);
      const sheet = workbook.Sheets[SHEET_NAMES.POLYMER_PURIFICATION];
      const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

      expect(data[1][0]).toBe('PP-001');
      expect(data[1][1]).toBe('REPLAY-2026-001');
      expect(data[1][9]).toBe('ABS 99.5%'); // Output polymer composition
      expect(data[1][10]).toBe('Mixed 0.5%'); // Waste composition
    });
  });

  describe('Extrusion sheet', () => {
    it('exports extrusion event data correctly', () => {
      const campaign = createMockCampaign();
      const event = createMockEvent('ExtrusionCompleted', {
        ticketNumber: 'EX-001',
        date: '2026-01-26T00:00:00Z',
        startingWeightKg: 900,
        outputWeightKg: 890,
        batchNumber: 'BATCH-2026-001',
        echaComplete: true,
      });

      const eventsMap = new Map<string, BaseEvent[]>();
      eventsMap.set(campaign.id, [event]);

      const workbook = buildCampaignWorkbook([campaign], eventsMap);
      const sheet = workbook.Sheets[SHEET_NAMES.EXTRUSION];
      const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

      expect(data[1][0]).toBe('EX-001');
      expect(data[1][12]).toBe('BATCH-2026-001'); // Batch number
      expect(data[1][14]).toBe('Yes'); // ECHA complete
    });

    it('formats boolean values correctly', () => {
      const campaign = createMockCampaign();
      const eventTrue = createMockEvent('ExtrusionCompleted', {
        echaComplete: true,
      });
      const eventFalse = createMockEvent(
        'ExtrusionCompleted',
        {
          echaComplete: false,
        },
        { id: 'evt_02' }
      );

      const eventsMap = new Map<string, BaseEvent[]>();
      eventsMap.set(campaign.id, [eventTrue, eventFalse]);

      const workbook = buildCampaignWorkbook([campaign], eventsMap);
      const sheet = workbook.Sheets[SHEET_NAMES.EXTRUSION];
      const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

      expect(data[1][14]).toBe('Yes');
      expect(data[2][14]).toBe('No');
    });
  });

  describe('Transfer MBA-RGE sheet', () => {
    it('exports transfer event data correctly', () => {
      const campaign = createMockCampaign();
      const event = createMockEvent('TransferToRGERecorded', {
        trackingRef: 'TRANS-001',
        carrier: 'FedEx',
        receivedDate: '2026-02-01T00:00:00Z',
        receivedGrossWeightKg: 895,
        receivedNetWeightKg: 890,
      });

      const eventsMap = new Map<string, BaseEvent[]>();
      eventsMap.set(campaign.id, [event]);

      const workbook = buildCampaignWorkbook([campaign], eventsMap);
      const sheet = workbook.Sheets[SHEET_NAMES.TRANSFER_MBA_RGE];
      const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

      expect(data[1][0]).toBe('REPLAY-2026-001'); // Campaign code
      expect(data[1][1]).toBe('TRANS-001'); // Tracking ref
      expect(data[1][2]).toBe('FedEx'); // Carrier
      expect(data[1][3]).toBe('2026-02-01'); // Received date
      expect(data[1][4]).toBe(895); // Gross weight
      expect(data[1][5]).toBe(890); // Net weight
    });
  });

  describe('RGE Manufacturing sheet', () => {
    it('exports manufacturing events correctly', () => {
      const campaign = createMockCampaign();
      const startEvent = createMockEvent(
        'ManufacturingStarted',
        {
          poNumber: 'PO-2026-001',
          poQuantity: 50000,
          startDate: '2026-02-05T00:00:00Z',
        },
        { id: 'evt_01' }
      );
      const completeEvent = createMockEvent(
        'ManufacturingCompleted',
        {
          endDate: '2026-02-15T00:00:00Z',
        },
        { id: 'evt_02' }
      );

      const eventsMap = new Map<string, BaseEvent[]>();
      eventsMap.set(campaign.id, [startEvent, completeEvent]);

      const workbook = buildCampaignWorkbook([campaign], eventsMap);
      const sheet = workbook.Sheets[SHEET_NAMES.RGE_MANUFACTURING];
      const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

      expect(data[1][0]).toBe('REPLAY-2026-001'); // Campaign code
      expect(data[1][1]).toBe('PO-2026-001'); // PO number
      expect(data[1][2]).toBe(50000); // PO quantity
      expect(data[1][3]).toBe('2026-02-05'); // Start date
      expect(data[1][4]).toBe('2026-02-15'); // End date
    });
  });

  describe('Multiple campaigns', () => {
    it('exports data for all campaigns', () => {
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
        { grossWeightKg: 1000 },
        { streamId: 'cmp_01' }
      );
      const event2 = createMockEvent(
        'InboundShipmentRecorded',
        { grossWeightKg: 2000 },
        { streamId: 'cmp_02' }
      );

      const eventsMap = new Map<string, BaseEvent[]>();
      eventsMap.set('cmp_01', [event1]);
      eventsMap.set('cmp_02', [event2]);

      const workbook = buildCampaignWorkbook([campaign1, campaign2], eventsMap);
      const sheet = workbook.Sheets[SHEET_NAMES.INBOUND_SHIPMENT];
      const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

      expect(data.length).toBe(3); // Header + 2 campaigns
      expect(data[1][0]).toBe('REPLAY-2026-001');
      expect(data[2][0]).toBe('REPLAY-2026-002');
      expect(data[1][2]).toBe(1000); // Campaign 1 weight
      expect(data[2][2]).toBe(2000); // Campaign 2 weight
    });
  });

  describe('workbookToBuffer', () => {
    it('converts workbook to Buffer', () => {
      const workbook = buildCampaignWorkbook([], new Map());
      const buffer = workbookToBuffer(workbook);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('produces valid xlsx buffer', () => {
      const campaign = createMockCampaign();
      const eventsMap = new Map<string, BaseEvent[]>();

      const workbook = buildCampaignWorkbook([campaign], eventsMap);
      const buffer = workbookToBuffer(workbook);

      // Verify we can re-read the buffer
      const parsedWorkbook = XLSX.read(buffer, { type: 'buffer' });
      expect(parsedWorkbook.SheetNames).toHaveLength(7);
    });
  });

  describe('generateExportFilename', () => {
    it('generates filename with campaign code', () => {
      const filename = generateExportFilename(
        'REPLAY-2026-001',
        new Date('2026-02-02')
      );
      expect(filename).toBe('campaign-REPLAY-2026-001-2026-02-02.xlsx');
    });

    it('generates filename without campaign code for bulk export', () => {
      const filename = generateExportFilename(undefined, new Date('2026-02-02'));
      expect(filename).toBe('campaigns-export-2026-02-02.xlsx');
    });

    it('uses current date when not specified', () => {
      const filename = generateExportFilename('TEST');
      expect(filename).toMatch(/^campaign-TEST-\d{4}-\d{2}-\d{2}\.xlsx$/);
    });
  });

  describe('Header row correctness', () => {
    it('all sheets have correct headers matching parser expectations', () => {
      // This test ensures round-trip compatibility
      const workbook = buildCampaignWorkbook([], new Map());

      // Inbound Shipment
      const inboundSheet = workbook.Sheets[SHEET_NAMES.INBOUND_SHIPMENT];
      const inboundData = XLSX.utils.sheet_to_json<string[]>(inboundSheet, {
        header: 1,
      });
      expect(inboundData[0]).toEqual(HEADERS.INBOUND_SHIPMENT);

      // Granulation
      const granSheet = workbook.Sheets[SHEET_NAMES.GRANULATION];
      const granData = XLSX.utils.sheet_to_json<string[]>(granSheet, {
        header: 1,
      });
      expect(granData[0]).toEqual(HEADERS.GRANULATION);

      // Metal Removal
      const metalSheet = workbook.Sheets[SHEET_NAMES.METAL_REMOVAL];
      const metalData = XLSX.utils.sheet_to_json<string[]>(metalSheet, {
        header: 1,
      });
      expect(metalData[0]).toEqual(HEADERS.METAL_REMOVAL);

      // Polymer Purification
      const polySheet = workbook.Sheets[SHEET_NAMES.POLYMER_PURIFICATION];
      const polyData = XLSX.utils.sheet_to_json<string[]>(polySheet, {
        header: 1,
      });
      expect(polyData[0]).toEqual(HEADERS.POLYMER_PURIFICATION);

      // Extrusion
      const extSheet = workbook.Sheets[SHEET_NAMES.EXTRUSION];
      const extData = XLSX.utils.sheet_to_json<string[]>(extSheet, {
        header: 1,
      });
      expect(extData[0]).toEqual(HEADERS.EXTRUSION);

      // Transfer
      const transSheet = workbook.Sheets[SHEET_NAMES.TRANSFER_MBA_RGE];
      const transData = XLSX.utils.sheet_to_json<string[]>(transSheet, {
        header: 1,
      });
      expect(transData[0]).toEqual(HEADERS.TRANSFER_MBA_RGE);

      // Manufacturing
      const mfgSheet = workbook.Sheets[SHEET_NAMES.RGE_MANUFACTURING];
      const mfgData = XLSX.utils.sheet_to_json<string[]>(mfgSheet, {
        header: 1,
      });
      expect(mfgData[0]).toEqual(HEADERS.RGE_MANUFACTURING);
    });
  });
});
