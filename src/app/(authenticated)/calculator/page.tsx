import { getLatestCampaignYields } from '@/lib/analytics';
import { CalculatorForm } from '@/components/calculator/CalculatorForm';

export const dynamic = 'force-dynamic';

export default async function CalculatorPage() {
  // Fetch latest yields for initial slider values
  const initialYields = await getLatestCampaignYields();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Material Calculator
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Calculate required inbound material or estimate possible output
        </p>
      </div>

      {/* Calculator Form */}
      <CalculatorForm initialYields={initialYields} />
    </div>
  );
}
