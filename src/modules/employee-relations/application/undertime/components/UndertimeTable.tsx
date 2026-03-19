"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { UndertimeRequest } from "../types";
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


interface UndertimeTableProps {
  data: UndertimeRequest[];
  onEdit: (request: UndertimeRequest) => void;
  onView: (request: UndertimeRequest) => void;
}

export function UndertimeTable({ data, onEdit, onView }: UndertimeTableProps) {
  const columns: ColumnDef<UndertimeRequest>[] = [
    {
      accessorKey: "request_date",
      header: "Date",
      cell: ({ row }) => {
        const val = row.getValue("request_date") as string;
        return val ? format(new Date(val), "PPP") : "-";
      },
    },
    {
      accessorKey: "sched_timeout",
      header: "Scheduled Out",
      cell: ({ row }) => {
        const val = row.getValue("sched_timeout") as string;
        return val ? val.substring(0, 5) : "-"; // "17:00:00" -> "17:00"
      }
    },
    {
      accessorKey: "actual_timeout",
      header: "Requested Out",
      cell: ({ row }) => {
        const val = row.getValue("actual_timeout") as string;
        return val ? val.substring(0, 5) : "-"; 
      }
    },
    {
      accessorKey: "duration_minutes",
      header: "Undertime (Mins)",
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => <span className="truncate max-w-[200px] block">{row.getValue("reason")}</span>,
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
        const request = row.original;
        const isPending = request.status === "pending";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(request)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem 
                disabled={!isPending} 
                onClick={() => onEdit(request)}
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
