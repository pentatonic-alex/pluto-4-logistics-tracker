'use client';

import type { EventType } from '@/types';

/**
 * Event type metadata with human-readable labels and descriptions.
 * Excludes CampaignCreated since that's handled separately via campaign creation.
 */
export const EVENT_TYPE_OPTIONS: {
  value: EventType;
  label: string;
  description: string;
  category: 'logistics' | 'processing' | 'approval' | 'manufacturing' | 'lifecycle';
}[] = [
  {
    value: 'InboundShipmentRecorded',
    label: 'Inbound Shipment',
    description: 'Record material arrival at MBA',
    category: 'logistics',
  },
  {
    value: 'GranulationCompleted',
    label: 'Granulation Complete',
    description: 'Material has been granulated',
    category: 'processing',
  },
  {
    value: 'MetalRemovalCompleted',
    label: 'Metal Removal Complete',
    description: 'Metals have been removed from material',
    category: 'processing',
  },
  {
    value: 'PolymerPurificationCompleted',
    label: 'Polymer Purification Complete',
    description: 'Polymer has been purified',
    category: 'processing',
  },
  {
    value: 'ExtrusionCompleted',
    label: 'Extrusion Complete',
    description: 'Material has been extruded into pellets',
    category: 'processing',
  },
  {
    value: 'ECHAApprovalRecorded',
    label: 'ECHA Approval',
    description: 'ECHA compliance approval received',
    category: 'approval',
  },
  {
    value: 'TransferToRGERecorded',
    label: 'Transfer to RGE',
    description: 'Material shipped to RGE for manufacturing',
    category: 'logistics',
  },
  {
    value: 'ManufacturingStarted',
    label: 'Manufacturing Started',
    description: 'Production has begun at RGE',
    category: 'manufacturing',
  },
  {
    value: 'ManufacturingCompleted',
    label: 'Manufacturing Complete',
    description: 'Production completed at RGE',
    category: 'manufacturing',
  },
  {
    value: 'ReturnToLEGORecorded',
    label: 'Return to LEGO',
    description: 'Finished goods shipped back to LEGO',
    category: 'logistics',
  },
  {
    value: 'CampaignCompleted',
    label: 'Campaign Complete',
    description: 'Mark campaign as fully completed',
    category: 'lifecycle',
  },
];

// Category labels for grouping
const CATEGORY_LABELS: Record<string, string> = {
  logistics: 'Logistics',
  processing: 'Processing at MBA',
  approval: 'Compliance',
  manufacturing: 'Manufacturing at RGE',
  lifecycle: 'Campaign Lifecycle',
};

interface EventTypeSelectorProps {
  value: EventType | '';
  onChange: (value: EventType) => void;
  disabled?: boolean;
  showDescriptions?: boolean;
  className?: string;
}

export function EventTypeSelector({
  value,
  onChange,
  disabled = false,
  showDescriptions = false,
  className = '',
}: EventTypeSelectorProps) {
  // Group options by category
  const groupedOptions = EVENT_TYPE_OPTIONS.reduce(
    (acc, option) => {
      if (!acc[option.category]) {
        acc[option.category] = [];
      }
      acc[option.category].push(option);
      return acc;
    },
    {} as Record<string, typeof EVENT_TYPE_OPTIONS>
  );

  const selectedOption = EVENT_TYPE_OPTIONS.find((opt) => opt.value === value);

  return (
    <div className={className}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as EventType)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">Select event type...</option>
        {Object.entries(groupedOptions).map(([category, options]) => (
          <optgroup key={category} label={CATEGORY_LABELS[category]}>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {showDescriptions && selectedOption && (
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {selectedOption.description}
        </p>
      )}
    </div>
  );
}

/**
 * Get the label for an event type
 */
export function getEventTypeLabel(eventType: EventType): string {
  if (eventType === 'CampaignCreated') return 'Campaign Created';
  const option = EVENT_TYPE_OPTIONS.find((opt) => opt.value === eventType);
  return option?.label || eventType;
}

/**
 * Get the description for an event type
 */
export function getEventTypeDescription(eventType: EventType): string {
  if (eventType === 'CampaignCreated') return 'Campaign was created';
  const option = EVENT_TYPE_OPTIONS.find((opt) => opt.value === eventType);
  return option?.description || '';
}
