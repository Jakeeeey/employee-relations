import { z } from "zod";

export const NotificationTypeSchema = z.enum(["Task Assignment", "Deadline Approaching", "System Alert", "Manager Feedback"]);
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export const NotificationSchema = z.object({
  id: z.union([z.string(), z.number()]),
  user_id: z.union([z.string(), z.number()]),
  type: NotificationTypeSchema,
  message: z.string().min(1, "Message is required"),
  is_read: z.boolean().default(false),
  related_task_id: z.union([z.string(), z.number()]).optional(),
  created_at: z.string().optional(),
});

export type AppNotification = z.infer<typeof NotificationSchema>;

export const CreateNotificationSchema = NotificationSchema.omit({
  id: true,
  created_at: true,
});
export type CreateNotification = z.infer<typeof CreateNotificationSchema>;
