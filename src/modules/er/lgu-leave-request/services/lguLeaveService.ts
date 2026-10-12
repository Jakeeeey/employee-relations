import { CreateLguLeaveInput, LguLeaveRequest, LguEmployeeInfo } from "../types";

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

  static async getEmployeeInfo(userId: number): Promise<LguEmployeeInfo> {
    try {
      const userRes = await this.directusFetch(
        `/items/user/${userId}?fields=user_id,user_fname,user_mname,user_lname,user_position,user_department`
      ).catch(() => ({ data: null }));

      const userData = userRes?.data || null;

      let deptName = "Local Government Unit";
      const deptId = userData?.user_department ? Number(userData.user_department) : null;
      if (deptId) {
        const deptRes = await this.directusFetch(
          `/items/department/${deptId}?fields=department_name`
        ).catch(() => ({ data: null }));
        if (deptRes?.data?.department_name) {
          deptName = deptRes.data.department_name;
        }
      }

      let monthlySalary: number | null = null;
      // 1. Attempt to fetch from user_wage_management
      try {
        const wageRes = await this.directusFetch(
          `/items/user_wage_management?filter[user_id][_eq]=${userId}&limit=1`
        );
        const wage = wageRes?.data?.[0];
        if (wage && wage.monthly_rate) {
          monthlySalary = parseFloat(wage.monthly_rate);
        }
      } catch {
        // Fallback
      }

      // 2. Fallback to latest payroll_run_employee if wage management record not found
      if (!monthlySalary || isNaN(monthlySalary)) {
        try {
          const prRes = await this.directusFetch(
            `/items/payroll_run_employee?filter[user_id][_eq]=${userId}&sort=-created_at&limit=1`
          );
          const pr = prRes?.data?.[0];
          if (pr && pr.monthly_rate) {
            monthlySalary = parseFloat(pr.monthly_rate);
          }
        } catch {
          // Ignored
        }
      }

      return {
        userId,
        firstName: userData?.user_fname || "",
        middleName: userData?.user_mname || null,
        lastName: userData?.user_lname || "",
        departmentId: deptId || null,
        departmentName: deptName,
        position: userData?.user_position || "",
        monthlySalary: monthlySalary && !isNaN(monthlySalary) ? monthlySalary : null,
      };
    } catch (error) {
      console.warn(`Failed to get employee info for user ${userId}:`, error);
      return {
        userId,
        firstName: "",
        middleName: null,
        lastName: "",
        departmentId: null,
        departmentName: "Local Government Unit",
        position: "",
        monthlySalary: null,
      };
    }
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
    let enrichedPayload = { ...payload };

    // Auto-enrich user information from the system if missing
    if (
      !payload.first_name ||
      !payload.last_name ||
      !payload.office_department ||
      !payload.position ||
      payload.monthly_salary === null ||
      payload.monthly_salary === undefined
    ) {
      const empInfo = await this.getEmployeeInfo(payload.user_id);
      enrichedPayload = {
        ...enrichedPayload,
        first_name: payload.first_name || empInfo.firstName || "Employee",
        middle_name: payload.middle_name || empInfo.middleName || null,
        last_name: payload.last_name || empInfo.lastName || "User",
        office_department: payload.office_department || empInfo.departmentName || "Local Government Unit",
        position: payload.position || empInfo.position || null,
        monthly_salary:
          payload.monthly_salary !== null && payload.monthly_salary !== undefined
            ? payload.monthly_salary
            : empInfo.monthlySalary,
        department_id: payload.department_id || empInfo.departmentId || null,
      };
    }

    const res = await this.directusFetch(`/items/lgu_leave_request`, {
      method: "POST",
      body: JSON.stringify({
        ...enrichedPayload,
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
