import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeJwtPayload } from "@/lib/auth-utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "";
const COOKIE_NAME = "vos_access_token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Returns authorization headers for Directus API requests.
 */
function getHeaders() {
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
async function directusFetch(path: string, options: RequestInit = {}) {
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

function nowManila(): string {
  return new Date()
    .toLocaleString("sv-SE", { timeZone: "Asia/Manila" })
    .replace(" ", "T");
}



function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

const FINALIZED_EXPENSE_STATUSES = ["Approved"];

function isFinalizedExpenseStatus(status: unknown): boolean {
  return typeof status === "string" && FINALIZED_EXPENSE_STATUSES.includes(status);
}

/**
 * GET Handler
 * Router resource endpoints:
 * - resource=suppliers: Lists active suppliers assigned to salesman
 * - resource=headers-list: Lists all report headers created by salesman
 * - resource=header: Retrieves a single weekly report header by ID
 * - resource=expenses: Retrieves expense lines for a header
 * - resource=returned-expenses: Retrieves expense lines with concern owned by salesman for a supplier
 * - resource=coa: Retrieves the chart of accounts
 */
async function getVoucherStatusAndLinesCount(headerId: number) {
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

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = decodeJwtPayload(token);
    const salesmanId = payload?.sub ? Number(payload.sub) : null;
    if (!salesmanId) {
      return NextResponse.json({ message: "Invalid token payload" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resource = searchParams.get("resource") || "suppliers";

    // 1. Get Suppliers list (specifically filter to find suppliers matching this salesman's user ID)
    if (resource === "suppliers") {
      const suppliersRes = await directusFetch(
        `/items/suppliers?fields=id,supplier_name,supplier_shortcut,supplier_type&filter[isActive][_eq]=1&filter[user_id][_eq]=${salesmanId}&limit=-1&sort=supplier_name`
      );
      return NextResponse.json({ data: suppliersRes.data || [] }, { status: 200 });
    }

    // 2. Get headers list created by salesman
    if (resource === "headers-list") {
      const headersRes = await directusFetch(
        `/items/expense_draft_header?filter[created_by][_eq]=${salesmanId}&fields=id,payee_id.id,payee_id.supplier_name,period_from,period_to,status,remarks&limit=-1&sort=-id`
      );
      const headers = headersRes.data || [];

      const headerIds = headers.map((h: { id: unknown }) => toNumber(h.id));
      interface LineItem {
        id: number;
        header_id: number;
        status: string;
      }
      let lines: LineItem[] = [];
      if (headerIds.length > 0) {
        const linesRes = await directusFetch(
          `/items/expense_draft?filter[header_id][_in]=${headerIds.join(",")}&fields=id,header_id,status&limit=-1`
        );
        lines = (linesRes.data || []) as LineItem[];
      }

      // Group counts by header
      const linesByHeader: Record<number, LineItem[]> = {};
      for (const line of lines) {
        const hId = toNumber(line.header_id);
        if (!linesByHeader[hId]) linesByHeader[hId] = [];
        linesByHeader[hId].push(line);
      }

      interface VoucherItem {
        id: number;
        status: string;
        doc_no?: string;
        approval_version?: number;
        total_amount?: number;
      }
      interface PayableItem {
        expense_id: { id: number } | number | null;
        disbursement_id: { id: number } | number | null;
      }

      const expenseIdToHeaderId: Record<number, number> = {};
      for (const line of lines) {
        expenseIdToHeaderId[toNumber(line.id)] = toNumber(line.header_id);
      }

      const vouchersById: Record<number, VoucherItem> = {};
      const voucherIdsByHeader: Record<number, number[]> = {};
      const allExpenseIds = Object.keys(expenseIdToHeaderId).map(Number);

      if (allExpenseIds.length > 0) {
        const payablesRes = await directusFetch(
          `/items/disbursement_payables_draft?filter[expense_id][_in]=${allExpenseIds.join(",")}&fields=expense_id,disbursement_id&limit=-1`
        );
        const payables = (payablesRes.data || []) as PayableItem[];
        const disbursementIds = new Set<number>();

        for (const payable of payables) {
          const expenseId = typeof payable.expense_id === "object" && payable.expense_id !== null
            ? payable.expense_id.id
            : payable.expense_id;
          const disbursementId = typeof payable.disbursement_id === "object" && payable.disbursement_id !== null
            ? payable.disbursement_id.id
            : payable.disbursement_id;
          const headerId = typeof expenseId === "number" ? expenseIdToHeaderId[expenseId] : undefined;

          if (headerId && typeof disbursementId === "number") {
            if (!voucherIdsByHeader[headerId]) voucherIdsByHeader[headerId] = [];
            voucherIdsByHeader[headerId].push(disbursementId);
            disbursementIds.add(disbursementId);
          }
        }

        const disbursementIdList = Array.from(disbursementIds);
        if (disbursementIdList.length > 0) {
          const vouchersRes = await directusFetch(
            `/items/disbursement_draft?filter[id][_in]=${disbursementIdList.join(",")}&fields=id,status&limit=-1&sort=-id`
          );
          const vouchers = (vouchersRes.data || []) as VoucherItem[];
          for (const voucher of vouchers) {
            vouchersById[toNumber(voucher.id)] = voucher;
          }
        }
      }

      const latestVoucherForHeader = (headerId: number): VoucherItem | undefined => {
        const voucherIds = voucherIdsByHeader[headerId] || [];
        const latestVoucherId = voucherIds.sort((a, b) => b - a)[0];
        return latestVoucherId ? vouchersById[latestVoucherId] : undefined;
      };

      // Batch-fetch WER summary attachments for all headers to flag missing uploads
      const attachmentsByHeader: Record<number, boolean> = {};
      if (headerIds.length > 0) {
        const attachmentsRes = await directusFetch(
          `/items/expense_attachments?filter[header_id][_in]=${headerIds.join(",")}&fields=header_id&limit=-1`
        );
        const attachmentRows = (attachmentsRes.data || []) as { header_id: number }[];
        for (const row of attachmentRows) {
          attachmentsByHeader[toNumber(row.header_id)] = true;
        }
      }

      interface HeaderItem {
        id: number;
        payee_id?: { id: number } | number | null;
        status?: string;
        [key: string]: unknown;
      }
      const enriched = (headers as HeaderItem[]).map((h) => {
        const headerLines = linesByHeader[toNumber(h.id)] || [];
        const voucher = latestVoucherForHeader(toNumber(h.id));
        
        // If all items are rejected, overall status is 'Rejected'
        const allRejected = headerLines.length > 0 && headerLines.every((l) => l.status === "Rejected");
        const voucherStatus = allRejected ? "Rejected" : (voucher?.status ?? null);

        return {
          ...h,
          lines_count: headerLines.length,
          has_concern: headerLines.some((l) => l.status === "With Concern"),
          voucher_status: voucherStatus,
          has_wer_file: !!attachmentsByHeader[toNumber(h.id)],
        };
      });

      return NextResponse.json({ data: enriched }, { status: 200 });
    }

    // 3. Get single Header detail by ID
    if (resource === "header") {
      const headerId = searchParams.get("header_id");

      if (!headerId) {
        return NextResponse.json({ message: "Missing required header_id parameter" }, { status: 400 });
      }

      const headerIdNum = Number(headerId);

      // Fetch header details
      const headerRes = await directusFetch(
        `/items/expense_draft_header/${headerIdNum}?fields=id,division_id,payee_id.id,payee_id.supplier_name,period_from,period_to,status,remarks,created_by`
      );
      const header = headerRes.data;
      if (!header) {
        return NextResponse.json({ message: "Weekly report header not found" }, { status: 404 });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let voucher: any = null;
      const expensesRes = await directusFetch(
        `/items/expense_draft?filter[header_id][_eq]=${header.id}&limit=-1&fields=id,status`
      );
      const expensesData = expensesRes.data || [];
      const expenseIds = expensesData.map((e: { id: number }) => e.id);

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
            const disbRes = await directusFetch(
              `/items/disbursement_draft/${disbId}?fields=id,doc_no,total_amount,status,remarks,supporting_documents_url,is_supervisor`
            );
            voucher = disbRes.data || null;
          }
        }
      }

      const allRejected = expensesData.length > 0 && expensesData.every((e: { status: string }) => e.status === "Rejected");
      if (allRejected && voucher) {
        voucher.status = "Rejected";
      }

      // Fallback: search by payee & encoder if all line items were detached by bulk approval
      if (!voucher && header) {
        const supplierId = typeof header.payee_id === "object" && header.payee_id !== null
          ? header.payee_id.id
          : header.payee_id;
        if (supplierId) {
          const fallbackRes = await directusFetch(
            `/items/disbursement_draft?filter[payee][_eq]=${supplierId}&filter[encoder_id][_eq]=${header.created_by}&filter[status][_in]=Drafts,Submitted,Rejected,With Concern&sort=-id&limit=1&fields=id,doc_no,total_amount,status,remarks,supporting_documents_url,is_supervisor`
          );
          voucher = fallbackRes.data?.[0] || null;
        }
      }

      let attachments: Record<string, unknown>[] = [];
      let attachmentQuerySuccess = true;
      try {
        const attachRes = await directusFetch(
          `/items/expense_attachments?filter[header_id][_eq]=${header.id}&limit=-1`
        );
        attachments = attachRes.data || [];
      } catch (err) {
        attachmentQuerySuccess = false;
        console.error("Failed to fetch expense attachments:", err);
      }

      return NextResponse.json({ 
        header, 
        voucher, 
        attachments,
        attachmentQuerySuccess
      }, { status: 200 });
    }

    // 4. Get Expense Lines for header
    if (resource === "expenses") {
      const headerId = searchParams.get("header_id");
      if (!headerId) {
        return NextResponse.json({ message: "Missing header_id" }, { status: 400 });
      }

      const expensesRes = await directusFetch(
        `/items/expense_draft?filter[header_id][_eq]=${Number(headerId)}&limit=-1&sort=transaction_date&fields=id,header_id,encoded_by,particulars,amount,transaction_date,payee,payee_id,attachment_url,remarks,division_id,status,version,feedback,return_to`
      );
      const expenses = expensesRes.data || [];

      // Map GL Account Names
      interface ExpenseItem {
        id: number;
        particulars: number;
        amount: number;
        attachment_url?: string;
        version?: number;
        status?: string;
        remarks?: string;
        transaction_date?: string;
        [key: string]: unknown;
      }
      const expensesTyped = (expenses as ExpenseItem[]);
      const coaIds = Array.from(new Set(expensesTyped.map((e) => e.particulars).filter(Boolean)));
      const coaMap: Record<number, string> = {};
      if (coaIds.length > 0) {
        const coaRes = await directusFetch(
          `/items/chart_of_accounts?filter[coa_id][_in]=${coaIds.join(",")}&fields=coa_id,account_title&limit=-1`
        );
        interface CoaItem {
          coa_id: number;
          account_title: string;
        }
        for (const coa of ((coaRes.data || []) as CoaItem[])) {
          coaMap[toNumber(coa.coa_id)] = String(coa.account_title || "");
        }
      }

      const enrichedExpenses = expensesTyped.map((e) => ({
        ...e,
        amount: toNumber(e.amount),
        particulars_name: coaMap[toNumber(e.particulars)] || `COA #${e.particulars}`,
      }));

      return NextResponse.json({ data: enrichedExpenses }, { status: 200 });
    }

    // 5. Get Returned Concern Items for salesman & supplier
    if (resource === "returned-expenses") {
      const supplierId = searchParams.get("supplier_id");
      if (!supplierId) {
        return NextResponse.json({ message: "Missing supplier_id" }, { status: 400 });
      }

      const expensesRes = await directusFetch(
        `/items/expense_draft?filter[status][_in]=With Concern,Rejected&filter[encoded_by][_eq]=${salesmanId}&filter[payee_id][_eq]=${Number(supplierId)}&limit=-1&fields=id,header_id,encoded_by,particulars,amount,transaction_date,payee,payee_id,attachment_url,remarks,division_id,status,version,feedback,return_to`
      );
      const expenses = expensesRes.data || [];

      interface ReturnedExpenseItem {
        id: number;
        particulars: number;
        amount: number;
        [key: string]: unknown;
      }
      const expensesTyped = (expenses as ReturnedExpenseItem[]);
      const coaIds = Array.from(new Set(expensesTyped.map((e) => e.particulars).filter(Boolean)));
      const coaMap: Record<number, string> = {};
      if (coaIds.length > 0) {
        const coaRes = await directusFetch(
          `/items/chart_of_accounts?filter[coa_id][_in]=${coaIds.join(",")}&fields=coa_id,account_title&limit=-1`
        );
        interface CoaItem {
          coa_id: number;
          account_title: string;
        }
        for (const coa of ((coaRes.data || []) as CoaItem[])) {
          coaMap[toNumber(coa.coa_id)] = String(coa.account_title || "");
        }
      }

      const enrichedExpenses = expensesTyped.map((e) => ({
        ...e,
        amount: toNumber(e.amount),
        particulars_name: coaMap[toNumber(e.particulars)] || `COA #${e.particulars}`,
      }));

      return NextResponse.json({ data: enrichedExpenses }, { status: 200 });
    }

    // 6. Get Chart of Accounts
    if (resource === "coa") {
      const coaRes = await directusFetch(
        `/items/chart_of_accounts?fields=coa_id,account_title,gl_code&limit=-1&sort=account_title`
      );
      return NextResponse.json({ data: coaRes.data || [] }, { status: 200 });
    }

    return NextResponse.json({ message: "Resource not found" }, { status: 404 });
  } catch (error: unknown) {
    console.error("GET API error:", error);
    const errMsg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ message: errMsg }, { status: 500 });
  }
}

/**
 * POST Handler
 * Router resource endpoints:
 * - resource=header: Explicitly creates a new weekly report header
 * - resource=expense: Creates a new expense draft line
 * - resource=submit: Disabled for Salesman WER; other modules own approval/finalization
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = decodeJwtPayload(token);
    const salesmanId = payload?.sub ? Number(payload.sub) : null;
    if (!salesmanId) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resource = searchParams.get("resource");

    if (resource === "header") {
      const body = await request.json();
      const { payee_id: supplierId, period_from: from, period_to: to, remarks = "" } = body;

      if (!supplierId || !from || !to) {
        return NextResponse.json({ message: "Missing required fields for header creation" }, { status: 400 });
      }

      if (new Date(from) > new Date(to)) {
        return NextResponse.json({ message: "Period From cannot be later than Period To" }, { status: 400 });
      }

      const supplierIdNum = Number(supplierId);

      // Verify supplier details
      const supplierRes = await directusFetch(
        `/items/suppliers/${supplierIdNum}?fields=id,supplier_name`
      );
      const supplier = supplierRes.data;
      if (!supplier) {
        return NextResponse.json({ message: "Supplier payee not found" }, { status: 404 });
      }

      // Get salesman division from supervisor_per_division table
      const divRes = await directusFetch(
        `/items/supervisor_per_division?filter[supervisor_id][_eq]=${salesmanId}&fields=division_id&limit=1`
      );
      const divisionId = divRes.data?.[0]?.division_id ? toNumber(divRes.data[0].division_id) : 1; // default fallback if null

      // Check if header with same salesman, division, and period already exists and is not rejected
      const existingHeaderRes = await directusFetch(
        `/items/expense_draft_header?filter[created_by][_eq]=${salesmanId}&filter[division_id][_eq]=${divisionId}&filter[period_from][_eq]=${from}&filter[period_to][_eq]=${to}&filter[status][_neq]=Rejected&limit=1`
      );
      if (existingHeaderRes.data && existingHeaderRes.data.length > 0) {
        return NextResponse.json(
          { message: "An active weekly report header already exists for this salesman, division, and weekly period." },
          { status: 409 }
        );
      }

      // Create new header
      const createRes = await directusFetch(`/items/expense_draft_header`, {
        method: "POST",
        body: JSON.stringify({
          division_id: divisionId,
          payee_id: supplierIdNum,
          period_from: from,
          period_to: to,
          remarks: remarks || null,
          created_by: salesmanId,
          created_at: nowManila(),
          status: "Drafts",
        }),
      });

      // Retrieve header detail with payee relation populated
      const headerRes = await directusFetch(
        `/items/expense_draft_header/${createRes.data.id}?fields=id,payee_id.id,payee_id.supplier_name,period_from,period_to,status,remarks`
      );

      return NextResponse.json({ data: headerRes.data }, { status: 201 });
    }

    if (resource === "expense") {
      const body = await request.json();
      
      if (!body.header_id) {
        return NextResponse.json({ message: "Expense line must be linked to a valid weekly report header" }, { status: 400 });
      }

      const headerId = Number(body.header_id);
      const headerRes = await directusFetch(`/items/expense_draft_header/${headerId}?fields=id,status,period_from,period_to,created_by,division_id`);
      const header = headerRes.data;
      if (!header) {
        return NextResponse.json({ message: "Associated weekly report header not found." }, { status: 404 });
      }

      // Check header ownership
      if (toNumber(header.created_by) !== salesmanId) {
        return NextResponse.json({ message: "Unauthorized header access" }, { status: 403 });
      }

      // Check header status. Legacy headers may have null status; treat those as draft-like.
      if (header.status && header.status !== "Drafts") {
        return NextResponse.json({ message: `This weekly report header is locked (status: ${header.status}) and cannot receive new lines.` }, { status: 400 });
      }

      // Verify if voucher is locked (conditional rule: lock if Submitted/Approved/Paid or Pending_* or Rejected with 1 line)
      const { status: disbStatus, linesCount: disbLinesCount, hasFinalizedLines } = await getVoucherStatusAndLinesCount(headerId);
      if (hasFinalizedLines) {
        return NextResponse.json({ message: "This weekly report is finalized and cannot receive new lines." }, { status: 400 });
      }
      const isLocked = disbStatus && (
        ["Submitted", "Approved", "Paid"].includes(disbStatus) ||
        disbStatus.toLowerCase().startsWith("pending_") ||
        (disbStatus === "Rejected" && disbLinesCount <= 1)
      );
      if (isLocked) {
        return NextResponse.json({ message: `This weekly report is locked (voucher status: ${disbStatus}) and cannot receive new lines.` }, { status: 400 });
      }
      
      // Verify transaction date fits within boundary
      const lineDate = body.transaction_date;
      if (!lineDate) {
        return NextResponse.json({ message: "Transaction date is required" }, { status: 400 });
      }
      if (lineDate < header.period_from || lineDate > header.period_to) {
        return NextResponse.json({ message: `Transaction date (${lineDate}) must fall within the weekly period (${header.period_from} to ${header.period_to}).` }, { status: 400 });
      }

      // Division mismatch validation
      if (body.division_id && toNumber(body.division_id) !== toNumber(header.division_id)) {
        return NextResponse.json({ message: "Expense line division must match parent header division" }, { status: 400 });
      }

      // Check positive finite amount
      const amount = toNumber(body.amount, -1);
      if (amount <= 0 || !Number.isFinite(amount)) {
        return NextResponse.json({ message: "Expense amount must be a finite, positive number" }, { status: 400 });
      }

      // Check for duplicate expense line
      const cleanParticulars = toNumber(body.particulars);
      const cleanDate = String(body.transaction_date || "");
      const cleanPayee = String(body.payee || "").trim();
      const existingLineRes = await directusFetch(
        `/items/expense_draft?filter[header_id][_eq]=${headerId}&filter[particulars][_eq]=${cleanParticulars}&filter[amount][_eq]=${amount}&filter[transaction_date][_eq]=${cleanDate}&filter[payee][_eq]=${cleanPayee}&limit=1`
      );
      if (existingLineRes.data && existingLineRes.data.length > 0) {
        return NextResponse.json({ message: "A duplicate expense line already exists in this report." }, { status: 409 });
      }

      // Normalize empty strings to null
      const remarks = body.remarks && body.remarks.trim() !== "" ? body.remarks.trim() : null;
      const attachment_url = body.attachment_url && body.attachment_url.trim() !== "" ? body.attachment_url.trim() : null;

      const createRes = await directusFetch(`/items/expense_draft`, {
        method: "POST",
        body: JSON.stringify({
          ...body,
          remarks,
          attachment_url,
          header_id: headerId,
          division_id: header.division_id,
          encoded_by: salesmanId,
          status: "Drafts",
          approved_at: null,
          is_supervisor: 0,
          version: 1,
          drafted_at: nowManila(),
        }),
      });
      return NextResponse.json({ data: createRes.data }, { status: 201 });
    }

    if (resource === "submit") {
      return NextResponse.json(
        {
          message: "Salesman weekly report submission is disabled. Continue updating WER files and expense lines until another module approves or locks this report.",
        },
        { status: 410 }
      );
    }

    if (resource === "attachment") {
      const body = await request.json();
      const { header_id: headerId, file_name, file_url, file_type, file_size } = body;

      if (!headerId || !file_name || !file_url) {
        if (file_url) {
          try {
            await directusFetch(`/files/${file_url}`, { method: "DELETE" });
          } catch (err) {
            console.error("Failed to clean up file after invalid payload:", err);
          }
        }
        return NextResponse.json({ message: "Missing required fields for attachment metadata" }, { status: 400 });
      }

      const headerIdNum = Number(headerId);
      if (headerIdNum === 0 || !Number.isFinite(headerIdNum)) {
        if (file_url) {
          try {
            await directusFetch(`/files/${file_url}`, { method: "DELETE" });
          } catch (err) {
            console.error("Failed to clean up file after invalid header:", err);
          }
        }
        return NextResponse.json({ message: "Invalid weekly report header ID" }, { status: 400 });
      }

      // Check header existence and ownership
      const headerRes = await directusFetch(`/items/expense_draft_header/${headerIdNum}?fields=id,created_by`);
      const header = headerRes.data;
      if (!header) {
        if (file_url) {
          try {
            await directusFetch(`/files/${file_url}`, { method: "DELETE" });
          } catch (err) {
            console.error("Failed to clean up file after header not found:", err);
          }
        }
        return NextResponse.json({ message: "Weekly report header not found" }, { status: 404 });
      }

      if (toNumber(header.created_by) !== salesmanId) {
        if (file_url) {
          try {
            await directusFetch(`/files/${file_url}`, { method: "DELETE" });
          } catch (err) {
            console.error("Failed to clean up file after unauthorized header access:", err);
          }
        }
        return NextResponse.json({ message: "Unauthorized header access" }, { status: 403 });
      }

      // Reject duplicate attachment
      const dupRes = await directusFetch(
        `/items/expense_attachments?filter[header_id][_eq]=${headerIdNum}&filter[file_url][_eq]=${file_url}&limit=1`
      );
      if (dupRes.data && dupRes.data.length > 0) {
        if (file_url) {
          try {
            await directusFetch(`/files/${file_url}`, { method: "DELETE" });
          } catch (err) {
            console.error("Failed to clean up duplicate file:", err);
          }
        }
        return NextResponse.json({ message: "This attachment is already uploaded for this header." }, { status: 409 });
      }

      if (file_size !== undefined && toNumber(file_size) < 0) {
        if (file_url) {
          try {
            await directusFetch(`/files/${file_url}`, { method: "DELETE" });
          } catch (err) {
            console.error("Failed to clean up file with negative size:", err);
          }
        }
        return NextResponse.json({ message: "File size cannot be negative" }, { status: 400 });
      }

      try {
        const createRes = await directusFetch(`/items/expense_attachments`, {
          method: "POST",
          body: JSON.stringify({
            header_id: headerIdNum,
            file_name,
            file_url,
            file_type: file_type || null,
            file_size: file_size !== undefined ? toNumber(file_size) : null,
            uploaded_by: salesmanId,
            uploaded_at: nowManila(),
          }),
        });
        return NextResponse.json({ data: createRes.data }, { status: 201 });
      } catch (insertErr) {
        console.error("Failed to insert attachment record into DB:", insertErr);
        try {
          await directusFetch(`/files/${file_url}`, { method: "DELETE" });
        } catch (delErr) {
          console.error("Failed to delete orphaned file after database insert failure:", delErr);
        }
        return NextResponse.json({ message: "Database insert failed for attachment record. File cleaned up." }, { status: 500 });
      }
    }

    return NextResponse.json({ message: "Resource not found" }, { status: 404 });
  } catch (error: unknown) {
    console.error("POST API error:", error);
    const errMsg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ message: errMsg }, { status: 500 });
  }
}

/**
 * PATCH Handler
 * Modifies an existing expense draft item.
 * If status is "With Concern", routes the correction using the stored return_to value.
 */
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = decodeJwtPayload(token);
    const salesmanId = payload?.sub ? Number(payload.sub) : null;
    if (!salesmanId) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resource = searchParams.get("resource");
    const id = searchParams.get("id");

    if (resource === "expense" && id) {
      const expenseId = Number(id);
      const body = await request.json();

      // Fetch original record to check version and status
      const originalRes = await directusFetch(`/items/expense_draft/${expenseId}?fields=id,status,version,particulars,division_id,transaction_date,amount,header_id,return_to,payee_id,payee`);
      const original = originalRes.data;

      if (!original) {
        return NextResponse.json({ message: "Expense draft not found" }, { status: 404 });
      }

      if (isFinalizedExpenseStatus(original.status)) {
        return NextResponse.json({ message: "This weekly report is finalized and cannot receive edits." }, { status: 400 });
      }

      // Load and validate header status and date boundaries
      if (original.header_id) {
        const headerId = Number(original.header_id);
        const headerRes = await directusFetch(`/items/expense_draft_header/${headerId}?fields=id,status,period_from,period_to,created_by,division_id`);
        const header = headerRes.data;
        if (header) {
          // Ownership validation
          if (toNumber(header.created_by) !== salesmanId) {
            return NextResponse.json({ message: "Unauthorized header access" }, { status: 403 });
          }


          if (header.status && header.status !== "Drafts" && header.status !== "With Concern" && original.status !== "With Concern") {
            return NextResponse.json({ message: `This weekly report header is locked (status: ${header.status}) and cannot receive edits.` }, { status: 400 });
          }

          // Verify if voucher is locked (conditional rule: lock if Submitted/Approved/Paid or Pending_* or Rejected with 1 line)
          const { status: disbStatus, linesCount: disbLinesCount } = await getVoucherStatusAndLinesCount(headerId);
          const isLocked = disbStatus && (
            ["Submitted", "Approved", "Paid"].includes(disbStatus) ||
            disbStatus.toLowerCase().startsWith("pending_") ||
            (disbStatus === "Rejected" && disbLinesCount <= 1)
          );
          if (isLocked && original.status !== "With Concern") {
            return NextResponse.json({ message: `This weekly report is locked (voucher status: ${disbStatus}) and cannot receive edits.` }, { status: 400 });
          }
          
          // Verify transaction date fits within boundary
          const updatedDate = body.transaction_date || original.transaction_date;
          if (updatedDate < header.period_from || updatedDate > header.period_to) {
            return NextResponse.json({ message: `Transaction date (${updatedDate}) must fall within the weekly period (${header.period_from} to ${header.period_to}).` }, { status: 400 });
          }

          // Verify division matches
          if (body.division_id && toNumber(body.division_id) !== toNumber(header.division_id)) {
            return NextResponse.json({ message: "Expense line division must match parent header division" }, { status: 400 });
          }
        }
      }

      // Check positive finite amount
      if (body.amount !== undefined) {
        const amount = toNumber(body.amount, -1);
        if (amount <= 0 || !Number.isFinite(amount)) {
          return NextResponse.json({ message: "Expense amount must be a finite, positive number" }, { status: 400 });
        }
      }

      // Check for duplicate expense line
      const cleanParticulars = body.particulars !== undefined ? toNumber(body.particulars) : toNumber(original.particulars);
      const cleanDate = body.transaction_date !== undefined ? String(body.transaction_date || "") : String(original.transaction_date || "");
      const cleanPayee = body.payee !== undefined ? String(body.payee || "").trim() : String(original.payee || "").trim();
      const cleanAmount = body.amount !== undefined ? toNumber(body.amount) : toNumber(original.amount);

      const existingLineRes = await directusFetch(
        `/items/expense_draft?filter[header_id][_eq]=${original.header_id}&filter[particulars][_eq]=${cleanParticulars}&filter[amount][_eq]=${cleanAmount}&filter[transaction_date][_eq]=${cleanDate}&filter[payee][_eq]=${cleanPayee}&filter[id][_neq]=${expenseId}&limit=1`
      );
      if (existingLineRes.data && existingLineRes.data.length > 0) {
        return NextResponse.json({ message: "A duplicate expense line already exists in this report." }, { status: 409 });
      }

      // Normalize empty strings to null
      if (body.remarks !== undefined) {
        body.remarks = body.remarks && body.remarks.trim() !== "" ? body.remarks.trim() : null;
      }
      if (body.attachment_url !== undefined) {
        body.attachment_url = body.attachment_url && body.attachment_url.trim() !== "" ? body.attachment_url.trim() : null;
      }
 
      const nextVersion = toNumber(original.version, 1) + 1;
      const isConcern = original.status === "With Concern";

      // Only allow user-editable fields. payee/payee_id are server-managed from the header
      // and must NOT be sent in PATCH to avoid Directus null-relation validation errors.
      const editableFields = [
        "transaction_date",
        "particulars",
        "amount",
        "remarks",
        "attachment_url",
      ] as const;
      const patchData: Record<string, unknown> = { version: nextVersion };

      for (const field of editableFields) {
        if (Object.prototype.hasOwnProperty.call(body, field)) {
          // Compare loosely because body might have numbers and original might have strings
          if (String(body[field]) !== String(original[field])) {
            patchData[field] = body[field];
          }
        }
      }



      if (isConcern) {
        // Route from stored server state and preserve it against client overrides.
        patchData.status = original.return_to == null ? "Drafts" : "Approved";
        patchData.return_to = original.return_to ?? null;
        patchData.feedback = null;
        patchData.approved_at = nowManila();
      }

      const patchRes = await directusFetch(`/items/expense_draft/${expenseId}`, {
        method: "PATCH",
        body: JSON.stringify(patchData),
      });

      // Write audit log
      await directusFetch(`/items/expense_draft_logs`, {
        method: "POST",
        body: JSON.stringify({
          expense_id: expenseId,
          action: "UPDATE",
          changed_by: salesmanId,
          changed_at: nowManila(),
          particulars: body.particulars || original.particulars,
          division_id: original.division_id,
          transaction_date: body.transaction_date || original.transaction_date,
          amount: body.amount || original.amount,
          status: patchData.status || original.status,
          remarks: `Updated by Salesman (Owner) #${salesmanId}. Amount adjusted to ${body.amount || original.amount}.`,
          version: nextVersion,
        }),
      });

      /*
      // If the revised item was a concern, trigger recalculation of voucher link
      if (isConcern) {
        // Check if there was a pending voucher
        const payablesRes = await directusFetch(
          `/items/disbursement_payables_draft?filter[expense_id][_eq]=${expenseId}&fields=disbursement_id&limit=1`
        );
        const payableRow = payablesRes.data?.[0];
        const disbId = payableRow
          ? (typeof payableRow.disbursement_id === "object" && payableRow.disbursement_id !== null
              ? payableRow.disbursement_id.id
              : payableRow.disbursement_id)
          : null;

        if (disbId) {
          // Recalculate voucher sum
          const allPayablesRes = await directusFetch(
            `/items/disbursement_payables_draft?filter[disbursement_id][_eq]=${disbId}&fields=amount,expense_id&limit=-1`
          );
          const payablesList = allPayablesRes.data || [];
          
          let newSum = 0;
          for (const pay of payablesList) {
            const expId = typeof pay.expense_id === "object" && pay.expense_id !== null ? pay.expense_id.id : pay.expense_id;
            if (toNumber(expId) === expenseId) {
              newSum += toNumber(body.amount);
            } else {
              newSum += toNumber(pay.amount);
            }
          }

          // Fetch supporting docs again
          interface PayableListItem {
            expense_id: { id: number } | number | null;
          }
          const expIds = (payablesList as PayableListItem[]).map((p) => {
            const exp = p.expense_id;
            return typeof exp === "object" && exp !== null ? exp.id : exp;
          });
          const expensesRes = await directusFetch(
            `/items/expense_draft?filter[id][_in]=${expIds.join(",")}&limit=-1&fields=attachment_url`
          );
          interface ExpAttachmentItem {
            attachment_url?: string;
          }
          const supportingDocs = ((expensesRes.data || []) as ExpAttachmentItem[])
            .map((e) => e.attachment_url)
            .filter(Boolean)
            .join(",");

          // Patch voucher
          await directusFetch(`/items/disbursement_draft/${disbId}`, {
            method: "PATCH",
            body: JSON.stringify({
              total_amount: newSum,
              status: "Submitted",
              supporting_documents_url: supportingDocs || null,
              date_updated: nowManila(),
            }),
          });
        }
      }
      */

      return NextResponse.json({ data: patchRes.data }, { status: 200 });
    }

    return NextResponse.json({ message: "Invalid resource or id" }, { status: 400 });
  } catch (error: unknown) {
    console.error("PATCH API error:", error);
    const errMsg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ message: errMsg }, { status: 500 });
  }
}

/**
 * DELETE Handler
 * Deletes an expense draft.
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = decodeJwtPayload(token);
    const salesmanId = payload?.sub ? Number(payload.sub) : null;
    if (!salesmanId) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resource = searchParams.get("resource");
    const id = searchParams.get("id");

    if (resource === "expense" && id) {
      const expenseId = Number(id);

      // Fetch expense record to find header_id
      const expRes = await directusFetch(`/items/expense_draft/${expenseId}?fields=header_id,status`);
      const expenseRow = expRes.data;
      if (isFinalizedExpenseStatus(expenseRow?.status)) {
        return NextResponse.json({ message: "This weekly report is finalized and cannot delete lines." }, { status: 400 });
      }
      if (expenseRow && expenseRow.header_id) {
        const headerId = Number(expenseRow.header_id);
        const { status: disbStatus, linesCount: disbLinesCount } = await getVoucherStatusAndLinesCount(headerId);
        const isLocked = disbStatus && (
          ["Submitted", "Approved", "Paid"].includes(disbStatus) ||
          disbStatus.toLowerCase().startsWith("pending_") ||
          (disbStatus === "Rejected" && disbLinesCount <= 1)
        );
        if (isLocked) {
          return NextResponse.json({ message: `This weekly report is locked (voucher status: ${disbStatus}) and cannot delete lines.` }, { status: 400 });
        }
      }

      // Verify that this is not linked to an approved voucher
      const payablesRes = await directusFetch(
        `/items/disbursement_payables_draft?filter[expense_id][_eq]=${expenseId}&limit=1`
      );
      if (payablesRes.data && payablesRes.data.length > 0) {
        return NextResponse.json({ message: "Cannot delete expense that has already been submitted to a voucher" }, { status: 400 });
      }

      await directusFetch(`/items/expense_draft/${expenseId}`, {
        method: "DELETE",
      });
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (resource === "attachment" && id) {
      const attachmentId = Number(id);

      // Fetch attachment to verify ownership of parent header
      const attachRes = await directusFetch(`/items/expense_attachments/${attachmentId}?fields=id,header_id,file_url`);
      const attachment = attachRes.data;
      if (!attachment) {
        return NextResponse.json({ message: "Attachment not found" }, { status: 404 });
      }

      const headerId = toNumber(attachment.header_id);
      const headerRes = await directusFetch(`/items/expense_draft_header/${headerId}?fields=created_by`);
      const header = headerRes.data;
      if (!header || toNumber(header.created_by) !== salesmanId) {
        return NextResponse.json({ message: "Unauthorized attachment access" }, { status: 403 });
      }

      // Delete attachment record
      await directusFetch(`/items/expense_attachments/${attachmentId}`, {
        method: "DELETE",
      });

      // Delete file from Directus
      if (attachment.file_url) {
        try {
          await directusFetch(`/files/${attachment.file_url}`, { method: "DELETE" });
        } catch (err) {
          console.error("Failed to delete file from storage during attachment deletion:", err);
        }
      }

      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ message: "Invalid parameters" }, { status: 400 });
  } catch (error: unknown) {
    console.error("DELETE API error:", error);
    const errMsg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ message: errMsg }, { status: 500 });
  }
}
