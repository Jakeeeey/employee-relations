import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = "vos_access_token";
const DIRECTUS_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "";
const FOLDER_NAME = "expense_draft";

export const runtime = "nodejs";

async function parseDirectusJson(response: Response, label: string) {
  const text = await response.text();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = text;
  }
  if (!response.ok) {
    throw new Error(`${label} failed: ${response.status} - ${typeof data === "object" ? JSON.stringify(data) : text}`);
  }
  if (typeof data === "string" && data.trim().startsWith("<")) {
    throw new Error(`${label} returned HTML response instead of JSON.`);
  }
  return data;
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!DIRECTUS_URL) {
      return NextResponse.json({ error: "Upstream API not configured" }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv"
    ];
    if (file.type && !allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only images, PDF, Excel, and CSV are allowed." }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
    }

    const staticToken = process.env.DIRECTUS_STATIC_TOKEN;
    const directusForm = new FormData();
    directusForm.append("file", file, file.name);

    // 1. Post file to Directus
    const uploadRes = await fetch(`${DIRECTUS_URL}/files`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${staticToken}`,
      },
      body: directusForm,
    });

    const uploadData = await parseDirectusJson(uploadRes, "Directus upload");
    const fileId = uploadData.data?.id;

    // 2. Try to move file to the correct folder
    if (fileId) {
      try {
        const folderRes = await fetch(
          `${DIRECTUS_URL}/folders?filter[name][_eq]=${FOLDER_NAME}`,
          { headers: { Authorization: `Bearer ${staticToken}` } }
        );
        if (folderRes.ok) {
          const folderData = await parseDirectusJson(folderRes, "Folder lookup");
          let folderId =
            folderData.data && folderData.data.length > 0
              ? folderData.data[0].id
              : undefined;

          if (!folderId) {
            // Auto-create folder dynamically by name if it doesn't exist
            const createFolderRes = await fetch(`${DIRECTUS_URL}/folders`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${staticToken}`,
              },
              body: JSON.stringify({ name: FOLDER_NAME }),
            });
            if (createFolderRes.ok) {
              const createFolderData = await parseDirectusJson(createFolderRes, "Folder creation");
              folderId = createFolderData.data?.id;
            }
          }

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
      } catch (err) {
        console.warn("Could not folderize receipt attachment:", err);
      }
    }

    return NextResponse.json({
      success: true,
      file_id: fileId,
      file_url: fileId,   // store only the UUID — clients build the full URL at render time
      filename_download: uploadData.data?.filename_download || file.name,
      filesize: uploadData.data?.filesize,
      type: uploadData.data?.type,
    }, { status: 200 });
  } catch (error) {
    console.error("[WER upload] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload file" },
      { status: 500 }
    );
  }
}
