# Audit Log - Tasks

## Phase 1: Setup
- [x] Create brainstorm document
- [x] Create spec files (plan.md, spec.md)
- [x] Import tasks to Beads

## Phase 2: Core API (P1)

### Task 2.1: Create /api/audit endpoint ✅
**Priority:** P1  
**Files:** `src/app/api/audit/route.ts`  
**Depends on:** None  
**Status:** Complete (pluto-syz)

Create GET endpoint that:
- Queries events table for `event_type='EventCorrected'`
- Joins with campaign_projections for campaign codes
- Supports optional filters: campaignId, startDate, endDate
- Returns paginated results with total count
- Returns campaign list for filter dropdown
- Requires authentication

### Task 2.2: Add lib function for audit queries ✅
**Priority:** P1  
**Files:** `src/lib/audit.ts`  
**Depends on:** None  
**Status:** Complete (pluto-25f)

Create audit query functions:
- `getAuditEntries()` - Fetch paginated corrections
- `getAuditEntriesCount()` - Get total for pagination
- `getCampaignsForFilter()` - Get campaign list for dropdown

## Phase 3: UI Components (P1)

### Task 3.1: Create audit page ✅
**Priority:** P1  
**Files:** `src/app/(authenticated)/audit/page.tsx`  
**Depends on:** 2.1  
**Status:** Complete (pluto-y67)

Create the main audit log page with:
- Filter controls (campaign dropdown, date pickers)
- Table display with all columns
- Diff display for changes (was → now)
- Pagination controls
- Links to campaign detail pages

### Task 3.2: Create loading skeleton ✅
**Priority:** P2  
**Files:** `src/app/(authenticated)/audit/loading.tsx`  
**Depends on:** None  
**Status:** Complete (pluto-gqt)

Create loading skeleton matching page layout:
- Filter bar skeleton
- Table skeleton with rows
- Pagination skeleton

### Task 3.3: Add to Navigation ✅
**Priority:** P1  
**Files:** `src/components/Navigation.tsx`  
**Depends on:** None  
**Status:** Complete (pluto-a0q)

Add "Audit Log" link:
- Position after Calculator
- Use `/audit` href
- Include in mobile menu

## Phase 4: Testing (P2)

### Task 4.1: Unit tests for audit API ✅
**Priority:** P2  
**Files:** `src/lib/__tests__/audit.test.ts`  
**Depends on:** 2.2  
**Status:** Complete (pluto-gm5) - 10 tests

Test:
- Query returns correct structure
- Filters work correctly
- Pagination calculates properly
- Empty results handled

### Task 4.2: E2E test for audit page ✅
**Priority:** P2  
**Files:** `e2e/audit.spec.ts`  
**Depends on:** 3.1  
**Status:** Complete (pluto-139)

Playwright test for:
- Page loads and displays table
- Filters change results
- Pagination works
- Links navigate correctly

## Phase 5: Polish

### Task 5.1: Code review ✅
**Priority:** P2  
**Depends on:** All above

- Run linter: No errors
- Check types: Build passes
- Review for patterns compliance: Follows existing patterns
- Security review: Auth required on all endpoints

## Task Summary

| Task | Priority | Status | Beads ID |
|------|----------|--------|----------|
| 2.1 API endpoint | P1 | Complete | pluto-syz |
| 2.2 Lib functions | P1 | Complete | pluto-25f |
| 3.1 Audit page | P1 | Complete | pluto-y67 |
| 3.2 Loading skeleton | P2 | Complete | pluto-gqt |
| 3.3 Navigation | P1 | Complete | pluto-a0q |
| 4.1 Unit tests | P2 | Complete | pluto-gm5 |
| 4.2 E2E tests | P2 | Complete | pluto-139 |
| 5.1 Code review | P2 | Complete | - |
