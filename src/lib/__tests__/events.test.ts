import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

// Mock the database module before importing events
vi.mock('../db', () => ({
  sql: vi.fn(),
}));

// Mock the ids module to control ID generation
vi.mock('../ids', () => ({
  generateEventId: vi.fn(() => 'evt_01TEST00000000000000000000'),
}));

import { appendEvent, getEventsForStream, getEventsByType, getLatestEventForStream } from '../events';
import { sql } from '../db';
import { generateEventId } from '../ids';

// Helper type for our mocked sql function
type MockSql = Mock<(...args: unknown[]) => Promise<Record<string, unknown>[]>>;

describe('Event Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock implementation for sql
    (sql as MockSql).mockResolvedValue([]);
  });

  describe('appendEvent', () => {
    it('creates an event with correct structure', async () => {
      (sql as MockSql).mockResolvedValue([]);

      const result = await appendEvent({
        streamType: 'campaign',
        streamId: 'cmp_01TEST00000000000000000000',
        eventType: 'CampaignCreated',
        eventData: { legoCampaignCode: 'REPLAY-2026-001', materialType: 'PCR' },
        userId: 'user@example.com',
      });

      expect(result.id).toBe('evt_01TEST00000000000000000000');
      expect(result.streamType).toBe('campaign');
      expect(result.streamId).toBe('cmp_01TEST00000000000000000000');
      expect(result.eventType).toBe('CampaignCreated');
      expect(result.eventData).toEqual({ legoCampaignCode: 'REPLAY-2026-001', materialType: 'PCR' });
      expect(result.metadata.userId).toBe('user@example.com');
      expect(result.metadata.timestamp).toBeDefined();
      expect(result.createdAt).toBeDefined();
    });

    it('calls generateEventId', async () => {
      (sql as MockSql).mockResolvedValue([]);

      await appendEvent({
        streamType: 'campaign',
        streamId: 'cmp_01TEST00000000000000000000',
        eventType: 'CampaignCreated',
        eventData: {},
        userId: 'user@example.com',
      });

      expect(generateEventId).toHaveBeenCalled();
    });

    it('calls sql to insert event', async () => {
      (sql as MockSql).mockResolvedValue([]);

      await appendEvent({
        streamType: 'campaign',
        streamId: 'cmp_01TEST00000000000000000000',
        eventType: 'CampaignCreated',
        eventData: { test: 'data' },
        userId: 'user@example.com',
      });

      expect(sql).toHaveBeenCalled();
    });
  });

  describe('getEventsForStream', () => {
    it('returns events mapped from database rows', async () => {
      const mockRows = [
        {
          id: 'evt_01',
          stream_type: 'campaign',
          stream_id: 'cmp_01',
          event_type: 'CampaignCreated',
          event_data: { legoCampaignCode: 'TEST' },
          metadata: { userId: 'test@test.com', timestamp: '2026-01-01T00:00:00Z' },
          created_at: new Date('2026-01-01T00:00:00Z'),
        },
        {
          id: 'evt_02',
          stream_type: 'campaign',
          stream_id: 'cmp_01',
          event_type: 'InboundShipmentRecorded',
          event_data: { grossWeightKg: 1000 },
          metadata: { userId: 'test@test.com', timestamp: '2026-01-02T00:00:00Z' },
          created_at: new Date('2026-01-02T00:00:00Z'),
        },
      ];

      (sql as MockSql).mockResolvedValue(mockRows);

      const events = await getEventsForStream('campaign', 'cmp_01');

      expect(events).toHaveLength(2);
      expect(events[0].id).toBe('evt_01');
      expect(events[0].eventType).toBe('CampaignCreated');
      expect(events[1].id).toBe('evt_02');
      expect(events[1].eventType).toBe('InboundShipmentRecorded');
    });

    it('returns empty array when no events found', async () => {
      (sql as MockSql).mockResolvedValue([]);

      const events = await getEventsForStream('campaign', 'cmp_nonexistent');

      expect(events).toEqual([]);
    });
  });

  describe('getEventsByType', () => {
    it('returns events filtered by type', async () => {
      const mockRows = [
        {
          id: 'evt_01',
          stream_type: 'campaign',
          stream_id: 'cmp_01',
          event_type: 'CampaignCreated',
          event_data: {},
          metadata: { userId: 'test@test.com', timestamp: '2026-01-01T00:00:00Z' },
          created_at: new Date('2026-01-01T00:00:00Z'),
        },
      ];

      (sql as MockSql).mockResolvedValue(mockRows);

      const events = await getEventsByType('CampaignCreated');

      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('CampaignCreated');
    });
  });

  describe('getLatestEventForStream', () => {
    it('returns the latest event for a stream', async () => {
      const mockRows = [
        {
          id: 'evt_latest',
          stream_type: 'campaign',
          stream_id: 'cmp_01',
          event_type: 'InboundShipmentRecorded',
          event_data: {},
          metadata: { userId: 'test@test.com', timestamp: '2026-01-15T00:00:00Z' },
          created_at: new Date('2026-01-15T00:00:00Z'),
        },
      ];

      (sql as MockSql).mockResolvedValue(mockRows);

      const event = await getLatestEventForStream('campaign', 'cmp_01');

      expect(event).not.toBeNull();
      expect(event?.id).toBe('evt_latest');
      expect(event?.eventType).toBe('InboundShipmentRecorded');
    });

    it('returns null when no events found', async () => {
      (sql as MockSql).mockResolvedValue([]);

      const event = await getLatestEventForStream('campaign', 'cmp_nonexistent');

      expect(event).toBeNull();
    });
  });
});
