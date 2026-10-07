import { z } from "zod";

export const LguLeaveTypeEnum = z.enum([
  "vacation",
  "mandatory_forced",
  "sick",
  "maternity",
  "paternity",
  "special_privilege",
  "solo_parent",
  "study",
  "vawc",
  "rehabilitation",
  "special_women",
  "special_emergency",
  "adoption",
  "others",
]);
export type LguLeaveType = z.infer<typeof LguLeaveTypeEnum>;

export interface LguLeaveTypeMeta {
  code: LguLeaveType;
  title: string;
  legalBasis: string;
  category: "regular" | "parental" | "special" | "medical";
}

export const LGU_LEAVE_TYPES_META: Record<LguLeaveType, LguLeaveTypeMeta> = {
  vacation: {
    code: "vacation",
    title: "Vacation Leave",
    legalBasis: "Sec. 51, Rule XVI, Omnibus Rules Implementing E.O. No. 292",
    category: "regular",
  },
  mandatory_forced: {
    code: "mandatory_forced",
    title: "Mandatory/Forced Leave",
    legalBasis: "Sec. 25, Rule XVI, Omnibus Rules Implementing E.O. No. 292",
    category: "regular",
  },
  sick: {
    code: "sick",
    title: "Sick Leave",
    legalBasis: "Sec. 43, Rule XVI, Omnibus Rules Implementing E.O. No. 292",
    category: "medical",
  },
  maternity: {
    code: "maternity",
    title: "Maternity Leave",
    legalBasis: "R.A. No. 11210 / IRR issued by CSC, DOLE and SSS",
    category: "parental",
  },
  paternity: {
    code: "paternity",
    title: "Paternity Leave",
    legalBasis: "R.A. No. 8187 / CSC MC No. 71, s. 1998, as amended",
    category: "parental",
  },
  special_privilege: {
    code: "special_privilege",
    title: "Special Privilege Leave",
    legalBasis: "Sec. 21, Rule XVI, Omnibus Rules Implementing E.O. No. 292",
    category: "special",
  },
  solo_parent: {
    code: "solo_parent",
    title: "Solo Parent Leave",
    legalBasis: "RA No. 8972 / CSC MC No. 8, s. 2004",
    category: "parental",
  },
  study: {
    code: "study",
    title: "Study Leave",
    legalBasis: "Sec. 68, Rule XVI, Omnibus Rules Implementing E.O. No. 292",
    category: "special",
  },
  vawc: {
    code: "vawc",
    title: "10-Day VAWC Leave",
    legalBasis: "RA No. 9262 / CSC MC No. 15, s. 2005",
    category: "special",
  },
  rehabilitation: {
    code: "rehabilitation",
    title: "Rehabilitation Privilege",
    legalBasis: "Sec. 55, Rule XVI, Omnibus Rules Implementing E.O. No. 292",
    category: "medical",
  },
  special_women: {
    code: "special_women",
    title: "Special Leave Benefits for Women",
    legalBasis: "RA No. 9710 / CSC MC No. 25, s. 2010",
    category: "special",
  },
  special_emergency: {
    code: "special_emergency",
    title: "Special Emergency (Calamity) Leave",
    legalBasis: "CSC MC No. 2, s. 2012, as amended",
    category: "special",
  },
  adoption: {
    code: "adoption",
    title: "Adoption Leave",
    legalBasis: "R.A. No. 8552",
    category: "parental",
  },
  others: {
    code: "others",
    title: "Others",
    legalBasis: "Specify other leave benefits",
    category: "special",
  },
};

export const LguLeaveStatusEnum = z.enum([
  "pending",
  "recommended",
  "approved",
  "disapproved",
  "cancelled",
]);
export type LguLeaveStatus = z.infer<typeof LguLeaveStatusEnum>;

export const LguLeaveRequestSchema = z.object({
  id: z.number().optional(),
  user_id: z.number(),
  department_id: z.number().nullable().optional(),

  // 1-5. Office & Personal Details
  office_department: z.string().nullable().optional(),
  last_name: z.string().min(1, "Last name is required"),
  first_name: z.string().min(1, "First name is required"),
  middle_name: z.string().nullable().optional(),
  date_of_filing: z.string(), // YYYY-MM-DD
  position: z.string().nullable().optional(),
  monthly_salary: z.number().nullable().optional(),

  // 6.A Type of Leave to be Availed of
  leave_type: LguLeaveTypeEnum,
  leave_type_others: z.string().nullable().optional(),

  // 6.B Details of Leave
  vacation_location: z.enum(["within_philippines", "abroad"]).nullable().optional(),
  vacation_location_abroad: z.string().nullable().optional(),
  sick_location: z.enum(["in_hospital", "out_patient"]).nullable().optional(),
  sick_illness_specify: z.string().nullable().optional(),
  women_illness_specify: z.string().nullable().optional(),
  study_purpose: z.enum(["masters_degree", "bar_board_review", "other"]).nullable().optional(),
  study_purpose_other: z.string().nullable().optional(),
  other_purpose: z.enum(["monetization", "terminal_leave"]).nullable().optional(),

  // 6.C Number of Working Days & Dates
  working_days_applied: z.number().min(0.5, "Minimum 0.5 day"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  inclusive_dates_text: z.string().nullable().optional(),

  // 6.D Commutation
  commutation_requested: z.boolean().default(false),
  applicant_signature_url: z.string().nullable().optional(),

  // Status & Lifecycle
  status: LguLeaveStatusEnum.default("pending"),

  // 7.A Certification of Leave Credits (HR Section)
  credits_as_of: z.string().nullable().optional(),
  vl_total_earned: z.number().nullable().optional(),
  vl_less_applied: z.number().nullable().optional(),
  vl_balance: z.number().nullable().optional(),
  sl_total_earned: z.number().nullable().optional(),
  sl_less_applied: z.number().nullable().optional(),
  sl_balance: z.number().nullable().optional(),
  certified_by_id: z.number().nullable().optional(),
  certified_by_name: z.string().nullable().optional(),

  // 7.B Recommendation
  recommendation: z.enum(["for_approval", "for_disapproval"]).nullable().optional(),
  recommendation_reason: z.string().nullable().optional(),
  recommended_by_id: z.number().nullable().optional(),
  recommended_by_name: z.string().nullable().optional(),

  // 7.C & 7.D Approval / Disapproval Final Action
  approved_days_with_pay: z.number().nullable().optional(),
  approved_days_without_pay: z.number().nullable().optional(),
  approved_others_specify: z.string().nullable().optional(),
  disapproved_reason: z.string().nullable().optional(),
  action_officer_id: z.number().nullable().optional(),
  action_officer_name: z.string().nullable().optional(),
  action_date: z.string().nullable().optional(),

  // Timestamps
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type LguLeaveRequest = z.infer<typeof LguLeaveRequestSchema>;

export const CreateLguLeaveSchema = LguLeaveRequestSchema.omit({
  id: true,
  status: true,
  created_at: true,
  updated_at: true,
  credits_as_of: true,
  vl_total_earned: true,
  vl_less_applied: true,
  vl_balance: true,
  sl_total_earned: true,
  sl_less_applied: true,
  sl_balance: true,
  certified_by_id: true,
  certified_by_name: true,
  recommendation: true,
  recommendation_reason: true,
  recommended_by_id: true,
  recommended_by_name: true,
  approved_days_with_pay: true,
  approved_days_without_pay: true,
  approved_others_specify: true,
  disapproved_reason: true,
  action_officer_id: true,
  action_officer_name: true,
  action_date: true,
}).refine(
  (data) => {
    if (data.leave_type === "others" && !data.leave_type_others?.trim()) {
      return false;
    }
    return true;
  },
  {
    message: "Please specify the other leave type",
    path: ["leave_type_others"],
  }
).refine(
  (data) => {
    if (
      (data.leave_type === "vacation" || data.leave_type === "special_privilege") &&
      data.vacation_location === "abroad" &&
      !data.vacation_location_abroad?.trim()
    ) {
      return false;
    }
    return true;
  },
  {
    message: "Please specify destination abroad",
    path: ["vacation_location_abroad"],
  }
).refine(
  (data) => {
    if (data.leave_type === "sick" && !data.sick_illness_specify?.trim()) {
      return false;
    }
    return true;
  },
  {
    message: "Please specify illness",
    path: ["sick_illness_specify"],
  }
).refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return new Date(data.start_date) <= new Date(data.end_date);
    }
    return true;
  },
  {
    message: "End date must be on or after start date",
    path: ["end_date"],
  }
);

export type CreateLguLeaveInput = z.infer<typeof CreateLguLeaveSchema>;
