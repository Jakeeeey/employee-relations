import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAuthHeader(): Record<string, string> {
  if (process.env.DIRECTUS_STATIC_TOKEN) {
    return {
      Authorization: `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`,
    };
  }
  return {};
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const userId = formData.get("userId");
    const logDate = formData.get("logDate");
    const reason = formData.get("reason");
    const proofs = formData.getAll("proof") as File[];
    
    // Time fields
    const time_in = formData.get("time_in") as string | null;
    const lunch_start = formData.get("lunch_start") as string | null;
    const lunch_end = formData.get("lunch_end") as string | null;
    const break_start = formData.get("break_start") as string | null;
    const break_end = formData.get("break_end") as string | null;
    const time_out = formData.get("time_out") as string | null;

    if (!userId || !logDate || !reason) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Step 1: Upload files to Directus if there are any
    const uploadedFileIds: string[] = [];
    
    for (const file of proofs) {
      const fileFormData = new FormData();
      fileFormData.append("file", file);
      // Optional: add a folder id if needed, e.g., fileFormData.append("folder", "FOLDER_ID");

      const uploadResponse = await fetch(`${API_BASE_URL}/files`, {
        method: "POST",
        headers: {
          ...getAuthHeader(),
          // Note: DO NOT set Content-Type here, let fetch handle the boundary for FormData
        },
        body: fileFormData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("Directus file upload error:", uploadResponse.status, errorText);
        throw new Error(`Failed to upload file: ${file.name}`);
      }

      const uploadData = await uploadResponse.json();
      if (uploadData.data && uploadData.data.id) {
        uploadedFileIds.push(uploadData.data.id);
      }
    }

    const payload: Record<string, unknown> = {
      user_id: Number(userId),
      log_date: logDate,
      reason: reason,
      status: "pending",
    };

    if (time_in) payload.time_in = time_in;
    if (lunch_start) payload.lunch_start = lunch_start;
    if (lunch_end) payload.lunch_end = lunch_end;
    if (break_start) payload.break_start = break_start;
    if (break_end) payload.break_end = break_end;
    if (time_out) payload.time_out = time_out;

    const recordResponse = await fetch(`${API_BASE_URL}/items/attendance_change_request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });

    if (!recordResponse.ok) {
      const errorText = await recordResponse.text();
      console.error("Directus record creation error:", recordResponse.status, errorText);
      throw new Error(`Failed to create change request record in Directus`);
    }

    const recordData = await recordResponse.json();
    const newRecordId = recordData.data.id;

    // Step 3: Explicitly create junction records in attendance_change_request_files
    if (uploadedFileIds.length > 0) {
      const junctionPayload = uploadedFileIds.map((fileId) => ({
        attendance_change_request_id: newRecordId,
        directus_files_id: fileId,
      }));

      const junctionResponse = await fetch(`${API_BASE_URL}/items/attendance_change_request_files`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        // Directus allows bulk creation by passing an array of objects
        body: JSON.stringify(junctionPayload),
      });

      if (!junctionResponse.ok) {
        const errorText = await junctionResponse.text();
        console.error("Directus junction table error:", junctionResponse.status, errorText);
        // We log the error but don't fail the whole request since the main record was created
      }
    }

    return NextResponse.json(
      { success: true, data: recordData.data },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error submitting attendance change request:", error);
    const message = error instanceof Error ? error.message : "Failed to submit request";
    return NextResponse.json({ message }, { status: 500 });
  }
}
