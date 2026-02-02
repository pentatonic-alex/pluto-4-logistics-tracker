# Audit Log - Technical Plan

## Overview

Build a centralized audit log displaying all `EventCorrected` events across campaigns with filtering and pagination.

## Tech Stack

- **Framework**: Next.js 14 App Router (existing)
- **Database**: Neon Postgres (existing)
- **Styling**: Tailwind CSS (existing)
- **Auth**: NextAuth.js v5 (existing)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        /audit Page                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Filters: [Campaign ▼] [Start Date] [End Date]      │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Table: Timestamp | Campaign | Type | Reason | Diff │   │
│  │  ... rows ...                                        │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Pagination: [< Prev] Page 1 of N [Next >]          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    GET /api/audit
                    ?campaignId=xxx
                    &startDate=xxx
                    &endDate=xxx
                    &page=1
                              │
                              ▼
              ┌───────────────────────────────┐
              │   events + campaign_projections│
              │   WHERE event_type='EventCorrected'
              └───────────────────────────────┘
```

## File Structure

```
src/
├── app/
│   ├── (authenticated)/
│   │   └── audit/
│   │       ├── page.tsx      # Main audit log page
│   │       └── loading.tsx   # Loading skeleton
│   └── api/
│       └── audit/
│           └── route.ts      # GET endpoint
└── components/
    └── Navigation.tsx        # Add nav link (modify)
```

## API Design

### GET /api/audit

**Query Parameters:**
- `campaignId` (optional): Filter by campaign ID
- `startDate` (optional): ISO date string, filter corrections on or after
- `endDate` (optional): ISO date string, filter corrections on or before
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page

**Response:**
```typescript
{
  entries: AuditEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  campaigns: { id: string; code: string }[]; // For filter dropdown
}
```

**AuditEntry:**
```typescript
interface AuditEntry {
  id: string;
  campaignId: string;
  campaignCode: string;
  correctedEventId: string;
  correctedEventType: EventType;
  reason: string;
  changes: Record<string, { was: unknown; now: unknown }>;
  userId: string;
  createdAt: string;
}
```

## Database Query

```sql
-- Count total for pagination
SELECT COUNT(*) FROM events e
JOIN campaign_projections cp ON e.stream_id = cp.id
WHERE e.event_type = 'EventCorrected'
  AND ($1::text IS NULL OR cp.id = $1)
  AND ($2::timestamp IS NULL OR e.created_at >= $2)
  AND ($3::timestamp IS NULL OR e.created_at <= $3);

-- Fetch page of results
SELECT 
  e.id,
  e.stream_id as campaign_id,
  e.event_data,
  e.metadata,
  e.created_at,
  cp.lego_campaign_code
FROM events e
JOIN campaign_projections cp ON e.stream_id = cp.id
WHERE e.event_type = 'EventCorrected'
  AND ($1::text IS NULL OR cp.id = $1)
  AND ($2::timestamp IS NULL OR e.created_at >= $2)
  AND ($3::timestamp IS NULL OR e.created_at <= $3)
ORDER BY e.created_at DESC
LIMIT $4 OFFSET $5;

-- Get all campaigns for filter dropdown
SELECT id, lego_campaign_code FROM campaign_projections ORDER BY lego_campaign_code;
```

## Component Reuse

Extract formatting utilities from `EventTimeline.tsx`:
- `formatFieldName()` - Converts camelCase to display labels
- `formatFieldValue()` - Formats values based on field type (dates, weights, etc.)

These can be extracted to `src/lib/formatters.ts` or used inline since the audit page can import the component.

## UI Components

1. **Filter Bar**: Campaign dropdown + date inputs
2. **Audit Table**: Responsive table with all columns
3. **Diff Display**: Reuse was→now pattern from EventTimeline
4. **Pagination**: Page controls with prev/next

## Security

- All endpoints require authentication via `auth()`
- Campaign IDs validated before use in queries
- Parameterized queries prevent SQL injection

## Performance

- Index on `events.event_type` already exists
- Pagination limits result set size
- Campaign dropdown cached client-side
