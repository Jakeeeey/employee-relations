import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const COOKIE_NAME = "vos_access_token";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ ok: false, message: "No file provided" }, { status: 400 });
    }

    const directusForm = new FormData();
    directusForm.append("file", file, file.name);

    const res = await fetch(`${API_BASE_URL}/files`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`,
      },
      body: directusForm,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Directus upload failed: ${res.status} - ${text}`);
    }

    const result = await res.json();
    const fileData = result.data;

    return NextResponse.json({
      ok: true,
      data: {
        id: fileData.id,
        filename_download: fileData.filename_download,
        title: fileData.title || fileData.filename_download,
        asset_url: `/assets/${fileData.id}`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
