import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { LeaveService } from "@/modules/er/application/leave/services/leaveService";
import { CreateLeaveSchema } from "@/modules/er/application/leave/types";
import { ZodError } from "zod";

const COOKIE_NAME = "vos_access_token";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const payloadBuffer = Buffer.from(token.split(".")[1], "base64");
    const payload = JSON.parse(payloadBuffer.toString("utf8"));
    const strictUserId = payload?.sub || payload?.user_id || payload?.userId || payload?.id;

    const leaves = await LeaveService.fetchAll();

    // Strict server-side isolation based on the securely decoded JWT token
    const filteredLeaves = strictUserId
      ? leaves.filter((l: { user_id: number | string }) => String(l.user_id) === String(strictUserId))
      : [];

    return NextResponse.json({ ok: true, data: filteredLeaves });
  } catch (error: unknown) {
    console.error("[GET] Proxy error:", error);
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validatedData = CreateLeaveSchema.parse(body);

    if (validatedData.is_paid) {
      if (validatedData.leave_type !== "vacation" && validatedData.leave_type !== "sick") {
        return NextResponse.json(
          { ok: false, message: "Only Vacation and Sick leaves can be requested as Paid." },
          { status: 400 }
        );
      }

      const wageSettings = await LeaveService.getWageManagement(validatedData.user_id);
      const limit = validatedData.leave_type === "vacation"
        ? (wageSettings?.vacation_leave_per_year ?? 0)
        : (wageSettings?.sick_leave_per_year ?? 0);

      const leaves = await LeaveService.fetchByUserId(validatedData.user_id);
      const currentYear = validatedData.leave_start ? new Date(validatedData.leave_start).getFullYear() : new Date().getFullYear();

      const activePaidLeaves = leaves.filter((l) => {
        if (l.status === "rejected" || l.status === "cancelled") return false;
        if (!l.is_paid) return false;
        if (!l.leave_start) return false;
        return new Date(l.leave_start).getFullYear() === currentYear;
      });

      const usedDays = activePaidLeaves
        .filter((l) => l.leave_type === validatedData.leave_type)
        .reduce((sum, l) => sum + (l.total_days || 0), 0);

      const requestedDays = validatedData.total_days || 0;
      if (usedDays + requestedDays > limit) {
        return NextResponse.json(
          {
            ok: false,
            message: `Insufficient paid ${validatedData.leave_type} leave balance. Remaining: ${Math.max(0, limit - usedDays)} day(s). Requested: ${requestedDays} day(s).`,
          },
          { status: 400 }
        );
      }
    }

    const newLeave = await LeaveService.create(validatedData);
    return NextResponse.json({ ok: true, data: newLeave });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, message: "Validation error", errors: error.issues }, { status: 400 });
    }
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
