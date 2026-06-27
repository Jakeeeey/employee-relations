import { CreateConcernInput, Concern, UpdateConcernInput, ConcernAttachment } from "../type";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export class ConcernService {
  private static getHeaders() {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (process.env.DIRECTUS_STATIC_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`;
    }

    return headers;
  }

  static async fetchAll(userId?: number): Promise<Concern[]> {
    const params = new URLSearchParams();
    params.set("sort", "-created_at");
    params.set("limit", "-1");

    if (userId !== undefined && userId !== null) {
      params.set("filter[user_id][_eq]", String(userId));
    }

    const res = await fetch(
      `${API_BASE_URL}/items/employee_concerns?${params.toString()}`,
      {
        method: "GET",
        headers: this.getHeaders(),
        cache: "no-store",
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch concerns: ${res.statusText} (${res.status})`);
    }

    const payload = await res.json();
    const data = payload.data || payload || [];
    return (Array.isArray(data) ? data : []) as Concern[];
  }

  static async create(data: CreateConcernInput): Promise<Concern> {
    const payload = {
      user_id: data.user_id,
      subject_of_concern: data.subject_of_concern,
      concern: data.concern,
      is_anonymous: data.is_anonymous,
      status: "PENDING",
    };

    const res = await fetch(`${API_BASE_URL}/items/employee_concerns`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      throw new Error(`Failed to create concern: ${res.statusText} (${res.status}) - ${errorText}`);
    }

    const { data: createdData } = await res.json();
    return createdData as Concern;
  }

  static async update(id: number, data: UpdateConcernInput): Promise<Concern> {
    const res = await fetch(`${API_BASE_URL}/items/employee_concerns/${id}`, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      throw new Error(`Failed to update concern: ${res.statusText} (${res.status}) - ${errorText}`);
    }

    const { data: updatedData } = await res.json();
    return updatedData as Concern;
  }

  static async fetchAttachments(concernId: number): Promise<ConcernAttachment[]> {
    const params = new URLSearchParams();
    params.set("filter[concern_id][_eq]", String(concernId));
    params.set("sort", "created_at");

    const res = await fetch(
      `${API_BASE_URL}/items/employee_concern_attachments?${params.toString()}`,
      {
        method: "GET",
        headers: this.getHeaders(),
        cache: "no-store",
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch attachments: ${res.statusText} (${res.status})`);
    }

    const payload = await res.json();
    const data = payload.data || payload || [];
    return (Array.isArray(data) ? data : []) as ConcernAttachment[];
  }
}
