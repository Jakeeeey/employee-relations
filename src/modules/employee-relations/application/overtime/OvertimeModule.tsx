"use client";

import { useState } from "react";
import { toast } from "sonner";
import { OvertimeTable } from "./components/OvertimeTable";
import { OvertimeForm } from "./components/OvertimeForm";
import { useOvertime } from "./hooks/useOvertime";
import { OvertimeRequest, CreateOvertimeInput } from "./types";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface OvertimeModuleProps {
  userId: number;
  departmentId?: number | null;
}

export default function OvertimeModule({ userId, departmentId }: OvertimeModuleProps) {
  const { requests, isLoading, createRequest, updateRequest } = useOvertime(userId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<OvertimeRequest | null>(null);
  const [viewingRequest, setViewingRequest] = useState<OvertimeRequest | null>(null);

  const handleOpenCreate = () => {
    setEditingRequest(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (request: OvertimeRequest) => {
    setEditingRequest(request);
    setIsDialogOpen(true);
  };

  const handleOpenView = (request: OvertimeRequest) => {
    setViewingRequest(request);
    setIsViewDialogOpen(true);
  };

  const onSubmit = async (data: CreateOvertimeInput) => {
    const payload = { ...data, user_id: userId, department_id: departmentId };
    
    const isDuplicate = requests.some(r => {
      // Don't check against the current record being edited
      if (editingRequest && r.overtime_id === editingRequest.overtime_id) return false;
      const existingDate = r.request_date ? r.request_date.substring(0, 10) : null;
      const newDate = payload.request_date ? payload.request_date.substring(0, 10) : null;
      return existingDate === newDate && r.status !== "rejected" && r.status !== "cancelled";
    });

    if (isDuplicate) {
      toast.error("Duplicate Request", {
        description: "You already have an overtime request for this date.",
      });
      return;
    }

    if (editingRequest) {
      await updateRequest(editingRequest.overtime_id!, payload);
    } else {
      await createRequest(payload);
    }
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Overtime Management</h2>
          <p className="text-muted-foreground">
            Manage your overtime requests and track their status.
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Overtime Request
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <OvertimeTable data={requests} onEdit={handleOpenEdit} onView={handleOpenView} />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRequest ? "Edit Overtime Request" : "New Overtime Request"}
            </DialogTitle>
          </DialogHeader>
          <OvertimeForm
            initialData={editingRequest || undefined}
            onSubmit={onSubmit}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Overtime Request Details</DialogTitle>
          </DialogHeader>
          {viewingRequest && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-muted-foreground">Date</p>
                  <p>{viewingRequest.request_date ? format(new Date(viewingRequest.request_date), "PPP") : "-"}</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">Status</p>
                  <p className="capitalize">{viewingRequest.status}</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">Scheduled Timeout</p>
                  <p>{viewingRequest.sched_timeout?.substring(0, 5)}</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">Duration</p>
                  <p>{viewingRequest.duration_minutes} Minutes</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">OT From</p>
                  <p>{viewingRequest.ot_from?.substring(0, 5)}</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">OT To</p>
                  <p>{viewingRequest.ot_to?.substring(0, 5)}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-muted-foreground text-sm">Purpose</p>
                <p className="text-sm whitespace-pre-wrap break-all rounded-md bg-muted p-3">
                  {viewingRequest.purpose}
                </p>
              </div>
              {viewingRequest.remarks && (
                <div className="space-y-1">
                  <p className="font-semibold text-muted-foreground text-sm">Remarks</p>
                  <p className="text-sm whitespace-pre-wrap break-all rounded-md bg-muted p-3 italic">
                    {viewingRequest.remarks}
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
