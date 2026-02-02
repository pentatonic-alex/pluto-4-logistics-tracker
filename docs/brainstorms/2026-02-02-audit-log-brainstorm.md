---
date: 2026-02-02
topic: audit-log
---

# Audit/Corrections Log

## What We're Building

A centralized audit log page at `/audit` that displays all `EventCorrected` events across all campaigns. This provides a single view for compliance audits, debugging, and change tracking - showing what was changed, when, why, and by whom.

## Why This Approach

### Approaches Considered

**Approach A: Dedicated Audit Page with Table View (Selected)**
- New `/audit` route with tabular display
- Filters for campaign, date range
- Paginated results, newest first
- Links to campaign detail pages

Pros:
- Single place to see all corrections across system
- Easy to filter and search for specific changes
- Supports compliance/audit workflows
- Follows existing page patterns (Analytics, Archive)

Cons:
- New page to maintain
- Additional navigation item

**Approach B: Enhanced Campaign Detail Page**
- Add "Corrections" tab to campaign detail
- Show only corrections for that campaign

Pros:
- No new navigation item
- Context already established (viewing a campaign)

Cons:
- Can't see corrections across all campaigns
- Doesn't support cross-campaign audit workflows
- PM would need to check each campaign individually

**Approach C: Global Activity Feed**
- Show all events (not just corrections) in a feed
- Filter to corrections as needed

Pros:
- More comprehensive view of all activity
- Could be useful for other monitoring

Cons:
- Over-engineered for the stated use case
- Higher complexity
- Corrections would be buried in noise

**Decision:** Dedicated audit page provides the clearest path for the primary use cases (compliance audits, debugging). The PM needs to quickly see "what changed and why" across the system without navigating to individual campaigns.

## Key Decisions

- **Location**: New `/audit` route, linked from main navigation
- **Data Source**: Query `events` table for `event_type='EventCorrected'`
- **Display**: Table format with was/now diff display
- **Filters**: Campaign dropdown, date range pickers
- **Pagination**: Offset-based, 20 items per page
- **Reuse**: Extract diff formatting from EventTimeline component

## Requirements

| Requirement | Decision |
|-------------|----------|
| Location | `/audit` route with nav link |
| Data | All EventCorrected events |
| Columns | Timestamp, Campaign (link), Event Type, Reason, Changes, User |
| Filters | Campaign (optional), Date range (optional) |
| Sorting | Newest first (default) |
| Pagination | 20 per page with prev/next |

## Use Cases

1. **Compliance Audit**: Auditor needs to see all data corrections made in a time period with reasons documented
2. **Debugging**: Developer investigating discrepancies needs to see what was changed and when
3. **Change Tracking**: PM reviewing corrections to understand data quality issues

## Technical Notes

- Reuse `EventCorrectionPayload` type from `src/types/index.ts`
- Reuse diff display patterns from `EventTimeline.tsx`
- Join with `campaign_projections` to get LEGO campaign codes
- Use existing `metadata.userId` for user attribution

## Open Questions

- None - requirements are clear from the brief

## Next Steps

→ Create specs at `specs/004-audit-log/`
→ Generate tasks with implementation phases
→ Import to Beads for tracking
