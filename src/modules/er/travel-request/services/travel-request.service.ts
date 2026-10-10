/* eslint-disable @typescript-eslint/no-explicit-any */
 
import { TravelRequest, TravelRequestBudget } from "../types/schema";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const STATIC_TOKEN = process.env.DIRECTUS_STATIC_TOKEN;

function getHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${STATIC_TOKEN}`,
  };
}

async function enrichRequestsWithDetails(requests: any[]): Promise<any[]> {
  if (!requests || requests.length === 0) return [];

  const travelIds = requests.map((r) => r.travel_id).filter(Boolean);

  // 1. Fetch budgets to calculate totals
  if (travelIds.length > 0) {
    try {
      const budgetsRes = await fetch(
        `${API_BASE_URL}/items/travel_request_budget?filter[travel_id][_in]=${travelIds.join(",")}`,
        { headers: getHeaders() }
      );
      if (budgetsRes.ok) {
        const budgetsData = await budgetsRes.json();
        const budgets = budgetsData.data || [];
        const itemsMap = new Map<number, any[]>();
        const budgetMap = new Map<number, number>();

        for (const b of budgets) {
          const currentSum = budgetMap.get(b.travel_id) || 0;
          budgetMap.set(b.travel_id, currentSum + Number(b.amount || 0));

          const items = itemsMap.get(b.travel_id) || [];
          items.push(b);
          itemsMap.set(b.travel_id, items);
        }

        for (const req of requests) {
          req.total_budget = budgetMap.get(req.travel_id) || 0;
          req.budget_items = itemsMap.get(req.travel_id) || [];
        }
      }
    } catch (e) {
      console.warn("Failed to fetch travel request budgets:", e);
    }
  }

  // 2. Fetch unique user details to enrich with employee_name & department_name
  const userIds = [...new Set(requests.map((r) => r.user_id).filter(Boolean))];
  if (userIds.length > 0) {
    try {
      const usersRes = await fetch(
        `${API_BASE_URL}/items/user?filter[user_id][_in]=${userIds.join(",")}&fields=user_id,user_fname,user_lname,user_department`,
        { headers: getHeaders() }
      );
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        const users = usersData.data || [];
        const userMap = new Map<number, any>();
        const deptIds = new Set<number>();
        for (const u of users) {
          userMap.set(u.user_id, u);
          if (u.user_department) deptIds.add(Number(u.user_department));
        }

        const deptMap = new Map<number, string>();
        if (deptIds.size > 0) {
          const deptsRes = await fetch(
            `${API_BASE_URL}/items/department?filter[department_id][_in]=${Array.from(deptIds).join(",")}&fields=department_id,department_name`,
            { headers: getHeaders() }
          );
          if (deptsRes.ok) {
            const deptsData = await deptsRes.json();
            for (const d of deptsData.data || []) {
              deptMap.set(d.department_id, d.department_name);
            }
          }
        }

        for (const req of requests) {
          const u = userMap.get(req.user_id);
          if (u) {
            req.employee_name = [u.user_fname, u.user_lname].filter(Boolean).join(" ");
            const deptId = req.department_id || u.user_department;
            req.department_name = deptId ? deptMap.get(Number(deptId)) || "General" : "General";
          }
        }
      }
    } catch (e) {
      console.warn("Failed to enrich users for travel requests:", e);
    }
  }

  // 3. Fetch file metadata for attachments
  const attachmentUuids = [...new Set(requests.map((r) => r.attachment_uuid).filter(Boolean))];
  if (attachmentUuids.length > 0) {
    try {
      const filesRes = await fetch(
        `${API_BASE_URL}/files?filter[id][_in]=${attachmentUuids.join(",")}&fields=id,filename_download,filesize,type`,
        { headers: getHeaders() }
      );
      if (filesRes.ok) {
        const filesData = await filesRes.json();
        const fileMap = new Map<string, any>();
        for (const f of filesData.data || []) {
          fileMap.set(f.id, f);
        }
        for (const req of requests) {
          if (req.attachment_uuid && fileMap.has(req.attachment_uuid)) {
            const f = fileMap.get(req.attachment_uuid);
            req.attachment_filename = f.filename_download;
            req.attachment_filesize = f.filesize;
            req.attachment_filetype = f.type;
          }
        }
      }
    } catch (e) {
      console.warn("Failed to fetch file metadata for travel requests:", e);
    }
  }

  return requests;
}

export async function fetchTravelRequests(userId: number): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/items/travel_request?filter[user_id][_eq]=${userId}&sort=-filed_at`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error("Directus Error (fetchTravelRequests):", res.status, errText);
    throw new Error(`Failed to fetch travel requests: ${res.status} ${errText}`);
  }
  const data = await res.json();
  const requests = data.data as any[];
  return enrichRequestsWithDetails(requests);
}

export async function fetchAllTravelRequestsForApproval(): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/items/travel_request?sort=-filed_at`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error("Directus Error (fetchAllTravelRequestsForApproval):", res.status, errText);
    throw new Error(`Failed to fetch travel requests for approval: ${res.status} ${errText}`);
  }
  const data = await res.json();
  const requests = data.data as any[];
  return enrichRequestsWithDetails(requests);
}

export async function fetchTravelRequestById(id: number): Promise<TravelRequest> {
  const res = await fetch(`${API_BASE_URL}/items/travel_request/${id}`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error("Failed to fetch travel request detail");
  }
  const data = await res.json();
  const requests = await enrichRequestsWithDetails([data.data]);
  return requests[0] as TravelRequest;
}

export async function fetchTravelRequestBudgets(travelId: number): Promise<TravelRequestBudget[]> {
  const res = await fetch(`${API_BASE_URL}/items/travel_request_budget?filter[travel_id][_eq]=${travelId}`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error("Failed to fetch travel request budgets");
  }
  const data = await res.json();
  return data.data as TravelRequestBudget[];
}

export async function fetchTravelRequestCOAs() {
  const res = await fetch(`${API_BASE_URL}/items/chart_of_accounts?filter[account_type][_in]=8,9&limit=-1`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error("Failed to fetch Chart of Accounts");
  }
  const data = await res.json();
  return data.data || [];
}

export async function createTravelRequest(
  payload: Omit<TravelRequest, "travel_id" | "status" | "current_approval_level" | "approved_at" | "filed_at">,
  budgetItems?: Omit<TravelRequestBudget, "id" | "travel_id">[]
): Promise<TravelRequest> {
  // 1. Create the main travel request
  const reqRes = await fetch(`${API_BASE_URL}/items/travel_request`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      ...payload,
      status: "pending",
      current_approval_level: 1,
    }),
  });

  if (!reqRes.ok) {
    throw new Error("Failed to create travel request");
  }
  
  const reqData = await reqRes.json();
  const travelRequest = reqData.data as TravelRequest;

  // 2. If budgets exist, create them
  if (payload.requires_budget && budgetItems && budgetItems.length > 0) {
    const budgetPayload = budgetItems.map((item) => ({
      ...item,
      travel_id: travelRequest.travel_id,
    }));

    const budgetRes = await fetch(`${API_BASE_URL}/items/travel_request_budget`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(budgetPayload),
    });

    if (!budgetRes.ok) {
      console.error("Failed to create travel request budget items");
    }
  }

  return travelRequest;
}

export async function updateTravelRequestStatus(
  id: number,
  status: string,
  approverId: number,
  remarks?: string
): Promise<TravelRequest> {
  const payload: any = { status, approver_id: approverId };
  if (status === "approved") {
    payload.approved_at = new Date().toISOString();
  }
  if (remarks !== undefined) {
    payload.approval_remarks = remarks;
  }

  const res = await fetch(`${API_BASE_URL}/items/travel_request/${id}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Failed to update travel request status");
  }
  
  const data = await res.json();
  return data.data as TravelRequest;
}

export async function deleteTravelRequest(id: number): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/items/travel_request/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!res.ok) {
    throw new Error("Failed to delete travel request");
  }

  return true;
}
