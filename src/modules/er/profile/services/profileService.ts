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
      
      // Flatten relational fields if any (Directus returns nested objects for relations if requested)
      const profile: UserProfile = {
        ...data,
        department_name: data.user_department?.department_name || data.user_department?.name || null,
        employment_status_name: data.employment_status_id?.status_name || data.employment_status_id?.name || null,
      };

      return profile;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  }
}
