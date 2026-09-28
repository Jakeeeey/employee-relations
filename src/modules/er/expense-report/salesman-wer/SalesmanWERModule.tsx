"use client";

import { useState, useEffect } from "react";
import { useSalesmanWER } from "./hooks/useSalesmanWER";
import { WeeklyReportHeader } from "./components/WeeklyReportHeader";
import { ExpenseLinesTable } from "./components/ExpenseLinesTable";
import { ExpenseLineModal } from "./components/ExpenseLineModal";
import type { ExpenseDraft } from "./types/salesman-wer.schema";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, Settings, ClipboardList, CheckCircle2, ChevronRight, Bell, CheckCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "./store/notificationStore";
import {
  getActionRequiredNotifications,
  getMarkableNotificationIds,
  getVisibleNotifications,
  isNotificationHighlighted,
  isPersistentActionNotification,
  sortWerNotificationsByPriority,
  type SalesmanWerNotification,
} from "./notifications";

interface SalesmanWERModuleProps {
  userId: number;
}

export default function SalesmanWERModule({ userId }: SalesmanWERModuleProps) {
  const {
    suppliers,
    headersList,
    selectedHeaderId,
    setSelectedHeaderId,
    header,
    voucher,
    expenses,
    returnedExpenses,
    attachments,
    attachmentQuerySuccess,
    coaList,
    isLoading,
    error,
    step,
    setStep,
    handleCreateHeader,
    handleSaveExpense,
    handleDeleteExpense,
    handleUploadWER,
    handleDeleteWER,
  } = useSalesmanWER(userId);

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



  const { seenIds, markAsSeen, markAllAsSeen } = useNotificationStore();

  const isLocked = !!voucher && (
    ["submitted", "approved", "paid"].includes(voucher.status.toLowerCase()) ||
    voucher.status.toLowerCase().startsWith("pending_") ||
    (voucher.status.toLowerCase() === "rejected" && expenses.length <= 1)
  ) || expenses.some((expense) => expense.status === "Approved");

  const supplierId = header
    ? (typeof header.payee_id === "object" && header.payee_id !== null ? header.payee_id.id : header.payee_id)
    : null;

  const currentSupplier = suppliers.find((s) => s.id === supplierId);
  const defaultPayeeName = currentSupplier?.supplier_name || 
    (header && typeof header.payee_id === "object" && header.payee_id !== null ? header.payee_id.supplier_name : "");

  const allNotifications = sortWerNotificationsByPriority(
    getVisibleNotifications([], returnedExpenses)
  );
  const actionRequiredNotifications = getActionRequiredNotifications(allNotifications, seenIds);
  const actionRequiredCount = actionRequiredNotifications.length;
  const markableNotificationIds = getMarkableNotificationIds(allNotifications, seenIds);

  useEffect(() => {
    if (isLoading) return;

    // 1. Auto-popup With Concern items on refresh/load
    const withConcernItem = returnedExpenses.find((e) => e.status === "With Concern");
    if (withConcernItem) {
      setSelectedHeaderId(withConcernItem.header_id);
      setStep(2);
      const timer = setTimeout(() => {
        setEditingItem(withConcernItem);
        setIsModalOpen(true);
      }, 150);
      return () => clearTimeout(timer);
    }


  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Title & Hero */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200/50 dark:border-white/5 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">
            Salesman Weekly Expense Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Compile, review, and maintain weekly supplier expense sheets until approval locks the report.
          </p>
        </div>

        {/* Wizard Steps Indicator & Notifications */}
        <div className="flex items-center gap-3">
          {allNotifications.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <button className="relative p-2.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/10 hover:bg-rose-100/50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-455 border border-rose-200/40 dark:border-rose-900/20 transition-all cursor-pointer transform active:scale-95 flex items-center justify-center">
                  <Bell className="h-4.5 w-4.5" />
                  {actionRequiredCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-black text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                      {actionRequiredCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-85 p-0 rounded-2xl border-slate-200 dark:border-white/10 shadow-xl bg-white dark:bg-slate-900 z-50 overflow-hidden" align="end">
                <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-slate-950/10 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Action Required ({actionRequiredCount})</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Returned or flagged items waiting for correction</p>
                  </div>
                  {markableNotificationIds.length > 0 && (
                    <button
                      onClick={() => markAllAsSeen(markableNotificationIds)}
                      className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-[26rem] overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 pb-2 scrollbar-thin">
                  {allNotifications.map((item: SalesmanWerNotification) => {
                    const isHighlighted = isNotificationHighlighted(item, seenIds);
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (!isPersistentActionNotification(item)) {
                            markAsSeen(item.id);
                          }
                          setSelectedHeaderId(item.header_id);
                          setStep(2);
                          if (item.status === "With Concern") {
                            setTimeout(() => openEditModal(item), 100);
                          }
                        }}
                        className={cn(
                          "p-3.5 hover:bg-slate-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors text-xs space-y-1.5 relative",
                          isHighlighted
                            ? "bg-rose-500/[0.015] dark:bg-rose-500/[0.005] text-slate-800 dark:text-slate-200 font-medium"
                            : "opacity-60 text-slate-550 dark:text-slate-400"
                        )}
                      >
                        {isHighlighted && (
                          <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                        )}
                        <div className="flex items-center gap-1.5 flex-wrap pr-4">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
                            item.status === "Rejected" ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400" : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                          )}>
                            {item.status}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">{item.transaction_date}</span>
                          <span className="font-bold truncate max-w-[120px]">Payee: {item.payee}</span>
                        </div>
                        {item.feedback && (
                          <p className="text-[10px] text-rose-600 dark:text-rose-450 italic bg-rose-50/50 dark:bg-rose-950/10 p-2 rounded border border-rose-500/5 leading-relaxed">
                            &ldquo;{item.feedback}&rdquo;
                          </p>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100/50 dark:border-white/[0.02] mt-1">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Flagged Amount</span>
                          <span className="font-black text-rose-600 dark:text-rose-400 text-xs">
                            ₱{item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Wizard Steps Indicator */}
          <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-white/[0.02] p-1.5 rounded-2xl border border-slate-200/60 dark:border-white/5">
            <div
              onClick={() => setStep(1)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                step === 1
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-855 dark:hover:text-slate-250"
              )}
            >
              <Settings className="h-3.5 w-3.5" />
              <span>1. Header Config</span>
              {selectedHeaderId && <CheckCircle2 className="h-3 w-3 text-cyan-200" />}
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <div
              onClick={() => selectedHeaderId && setStep(2)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                step === 2
                  ? "bg-cyan-600 text-white shadow-sm"
                  : selectedHeaderId
                  ? "text-slate-500 hover:text-slate-855 dark:hover:text-slate-250 cursor-pointer"
                  : "text-slate-300 dark:text-white/10 cursor-not-allowed"
              )}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              <span>2. Line Encoding</span>
            </div>
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
            Your salesman account is not assigned to any supplier payee. Please contact an administrator to get assigned to a supplier in the suppliers directory.
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
        attachments={attachments}
        attachmentQuerySuccess={attachmentQuerySuccess}
        onUploadWER={handleUploadWER}
        onDeleteWER={handleDeleteWER}
        isLoading={isLoading}
        totalExpensesCount={expenses.length}
        totalExpensesAmount={totalAmount}
        step={step}
        setStep={setStep}
        isReportFinalized={isLocked}
      />

      {/* Conditional steps view rendering */}
      {step === 2 && header && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
              isLocked={isLocked}
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
