import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { auth } from '@/lib/auth';
import { getAnalyticsData } from '@/lib/analytics';
import {
  buildAnalyticsWorkbook,
  workbookToBuffer,
} from '@/lib/excel-exporter';

/**
 * GET /api/analytics/export
 *
 * Export analytics data to Excel or CSV.
 *
 * Query parameters:
 * - format: 'xlsx' (default) or 'csv'
 *
 * Returns an xlsx or csv file with analytics data (Overview, Yields, Throughput).
 */
export async function GET(request: NextRequest) {
  // Verify authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'xlsx';

    // Validate format parameter
    if (format !== 'xlsx' && format !== 'csv') {
      return NextResponse.json(
        { error: 'Invalid format. Must be "xlsx" or "csv"' },
        { status: 400 }
      );
    }

    // Fetch analytics data
    const analyticsData = await getAnalyticsData();

    // Build workbook
    const workbook = buildAnalyticsWorkbook(analyticsData);

    // Generate filename
    const dateStr = new Date().toISOString().split('T')[0];
    const baseFilename = `analytics-export-${dateStr}`;

    if (format === 'csv') {
      // Convert first sheet (Overview) to CSV
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const csv = XLSX.utils.sheet_to_csv(worksheet);

      // Return CSV file
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${baseFilename}.csv"`,
          'Content-Length': Buffer.byteLength(csv).toString(),
        },
      });
    } else {
      // Convert workbook to buffer for Excel export
      const buffer = workbookToBuffer(workbook);

      // Return Excel file (convert Buffer to Uint8Array for TypeScript compatibility)
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${baseFilename}.xlsx"`,
          'Content-Length': buffer.length.toString(),
        },
      });
    }
  } catch (error) {
    console.error('Error exporting analytics:', error);
    return NextResponse.json(
      { error: 'Failed to export analytics data' },
      { status: 500 }
    );
  }
}
