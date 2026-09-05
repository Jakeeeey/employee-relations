import { z } from "zod";

export const CompanySchema = z.object({
  company_id: z.number(),
  company_name: z.string().nullable(),
  company_type: z.string().nullable(),
  company_code: z.string(),
  company_address: z.string().nullable(),
  company_brgy: z.string().nullable(),
  company_city: z.string().nullable(),
  company_province: z.string().nullable(),
  company_zipCode: z.string().nullable(),
  company_registrationNumber: z.string().nullable(),
  company_tin: z.string().nullable(),
  company_dateAdmitted: z.string().nullable(),
  company_contact: z.string().nullable(),
  company_email: z.string().nullable(),
  company_outlook: z.string().nullable(),
  company_gmail: z.string().nullable(),
  company_department: z.string().nullable(),
  company_logo: z.string().nullable(),
  company_facebook: z.string().nullable(),
  company_website: z.string().nullable(),
  company_tags: z.string().nullable(),
  company_subscription: z.number().nullable(),
  company_mission: z.string().nullable(),
  company_vision: z.string().nullable(),
});

export type Company = z.infer<typeof CompanySchema>;

export const CompanyHandbookAttachmentSchema = z.object({
  id: z.number(),
  company_handbook_id: z.number(),
  file_url: z.string(),
  file_name: z.string(),
  updated_at: z.string().nullable(),
});

export type CompanyHandbookAttachment = z.infer<typeof CompanyHandbookAttachmentSchema>;

export const CompanyHandbookSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  created_at: z.string().nullable(),
  created_by: z.number().nullable(),
  updated_at: z.string().nullable(),
  updated_by: z.number().nullable(),
  attachments: z.array(CompanyHandbookAttachmentSchema).optional(),
});

export type CompanyHandbook = z.infer<typeof CompanyHandbookSchema>;
