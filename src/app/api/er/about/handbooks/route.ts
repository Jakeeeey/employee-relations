import { NextResponse } from "next/server";
import { aboutService } from "../../../../../modules/er/about/services/aboutService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const handbooks = await aboutService.fetchHandbooks();
    return NextResponse.json(handbooks, { status: 200 });
  } catch (error) {
    console.error("Error fetching handbooks:", error);
    return NextResponse.json({ message: "Failed to fetch handbooks" }, { status: 500 });
  }
}
