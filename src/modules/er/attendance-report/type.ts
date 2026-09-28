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
  has_pending_change_request: z.boolean().optional(),
  pending_change_request: z.any().optional(),
  is_on_leave: z.boolean().optional(),
  is_pending_leave: z.boolean().optional(),
  leave_details: z.any().optional(),
  is_undertime: z.boolean().optional(),
  undertime_details: z.any().optional(),
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

export interface AttendanceChangeRequestFile {
  id?: number;
  attendance_change_request_id?: number;
  directus_files_id?: string | { id: string; filename_download?: string };
}

export interface AttendanceChangeRequest {
  id: number;
  user_id: number;
  log_date: string;
  reason: string;
  status: string;
  time_in?: string;
  lunch_start?: string;
  lunch_end?: string;
  break_start?: string;
  break_end?: string;
  time_out?: string;
  attendance_change_request_files?: AttendanceChangeRequestFile[];
}

export interface LeaveRequest {
  leave_id: number;
  user_id: number;
  leave_type: string;
  leave_start: string;
  leave_end: string;
  status: string;
  is_paid?: number | boolean;
  [key: string]: unknown;
}

export interface UndertimeRequest {
  undertime_id: number;
  user_id: number;
  request_date: string;
  sched_timeout: string;
  actual_timeout: string;
  duration_minutes: number;
  reason: string;
  status: string;
  [key: string]: unknown;
}

export interface AttendanceReportData {
  user: User;
  attendanceLogs: AttendanceLog[];
  changeRequests?: AttendanceChangeRequest[];
  leaveRequests?: LeaveRequest[];
  undertimeRequests?: UndertimeRequest[];
}
