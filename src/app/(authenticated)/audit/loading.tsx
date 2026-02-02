export default function AuditLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header skeleton */}
      <div className="mb-6">
        <div className="h-7 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-2" />
        <div className="h-4 w-64 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
      </div>

      {/* Filters skeleton */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-2" />
            <div className="h-10 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-2" />
            <div className="h-10 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-2" />
            <div className="h-10 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>

      {/* Results summary skeleton */}
      <div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-4" />

      {/* Table skeleton */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-4 py-3 text-left">
                  <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="h-3 w-14 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td className="px-4 py-3">
                    <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-36 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="h-3 w-40 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
