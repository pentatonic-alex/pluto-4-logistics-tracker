import { sql } from './db';
import type { EventType, EventCorrectionPayload } from '@/types';

/**
 * Audit Entry
 * 
 * Represents a single EventCorrected event with campaign context.
 */
export interface AuditEntry {
  id: string;
  campaignId: string;
  campaignCode: string;
  correctedEventId: string;
  correctedEventType: EventType;
  reason: string;
  changes: Record<string, { was: unknown; now: unknown }>;
  userId: string;
  createdAt: string;
}

/**
 * Campaign summary for filter dropdown
 */
export interface CampaignSummary {
  id: string;
  code: string;
}

/**
 * Audit query filters
 */
export interface AuditFilters {
  campaignId?: string;
  eventType?: EventType;
  startDate?: string;
  endDate?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Paginated audit response
 */
export interface AuditResponse {
  entries: AuditEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  campaigns: CampaignSummary[];
}

/**
 * Get audit entries (EventCorrected events) with optional filters and pagination
 */
export async function getAuditEntries(
  filters: AuditFilters = {},
  pagination: PaginationParams = { page: 1, limit: 20 }
): Promise<{ entries: AuditEntry[]; total: number }> {
  const { campaignId, eventType = 'EventCorrected', startDate, endDate } = filters;
  const { page, limit } = pagination;
  const offset = (page - 1) * limit;

  // Use conditional queries based on which filters are provided
  // Since neon's sql doesn't support dynamic queries well,
  // we'll use conditional queries based on filters

  let countRows;
  let dataRows;

  if (campaignId && startDate && endDate) {
    countRows = await sql`
      SELECT COUNT(*) as total
      FROM events e
      JOIN campaign_projections cp ON e.stream_id = cp.id
      WHERE e.event_type = ${eventType}
        AND e.stream_id = ${campaignId}
        AND e.created_at >= ${startDate}::timestamp
        AND e.created_at <= ${endDate}::timestamp
    `;
    dataRows = await sql`
      SELECT
        e.id,
        e.stream_id as campaign_id,
        cp.lego_campaign_code as campaign_code,
        e.event_data,
        e.metadata,
        e.created_at
      FROM events e
      JOIN campaign_projections cp ON e.stream_id = cp.id
      WHERE e.event_type = ${eventType}
        AND e.stream_id = ${campaignId}
        AND e.created_at >= ${startDate}::timestamp
        AND e.created_at <= ${endDate}::timestamp
      ORDER BY e.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  } else if (campaignId && startDate) {
    countRows = await sql`
      SELECT COUNT(*) as total
      FROM events e
      JOIN campaign_projections cp ON e.stream_id = cp.id
      WHERE e.event_type = ${eventType}
        AND e.stream_id = ${campaignId}
        AND e.created_at >= ${startDate}::timestamp
    `;
    dataRows = await sql`
      SELECT
        e.id,
        e.stream_id as campaign_id,
        cp.lego_campaign_code as campaign_code,
        e.event_data,
        e.metadata,
        e.created_at
      FROM events e
      JOIN campaign_projections cp ON e.stream_id = cp.id
      WHERE e.event_type = ${eventType}
        AND e.stream_id = ${campaignId}
        AND e.created_at >= ${startDate}::timestamp
      ORDER BY e.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  } else if (campaignId && endDate) {
    countRows = await sql`
      SELECT COUNT(*) as total
      FROM events e
      JOIN campaign_projections cp ON e.stream_id = cp.id
      WHERE e.event_type = ${eventType}
        AND e.stream_id = ${campaignId}
        AND e.created_at <= ${endDate}::timestamp
    `;
    dataRows = await sql`
      SELECT
        e.id,
        e.stream_id as campaign_id,
        cp.lego_campaign_code as campaign_code,
        e.event_data,
        e.metadata,
        e.created_at
      FROM events e
      JOIN campaign_projections cp ON e.stream_id = cp.id
      WHERE e.event_type = ${eventType}
        AND e.stream_id = ${campaignId}
        AND e.created_at <= ${endDate}::timestamp
      ORDER BY e.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  } else if (startDate && endDate) {
    countRows = await sql`
      SELECT COUNT(*) as total
      FROM events e
      JOIN campaign_projections cp ON e.stream_id = cp.id
      WHERE e.event_type = ${eventType}
        AND e.created_at >= ${startDate}::timestamp
        AND e.created_at <= ${endDate}::timestamp
    `;
    dataRows = await sql`
      SELECT
        e.id,
        e.stream_id as campaign_id,
        cp.lego_campaign_code as campaign_code,
        e.event_data,
        e.metadata,
        e.created_at
      FROM events e
      JOIN campaign_projections cp ON e.stream_id = cp.id
      WHERE e.event_type = ${eventType}
        AND e.created_at >= ${startDate}::timestamp
        AND e.created_at <= ${endDate}::timestamp
      ORDER BY e.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  } else if (campaignId) {
    countRows = await sql`
      SELECT COUNT(*) as total
      FROM events e
      JOIN campaign_projections cp ON e.stream_id = cp.id
      WHERE e.event_type = ${eventType}
        AND e.stream_id = ${campaignId}
    `;
    dataRows = await sql`
      SELECT
        e.id,
        e.stream_id as campaign_id,
        cp.lego_campaign_code as campaign_code,
        e.event_data,
        e.metadata,
        e.created_at
      FROM events e
      JOIN campaign_projections cp ON e.stream_id = cp.id
      WHERE e.event_type = ${eventType}
        AND e.stream_id = ${campaignId}
      ORDER BY e.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  } else if (startDate) {
    countRows = await sql`
      SELECT COUNT(*) as total
      FROM events e
      JOIN campaign_projections cp ON e.stream_id = cp.id
      WHERE e.event_type = ${eventType}
        AND e.created_at >= ${startDate}::timestamp
    `;
    dataRows = await sql`
      SELECT
        e.id,
        e.stream_id as campaign_id,
        cp.lego_campaign_code as campaign_code,
        e.event_data,
        e.metadata,
        e.created_at
      FROM events e
      JOIN campaign_projections cp ON e.stream_id = cp.id
      WHERE e.event_type = ${eventType}
        AND e.created_at >= ${startDate}::timestamp
      ORDER BY e.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  } else if (endDate) {
    countRows = await sql`
      SELECT COUNT(*) as total
      FROM events e
      JOIN campaign_projections cp ON e.stream_id = cp.id
      WHERE e.event_type = ${eventType}
        AND e.created_at <= ${endDate}::timestamp
    `;
    dataRows = await sql`
      SELECT
        e.id,
        e.stream_id as campaign_id,
        cp.lego_campaign_code as campaign_code,
        e.event_data,
        e.metadata,
        e.created_at
      FROM events e
      JOIN campaign_projections cp ON e.stream_id = cp.id
      WHERE e.event_type = ${eventType}
        AND e.created_at <= ${endDate}::timestamp
      ORDER BY e.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  } else {
    // No filters
    countRows = await sql`
      SELECT COUNT(*) as total
      FROM events e
      JOIN campaign_projections cp ON e.stream_id = cp.id
      WHERE e.event_type = ${eventType}
    `;
    dataRows = await sql`
      SELECT
        e.id,
        e.stream_id as campaign_id,
        cp.lego_campaign_code as campaign_code,
        e.event_data,
        e.metadata,
        e.created_at
      FROM events e
      JOIN campaign_projections cp ON e.stream_id = cp.id
      WHERE e.event_type = ${eventType}
      ORDER BY e.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  }

  const total = Number(countRows[0]?.total || 0);
  const entries = dataRows.map(mapRowToAuditEntry);

  return { entries, total };
}

/**
 * Get all campaigns for the filter dropdown
 */
export async function getCampaignsForFilter(): Promise<CampaignSummary[]> {
  const rows = await sql`
    SELECT id, lego_campaign_code
    FROM campaign_projections
    ORDER BY lego_campaign_code ASC
  `;

  return rows.map((row) => ({
    id: row.id as string,
    code: row.lego_campaign_code as string,
  }));
}

/**
 * Map database row to AuditEntry type
 */
function mapRowToAuditEntry(row: Record<string, unknown>): AuditEntry {
  const eventData = row.event_data as EventCorrectionPayload;
  const metadata = row.metadata as { userId: string; timestamp: string };

  return {
    id: row.id as string,
    campaignId: row.campaign_id as string,
    campaignCode: row.campaign_code as string,
    correctedEventId: eventData.correctsEventId,
    correctedEventType: eventData.correctsEventType,
    reason: eventData.reason,
    changes: eventData.changes,
    userId: metadata.userId,
    createdAt: (row.created_at as Date).toISOString(),
  };
}
