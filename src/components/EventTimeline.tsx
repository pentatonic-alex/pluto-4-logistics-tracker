'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BaseEvent, EventType, EventCorrectionPayload } from '@/types';

interface EventTimelineProps {
  events: BaseEvent[];
  campaignId: string;
  onEventCorrected?: () => void;
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
  EventCorrected: {
    label: 'Correction',
    icon: '✏️',
    color: 'bg-rose-500',
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

// Build a map of corrected event IDs to their corrections
function buildCorrectionMap(events: BaseEvent[]): Map<string, BaseEvent[]> {
  const map = new Map<string, BaseEvent[]>();
  
  events.forEach(event => {
    if (event.eventType === 'EventCorrected') {
      const payload = event.eventData as unknown as EventCorrectionPayload;
      const corrections = map.get(payload.correctsEventId) || [];
      corrections.push(event);
      map.set(payload.correctsEventId, corrections);
    }
  });
  
  return map;
}

// Get the effective (corrected) value for a field
function getEffectiveValue(
  originalValue: unknown,
  fieldKey: string,
  corrections: BaseEvent[]
): { value: unknown; wasCorrected: boolean } {
  let value = originalValue;
  let wasCorrected = false;
  
  // Apply corrections in chronological order
  corrections.forEach(correction => {
    const payload = correction.eventData as unknown as EventCorrectionPayload;
    if (payload.changes[fieldKey]) {
      value = payload.changes[fieldKey].now;
      wasCorrected = true;
    }
  });
  
  return { value, wasCorrected };
}

// Format correction event data showing was/now changes
function formatCorrectionData(eventData: Record<string, unknown>): React.ReactNode {
  const payload = eventData as unknown as EventCorrectionPayload;
  
  return (
    <div className="space-y-2">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        <span className="font-medium">Reason:</span> {payload.reason}
      </p>
      <div className="text-sm space-y-1">
        {Object.entries(payload.changes).map(([key, change]) => (
          <div key={key} className="flex gap-2 items-center">
            <span className="font-medium text-zinc-500 dark:text-zinc-500 min-w-[140px]">
              {formatFieldName(key)}:
            </span>
            <span className="text-red-500 line-through">
              {formatFieldValue(key, change.was)}
            </span>
            <span className="text-zinc-400">→</span>
            <span className="text-green-600 dark:text-green-400">
              {formatFieldValue(key, change.now)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EventTimeline({ events, campaignId, onEventCorrected }: EventTimelineProps) {
  const router = useRouter();
  const [correctingEvent, setCorrectingEvent] = useState<BaseEvent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
        <p>No events recorded yet.</p>
      </div>
    );
  }

  // Build correction map to know which events have been corrected
  const correctionMap = buildCorrectionMap(events);

  // Sort events chronologically (oldest first for timeline display)
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Check if an event type is correctable (not corrections or campaign created)
  const isCorrectable = (eventType: EventType): boolean => {
    return eventType !== 'EventCorrected' && eventType !== 'CampaignCreated';
  };

  return (
    <>
      <div className="flow-root">
        <ul className="-mb-8">
          {sortedEvents.map((event, eventIdx) => {
            const metadata = EVENT_METADATA[event.eventType];
            const isLast = eventIdx === sortedEvents.length - 1;
            const isCorrection = event.eventType === 'EventCorrected';
            const corrections = correctionMap.get(event.id) || [];
            const hasBeenCorrected = corrections.length > 0;

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
                      {/* Corrected indicator */}
                      {hasBeenCorrected && (
                        <div className="absolute -top-1 -right-1 h-4 w-4 bg-rose-500 rounded-full flex items-center justify-center">
                          <span className="text-[10px] text-white">✏️</span>
                        </div>
                      )}
                    </div>

                    {/* Event content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {metadata.label}
                          </p>
                          {hasBeenCorrected && (
                            <span className="text-xs px-1.5 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded">
                              Corrected
                            </span>
                          )}
                        </div>
                        <div className="text-right text-sm text-zinc-500 dark:text-zinc-400">
                          <p>{formatDate(event.createdAt)}</p>
                          <p className="text-xs">{formatTime(event.createdAt)}</p>
                        </div>
                      </div>

                      {/* Event details */}
                      <div className={`mt-2 rounded-lg p-3 ${
                        isCorrection 
                          ? 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800' 
                          : 'bg-zinc-50 dark:bg-zinc-800/50'
                      }`}>
                        {isCorrection 
                          ? formatCorrectionData(event.eventData)
                          : formatEventDataWithCorrections(event.eventType, event.eventData, corrections)
                        }

                        {/* Event ID and Correct button */}
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
                            {event.id}
                          </p>
                          {isCorrectable(event.eventType) && (
                            <button
                              onClick={() => setCorrectingEvent(event)}
                              className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                              Correct
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Correction Modal */}
      {correctingEvent && (
        <CorrectionModal
          event={correctingEvent}
          campaignId={campaignId}
          isSubmitting={isSubmitting}
          onClose={() => setCorrectingEvent(null)}
          onSubmit={async (reason, changes) => {
            setIsSubmitting(true);
            try {
              const response = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  streamType: 'campaign',
                  streamId: campaignId,
                  eventType: 'EventCorrected',
                  eventData: {
                    correctsEventId: correctingEvent.id,
                    correctsEventType: correctingEvent.eventType,
                    reason,
                    changes,
                  },
                }),
              });
              
              if (response.ok) {
                setCorrectingEvent(null);
                onEventCorrected?.();
                // Refresh the page to show the new correction event
                router.refresh();
              }
            } finally {
              setIsSubmitting(false);
            }
          }}
        />
      )}
    </>
  );
}

// Format event data with corrections applied
function formatEventDataWithCorrections(
  eventType: EventType,
  data: Record<string, unknown>,
  corrections: BaseEvent[]
): React.ReactNode {
  const entries = Object.entries(data).filter(([key]) => {
    return !['campaignId'].includes(key);
  });

  if (entries.length === 0) return null;

  return (
    <dl className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
      {entries.map(([key, originalValue]) => {
        const { value, wasCorrected } = getEffectiveValue(originalValue, key, corrections);
        
        return (
          <div key={key} className="flex gap-2">
            <dt className="font-medium text-zinc-500 dark:text-zinc-500 min-w-[140px]">
              {formatFieldName(key)}:
            </dt>
            <dd className={wasCorrected ? 'text-green-600 dark:text-green-400' : ''}>
              {formatFieldValue(key, value)}
              {wasCorrected && (
                <span className="ml-1 text-xs text-rose-500">(corrected)</span>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

// Correction Modal Component
interface CorrectionModalProps {
  event: BaseEvent;
  campaignId: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (reason: string, changes: Record<string, { was: unknown; now: unknown }>) => Promise<void>;
}

function CorrectionModal({ event, isSubmitting, onClose, onSubmit }: CorrectionModalProps) {
  const [reason, setReason] = useState('');
  const [changes, setChanges] = useState<Record<string, { was: unknown; now: unknown }>>({});
  
  const metadata = EVENT_METADATA[event.eventType];
  const editableFields = Object.entries(event.eventData).filter(([key]) => {
    return !['campaignId'].includes(key);
  });

  const handleFieldChange = (key: string, newValue: string) => {
    const originalValue = event.eventData[key];
    
    if (newValue === String(originalValue)) {
      // Remove from changes if reverted to original
      const newChanges = { ...changes };
      delete newChanges[key];
      setChanges(newChanges);
    } else {
      setChanges({
        ...changes,
        [key]: { was: originalValue, now: parseFieldValue(key, newValue) },
      });
    }
  };

  const hasChanges = Object.keys(changes).length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-lg w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Correct {metadata.label}
            </h3>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Edit the values that need correction. Original event data will be preserved in the audit trail.
          </p>

          <div className="space-y-4">
            {/* Reason field */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Reason for correction *
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Data entry error, incorrect weight recorded"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
              />
            </div>

            {/* Editable fields */}
            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                Event Data
              </p>
              <div className="space-y-3">
                {editableFields.map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                      {formatFieldName(key)}
                    </label>
                    <input
                      type={getInputType(key)}
                      defaultValue={formatInputValue(key, value)}
                      onChange={(e) => handleFieldChange(key, e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm ${
                        changes[key] 
                          ? 'border-rose-300 dark:border-rose-700 ring-1 ring-rose-500' 
                          : 'border-zinc-300 dark:border-zinc-700'
                      }`}
                    />
                    {changes[key] && (
                      <p className="text-xs text-rose-500 mt-1">
                        Changed from: {formatFieldValue(key, changes[key].was)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSubmit(reason, changes)}
              disabled={!hasChanges || !reason.trim() || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Correction'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to determine input type based on field name
function getInputType(key: string): string {
  if (key.toLowerCase().includes('date')) return 'date';
  if (key.toLowerCase().includes('weight') || key.toLowerCase().includes('quantity') || key.toLowerCase().includes('hours')) return 'number';
  return 'text';
}

// Helper to format value for input
function formatInputValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '';
  if (key.toLowerCase().includes('date') && typeof value === 'string') {
    // Convert to YYYY-MM-DD format for date input
    try {
      const date = new Date(value);
      return date.toISOString().split('T')[0];
    } catch {
      return String(value);
    }
  }
  return String(value);
}

// Helper to parse field value back from string input
function parseFieldValue(key: string, value: string): unknown {
  if (key.toLowerCase().includes('weight') || key.toLowerCase().includes('quantity') || key.toLowerCase().includes('hours')) {
    return Number(value);
  }
  return value;
}
