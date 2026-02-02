# Global Search - Technical Plan

## Overview

Add global search functionality to find campaigns by any identifier (campaign ID, LEGO code, tracking number, PO number).

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Neon Postgres via existing `sql` helper
- **Search**: Server-side with ILIKE queries on projections + JSONB

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Navigation                           │
│  [Logo] [Dashboard] [Archive] [Import] [🔍 Search...  ] │
└─────────────────────────┬───────────────────────────────┘
                          │ debounced input (300ms)
                          ▼
              ┌──────────────────────┐
              │   GET /api/search    │
              │   ?q=<query>         │
              └──────────┬───────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Projections │  │   Events    │  │   Events    │
│  id, code,  │  │ trackingRef │  │  poNumber   │
│ description │  │   (JSONB)   │  │   (JSONB)   │
└─────────────┘  └─────────────┘  └─────────────┘
         │               │               │
         └───────────────┼───────────────┘
                         ▼
              ┌──────────────────────┐
              │   Combined Results   │
              │   (deduplicated)     │
              └──────────────────────┘
```

## File Structure

```
src/
├── lib/
│   └── projections.ts          # MODIFY: Add searchCampaigns()
├── app/
│   └── api/
│       └── search/
│           └── route.ts        # NEW: Search endpoint
├── components/
│   ├── SearchBar.tsx           # NEW: Search component
│   └── Navigation.tsx          # MODIFY: Add SearchBar
```

## Key Implementation Details

### searchCampaigns() in projections.ts

```typescript
export interface SearchResult {
  campaignId: string;
  legoCampaignCode: string;
  status: CampaignStatus;
  matchedField: 'campaign_id' | 'lego_code' | 'description' | 'tracking' | 'po';
  matchedValue: string;
}

export async function searchCampaigns(query: string): Promise<SearchResult[]>
```

### Database Query

Combined query using UNION for efficiency:

```sql
-- Search projections (id, lego_code, description)
SELECT id, lego_campaign_code, status, 
       CASE 
         WHEN id ILIKE $1 THEN 'campaign_id'
         WHEN lego_campaign_code ILIKE $1 THEN 'lego_code'
         ELSE 'description'
       END as match_type,
       CASE 
         WHEN id ILIKE $1 THEN id
         WHEN lego_campaign_code ILIKE $1 THEN lego_campaign_code
         ELSE description
       END as match_value
FROM campaign_projections 
WHERE id ILIKE $1 OR lego_campaign_code ILIKE $1 OR description ILIKE $1

UNION

-- Search tracking refs in event payloads
SELECT DISTINCT cp.id, cp.lego_campaign_code, cp.status,
       'tracking' as match_type,
       e.event_data->>'trackingRef' as match_value
FROM events e
JOIN campaign_projections cp ON cp.id = e.stream_id
WHERE e.event_data->>'trackingRef' ILIKE $1

UNION

-- Search PO numbers in event payloads
SELECT DISTINCT cp.id, cp.lego_campaign_code, cp.status,
       'po' as match_type,
       e.event_data->>'poNumber' as match_value
FROM events e
JOIN campaign_projections cp ON cp.id = e.stream_id
WHERE e.event_data->>'poNumber' ILIKE $1

LIMIT 20
```

### API Endpoint

**GET /api/search?q=<query>**
- Auth required
- Minimum query length: 2 characters
- Returns: `{ results: SearchResult[] }`
- Limit: 20 results

### SearchBar Component

Features:
- Debounced input (300ms)
- Dropdown with grouped results
- Keyboard navigation (↑↓ arrows, Enter to select, Escape to close)
- Cmd/Ctrl+K shortcut to focus
- Loading spinner during search
- Empty state for no results

## Dependencies

- No new dependencies needed
- Uses existing Tailwind patterns from archive page search

## Testing Strategy

1. **Unit tests** for `searchCampaigns()` function
2. **API tests** for `/api/search` endpoint
3. **Component tests** for SearchBar (keyboard nav, debouncing)
