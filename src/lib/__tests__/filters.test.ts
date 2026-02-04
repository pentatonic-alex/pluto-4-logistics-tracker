import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCampaigns } from '../projections';
import type { CampaignFilters } from '@/types';

// Mock the sql function from db
// The neon driver sql function is used as tagged template literal for simple queries
// and sql.query() for dynamic queries with parameterized values
vi.mock('../db', () => {
  const mockSql = vi.fn();
  mockSql.query = vi.fn();
  return { sql: mockSql };
});

// Import the mocked sql
import { sql } from '../db';
const mockSql = vi.mocked(sql);
const mockSqlQuery = vi.mocked((sql as unknown as { query: typeof vi.fn }).query);

// Sample campaign row from database
const createMockCampaignRow = (overrides = {}) => ({
  id: 'cmp_test123',
  lego_campaign_code: 'REPLAY-2026-001',
  status: 'created',
  current_step: 'Created',
  current_weight_kg: 1000,
  material_type: 'PCR',
  description: 'Test campaign',
  created_at: new Date('2026-01-15T10:00:00Z'),
  updated_at: new Date('2026-01-15T10:00:00Z'),
  completed_at: null,
  last_event_type: 'CampaignCreated',
  last_event_at: new Date('2026-01-15T10:00:00Z'),
  next_expected_step: 'Inbound Shipment',
  echa_approved: false,
  ...overrides,
});

describe('getCampaigns with filters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('no filters', () => {
    it('returns all campaigns when no filters provided', async () => {
      const mockRow = createMockCampaignRow();
      mockSql.mockResolvedValueOnce([mockRow]);

      const campaigns = await getCampaigns();

      expect(mockSql).toHaveBeenCalled();
      expect(campaigns).toHaveLength(1);
      expect(campaigns[0].id).toBe('cmp_test123');
    });

    it('returns all campaigns when empty filters object provided', async () => {
      const mockRow = createMockCampaignRow();
      mockSql.mockResolvedValueOnce([mockRow]);

      const campaigns = await getCampaigns({});

      expect(mockSql).toHaveBeenCalled();
    });
  });

  describe('status filter', () => {
    it('filters by active status (excludes completed)', async () => {
      mockSqlQuery.mockResolvedValueOnce([createMockCampaignRow()]);

      await getCampaigns({ status: 'active' });

      expect(mockSqlQuery).toHaveBeenCalled();
      const query = mockSqlQuery.mock.calls[0][0];
      expect(query).toContain("status != 'completed'");
    });

    it('filters by specific status', async () => {
      mockSqlQuery.mockResolvedValueOnce([createMockCampaignRow({ status: 'granulation_complete' })]);

      await getCampaigns({ status: 'granulation_complete' });

      expect(mockSqlQuery).toHaveBeenCalled();
      const query = mockSqlQuery.mock.calls[0][0];
      const values = mockSqlQuery.mock.calls[0][1];
      expect(query).toContain('status = $1');
      expect(values).toContain('granulation_complete');
    });
  });

  describe('materialType filter', () => {
    it('filters by PI material type', async () => {
      mockSqlQuery.mockResolvedValueOnce([createMockCampaignRow({ material_type: 'PI' })]);

      await getCampaigns({ materialType: 'PI' });

      expect(mockSqlQuery).toHaveBeenCalled();
      const query = mockSqlQuery.mock.calls[0][0];
      const values = mockSqlQuery.mock.calls[0][1];
      expect(query).toContain('material_type = $1');
      expect(values).toContain('PI');
    });

    it('filters by PCR material type', async () => {
      mockSqlQuery.mockResolvedValueOnce([createMockCampaignRow({ material_type: 'PCR' })]);

      await getCampaigns({ materialType: 'PCR' });

      expect(mockSqlQuery).toHaveBeenCalled();
      const values = mockSqlQuery.mock.calls[0][1];
      expect(values).toContain('PCR');
    });
  });

  describe('echaApproved filter', () => {
    it('filters by ECHA approved true', async () => {
      mockSqlQuery.mockResolvedValueOnce([createMockCampaignRow({ echa_approved: true })]);

      await getCampaigns({ echaApproved: true });

      expect(mockSqlQuery).toHaveBeenCalled();
      const query = mockSqlQuery.mock.calls[0][0];
      const values = mockSqlQuery.mock.calls[0][1];
      expect(query).toContain('echa_approved = $1');
      expect(values).toContain(true);
    });

    it('filters by ECHA approved false', async () => {
      mockSqlQuery.mockResolvedValueOnce([createMockCampaignRow({ echa_approved: false })]);

      await getCampaigns({ echaApproved: false });

      expect(mockSqlQuery).toHaveBeenCalled();
      const values = mockSqlQuery.mock.calls[0][1];
      expect(values).toContain(false);
    });
  });

  describe('dateRange filter', () => {
    it('filters by start date only', async () => {
      mockSqlQuery.mockResolvedValueOnce([createMockCampaignRow()]);

      await getCampaigns({ dateRange: { start: '2026-01-01T00:00:00Z' } });

      expect(mockSqlQuery).toHaveBeenCalled();
      const query = mockSqlQuery.mock.calls[0][0];
      const values = mockSqlQuery.mock.calls[0][1];
      expect(query).toContain('created_at >= $1');
      expect(values).toContain('2026-01-01T00:00:00Z');
    });

    it('filters by end date only', async () => {
      mockSqlQuery.mockResolvedValueOnce([createMockCampaignRow()]);

      await getCampaigns({ dateRange: { end: '2026-12-31T23:59:59Z' } });

      expect(mockSqlQuery).toHaveBeenCalled();
      const query = mockSqlQuery.mock.calls[0][0];
      const values = mockSqlQuery.mock.calls[0][1];
      expect(query).toContain('created_at <= $1');
      expect(values).toContain('2026-12-31T23:59:59Z');
    });

    it('filters by both start and end date', async () => {
      mockSqlQuery.mockResolvedValueOnce([createMockCampaignRow()]);

      await getCampaigns({ 
        dateRange: { 
          start: '2026-01-01T00:00:00Z',
          end: '2026-12-31T23:59:59Z'
        } 
      });

      expect(mockSqlQuery).toHaveBeenCalled();
      const query = mockSqlQuery.mock.calls[0][0];
      expect(query).toContain('created_at >= $1');
      expect(query).toContain('created_at <= $2');
    });
  });

  describe('weightRange filter', () => {
    it('filters by minimum weight', async () => {
      mockSqlQuery.mockResolvedValueOnce([createMockCampaignRow({ current_weight_kg: 500 })]);

      await getCampaigns({ weightRange: { min: 100 } });

      expect(mockSqlQuery).toHaveBeenCalled();
      const query = mockSqlQuery.mock.calls[0][0];
      const values = mockSqlQuery.mock.calls[0][1];
      expect(query).toContain('current_weight_kg >= $1');
      expect(values).toContain(100);
    });

    it('filters by maximum weight', async () => {
      mockSqlQuery.mockResolvedValueOnce([createMockCampaignRow({ current_weight_kg: 500 })]);

      await getCampaigns({ weightRange: { max: 1000 } });

      expect(mockSqlQuery).toHaveBeenCalled();
      const query = mockSqlQuery.mock.calls[0][0];
      const values = mockSqlQuery.mock.calls[0][1];
      expect(query).toContain('current_weight_kg <= $1');
      expect(values).toContain(1000);
    });

    it('filters by weight range', async () => {
      mockSqlQuery.mockResolvedValueOnce([createMockCampaignRow({ current_weight_kg: 500 })]);

      await getCampaigns({ weightRange: { min: 100, max: 1000 } });

      expect(mockSqlQuery).toHaveBeenCalled();
      const query = mockSqlQuery.mock.calls[0][0];
      expect(query).toContain('current_weight_kg >= $1');
      expect(query).toContain('current_weight_kg <= $2');
    });
  });

  describe('campaignCodePrefix filter', () => {
    it('filters by campaign code prefix', async () => {
      mockSqlQuery.mockResolvedValueOnce([createMockCampaignRow()]);

      await getCampaigns({ campaignCodePrefix: 'REPLAY' });

      expect(mockSqlQuery).toHaveBeenCalled();
      const query = mockSqlQuery.mock.calls[0][0];
      const values = mockSqlQuery.mock.calls[0][1];
      expect(query).toContain('lego_campaign_code ILIKE $1');
      expect(values).toContain('REPLAY%');
    });

    it('escapes ILIKE special characters in prefix', async () => {
      mockSqlQuery.mockResolvedValueOnce([createMockCampaignRow()]);

      await getCampaigns({ campaignCodePrefix: 'TEST%_CODE' });

      expect(mockSqlQuery).toHaveBeenCalled();
      const values = mockSqlQuery.mock.calls[0][1];
      // % and _ should be escaped
      expect(values).toContain('TEST\\%\\_CODE%');
    });

    it('escapes backslashes in prefix', async () => {
      mockSqlQuery.mockResolvedValueOnce([createMockCampaignRow()]);

      await getCampaigns({ campaignCodePrefix: 'TEST\\CODE' });

      expect(mockSqlQuery).toHaveBeenCalled();
      const values = mockSqlQuery.mock.calls[0][1];
      // Backslash should be escaped
      expect(values).toContain('TEST\\\\CODE%');
    });
  });

  describe('combined filters', () => {
    it('combines multiple filters with AND', async () => {
      mockSqlQuery.mockResolvedValueOnce([createMockCampaignRow()]);

      const filters: CampaignFilters = {
        status: 'active',
        materialType: 'PCR',
        echaApproved: true,
      };

      await getCampaigns(filters);

      expect(mockSqlQuery).toHaveBeenCalled();
      const query = mockSqlQuery.mock.calls[0][0];
      expect(query).toContain("status != 'completed'");
      expect(query).toContain('material_type = $1');
      expect(query).toContain('echa_approved = $2');
      expect(query).toContain(' AND ');
    });

    it('handles all filters together', async () => {
      mockSqlQuery.mockResolvedValueOnce([createMockCampaignRow()]);

      const filters: CampaignFilters = {
        status: 'granulation_complete',
        materialType: 'PI',
        echaApproved: false,
        dateRange: { start: '2026-01-01', end: '2026-12-31' },
        weightRange: { min: 100, max: 1000 },
        campaignCodePrefix: 'REPLAY',
      };

      await getCampaigns(filters);

      expect(mockSqlQuery).toHaveBeenCalled();
      const query = mockSqlQuery.mock.calls[0][0];
      const values = mockSqlQuery.mock.calls[0][1] as unknown[];
      
      // Check all conditions are present
      expect(query).toContain('status = $1');
      expect(query).toContain('material_type = $2');
      expect(query).toContain('echa_approved = $3');
      expect(query).toContain('created_at >= $4');
      expect(query).toContain('created_at <= $5');
      expect(query).toContain('current_weight_kg >= $6');
      expect(query).toContain('current_weight_kg <= $7');
      expect(query).toContain('lego_campaign_code ILIKE $8');
      
      // Check values array
      expect(values).toHaveLength(8);
    });
  });

  describe('result mapping', () => {
    it('correctly maps database row to Campaign type', async () => {
      const mockRow = createMockCampaignRow({
        id: 'cmp_mapped123',
        lego_campaign_code: 'MAPPED-001',
        status: 'manufacturing_complete',
        current_step: 'Manufacturing Complete',
        current_weight_kg: 850,
        material_type: 'PI',
        description: 'Mapped test campaign',
        created_at: new Date('2026-02-01T08:00:00Z'),
        updated_at: new Date('2026-02-15T16:30:00Z'),
        completed_at: null,
        last_event_type: 'ManufacturingCompleted',
        last_event_at: new Date('2026-02-15T16:30:00Z'),
        next_expected_step: 'Return to LEGO',
        echa_approved: true,
      });
      mockSql.mockResolvedValueOnce([mockRow]);

      const campaigns = await getCampaigns();

      expect(campaigns).toHaveLength(1);
      const campaign = campaigns[0];
      
      expect(campaign.id).toBe('cmp_mapped123');
      expect(campaign.legoCampaignCode).toBe('MAPPED-001');
      expect(campaign.status).toBe('manufacturing_complete');
      expect(campaign.currentStep).toBe('Manufacturing Complete');
      expect(campaign.currentWeightKg).toBe(850);
      expect(campaign.materialType).toBe('PI');
      expect(campaign.description).toBe('Mapped test campaign');
      expect(campaign.createdAt).toBe('2026-02-01T08:00:00.000Z');
      expect(campaign.updatedAt).toBe('2026-02-15T16:30:00.000Z');
      expect(campaign.completedAt).toBeNull();
      expect(campaign.lastEventType).toBe('ManufacturingCompleted');
      expect(campaign.lastEventAt).toBe('2026-02-15T16:30:00.000Z');
      expect(campaign.nextExpectedStep).toBe('Return to LEGO');
      expect(campaign.echaApproved).toBe(true);
    });

    it('handles null values correctly', async () => {
      const mockRow = createMockCampaignRow({
        current_weight_kg: null,
        description: null,
        completed_at: null,
        last_event_type: null,
        last_event_at: null,
        next_expected_step: null,
      });
      mockSql.mockResolvedValueOnce([mockRow]);

      const campaigns = await getCampaigns();

      expect(campaigns).toHaveLength(1);
      const campaign = campaigns[0];
      
      expect(campaign.currentWeightKg).toBeNull();
      expect(campaign.description).toBeNull();
      expect(campaign.completedAt).toBeNull();
      expect(campaign.lastEventType).toBeNull();
      expect(campaign.lastEventAt).toBeNull();
      expect(campaign.nextExpectedStep).toBeNull();
    });
  });
});
