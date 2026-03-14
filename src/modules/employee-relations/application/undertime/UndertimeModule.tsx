"use client";

import { useState } from "react";
import { UndertimeTable } from "./components/UndertimeTable";
import { UndertimeForm } from "./components/UndertimeForm";
import { useUndertime } from "./hooks/useUndertime";
import { UndertimeRequest, CreateUndertimeInput } from "./types";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UndertimeModuleProps {
  userId: number;
  departmentId?: number | null;
}

export default function UndertimeModule({ userId, departmentId }: UndertimeModuleProps) {
  const { requests, isLoading, createRequest, updateRequest } = useUndertime(userId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<UndertimeRequest | null>(null);

  const handleOpenCreate = () => {
    setEditingRequest(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (request: UndertimeRequest) => {
    setEditingRequest(request);
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: CreateUndertimeInput) => {
    const payload = { ...data, user_id: userId, department_id: departmentId };
    
    if (editingRequest) {
      await updateRequest(editingRequest.undertime_id!, payload);
    } else {
      await createRequest(payload);
    }
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Undertime Management</h2>
          <p className="text-muted-foreground">
            Manage your undertime requests and track their status.
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Undertime Request
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <UndertimeTable data={requests} onEdit={handleOpenEdit} />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRequest ? "Edit Undertime Request" : "New Undertime Request"}
            </DialogTitle>
          </DialogHeader>
          <UndertimeForm
            initialData={editingRequest || undefined}
            onSubmit={onSubmit}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
