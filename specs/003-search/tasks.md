# Global Search - Tasks

## Phase 1: Setup
- [x] Create brainstorm document
- [x] Create spec files (plan.md, spec.md)
- [ ] Import tasks to Beads

## Phase 2: Core Search Logic (P1)

### Task 2.1: Add searchCampaigns() function
**Priority:** P1  
**Files:** `src/lib/projections.ts`  
**Depends on:** None

Add search function that:
- Accepts query string (min 2 chars)
- Searches projections: id, lego_campaign_code, description
- Searches event JSONB: trackingRef, poNumber
- Returns deduplicated results with match context
- Limits to 20 results

Reference: See plan.md for SQL query structure

### Task 2.2: Unit tests for searchCampaigns
**Priority:** P1  
**Files:** `src/lib/__tests__/search.test.ts`  
**Depends on:** 2.1

Test:
- Search by campaign ID returns match
- Search by LEGO code returns match
- Search by tracking number returns match
- Search by PO number returns match
- Search by description returns match
- Empty query returns empty results
- Short query (< 2 chars) returns empty results
- Results are deduplicated
- Results limited to 20

## Phase 3: API Endpoint (P1)

### Task 3.1: Create search API endpoint
**Priority:** P1  
**Files:** `src/app/api/search/route.ts`  
**Depends on:** 2.1

Create GET endpoint that:
- Requires authentication
- Accepts `?q=<query>` parameter
- Validates query length (min 2)
- Returns `{ results: SearchResult[] }`
- Handles errors gracefully

### Task 3.2: API tests
**Priority:** P1  
**Files:** `src/app/api/search/__tests__/route.test.ts`  
**Depends on:** 3.1

Test:
- Returns 401 without auth
- Returns 400 for missing/short query
- Returns results for valid query
- Returns empty array for no matches

## Phase 4: UI Components (P1)

### Task 4.1: Create SearchBar component
**Priority:** P1  
**Files:** `src/components/SearchBar.tsx`  
**Depends on:** 3.1

Build component with:
- Search input with icon
- Debounced API calls (300ms)
- Dropdown with results
- Loading state
- Empty state
- Match context display (field type, value)

Reference: Existing search input pattern in `src/app/(authenticated)/archive/page.tsx`

### Task 4.2: Add keyboard navigation
**Priority:** P2  
**Files:** `src/components/SearchBar.tsx`  
**Depends on:** 4.1

Add:
- Arrow key navigation through results
- Enter to select highlighted result
- Escape to close dropdown
- Cmd/Ctrl+K global shortcut to focus

### Task 4.3: Integrate into Navigation
**Priority:** P1  
**Files:** `src/components/Navigation.tsx`  
**Depends on:** 4.1

Add SearchBar:
- Between nav links and theme toggle (desktop)
- Hidden on mobile (Phase 5)
- Proper spacing and alignment

## Phase 5: Polish (P2)

### Task 5.1: Mobile search support
**Priority:** P3  
**Files:** `src/components/Navigation.tsx`, `src/components/SearchBar.tsx`  
**Depends on:** 4.3

Add:
- Search icon in mobile header
- Full-width search in mobile menu
- Touch-friendly results

### Task 5.2: Component tests
**Priority:** P2  
**Files:** `src/components/__tests__/SearchBar.test.tsx`  
**Depends on:** 4.2

Test:
- Renders search input
- Debounces API calls
- Shows loading state
- Shows results dropdown
- Keyboard navigation works
- Clicking result navigates

## Phase 6: Code Review
- [ ] Run code-review skill
- [ ] Address findings
- [ ] Final testing
