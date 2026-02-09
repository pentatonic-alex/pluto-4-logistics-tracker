/**
 * Campaign filter validation
 *
 * Validates query parameters for campaign filtering using Zod schemas.
 */

import { z } from 'zod';

/**
 * Zod schema for campaign filter query parameters
 */
const campaignFiltersSchema = z.object({
  status: z.enum([
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
    'active', // Special value for all non-completed statuses
  ]).optional(),
  materialType: z.enum(['PI', 'PCR']).optional(),
  echaApproved: z
    .string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  weightMin: z
    .string()
    .transform((val) => parseFloat(val))
    .pipe(z.number().nonnegative())
    .optional(),
  weightMax: z
    .string()
    .transform((val) => parseFloat(val))
    .pipe(z.number().nonnegative())
    .optional(),
  campaignCodePrefix: z.string().optional(),
});

/**
 * Parse and validate campaign filters from URLSearchParams
 */
export function parseCampaignFilters(searchParams: URLSearchParams) {
  const params: Record<string, string> = {};

  // Convert URLSearchParams to plain object
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }

  return campaignFiltersSchema.safeParse(params);
}
