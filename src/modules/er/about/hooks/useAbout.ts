import { useState, useCallback, useEffect } from "react";
import { Company, CompanyHandbook } from "../types";

export function useCompany() {
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState<any>(null);

  const fetchCompany = useCallback(async () => {
    setIsLoading(true);
    setIsError(null);
    try {
      const response = await fetch("/api/er/about/company");
      if (!response.ok) throw new Error("Failed to fetch company profile");
      const data = await response.json();
      setCompany(data);
    } catch (error) {
      setIsError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  return {
    company,
    isLoading,
    isError,
    refresh: fetchCompany,
  };
}

export function useHandbooks() {
  const [handbooks, setHandbooks] = useState<CompanyHandbook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState<any>(null);

  const fetchHandbooks = useCallback(async () => {
    setIsLoading(true);
    setIsError(null);
    try {
      const response = await fetch("/api/er/about/handbooks");
      if (!response.ok) throw new Error("Failed to fetch handbooks");
      const data = await response.json();
      setHandbooks(data);
    } catch (error) {
      setIsError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHandbooks();
  }, [fetchHandbooks]);

  return {
    handbooks,
    isLoading,
    isError,
    refresh: fetchHandbooks,
  };
}
