"use client";

import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Concern } from "../type";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
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
  REVIEWED: "default",
  RESOLVED: "default",
  DISMISSED: "destructive",
  CANCELLED: "secondary",
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

interface ConcernTableProps {
  data: Concern[];
  onView: (concern: Concern) => void;
}

export function ConcernTable({ data, onView }: ConcernTableProps) {
  const columns: ColumnDef<Concern>[] = [
    {
      accessorKey: "subject_of_concern",
      header: "Subject",
      cell: ({ row }) => {
        const subject = row.getValue("subject_of_concern") as string;
        return (
          <span className="font-medium truncate max-w-[280px] block">
            {row.original.is_anonymous ? "——— (Anonymous)" : subject}
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
        const variant = statusVariantMap[status.toUpperCase()] ?? "outline";
        return <Badge variant={variant}>{formatStatus(status)}</Badge>;
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
    if (s === "DISMISSED" || s === "CANCELLED") {
      return "bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/40";
    }
    if (s === "RESOLVED" || s === "REVIEWED") {
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
