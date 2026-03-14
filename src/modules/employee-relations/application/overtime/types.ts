import { z } from "zod";

export const OvertimeStatusEnum = z.enum(["pending", "approved", "rejected", "cancelled"]);
export type OvertimeStatus = z.infer<typeof OvertimeStatusEnum>;

export const OvertimeRequestSchema = z.object({
  overtime_id: z.number().optional(),
  user_id: z.number(),
  department_id: z.number().nullable().optional(),
  log_id: z.number().nullable().optional(),
  request_date: z.string(), // ISO date (YYYY-MM-DD)
  sched_timeout: z.string(), // "HH:mm" or "HH:mm:ss"
  ot_from: z.string(), // "HH:mm" or "HH:mm:ss"
  ot_to: z.string(), // "HH:mm" or "HH:mm:ss"
  duration_minutes: z.number().default(0),
  purpose: z.string().min(1, "Purpose is required"),
  remarks: z.string().nullable().optional(),
  status: OvertimeStatusEnum.default("pending"),
  approver_id: z.number().nullable().optional(),
  approved_at: z.string().nullable().optional(),
  filed_at: z.string().optional(),
});

export type OvertimeRequest = z.infer<typeof OvertimeRequestSchema>;

export const CreateOvertimeSchema = OvertimeRequestSchema.omit({
  overtime_id: true,
  status: true,
  approver_id: true,
  approved_at: true,
  filed_at: true,
});

export type CreateOvertimeInput = z.infer<typeof CreateOvertimeSchema>;

export const UpdateOvertimeSchema = CreateOvertimeSchema.partial();
export type UpdateOvertimeInput = z.infer<typeof UpdateOvertimeSchema>;
