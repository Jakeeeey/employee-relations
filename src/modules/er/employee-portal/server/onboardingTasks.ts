import { z } from "zod";

import { dFetch } from "./directus";

import {
  OnboardingTaskSchema,
  OnboardingTaskTemplateSchema,
  type OnboardingOwnerRole,
  type OnboardingTask,
  type OnboardingTaskStatus,
  type OnboardingTaskTemplate,
} from "../types/onboarding-task.schema";

// onboardingTasks.ts — minimal ER-local port of the employee-keyed task engine
// IO the hiree portal needs: task + template reads, a single task patch, and
// the idempotent complete. Materialize / backfill / seed are NOT ported — the
// portal only reads tasks/templates and closes the submitted task.
//
// Every response is parsed back with the record schemas, so a Directus error
// body or a contract drift fails LOUDLY with a coded error instead of silently
// passing raw rows.

export const ONBOARDING_TASK_ERROR_CODES = {
  invalidInput: "ONBOARDING_TASK_INVALID_INPUT",
  userNotFound: "ONBOARDING_TASK_USER_NOT_FOUND",
  userReadFailed: "ONBOARDING_TASK_USER_READ_FAILED",
  templateReadFailed: "ONBOARDING_TASK_TEMPLATE_READ_FAILED",
  templateWriteFailed: "ONBOARDING_TASK_TEMPLATE_WRITE_FAILED",
  taskReadFailed: "ONBOARDING_TASK_READ_FAILED",
  taskNotFound: "ONBOARDING_TASK_NOT_FOUND",
  taskWriteFailed: "ONBOARDING_TASK_WRITE_FAILED",
} as const;

/** PH wall-time, MySQL-compatible `YYYY-MM-DD HH:mm:ss` (conventions §6). */
export function phTimeNow(): string {
  return new Date().toLocaleString("sv-SE", { timeZone: "Asia/Manila" });
}

function fail(code: string, detail: string): never {
  throw new Error(`${code}: ${detail}`);
}

function parseRowList<T>(
  schema: z.ZodType<T>,
  body: unknown,
  code: string,
  label: string
): T[] {
  const envelope = z.object({ data: z.array(z.unknown()) }).safeParse(body);
  if (!envelope.success) {
    fail(
      code,
      `${label} read failed (${JSON.stringify(body).slice(0, 300)})`
    );
  }
  const rows: T[] = [];
  for (const raw of envelope.data.data) {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      fail(
        code,
        `${label} row contract mismatch (${JSON.stringify(parsed.error.flatten())})`
      );
    }
    rows.push(parsed.data);
  }
  return rows;
}

function parseSingle<T>(
  schema: z.ZodType<T>,
  body: unknown,
  code: string,
  label: string
): T {
  const parsed = z.object({ data: schema }).safeParse(body);
  if (!parsed.success) {
    fail(
      code,
      `${label} write/read failed (${JSON.stringify(body).slice(0, 300)})`
    );
  }
  return parsed.data.data;
}

/** Directus answers FORBIDDEN for an item id the static token cannot see. */
function isAbsentItemError(body: unknown): boolean {
  const errors = (
    body as { errors?: Array<{ extensions?: { code?: string } }> } | null
  )?.errors;
  return Array.isArray(errors) && errors[0]?.extensions?.code === "FORBIDDEN";
}

// ---------------------------------------------------------------------------
// onboarding_task_template — catalog IO
// ---------------------------------------------------------------------------

export interface TemplateListOptions {
  /** When true, only `is_active=1` rows (the set new hires materialize from). */
  activeOnly?: boolean;
}

/** All templates, phase/sort order; `activeOnly` filters `is_active=1`. */
export async function listTemplateRows(
  options: TemplateListOptions = {}
): Promise<OnboardingTaskTemplate[]> {
  const query = ["sort=sort_order,id", "limit=-1"];
  if (options.activeOnly === true) {
    query.push("filter[is_active][_eq]=1");
  }
  const body: unknown = await dFetch(
    `/items/onboarding_task_template?${query.join("&")}`
  );
  return parseRowList(
    OnboardingTaskTemplateSchema,
    body,
    ONBOARDING_TASK_ERROR_CODES.templateReadFailed,
    "onboarding_task_template"
  );
}

// ---------------------------------------------------------------------------
// onboarding_task — per-employee task IO
// ---------------------------------------------------------------------------

export interface TaskListFilter {
  userId?: number;
  status?: OnboardingTaskStatus;
  ownerRole?: OnboardingOwnerRole;
}

export async function listTaskRows(
  filter: TaskListFilter
): Promise<OnboardingTask[]> {
  const query: string[] = [];
  if (filter.userId !== undefined) {
    query.push(`filter[user_id][_eq]=${filter.userId}`);
  }
  if (filter.status !== undefined) {
    query.push(`filter[status][_eq]=${filter.status}`);
  }
  if (filter.ownerRole !== undefined) {
    query.push(`filter[owner_role][_eq]=${filter.ownerRole}`);
  }
  query.push("sort=id", "limit=500");
  const body: unknown = await dFetch(`/items/onboarding_task?${query.join("&")}`);
  return parseRowList(
    OnboardingTaskSchema,
    body,
    ONBOARDING_TASK_ERROR_CODES.taskReadFailed,
    "onboarding_task"
  );
}

/** @returns The task row, or null when the id does not exist. */
export async function readTaskRow(
  id: number
): Promise<OnboardingTask | null> {
  const body: unknown = await dFetch(`/items/onboarding_task/${id}`);
  const parsed = z.object({ data: OnboardingTaskSchema }).safeParse(body);
  if (parsed.success) return parsed.data.data;
  if (isAbsentItemError(body)) return null;
  fail(
    ONBOARDING_TASK_ERROR_CODES.taskReadFailed,
    `onboarding_task/${id} read failed (${JSON.stringify(body).slice(0, 300)})`
  );
}

/**
 * @param taskId - `onboarding_task.id`.
 * @returns The task row.
 * @throws Error with `ONBOARDING_TASK_ERROR_CODES.taskNotFound` when absent.
 */
export async function getOnboardingTask(
  taskId: number
): Promise<OnboardingTask> {
  const task = await readTaskRow(taskId);
  if (!task) {
    throw new Error(
      `${ONBOARDING_TASK_ERROR_CODES.taskNotFound}: onboarding_task ${taskId} does not exist`
    );
  }
  return task;
}

export async function patchTaskRow(
  id: number,
  patch: Record<string, unknown>
): Promise<OnboardingTask> {
  const body: unknown = await dFetch(`/items/onboarding_task/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return parseSingle(
    OnboardingTaskSchema,
    body,
    ONBOARDING_TASK_ERROR_CODES.taskWriteFailed,
    `onboarding_task/${id} update`
  );
}

export interface OnboardingTaskUpdate {
  status?: OnboardingTaskStatus;
  notes?: string | null;
  due_date?: string | null;
  owner_user_id?: number | null;
}

export interface UpdateOnboardingTaskInput {
  taskId: number;
  patch: OnboardingTaskUpdate;
  actorId?: number | null;
}

/**
 * Applies a partial update (`status` / `notes` / `due_date` /
 * `owner_user_id`). Moving a task to `done` stamps `completed_at` /
 * `completed_by` when they were empty; moving it back out of `done` clears
 * them — the completion audit never disagrees with the status.
 * @throws Error with `ONBOARDING_TASK_ERROR_CODES.taskNotFound` when absent.
 */
export async function updateOnboardingTask(
  input: UpdateOnboardingTaskInput
): Promise<OnboardingTask> {
  const actorId = input.actorId ?? null;
  const current = await getOnboardingTask(input.taskId);
  const now = phTimeNow();
  const patch: Record<string, unknown> = {
    updated_at: now,
    updated_by: actorId,
  };

  if (input.patch.status !== undefined) {
    patch.status = input.patch.status;
    if (input.patch.status === "done" && current.completed_at === null) {
      patch.completed_at = now;
      patch.completed_by = actorId;
    }
    if (input.patch.status !== "done" && current.completed_at !== null) {
      patch.completed_at = null;
      patch.completed_by = null;
    }
  }
  if (input.patch.notes !== undefined) patch.notes = input.patch.notes;
  if (input.patch.due_date !== undefined) patch.due_date = input.patch.due_date;
  if (input.patch.owner_user_id !== undefined) {
    patch.owner_user_id = input.patch.owner_user_id;
  }

  return patchTaskRow(input.taskId, patch);
}

export interface CompleteOnboardingTaskInput {
  taskId: number;
  completedBy: number | null;
}

export interface CompleteOnboardingTaskResult {
  task: OnboardingTask;
  /** True when the task was already `done` (idempotent re-complete). */
  alreadyDone: boolean;
}

/**
 * Marks one task `done` with the completion audit. Re-completing is an
 * idempotent no-op that returns the unchanged row.
 * @throws Error with `ONBOARDING_TASK_ERROR_CODES.taskNotFound` when absent.
 */
export async function completeOnboardingTask(
  input: CompleteOnboardingTaskInput
): Promise<CompleteOnboardingTaskResult> {
  const current = await getOnboardingTask(input.taskId);
  if (current.status === "done") {
    return { task: current, alreadyDone: true };
  }
  const now = phTimeNow();
  const task = await patchTaskRow(input.taskId, {
    status: "done",
    completed_by: input.completedBy,
    completed_at: now,
    updated_at: now,
    updated_by: input.completedBy,
  });
  return { task, alreadyDone: false };
}

export interface OnboardingTaskQuery {
  userId?: number;
  status?: OnboardingTaskStatus;
  ownerRole?: OnboardingOwnerRole;
}

export function listOnboardingTasks(
  query: OnboardingTaskQuery
): Promise<OnboardingTask[]> {
  return listTaskRows(query);
}

/** The seeded catalog, phase/sort order (read-only; no writes). */
export function listOnboardingTaskTemplates(): Promise<
  OnboardingTaskTemplate[]
> {
  return listTemplateRows();
}
