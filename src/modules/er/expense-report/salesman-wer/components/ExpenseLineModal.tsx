"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ExpenseDraft, COA, ExpenseFormInput } from "../types/salesman-wer.schema";
import { ExpenseFormInputSchema } from "../types/salesman-wer.schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Spinner } from "@/components/ui/spinner";
import { Upload, X, Paperclip, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { parseJsonResponse } from "../services/salesmanWER";

interface ExpenseLineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<ExpenseDraft>) => Promise<void>;
  coaList: COA[];
  editingItem: ExpenseDraft | null;
  defaultPayeeName?: string;
  periodFrom?: string;
  periodTo?: string;
}

export function ExpenseLineModal({
  isOpen,
  onClose,
  onSave,
  coaList,
  editingItem,
  defaultPayeeName = "",
  periodFrom,
  periodTo,
}: ExpenseLineModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    setError,
    formState: { errors, isDirty },
  } = useForm<ExpenseFormInput>({
    resolver: zodResolver(ExpenseFormInputSchema),
    defaultValues: {
      transaction_date: "",
      payee: "",
      amount: undefined as unknown as number,
      remarks: "",
      particulars: undefined as unknown as number,
      attachment_url: "",
    },
  });

  const attachmentUrl = watch("attachment_url");

  // Load editing item details if editing
  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        reset({
          transaction_date: editingItem.transaction_date,
          payee: editingItem.payee || "",
          amount: editingItem.amount,
          remarks: editingItem.remarks || "",
          particulars: editingItem.particulars,
          attachment_url: editingItem.attachment_url || "",
        });
        setUploadedFilename(
          editingItem.attachment_url
            ? editingItem.attachment_url.substring(editingItem.attachment_url.lastIndexOf("/") + 1)
            : null
        );
      } else {
        reset({
          transaction_date: new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Manila" }),
          payee: defaultPayeeName,
          amount: undefined as unknown as number,
          remarks: "",
          particulars: coaList[0]?.coa_id || (undefined as unknown as number),
          attachment_url: "",
        });
        setUploadedFilename(null);
      }
    }
  }, [isOpen, editingItem, reset, coaList, defaultPayeeName]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size limit exceeded", { description: "Maximum allowed file size is 10MB" });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/er/expense-report/salesman-wer/upload", {
        method: "POST",
        body: formData,
      });

      const data = await parseJsonResponse(res);
      if (!res.ok) {
        throw new Error(data.error || data.message || `Failed to upload file (${res.status})`);
      }

      setUploadedFilename(file.name);
      setValue("attachment_url", data.file_url, { shouldDirty: true });
      toast.success("Receipt uploaded successfully");
    } catch (err: unknown) {
      console.error("Upload error:", err);
      const errMsg = err instanceof Error ? err.message : "Failed to upload attachment file";
      toast.error("Upload failed", { description: errMsg });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAttachment = () => {
    setUploadedFilename(null);
    setValue("attachment_url", "", { shouldDirty: true });
  };

  const onSubmitForm = async (data: ExpenseFormInput) => {
    // Validate date range boundaries
    if (periodFrom && data.transaction_date < periodFrom) {
      setError("transaction_date", {
        type: "manual",
        message: `Date must be on or after the weekly period start (${periodFrom})`,
      });
      return;
    }
    if (periodTo && data.transaction_date > periodTo) {
      setError("transaction_date", {
        type: "manual",
        message: `Date must be on or before the weekly period end (${periodTo})`,
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        ...(editingItem ? { id: editingItem.id } : {}),
        transaction_date: data.transaction_date,
        payee: data.payee,
        amount: data.amount,
        particulars: data.particulars,
        remarks: data.remarks || null,
        attachment_url: data.attachment_url || null,
        status: editingItem?.status || "Drafts",
        version: editingItem?.version || 1,
      });
      onClose();
    } catch {
      // toast is already handled in hook, just consume
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[min(calc(100vw-2rem),480px)] max-w-[calc(100vw-2rem)] min-w-0 rounded-[2rem] border-slate-200/80 dark:border-white/10 shadow-2xl p-6 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-lg font-black tracking-tight">
            {editingItem ? "Edit Expense Line" : "Add Expense Line"}
          </DialogTitle>
        </DialogHeader>

        {editingItem?.status === "With Concern" && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 rounded-xl p-3 text-xs flex items-start gap-2 mb-2">
            <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Returned Concern Correction</p>
              <p className="mt-0.5 italic">&ldquo;{editingItem.feedback}&rdquo;</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmitForm)} className="min-w-0 max-w-full space-y-4 pt-2">
          {/* Transaction Date */}
          <div className="min-w-0 space-y-1">
            <Label className="text-xs font-semibold text-slate-500">Transaction Date</Label>
            <Input
              type="date"
              {...register("transaction_date")}
              className="h-10 rounded-xl border-slate-200/80 dark:border-white/10"
            />
            {errors.transaction_date && (
              <p className="text-[10px] text-rose-500 font-bold">{errors.transaction_date.message}</p>
            )}
          </div>

          {/* Payee / Merchant */}
          <div className="min-w-0 space-y-1">
            <Label className="text-xs font-semibold text-slate-500">Merchant (Payee)</Label>
            <Input
              placeholder="e.g. Shell Gas Station, Office Warehouse"
              {...register("payee")}
              className="h-10 rounded-xl border-slate-200/80 dark:border-white/10"
            />
            {errors.payee && (
              <p className="text-[10px] text-rose-500 font-bold">{errors.payee.message}</p>
            )}
          </div>

          {/* Particulars (GL Account) */}
          <div className="min-w-0 max-w-full space-y-1 flex flex-col overflow-hidden">
            <Label className="text-xs font-semibold text-slate-500 mb-1">GL Account (Particulars)</Label>
            <Controller
              control={control}
              name="particulars"
              render={({ field }) => {
                const options = coaList.map((coa) => ({
                  value: String(coa.coa_id),
                  label: `${coa.account_title} ${coa.gl_code ? `(${coa.gl_code})` : ""}`,
                }));
                return (
                  <SearchableSelect
                    options={options}
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(val) => field.onChange(val ? Number(val) : undefined)}
                    placeholder="Search GL Account..."
                    className="h-10 min-w-0 max-w-full shrink rounded-xl border-slate-200/80 dark:border-white/10 text-left font-normal"
                  />
                );
              }}
            />
            {errors.particulars && (
              <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.particulars.message}</p>
            )}
          </div>

          {/* Amount */}
          <div className="min-w-0 space-y-1">
            <Label className="text-xs font-semibold text-slate-500">Amount (PHP)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("amount", { valueAsNumber: true })}
              className="h-10 rounded-xl border-slate-200/80 dark:border-white/10 font-bold"
            />
            {errors.amount && (
              <p className="text-[10px] text-rose-500 font-bold">{errors.amount.message}</p>
            )}
          </div>

          {/* Remarks */}
          <div className="min-w-0 space-y-1">
            <Label className="text-xs font-semibold text-slate-500">Remarks / Particular Description <span className="text-rose-500">*</span></Label>
            <Textarea
              placeholder="Provide a detailed description of the expense... (Required)"
              {...register("remarks")}
              className="resize-none min-h-[60px] rounded-xl border-slate-200/80 dark:border-white/10"
            />
            {errors.remarks && (
              <p className="text-[10px] text-rose-500 font-bold">{errors.remarks.message}</p>
            )}
          </div>

          {/* File Upload Attachment */}
          <div className="min-w-0 space-y-2">
            <Label className="text-xs font-semibold text-slate-500">Receipt Attachment</Label>
            {attachmentUrl ? (
              <div className="flex items-center justify-between p-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 text-xs text-cyan-700 dark:text-cyan-400">
                <div className="flex items-center gap-2 truncate">
                  <Paperclip className="h-4 w-4 shrink-0" />
                  <span className="truncate font-semibold">{uploadedFilename || "receipt_attachment"}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10"
                  onClick={handleRemoveAttachment}
                >
                  <X className="h-4.5 w-4.5" />
                </Button>
              </div>
            ) : (
              <div className="relative border border-dashed border-slate-200/80 dark:border-white/10 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all cursor-pointer group">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={isUploading}
                />
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Spinner className="h-5 w-5 text-cyan-500" />
                    <span className="text-[10px] text-slate-400">Uploading receipt...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <Upload className="h-5 w-5 text-slate-400 group-hover:text-cyan-500 transition-colors" />
                    <div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Click or Drag receipt here</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, or PDF up to 10MB</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="h-10 rounded-xl border-slate-200 dark:border-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || isUploading || (!!editingItem && !isDirty)}
              className="h-10 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer transition-transform transform active:scale-95 shadow-md flex items-center justify-center gap-1"
            >
              {isSaving && <Spinner className="h-4 w-4 text-white" />}
              {editingItem?.status === "With Concern" ? "Save & Resubmit" : "Save Line"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
