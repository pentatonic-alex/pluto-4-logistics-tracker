---
date: 2026-02-02
topic: feature-ideas
---

# Feature Ideas: Analytics & Material Calculator

Ideas for future features discussed during planning session.

## 1. General Analytics View

A dedicated analytics page aggregating data from events to provide operational insights.

### Key Metrics

| Metric | Source | Description |
|--------|--------|-------------|
| Total Material Processed | Sum of inbound shipments | Cumulative kg through the system |
| Overall Yield | Final output ÷ initial input | End-to-end efficiency (~65-75%) |
| Active Campaigns | Campaigns not completed | Current workload |
| Avg Campaign Duration | Created → Completed | Typical cycle time |
| Material at Each Stage | Sum of currentWeightKg by status | Pipeline distribution |

### Visualizations

1. **Yield Waterfall Chart** - Shows where material is lost at each processing step:
   ```
   Inbound: 1000kg
     ↓ -5% (Granulation loss)
   950kg
     ↓ -3% (Metal removal)
   920kg
     ↓ -8% (Purification loss)
   850kg
     ↓ -2% (Extrusion loss)
   830kg final
   ```

2. **Throughput Over Time** - Line chart of kg processed per month

3. **Step Duration Distribution** - How long campaigns spend at each stage (identify bottlenecks)

4. **Yield by Campaign** - Table/chart comparing yields across campaigns to spot outliers

### Data Sources

All data already captured in events:
- `InboundShipmentPayload.netWeightKg` → starting weight
- `ProcessingStepPayload.startingWeightKg` / `outputWeightKg` → yields per step
- `ManufacturingCompletedPayload.actualQuantity` → final units produced
- Event timestamps → duration calculations

---

## 2. Material Calculator / Estimator

A planning tool that calculates required inbound material based on desired output quantity.

### User Flow

User inputs:
- **Target output**: Number of finished units (e.g., 10,000 storage boxes)
- **Product type**: Dropdown to select product (affects material per unit)

System displays:
- Adjustable yield assumptions per processing step
- Calculated required inbound material (kg)
- Step-by-step breakdown

### UI Mockup

```
┌─────────────────────────────────────────────────────────┐
│  Material Calculator                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Target Output                                          │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │ 10,000           │  │ Storage Boxes ▾  │            │
│  └──────────────────┘  └──────────────────┘            │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  Yield Assumptions (adjust as needed)                   │
│                                                         │
│  Material per unit:     0.45 kg    [━━━━━━━●━━]        │
│  Granulation yield:     95%        [━━━━━━━━●━] ← avg  │
│  Metal removal yield:   97%        [━━━━━━━━━●]        │
│  Purification yield:    92%        [━━━━━━●━━━]        │
│  Extrusion yield:       98%        [━━━━━━━━━●]        │
│  Contamination buffer:  5%         [━━●━━━━━━━]        │
│                                                         │
│  [Use Latest Averages]  [Reset to Defaults]            │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  Required Inbound Material                              │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │         5,847 kg                                │   │
│  │         (Net weight from LEGO warehouse)        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Breakdown:                                            │
│  • 10,000 boxes × 0.45 kg = 4,500 kg finished         │
│  • After extrusion (98%): 4,592 kg                    │
│  • After purification (92%): 4,991 kg                 │
│  • After metal removal (97%): 5,145 kg                │
│  • After granulation (95%): 5,416 kg                  │
│  • + 5% contamination buffer: 5,687 kg                │
│  • + gross/net variance (~3%): 5,847 kg               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Calculation Logic

```typescript
interface YieldAssumptions {
  materialPerUnit: number;    // kg per finished unit
  granulation: number;        // e.g., 0.95
  metalRemoval: number;       // e.g., 0.97
  purification: number;       // e.g., 0.92
  extrusion: number;          // e.g., 0.98
  contaminationBuffer: number; // e.g., 0.05
}

function calculateRequiredInput(
  targetUnits: number,
  yields: YieldAssumptions
): { total: number; breakdown: StepBreakdown[] } {
  const finishedMaterial = targetUnits * yields.materialPerUnit;
  
  // Work backwards through the chain
  const afterExtrusion = finishedMaterial / yields.extrusion;
  const afterPurification = afterExtrusion / yields.purification;
  const afterMetalRemoval = afterPurification / yields.metalRemoval;
  const afterGranulation = afterMetalRemoval / yields.granulation;
  
  // Add contamination buffer
  const withBuffer = afterGranulation * (1 + yields.contaminationBuffer);
  
  return {
    total: Math.ceil(withBuffer),
    breakdown: [
      { step: 'Finished material', kg: finishedMaterial },
      { step: 'After extrusion', kg: afterExtrusion },
      { step: 'After purification', kg: afterPurification },
      { step: 'After metal removal', kg: afterMetalRemoval },
      { step: 'After granulation', kg: afterGranulation },
      { step: 'With contamination buffer', kg: withBuffer },
    ]
  };
}
```

### Smart Defaults

"Use Latest Averages" button queries historical events:

```sql
-- Average yield per step from recent campaigns
SELECT 
  event_type,
  AVG((event_data->>'outputWeightKg')::numeric / 
      (event_data->>'startingWeightKg')::numeric) as avg_yield
FROM events 
WHERE event_type IN (
  'GranulationCompleted', 
  'MetalRemovalCompleted',
  'PolymerPurificationCompleted',
  'ExtrusionCompleted'
)
AND created_at > NOW() - INTERVAL '6 months'
GROUP BY event_type;
```

### Reverse Mode (Bonus)

Also support: "I have X kg inbound, how many units can I make?"

Just invert the calculation by multiplying through yields instead of dividing.

---

## Implementation Notes

- Both features are primarily **read-only views** aggregating existing event data
- Analytics requires querying events table with aggregations
- Calculator could work with hardcoded defaults + manual overrides (no DB required for MVP)
- Consider using a charting library like Recharts or Chart.js for visualizations
- Both would be new routes under `(authenticated)/`:
  - `/analytics` - Analytics dashboard
  - `/calculator` - Material calculator
