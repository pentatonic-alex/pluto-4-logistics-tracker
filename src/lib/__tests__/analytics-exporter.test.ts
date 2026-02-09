import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import {
  buildAnalyticsWorkbook,
  workbookToBuffer,
  generateExportFilename,
} from '../excel-exporter';
import type {
  AnalyticsData,
  OverviewMetrics,
  YieldAverages,
  ThroughputDataPoint,
} from '../analytics';

// Test data factory functions
function createMockOverviewMetrics(
  overrides: Partial<OverviewMetrics> = {}
): OverviewMetrics {
  return {
    totalProcessedKg: 5000,
    activeCampaigns: 3,
    completedCampaigns: 2,
    totalUnitsProduced: 100,
    co2eSavedKg: 400,
    ...overrides,
  };
}

function createMockYieldAverages(
  overrides: Partial<YieldAverages> = {}
): YieldAverages {
  return {
    granulation: 0.95,
    metalRemoval: 0.92,
    purification: 0.78,
    extrusion: 0.94,
    overall: 0.641,
    ...overrides,
  };
}

function createMockThroughputData(
  overrides: Partial<ThroughputDataPoint>[] = []
): ThroughputDataPoint[] {
  const defaultData: ThroughputDataPoint[] = [
    { month: '2026-01', processedKg: 1500 },
    { month: '2026-02', processedKg: 2000 },
    { month: '2026-03', processedKg: 1800 },
  ];

  if (overrides.length > 0) {
    return overrides.map((override, index) => ({
      ...defaultData[index],
      ...override,
    }));
  }

  return defaultData;
}

function createMockAnalyticsData(
  overrides: Partial<AnalyticsData> = {}
): AnalyticsData {
  return {
    overview: createMockOverviewMetrics(),
    yields: createMockYieldAverages(),
    throughput: createMockThroughputData(),
    ...overrides,
  };
}

describe('analytics-exporter', () => {
  describe('buildAnalyticsWorkbook', () => {
    it('creates a workbook with all 3 sheets', () => {
      const analyticsData = createMockAnalyticsData();

      const workbook = buildAnalyticsWorkbook(analyticsData);

      expect(workbook.SheetNames).toHaveLength(3);
      expect(workbook.SheetNames).toContain('Overview');
      expect(workbook.SheetNames).toContain('Yields');
      expect(workbook.SheetNames).toContain('Throughput');
    });

    it('creates valid workbook with empty throughput data', () => {
      const analyticsData = createMockAnalyticsData({
        throughput: [],
      });

      const workbook = buildAnalyticsWorkbook(analyticsData);

      expect(workbook.SheetNames).toHaveLength(3);
      // Each sheet should have at least the header row
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        expect(data.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('creates valid workbook with zero values', () => {
      const analyticsData = createMockAnalyticsData({
        overview: createMockOverviewMetrics({
          totalProcessedKg: 0,
          activeCampaigns: 0,
          completedCampaigns: 0,
          totalUnitsProduced: 0,
          co2eSavedKg: 0,
        }),
      });

      const workbook = buildAnalyticsWorkbook(analyticsData);

      expect(workbook.SheetNames).toHaveLength(3);
      const sheet = workbook.Sheets['Overview'];
      const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

      expect(data[1][1]).toBe(0); // Total Processed (kg)
      expect(data[2][1]).toBe(0); // Active Campaigns
    });
  });

  describe('Overview sheet', () => {
    it('exports overview metrics correctly', () => {
      const analyticsData = createMockAnalyticsData({
        overview: createMockOverviewMetrics({
          totalProcessedKg: 5000,
          activeCampaigns: 3,
          completedCampaigns: 2,
          totalUnitsProduced: 100,
          co2eSavedKg: 400,
        }),
      });

      const workbook = buildAnalyticsWorkbook(analyticsData);
      const sheet = workbook.Sheets['Overview'];
      const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

      // Header + 5 metric rows
      expect(data.length).toBe(6);
      expect(data[0]).toEqual(['Metric', 'Value']);
      expect(data[1]).toEqual(['Total Processed (kg)', 5000]);
      expect(data[2]).toEqual(['Active Campaigns', 3]);
      expect(data[3]).toEqual(['Completed Campaigns', 2]);
      expect(data[4]).toEqual(['Total Units Produced', 100]);
      expect(data[5]).toEqual(['CO2e Saved (kg)', 400]);
    });

    it('handles large values correctly', () => {
      const analyticsData = createMockAnalyticsData({
        overview: createMockOverviewMetrics({
          totalProcessedKg: 1500000,
          totalUnitsProduced: 50000,
          co2eSavedKg: 200000,
        }),
      });

      const workbook = buildAnalyticsWorkbook(analyticsData);
      const sheet = workbook.Sheets['Overview'];
      const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

      expect(data[1][1]).toBe(1500000);
      expect(data[4][1]).toBe(50000);
      expect(data[5][1]).toBe(200000);
    });
  });

  describe('Yields sheet', () => {
    it('exports yield averages correctly', () => {
      const analyticsData = createMockAnalyticsData({
        yields: createMockYieldAverages({
          granulation: 0.95,
          metalRemoval: 0.92,
          purification: 0.78,
          extrusion: 0.94,
          overall: 0.641,
        }),
      });

      const workbook = buildAnalyticsWorkbook(analyticsData);
      const sheet = workbook.Sheets['Yields'];
      const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

      // Header + 5 yield rows
      expect(data.length).toBe(6);
      expect(data[0]).toEqual(['Step', 'Yield (%)']);
      expect(data[1]).toEqual(['Granulation', '95.0']);
      expect(data[2]).toEqual(['Metal Removal', '92.0']);
      expect(data[3]).toEqual(['Purification', '78.0']);
      expect(data[4]).toEqual(['Extrusion', '94.0']);
      expect(data[5]).toEqual(['Overall', '64.1']);
    });

    it('handles null yields correctly', () => {
      const analyticsData = createMockAnalyticsData({
        yields: createMockYieldAverages({
          granulation: null,
          metalRemoval: null,
          purification: null,
          extrusion: null,
          overall: null,
        }),
      });

      const workbook = buildAnalyticsWorkbook(analyticsData);
      const sheet = workbook.Sheets['Yields'];
      const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

      expect(data[1]).toEqual(['Granulation', 'N/A']);
      expect(data[2]).toEqual(['Metal Removal', 'N/A']);
      expect(data[3]).toEqual(['Purification', 'N/A']);
      expect(data[4]).toEqual(['Extrusion', 'N/A']);
      expect(data[5]).toEqual(['Overall', 'N/A']);
    });

    it('handles partial yield data', () => {
      const analyticsData = createMockAnalyticsData({
        yields: createMockYieldAverages({
          granulation: 0.95,
          metalRemoval: 0.92,
          purification: null,
          extrusion: null,
          overall: null,
        }),
      });

      const workbook = buildAnalyticsWorkbook(analyticsData);
      const sheet = workbook.Sheets['Yields'];
      const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

      expect(data[1]).toEqual(['Granulation', '95.0']);
      expect(data[2]).toEqual(['Metal Removal', '92.0']);
      expect(data[3]).toEqual(['Purification', 'N/A']);
      expect(data[4]).toEqual(['Extrusion', 'N/A']);
      expect(data[5]).toEqual(['Overall', 'N/A']);
    });

    it('formats yield percentages with one decimal place', () => {
      const analyticsData = createMockAnalyticsData({
        yields: createMockYieldAverages({
          granulation: 0.955,
          metalRemoval: 0.924,
          purification: 0.786,
          extrusion: 0.941,
          overall: 0.6789,
        }),
      });

      const workbook = buildAnalyticsWorkbook(analyticsData);
      const sheet = workbook.Sheets['Yields'];
      const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

      expect(data[1][1]).toBe('95.5');
      expect(data[2][1]).toBe('92.4');
      expect(data[3][1]).toBe('78.6');
      expect(data[4][1]).toBe('94.1');
      expect(data[5][1]).toBe('67.9');
    });
  });

  describe('Throughput sheet', () => {
    it('exports throughput data correctly', () => {
      const analyticsData = createMockAnalyticsData({
        throughput: [
          { month: '2026-01', processedKg: 1500 },
          { month: '2026-02', processedKg: 2000 },
          { month: '2026-03', processedKg: 1800 },
        ],
      });

      const workbook = buildAnalyticsWorkbook(analyticsData);
      const sheet = workbook.Sheets['Throughput'];
      const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

      // Header + 3 data rows
      expect(data.length).toBe(4);
      expect(data[0]).toEqual(['Month', 'Processed (kg)']);
      expect(data[1]).toEqual(['2026-01', 1500]);
      expect(data[2]).toEqual(['2026-02', 2000]);
      expect(data[3]).toEqual(['2026-03', 1800]);
    });

    it('returns only header when no throughput data', () => {
      const analyticsData = createMockAnalyticsData({
        throughput: [],
      });

      const workbook = buildAnalyticsWorkbook(analyticsData);
      const sheet = workbook.Sheets['Throughput'];
      const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

      expect(data.length).toBe(1); // Header only
      expect(data[0]).toEqual(['Month', 'Processed (kg)']);
    });

    it('handles single month of data', () => {
      const analyticsData = createMockAnalyticsData({
        throughput: [{ month: '2026-01', processedKg: 1500 }],
      });

      const workbook = buildAnalyticsWorkbook(analyticsData);
      const sheet = workbook.Sheets['Throughput'];
      const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

      expect(data.length).toBe(2); // Header + 1 data row
      expect(data[1]).toEqual(['2026-01', 1500]);
    });

    it('handles many months of data', () => {
      const manyMonths: ThroughputDataPoint[] = [];
      for (let i = 1; i <= 12; i++) {
        manyMonths.push({
          month: `2026-${String(i).padStart(2, '0')}`,
          processedKg: 1000 + i * 100,
        });
      }

      const analyticsData = createMockAnalyticsData({
        throughput: manyMonths,
      });

      const workbook = buildAnalyticsWorkbook(analyticsData);
      const sheet = workbook.Sheets['Throughput'];
      const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

      expect(data.length).toBe(13); // Header + 12 months
      expect(data[1]).toEqual(['2026-01', 1100]);
      expect(data[12]).toEqual(['2026-12', 2200]);
    });
  });

  describe('workbookToBuffer', () => {
    it('converts analytics workbook to Buffer', () => {
      const analyticsData = createMockAnalyticsData();
      const workbook = buildAnalyticsWorkbook(analyticsData);
      const buffer = workbookToBuffer(workbook);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('produces valid xlsx buffer that can be re-parsed', () => {
      const analyticsData = createMockAnalyticsData();
      const workbook = buildAnalyticsWorkbook(analyticsData);
      const buffer = workbookToBuffer(workbook);

      // Verify we can re-read the buffer
      const parsedWorkbook = XLSX.read(buffer, { type: 'buffer' });
      expect(parsedWorkbook.SheetNames).toHaveLength(3);
      expect(parsedWorkbook.SheetNames).toContain('Overview');
      expect(parsedWorkbook.SheetNames).toContain('Yields');
      expect(parsedWorkbook.SheetNames).toContain('Throughput');
    });
  });

  describe('generateExportFilename', () => {
    it('generates filename for analytics export without campaign code', () => {
      const filename = generateExportFilename(undefined, new Date('2026-02-09'));
      expect(filename).toBe('campaigns-export-2026-02-09.xlsx');
    });

    it('generates filename with campaign code if provided', () => {
      const filename = generateExportFilename(
        'REPLAY-2026-001',
        new Date('2026-02-09')
      );
      expect(filename).toBe('campaign-REPLAY-2026-001-2026-02-09.xlsx');
    });

    it('uses current date when not specified', () => {
      const filename = generateExportFilename();
      expect(filename).toMatch(/^campaigns-export-\d{4}-\d{2}-\d{2}\.xlsx$/);
    });
  });

  describe('Sheet structure validation', () => {
    it('all sheets have correct header structure', () => {
      const analyticsData = createMockAnalyticsData();
      const workbook = buildAnalyticsWorkbook(analyticsData);

      // Overview sheet
      const overviewSheet = workbook.Sheets['Overview'];
      const overviewData = XLSX.utils.sheet_to_json<string[]>(overviewSheet, {
        header: 1,
      });
      expect(overviewData[0]).toEqual(['Metric', 'Value']);

      // Yields sheet
      const yieldsSheet = workbook.Sheets['Yields'];
      const yieldsData = XLSX.utils.sheet_to_json<string[]>(yieldsSheet, {
        header: 1,
      });
      expect(yieldsData[0]).toEqual(['Step', 'Yield (%)']);

      // Throughput sheet
      const throughputSheet = workbook.Sheets['Throughput'];
      const throughputData = XLSX.utils.sheet_to_json<string[]>(
        throughputSheet,
        {
          header: 1,
        }
      );
      expect(throughputData[0]).toEqual(['Month', 'Processed (kg)']);
    });

    it('sheets maintain data integrity after round-trip conversion', () => {
      const originalData = createMockAnalyticsData({
        overview: createMockOverviewMetrics({
          totalProcessedKg: 5000,
          activeCampaigns: 3,
        }),
        yields: createMockYieldAverages({
          granulation: 0.95,
          metalRemoval: 0.92,
        }),
        throughput: [
          { month: '2026-01', processedKg: 1500 },
          { month: '2026-02', processedKg: 2000 },
        ],
      });

      const workbook = buildAnalyticsWorkbook(originalData);
      const buffer = workbookToBuffer(workbook);
      const parsedWorkbook = XLSX.read(buffer, { type: 'buffer' });

      // Verify Overview data
      const overviewSheet = parsedWorkbook.Sheets['Overview'];
      const overviewData = XLSX.utils.sheet_to_json<unknown[]>(overviewSheet, {
        header: 1,
      });
      expect(overviewData[1]).toEqual(['Total Processed (kg)', 5000]);
      expect(overviewData[2]).toEqual(['Active Campaigns', 3]);

      // Verify Yields data
      const yieldsSheet = parsedWorkbook.Sheets['Yields'];
      const yieldsData = XLSX.utils.sheet_to_json<unknown[]>(yieldsSheet, {
        header: 1,
      });
      expect(yieldsData[1]).toEqual(['Granulation', '95.0']);
      expect(yieldsData[2]).toEqual(['Metal Removal', '92.0']);

      // Verify Throughput data
      const throughputSheet = parsedWorkbook.Sheets['Throughput'];
      const throughputData = XLSX.utils.sheet_to_json<unknown[]>(
        throughputSheet,
        {
          header: 1,
        }
      );
      expect(throughputData[1]).toEqual(['2026-01', 1500]);
      expect(throughputData[2]).toEqual(['2026-02', 2000]);
    });
  });
});
