import { CreateOvertimeInput, OvertimeRequest, UpdateOvertimeInput } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export class OvertimeService {
  private static getHeaders() {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (process.env.DIRECTUS_STATIC_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`;
    }

    return headers;
  }

  static async fetchAll(): Promise<OvertimeRequest[]> {
    const res = await fetch(`${API_BASE_URL}/items/overtime_request?sort=-filed_at&limit=-1`, {
      method: "GET",
      headers: this.getHeaders(),
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch overtime requests: ${res.statusText} (${res.status})`);
    }

    const payload = await res.json();
    const data = payload.data || payload || [];
    
    return (Array.isArray(data) ? data : []).map((item: Record<string, unknown>) => ({
      ...item,
      duration_minutes: item.duration_minutes ? parseInt(String(item.duration_minutes)) : 0,
    })) as OvertimeRequest[];
  }

  static async create(data: CreateOvertimeInput): Promise<OvertimeRequest> {
    const res = await fetch(`${API_BASE_URL}/items/overtime_request`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      throw new Error(`Failed to create overtime request: ${res.statusText} (${res.status}) - ${errorText}`);
    }

    const { data: createdData } = await res.json();
    return {
      ...createdData,
      duration_minutes: createdData.duration_minutes ? parseInt(String(createdData.duration_minutes)) : 0,
    } as OvertimeRequest;
  }

  static async update(id: number, data: UpdateOvertimeInput): Promise<OvertimeRequest> {
    const res = await fetch(`${API_BASE_URL}/items/overtime_request/${id}`, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      throw new Error(`Failed to update overtime request: ${res.statusText} (${res.status}) - ${errorText}`);
    }

    const { data: updatedData } = await res.json();
    return {
      ...updatedData,
      duration_minutes: updatedData.duration_minutes ? parseInt(String(updatedData.duration_minutes)) : 0,
    } as OvertimeRequest;
  }
}
