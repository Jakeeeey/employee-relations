import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME } from "@/lib/auth-utils";
import { LguLeaveService } from "@/modules/er/lgu-leave-request/services/lguLeaveService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const p = await params;
    const id = Number(p.id);
    if (!id) return NextResponse.json({ message: "Invalid ID" }, { status: 400 });

    const leave = await LguLeaveService.fetchById(id);
    if (!leave) return NextResponse.json({ message: "Not found" }, { status: 404 });

    return NextResponse.json({ data: leave }, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const p = await params;
    const id = Number(p.id);
    if (!id) return NextResponse.json({ message: "Invalid ID" }, { status: 400 });

    const body = await request.json();
    const updated = await LguLeaveService.update(id, body);
    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const p = await params;
    const id = Number(p.id);
    if (!id) return NextResponse.json({ message: "Invalid ID" }, { status: 400 });

    const cancelled = await LguLeaveService.cancel(id);
    return NextResponse.json({ data: cancelled, message: "Cancelled successfully" }, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
