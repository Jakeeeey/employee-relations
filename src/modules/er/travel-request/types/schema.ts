import { z } from "zod";

export const TravelRequestBudgetSchema = z.object({
  id: z.number().optional(),
  travel_id: z.number().optional(),
  coa_id: z.number({ message: "Chart of Account is required" }),
  amount: z.number({ message: "Amount is required" }).min(0.01, { message: "Amount must be greater than zero" }),
  remarks: z.string().nullable().optional(),
});

export type TravelRequestBudget = z.infer<typeof TravelRequestBudgetSchema>;

export const TravelRequestSchema = z.object({
  travel_id: z.number().optional(),
  user_id: z.number(),
  department_id: z.number().nullable().optional(),
  division_id: z.number().nullable().optional(),
  request_date: z.string(), // YYYY-MM-DD
  travel_from: z.string(),  // YYYY-MM-DDTHH:mm:ss
  travel_to: z.string(),    // YYYY-MM-DDTHH:mm:ss
  destination: z.string().min(1, { message: "Destination is required" }),
  purpose: z.string().min(1, { message: "Purpose is required" }),
  requires_budget: z.boolean().default(false),
  attachment_uuid: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  status: z.enum(["pending", "approved", "rejected", "cancelled"]).default("pending"),
  current_approval_level: z.number().default(1),
  approver_id: z.number().nullable().optional(),
  approved_at: z.string().nullable().optional(),
  filed_at: z.string().optional(),
  total_budget: z.number().optional(),
  budget_items: z.array(TravelRequestBudgetSchema).optional(),
});

export type TravelRequest = z.infer<typeof TravelRequestSchema>;

// Form validation schema for creating/updating a travel request
export const TravelRequestFormInputSchema = z.object({
  travel_from: z.string().min(1, { message: "Start date is required" }),
  travel_to: z.string().min(1, { message: "End date is required" }),
  destination: z.string().min(1, { message: "Destination is required" }),
  purpose: z.string().min(1, { message: "Purpose is required" }),
  requires_budget: z.boolean(),
  attachment_uuid: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  budget_items: z.array(TravelRequestBudgetSchema).optional(),
}).refine((data) => {
  if (data.requires_budget && (!data.budget_items || data.budget_items.length === 0)) {
    return false;
  }
  return true;
}, {
  message: "At least one budget item is required when budget is needed",
  path: ["budget_items"],
}).refine((data) => {
  return new Date(data.travel_from) <= new Date(data.travel_to);
}, {
  message: "End date must be after or equal to start date",
  path: ["travel_to"],
});

export type TravelRequestFormInput = z.infer<typeof TravelRequestFormInputSchema>;
