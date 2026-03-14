"use client";

import { useState } from "react";
import { LeaveTable } from "./components/LeaveTable";
import { LeaveForm } from "./components/LeaveForm";
import { useLeave } from "./hooks/useLeave";
import { LeaveRequest, CreateLeaveInput } from "./types";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
  const [editingLeave, setEditingLeave] = useState<LeaveRequest | null>(null);

  const handleOpenCreate = () => {
    setEditingLeave(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (leave: LeaveRequest) => {
    setEditingLeave(leave);
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: CreateLeaveInput) => {
    const payload = { ...data, user_id: userId, department_id: departmentId };
    
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
        <LeaveTable data={leaves} onEdit={handleOpenEdit} />
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
    </div>
  );
}
