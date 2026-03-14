import { useState, useCallback, useEffect } from "react";
import { OvertimeRequest, CreateOvertimeInput, UpdateOvertimeInput } from "../types";
import { toast } from "sonner";

export function useOvertime(userId?: number) {
  const [requests, setRequests] = useState<OvertimeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = userId 
        ? `/api/employee-relations/application/overtime?userId=${userId}`
        : "/api/employee-relations/application/overtime";
        
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch overtime requests");
      setRequests(data.data);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const createRequest = async (data: CreateOvertimeInput) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/employee-relations/application/overtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to create request");
      
      setRequests((prev) => [result.data, ...prev]);
      toast.success("Overtime request created successfully");
      return result.data;
    } catch (err: any) {
      toast.error(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateRequest = async (id: number, data: UpdateOvertimeInput) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/employee-relations/application/overtime/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to update request");
      
      setRequests((prev) =>
        prev.map((item) => (item.overtime_id === id ? result.data : item))
      );
      toast.success("Overtime request updated successfully");
      return result.data;
    } catch (err: any) {
      toast.error(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    requests,
    isLoading,
    error,
    createRequest,
    updateRequest,
    fetchRequests,
  };
}
