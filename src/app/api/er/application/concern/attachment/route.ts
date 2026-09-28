import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ConcernService } from "@/modules/er/application/concern/services/concernService";
import { z } from "zod";

const COOKIE_NAME = "vos_access_token";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const CreateAttachmentSchema = z.object({
  concern_id: z.number(),
  file_path: z.string().min(1),
  file_name: z.string().min(1),
  file_type: z.string().nullable().optional(),
});

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

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const concernId = req.nextUrl.searchParams.get("concern_id");
  if (!concernId) {
    return NextResponse.json({ ok: false, message: "Missing concern_id parameter" }, { status: 400 });
  }

  try {
    const attachments = await ConcernService.fetchAttachments(parseInt(concernId));
    return NextResponse.json({ ok: true, data: attachments });
  } catch (error: unknown) {
    console.error("[GET attachments] error:", error);
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const userId = extractUserId(token);
  if (!userId) {
    return NextResponse.json({ ok: false, message: "Unable to resolve user id from token" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = CreateAttachmentSchema.parse(body);

    const staticToken = process.env.DIRECTUS_STATIC_TOKEN;
    const res = await fetch(`${API_BASE_URL}/items/employee_concern_attachments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${staticToken}`,
      },
      body: JSON.stringify({
        concern_id: validated.concern_id,
        file_path: validated.file_path,
        file_name: validated.file_name,
        file_type: validated.file_type ?? null,
        created_by: userId,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "Unknown error");
      throw new Error(`Failed to create attachment: ${res.statusText} (${res.status}) - ${errText}`);
    }

    const { data: created } = await res.json();
    return NextResponse.json({ ok: true, data: created });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, message: "Validation error", errors: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
