import { z } from "zod";

export const CONCERN_STATUS_VALUES = [
  "PENDING",
  "IN_REVIEW",
  "RESOLVED",
  "DISMISSED",
] as const;

export const ConcernStatusEnum = z.enum(CONCERN_STATUS_VALUES);
export type ConcernStatus = z.infer<typeof ConcernStatusEnum>;

export const ConcernSchema = z.object({
  id: z.number().optional(),
  user_id: z.number(),
  subject_of_concern: z.string().min(1),
  concern: z.string().min(1),
  is_anonymous: z.boolean().default(false),
  status: z.string().default("PENDING"),
  created_at: z.string().nullable().optional(),
  created_by: z.number().nullable().optional(),
});

export type Concern = z.infer<typeof ConcernSchema>;

export const CreateConcernSchema = z.object({
  user_id: z.number(),
  subject_of_concern: z.string().min(1, "Subject is required"),
  concern: z.string().min(1, "Concern description is required"),
  is_anonymous: z.boolean().default(false),
});

export type CreateConcernInput = z.infer<typeof CreateConcernSchema>;

export const UpdateConcernSchema = ConcernSchema.omit({
  id: true,
  created_at: true,
}).partial();

export type UpdateConcernInput = z.infer<typeof UpdateConcernSchema>;

export const ConcernAttachmentSchema = z.object({
  id: z.number().optional(),
  concern_id: z.number(),
  file_path: z.string(),
  file_name: z.string(),
  file_type: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  created_by: z.number().nullable().optional(),
});

export type ConcernAttachment = z.infer<typeof ConcernAttachmentSchema>;

export interface UploadedFileResult {
  file_id: string;
  file_url: string;
  filename_download: string;
  filesize?: number;
  type?: string;
}
