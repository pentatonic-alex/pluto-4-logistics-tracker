import { Navigation } from '@/components/Navigation';
import { Providers } from '@/components/Providers';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="min-h-screen">
        <Navigation />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>
      </div>
    </Providers>
  );
}
