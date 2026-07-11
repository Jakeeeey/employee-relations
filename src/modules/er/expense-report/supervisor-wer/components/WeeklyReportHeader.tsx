"use client";

import { useState } from "react";
import type { Supplier, ExpenseDraftHeader, DisbursementDraft } from "../types/supervisor-wer.schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Send, Store, Plus, Check, ArrowLeft, ArrowRight, ClipboardList, Info } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import type { StatusTone } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

interface WeeklyReportHeaderProps {
  suppliers: Supplier[];
  headersList: ExpenseDraftHeader[];
  selectedHeaderId: number | null;
  onHeaderChange: (id: number | null) => void;
  onCreateHeader: (payload: {
    payee_id: number;
    period_from: string;
    period_to: string;
    remarks?: string;
  }) => Promise<unknown>;
  header: ExpenseDraftHeader | null;
  voucher: DisbursementDraft | null;
  onSubmit: (remarks?: string) => Promise<void>;
  isLoading: boolean;
  totalExpensesCount: number;
  totalExpensesAmount: number;
  step: number;
  setStep: (step: number) => void;
}

export function WeeklyReportHeader({
  suppliers,
  headersList,
  selectedHeaderId,
  onHeaderChange,
  onCreateHeader,
  header,
  voucher,
  onSubmit,
  isLoading,
  totalExpensesCount,
  totalExpensesAmount,
  step,
  setStep,
}: WeeklyReportHeaderProps) {
  const [newPayeeId, setNewPayeeId] = useState<string>("");
  const [newFromDate, setNewFromDate] = useState("");
  const [newToDate, setNewToDate] = useState("");
  const [newRemarks, setNewRemarks] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [submitRemarks, setSubmitRemarks] = useState("");

  const isLocked = !!voucher && (
    ["Submitted", "Approved", "Paid"].includes(voucher.status) ||
    (voucher.status === "Rejected" && totalExpensesCount <= 1)
  );

  const handleCreate = async () => {
    if (!newPayeeId || !newFromDate || !newToDate) return;
    setIsCreating(true);
    try {
      await onCreateHeader({
        payee_id: Number(newPayeeId),
        period_from: newFromDate,
        period_to: newToDate,
        remarks: newRemarks,
      });
      // Reset form
      setNewPayeeId("");
      setNewFromDate("");
      setNewToDate("");
      setNewRemarks("");
    } catch {
      // errors handled by toast in hook
    } finally {
      setIsCreating(false);
    }
  };

  const getVoucherStatusTone = (status?: string): StatusTone => {
    if (!status) return "neutral";
    const s = status.toLowerCase();
    if (s === "approved" || s === "paid") return "success";
    if (s === "submitted" || s === "pending") return "info";
    if (s === "rejected") return "destructive";
    return "warning";
  };

  const getHeaderStatusTone = (status?: string): StatusTone => {
    if (!status) return "neutral";
    const s = status.toLowerCase();
    if (s === "approved") return "success";
    if (s === "rejected") return "destructive";
    return "warning";
  };

  const getSupplierName = (h: ExpenseDraftHeader) => {
    return typeof h.payee_id === "object" && h.payee_id !== null
      ? h.payee_id.supplier_name
      : `Supplier #${h.payee_id}`;
  };

  // Render Step 1 View: Header Selection and Creation side-by-side dashboard
  if (step === 1) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Left Side: Draft Sheets Cards List (3 Cols) */}
        <Card className="md:col-span-3 border-slate-200/80 dark:border-white/10 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.06)] dark:shadow-none bg-white/70 dark:bg-slate-900/50 backdrop-blur-md flex flex-col min-h-[420px] rounded-3xl">
          <CardHeader className="pb-4 border-b border-slate-200/50 dark:border-white/5">
            <div className="flex items-center gap-2.5">
              <ClipboardList className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              <div>
                <CardTitle className="text-base font-black tracking-tight uppercase italic">Active Reports</CardTitle>
                <CardDescription className="text-xs">Select an existing report draft to manage line items</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[460px]">
            {headersList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[250px] text-center p-6 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl">
                <Store className="h-8 w-8 text-slate-400 mb-2" />
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350">No report drafts found</h4>
                <p className="text-[10px] text-slate-400 max-w-[200px] mt-0.5">Fill out the form on the right to create your first report header.</p>
              </div>
            ) : (
              headersList.map((h) => {
                const isActive = selectedHeaderId === h.id;
                const supplierName = getSupplierName(h);
                return (
                  <div
                    key={h.id}
                    onClick={() => onHeaderChange(h.id)}
                    className={cn(
                      "group p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between min-h-[96px]",
                      isActive
                        ? "border-cyan-500 bg-cyan-500/5 dark:bg-cyan-500/[0.03] shadow-md shadow-cyan-500/5"
                        : "border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/20 dark:bg-slate-950/10 hover:shadow-sm"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="font-black text-xs text-slate-800 dark:text-slate-100 truncate block group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                          {supplierName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                          {h.period_from} to {h.period_to}
                        </span>
                      </div>
                      {(() => {
                        const displayStatus = h.voucher_status ?? h.status ?? "Drafts";
                        const tone = h.voucher_status
                          ? getVoucherStatusTone(h.voucher_status)
                          : getHeaderStatusTone(h.status ?? "Drafts");
                        return <StatusBadge tone={tone}>{displayStatus}</StatusBadge>;
                      })()}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-2 shrink-0">
                      {h.lines_count !== undefined && h.lines_count > 0 ? (
                        <span className="inline-flex items-center text-[9px] font-black px-2 py-0.5 rounded-md bg-cyan-100 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-400 uppercase tracking-wider">
                          {h.lines_count} {h.lines_count === 1 ? "receipt" : "receipts"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[9px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-550 dark:text-slate-400 uppercase tracking-wider">
                          No receipts
                        </span>
                      )}

                      {h.has_concern && (
                        <span className="inline-flex items-center text-[9px] font-black px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-450 uppercase tracking-wider animate-pulse border border-rose-200/20">
                          Attention
                        </span>
                      )}
                    </div>

                    {h.remarks && (
                      <p className="text-[10px] text-slate-550 dark:text-slate-400 truncate mt-2.5 italic">
                        &ldquo;{h.remarks}&rdquo;
                      </p>
                    )}

                    {isActive && (
                      <div className="absolute right-3.5 bottom-3.5 h-5 w-5 rounded-full bg-cyan-500 flex items-center justify-center text-white">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>

          {selectedHeaderId && (
            <div className="p-4 border-t border-slate-200/50 dark:border-white/5 bg-slate-50/30 dark:bg-slate-950/10 rounded-b-3xl">
              <Button
                className="w-full h-11 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md cursor-pointer transition-transform transform active:scale-95 flex items-center justify-center gap-1.5"
                onClick={() => setStep(2)}
              >
                Proceed to Expense Lines
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </Card>

        {/* Right Side: Header Creator Form (2 Cols) */}
        <Card className="md:col-span-2 border-slate-200/80 dark:border-white/10 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.06)] dark:shadow-none bg-white/70 dark:bg-slate-900/50 backdrop-blur-md flex flex-col justify-between rounded-3xl">
          <CardHeader className="pb-4 border-b border-slate-200/50 dark:border-white/5">
            <div className="flex items-center gap-2.5">
              <Plus className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              <div>
                <CardTitle className="text-base font-black tracking-tight uppercase italic">New Report</CardTitle>
                <CardDescription className="text-xs">Define a new period & supplier payee</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 flex-1">
            {/* Supplier select */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Supplier Payee</Label>
              <Select value={newPayeeId} onValueChange={setNewPayeeId}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-slate-950/20 hover:border-cyan-500/50 transition-colors">
                  <SelectValue placeholder="Select supplier payee..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-52">
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)} className="rounded-lg">
                      {s.supplier_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Period From */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Period From</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  <Input
                    type="date"
                    value={newFromDate}
                    onChange={(e) => setNewFromDate(e.target.value)}
                    className="h-10 pl-9 rounded-xl border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-slate-950/20 hover:border-cyan-500/50 cursor-pointer"
                  />
                </div>
              </div>

              {/* Period To */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Period To</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  <Input
                    type="date"
                    value={newToDate}
                    onChange={(e) => setNewToDate(e.target.value)}
                    className="h-10 pl-9 rounded-xl border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-slate-950/20 hover:border-cyan-500/50 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Remarks / Description</Label>
              <Textarea
                placeholder="Enter sheet remarks or description note..."
                value={newRemarks}
                onChange={(e) => setNewRemarks(e.target.value)}
                className="resize-none min-h-[70px] rounded-xl border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-slate-950/20 text-xs"
              />
            </div>
          </CardContent>
          <div className="p-4 border-t border-slate-200/50 dark:border-white/5 bg-slate-50/30 dark:bg-slate-950/10 rounded-b-3xl">
            <Button
              className="w-full h-11 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md cursor-pointer transition-transform transform active:scale-95 flex items-center justify-center gap-1.5"
              onClick={handleCreate}
              disabled={isCreating || !newPayeeId || !newFromDate || !newToDate}
            >
              <Check className="h-4 w-4" />
              Create & Save Header
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Render Step 2 View: Header Summary and Submissions Form
  const payeeName = header && typeof header.payee_id === "object" && header.payee_id !== null
    ? header.payee_id.supplier_name
    : `Supplier ID: ${header?.payee_id}`;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Header details with navigation */}
      <Card className="lg:col-span-2 border-slate-200/80 dark:border-white/10 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.06)] dark:shadow-none bg-white/70 dark:bg-slate-900/50 backdrop-blur-md">
        <CardHeader className="pb-4 border-b border-dashed border-slate-200/50 dark:border-white/5 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setStep(1)}
              className="h-9 w-9 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-white"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </Button>
            <div>
              <CardTitle className="text-lg font-bold tracking-tight">Weekly Report Detail</CardTitle>
              <CardDescription>Step 2: Add lines or consolidate reports</CardDescription>
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Header ID: #{header?.id}</span>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50/50 dark:bg-slate-950/10 p-4 rounded-xl border border-slate-200/50 dark:border-white/5">
            <div className="space-y-1">
              <span className="font-bold block uppercase tracking-wider text-[9px] text-slate-400">Supplier Payee</span>
              <span className="font-semibold text-slate-850 dark:text-slate-200 text-xs truncate block">{payeeName}</span>
            </div>
            <div className="space-y-1">
              <span className="font-bold block uppercase tracking-wider text-[9px] text-slate-400">Period Interval</span>
              <span className="font-semibold text-slate-850 dark:text-slate-200 text-xs block">
                {header?.period_from} to {header?.period_to}
              </span>
            </div>
            {header?.remarks && (
              <div className="col-span-1 md:col-span-2 pt-3 border-t border-dashed border-slate-200/50 dark:border-white/5 space-y-0.5">
                <span className="font-bold block uppercase tracking-wider text-[9px] text-slate-400">Header Remarks</span>
                <p className="text-slate-650 dark:text-slate-350 italic">&ldquo;{header.remarks}&rdquo;</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Voucher Status Section */}
      <Card className="border-slate-200/80 dark:border-white/10 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.06)] dark:shadow-none bg-gradient-to-br from-white/70 to-slate-50/30 dark:from-slate-900/50 dark:to-slate-950/10 backdrop-blur-md flex flex-col justify-between">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-400">Consolidated Voucher</span>
            {voucher ? (
              <StatusBadge tone={getVoucherStatusTone(voucher.status)}>
                {voucher.status}
              </StatusBadge>
            ) : (
              <StatusBadge tone="neutral">Not Submitted</StatusBadge>
            )}
          </div>
          <CardTitle className="text-xl font-black mt-2 tracking-tight">
            {voucher ? voucher.doc_no : "NT-PENDING"}
          </CardTitle>
          <CardDescription>
            {voucher ? "Voucher in Bulk Approval progress" : "Draft weekly sheet ready for submission"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 flex-1 flex flex-col justify-end pt-4">
          <div className="grid grid-cols-2 gap-4 pb-2 border-b border-dashed border-slate-200 dark:border-white/5">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Items</span>
              <span className="text-lg font-black">{totalExpensesCount}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Amount</span>
              <span className="text-lg font-black text-cyan-600 dark:text-cyan-400">
                ₱{totalExpensesAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {header && !isLocked ? (
            <div className="space-y-3 pt-2">
              {voucher && ["Rejected", "With Concern"].includes(voucher.status) && (
                <div className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-200/50 dark:border-rose-950/30 p-3 rounded-lg text-xs space-y-1 mb-2">
                  <span className="font-bold text-rose-800 dark:text-rose-400 block uppercase tracking-wider text-[9px]">Voucher Concern Feedback:</span>
                  <p className="text-slate-700 dark:text-slate-300 italic">&ldquo;{voucher.remarks || "No comments provided by treasury."}&rdquo;</p>
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-slate-400">Submission Remarks</Label>
                <Textarea
                  placeholder="Add optional notes for approvers..."
                  value={submitRemarks}
                  onChange={(e) => setSubmitRemarks(e.target.value)}
                  className="resize-none min-h-[50px] rounded-lg border-slate-200/80 dark:border-white/10 text-xs bg-slate-50/50 dark:bg-slate-950/20"
                />
              </div>
              <Button
                className="w-full h-11 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md cursor-pointer transition-transform transform active:scale-95 flex items-center justify-center gap-2"
                onClick={() => onSubmit(submitRemarks)}
                disabled={isLoading || totalExpensesCount === 0}
              >
                <Send className="h-4 w-4" />
                {voucher ? "Update Submission" : "Submit to Bulk Approval"}
              </Button>
            </div>
          ) : header && isLocked ? (
            <div className="space-y-3 pt-2">
              {voucher && voucher.status === "Rejected" && (
                <div className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-200/50 dark:border-rose-950/30 p-3 rounded-lg text-xs space-y-1 mb-2">
                  <span className="font-bold text-rose-800 dark:text-rose-400 block uppercase tracking-wider text-[9px]">Rejection Feedback:</span>
                  <p className="text-slate-700 dark:text-slate-300 italic">&ldquo;{voucher.remarks || "No comments provided by treasury."}&rdquo;</p>
                </div>
              )}
              <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2 bg-slate-100/50 dark:bg-white/[0.02] p-3 rounded-lg border border-slate-200/50 dark:border-white/5">
                <Info className="h-4 w-4 text-cyan-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Weekly Sheet Locked</p>
                  <p className="mt-0.5">This period is consolidated and locked (voucher status: {voucher.status}). Line modifications are disabled.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="pt-2 text-xs text-slate-550 italic flex items-center justify-center p-3 border border-dashed border-slate-200/80 dark:border-white/10 rounded-xl">
              Select/create header in Step 1 to submit
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
