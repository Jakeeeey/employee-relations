import { CreateLeaveInput, LeaveRequest, UpdateLeaveInput } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export class LeaveService {
  private static getHeaders() {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Directus uses its own tokens. We must use the static token generated for it, 
    // not the vos_access_token which is a Spring Boot JWT.
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

  static async fetchAll(): Promise<LeaveRequest[]> {
    const res = await fetch(`${API_BASE_URL}/items/leave_request?sort=-filed_at&limit=-1`, {
      method: "GET",
      headers: this.getHeaders(),
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch leaves: ${res.statusText} (${res.status})`);
    }

    const payload = await res.json();
    const data = payload.data || payload || [];
    
    // Handle decimals if they come back as strings
    return (Array.isArray(data) ? data : []).map((item: Record<string, unknown>) => ({
      ...item,
      total_days: item.total_days ? parseFloat(String(item.total_days)) : 0,
      department_id: item.department_id ? parseInt(String(item.department_id)) : null,
    })) as LeaveRequest[];
  }

  static async create(data: CreateLeaveInput): Promise<LeaveRequest> {
    const deptId = await this.getDepartmentId(data.user_id);
    const payload = {
      ...data,
      department_id: deptId ?? data.department_id,
    };

    const res = await fetch(`${API_BASE_URL}/items/leave_request`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      throw new Error(`Failed to create leave: ${res.statusText} (${res.status}) - ${errorText}`);
    }

    const { data: createdData } = await res.json();
    return {
      ...createdData,
      total_days: createdData.total_days ? parseFloat(createdData.total_days) : 0,
    } as LeaveRequest;
  }

  static async update(id: number, data: UpdateLeaveInput): Promise<LeaveRequest> {
    const deptId = data.user_id ? await this.getDepartmentId(data.user_id) : null;
    const payload = {
      ...data,
      ...(deptId ? { department_id: deptId } : {}),
    };

    const res = await fetch(`${API_BASE_URL}/items/leave_request/${id}`, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      throw new Error(`Failed to update leave: ${res.statusText} (${res.status}) - ${errorText}`);
    }

    const { data: updatedData } = await res.json();
    return {
      ...updatedData,
      total_days: updatedData.total_days ? parseFloat(updatedData.total_days) : 0,
    } as LeaveRequest;
  }
}
