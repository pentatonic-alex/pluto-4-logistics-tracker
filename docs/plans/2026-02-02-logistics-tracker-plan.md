---
date: 2026-02-02
topic: logistics-tracker-implementation
brainstorm: ../brainstorms/2026-02-02-logistics-tracker-brainstorm.md
---

# LEGO REPLAY Logistics Tracker - Implementation Plan

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | Next.js 14 (App Router) | React + API routes |
| Database | Vercel Postgres | Free tier, SQLite-compatible patterns |
| Auth | NextAuth.js v5 | Email/password, single user |
| Styling | Tailwind CSS | Utility-first, fast iteration |
| Event Store | Postgres table | TES-like patterns, migrate later |
| Deployment | Vercel | Alex's personal account |

## Data Model

### Events Table (TES-like)

```sql
CREATE TABLE events (
  id TEXT PRIMARY KEY,           -- ULID
  stream_type TEXT NOT NULL,     -- 'campaign'
  stream_id TEXT NOT NULL,       -- campaign ID
  event_type TEXT NOT NULL,      -- 'CampaignCreated', 'GranulationCompleted', etc.
  event_data JSONB NOT NULL,     -- event payload
  metadata JSONB,                -- user, timestamp, etc.
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_stream ON events(stream_type, stream_id);
CREATE INDEX idx_events_type ON events(event_type);
```

### Campaign Projection (Materialized View)

```sql
CREATE TABLE campaign_projections (
  id TEXT PRIMARY KEY,                    -- canonical ID (cmp_xxx)
  lego_campaign_code TEXT,                -- LEGO's reference (e.g., 20251231-DEV-ORDER-MX)
  status TEXT NOT NULL,                   -- current status
  current_step TEXT,                      -- which processing step
  current_weight_kg DECIMAL,              -- latest weight
  material_type TEXT,                     -- PI or PCR
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Denormalized for dashboard display
  last_event_type TEXT,
  last_event_at TIMESTAMP,
  next_expected_step TEXT,
  echa_approved BOOLEAN DEFAULT FALSE
);
```

### Event Types

| Event | Payload Fields |
|-------|----------------|
| `CampaignCreated` | lego_campaign_code, material_type (PI/PCR), description |
| `InboundShipmentRecorded` | gross_weight_kg, net_weight_kg, estimated_abs_kg, carrier, tracking_ref, ship_date, arrival_date |
| `GranulationCompleted` | ticket_number, starting_weight_kg, output_weight_kg, contamination_notes, polymer_composition, process_hours, waste_code |
| `MetalRemovalCompleted` | ticket_number, starting_weight_kg, output_weight_kg, process_hours, waste_code |
| `PolymerPurificationCompleted` | ticket_number, starting_weight_kg, output_weight_kg, polymer_composition, waste_composition, process_hours, waste_code |
| `ExtrusionCompleted` | ticket_number, starting_weight_kg, output_weight_kg, batch_number, process_hours |
| `ECHAApprovalRecorded` | approved_by, approval_date, notes |
| `TransferToRGERecorded` | tracking_ref, carrier, ship_date, received_date, received_weight_kg |
| `ManufacturingStarted` | po_number, po_quantity, start_date |
| `ManufacturingCompleted` | end_date, actual_quantity, notes |
| `ReturnToLEGORecorded` | tracking_ref, carrier, ship_date, received_date, quantity |
| `CampaignCompleted` | completion_notes |

## UI Structure

```
/                       → Dashboard (campaign list + status overview)
/campaigns/new          → Create new campaign
/campaigns/[id]         → Campaign detail (timeline + current status)
/campaigns/[id]/log     → Log new event for this campaign
/login                  → Simple login page
```

### Dashboard View

- List of active campaigns with status badges
- Quick-glance: Campaign code, current step, last update, ECHA status
- Filter: Active / Completed / All
- Click to view details

### Campaign Detail View

- Header: Campaign info, current status, key metrics
- Timeline: All events in chronological order
- Action: "Log Event" button → modal or dedicated page

### Log Event View

- Dropdown: Select event type (contextual to current step)
- Dynamic form: Fields change based on event type
- Auto-calculates yield % when weights entered

---

## Implementation Phases

### Phase 1: Foundation

**Goal:** Deployable skeleton with auth

- [ ] Initialize Next.js 14 project with App Router
- [ ] Configure Tailwind CSS
- [ ] Set up Vercel Postgres connection
- [ ] Create events and campaign_projections tables
- [ ] Set up NextAuth.js with credentials provider (single user)
- [ ] Create basic layout with navigation
- [ ] Deploy to Vercel

**Verification:** Can log in and see empty dashboard at live URL

---

### Phase 2: Event Infrastructure

**Goal:** Core event store working

- [ ] Create event store utility functions:
  - `appendEvent(streamType, streamId, eventType, eventData)`
  - `getEventsForStream(streamType, streamId)`
  - `getEventsByType(eventType)`
- [ ] Create projection updater that handles each event type
- [ ] Create API routes:
  - `POST /api/events` - append event
  - `GET /api/campaigns` - list campaigns (from projection)
  - `GET /api/campaigns/[id]` - get campaign with events
- [ ] Add canonical ID generation (ULID-based `cmp_xxx`)

**Verification:** Can create campaign via API, projection updates correctly

---

### Phase 3: Campaign CRUD

**Goal:** Create and view campaigns

- [ ] Dashboard page showing campaign list
- [ ] "New Campaign" form:
  - LEGO campaign code
  - Material type (PI/PCR)
  - Description
- [ ] Campaign detail page:
  - Header with status
  - Event timeline (empty initially)
- [ ] Status badge component

**Verification:** Can create campaign, see it on dashboard, view detail page

---

### Phase 4: Event Logging UI

**Goal:** Log processing events through UI

- [ ] Event type selector (contextual to campaign's current step)
- [ ] Dynamic form components for each event type:
  - InboundShipmentForm
  - GranulationForm
  - MetalRemovalForm
  - PolymerPurificationForm
  - ExtrusionForm
  - ECHAApprovalForm
  - TransferToRGEForm
  - ManufacturingForm
  - ReturnToLEGOForm
- [ ] Auto-calculate yield % from weights
- [ ] Event timeline component showing logged events

**Verification:** Can log all event types, see them in timeline, status updates correctly

---

### Phase 5: Polish & UX

**Goal:** Production-quality UX

- [ ] Form validation and error handling
- [ ] Loading states and optimistic updates
- [ ] Responsive design for tablet/mobile
- [ ] Completed campaigns archive view
- [ ] Campaign search/filter
- [ ] Confirmation dialogs for important actions

**Verification:** Feels like a real product, handles edge cases gracefully

---

### Phase 6: Data Integrity (Stretch)

**Goal:** Catch issues early

- [ ] Weight continuity warnings (output > input)
- [ ] Required field enforcement per step
- [ ] Date sequence validation
- [ ] Export campaign history (CSV/PDF)

---

## File Structure

```
pluto-4-logistics-tracker/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Dashboard
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── campaigns/
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx            # Campaign detail
│   │   │       └── log/
│   │   │           └── page.tsx        # Log event
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts
│   │       ├── events/
│   │       │   └── route.ts
│   │       └── campaigns/
│   │           ├── route.ts
│   │           └── [id]/
│   │               └── route.ts
│   ├── lib/
│   │   ├── db.ts                       # Database connection
│   │   ├── events.ts                   # Event store functions
│   │   ├── projections.ts              # Projection updaters
│   │   └── ids.ts                      # Canonical ID generation
│   ├── components/
│   │   ├── ui/                         # Reusable UI components
│   │   ├── CampaignCard.tsx
│   │   ├── EventTimeline.tsx
│   │   ├── StatusBadge.tsx
│   │   └── forms/
│   │       ├── InboundShipmentForm.tsx
│   │       ├── GranulationForm.tsx
│   │       └── ...
│   └── types/
│       └── index.ts                    # TypeScript types for events
├── docs/
│   ├── brainstorms/
│   └── plans/
├── CLAUDE.md
├── package.json
└── ...
```

## Success Criteria

MVP is complete when you can:

1. Log in to the app
2. Create a new campaign with LEGO's campaign code
3. Log each processing step (Inbound → Granulation → ... → Return to LEGO)
4. See current status on dashboard
5. View full event history for any campaign
6. See completed campaigns in archive

---

## Ready to Build

Start with Phase 1. Each phase builds on the previous and ends with a working, deployable state.
