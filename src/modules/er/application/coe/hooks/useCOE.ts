"use client";

import { useState, useCallback, useEffect } from "react";
import { COERequest, CreateCOEInput, UpdateCOEInput } from "../type";
import { toast } from "sonner";

export function useCOE() {
  const [requests, setRequests] = useState<COERequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/er/application/coe", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch COE requests");
      setRequests(data.data ?? []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const createRequest = async (data: CreateCOEInput) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/er/application/coe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to create COE request");

      setRequests((prev) => [result.data, ...prev]);
      toast.success("COE request submitted successfully");
      return result.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateRequest = async (id: number, data: UpdateCOEInput) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/er/application/coe/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to update COE request");

      setRequests((prev) =>
        prev.map((item) => (item.id === id ? result.data : item))
      );
      toast.success("COE request updated successfully");
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
    refresh: fetchRequests,
  };
}
