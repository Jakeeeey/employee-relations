import { NextResponse } from "next/server";
import { aboutService } from "../../../../../modules/er/about/services/aboutService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const company = await aboutService.fetchCompany();
    
    if (!company) {
      return NextResponse.json({ message: "Company profile not found" }, { status: 404 });
    }

    return NextResponse.json(company, { status: 200 });
  } catch (error) {
    console.error("Error fetching company:", error);
    return NextResponse.json({ message: "Failed to fetch company profile" }, { status: 500 });
  }
}
