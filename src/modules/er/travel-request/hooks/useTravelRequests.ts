/* eslint-disable @typescript-eslint/no-explicit-any */
 
 
"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { TravelRequest, TravelRequestFormInput } from "../types/schema";

export function useTravelRequests() {
  const [data, setData] = useState<TravelRequest[]>([]);
  const [coas, setCoas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [reqRes, coaRes] = await Promise.all([
        fetch("/api/er/travel-request"),
        fetch("/api/er/travel-request/coa")
      ]);

      if (!reqRes.ok) {
        const errData = await reqRes.json();
        throw new Error(errData.message || "Failed to fetch travel requests");
      }
      const json = await reqRes.json();
      setData(json.data || []);

      if (coaRes.ok) {
        const coaJson = await coaRes.json();
        setCoas(coaJson.data || []);
      }
    } catch (err: any) {
      setError(err.message);
      toast.error("Error", { description: err.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const createRequest = async (payload: TravelRequestFormInput) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/er/travel-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to create travel request");
      }

      toast.success("Success", { description: "Travel request created successfully" });
      await fetchRequests(); // refresh list
    } catch (err: any) {
      toast.error("Error", { description: err.message });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRequest = async (id: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/er/travel-request/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to delete travel request");
      }

      toast.success("Success", { description: "Travel request deleted successfully" });
      await fetchRequests(); // refresh list
    } catch (err: any) {
      toast.error("Error", { description: err.message });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/er/travel-request/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to update travel request status");
      }

      toast.success("Success", { description: "Travel request updated successfully" });
      await fetchRequests(); // refresh list
    } catch (err: any) {
      toast.error("Error", { description: err.message });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    coas,
    isLoading,
    error,
    refresh: fetchRequests,
    createRequest,
    deleteRequest,
    updateStatus,
  };
}


