import { z } from "zod";

export const TaskStatusSchema = z.enum(["Pending", "In Progress", "Complete"]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const TaskPrioritySchema = z.enum(["Low", "Medium", "High", "Urgent"]);
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;

export const TaskSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: TaskStatusSchema,
  priority: TaskPrioritySchema,
  user_id: z.union([z.string(), z.number()]),
  deadline: z.string().optional(), // ISO date string
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  attachments: z.array(z.any()).optional(), // Placeholder for file references
});

export type Task = z.infer<typeof TaskSchema>;

export const CreateTaskSchema = TaskSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});
export type CreateTask = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = CreateTaskSchema.partial();
export type UpdateTask = z.infer<typeof UpdateTaskSchema>;

// Scheduling & Recurrence Engine Types
export const RecurringRuleSchema = z.object({
  id: z.union([z.string(), z.number()]),
  task_template: CreateTaskSchema, // Template to use when spawning tasks
  cron_expression: z.string().min(1, "Cron expression is required"),
  user_id: z.union([z.string(), z.number()]),
  status: z.enum(["Active", "Paused"]),
  last_run: z.string().optional(),
  next_run: z.string().optional(),
});

export type RecurringRule = z.infer<typeof RecurringRuleSchema>;

export const CreateRecurringRuleSchema = RecurringRuleSchema.omit({ id: true, last_run: true, next_run: true });
export type CreateRecurringRule = z.infer<typeof CreateRecurringRuleSchema>;
