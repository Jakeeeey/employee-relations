import { z } from "zod";

export const ExpenseDraftSchema = z.object({
  id: z.number(),
  header_id: z.number(),
  encoded_by: z.number(), // salesman employee_id
  particulars: z.number(), // GL account (coa_id)
  division_id: z.number(),
  payee_id: z.number().nullable().optional(),
  transaction_date: z.string(), // YYYY-MM-DD
  amount: z.number(),
  payee: z.string().nullable().optional(),
  attachment_url: z.string().nullable().optional(),
  status: z.enum(["Drafts", "Submitted", "Approved", "Rejected", "With Concern"]),
  remarks: z.string().nullable().optional(),
  version: z.number(),
  feedback: z.string().nullable().optional(),
  return_to: z.string().nullable().optional(),
  approved_at: z.string().nullable().optional(),
  rejected_at: z.string().nullable().optional(),
  is_supervisor: z.number().optional().nullable(),
  particulars_name: z.string().optional(), // enriched field
});

export type ExpenseDraft = z.infer<typeof ExpenseDraftSchema>;

export const ExpenseDraftHeaderSchema = z.object({
  id: z.number(),
  division_id: z.number(),
  payee_id: z.union([z.number(), z.object({ id: z.number(), supplier_name: z.string() })]).nullable().optional(),
  period_from: z.string(), // YYYY-MM-DD
  period_to: z.string(), // YYYY-MM-DD
  created_by: z.number(), // salesman user_id
  created_at: z.string().optional(),
  remarks: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  lines_count: z.number().optional(),
  has_concern: z.boolean().optional(),
  voucher_status: z.string().nullable().optional(),
  has_wer_file: z.boolean().optional(),
});

export type ExpenseDraftHeader = z.infer<typeof ExpenseDraftHeaderSchema>;

export const SupplierSchema = z.object({
  id: z.number(),
  supplier_name: z.string(),
  supplier_shortcut: z.string().nullable().optional(),
  supplier_type: z.string().nullable().optional(),
});

export type Supplier = z.infer<typeof SupplierSchema>;

export const CoaSchema = z.object({
  coa_id: z.number(),
  account_title: z.string(),
  gl_code: z.string().optional(),
});

export type COA = z.infer<typeof CoaSchema>;

export const DisbursementDraftSchema = z.object({
  id: z.number(),
  doc_no: z.string(),
  transaction_type: z.number().nullable(),
  payee: z.number().nullable(),
  remarks: z.string().nullable(),
  total_amount: z.number(),
  encoder_id: z.number(),
  approver_id: z.number().nullable(),
  status: z.string(),
  supporting_documents_url: z.string().nullable(),
  date_created: z.string(),
  date_updated: z.string(),
  is_supervisor: z.number().optional().nullable(),
});

export type DisbursementDraft = z.infer<typeof DisbursementDraftSchema>;

// Form validation schema for creating/updating a line item
export const ExpenseFormInputSchema = z.object({
  particulars: z.number({ message: "GL Account (Particulars) is required" }),
  transaction_date: z.string().min(1, { message: "Transaction date is required" }),
  amount: z.number({ message: "Amount is required" }).positive({ message: "Amount must be greater than zero" }),
  payee: z.string().min(1, { message: "Merchant name (Payee) is required" }),
  attachment_url: z.string().nullable().optional(),
  remarks: z.string({ message: "Remarks are required" }).min(1, { message: "Remarks are required" }),
});

export type ExpenseFormInput = z.infer<typeof ExpenseFormInputSchema>;

export const ExpenseAttachmentSchema = z.object({
  id: z.number(),
  header_id: z.number(),
  file_name: z.string(),
  file_url: z.string(),
  file_type: z.string().nullable().optional(),
  file_size: z.number().nullable().optional(),
  uploaded_by: z.number(),
  uploaded_at: z.string(),
});

export type ExpenseAttachment = z.infer<typeof ExpenseAttachmentSchema>;
