# Audit Log - User Stories & Acceptance Criteria

## User Stories

### US-1: View All Corrections (P1)

**As a** project manager  
**I want to** see all data corrections made across all campaigns  
**So that** I can track changes for compliance and quality assurance

**Acceptance Criteria:**
- [ ] Audit Log page accessible at `/audit`
- [ ] Table displays all EventCorrected events
- [ ] Results sorted by newest first
- [ ] Each row shows: timestamp, campaign, corrected event type, reason, changes, user
- [ ] Campaign name links to campaign detail page
- [ ] Changes displayed as was → now diff

### US-2: Filter by Campaign (P1)

**As a** project manager  
**I want to** filter corrections by specific campaign  
**So that** I can focus on changes for a particular campaign during review

**Acceptance Criteria:**
- [ ] Campaign filter dropdown shows all campaigns
- [ ] Selecting a campaign filters results immediately
- [ ] "All Campaigns" option shows unfiltered results
- [ ] Filter state reflected in URL for shareability

### US-3: Filter by Date Range (P1)

**As a** project manager  
**I want to** filter corrections by date range  
**So that** I can review changes made during a specific audit period

**Acceptance Criteria:**
- [ ] Start date and end date inputs available
- [ ] Date filters work independently or together
- [ ] Filtering applies immediately on date change
- [ ] Clear way to reset date filters

### US-4: Pagination (P1)

**As a** project manager  
**I want to** paginate through large result sets  
**So that** I can navigate efficiently through many corrections

**Acceptance Criteria:**
- [ ] 20 items per page by default
- [ ] Previous/Next page controls
- [ ] Current page and total pages displayed
- [ ] Page controls disabled when at first/last page

### US-5: Navigation Access (P1)

**As a** user  
**I want to** access the audit log from the main navigation  
**So that** I can quickly find it from any page

**Acceptance Criteria:**
- [ ] "Audit Log" link in main navigation
- [ ] Link positioned after Calculator, before Archive
- [ ] Active state shown when on audit page

### US-6: Loading State (P2)

**As a** user  
**I want to** see loading feedback while data loads  
**So that** I know the page is working

**Acceptance Criteria:**
- [ ] Skeleton loader shown during initial load
- [ ] Loading indicator shown during filter changes
- [ ] No layout shift when data arrives

## Non-Functional Requirements

### Performance
- Initial page load: < 1 second for first 20 results
- Filter changes: < 500ms response time
- Pagination: < 500ms per page load

### Accessibility
- Table has proper ARIA labels
- Date inputs are keyboard accessible
- Focus management on filter changes

### Security
- All endpoints require authentication
- No sensitive data in error messages
- Campaign IDs validated server-side

## Out of Scope

- Export audit log to Excel/CSV
- Email notifications for corrections
- Undo/revert corrections from audit log
- Advanced search within change data
