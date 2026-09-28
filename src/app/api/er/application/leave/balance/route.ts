import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { LeaveService } from "@/modules/er/application/leave/services/leaveService";

const COOKIE_NAME = "vos_access_token";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get("userId");
    const excludeLeaveIdParam = searchParams.get("excludeLeaveId");

    let userId: number | null = null;
    if (userIdParam) {
      userId = parseInt(userIdParam);
    } else {
      const payloadBuffer = Buffer.from(token.split(".")[1], "base64");
      const payload = JSON.parse(payloadBuffer.toString("utf8"));
      const decodedUserId = payload?.sub || payload?.user_id || payload?.userId || payload?.id;
      if (decodedUserId) {
        userId = parseInt(String(decodedUserId));
      }
    }

    if (!userId || isNaN(userId)) {
      return NextResponse.json({ ok: false, message: "Invalid or missing User ID" }, { status: 400 });
    }

    const excludeLeaveId = excludeLeaveIdParam ? parseInt(excludeLeaveIdParam) : null;

    // Fetch limits
    const wageSettings = await LeaveService.getWageManagement(userId);
    const vacationLimit = wageSettings?.vacation_leave_per_year ?? 0;
    const sickLimit = wageSettings?.sick_leave_per_year ?? 0;

    // Fetch leaves for this user
    const leaves = await LeaveService.fetchByUserId(userId);
    const currentYear = new Date().getFullYear();

    // Filter leaves of the current year that are paid and not rejected/cancelled
    const activePaidLeaves = leaves.filter((l) => {
      if (excludeLeaveId && l.leave_id === excludeLeaveId) return false;
      if (l.status === "rejected" || l.status === "cancelled") return false;
      if (!l.is_paid) return false;
      if (!l.leave_start) return false;
      return new Date(l.leave_start).getFullYear() === currentYear;
    });

    // Calculate usage
    const vacationUsed = activePaidLeaves
      .filter((l) => l.leave_type === "vacation")
      .reduce((sum, l) => sum + (l.total_days || 0), 0);

    const sickUsed = activePaidLeaves
      .filter((l) => l.leave_type === "sick")
      .reduce((sum, l) => sum + (l.total_days || 0), 0);

    return NextResponse.json({
      ok: true,
      data: {
        vacation: {
          limit: vacationLimit,
          used: vacationUsed,
          remaining: Math.max(0, vacationLimit - vacationUsed),
        },
        sick: {
          limit: sickLimit,
          used: sickUsed,
          remaining: Math.max(0, sickLimit - sickUsed),
        },
      },
    });
  } catch (error: unknown) {
    console.error("[GET /api/er/application/leave/balance] Error:", error);
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
