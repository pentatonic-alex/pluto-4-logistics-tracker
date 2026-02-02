---
date: 2026-02-02
topic: excel-export
---

# Excel Export for Campaigns

## What We're Building

Export functionality that allows users to download campaign data as Excel files, mirroring the import format for round-trip compatibility. Supports both single campaign export and bulk export of multiple campaigns.

## Why This Approach

### Approaches Considered

**Approach A: Server-Side API with xlsx (Selected)**
- Reuses existing `xlsx` dependency
- Direct database access for data retrieval
- Consistent with import architecture pattern

**Approach B: Client-Side Generation**
- Generate Excel in browser after fetching JSON
- More complex, larger bundle, still needs API for data

**Decision:** Server-side generation is simpler and follows existing patterns.

## Key Decisions

- **Format**: Mirror import structure (7 sheets) for round-trip editing
- **Scope**: Both single campaign and bulk export
- **UI**: Export buttons on campaign detail page AND dashboard
- **API**: Server-side generation via `/api/export/[id]` and `/api/export`
- **Library**: Reuse existing `xlsx` package (already installed)

## Requirements

| Requirement | Decision |
|-------------|----------|
| Purpose | Sharing, archiving, round-trip editing |
| Format | Match import sheets (7 sheets) |
| Scope | Single campaign + bulk export |
| UI | Buttons on detail page + dashboard |
| Technical | Server-side API |

## Sheet Structure

Must match import format in `src/lib/excel-parser.ts`:

1. **Inbound Shipment** - Campaign code, dates, weights, tracking
2. **Granulation** - Ticket, weights, process details
3. **Metal Removal** - Ticket, weights, process details
4. **Polymer purification** - Ticket, weights, compositions
5. **Extrusion** - Ticket, weights, batch number, ECHA status
6. **Transfer MBA-RGE** - Campaign code, tracking, received weights
7. **RGE Manufacturing** - PO details, dates

## Open Questions

- None - requirements are clear

## Next Steps

→ Create specs at `specs/002-excel-export/`
→ Generate tasks with `/speckit.tasks`
