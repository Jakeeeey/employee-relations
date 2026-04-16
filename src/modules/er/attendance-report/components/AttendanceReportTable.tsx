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

interface AttendanceReportTableProps {
  data: AttendanceLog[];
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

export function AttendanceReportTable({ data }: AttendanceReportTableProps) {
  const columns: ColumnDef<AttendanceLog>[] = [
    {
      accessorKey: "log_date",
      header: "Date",
      cell: ({ row }) => formatDateTime(row.getValue("log_date") as string, "MMM dd, yyyy"),
    },
    {
      accessorKey: "time_in",
      header: "Time In",
      cell: ({ row }) => formatDateTime(row.getValue("time_in") as string, "hh:mm a"),
    },
    {
      accessorKey: "lunch_start",
      header: "Lunch Start",
      cell: ({ row }) => formatDateTime(row.getValue("lunch_start") as string, "hh:mm a"),
    },
    {
      accessorKey: "lunch_end",
      header: "Lunch End",
      cell: ({ row }) => formatDateTime(row.getValue("lunch_end") as string, "hh:mm a"),
    },
    {
      accessorKey: "break_start",
      header: "Break Start",
      cell: ({ row }) => formatDateTime(row.getValue("break_start") as string, "hh:mm a"),
    },
    {
      accessorKey: "break_end",
      header: "Break End",
      cell: ({ row }) => formatDateTime(row.getValue("break_end") as string, "hh:mm a"),
    },
    {
      accessorKey: "time_out",
      header: "Time Out",
      cell: ({ row }) => formatDateTime(row.getValue("time_out") as string, "hh:mm a"),
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
      className="[&_table]:border-collapse [&_tbody_tr]:h-8 [&_tbody_tr:last-child]:border-b [&_tbody_td]:px-2 [&_tbody_td]:py-0 [&_tbody_td]:h-8"
      data-slot="attendance-table"
    >
      <div className="w-full">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 border-b border-slate-200 dark:border-slate-700"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-10 text-xs font-bold text-muted-foreground uppercase tracking-wider"
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
                
                return (
                  <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className={`${
                        isAbsent 
                          ? "bg-red-200 hover:bg-red-300 dark:bg-red-900/50 dark:hover:bg-red-900/60" 
                          : "hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                      } data-[state=selected]:bg-slate-50 dark:data-[state=selected]:bg-slate-800/30 border-b border-slate-200 dark:border-slate-700`}
                    >
                    {isAbsent ? (
                      <>
                        <TableCell className="py-2">
                          {flexRender(row.getVisibleCells()[0].column.columnDef.cell, row.getVisibleCells()[0].getContext())}
                        </TableCell>
                        <TableCell className="py-2"></TableCell>
                        <TableCell className="py-2"></TableCell>
                        <TableCell className="py-2 text-red-600 font-medium dark:text-red-400">
                          Absent
                        </TableCell>
                        <TableCell className="py-2"></TableCell>
                        <TableCell className="py-2"></TableCell>
                        <TableCell className="py-2"></TableCell>
                      </>
                    ) : (
                      row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-2">
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
                  className="h-24 text-center text-muted-foreground"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
