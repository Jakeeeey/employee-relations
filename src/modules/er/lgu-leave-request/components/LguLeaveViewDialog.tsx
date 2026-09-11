"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LguLeaveRequest } from "../types";
import { Printer, CheckSquare, Square } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface LguLeaveViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leave: LguLeaveRequest | null;
}

export function LguLeaveViewDialog({
  open,
  onOpenChange,
  leave,
}: LguLeaveViewDialogProps) {
  if (!leave) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-4xl lg:max-w-5xl max-h-[90vh] h-[90vh] p-0 flex flex-col overflow-hidden bg-background shadow-2xl">
        <DialogHeader className="p-4 px-6 border-b border-border/60 bg-muted/20 shrink-0 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-base sm:text-lg font-bold">
              Civil Service Form No. 6 (Preview)
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Official Application for Leave Document • ID #{leave.id || "N/A"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-xs font-semibold"
            >
              <Printer className="h-3.5 w-3.5" />
              Print Form
            </Button>
          </div>
        </DialogHeader>

        {/* PRINTABLE CSC FORM 6 SHEET */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-8 bg-slate-100 dark:bg-slate-950/40 overscroll-contain">
          <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-300 text-slate-900 dark:text-slate-100 p-6 sm:p-8 text-xs font-serif shadow-xl rounded-sm print:m-0 print:p-0 print:border-black print:shadow-none print:max-w-none">
            {/* Form Top Annotations */}
            <div className="flex justify-between items-start text-[9px] font-sans font-semibold uppercase tracking-wider pb-2">
              <div>
                <p>Civil Service Form No. 6</p>
                <p>Revised 2020</p>
              </div>
              <div className="border border-slate-400 p-2 text-center text-[8px] h-12 w-28 flex items-center justify-center text-muted-foreground">
                Stamp of Date of Receipt
              </div>
            </div>

            {/* Header / Republic of the Philippines */}
            <div className="text-center space-y-0.5 pb-4 border-b-2 border-slate-900 dark:border-slate-300">
              <p className="text-[11px] font-bold tracking-widest uppercase font-sans">
                Republic of the Philippines
              </p>
              <p className="text-base font-bold font-serif uppercase tracking-wide">
                Office of the President / Local Government Unit
              </p>
              <p className="text-[10px] italic font-serif">
                {leave.office_department || "Local Government Administration"}
              </p>
              <h1 className="text-lg font-black uppercase tracking-widest pt-2 font-sans underline decoration-2 underline-offset-4">
                APPLICATION FOR LEAVE
              </h1>
            </div>

            {/* BOXES 1-5: Personal Information Grid */}
            <div className="grid grid-cols-12 border-b-2 border-slate-900 dark:border-slate-300 text-[10px] font-sans">
              <div className="col-span-12 sm:col-span-4 border-b sm:border-b-0 sm:border-r border-slate-900 dark:border-slate-300 p-2">
                <span className="font-bold">1. OFFICE/DEPARTMENT:</span>
                <p className="font-semibold text-xs pt-1 uppercase">
                  {leave.office_department || "N/A"}
                </p>
              </div>
              <div className="col-span-12 sm:col-span-8 p-2">
                <span className="font-bold">2. NAME:</span>
                <div className="grid grid-cols-3 pt-1 text-center font-semibold text-xs">
                  <div>
                    <span className="block underline uppercase">{leave.last_name}</span>
                    <span className="text-[8px] font-normal text-muted-foreground">(Last)</span>
                  </div>
                  <div>
                    <span className="block underline uppercase">{leave.first_name}</span>
                    <span className="text-[8px] font-normal text-muted-foreground">(First)</span>
                  </div>
                  <div>
                    <span className="block underline uppercase">{leave.middle_name || "—"}</span>
                    <span className="text-[8px] font-normal text-muted-foreground">(Middle)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 border-b-2 border-slate-900 dark:border-slate-300 text-[10px] font-sans">
              <div className="col-span-4 border-r border-slate-900 dark:border-slate-300 p-2">
                <span className="font-bold">3. DATE OF FILING:</span>
                <p className="font-semibold text-xs pt-1">{leave.date_of_filing}</p>
              </div>
              <div className="col-span-5 border-r border-slate-900 dark:border-slate-300 p-2">
                <span className="font-bold">4. POSITION:</span>
                <p className="font-semibold text-xs pt-1 uppercase">{leave.position || "N/A"}</p>
              </div>
              <div className="col-span-3 p-2">
                <span className="font-bold">5. SALARY:</span>
                <p className="font-semibold text-xs pt-1">
                  {leave.monthly_salary ? `PHP ${formatNumber(leave.monthly_salary)}` : "—"}
                </p>
              </div>
            </div>

            {/* SECTION 6 TITLE */}
            <div className="bg-slate-200 dark:bg-slate-800 text-center py-1 font-bold font-sans text-[11px] tracking-wider uppercase border-b-2 border-slate-900 dark:border-slate-300">
              6. DETAILS OF APPLICATION
            </div>

            {/* SECTION 6.A & 6.B */}
            <div className="grid grid-cols-1 sm:grid-cols-2 border-b-2 border-slate-900 dark:border-slate-300 text-[9.5px] font-sans">
              {/* 6.A Column */}
              <div className="border-b sm:border-b-0 sm:border-r border-slate-900 dark:border-slate-300 p-2.5 space-y-1.5">
                <p className="font-bold uppercase pb-1 border-b border-slate-300 dark:border-slate-700">
                  6.A TYPE OF LEAVE TO BE AVAILED OF
                </p>
                <div className="space-y-1">
                  {[
                    { key: "vacation", label: "Vacation Leave (Sec. 51, Rule XVI, Omnibus Rules Implementing E.O. No. 292)" },
                    { key: "mandatory_forced", label: "Mandatory/Forced Leave (Sec. 25, Rule XVI, Omnibus Rules Implementing E.O. No. 292)" },
                    { key: "sick", label: "Sick Leave (Sec. 43, Rule XVI, Omnibus Rules Implementing E.O. No. 292)" },
                    { key: "maternity", label: "Maternity Leave (R.A. No. 11210 / IRR issued by CSC, DOLE and SSS)" },
                    { key: "paternity", label: "Paternity Leave (R.A. No. 8187 / CSC MC No. 71, s. 1998, as amended)" },
                    { key: "special_privilege", label: "Special Privilege Leave (Sec. 21, Rule XVI, Omnibus Rules Implementing E.O. No. 292)" },
                    { key: "solo_parent", label: "Solo Parent Leave (RA No. 8972 / CSC MC No. 8, s. 2004)" },
                    { key: "study", label: "Study Leave (Sec. 68, Rule XVI, Omnibus Rules Implementing E.O. No. 292)" },
                    { key: "vawc", label: "10-Day VAWC Leave (RA No. 9262 / CSC MC No. 15, s. 2005)" },
                    { key: "rehabilitation", label: "Rehabilitation Privilege (Sec. 55, Rule XVI, Omnibus Rules Implementing E.O. No. 292)" },
                    { key: "special_women", label: "Special Leave Benefits for Women (RA No. 9710 / CSC MC No. 25, s. 2010)" },
                    { key: "special_emergency", label: "Special Emergency (Calamity) Leave (CSC MC No. 2, s. 2012, as amended)" },
                    { key: "adoption", label: "Adoption Leave (R.A. No. 8552)" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-start gap-1.5">
                      {leave.leave_type === item.key ? (
                        <CheckSquare className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      ) : (
                        <Square className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 mt-0.5" />
                      )}
                      <span className={leave.leave_type === item.key ? "font-bold text-primary" : ""}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-start gap-1.5 pt-1">
                    {leave.leave_type === "others" ? (
                      <CheckSquare className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    ) : (
                      <Square className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span>Others: </span>
                      <span className="font-semibold underline">
                        {leave.leave_type_others || "_________________________________"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6.B Column */}
              <div className="p-2.5 space-y-3">
                <p className="font-bold uppercase pb-1 border-b border-slate-300 dark:border-slate-700">
                  6.B DETAILS OF LEAVE
                </p>

                {/* Vacation Details */}
                <div className="space-y-1">
                  <p className="font-semibold italic">In case of Vacation/Special Privilege Leave:</p>
                  <div className="pl-3 space-y-1">
                    <div className="flex items-center gap-1.5">
                      {leave.vacation_location === "within_philippines" ? (
                        <CheckSquare className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Square className="h-3.5 w-3.5 text-muted-foreground/60" />
                      )}
                      <span>Within the Philippines</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {leave.vacation_location === "abroad" ? (
                        <CheckSquare className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Square className="h-3.5 w-3.5 text-muted-foreground/60" />
                      )}
                      <span>Abroad (Specify): </span>
                      <span className="font-semibold underline">
                        {leave.vacation_location_abroad || "____________________"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sick Details */}
                <div className="space-y-1">
                  <p className="font-semibold italic">In case of Sick Leave:</p>
                  <div className="pl-3 space-y-1">
                    <div className="flex items-center gap-1.5">
                      {leave.sick_location === "in_hospital" ? (
                        <CheckSquare className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Square className="h-3.5 w-3.5 text-muted-foreground/60" />
                      )}
                      <span>In Hospital (Specify Illness): </span>
                      <span className="font-semibold underline">
                        {leave.sick_location === "in_hospital" ? leave.sick_illness_specify : "__________"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {leave.sick_location === "out_patient" ? (
                        <CheckSquare className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Square className="h-3.5 w-3.5 text-muted-foreground/60" />
                      )}
                      <span>Out Patient (Specify Illness): </span>
                      <span className="font-semibold underline">
                        {leave.sick_location === "out_patient" ? leave.sick_illness_specify : "__________"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Women Details */}
                <div className="space-y-1">
                  <p className="font-semibold italic">In case of Special Leave Benefits for Women:</p>
                  <div className="pl-3">
                    <span>(Specify Illness): </span>
                    <span className="font-semibold underline">
                      {leave.women_illness_specify || "_________________________________"}
                    </span>
                  </div>
                </div>

                {/* Study Details */}
                <div className="space-y-1">
                  <p className="font-semibold italic">In case of Study Leave:</p>
                  <div className="pl-3 space-y-1">
                    <div className="flex items-center gap-1.5">
                      {leave.study_purpose === "masters_degree" ? (
                        <CheckSquare className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Square className="h-3.5 w-3.5 text-muted-foreground/60" />
                      )}
                      <span>Completion of Master&apos;s Degree</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {leave.study_purpose === "bar_board_review" ? (
                        <CheckSquare className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Square className="h-3.5 w-3.5 text-muted-foreground/60" />
                      )}
                      <span>BAR/Board Examination Review</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {leave.study_purpose === "other" ? (
                        <CheckSquare className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Square className="h-3.5 w-3.5 text-muted-foreground/60" />
                      )}
                      <span>Other purpose: </span>
                      <span className="font-semibold underline">
                        {leave.study_purpose_other || "_______________"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Other Purpose */}
                <div className="space-y-1 pt-1 border-t border-slate-200 dark:border-slate-800">
                  <p className="font-semibold italic">Other purpose:</p>
                  <div className="pl-3 space-y-1">
                    <div className="flex items-center gap-1.5">
                      {leave.other_purpose === "monetization" ? (
                        <CheckSquare className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Square className="h-3.5 w-3.5 text-muted-foreground/60" />
                      )}
                      <span>Monetization of Leave Credits</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {leave.other_purpose === "terminal_leave" ? (
                        <CheckSquare className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Square className="h-3.5 w-3.5 text-muted-foreground/60" />
                      )}
                      <span>Terminal Leave</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 6.C & 6.D */}
            <div className="grid grid-cols-1 sm:grid-cols-2 border-b-2 border-slate-900 dark:border-slate-300 text-[10px] font-sans">
              <div className="border-b sm:border-b-0 sm:border-r border-slate-900 dark:border-slate-300 p-2.5 space-y-2">
                <span className="font-bold uppercase">6.C NUMBER OF WORKING DAYS APPLIED FOR:</span>
                <p className="text-sm font-extrabold underline pl-2">
                  {leave.working_days_applied} {leave.working_days_applied > 1 ? "Days" : "Day"}
                </p>
                <div className="pt-2">
                  <span className="font-bold uppercase">INCLUSIVE DATES:</span>
                  <p className="text-xs font-semibold pl-2 pt-0.5 underline">
                    {leave.inclusive_dates_text || `${leave.start_date} to ${leave.end_date}`}
                  </p>
                </div>
              </div>

              <div className="p-2.5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <span className="font-bold uppercase">6.D COMMUTATION:</span>
                  <div className="pl-3 space-y-1">
                    <div className="flex items-center gap-1.5">
                      {!leave.commutation_requested ? (
                        <CheckSquare className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Square className="h-3.5 w-3.5 text-muted-foreground/60" />
                      )}
                      <span>Not Requested</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {leave.commutation_requested ? (
                        <CheckSquare className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Square className="h-3.5 w-3.5 text-muted-foreground/60" />
                      )}
                      <span>Requested</span>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-8">
                  <div className="w-48 mx-auto border-b border-slate-900 dark:border-slate-300">
                    <p className="text-xs font-bold uppercase">
                      {leave.first_name} {leave.middle_name ? `${leave.middle_name[0]}. ` : ""}{leave.last_name}
                    </p>
                  </div>
                  <span className="text-[8px] font-sans uppercase tracking-widest text-muted-foreground">
                    (Signature of Applicant)
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 7 TITLE */}
            <div className="bg-slate-200 dark:bg-slate-800 text-center py-1 font-bold font-sans text-[11px] tracking-wider uppercase border-b-2 border-slate-900 dark:border-slate-300">
              7. DETAILS OF ACTION ON APPLICATION
            </div>

            {/* SECTION 7.A & 7.B */}
            <div className="grid grid-cols-1 sm:grid-cols-2 border-b-2 border-slate-900 dark:border-slate-300 text-[9.5px] font-sans">
              {/* 7.A Certification */}
              <div className="border-b sm:border-b-0 sm:border-r border-slate-900 dark:border-slate-300 p-2.5 space-y-2">
                <span className="font-bold uppercase">7.A CERTIFICATION OF LEAVE CREDITS</span>
                <p className="text-[9px] italic">As of: {leave.credits_as_of || "Current Record"}</p>

                <table className="w-full border-collapse border border-slate-900 dark:border-slate-300 text-center text-[9px]">
                  <thead>
                    <tr className="bg-muted/40">
                      <th className="border border-slate-900 dark:border-slate-300 p-1"></th>
                      <th className="border border-slate-900 dark:border-slate-300 p-1 font-bold">Vacation Leave</th>
                      <th className="border border-slate-900 dark:border-slate-300 p-1 font-bold">Sick Leave</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-900 dark:border-slate-300 p-1 font-semibold text-left">Total Earned</td>
                      <td className="border border-slate-900 dark:border-slate-300 p-1">{leave.vl_total_earned ?? "—"}</td>
                      <td className="border border-slate-900 dark:border-slate-300 p-1">{leave.sl_total_earned ?? "—"}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 dark:border-slate-300 p-1 font-semibold text-left">Less this application</td>
                      <td className="border border-slate-900 dark:border-slate-300 p-1">{leave.vl_less_applied ?? "—"}</td>
                      <td className="border border-slate-900 dark:border-slate-300 p-1">{leave.sl_less_applied ?? "—"}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 dark:border-slate-300 p-1 font-bold text-left bg-muted/20">Balance</td>
                      <td className="border border-slate-900 dark:border-slate-300 p-1 font-bold bg-muted/20">{leave.vl_balance ?? "—"}</td>
                      <td className="border border-slate-900 dark:border-slate-300 p-1 font-bold bg-muted/20">{leave.sl_balance ?? "—"}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="pt-6 text-center">
                  <div className="w-44 mx-auto border-b border-slate-900 dark:border-slate-300 text-[10px] font-bold">
                    {leave.certified_by_name || "Authorized HR Officer"}
                  </div>
                  <span className="text-[8px] text-muted-foreground uppercase">Authorized Officer</span>
                </div>
              </div>

              {/* 7.B Recommendation */}
              <div className="p-2.5 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="font-bold uppercase">7.B RECOMMENDATION</span>
                  <div className="pl-3 space-y-2">
                    <div className="flex items-center gap-1.5">
                      {leave.recommendation === "for_approval" ? (
                        <CheckSquare className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Square className="h-3.5 w-3.5 text-muted-foreground/60" />
                      )}
                      <span>For approval</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        {leave.recommendation === "for_disapproval" ? (
                          <CheckSquare className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <Square className="h-3.5 w-3.5 text-muted-foreground/60" />
                        )}
                        <span>For disapproval due to:</span>
                      </div>
                      <p className="pl-5 underline text-[9px]">
                        {leave.recommendation === "for_disapproval" && leave.recommendation_reason
                          ? leave.recommendation_reason
                          : "_______________________________________"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 text-center">
                  <div className="w-44 mx-auto border-b border-slate-900 dark:border-slate-300 text-[10px] font-bold">
                    {leave.recommended_by_name || "Department Head"}
                  </div>
                  <span className="text-[8px] text-muted-foreground uppercase">Authorized Officer</span>
                </div>
              </div>
            </div>

            {/* SECTION 7.C & 7.D: FINAL DECISION */}
            <div className="grid grid-cols-1 sm:grid-cols-2 border-b-2 border-slate-900 dark:border-slate-300 text-[10px] font-sans">
              <div className="border-b sm:border-b-0 sm:border-r border-slate-900 dark:border-slate-300 p-2.5 space-y-2">
                <span className="font-bold uppercase">7.C APPROVED FOR:</span>
                <div className="pl-3 space-y-1">
                  <p>
                    <span className="font-bold underline">
                      {leave.approved_days_with_pay ?? "___"}
                    </span>{" "}
                    days with pay
                  </p>
                  <p>
                    <span className="font-bold underline">
                      {leave.approved_days_without_pay ?? "___"}
                    </span>{" "}
                    days without pay
                  </p>
                  <p>
                    <span className="font-bold underline">
                      {leave.approved_others_specify || "_______________"}
                    </span>{" "}
                    others (Specify)
                  </p>
                </div>
              </div>

              <div className="p-2.5 space-y-2">
                <span className="font-bold uppercase">7.D DISAPPROVED DUE TO:</span>
                <p className="pl-3 underline text-[9.5px] leading-relaxed">
                  {leave.disapproved_reason || "______________________________________________________"}
                </p>
              </div>
            </div>

            {/* FINAL APPROVAL SIGNATURE */}
            <div className="p-4 text-center space-y-1">
              <div className="w-60 mx-auto border-b border-slate-900 dark:border-slate-300 text-xs font-bold pt-4 uppercase">
                {leave.action_officer_name || "Local Chief Executive / Authorized Signatory"}
              </div>
              <p className="text-[9px] uppercase font-sans tracking-widest text-muted-foreground">
                Authorized Officer
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
