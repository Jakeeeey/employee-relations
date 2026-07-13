"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type {
  Supplier,
  ExpenseDraft,
  ExpenseDraftHeader,
  COA,
  DisbursementDraft,
} from "../types/supervisor-wer.schema";
import {
  fetchSuppliersList,
  fetchHeadersList,
  createHeader,
  fetchWeeklyHeader,
  fetchExpenses,
  fetchReturnedExpenses,
  fetchChartOfAccounts,
  createOrUpdateExpense,
  deleteExpense,
  submitWeeklyReport,
} from "../services/supervisorWER";

interface UseSupervisorWERReturn {
  suppliers: Supplier[];
  headersList: ExpenseDraftHeader[];
  selectedHeaderId: number | null;
  setSelectedHeaderId: (id: number | null) => void;
  header: ExpenseDraftHeader | null;
  voucher: DisbursementDraft | null;
  expenses: ExpenseDraft[];
  returnedExpenses: ExpenseDraft[];
  coaList: COA[];
  isLoading: boolean;
  error: string | null;
  step: number;
  setStep: (step: number) => void;
  refresh: () => Promise<void>;
  handleCreateHeader: (payload: {
    payee_id: number;
    period_from: string;
    period_to: string;
    remarks?: string;
  }) => Promise<ExpenseDraftHeader>;
  handleSaveExpense: (data: Partial<ExpenseDraft>) => Promise<void>;
  handleDeleteExpense: (id: number) => Promise<void>;
  handleSubmitWeekly: (remarks?: string) => Promise<void>;
}

/**
 * Custom React hook that orchestrates state and mutations for the Supervisor WER module.
 * @param {number} supervisorId - The logged-in supervisor's user ID.
 * @returns {UseSupervisorWERReturn} The composed state and handlers for the UI.
 */
export function useSupervisorWER(supervisorId: number): UseSupervisorWERReturn {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [headersList, setHeadersList] = useState<ExpenseDraftHeader[]>([]);
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);

  const [header, setHeader] = useState<ExpenseDraftHeader | null>(null);
  const [voucher, setVoucher] = useState<DisbursementDraft | null>(null);
  const [expenses, setExpenses] = useState<ExpenseDraft[]>([]);
  const [returnedExpenses, setReturnedExpenses] = useState<ExpenseDraft[]>([]);
  const [coaList, setCoaList] = useState<COA[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wizard Step State: 1 = Selection/Creation, 2 = Expense Lines Editor
  const [step, setStep] = useState<number>(1);

  // Initial load for suppliers, Chart of Accounts, and headers list
  const loadInitial = useCallback(async () => {
    setIsLoading(true);
    try {
      const [suppliersList, coas, list] = await Promise.all([
        fetchSuppliersList(),
        fetchChartOfAccounts(),
        fetchHeadersList(),
      ]);
      setSuppliers(suppliersList);
      setCoaList(coas);
      setHeadersList(list);
      if (list.length > 0 && selectedHeaderId === null) {
        setSelectedHeaderId(list[0].id);
      }
    } catch (err: unknown) {
      console.error("Error loading initial WER data:", err);
      const errMsg = err instanceof Error ? err.message : "Failed to load initial workspace configuration";
      setError(errMsg);
      toast.error("Error", { description: errMsg });
    } finally {
      setIsLoading(false);
    }
  }, [selectedHeaderId]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // Primary fetch for selected header details
  const fetchData = useCallback(async () => {
    if (!selectedHeaderId) {
      setHeader(null);
      setVoucher(null);
      setExpenses([]);
      setReturnedExpenses([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch header details & related voucher
      const { header: currentHeader, voucher: currentVoucher } = await fetchWeeklyHeader(
        selectedHeaderId
      );
      setHeader(currentHeader);
      setVoucher(currentVoucher);

      if (currentHeader) {
        // Resolve supplier ID
        const supplierId = typeof currentHeader.payee_id === "object" && currentHeader.payee_id !== null
          ? currentHeader.payee_id.id
          : currentHeader.payee_id;

        // 2. Fetch expenses and returned items in parallel
        const [expensesList, returnedList] = await Promise.all([
          fetchExpenses(currentHeader.id),
          supplierId ? fetchReturnedExpenses(supplierId) : Promise.resolve([]),
        ]);
        setExpenses(expensesList);
        setReturnedExpenses(returnedList);
      } else {
        setExpenses([]);
        setReturnedExpenses([]);
      }
    } catch (err: unknown) {
      console.error("Error fetching weekly expense report data:", err);
      const errMsg = err instanceof Error ? err.message : "Failed to fetch data for selected report header";
      setError(errMsg);
      toast.error("Error", { description: errMsg });
    } finally {
      setIsLoading(false);
    }
  }, [selectedHeaderId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Action to create a new weekly report header.
   */
  const handleCreateHeader = async (payload: {
    payee_id: number;
    period_from: string;
    period_to: string;
    remarks?: string;
  }) => {
    setIsLoading(true);
    try {
      const newHeader = await createHeader(payload);
      toast.success("Success", { description: "Weekly report header created successfully." });
      
      // Reload list and set newly created header as active
      const list = await fetchHeadersList();
      setHeadersList(list);
      setSelectedHeaderId(newHeader.id);
      setStep(2); // Auto proceed to Step 2 (lines editor)
      return newHeader;
    } catch (err: unknown) {
      console.error("Error creating header:", err);
      const errMsg = err instanceof Error ? err.message : "Failed to create header";
      toast.error("Error", { description: errMsg });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handler to save (create or update) an expense line item.
   * @param {Partial<ExpenseDraft>} expenseData - The data to save.
   */
  const handleSaveExpense = async (expenseData: Partial<ExpenseDraft>) => {
    if (!header) {
      toast.error("Error", { description: "Weekly report header is not selected" });
      return;
    }

    const supplierId = typeof header.payee_id === "object" && header.payee_id !== null
      ? header.payee_id.id
      : header.payee_id;

    if (!supplierId) {
      toast.error("Error", { description: "No supplier payee associated with this header" });
      return;
    }

    const supplier = suppliers.find((s) => s.id === supplierId);
    const supplierName = supplier?.supplier_name || 
      (typeof header.payee_id === "object" && header.payee_id !== null ? header.payee_id.supplier_name : `Supplier #${supplierId}`);

    const payload = {
      ...expenseData,
      header_id: header.id,
      encoded_by: supervisorId,
      division_id: header.division_id,
      payee_id: supplierId,
      payee: supplierName,
    };

    setIsLoading(true);
    try {
      await createOrUpdateExpense(payload);
      toast.success("Success", { description: "Expense item saved successfully" });
      await fetchData();
    } catch (err: unknown) {
      console.error("Error saving expense:", err);
      const errMsg = err instanceof Error ? err.message : "Failed to save item";
      toast.error("Error", { description: errMsg });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handler to delete an expense line item.
   * @param {number} id - Expense ID to delete.
   */
  const handleDeleteExpense = async (id: number) => {
    setIsLoading(true);
    try {
      await deleteExpense(id);
      toast.success("Success", { description: "Expense line deleted" });
      await fetchData();
    } catch (err: unknown) {
      console.error("Error deleting expense:", err);
      const errMsg = err instanceof Error ? err.message : "Failed to delete line";
      toast.error("Error", { description: errMsg });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handler to approve the weekly report lines and submit the disbursement voucher.
   * @param {string} [remarks] - Voucher general remarks.
   */
  const handleSubmitWeekly = async (remarks?: string) => {
    if (!header || expenses.length === 0) {
      toast.error("Error", { description: "No expenses to submit for this header" });
      return;
    }

    const supplierId = typeof header.payee_id === "object" && header.payee_id !== null
      ? header.payee_id.id
      : header.payee_id;

    if (!supplierId) {
      toast.error("Error", { description: "Supplier payee not found on header" });
      return;
    }

    // Client-side validation: Ensure submission remarks are provided
    if (!remarks || !remarks.trim()) {
      toast.error("Submission Failed", {
        description: "Submission remarks are required.",
      });
      return;
    }

    // Client-side validation: Ensure all lines have a valid receipt attachment
    const missingAttachment = expenses.find((exp) => !exp.attachment_url);
    if (missingAttachment) {
      toast.error("Submission Failed", {
        description: "Cannot submit weekly report: all lines must have a valid receipt attachment.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const ids = expenses.map((e) => e.id);
      const res = await submitWeeklyReport({
        header_id: header.id,
        supplier_id: supplierId,
        expense_ids: ids,
        remarks,
      });

      if (res.ok) {
        toast.success("Success", {
          description: `Voucher ${res.doc_no} submitted successfully to Bulk Approval.`,
        });
        // Re-fetch header details and refresh headers list status
        const updatedList = await fetchHeadersList();
        setHeadersList(updatedList);
        await fetchData();
        setStep(1); // Return to list view upon submission
      } else {
        toast.error("Submission Failed", { description: res.error || "Could not consolidate voucher" });
      }
    } catch (err: unknown) {
      console.error("Submission error:", err);
      const errMsg = err instanceof Error ? err.message : "Could not consolidate voucher";
      toast.error("Submission Failed", { description: errMsg });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    suppliers,
    headersList,
    selectedHeaderId,
    setSelectedHeaderId,
    header,
    voucher,
    expenses,
    returnedExpenses,
    coaList,
    isLoading,
    error,
    step,
    setStep,
    refresh: fetchData,
    handleCreateHeader,
    handleSaveExpense,
    handleDeleteExpense,
    handleSubmitWeekly,
  };
}
