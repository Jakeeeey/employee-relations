"use client";

import { useState } from "react";
import { COETable } from "./components/COETable";
import { COEForm } from "./components/COEForm";
import { useCOE } from "./hooks/useCOE";
import { COERequest } from "./type";
import { getFileProxyUrl } from "./fileProxy";
import { Button } from "@/components/ui/button";
import { Plus, RotateCcw, AlertCircle, Download, FileText, Loader2, X } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const statusVariantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  APPROVED: "default",
  RELEASED: "default",
  REJECTED: "destructive",
  CANCELLED: "destructive",
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

  const handleOpenCreate = () => {
    setEditingRequest(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (request: COERequest) => {
    setEditingRequest(request);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Certificate of Employment</h2>
          <p className="text-muted-foreground">
            Request and manage your Certificate of Employment.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-9 text-sm w-36 justify-start pl-3 text-left font-normal border border-slate-200 dark:border-slate-700"
          >
            <RotateCcw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New COE Request
          </Button>
        </div>
      </div>

      <Card className="border border-slate-200 dark:border-slate-700">
        <CardHeader>
          <div className="flex flex-row items-end justify-between gap-4">
            <div>
              <CardTitle>COE Requests</CardTitle>
              <CardDescription>
                Showing {filteredRequests.length} record(s)
              </CardDescription>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val as StatusFilter);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-sm w-36 justify-start pl-3 text-left font-normal border border-slate-200 dark:border-slate-700">
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
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No COE requests found</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border border-slate-200 dark:border-slate-700 h-96">
                <COETable
                  data={paginatedRequests}
                  onView={handleOpenView}
                  onPreview={handlePreview}
                />
              </div>

              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages} &bull; Showing {endIndex} of{" "}
                  {filteredRequests.length} records
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border border-slate-200 dark:border-slate-700"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border border-slate-200 dark:border-slate-700"
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>COE Request Details</DialogTitle>
          </DialogHeader>
          {viewingRequest && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
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
    </div>
  );
}
