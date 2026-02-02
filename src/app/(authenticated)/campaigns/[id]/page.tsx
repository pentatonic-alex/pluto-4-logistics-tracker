'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/StatusBadge';
import type { Campaign, BaseEvent, EventType } from '@/types';

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>;
}

// Human-readable event type labels
const EVENT_TYPE_LABELS: Record<EventType, string> = {
  CampaignCreated: 'Campaign Created',
  InboundShipmentRecorded: 'Inbound Shipment Recorded',
  GranulationCompleted: 'Granulation Completed',
  MetalRemovalCompleted: 'Metal Removal Completed',
  PolymerPurificationCompleted: 'Polymer Purification Completed',
  ExtrusionCompleted: 'Extrusion Completed',
  ECHAApprovalRecorded: 'ECHA Approval Recorded',
  TransferToRGERecorded: 'Transfer to RGE Recorded',
  ManufacturingStarted: 'Manufacturing Started',
  ManufacturingCompleted: 'Manufacturing Completed',
  ReturnToLEGORecorded: 'Return to LEGO Recorded',
  CampaignCompleted: 'Campaign Completed',
};

// Event type colors for timeline
const EVENT_TYPE_COLORS: Record<EventType, string> = {
  CampaignCreated: 'bg-slate-500',
  InboundShipmentRecorded: 'bg-blue-500',
  GranulationCompleted: 'bg-amber-500',
  MetalRemovalCompleted: 'bg-orange-500',
  PolymerPurificationCompleted: 'bg-cyan-500',
  ExtrusionCompleted: 'bg-indigo-500',
  ECHAApprovalRecorded: 'bg-purple-500',
  TransferToRGERecorded: 'bg-pink-500',
  ManufacturingStarted: 'bg-rose-500',
  ManufacturingCompleted: 'bg-emerald-500',
  ReturnToLEGORecorded: 'bg-teal-500',
  CampaignCompleted: 'bg-green-500',
};

export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { id } = use(params);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [events, setEvents] = useState<BaseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaignDetails = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/campaigns/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Campaign not found');
        }
        throw new Error('Failed to fetch campaign');
      }

      const data = await response.json();
      setCampaign(data.campaign);
      setEvents(data.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCampaignDetails();
  }, [fetchCampaignDetails]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading campaign...
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-red-200 dark:border-red-800 overflow-hidden">
          <div className="px-6 py-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
              {error || 'Campaign not found'}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              The campaign you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.
            </p>
            <Link
              href="/"
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              ← Back to campaigns
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to campaigns
      </Link>

      {/* Campaign header */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                {campaign.legoCampaignCode}
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {campaign.materialType}
              </span>
            </div>
            {campaign.description && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {campaign.description}
              </p>
            )}
          </div>
          <StatusBadge status={campaign.status} />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Current Step</p>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {campaign.currentStep || '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Weight</p>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {campaign.currentWeightKg ? `${campaign.currentWeightKg.toLocaleString()} kg` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">ECHA Status</p>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {campaign.echaApproved ? (
                <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Approved
                </span>
              ) : (
                <span className="text-zinc-400 dark:text-zinc-500">Pending</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Next Step</p>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {campaign.nextExpectedStep || '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Event Timeline
        </h2>
        {campaign.status !== 'completed' && (
          <Link
            href={`/campaigns/${id}/log`}
            className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Log Event
          </Link>
        )}
      </div>

      {/* Event timeline */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {events.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No events recorded yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {/* Show events in reverse chronological order (newest first) */}
            {[...events].reverse().map((event, index) => (
              <div key={event.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Timeline dot */}
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-3 h-3 rounded-full ${EVENT_TYPE_COLORS[event.eventType]}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {EVENT_TYPE_LABELS[event.eventType]}
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {formatEventTimestamp(event.createdAt)}
                        </p>
                      </div>
                      {index === 0 && (
                        <span className="flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          Latest
                        </span>
                      )}
                    </div>

                    {/* Event data summary */}
                    {renderEventDataSummary(event)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatEventTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function renderEventDataSummary(event: BaseEvent): React.ReactNode {
  const data = event.eventData;

  // Extract relevant fields based on event type
  const summaryItems: { label: string; value: string }[] = [];

  switch (event.eventType) {
    case 'CampaignCreated':
      if (data.legoCampaignCode) summaryItems.push({ label: 'Code', value: String(data.legoCampaignCode) });
      if (data.materialType) summaryItems.push({ label: 'Material', value: String(data.materialType) });
      break;
    case 'InboundShipmentRecorded':
      if (data.netWeightKg) summaryItems.push({ label: 'Net Weight', value: `${data.netWeightKg} kg` });
      if (data.carrier) summaryItems.push({ label: 'Carrier', value: String(data.carrier) });
      if (data.trackingRef) summaryItems.push({ label: 'Tracking', value: String(data.trackingRef) });
      break;
    case 'GranulationCompleted':
    case 'MetalRemovalCompleted':
    case 'PolymerPurificationCompleted':
    case 'ExtrusionCompleted':
      if (data.outputWeightKg) summaryItems.push({ label: 'Output', value: `${data.outputWeightKg} kg` });
      if (data.ticketNumber) summaryItems.push({ label: 'Ticket', value: String(data.ticketNumber) });
      break;
    case 'ECHAApprovalRecorded':
      if (data.approvedBy) summaryItems.push({ label: 'Approved By', value: String(data.approvedBy) });
      if (data.approvalDate) summaryItems.push({ label: 'Date', value: String(data.approvalDate) });
      break;
    case 'TransferToRGERecorded':
      if (data.carrier) summaryItems.push({ label: 'Carrier', value: String(data.carrier) });
      if (data.trackingRef) summaryItems.push({ label: 'Tracking', value: String(data.trackingRef) });
      break;
    case 'ManufacturingStarted':
      if (data.poNumber) summaryItems.push({ label: 'PO', value: String(data.poNumber) });
      if (data.poQuantity) summaryItems.push({ label: 'Quantity', value: String(data.poQuantity) });
      break;
    case 'ManufacturingCompleted':
      if (data.actualQuantity) summaryItems.push({ label: 'Actual Qty', value: String(data.actualQuantity) });
      break;
    case 'ReturnToLEGORecorded':
      if (data.quantity) summaryItems.push({ label: 'Quantity', value: String(data.quantity) });
      if (data.carrier) summaryItems.push({ label: 'Carrier', value: String(data.carrier) });
      break;
    case 'CampaignCompleted':
      if (data.completionNotes) summaryItems.push({ label: 'Notes', value: String(data.completionNotes) });
      break;
  }

  if (summaryItems.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
      {summaryItems.map((item, index) => (
        <span key={index} className="text-xs text-zinc-500 dark:text-zinc-400">
          <span className="text-zinc-400 dark:text-zinc-500">{item.label}:</span>{' '}
          <span className="text-zinc-600 dark:text-zinc-300">{item.value}</span>
        </span>
      ))}
    </div>
  );
}
