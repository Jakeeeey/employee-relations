import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ConcernService } from "@/modules/er/application/concern/services/concernService";
import { CreateConcernSchema, getGMT8Timestamp } from "@/modules/er/application/concern/type";
import { ZodError } from "zod";

const COOKIE_NAME = "vos_access_token";

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function extractUserId(token: string): number | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  const raw = payload.sub ?? payload.user_id ?? payload.userId ?? payload.id;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string" && !isNaN(parseInt(raw))) return parseInt(raw);
  return null;
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = extractUserId(token);
    const concerns = await ConcernService.fetchAll(userId ?? undefined);

    return NextResponse.json({ ok: true, data: concerns });
  } catch (error: unknown) {
    console.error("[GET] Concern proxy error:", error);
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = extractUserId(token);
    if (!userId) {
      return NextResponse.json({ ok: false, message: "Unable to resolve user id from token" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = CreateConcernSchema.parse({
      ...body,
      user_id: userId,
      created_at: getGMT8Timestamp(),
    });

    const newConcern = await ConcernService.create(validatedData);
    return NextResponse.json({ ok: true, data: newConcern });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, message: "Validation error", errors: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
