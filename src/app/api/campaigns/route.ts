import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCampaigns } from '@/lib/projections';
import { parseCampaignFilters } from '@/lib/validation/campaigns';
import type { CampaignFilters } from '@/types';

/**
 * GET /api/campaigns
 * 
 * List all campaigns from the projections table.
 * 
 * Query params:
 *   - status: Filter by status ('active' for non-completed, or specific status)
 *   - materialType: Filter by material type ('PI' or 'PCR')
 *   - echaApproved: Filter by ECHA approval ('true' or 'false')
 *   - dateFrom: Filter by created_at >= date (ISO string)
 *   - dateTo: Filter by created_at <= date (ISO string)
 *   - weightMin: Filter by current_weight_kg >= value
 *   - weightMax: Filter by current_weight_kg <= value
 *   - campaignCodePrefix: Filter by LEGO campaign code prefix
 */
export async function GET(request: NextRequest) {
  // Verify authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    
    // Validate query parameters using Zod schema
    const parseResult = parseCampaignFilters(searchParams);
    
    if (!parseResult.success) {
      // Format Zod errors into a user-friendly message
      const errors = parseResult.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      
      return NextResponse.json(
        { 
          error: 'Invalid query parameters',
          details: errors,
        },
        { status: 400 }
      );
    }
    
    const validated = parseResult.data;
    
    // Build filters object from validated params
    const filters: CampaignFilters = {};
    
    if (validated.status) {
      filters.status = validated.status;
    }
    
    if (validated.materialType) {
      filters.materialType = validated.materialType;
    }
    
    if (validated.echaApproved !== undefined) {
      filters.echaApproved = validated.echaApproved;
    }
    
    // Build date range if either date is provided
    if (validated.dateFrom || validated.dateTo) {
      filters.dateRange = {};
      if (validated.dateFrom) {
        filters.dateRange.start = validated.dateFrom;
      }
      if (validated.dateTo) {
        filters.dateRange.end = validated.dateTo;
      }
    }
    
    // Build weight range if either weight is provided
    if (validated.weightMin !== undefined || validated.weightMax !== undefined) {
      filters.weightRange = {};
      if (validated.weightMin !== undefined) {
        filters.weightRange.min = validated.weightMin;
      }
      if (validated.weightMax !== undefined) {
        filters.weightRange.max = validated.weightMax;
      }
    }
    
    if (validated.campaignCodePrefix) {
      filters.campaignCodePrefix = validated.campaignCodePrefix;
    }

    const campaigns = await getCampaigns(Object.keys(filters).length > 0 ? filters : undefined);

    return NextResponse.json({ campaigns });

  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}
