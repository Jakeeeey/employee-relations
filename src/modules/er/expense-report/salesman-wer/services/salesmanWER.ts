import type {
  Supplier,
  ExpenseDraft,
  ExpenseDraftHeader,
  COA,
  DisbursementDraft,
  ExpenseAttachment,
} from "../types/salesman-wer.schema";

const BASE_URL = "/api/er/expense-report/salesman-wer";

/**
 * Safely parses a fetch Response expecting JSON.
 * Prevents "SyntaxError: Unexpected token '<', '<!DOCTYPE ...' is not valid JSON"
 * when receiving HTML error pages or redirects.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function parseJsonResponse<T = any>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text || !text.trim()) {
    return {} as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    if (!res.ok || text.trim().startsWith("<")) {
      const excerpt = text.slice(0, 150).replace(/\s+/g, " ");
      throw new Error(
        `Server returned ${res.status} ${res.statusText} (${text.trim().startsWith("<") ? "HTML response" : "non-JSON"}): ${excerpt}`
      );
    }
    throw err;
  }
}

/**
 * Fetches the list of active suppliers from Directus.
 * @returns {Promise<Supplier[]>} A promise resolving to the list of suppliers.
 */
export async function fetchSuppliersList(): Promise<Supplier[]> {
  const res = await fetch(`${BASE_URL}?resource=suppliers`);
  if (!res.ok) {
    const error = await parseJsonResponse(res);
    throw new Error(error.message || error.error || `Failed to fetch suppliers list (${res.status})`);
  }
  const data = await parseJsonResponse(res);
  return (data.data || []) as Supplier[];
}

/**
 * Fetches the list of weekly report headers created by the salesman.
 * @returns {Promise<ExpenseDraftHeader[]>} A promise resolving to the list of headers.
 */
export async function fetchHeadersList(): Promise<ExpenseDraftHeader[]> {
  const res = await fetch(`${BASE_URL}?resource=headers-list`);
  if (!res.ok) {
    const error = await parseJsonResponse(res);
    throw new Error(error.message || error.error || `Failed to fetch headers list (${res.status})`);
  }
  const data = await parseJsonResponse(res);
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
    const error = await parseJsonResponse(res);
    throw new Error(error.message || error.error || `Failed to create weekly report header (${res.status})`);
  }
  const data = await parseJsonResponse(res);
  return data.data as ExpenseDraftHeader;
}

/**
 * Fetches the details of a weekly expense draft header by ID.
 * @param {number} headerId - The ID of the header.
 * @returns {Promise<{ header: ExpenseDraftHeader | null; voucher: any | null }>} A promise resolving to the header and voucher details.
 */
export async function fetchWeeklyHeader(
  headerId: number
): Promise<{
  header: ExpenseDraftHeader | null;
  voucher: DisbursementDraft | null;
  attachments?: ExpenseAttachment[];
  attachmentQuerySuccess?: boolean;
}> {
  const res = await fetch(
    `${BASE_URL}?resource=header&header_id=${headerId}`
  );
  if (!res.ok) {
    const error = await parseJsonResponse(res);
    throw new Error(error.message || error.error || `Failed to fetch weekly header details (${res.status})`);
  }
  return parseJsonResponse(res);
}

/**
 * Fetches the expense draft lines for a given header ID.
 * @param {number} headerId - The ID of the weekly header.
 * @returns {Promise<ExpenseDraft[]>} A promise resolving to the list of expense drafts.
 */
export async function fetchExpenses(headerId: number): Promise<ExpenseDraft[]> {
  const res = await fetch(`${BASE_URL}?resource=expenses&header_id=${headerId}`);
  if (!res.ok) {
    const error = await parseJsonResponse(res);
    throw new Error(error.message || error.error || `Failed to fetch weekly expenses (${res.status})`);
  }
  const data = await parseJsonResponse(res);
  return (data.data || []) as ExpenseDraft[];
}

/**
 * Fetches expense items returned with concern for a supplier under the salesman's ownership.
 * @param {number} supplierId - The ID of the supplier.
 * @returns {Promise<ExpenseDraft[]>} A promise resolving to the list of returned expense drafts.
 */
export async function fetchReturnedExpenses(supplierId: number): Promise<ExpenseDraft[]> {
  const res = await fetch(`${BASE_URL}?resource=returned-expenses&supplier_id=${supplierId}`);
  if (!res.ok) {
    const error = await parseJsonResponse(res);
    throw new Error(error.message || error.error || `Failed to fetch returned expenses (${res.status})`);
  }
  const data = await parseJsonResponse(res);
  return (data.data || []) as ExpenseDraft[];
}

/**
 * Fetches the list of GL Accounts (Chart of Accounts).
 * @returns {Promise<COA[]>} A promise resolving to the list of GL Accounts.
 */
export async function fetchChartOfAccounts(): Promise<COA[]> {
  const res = await fetch(`${BASE_URL}?resource=coa`);
  if (!res.ok) {
    const error = await parseJsonResponse(res);
    throw new Error(error.message || error.error || `Failed to fetch Chart of Accounts (${res.status})`);
  }
  const data = await parseJsonResponse(res);
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
    const error = await parseJsonResponse(res);
    throw new Error(error.message || error.error || `Failed to save expense line item (${res.status})`);
  }
  const data = await parseJsonResponse(res);
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
    const error = await parseJsonResponse(res);
    throw new Error(error.message || error.error || `Failed to delete expense line item (${res.status})`);
  }
  return true;
}

/**
 * Saves a weekly expense report summary attachment metadata record in Directus.
 * @returns {Promise<ExpenseAttachment>} The saved attachment metadata.
 */
export async function saveWERAttachment(payload: {
  header_id: number;
  file_name: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
}): Promise<ExpenseAttachment> {
  const res = await fetch(`${BASE_URL}?resource=attachment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await parseJsonResponse(res);
    throw new Error(error.message || error.error || `Failed to save weekly report attachment (${res.status})`);
  }
  const data = await parseJsonResponse(res);
  return data.data as ExpenseAttachment;
}

/**
 * Deletes a weekly expense report summary attachment.
 * @param {number} id - The ID of the attachment record.
 * @returns {Promise<boolean>} A promise resolving to success.
 */
export async function deleteWERAttachment(id: number): Promise<boolean> {
  const res = await fetch(`${BASE_URL}?resource=attachment&id=${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await parseJsonResponse(res);
    throw new Error(error.message || error.error || `Failed to delete weekly report attachment (${res.status})`);
  }
  return true;
}
