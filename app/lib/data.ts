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

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// =======================
// Revenue Chart
// =======================
export async function fetchRevenue(): Promise<Revenue[]> {
  try {
    const data = await sql<Revenue[]>`
      SELECT 
        TO_CHAR(date, 'Mon') AS month,
        SUM(amount) AS revenue
      FROM invoices
      GROUP BY TO_CHAR(date, 'Mon')
      ORDER BY MIN(date)
    `;
    return data;
  } catch (error) {
    console.error('Database Error (fetchRevenue):', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

// =======================
// Latest Invoices
// =======================
export async function fetchLatestInvoices(): Promise<LatestInvoiceRaw[]> {
  try {
    const data = await sql<LatestInvoiceRaw[]>`
      SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5
    `;
    return data.map((invoice) => ({
      ...invoice,
      amount: Number(invoice.amount),
    }));
  } catch (error) {
    console.error('Database Error (fetchLatestInvoices):', error);
    throw new Error('Failed to fetch latest invoices.');
  }
}

// =======================
// Card Data (Dashboard summary)
// =======================
export async function fetchCardData() {
  try {
    const [invoiceCountData, customerCountData, statusData] = await Promise.all([
      sql`SELECT COUNT(*) FROM invoices`,
      sql`SELECT COUNT(*) FROM customers`,
      sql`
        SELECT
          SUM(CASE WHEN status='paid' THEN amount ELSE 0 END) AS paid,
          SUM(CASE WHEN status='pending' THEN amount ELSE 0 END) AS pending
        FROM invoices
      `,
    ]);

    return {
      numberOfInvoices: Number(invoiceCountData[0].count),
      numberOfCustomers: Number(customerCountData[0].count),
      totalPaidInvoices: formatCurrency(Number(statusData[0].paid ?? 0)),
      totalPendingInvoices: formatCurrency(Number(statusData[0].pending ?? 0)),
    };
  } catch (error) {
    console.error('Database Error (fetchCardData):', error);
    throw new Error('Failed to fetch card data.');
  }
}

// =======================
// Filtered Invoices (with pagination)
// =======================
const ITEMS_PER_PAGE = 6;

export async function fetchFilteredInvoices(query: string, currentPage: number) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const invoices = await sql<InvoicesTable[]>`
      SELECT
        invoices.id,
        invoices.amount,
        invoices.date,
        invoices.status,
        customers.name,
        customers.email,
        customers.image_url
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
        invoices.amount::text ILIKE ${`%${query}%`} OR
        invoices.date::text ILIKE ${`%${query}%`} OR
        invoices.status ILIKE ${`%${query}%`}
      ORDER BY invoices.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    // Pastikan amount dikonversi ke USD untuk form edit
    return invoices.map((inv) => ({ ...inv, amount: Number(inv.amount) / 100 }));
  } catch (error) {
    console.error('Database Error (fetchFilteredInvoices):', error);
    throw new Error('Failed to fetch filtered invoices.');
  }
}

// =======================
// Total Pages for Pagination
// =======================
export async function fetchInvoicesPages(query: string) {
  try {
    const data = await sql`
      SELECT COUNT(*) AS total
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
        invoices.amount::text ILIKE ${`%${query}%`} OR
        invoices.date::text ILIKE ${`%${query}%`} OR
        invoices.status ILIKE ${`%${query}%`}
    `;
    return Math.ceil(Number(data[0].total) / ITEMS_PER_PAGE);
  } catch (error) {
    console.error('Database Error (fetchInvoicesPages):', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

// =======================
// Single Invoice by ID
// =======================
export async function fetchInvoiceById(id: string): Promise<InvoiceForm | null> {
  try {
    const data = await sql<InvoiceForm[]>`
      SELECT id, customer_id, amount, status
      FROM invoices
      WHERE id = ${id}
    `;
    if (!data || data.length === 0) return null;

    // konversi amount dari cents ke USD
    return {
      ...data[0],
      amount: Number(data[0].amount) / 100,
    };
    return invoice[0];
  } catch (error) {
    console.error('Database Error (fetchInvoiceById):', error);
    return null;
  }
}

// =======================
// Customers List
// =======================
export async function fetchCustomers(): Promise<CustomerField[]> {
  try {
    const customers = await sql<CustomerField[]>`
      SELECT id, name
      FROM customers
      ORDER BY name ASC
    `;
    return customers;
  } catch (error) {
    console.error('Database Error (fetchCustomers):', error);
    return [];
  }
}

// =======================
// Filtered Customers
// =======================
export async function fetchFilteredCustomers(query: string): Promise<CustomersTableType[]> {
  try {
    const data = await sql<CustomersTableType[]>`
      SELECT
        customers.id,
        customers.name,
        customers.email,
        customers.image_url,
        COUNT(invoices.id) AS total_invoices,
        SUM(CASE WHEN invoices.status='pending' THEN invoices.amount ELSE 0 END) AS total_pending,
        SUM(CASE WHEN invoices.status='paid' THEN invoices.amount ELSE 0 END) AS total_paid
      FROM customers
      LEFT JOIN invoices ON customers.id = invoices.customer_id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`}
      GROUP BY customers.id, customers.name, customers.email, customers.image_url
      ORDER BY customers.name ASC
    `;

    return data.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(Number(customer.total_pending ?? 0)),
      total_paid: formatCurrency(Number(customer.total_paid ?? 0)),
    }));
  } catch (error) {
    console.error('Database Error (fetchFilteredCustomers):', error);
    throw new Error('Failed to fetch filtered customers.');
  }
}