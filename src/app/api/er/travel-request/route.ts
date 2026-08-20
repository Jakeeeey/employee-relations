/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
 
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeJwtPayload } from "@/lib/auth-utils";
import { fetchTravelRequests, createTravelRequest } from "@/modules/er/travel-request/services/travel-request.service";
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

    // TODO: Ideally we should get department_id and division_id from the user's profile
    // For now we assume they might be passed or we fetch them if needed
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


