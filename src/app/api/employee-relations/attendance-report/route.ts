import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (process.env.DIRECTUS_STATIC_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`;
  }

  return headers;
}

async function directusFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Directus API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId || isNaN(Number(userId))) {
      return NextResponse.json(
        { message: "Invalid or missing userId parameter" },
        { status: 400 }
      );
    }

    const userIdNum = Number(userId);
    console.log(`[Attendance Report] Fetching data for user_id: ${userIdNum}`);

    const [userResponse, attendanceLogsResponse] = await Promise.all([
      directusFetch(`/items/user?filter[user_id][_eq]=${userIdNum}`),
      directusFetch(
        `/items/attendance_log?filter[user_id][_eq]=${userIdNum}&sort=-log_date&limit=-1`
      ),
    ]);

    const user = userResponse.data?.[0];
    const attendanceLogs = attendanceLogsResponse.data || [];

    console.log(`[Attendance Report] User found: ${user?.user_fname}, Records: ${attendanceLogs.length}`);

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Fetch department name if user has a department
    if (user.user_department) {
      try {
        const deptResponse = await directusFetch(
          `/items/department/${user.user_department}?fields=department_id,department_name`
        );
        user.department_name = deptResponse.data?.department_name || null;
      } catch {
        user.department_name = null;
      }
    }

    return NextResponse.json(
      {
        user,
        attendanceLogs,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching attendance report:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch attendance report";
    return NextResponse.json({ message }, { status: 500 });
  }
}
