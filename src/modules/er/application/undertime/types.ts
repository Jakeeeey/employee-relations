import { z } from "zod";

export const UndertimeStatusEnum = z.enum(["pending", "approved", "rejected", "cancelled"]);
export type UndertimeStatus = z.infer<typeof UndertimeStatusEnum>;

export const UndertimeRequestSchema = z.object({
  undertime_id: z.number().optional(),
  user_id: z.number(),
  department_id: z.number().nullable().optional(),
  log_id: z.number().nullable().optional(),
  request_date: z.string(), // ISO date (YYYY-MM-DD)
  sched_timeout: z.string(), // "HH:mm" or "HH:mm:ss"
  actual_timeout: z.string(), // "HH:mm" or "HH:mm:ss"
  duration_minutes: z.number(),
  reason: z.string().min(1, "Reason is required"),
  remarks: z.string().nullable().optional(),
  status: UndertimeStatusEnum.default("pending"),
  approver_id: z.number().nullable().optional(),
  approved_at: z.string().nullable().optional(),
  filed_at: z.string().optional(),
  created_by: z.number().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  updated_by: z.number().nullable().optional(),
});

export type UndertimeRequest = z.infer<typeof UndertimeRequestSchema>;

export const CreateUndertimeSchema = UndertimeRequestSchema.omit({
  undertime_id: true,
  status: true,
  approver_id: true,
  approved_at: true,
  filed_at: true,
  updated_at: true,
  updated_by: true,
});

export type CreateUndertimeInput = z.infer<typeof CreateUndertimeSchema>;

export const UpdateUndertimeSchema = CreateUndertimeSchema.partial();
export type UpdateUndertimeInput = z.infer<typeof UpdateUndertimeSchema>;
