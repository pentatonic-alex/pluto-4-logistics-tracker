import { sql } from './db';

/**
 * Analytics aggregation functions
 *
 * Queries the events table and campaign projections to compute
 * dashboard metrics, yield averages, and throughput data.
 */

export interface OverviewMetrics {
  totalProcessedKg: number;
  activeCampaigns: number;
  completedCampaigns: number;
  totalUnitsProduced: number;
  co2eSavedKg: number;
}

export interface YieldAverages {
  granulation: number | null;
  metalRemoval: number | null;
  purification: number | null;
  extrusion: number | null;
  overall: number | null;
}

export interface ThroughputDataPoint {
  month: string; // "2026-01"
  processedKg: number;
}

export interface AnalyticsData {
  overview: OverviewMetrics;
  yields: YieldAverages;
  throughput: ThroughputDataPoint[];
}

// CO2e constants (matching calculator.ts)
const CO2E_SAVINGS_PER_UNIT = 4.0; // kg CO2e saved per unit

/**
 * Get overview metrics for the analytics dashboard
 */
export async function getOverviewMetrics(): Promise<OverviewMetrics> {
  // Query total inbound material
  const [inboundResult] = await sql`
    SELECT COALESCE(SUM((event_data->>'netWeightKg')::numeric), 0) as total
    FROM events 
    WHERE event_type = 'InboundShipmentRecorded'
  `;

  // Query total units produced
  const [unitsResult] = await sql`
    SELECT COALESCE(SUM((event_data->>'actualQuantity')::numeric), 0) as total
    FROM events 
    WHERE event_type = 'ManufacturingCompleted'
  `;

  // Query campaign counts
  const [campaignResult] = await sql`
    SELECT 
      COUNT(*) FILTER (WHERE status != 'completed') as active,
      COUNT(*) FILTER (WHERE status = 'completed') as completed
    FROM campaign_projections
  `;

  const totalUnitsProduced = Number(unitsResult.total);
  const co2eSavedKg = totalUnitsProduced * CO2E_SAVINGS_PER_UNIT;

  return {
    totalProcessedKg: Number(inboundResult.total),
    activeCampaigns: Number(campaignResult.active),
    completedCampaigns: Number(campaignResult.completed),
    totalUnitsProduced,
    co2eSavedKg,
  };
}

/**
 * Get average yields for each processing step
 */
export async function getYieldAverages(): Promise<YieldAverages> {
  const rows = await sql`
    SELECT 
      event_type,
      AVG(
        (event_data->>'outputWeightKg')::numeric / 
        NULLIF((event_data->>'startingWeightKg')::numeric, 0)
      ) as avg_yield
    FROM events 
    WHERE event_type IN (
      'GranulationCompleted', 
      'MetalRemovalCompleted',
      'PolymerPurificationCompleted',
      'ExtrusionCompleted'
    )
    AND (event_data->>'startingWeightKg')::numeric > 0
    GROUP BY event_type
  `;

  // Map event types to yield keys
  const yieldMap: Record<string, number | null> = {
    GranulationCompleted: null,
    MetalRemovalCompleted: null,
    PolymerPurificationCompleted: null,
    ExtrusionCompleted: null,
  };

  for (const row of rows) {
    yieldMap[row.event_type as string] = row.avg_yield !== null 
      ? Number(row.avg_yield) 
      : null;
  }

  // Calculate overall yield (product of all step yields)
  const yields = [
    yieldMap.GranulationCompleted,
    yieldMap.MetalRemovalCompleted,
    yieldMap.PolymerPurificationCompleted,
    yieldMap.ExtrusionCompleted,
  ];

  const hasAllYields = yields.every((y) => y !== null);
  const overall = hasAllYields
    ? yields.reduce((acc, y) => acc * (y as number), 1)
    : null;

  return {
    granulation: yieldMap.GranulationCompleted,
    metalRemoval: yieldMap.MetalRemovalCompleted,
    purification: yieldMap.PolymerPurificationCompleted,
    extrusion: yieldMap.ExtrusionCompleted,
    overall,
  };
}

/**
 * Get monthly throughput data for the throughput chart
 */
export async function getThroughputByMonth(): Promise<ThroughputDataPoint[]> {
  const rows = await sql`
    SELECT 
      TO_CHAR(created_at, 'YYYY-MM') as month,
      SUM((event_data->>'netWeightKg')::numeric) as processed_kg
    FROM events 
    WHERE event_type = 'InboundShipmentRecorded'
    GROUP BY TO_CHAR(created_at, 'YYYY-MM')
    ORDER BY month
  `;

  return rows.map((row) => ({
    month: row.month as string,
    processedKg: Number(row.processed_kg),
  }));
}

/**
 * Get yields from the most recent campaign (for calculator defaults)
 * Returns null values if no yields are available
 */
export async function getLatestCampaignYields(): Promise<YieldAverages> {
  // Find the most recent campaign with yield data
  const rows = await sql`
    WITH latest_campaign AS (
      SELECT stream_id
      FROM events
      WHERE event_type IN (
        'GranulationCompleted',
        'MetalRemovalCompleted',
        'PolymerPurificationCompleted',
        'ExtrusionCompleted'
      )
      ORDER BY created_at DESC
      LIMIT 1
    )
    SELECT 
      e.event_type,
      (e.event_data->>'outputWeightKg')::numeric / 
      NULLIF((e.event_data->>'startingWeightKg')::numeric, 0) as yield
    FROM events e
    WHERE e.stream_id = (SELECT stream_id FROM latest_campaign)
      AND e.event_type IN (
        'GranulationCompleted',
        'MetalRemovalCompleted',
        'PolymerPurificationCompleted',
        'ExtrusionCompleted'
      )
  `;

  // Initialize with nulls
  const yields: YieldAverages = {
    granulation: null,
    metalRemoval: null,
    purification: null,
    extrusion: null,
    overall: null,
  };

  // Map results
  for (const row of rows) {
    const yieldValue = row.yield !== null ? Number(row.yield) : null;
    switch (row.event_type) {
      case 'GranulationCompleted':
        yields.granulation = yieldValue;
        break;
      case 'MetalRemovalCompleted':
        yields.metalRemoval = yieldValue;
        break;
      case 'PolymerPurificationCompleted':
        yields.purification = yieldValue;
        break;
      case 'ExtrusionCompleted':
        yields.extrusion = yieldValue;
        break;
    }
  }

  // Calculate overall if all yields present
  const allYields = [
    yields.granulation,
    yields.metalRemoval,
    yields.purification,
    yields.extrusion,
  ];

  if (allYields.every((y) => y !== null)) {
    yields.overall = allYields.reduce((acc, y) => acc * (y as number), 1);
  }

  return yields;
}

/**
 * Get all analytics data in one call
 */
export async function getAnalyticsData(): Promise<AnalyticsData> {
  const [overview, yields, throughput] = await Promise.all([
    getOverviewMetrics(),
    getYieldAverages(),
    getThroughputByMonth(),
  ]);

  return { overview, yields, throughput };
}
