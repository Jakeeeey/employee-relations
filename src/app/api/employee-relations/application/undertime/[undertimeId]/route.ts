import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { UndertimeService } from "@/modules/employee-relations/application/undertime/services/undertimeService";
import { UpdateUndertimeSchema } from "@/modules/employee-relations/application/undertime/types";
import { ZodError } from "zod";

const COOKIE_NAME = "vos_access_token";

function decodeJwtPayload(token: string) {
  try {
    const parts = token.split(".");
    const payload = Buffer.from(parts[1], "base64").toString("utf8");
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ undertimeId: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const undertimeId = (await params).undertimeId;

  try {
    const body = await req.json();
    const validatedData = UpdateUndertimeSchema.parse(body);

    const payload = decodeJwtPayload(token);
    const userId = payload?.sub || payload?.user_id || payload?.userId || payload?.id;

    // Use token identity as updated_by
    const updatedRequest = await UndertimeService.update(parseInt(undertimeId), validatedData, userId);
    return NextResponse.json({ ok: true, data: updatedRequest });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, message: "Validation error", errors: error.issues }, { status: 400 });
    }
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
