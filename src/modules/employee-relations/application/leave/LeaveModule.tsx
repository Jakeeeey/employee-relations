"use client";

import { useState } from "react";
import { toast } from "sonner";
import { LeaveTable } from "./components/LeaveTable";
import { LeaveForm } from "./components/LeaveForm";
import { useLeave } from "./hooks/useLeave";
import { LeaveRequest, CreateLeaveInput } from "./types";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LeaveModuleProps {
  userId: number;
  departmentId?: number | null;
}

export default function LeaveModule({ userId, departmentId }: LeaveModuleProps) {
  const { leaves, isLoading, createLeave, updateLeave } = useLeave(userId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState<LeaveRequest | null>(null);
  const [viewingLeave, setViewingLeave] = useState<LeaveRequest | null>(null);

  const handleOpenCreate = () => {
    setEditingLeave(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (leave: LeaveRequest) => {
    setEditingLeave(leave);
    setIsDialogOpen(true);
  };

  const handleOpenView = (leave: LeaveRequest) => {
    setViewingLeave(leave);
    setIsViewDialogOpen(true);
  };

  const onSubmit = async (data: CreateLeaveInput) => {
    const payload = { ...data, user_id: userId, department_id: departmentId };

    const isOverlap = leaves.some(r => {
      // Don't check against the current record being edited
      if (editingLeave && r.leave_id === editingLeave.leave_id) return false;
      if (r.status === "rejected" || r.status === "cancelled") return false;

      const existingStart = r.leave_start?.substring(0, 10);
      const existingEnd = r.leave_end?.substring(0, 10);
      const newStart = payload.leave_start?.substring(0, 10);
      const newEnd = payload.leave_end?.substring(0, 10);
      
      if (!existingStart || !existingEnd || !newStart || !newEnd) return false;

      // Overlap condition: (Start1 <= End2) and (Start2 <= End1)
      return (existingStart <= newEnd) && (newStart <= existingEnd);
    });

    if (isOverlap) {
      toast.error("Leave Conflict", {
        description: "The selected dates overlap with an existing leave request.",
      });
      return;
    }

    if (editingLeave) {
      await updateLeave(editingLeave.leave_id!, payload);
    } else {
      await createLeave(payload);
    }
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Leave Management</h2>
          <p className="text-muted-foreground">
            Manage your leave requests and track their status.
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Leave Request
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <LeaveTable data={leaves} onEdit={handleOpenEdit} onView={handleOpenView} />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingLeave ? "Edit Leave Request" : "New Leave Request"}
            </DialogTitle>
          </DialogHeader>
          <LeaveForm
            initialData={editingLeave || undefined}
            onSubmit={onSubmit}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Leave Request Details</DialogTitle>
          </DialogHeader>
          {viewingLeave && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-muted-foreground">Type</p>
                  <p className="capitalize">{viewingLeave.leave_type}</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">Status</p>
                  <p className="capitalize">{viewingLeave.status}</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">Start Date</p>
                  <p>{viewingLeave.leave_start ? format(new Date(viewingLeave.leave_start), "PPP") : "-"}</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">End Date</p>
                  <p>{viewingLeave.leave_end ? format(new Date(viewingLeave.leave_end), "PPP") : "-"}</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">Total Days</p>
                  <p>{viewingLeave.total_days} Day(s)</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-muted-foreground text-sm">Reason</p>
                <p className="text-sm whitespace-pre-wrap rounded-md bg-muted p-3">
                  {viewingLeave.reason}
                </p>
              </div>
              {viewingLeave.remarks && (
                <div className="space-y-1">
                  <p className="font-semibold text-muted-foreground text-sm">Remarks</p>
                  <p className="text-sm whitespace-pre-wrap rounded-md bg-muted p-3 italic">
                    {viewingLeave.remarks}
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
