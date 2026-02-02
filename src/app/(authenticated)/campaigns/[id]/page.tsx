import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getCampaignById } from '@/lib/projections';
import { getEventsForStream } from '@/lib/events';
import { isValidCampaignId } from '@/lib/ids';
import { EventTimeline } from '@/components/EventTimeline';
import { StatusBadge } from '@/components/StatusBadge';
import { ExportButton } from '@/components/ExportButton';
import type { Campaign } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

function CampaignHeader({ campaign }: { campaign: Campaign }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {campaign.legoCampaignCode}
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {campaign.materialType}
            </span>
          </div>
          {campaign.description && (
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">{campaign.description}</p>
          )}
        </div>
        <div className="flex-shrink-0">
          <StatusBadge status={campaign.status} />
        </div>
      </div>

      <dl className="mt-4 sm:mt-6 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
        <div>
          <dt className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">Current Step</dt>
          <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
            {campaign.currentStep || '—'}
          </dd>
        </div>
        <div>
          <dt className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">Current Weight</dt>
          <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
            {campaign.currentWeightKg ? `${campaign.currentWeightKg.toLocaleString()} kg` : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">ECHA Status</dt>
          <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
            {campaign.echaApproved ? (
              <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Approved
              </span>
            ) : (
              <span className="text-zinc-400 dark:text-zinc-500">Pending</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">Next Step</dt>
          <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
            {campaign.nextExpectedStep || '—'}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export default async function CampaignDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) {
    return null;
  }

  const { id } = await params;

  if (!isValidCampaignId(id)) {
    notFound();
  }

  const campaign = await getCampaignById(id);
  if (!campaign) {
    notFound();
  }

  const events = await getEventsForStream('campaign', id);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
      </nav>

      {/* Campaign header */}
      <CampaignHeader campaign={campaign} />

      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6 sm:mt-8 mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Event History
        </h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <ExportButton
            campaignId={id}
            label="Export"
            variant="secondary"
            className="w-full sm:w-auto"
          />
          {campaign.status !== 'completed' && (
            <Link
              href={`/campaigns/${id}/log`}
              className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors inline-flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Log Event
            </Link>
          )}
        </div>
      </div>

      {/* Event timeline */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
        <EventTimeline 
          events={events} 
          campaignId={id}
        />
      </div>

      {/* Campaign metadata footer */}
      <div className="mt-6 text-xs text-zinc-400 dark:text-zinc-500">
        <p>
          Created: {new Date(campaign.createdAt).toLocaleString()} • Last Updated:{' '}
          {new Date(campaign.updatedAt).toLocaleString()}
        </p>
        <p className="font-mono mt-1">{campaign.id}</p>
      </div>
    </div>
  );
}
