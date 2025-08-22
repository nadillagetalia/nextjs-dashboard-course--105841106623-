import EditForm from '@/app/ui/invoices/edit-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { fetchInvoiceById, fetchCustomers } from '@/app/lib/data';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>; // ✅ sesuai Next.js App Router type
}

export default async function EditInvoicePage({ params }: PageProps) {
  const { id } = await params; // ✅ tunggu params karena sekarang berupa Promise

  const [invoice, customers] = await Promise.all([
    fetchInvoiceById(id),
    fetchCustomers(),
  ]);

  if (!invoice) {
    notFound();
  }

  return (
    <main className="p-6">
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Invoices', href: '/dashboard/invoices' },
          { label: 'Edit Invoice', href: `/dashboard/invoices/${id}/edit`, active: true },
        ]}
      />
      <EditForm invoice={invoice} customers={customers} />
    </main>
  );
}