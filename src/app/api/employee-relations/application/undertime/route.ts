import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { UndertimeService } from "@/modules/employee-relations/application/undertime/services/undertimeService";
import { CreateUndertimeSchema } from "@/modules/employee-relations/application/undertime/types";

const COOKIE_NAME = "vos_access_token";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  try {
    const payloadBuffer = Buffer.from(token.split(".")[1], "base64");
    const payload = JSON.parse(payloadBuffer.toString("utf8"));
    const strictUserId = payload?.user_id || payload?.userId || payload?.id;

    const requests = await UndertimeService.fetchAll();
    
    // Strict server-side isolation based on the securely decoded JWT token
    const filteredRequests = strictUserId 
      ? requests.filter((r: any) => String(r.user_id) === String(strictUserId))
      : [];

    return NextResponse.json({ ok: true, data: filteredRequests });
  } catch (error: any) {
    console.error("[GET] Proxy error:", error);
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const validatedData = CreateUndertimeSchema.parse(body);
    
    const newRequest = await UndertimeService.create(validatedData);
    return NextResponse.json({ ok: true, data: newRequest });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ ok: false, message: "Validation error", errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }
}
