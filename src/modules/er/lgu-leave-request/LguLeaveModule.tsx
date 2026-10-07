"use client";

import * as React from "react";
import { useLguLeave } from "./hooks/useLguLeave";
import { LguLeaveTable } from "./components/LguLeaveTable";
import { LguLeaveFormDialog } from "./components/LguLeaveFormDialog";
import { LguLeaveViewDialog } from "./components/LguLeaveViewDialog";
import { LguLeaveRequest } from "./types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileText, Clock, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LguLeaveModuleProps {
  userId: number;
  departmentId?: number | null;
  userInfo?: {
    office?: string;
    lastName?: string;
    firstName?: string;
    middleName?: string;
    position?: string;
    salary?: number;
  };
}

export function LguLeaveModule({ userId, departmentId, userInfo }: LguLeaveModuleProps) {
  const { requests, isLoading, createRequest, cancelRequest } = useLguLeave(userId);

  const [formOpen, setFormOpen] = React.useState(false);
  const [viewOpen, setViewOpen] = React.useState(false);
  const [selectedLeave, setSelectedLeave] = React.useState<LguLeaveRequest | null>(null);

  const stats = React.useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "pending").length;
    const approved = requests.filter((r) => r.status === "approved").length;
    const disapproved = requests.filter((r) => r.status === "disapproved").length;
    return { total, pending, approved, disapproved };
  }, [requests]);

  const handleView = (leave: LguLeaveRequest) => {
    setSelectedLeave(leave);
    setViewOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Module Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/30 text-primary font-mono text-[10px] uppercase font-bold tracking-wider">
              <ShieldCheck className="w-3 h-3 mr-1 text-primary" /> CSC Form 6 Standard
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            LGU Leave Request Management
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Statutory leave filing pursuant to Civil Service Commission Omnibus Rules (E.O. No. 292, R.A. No. 11210, R.A. No. 9262).
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            onClick={() => setFormOpen(true)}
            className="gap-2 font-bold shadow-xs"
          >
            <Plus className="w-4 h-4" />
            File CSC Form 6
          </Button>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 bg-card shadow-xs">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-mono font-medium text-muted-foreground uppercase">Total Applications</p>
              <p className="text-2xl font-bold font-mono text-foreground">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card shadow-xs">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-mono font-medium text-muted-foreground uppercase">Pending Action</p>
              <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card shadow-xs">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-mono font-medium text-muted-foreground uppercase">Approved Leaves</p>
              <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{stats.approved}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card shadow-xs">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-mono font-medium text-muted-foreground uppercase">Disapproved</p>
              <p className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">{stats.disapproved}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Table */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : (
        <LguLeaveTable
          data={requests}
          onView={handleView}
          onCancel={cancelRequest}
        />
      )}

      {/* Form Filing Modal */}
      <LguLeaveFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={createRequest}
        userId={userId}
        defaultUserInfo={{
          ...userInfo,
          departmentId,
        }}
      />

      {/* Form Preview / Print Modal */}
      <LguLeaveViewDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        leave={selectedLeave}
      />
    </div>
  );
}
