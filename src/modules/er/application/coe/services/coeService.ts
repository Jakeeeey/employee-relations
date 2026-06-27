import { CreateCOEInput, COERequest, UpdateCOEInput } from "../type";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export class COEService {
  private static getHeaders() {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (process.env.DIRECTUS_STATIC_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`;
    }

    return headers;
  }

  /**
   * Fetches COE requests, optionally filtered by employee_id.
   * @param {number} [employeeId] - When provided, filters results to this employee only.
   * @returns {Promise<COERequest[]>} Sorted by request_date descending.
   */
  static async fetchAll(employeeId?: number): Promise<COERequest[]> {
    const params = new URLSearchParams();
    params.set("sort", "-request_date");
    params.set("limit", "-1");

    if (employeeId !== undefined && employeeId !== null) {
      params.set("filter[employee_id][_eq]", String(employeeId));
    }

    const res = await fetch(
      `${API_BASE_URL}/items/coe_requests?${params.toString()}`,
      {
        method: "GET",
        headers: this.getHeaders(),
        cache: "no-store",
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch COE requests: ${res.statusText} (${res.status})`);
    }

    const payload = await res.json();
    const data = payload.data || payload || [];

    return (Array.isArray(data) ? data : []) as COERequest[];
  }

  /**
   * Creates a new COE request.
   * @param {CreateCOEInput} data - employee_id + purpose.
   * @returns {Promise<COERequest>} The created record.
   */
  static async create(data: CreateCOEInput): Promise<COERequest> {
    const payload = {
      employee_id: data.employee_id,
      purpose: data.purpose,
      status: "PENDING",
    };

    const res = await fetch(`${API_BASE_URL}/items/coe_requests`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      throw new Error(`Failed to create COE request: ${res.statusText} (${res.status}) - ${errorText}`);
    }

    const { data: createdData } = await res.json();
    return createdData as COERequest;
  }

  /**
   * Updates an existing COE request by id.
   * @param {number} id - The coe_requests.id PK.
   * @param {UpdateCOEInput} data - Partial fields to update.
   * @returns {Promise<COERequest>} The updated record.
   */
  static async update(id: number, data: UpdateCOEInput): Promise<COERequest> {
    const res = await fetch(`${API_BASE_URL}/items/coe_requests/${id}`, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      throw new Error(`Failed to update COE request: ${res.statusText} (${res.status}) - ${errorText}`);
    }

    const { data: updatedData } = await res.json();
    return updatedData as COERequest;
  }
}
