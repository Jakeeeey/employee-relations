import { Task, CreateTask, UpdateTask, RecurringRule, CreateRecurringRule } from "../type";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

function getHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (process.env.DIRECTUS_STATIC_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`;
  }

  return headers;
}

async function directusFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: 'no-store',
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Directus API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export const taskService = {
  fetchAll: async (userId: string | number): Promise<Task[]> => {
    const res = await directusFetch(`/items/tasks?filter[user_id][_eq]=${userId}&sort=-created_at`);
    return res.data;
  },

  fetchById: async (id: string | number): Promise<Task> => {
    const res = await directusFetch(`/items/tasks/${id}`);
    return res.data;
  },

  create: async (data: CreateTask): Promise<Task> => {
    const res = await directusFetch(`/items/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  update: async (id: string | number, data: UpdateTask): Promise<Task> => {
    const res = await directusFetch(`/items/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  delete: async (id: string | number): Promise<void> => {
    await directusFetch(`/items/tasks/${id}`, {
      method: 'DELETE',
    });
  },
};

export const schedulingService = {
  fetchAllRules: async (): Promise<RecurringRule[]> => {
    // Used by cron job to evaluate all active rules
    const res = await directusFetch(`/items/recurring_rules?filter[status][_eq]=Active`);
    return res.data;
  },

  createRule: async (data: CreateRecurringRule): Promise<RecurringRule> => {
    const res = await directusFetch(`/items/recurring_rules`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  updateRule: async (id: string | number, data: Partial<RecurringRule>): Promise<RecurringRule> => {
    const res = await directusFetch(`/items/recurring_rules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.data;
  }
};
