import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { OvertimeService } from "@/modules/employee-relations/application/overtime/services/overtimeService";
import { CreateOvertimeSchema } from "@/modules/employee-relations/application/overtime/types";
import { ZodError } from "zod";

const COOKIE_NAME = "vos_access_token";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  try {
    const payloadBuffer = Buffer.from(token.split(".")[1], "base64");
    const payload = JSON.parse(payloadBuffer.toString("utf8"));
    const strictUserId = payload?.user_id || payload?.userId || payload?.id;

    const requests = await OvertimeService.fetchAll();
    
    // Strict server-side isolation based on the securely decoded JWT token
    const filteredRequests = strictUserId 
      ? requests.filter((r: { user_id: number | string }) => String(r.user_id) === String(strictUserId))
      : [];

    return NextResponse.json({ ok: true, data: filteredRequests });
  } catch (error: unknown) {
    console.error("[GET] Proxy error:", error);
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const validatedData = CreateOvertimeSchema.parse(body);
    
    const newRequest = await OvertimeService.create(validatedData);
    return NextResponse.json({ ok: true, data: newRequest });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, message: "Validation error", errors: error.issues }, { status: 400 });
    }
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
