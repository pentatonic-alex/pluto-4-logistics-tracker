# Analytics & Calculator - Technical Plan

## Overview

Add Analytics Dashboard and Material Calculator features - read-only views aggregating existing event data.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Charting**: Recharts
- **Database**: Neon Postgres via existing `sql` helper
- **Styling**: Tailwind CSS (existing)

## Architecture

```
┌─────────────────────────┐     ┌─────────────────────────┐
│   /analytics            │     │   /calculator           │
│   - MetricCards         │     │   - CalculatorForm      │
│   - YieldWaterfall      │     │   - YieldSliders        │
│   - ThroughputChart     │     │   - BreakdownDisplay    │
└───────────┬─────────────┘     └───────────┬─────────────┘
            │                               │
            ▼                               │
┌─────────────────────────┐                 │
│  GET /api/analytics     │◄────────────────┘
│  - overview metrics     │     (lazy fetch for "Use Latest")
│  - yield averages       │
│  - throughput data      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  src/lib/analytics.ts   │
│  - aggregation queries  │
│  - yield calculations   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  events table           │
│  campaign_projections   │
└─────────────────────────┘
```

## File Structure

```
src/
├── app/
│   ├── (authenticated)/
│   │   ├── analytics/
│   │   │   ├── page.tsx           # Analytics dashboard
│   │   │   └── loading.tsx        # Loading skeleton
│   │   └── calculator/
│   │       ├── page.tsx           # Material calculator
│   │       └── loading.tsx        # Loading skeleton
│   └── api/
│       └── analytics/
│           └── route.ts           # Aggregation endpoint
├── components/
│   ├── analytics/
│   │   ├── MetricCard.tsx         # Single metric with optional tooltip
│   │   ├── YieldWaterfall.tsx     # Recharts waterfall chart
│   │   ├── ThroughputChart.tsx    # Recharts line chart
│   │   └── CO2eMetric.tsx         # CO2e savings with coal equivalent
│   └── calculator/
│       ├── CalculatorForm.tsx     # Main form with mode toggle
│       ├── YieldSlider.tsx        # Individual yield input slider
│       ├── ProductSelector.tsx    # Product dropdown
│       └── BreakdownDisplay.tsx   # Step-by-step results
└── lib/
    ├── analytics.ts               # Aggregation query functions
    └── calculator.ts              # Calculation logic + constants
```

## API Endpoints

### GET /api/analytics

Returns aggregated metrics for the dashboard.

**Response:**
```typescript
interface AnalyticsResponse {
  overview: {
    totalProcessedKg: number;
    activeCampaigns: number;
    completedCampaigns: number;
    totalUnitsProduced: number;
    co2eSavedKg: number;
  };
  yields: {
    granulation: number | null;      // Average yield as decimal (0.95)
    metalRemoval: number | null;
    purification: number | null;
    extrusion: number | null;
    overall: number | null;          // End-to-end yield
  };
  throughput: Array<{
    month: string;                   // "2026-01"
    processedKg: number;
  }>;
}
```

## Database Queries

### Overview Metrics

```sql
-- Total inbound material
SELECT COALESCE(SUM((event_data->>'netWeightKg')::numeric), 0) as total
FROM events 
WHERE event_type = 'InboundShipmentRecorded';

-- Total units produced
SELECT COALESCE(SUM((event_data->>'actualQuantity')::numeric), 0) as total
FROM events 
WHERE event_type = 'ManufacturingCompleted';

-- Active/completed campaigns
SELECT 
  COUNT(*) FILTER (WHERE status != 'completed') as active,
  COUNT(*) FILTER (WHERE status = 'completed') as completed
FROM campaign_projections;
```

### Yield Averages

```sql
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
GROUP BY event_type;
```

### Throughput by Month

```sql
SELECT 
  TO_CHAR(created_at, 'YYYY-MM') as month,
  SUM((event_data->>'netWeightKg')::numeric) as processed_kg
FROM events 
WHERE event_type = 'InboundShipmentRecorded'
GROUP BY TO_CHAR(created_at, 'YYYY-MM')
ORDER BY month;
```

## Calculator Logic

### Constants (src/lib/calculator.ts)

```typescript
export const CALCULATOR_DEFAULTS = {
  // Fallback yields when no historical data
  yields: {
    granulation: 0.95,
    metalRemoval: 0.95,
    purification: 0.80,
    extrusion: 0.95,
  },
  contaminationBuffer: 0.05,
  
  // Product presets
  products: {
    storageBox: { name: 'Storage Box', materialKg: 3.0 },
  },
  
  // CO2e assumptions
  co2e: {
    recycledPerUnit: 0.8,    // kg CO2e
    virginPerUnit: 4.8,      // kg CO2e
    savingsPerUnit: 4.0,     // kg CO2e (difference)
    coalLbsPerUnit: 4.5,     // lbs coal prevented
  },
};
```

### Forward Calculation (Units → kg)

```typescript
function calculateRequiredInput(
  targetUnits: number,
  materialPerUnit: number,
  yields: YieldAssumptions
): CalculationResult {
  const finishedMaterial = targetUnits * materialPerUnit;
  
  // Work backwards through the chain
  const afterExtrusion = finishedMaterial / yields.extrusion;
  const afterPurification = afterExtrusion / yields.purification;
  const afterMetalRemoval = afterPurification / yields.metalRemoval;
  const afterGranulation = afterMetalRemoval / yields.granulation;
  
  // Add contamination buffer
  const withBuffer = afterGranulation * (1 + yields.contaminationBuffer);
  
  // CO2e savings
  const co2eSaved = targetUnits * CALCULATOR_DEFAULTS.co2e.savingsPerUnit;
  const coalPrevented = targetUnits * CALCULATOR_DEFAULTS.co2e.coalLbsPerUnit;
  
  return {
    requiredInputKg: Math.ceil(withBuffer),
    co2eSavedKg: co2eSaved,
    coalPreventedLbs: coalPrevented,
    breakdown: [
      { step: 'Finished material', kg: finishedMaterial },
      { step: 'Before extrusion', kg: afterExtrusion },
      { step: 'Before purification', kg: afterPurification },
      { step: 'Before metal removal', kg: afterMetalRemoval },
      { step: 'Before granulation', kg: afterGranulation },
      { step: 'With buffer', kg: withBuffer },
    ],
  };
}
```

### Reverse Calculation (kg → Units)

```typescript
function calculatePossibleOutput(
  availableKg: number,
  materialPerUnit: number,
  yields: YieldAssumptions
): CalculationResult {
  // Remove buffer
  const afterBuffer = availableKg / (1 + yields.contaminationBuffer);
  
  // Work forward through the chain
  const afterGranulation = afterBuffer * yields.granulation;
  const afterMetalRemoval = afterGranulation * yields.metalRemoval;
  const afterPurification = afterMetalRemoval * yields.purification;
  const afterExtrusion = afterPurification * yields.extrusion;
  
  const possibleUnits = Math.floor(afterExtrusion / materialPerUnit);
  
  // CO2e savings
  const co2eSaved = possibleUnits * CALCULATOR_DEFAULTS.co2e.savingsPerUnit;
  const coalPrevented = possibleUnits * CALCULATOR_DEFAULTS.co2e.coalLbsPerUnit;
  
  return {
    possibleUnits,
    co2eSavedKg: co2eSaved,
    coalPreventedLbs: coalPrevented,
    breakdown: [
      { step: 'Available input', kg: availableKg },
      { step: 'After buffer adjustment', kg: afterBuffer },
      { step: 'After granulation', kg: afterGranulation },
      { step: 'After metal removal', kg: afterMetalRemoval },
      { step: 'After purification', kg: afterPurification },
      { step: 'After extrusion', kg: afterExtrusion },
    ],
  };
}
```

## Navigation Update

Add to `src/components/Navigation.tsx`:

```typescript
const navLinks = [
  { href: '/', label: 'Dashboard' },
  { href: '/analytics', label: 'Analytics' },    // NEW
  { href: '/calculator', label: 'Calculator' },  // NEW
  { href: '/archive', label: 'Archive' },
  { href: '/import', label: 'Import' },
  { href: '/campaigns/new', label: 'New Campaign' },
];
```

## Dependencies

New dependency to install:

```bash
npm install recharts
```

## Testing Strategy

1. **Unit tests** for `calculator.ts` functions
2. **Unit tests** for `analytics.ts` aggregation logic
3. **Component tests** for chart components (snapshot + interaction)
4. **E2E tests** for page navigation and basic functionality

## Performance Considerations

- Analytics queries run on page load (acceptable for low volume)
- Calculator runs client-side for instant feedback
- "Use Latest Averages" is a lazy fetch, not blocking initial render
- No caching for MVP (1-3 active campaigns, simple queries)
