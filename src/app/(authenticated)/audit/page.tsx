'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { EventType } from '@/types';
import type { AuditEntry, CampaignSummary, AuditResponse } from '@/lib/audit';

// Event type display labels (matching EventTimeline)
const EVENT_TYPE_LABELS: Record<EventType, string> = {
  CampaignCreated: 'Campaign Created',
  InboundShipmentRecorded: 'Inbound Shipment',
  GranulationCompleted: 'Granulation',
  MetalRemovalCompleted: 'Metal Removal',
  PolymerPurificationCompleted: 'Polymer Purification',
  ExtrusionCompleted: 'Extrusion',
  ECHAApprovalRecorded: 'ECHA Approval',
  TransferToRGERecorded: 'Transfer to RGE',
  ManufacturingStarted: 'Manufacturing Started',
  ManufacturingCompleted: 'Manufacturing Complete',
  ReturnToLEGORecorded: 'Return to LEGO',
  CampaignCompleted: 'Campaign Completed',
  EventCorrected: 'Correction',
};

// Event type options for dropdown (excluding EventCorrected)
const EVENT_TYPE_OPTIONS: { value: EventType | ''; label: string }[] = [
  { value: '', label: 'All Event Types' },
  { value: 'CampaignCreated', label: EVENT_TYPE_LABELS.CampaignCreated },
  { value: 'InboundShipmentRecorded', label: EVENT_TYPE_LABELS.InboundShipmentRecorded },
  { value: 'GranulationCompleted', label: EVENT_TYPE_LABELS.GranulationCompleted },
  { value: 'MetalRemovalCompleted', label: EVENT_TYPE_LABELS.MetalRemovalCompleted },
  { value: 'PolymerPurificationCompleted', label: EVENT_TYPE_LABELS.PolymerPurificationCompleted },
  { value: 'ExtrusionCompleted', label: EVENT_TYPE_LABELS.ExtrusionCompleted },
  { value: 'ECHAApprovalRecorded', label: EVENT_TYPE_LABELS.ECHAApprovalRecorded },
  { value: 'TransferToRGERecorded', label: EVENT_TYPE_LABELS.TransferToRGERecorded },
  { value: 'ManufacturingStarted', label: EVENT_TYPE_LABELS.ManufacturingStarted },
  { value: 'ManufacturingCompleted', label: EVENT_TYPE_LABELS.ManufacturingCompleted },
  { value: 'ReturnToLEGORecorded', label: EVENT_TYPE_LABELS.ReturnToLEGORecorded },
  { value: 'CampaignCompleted', label: EVENT_TYPE_LABELS.CampaignCompleted },
];

// Field name formatting (matching EventTimeline)
function formatFieldName(key: string): string {
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

// Field value formatting (matching EventTimeline)
function formatFieldValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '—';

  if (key.toLowerCase().includes('date') && typeof value === 'string') {
    try {
      const date = new Date(value);
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return String(value);
    }
  }

  if (key.toLowerCase().includes('weight') && typeof value === 'number') {
    return `${value.toLocaleString()} kg`;
  }

  if (key.toLowerCase().includes('quantity') && typeof value === 'number') {
    return value.toLocaleString();
  }

  if (key === 'processHours' && typeof value === 'number') {
    return `${value} hrs`;
  }

  return String(value);
}

// Format timestamp for display
function formatTimestamp(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Format date for input[type="date"]
function formatDateForInput(dateString: string | null): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [selectedEventType, setSelectedEventType] = useState<EventType | ''>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchAuditLog = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');

      if (selectedCampaign) {
        params.set('campaignId', selectedCampaign);
      }
      if (selectedEventType) {
        params.set('eventType', selectedEventType);
      }
      if (startDate) {
        params.set('startDate', new Date(startDate).toISOString());
      }
      if (endDate) {
        // Set end of day for endDate
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        params.set('endDate', end.toISOString());
      }

      const response = await fetch(`/api/audit?${params}`);
      if (!response.ok) throw new Error('Failed to fetch audit log');

      const data: AuditResponse = await response.json();
      setEntries(data.entries);
      setCampaigns(data.campaigns);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [page, selectedCampaign, selectedEventType, startDate, endDate]);

  // Fetch on mount and when filters/pagination change
  useEffect(() => {
    fetchAuditLog();
  }, [fetchAuditLog]);

  // Reset to page 1 when filters change
  const handleCampaignChange = (value: string) => {
    setSelectedCampaign(value);
    setPage(1);
  };

  const handleEventTypeChange = (value: EventType | '') => {
    setSelectedEventType(value);
    setPage(1);
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    setPage(1);
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSelectedCampaign('');
    setSelectedEventType('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const hasFilters = selectedCampaign || selectedEventType || startDate || endDate;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Audit Log
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Track all data corrections across campaigns
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Campaign filter */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Campaign
            </label>
            <select
              value={selectedCampaign}
              onChange={(e) => handleCampaignChange(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            >
              <option value="">All Campaigns</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}
                </option>
              ))}
            </select>
          </div>

          {/* Event Type filter */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Event Type
            </label>
            <select
              value={selectedEventType}
              onChange={(e) => handleEventTypeChange(e.target.value as EventType | '')}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            >
              {EVENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={formatDateForInput(startDate)}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            />
          </div>

          <div className="flex-1">
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={formatDateForInput(endDate)}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            />
          </div>

          {/* Clear filters button */}
          {hasFilters && (
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results summary */}
      {!loading && !error && (
        <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          {total === 0 ? (
            'No corrections found'
          ) : (
            <>
              Showing {entries.length} of {total} correction{total !== 1 ? 's' : ''}
            </>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          <AuditTableSkeleton />
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-red-200 dark:border-red-800 overflow-hidden">
          <div className="px-6 py-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
              Failed to load audit log
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{error}</p>
          </div>
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="px-6 py-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
              <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
              No corrections found
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {hasFilters
                ? 'Try adjusting your filters.'
                : 'No data corrections have been made yet.'}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Campaign
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Corrected Event
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Changes
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      User
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-100">
                        {formatTimestamp(entry.createdAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <Link
                          href={`/campaigns/${entry.campaignId}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                          {entry.campaignCode}
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-100">
                        {EVENT_TYPE_LABELS[entry.correctedEventType] || entry.correctedEventType}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 max-w-xs truncate">
                        {entry.reason}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <DiffDisplay changes={entry.changes} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                        {entry.userId}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Diff display component
function DiffDisplay({
  changes,
}: {
  changes: Record<string, { was: unknown; now: unknown }>;
}) {
  const entries = Object.entries(changes);
  
  if (entries.length === 0) {
    return <span className="text-zinc-400">No changes</span>;
  }

  return (
    <div className="space-y-1">
      {entries.map(([key, change]) => (
        <div key={key} className="flex items-center gap-1 text-xs">
          <span className="text-zinc-500 dark:text-zinc-400 font-medium">
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
  );
}

// Loading skeleton
function AuditTableSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-4 py-3 text-left">
                <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
              </th>
              <th className="px-4 py-3 text-left">
                <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
              </th>
              <th className="px-4 py-3 text-left">
                <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
              </th>
              <th className="px-4 py-3 text-left">
                <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
              </th>
              <th className="px-4 py-3 text-left">
                <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
              </th>
              <th className="px-4 py-3 text-left">
                <div className="h-3 w-14 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                <td className="px-4 py-3">
                  <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-36 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <div className="h-3 w-40 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
