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
    throw new Error(
      `Directus API error: ${response.status} - ${typeof data === "object" ? JSON.stringify(data) : text}`
    );
  }

  return data;
}

function nowManila(): string {
  return new Date()
    .toLocaleString("sv-SE", { timeZone: "Asia/Manila" })
    .replace(" ", "T");
}

function todayManila(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Manila" });
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * GET Handler
 * Router resource endpoints:
 * - resource=suppliers: Lists active suppliers assigned to supervisor
 * - resource=headers-list: Lists all report headers created by supervisor
 * - resource=header: Retrieves a single weekly report header by ID
 * - resource=expenses: Retrieves expense lines for a header
 * - resource=returned-expenses: Retrieves expense lines with concern owned by supervisor for a supplier
 * - resource=coa: Retrieves the chart of accounts
 */
async function getVoucherStatusAndLinesCount(headerId: number) {
  const [expRes, headerRes] = await Promise.all([
    directusFetch(`/items/expense_draft?filter[header_id][_eq]=${headerId}&limit=-1&fields=id`),
    directusFetch(`/items/expense_draft_header/${headerId}?fields=payee_id.id,payee_id,created_by`)
  ]);

  const expenseIds = (expRes.data || []).map((e: { id: number }) => e.id);
  const linesCount = expenseIds.length;
  const header = headerRes.data;

  if (!header) return { status: null, linesCount };

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

  return { status: disbStatus, linesCount };
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = decodeJwtPayload(token);
    const supervisorId = payload?.sub ? Number(payload.sub) : null;
    if (!supervisorId) {
      return NextResponse.json({ message: "Invalid token payload" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resource = searchParams.get("resource") || "suppliers";

    // 1. Get Suppliers list (specifically filter to find suppliers matching this supervisor's user ID)
    if (resource === "suppliers") {
      const suppliersRes = await directusFetch(
        `/items/suppliers?fields=id,supplier_name,supplier_shortcut,supplier_type&filter[isActive][_eq]=1&filter[user_id][_eq]=${supervisorId}&limit=-1&sort=supplier_name`
      );
      return NextResponse.json({ data: suppliersRes.data || [] }, { status: 200 });
    }

    // 2. Get headers list created by supervisor
    if (resource === "headers-list") {
      const headersRes = await directusFetch(
        `/items/expense_draft_header?filter[created_by][_eq]=${supervisorId}&fields=id,payee_id.id,payee_id.supplier_name,period_from,period_to,status,remarks&limit=-1&sort=-id`
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
          `/items/expense_draft?filter[header_id][_in]=${headerIds.join(",")}&filter[is_supervisor][_eq]=1&fields=id,header_id,status&limit=-1`
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

      // Batch-fetch vouchers for all distinct payees in this supervisor's headers
      // so we can reflect the real voucher status (Submitted/Approved/etc.) on each card
      interface HeaderPayee {
        id: number;
        payee_id?: { id: number } | number | null;
      }
      const payeeIds = [...new Set(headers.map((h: HeaderPayee) => {
        const payee = h.payee_id;
        return typeof payee === "object" && payee !== null ? payee.id : payee;
      }).filter(Boolean))];

      interface VoucherItem {
        id: number;
        payee: { id: number } | number | null;
        status: string;
        doc_no?: string;
        approval_version?: number;
        total_amount?: number;
      }
      const vouchersByPayee: Record<number, VoucherItem> = {};
      if (payeeIds.length > 0) {
        const vouchersRes = await directusFetch(
          `/items/disbursement_draft?filter[encoder_id][_eq]=${supervisorId}&filter[payee][_in]=${payeeIds.join(",")}&filter[is_supervisor][_eq]=1&fields=id,payee,status&limit=-1&sort=-id`
        );
        // Keep only the latest voucher per payee (array is sorted -id so first = latest)
        const vouchers = (vouchersRes.data || []) as VoucherItem[];
        for (const v of vouchers) {
          const payee = v.payee;
          const pid = typeof payee === "object" && payee !== null ? payee.id : payee;
          if (pid && typeof pid === "number" && !vouchersByPayee[pid]) {
            vouchersByPayee[pid] = v;
          }
        }
      }

      interface HeaderItem {
        id: number;
        payee_id?: { id: number } | number | null;
        [key: string]: unknown;
      }
      const enriched = (headers as HeaderItem[]).map((h) => {
        const headerLines = linesByHeader[toNumber(h.id)] || [];
        const payee = h.payee_id;
        const payeeId = typeof payee === "object" && payee !== null ? payee.id : payee;
        const voucher = typeof payeeId === "number" ? vouchersByPayee[payeeId] : undefined;
        return {
          ...h,
          lines_count: headerLines.length,
          has_concern: headerLines.some((l) => l.status === "With Concern"),
          voucher_status: voucher?.status ?? null,
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

      // Check if there is an associated pending voucher
      let voucher = null;
      const expensesRes = await directusFetch(
        `/items/expense_draft?filter[header_id][_eq]=${header.id}&limit=-1&fields=id`
      );
      const expenseIds = (expensesRes.data || []).map((e: { id: number }) => e.id);

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

      return NextResponse.json({ header, voucher }, { status: 200 });
    }

    // 4. Get Expense Lines for header
    if (resource === "expenses") {
      const headerId = searchParams.get("header_id");
      if (!headerId) {
        return NextResponse.json({ message: "Missing header_id" }, { status: 400 });
      }

      const expensesRes = await directusFetch(
        `/items/expense_draft?filter[header_id][_eq]=${Number(headerId)}&filter[is_supervisor][_eq]=1&limit=-1&sort=transaction_date&fields=id,header_id,encoded_by,particulars,amount,transaction_date,payee,payee_id,attachment_url,remarks,division_id,status,version,feedback,return_to`
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

    // 5. Get Returned Concern Items for supervisor & supplier
    if (resource === "returned-expenses") {
      const supplierId = searchParams.get("supplier_id");
      if (!supplierId) {
        return NextResponse.json({ message: "Missing supplier_id" }, { status: 400 });
      }

      const expensesRes = await directusFetch(
        `/items/expense_draft?filter[status][_in]=With Concern,Rejected&filter[encoded_by][_eq]=${supervisorId}&filter[payee_id][_eq]=${Number(supplierId)}&filter[is_supervisor][_eq]=1&limit=-1&fields=id,header_id,encoded_by,particulars,amount,transaction_date,payee,payee_id,attachment_url,remarks,division_id,status,version,feedback,return_to`
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
 * - resource=submit: Approves weekly lines and consolidates them into a disbursement draft
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = decodeJwtPayload(token);
    const supervisorId = payload?.sub ? Number(payload.sub) : null;
    if (!supervisorId) {
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

      const supplierIdNum = Number(supplierId);

      // Verify supplier details
      const supplierRes = await directusFetch(
        `/items/suppliers/${supplierIdNum}?fields=id,supplier_name`
      );
      const supplier = supplierRes.data;
      if (!supplier) {
        return NextResponse.json({ message: "Supplier payee not found" }, { status: 404 });
      }

      // Get supervisor division from supervisor_per_division table
      const divRes = await directusFetch(
        `/items/supervisor_per_division?filter[supervisor_id][_eq]=${supervisorId}&fields=division_id&limit=1`
      );
      const divisionId = divRes.data?.[0]?.division_id ? toNumber(divRes.data[0].division_id) : 1; // default fallback if null

      // Create new header
      const createRes = await directusFetch(`/items/expense_draft_header`, {
        method: "POST",
        body: JSON.stringify({
          division_id: divisionId,
          payee_id: supplierIdNum,
          period_from: from,
          period_to: to,
          remarks: remarks || null,
          created_by: supervisorId,
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
      
      // Load and validate header status and date boundaries
      if (body.header_id) {
        const headerId = Number(body.header_id);
        const headerRes = await directusFetch(`/items/expense_draft_header/${headerId}?fields=status,period_from,period_to`);
        const header = headerRes.data;
        if (!header) {
          return NextResponse.json({ message: "Associated weekly report header not found." }, { status: 404 });
        }
        if (header.status !== "Drafts") {
          return NextResponse.json({ message: `This weekly report header is locked (status: ${header.status}) and cannot receive new lines.` }, { status: 400 });
        }

        // Verify if voucher is locked (conditional rule: lock if Submitted/Approved/Paid or Rejected with 1 line)
        const { status: disbStatus, linesCount: disbLinesCount } = await getVoucherStatusAndLinesCount(headerId);
        if (disbStatus && (["Submitted", "Approved", "Paid"].includes(disbStatus) || (disbStatus === "Rejected" && disbLinesCount <= 1))) {
          return NextResponse.json({ message: `This weekly report is locked (voucher status: ${disbStatus}) and cannot receive new lines.` }, { status: 400 });
        }
        
        // Verify transaction date fits within boundary
        const lineDate = body.transaction_date;
        if (lineDate < header.period_from || lineDate > header.period_to) {
          return NextResponse.json({ message: `Transaction date (${lineDate}) must fall within the weekly period (${header.period_from} to ${header.period_to}).` }, { status: 400 });
        }
      }

      const createRes = await directusFetch(`/items/expense_draft`, {
        method: "POST",
        body: JSON.stringify({
          ...body,
          encoded_by: supervisorId,
          status: "Approved",
          approved_at: nowManila(),
          is_supervisor: 1,
          version: 1,
          drafted_at: nowManila(),
        }),
      });
      return NextResponse.json({ data: createRes.data }, { status: 201 });
    }

    if (resource === "submit") {
      const body = await request.json();
      const { header_id: headerId, supplier_id: supplierId, expense_ids: expenseIds, remarks = "" } = body;

      if (!headerId || !supplierId || !expenseIds || expenseIds.length === 0) {
        return NextResponse.json({ message: "Invalid submission payload" }, { status: 400 });
      }

      // Fetch supervisor division & department
      const divRes = await directusFetch(
        `/items/supervisor_per_division?filter[supervisor_id][_eq]=${supervisorId}&fields=division_id&limit=1`
      );
      const divisionId = divRes.data?.[0]?.division_id ? toNumber(divRes.data[0].division_id) : null;

      const supervisorRes = await directusFetch(
        `/items/user?filter[user_id][_eq]=${supervisorId}&fields=user_id,user_department`
      );
      const supervisor = supervisorRes.data?.[0];
      const departmentId = supervisor?.user_department ? toNumber(supervisor.user_department) : null;

      // Fetch supplier name
      const supplierRes = await directusFetch(
        `/items/suppliers/${supplierId}?fields=id,supplier_name`
      );
      const supplier = supplierRes.data;
      const supplierName = supplier?.supplier_name || `Supplier #${supplierId}`;

      const nowTs = nowManila();

      // 1. Fetch expenses being submitted
      const expRes = await directusFetch(
        `/items/expense_draft?filter[id][_in]=${expenseIds.join(",")}&limit=-1&fields=id,amount,attachment_url,particulars,remarks,version,transaction_date,status`
      );
      const expenses = expRes.data || [];

      if (expenses.length === 0) {
        return NextResponse.json({ message: "No valid expense items found for consolidation" }, { status: 404 });
      }

      interface ConsolidateExpenseItem {
        id: number;
        amount: number;
        attachment_url?: string;
        version?: number;
        [key: string]: unknown;
      }
      const expensesTyped = expenses as ConsolidateExpenseItem[];
      // Enforce receipt attachments for all lines before submit
      const missingAttachment = expensesTyped.find((exp) => !exp.attachment_url);
      if (missingAttachment) {
        return NextResponse.json({ message: "Cannot submit weekly report: all lines must have a valid receipt attachment." }, { status: 400 });
      }

      const totalAmount = expensesTyped.reduce((sum: number, exp) => sum + toNumber(exp.amount), 0);
      const supportingDocs = expensesTyped
        .map((exp) => exp.attachment_url)
        .filter(Boolean)
        .join(",");

      // 2. Patch all expense draft statuses to 'Approved'
      for (const exp of expenses) {
        const nextVersion = toNumber(exp.version, 1) + 1;
        await directusFetch(`/items/expense_draft/${exp.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            status: "Approved",
            encoded_by: supervisorId,
            payee_id: supplierId,
            payee: supplierName,
            return_to: null,
            feedback: null,
            approved_at: nowTs,
            version: nextVersion,
          }),
        });

        // Write audit log
        await directusFetch(`/items/expense_draft_logs`, {
          method: "POST",
          body: JSON.stringify({
            expense_id: exp.id,
            action: "UPDATE",
            changed_by: supervisorId,
            changed_at: nowTs,
            particulars: exp.particulars,
            division_id: divisionId,
            transaction_date: exp.transaction_date,
            amount: exp.amount,
            status: "Approved",
            remarks: `Approved and submitted to Bulk Approval by Supervisor (Owner) #${supervisorId}.`,
            version: nextVersion,
          }),
        });
      }

      // Update header status in expense_draft_header to 'Drafts' to allow subsequent edits (e.g. concern returns)
      await directusFetch(`/items/expense_draft_header/${headerId}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "Drafts",
          updated_at: nowTs,
        }),
      });

      // 3. Reconcile disbursement voucher
      let disbursementId: number | null = null;
      let docNo: string | null = null;
      let approvalVersion = 1;

      // Check if a voucher is already linked to these expenses
      const existingPayRes = await directusFetch(
        `/items/disbursement_payables_draft?filter[expense_id][_in]=${expenseIds.join(",")}&fields=disbursement_id&limit=1`
      );
      const existingPayRow = existingPayRes.data?.[0];

      if (existingPayRow) {
        const existingDisbId = typeof existingPayRow.disbursement_id === "object" && existingPayRow.disbursement_id !== null
          ? existingPayRow.disbursement_id.id
          : existingPayRow.disbursement_id;

        if (existingDisbId) {
          const disbRes = await directusFetch(
            `/items/disbursement_draft/${existingDisbId}?fields=id,doc_no,approval_version,total_amount`
          );
          const disb = disbRes.data;
          if (disb) {
            disbursementId = toNumber(disb.id);
            docNo = String(disb.doc_no || "");
            approvalVersion = toNumber(disb.approval_version, 1) + 1;
          }
        }
      }

      // Fallback: search for active pending voucher under payee supplier if all payables were detached
      if (!disbursementId) {
        const fallbackRes = await directusFetch(
          `/items/disbursement_draft?filter[payee][_eq]=${supplierId}&filter[encoder_id][_eq]=${supervisorId}&filter[status][_in]=Drafts,Submitted,Rejected,With Concern&sort=-id&limit=1&fields=id,doc_no,approval_version,total_amount`
        );
        const fallbackVoucher = fallbackRes.data?.[0];
        if (fallbackVoucher) {
          disbursementId = toNumber(fallbackVoucher.id);
          docNo = String(fallbackVoucher.doc_no);
          approvalVersion = toNumber(fallbackVoucher.approval_version, 1) + 1;
        }
      }

      if (disbursementId) {
        // Update existing pending voucher
        await directusFetch(`/items/disbursement_draft/${disbursementId}`, {
          method: "PATCH",
          body: JSON.stringify({
            payee: supplierId,
            total_amount: totalAmount,
            remarks: remarks || "Weekly Report updated by Supervisor",
            supporting_documents_url: supportingDocs || null,
            status: "Submitted",
            approval_version: approvalVersion,
            is_supervisor: 1,
            date_updated: nowTs,
          }),
        });

        // Write snapshot log to disbursement_draft_logs matching collection validation schema
        await directusFetch(`/items/disbursement_draft_logs`, {
          method: "POST",
          body: JSON.stringify({
            disbursement_id: disbursementId,
            doc_no: docNo,
            total_amount: totalAmount,
            status: "Submitted",
            remarks: remarks || "Supervisor resubmitted weekly report sheet.",
            version: approvalVersion,
            updated_by: supervisorId,
            log_date: nowTs,
          }),
        });

        // Delete old bridge payable links
        const oldPayRes = await directusFetch(
          `/items/disbursement_payables_draft?filter[disbursement_id][_eq]=${disbursementId}&fields=id&limit=-1`
        );
        const oldPayIds = (oldPayRes.data || []).map((p: { id: number }) => p.id);
        if (oldPayIds.length > 0) {
          await directusFetch(`/items/disbursement_payables_draft`, {
            method: "DELETE",
            body: JSON.stringify(oldPayIds),
          });
        }
      } else {
        // Create new voucher
        const latestRes = await directusFetch(
          `/items/disbursement_draft?filter[doc_no][_starts_with]=NT-&sort=-id&limit=1&fields=doc_no`
        );
        const latestDoc = latestRes.data?.[0]?.doc_no;
        let nextNum = 1000;
        if (latestDoc) {
          const match = latestDoc.match(/NT-(\d+)/);
          if (match) {
            nextNum = parseInt(match[1], 10) + 1;
          }
        }
        docNo = `NT-${nextNum}`;

        const createDisbRes = await directusFetch(`/items/disbursement_draft`, {
          method: "POST",
          body: JSON.stringify({
            doc_no: docNo,
            transaction_type: 2,
            payee: supplierId, // Payee is the Supplier
            encoder_id: supervisorId, // Owner is Supervisor
            approver_id: supervisorId, // Approved by Supervisor
            total_amount: totalAmount,
            transaction_date: expenses[0]?.transaction_date || todayManila(),
            division_id: divisionId,
            department_id: departmentId,
            remarks: remarks || "Weekly Report generated by Supervisor",
            supporting_documents_url: supportingDocs || null,
            status: "Submitted",
            isPosted: 0,
            is_supervisor: 1,
            date_created: nowTs,
            date_updated: nowTs,
            date_approved: nowTs,
            approval_version: 1,
            version: 1,
          }),
        });
        disbursementId = toNumber(createDisbRes.data?.id);
      }

      // Create new bridge rows in disbursement_payables_draft
      const payables = expensesTyped.map((exp) => ({
        disbursement_id: disbursementId,
        expense_id: exp.id,
        division_id: divisionId,
        reference_no: docNo,
        date: exp.transaction_date,
        coa_id: toNumber(exp.particulars),
        amount: toNumber(exp.amount),
        remarks: (exp.remarks as string) || null,
        version: toNumber(exp.version, 1),
        date_created: nowTs,
      }));

      await directusFetch(`/items/disbursement_payables_draft`, {
        method: "POST",
        body: JSON.stringify(payables),
      });

      return NextResponse.json({
        ok: true,
        disbursement_id: disbursementId,
        doc_no: docNo,
      }, { status: 200 });
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
 * If status is "With Concern", clears return_to and feedback (resubmitting).
 */
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = decodeJwtPayload(token);
    const supervisorId = payload?.sub ? Number(payload.sub) : null;
    if (!supervisorId) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resource = searchParams.get("resource");
    const id = searchParams.get("id");

    if (resource === "expense" && id) {
      const expenseId = Number(id);
      const body = await request.json();

      // Fetch original record to check version and status
      const originalRes = await directusFetch(`/items/expense_draft/${expenseId}?fields=id,status,version,particulars,division_id,transaction_date,amount,header_id`);
      const original = originalRes.data;

      if (!original) {
        return NextResponse.json({ message: "Expense draft not found" }, { status: 404 });
      }

      // Load and validate header status and date boundaries
      if (original.header_id) {
        const headerId = Number(original.header_id);
        const headerRes = await directusFetch(`/items/expense_draft_header/${headerId}?fields=status,period_from,period_to`);
        const header = headerRes.data;
        if (header) {
          if (header.status !== "Drafts") {
            return NextResponse.json({ message: `This weekly report header is locked (status: ${header.status}) and cannot receive edits.` }, { status: 400 });
          }

          // Verify if voucher is locked (conditional rule: lock if Submitted/Approved/Paid or Rejected with 1 line)
          const { status: disbStatus, linesCount: disbLinesCount } = await getVoucherStatusAndLinesCount(headerId);
          if (disbStatus && (["Submitted", "Approved", "Paid"].includes(disbStatus) || (disbStatus === "Rejected" && disbLinesCount <= 1))) {
            return NextResponse.json({ message: `This weekly report is locked (voucher status: ${disbStatus}) and cannot receive edits.` }, { status: 400 });
          }
          
          // Verify transaction date fits within boundary
          const updatedDate = body.transaction_date || original.transaction_date;
          if (updatedDate < header.period_from || updatedDate > header.period_to) {
            return NextResponse.json({ message: `Transaction date (${updatedDate}) must fall within the weekly period (${header.period_from} to ${header.period_to}).` }, { status: 400 });
          }
        }
      }
 
      const nextVersion = toNumber(original.version, 1) + 1;
      const isConcern = original.status === "With Concern";

      const patchData: Record<string, unknown> = {
        ...body,
        encoded_by: supervisorId,
        version: nextVersion,
      };

      if (isConcern) {
        // Clear flags upon revision resubmit
        patchData.status = "Approved";
        patchData.return_to = null;
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
          changed_by: supervisorId,
          changed_at: nowManila(),
          particulars: body.particulars || original.particulars,
          division_id: original.division_id,
          transaction_date: body.transaction_date || original.transaction_date,
          amount: body.amount || original.amount,
          status: patchData.status || original.status,
          remarks: `Updated by Supervisor (Owner) #${supervisorId}. Amount adjusted to ${body.amount || original.amount}.`,
          version: nextVersion,
        }),
      });

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

    const { searchParams } = new URL(request.url);
    const resource = searchParams.get("resource");
    const id = searchParams.get("id");

    if (resource === "expense" && id) {
      const expenseId = Number(id);

      // Fetch expense record to find header_id
      const expRes = await directusFetch(`/items/expense_draft/${expenseId}?fields=header_id`);
      const expenseRow = expRes.data;
      if (expenseRow && expenseRow.header_id) {
        const headerId = Number(expenseRow.header_id);
        const { status: disbStatus, linesCount: disbLinesCount } = await getVoucherStatusAndLinesCount(headerId);
        if (disbStatus && (["Submitted", "Approved", "Paid"].includes(disbStatus) || (disbStatus === "Rejected" && disbLinesCount <= 1))) {
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

    return NextResponse.json({ message: "Invalid parameters" }, { status: 400 });
  } catch (error: unknown) {
    console.error("DELETE API error:", error);
    const errMsg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ message: errMsg }, { status: 500 });
  }
}
