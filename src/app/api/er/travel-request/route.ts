/* eslint-disable @typescript-eslint/no-explicit-any */
 
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeJwtPayload } from "@/lib/auth-utils";
import {
  fetchTravelRequests,
  fetchAllTravelRequestsForApproval,
  createTravelRequest,
} from "@/modules/er/travel-request/services/travel-request.service";
import { TravelRequestFormInputSchema } from "@/modules/er/travel-request/types/schema";

const COOKIE_NAME = "vos_access_token";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = decodeJwtPayload(token);
    const userId = payload?.sub ? Number(payload.sub) : null;
    if (!userId) {
      return NextResponse.json({ message: "Invalid token payload" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");

    if (scope === "approvals") {
      const requests = await fetchAllTravelRequestsForApproval();
      return NextResponse.json({ data: requests }, { status: 200 });
    }

    const requests = await fetchTravelRequests(userId);
    return NextResponse.json({ data: requests }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = decodeJwtPayload(token);
    const userId = payload?.sub ? Number(payload.sub) : null;
    if (!userId) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validatedData = TravelRequestFormInputSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json({ 
        message: "Validation failed", 
        errors: validatedData.error.flatten() 
      }, { status: 400 });
    }

    const { budget_items, ...requestData } = validatedData.data;

    const newRequest = await createTravelRequest({
      ...requestData,
      user_id: userId,
      department_id: body.department_id || null,
      division_id: body.division_id || null,
      request_date: new Date().toISOString().split('T')[0], // Today's date
    }, budget_items);

    return NextResponse.json({ data: newRequest }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
  }
}
