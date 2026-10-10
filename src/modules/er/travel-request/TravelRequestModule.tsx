/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Plus, CheckSquare, PlaneTakeoff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TravelRequestDataTable } from "./components/TravelRequestDataTable";
import { TravelRequestForm } from "./components/TravelRequestForm";
import { TravelRequestDetailsDialog } from "./components/TravelRequestDetailsDialog";
import { useTravelRequests } from "./hooks/useTravelRequests";
import { TravelRequest } from "./types/schema";

export function TravelRequestModule() {
  const {
    data,
    approvalsData,
    coas,
    isLoading,
    refresh,
    createRequest,
    updateStatus,
  } = useTravelRequests();

  const [activeTab, setActiveTab] = useState("my_requests");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TravelRequest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isApproverModal, setIsApproverModal] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);
  const [approvalsFilter, setApprovalsFilter] = useState<string>("all");

  const handleSubmit = async (formData: any) => {
    try {
      await createRequest(formData);
      setIsDialogOpen(false);
    } catch {
      // Error is handled in the hook via toast
    }
  };

  const handleView = (request: TravelRequest, approverMode = false) => {
    setSelectedRequest(request);
    setIsApproverModal(approverMode);
    setIsDetailsOpen(true);
  };

  const filteredMyData = data.filter((r) => showCancelled || r.status !== "cancelled");

  const filteredApprovalsData = approvalsData.filter((r) => {
    if (approvalsFilter === "all") return true;
    return r.status === approvalsFilter;
  });

  const pendingApprovalsCount = approvalsData.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <PlaneTakeoff className="h-6 w-6 text-primary" />
            Travel Order Requests
          </h2>
          <p className="text-muted-foreground text-sm">
            Manage, file, and review official travel orders and supporting communication letters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refresh()}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 shadow-sm">
                <Plus className="h-4 w-4" />
                File Travel Request
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New Travel Request</DialogTitle>
                <DialogDescription>
                  Fill out the travel details and attach an official Communication Letter or Memo for approval.
                </DialogDescription>
              </DialogHeader>
              <TravelRequestForm onSubmit={handleSubmit} isLoading={isLoading} coas={coas} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-2">
          <TabsList className="grid w-full sm:w-auto grid-cols-2">
            <TabsTrigger value="my_requests" className="gap-2 text-xs sm:text-sm">
              <PlaneTakeoff className="h-4 w-4" />
              My Requests
              <Badge variant="secondary" className="ml-1 text-[11px] px-1.5 py-0">
                {data.length}
              </Badge>
            </TabsTrigger>

            <TabsTrigger value="approvals" className="gap-2 text-xs sm:text-sm">
              <CheckSquare className="h-4 w-4" />
              Approvals
              {pendingApprovalsCount > 0 ? (
                <Badge
                  variant="destructive"
                  className="ml-1 text-[11px] px-1.5 py-0 bg-amber-500 hover:bg-amber-600"
                >
                  {pendingApprovalsCount}
                </Badge>
              ) : (
                <Badge variant="secondary" className="ml-1 text-[11px] px-1.5 py-0">
                  {approvalsData.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab Sub-actions */}
          {activeTab === "my_requests" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCancelled(!showCancelled)}
              className="text-xs self-end sm:self-auto"
            >
              {showCancelled ? "Hide Cancelled" : "Show Cancelled"}
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <span className="text-xs text-muted-foreground mr-1">Filter:</span>
              {(["all", "pending", "approved", "rejected"] as const).map((status) => (
                <Button
                  key={status}
                  variant={approvalsFilter === status ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs capitalize"
                  onClick={() => setApprovalsFilter(status)}
                >
                  {status}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Tab 1: My Travel Requests */}
        <TabsContent value="my_requests" className="mt-4 space-y-4">
          <TravelRequestDataTable
            data={filteredMyData}
            onCancel={(id) => updateStatus(id, "cancelled")}
            onView={(req) => handleView(req, false)}
            isLoading={isLoading}
            isApproverTable={false}
          />
        </TabsContent>

        {/* Tab 2: Approvals View */}
        <TabsContent value="approvals" className="mt-4 space-y-4">
          <div className="flex items-center justify-between bg-muted/40 p-3 rounded-lg border text-sm">
            <div>
              <p className="font-medium text-foreground">
                Official Travel Order Review Queue
              </p>
              <p className="text-xs text-muted-foreground">
                Review employee travel requests, examine attached Communication Letters/Memos, and take action.
              </p>
            </div>
            {pendingApprovalsCount > 0 && (
              <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300">
                {pendingApprovalsCount} Pending Decision
              </Badge>
            )}
          </div>

          <TravelRequestDataTable
            data={filteredApprovalsData}
            onView={(req) => handleView(req, true)}
            isLoading={isLoading}
            isApproverTable={true}
          />
        </TabsContent>
      </Tabs>

      {/* Details & Approver Review Dialog */}
      <TravelRequestDetailsDialog
        request={selectedRequest}
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        coas={coas}
        isApprover={isApproverModal}
        onApprove={async (id, remarks) => {
          await updateStatus(id, "approved", remarks);
        }}
        onReject={async (id, remarks) => {
          await updateStatus(id, "rejected", remarks);
        }}
      />
    </div>
  );
}
