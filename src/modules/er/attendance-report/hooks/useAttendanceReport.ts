"use client";

import { useState, useEffect, useCallback } from "react";
import { AttendanceLog, User, AttendanceChangeRequest } from "../type";
import { toast } from "sonner";

interface UseAttendanceReportReturn {
  user: User | null;
  attendanceLogs: AttendanceLog[];
  changeRequests: AttendanceChangeRequest[]; // Or AttendanceChangeRequest[] if imported
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAttendanceReport(userId?: number): UseAttendanceReportReturn {
  const [user, setUser] = useState<User | null>(null);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [changeRequests, setChangeRequests] = useState<AttendanceChangeRequest[]>([]);
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
      
      const fetchedRequests = data.changeRequests || [];
      setChangeRequests(fetchedRequests);

      // Merge pending request indicator into logs
      const mergedLogs = (data.attendanceLogs || []).map((log: AttendanceLog) => {
        // Find if this specific log_date has a pending request
        const logDateStr = new Date(log.log_date).toISOString().split('T')[0];
        const pendingReq = fetchedRequests.find((req: AttendanceChangeRequest) => {
          const reqDateStr = new Date(req.log_date).toISOString().split('T')[0];
          return reqDateStr === logDateStr;
        });
        
        return {
          ...log,
          has_pending_change_request: !!pendingReq,
          pending_change_request: pendingReq || undefined,
        };
      });

      setAttendanceLogs(mergedLogs);
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
    changeRequests,
    isLoading,
    error,
    refresh: fetchData,
  };
}
