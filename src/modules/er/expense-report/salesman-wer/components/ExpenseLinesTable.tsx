"use client";

import { useState } from "react";
import type { ExpenseDraft, DisbursementDraft } from "../types/salesman-wer.schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Edit2, Trash2, Plus, Image as ImageIcon, FileSpreadsheet } from "lucide-react";
import { ImagePreviewModal } from "./ImagePreviewModal";
import { cn } from "@/lib/utils";

const DIRECTUS_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "";

function toAssetUrl(raw: string): string {
  const uuid = raw.replace(/^\/assets\//, "");
  return `${DIRECTUS_URL}/assets/${uuid}`;
}

interface ExpenseLinesTableProps {
  expenses: ExpenseDraft[];
  voucher: DisbursementDraft | null;
  onEdit: (item: ExpenseDraft) => void;
  onDelete: (id: number) => void;
  onAddClick: () => void;
  isLoading: boolean;
  isLocked?: boolean;
}

export function ExpenseLinesTable({
  expenses,
  voucher,
  onEdit,
  onDelete,
  onAddClick,
  isLoading,
  isLocked: propIsLocked,
}: ExpenseLinesTableProps) {

  const internalIsLocked = !!voucher && (
    ["submitted", "approved", "paid"].includes(voucher.status.toLowerCase()) ||
    voucher.status.toLowerCase().startsWith("pending_") ||
    (voucher.status.toLowerCase() === "rejected" && expenses.length <= 1)
  );

  const isLocked = propIsLocked !== undefined ? propIsLocked : internalIsLocked;

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  return (
    <>
      <ImagePreviewModal src={previewUrl} onClose={() => setPreviewUrl(null)} />
    <Card className="border-slate-200/80 dark:border-white/10 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.06)] dark:shadow-none bg-white/70 dark:bg-slate-900/50 backdrop-blur-md">
      <CardHeader className="pb-4 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-bold tracking-tight">Weekly Expense Lines</CardTitle>
          <CardDescription>Line item receipts encoded for the weekly period</CardDescription>
        </div>
        <Button
          onClick={onAddClick}
          disabled={isLoading || isLocked}
          className="h-10 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer transition-transform transform active:scale-95 shadow-md flex items-center gap-1.5"
        >
          <Plus className="h-4.5 w-4.5" />
          Add Line
        </Button>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-slate-200 dark:border-white/5 bg-slate-50/20 dark:bg-slate-950/5">
            <div className="p-3 bg-slate-100 dark:bg-white/[0.02] rounded-full text-slate-400 mb-3">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200">No Expense Lines</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
              Add new line receipts for this period, or choose another salesman or week range.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-white/10">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-950/20">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-white/40">Date</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-white/40">Merchant (Payee)</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-white/40">GL Account (Particulars)</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-white/40">Remarks</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-white/40">Receipt</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-white/40 text-right">Amount</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-white/40 text-center w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow
                    key={expense.id}
                    className={cn(
                      "transition-colors",
                      expense.status === "Rejected"
                        ? "bg-rose-500/[0.03] dark:bg-rose-500/[0.01] hover:bg-rose-500/[0.05]"
                        : expense.status === "With Concern"
                        ? "bg-amber-500/[0.03] dark:bg-amber-500/[0.01] hover:bg-amber-500/[0.05]"
                        : "hover:bg-slate-50/30 dark:hover:bg-white/[0.01]"
                    )}
                  >
                    <TableCell className="font-medium text-xs text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {expense.transaction_date}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                      <div>{expense.payee || "N/A"}</div>
                      {expense.status && ["With Concern", "Rejected"].includes(expense.status) && (
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded-[4px] text-[9px] font-black uppercase tracking-wider shrink-0",
                            expense.status === "Rejected" ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-450" : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                          )}>
                            {expense.status}
                          </span>
                          {expense.feedback && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal italic truncate max-w-sm">
                              Feedback: &ldquo;{expense.feedback}&rdquo;
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-slate-700 dark:text-slate-300">
                      {expense.particulars_name}
                    </TableCell>
                    <TableCell className="text-xs max-w-xs truncate text-slate-500 dark:text-slate-400">
                      {expense.remarks || "-"}
                    </TableCell>
                    <TableCell>
                      {expense.attachment_url ? (
                        <button
                          onClick={() => setPreviewUrl(toAssetUrl(expense.attachment_url!))}
                          className="inline-flex items-center gap-1 text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-semibold cursor-pointer"
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                          View
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No File</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs font-black text-slate-855 dark:text-slate-100">
                      ₱{expense.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-500/10"
                          onClick={() => onEdit(expense)}
                          disabled={isLoading || isLocked || expense.status === "Rejected"}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10"
                          onClick={() => onDelete(expense.id)}
                          disabled={isLoading || isLocked || expense.status === "Rejected"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
}
