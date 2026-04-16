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
import { AlertCircle, RotateCcw, X, Calendar } from "lucide-react";
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
import { AttendanceLog } from "./type";

interface AttendanceReportModuleProps {
  userId: number;
}

const ITEMS_PER_PAGE = 10;

// Helper function to fill in missing work days (Monday-Saturday) as absent
function fillMissingWorkDays(logs: AttendanceLog[]): AttendanceLog[] {
  if (logs.length === 0) return [];

  // Get date range from logs
  const dates = logs.map((log) => new Date(log.log_date).getTime());
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));

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

  const { user, attendanceLogs, isLoading, error, refresh } =
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
  const logsWithAbsences = fillMissingWorkDays(attendanceLogs);

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Attendance Report
          </h2>
          <p className="text-muted-foreground">View your attendance history.</p>
        </div>
        
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-9 text-sm w-36 justify-start pl-3 text-left font-normal border border-slate-200 dark:border-slate-700"
              >
                <RotateCcw
                  className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
                />
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
      </div>

      {/* User Info Card */}
      {/* <Card>
        <CardHeader>
          <CardTitle>
            {user.user_fname} {user.user_mname && `${user.user_mname} `}
            {user.user_lname}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Department</p>
              <p className="font-semibold">{user.department_name || "N/A"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-semibold text-xs break-all">{user.user_email}</p>
            </div>
          </div>
        </CardContent>
      </Card> */}

      {/* Attendance Table Card */}
      <Card className="border border-slate-200 dark:border-slate-700">
        <CardHeader>
          <div className="flex flex-row items-end justify-between gap-4">
            <div>
              <CardTitle>Attendance Log</CardTitle>
              <CardDescription>
                Showing {displayedLogs.length} record(s)
              </CardDescription>
            </div>

            <div className="flex gap-2 items-end">
              {/* Absent Filter Dropdown */}
              <Select
                defaultValue={filterAbsent}
                onValueChange={(val) => {
                  setFilterAbsent(val as "all" | "absent");
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-sm w-36 justify-start pl-3 text-left font-normal border border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                </SelectContent>
              </Select>
              {/* Date Filter */}
              <div className="flex gap-2 items-end">
                <Popover
                  open={openFromPopover}
                  onOpenChange={setOpenFromPopover}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-9 text-sm w-40 justify-start pl-3 text-left font-normal border-slate-200 dark:border-slate-700"
                    >
                      <Calendar className="mr-2 h-4 w-4 shrink-0" />
                      {fromDate
                        ? format(new Date(fromDate), "MMM dd, yyyy")
                        : "From date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
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

                <Popover open={openToPopover} onOpenChange={setOpenToPopover}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-9 text-sm w-40 justify-start pl-3 text-left font-normal border-slate-200 dark:border-slate-700"
                    >
                      <Calendar className="mr-2 h-4 w-4 shrink-0" />
                      {toDate
                        ? format(new Date(toDate), "MMM dd, yyyy")
                        : "To date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
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
                    size="sm"
                    onClick={handleClearFilter}
                    className="h-9 w-9 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {attendanceLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No attendance records found
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border border-slate-200 dark:border-slate-700 h-96">
                <AttendanceReportTable data={paginatedLogs} />
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages} • Showing {endIndex} of{" "}
                  {displayedLogs.length} records
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border border-slate-200 dark:border-slate-700"
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
                    className="border border-slate-200 dark:border-slate-700"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
