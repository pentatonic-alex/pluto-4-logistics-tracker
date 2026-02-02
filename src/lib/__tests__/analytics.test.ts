import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database module
vi.mock('../db', () => ({
  sql: vi.fn(),
}));

import { sql } from '../db';
import {
  getOverviewMetrics,
  getYieldAverages,
  getThroughputByMonth,
  getLatestCampaignYields,
  getAnalyticsData,
} from '../analytics';

const mockSql = vi.mocked(sql);

describe('analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOverviewMetrics', () => {
    it('should return overview metrics from database', async () => {
      // Mock the three queries
      mockSql
        .mockResolvedValueOnce([{ total: '5000' }]) // inbound material
        .mockResolvedValueOnce([{ total: '100' }]) // units produced
        .mockResolvedValueOnce([{ active: '3', completed: '2' }]); // campaign counts

      const result = await getOverviewMetrics();

      expect(result).toEqual({
        totalProcessedKg: 5000,
        activeCampaigns: 3,
        completedCampaigns: 2,
        totalUnitsProduced: 100,
        co2eSavedKg: 400, // 100 units × 4.0 kg CO2e/unit
      });
    });

    it('should handle zero values', async () => {
      mockSql
        .mockResolvedValueOnce([{ total: '0' }])
        .mockResolvedValueOnce([{ total: '0' }])
        .mockResolvedValueOnce([{ active: '0', completed: '0' }]);

      const result = await getOverviewMetrics();

      expect(result).toEqual({
        totalProcessedKg: 0,
        activeCampaigns: 0,
        completedCampaigns: 0,
        totalUnitsProduced: 0,
        co2eSavedKg: 0,
      });
    });
  });

  describe('getYieldAverages', () => {
    it('should return yield averages for each step', async () => {
      mockSql.mockResolvedValueOnce([
        { event_type: 'GranulationCompleted', avg_yield: '0.95' },
        { event_type: 'MetalRemovalCompleted', avg_yield: '0.92' },
        { event_type: 'PolymerPurificationCompleted', avg_yield: '0.78' },
        { event_type: 'ExtrusionCompleted', avg_yield: '0.94' },
      ]);

      const result = await getYieldAverages();

      expect(result.granulation).toBeCloseTo(0.95);
      expect(result.metalRemoval).toBeCloseTo(0.92);
      expect(result.purification).toBeCloseTo(0.78);
      expect(result.extrusion).toBeCloseTo(0.94);
      // Overall = 0.95 × 0.92 × 0.78 × 0.94 ≈ 0.641
      expect(result.overall).toBeCloseTo(0.641, 2);
    });

    it('should return nulls when no data available', async () => {
      mockSql.mockResolvedValueOnce([]);

      const result = await getYieldAverages();

      expect(result).toEqual({
        granulation: null,
        metalRemoval: null,
        purification: null,
        extrusion: null,
        overall: null,
      });
    });

    it('should handle partial data', async () => {
      mockSql.mockResolvedValueOnce([
        { event_type: 'GranulationCompleted', avg_yield: '0.95' },
        { event_type: 'MetalRemovalCompleted', avg_yield: '0.92' },
        // Missing purification and extrusion
      ]);

      const result = await getYieldAverages();

      expect(result.granulation).toBeCloseTo(0.95);
      expect(result.metalRemoval).toBeCloseTo(0.92);
      expect(result.purification).toBeNull();
      expect(result.extrusion).toBeNull();
      expect(result.overall).toBeNull(); // Can't calculate overall without all yields
    });
  });

  describe('getThroughputByMonth', () => {
    it('should return monthly throughput data', async () => {
      mockSql.mockResolvedValueOnce([
        { month: '2026-01', processed_kg: '1500' },
        { month: '2026-02', processed_kg: '2000' },
        { month: '2026-03', processed_kg: '1800' },
      ]);

      const result = await getThroughputByMonth();

      expect(result).toEqual([
        { month: '2026-01', processedKg: 1500 },
        { month: '2026-02', processedKg: 2000 },
        { month: '2026-03', processedKg: 1800 },
      ]);
    });

    it('should return empty array when no data', async () => {
      mockSql.mockResolvedValueOnce([]);

      const result = await getThroughputByMonth();

      expect(result).toEqual([]);
    });
  });

  describe('getLatestCampaignYields', () => {
    it('should return yields from most recent campaign', async () => {
      mockSql.mockResolvedValueOnce([
        { event_type: 'GranulationCompleted', yield: '0.96' },
        { event_type: 'MetalRemovalCompleted', yield: '0.93' },
        { event_type: 'PolymerPurificationCompleted', yield: '0.81' },
        { event_type: 'ExtrusionCompleted', yield: '0.95' },
      ]);

      const result = await getLatestCampaignYields();

      expect(result.granulation).toBeCloseTo(0.96);
      expect(result.metalRemoval).toBeCloseTo(0.93);
      expect(result.purification).toBeCloseTo(0.81);
      expect(result.extrusion).toBeCloseTo(0.95);
      expect(result.overall).not.toBeNull();
    });

    it('should return all nulls when no campaigns exist', async () => {
      mockSql.mockResolvedValueOnce([]);

      const result = await getLatestCampaignYields();

      expect(result).toEqual({
        granulation: null,
        metalRemoval: null,
        purification: null,
        extrusion: null,
        overall: null,
      });
    });
  });

  describe('getAnalyticsData', () => {
    it('should aggregate all analytics data', async () => {
      // Since getAnalyticsData calls three functions in parallel,
      // we need to set up mocks that work regardless of call order
      // Each function makes its own queries, so we mock based on expected queries
      
      // getOverviewMetrics makes 3 queries, getYieldAverages makes 1, getThroughputByMonth makes 1
      // Total: 5 queries, but order depends on Promise.all execution
      mockSql.mockImplementation(async () => {
        // We can't rely on order with Promise.all, so just test that
        // the function completes without error
        return [];
      });

      // Reset and use sequential mocking
      mockSql.mockReset();
      
      // Mock for getOverviewMetrics (3 queries)
      mockSql
        .mockResolvedValueOnce([{ total: '5000' }])
        .mockResolvedValueOnce([{ total: '100' }])
        .mockResolvedValueOnce([{ active: '3', completed: '2' }])
        // Mock for getYieldAverages
        .mockResolvedValueOnce([
          { event_type: 'GranulationCompleted', avg_yield: '0.95' },
        ])
        // Mock for getThroughputByMonth
        .mockResolvedValueOnce([
          { month: '2026-01', processed_kg: '1500' },
        ]);

      const result = await getAnalyticsData();

      // Just verify the shape of the response
      expect(result).toHaveProperty('overview');
      expect(result).toHaveProperty('yields');
      expect(result).toHaveProperty('throughput');
    });
  });
});
