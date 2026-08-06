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

    const id = parseInt(leaveId);
    const leaves = await LeaveService.fetchAll();
    const currentLeave = leaves.find((l) => l.leave_id === id);

    if (!currentLeave) {
      return NextResponse.json({ ok: false, message: "Leave request not found" }, { status: 404 });
    }

    const userId = validatedData.user_id ?? currentLeave.user_id;
    const leaveType = validatedData.leave_type ?? currentLeave.leave_type;
    const isPaid = validatedData.is_paid !== undefined ? validatedData.is_paid : currentLeave.is_paid;
    const totalDays = validatedData.total_days !== undefined ? validatedData.total_days : currentLeave.total_days;
    const leaveStart = validatedData.leave_start !== undefined ? validatedData.leave_start : currentLeave.leave_start;

    if (isPaid) {
      if (leaveType !== "vacation" && leaveType !== "sick") {
        return NextResponse.json(
          { ok: false, message: "Only Vacation and Sick leaves can be requested as Paid." },
          { status: 400 }
        );
      }

      const wageSettings = await LeaveService.getWageManagement(userId);
      const limit = leaveType === "vacation"
        ? (wageSettings?.vacation_leave_per_year ?? 0)
        : (wageSettings?.sick_leave_per_year ?? 0);

      const userLeaves = await LeaveService.fetchByUserId(userId);
      const currentYear = leaveStart ? new Date(leaveStart).getFullYear() : new Date().getFullYear();

      const activePaidLeaves = userLeaves.filter((l) => {
        if (l.leave_id === id) return false;
        if (l.status === "rejected" || l.status === "cancelled") return false;
        if (!l.is_paid) return false;
        if (!l.leave_start) return false;
        return new Date(l.leave_start).getFullYear() === currentYear;
      });

      const usedDays = activePaidLeaves
        .filter((l) => l.leave_type === leaveType)
        .reduce((sum, l) => sum + (l.total_days || 0), 0);

      if (usedDays + totalDays > limit) {
        return NextResponse.json(
          {
            ok: false,
            message: `Insufficient paid ${leaveType} leave balance. Remaining: ${Math.max(0, limit - usedDays)} day(s). Requested: ${totalDays} day(s).`,
          },
          { status: 400 }
        );
      }
    }

    const updatedLeave = await LeaveService.update(id, validatedData);
    return NextResponse.json({ ok: true, data: updatedLeave });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, message: "Validation error", errors: error.issues }, { status: 400 });
    }
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
