import { z } from "zod";

export const LeaveTypeEnum = z.enum(["vacation", "sick", "emergency", "special", "unpaid", "others"]);
export type LeaveType = z.infer<typeof LeaveTypeEnum>;

export const LeaveStatusEnum = z.enum(["pending", "approved", "rejected", "cancelled"]);
export type LeaveStatus = z.infer<typeof LeaveStatusEnum>;

export const LeaveRequestSchema = z.object({
  leave_id: z.number().optional(),
  user_id: z.number(),
  department_id: z.number().nullable().optional(),
  leave_type: LeaveTypeEnum,
  leave_start: z.string().nullable(), // ISO date string
  leave_end: z.string().nullable(),   // ISO date string
  total_days: z.number().default(0),
  reason: z.string().min(1, "Reason is required"),
  remarks: z.string().nullable().optional(),
  status: LeaveStatusEnum.default("pending"),
  approver_id: z.number().nullable().optional(),
  approved_at: z.string().nullable().optional(),
  filed_at: z.string().optional(),
});

export type LeaveRequest = z.infer<typeof LeaveRequestSchema>;

export const CreateLeaveSchema = LeaveRequestSchema.omit({
  leave_id: true,
  status: true,
  approver_id: true,
  approved_at: true,
  filed_at: true,
}).extend({
  total_days: z.number().max(5, "Each leave request is limited to 5 days"),
});

export type CreateLeaveInput = z.infer<typeof CreateLeaveSchema>;

export const UpdateLeaveSchema = CreateLeaveSchema.partial();
export type UpdateLeaveInput = z.infer<typeof UpdateLeaveSchema>;
