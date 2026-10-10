/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { TravelRequest } from "../types/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { FileText, FileX, Eye, User, Building2 } from "lucide-react";

interface TravelRequestDataTableProps {
  data: TravelRequest[];
  onCancel?: (id: number) => void;
  onView?: (request: TravelRequest) => void;
  isLoading?: boolean;
  isApproverTable?: boolean;
}

export function TravelRequestDataTable({
  data,
  onCancel,
  onView,
  isLoading,
  isApproverTable = false,
}: TravelRequestDataTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300";
      case "approved":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300";
      case "rejected":
        return "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300";
      case "cancelled":
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  if (isLoading) {
    return (
      <Card className="border-slate-200/80 dark:border-white/10 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.06)] dark:shadow-none bg-white/70 dark:bg-slate-900/50 backdrop-blur-md">
        <CardContent className="p-12 text-center text-muted-foreground">
          Loading travel requests...
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="border-slate-200/80 dark:border-white/10 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.06)] dark:shadow-none bg-white/70 dark:bg-slate-900/50 backdrop-blur-md">
        <CardContent className="p-12 text-center text-muted-foreground">
          {isApproverTable
            ? "No travel requests currently pending for review."
            : "No travel requests found."}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200/80 dark:border-white/10 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.06)] dark:shadow-none bg-white/70 dark:bg-slate-900/50 backdrop-blur-md overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50/70 dark:bg-slate-800/50">
          <TableRow>
            {isApproverTable && (
              <TableHead className="min-w-[180px]">Employee / Department</TableHead>
            )}
            <TableHead>Destination</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Purpose</TableHead>
            <TableHead>Communication Letter</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((request) => (
            <TableRow key={request.travel_id} className="hover:bg-muted/40 transition-colors">
              {isApproverTable && (
                <TableCell>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-medium text-foreground text-sm">
                      <User className="h-3.5 w-3.5 text-primary" />
                      {request.employee_name || `User ID: ${request.user_id}`}
                    </div>
                    {request.department_name && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        {request.department_name}
                      </div>
                    )}
                  </div>
                </TableCell>
              )}

              <TableCell className="font-medium text-foreground">
                {request.destination}
              </TableCell>

              <TableCell>
                <div className="text-xs space-y-0.5">
                  <div className="font-medium">
                    {format(new Date(request.travel_from), "MMM d, yyyy")}
                  </div>
                  <div className="text-muted-foreground">
                    to {format(new Date(request.travel_to), "MMM d, yyyy")}
                  </div>
                </div>
              </TableCell>

              <TableCell className="max-w-[200px] truncate text-sm" title={request.purpose}>
                {request.purpose}
              </TableCell>

              <TableCell>
                {request.attachment_uuid ? (
                  <Badge
                    variant="outline"
                    className="gap-1 text-xs font-normal border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                  >
                    <FileText className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    Letter Attached
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="gap-1 text-xs font-normal text-muted-foreground"
                  >
                    <FileX className="h-3 w-3" />
                    None
                  </Badge>
                )}
              </TableCell>

              <TableCell>
                {request.requires_budget ? (
                  <div className="font-medium text-emerald-600 dark:text-emerald-400 text-sm">
                    {new Intl.NumberFormat("en-PH", {
                      style: "currency",
                      currency: "PHP",
                    }).format((request as any).total_budget || 0)}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs">No Budget</span>
                )}
              </TableCell>

              <TableCell>
                <Badge className={getStatusColor(request.status)} variant="outline">
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </Badge>
              </TableCell>

              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant={isApproverTable && request.status === "pending" ? "default" : "outline"}
                    size="sm"
                    className="gap-1 text-xs h-8"
                    onClick={() => onView && onView(request)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {isApproverTable && request.status === "pending" ? "Review & Preview" : "View"}
                  </Button>

                  {!isApproverTable && request.status === "pending" && onCancel && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="text-xs h-8"
                      onClick={() => request.travel_id && onCancel(request.travel_id)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
