"use client";

import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Concern } from "../type";
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

function statusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status.toUpperCase()) {
    case "PENDING": return "secondary";
    case "IN_REVIEW": return "default";
    case "DISMISSED": return "destructive";
    default: return "outline";
  }
}

function statusBadgeClass(status: string): string {
  switch (status.toUpperCase()) {
    case "RESOLVED": return "bg-green-600 text-white dark:bg-green-500 dark:text-white";
    default: return "";
  }
}

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDate(val: string | null | undefined, _formatStr: string): string {
  if (!val) return "-";
  try {
    const normalized = val.endsWith("Z") || val.includes("+") ? val : val + "Z";
    const ms = Date.parse(normalized);
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

interface ConcernTableProps {
  data: Concern[];
  onView: (concern: Concern) => void;
}

export function ConcernTable({ data, onView }: ConcernTableProps) {
  const columns: ColumnDef<Concern>[] = [
    {
      accessorKey: "concern",
      header: "Concern",
      cell: ({ row }) => {
        const concern = row.getValue("concern") as string;
        return (
          <span className="text-sm truncate max-w-[400px] block">
            {concern || "———"}
          </span>
        );
      },
    },
    {
      accessorKey: "subject_of_concern",
      header: "Subject of Concern",
      cell: ({ row }) => {
        const subject = row.getValue("subject_of_concern") as string;
        return (
          <span className="text-sm truncate max-w-[200px] block">
            {subject || "———"}
          </span>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Filed At",
      cell: ({ row }) => formatDate(row.getValue("created_at") as string | null | undefined, "MMM dd, yyyy"),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = (row.getValue("status") as string) || "PENDING";
        return (
          <Badge variant={statusBadgeVariant(status)} className={statusBadgeClass(status)}>
            {formatStatus(status)}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const concern = row.original;
        return (
          <Button variant="ghost" size="icon" onClick={() => onView(concern)}>
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

  const status = (row: { original: Concern }): string =>
    (row.original.status || "PENDING").toUpperCase();

  const rowClass = (row: { original: Concern }): string => {
    const s = status(row);
    if (s === "DISMISSED") {
      return "bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/40";
    }
    if (s === "RESOLVED") {
      return "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30";
    }
    if (s === "IN_REVIEW") {
      return "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30";
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
                  No concerns found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
