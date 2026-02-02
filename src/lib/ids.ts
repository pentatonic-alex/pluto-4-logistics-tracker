import { ulid } from 'ulid';

/**
 * Generate canonical IDs for different entity types
 * Format: {prefix}_{ulid}
 * 
 * ULIDs are:
 * - Lexicographically sortable (timestamp-based)
 * - URL-safe
 * - 26 characters
 */

export function generateCampaignId(): string {
  return `cmp_${ulid()}`;
}

export function generateEventId(): string {
  return `evt_${ulid()}`;
}

// Validate ID format
export function isValidCampaignId(id: string): boolean {
  return /^cmp_[0-9A-Z]{26}$/.test(id);
}

export function isValidEventId(id: string): boolean {
  return /^evt_[0-9A-Z]{26}$/.test(id);
}
