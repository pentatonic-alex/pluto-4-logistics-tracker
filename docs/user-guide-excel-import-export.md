# Excel Import/Export User Guide

**LEGO REPLAY Logistics Tracker**

Version 1.0 | Last Updated: 2026-02-09

---

## Table of Contents

1. [Overview](#overview)
2. [Excel File Format](#excel-file-format)
3. [Sheet Reference](#sheet-reference)
4. [Data Types & Validation](#data-types--validation)
5. [Import Workflow](#import-workflow)
6. [Export Workflow](#export-workflow)
7. [Examples](#examples)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The Excel import/export feature allows you to:

- **Import**: Upload existing Excel tracker data to create campaigns and record processing events
- **Export**: Download campaign data as Excel files for sharing, archiving, or round-trip editing
- **Round-trip editing**: Export data, edit it in Excel, and re-import to update the tracker

### Key Features

- **Preview-and-confirm workflow**: Review all proposed changes before applying
- **Campaign matching**: Automatically matches rows to existing campaigns by Campaign Code
- **Event-sourced updates**: All changes are properly logged as events
- **Validation**: Invalid rows are flagged with clear error messages
- **Bulk operations**: Import or export multiple campaigns at once

---

## Excel File Format

The Excel file must contain **7 specific sheets** in any order. Each sheet tracks different stages of the PCR material supply chain:

| Sheet Name | Purpose | Required Campaign Code Column |
|------------|---------|------------------------------|
| Inbound Shipment | Initial shipment from LEGO to MBA | Column A |
| Granulation | MBA granulation process | Column D |
| Metal Removal | MBA metal removal process | Column B |
| Polymer purification | MBA polymer purification | Column B |
| Extrusion | MBA extrusion process | Column B |
| Transfer MBA-RGE | Transfer from MBA to RGE | Column A |
| RGE Manufacturing | RGE manufacturing process | Column A |

**Important Notes:**

- Sheet names are **case-sensitive** and must match exactly
- Column order matters and must match the specifications below
- First row of each sheet must be the header row
- Empty rows are automatically skipped
- Campaign Code is **required** in each row to match data to campaigns

---

## Sheet Reference

### 1. Inbound Shipment

Records initial shipments from LEGO warehouse to MBA (compounder).

**Column Order:**

| Column | Header | Data Type | Required | Description |
|--------|--------|-----------|----------|-------------|
| A | Campaign Code | Text | **Yes** | Unique campaign identifier (e.g., "20251231-DEV-ORDER-MX") |
| B | Requested Arrival Date | Date | No | Date LEGO requested delivery |
| C | Gross Weight (kg) | Number | No | Total weight including packaging |
| D | Net Weight (kg) | Number | No | Material weight only |
| E | Estimated ABS (kg) | Number | No | Estimated ABS content |
| F | Material Portfolio Link | Text | No | Link to material documentation |
| G | Accepted Arrival Date | Date | No | Date MBA accepted delivery |
| H | Tracking Ref | Text | No | Shipping tracking reference |
| I | Carrier | Text | No | Shipping carrier name |
| J | Ship Date | Date | No | Date shipped from LEGO |
| K | Arrival Date | Date | No | Date arrived at MBA |

**Example:**
```
20251231-DEV-ORDER-MX | 2025-12-01 | 1500 | 1450 | 800 | https://... | 2025-12-02 | TRACK123 | DHL | 2025-11-28 | 2025-12-02
```

---

### 2. Granulation

Records the granulation process at MBA.

**Column Order:**

| Column | Header | Data Type | Required | Description |
|--------|--------|-----------|----------|-------------|
| A | Ticket Number | Text | No | MBA process ticket number |
| B | Shipping ID | Text | No | Related shipping identifier |
| C | Material Type | Text | No | "PCR" or "PI" (Post-Consumer / Post-Industrial) |
| D | Campaign Code | Text | **Yes** | Campaign identifier |
| E | Date | Date | No | Process completion date |
| F | Site | Text | No | Processing site name |
| G | Location | Text | No | Specific location within site |
| H | Process | Text | No | Process type/description |
| I | Starting Weight (kg) | Number | No | Input material weight |
| J | Output Weight (kg) | Number | No | Output material weight |
| K | Contamination Notes | Text | No | Contamination observations |
| L | Polymer Composition | Text | No | Material composition details |
| M | Process Hours | Number | No | Duration of process |
| N | Yield % | Number | No | Yield percentage |
| O | Loss % | Number | No | Loss percentage |
| P | Waste Code | Text | No | Waste classification code |
| Q | Delivery Location | Text | No | Where material was delivered |
| R | Delivery Date | Date | No | Date material delivered |
| S | Notes | Text | No | Additional notes |

**Example:**
```
TKT-001 | SHIP-123 | PCR | 20251231-DEV-ORDER-MX | 2025-12-05 | MBA Site 1 | Line A | Grinding | 1450 | 1420 | Minor metal | ABS/PC | 4.5 | 97.9 | 2.1 | WC-01 | Storage A | 2025-12-05 | Normal process
```

---

### 3. Metal Removal

Records the metal removal process at MBA.

**Column Order:**

| Column | Header | Data Type | Required | Description |
|--------|--------|-----------|----------|-------------|
| A | Ticket Number | Text | No | MBA process ticket number |
| B | Campaign Code | Text | **Yes** | Campaign identifier |
| C | Date | Date | No | Process completion date |
| D | Site | Text | No | Processing site name |
| E | Location | Text | No | Specific location within site |
| F | Process | Text | No | Process type/description |
| G | Starting Weight (kg) | Number | No | Input material weight |
| H | Polymer Composition | Text | No | Material composition |
| I | Output Weight (kg) | Number | No | Output material weight |
| J | Process Hours | Number | No | Duration of process |
| K | Yield % | Number | No | Yield percentage |
| L | Loss % | Number | No | Loss percentage |
| M | Waste Code | Text | No | Waste classification code |
| N | Delivery Location | Text | No | Where material was delivered |
| O | Notes | Text | No | Additional notes |

**Example:**
```
TKT-002 | 20251231-DEV-ORDER-MX | 2025-12-06 | MBA Site 1 | Line B | Magnetic | 1420 | ABS/PC | 1410 | 2.0 | 99.3 | 0.7 | WC-02 | Storage A | Metal removed
```

---

### 4. Polymer purification

Records the polymer purification process at MBA.

**Column Order:**

| Column | Header | Data Type | Required | Description |
|--------|--------|-----------|----------|-------------|
| A | Ticket Number | Text | No | MBA process ticket number |
| B | Campaign Code | Text | **Yes** | Campaign identifier |
| C | Date | Date | No | Process completion date |
| D | Site | Text | No | Processing site name |
| E | Location | Text | No | Specific location within site |
| F | Process | Text | No | Process type/description |
| G | Starting Weight (kg) | Number | No | Input material weight |
| H | Polymer Composition | Text | No | Input composition |
| I | Output Weight (kg) | Number | No | Output material weight |
| J | Output Polymer Composition | Text | No | Output composition |
| K | Waste Composition | Text | No | Waste material composition |
| L | Process Hours | Number | No | Duration of process |
| M | Yield % | Number | No | Yield percentage |
| N | Loss % | Number | No | Loss percentage |
| O | Waste Code | Text | No | Waste classification code |
| P | Delivery Location | Text | No | Where material was delivered |
| Q | Notes | Text | No | Additional notes |

**Example:**
```
TKT-003 | 20251231-DEV-ORDER-MX | 2025-12-07 | MBA Site 1 | Line C | Separation | 1410 | ABS/PC | 1380 | Pure ABS | PC waste | 3.5 | 97.9 | 2.1 | WC-03 | Storage B | Good quality
```

---

### 5. Extrusion

Records the extrusion process at MBA.

**Column Order:**

| Column | Header | Data Type | Required | Description |
|--------|--------|-----------|----------|-------------|
| A | Ticket Number | Text | No | MBA process ticket number |
| B | Campaign Code | Text | **Yes** | Campaign identifier |
| C | Date | Date | No | Process completion date |
| D | Site | Text | No | Processing site name |
| E | Location | Text | No | Specific location within site |
| F | Process | Text | No | Process type/description |
| G | Starting Weight (kg) | Number | No | Input material weight |
| H | Polymer Composition | Text | No | Material composition |
| I | Output Weight (kg) | Number | No | Output pellet weight |
| J | Process Hours | Number | No | Duration of process |
| K | Yield % | Number | No | Yield percentage |
| L | Loss % | Number | No | Loss percentage |
| M | Batch Number | Text | No | Output batch number |
| N | Delivery Location | Text | No | Where pellets delivered |
| O | ECHA Complete | Boolean | No | ECHA registration status |
| P | Delivery Date | Date | No | Date pellets delivered |
| Q | Notes | Text | No | Additional notes |

**Example:**
```
TKT-004 | 20251231-DEV-ORDER-MX | 2025-12-08 | MBA Site 1 | Line D | Twin-screw | 1380 | Pure ABS | 1360 | 6.0 | 98.6 | 1.4 | BATCH-2025-12-08 | RGE Transfer | Yes | 2025-12-10 | Ready for RGE
```

---

### 6. Transfer MBA-RGE

Records transfer of pellets from MBA to RGE (manufacturer).

**Column Order:**

| Column | Header | Data Type | Required | Description |
|--------|--------|-----------|----------|-------------|
| A | Campaign Code | Text | **Yes** | Campaign identifier |
| B | Tracking Ref | Text | No | Shipping tracking reference |
| C | Carrier | Text | No | Shipping carrier name |
| D | Received Date | Date | No | Date received at RGE |
| E | Received Gross Weight (kg) | Number | No | Total weight received |
| F | Received Net Weight (kg) | Number | No | Net weight received |

**Example:**
```
20251231-DEV-ORDER-MX | TRACK456 | FedEx | 2025-12-12 | 1370 | 1360
```

---

### 7. RGE Manufacturing

Records manufacturing activities at RGE.

**Column Order:**

| Column | Header | Data Type | Required | Description |
|--------|--------|-----------|----------|-------------|
| A | Campaign Code | Text | **Yes** | Campaign identifier |
| B | PO Number | Text | No | Purchase order number |
| C | PO Quantity | Number | No | Ordered quantity |
| D | Start Date | Date | No | Manufacturing start date |
| E | End Date | Date | No | Manufacturing completion date |
| F | Requested Pickup Date | Date | No | LEGO requested pickup date |
| G | Actual Pickup Date | Date | No | Actual pickup date |

**Example:**
```
20251231-DEV-ORDER-MX | PO-2025-1234 | 50000 | 2025-12-15 | 2025-12-20 | 2025-12-22 | 2025-12-22
```

---

## Data Types & Validation

### Text Fields

- Accept any alphanumeric characters and symbols
- Empty or "n/a" values are treated as blank
- Leading/trailing whitespace is automatically trimmed

### Date Fields

- **Accepted formats**:
  - ISO date: `YYYY-MM-DD` (e.g., `2025-12-31`)
  - Excel date serial numbers (automatically converted)
  - Excel date values (automatically converted)
- **Invalid values**: Treated as blank, not as errors

### Number Fields

- Accept integers and decimals
- Negative numbers are allowed (but may not make sense for weights)
- "n/a" or empty values are treated as blank

### Boolean Fields (ECHA Complete)

- **True values**: `Yes`, `True`, `1`, `Complete` (case-insensitive)
- **False values**: `No`, `False`, `0`, empty
- **Invalid values**: Treated as blank

### Material Type

- **Valid values**:
  - `PCR` or `Post-Consumer`
  - `PI` or `Post-Industrial`
- Case-insensitive
- Common typos like "Post-Indrustial" are auto-corrected

### Campaign Code Format

- Format: `YYYYMMDD-XXX-ORDER-YY`
- Example: `20251231-DEV-ORDER-MX`
- Must be unique across all campaigns
- Used to match rows to existing campaigns during import

---

## Import Workflow

### Step 1: Prepare Your Excel File

1. Ensure all 7 sheets exist with correct names
2. Fill in Campaign Code for every row
3. Include header rows (row 1) in each sheet
4. Use correct column order
5. Format dates as `YYYY-MM-DD` or Excel dates

### Step 2: Upload File

1. Navigate to the Dashboard
2. Click **"Import from Excel"** button
3. Select your `.xlsx` file
4. File is parsed client-side (no upload to server yet)

### Step 3: Review Preview

The system shows you:

- **New Campaigns**: Rows that will create new campaigns
- **New Events**: Processing events for existing campaigns
- **Updates**: Changes to existing data (with side-by-side diff)
- **Skipped Rows**: Invalid rows with error explanations

For each row, you can:

- ✅ **Confirm**: Include this change
- ❌ **Reject**: Skip this change

### Step 4: Apply Changes

1. Review all changes carefully
2. Confirm or reject each row individually
3. Click **"Apply Confirmed Changes"**
4. All confirmed changes are saved as events
5. View confirmation summary

### Important Notes

- **Matching by Campaign Code**: Rows are matched to existing campaigns using the Campaign Code
- **No automatic updates**: All changes require explicit confirmation
- **Invalid rows don't block import**: Other valid rows can still be imported
- **Event-sourced**: All changes are logged as proper events (CampaignCreated, GranulationCompleted, etc.)

---

## Export Workflow

### Export Single Campaign

1. Navigate to a campaign detail page
2. Click **"Export to Excel"** button
3. Excel file downloads immediately
4. Filename format: `campaign-{code}-{date}.xlsx`

### Export Multiple Campaigns

1. Navigate to Dashboard
2. Select campaigns using checkboxes
3. Click **"Export Selected"** button
4. Excel file downloads with all selected campaigns
5. Filename format: `campaigns-export-{date}.xlsx`

### What Gets Exported

- All campaign data across all 7 sheets
- Only events that have been recorded (empty sheets if no events)
- Round-trip compatible format (can be re-imported)

---

## Examples

### Example 1: Creating a New Campaign

**Inbound Shipment sheet:**

```
Campaign Code              | Requested Arrival Date | Gross Weight (kg) | Net Weight (kg)
20260201-PCR-ORDER-US     | 2026-02-15            | 2000             | 1950
```

**Result**: Creates new campaign with ID and records InboundShipmentRecorded event.

---

### Example 2: Recording Processing Events

**Granulation sheet (for existing campaign):**

```
Ticket Number | ... | Campaign Code              | Date       | Output Weight (kg)
TKT-G-001    | ... | 20260201-PCR-ORDER-US     | 2026-02-20 | 1920
```

**Result**: Records GranulationCompleted event for the existing campaign.

---

### Example 3: Complete Supply Chain

A single campaign tracked through all stages:

1. **Inbound Shipment**: `20260201-PCR-ORDER-US` arrives at MBA
2. **Granulation**: Process TKT-G-001 completes
3. **Metal Removal**: Process TKT-M-001 completes
4. **Polymer Purification**: Process TKT-P-001 completes
5. **Extrusion**: Process TKT-E-001 produces batch BATCH-001
6. **Transfer MBA-RGE**: Material ships to RGE
7. **RGE Manufacturing**: PO-2026-001 manufacturing completes

Each sheet contains one row with the same Campaign Code.

---

### Example 4: Multiple Events Per Campaign

A campaign can have multiple processing events of the same type:

**Granulation sheet:**

```
Ticket Number | Campaign Code              | Date       | Output Weight (kg)
TKT-G-001    | 20260201-PCR-ORDER-US     | 2026-02-20 | 960
TKT-G-002    | 20260201-PCR-ORDER-US     | 2026-02-21 | 960
```

**Result**: Records two separate GranulationCompleted events (material processed in two batches).

---

### Example 5: Bulk Import

**Inbound Shipment sheet:**

```
Campaign Code              | Gross Weight (kg) | Net Weight (kg)
20260201-PCR-ORDER-US     | 2000             | 1950
20260202-PCR-ORDER-MX     | 1500             | 1460
20260203-PI-ORDER-EU      | 3000             | 2950
```

**Result**: Creates three new campaigns in one import operation.

---

## Troubleshooting

### Import Issues

#### "Sheet not found: [Sheet Name]"

**Cause**: One of the required 7 sheets is missing or has incorrect name.

**Solution**:
- Check sheet names are **exactly**: `Inbound Shipment`, `Granulation`, `Metal Removal`, `Polymer purification`, `Extrusion`, `Transfer MBA-RGE`, `RGE Manufacturing`
- Sheet names are case-sensitive
- Watch for extra spaces

---

#### "Skipped: Missing required Campaign Code"

**Cause**: Campaign Code column is empty for this row.

**Solution**:
- Fill in Campaign Code in the correct column:
  - Inbound Shipment: Column A
  - Granulation: Column D
  - Metal Removal, Polymer purification, Extrusion: Column B
  - Transfer MBA-RGE, RGE Manufacturing: Column A

---

#### "Campaign not found: [Code]"

**Cause**: Attempting to record events for a campaign that doesn't exist in the system.

**Solution**:
- Create the campaign first via Inbound Shipment sheet
- Or create the campaign manually in the app
- Check for typos in Campaign Code

---

#### "Invalid date format"

**Cause**: Date value cannot be parsed.

**Solution**:
- Use ISO format: `YYYY-MM-DD` (e.g., `2025-12-31`)
- Or use Excel date formatting
- Empty cells are OK (will be treated as blank)

---

#### "Invalid material type: [Value]"

**Cause**: Material Type value is not recognized.

**Solution**:
- Use `PCR` or `PI`
- Alternative: `Post-Consumer` or `Post-Industrial`
- Case-insensitive
- Leave blank if unknown

---

### Export Issues

#### "No campaigns selected"

**Cause**: Tried to export without selecting any campaigns.

**Solution**:
- Use checkboxes to select at least one campaign
- Or use single campaign export from detail page

---

#### "Export failed"

**Cause**: Server error during export generation.

**Solution**:
- Refresh page and try again
- Check browser console for error details
- Contact support if issue persists

---

### Data Quality Issues

#### Weights don't add up

**Cause**: Weight values across process stages are inconsistent.

**Solution**:
- Review all weight fields: Gross, Net, Starting, Output
- Remember: Starting Weight of one stage should match Output Weight of previous stage
- Account for process losses (Loss %)

---

#### Missing events in export

**Cause**: Events were never recorded in the system.

**Solution**:
- Check event log on campaign detail page
- Import missing events via Excel
- Manually record events in the app

---

#### Duplicate campaign codes

**Cause**: Same Campaign Code appears in multiple rows in Inbound Shipment sheet.

**Solution**:
- Each Campaign Code must be unique
- Use different codes for different campaigns
- Use date/location/order identifiers to make codes unique

---

## Best Practices

### For Import

1. **Start small**: Test with 1-2 campaigns first
2. **Review carefully**: Check the preview before applying
3. **One stage at a time**: Import Inbound Shipments, then processing events
4. **Consistent codes**: Use a standard format for Campaign Codes
5. **Validate dates**: Ensure chronological order (ship → arrive → process)
6. **Keep backup**: Save original Excel files

### For Export

1. **Regular backups**: Export all campaigns periodically
2. **Round-trip test**: Export → Edit → Import to verify compatibility
3. **Document changes**: Use Notes columns to track updates
4. **Version control**: Include date in exported filename

### For Data Quality

1. **Standardize site names**: Use consistent naming (e.g., "MBA Site 1" not "MBA-1", "MBA Site 1")
2. **Track all weights**: Record Starting and Output weights for every process
3. **Document issues**: Use Notes fields to explain anomalies
4. **ECHA tracking**: Always record ECHA Complete status for Extrusion

---

## Support

For additional help:

- Check the event log on campaign detail pages to verify what was imported
- Review error messages in the import preview for specific guidance
- Refer to the inline column headers in exported files as a template

---

**Document Version**: 1.0
**Last Updated**: 2026-02-09
**Applies to**: LEGO REPLAY Logistics Tracker v1.0
