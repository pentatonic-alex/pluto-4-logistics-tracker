'use client';

import { useState } from 'react';
import { CompactDiffView } from './DiffView';
import type { ImportPreviewResponse, CreatePreview, EventPreview, UpdatePreview, SkippedRow } from '@/types/import';

interface ImportPreviewProps {
  preview: ImportPreviewResponse;
  onSelectionChange: (preview: ImportPreviewResponse) => void;
}

type TabKey = 'creates' | 'events' | 'updates' | 'skipped';

export function ImportPreview({ preview, onSelectionChange }: ImportPreviewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('creates');

  const tabs: { key: TabKey; label: string; count: number; color: string }[] = [
    { key: 'creates', label: 'New Campaigns', count: preview.creates.length, color: 'green' },
    { key: 'events', label: 'New Events', count: preview.events.length, color: 'blue' },
    { key: 'updates', label: 'Updates', count: preview.updates.length, color: 'amber' },
    { key: 'skipped', label: 'Skipped', count: preview.skipped.length, color: 'zinc' },
  ];

  // Toggle selection for a single item
  const toggleItem = (type: 'creates' | 'events' | 'updates', id: string) => {
    const newPreview = { ...preview };
    const list = newPreview[type] as (CreatePreview | EventPreview | UpdatePreview)[];
    const item = list.find(i => i.id === id);
    if (item) {
      item.selected = !item.selected;
      onSelectionChange(newPreview);
    }
  };

  // Toggle all items in a category
  const toggleAll = (type: 'creates' | 'events' | 'updates', selected: boolean) => {
    const newPreview = { ...preview };
    const list = newPreview[type] as (CreatePreview | EventPreview | UpdatePreview)[];
    list.forEach(item => item.selected = selected);
    onSelectionChange(newPreview);
  };

  // Check if all items in category are selected
  const allSelected = (type: 'creates' | 'events' | 'updates'): boolean => {
    const list = preview[type] as (CreatePreview | EventPreview | UpdatePreview)[];
    return list.length > 0 && list.every(item => item.selected);
  };

  // Check if some items in category are selected
  const someSelected = (type: 'creates' | 'events' | 'updates'): boolean => {
    const list = preview[type] as (CreatePreview | EventPreview | UpdatePreview)[];
    const selected = list.filter(item => item.selected).length;
    return selected > 0 && selected < list.length;
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`
              flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors
              ${activeTab === tab.key
                ? 'text-zinc-900 dark:text-zinc-100 border-b-2 border-zinc-900 dark:border-zinc-100 -mb-[1px]'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              }
            `}
          >
            {tab.label}
            <span className={`
              px-1.5 py-0.5 text-xs rounded-full
              ${tab.color === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : ''}
              ${tab.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : ''}
              ${tab.color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : ''}
              ${tab.color === 'zinc' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400' : ''}
            `}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="overflow-x-auto">
        {activeTab === 'creates' && (
          <CreatesTable
            creates={preview.creates}
            onToggle={(id) => toggleItem('creates', id)}
            onToggleAll={(selected) => toggleAll('creates', selected)}
            allSelected={allSelected('creates')}
            someSelected={someSelected('creates')}
          />
        )}
        {activeTab === 'events' && (
          <EventsTable
            events={preview.events}
            onToggle={(id) => toggleItem('events', id)}
            onToggleAll={(selected) => toggleAll('events', selected)}
            allSelected={allSelected('events')}
            someSelected={someSelected('events')}
          />
        )}
        {activeTab === 'updates' && (
          <UpdatesTable
            updates={preview.updates}
            onToggle={(id) => toggleItem('updates', id)}
            onToggleAll={(selected) => toggleAll('updates', selected)}
            allSelected={allSelected('updates')}
            someSelected={someSelected('updates')}
          />
        )}
        {activeTab === 'skipped' && (
          <SkippedTable skipped={preview.skipped} />
        )}
      </div>
    </div>
  );
}

// Creates table
function CreatesTable({
  creates,
  onToggle,
  onToggleAll,
  allSelected,
  someSelected,
}: {
  creates: CreatePreview[];
  onToggle: (id: string) => void;
  onToggleAll: (selected: boolean) => void;
  allSelected: boolean;
  someSelected: boolean;
}) {
  if (creates.length === 0) {
    return <EmptyState message="No new campaigns to create" />;
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="text-left text-xs text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
          <th className="p-3 w-10">
            <input
              type="checkbox"
              checked={allSelected}
              ref={el => { if (el) el.indeterminate = someSelected; }}
              onChange={(e) => onToggleAll(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 focus:ring-zinc-500"
            />
          </th>
          <th className="p-3 font-medium">Campaign Code</th>
          <th className="p-3 font-medium">Material Type</th>
          <th className="p-3 font-medium">Source</th>
          <th className="p-3 font-medium">Inbound Shipment</th>
        </tr>
      </thead>
      <tbody>
        {creates.map((create) => (
          <tr
            key={create.id}
            className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
          >
            <td className="p-3">
              <input
                type="checkbox"
                checked={create.selected}
                onChange={() => onToggle(create.id)}
                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 focus:ring-zinc-500"
              />
            </td>
            <td className="p-3 font-medium text-zinc-900 dark:text-zinc-100">
              {create.campaignCode}
            </td>
            <td className="p-3">
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                create.materialType === 'PCR'
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                  : 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400'
              }`}>
                {create.materialType}
              </span>
            </td>
            <td className="p-3 text-sm text-zinc-500 dark:text-zinc-400">
              {create.source === 'inbound_shipment' ? 'Inbound Shipment' : 'Granulation'}
            </td>
            <td className="p-3 text-sm text-zinc-500 dark:text-zinc-400">
              {create.inboundShipmentPayload ? (
                <span>
                  {create.inboundShipmentPayload.netWeightKg} kg
                  {create.inboundShipmentPayload.carrier && ` via ${create.inboundShipmentPayload.carrier}`}
                </span>
              ) : '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Events table
function EventsTable({
  events,
  onToggle,
  onToggleAll,
  allSelected,
  someSelected,
}: {
  events: EventPreview[];
  onToggle: (id: string) => void;
  onToggleAll: (selected: boolean) => void;
  allSelected: boolean;
  someSelected: boolean;
}) {
  if (events.length === 0) {
    return <EmptyState message="No new events to record" />;
  }

  // Format event type for display
  const formatEventType = (type: string) => {
    return type.replace(/([A-Z])/g, ' $1').trim();
  };

  return (
    <table className="w-full">
      <thead>
        <tr className="text-left text-xs text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
          <th className="p-3 w-10">
            <input
              type="checkbox"
              checked={allSelected}
              ref={el => { if (el) el.indeterminate = someSelected; }}
              onChange={(e) => onToggleAll(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 focus:ring-zinc-500"
            />
          </th>
          <th className="p-3 font-medium">Campaign Code</th>
          <th className="p-3 font-medium">Event Type</th>
          <th className="p-3 font-medium">Source Sheet</th>
          <th className="p-3 font-medium">Key Data</th>
        </tr>
      </thead>
      <tbody>
        {events.map((event) => (
          <tr
            key={event.id}
            className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
          >
            <td className="p-3">
              <input
                type="checkbox"
                checked={event.selected}
                onChange={() => onToggle(event.id)}
                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 focus:ring-zinc-500"
              />
            </td>
            <td className="p-3 font-medium text-zinc-900 dark:text-zinc-100">
              {event.campaignCode}
            </td>
            <td className="p-3">
              <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                {formatEventType(event.eventType)}
              </span>
            </td>
            <td className="p-3 text-sm text-zinc-500 dark:text-zinc-400">
              {event.source}
            </td>
            <td className="p-3 text-xs text-zinc-500 dark:text-zinc-400">
              {formatPayloadSummary(event.payload as unknown as Record<string, unknown>)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Updates table
function UpdatesTable({
  updates,
  onToggle,
  onToggleAll,
  allSelected,
  someSelected,
}: {
  updates: UpdatePreview[];
  onToggle: (id: string) => void;
  onToggleAll: (selected: boolean) => void;
  allSelected: boolean;
  someSelected: boolean;
}) {
  if (updates.length === 0) {
    return <EmptyState message="No updates to apply" />;
  }

  // Format event type for display
  const formatEventType = (type: string) => {
    return type.replace(/([A-Z])/g, ' $1').trim();
  };

  return (
    <table className="w-full">
      <thead>
        <tr className="text-left text-xs text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
          <th className="p-3 w-10">
            <input
              type="checkbox"
              checked={allSelected}
              ref={el => { if (el) el.indeterminate = someSelected; }}
              onChange={(e) => onToggleAll(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 focus:ring-zinc-500"
            />
          </th>
          <th className="p-3 font-medium">Campaign Code</th>
          <th className="p-3 font-medium">Corrects</th>
          <th className="p-3 font-medium">Source Sheet</th>
          <th className="p-3 font-medium">Changes</th>
        </tr>
      </thead>
      <tbody>
        {updates.map((update) => (
          <tr
            key={update.id}
            className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
          >
            <td className="p-3 align-top">
              <input
                type="checkbox"
                checked={update.selected}
                onChange={() => onToggle(update.id)}
                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 focus:ring-zinc-500"
              />
            </td>
            <td className="p-3 font-medium text-zinc-900 dark:text-zinc-100 align-top">
              {update.campaignCode}
            </td>
            <td className="p-3 align-top">
              <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                {formatEventType(update.correctsEventType)}
              </span>
            </td>
            <td className="p-3 text-sm text-zinc-500 dark:text-zinc-400 align-top">
              {update.source}
            </td>
            <td className="p-3 align-top">
              <CompactDiffView changes={update.changes} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Skipped table
function SkippedTable({ skipped }: { skipped: SkippedRow[] }) {
  if (skipped.length === 0) {
    return <EmptyState message="No rows were skipped" />;
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="text-left text-xs text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
          <th className="p-3 font-medium">Row</th>
          <th className="p-3 font-medium">Campaign Code</th>
          <th className="p-3 font-medium">Source Sheet</th>
          <th className="p-3 font-medium">Reason</th>
        </tr>
      </thead>
      <tbody>
        {skipped.map((row) => (
          <tr
            key={row.id}
            className="border-b border-zinc-100 dark:border-zinc-800 last:border-0"
          >
            <td className="p-3 text-sm text-zinc-500 dark:text-zinc-400">
              #{row.rowNumber}
            </td>
            <td className="p-3 font-medium text-zinc-900 dark:text-zinc-100">
              {row.campaignCode || '—'}
            </td>
            <td className="p-3 text-sm text-zinc-500 dark:text-zinc-400">
              {row.source}
            </td>
            <td className="p-3 text-sm text-zinc-500 dark:text-zinc-400">
              {row.reason}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Empty state
function EmptyState({ message }: { message: string }) {
  return (
    <div className="p-12 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
        <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
    </div>
  );
}

// Format payload for summary display
function formatPayloadSummary(payload: Record<string, unknown>): string {
  const parts: string[] = [];
  
  if (payload.netWeightKg || payload.outputWeightKg) {
    parts.push(`${payload.netWeightKg || payload.outputWeightKg} kg`);
  }
  if (payload.ticketNumber && payload.ticketNumber !== 'IMPORT') {
    parts.push(`Ticket: ${payload.ticketNumber}`);
  }
  if (payload.batchNumber && payload.batchNumber !== 'IMPORT') {
    parts.push(`Batch: ${payload.batchNumber}`);
  }
  if (payload.carrier) {
    parts.push(`via ${payload.carrier}`);
  }
  if (payload.poNumber) {
    parts.push(`PO: ${payload.poNumber}`);
  }
  
  return parts.join(' • ') || '—';
}
