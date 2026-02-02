export default function ImportLoading() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded mb-4 animate-pulse" />
        <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mb-2 animate-pulse" />
        <div className="h-4 w-64 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
      </div>

      {/* Upload area skeleton */}
      <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-12">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-800 mb-4 animate-pulse" />
          <div className="h-5 w-36 bg-zinc-200 dark:bg-zinc-800 rounded mb-2 animate-pulse" />
          <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mb-4 animate-pulse" />
          <div className="h-10 w-28 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
