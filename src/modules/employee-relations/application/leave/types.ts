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

const BaseCreateLeaveSchema = LeaveRequestSchema.omit({
  leave_id: true,
  status: true,
  approver_id: true,
  approved_at: true,
  filed_at: true,
}).extend({
  total_days: z.number().max(5, "Each leave request is limited to 5 days"),
});

const sundayValidation = (dateStr: string | null | undefined) => {
  if (!dateStr) return true;
  const date = new Date(dateStr);
  return date.getDay() !== 0; // 0 is Sunday
};

export const CreateLeaveSchema = BaseCreateLeaveSchema.refine(
  (data) => sundayValidation(data.leave_start),
  {
    message: "Start date cannot be a Sunday",
    path: ["leave_start"],
  }
).refine(
  (data) => sundayValidation(data.leave_end),
  {
    message: "End date cannot be a Sunday",
    path: ["leave_end"],
  }
);

export type CreateLeaveInput = z.infer<typeof CreateLeaveSchema>;

export const UpdateLeaveSchema = BaseCreateLeaveSchema.partial().refine(
  (data) => sundayValidation(data.leave_start),
  {
    message: "Start date cannot be a Sunday",
    path: ["leave_start"],
  }
).refine(
  (data) => sundayValidation(data.leave_end),
  {
    message: "End date cannot be a Sunday",
    path: ["leave_end"],
  }
);

export type UpdateLeaveInput = z.infer<typeof UpdateLeaveSchema>;
