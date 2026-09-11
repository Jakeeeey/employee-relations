import { useState, useCallback, useEffect } from "react";
import { CreateLguLeaveInput, LguLeaveRequest } from "../types";
import { toast } from "sonner";

export function useLguLeave(userId?: number | null) {
  const [requests, setRequests] = useState<LguLeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState<unknown>(null);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setIsError(null);
    try {
      const url = userId
        ? `/api/er/lgu-leave-request?user_id=${userId}`
        : `/api/er/lgu-leave-request`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to load LGU leave requests (${res.status})`);
      }
      const json = await res.json();
      setRequests(json.data || []);
    } catch (err) {
      console.error("Error fetching LGU leave requests:", err);
      setIsError(err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const createRequest = async (input: CreateLguLeaveInput): Promise<boolean> => {
    try {
      const res = await fetch("/api/er/lgu-leave-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to submit leave application");
      }

      toast.success("Civil Service Form No. 6 Submitted", {
        description: "Your application for leave has been queued for evaluation.",
      });
      await fetchRequests();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission error";
      toast.error("Filing Failed", { description: msg });
      return false;
    }
  };

  const cancelRequest = async (id: number): Promise<boolean> => {
    try {
      const res = await fetch(`/api/er/lgu-leave-request/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to cancel request");
      }

      toast.success("Application Cancelled", {
        description: "Your leave application has been marked as cancelled.",
      });
      await fetchRequests();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Action failed";
      toast.error("Cancel Failed", { description: msg });
      return false;
    }
  };

  return {
    requests,
    isLoading,
    isError,
    refresh: fetchRequests,
    createRequest,
    cancelRequest,
  };
}
