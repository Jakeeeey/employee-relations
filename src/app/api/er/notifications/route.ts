import { NextRequest, NextResponse } from "next/server";
import { notificationService } from "../../../../modules/er/notifications/services/notificationService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ message: "userId parameter is required" }, { status: 400 });
    }

    const notifications = await notificationService.fetchAll(userId);
    return NextResponse.json(notifications, { status: 200 });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ message: "Failed to fetch notifications" }, { status: 500 });
  }
}
