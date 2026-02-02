# Analytics & Calculator - Tasks

## Phase 1: Setup
- [x] Create brainstorm document
- [x] Create spec files (plan.md, spec.md, tasks.md)
- [ ] Import tasks to Beads

## Phase 2: Analytics Infrastructure (P1)

### Task 2.1: Create analytics.ts library
**Priority:** P1  
**Files:** `src/lib/analytics.ts`  
**Depends on:** None

Create analytics aggregation functions:
- `getOverviewMetrics()` - total processed, campaigns, units, CO2e
- `getYieldAverages()` - average yield per step
- `getThroughputByMonth()` - monthly kg processed
- `getLatestCampaignYields()` - yields from most recent campaign

### Task 2.2: Create analytics API endpoint
**Priority:** P1  
**Files:** `src/app/api/analytics/route.ts`  
**Depends on:** 2.1

Create GET endpoint returning:
- Overview metrics
- Yield averages
- Throughput data

Requires authentication.

### Task 2.3: Install Recharts
**Priority:** P1  
**Files:** `package.json`  
**Depends on:** None

```bash
npm install recharts
```

## Phase 3: Analytics UI Components (P1)

### Task 3.1: Create MetricCard component
**Priority:** P1  
**Files:** `src/components/analytics/MetricCard.tsx`  
**Depends on:** None

Reusable metric card with:
- Label, value, optional unit
- Optional tooltip (for CO2e assumptions)
- Loading skeleton state

### Task 3.2: Create CO2eMetric component
**Priority:** P1  
**Files:** `src/components/analytics/CO2eMetric.tsx`  
**Depends on:** 3.1

Specialized metric showing:
- CO2e saved (kg)
- Coal equivalent (lbs)
- Tooltip with assumptions text

### Task 3.3: Create YieldWaterfall chart
**Priority:** P1  
**Files:** `src/components/analytics/YieldWaterfall.tsx`  
**Depends on:** 2.3

Recharts waterfall chart showing:
- Material flow from inbound to output
- Loss at each step
- Yield percentages

### Task 3.4: Create ThroughputChart
**Priority:** P1  
**Files:** `src/components/analytics/ThroughputChart.tsx`  
**Depends on:** 2.3

Recharts line chart showing:
- Monthly throughput (kg)
- Responsive design

### Task 3.5: Create analytics page
**Priority:** P1  
**Files:** `src/app/(authenticated)/analytics/page.tsx`, `src/app/(authenticated)/analytics/loading.tsx`  
**Depends on:** 2.2, 3.1, 3.2, 3.3, 3.4

Dashboard page with:
- Metric cards row
- Yield waterfall chart
- Throughput chart
- Loading skeleton
- Empty states

## Phase 4: Calculator Core (P1)

### Task 4.1: Create calculator.ts library
**Priority:** P1  
**Files:** `src/lib/calculator.ts`  
**Depends on:** None

Calculator logic with:
- `CALCULATOR_DEFAULTS` constants (yields, CO2e, products)
- `calculateRequiredInput()` - forward calculation
- `calculatePossibleOutput()` - reverse calculation
- Types for inputs/outputs

### Task 4.2: Create YieldSlider component
**Priority:** P1  
**Files:** `src/components/calculator/YieldSlider.tsx`  
**Depends on:** None

Slider input for yield assumption:
- Range 50-100%
- Shows current value
- Label for step name

### Task 4.3: Create ProductSelector component
**Priority:** P1  
**Files:** `src/components/calculator/ProductSelector.tsx`  
**Depends on:** 4.1

Dropdown for product selection:
- Storage Box (3 kg) preset
- Custom option with manual input
- Shows material per unit

### Task 4.4: Create BreakdownDisplay component
**Priority:** P1  
**Files:** `src/components/calculator/BreakdownDisplay.tsx`  
**Depends on:** None

Step-by-step calculation display:
- Shows kg at each step
- Visual flow indicator
- Updates in real-time

### Task 4.5: Create CalculatorForm component
**Priority:** P1  
**Files:** `src/components/calculator/CalculatorForm.tsx`  
**Depends on:** 4.1, 4.2, 4.3, 4.4

Main calculator form with:
- Mode toggle (Forward/Reverse)
- Target units OR available kg input
- Product selector
- Yield sliders for each step
- Contamination buffer slider
- Result display
- CO2e projection
- Breakdown display

### Task 4.6: Create calculator page
**Priority:** P1  
**Files:** `src/app/(authenticated)/calculator/page.tsx`, `src/app/(authenticated)/calculator/loading.tsx`  
**Depends on:** 4.5

Calculator page with:
- CalculatorForm component
- Loading skeleton
- Page title and description

## Phase 5: Calculator Enhancements (P1)

### Task 5.1: Add "Use Latest Averages" feature
**Priority:** P1  
**Files:** `src/components/calculator/CalculatorForm.tsx`  
**Depends on:** 2.2, 4.5

Button that:
- Fetches yield averages from `/api/analytics`
- Updates sliders with historical values
- Shows loading state
- Indicates values are from historical data

## Phase 6: Navigation & Integration (P1)

### Task 6.1: Update Navigation
**Priority:** P1  
**Files:** `src/components/Navigation.tsx`  
**Depends on:** 3.5, 4.6

Add nav links:
- Analytics (after Dashboard)
- Calculator (after Analytics)

## Phase 7: Testing (P1)

### Task 7.1: Unit tests for calculator.ts
**Priority:** P1  
**Files:** `src/lib/__tests__/calculator.test.ts`  
**Depends on:** 4.1

Test:
- Forward calculation accuracy
- Reverse calculation accuracy
- Edge cases (0 units, 100% yields)
- CO2e calculations

### Task 7.2: Unit tests for analytics.ts
**Priority:** P1  
**Files:** `src/lib/__tests__/analytics.test.ts`  
**Depends on:** 2.1

Test:
- Aggregation queries return correct shape
- Empty data handling
- Yield calculations

### Task 7.3: E2E tests
**Priority:** P1  
**Files:** `e2e/analytics-calculator.spec.ts`  
**Depends on:** 3.5, 4.6

Playwright tests:
- Analytics page loads
- Calculator form interactions
- Mode toggle works
- Sliders update calculation

## Phase 8: Polish (P2)

### Task 8.1: Step duration chart
**Priority:** P2  
**Files:** `src/components/analytics/StepDurationChart.tsx`, `src/app/(authenticated)/analytics/page.tsx`  
**Depends on:** 3.5

Bar chart showing average duration per step.

### Task 8.2: Yield by campaign table
**Priority:** P2  
**Files:** `src/components/analytics/YieldTable.tsx`, `src/app/(authenticated)/analytics/page.tsx`  
**Depends on:** 3.5

Sortable table comparing yields across campaigns.

### Task 8.3: Reset to defaults button
**Priority:** P2  
**Files:** `src/components/calculator/CalculatorForm.tsx`  
**Depends on:** 4.5

Button to reset all sliders to fallback values.
