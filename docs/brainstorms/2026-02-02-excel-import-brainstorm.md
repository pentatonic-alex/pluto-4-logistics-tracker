---
date: 2026-02-02
topic: excel-import
---

# Excel Import for Campaign Sync

## What We're Building

A feature to upload the LEGO REPLAY Excel tracker and sync it with the logistics tracker. The import will:
1. Create new campaigns from Excel data
2. Record processing events (granulation, extrusion, etc.) for existing campaigns
3. Update/correct existing data with confirmation

The UX is a preview-and-confirm workflow: user uploads Excel, sees all proposed changes in a diff view, confirms/rejects each row individually, then applies all confirmed changes at once.

## Why This Approach (Hybrid Client/Server)

**Approaches Considered:**
- **Client-side only**: Fast but loses server-side validation guarantees
- **Server-side upload**: Requires file storage, adds complexity
- **Hybrid (chosen)**: Parse client-side for speed, validate server-side for correctness

The hybrid approach keeps the server stateless while providing immediate feedback on parsing. The server handles the business logic of matching campaigns and calculating diffs.

## Key Decisions

1. **Matching by Campaign Code**: Rows are matched to existing campaigns using `legoCampaignCode` (e.g., "20251231-DEV-ORDER-MX")

2. **All changes require confirmation**: No silent updates. Every create, update, or event is shown in preview with explicit confirm/reject.

3. **Diff view for conflicts**: Side-by-side comparison showing current vs. proposed values

4. **Skip invalid rows**: Rows with missing required data are shown as "Skipped" with reason, not blocking the entire import

5. **Event-sourced application**: All changes emit proper TES events (CampaignCreated, GranulationCompleted, EventCorrected, etc.)

6. **Sheet-to-Event mapping**:
   - Inbound Shipment → `CampaignCreated` + `InboundShipmentRecorded`
   - Granulation → `GranulationCompleted`
   - Metal Removal → `MetalRemovalCompleted`
   - Polymer purification → `PolymerPurificationCompleted`
   - Extrusion → `ExtrusionCompleted`
   - Transfer MBA-RGE → `TransferToRGERecorded`
   - RGE Manufacturing → `ManufacturingStarted` / `ManufacturingCompleted`

## Open Questions

- Should there be a "dry run" mode that just validates without showing the full preview?
- How to handle duplicate campaign codes in the Excel file?
- Should we store import history for audit purposes?

## Next Steps

→ Implement hybrid import with preview/confirm UI
