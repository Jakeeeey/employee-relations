import { UserProfile } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export class ProfileService {
  private static getHeaders() {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (process.env.DIRECTUS_STATIC_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`;
    }

    return headers;
  }

  static async getProfile(userId: number): Promise<UserProfile | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/items/user/${userId}?fields=*,user_department.*,employment_status_id.*`, {
        method: "GET",
        headers: this.getHeaders(),
        cache: "no-store", // We want fresh data
      });

      if (!res.ok) {
        console.error(`Failed to fetch profile: ${res.statusText} (${res.status})`);
        return null;
      }

      const payload = await res.json();
      const data = payload.data || payload;
      
      let departmentName = null;
      if (typeof data.user_department === 'object' && data.user_department !== null) {
        departmentName = data.user_department.department_name || data.user_department.name || null;
      } else if (typeof data.user_department === 'number') {
        try {
          const deptRes = await fetch(`${API_BASE_URL}/items/department/${data.user_department}?fields=department_name`, {
            method: "GET",
            headers: this.getHeaders(),
            cache: "no-store",
          });
          if (deptRes.ok) {
            const deptPayload = await deptRes.json();
            departmentName = deptPayload.data?.department_name || deptPayload?.department_name || null;
          }
        } catch (e) {
          console.error("Error fetching department:", e);
        }
      }

      // Flatten relational fields if any (Directus returns nested objects for relations if requested)
      const profile: UserProfile = {
        ...data,
        user_department: typeof data.user_department === 'object' && data.user_department !== null 
            ? data.user_department.department_id 
            : data.user_department,
        department_name: departmentName,
        employment_status_name: typeof data.employment_status_id === 'object' && data.employment_status_id !== null 
            ? (data.employment_status_id.status_name || data.employment_status_id.name || null)
            : null,
      };

      return profile;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  }

  static async getEmployeeFiles(userId: number) {
    try {
      // We assume Directus auto-generated these endpoints based on MySQL schema
      // `employee_file_records`, `employee_file_record_type`, `employee_file_record_list`
      const res = await fetch(
        `${API_BASE_URL}/items/employee_file_records?filter[user_id][_eq]=${userId}&filter[is_deleted][_eq]=0&fields=*,list_id.*,list_id.record_type_id.*&sort=-created_at`,
        {
          method: "GET",
          headers: this.getHeaders(),
          cache: "no-store",
        }
      );

      if (!res.ok) {
        console.error(`Failed to fetch employee files: ${res.statusText} (${res.status})`);
        return [];
      }

      const payload = await res.json();
      return payload.data || [];
    } catch (error) {
      console.error("Error fetching employee files:", error);
      return [];
    }
  }
}
