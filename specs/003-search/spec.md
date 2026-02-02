# Global Search - User Stories & Acceptance Criteria

## User Stories

### US-1: Search by Campaign Identifier (P1)

**As a** project manager  
**I want to** search for campaigns by ID or LEGO code  
**So that** I can quickly find a specific campaign

**Acceptance Criteria:**
- [ ] Search bar visible in navigation on desktop
- [ ] Typing 2+ characters triggers search
- [ ] Results show campaign code and status
- [ ] Clicking result navigates to campaign detail page
- [ ] Campaign ID matches (cmp_xxx) are found
- [ ] LEGO campaign code matches are found
- [ ] Description text matches are found

### US-2: Search by Tracking Number (P1)

**As a** project manager  
**I want to** search for campaigns by tracking number  
**So that** I can find a campaign when I only have the shipping reference

**Acceptance Criteria:**
- [ ] Tracking numbers from inbound shipments are searchable
- [ ] Tracking numbers from MBA→RGE transfers are searchable
- [ ] Tracking numbers from RGE→LEGO returns are searchable
- [ ] Results show which tracking number matched
- [ ] Partial tracking number matches work

### US-3: Search by PO Number (P1)

**As a** project manager  
**I want to** search for campaigns by purchase order number  
**So that** I can find campaigns when coordinating with RGE manufacturing

**Acceptance Criteria:**
- [ ] PO numbers from manufacturing events are searchable
- [ ] Results show which PO number matched
- [ ] Partial PO number matches work

### US-4: Keyboard Navigation (P2)

**As a** power user  
**I want to** navigate search results with keyboard  
**So that** I can work faster without using the mouse

**Acceptance Criteria:**
- [ ] Cmd/Ctrl+K opens/focuses search
- [ ] Arrow keys navigate results
- [ ] Enter selects highlighted result
- [ ] Escape closes dropdown
- [ ] Tab moves to next result (optional)

### US-5: Search UX Polish (P2)

**As a** user  
**I want** clear feedback during search  
**So that** I know what's happening

**Acceptance Criteria:**
- [ ] Loading spinner shown while searching
- [ ] "No results" message when query has no matches
- [ ] Results grouped by match type (Campaign, Tracking, PO)
- [ ] Match value highlighted in results
- [ ] Search input clears on navigation

### US-6: Mobile Search (P3)

**As a** mobile user  
**I want to** access search on mobile devices  
**So that** I can find campaigns from my phone

**Acceptance Criteria:**
- [ ] Search accessible from mobile menu
- [ ] Touch-friendly result items
- [ ] Dropdown doesn't overflow screen

## Non-Functional Requirements

### Performance
- Search results appear within 500ms of typing pause
- Database query executes in < 200ms

### Security
- Search endpoint requires authentication
- Query is sanitized (no SQL injection)
- No sensitive data in error messages

### Accessibility
- Search input has proper aria labels
- Results announced to screen readers
- Focus management is correct

## Out of Scope

- Fuzzy/typo-tolerant search
- Search history / recent searches
- Saved searches
- Advanced filters (date range, status, etc.)
- Full-text search on event notes
