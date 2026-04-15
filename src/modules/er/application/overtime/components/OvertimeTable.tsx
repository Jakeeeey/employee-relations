"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { OvertimeRequest } from "../types";
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


interface OvertimeTableProps {
  data: OvertimeRequest[];
  onEdit: (request: OvertimeRequest) => void;
  onView: (request: OvertimeRequest) => void;
}

export function OvertimeTable({ data, onEdit, onView }: OvertimeTableProps) {
  const columns: ColumnDef<OvertimeRequest>[] = [
    {
      accessorKey: "request_date",
      header: "Date",
      cell: ({ row }) => {
        const val = row.getValue("request_date") as string;
        return val ? format(new Date(val), "PPP") : "-";
      },
    },
    {
      accessorKey: "ot_from",
      header: "OT Start",
      cell: ({ row }) => {
        const val = row.getValue("ot_from") as string;
        return val ? val.substring(0, 5) : "-"; 
      }
    },
    {
      accessorKey: "ot_to",
      header: "OT End",
      cell: ({ row }) => {
        const val = row.getValue("ot_to") as string;
        return val ? val.substring(0, 5) : "-"; 
      }
    },
    {
      accessorKey: "duration_minutes",
      header: "Duration (Mins)",
    },
    {
      accessorKey: "purpose",
      header: "Purpose",
      cell: ({ row }) => <span className="truncate max-w-[200px] block">{row.getValue("purpose")}</span>,
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
