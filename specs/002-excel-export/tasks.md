# Excel Export - Tasks

## Phase 1: Setup
- [x] Create brainstorm document
- [x] Create spec files (plan.md, spec.md)
- [x] Import tasks to Beads

## Phase 2: Core Export Logic (P1)

### Task 2.1: Create excel-exporter.ts ✅
**Priority:** P1  
**Files:** `src/lib/excel-exporter.ts`  
**Depends on:** None  
**Status:** Complete (pluto-amd)

Create the core export module with:
- `buildCampaignWorkbook()` - Main entry point
- Sheet builders for all 7 sheets
- Column mapping that mirrors `excel-parser.ts`

Reference: `src/lib/excel-parser.ts` for column order and sheet names

### Task 2.2: Unit tests for excel-exporter ✅
**Priority:** P1  
**Files:** `src/lib/__tests__/excel-exporter.test.ts`  
**Depends on:** 2.1  
**Status:** Complete (pluto-hyv) - 19 tests

Test:
- Each sheet builder produces correct columns
- Data mapping is accurate
- Empty data produces valid workbook

## Phase 3: API Endpoints (P1)

### Task 3.1: Single campaign export endpoint ✅
**Priority:** P1  
**Files:** `src/app/api/export/[id]/route.ts`  
**Depends on:** 2.1  
**Status:** Complete (pluto-926)

Create GET endpoint that:
- Validates campaign ID
- Requires authentication
- Returns Excel file with correct content-type
- Sets appropriate filename header

### Task 3.2: Bulk export endpoint ✅
**Priority:** P1  
**Files:** `src/app/api/export/route.ts`  
**Depends on:** 2.1  
**Status:** Complete (pluto-298)

Create GET endpoint that:
- Requires authentication
- Accepts optional status filter
- Returns Excel file with all matching campaigns

## Phase 4: UI Integration (P1)

### Task 4.1: Export button on campaign detail page ✅
**Priority:** P1  
**Files:** `src/app/(authenticated)/campaigns/[id]/page.tsx`  
**Depends on:** 3.1  
**Status:** Complete (pluto-lr3)

Add export button:
- Position near "Log Event" button
- Download icon
- Loading state during export
- Error handling

### Task 4.2: Bulk export button on dashboard ✅
**Priority:** P1  
**Files:** `src/app/(authenticated)/page.tsx`  
**Depends on:** 3.2  
**Status:** Complete (pluto-e6k)

Add export button:
- Position in dashboard header/actions area
- "Export All" or "Export Campaigns" label
- Loading state during export

## Phase 5: Testing & Polish (P2)

### Task 5.1: Round-trip test ✅
**Priority:** P2  
**Files:** `src/lib/__tests__/excel-roundtrip.test.ts`  
**Depends on:** 2.1  
**Status:** Complete (pluto-92q) - 12 tests

Test that:
- Export a campaign
- Parse the exported file with excel-parser
- Verify data matches original

### Task 5.2: E2E export test ✅
**Priority:** P2  
**Files:** `e2e/export.spec.ts`  
**Depends on:** 4.1, 4.2  
**Status:** Complete (pluto-eju)

Playwright test for:
- Export button visibility
- Download triggers correctly
- File is valid Excel

## Phase 6: Code Review
- [ ] Run code-review skill (start NEW chat)
- [ ] Address any findings
- [ ] Final testing
