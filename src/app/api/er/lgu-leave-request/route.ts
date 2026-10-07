import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeJwtPayload, COOKIE_NAME } from "@/lib/auth-utils";
import { LguLeaveService } from "@/modules/er/lgu-leave-request/services/lguLeaveService";
import { CreateLguLeaveSchema } from "@/modules/er/lgu-leave-request/types";

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

    if (targetUserId) {
      const data = await LguLeaveService.fetchByUserId(targetUserId);
      return NextResponse.json({ data }, { status: 200 });
    }

    const data = await LguLeaveService.fetchAll();
    return NextResponse.json({ data }, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to retrieve LGU leave requests";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    const payload = token ? decodeJwtPayload(token) : null;
    const authUserId = payload?.sub ? Number(payload.sub) : null;

    const body = await request.json();

    const parsed = CreateLguLeaveSchema.safeParse({
      ...body,
      user_id: body.user_id || authUserId || 1,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation error", errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const created = await LguLeaveService.create(parsed.data);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to file LGU leave request";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
