import { NextRequest, NextResponse } from "next/server";
import { AttendanceChangeRequest, AttendanceChangeRequestFile } from "../../../../modules/er/attendance-report/type";

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
    cache: 'no-store',
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

    const [userResponse, attendanceLogsResponse, changeRequestsResponse, leaveRequestsResponse] = await Promise.all([
      directusFetch(`/items/user?filter[user_id][_eq]=${userIdNum}`),
      directusFetch(
        `/items/attendance_log?filter[user_id][_eq]=${userIdNum}&sort=-log_date&limit=-1`
      ),
      directusFetch(
        `/items/attendance_change_request?filter[user_id][_eq]=${userIdNum}&filter[status][_eq]=pending`
      ).catch(() => ({ data: [] })), // Catch error in case the collection doesn't exist yet
      directusFetch(
        `/items/leave_request?filter[user_id][_eq]=${userIdNum}&limit=-1`
      ).catch(() => ({ data: [] })),
    ]);

    const user = userResponse.data?.[0];
    const attendanceLogs = attendanceLogsResponse.data || [];
    const changeRequests = changeRequestsResponse.data || [];
    const leaveRequests = leaveRequestsResponse.data || [];

    console.log(`[Attendance Report] Fetched ${leaveRequests.length} leave requests.`);
    if (leaveRequests.length > 0) {
      console.log(`[Attendance Report] Leave Request 0:`, leaveRequests[0]);
    }

    // Manually fetch junction table files since Directus might not have the alias field configured
    if (changeRequests.length > 0) {
      try {
        const requestIds = changeRequests.map((r: AttendanceChangeRequest) => r.id).join(',');
        const junctionResponse = await directusFetch(
          `/items/attendance_change_request_files?filter[attendance_change_request_id][_in]=${requestIds}&fields=*,directus_files_id.id,directus_files_id.filename_download`
        );
        
        const junctionData = junctionResponse.data || [];
        
        // Attach files to their respective requests
        changeRequests.forEach((req: AttendanceChangeRequest) => {
          req.attendance_change_request_files = junctionData.filter(
            (j: AttendanceChangeRequestFile) => String(j.attendance_change_request_id) === String(req.id)
          );
        });
      } catch (err) {
        console.error("Error fetching junction files:", err);
      }
    }

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
        changeRequests,
        leaveRequests,
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
