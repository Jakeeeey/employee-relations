"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LguLeaveRequest, LGU_LEAVE_TYPES_META } from "../types";
import {
  Eye,
  MoreHorizontal,
  XCircle,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface LguLeaveTableProps {
  data: LguLeaveRequest[];
  onView: (leave: LguLeaveRequest) => void;
  onCancel: (id: number) => void;
}

export function LguLeaveTable({ data, onView, onCancel }: LguLeaveTableProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const matchesSearch =
        item.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.leave_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.office_department &&
          item.office_department.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [data, searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 font-mono text-[10px] uppercase">
            <CheckCircle2 className="w-3 h-3" /> Approved
          </Badge>
        );
      case "disapproved":
        return (
          <Badge variant="destructive" className="gap-1 font-mono text-[10px] uppercase">
            <AlertCircle className="w-3 h-3" /> Disapproved
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="secondary" className="gap-1 font-mono text-[10px] uppercase text-muted-foreground">
            <XCircle className="w-3 h-3" /> Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 font-mono text-[10px] uppercase">
            <Clock className="w-3 h-3" /> Pending Evaluation
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search applicant, department, or leave type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2">
          {["all", "pending", "approved", "disapproved"].map((st) => (
            <Button
              key={st}
              variant={statusFilter === st ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(st)}
              className="h-8 text-xs font-mono capitalize rounded-lg"
            >
              {st}
            </Button>
          ))}
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-border/80 bg-muted/10 space-y-3">
          <div className="p-3 rounded-2xl bg-muted/60 text-muted-foreground">
            <FileText className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">No Leave Applications Found</h4>
            <p className="text-xs text-muted-foreground max-w-xs">
              {searchTerm || statusFilter !== "all"
                ? "No applications matched your filter criteria."
                : "No LGU leave requests have been filed yet."}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 overflow-hidden bg-card shadow-xs">
          <Table>
            <TableHeader className="bg-muted/40 text-[11px] font-mono uppercase tracking-wider">
              <TableRow>
                <TableHead className="w-[100px]">Doc ID</TableHead>
                <TableHead>Applicant Name</TableHead>
                <TableHead>Leave Classification</TableHead>
                <TableHead className="text-center">Working Days</TableHead>
                <TableHead>Inclusive Dates</TableHead>
                <TableHead>Filing Date</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {filteredData.map((item) => {
                const meta = LGU_LEAVE_TYPES_META[item.leave_type];
                return (
                  <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono font-bold text-muted-foreground">
                      #{item.id}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-foreground">
                        {item.last_name}, {item.first_name} {item.middle_name ? `${item.middle_name[0]}.` : ""}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {item.office_department || item.position || "LGU Staff"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">
                        {meta?.title || item.leave_type}
                      </div>
                      {item.leave_type === "vacation" && item.vacation_location === "abroad" && (
                        <div className="text-[10px] text-primary font-mono">
                          Abroad: {item.vacation_location_abroad}
                        </div>
                      )}
                      {item.leave_type === "sick" && item.sick_illness_specify && (
                        <div className="text-[10px] text-muted-foreground italic truncate max-w-[180px]">
                          Illness: {item.sick_illness_specify}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-bold font-mono">
                      {item.working_days_applied} d
                    </TableCell>
                    <TableCell className="text-[11px] font-mono text-muted-foreground">
                      {item.inclusive_dates_text || `${item.start_date} to ${item.end_date}`}
                    </TableCell>
                    <TableCell className="text-[11px] font-mono text-muted-foreground">
                      {item.date_of_filing}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(item.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs">
                          <DropdownMenuItem
                            onClick={() => onView(item)}
                            className="gap-2 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5 text-primary" />
                            View CSC Form 6
                          </DropdownMenuItem>
                          {item.status === "pending" && item.id && (
                            <DropdownMenuItem
                              onClick={() => onCancel(item.id!)}
                              className="gap-2 text-destructive cursor-pointer"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Cancel Application
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
