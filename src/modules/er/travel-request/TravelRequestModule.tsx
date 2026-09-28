/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
 
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TravelRequestDataTable } from "./components/TravelRequestDataTable";
import { TravelRequestForm } from "./components/TravelRequestForm";
import { TravelRequestDetailsDialog } from "./components/TravelRequestDetailsDialog";
import { useTravelRequests } from "./hooks/useTravelRequests";
import { TravelRequest } from "./types/schema";

export function TravelRequestModule() {
  const { data, coas, isLoading, createRequest, updateStatus } = useTravelRequests();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TravelRequest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);

  const handleSubmit = async (formData: any) => {
    try {
      await createRequest(formData);
      setIsDialogOpen(false);
    } catch (error) {
      // Error is handled in the hook via toast
    }
  };

  const handleView = (request: TravelRequest) => {
    setSelectedRequest(request);
    setIsDetailsOpen(true);
  };

  const filteredData = data.filter(r => showCancelled || r.status !== "cancelled");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Travel Requests</h2>
          <p className="text-muted-foreground">
            Manage and file your travel requests for business trips.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowCancelled(!showCancelled)}
          >
            {showCancelled ? "Hide Cancelled" : "Show Cancelled"}
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                File Request
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New Travel Request</DialogTitle>
                <DialogDescription>
                  Fill out the details for your upcoming business travel.
                </DialogDescription>
              </DialogHeader>
              <TravelRequestForm onSubmit={handleSubmit} isLoading={isLoading} coas={coas} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <TravelRequestDataTable 
        data={filteredData} 
        onCancel={(id) => updateStatus(id, "cancelled")}
        onView={handleView}
        isLoading={isLoading} 
      />

      <TravelRequestDetailsDialog
        request={selectedRequest}
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        coas={coas}
      />
    </div>
  );
}


