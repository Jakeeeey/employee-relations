import { NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Fetch all attendance logs to get unique user IDs
    const attendanceLogsResponse = await directusFetch(
      `/items/attendance_log?fields=user_id&limit=-1`
    );

    const attendanceLogs = attendanceLogsResponse.data || [];
    const uniqueUserIds = [...new Set(attendanceLogs.map((log: any) => log.user_id))];

    if (uniqueUserIds.length === 0) {
      return NextResponse.json({ users: [] }, { status: 200 });
    }

    // Fetch user details for each unique user ID
    const usersPromises = uniqueUserIds.map((userId) =>
      directusFetch(
        `/items/user?filter[user_id][_eq]=${userId}&fields=user_id,user_fname,user_mname,user_lname,user_email,user_department`
      )
        .then((res) => res.data?.[0])
        .catch(() => null)
    );

    const usersData = await Promise.all(usersPromises);
    const filteredUsers = usersData.filter((u) => u !== null);

    // Fetch department names for each user
    const deptIds = [...new Set(filteredUsers.map((u: any) => u.user_department).filter(Boolean))];
    const deptsPromises = deptIds.map((deptId) =>
      directusFetch(`/items/department/${deptId}?fields=department_id,department_name`)
        .then((res) => res.data)
        .catch(() => null)
    );
    const deptsData = await Promise.all(deptsPromises);
    const deptsMap = new Map(deptsData.filter((d) => d).map((d: any) => [d.department_id, d.department_name]));

    // Enrich users with department names
    const enrichedUsers = filteredUsers.map((user: any) => ({
      ...user,
      department_name: user.user_department ? deptsMap.get(user.user_department) || "N/A" : null,
    }));

    return NextResponse.json({ users: enrichedUsers }, { status: 200 });
  } catch (error) {
    console.error("Error fetching users with attendance logs:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch users";
    return NextResponse.json({ message }, { status: 500 });
  }
}
