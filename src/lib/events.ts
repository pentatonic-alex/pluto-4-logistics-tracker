import { sql } from './db';
import { generateEventId } from './ids';
import type { BaseEvent, EventType } from '@/types';

/**
 * Event Store Functions
 * 
 * TES-like event sourcing for the logistics tracker.
 * Events are the source of truth - projections are derived from events.
 */

export interface AppendEventParams {
  streamType: 'campaign';
  streamId: string;
  eventType: EventType;
  eventData: Record<string, unknown>;
  userId: string;
}

/**
 * Append a new event to the event store
 * 
 * @returns The created event with generated ID and timestamp
 */
export async function appendEvent({
  streamType,
  streamId,
  eventType,
  eventData,
  userId,
}: AppendEventParams): Promise<BaseEvent> {
  const id = generateEventId();
  const timestamp = new Date().toISOString();
  const metadata = { userId, timestamp };

  await sql`
    INSERT INTO events (id, stream_type, stream_id, event_type, event_data, metadata, created_at)
    VALUES (
      ${id},
      ${streamType},
      ${streamId},
      ${eventType},
      ${JSON.stringify(eventData)},
      ${JSON.stringify(metadata)},
      ${timestamp}
    )
  `;

  return {
    id,
    streamType,
    streamId,
    eventType,
    eventData,
    metadata,
    createdAt: timestamp,
  };
}

/**
 * Get all events for a specific stream (e.g., all events for a campaign)
 * Events are returned in chronological order (oldest first)
 */
export async function getEventsForStream(
  streamType: 'campaign',
  streamId: string
): Promise<BaseEvent[]> {
  const rows = await sql`
    SELECT id, stream_type, stream_id, event_type, event_data, metadata, created_at
    FROM events
    WHERE stream_type = ${streamType} AND stream_id = ${streamId}
    ORDER BY created_at ASC
  `;

  return rows.map(mapRowToEvent);
}

/**
 * Get all events of a specific type across all streams
 * Useful for reporting and analytics
 */
export async function getEventsByType(eventType: EventType): Promise<BaseEvent[]> {
  const rows = await sql`
    SELECT id, stream_type, stream_id, event_type, event_data, metadata, created_at
    FROM events
    WHERE event_type = ${eventType}
    ORDER BY created_at DESC
  `;

  return rows.map(mapRowToEvent);
}

/**
 * Get the latest event for a stream
 */
export async function getLatestEventForStream(
  streamType: 'campaign',
  streamId: string
): Promise<BaseEvent | null> {
  const rows = await sql`
    SELECT id, stream_type, stream_id, event_type, event_data, metadata, created_at
    FROM events
    WHERE stream_type = ${streamType} AND stream_id = ${streamId}
    ORDER BY created_at DESC
    LIMIT 1
  `;

  if (rows.length === 0) return null;
  return mapRowToEvent(rows[0]);
}

/**
 * Map database row to BaseEvent type
 */
function mapRowToEvent(row: Record<string, unknown>): BaseEvent {
  return {
    id: row.id as string,
    streamType: row.stream_type as 'campaign',
    streamId: row.stream_id as string,
    eventType: row.event_type as EventType,
    eventData: row.event_data as Record<string, unknown>,
    metadata: row.metadata as { userId: string; timestamp: string },
    createdAt: (row.created_at as Date).toISOString(),
  };
}
