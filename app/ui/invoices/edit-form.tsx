'use client';

import { CustomerField, InvoiceForm } from '@/app/lib/definitions';
import { CheckIcon, ClockIcon, CurrencyDollarIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Button } from '@/app/ui/button';
import { updateInvoice, State } from '@/app/lib/actions';
import { useActionState } from 'react';

interface Props {
  invoice: InvoiceForm;
  customers: CustomerField[];
}

export default function EditInvoiceForm({ invoice, customers }: Props) {
  const initialState: State = { message: null, errors: {} };

  // Bind invoice.id sebagai parameter pertama (prevState nanti akan diteruskan otomatis)
  const updateInvoiceWithId = updateInvoice.bind(null, invoice.id);

  // Gunakan useActionState untuk form submission
  const [state, formAction] = useActionState(updateInvoiceWithId, initialState);

  return (
    <form action={formAction}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {/* Customer Select */}
        <div className="mb-4">
          <label htmlFor="customer" className="mb-2 block text-sm font-medium">
            Choose customer
          </label>
          <div className="relative">
            <select
              id="customer"
              name="customerId"
              className="peer block w-full cursor-pointer rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              defaultValue={invoice.customer_id}
            >
              <option value="" disabled>
                Select a customer
              </option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
            <UserCircleIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
          </div>
        </div>

        {/* Amount */}
        <div className="mb-4">
          <label htmlFor="amount" className="mb-2 block text-sm font-medium">
            Enter Amount
          </label>
          <div className="relative mt-2 rounded-md">
            <input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              defaultValue={invoice.amount.toFixed(2)}
              placeholder="Enter USD amount"
              className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              required
            />
            <CurrencyDollarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
          </div>
        </div>

        {/* Status */}
        <fieldset>
          <legend className="mb-2 block text-sm font-medium">Invoice Status</legend>
          <div className="rounded-md border border-gray-200 bg-white px-4 py-3">
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  value="pending"
                  defaultChecked={invoice.status === 'pending'}
                  className="h-4 w-4 cursor-pointer border-gray-300 bg-gray-100 text-gray-600 focus:ring-2"
                />
                Pending <ClockIcon className="h-4 w-4" />
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  value="paid"
                  defaultChecked={invoice.status === 'paid'}
                  className="h-4 w-4 cursor-pointer border-gray-300 bg-gray-100 text-gray-600 focus:ring-2"
                />
                Paid <CheckIcon className="h-4 w-4" />
              </label>
            </div>
          </div>
        </fieldset>
      </div>

      {/* Buttons */}
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/invoices"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit" disabled={state.isPending}>
          {state.isPending ? 'Updating...' : 'Update Invoice'}
        </Button>
      </div>
    </form>
  );
}