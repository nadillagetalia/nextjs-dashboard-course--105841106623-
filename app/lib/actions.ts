'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// --------------------
// Zod Schema
// --------------------
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string().nonempty('Please select a customer.'),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

const CreateInvoiceSchema = FormSchema.omit({ id: true, date: true });
const UpdateInvoiceSchema = FormSchema.omit({ id: true, date: true });

// --------------------
// State Type
// --------------------
export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

// --------------------
// Create Invoice
// --------------------
export async function createInvoice(
  prevState: State,
  formData: FormData
): Promise<State> {
  const validatedFields = CreateInvoiceSchema.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing or invalid fields. Failed to create invoice.',
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;

  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status)
      VALUES (${customerId}, ${amountInCents}, ${status})
    `;
  } catch (error) {
    console.error('Database Error (createInvoice):', error);
    return { message: 'Database Error: Failed to create invoice.' };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');

  return { message: null, errors: {} }; // Tidak akan dieksekusi, tapi diperlukan untuk tipe
}

// --------------------
// Update Invoice
// --------------------
export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData
): Promise<State> {
  const validatedFields = UpdateInvoiceSchema.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing or invalid fields. Failed to update invoice.',
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;

  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  } catch (error) {
    console.error('Database Error (updateInvoice):', error);
    return { message: 'Database Error: Failed to update invoice.' };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');

  return { message: null, errors: {} };
}

// --------------------
// Delete Invoice
// --------------------
export async function deleteInvoice(id: string): Promise<State> {
  try {
    await sql`
      DELETE FROM invoices
      WHERE id = ${id}
    `;
  } catch (error) {
    console.error('Database Error (deleteInvoice):', error);
    return { message: 'Database Error: Failed to delete invoice.' };
  }

  revalidatePath('/dashboard/invoices');
  return { message: null, errors: {} };
}

// --------------------
// Authenticate User
// --------------------
export async function authenticate(
  prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  try {
    await signIn('credentials', formData);
    return undefined; // ✅ Berikan explicit return undefined jika sukses
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.'; // ✅ return string kalau gagal
        default:
          return 'Something went wrong.';
      }
    }
    throw error; // tetap lempar error kalau bukan AuthError
  }
}