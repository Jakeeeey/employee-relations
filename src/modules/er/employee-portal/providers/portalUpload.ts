"use client";

export type PortalUploadKind = "photo" | "signature" | "attachment";

export async function uploadPortalFile(
    file: Blob,
    kind: PortalUploadKind,
    filename: string
): Promise<string> {
    const form = new FormData();
    form.append("kind", kind);
    form.append("file", file, filename);

    const res = await fetch("/api/er/portal/upload", {
        method: "POST",
        body: form,
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
        throw new Error(body?.error || "File upload failed");
    }
    const id = body?.data?.id;
    if (!id) throw new Error("Upload succeeded but no file id was returned");
    return id as string;
}
