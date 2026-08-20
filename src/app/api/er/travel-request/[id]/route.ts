/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeJwtPayload } from "@/lib/auth-utils";
import { 
  fetchTravelRequestById, 
  fetchTravelRequestBudgets, 
  updateTravelRequestStatus, 
  deleteTravelRequest 
} from "@/modules/er/travel-request/services/travel-request.service";

const COOKIE_NAME = "vos_access_token";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const p = await params;
    const id = Number(p.id);
    if (!id) return NextResponse.json({ message: "Invalid ID" }, { status: 400 });

    const travelRequest = await fetchTravelRequestById(id);
    
    // Also fetch budgets if needed
    let budgets: any[] = [];
    if (travelRequest.requires_budget) {
      budgets = await fetchTravelRequestBudgets(id);
    }

    return NextResponse.json({ data: { ...travelRequest, budgets } }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = decodeJwtPayload(token);
    const userId = payload?.sub ? Number(payload.sub) : null;
    if (!userId) return NextResponse.json({ message: "Invalid token" }, { status: 401 });

    const p = await params;
    const id = Number(p.id);
    if (!id) return NextResponse.json({ message: "Invalid ID" }, { status: 400 });

    const body = await request.json();
    if (!body.status) {
      return NextResponse.json({ message: "Status is required" }, { status: 400 });
    }

    const updated = await updateTravelRequestStatus(id, body.status, userId);
    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const p = await params;
    const id = Number(p.id);
    if (!id) return NextResponse.json({ message: "Invalid ID" }, { status: 400 });

    await deleteTravelRequest(id);
    return NextResponse.json({ message: "Deleted successfully" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
  }
}
