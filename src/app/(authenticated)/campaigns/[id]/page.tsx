import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getCampaignById } from '@/lib/projections';
import { getEventsForStream } from '@/lib/events';
import { isValidCampaignId } from '@/lib/ids';
import { CampaignDetailClient } from '@/components/CampaignDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
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
    <CampaignDetailClient
      campaign={campaign}
      events={events}
    />
  );
}
