"use client";

import { useState } from "react";
import { ConcernTable } from "./components/ConcernTable";
import { ConcernForm } from "./components/ConcernForm";
import { useConcern } from "./hooks/useConcern";
import { Concern } from "./type";
import { Button } from "@/components/ui/button";
import { Plus, RotateCcw, AlertCircle, FileText, Loader2, X, ArrowRight, Calendar, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  REVIEWED: "default",
  RESOLVED: "default",
  DISMISSED: "destructive",
  CANCELLED: "secondary",
};

function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

interface ConcernModuleProps {
  userId: number;
}

const ITEMS_PER_PAGE = 10;
type StatusFilter = "all" | "PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED" | "CANCELLED";

export default function ConcernModule({ userId }: ConcernModuleProps) {
  const { concerns, isLoading, error, refresh, createConcern, updateConcern } = useConcern();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingConcern, setViewingConcern] = useState<Concern | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleOpenCreate = () => {
    setIsDialogOpen(true);
  };

  const handleOpenView = (concern: Concern) => {
    setViewingConcern(concern);
    setIsViewDialogOpen(true);
  };

  const onSubmit = async (data: { subject_of_concern: string; concern: string; is_anonymous: boolean }) => {
    await createConcern({
      user_id: userId,
      subject_of_concern: data.subject_of_concern,
      concern: data.concern,
      is_anonymous: data.is_anonymous,
    });
    setIsDialogOpen(false);
  };

  const handleCancel = async () => {
    if (!viewingConcern?.id) return;
    setIsCancelling(true);
    try {
      await updateConcern(viewingConcern.id, { status: "CANCELLED" });
      setIsCancelDialogOpen(false);
      setIsViewDialogOpen(false);
    } catch {
      // error toast handled by useConcern
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
      setCurrentPage(1);
    } catch (err) {
      console.error("Error refreshing concerns:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredConcerns =
    statusFilter === "all"
      ? concerns
      : concerns.filter((c) => c.status?.toUpperCase() === statusFilter);

  const totalPages = Math.ceil(filteredConcerns.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredConcerns.length);
  const paginatedConcerns = filteredConcerns.slice(startIndex, endIndex);

  if (isLoading && concerns.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner />
      </div>
    );
  }

  if (error && concerns.length === 0) {
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
          <h2 className="text-2xl font-bold tracking-tight">Employee Concerns</h2>
          <p className="text-muted-foreground">
            File and manage your workplace concerns.
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
            New Concern
          </Button>
        </div>
      </div>

      <Card className="border border-slate-200 dark:border-slate-700">
        <CardHeader>
          <div className="flex items-center gap-3 w-full">
            <CardTitle className="shrink-0">All Concerns</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Showing {filteredConcerns.length} record(s)
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
                  <SelectItem value="REVIEWED">Reviewed</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="DISMISSED">Dismissed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredConcerns.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No concerns found</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border border-slate-200 dark:border-slate-700 overflow-x-auto">
                <ConcernTable
                  data={paginatedConcerns}
                  onView={handleOpenView}
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
                <div className="text-sm text-muted-foreground order-2 sm:order-1">
                  Page {currentPage} of {totalPages} &bull; Showing {endIndex} of{" "}
                  {filteredConcerns.length} records
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Concern</DialogTitle>
          </DialogHeader>
          <ConcernForm
            onSubmit={onSubmit}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-lg overflow-hidden p-0 rounded-2xl">
          {viewingConcern && (
            <>
              <div className="bg-gradient-to-r from-primary/10 via-background to-primary/5 p-5 pb-4 border-b">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-xl shrink-0">
                    <FileText className="h-5 w-5 text-primary stroke-[2.5px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="text-lg font-bold tracking-tight">
                      Concern Details
                    </DialogTitle>
                    <p className="text-xs font-medium opacity-70 mt-0.5">
                      Reference #{viewingConcern.id}
                    </p>
                  </div>
                  <Badge variant={statusVariantMap[viewingConcern.status?.toUpperCase() ?? ""] ?? "outline"}>
                    {formatStatus(viewingConcern.status ?? "PENDING")}
                  </Badge>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="rounded-xl border bg-card p-4 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-primary/5">
                      <ArrowRight className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Subject</span>
                  </div>
                  <p className="text-sm font-medium pl-9">
                    {viewingConcern.is_anonymous ? "——— (Anonymous)" : viewingConcern.subject_of_concern}
                  </p>
                </div>

                <div className="rounded-xl border bg-card p-4 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-primary/5">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Concern</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words pl-9">
                    {viewingConcern.concern}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border bg-card p-4 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-primary/5">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Filed At</span>
                    </div>
                    <p className="text-sm font-medium pl-9">
                      {viewingConcern.created_at
                        ? format(new Date(viewingConcern.created_at), "PPP")
                        : "-"}
                    </p>
                  </div>

                  <div className="rounded-xl border bg-card p-4 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-primary/5">
                        <AlertTriangle className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Anonymous</span>
                    </div>
                    <p className="text-sm font-medium pl-9">
                      {viewingConcern.is_anonymous ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5 pt-0 flex flex-col sm:flex-row gap-3">
                {viewingConcern.status?.toUpperCase() === "PENDING" && (
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
            <AlertDialogTitle className="text-center">Cancel Concern</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Are you sure you want to cancel this concern? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2">
            <AlertDialogCancel className="rounded-xl h-10 px-6" disabled={isCancelling}>
              Keep Concern
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
                "Yes, Cancel Concern"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
