import { z } from "zod";

export const COE_STATUS_VALUES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "RELEASED",
  "CANCELLED",
] as const;

export const COEStatusEnum = z.enum(COE_STATUS_VALUES);
export type COEStatus = z.infer<typeof COEStatusEnum>;

export const COERequestSchema = z.object({
  id: z.number().optional(),
  employee_id: z.number(),
  purpose: z.string().min(1),
  status: z.string().default("PENDING"),
  request_date: z.string().nullable().optional(),
  approved_by: z.number().nullable().optional(),
  approval_date: z.string().nullable().optional(),
  ecopy_file_url: z.string().nullable().optional(),
  doc_title: z.string().nullable().optional(),
  hr_remarks: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export type COERequest = z.infer<typeof COERequestSchema>;

export const CreateCOESchema = z.object({
  employee_id: z.number(),
  purpose: z.string().min(1, "Purpose is required"),
  request_date: z.string().optional(),
});

export type CreateCOEInput = z.infer<typeof CreateCOESchema>;

export const UpdateCOESchema = COERequestSchema.omit({
  id: true,
  request_date: true,
  updated_at: true,
}).partial();

export type UpdateCOEInput = z.infer<typeof UpdateCOESchema>;
