import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = "vos_access_token";
const DIRECTUS_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const FOLDER_NAME = "employee_concern";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!DIRECTUS_URL) {
    return NextResponse.json({ error: "Upstream API not configured" }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
    }

    const staticToken = process.env.DIRECTUS_STATIC_TOKEN;
    const directusForm = new FormData();
    directusForm.append("file", file, file.name);

    const uploadRes = await fetch(`${DIRECTUS_URL}/files`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${staticToken}`,
      },
      body: directusForm,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Directus upload failed: ${uploadRes.status} - ${errText}`);
    }

    const uploadData = await uploadRes.json();
    const fileId = uploadData.data?.id;

    if (fileId) {
      const folderRes = await fetch(
        `${DIRECTUS_URL}/folders?filter[name][_eq]=${FOLDER_NAME}`,
        { headers: { Authorization: `Bearer ${staticToken}` } },
      );
      const folderData = await folderRes.json();
      const folderId =
        folderData.data && folderData.data.length > 0
          ? folderData.data[0].id
          : undefined;

      if (folderId) {
        await fetch(`${DIRECTUS_URL}/files/${fileId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${staticToken}`,
          },
          body: JSON.stringify({ folder: folderId }),
        });
      }
    }

    return NextResponse.json({
      success: true,
      file_id: fileId,
      file_url: `/assets/${fileId}`,
      filename_download: uploadData.data?.filename_download || file.name,
      filesize: uploadData.data?.filesize,
      type: uploadData.data?.type,
    });
  } catch (error) {
    console.error("[Concern upload] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload file" },
      { status: 500 },
    );
  }
}
