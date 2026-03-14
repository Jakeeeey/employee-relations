import { CreateUndertimeInput, UndertimeRequest, UpdateUndertimeInput } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export class UndertimeService {
  private static getHeaders() {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (process.env.DIRECTUS_STATIC_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`;
    }

    return headers;
  }

  static async fetchAll(): Promise<UndertimeRequest[]> {
    const res = await fetch(`${API_BASE_URL}/items/undertime_request?sort=-filed_at&limit=-1`, {
      method: "GET",
      headers: this.getHeaders(),
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch undertime requests: ${res.statusText} (${res.status})`);
    }

    const payload = await res.json();
    const data = payload.data || payload || [];
    
    return (Array.isArray(data) ? data : []).map((item: Record<string, unknown>) => ({
      ...item,
      duration_minutes: item.duration_minutes ? parseInt(String(item.duration_minutes)) : 0,
    })) as UndertimeRequest[];
  }

  static async create(data: CreateUndertimeInput): Promise<UndertimeRequest> {
    const payload = {
      ...data,
      created_by: data.user_id, // automatically set the creator
    };

    const res = await fetch(`${API_BASE_URL}/items/undertime_request`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      throw new Error(`Failed to create undertime request: ${res.statusText} (${res.status}) - ${errorText}`);
    }

    const { data: createdData } = await res.json();
    return {
      ...createdData,
      duration_minutes: createdData.duration_minutes ? parseInt(createdData.duration_minutes) : 0,
    } as UndertimeRequest;
  }

  static async update(id: number, data: UpdateUndertimeInput, updatedByUserId?: number): Promise<UndertimeRequest> {
    const payload = {
      ...data,
      ...(updatedByUserId ? { updated_by: updatedByUserId } : {}),
    };

    const res = await fetch(`${API_BASE_URL}/items/undertime_request/${id}`, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      throw new Error(`Failed to update undertime request: ${res.statusText} (${res.status}) - ${errorText}`);
    }

    const { data: updatedData } = await res.json();
    return {
      ...updatedData,
      duration_minutes: updatedData.duration_minutes ? parseInt(updatedData.duration_minutes) : 0,
    } as UndertimeRequest;
  }
}
