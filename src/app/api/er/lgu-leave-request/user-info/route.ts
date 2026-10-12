import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeJwtPayload, COOKIE_NAME } from "@/lib/auth-utils";
import { LguLeaveService } from "@/modules/er/lgu-leave-request/services/lguLeaveService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    const payload = token ? decodeJwtPayload(token) : null;
    const authUserId = payload?.sub ? Number(payload.sub) : null;

    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get("user_id");

    const targetUserId = queryUserId ? Number(queryUserId) : authUserId;

    if (!targetUserId) {
      return NextResponse.json({ message: "User not authenticated" }, { status: 401 });
    }

    const employeeInfo = await LguLeaveService.getEmployeeInfo(targetUserId);
    return NextResponse.json({ ok: true, data: employeeInfo }, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to retrieve employee information";
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}
