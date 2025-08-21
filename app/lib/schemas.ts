// /app/lib/schemas.ts
import { z } from 'zod';

// Schema utama
export const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

// Schema untuk create dan update
export const CreateInvoiceSchema = FormSchema.omit({ id: true, date: true });
export const UpdateInvoiceSchema = FormSchema.omit({ id: true, date: true });