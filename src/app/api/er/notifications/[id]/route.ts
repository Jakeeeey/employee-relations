import { NextRequest, NextResponse } from "next/server";
import { notificationService } from "../../../../../modules/er/notifications/services/notificationService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const updatedNotification = await notificationService.markAsRead(id);
    return NextResponse.json(updatedNotification, { status: 200 });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json({ message: "Failed to update notification" }, { status: 500 });
  }
}
