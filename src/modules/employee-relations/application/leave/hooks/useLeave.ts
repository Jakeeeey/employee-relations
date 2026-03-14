"use client";

import { useState, useEffect, useCallback } from "react";
import { LeaveRequest, CreateLeaveInput, UpdateLeaveInput } from "../types";
import { toast } from "sonner";

export function useLeave(userId?: number) {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaves = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = userId 
        ? `/api/employee-relations/application/leave?userId=${userId}`
        : "/api/employee-relations/application/leave";
        
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch leaves");
      setLeaves(data.data);
    } catch (err: any) {
      setError(err.message);
      toast.error("Error", { description: err.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createLeave = async (input: CreateLeaveInput) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/employee-relations/application/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create leave");
      
      toast.success("Success", { description: "Leave request submitted successfully" });
      fetchLeaves();
      return data.data;
    } catch (err: any) {
      toast.error("Error", { description: err.message });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateLeave = async (id: number, input: UpdateLeaveInput) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/employee-relations/application/leave/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update leave");

      toast.success("Success", { description: "Leave request updated successfully" });
      fetchLeaves();
      return data.data;
    } catch (err: any) {
      toast.error("Error", { description: err.message });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  return {
    leaves,
    isLoading,
    error,
    refresh: fetchLeaves,
    createLeave,
    updateLeave,
  };
}
