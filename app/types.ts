export type Revenue = {
  month: string;
  revenue: number;
};

export type LatestInvoiceRaw = {
  id: string;
  name: string;
  email: string;
  image_url: string;
  amount: number;
};

export type InvoiceForm = {
  id: string;
  customer_id: string;
  amount: number;
  status: 'paid' | 'pending';
};

export type CustomerField = {
  id: string;
  name: string;
};

export type InvoicesTable = {
  id: string;
  name: string;
  email: string;
  image_url: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending';
};

export type CustomersTableType = {
  id: string;
  name: string;
  email: string;
  image_url: string;
  total_invoices: number;
  total_pending: number;
  total_paid: number;
};