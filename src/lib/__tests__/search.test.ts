import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchCampaigns } from '../projections';

// Mock the sql function from db
vi.mock('../db', () => ({
  sql: vi.fn(),
}));

// Import the mocked sql
import { sql } from '../db';
const mockSql = vi.mocked(sql);

describe('searchCampaigns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('query validation', () => {
    it('returns empty array for empty query', async () => {
      const results = await searchCampaigns('');
      expect(results).toEqual([]);
      expect(mockSql).not.toHaveBeenCalled();
    });

    it('returns empty array for whitespace-only query', async () => {
      const results = await searchCampaigns('   ');
      expect(results).toEqual([]);
      expect(mockSql).not.toHaveBeenCalled();
    });

    it('returns empty array for single character query', async () => {
      const results = await searchCampaigns('a');
      expect(results).toEqual([]);
      expect(mockSql).not.toHaveBeenCalled();
    });

    it('executes search for 2+ character query', async () => {
      mockSql.mockResolvedValueOnce([]);
      await searchCampaigns('ab');
      expect(mockSql).toHaveBeenCalled();
    });
  });

  describe('result mapping', () => {
    it('maps campaign_id match correctly', async () => {
      mockSql.mockResolvedValueOnce([
        {
          id: 'cmp_123',
          lego_campaign_code: 'REPLAY-2026-001',
          status: 'created',
          description: 'Test campaign',
          match_type: 'campaign_id',
          match_value: 'cmp_123',
        },
      ]);

      const results = await searchCampaigns('cmp_123');
      
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        campaignId: 'cmp_123',
        legoCampaignCode: 'REPLAY-2026-001',
        status: 'created',
        description: 'Test campaign',
        matchedField: 'campaign_id',
        matchedValue: 'cmp_123',
      });
    });

    it('maps lego_code match correctly', async () => {
      mockSql.mockResolvedValueOnce([
        {
          id: 'cmp_456',
          lego_campaign_code: 'REPLAY-2026-002',
          status: 'inbound_shipment_recorded',
          description: null,
          match_type: 'lego_code',
          match_value: 'REPLAY-2026-002',
        },
      ]);

      const results = await searchCampaigns('REPLAY');
      
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        campaignId: 'cmp_456',
        matchedField: 'lego_code',
        matchedValue: 'REPLAY-2026-002',
      });
    });

    it('maps tracking match correctly', async () => {
      mockSql.mockResolvedValueOnce([
        {
          id: 'cmp_789',
          lego_campaign_code: 'REPLAY-2026-003',
          status: 'transferred_to_rge',
          description: 'Another campaign',
          match_type: 'tracking',
          match_value: 'DHL123456',
        },
      ]);

      const results = await searchCampaigns('DHL123');
      
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        matchedField: 'tracking',
        matchedValue: 'DHL123456',
      });
    });

    it('maps po match correctly', async () => {
      mockSql.mockResolvedValueOnce([
        {
          id: 'cmp_101',
          lego_campaign_code: 'REPLAY-2026-004',
          status: 'manufacturing_started',
          description: null,
          match_type: 'po',
          match_value: 'PO-2026-001',
        },
      ]);

      const results = await searchCampaigns('PO-2026');
      
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        matchedField: 'po',
        matchedValue: 'PO-2026-001',
      });
    });

    it('maps description match correctly', async () => {
      mockSql.mockResolvedValueOnce([
        {
          id: 'cmp_202',
          lego_campaign_code: 'REPLAY-2026-005',
          status: 'completed',
          description: 'Test batch for quality control',
          match_type: 'description',
          match_value: 'Test batch for quality control',
        },
      ]);

      const results = await searchCampaigns('quality');
      
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        matchedField: 'description',
        matchedValue: 'Test batch for quality control',
      });
    });
  });

  describe('multiple results', () => {
    it('returns multiple matches from different sources', async () => {
      mockSql.mockResolvedValueOnce([
        {
          id: 'cmp_001',
          lego_campaign_code: 'REPLAY-2026-001',
          status: 'created',
          description: null,
          match_type: 'lego_code',
          match_value: 'REPLAY-2026-001',
        },
        {
          id: 'cmp_002',
          lego_campaign_code: 'REPLAY-2026-002',
          status: 'completed',
          description: null,
          match_type: 'lego_code',
          match_value: 'REPLAY-2026-002',
        },
        {
          id: 'cmp_003',
          lego_campaign_code: 'OTHER-001',
          status: 'manufacturing_started',
          description: 'REPLAY process test',
          match_type: 'description',
          match_value: 'REPLAY process test',
        },
      ]);

      const results = await searchCampaigns('REPLAY');
      
      expect(results).toHaveLength(3);
      expect(results.map(r => r.matchedField)).toEqual([
        'lego_code',
        'lego_code',
        'description',
      ]);
    });

    it('handles empty results', async () => {
      mockSql.mockResolvedValueOnce([]);

      const results = await searchCampaigns('nonexistent');
      
      expect(results).toEqual([]);
    });
  });

  describe('query trimming', () => {
    it('trims whitespace from query', async () => {
      mockSql.mockResolvedValueOnce([]);
      
      await searchCampaigns('  test  ');
      
      // Should use trimmed query
      expect(mockSql).toHaveBeenCalled();
    });
  });
});
