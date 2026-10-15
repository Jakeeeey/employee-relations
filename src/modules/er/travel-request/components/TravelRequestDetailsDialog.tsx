/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { TravelRequest } from "../types/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  FileText,
  Download,
  Eye,
  ExternalLink,
  CheckCircle2,
  XCircle,
  FileQuestion,
  User,
  Building2,
  Calendar,
  MapPin,
  Coins,
} from "lucide-react";

interface TravelRequestDetailsDialogProps {
  request: TravelRequest | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  coas: any[];
  isApprover?: boolean;
  onApprove?: (id: number, remarks?: string) => Promise<void> | void;
  onReject?: (id: number, remarks?: string) => Promise<void> | void;
}

export function TravelRequestDetailsDialog({
  request,
  isOpen,
  onOpenChange,
  coas,
  isApprover = false,
  onApprove,
  onReject,
}: TravelRequestDetailsDialogProps) {
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  if (!request) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300";
      case "approved":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300";
      case "rejected":
        return "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300";
      case "cancelled":
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  const getCOAName = (coaId: number) => {
    const coa = coas?.find((c) => c.coa_id === coaId);
    return coa ? `${coa.gl_code} - ${coa.account_title}` : `Account ID: ${coaId}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleApprove = async () => {
    if (!onApprove || !request.travel_id) return;
    setIsSubmitting(true);
    try {
      await onApprove(request.travel_id, remarks.trim() || undefined);
      setRemarks("");
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!onReject || !request.travel_id) return;
    setIsSubmitting(true);
    try {
      await onReject(request.travel_id, remarks.trim() || undefined);
      setRemarks("");
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasAttachment = Boolean(request.attachment_uuid);
  const fileUrl = request.attachment_uuid
    ? `/api/er/travel-request/file?path=${request.attachment_uuid}`
    : "";
  const downloadUrl = request.attachment_uuid
    ? `/api/er/travel-request/file?path=${request.attachment_uuid}&download=1`
    : "";

  const isImageAttachment = Boolean(
    request.attachment_filetype?.startsWith("image/") ||
      (request.attachment_filename &&
        /\.(jpg|jpeg|png|webp|gif)$/i.test(request.attachment_filename))
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Travel Order Request Details
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Reference ID: #{request.travel_id}
                </p>
              </div>
              <Badge className={getStatusColor(request.status)} variant="outline">
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </Badge>
            </div>
          </DialogHeader>

          {/* Employee & Department Information */}
          {(request.employee_name || request.department_name) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-muted/40 rounded-lg border">
              {request.employee_name && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground block">
                      Filing Employee
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {request.employee_name}
                    </span>
                  </div>
                </div>
              )}
              {request.department_name && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10 text-primary">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground block">
                      Department / Office
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {request.department_name}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            {/* Left Column: Basic Details */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs uppercase font-semibold text-muted-foreground tracking-wider mb-1">
                  Destination
                </h4>
                <p className="text-base font-medium">{request.destination}</p>
              </div>

              <div>
                <h4 className="text-xs uppercase font-semibold text-muted-foreground tracking-wider mb-1 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Travel Dates
                </h4>
                <p className="text-sm">
                  {format(new Date(request.travel_from), "MMMM d, yyyy")} &mdash;{" "}
                  {format(new Date(request.travel_to), "MMMM d, yyyy")}
                </p>
              </div>

              <div>
                <h4 className="text-xs uppercase font-semibold text-muted-foreground tracking-wider mb-1">
                  Purpose of Travel
                </h4>
                <p className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-md border text-foreground/90">
                  {request.purpose}
                </p>
              </div>

              {request.remarks && (
                <div>
                  <h4 className="text-xs uppercase font-semibold text-muted-foreground tracking-wider mb-1">
                    Employee Remarks / Notes
                  </h4>
                  <p className="text-sm whitespace-pre-wrap bg-muted/20 p-2.5 rounded-md border text-muted-foreground">
                    {request.remarks}
                  </p>
                </div>
              )}

              {request.approval_remarks && (
                <div>
                  <h4 className="text-xs uppercase font-semibold text-amber-700 dark:text-amber-400 tracking-wider mb-1">
                    Approver Review Remarks
                  </h4>
                  <p className="text-sm whitespace-pre-wrap bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-md border border-amber-200/50 dark:border-amber-900/50 text-foreground">
                    {request.approval_remarks}
                  </p>
                </div>
              )}
            </div>

            {/* Right Column: Attachment & Budget */}
            <div className="space-y-6">
              {/* Communication Letter / Memo Attachment Section */}
              <div>
                <h4 className="text-xs uppercase font-semibold text-muted-foreground tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-primary" />
                  Official Communication Letter / Memo
                </h4>
                
                {hasAttachment ? (
                  <div className="border rounded-lg p-4 bg-card shadow-sm space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-primary/10 text-primary rounded-lg">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate text-foreground">
                          {request.attachment_filename || "Communication_Letter.pdf"}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          {request.attachment_filesize ? (
                            <span>{formatFileSize(request.attachment_filesize)}</span>
                          ) : null}
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 uppercase">
                            {isImageAttachment ? "Image" : "Document"}
                          </Badge>
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            ✓ Attached
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                      <Button
                        type="button"
                        size="sm"
                        variant="default"
                        className="gap-1.5 text-xs h-8"
                        onClick={() => setIsPreviewOpen(true)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Preview Document
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs h-8"
                        asChild
                      >
                        <a href={downloadUrl} download>
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </a>
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="gap-1.5 text-xs h-8"
                        asChild
                      >
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Open in Tab
                        </a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed rounded-lg p-4 text-center bg-muted/20">
                    <FileQuestion className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">
                      No Communication Letter or Memo attached
                    </p>
                    <p className="text-xs text-muted-foreground/75 mt-0.5">
                      This request was submitted without an attached official letter.
                    </p>
                  </div>
                )}
              </div>

              {/* Budget Allocation Section */}
              <div>
                <h4 className="text-xs uppercase font-semibold text-muted-foreground tracking-wider mb-2 flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-primary" />
                  Budget Allocation
                </h4>
                {!request.requires_budget ? (
                  <p className="text-sm text-muted-foreground italic bg-muted/20 p-3 rounded-md border">
                    No budget requested for this travel.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {request.budget_items && request.budget_items.length > 0 ? (
                      <div className="rounded-md border divide-y overflow-hidden">
                        {request.budget_items.map((item, idx) => (
                          <div key={idx} className="p-3 text-sm flex justify-between items-start bg-card">
                            <div className="space-y-0.5">
                              <p className="font-medium">{getCOAName(item.coa_id)}</p>
                              {item.remarks && (
                                <p className="text-xs text-muted-foreground">{item.remarks}</p>
                              )}
                            </div>
                            <div className="font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap ml-4">
                              {new Intl.NumberFormat("en-PH", {
                                style: "currency",
                                currency: "PHP",
                              }).format(item.amount)}
                            </div>
                          </div>
                        ))}
                        <div className="p-3 bg-muted/50 flex justify-between items-center font-semibold text-sm">
                          <span>Total Requested Budget</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {new Intl.NumberFormat("en-PH", {
                              style: "currency",
                              currency: "PHP",
                            }).format(request.total_budget || 0)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Budget breakdown unavailable.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Approver Actions Section */}
          {isApprover && request.status === "pending" && (
            <div className="mt-6 border-t pt-5 space-y-4 bg-muted/20 p-4 rounded-lg border">
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  Approver Review & Decision
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Review the details, purpose, and attached communication memo before approving or rejecting.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="approver-remarks" className="text-xs font-medium">
                  Review Remarks / Instructions (Optional)
                </Label>
                <Textarea
                  id="approver-remarks"
                  placeholder="Enter any approval conditions, comments, or reason for rejection..."
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleReject}
                  disabled={isSubmitting}
                  className="gap-1.5"
                >
                  <XCircle className="h-4 w-4" />
                  Reject Request
                </Button>

                <Button
                  type="button"
                  variant="default"
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve Travel Order
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Preview Modal */}
      {hasAttachment && (
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="sm:max-w-5xl h-[88vh] flex flex-col p-4">
            <DialogHeader className="border-b pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-base font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Preview: {request.attachment_filename || "Communication Letter"}
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Official supporting document for Travel ID #{request.travel_id}
                  </p>
                </div>
                <div className="flex items-center gap-2 mr-6">
                  <Button size="sm" variant="outline" asChild className="h-8 text-xs gap-1">
                    <a href={downloadUrl} download>
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </a>
                  </Button>
                  <Button size="sm" variant="ghost" asChild className="h-8 text-xs gap-1">
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open Full Screen
                    </a>
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 min-h-0 w-full bg-muted/40 rounded-md overflow-hidden flex items-center justify-center p-2">
              {isImageAttachment ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fileUrl}
                  alt={request.attachment_filename || "Communication Memo"}
                  className="max-h-full max-w-full object-contain rounded shadow"
                />
              ) : (
                <iframe
                  src={fileUrl}
                  title="Document Preview"
                  className="w-full h-full border-0 rounded bg-white"
                />
              )}
            </div>

            <DialogFooter className="border-t pt-3 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setIsPreviewOpen(false)}>
                Close Preview
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
