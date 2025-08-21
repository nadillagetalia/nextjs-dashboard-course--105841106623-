import CardWrapper from '@/app/ui/dashboard/cards';
import RevenueChart from '@/app/ui/dashboard/revenue-chart';
import LatestInvoices from '@/app/ui/dashboard/latest-invoices';
import { lusitana } from '@/app/ui/fonts';
import { Suspense } from 'react';
import { RevenueChartSkeleton, LatestInvoicesSkeleton, CardsSkeleton } from '@/app/ui/skeletons';
import { fetchRevenue, fetchLatestInvoices } from '@/app/lib/data';
import { Revenue } from '@/app/lib/definitions';

export default async function DashboardPage() {
  // Ambil data dari database
  const revenueData: Revenue[] = await fetchRevenue();
  const latestInvoicesData = await fetchLatestInvoices();

  return (
    <main className="p-6">
      <h1 className={`${lusitana.className} mb-6 text-xl md:text-2xl font-semibold`}>
        Dashboard
      </h1>

      {/* Statistik Kartu */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<CardsSkeleton />}>
          <CardWrapper />
        </Suspense>
      </div>

      {/* Grafik & Latest Invoices */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
        {/* Revenue Chart */}
        <Suspense fallback={<RevenueChartSkeleton />}>
          <RevenueChart revenue={revenueData} />
        </Suspense>

        {/* Latest Invoices */}
        <Suspense fallback={<LatestInvoicesSkeleton />}>
          <LatestInvoices invoices={latestInvoicesData} />
        </Suspense>
      </div>
    </main>
  );
}