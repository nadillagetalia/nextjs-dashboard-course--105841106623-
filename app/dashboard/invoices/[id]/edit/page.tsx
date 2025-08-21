import EditForm from '@/app/ui/invoices/edit-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { fetchInvoiceById, fetchCustomers } from '@/app/lib/data';
import { Invoice, Customer } from '@/app/types';
import { notFound } from 'next/navigation';

interface PageProps {
  params: { id: string };
}

export default async function EditInvoicePage({ params }: PageProps) {
  const id = params.id;

  // Ambil data invoice dan daftar customer secara paralel
  const [invoice, customers]: [Invoice | null, Customer[]] = await Promise.all([
    fetchInvoiceById(id),
    fetchCustomers(),
  ]);

  // Jika invoice tidak ditemukan, redirect ke 404 page
  if (!invoice) {
    notFound();
  }

  return (
    <main className="p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Invoices', href: '/dashboard/invoices' },
          { label: 'Edit Invoice', href: `/dashboard/invoices/${id}/edit`, active: true },
        ]}
      />

      {/* Form edit invoice */}
      <EditForm invoice={invoice} customers={customers} />
    </main>
  );
}