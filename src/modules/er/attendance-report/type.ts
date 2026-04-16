import { z } from "zod";

export const AttendanceLogSchema = z.object({
  log_id: z.number(),
  user_id: z.number(),
  log_date: z.string(), // ISO date string
  time_in: z.string().nullable(), // ISO datetime string
  time_out: z.string().nullable(), // ISO datetime string
  lunch_start: z.string().nullable(), // ISO datetime string
  lunch_end: z.string().nullable(), // ISO datetime string
  break_start: z.string().nullable(), // ISO datetime string
  break_end: z.string().nullable(), // ISO datetime string
  status: z.string().nullable(), // e.g., "On Time"
  approval_status: z.string().nullable(), // e.g., "approved"
  department_id: z.number().nullable(),
  image_time_in: z.string().nullable(),
  image_time_out: z.string().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type AttendanceLog = z.infer<typeof AttendanceLogSchema>;

export const UserSchema = z.object({
  user_id: z.number(),
  user_fname: z.string(),
  user_mname: z.string().nullable(),
  user_lname: z.string(),
  user_email: z.string(),
  user_department: z.number().nullable(),
  user_position: z.string().nullable(),
  user_contact: z.string().nullable(),
  user_image: z.string().nullable(),
  user_dateOfHire: z.string().nullable(),
  role: z.string().nullable(),
  department_name: z.string().nullable().optional(),
});

export type User = z.infer<typeof UserSchema>;

export interface AttendanceReportData {
  user: User;
  attendanceLogs: AttendanceLog[];
}
