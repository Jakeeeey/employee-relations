"use client";

import { useState, useEffect, useCallback } from "react";
import { AttendanceLog, User, AttendanceChangeRequest, LeaveRequest, UndertimeRequest } from "../type";
import { toast } from "sonner";

interface UseAttendanceReportReturn {
  user: User | null;
  attendanceLogs: AttendanceLog[];
  changeRequests: AttendanceChangeRequest[];
  leaveRequests: LeaveRequest[];
  undertimeRequests: UndertimeRequest[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAttendanceReport(userId?: number): UseAttendanceReportReturn {
  const [user, setUser] = useState<User | null>(null);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [changeRequests, setChangeRequests] = useState<AttendanceChangeRequest[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [undertimeRequests, setUndertimeRequests] = useState<UndertimeRequest[]>([]);
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
      const res = await fetch(`/api/er/attendance-report?userId=${userId}`, {
        cache: 'no-cache'
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch attendance report");
      }

      setUser(data.user);
      
      const fetchedRequests = data.changeRequests || [];
      setChangeRequests(fetchedRequests);

      const fetchedLeaves = data.leaveRequests || [];
      setLeaveRequests(fetchedLeaves);

      const fetchedUndertimes = data.undertimeRequests || [];
      setUndertimeRequests(fetchedUndertimes);

      // Merge pending request indicator, leave status, and undertime status into logs
      const mergedLogs = (data.attendanceLogs || []).map((log: AttendanceLog) => {
        // Find if this specific log_date has a pending request
        const logDateStr = new Date(log.log_date).toISOString().split('T')[0];
        const pendingReq = fetchedRequests.find((req: AttendanceChangeRequest) => {
          const reqDateStr = new Date(req.log_date).toISOString().split('T')[0];
          return reqDateStr === logDateStr;
        });

        // Find if log_date is within any leave request
        const leave = fetchedLeaves.find((l: LeaveRequest) => {
          if (!l.leave_start || !l.leave_end || !log.log_date) return false;
          if (l.status !== 'approved' && l.status !== 'pending') return false;
          
          const logDateStrForLeave = log.log_date.split('T')[0];
          const startDateStr = l.leave_start.split('T')[0];
          const endDateStr = l.leave_end.split('T')[0];

          return logDateStrForLeave >= startDateStr && logDateStrForLeave <= endDateStr;
        });
        
        // Find if this specific log_date has an approved undertime
        const undertime = fetchedUndertimes.find((u: UndertimeRequest) => {
          if (!u.request_date || !log.log_date) return false;
          if (u.status !== 'approved' && u.status !== 'pending') return false;
          
          const uDateStr = u.request_date.split('T')[0];
          return uDateStr === logDateStr;
        });

        return {
          ...log,
          has_pending_change_request: !!pendingReq,
          pending_change_request: pendingReq || undefined,
          is_on_leave: !!leave && leave.status === 'approved',
          is_pending_leave: !!leave && leave.status === 'pending',
          leave_details: leave || undefined,
          is_undertime: !!undertime,
          undertime_details: undertime || undefined,
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
    leaveRequests,
    undertimeRequests,
    isLoading,
    error,
    refresh: fetchData,
  };
}
