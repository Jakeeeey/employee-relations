"use client";

import { useState, useCallback, useEffect } from "react";
import { Concern, CreateConcernInput, UpdateConcernInput } from "../type";
import { toast } from "sonner";

export function useConcern() {
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConcerns = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/er/application/concern", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch concerns");
      setConcerns(data.data ?? []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConcerns();
  }, [fetchConcerns]);

  const createConcern = async (data: CreateConcernInput) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/er/application/concern", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to submit concern");

      setConcerns((prev) => [result.data, ...prev]);
      toast.success("Concern submitted successfully");
      return result.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateConcern = async (id: number, data: UpdateConcernInput) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/er/application/concern/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to update concern");

      setConcerns((prev) =>
        prev.map((item) => (item.id === id ? result.data : item))
      );
      toast.success("Concern updated successfully");
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
    concerns,
    isLoading,
    error,
    createConcern,
    updateConcern,
    refresh: fetchConcerns,
  };
}
