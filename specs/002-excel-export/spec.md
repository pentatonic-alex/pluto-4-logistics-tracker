# Excel Export - User Stories & Acceptance Criteria

## User Stories

### US-1: Export Single Campaign (P1)

**As a** project manager  
**I want to** export a single campaign to Excel  
**So that** I can share campaign details with stakeholders or create a backup

**Acceptance Criteria:**
- [ ] Export button visible on campaign detail page
- [ ] Button downloads .xlsx file immediately
- [ ] File contains all 7 sheets matching import format
- [ ] Only data for the selected campaign is included
- [ ] Filename includes campaign code and date
- [ ] Works for campaigns in any status

### US-2: Export Multiple Campaigns (P1)

**As a** project manager  
**I want to** export all campaigns (or filtered selection) to Excel  
**So that** I can create a complete backup or share overview with stakeholders

**Acceptance Criteria:**
- [ ] Export button visible on dashboard
- [ ] Downloads .xlsx with all campaigns' data
- [ ] Each sheet contains rows for all campaigns
- [ ] Filename includes date
- [ ] Option to export only active campaigns (non-completed)

### US-3: Round-Trip Compatibility (P1)

**As a** project manager  
**I want** exported files to be re-importable  
**So that** I can make edits in Excel and import changes back

**Acceptance Criteria:**
- [ ] Exported file has same sheet names as import expects
- [ ] Column order matches import parser expectations
- [ ] Data types are preserved (dates, numbers)
- [ ] Re-importing exported file produces no errors
- [ ] Re-importing exported file with edits applies changes

### US-4: Export Loading State (P2)

**As a** user  
**I want to** see loading feedback during export  
**So that** I know the export is in progress

**Acceptance Criteria:**
- [ ] Button shows loading spinner during export
- [ ] Button is disabled while loading
- [ ] Error message shown if export fails

## Non-Functional Requirements

### Performance
- Single campaign export: < 2 seconds
- Bulk export (100 campaigns): < 10 seconds

### Security
- All export endpoints require authentication
- No sensitive data exposed in error messages

## Out of Scope

- Scheduled/automated exports
- Email delivery of exports
- CSV export format
- Custom column selection
