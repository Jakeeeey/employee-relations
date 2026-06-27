"use client";

import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { COERequest } from "../type";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, FileText } from "lucide-react";
import { format, isValid } from "date-fns";
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
  CANCELLED: "destructive",
};

function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function formatDate(val: string | null | undefined, formatStr: string): string {
  if (!val) return "-";
  try {
    const date = new Date(val);
    return isValid(date) ? format(date, formatStr) : "-";
  } catch {
    return "-";
  }
}

function isPreviewable(status: string | null | undefined): boolean {
  const s = (status || "").toUpperCase();
  return s === "APPROVED" || s === "RELEASED";
}

interface COETableProps {
  data: COERequest[];
  onView: (request: COERequest) => void;
  onPreview: (url: string, title?: string | null) => void;
}

export function COETable({ data, onView, onPreview }: COETableProps) {
  const columns: ColumnDef<COERequest>[] = [
    {
      accessorKey: "purpose",
      header: "Purpose",
      cell: ({ row }) => <span>{row.getValue("purpose") as string}</span>,
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
        return <Badge variant={variant}>{formatStatus(status)}</Badge>;
      },
    },
    {
      id: "ecopy",
      header: "E-Copy",
      cell: ({ row }) => {
        const request = row.original;
        const url = request.ecopy_file_url;
        if (!isPreviewable(request.status) || !url) return <span className="text-muted-foreground">-</span>;

        const title = request.doc_title;
        return (
          <button
            type="button"
            onClick={() => onPreview(url, request.doc_title)}
            className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-2 hover:underline truncate max-w-[180px]"
            title={title ?? ""}
          >
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{title}</span>
          </button>
        );
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
    if (s === "REJECTED" || s === "CANCELLED") {
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
