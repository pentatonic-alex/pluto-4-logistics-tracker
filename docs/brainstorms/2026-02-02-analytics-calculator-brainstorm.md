---
date: 2026-02-02
topic: analytics-calculator
ideas: ../ideas/2026-02-02-analytics-calculator-ideas.md
---

# Analytics Dashboard & Material Calculator

## What We're Building

Two new read-only features for the LEGO REPLAY Logistics Tracker:

1. **Analytics Dashboard** (`/analytics`) - Aggregated metrics and visualizations showing operational performance across campaigns
2. **Material Calculator** (`/calculator`) - Planning tool to estimate required inbound material from desired output units (and vice versa)

Both features consume existing event data - no new TES events required.

## Why These Features

**Analytics Dashboard:**
- Provides visibility into overall supply chain efficiency
- Identifies bottlenecks (which steps have lowest yields)
- Tracks throughput trends over time
- Quantifies environmental impact (CO2e savings)

**Material Calculator:**
- Enables proactive planning before campaigns start
- Answers "How much material do I need to order?"
- Uses historical yields or adjustable assumptions
- Supports both forward (units → kg) and reverse (kg → units) calculations

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Charting library | Recharts | React-native, popular in Next.js ecosystem, good docs |
| Calculator architecture | Hybrid (client + lazy API) | Fast defaults with optional "Use Latest" from DB |
| Default yield source | Most recent campaign yields | Real data when available, fallbacks otherwise |
| CO2e calculation | 4.0 kg CO2e per unit | Recycled (0.8) vs Virgin ABS (4.8) difference |
| CO2e equivalents | Coal only | 4.5 lbs coal prevented per unit - tangible metric |
| Assumptions display | Tooltip | Clean UI, details on demand |

## Fallback Yield Values

When no historical data exists:

| Step | Fallback Yield |
|------|----------------|
| Granulation | 95% |
| Metal Removal | 95% |
| Polymer Purification | 80% |
| Extrusion | 95% |
| Contamination Buffer | 5% (adjustable) |

## Product Specifications

| Product | Material per Unit |
|---------|-------------------|
| Storage Box | 3 kg |
| Custom | User-defined |

## CO2e Savings Assumptions

The environmental impact metric is based on lifecycle analysis comparing recycled vs virgin ABS:

- **Recycled ABS box:** 0.8 kg CO2e per unit
- **Virgin ABS box:** 4.8 kg CO2e per unit
- **Savings:** 4.0 kg CO2e per unit
- **Coal equivalent:** 4.5 lbs coal prevented per unit

This appears in a tooltip when users hover on the CO2e metric.

## Analytics Dashboard Scope

### P1 (MVP)
- **Metric Cards:** Total material processed, active campaigns, average overall yield, CO2e saved
- **Yield Waterfall Chart:** Shows material loss at each processing step
- **Throughput Over Time:** Line chart of kg processed per month

### P2 (Future)
- Step duration distribution (bottleneck identification)
- Yield by campaign comparison table
- Date range filtering

## Calculator Scope

### P1 (MVP)
- **Forward Mode:** Target units → Required inbound kg
- **Reverse Mode:** Available kg → Possible units
- **Yield Sliders:** Adjustable assumptions for each processing step
- **Contamination Buffer:** Adjustable slider
- **Product Dropdown:** Storage Box (3 kg) + Custom
- **CO2e Projection:** Estimated environmental savings
- **Step Breakdown:** Shows calculation at each stage

### P2 (Future)
- Save/load scenarios
- Multiple product types in single calculation
- Export calculation to PDF

## Data Sources

All data comes from existing events table:

| Metric | Event Type | Field |
|--------|------------|-------|
| Total inbound | `InboundShipmentRecorded` | `netWeightKg` |
| Granulation yield | `GranulationCompleted` | `outputWeightKg / startingWeightKg` |
| Metal removal yield | `MetalRemovalCompleted` | `outputWeightKg / startingWeightKg` |
| Purification yield | `PolymerPurificationCompleted` | `outputWeightKg / startingWeightKg` |
| Extrusion yield | `ExtrusionCompleted` | `outputWeightKg / startingWeightKg` |
| Units produced | `ManufacturingCompleted` | `actualQuantity` |

## Open Questions

None - requirements clarified during brainstorming session.

## Next Steps

→ Create spec documents at `specs/003-analytics-calculator/`
→ Run `/speckit.tasks` to generate implementation tasks
→ Import tasks to Beads
