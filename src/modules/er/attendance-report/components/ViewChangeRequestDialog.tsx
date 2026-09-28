"use client";

import { useState } from "react";
import { format, isValid } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AttendanceLog, AttendanceChangeRequest, AttendanceChangeRequestFile } from "../type";

interface ViewChangeRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendanceLog: AttendanceLog | null;
  userId?: number;
  onSuccess?: () => void;
}

function formatTimeOnly(timeStr: string | null | undefined): string {
  if (!timeStr) return "Unchanged";
  // If it's a full ISO string
  if (timeStr.includes("T")) {
    try {
      const date = new Date(timeStr);
      return isValid(date) ? format(date, "hh:mm a") : "Invalid time";
    } catch {
      return timeStr;
    }
  }
  
  // If it's just "HH:mm:ss" or "HH:mm" from input type="time"
  const [hours, minutes] = timeStr.split(":");
  if (hours && minutes) {
    const d = new Date();
    d.setHours(parseInt(hours, 10));
    d.setMinutes(parseInt(minutes, 10));
    return format(d, "hh:mm a");
  }

  return timeStr;
}

export function ViewChangeRequestDialog({
  open,
  onOpenChange,
  attendanceLog,
  onSuccess,
}: ViewChangeRequestDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!attendanceLog || !attendanceLog.pending_change_request) return null;

  const request: AttendanceChangeRequest = attendanceLog.pending_change_request;

  const handleCancelRequest = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/er/attendance-report/request-change/${request.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to cancel request");
      }

      toast.success("Attendance change request cancelled successfully!");
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    setShowConfirm(false);
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pending Attendance Request</DialogTitle>
          <DialogDescription>
            You have a pending request to change attendance for{" "}
            <span className="font-semibold text-foreground">
              {format(new Date(request.log_date), "MMM dd, yyyy")}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          
          <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 dark:bg-slate-800/50 p-4 rounded-md border border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-muted-foreground mb-1">Requested Time In</p>
              <p className="font-medium">{formatTimeOnly(request.time_in)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Requested Time Out</p>
              <p className="font-medium">{formatTimeOnly(request.time_out)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Lunch Start</p>
              <p className="font-medium">{formatTimeOnly(request.lunch_start)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Lunch End</p>
              <p className="font-medium">{formatTimeOnly(request.lunch_end)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Break Start</p>
              <p className="font-medium">{formatTimeOnly(request.break_start)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Break End</p>
              <p className="font-medium">{formatTimeOnly(request.break_end)}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Reason</p>
            <p className="text-sm bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md whitespace-pre-wrap border border-slate-100 dark:border-slate-800">
              {request.reason}
            </p>
          </div>

          {request.attendance_change_request_files && request.attendance_change_request_files.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Attached Proof(s)</p>
              <div className="flex flex-col gap-2">
                {request.attendance_change_request_files.map((fileRecord: AttendanceChangeRequestFile) => {
                  const fileData = typeof fileRecord.directus_files_id === 'object' ? fileRecord.directus_files_id : { id: fileRecord.directus_files_id, filename_download: 'Attached File' };
                  if (!fileData || !fileData.id) return null;
                  
                  return (
                    <a
                      key={fileData.id}
                      href={`${process.env.NEXT_PUBLIC_API_BASE_URL}/assets/${fileData.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-600 hover:underline bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md border border-slate-100 dark:border-slate-800 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 shrink-0"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                      {fileData.filename_download || "Attached File"}
                    </a>
                  );
                })}
              </div>
            </div>
          )}
          
        </div>

        <DialogFooter className="pt-2 flex flex-col sm:flex-row !justify-between items-center sm:justify-between w-full gap-2">
          {showConfirm ? (
            <div className="flex items-center gap-2 mr-auto bg-red-50 dark:bg-red-950/30 p-2 rounded-md border border-red-100 dark:border-red-900 w-full sm:w-auto">
              <span className="text-sm text-red-600 dark:text-red-400 font-medium whitespace-nowrap px-2">Cancel request?</span>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleCancelRequest}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Wait..." : "Yes, Cancel"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirm(false)}
                disabled={isSubmitting}
                className="hover:bg-red-100 dark:hover:bg-red-900/50"
              >
                No
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowConfirm(true)}
              className="mr-auto w-full sm:w-auto"
            >
              Cancel Request
            </Button>
          )}
          
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto mt-2 sm:mt-0"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
