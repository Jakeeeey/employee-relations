"use client";

import { useState } from "react";
import { OvertimeTable } from "./components/OvertimeTable";
import { OvertimeForm } from "./components/OvertimeForm";
import { useOvertime } from "./hooks/useOvertime";
import { OvertimeRequest, CreateOvertimeInput } from "./types";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
  const [editingRequest, setEditingRequest] = useState<OvertimeRequest | null>(null);

  const handleOpenCreate = () => {
    setEditingRequest(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (request: OvertimeRequest) => {
    setEditingRequest(request);
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: CreateOvertimeInput) => {
    const payload = { ...data, user_id: userId, department_id: departmentId };
    
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
        <OvertimeTable data={requests} onEdit={handleOpenEdit} />
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
    </div>
  );
}
