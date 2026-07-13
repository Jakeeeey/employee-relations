import type {
  Supplier,
  ExpenseDraft,
  ExpenseDraftHeader,
  COA,
  DisbursementDraft,
} from "../types/supervisor-wer.schema";

const BASE_URL = "/api/er/expense-report/supervisor-wer";

/**
 * Fetches the list of active suppliers from Directus.
 * @returns {Promise<Supplier[]>} A promise resolving to the list of suppliers.
 */
export async function fetchSuppliersList(): Promise<Supplier[]> {
  const res = await fetch(`${BASE_URL}?resource=suppliers`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to fetch suppliers list");
  }
  const data = await res.json();
  return (data.data || []) as Supplier[];
}

/**
 * Fetches the list of weekly report headers created by the supervisor.
 * @returns {Promise<ExpenseDraftHeader[]>} A promise resolving to the list of headers.
 */
export async function fetchHeadersList(): Promise<ExpenseDraftHeader[]> {
  const res = await fetch(`${BASE_URL}?resource=headers-list`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to fetch headers list");
  }
  const data = await res.json();
  return (data.data || []) as ExpenseDraftHeader[];
}

/**
 * Creates a new weekly expense draft header.
 * @param {object} payload - The header details.
 * @param {number} payload.payee_id - The assigned supplier ID.
 * @param {string} payload.period_from - Start of the period (YYYY-MM-DD).
 * @param {string} payload.period_to - End of the period (YYYY-MM-DD).
 * @param {string} [payload.remarks] - Optional remarks.
 * @returns {Promise<ExpenseDraftHeader>} A promise resolving to the created header.
 */
export async function createHeader(payload: {
  payee_id: number;
  period_from: string;
  period_to: string;
  remarks?: string;
}): Promise<ExpenseDraftHeader> {
  const res = await fetch(`${BASE_URL}?resource=header`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to create weekly report header");
  }
  const data = await res.json();
  return data.data as ExpenseDraftHeader;
}

/**
 * Fetches the details of a weekly expense draft header by ID.
 * @param {number} headerId - The ID of the header.
 * @returns {Promise<{ header: ExpenseDraftHeader | null; voucher: any | null }>} A promise resolving to the header and voucher details.
 */
export async function fetchWeeklyHeader(
  headerId: number
): Promise<{ header: ExpenseDraftHeader | null; voucher: DisbursementDraft | null }> {
  const res = await fetch(
    `${BASE_URL}?resource=header&header_id=${headerId}`
  );
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to fetch weekly header details");
  }
  return res.json();
}

/**
 * Fetches the expense draft lines for a given header ID.
 * @param {number} headerId - The ID of the weekly header.
 * @returns {Promise<ExpenseDraft[]>} A promise resolving to the list of expense drafts.
 */
export async function fetchExpenses(headerId: number): Promise<ExpenseDraft[]> {
  const res = await fetch(`${BASE_URL}?resource=expenses&header_id=${headerId}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to fetch weekly expenses");
  }
  const data = await res.json();
  return (data.data || []) as ExpenseDraft[];
}

/**
 * Fetches expense items returned with concern for a supplier under the supervisor's ownership.
 * @param {number} supplierId - The ID of the supplier.
 * @returns {Promise<ExpenseDraft[]>} A promise resolving to the list of returned expense drafts.
 */
export async function fetchReturnedExpenses(supplierId: number): Promise<ExpenseDraft[]> {
  const res = await fetch(`${BASE_URL}?resource=returned-expenses&supplier_id=${supplierId}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to fetch returned expenses");
  }
  const data = await res.json();
  return (data.data || []) as ExpenseDraft[];
}

/**
 * Fetches the list of GL Accounts (Chart of Accounts).
 * @returns {Promise<COA[]>} A promise resolving to the list of GL Accounts.
 */
export async function fetchChartOfAccounts(): Promise<COA[]> {
  const res = await fetch(`${BASE_URL}?resource=coa`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to fetch Chart of Accounts");
  }
  const data = await res.json();
  return (data.data || []) as COA[];
}

/**
 * Creates or updates a single expense line item.
 * @param {Partial<ExpenseDraft>} expenseData - The expense item data.
 * @returns {Promise<ExpenseDraft>} A promise resolving to the saved expense draft.
 */
export async function createOrUpdateExpense(
  expenseData: Partial<ExpenseDraft>
): Promise<ExpenseDraft> {
  const isNew = !expenseData.id;
  const url = isNew ? `${BASE_URL}?resource=expense` : `${BASE_URL}?resource=expense&id=${expenseData.id}`;
  const method = isNew ? "POST" : "PATCH";

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(expenseData),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to save expense line item");
  }
  const data = await res.json();
  return data.data as ExpenseDraft;
}

/**
 * Deletes a single expense line item.
 * @param {number} id - The ID of the expense line item.
 * @returns {Promise<boolean>} A promise resolving to success.
 */
export async function deleteExpense(id: number): Promise<boolean> {
  const res = await fetch(`${BASE_URL}?resource=expense&id=${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to delete expense line item");
  }
  return true;
}

/**
 * Consolidates and submits the weekly expense report to the Bulk Approval module.
 * @param {object} payload - Submission payload.
 * @param {number} payload.header_id - Header ID.
 * @param {number} payload.supplier_id - Selected Supplier ID (Payee).
 * @param {number[]} payload.expense_ids - Array of expense IDs to approve and link.
 * @param {string} [payload.remarks] - General remarks.
 * @returns {Promise<{ ok: boolean; disbursement_id: number; doc_no: string }>} Result details.
 */
export async function submitWeeklyReport(payload: {
  header_id: number;
  supplier_id: number;
  expense_ids: number[];
  remarks?: string;
}): Promise<{ ok: boolean; disbursement_id?: number; doc_no?: string; error?: string }> {
  const res = await fetch(`${BASE_URL}?resource=submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json();
    return { ok: false, error: error.message || "Failed to submit weekly report" };
  }
  return res.json();
}
