"use client";

import { useState } from "react";
import { COETable } from "./components/COETable";
import { COEForm } from "./components/COEForm";
import { useCOE } from "./hooks/useCOE";
import { COERequest } from "./type";
import { getFileProxyUrl } from "./fileProxy";
import { Button } from "@/components/ui/button";
<<<<<<< HEAD
import { Plus, RotateCcw, AlertCircle, Download, FileText, Loader2, X, ArrowRight, Calendar, Clock, AlertTriangle } from "lucide-react";
=======
import { Plus, RotateCcw, AlertCircle, Download, FileText, Loader2, X } from "lucide-react";
>>>>>>> master
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
<<<<<<< HEAD
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
=======
>>>>>>> master
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

<<<<<<< HEAD
const statusVariantMap: Record<string, "default" | "secondary" | "destructive" | "outline" | "success"> = {
  PENDING: "secondary",
  APPROVED: "default",
  RELEASED: "success",
  REJECTED: "destructive",
  CANCELLED: "secondary",
=======
const statusVariantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  APPROVED: "default",
  RELEASED: "default",
  REJECTED: "destructive",
  CANCELLED: "destructive",
>>>>>>> master
};

function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function isPreviewable(status: string | null | undefined): boolean {
  const s = (status || "").toUpperCase();
  return s === "APPROVED" || s === "RELEASED";
}

interface COEModuleProps {
  userId: number;
}

const ITEMS_PER_PAGE = 10;
type StatusFilter = "all" | "PENDING" | "APPROVED" | "REJECTED" | "RELEASED" | "CANCELLED";

export default function COEModule({ userId }: COEModuleProps) {
  const { requests, isLoading, error, refresh, createRequest, updateRequest } = useCOE();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>("Document");
  const [editingRequest, setEditingRequest] = useState<COERequest | null>(null);
  const [viewingRequest, setViewingRequest] = useState<COERequest | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
<<<<<<< HEAD
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
=======
>>>>>>> master

  const handleOpenCreate = () => {
    setEditingRequest(null);
    setIsDialogOpen(true);
  };

  const handleOpenView = (request: COERequest) => {
    setViewingRequest(request);
    setIsViewDialogOpen(true);
  };

  const handlePreview = (url: string, title?: string | null) => {
    const proxied = getFileProxyUrl(url);
    if (!proxied) return;
    setPreviewUrl(proxied);
    setPreviewTitle(title || "Document");
    setIsPreviewOpen(true);
  };

  const onSubmit = async (data: { purpose: string }) => {
    if (editingRequest) {
      await updateRequest(editingRequest.id!, { purpose: data.purpose });
    } else {
      await createRequest({ employee_id: userId, purpose: data.purpose });
    }
    setIsDialogOpen(false);
  };

<<<<<<< HEAD
  const handleCancel = async () => {
    if (!viewingRequest?.id) return;
    setIsCancelling(true);
    try {
      await updateRequest(viewingRequest.id, { status: "CANCELLED" });
      setIsCancelDialogOpen(false);
      setIsViewDialogOpen(false);
    } catch {
      // error toast is handled by useCOE
    } finally {
      setIsCancelling(false);
    }
  };

=======
>>>>>>> master
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
      setCurrentPage(1);
    } catch (err) {
      console.error("Error refreshing COE requests:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredRequests =
    statusFilter === "all"
      ? requests
      : requests.filter((r) => r.status?.toUpperCase() === statusFilter);

  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredRequests.length);
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  if (isLoading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner />
      </div>
    );
  }

  if (error && requests.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Certificate of Employment</h2>
          <p className="text-muted-foreground">
            Request and manage your Certificate of Employment.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex-1 sm:flex-none h-9 text-sm w-auto justify-center px-3 font-normal border border-slate-200 dark:border-slate-700"
          >
            <RotateCcw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button onClick={handleOpenCreate} className="flex-1 sm:flex-none">
            <Plus className="mr-2 h-4 w-4" />
            New COE Request
          </Button>
        </div>
      </div>

      <Card className="border border-slate-200 dark:border-slate-700">
        <CardHeader>
          <div className="flex items-center gap-3 w-full">
            <CardTitle className="shrink-0">COE Requests</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Showing {filteredRequests.length} record(s)
            </CardDescription>
            <div className="ml-auto">
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val as StatusFilter);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-7 text-xs w-auto min-w-[110px] justify-start pl-2.5 text-left font-normal border border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="RELEASED">Released</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No COE requests found</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border border-slate-200 dark:border-slate-700 overflow-x-auto">
                <COETable
                  data={paginatedRequests}
                  onView={handleOpenView}
<<<<<<< HEAD
=======
                  onPreview={handlePreview}
>>>>>>> master
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
                <div className="text-sm text-muted-foreground order-2 sm:order-1">
                  Page {currentPage} of {totalPages} &bull; Showing {endIndex} of{" "}
                  {filteredRequests.length} records
                </div>
                <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none border border-slate-200 dark:border-slate-700"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none border border-slate-200 dark:border-slate-700"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRequest ? "Edit COE Request" : "New COE Request"}
            </DialogTitle>
          </DialogHeader>
          <COEForm
            initialData={editingRequest || undefined}
            onSubmit={onSubmit}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isPreviewOpen} onOpenChange={(open) => { if (!open) { setIsPreviewOpen(false); setPreviewUrl(null); } }}>
        <DialogContent showCloseButton={false} className="sm:max-w-[900px] overflow-hidden p-0 rounded-2xl border-2 shadow-2xl">
          <div className="bg-gradient-to-r from-primary/10 via-background to-primary/5 p-5 pb-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl shrink-0">
                <FileText className="h-5 w-5 text-primary stroke-[2.5px]" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg font-bold tracking-tight line-clamp-1">
                  {previewTitle}
                </DialogTitle>
                <p className="text-xs font-medium opacity-70">PDF Document</p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="rounded-xl border bg-muted/20 overflow-hidden">
              {previewUrl ? (
                <div className="h-[60vh] overflow-auto bg-zinc-100">
                  <iframe
                    src={previewUrl}
                    title={previewTitle}
                    className="w-full h-full border-0"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-[60vh] gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading preview...
                </div>
              )}
            </div>
          </div>

          {previewUrl && (
            <div className="px-5 pb-5 pt-0 flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                asChild
                className="flex-1 h-11 rounded-xl font-bold shadow-lg shadow-primary/20"
              >
                <a href={previewUrl} download>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </a>
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setIsPreviewOpen(false); setPreviewUrl(null); }}
                className="sm:flex-1 h-11 rounded-xl font-bold text-muted-foreground hover:bg-muted"
              >
                <X className="mr-2 h-4 w-4" />
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
<<<<<<< HEAD
        <DialogContent showCloseButton={false} className="sm:max-w-lg overflow-hidden p-0 rounded-2xl">
          {viewingRequest && (
            <>
              <div className="bg-gradient-to-r from-primary/10 via-background to-primary/5 p-5 pb-4 border-b">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-xl shrink-0">
                    <FileText className="h-5 w-5 text-primary stroke-[2.5px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="text-lg font-bold tracking-tight">
                      COE Request Details
                    </DialogTitle>
                    <p className="text-xs font-medium opacity-70 mt-0.5">
                      Reference #{viewingRequest.id}
                    </p>
                  </div>
                  <Badge variant={statusVariantMap[viewingRequest.status?.toUpperCase() ?? ""] ?? "outline"}>
                    {formatStatus(viewingRequest.status ?? "PENDING")}
                  </Badge>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="rounded-xl border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-primary/5">
                        <ArrowRight className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Purpose</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium pl-9">{viewingRequest.purpose}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border bg-card p-4 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-primary/5">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Request Date</span>
                    </div>
                    <p className="text-sm font-medium pl-9">
                      {viewingRequest.request_date
                        ? format(new Date(viewingRequest.request_date), "PPP")
                        : "-"}
                    </p>
                  </div>

                  <div className="rounded-xl border bg-card p-4 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-primary/5">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Approval Date</span>
                    </div>
                    <p className="text-sm font-medium pl-9">
                      {viewingRequest.approval_date
                        ? format(new Date(viewingRequest.approval_date), "PPP")
                        : "-"}
                    </p>
                  </div>
                </div>

                {viewingRequest.status?.toUpperCase() !== "PENDING" && (
                  <div className="rounded-xl border bg-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-primary/5">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">E-Copy</span>
                      </div>
                    </div>
                    <div className="pl-9">
                      {viewingRequest.ecopy_file_url ? (
                        isPreviewable(viewingRequest.status) ? (
                          <button
                            type="button"
                            onClick={() => {
                              handlePreview(viewingRequest.ecopy_file_url!, viewingRequest.doc_title);
                            }}
                            className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-2 hover:underline font-medium"
                          >
                            <Download className="h-3.5 w-3.5" />
                            {viewingRequest.doc_title || "View Document"}
                          </button>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {viewingRequest.doc_title || "Uploaded"}
                          </span>
                        )
                      ) : (
                        <span className="text-sm text-muted-foreground">Not yet uploaded</span>
                      )}
                    </div>
                  </div>
                )}

                {viewingRequest.hr_remarks && (
                  <div className="rounded-xl border border-amber-200/50 bg-amber-50/50 p-4 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-amber-100">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                      </div>
                      <span className="text-xs font-semibold tracking-wider text-amber-700 uppercase">HR Remarks</span>
                    </div>
                    <p className="text-sm pl-9 whitespace-pre-wrap break-all italic text-amber-900">
                      {viewingRequest.hr_remarks}
                    </p>
                  </div>
                )}
              </div>

              <div className="px-5 pb-5 pt-0 flex flex-col sm:flex-row gap-3">
                {viewingRequest.status?.toUpperCase() === "PENDING" && (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-10 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-medium"
                    onClick={() => setIsCancelDialogOpen(true)}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel Request
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsViewDialogOpen(false)}
                  className="flex-1 h-10 rounded-xl font-medium text-muted-foreground hover:bg-muted"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <AlertDialogTitle className="text-center">Cancel COE Request</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Are you sure you want to cancel this Certificate of Employment request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2">
            <AlertDialogCancel className="rounded-xl h-10 px-6" disabled={isCancelling}>
              Keep Request
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl h-10 px-6 bg-red-600 hover:bg-red-700"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Yes, Cancel Request"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
=======
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>COE Request Details</DialogTitle>
          </DialogHeader>
          {viewingRequest && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-muted-foreground">Purpose</p>
                  <p>{viewingRequest.purpose}</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">Status</p>
                  <p>
                    <Badge variant={statusVariantMap[viewingRequest.status?.toUpperCase() ?? ""] ?? "outline"}>
                      {formatStatus(viewingRequest.status ?? "PENDING")}
                    </Badge>
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">Request Date</p>
                  <p>
                    {viewingRequest.request_date
                      ? format(new Date(viewingRequest.request_date), "PPP")
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">Approval Date</p>
                  <p>
                    {viewingRequest.approval_date
                      ? format(new Date(viewingRequest.approval_date), "PPP")
                      : "-"}
                  </p>
                </div>
              </div>
              {viewingRequest.ecopy_file_url && (
                <div className="space-y-1">
                  <p className="font-semibold text-muted-foreground text-sm">E-Copy</p>
                  {isPreviewable(viewingRequest.status) ? (
                    <button
                      type="button"
                      onClick={() => {
                        handlePreview(viewingRequest.ecopy_file_url!, viewingRequest.doc_title);
                      }}
                      className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-2 hover:underline"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      {viewingRequest.doc_title}
                    </button>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {viewingRequest.doc_title}
                    </span>
                  )}
                </div>
              )}
              {viewingRequest.hr_remarks && (
                <div className="space-y-1">
                  <p className="font-semibold text-muted-foreground text-sm">HR Remarks</p>
                  <p className="text-sm whitespace-pre-wrap break-all rounded-md bg-muted p-3 italic">
                    {viewingRequest.hr_remarks}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
>>>>>>> master
    </div>
  );
}
