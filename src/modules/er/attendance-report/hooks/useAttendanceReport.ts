"use client";

import { useState, useEffect, useCallback } from "react";
import { AttendanceLog, User } from "../type";
import { toast } from "sonner";

interface UseAttendanceReportReturn {
  user: User | null;
  attendanceLogs: AttendanceLog[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAttendanceReport(userId?: number): UseAttendanceReportReturn {
  const [user, setUser] = useState<User | null>(null);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) {
      setError("User ID is required");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/er/attendance-report?userId=${userId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch attendance report");
      }

      setUser(data.user);
      setAttendanceLogs(data.attendanceLogs || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      setError(message);
      toast.error("Error", { description: message });
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    user,
    attendanceLogs,
    isLoading,
    error,
    refresh: fetchData,
  };
}
