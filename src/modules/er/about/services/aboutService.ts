import { Company, CompanyHandbook } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

function getHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (process.env.DIRECTUS_STATIC_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`;
  }

  return headers;
}

async function directusFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Directus API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export const aboutService = {
  fetchCompany: async (): Promise<Company | null> => {
    try {
      // Fetching the main company, typically ID 1
      const res = await directusFetch(`/items/company/1`);
      return res.data;
    } catch (error) {
      console.warn("Failed to fetch company details:", error);
      return null;
    }
  },

  fetchHandbooks: async (): Promise<CompanyHandbook[]> => {
    try {
      // Fetch handbooks. In Directus, you can fetch relations using fields parameter.
      // We assume company_handbook_attachments is a related collection.
      const res = await directusFetch(`/items/company_handbook?fields=*.*`);
      return res.data || [];
    } catch (error) {
      console.warn("Failed to fetch handbooks:", error);
      return [];
    }
  },
};
