"use client";

import { useState } from "react";
import type { Supplier, ExpenseDraftHeader, DisbursementDraft, ExpenseAttachment } from "../types/salesman-wer.schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Store, Plus, Check, ArrowLeft, ArrowRight, ClipboardList, Info, Paperclip, Trash, AlertTriangle, Upload, User } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import type { StatusTone } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { ImagePreviewModal } from "./ImagePreviewModal";
import { resolveRegisteredSupplier } from "../../shared/registeredSupplier";

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
  attachments: ExpenseAttachment[];
  attachmentQuerySuccess: boolean;
  onUploadWER: (file: File) => Promise<void>;
  onDeleteWER: (id: number) => Promise<void>;
  isLoading: boolean;
  totalExpensesCount: number;
  totalExpensesAmount: number;
  step: number;
  setStep: (step: number) => void;
  isReportFinalized?: boolean;
}

export function WeeklyReportHeader({
  suppliers,
  headersList,
  selectedHeaderId,
  onHeaderChange,
  onCreateHeader,
  header,
  voucher,
  attachments,
  attachmentQuerySuccess,
  onUploadWER,
  onDeleteWER,
  isLoading,
  totalExpensesCount,
  totalExpensesAmount,
  step,
  setStep,
  isReportFinalized = false,
}: WeeklyReportHeaderProps) {
  const [newFromDate, setNewFromDate] = useState("");
  const [newToDate, setNewToDate] = useState("");
  const [newRemarks, setNewRemarks] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null);
  const { supplier: registeredSupplier, hasMultipleAssignments } =
    resolveRegisteredSupplier(suppliers);

  const isHeaderLocked = isReportFinalized || (!!header && (
    ["submitted", "waiting for approval", "waiting_for_approval", "approved", "paid"].includes((header.status || "").toLowerCase()) ||
    (header.status || "").toLowerCase().startsWith("pending_")
  ));

  const isLocked = isHeaderLocked || (!!voucher && (
    ["submitted", "approved", "paid"].includes(voucher.status.toLowerCase()) ||
    voucher.status.toLowerCase().startsWith("pending_") ||
    (voucher.status.toLowerCase() === "rejected" && totalExpensesCount <= 1)
  ));

  const handleCreate = async () => {
    if (!registeredSupplier || !newFromDate || !newToDate) return;
    setIsCreating(true);
    try {
      await onCreateHeader({
        payee_id: registeredSupplier.id,
        period_from: newFromDate,
        period_to: newToDate,
        remarks: newRemarks,
      });
      // Reset form
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
    if (s === "submitted" || s === "pending" || s.startsWith("pending_") || s === "waiting for approval") return "info";
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
                        const rawStatus = h.voucher_status ?? h.status ?? "Drafts";
                        let displayStatus = rawStatus;
                        if (rawStatus.toLowerCase() === "pending_l2" || rawStatus.toLowerCase().startsWith("pending_l")) {
                          displayStatus = "Waiting for Approval";
                        }
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
                <CardDescription className="text-xs">Define a new period for your registered payee account</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 flex-1">
            {/* Registered supplier payee */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Registered Payee Account</Label>
              <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-100/70 px-3 text-sm font-semibold text-slate-800 dark:border-white/10 dark:bg-slate-950/30 dark:text-slate-200">
                <User className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
                <span className="truncate">{registeredSupplier?.supplier_name || "No payee account assigned"}</span>
              </div>
              {hasMultipleAssignments && registeredSupplier && (
                <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[10px] leading-relaxed text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <p>Multiple payee assignments were found. <strong>{registeredSupplier.supplier_name}</strong> will be registered as the payee account for this report. If this is the wrong payee, please contact your administrator.</p>
                </div>
              )}
              {!registeredSupplier && (
                <div className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[10px] leading-relaxed text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <p>No payee account is assigned to your user account. Please contact your administrator before creating a report.</p>
                </div>
              )}
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
              disabled={isCreating || !registeredSupplier || !newFromDate || !newToDate}
            >
              <Check className="h-4 w-4" />
              Create & Save Header
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Render Step 2 View: Header Summary and WER file management
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
                <p className="text-slate-655 dark:text-slate-355 italic">&ldquo;{header.remarks}&rdquo;</p>
              </div>
            )}
          </div>

          {/* WER Summary Attachments Section */}
          <div className="pt-4 border-t border-slate-200/50 dark:border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5" />
                WER Summary Files
              </span>
              {!isLocked && (
                <div className="relative">
                  <Input
                    type="file"
                    id="wer-file-upload"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onUploadWER(file);
                    }}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor="wer-file-upload"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-cyan-50/50 dark:bg-cyan-950/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500 hover:text-white dark:hover:bg-cyan-500 cursor-pointer transition-all active:scale-95"
                  >
                    <Upload className="h-3 w-3" />
                    Upload Summary
                  </Label>
                </div>
              )}
            </div>

            {/* Warn if query failed */}
            {!attachmentQuerySuccess && (
              <div className="flex items-center gap-2 p-3 text-xs bg-amber-500/5 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 animate-pulse">
                <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                <div>
                  <p className="font-semibold">Query Failure</p>
                  <p className="text-[10px] opacity-90">Failed to load attachments from the server database.</p>
                </div>
              </div>
            )}


            {/* Render file attachments list */}
            {attachments.length > 0 && (
              <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-1">
                {attachments.map((file) => {
                  const assetUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/assets/${file.file_url}`;
                  return (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-2 rounded-xl border border-slate-200/60 dark:border-white/5 bg-slate-50/30 dark:bg-slate-950/10 text-xs text-slate-700 dark:text-slate-350"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Paperclip className="h-3.5 w-3.5 text-cyan-600/70 shrink-0" />
                        <button
                          type="button"
                          onClick={() => setPreviewFile({ url: assetUrl, name: file.file_name })}
                          className="font-medium truncate hover:text-cyan-600 dark:hover:text-cyan-400 hover:underline cursor-pointer text-left"
                        >
                          {file.file_name}
                        </button>
                        {file.file_size !== undefined && file.file_size !== null && (
                          <span className="text-[9px] text-slate-400 shrink-0">
                            ({(file.file_size / 1024).toFixed(1)} KB)
                          </span>
                        )}
                      </div>
                      {!isLocked && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteWER(file.id)}
                          className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-500/5 rounded-lg"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Status Section */}
      <Card className="border-slate-200/80 dark:border-white/10 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.06)] dark:shadow-none bg-gradient-to-br from-white/70 to-slate-50/30 dark:from-slate-900/50 dark:to-slate-950/10 backdrop-blur-md flex flex-col justify-between">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-400">Report Status</span>
            {voucher ? (
              <StatusBadge tone={getVoucherStatusTone(voucher.status)}>
                {voucher.status.toLowerCase() === "pending_l2" || voucher.status.toLowerCase().startsWith("pending_l")
                  ? "Waiting for Approval"
                  : voucher.status}
              </StatusBadge>
            ) : isLocked ? (
              <StatusBadge tone="info">Locked</StatusBadge>
            ) : (
              <StatusBadge tone="neutral">Editable</StatusBadge>
            )}
          </div>
          <CardTitle className="text-xl font-black mt-2 tracking-tight">
            {voucher ? voucher.doc_no : "Weekly Report Draft"}
          </CardTitle>
          <CardDescription>
            {voucher
              ? "Voucher in Bulk Approval progress"
              : isLocked
                ? "External approval state has locked this report"
                : "Salesman can continue updating lines and WER files"}
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

          {header && isLocked ? (
            <div className="space-y-3 pt-2">
              {voucher && voucher.status === "Rejected" && (
                <div className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-200/50 dark:border-rose-950/30 p-3 rounded-lg text-xs space-y-1 mb-2">
                  <span className="font-bold text-rose-800 dark:text-rose-455 block uppercase tracking-wider text-[9px]">Rejection Feedback:</span>
                  <p className="text-slate-700 dark:text-slate-355 italic">&ldquo;{voucher.remarks || "No comments provided by treasury."}&rdquo;</p>
                </div>
              )}
              <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2 bg-slate-100/50 dark:bg-white/[0.02] p-3 rounded-lg border border-slate-200/50 dark:border-white/5">
                <Info className="h-4 w-4 text-cyan-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Weekly Sheet Locked</p>
                  <p className="mt-0.5">This period is locked by an external approval or voucher state. Line modifications are disabled.</p>
                </div>
              </div>
            </div>
          ) : header ? (
            <div className="pt-2 text-xs text-slate-555 dark:text-slate-400 flex items-start gap-2 bg-cyan-50/50 dark:bg-cyan-950/10 p-3 rounded-lg border border-cyan-200/60 dark:border-cyan-950/40">
              <Info className="h-4 w-4 text-cyan-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Salesman Editing Open</p>
                <p className="mt-0.5">No Salesman-side final submission is required. Continue updating expense lines and WER Summary files until another module approves or locks this report.</p>
              </div>
            </div>
          ) : (
            <div className="pt-2 text-xs text-slate-550 italic flex items-center justify-center p-3 border border-dashed border-slate-200/80 dark:border-white/10 rounded-xl">
              Select/create header in Step 1 to manage WER files and lines.
            </div>
          )}
        </CardContent>
      </Card>

      {previewFile && (
        <ImagePreviewModal
          src={previewFile.url}
          fileName={previewFile.name}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}
