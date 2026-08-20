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

  if (requests.length === 0) return requests;

  // Fetch budgets to calculate totals and attach to requests
  const travelIds = requests.map(r => r.travel_id);
  const budgetsRes = await fetch(`${API_BASE_URL}/items/travel_request_budget?filter[travel_id][_in]=${travelIds.join(",")}`, {
    headers: getHeaders(),
  });
  
  if (budgetsRes.ok) {
    const budgetsData = await budgetsRes.json();
    const budgets = budgetsData.data || [];
    
    // Group items by travel_id
    const itemsMap = new Map<number, any[]>();
    const budgetMap = new Map<number, number>();

    for (const b of budgets) {
      const currentSum = budgetMap.get(b.travel_id) || 0;
      budgetMap.set(b.travel_id, currentSum + Number(b.amount || 0));

      const items = itemsMap.get(b.travel_id) || [];
      items.push(b);
      itemsMap.set(b.travel_id, items);
    }
    
    // Attach to requests
    for (const req of requests) {
      req.total_budget = budgetMap.get(req.travel_id) || 0;
      req.budget_items = itemsMap.get(req.travel_id) || [];
    }
  }

  return requests;
}

export async function fetchTravelRequestById(id: number): Promise<TravelRequest> {
  const res = await fetch(`${API_BASE_URL}/items/travel_request/${id}`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error("Failed to fetch travel request detail");
  }
  const data = await res.json();
  return data.data as TravelRequest;
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
    const budgetPayload = budgetItems.map(item => ({
      ...item,
      travel_id: travelRequest.travel_id,
    }));

    const budgetRes = await fetch(`${API_BASE_URL}/items/travel_request_budget`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(budgetPayload),
    });

    if (!budgetRes.ok) {
      // In a real app we might want to rollback the request or handle it gracefully
      console.error("Failed to create travel request budget items");
    }
  }

  return travelRequest;
}

export async function updateTravelRequestStatus(id: number, status: string, approverId: number): Promise<TravelRequest> {
  const payload: any = { status, approver_id: approverId };
  if (status === "approved") {
    payload.approved_at = new Date().toISOString();
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


