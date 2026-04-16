import type { AttendanceLog, User } from "../type";

export async function fetchAttendanceReport(userId: number) {
  try {
    const response = await fetch(
      `/api/employee-relations/attendance-report?userId=${userId}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch attendance report");
    }

    const data = await response.json();

    return {
      user: data.user as User,
      attendanceLogs: (data.attendanceLogs || []) as AttendanceLog[],
    };
  } catch (err) {
    console.error("Error fetching attendance report:", err);
    throw err instanceof Error ? err : new Error("Unknown error occurred");
  }
}
