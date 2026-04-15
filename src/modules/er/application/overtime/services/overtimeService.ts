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

  private static async getDepartmentId(userId: number): Promise<number | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/items/user?filter[user_id][_eq]=${userId}&fields=user_department`, {
        method: "GET",
        headers: this.getHeaders(),
        cache: "no-store",
      });
      if (!res.ok) return null;
      const { data } = await res.json();
      if (!Array.isArray(data) || data.length === 0) return null;
      return data[0].user_department ? parseInt(String(data[0].user_department)) : null;
    } catch {
      return null;
    }
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
      department_id: item.department_id ? parseInt(String(item.department_id)) : null,
    })) as OvertimeRequest[];
  }

  static async create(data: CreateOvertimeInput): Promise<OvertimeRequest> {
    const deptId = await this.getDepartmentId(data.user_id);
    const payload = {
      ...data,
      department_id: deptId ?? data.department_id,
    };

    const res = await fetch(`${API_BASE_URL}/items/overtime_request`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
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
    const deptId = data.user_id ? await this.getDepartmentId(data.user_id) : null;
    const payload = {
      ...data,
      ...(deptId ? { department_id: deptId } : {}),
    };

    const res = await fetch(`${API_BASE_URL}/items/overtime_request/${id}`, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
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
