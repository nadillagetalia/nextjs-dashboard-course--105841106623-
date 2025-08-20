import postgres from 'postgres';
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
} from './definitions';
import { formatCurrency } from './utils';

// Hubungkan ke database PostgreSQL via env variable
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// ==================== Revenue ====================
export async function fetchRevenue(): Promise<Revenue[]> {
  try {
    const data = await sql<Revenue[]>`
      SELECT month, revenue
      FROM revenue
      ORDER BY month ASC
    `;
    return data;
  } catch (error) {
    console.error('Database Error (fetchRevenue):', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

// ==================== Latest Invoices ====================
export async function fetchLatestInvoices(): Promise<LatestInvoiceRaw[]> {
  try {
    const data = await sql<LatestInvoiceRaw[]>`
      SELECT invoices.id, invoices.amount, customers.name, customers.image_url, customers.email
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5
    `;

    return data.map(invoice => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
  } catch (error) {
    console.error('Database Error (fetchLatestInvoices):', error);
    throw new Error('Failed to fetch latest invoices.');
  }
}

// ==================== Card Data ====================
export async function fetchCardData() {
  try {
    const invoiceCountPromise = sql`SELECT COUNT(*) FROM invoices`;
    const customerCountPromise = sql`SELECT COUNT(*) FROM customers`;
    const invoiceStatusPromise = sql`
      SELECT
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS paid,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS pending
      FROM invoices
    `;

    const [invoiceCount, customerCount, invoiceStatus] = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    const numberOfInvoices = Number(invoiceCount[0].count ?? 0);
    const numberOfCustomers = Number(customerCount[0].count ?? 0);
    const totalPaidInvoices = formatCurrency(invoiceStatus[0].paid ?? 0);
    const totalPendingInvoices = formatCurrency(invoiceStatus[0].pending ?? 0);

    return { numberOfInvoices, numberOfCustomers, totalPaidInvoices, totalPendingInvoices };
  } catch (error) {
    console.error('Database Error (fetchCardData):', error);
    throw new Error('Failed to fetch card data.');
  }
}

// ==================== Customers ====================
export async function fetchCustomers(): Promise<CustomerField[]> {
  try {
    return await sql<CustomerField[]>`
      SELECT id, name
      FROM customers
      ORDER BY name ASC
    `;
  } catch (error) {
    console.error('Database Error (fetchCustomers):', error);
    throw new Error('Failed to fetch customers.');
  }
}

// ==================== Invoices ====================
export async function fetchInvoices(): Promise<InvoicesTable[]> {
  try {
    return await sql<InvoicesTable[]>`
      SELECT invoices.id, invoices.amount, invoices.date, invoices.status, customers.name
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
    `;
  } catch (error) {
    console.error('Database Error (fetchInvoices):', error);
    throw new Error('Failed to fetch invoices.');
  }
}

// ==================== Invoice by ID ====================
export async function fetchInvoiceById(id: string): Promise<InvoiceForm | null> {
  try {
    const [invoice] = await sql<InvoiceForm[]>`
      SELECT id, customer_id, amount, status
      FROM invoices
      WHERE id = ${id}
    `;
    return invoice || null;
  } catch (error) {
    console.error('Database Error (fetchInvoiceById):', error);
    throw new Error('Failed to fetch invoice by ID.');
  }
}

// ==================== Filtered Customers ====================
export async function fetchFilteredCustomers(query: string): Promise<CustomersTableType[]> {
  try {
    const data = await sql<CustomersTableType[]>`
      SELECT
        customers.id,
        customers.name,
        customers.email,
        customers.image_url,
        COUNT(invoices.id) AS total_invoices,
        SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
        SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
      FROM customers
      LEFT JOIN invoices ON customers.id = invoices.customer_id
      WHERE customers.name ILIKE ${`%${query}%`} OR customers.email ILIKE ${`%${query}%`}
      GROUP BY customers.id, customers.name, customers.email, customers.image_url
      ORDER BY customers.name ASC
    `;

    return data.map(customer => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));
  } catch (error) {
    console.error('Database Error (fetchFilteredCustomers):', error);
    throw new Error('Failed to fetch filtered customers.');
  }
}