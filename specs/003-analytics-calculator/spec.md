# Analytics & Calculator - User Stories & Acceptance Criteria

## User Stories

### Analytics Dashboard

#### US-1: View Overview Metrics (P1)

**As a** project manager  
**I want to** see key operational metrics at a glance  
**So that** I can understand overall supply chain performance

**Acceptance Criteria:**
- [ ] Analytics page accessible at `/analytics`
- [ ] Navigation includes "Analytics" link
- [ ] Metric cards display:
  - Total material processed (kg)
  - Active campaigns count
  - Completed campaigns count
  - Total units produced
  - CO2e saved (kg) with coal equivalent
- [ ] CO2e metric has tooltip explaining assumptions
- [ ] Page loads within 2 seconds
- [ ] Shows loading skeleton while fetching data

#### US-2: View Yield Waterfall Chart (P1)

**As a** project manager  
**I want to** see material loss at each processing step  
**So that** I can identify inefficient steps and improvement opportunities

**Acceptance Criteria:**
- [ ] Waterfall chart shows material flow from inbound to final output
- [ ] Each step (Granulation, Metal Removal, Purification, Extrusion) shows:
  - Starting amount
  - Loss amount
  - Yield percentage
- [ ] Chart is responsive (works on tablet)
- [ ] Empty state shown if no data available
- [ ] Chart uses average yields across all campaigns

#### US-3: View Throughput Over Time (P1)

**As a** project manager  
**I want to** see material throughput trends  
**So that** I can track operational volume over time

**Acceptance Criteria:**
- [ ] Line chart shows kg processed per month
- [ ] X-axis: months (YYYY-MM format)
- [ ] Y-axis: kg processed
- [ ] Chart is responsive
- [ ] Empty state shown if no data available

#### US-4: View Step Duration Distribution (P2)

**As a** project manager  
**I want to** see how long campaigns spend at each step  
**So that** I can identify bottlenecks in the process

**Acceptance Criteria:**
- [ ] Bar chart or table showing average duration per step
- [ ] Duration calculated from event timestamps
- [ ] Highlights steps with longest duration

#### US-5: Compare Yield by Campaign (P2)

**As a** project manager  
**I want to** compare yields across individual campaigns  
**So that** I can identify outliers and investigate issues

**Acceptance Criteria:**
- [ ] Table showing yield per step for each campaign
- [ ] Sortable by any column
- [ ] Highlights campaigns with below-average yields
- [ ] Links to campaign detail page

---

### Material Calculator

#### US-6: Calculate Required Inbound Material (P1)

**As a** project manager  
**I want to** calculate how much inbound material I need  
**So that** I can plan material orders for target production

**Acceptance Criteria:**
- [ ] Calculator page accessible at `/calculator`
- [ ] Navigation includes "Calculator" link
- [ ] Input field for target units
- [ ] Displays required inbound kg (rounded up)
- [ ] Calculation updates instantly as inputs change

#### US-7: Adjust Yield Assumptions (P1)

**As a** project manager  
**I want to** adjust yield assumptions for each step  
**So that** I can model different scenarios

**Acceptance Criteria:**
- [ ] Slider for each processing step (Granulation, Metal Removal, Purification, Extrusion)
- [ ] Slider range: 50% - 100%
- [ ] Shows current percentage value
- [ ] Default values from most recent campaign (or fallbacks if none)
- [ ] Contamination buffer slider (0% - 20%)
- [ ] Calculation updates as sliders change

#### US-8: View Step-by-Step Breakdown (P1)

**As a** project manager  
**I want to** see the calculation breakdown  
**So that** I understand how the result was derived

**Acceptance Criteria:**
- [ ] Shows kg at each step in the calculation
- [ ] Clear visual flow from target → required input
- [ ] Updates in real-time with yield changes

#### US-9: Select Product Type (P1)

**As a** project manager  
**I want to** select a product type  
**So that** the correct material-per-unit is used

**Acceptance Criteria:**
- [ ] Dropdown with product options
- [ ] "Storage Box (3 kg)" preset
- [ ] "Custom" option with manual kg input
- [ ] Material-per-unit value displayed
- [ ] Calculation updates when product changes

#### US-10: View CO2e Projection (P1)

**As a** project manager  
**I want to** see projected CO2e savings  
**So that** I can communicate environmental impact of planned production

**Acceptance Criteria:**
- [ ] Shows CO2e saved in kg
- [ ] Shows coal equivalent (lbs prevented)
- [ ] Tooltip with calculation assumptions
- [ ] Updates as target units change

#### US-11: Calculate Reverse (kg → Units) (P1)

**As a** project manager  
**I want to** calculate possible output from available material  
**So that** I can plan when I know my inbound quantity

**Acceptance Criteria:**
- [ ] Toggle or tab to switch between Forward and Reverse mode
- [ ] Input field for available kg
- [ ] Displays possible units (rounded down)
- [ ] Uses same yield sliders
- [ ] Shows step-by-step breakdown in reverse direction
- [ ] Shows CO2e projection based on calculated units

#### US-12: Use Latest Averages (P1)

**As a** project manager  
**I want to** populate yield sliders from historical data  
**So that** I can use realistic assumptions based on past performance

**Acceptance Criteria:**
- [ ] "Use Latest Averages" button
- [ ] Fetches yield averages from API
- [ ] Updates all sliders to fetched values
- [ ] Shows loading state during fetch
- [ ] Shows indicator that values are from historical data
- [ ] Graceful fallback if no historical data

#### US-13: Reset to Defaults (P2)

**As a** project manager  
**I want to** reset sliders to default values  
**So that** I can start fresh after experimenting

**Acceptance Criteria:**
- [ ] "Reset to Defaults" button
- [ ] Resets all sliders to fallback values
- [ ] Confirms reset if values were modified

---

## Non-Functional Requirements

### Performance
- Analytics page load: < 2 seconds
- Calculator interactions: < 100ms response
- API response: < 500ms

### Accessibility
- All interactive elements keyboard accessible
- Chart colors meet WCAG contrast requirements
- Screen reader labels for metrics and charts

### Responsiveness
- Analytics dashboard: tablet and desktop (min 768px)
- Calculator: mobile, tablet, and desktop

### Security
- All endpoints require authentication
- No sensitive data in error messages

---

## Out of Scope (MVP)

- Date range filtering for analytics
- Export charts to image/PDF
- Save calculator scenarios
- Multiple products in single calculation
- Real-time updates / WebSockets
- Custom chart configurations
