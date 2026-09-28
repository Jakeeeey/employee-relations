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

interface TravelRequestDataTableProps {
  data: TravelRequest[];
  onCancel: (id: number) => void;
  onView?: (request: TravelRequest) => void;
  isLoading?: boolean;
}

export function TravelRequestDataTable({ data, onCancel, onView, isLoading }: TravelRequestDataTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading travel requests...</div>;
  }

  if (data.length === 0) {
    return (
      <Card className="border-slate-200/80 dark:border-white/10 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.06)] dark:shadow-none bg-white/70 dark:bg-slate-900/50 backdrop-blur-md">
        <CardContent className="p-12 text-center text-muted-foreground">
          No travel requests found.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200/80 dark:border-white/10 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.06)] dark:shadow-none bg-white/70 dark:bg-slate-900/50 backdrop-blur-md overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
          <TableRow>
            <TableHead>Destination</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Purpose</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((request) => (
            <TableRow key={request.travel_id}>
              <TableCell className="font-medium">{request.destination}</TableCell>
              <TableCell>
                <div className="text-sm">
                  {format(new Date(request.travel_from), "MMM d, yyyy")} -{" "}
                  {format(new Date(request.travel_to), "MMM d, yyyy")}
                </div>
              </TableCell>
              <TableCell className="max-w-[200px] truncate" title={request.purpose}>
                {request.purpose}
              </TableCell>
              <TableCell>
                {request.requires_budget ? (
                  <div className="font-medium text-emerald-600 dark:text-emerald-400">
                    {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format((request as any).total_budget || 0)}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">None</span>
                )}
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(request.status)} variant="secondary">
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView && onView(request)}
                  >
                    View
                  </Button>
                  {request.status === "pending" && (
                    <Button
                      variant="destructive"
                      size="sm"
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


