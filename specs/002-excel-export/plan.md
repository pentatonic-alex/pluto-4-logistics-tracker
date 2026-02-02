# Excel Export - Technical Plan

## Overview

Add Excel export functionality for campaigns that mirrors the import format, enabling round-trip editing.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Excel Library**: xlsx (already installed, v0.18.5)
- **Database**: Neon Postgres via existing `sql` helper

## Architecture

```
┌─────────────────────┐     ┌──────────────────────┐
│  Campaign Detail    │     │      Dashboard       │
│  [Export Button]    │     │  [Export All Button] │
└─────────┬───────────┘     └──────────┬───────────┘
          │                            │
          ▼                            ▼
┌─────────────────────┐     ┌──────────────────────┐
│ GET /api/export/[id]│     │   GET /api/export    │
└─────────┬───────────┘     └──────────┬───────────┘
          │                            │
          └──────────┬─────────────────┘
                     ▼
          ┌──────────────────────┐
          │  excel-exporter.ts   │
          │  - buildWorkbook()   │
          │  - buildSheet()      │
          └──────────┬───────────┘
                     ▼
          ┌──────────────────────┐
          │   events.ts          │
          │   projections.ts     │
          └──────────────────────┘
```

## File Structure

```
src/
├── lib/
│   └── excel-exporter.ts       # NEW: Export logic (inverse of excel-parser.ts)
├── app/
│   ├── api/
│   │   └── export/
│   │       ├── [id]/
│   │       │   └── route.ts    # NEW: Single campaign export
│   │       └── route.ts        # NEW: Bulk export
│   └── (authenticated)/
│       ├── campaigns/
│       │   └── [id]/
│       │       └── page.tsx    # MODIFY: Add export button
│       └── page.tsx            # MODIFY: Add bulk export button
```

## Key Implementation Details

### excel-exporter.ts

Inverse of `excel-parser.ts`. Maps event data back to Excel columns:

```typescript
// Core function signature
export function buildCampaignWorkbook(
  campaigns: Campaign[],
  events: Map<string, BaseEvent[]>
): XLSX.WorkBook

// Sheet builders (one per sheet type)
function buildInboundShipmentSheet(campaigns, events): XLSX.WorkSheet
function buildGranulationSheet(campaigns, events): XLSX.WorkSheet
// ... etc for all 7 sheets
```

### API Endpoints

**GET /api/export/[id]**
- Auth required
- Returns: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Filename: `campaign-{legoCampaignCode}-{date}.xlsx`

**GET /api/export**
- Auth required
- Optional query params: `?status=active` or `?ids=id1,id2,id3`
- Returns: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Filename: `campaigns-export-{date}.xlsx`

### Column Mapping

Must exactly match `excel-parser.ts` column order for round-trip compatibility.

Example for Inbound Shipment:
| Column | Index | Event Field |
|--------|-------|-------------|
| Campaign Code | 0 | campaign.legoCampaignCode |
| Requested Arrival Date | 1 | eventData.requestedArrivalDate |
| Gross Weight (kg) | 2 | eventData.grossWeightKg |
| Net Weight (kg) | 3 | eventData.netWeightKg |
| ... | ... | ... |

## Dependencies

- `xlsx` - Already installed
- No new dependencies needed

## Testing Strategy

1. **Unit tests** for excel-exporter.ts functions
2. **API tests** for export endpoints
3. **Round-trip test**: Export → Import → Verify data matches
