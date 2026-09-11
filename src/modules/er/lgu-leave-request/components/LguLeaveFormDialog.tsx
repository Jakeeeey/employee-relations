"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CreateLguLeaveInput,
  CreateLguLeaveSchema,
  LguLeaveType,
  LGU_LEAVE_TYPES_META,
} from "../types";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Calendar,
  Clock,
  Sparkles,
  User,
  Plane,
  Hospital,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";

interface LguLeaveFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateLguLeaveInput) => Promise<boolean>;
  userId: number;
  defaultUserInfo?: {
    office?: string;
    lastName?: string;
    firstName?: string;
    middleName?: string;
    position?: string;
    salary?: number;
    departmentId?: number | null;
  };
}

export function LguLeaveFormDialog({
  open,
  onOpenChange,
  onSubmit,
  userId,
  defaultUserInfo,
}: LguLeaveFormDialogProps) {
  const [submitting, setSubmitting] = React.useState(false);

  // Form states
  const [officeDepartment, setOfficeDepartment] = React.useState(
    defaultUserInfo?.office || "Local Government Unit"
  );
  const [lastName, setLastName] = React.useState(defaultUserInfo?.lastName || "");
  const [firstName, setFirstName] = React.useState(defaultUserInfo?.firstName || "");
  const [middleName, setMiddleName] = React.useState(defaultUserInfo?.middleName || "");
  const [dateOfFiling, setDateOfFiling] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [position, setPosition] = React.useState(defaultUserInfo?.position || "");
  const [monthlySalary, setMonthlySalary] = React.useState<string>(
    defaultUserInfo?.salary ? String(defaultUserInfo.salary) : ""
  );

  // 6.A
  const [leaveType, setLeaveType] = React.useState<LguLeaveType>("vacation");
  const [leaveTypeOthers, setLeaveTypeOthers] = React.useState("");

  // 6.B Details
  const [vacationLocation, setVacationLocation] = React.useState<
    "within_philippines" | "abroad"
  >("within_philippines");
  const [vacationLocationAbroad, setVacationLocationAbroad] = React.useState("");

  const [sickLocation, setSickLocation] = React.useState<"in_hospital" | "out_patient">(
    "out_patient"
  );
  const [sickIllnessSpecify, setSickIllnessSpecify] = React.useState("");
  const [womenIllnessSpecify, setWomenIllnessSpecify] = React.useState("");

  const [studyPurpose, setStudyPurpose] = React.useState<
    "masters_degree" | "bar_board_review" | "other"
  >("masters_degree");
  const [studyPurposeOther, setStudyPurposeOther] = React.useState("");

  const [otherPurpose, setOtherPurpose] = React.useState<
    "monetization" | "terminal_leave" | ""
  >("");

  // 6.C Working days and inclusive dates
  const [startDate, setStartDate] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [workingDays, setWorkingDays] = React.useState("1");
  const [inclusiveDatesText, setInclusiveDatesText] = React.useState("");

  // 6.D Commutation
  const [commutationRequested, setCommutationRequested] = React.useState(false);

  // Auto-calculate working days between start and end date
  React.useEffect(() => {
    if (!startDate || !endDate) return;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return;

    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) {
        // Mon-Fri working days
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    setWorkingDays(String(Math.max(count, 1)));
  }, [startDate, endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CreateLguLeaveInput = {
      user_id: userId,
      department_id: defaultUserInfo?.departmentId || null,
      office_department: officeDepartment,
      last_name: lastName,
      first_name: firstName,
      middle_name: middleName || null,
      date_of_filing: dateOfFiling,
      position: position || null,
      monthly_salary: monthlySalary ? parseFloat(monthlySalary) : null,

      leave_type: leaveType,
      leave_type_others: leaveType === "others" ? leaveTypeOthers : null,

      vacation_location:
        leaveType === "vacation" || leaveType === "special_privilege"
          ? vacationLocation
          : null,
      vacation_location_abroad:
        (leaveType === "vacation" || leaveType === "special_privilege") &&
        vacationLocation === "abroad"
          ? vacationLocationAbroad
          : null,

      sick_location: leaveType === "sick" ? sickLocation : null,
      sick_illness_specify: leaveType === "sick" ? sickIllnessSpecify : null,
      women_illness_specify:
        leaveType === "special_women" ? womenIllnessSpecify : null,

      study_purpose: leaveType === "study" ? studyPurpose : null,
      study_purpose_other:
        leaveType === "study" && studyPurpose === "other" ? studyPurposeOther : null,

      other_purpose: otherPurpose ? otherPurpose : null,

      working_days_applied: parseFloat(workingDays) || 1,
      start_date: startDate,
      end_date: endDate,
      inclusive_dates_text: inclusiveDatesText || `${startDate} to ${endDate}`,

      commutation_requested: commutationRequested,
    };

    const parseResult = CreateLguLeaveSchema.safeParse(payload);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      toast.error("Form Validation Error", {
        description: issue ? issue.message : "Please review all required fields.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const success = await onSubmit(payload);
      if (success) {
        onOpenChange(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-4xl lg:max-w-5xl max-h-[90vh] h-[90vh] p-0 flex flex-col overflow-hidden bg-background shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-border/60 bg-muted/20 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-[10px] tracking-wider uppercase border-primary/30 text-primary">
                  Civil Service Form No. 6 • Revised 2020
                </Badge>
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight">
                Application for Leave
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Official Republic of the Philippines standard leave application form for LGU and government personnel.
              </DialogDescription>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 hidden sm:flex">
              <FileText className="w-6 h-6" />
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto min-h-0 p-6 overscroll-contain">
            <div className="space-y-8 pr-1">
              {/* SECTION 1-5: APPLICANT DETAILS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                  <User className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-sm tracking-wide uppercase text-foreground">
                    1–5. Applicant & Office Identification
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold">1. Office / Department</Label>
                    <Input
                      placeholder="e.g. Office of the Municipal Mayor / HRMO"
                      value={officeDepartment}
                      onChange={(e) => setOfficeDepartment(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">3. Date of Filing</Label>
                    <Input
                      type="date"
                      value={dateOfFiling}
                      onChange={(e) => setDateOfFiling(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">5. Monthly Salary (PHP)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 35000"
                      value={monthlySalary}
                      onChange={(e) => setMonthlySalary(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">2. Last Name</Label>
                    <Input
                      placeholder="Dela Cruz"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">2. First Name</Label>
                    <Input
                      placeholder="Juan"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">2. Middle Name</Label>
                    <Input
                      placeholder="Santos"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">4. Position / Title</Label>
                    <Input
                      placeholder="Administrative Officer IV"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 6.A: TYPE OF LEAVE */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="font-bold text-sm tracking-wide uppercase text-foreground">
                      6.A Type of Leave to be Availed Of
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    Omnibus Rules & CSC Circulars
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(Object.keys(LGU_LEAVE_TYPES_META) as LguLeaveType[]).map((typeKey) => {
                    const meta = LGU_LEAVE_TYPES_META[typeKey];
                    const isSelected = leaveType === typeKey;

                    return (
                      <label
                        key={typeKey}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-xs"
                            : "border-border/60 hover:border-border hover:bg-muted/30"
                        }`}
                      >
                        <input
                          type="radio"
                          name="leaveType"
                          checked={isSelected}
                          onChange={() => setLeaveType(typeKey)}
                          className="mt-1 h-4 w-4 text-primary focus:ring-primary"
                        />
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold text-foreground">
                            {meta.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground leading-tight">
                            {meta.legalBasis}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {leaveType === "others" && (
                  <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-2">
                    <Label className="text-xs font-semibold">
                      Specify Other Leave Purpose / Statutory Reference:
                    </Label>
                    <Input
                      placeholder="e.g. Special Emergency Leave for Typhoon Evacuation"
                      value={leaveTypeOthers}
                      onChange={(e) => setLeaveTypeOthers(e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>

              {/* SECTION 6.B: DETAILS OF LEAVE */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                  <FileText className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-sm tracking-wide uppercase text-foreground">
                    6.B Details of Leave (Context-Specific)
                  </h3>
                </div>

                {/* Conditional fields for Vacation / Special Privilege Leave */}
                {(leaveType === "vacation" || leaveType === "special_privilege") && (
                  <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                      <Plane className="w-3.5 h-3.5" /> In Case of Vacation / Special Privilege Leave:
                    </div>
                    <RadioGroup
                      value={vacationLocation}
                      onValueChange={(v) =>
                        setVacationLocation(v as "within_philippines" | "abroad")
                      }
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                      <div className="flex items-center space-x-2 border p-3 rounded-lg bg-card">
                        <RadioGroupItem value="within_philippines" id="loc-ph" />
                        <Label htmlFor="loc-ph" className="text-xs cursor-pointer">
                          Within the Philippines
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 border p-3 rounded-lg bg-card">
                        <RadioGroupItem value="abroad" id="loc-abroad" />
                        <Label htmlFor="loc-abroad" className="text-xs cursor-pointer">
                          Abroad (Specify Destination)
                        </Label>
                      </div>
                    </RadioGroup>

                    {vacationLocation === "abroad" && (
                      <div className="space-y-1.5 pt-2">
                        <Label className="text-xs font-semibold">Foreign Destination / Country:</Label>
                        <Input
                          placeholder="e.g. Tokyo, Japan"
                          value={vacationLocationAbroad}
                          onChange={(e) => setVacationLocationAbroad(e.target.value)}
                          required
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Conditional fields for Sick Leave */}
                {leaveType === "sick" && (
                  <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                      <Hospital className="w-3.5 h-3.5" /> In Case of Sick Leave:
                    </div>
                    <RadioGroup
                      value={sickLocation}
                      onValueChange={(v) =>
                        setSickLocation(v as "in_hospital" | "out_patient")
                      }
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                      <div className="flex items-center space-x-2 border p-3 rounded-lg bg-card">
                        <RadioGroupItem value="in_hospital" id="sick-hosp" />
                        <Label htmlFor="sick-hosp" className="text-xs cursor-pointer">
                          In Hospital (Confined)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 border p-3 rounded-lg bg-card">
                        <RadioGroupItem value="out_patient" id="sick-out" />
                        <Label htmlFor="sick-out" className="text-xs cursor-pointer">
                          Out Patient
                        </Label>
                      </div>
                    </RadioGroup>

                    <div className="space-y-1.5 pt-2">
                      <Label className="text-xs font-semibold">Specify Nature of Illness:</Label>
                      <Input
                        placeholder="e.g. Acute Gastroenteritis / Hypertension / Medical Consult"
                        value={sickIllnessSpecify}
                        onChange={(e) => setSickIllnessSpecify(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Conditional fields for Women's Special Leave Benefits */}
                {leaveType === "special_women" && (
                  <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3">
                    <Label className="text-xs font-semibold">
                      Specify Gynecological Illness / Surgical Procedure (RA 9710):
                    </Label>
                    <Input
                      placeholder="e.g. Myomectomy, Oophorectomy, etc."
                      value={womenIllnessSpecify}
                      onChange={(e) => setWomenIllnessSpecify(e.target.value)}
                      required
                    />
                  </div>
                )}

                {/* Conditional fields for Study Leave */}
                {leaveType === "study" && (
                  <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                      <GraduationCap className="w-3.5 h-3.5" /> In Case of Study Leave:
                    </div>
                    <RadioGroup
                      value={studyPurpose}
                      onValueChange={(v) =>
                        setStudyPurpose(
                          v as "masters_degree" | "bar_board_review" | "other"
                        )
                      }
                      className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                    >
                      <div className="flex items-center space-x-2 border p-3 rounded-lg bg-card">
                        <RadioGroupItem value="masters_degree" id="st-master" />
                        <Label htmlFor="st-master" className="text-xs cursor-pointer">
                          Master&apos;s Degree
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 border p-3 rounded-lg bg-card">
                        <RadioGroupItem value="bar_board_review" id="st-bar" />
                        <Label htmlFor="st-bar" className="text-xs cursor-pointer">
                          BAR / Board Review
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 border p-3 rounded-lg bg-card">
                        <RadioGroupItem value="other" id="st-other" />
                        <Label htmlFor="st-other" className="text-xs cursor-pointer">
                          Other Study
                        </Label>
                      </div>
                    </RadioGroup>

                    {studyPurpose === "other" && (
                      <div className="space-y-1.5 pt-2">
                        <Label className="text-xs font-semibold">Specify Study Purpose:</Label>
                        <Input
                          placeholder="e.g. Doctoral Dissertation Defense"
                          value={studyPurposeOther}
                          onChange={(e) => setStudyPurposeOther(e.target.value)}
                          required
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Other Purpose (Monetization / Terminal) */}
                <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3">
                  <Label className="text-xs font-semibold">
                    Other Special Conversion Purpose (Optional):
                  </Label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="radio"
                        name="otherPurpose"
                        checked={otherPurpose === ""}
                        onChange={() => setOtherPurpose("")}
                      />
                      Standard Leave Availment
                    </label>
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="radio"
                        name="otherPurpose"
                        checked={otherPurpose === "monetization"}
                        onChange={() => setOtherPurpose("monetization")}
                      />
                      Monetization of Leave Credits
                    </label>
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="radio"
                        name="otherPurpose"
                        checked={otherPurpose === "terminal_leave"}
                        onChange={() => setOtherPurpose("terminal_leave")}
                      />
                      Terminal Leave (Retirement / Resignation)
                    </label>
                  </div>
                </div>
              </div>

              {/* SECTION 6.C & 6.D: DATES & COMMUTATION */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-4 p-5 rounded-2xl border border-border/60 bg-card">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                    <Calendar className="h-4 w-4 text-primary" />
                    <h3 className="font-bold text-sm tracking-wide uppercase text-foreground">
                      6.C Working Days & Inclusive Dates
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold whitespace-nowrap">Start Date</Label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                        className="h-10 text-xs sm:text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold whitespace-nowrap">End Date</Label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                        className="h-10 text-xs sm:text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold whitespace-nowrap">Working Days</Label>
                      <Input
                        type="number"
                        step="0.5"
                        min="0.5"
                        value={workingDays}
                        onChange={(e) => setWorkingDays(e.target.value)}
                        required
                        className="h-10 text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <Label className="text-xs font-semibold">
                      Inclusive Dates Description (Optional custom remarks)
                    </Label>
                    <Input
                      placeholder="e.g. October 15 to 19, 2026 (Excluding weekends)"
                      value={inclusiveDatesText}
                      onChange={(e) => setInclusiveDatesText(e.target.value)}
                      className="h-10 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-4 p-5 rounded-2xl border border-border/60 bg-card flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                      <Clock className="h-4 w-4 text-primary" />
                      <h3 className="font-bold text-sm tracking-wide uppercase text-foreground">
                        6.D Commutation
                      </h3>
                    </div>

                    <div className="flex items-start space-x-3 pt-2">
                      <Checkbox
                        id="commutation"
                        checked={commutationRequested}
                        onCheckedChange={(c) => setCommutationRequested(!!c)}
                        className="mt-0.5"
                      />
                      <div className="space-y-1 leading-normal">
                        <Label htmlFor="commutation" className="text-xs font-bold cursor-pointer block">
                          Request Commutation
                        </Label>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Advance payment of salary corresponding to the period of leave applied for.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/40 text-[10px] text-muted-foreground font-mono">
                    Official Sign-off: Section 7 (Action on Application) will be executed by authorized HR and Division Heads.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 border-t border-border/60 bg-muted/20 shrink-0 flex flex-row items-center justify-between sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="font-bold">
              {submitting ? "Submitting CSC Form 6..." : "Submit Application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
