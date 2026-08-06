"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { LeaveRequest } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Eye, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


interface LeaveTableProps {
  data: LeaveRequest[];
  onEdit: (leave: LeaveRequest) => void;
  onView: (leave: LeaveRequest) => void;
}

export function LeaveTable({ data, onEdit, onView }: LeaveTableProps) {
  const columns: ColumnDef<LeaveRequest>[] = [
    {
      accessorKey: "leave_type",
      header: "Type",
      cell: ({ row }) => (
        <span className="capitalize">{row.getValue("leave_type")}</span>
      ),
    },
    {
      accessorKey: "leave_start",
      header: "Start Date",
      cell: ({ row }) => {
        const val = row.getValue("leave_start") as string;
        return val ? format(new Date(val), "PPP") : "-";
      },
    },
    {
      accessorKey: "leave_end",
      header: "End Date",
      cell: ({ row }) => {
        const val = row.getValue("leave_end") as string;
        return val ? format(new Date(val), "PPP") : "-";
      },
    },
    {
      accessorKey: "total_days",
      header: "Days",
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => <span className="truncate max-w-[200px] block">{row.getValue("reason")}</span>,
    },
    {
      accessorKey: "is_paid",
      header: "Payment",
      cell: ({ row }) => {
        const isPaid = row.getValue("is_paid");
        const resolvedIsPaid = isPaid === true || isPaid === 1 || String(isPaid) === "true";
        return (
          <Badge 
            variant="outline" 
            className={resolvedIsPaid 
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60" 
              : "bg-muted/50 text-muted-foreground border-border"
            }
          >
            {resolvedIsPaid ? "Paid" : "Unpaid"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        let variant: "default" | "secondary" | "destructive" | "outline" = "default";
        
        switch (status) {
          case "pending": variant = "secondary"; break;
          case "approved": variant = "default"; break;
          case "rejected": 
          case "cancelled": variant = "destructive"; break;
        }

        return <Badge variant={variant} className="capitalize">{status}</Badge>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const leave = row.original;
        const isPending = leave.status === "pending";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(leave)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem 
                disabled={!isPending} 
                onClick={() => onEdit(leave)}
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Request
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return <DataTable columns={columns} data={data} />;
}
