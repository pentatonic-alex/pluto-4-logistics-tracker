---
date: 2026-02-02
topic: search
---

# Global Search for Campaigns

## What We're Building

A global search bar in the navigation that allows users to quickly find campaigns by any identifier - campaign ID, LEGO campaign code, tracking number, or PO number. Results appear in a dropdown with keyboard navigation, and selecting a result navigates to the campaign detail page.

## Why This Approach

### Approaches Considered

**Approach A: Global Nav Search with Dropdown (Selected)**
- Search bar always visible in navigation
- Debounced API calls as user types
- Dropdown shows results with match context
- Keyboard navigation (arrows, enter, escape)

Pros:
- Always accessible from any page
- Fast workflow - no page navigation required
- Familiar pattern (like GitHub, Slack, etc.)

Cons:
- More complex component (keyboard handling, focus management)
- Adds weight to navigation

**Approach B: Dedicated Search Page**
- Link to /search in navigation
- Full-page search results
- Filter options for different field types

Pros:
- Simpler implementation
- More room for advanced filters

Cons:
- Extra click/navigation required
- Slower workflow for quick lookups

**Decision:** Global nav search provides better UX for the common case of "find this campaign quickly." The PM frequently needs to look up campaigns by tracking number or PO when communicating with partners.

## Key Decisions

- **Location**: Navigation bar (desktop), mobile menu (mobile)
- **Search fields**: Campaign ID, LEGO code, tracking #, PO #, description
- **Database**: Combined query on projections + event JSONB
- **UX**: 300ms debounce, keyboard navigation, Cmd/Ctrl+K shortcut
- **Results**: Show match context (what field matched, matched value)

## Requirements

| Requirement | Decision |
|-------------|----------|
| Location | Global nav bar |
| Search scope | Campaign ID, LEGO code, tracking #, PO #, description |
| Trigger | Type to search, Cmd/Ctrl+K shortcut |
| Results | Dropdown with match context |
| Navigation | Keyboard (arrows, enter, escape) + click |

## Open Questions

- None - requirements are clear

## Next Steps

→ Create specs at `specs/003-search/`
→ Generate tasks with `/speckit.tasks`
