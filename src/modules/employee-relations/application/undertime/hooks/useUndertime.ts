import { useState, useCallback, useEffect } from "react";
import { UndertimeRequest, CreateUndertimeInput, UpdateUndertimeInput } from "../types";
import { toast } from "sonner";

export function useUndertime(userId?: number) {
  const [requests, setRequests] = useState<UndertimeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = userId 
        ? `/api/employee-relations/application/undertime?userId=${userId}`
        : "/api/employee-relations/application/undertime";
        
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch undertime requests");
      setRequests(data.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const createRequest = async (data: CreateUndertimeInput) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/employee-relations/application/undertime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to create request");
      
      setRequests((prev) => [result.data, ...prev]);
      toast.success("Undertime request created successfully");
      return result.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateRequest = async (id: number, data: UpdateUndertimeInput) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/employee-relations/application/undertime/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to update request");
      
      setRequests((prev) =>
        prev.map((item) => (item.undertime_id === id ? result.data : item))
      );
      toast.success("Undertime request updated successfully");
      return result.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      toast.error(message);
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
