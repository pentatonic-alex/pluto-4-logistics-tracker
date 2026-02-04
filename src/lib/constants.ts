import type { CampaignStatus } from '@/types';

/**
 * Human-readable labels for campaign statuses
 */
export const STATUS_LABELS: Record<CampaignStatus, string> = {
  created: 'Created',
  inbound_shipment_recorded: 'Inbound Shipment',
  granulation_complete: 'Granulation',
  metal_removal_complete: 'Metal Removal',
  polymer_purification_complete: 'Purification',
  extrusion_complete: 'Extrusion',
  echa_approved: 'ECHA Approved',
  transferred_to_rge: 'At RGE',
  manufacturing_started: 'Manufacturing',
  manufacturing_complete: 'Mfg Complete',
  returned_to_lego: 'Returned',
  completed: 'Completed',
};

/**
 * Color mapping for each status - used for badges and visual indicators
 */
export const STATUS_COLORS: Record<CampaignStatus, { bg: string; text: string; dot: string }> = {
  created: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    dot: 'bg-slate-500',
  },
  inbound_shipment_recorded: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  granulation_complete: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  metal_removal_complete: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
    dot: 'bg-orange-500',
  },
  polymer_purification_complete: {
    bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    text: 'text-cyan-700 dark:text-cyan-300',
    dot: 'bg-cyan-500',
  },
  extrusion_complete: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    text: 'text-indigo-700 dark:text-indigo-300',
    dot: 'bg-indigo-500',
  },
  echa_approved: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
    dot: 'bg-purple-500',
  },
  transferred_to_rge: {
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    text: 'text-pink-700 dark:text-pink-300',
    dot: 'bg-pink-500',
  },
  manufacturing_started: {
    bg: 'bg-rose-100 dark:bg-rose-900/30',
    text: 'text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500',
  },
  manufacturing_complete: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  returned_to_lego: {
    bg: 'bg-teal-100 dark:bg-teal-900/30',
    text: 'text-teal-700 dark:text-teal-300',
    dot: 'bg-teal-500',
  },
  completed: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    dot: 'bg-green-500',
  },
};

/**
 * All valid campaign statuses in order of progression
 */
export const CAMPAIGN_STATUSES: CampaignStatus[] = [
  'created',
  'inbound_shipment_recorded',
  'granulation_complete',
  'metal_removal_complete',
  'polymer_purification_complete',
  'extrusion_complete',
  'echa_approved',
  'transferred_to_rge',
  'manufacturing_started',
  'manufacturing_complete',
  'returned_to_lego',
  'completed',
];
