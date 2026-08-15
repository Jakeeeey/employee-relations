import { AppNotification, CreateNotification } from "../type";

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

export const notificationService = {
  fetchAll: async (userId: string | number): Promise<AppNotification[]> => {
    const res = await directusFetch(`/items/notifications?filter[user_id][_eq]=${userId}&sort=-created_at`);
    return res.data;
  },

  create: async (data: CreateNotification): Promise<AppNotification> => {
    const res = await directusFetch(`/items/notifications`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  markAsRead: async (id: string | number): Promise<AppNotification> => {
    const res = await directusFetch(`/items/notifications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_read: true }),
    });
    return res.data;
  },

  markAllAsRead: async (userId: string | number): Promise<void> => {
    // In Directus, to update multiple records, we must send an array of objects or use the query params.
    // Assuming a simple loop for now or a custom endpoint if supported. Let's do a fetch to get unread, then patch.
    const unread = await directusFetch(`/items/notifications?filter[user_id][_eq]=${userId}&filter[is_read][_eq]=false&fields=id`);
    if (unread.data && unread.data.length > 0) {
      const ids = unread.data.map((n: { id: string | number }) => n.id);
      await directusFetch(`/items/notifications`, {
        method: 'PATCH',
        body: JSON.stringify({
          keys: ids,
          data: { is_read: true }
        }),
      });
    }
  }
};
