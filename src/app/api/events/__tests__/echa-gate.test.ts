import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { NextRequest } from 'next/server';
import type { Campaign } from '@/types';

// Mock all dependencies before importing the route
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/events', () => ({
  appendEvent: vi.fn(),
}));

vi.mock('@/lib/projections', () => ({
  updateProjection: vi.fn(),
  getCampaignById: vi.fn(),
}));

vi.mock('@/lib/ids', () => ({
  generateCampaignId: vi.fn(() => 'cmp_01TEST00000000000000000000'),
  isValidCampaignId: vi.fn((id: string) => id.startsWith('cmp_')),
}));

import { POST } from '../route';
import { auth } from '@/lib/auth';
import { appendEvent } from '@/lib/events';
import { updateProjection, getCampaignById } from '@/lib/projections';

// Test data factory functions
function createMockCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: 'cmp_01TEST00000000000000000000',
    legoCampaignCode: 'REPLAY-2026-001',
    status: 'extrusion_complete',
    currentStep: 'Extrusion',
    currentWeightKg: 950,
    materialType: 'PCR',
    description: 'Test campaign',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-16T14:30:00Z',
    completedAt: null,
    lastEventType: 'ExtrusionCompleted',
    lastEventAt: '2026-01-16T14:30:00Z',
    nextExpectedStep: 'ECHA Approval',
    echaApproved: false,
    ...overrides,
  };
}

function createMockRequest(body: Record<string, unknown>): NextRequest {
  return {
    json: vi.fn().mockResolvedValue(body),
  } as unknown as NextRequest;
}

function createMockSession() {
  return {
    user: {
      email: 'test@example.com',
    },
  };
}

describe('ECHA Compliance Gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: authenticated session
    (auth as Mock).mockResolvedValue(createMockSession());
    // Default: successful event append
    (appendEvent as Mock).mockResolvedValue({
      id: 'evt_01TEST00000000000000000000',
      streamType: 'campaign',
      streamId: 'cmp_01TEST00000000000000000000',
      eventType: 'TransferToRGERecorded',
      eventData: {},
      metadata: {
        userId: 'test@example.com',
        timestamp: '2026-01-16T14:30:00Z',
      },
      createdAt: '2026-01-16T14:30:00Z',
    });
    // Default: successful projection update
    (updateProjection as Mock).mockResolvedValue(undefined);
  });

  describe('blocks RGE events when ECHA not approved', () => {
    it('returns 403 error when campaign has echaApproved = false', async () => {
      const campaign = createMockCampaign({ echaApproved: false });
      (getCampaignById as Mock).mockResolvedValue(campaign);

      const request = createMockRequest({
        eventType: 'TransferToRGERecorded',
        campaignId: campaign.id,
        eventData: {
          trackingRef: 'TRACK-001',
          carrier: 'DHL',
          shipDate: '2026-01-20T00:00:00Z',
        },
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.error).toBe(
        'ECHA approval required before RGE operations. Please record ECHA approval event first.'
      );
      expect(appendEvent).not.toHaveBeenCalled();
      expect(updateProjection).not.toHaveBeenCalled();
    });

    it('checks campaign ECHA status before allowing transfer', async () => {
      const campaign = createMockCampaign({ echaApproved: false });
      (getCampaignById as Mock).mockResolvedValue(campaign);

      const request = createMockRequest({
        eventType: 'TransferToRGERecorded',
        campaignId: campaign.id,
        eventData: {
          trackingRef: 'TRACK-001',
          carrier: 'DHL',
          shipDate: '2026-01-20T00:00:00Z',
        },
      });

      await POST(request);

      expect(getCampaignById).toHaveBeenCalledWith(campaign.id);
    });

    it('blocks ManufacturingStarted when campaign has echaApproved = false', async () => {
      const campaign = createMockCampaign({ echaApproved: false });
      (getCampaignById as Mock).mockResolvedValue(campaign);

      const request = createMockRequest({
        eventType: 'ManufacturingStarted',
        campaignId: campaign.id,
        eventData: {
          poNumber: 'PO-123',
          startDate: '2026-01-22T00:00:00Z',
          poQuantity: 10000,
        },
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.error).toBe(
        'ECHA approval required before RGE operations. Please record ECHA approval event first.'
      );
      expect(appendEvent).not.toHaveBeenCalled();
    });

    it('blocks ManufacturingCompleted when campaign has echaApproved = false', async () => {
      const campaign = createMockCampaign({ echaApproved: false });
      (getCampaignById as Mock).mockResolvedValue(campaign);

      const request = createMockRequest({
        eventType: 'ManufacturingCompleted',
        campaignId: campaign.id,
        eventData: {
          completionDate: '2026-01-25T00:00:00Z',
          unitsProduced: 9500,
        },
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.error).toBe(
        'ECHA approval required before RGE operations. Please record ECHA approval event first.'
      );
      expect(appendEvent).not.toHaveBeenCalled();
    });

    it('blocks ReturnToLEGORecorded when campaign has echaApproved = false', async () => {
      const campaign = createMockCampaign({ echaApproved: false });
      (getCampaignById as Mock).mockResolvedValue(campaign);

      const request = createMockRequest({
        eventType: 'ReturnToLEGORecorded',
        campaignId: campaign.id,
        eventData: {
          trackingRef: 'RETURN-001',
          carrier: 'DHL',
          shipDate: '2026-01-28T00:00:00Z',
        },
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.error).toBe(
        'ECHA approval required before RGE operations. Please record ECHA approval event first.'
      );
      expect(appendEvent).not.toHaveBeenCalled();
    });
  });

  describe('allows RGE events when ECHA approved', () => {
    it('successfully records transfer when campaign has echaApproved = true', async () => {
      const campaign = createMockCampaign({
        echaApproved: true,
        status: 'echa_approved',
      });
      (getCampaignById as Mock).mockResolvedValue(campaign);

      const eventData = {
        trackingRef: 'TRACK-001',
        carrier: 'DHL',
        shipDate: '2026-01-20T00:00:00Z',
      };

      const request = createMockRequest({
        eventType: 'TransferToRGERecorded',
        campaignId: campaign.id,
        eventData,
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.campaignId).toBe(campaign.id);
      expect(responseData.event).toBeDefined();
      expect(appendEvent).toHaveBeenCalledWith({
        streamType: 'campaign',
        streamId: campaign.id,
        eventType: 'TransferToRGERecorded',
        eventData,
        userId: 'test@example.com',
      });
      expect(updateProjection).toHaveBeenCalledWith(
        'TransferToRGERecorded',
        campaign.id,
        eventData,
        expect.any(String)
      );
    });

    it('allows transfer after ECHA approval has been recorded', async () => {
      const campaign = createMockCampaign({
        echaApproved: true,
        status: 'echa_approved',
        lastEventType: 'ECHAApprovalRecorded',
      });
      (getCampaignById as Mock).mockResolvedValue(campaign);

      const request = createMockRequest({
        eventType: 'TransferToRGERecorded',
        campaignId: campaign.id,
        eventData: {
          trackingRef: 'TRACK-002',
          carrier: 'UPS',
          shipDate: '2026-01-21T00:00:00Z',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(appendEvent).toHaveBeenCalled();
    });

    it('allows ManufacturingCompleted when campaign has echaApproved = true', async () => {
      const campaign = createMockCampaign({
        echaApproved: true,
        status: 'manufacturing_in_progress',
      });
      (getCampaignById as Mock).mockResolvedValue(campaign);

      const request = createMockRequest({
        eventType: 'ManufacturingCompleted',
        campaignId: campaign.id,
        eventData: {
          completionDate: '2026-01-25T00:00:00Z',
          unitsProduced: 9500,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(appendEvent).toHaveBeenCalled();
    });

    it('allows ReturnToLEGORecorded when campaign has echaApproved = true', async () => {
      const campaign = createMockCampaign({
        echaApproved: true,
        status: 'manufacturing_complete',
      });
      (getCampaignById as Mock).mockResolvedValue(campaign);

      const request = createMockRequest({
        eventType: 'ReturnToLEGORecorded',
        campaignId: campaign.id,
        eventData: {
          trackingRef: 'RETURN-001',
          carrier: 'UPS',
          shipDate: '2026-01-28T00:00:00Z',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(appendEvent).toHaveBeenCalled();
    });
  });

  describe('does not affect other event types', () => {
    it('allows ECHAApprovalRecorded event without checking echaApproved', async () => {
      const campaign = createMockCampaign({ echaApproved: false });
      (getCampaignById as Mock).mockResolvedValue(campaign);

      const request = createMockRequest({
        eventType: 'ECHAApprovalRecorded',
        campaignId: campaign.id,
        eventData: {
          approvedBy: 'John Doe',
          approvalDate: '2026-01-18T00:00:00Z',
          notes: 'All ECHA requirements met',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(appendEvent).toHaveBeenCalled();
    });

    it('allows ExtrusionCompleted event without checking echaApproved', async () => {
      const campaign = createMockCampaign({
        echaApproved: false,
        status: 'polymer_purification_complete',
      });
      (getCampaignById as Mock).mockResolvedValue(campaign);

      const request = createMockRequest({
        eventType: 'ExtrusionCompleted',
        campaignId: campaign.id,
        eventData: {
          ticketNumber: 'EXT-001',
          batchNumber: 'BATCH-001',
          startingWeightKg: 900,
          outputWeightKg: 890,
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(appendEvent).toHaveBeenCalled();
    });

    it('allows ManufacturingStarted event when ECHA is approved', async () => {
      const campaign = createMockCampaign({
        echaApproved: true,
        status: 'transferred_to_rge',
      });
      (getCampaignById as Mock).mockResolvedValue(campaign);

      const request = createMockRequest({
        eventType: 'ManufacturingStarted',
        campaignId: campaign.id,
        eventData: {
          startDate: '2026-01-22T00:00:00Z',
          batchNumber: 'MFG-001',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(appendEvent).toHaveBeenCalled();
    });

    it('allows InboundShipmentRecorded event without checking echaApproved', async () => {
      const campaign = createMockCampaign({
        echaApproved: false,
        status: 'created',
      });
      (getCampaignById as Mock).mockResolvedValue(campaign);

      const request = createMockRequest({
        eventType: 'InboundShipmentRecorded',
        campaignId: campaign.id,
        eventData: {
          grossWeightKg: 1000,
          netWeightKg: 950,
          carrier: 'DHL',
          trackingRef: 'TRACK-003',
          shipDate: '2026-01-10T00:00:00Z',
          arrivalDate: '2026-01-15T00:00:00Z',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(appendEvent).toHaveBeenCalled();
    });
  });

  describe('edge cases and error handling', () => {
    it('returns 404 when campaign does not exist', async () => {
      (getCampaignById as Mock).mockResolvedValue(null);

      const request = createMockRequest({
        eventType: 'TransferToRGERecorded',
        campaignId: 'cmp_01NONEXISTENT000000000000',
        eventData: {
          trackingRef: 'TRACK-001',
          carrier: 'DHL',
          shipDate: '2026-01-20T00:00:00Z',
        },
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.error).toBe('Campaign not found');
      expect(appendEvent).not.toHaveBeenCalled();
    });

    it('checks ECHA gate before campaign not found error', async () => {
      // This test verifies the gate check happens AFTER campaign existence check
      (getCampaignById as Mock).mockResolvedValue(null);

      const request = createMockRequest({
        eventType: 'TransferToRGERecorded',
        campaignId: 'cmp_01NONEXISTENT000000000000',
        eventData: {
          trackingRef: 'TRACK-001',
          carrier: 'DHL',
          shipDate: '2026-01-20T00:00:00Z',
        },
      });

      const response = await POST(request);

      // Should return 404 (campaign not found) not 403 (ECHA gate)
      expect(response.status).toBe(404);
    });

    it('returns 401 when user is not authenticated', async () => {
      (auth as Mock).mockResolvedValue(null);

      const request = createMockRequest({
        eventType: 'TransferToRGERecorded',
        campaignId: 'cmp_01TEST00000000000000000000',
        eventData: {
          trackingRef: 'TRACK-001',
          carrier: 'DHL',
          shipDate: '2026-01-20T00:00:00Z',
        },
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Unauthorized');
      expect(getCampaignById).not.toHaveBeenCalled();
    });
  });

  describe('ECHA compliance business logic', () => {
    it('enforces sequential workflow: ECHA approval must come before RGE transfer', async () => {
      const campaign = createMockCampaign({
        status: 'extrusion_complete',
        lastEventType: 'ExtrusionCompleted',
        echaApproved: false,
      });
      (getCampaignById as Mock).mockResolvedValue(campaign);

      const request = createMockRequest({
        eventType: 'TransferToRGERecorded',
        campaignId: campaign.id,
        eventData: {
          trackingRef: 'TRACK-001',
          carrier: 'DHL',
          shipDate: '2026-01-20T00:00:00Z',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
      expect(appendEvent).not.toHaveBeenCalled();
    });

    it('provides helpful error message explaining the requirement', async () => {
      const campaign = createMockCampaign({ echaApproved: false });
      (getCampaignById as Mock).mockResolvedValue(campaign);

      const request = createMockRequest({
        eventType: 'TransferToRGERecorded',
        campaignId: campaign.id,
        eventData: {
          trackingRef: 'TRACK-001',
          carrier: 'DHL',
          shipDate: '2026-01-20T00:00:00Z',
        },
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(responseData.error).toContain('ECHA approval required');
      expect(responseData.error).toContain('before RGE operations');
      expect(responseData.error).toContain('record ECHA approval event first');
    });
  });
});
