'use client';

import type { BaseEvent, EventType } from '@/types';

interface EventTimelineProps {
  events: BaseEvent[];
}

// Event type metadata for display
const EVENT_METADATA: Record<EventType, { label: string; icon: string; color: string }> = {
  CampaignCreated: {
    label: 'Campaign Created',
    icon: '🚀',
    color: 'bg-blue-500',
  },
  InboundShipmentRecorded: {
    label: 'Inbound Shipment',
    icon: '📦',
    color: 'bg-amber-500',
  },
  GranulationCompleted: {
    label: 'Granulation Complete',
    icon: '⚙️',
    color: 'bg-orange-500',
  },
  MetalRemovalCompleted: {
    label: 'Metal Removal Complete',
    icon: '🧲',
    color: 'bg-slate-500',
  },
  PolymerPurificationCompleted: {
    label: 'Polymer Purification Complete',
    icon: '🧪',
    color: 'bg-purple-500',
  },
  ExtrusionCompleted: {
    label: 'Extrusion Complete',
    icon: '🔧',
    color: 'bg-indigo-500',
  },
  ECHAApprovalRecorded: {
    label: 'ECHA Approved',
    icon: '✅',
    color: 'bg-green-500',
  },
  TransferToRGERecorded: {
    label: 'Transferred to RGE',
    icon: '🚚',
    color: 'bg-cyan-500',
  },
  ManufacturingStarted: {
    label: 'Manufacturing Started',
    icon: '🏭',
    color: 'bg-teal-500',
  },
  ManufacturingCompleted: {
    label: 'Manufacturing Complete',
    icon: '✨',
    color: 'bg-emerald-500',
  },
  ReturnToLEGORecorded: {
    label: 'Returned to LEGO',
    icon: '🏠',
    color: 'bg-yellow-500',
  },
  CampaignCompleted: {
    label: 'Campaign Completed',
    icon: '🎉',
    color: 'bg-green-600',
  },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatEventData(eventType: EventType, data: Record<string, unknown>): React.ReactNode {
  const entries = Object.entries(data).filter(([key]) => {
    // Skip internal fields
    return !['campaignId'].includes(key);
  });

  if (entries.length === 0) return null;

  return (
    <dl className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
      {entries.map(([key, value]) => (
        <div key={key} className="flex gap-2">
          <dt className="font-medium text-zinc-500 dark:text-zinc-500 min-w-[140px]">
            {formatFieldName(key)}:
          </dt>
          <dd>{formatFieldValue(key, value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function formatFieldName(key: string): string {
  // Convert camelCase to Title Case with special handling
  const specialCases: Record<string, string> = {
    legoCampaignCode: 'LEGO Campaign Code',
    grossWeightKg: 'Gross Weight (kg)',
    netWeightKg: 'Net Weight (kg)',
    estimatedAbsKg: 'Estimated ABS (kg)',
    trackingRef: 'Tracking Reference',
    shipDate: 'Ship Date',
    arrivalDate: 'Arrival Date',
    ticketNumber: 'Ticket Number',
    startingWeightKg: 'Starting Weight (kg)',
    outputWeightKg: 'Output Weight (kg)',
    processHours: 'Process Hours',
    polymerComposition: 'Polymer Composition',
    wasteCode: 'Waste Code',
    wasteComposition: 'Waste Composition',
    contaminationNotes: 'Contamination Notes',
    batchNumber: 'Batch Number',
    approvedBy: 'Approved By',
    approvalDate: 'Approval Date',
    receivedDate: 'Received Date',
    receivedWeightKg: 'Received Weight (kg)',
    poNumber: 'PO Number',
    poQuantity: 'PO Quantity',
    startDate: 'Start Date',
    endDate: 'End Date',
    actualQuantity: 'Actual Quantity',
    materialType: 'Material Type',
    completionNotes: 'Completion Notes',
  };

  if (specialCases[key]) return specialCases[key];

  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

function formatFieldValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '—';

  // Format dates
  if (key.toLowerCase().includes('date') && typeof value === 'string') {
    try {
      return formatDate(value);
    } catch {
      return String(value);
    }
  }

  // Format weights with units
  if (key.toLowerCase().includes('weight') && typeof value === 'number') {
    return `${value.toLocaleString()} kg`;
  }

  // Format quantities
  if (key.toLowerCase().includes('quantity') && typeof value === 'number') {
    return value.toLocaleString();
  }

  // Format hours
  if (key === 'processHours' && typeof value === 'number') {
    return `${value} hrs`;
  }

  return String(value);
}

export function EventTimeline({ events }: EventTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
        <p>No events recorded yet.</p>
      </div>
    );
  }

  // Sort events chronologically (oldest first for timeline display)
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {sortedEvents.map((event, eventIdx) => {
          const metadata = EVENT_METADATA[event.eventType];
          const isLast = eventIdx === sortedEvents.length - 1;

          return (
            <li key={event.id}>
              <div className="relative pb-8">
                {/* Connector line */}
                {!isLast && (
                  <span
                    className="absolute left-4 top-8 -ml-px h-full w-0.5 bg-zinc-200 dark:bg-zinc-700"
                    aria-hidden="true"
                  />
                )}

                <div className="relative flex items-start space-x-3">
                  {/* Event icon */}
                  <div className="relative">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${metadata.color} ring-4 ring-white dark:ring-zinc-900`}
                    >
                      <span className="text-sm" role="img" aria-label={metadata.label}>
                        {metadata.icon}
                      </span>
                    </div>
                  </div>

                  {/* Event content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {metadata.label}
                      </p>
                      <div className="text-right text-sm text-zinc-500 dark:text-zinc-400">
                        <p>{formatDate(event.createdAt)}</p>
                        <p className="text-xs">{formatTime(event.createdAt)}</p>
                      </div>
                    </div>

                    {/* Event details */}
                    <div className="mt-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-3">
                      {formatEventData(event.eventType, event.eventData)}

                      {/* Event ID for reference */}
                      <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500 font-mono">
                        {event.id}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
