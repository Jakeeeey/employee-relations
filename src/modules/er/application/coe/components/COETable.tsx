"use client";

import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { COERequest } from "../type";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const statusVariantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  APPROVED: "default",
  RELEASED: "default",
  REJECTED: "destructive",
  CANCELLED: "secondary",
};

function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function formatDate(val: string | null | undefined, _formatStr: string): string {
  if (!val) return "-";
  try {
    let s = String(val).trim();
    if (s.includes(" ") && !s.includes("T")) s = s.replace(" ", "T");
    if (!/[zZ]$/.test(s) && !/[+-]\d{2}:\d{2}$/.test(s)) s = s + "+08:00";
    const ms = Date.parse(s);
    if (isNaN(ms)) return "-";
    const opts: Intl.DateTimeFormatOptions =
      _formatStr === "PPP"
        ? { year: "numeric", month: "long", day: "numeric" }
        : { year: "numeric", month: "short", day: "2-digit" };
    return new Intl.DateTimeFormat("en-US", { ...opts, timeZone: "Asia/Manila" }).format(ms);
  } catch {
    return "-";
  }
}

interface COETableProps {
  data: COERequest[];
  onView: (request: COERequest) => void;
}

export function COETable({ data, onView }: COETableProps) {
  const columns: ColumnDef<COERequest>[] = [
    {
      accessorKey: "purpose",
      header: "Purpose",
      cell: ({ row }) => <span className="[word-break:break-word]">{row.getValue("purpose") as string}</span>,
    },
    {
      accessorKey: "request_date",
      header: "Request Date",
      cell: ({ row }) => formatDate(row.getValue("request_date") as string | null | undefined, "MMM dd, yyyy"),
    },
    {
      accessorKey: "approval_date",
      header: "Approval Date",
      cell: ({ row }) => formatDate(row.getValue("approval_date") as string | null | undefined, "MMM dd, yyyy"),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = (row.getValue("status") as string) || "PENDING";
        const variant = statusVariantMap[status.toUpperCase()] ?? "outline";
        return <Badge variant={variant}
          className={status.toUpperCase() === "RELEASED" ? "bg-green-600 text-white dark:bg-green-500 dark:text-white" : ""}>{formatStatus(status)}</Badge>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const request = row.original;
        return (
          <Button variant="ghost" size="icon" onClick={() => onView(request)}>
            <Eye className="h-4 w-4" />
          </Button>
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

  const status = (row: { original: COERequest }): string =>
    (row.original.status || "PENDING").toUpperCase();

  const rowClass = (row: { original: COERequest }): string => {
    const s = status(row);
    if (s === "REJECTED") {
      return "bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/40";
    }
    if (s === "APPROVED" || s === "RELEASED") {
      return "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30";
    }
    return "hover:bg-slate-50/50 dark:hover:bg-slate-800/30";
  };

  return (
    <div
      className="[&_table]:border-collapse [&_tbody_tr]:h-8 [&_tbody_tr:last-child]:border-b [&_tbody_td]:px-4 [&_tbody_td]:py-0 [&_tbody_td]:h-8"
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
                    className="h-10 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider"
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
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={`${rowClass(row)} data-[state=selected]:bg-slate-50 dark:data-[state=selected]:bg-slate-800/30 border-b border-slate-200 dark:border-slate-700`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 px-4 text-center text-muted-foreground"
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
