import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const COOKIE_NAME = "vos_access_token";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function resolveDirectusUrl(raw: string): string {
  if (UUID_PATTERN.test(raw)) {
    return `${API_BASE_URL}/assets/${raw}`;
  }
  if (raw.startsWith("http")) {
    return raw;
  }
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  return `${API_BASE_URL}${path}`;
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const rawPath = req.nextUrl.searchParams.get("path");
  if (!rawPath) {
    return NextResponse.json({ ok: false, message: "Missing path parameter" }, { status: 400 });
  }

  const staticToken = process.env.DIRECTUS_STATIC_TOKEN;
  if (!staticToken || !API_BASE_URL) {
    return NextResponse.json({ ok: false, message: "Server configuration error" }, { status: 500 });
  }

  try {
    const fileUrl = resolveDirectusUrl(rawPath);
    const fileRes = await fetch(fileUrl, {
      headers: { "Authorization": `Bearer ${staticToken}` },
    });

    if (!fileRes.ok) {
      return NextResponse.json(
        { ok: false, message: `File fetch failed: ${fileRes.statusText}` },
        { status: fileRes.status }
      );
    }

    const contentType = fileRes.headers.get("content-type") || "application/octet-stream";
    const contentDisposition = fileRes.headers.get("content-disposition") || "inline";

    const arrayBuffer = await fileRes.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error: unknown) {
    console.error("[COE File Proxy] Error:", error);
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
