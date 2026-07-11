"use client";

import { useState } from "react";
import { useSupervisorWER } from "./hooks/useSupervisorWER";
import { WeeklyReportHeader } from "./components/WeeklyReportHeader";
import { ReturnedItemsSection } from "./components/ReturnedItemsSection";
import { ExpenseLinesTable } from "./components/ExpenseLinesTable";
import { ExpenseLineModal } from "./components/ExpenseLineModal";
import type { ExpenseDraft } from "./types/supervisor-wer.schema";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, Settings, ClipboardList, CheckCircle2, ChevronRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface SupervisorWERModuleProps {
  userId: number;
}

export default function SupervisorWERModule({ userId }: SupervisorWERModuleProps) {
  const {
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
    handleCreateHeader,
    handleSaveExpense,
    handleDeleteExpense,
    handleSubmitWeekly,
  } = useSupervisorWER(userId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExpenseDraft | null>(null);

  const openAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: ExpenseDraft) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const totalAmount = expenses.reduce((sum, item) => sum + item.amount, 0);

  const isLocked = !!voucher && (
    ["Submitted", "Approved", "Paid"].includes(voucher.status) ||
    (voucher.status === "Rejected" && expenses.length <= 1)
  );

  const supplierId = header
    ? (typeof header.payee_id === "object" && header.payee_id !== null ? header.payee_id.id : header.payee_id)
    : null;

  const currentSupplier = suppliers.find((s) => s.id === supplierId);
  const defaultPayeeName = currentSupplier?.supplier_name || 
    (header && typeof header.payee_id === "object" && header.payee_id !== null ? header.payee_id.supplier_name : "");

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Title & Hero */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200/50 dark:border-white/5 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">
            Supervisor Weekly Expense Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Compile, review, and authorize weekly supplier expense sheets directly to the Bulk Approval queue.
          </p>
        </div>

        {/* Wizard Steps Indicator */}
        <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-white/[0.02] p-1.5 rounded-2xl border border-slate-200/60 dark:border-white/5">
          <div
            onClick={() => setStep(1)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
              step === 1
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <Settings className="h-3.5 w-3.5" />
            <span>1. Header Config</span>
            {selectedHeaderId && <CheckCircle2 className="h-3 w-3 text-cyan-200" />}
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-slate-350" />
          <div
            onClick={() => selectedHeaderId && setStep(2)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
              step === 2
                ? "bg-cyan-600 text-white shadow-sm"
                : selectedHeaderId
                ? "text-slate-500 hover:text-slate-850 dark:hover:text-slate-200 cursor-pointer"
                : "text-slate-300 dark:text-white/10 cursor-not-allowed"
            )}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            <span>2. Line Encoding</span>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="rounded-2xl border-rose-500/20 bg-rose-500/5 text-rose-800 dark:text-rose-400 animate-in fade-in duration-200">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="font-bold">System Error</AlertTitle>
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {!isLoading && suppliers.length === 0 && (
        <Alert variant="destructive" className="rounded-2xl border-rose-500/20 bg-rose-500/5 text-rose-800 dark:text-rose-400">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="font-bold">Account Configuration Required</AlertTitle>
          <AlertDescription className="text-xs font-semibold">
            Your supervisor account is not assigned to any supplier payee. Please contact an administrator to get assigned to a supplier in the suppliers directory.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Header Controller */}
      <WeeklyReportHeader
        suppliers={suppliers}
        headersList={headersList}
        selectedHeaderId={selectedHeaderId}
        onHeaderChange={setSelectedHeaderId}
        onCreateHeader={handleCreateHeader}
        header={header}
        voucher={voucher}
        onSubmit={handleSubmitWeekly}
        isLoading={isLoading}
        totalExpensesCount={expenses.length}
        totalExpensesAmount={totalAmount}
        step={step}
        setStep={setStep}
      />

      {/* Conditional steps view rendering */}
      {step === 2 && header && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Flagged Concerns Alerts */}
          <ReturnedItemsSection
            items={returnedExpenses}
            onEditResolve={openEditModal}
            isLoading={isLoading}
            isLocked={isLocked}
          />

          {/* Table grid loading wrapper */}
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/40 dark:bg-slate-950/40 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-2xl">
                <Spinner className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
              </div>
            )}

            <ExpenseLinesTable
              expenses={expenses}
              voucher={voucher}
              onEdit={openEditModal}
              onDelete={handleDeleteExpense}
              onAddClick={openAddModal}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}

      {/* Add / Edit modal */}
      <ExpenseLineModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveExpense}
        coaList={coaList}
        editingItem={editingItem}
        defaultPayeeName={defaultPayeeName}
        periodFrom={header?.period_from}
        periodTo={header?.period_to}
      />
    </div>
  );
}
