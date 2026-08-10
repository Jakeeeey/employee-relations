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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { message: "Missing request ID" },
        { status: 400 }
      );
    }

    // Delete the record from Directus
    const recordResponse = await fetch(`${API_BASE_URL}/items/attendance_change_request/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (!recordResponse.ok) {
      const errorText = await recordResponse.text();
      console.error("Directus record deletion error:", recordResponse.status, errorText);
      throw new Error("Failed to delete change request record in Directus");
    }

    return NextResponse.json(
      { success: true, message: "Request cancelled successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error cancelling attendance change request:", error);
    const message = error instanceof Error ? error.message : "Failed to cancel request";
    return NextResponse.json({ message }, { status: 500 });
  }
}
