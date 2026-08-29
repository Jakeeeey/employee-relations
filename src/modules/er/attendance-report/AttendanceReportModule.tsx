"use client";

import { useState } from "react";
import { useAttendanceReport } from "./hooks/useAttendanceReport";
import { AttendanceReportTable } from "./components/AttendanceReportTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, RotateCcw, X, Calendar, Filter, CalendarDays, CheckCircle2, XCircle, Clock, Palmtree } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { AttendanceLog, AttendanceChangeRequest, LeaveRequest } from "./type";
import { cn } from "@/lib/utils";

interface AttendanceReportModuleProps {
  userId: number;
}

const ITEMS_PER_PAGE = 10;

function fillMissingWorkDays(
  logs: AttendanceLog[], 
  changeRequests: AttendanceChangeRequest[] = [],
  leaveRequests: LeaveRequest[] = [],
  fromDateStr?: string,
  toDateStr?: string
): AttendanceLog[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let minDate = new Date(now.getFullYear(), now.getMonth(), 1); // Default min: 1st of current month
  let maxDate = today; // Default max: today

  if (logs.length > 0) {
    const dates = logs.map((log) => {
       const [y, m, d] = log.log_date.split('-');
       return new Date(Number(y), Number(m)-1, Number(d)).getTime();
    });
    const earliestLog = new Date(Math.min(...dates));
    if (earliestLog < minDate) {
      minDate = earliestLog;
    }
  }

  if (fromDateStr) {
    const [y, m, d] = fromDateStr.split('-');
    minDate = new Date(Number(y), Number(m)-1, Number(d));
  }

  if (toDateStr) {
    const [y, m, d] = toDateStr.split('-');
    maxDate = new Date(Number(y), Number(m)-1, Number(d));
  }

  // Cap maxDate at today so we don't show "Absent" for future days, 
  // unless explicitly requested via toDate
  if (!toDateStr && maxDate > today) {
    maxDate = today;
  }

  // Create a map of existing log dates for quick lookup
  const existingDates = new Set(
    logs.map((log) => {
      const d = new Date(log.log_date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }),
  );

  const filledLogs: AttendanceLog[] = [...logs];

  // Iterate through all dates in the range
  const currentDate = new Date(minDate);
  while (currentDate <= maxDate) {
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Only process Monday (1) through Saturday (6), skip Sunday (0)
    if (dayOfWeek >= 1 && dayOfWeek <= 6) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;

      // If this date doesn't exist in logs, add an absent entry
      if (!existingDates.has(dateStr)) {
        
        const pendingReq = changeRequests.find((req: AttendanceChangeRequest) => {
          const reqDateStr = new Date(req.log_date).toISOString().split('T')[0];
          return reqDateStr === dateStr;
        });

        // Check if there is an overlapping leave request
        const leave = leaveRequests.find((l: LeaveRequest) => {
          if (!l.leave_start || !l.leave_end) return false;
          if (l.status !== 'approved' && l.status !== 'pending') return false;
          
          const startDateStr = l.leave_start.split('T')[0];
          const endDateStr = l.leave_end.split('T')[0];

          return dateStr >= startDateStr && dateStr <= endDateStr;
        });

        filledLogs.push({
          log_id: -1, // Temporary ID for absent entries
          user_id: logs[0]?.user_id || 0,
          log_date: dateStr,
          time_in: null,
          time_out: null,
          lunch_start: null,
          lunch_end: null,
          break_start: null,
          break_end: null,
          status: null,
          approval_status: null,
          department_id: null,
          image_time_in: null,
          image_time_out: null,
          has_pending_change_request: !!pendingReq,
          pending_change_request: pendingReq || undefined,
          is_on_leave: !!leave && leave.status === 'approved',
          is_pending_leave: !!leave && leave.status === 'pending',
          leave_details: leave || undefined,
        });
      }
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Sort by date descending
  return filledLogs.sort((a, b) => {
    return new Date(b.log_date).getTime() - new Date(a.log_date).getTime();
  });
}

export default function AttendanceReportModule({
  userId: initialUserId,
}: AttendanceReportModuleProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [openFromPopover, setOpenFromPopover] = useState(false);
  const [openToPopover, setOpenToPopover] = useState(false);

  const { user, attendanceLogs, changeRequests, leaveRequests, isLoading, error, refresh } =
    useAttendanceReport(initialUserId);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
      setCurrentPage(1);
    } catch (err) {
      console.error("Error refreshing attendance report:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // First, fill in missing work days (Monday-Saturday) as absent
  const logsWithAbsences = fillMissingWorkDays(attendanceLogs, changeRequests, leaveRequests, fromDate, toDate);

  // Then apply the date filter on the filled list so even
  // auto-generated "Absent" days are included in the range
  const filteredLogs = logsWithAbsences.filter((log) => {
    const logDate = new Date(log.log_date);
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    if (from && logDate < from) return false;
    if (to && logDate > to) return false;
    return true;
  });

  // Absent/presence filter: show all, only absent, or only present entries
  const [filterAbsent, setFilterAbsent] = useState<"all" | "absent" | "present">("all");

  const displayedLogs =
    filterAbsent === "absent"
      ? filteredLogs.filter((log) => !log.time_in && !log.time_out)
      : filterAbsent === "present"
      ? filteredLogs.filter((log) => Boolean(log.time_in) || Boolean(log.time_out))
      : filteredLogs;

  const presentCount = filteredLogs.filter((log) => Boolean(log.time_in) || Boolean(log.time_out)).length;
  const lateCount = filteredLogs.filter((log) => log.status?.toLowerCase() === "late").length;
  const leaveCount = filteredLogs.filter((log) => !log.time_in && !log.time_out && log.is_on_leave).length;
  const pendingLeaveCount = filteredLogs.filter((log) => !log.time_in && !log.time_out && log.is_pending_leave).length;
  const absentCount = filteredLogs.filter((log) => !log.time_in && !log.time_out && !log.is_on_leave && !log.is_pending_leave).length;

  const handleClearFilter = () => {
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(displayedLogs.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, displayedLogs.length);
  const paginatedLogs = displayedLogs.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!user) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>User not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Attendance Report
          </h2>
          <p className="text-muted-foreground mt-1">View and manage your attendance history.</p>
        </div>
        
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-10 text-sm px-5 font-medium border-border/50 shadow-sm rounded-full bg-background hover:bg-muted/50 transition-all"
        >
          <RotateCcw
            className={cn("h-4 w-4 mr-2 text-muted-foreground", isRefreshing && "animate-spin")}
          />
          {isRefreshing ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>

      {/* Metrics & Info */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="border-border/50 shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Present</p>
              <h4 className="text-2xl font-bold text-foreground">{presentCount}</h4>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Late</p>
              <h4 className="text-2xl font-bold text-foreground">{lateCount}</h4>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
              <XCircle className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Absent</p>
              <h4 className="text-2xl font-bold text-foreground">{absentCount}</h4>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-sky-500/10 flex items-center justify-center shrink-0">
              <Palmtree className="h-6 w-6 text-sky-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">On Leave</p>
              <h4 className="text-2xl font-bold text-foreground">{leaveCount}</h4>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Leave</p>
              <h4 className="text-2xl font-bold text-foreground">{pendingLeaveCount}</h4>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table Card */}
      <Card className="border-border/50 shadow-sm bg-card overflow-hidden">
        <CardHeader className="border-b bg-muted/10 px-6 py-5">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Attendance Log
              </CardTitle>
              <CardDescription className="mt-1">
                Showing {displayedLogs.length} record(s)
              </CardDescription>
            </div>

            <div className="flex flex-wrap gap-2 items-center bg-background/50 p-1.5 rounded-xl border border-border/50 shadow-sm">
              {/* Absent Filter Dropdown */}
              <div className="flex items-center border-r border-border/50 pr-2 mr-1">
                <Filter className="h-4 w-4 text-muted-foreground ml-2 mr-1.5" />
                <Select
                  defaultValue={filterAbsent}
                  onValueChange={(val) => {
                    setFilterAbsent(val as "all" | "absent");
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 text-sm w-[130px] border-0 shadow-none focus:ring-0 bg-transparent font-medium">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Records</SelectItem>
                    <SelectItem value="absent">Absent Only</SelectItem>
                    <SelectItem value="present">Present Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-1.5">
                <Popover
                  open={openFromPopover}
                  onOpenChange={setOpenFromPopover}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn("h-8 text-sm w-[130px] justify-start font-medium px-3", fromDate ? "bg-muted/50" : "text-muted-foreground")}
                    >
                      <Calendar className="mr-2 h-3.5 w-3.5 shrink-0" />
                      {fromDate
                        ? format(new Date(fromDate), "MMM dd, yyyy")
                        : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={fromDate ? new Date(fromDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(
                            2,
                            "0",
                          );
                          const day = String(date.getDate()).padStart(2, "0");
                          setFromDate(`${year}-${month}-${day}`);
                          setCurrentPage(1);
                          setOpenFromPopover(false);
                        }
                      }}
                      disabled={(date) =>
                        toDate ? date > new Date(toDate) : false
                      }
                    />
                  </PopoverContent>
                </Popover>

                <span className="text-muted-foreground/50 text-xs">to</span>

                <Popover open={openToPopover} onOpenChange={setOpenToPopover}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn("h-8 text-sm w-[130px] justify-start font-medium px-3", toDate ? "bg-muted/50" : "text-muted-foreground")}
                    >
                      <Calendar className="mr-2 h-3.5 w-3.5 shrink-0" />
                      {toDate
                        ? format(new Date(toDate), "MMM dd, yyyy")
                        : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={toDate ? new Date(toDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(
                            2,
                            "0",
                          );
                          const day = String(date.getDate()).padStart(2, "0");
                          setToDate(`${year}-${month}-${day}`);
                          setCurrentPage(1);
                          setOpenToPopover(false);
                        }
                      }}
                      disabled={(date) =>
                        fromDate ? date < new Date(fromDate) : false
                      }
                    />
                  </PopoverContent>
                </Popover>

                {(fromDate || toDate) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClearFilter}
                    className="h-8 w-8 ml-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {displayedLogs.length === 0 && !fromDate && !toDate && filterAbsent === "all" ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50/30 dark:bg-slate-900/10">
              <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <CalendarDays className="h-6 w-6 text-muted-foreground/60" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                No attendance records found
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[250px]">Your attendance logs will appear here once they are recorded.</p>
            </div>
          ) : (
            <div className="bg-slate-50/30 dark:bg-slate-900/10 p-6">
              <div className="rounded-xl border border-border/50 bg-background shadow-sm overflow-hidden min-h-[400px]">
                <AttendanceReportTable data={paginatedLogs} userId={initialUserId} onRefresh={handleRefresh} />
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-6 px-1">
                <div className="text-sm text-muted-foreground font-medium">
                  Page <span className="text-foreground">{currentPage}</span> of <span className="text-foreground">{totalPages}</span> • Showing <span className="text-foreground">{endIndex}</span> of <span className="text-foreground">{displayedLogs.length}</span> records
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border/50 rounded-full px-4 hover:bg-muted/50"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border/50 rounded-full px-4 hover:bg-muted/50"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
