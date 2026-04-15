import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { LeaveService } from "@/modules/er/application/leave/services/leaveService";
import { UpdateLeaveSchema } from "@/modules/er/application/leave/types";
import { ZodError } from "zod";

const COOKIE_NAME = "vos_access_token";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ leaveId: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const { leaveId } = await params;

  if (!token) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log(`[PATCH] Updating leave ${leaveId} via LeaveService.update`);
    const body = await req.json();
    const validatedData = UpdateLeaveSchema.parse(body);

    const updatedLeave = await LeaveService.update(parseInt(leaveId), validatedData);
    return NextResponse.json({ ok: true, data: updatedLeave });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, message: "Validation error", errors: error.issues }, { status: 400 });
    }
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
