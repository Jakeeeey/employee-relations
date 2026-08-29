"use client";

import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { AttendanceLog } from "../type";
import { format, isValid } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, AlertCircle, Clock, Palmtree, UserX } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { RequestChangeDialog } from "./RequestChangeDialog";
import { ViewChangeRequestDialog } from "./ViewChangeRequestDialog";
import { cn } from "@/lib/utils";

interface AttendanceReportTableProps {
  data: AttendanceLog[];
  userId: number;
  onRefresh?: () => void;
}

function formatDateTime(val: string | undefined, formatStr: string): string {
  if (!val) return "-";
  try {
    const date = new Date(val);
    return isValid(date) ? format(date, formatStr) : "-";
  } catch {
    return "-";
  }
}

export function AttendanceReportTable({ data, userId, onRefresh }: AttendanceReportTableProps) {
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AttendanceLog | null>(null);
  
  const columns: ColumnDef<AttendanceLog>[] = [
    {
      accessorKey: "log_date",
      header: "Date",
      cell: ({ row }) => {
        const dateStr = formatDateTime(row.getValue("log_date") as string, "MMM dd, yyyy");
        const hasPending = row.original.has_pending_change_request;
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{dateStr}</span>
            {hasPending && (
              <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                Change Pending
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "time_in",
      header: "Time In",
      cell: ({ row }) => <span className="font-medium text-slate-700 dark:text-slate-300">{formatDateTime(row.getValue("time_in") as string, "hh:mm a")}</span>,
    },
    {
      accessorKey: "lunch_start",
      header: "Lunch Start",
      cell: ({ row }) => <span className="text-muted-foreground">{formatDateTime(row.getValue("lunch_start") as string, "hh:mm a")}</span>,
    },
    {
      accessorKey: "lunch_end",
      header: "Lunch End",
      cell: ({ row }) => <span className="text-muted-foreground">{formatDateTime(row.getValue("lunch_end") as string, "hh:mm a")}</span>,
    },
    {
      accessorKey: "break_start",
      header: "Break Start",
      cell: ({ row }) => <span className="text-muted-foreground">{formatDateTime(row.getValue("break_start") as string, "hh:mm a")}</span>,
    },
    {
      accessorKey: "break_end",
      header: "Break End",
      cell: ({ row }) => <span className="text-muted-foreground">{formatDateTime(row.getValue("break_end") as string, "hh:mm a")}</span>,
    },
    {
      accessorKey: "time_out",
      header: "Time Out",
      cell: ({ row }) => <span className="font-medium text-slate-700 dark:text-slate-300">{formatDateTime(row.getValue("time_out") as string, "hh:mm a")}</span>,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 shadow-lg rounded-xl">
              <DropdownMenuItem
                className="cursor-pointer py-2.5 rounded-lg"
                onClick={() => {
                  setSelectedLog(row.original);
                  if (row.original.has_pending_change_request) {
                    setIsViewDialogOpen(true);
                  } else {
                    setIsRequestDialogOpen(true);
                  }
                }}
              >
                <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{row.original.has_pending_change_request ? "View Pending Request" : "Request Change"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div
      className="[&_table]:border-collapse [&_tbody_tr]:h-[3.25rem] [&_tbody_tr:last-child]:border-0 [&_tbody_td]:px-4 [&_tbody_td]:py-2"
      data-slot="attendance-table"
    >
      <div className="w-full">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 border-b border-border/50"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-11 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const isAbsent = !row.original.time_in;
                const isLeave = row.original.is_on_leave;
                const isPendingLeave = row.original.is_pending_leave;
                
                return (
                  <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className={cn(
                        "border-b border-border/50 transition-colors",
                        isAbsent && isLeave
                          ? "bg-sky-50/50 hover:bg-sky-100/50 dark:bg-sky-950/10 dark:hover:bg-sky-950/20"
                          : isAbsent && isPendingLeave
                            ? "bg-amber-50/50 hover:bg-amber-100/50 dark:bg-amber-950/10 dark:hover:bg-amber-950/20"
                            : isAbsent 
                              ? "bg-rose-50/50 hover:bg-rose-100/50 dark:bg-rose-950/10 dark:hover:bg-rose-950/20" 
                              : "hover:bg-muted/30"
                      )}
                    >
                    {isAbsent ? (
                      <>
                        <TableCell>
                          {flexRender(row.getVisibleCells()[0].column.columnDef.cell, row.getVisibleCells()[0].getContext())}
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell className={cn(
                          "font-medium", 
                          isLeave ? "text-sky-600 dark:text-sky-400" : 
                          isPendingLeave ? "text-amber-600 dark:text-amber-500" : 
                          "text-rose-600 dark:text-rose-500"
                        )}>
                          <div className="flex items-center gap-2">
                            {isLeave ? <Palmtree className="h-4 w-4" /> : isPendingLeave ? <Clock className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                            <span>{isLeave ? "On Leave" : isPendingLeave ? "Leave Pending" : "Absent"}</span>
                            {(isLeave || isPendingLeave) && row.original.leave_details && (
                              <Badge variant="outline" className={cn(
                                "text-[10px] h-5 px-1.5 ml-2 border",
                                row.original.leave_details.is_paid 
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" 
                                  : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/30 dark:text-slate-400 dark:border-slate-700"
                              )}>
                                {row.original.leave_details.is_paid ? "Paid" : "Unpaid"}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-right">
                          {flexRender(row.getVisibleCells()[row.getVisibleCells().length - 1].column.columnDef.cell, row.getVisibleCells()[row.getVisibleCells().length - 1].getContext())}
                        </TableCell>
                      </>
                    ) : (
                      row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))
                    )}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="h-6 w-6 opacity-50" />
                    <span>No results found.</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <RequestChangeDialog
        open={isRequestDialogOpen}
        onOpenChange={setIsRequestDialogOpen}
        attendanceLog={selectedLog}
        userId={userId}
        onSuccess={onRefresh}
      />
      <ViewChangeRequestDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        attendanceLog={selectedLog}
        userId={userId}
        onSuccess={onRefresh}
      />
    </div>
  );
}
