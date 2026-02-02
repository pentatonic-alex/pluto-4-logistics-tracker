---
date: 2026-02-02
topic: logistics-tracker
---

# LEGO REPLAY Logistics Tracker

## What We're Building

A web application for tracking PCR (Post-Consumer Recycled) LEGO brick material as it moves through a circular supply chain:

```
LEGO Warehouse → MBA (Compounder) → RGE (Manufacturer) → LEGO Warehouse
```

**Primary user:** Single project manager (Alex) who manually enters data received from partners via email/phone.

**Primary goals:**
1. **Traceability** - "Show me where campaign X came from and where it went"
2. **Status visibility** - "Where is my material right now?"

**Secondary goal:**
3. **Reporting** - Aggregate data on yields, volumes, timelines (future feature)

## The Material Flow

### Entities

| Level | Description | Example |
|-------|-------------|---------|
| **Campaign** | Business purpose, may span multiple shipments | "Post-industrial waste → Storage boxes" |
| **Shipment** | Logistics unit with tracking ID | Shipment-2024-001 |
| **Pallet** | Physical unit with net/gross weight | 1 of N pallets in shipment |

### Processing Steps

| Step | Location | Partner | Key Data |
|------|----------|---------|----------|
| 1. Inbound Shipment | LEGO → MBA | LEGO | Campaign code, Gross/Net weight, Carrier, Tracking ref, Dates |
| 2. Granulation | MBA | MBA | Ticket#, PI/PCR type, Weight in→out, Contamination, Polymer composition, Process time, Yield% |
| 3. Metal Removal | MBA | MBA | Weight in→out, Yield%, Waste code |
| 4. Polymer Purification | MBA | MBA | Weight in→out, Polymer composition, Waste composition, Yield% |
| 5. Extrusion | MBA | MBA | Weight in→out, Batch No, **ECHA testing complete** (gate) |
| 6. Transfer to RGE | MBA → RGE | MBA/RGE | Tracking ref, Carrier, Received weight |
| 7. Manufacturing | RGE | RGE | PO Number, PO Quantity, Production dates |
| 8. Return to LEGO | RGE → LEGO | RGE/LEGO | Tracking ref, Carrier, Received weight, Quantity |

### ECHA Testing Gate

ECHA approval happens at the Extrusion step. Material cannot transfer to RGE until ECHA testing is marked complete. This is a data field, not a physical location.

## Why TES Event-Sourced Approach

### Approaches Considered

1. **Simple CRUD Web App** - Fast to build, but history/audit is an afterthought
2. **TES Event-Sourced App** - Events as source of truth, natural traceability

### Chosen: TES Event-Sourced

Rationale:
- Traceability is a primary requirement—event history answers "what happened?" trivially
- Fits Pentatonic's existing patterns and infrastructure
- Audit trail is built-in, not bolted on
- Campaign status derived from events (single source of truth)

### Event Types (preliminary)

```
CampaignCreated
InboundShipmentRecorded
GranulationCompleted
MetalRemovalCompleted
PolymerPurificationCompleted
ExtrusionCompleted
ECHAApprovalRecorded
TransferToRGERecorded
ManufacturingStarted
ManufacturingCompleted
ReturnToLEGORecorded
CampaignCompleted
```

### Projection

One main projection: **Campaign Status View**
- Powers the dashboard
- Shows current status, current weight, last updated, next step
- Updated by event handlers

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Data entry model | Single user, manual entry | MVP simplicity; PM enters data from partner communications |
| Architecture | TES event-sourced | Traceability requirement; Pentatonic alignment |
| Volume handling | Simple list + archive | Only 1-3 active campaigns at a time |
| Threshold alerts | Deferred | Not MVP; add yield/loss alerts later |
| Excel import | Deferred | Not MVP; manual entry is sufficient |
| Partner portals | Deferred | Not MVP; single user for now |

## Open Questions (Resolved)

| Question | Decision |
|----------|----------|
| Authentication | Simple email/password login (NextAuth.js) |
| Hosting | Vercel (Alex's personal account) for MVP; migrate to company Cloudflare later |
| TES integration | Local event store (Postgres) mimicking TES patterns; connect to real TES later |
| Campaign code format | Generate our own canonical IDs (`cmp_xxx`); store LEGO's code as `lego_campaign_code` reference field |
| Weight units | KG (assumed; confirm if conversion needed) |

## Out of Scope (MVP)

- Partner self-service portals
- Excel import/export
- Automated threshold alerts
- Mass balance validation
- Label generation
- Notifications/reminders

## Next Steps

→ Proceed to planning phase to define:
- Tech stack specifics
- Database/event schema
- UI wireframes
- Implementation phases
