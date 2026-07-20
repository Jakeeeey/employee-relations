import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { decodeJwtPayload } from "@/lib/auth-utils";

// Mock Next.js Headers & Auth Utils
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  decodeJwtPayload: vi.fn(),
}));

// Mock route handlers by importing them after mock setups
import { GET, PATCH, POST } from "../../../../../app/api/er/expense-report/salesman-wer/route";

const mockToken = "mocked-salesman-token";
const mockSalesmanId = 123;
const mockDivisionId = 1;

describe("Salesman WER Module Integrity Tests", () => {
  let mockCookiesGet: unknown;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup authenticated cookies
    mockCookiesGet = vi.fn().mockReturnValue({ value: mockToken });
    (cookies as unknown as Mock).mockReturnValue({
      get: mockCookiesGet,
    });
    
    (decodeJwtPayload as unknown as Mock).mockReturnValue({
      sub: String(mockSalesmanId),
    });

    // Mock global fetch to intercept Directus requests
    global.fetch = vi.fn() as unknown as typeof fetch;
  });

  function mockDirectusResponses(responses: Array<{ status: number; data: unknown }>) {
    const mockFetch = (global.fetch as unknown as Mock);
    responses.forEach((res) => {
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: res.status >= 200 && res.status < 300,
          status: res.status,
          text: () => Promise.resolve(JSON.stringify(res.data)),
        })
      );
    });
  }

  // Scenario 1: Valid header, multiple WER summaries, and multiple expense lines
  it("Scenario 1: Valid header creation with positive path", async () => {
    // 1. Supplier lookup response
    // 2. Division lookup response
    // 3. Duplicate check response (empty list)
    // 4. Header insert response
    // 5. Header details fetch
    mockDirectusResponses([
      { status: 200, data: { data: { id: 5, supplier_name: "Supplier A" } } },
      { status: 200, data: { data: [{ division_id: mockDivisionId }] } },
      { status: 200, data: { data: [] } },
      { status: 200, data: { data: { id: 100 } } },
      { status: 200, data: { data: { id: 100, payee_id: { id: 5, supplier_name: "Supplier A" }, period_from: "2026-07-01", period_to: "2026-07-07" } } }
    ]);

    const req = new NextRequest("http://localhost/api/er/expense-report/salesman-wer?resource=header", {
      method: "POST",
      body: JSON.stringify({
        payee_id: 5,
        period_from: "2026-07-01",
        period_to: "2026-07-07",
        remarks: "Week 1",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.id).toBe(100);
  });

  // Scenario 2 & 12: Multiple WER attachments under one header & Duplicate attachment URL
  it("Scenario 2 & 12: Save WER Summary attachments and reject duplicates", async () => {
    // Save first attachment
    mockDirectusResponses([
      { status: 200, data: { data: { id: 100, created_by: mockSalesmanId } } }, // header exists check
      { status: 200, data: { data: [] } }, // duplicate attachment check
      { status: 201, data: { data: { id: 50, header_id: 100, file_url: "file-url-1" } } } // insert attachment
    ]);

    const req1 = new NextRequest("http://localhost/api/er/expense-report/salesman-wer?resource=attachment", {
      method: "POST",
      body: JSON.stringify({
        header_id: 100,
        file_name: "summary1.pdf",
        file_url: "file-url-1",
        file_type: "application/pdf",
        file_size: 1024,
      }),
    });

    const res1 = await POST(req1);
    expect(res1.status).toBe(201);

    // Save duplicate attachment
    mockDirectusResponses([
      { status: 200, data: { data: { id: 100, created_by: mockSalesmanId } } }, // header exists
      { status: 200, data: { data: [{ id: 50, file_url: "file-url-1" }] } }, // duplicate exists!
      { status: 200, data: { success: true } } // Directus file deletion fallback cleanup mock
    ]);

    const req2 = new NextRequest("http://localhost/api/er/expense-report/salesman-wer?resource=attachment", {
      method: "POST",
      body: JSON.stringify({
        header_id: 100,
        file_name: "summary1.pdf",
        file_url: "file-url-1",
      }),
    });

    const res2 = await POST(req2);
    expect(res2.status).toBe(409); // Conflict
  });

  // Scenario 3: Salesman-side final submission is disabled
  it("Scenario 3: Salesman WER submit endpoint is disabled", async () => {
    mockDirectusResponses([
      { status: 200, data: { data: { id: 100, created_by: mockSalesmanId, status: "Drafts", division_id: 1 } } }, // header lookup
      { status: 200, data: { data: { id: 5, supplier_name: "Supplier A" } } }, // supplier details
      { status: 200, data: { data: [] } }, // expense_attachments empty -> has_wer is false
    ]);

    const req = new NextRequest("http://localhost/api/er/expense-report/salesman-wer?resource=submit", {
      method: "POST",
      body: JSON.stringify({
        header_id: 100,
        supplier_id: 5,
        expense_ids: [200],
        remarks: "Consolidate",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(410);
    const body = await res.json();
    expect(body.message).toContain("Salesman weekly report submission is disabled");
  });

  // Scenario 4: Disabled submit route does not query attachments
  it("Scenario 4: Disabled submit route does not query WER attachments", async () => {
    mockDirectusResponses([
      { status: 200, data: { data: { id: 100, created_by: mockSalesmanId, status: null, division_id: 1 } } }, // legacy header without status
      { status: 200, data: { data: { id: 5, supplier_name: "Supplier A" } } }, // supplier
    ]);
    
    // Mock database query failure (throw / status 500)
    (global.fetch as unknown as Mock).mockImplementationOnce(() =>
      Promise.reject(new Error("Database connection timed out"))
    );

    const req = new NextRequest("http://localhost/api/er/expense-report/salesman-wer?resource=submit", {
      method: "POST",
      body: JSON.stringify({
        header_id: 100,
        supplier_id: 5,
        expense_ids: [200],
        remarks: "Consolidate",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(410);
    const body = await res.json();
    expect(body.message).toContain("Salesman weekly report submission is disabled");
  });

  // Scenario 5: Expense line without header_id
  it("Scenario 5: Creating expense line without header_id is rejected", async () => {
    const req = new NextRequest("http://localhost/api/er/expense-report/salesman-wer?resource=expense", {
      method: "POST",
      body: JSON.stringify({
        amount: 250,
        transaction_date: "2026-07-02",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toContain("linked to a valid weekly report header");
  });

  // Scenario 6 & 15: Invalid/nonexistent header_id and unauthorized header access
  it("Scenario 6 & 15: Creating expense under unauthorized header returns 403 status", async () => {
    mockDirectusResponses([
      { status: 200, data: { data: { id: 101, created_by: 999, division_id: 1 } } } // owned by user 999
    ]);

    const req = new NextRequest("http://localhost/api/er/expense-report/salesman-wer?resource=expense", {
      method: "POST",
      body: JSON.stringify({
        header_id: 101,
        amount: 100,
        transaction_date: "2026-07-02",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403); // Forbidden
  });

  // Scenario 7: Header and expense salesman mismatch
  it("Scenario 7: Creating expense when salesman mismatches header creator is rejected", async () => {
    mockDirectusResponses([
      { status: 200, data: { data: { id: 102, created_by: 999 } } } // Mismatch
    ]);

    const req = new NextRequest("http://localhost/api/er/expense-report/salesman-wer?resource=expense", {
      method: "POST",
      body: JSON.stringify({
        header_id: 102,
        amount: 50,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  // Scenario 8: Header and expense division mismatch
  it("Scenario 8: Creating expense when division mismatches parent header returns 400", async () => {
    mockDirectusResponses([
      { status: 200, data: { data: { id: 100, created_by: mockSalesmanId, division_id: 1, status: "Drafts" } } }, // parent header
      { status: 200, data: { data: [{ division_id: 1 }] } }, // salesman division check
      { status: 200, data: { data: [] } }, // getVoucherStatusAndLinesCount expRes
      { status: 200, data: { data: { id: 100 } } } // getVoucherStatusAndLinesCount headerRes
    ]);

    const req = new NextRequest("http://localhost/api/er/expense-report/salesman-wer?resource=expense", {
      method: "POST",
      body: JSON.stringify({
        header_id: 100,
        amount: 200,
        particulars: 3000,
        transaction_date: "2026-07-03",
        division_id: 2, // Mismatch with parent header division (1)
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toContain("division must match parent header division");
  });

  // Scenario 9: Expense date outside the reporting period
  it("Scenario 9: Date outside weekly interval is rejected", async () => {
    mockDirectusResponses([
      { status: 200, data: { data: { id: 100, created_by: mockSalesmanId, division_id: 1, status: "Drafts", period_from: "2026-07-01", period_to: "2026-07-07" } } },
      { status: 200, data: { data: [{ division_id: 1 }] } },
      { status: 200, data: { data: [] } }, // getVoucherStatusAndLinesCount expRes
      { status: 200, data: { data: { id: 100 } } } // getVoucherStatusAndLinesCount headerRes
    ]);

    const req = new NextRequest("http://localhost/api/er/expense-report/salesman-wer?resource=expense", {
      method: "POST",
      body: JSON.stringify({
        header_id: 100,
        amount: 200,
        particulars: 3000,
        transaction_date: "2026-07-15", // outside 2026-07-01 to 2026-07-07
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toContain("must fall within the weekly period");
  });

  // Scenario 10: Zero, negative, NaN, and infinite amounts
  it("Scenario 10: Zero or negative amounts are rejected", async () => {
    mockDirectusResponses([
      { status: 200, data: { data: { id: 100, created_by: mockSalesmanId, division_id: 1, status: "Drafts", period_from: "2026-07-01", period_to: "2026-07-07" } } },
      { status: 200, data: { data: [{ division_id: 1 }] } },
      { status: 200, data: { data: [] } }, // getVoucherStatusAndLinesCount expRes
      { status: 200, data: { data: { id: 100 } } } // getVoucherStatusAndLinesCount headerRes
    ]);

    const req = new NextRequest("http://localhost/api/er/expense-report/salesman-wer?resource=expense", {
      method: "POST",
      body: JSON.stringify({
        header_id: 100,
        amount: -50, // Negative
        particulars: 3000,
        transaction_date: "2026-07-02",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  // Scenario 11: Duplicate form submission (expense line)
  it("Scenario 11: Duplicate expense lines with identical attributes returns 409 status", async () => {
    mockDirectusResponses([
      { status: 200, data: { data: { id: 100, created_by: mockSalesmanId, division_id: 1, status: "Drafts", period_from: "2026-07-01", period_to: "2026-07-07" } } },
      { status: 200, data: { data: [{ division_id: 1 }] } },
      { status: 200, data: { data: [] } }, // getVoucherStatusAndLinesCount expRes
      { status: 200, data: { data: { id: 100 } } }, // getVoucherStatusAndLinesCount headerRes
      { status: 200, data: { data: [{ id: 800 }] } } // duplicate check found matching line!
    ]);

    const req = new NextRequest("http://localhost/api/er/expense-report/salesman-wer?resource=expense", {
      method: "POST",
      body: JSON.stringify({
        header_id: 100,
        amount: 250,
        particulars: 3000,
        transaction_date: "2026-07-02",
        payee: "Merchant ABC",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  // Scenario 13: Payable with missing expense_id
  it("Scenario 13: Cannot submit payable consolidated link without valid expense_id", async () => {
    mockDirectusResponses([
      { status: 200, data: { data: { id: 100, created_by: mockSalesmanId, status: "Drafts", division_id: 1 } } }, // header
      { status: 200, data: { data: { id: 5, supplier_name: "Supplier A" } } }, // supplier
      { status: 200, data: { data: [{ id: 50, header_id: 100, file_url: "wer-summary.pdf" }] } }, // attachments
      { status: 200, data: { data: [] } } // NO lines found -> invalid expense link!
    ]);

    const req = new NextRequest("http://localhost/api/er/expense-report/salesman-wer?resource=submit", {
      method: "POST",
      body: JSON.stringify({
        header_id: 100,
        supplier_id: 5,
        expense_ids: [999], // non-existent
        remarks: "Consolidate",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(410);
    const body = await res.json();
    expect(body.message).toContain("Salesman weekly report submission is disabled");
  });

  // Scenario 16 & 17: Partial upload or database failure & Retry after failed submission
  it("Scenario 16 & 17: Rollback is executed on consolidation failure, enabling clean retries", async () => {
    mockDirectusResponses([
      { status: 200, data: { data: { id: 100, created_by: mockSalesmanId, status: "Drafts", division_id: 1 } } }, // header
      { status: 200, data: { data: { id: 5, supplier_name: "Supplier A" } } }, // supplier
      { status: 200, data: { data: [{ id: 50, header_id: 100, file_url: "wer-summary.pdf" }] } }, // attachments
      { status: 200, data: { data: [{ id: 200, header_id: 100, encoded_by: mockSalesmanId, division_id: 1, particulars: 4000, amount: 500, transaction_date: "2026-07-02", attachment_url: "receipt.png", status: "Drafts", version: 1 }] } } // lines
    ]);

    // Mocks for consolidation process up to failure:
    mockDirectusResponses([
      { status: 200, data: {} }, // patch expense
    ]);

    // Force failure at audit log insert
    (global.fetch as unknown as Mock).mockImplementationOnce(() =>
      Promise.reject(new Error("Audit log failure"))
    );

    // Rollback mocks:
    mockDirectusResponses([
      { status: 200, data: {} }  // restore expense draft
    ]);

    const req = new NextRequest("http://localhost/api/er/expense-report/salesman-wer?resource=submit", {
      method: "POST",
      body: JSON.stringify({
        header_id: 100,
        supplier_id: 5,
        expense_ids: [200],
        remarks: "Consolidate",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(410);
    const body = await res.json();
    expect(body.message).toContain("Salesman weekly report submission is disabled");
    const headerRollbackCall = (global.fetch as unknown as Mock).mock.calls.find(([url, init]) =>
      String(url).includes("/items/expense_draft_header/100") &&
      (init as RequestInit | undefined)?.method === "PATCH"
    );
    expect(headerRollbackCall).toBeUndefined();
  });

  // Scenario 14: Draft total mismatch
  it("Scenario 14: Server calculated sum ignores and overrides client-submitted totals", async () => {
    mockDirectusResponses([
      { status: 200, data: { data: { id: 100, created_by: mockSalesmanId, status: "Drafts", division_id: 1 } } }, // header
      { status: 200, data: { data: { id: 5, supplier_name: "Supplier A" } } }, // supplier
      { status: 200, data: { data: [{ id: 50, header_id: 100, file_url: "wer-summary.pdf" }] } }, // attachments
      { status: 200, data: { data: [{ id: 200, header_id: 100, encoded_by: mockSalesmanId, division_id: 1, particulars: 4000, amount: 500, transaction_date: "2026-07-02", attachment_url: "receipt.png", status: "Drafts" }] } } // lines lookup: sum is 500
    ]);

    // Consolidate mocks:
    mockDirectusResponses([
      { status: 200, data: {} }, // patch expense
      { status: 200, data: {} }, // insert log
      { status: 200, data: {} }, // patch header
    ]);

    // We pass a wrong amount (99999) inside body. But server ignores it and uses the calculated sum (500)
    const req = new NextRequest("http://localhost/api/er/expense-report/salesman-wer?resource=submit", {
      method: "POST",
      body: JSON.stringify({
        header_id: 100,
        supplier_id: 5,
        expense_ids: [200],
        remarks: "Consolidate",
        total_amount: 99999, // Mismatched / manipulated amount
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(410);
    const body = await res.json();
    expect(body.message).toContain("Salesman weekly report submission is disabled");
    const expenseSubmitCall = (global.fetch as unknown as Mock).mock.calls.find(([url, init]) =>
      String(url).includes("/items/expense_draft/200") &&
      (init as RequestInit | undefined)?.method === "PATCH"
    );
    expect(expenseSubmitCall).toBeUndefined();
    const headerSubmitCall = (global.fetch as unknown as Mock).mock.calls.find(([url, init]) =>
      String(url).includes("/items/expense_draft_header/100") &&
      (init as RequestInit | undefined)?.method === "PATCH"
    );
    expect(headerSubmitCall).toBeUndefined();
  });

  // Scenario 18: Submission containing multiple valid headers
  it("Scenario 18: Multiple headers can exist independently under their own periods", async () => {
    // Supplier lookup
    mockDirectusResponses([
      { status: 200, data: { data: { id: 5 } } }
    ]);
    // Division lookup
    mockDirectusResponses([
      { status: 200, data: { data: [{ division_id: 1 }] } }
    ]);
    // Duplicate check for Period A: exists
    mockDirectusResponses([
      { status: 200, data: { data: [{ id: 99 }] } }
    ]);

    const req1 = new NextRequest("http://localhost/api/er/expense-report/salesman-wer?resource=header", {
      method: "POST",
      body: JSON.stringify({
        payee_id: 5,
        period_from: "2026-07-01",
        period_to: "2026-07-07",
      }),
    });
    const res1 = await POST(req1);
    expect(res1.status).toBe(409); // Rejected duplicate

    // Duplicate check for Period B (different dates): empty list (does not exist)
    mockDirectusResponses([
      { status: 200, data: { data: { id: 5 } } },
      { status: 200, data: { data: [{ division_id: 1 }] } },
      { status: 200, data: { data: [] } }, // empty list (no duplicate header for this reporting period)
      { status: 200, data: { data: { id: 101 } } }, // insert new header
      { status: 200, data: { data: { id: 101, period_from: "2026-07-08", period_to: "2026-07-14" } } } // fetch details
    ]);

    const req2 = new NextRequest("http://localhost/api/er/expense-report/salesman-wer?resource=header", {
      method: "POST",
      body: JSON.stringify({
        payee_id: 5,
        period_from: "2026-07-08",
        period_to: "2026-07-14",
      }),
    });
    const res2 = await POST(req2);
    expect(res2.status).toBe(201); // Successfully created independent header
  });

  // Scenario 19 & 20: GET details route returns attachments list for carousel rendering
  it("Scenario 19 & 20: GET details route returns attachments list for carousel rendering", async () => {
    mockDirectusResponses([
      { status: 200, data: { data: { id: 100, created_by: mockSalesmanId } } }, // header details
      { status: 200, data: { data: [] } }, // disbursement draft search
      { status: 200, data: { data: [{ id: 80, file_url: "wer-file-uuid", file_name: "summary.pdf" }] } } // attachments list!
    ]);

    const req = new NextRequest("http://localhost/api/er/expense-report/salesman-wer?resource=header&header_id=100", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.attachments.length).toBe(1);
    expect(body.attachments[0].file_url).toBe("wer-file-uuid");
  });

  // Scenario 21: Pending_L2 locks edits
  it("Scenario 21: Weekly report is locked when voucher status is Pending_L2", async () => {
    mockDirectusResponses([
      { status: 200, data: { data: { id: 100, created_by: mockSalesmanId, division_id: 1, status: "Drafts" } } }, // parent header
      { status: 200, data: { data: [{ id: 200 }] } }, // getVoucherStatusAndLinesCount expRes (1 line)
      { status: 200, data: { data: { id: 100 } } }, // getVoucherStatusAndLinesCount headerRes
      { status: 200, data: { data: [{ disbursement_id: 500 }] } }, // getVoucherStatusAndLinesCount payablesRes
      { status: 200, data: { data: { status: "Pending_L2" } } } // getVoucherStatusAndLinesCount disbRes
    ]);

    const req = new NextRequest("http://localhost/api/er/expense-report/salesman-wer?resource=expense", {
      method: "POST",
      body: JSON.stringify({
        header_id: 100,
        amount: 200,
        particulars: 3000,
        transaction_date: "2026-07-03",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toContain("locked (voucher status: Pending_L2)");
  });

  // Scenario 22: All items rejected overrides status to Rejected
  it("Scenario 22: All items rejected overrides status to Rejected in headers list", async () => {
    mockDirectusResponses([
      // headers-list lookup: returns 1 header
      { status: 200, data: { data: [{ id: 100, payee_id: 5, period_from: "2026-07-01", period_to: "2026-07-07", status: "Drafts" }] } },
      // lines lookup: returns 2 lines, both are Rejected
      { status: 200, data: { data: [{ id: 10, header_id: 100, status: "Rejected" }, { id: 11, header_id: 100, status: "Rejected" }] } },
      // payable links: empty list
      { status: 200, data: { data: [] } },
      // attachments lookup: empty list
      { status: 200, data: { data: [] } }
    ]);

    const req = new NextRequest("http://localhost/api/er/expense-report/salesman-wer?resource=headers-list", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data[0].voucher_status).toBe("Rejected");
  });

  it("Scenario 23: Header list does not reuse another period's voucher status for the same supplier", async () => {
    (global.fetch as unknown as Mock).mockImplementation((url: string) => {
      let data: unknown = { data: [] };

      if (url.includes("/items/expense_draft_header?")) {
        data = {
          data: [
            { id: 101, payee_id: 5, period_from: "2026-07-08", period_to: "2026-07-14", status: "Paid" },
            { id: 100, payee_id: 5, period_from: "2026-07-15", period_to: "2026-07-21", status: "Waiting for Approval" },
          ],
        };
      } else if (url.includes("/items/expense_draft?")) {
        data = {
          data: [
            { id: 10, header_id: 101, status: "Approved" },
            { id: 20, header_id: 100, status: "Drafts" },
          ],
        };
      } else if (url.includes("/items/disbursement_payables_draft?")) {
        data = { data: [{ expense_id: 10, disbursement_id: 500 }] };
      } else if (url.includes("/items/disbursement_draft?")) {
        data = { data: [{ id: 500, payee: 5, status: "Paid" }] };
      } else if (url.includes("/items/disbursement_draft/500")) {
        data = { data: { id: 500, status: "Paid" } };
      } else if (url.includes("/items/expense_attachments?")) {
        data = { data: [] };
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(data)),
      });
    });

    const req = new NextRequest("http://localhost/api/er/expense-report/salesman-wer?resource=headers-list", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.find((header: { id: number }) => header.id === 101).voucher_status).toBe("Paid");
    expect(body.data.find((header: { id: number }) => header.id === 100).voucher_status).toBeNull();
    expect(body.data.find((header: { id: number }) => header.id === 100).has_wer_file).toBe(false);
  });

  it("routes a corrected concern with null return_to back to supervisor approval", async () => {
    mockDirectusResponses([
      { status: 200, data: { data: { id: 700, status: "With Concern", version: 2, particulars: 4000, division_id: 1, transaction_date: "2026-07-15", amount: 100, header_id: 100, return_to: null } } },
      { status: 200, data: { data: { id: 100, status: "Drafts", period_from: "2026-07-14", period_to: "2026-07-20", created_by: mockSalesmanId, division_id: 1 } } },
      { status: 200, data: { data: [] } },
      { status: 200, data: { data: { id: 100 } } },
      { status: 200, data: { data: [] } },
      { status: 200, data: { data: { id: 700 } } },
      { status: 200, data: { data: { id: 900 } } },
    ]);

    const req = new NextRequest("http://localhost/api/er/expense-report/salesman-wer?resource=expense&id=700", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: 700,
        header_id: 100,
        encoded_by: 999,
        division_id: 1,
        transaction_date: "2026-07-16",
        particulars: 4001,
        amount: 125,
        payee: "Updated Payee",
        payee_id: 89,
        remarks: "Corrected receipt",
        attachment_url: "corrected-receipt",
        status: "Rejected",
        return_to: "Bulk Approval",
        feedback: "client override",
        approved_at: "2020-01-01T00:00:00",
        rejected_at: "2020-01-01T00:00:00",
        drafted_at: "2020-01-01T00:00:00",
        encoded_date: "2020-01-01T00:00:00",
        is_supervisor: 1,
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);

    const calls = (global.fetch as unknown as Mock).mock.calls as [string, RequestInit][];
    const duplicateQuery = calls.find(([url]) => url.includes("filter[id]"))?.[0];
    const expensePatch = calls.find(([url, init]) => url.includes("/items/expense_draft/700") && init?.method === "PATCH");
    const logPost = calls.find(([url, init]) => url.includes("/items/expense_draft_logs") && init?.method === "POST");
    const patchBody = JSON.parse(String(expensePatch?.[1].body));
    const logBody = JSON.parse(String(logPost?.[1].body));

    expect(duplicateQuery).toContain("filter[id][_neq]=700");
    expect(patchBody).toMatchObject({
      transaction_date: "2026-07-16",
      particulars: 4001,
      amount: 125,
      payee: "Updated Payee",
      payee_id: 89,
      remarks: "Corrected receipt",
      attachment_url: "corrected-receipt",
      status: "Submitted",
      return_to: null,
      feedback: null,
      version: 3,
    });
    expect(patchBody).not.toHaveProperty("id");
    expect(patchBody).not.toHaveProperty("header_id");
    expect(patchBody).not.toHaveProperty("encoded_by");
    expect(patchBody).not.toHaveProperty("division_id");
    expect(patchBody).not.toHaveProperty("rejected_at");
    expect(patchBody).not.toHaveProperty("drafted_at");
    expect(patchBody).not.toHaveProperty("encoded_date");
    expect(patchBody).not.toHaveProperty("is_supervisor");
    expect(logBody.status).toBe("Submitted");
  });

  it("routes a corrected concern with non-null return_to back to Bulk Approval", async () => {
    mockDirectusResponses([
      { status: 200, data: { data: { id: 701, status: "With Concern", version: 4, particulars: 4000, division_id: 1, transaction_date: "2026-07-15", amount: 100, header_id: 100, return_to: "Bulk Approval" } } },
      { status: 200, data: { data: { id: 100, status: "Drafts", period_from: "2026-07-14", period_to: "2026-07-20", created_by: mockSalesmanId, division_id: 1 } } },
      { status: 200, data: { data: [] } },
      { status: 200, data: { data: { id: 100 } } },
      { status: 200, data: { data: [] } },
      { status: 200, data: { data: { id: 701 } } },
      { status: 200, data: { data: { id: 901 } } },
    ]);

    const req = new NextRequest("http://localhost/api/er/expense-report/salesman-wer?resource=expense&id=701", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 150, return_to: null }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);

    const calls = (global.fetch as unknown as Mock).mock.calls as [string, RequestInit][];
    const expensePatch = calls.find(([url, init]) => url.includes("/items/expense_draft/701") && init?.method === "PATCH");
    const logPost = calls.find(([url, init]) => url.includes("/items/expense_draft_logs") && init?.method === "POST");
    const patchBody = JSON.parse(String(expensePatch?.[1].body));
    const logBody = JSON.parse(String(logPost?.[1].body));

    expect(patchBody).toMatchObject({
      status: "Approved",
      return_to: "Bulk Approval",
      feedback: null,
      version: 5,
    });
    expect(logBody.status).toBe("Approved");
  });
});
