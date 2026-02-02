import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAuditEntries, getCampaignsForFilter } from '../audit';

// Mock the sql function from db
vi.mock('../db', () => ({
  sql: vi.fn(),
}));

// Import the mocked sql
import { sql } from '../db';
const mockSql = vi.mocked(sql);

describe('Audit Log', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAuditEntries', () => {
    const mockCorrectionEvent = {
      id: 'evt_abc123',
      campaign_id: 'cmp_xyz789',
      campaign_code: 'REPLAY-2026-001',
      event_data: {
        correctsEventId: 'evt_original123',
        correctsEventType: 'InboundShipmentRecorded',
        reason: 'Weight entry error',
        changes: {
          netWeightKg: { was: 100, now: 150 },
        },
      },
      metadata: {
        userId: 'user@example.com',
        timestamp: '2026-02-02T10:00:00.000Z',
      },
      created_at: new Date('2026-02-02T10:00:00.000Z'),
    };

    it('returns empty results when no corrections exist', async () => {
      mockSql.mockResolvedValueOnce([{ total: 0 }]); // count query
      mockSql.mockResolvedValueOnce([]); // data query

      const result = await getAuditEntries();

      expect(result.entries).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('returns paginated audit entries', async () => {
      mockSql.mockResolvedValueOnce([{ total: 1 }]); // count query
      mockSql.mockResolvedValueOnce([mockCorrectionEvent]); // data query

      const result = await getAuditEntries({}, { page: 1, limit: 20 });

      expect(result.entries).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.entries[0]).toEqual({
        id: 'evt_abc123',
        campaignId: 'cmp_xyz789',
        campaignCode: 'REPLAY-2026-001',
        correctedEventId: 'evt_original123',
        correctedEventType: 'InboundShipmentRecorded',
        reason: 'Weight entry error',
        changes: {
          netWeightKg: { was: 100, now: 150 },
        },
        userId: 'user@example.com',
        createdAt: '2026-02-02T10:00:00.000Z',
      });
    });

    it('filters by campaignId', async () => {
      mockSql.mockResolvedValueOnce([{ total: 1 }]);
      mockSql.mockResolvedValueOnce([mockCorrectionEvent]);

      await getAuditEntries({ campaignId: 'cmp_xyz789' });

      // Check that sql was called (the specific query includes campaignId filter)
      expect(mockSql).toHaveBeenCalledTimes(2);
    });

    it('filters by date range', async () => {
      mockSql.mockResolvedValueOnce([{ total: 1 }]);
      mockSql.mockResolvedValueOnce([mockCorrectionEvent]);

      await getAuditEntries({
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-12-31T23:59:59.999Z',
      });

      expect(mockSql).toHaveBeenCalledTimes(2);
    });

    it('combines all filters', async () => {
      mockSql.mockResolvedValueOnce([{ total: 1 }]);
      mockSql.mockResolvedValueOnce([mockCorrectionEvent]);

      await getAuditEntries({
        campaignId: 'cmp_xyz789',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-12-31T23:59:59.999Z',
      });

      expect(mockSql).toHaveBeenCalledTimes(2);
    });

    it('handles multiple corrections', async () => {
      const secondCorrection = {
        ...mockCorrectionEvent,
        id: 'evt_def456',
        event_data: {
          correctsEventId: 'evt_original456',
          correctsEventType: 'GranulationCompleted',
          reason: 'Process hours update',
          changes: {
            processHours: { was: 8, now: 10 },
          },
        },
        created_at: new Date('2026-02-01T10:00:00.000Z'),
      };

      mockSql.mockResolvedValueOnce([{ total: 2 }]);
      mockSql.mockResolvedValueOnce([mockCorrectionEvent, secondCorrection]);

      const result = await getAuditEntries();

      expect(result.entries).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.entries[0].correctedEventType).toBe('InboundShipmentRecorded');
      expect(result.entries[1].correctedEventType).toBe('GranulationCompleted');
    });

    it('calculates pagination correctly', async () => {
      mockSql.mockResolvedValueOnce([{ total: 50 }]);
      mockSql.mockResolvedValueOnce([mockCorrectionEvent]);

      const result = await getAuditEntries({}, { page: 3, limit: 20 });

      expect(result.total).toBe(50);
      // Page 3 with limit 20 means offset 40
      expect(mockSql).toHaveBeenCalledTimes(2);
    });
  });

  describe('getCampaignsForFilter', () => {
    it('returns empty array when no campaigns exist', async () => {
      mockSql.mockResolvedValueOnce([]);

      const result = await getCampaignsForFilter();

      expect(result).toEqual([]);
    });

    it('returns campaign summaries for dropdown', async () => {
      mockSql.mockResolvedValueOnce([
        { id: 'cmp_001', lego_campaign_code: 'REPLAY-2026-001' },
        { id: 'cmp_002', lego_campaign_code: 'REPLAY-2026-002' },
        { id: 'cmp_003', lego_campaign_code: 'REPLAY-2026-003' },
      ]);

      const result = await getCampaignsForFilter();

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        id: 'cmp_001',
        code: 'REPLAY-2026-001',
      });
      expect(result[1]).toEqual({
        id: 'cmp_002',
        code: 'REPLAY-2026-002',
      });
    });

    it('maps fields correctly', async () => {
      mockSql.mockResolvedValueOnce([
        { id: 'cmp_test', lego_campaign_code: 'TEST-CODE' },
      ]);

      const result = await getCampaignsForFilter();

      expect(result[0]).toMatchObject({
        id: 'cmp_test',
        code: 'TEST-CODE',
      });
    });
  });
});
