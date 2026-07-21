"use client";

import { useState } from "react";
import type { ExpenseDraft } from "../types/salesman-wer.schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Image as ImageIcon, RefreshCcw } from "lucide-react";
import { ImagePreviewModal } from "./ImagePreviewModal";

const DIRECTUS_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "";

function toAssetUrl(raw: string): string {
  const uuid = raw.replace(/^\/assets\//, "");
  return `${DIRECTUS_URL}/assets/${uuid}`;
}

interface ReturnedItemsSectionProps {
  items: ExpenseDraft[];
  onEditResolve: (item: ExpenseDraft) => void;
  isLoading: boolean;
  isLocked?: boolean;
}

export function ReturnedItemsSection({
  items,
  onEditResolve,
  isLoading,
  isLocked = false,
}: ReturnedItemsSectionProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (items.length === 0) return null;

  const hasRejected = items.some((item) => item.status === "Rejected");

  return (
    <>
      <ImagePreviewModal src={previewUrl} onClose={() => setPreviewUrl(null)} />
    <Card className="border-rose-200/80 dark:border-rose-950/40 shadow-[0_8px_32px_-8px_rgba(244,63,94,0.06)] dark:shadow-none bg-gradient-to-r from-rose-50/50 via-white/70 to-rose-50/20 dark:from-rose-950/10 dark:to-slate-900/30 backdrop-blur-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 rounded-xl text-rose-600 dark:text-rose-400 animate-pulse">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold tracking-tight text-rose-950 dark:text-rose-200">
                Action Required: {hasRejected ? "Returned / Rejected Items" : "Flagged with Concern"} ({items.length})
              </CardTitle>
              <CardDescription className="text-rose-700/70 dark:text-rose-400/60">
                {hasRejected
                  ? "Approvers rejected or flagged these receipts. Check comments to resolve or correct."
                  : "Approvers flagged these receipts. Correct the errors and resubmit to reinstate approval."}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-rose-200/60 dark:border-rose-950/30 bg-rose-50/30 dark:bg-rose-950/5 hover:bg-rose-50/50 dark:hover:bg-rose-950/10 transition-colors"
          >
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {item.status === "Rejected" ? (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
                    Rejected
                  </span>
                ) : (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-450">
                    With Concern ({item.return_to || "Approver"})
                  </span>
                )}
                <span className="text-xs text-slate-500 dark:text-slate-400">{item.transaction_date}</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Payee: {item.payee || "N/A"}
                </span>
              </div>

              {/* Feedback reason card */}
              <div className="bg-white/80 dark:bg-slate-900/60 p-3 rounded-lg border border-rose-100 dark:border-rose-950/20 text-xs">
                <p className="font-bold text-rose-800 dark:text-rose-450 uppercase tracking-wider text-[9px] mb-1">
                  {item.status === "Rejected" ? "Rejection Reason:" : "Concern Reason:"}
                </p>
                <p className="text-slate-700 dark:text-slate-300 italic">
                  &ldquo;{item.feedback || "No comment provided."}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-6 text-xs text-slate-600 dark:text-slate-400 pt-1">
                <span>
                  GL Account: <strong className="text-slate-700 dark:text-slate-300">{item.particulars_name || `COA #${item.particulars}`}</strong>
                </span>
                <span>
                  Remarks: <strong className="text-slate-700 dark:text-slate-300">{item.remarks || "None"}</strong>
                </span>
                {item.attachment_url && (
                  <button
                    onClick={() => setPreviewUrl(toAssetUrl(item.attachment_url!))}
                    className="flex items-center gap-1 text-cyan-600 hover:text-cyan-500 hover:underline font-semibold cursor-pointer"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    Receipt Attachment
                  </button>
                )}
              </div>
            </div>

            <div className="flex md:flex-col items-end gap-3 justify-between md:justify-center border-t md:border-t-0 border-slate-200/50 dark:border-white/5 pt-3 md:pt-0">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Amount Flagged</span>
                <span className="text-lg font-black text-rose-600 dark:text-rose-400">
                  ₱{item.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
                {item.status === "With Concern" && (
                  <Button
                    size="sm"
                    className="rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer shadow-sm transition-transform active:scale-95 flex items-center gap-1.5"
                    onClick={() => onEditResolve(item)}
                    disabled={isLoading || isLocked}
                  >
                    <RefreshCcw className="h-3.5 w-3.5" />
                    {isLocked ? "Locked" : "Resolve & Resubmit"}
                  </Button>
                )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
    </>
  );
}
