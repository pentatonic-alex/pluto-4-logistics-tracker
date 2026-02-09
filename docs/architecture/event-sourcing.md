# Event Sourcing Architecture

## Overview

The Pluto 4 Logistics Tracker uses a **TES-like event sourcing pattern** where events are the source of truth and projections are derived views of current state.

This architecture provides:
- **Complete audit trail** - Every change is recorded as an immutable event
- **Natural traceability** - "What happened?" is answered by reading the event stream
- **Temporal queries** - Can reconstruct state at any point in time
- **Correction support** - Mistakes can be corrected without losing history

### Key Components

| Component | Purpose | Implementation |
|-----------|---------|----------------|
| **Event Store** | Append-only log of all changes | `events` table, `src/lib/events.ts` |
| **Projections** | Materialized current state | `campaign_projections` table, `src/lib/projections.ts` |
| **Event Handlers** | Update projections when events occur | `updateProjection()` function |
| **Canonical IDs** | Unique identifiers for entities | `cmp_xxx` for campaigns, `evt_xxx` for events (ULID-based) |

## Event Types

The system defines 13 event types that track a campaign's lifecycle from creation to completion.

### 1. CampaignCreated

**When:** A new campaign is initiated
**Status transition:** → `created`

```typescript
interface CampaignCreatedPayload {
  legoCampaignCode: string;      // LEGO's reference code
  materialType: 'PI' | 'PCR';    // Post-Industrial or Post-Consumer Recycled
  description?: string;           // Optional campaign description
}
```

**Projection updates:**
- Creates new campaign_projections row
- Sets initial status to `created`
- Records creation timestamp

### 2. InboundShipmentRecorded

**When:** Material arrives at MBA from LEGO warehouse
**Status transition:** `created` → `inbound_shipment_recorded`

```typescript
interface InboundShipmentPayload {
  grossWeightKg: number;      // Total weight including packaging
  netWeightKg: number;        // Weight of material only
  estimatedAbsKg?: number;    // Estimated ABS content
  carrier: string;            // Shipping company
  trackingRef: string;        // Tracking number
  shipDate: string;           // ISO date string
  arrivalDate: string;        // ISO date string
}
```

**Projection updates:**
- Updates status to `inbound_shipment_recorded`
- Sets `current_weight_kg` to `netWeightKg`
- Updates next expected step

### 3. GranulationCompleted

**When:** MBA completes granulation process
**Status transition:** `inbound_shipment_recorded` → `granulation_complete`

```typescript
interface GranulationPayload extends ProcessingStepPayload {
  contaminationNotes?: string;  // Notes on contamination found
}

interface ProcessingStepPayload {
  ticketNumber: string;         // MBA process ticket ID
  startingWeightKg: number;     // Input weight
  outputWeightKg: number;       // Output weight (after process)
  processHours?: number;        // Duration of process
  polymerComposition?: string;  // Material composition analysis
  wasteCode?: string;          // Waste classification code
  notes?: string;              // Additional notes
}
```

**Projection updates:**
- Updates status to `granulation_complete`
- Sets `current_weight_kg` to `outputWeightKg` (tracking yield loss)
- Updates next expected step

### 4. MetalRemovalCompleted

**When:** MBA completes metal removal process
**Status transition:** `granulation_complete` → `metal_removal_complete`

```typescript
interface ProcessingStepPayload {
  ticketNumber: string;
  startingWeightKg: number;
  outputWeightKg: number;
  processHours?: number;
  polymerComposition?: string;
  wasteCode?: string;
  notes?: string;
}
```

**Projection updates:**
- Updates status to `metal_removal_complete`
- Sets `current_weight_kg` to `outputWeightKg`
- Updates next expected step

### 5. PolymerPurificationCompleted

**When:** MBA completes polymer purification process
**Status transition:** `metal_removal_complete` → `polymer_purification_complete`

```typescript
interface PolymerPurificationPayload extends ProcessingStepPayload {
  wasteComposition?: string;  // Analysis of waste removed
}
```

**Projection updates:**
- Updates status to `polymer_purification_complete`
- Sets `current_weight_kg` to `outputWeightKg`
- Updates next expected step

### 6. ExtrusionCompleted

**When:** MBA completes extrusion process
**Status transition:** `polymer_purification_complete` → `extrusion_complete`

```typescript
interface ExtrusionPayload extends ProcessingStepPayload {
  batchNumber: string;  // Batch ID for traceability
}
```

**Projection updates:**
- Updates status to `extrusion_complete`
- Sets `current_weight_kg` to `outputWeightKg`
- Updates next expected step to "ECHA Approval"

**Note:** Material cannot transfer to RGE until ECHA approval is recorded.

### 7. ECHAApprovalRecorded

**When:** ECHA testing is completed and approved
**Status transition:** `extrusion_complete` → `echa_approved`

```typescript
interface ECHAApprovalPayload {
  approvedBy: string;      // Person/organization approving
  approvalDate: string;    // ISO date string
  notes?: string;          // Additional approval details
}
```

**Projection updates:**
- Updates status to `echa_approved`
- Sets `echa_approved` flag to `TRUE`
- Updates next expected step to "Transfer to RGE"

**Gate:** This is a required approval gate before material can move to RGE.

### 8. TransferToRGERecorded

**When:** Material ships from MBA to RGE
**Status transition:** `echa_approved` → `transferred_to_rge`

```typescript
interface TransferToRGEPayload {
  trackingRef: string;         // Shipping tracking number
  carrier: string;             // Shipping company
  shipDate: string;            // ISO date string
  receivedDate?: string;       // ISO date string (when known)
  receivedWeightKg?: number;   // Weight received at RGE (when known)
}
```

**Projection updates:**
- Updates status to `transferred_to_rge`
- Updates `current_weight_kg` to `receivedWeightKg` if provided (otherwise unchanged)
- Updates next expected step

### 9. ManufacturingStarted

**When:** RGE begins manufacturing process
**Status transition:** `transferred_to_rge` → `manufacturing_started`

```typescript
interface ManufacturingStartedPayload {
  poNumber: string;      // Purchase order number
  poQuantity: number;    // Ordered quantity
  startDate: string;     // ISO date string
}
```

**Projection updates:**
- Updates status to `manufacturing_started`
- Updates next expected step

**Note:** Weight does not change during manufacturing start.

### 10. ManufacturingCompleted

**When:** RGE completes manufacturing
**Status transition:** `manufacturing_started` → `manufacturing_complete`

```typescript
interface ManufacturingCompletedPayload {
  endDate: string;          // ISO date string
  actualQuantity: number;   // Actual quantity produced
  notes?: string;           // Production notes
}
```

**Projection updates:**
- Updates status to `manufacturing_complete`
- Updates next expected step

**Note:** Weight does not change during manufacturing completion.

### 11. ReturnToLEGORecorded

**When:** Manufactured products return to LEGO warehouse
**Status transition:** `manufacturing_complete` → `returned_to_lego`

```typescript
interface ReturnToLEGOPayload {
  trackingRef: string;      // Shipping tracking number
  carrier: string;          // Shipping company
  shipDate: string;         // ISO date string
  receivedDate?: string;    // ISO date string (when known)
  quantity: number;         // Number of units returned
}
```

**Projection updates:**
- Updates status to `returned_to_lego`
- Updates next expected step

**Note:** Weight not tracked at this stage (finished goods are counted by quantity).

### 12. CampaignCompleted

**When:** Campaign is marked as complete
**Status transition:** `returned_to_lego` → `completed`

```typescript
interface CampaignCompletedPayload {
  completionNotes?: string;  // Final notes or summary
}
```

**Projection updates:**
- Updates status to `completed`
- Sets `completed_at` timestamp
- Sets `next_expected_step` to `NULL` (no further steps)

### 13. EventCorrected

**When:** A correction is needed to a previously recorded event
**Status transition:** No status change (metadata event)

```typescript
interface EventCorrectionPayload {
  correctsEventId: string;           // ID of the event being corrected
  correctsEventType: EventType;      // Type of the event being corrected
  reason: string;                    // Why the correction was made
  changes: Record<string, {          // What changed
    was: unknown;                    // Original value
    now: unknown;                    // Corrected value
  }>;
}
```

**Projection updates:**
- If weight-related fields corrected: Rebuilds `current_weight_kg` by replaying all events
- Otherwise: Updates `updated_at` timestamp only

**TES Compliance:** This event type follows TES principles:
1. Never delete or modify events (immutable log)
2. Record corrections as new events
3. Derive current state by applying corrections during replay

## Status Progression Map

The system enforces a linear progression through campaign stages:

```typescript
const STATUS_PROGRESSION: Record<CampaignStatus, string | null> = {
  created: 'Inbound Shipment',
  inbound_shipment_recorded: 'Granulation',
  granulation_complete: 'Metal Removal',
  metal_removal_complete: 'Polymer Purification',
  polymer_purification_complete: 'Extrusion',
  extrusion_complete: 'ECHA Approval',
  echa_approved: 'Transfer to RGE',
  transferred_to_rge: 'Manufacturing Start',
  manufacturing_started: 'Manufacturing Complete',
  manufacturing_complete: 'Return to LEGO',
  returned_to_lego: 'Complete Campaign',
  completed: null,  // No next step
};
```

This map is used to:
- Display "Next Expected Step" in the UI
- Guide users on what action to record next
- Validate that events are recorded in logical order (future enhancement)

## Projection Update Mechanism

### How Projections Stay in Sync

1. **Event is appended** to the events table via `appendEvent()`
2. **Projection handler is called** via `updateProjection(eventType, streamId, eventData, timestamp)`
3. **Event-specific handler updates** the campaign_projections row
4. **Current state reflects** the cumulative effect of all events

### Event Handler Pattern

```typescript
async function handleProcessingStep(
  campaignId: string,
  payload: ProcessingStepPayload,
  status: CampaignStatus,
  timestamp: string
): Promise<void> {
  await sql`
    UPDATE campaign_projections SET
      status = ${status},
      current_step = ${STEP_NAMES[status]},
      current_weight_kg = ${payload.outputWeightKg},
      next_expected_step = ${STATUS_PROGRESSION[status]},
      last_event_type = ${eventType},
      last_event_at = ${timestamp},
      updated_at = ${timestamp}
    WHERE id = ${campaignId}
  `;
}
```

### Key Principles

- **Idempotent:** Handlers can be safely replayed
- **Derived:** Projections are always computed from events
- **Optimized:** Projections provide fast reads without scanning events

## Event Corrections

### Why Corrections Are Needed

Manual data entry means mistakes happen:
- Typos in weight values
- Wrong tracking numbers
- Incorrect dates

### TES-Compliant Correction Flow

1. **Don't delete or modify** the original event (immutable log)
2. **Append an EventCorrected** event with:
   - Reference to the event being corrected
   - The reason for the correction
   - A `changes` map showing `was` → `now` for each field
3. **Rebuild projection** by replaying events with corrections applied

### Example: Correcting a Weight

Original event:
```typescript
{
  id: "evt_01HQJK...",
  eventType: "InboundShipmentRecorded",
  eventData: {
    netWeightKg: 1000,  // Typo: should be 10000
    // ... other fields
  }
}
```

Correction event:
```typescript
{
  id: "evt_01HQJL...",
  eventType: "EventCorrected",
  eventData: {
    correctsEventId: "evt_01HQJK...",
    correctsEventType: "InboundShipmentRecorded",
    reason: "Typo in weight entry - was 1000kg, should be 10000kg",
    changes: {
      netWeightKg: {
        was: 1000,
        now: 10000
      }
    }
  }
}
```

### The rebuildCurrentWeight() Function

When a weight-related correction occurs, the system rebuilds `current_weight_kg` by:

1. **Fetching all events** for the campaign in chronological order
2. **Building a correction map** from all EventCorrected events
3. **Replaying weight-affecting events** with corrections applied
4. **Returning the final weight** derived from the corrected event stream

```typescript
async function rebuildCurrentWeight(campaignId: string): Promise<number | null> {
  const events = await getEventsForStream('campaign', campaignId);

  // Build correction map: eventId -> { field -> corrected value }
  const corrections = new Map<string, Record<string, unknown>>();

  events.forEach(event => {
    if (event.eventType === 'EventCorrected') {
      const payload = event.eventData as EventCorrectionPayload;
      const correctedValues: Record<string, unknown> = {};

      for (const [field, change] of Object.entries(payload.changes)) {
        correctedValues[field] = change.now;
      }

      const existing = corrections.get(payload.correctsEventId) || {};
      corrections.set(payload.correctsEventId, { ...existing, ...correctedValues });
    }
  });

  // Replay events to calculate current weight
  let currentWeight: number | null = null;

  events.forEach(event => {
    if (event.eventType === 'EventCorrected') return; // Skip correction events

    const eventCorrections = corrections.get(event.id) || {};
    const data = { ...event.eventData, ...eventCorrections };

    // Extract weight from relevant event types
    if (event.eventType === 'InboundShipmentRecorded') {
      currentWeight = (data.netWeightKg as number) || currentWeight;
    } else if (['GranulationCompleted', 'MetalRemovalCompleted',
                'PolymerPurificationCompleted', 'ExtrusionCompleted'].includes(event.eventType)) {
      currentWeight = (data.outputWeightKg as number) || currentWeight;
    } else if (event.eventType === 'TransferToRGERecorded' && data.receivedWeightKg) {
      currentWeight = data.receivedWeightKg as number;
    }
  });

  return currentWeight;
}
```

**Key insight:** By replaying events with corrections applied, we maintain a complete audit trail while ensuring the projection reflects the corrected values.

## Code Examples

### Appending an Event

```typescript
import { appendEvent } from '@/lib/events';

// Record an inbound shipment
const event = await appendEvent({
  streamType: 'campaign',
  streamId: 'cmp_01HQJKXXX',
  eventType: 'InboundShipmentRecorded',
  eventData: {
    grossWeightKg: 10500,
    netWeightKg: 10000,
    carrier: 'DHL',
    trackingRef: 'DHL-123456',
    shipDate: '2026-02-01',
    arrivalDate: '2026-02-03',
  },
  userId: 'usr_alex',
});

// Update the projection
await updateProjection(
  event.eventType,
  event.streamId,
  event.eventData,
  event.createdAt
);
```

### Reading Campaign State

```typescript
import { getCampaignById } from '@/lib/projections';

// Get current campaign state (from projection)
const campaign = await getCampaignById('cmp_01HQJKXXX');

console.log(campaign.status);           // 'inbound_shipment_recorded'
console.log(campaign.currentWeightKg);  // 10000
console.log(campaign.nextExpectedStep); // 'Granulation'
```

### Reading Event History

```typescript
import { getEventsForStream } from '@/lib/events';

// Get full event history for audit/traceability
const events = await getEventsForStream('campaign', 'cmp_01HQJKXXX');

events.forEach(event => {
  console.log(`${event.createdAt}: ${event.eventType}`);
  console.log(event.eventData);
});
```

### Correcting a Mistake

```typescript
// Append a correction event
const correctionEvent = await appendEvent({
  streamType: 'campaign',
  streamId: 'cmp_01HQJKXXX',
  eventType: 'EventCorrected',
  eventData: {
    correctsEventId: 'evt_01HQJK123',
    correctsEventType: 'GranulationCompleted',
    reason: 'Corrected output weight - scale calibration error',
    changes: {
      outputWeightKg: {
        was: 9500,
        now: 9800,
      }
    }
  },
  userId: 'usr_alex',
});

// Projection will automatically rebuild current_weight_kg
await updateProjection(
  correctionEvent.eventType,
  correctionEvent.streamId,
  correctionEvent.eventData,
  correctionEvent.createdAt
);
```

## Design Principles

### Events Are the Source of Truth

- Projections are derived views, events are canonical
- If projection and events disagree, events are always correct
- Projections can be rebuilt by replaying events

### Append-Only Event Log

- Events are never deleted or modified
- Corrections are recorded as new events
- Complete audit trail is always available

### Separation of Write and Read Models

- **Write:** Append events (fast, simple)
- **Read:** Query projections (optimized for display)
- This is the core of CQRS (Command Query Responsibility Segregation)

### Idempotent Event Handlers

- Replaying the same event multiple times produces the same result
- Enables event replay for projection rebuilding
- Simplifies error recovery

## Future Enhancements

### Full TES Integration

Currently using a local Postgres event store. Future integration with Pentatonic's TES (Temporal Event Store) would provide:
- Distributed event streaming
- Cross-service event subscriptions
- Centralized audit logging

### Temporal Queries

With event history, we can answer questions like:
- "What was the campaign status on Feb 1st?"
- "How long did each processing step take?"
- "What was the yield rate for this batch?"

### Event Replay

For debugging or migration:
- Delete all projections
- Replay all events to rebuild projections
- Useful for schema changes or bug fixes

### Snapshot Events

For campaigns with many events, create periodic snapshot events:
- Reduces replay time
- Start from last snapshot, then apply subsequent events
- Optimization for long-running campaigns

## Related Documentation

- **Brainstorm:** `docs/brainstorms/2026-02-02-logistics-tracker-brainstorm.md`
- **Database Schema:** `db/migrations/001_initial_schema.sql`
- **Implementation:**
  - Event Store: `src/lib/events.ts`
  - Projections: `src/lib/projections.ts`
  - Types: `src/types/index.ts`
