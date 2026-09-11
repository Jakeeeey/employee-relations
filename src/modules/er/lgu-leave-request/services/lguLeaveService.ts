import { CreateLguLeaveInput, LguLeaveRequest } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "";

export class LguLeaveService {
  private static getHeaders() {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (process.env.DIRECTUS_STATIC_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`;
    }

    return headers;
  }

  private static async directusFetch(path: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      cache: "no-store",
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Directus error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  static async fetchAll(): Promise<LguLeaveRequest[]> {
    try {
      const res = await this.directusFetch(`/items/lgu_leave_request?sort=-date_of_filing&limit=-1`);
      const data = res.data || [];
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn("Failed to fetch LGU leave requests:", error);
      return [];
    }
  }

  static async fetchByUserId(userId: number): Promise<LguLeaveRequest[]> {
    try {
      const res = await this.directusFetch(
        `/items/lgu_leave_request?filter[user_id][_eq]=${userId}&sort=-date_of_filing&limit=-1`
      );
      const data = res.data || [];
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn(`Failed to fetch LGU leaves for user ${userId}:`, error);
      return [];
    }
  }

  static async fetchById(id: number): Promise<LguLeaveRequest | null> {
    try {
      const res = await this.directusFetch(`/items/lgu_leave_request/${id}`);
      return res.data || null;
    } catch (error) {
      console.warn(`Failed to fetch LGU leave ${id}:`, error);
      return null;
    }
  }

  static async create(payload: CreateLguLeaveInput): Promise<LguLeaveRequest> {
    const res = await this.directusFetch(`/items/lgu_leave_request`, {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        status: "pending",
      }),
    });
    return res.data;
  }

  static async update(id: number, payload: Partial<LguLeaveRequest>): Promise<LguLeaveRequest> {
    const res = await this.directusFetch(`/items/lgu_leave_request/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return res.data;
  }

  static async cancel(id: number): Promise<LguLeaveRequest> {
    return this.update(id, { status: "cancelled" });
  }
}
