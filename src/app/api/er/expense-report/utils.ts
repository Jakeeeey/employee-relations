const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "";

/**
 * Returns authorization headers for Directus API requests.
 */
export function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (process.env.DIRECTUS_STATIC_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`;
  }
  return headers;
}

/**
 * Performs a fetch request to the upstream Directus API.
 */
export async function directusFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!response.ok) {
    const method = options.method || "GET";
    throw new Error(
      `Directus API error (${method} ${path}): ${response.status} - ${typeof data === "object" ? JSON.stringify(data) : text}`
    );
  }

  if (typeof data === "string" && data.trim().startsWith("<")) {
    throw new Error(
      `Directus API returned HTML response instead of JSON (${response.status}): ${text.slice(0, 150).replace(/\s+/g, " ")}`
    );
  }

  return data;
}

export function nowManila(): string {
  return new Date()
    .toLocaleString("sv-SE", { timeZone: "Asia/Manila" })
    .replace(" ", "T");
}

export function todayManila(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Manila" });
}

export function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

const FINALIZED_EXPENSE_STATUSES = ["Approved"];

function isFinalizedExpenseStatus(status: unknown): boolean {
  return typeof status === "string" && FINALIZED_EXPENSE_STATUSES.includes(status);
}

export async function getVoucherStatusAndLinesCount(headerId: number) {
  const [expRes, headerRes] = await Promise.all([
    directusFetch(`/items/expense_draft?filter[header_id][_eq]=${headerId}&limit=-1&fields=id,status`),
    directusFetch(`/items/expense_draft_header/${headerId}?fields=payee_id.id,payee_id,created_by`)
  ]);

  const expenseRows = (expRes.data || []) as { id: number; status?: string }[];
  const expenseIds = expenseRows.map((e) => e.id);
  const linesCount = expenseIds.length;
  const hasFinalizedLines = expenseRows.some((e) => isFinalizedExpenseStatus(e.status));
  const header = headerRes.data;

  if (!header) return { status: null, linesCount, hasFinalizedLines };

  // Find linked voucher by payables bridge
  let disbStatus: string | null = null;
  if (expenseIds.length > 0) {
    const payablesRes = await directusFetch(
      `/items/disbursement_payables_draft?filter[expense_id][_in]=${expenseIds.join(",")}&fields=disbursement_id&limit=1`
    );
    const payableRow = payablesRes.data?.[0];
    if (payableRow) {
      const disbId = typeof payableRow.disbursement_id === "object" && payableRow.disbursement_id !== null
        ? payableRow.disbursement_id.id
        : payableRow.disbursement_id;

      if (disbId) {
        const disbRes = await directusFetch(`/items/disbursement_draft/${disbId}?fields=status`);
        disbStatus = disbRes.data?.status || null;
      }
    }
  }

  // Fallback: search by payee & encoder
  if (!disbStatus) {
    const supplierId = typeof header.payee_id === "object" && header.payee_id !== null
      ? header.payee_id.id
      : header.payee_id;
    if (supplierId) {
      const fallbackRes = await directusFetch(
        `/items/disbursement_draft?filter[payee][_eq]=${supplierId}&filter[encoder_id][_eq]=${header.created_by}&filter[status][_in]=Drafts,Submitted,Rejected,With Concern&sort=-id&limit=1&fields=status`
      );
      disbStatus = fallbackRes.data?.[0]?.status || null;
    }
  }

  return { status: disbStatus, linesCount, hasFinalizedLines };
}
