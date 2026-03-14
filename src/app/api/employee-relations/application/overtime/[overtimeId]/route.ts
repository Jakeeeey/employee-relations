import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { OvertimeService } from "@/modules/employee-relations/application/overtime/services/overtimeService";
import { UpdateOvertimeSchema } from "@/modules/employee-relations/application/overtime/types";

const COOKIE_NAME = "vos_access_token";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ overtimeId: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const overtimeId = (await params).overtimeId;

  try {
    const body = await req.json();
    const validatedData = UpdateOvertimeSchema.parse(body);

    const updatedRequest = await OvertimeService.update(parseInt(overtimeId), validatedData);
    return NextResponse.json({ ok: true, data: updatedRequest });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ ok: false, message: "Validation error", errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }
}
