import jsPDF from "jspdf";
import { format } from "date-fns";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildPayslipsPdf({ employee, run, company }: any): string {
    const doc = new jsPDF("p", "pt", "letter");

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const boxW = pageWidth - margin * 2;
    const startX = margin;
    const startY = 20;

    // Outer Box (Draw later or track height)
    // We'll draw elements from top to bottom
    
    // Header Line 1
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    const companyName = company?.name || "VERTEX OPERATING SYSTEM";
    doc.text(companyName.toUpperCase(), startX + 5, startY + 12);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const todayStr = format(new Date(), "yyyy-MM-dd");
    doc.text(`Payroll Date: ${todayStr}`, startX + boxW - 5, startY + 12, { align: "right" });

    // Header Line 2
    let payrollRunIdVal = '0';
    if (run && typeof run === 'object') {
        payrollRunIdVal = run.payroll_run_id || run.id || '0';
    } else if (typeof employee.payroll_run_id === 'object' && employee.payroll_run_id !== null) {
        payrollRunIdVal = employee.payroll_run_id.payroll_run_id || employee.payroll_run_id.id || '0';
    } else if (employee.payroll_run_id) {
        payrollRunIdVal = employee.payroll_run_id;
    }
    const payrollId = `PR-${payrollRunIdVal}-${employee.id || '0'}`;
    doc.text(`Payroll ID: ${payrollId}`, startX + 5, startY + 24);

    // Employee Name Bar (Blue Background)
    const empBarY = startY + 30;
    doc.setFillColor(235, 245, 255); // light blue
    doc.rect(startX, empBarY, boxW, 16, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    const empName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim().toUpperCase();
    doc.text(`EMPLOYEE: ${empName}`, startX + 5, empBarY + 12);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    let empIdVal = employee.id;
    if (employee.user_id && typeof employee.user_id === 'object') {
        empIdVal = employee.user_id.user_id || employee.user_id.id || employee.id;
    } else if (employee.user_id) {
        empIdVal = employee.user_id;
    }
    const empIdStr = `ID No.: ${empIdVal}`;
    doc.text(empIdStr, startX + boxW - 5, empBarY + 12, { align: "right" });



    // Employee Details
    const detailsY = empBarY + 16;
    doc.text(`Department: ${employee.department_name || employee.department || 'N/A'}`, startX + 5, detailsY + 10);
    doc.text(`Job Title: ${employee.position || employee.position_name || 'N/A'}`, startX + 5, detailsY + 20);
    
    const mRate = Number(employee.monthly_rate || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
    const dRate = Number(employee.daily_rate || employee.basic_daily_rate || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
    const hRate = Number(employee.hourly_rate || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
    doc.text(`Rates: PHP ${mRate} / PHP ${dRate} / PHP ${hRate}`, startX + 5, detailsY + 30);

    // Cutoff and Payment Method (Right aligned)
    const cutoffType = employee.cutoff_type || "FIRST";
    const startDate = run?.cutoff_start ? format(new Date(run.cutoff_start), "yyyy-MM-dd") : 'N/A';
    const endDate = run?.cutoff_end ? format(new Date(run.cutoff_end), "yyyy-MM-dd") : 'N/A';
    doc.text(`${cutoffType} ${startDate} - ${endDate}`, startX + boxW - 5, detailsY + 20, { align: "right" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Payment Method: BANK", startX + boxW - 5, detailsY + 30, { align: "right" });

    // Summary Boxes (Days/Hours and Net Pay)
    const summaryBoxY = detailsY + 35;
    const summaryBoxH = 24;
    const summaryBoxW = boxW * 0.7; // 70% width
    const netPayBoxW = boxW - summaryBoxW - 10;
    const netPayBoxX = startX + summaryBoxW + 10;
    
    // Draw borders
    doc.rect(startX, summaryBoxY, summaryBoxW, summaryBoxH);
    // Draw Net Pay box with green bg
    doc.setFillColor(230, 245, 235);
    doc.rect(netPayBoxX, summaryBoxY, netPayBoxW, summaryBoxH, "FD");

    // Inside Summary Box
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const dX1 = startX + 5;
    const dX2 = startX + (summaryBoxW / 3) + 5;
    const dX3 = startX + (summaryBoxW * 2 / 3) + 5;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatInt = (v: any) => v || 0;
    
    doc.text("Days:", dX1, summaryBoxY + 10);
    doc.text(`${formatInt(employee.total_days_worked)}`, dX2 - 15, summaryBoxY + 10, { align: "right" });
    doc.text("UT:", dX1, summaryBoxY + 20);
    doc.text(`${formatInt(employee.undertime_minutes)}`, dX2 - 15, summaryBoxY + 20, { align: "right" });

    doc.text("Min:", dX2, summaryBoxY + 10);
    doc.text(`${formatInt(employee.total_work_minutes)}`, dX3 - 15, summaryBoxY + 10, { align: "right" });
    doc.text("OT:", dX2, summaryBoxY + 20);
    doc.text(`${formatInt(employee.overtime_minutes)}`, dX3 - 15, summaryBoxY + 20, { align: "right" });

    doc.text("Late:", dX3, summaryBoxY + 10);
    doc.text(`${formatInt(employee.late_minutes)}`, startX + summaryBoxW - 5, summaryBoxY + 10, { align: "right" });
    doc.text("ND:", dX3, summaryBoxY + 20);
    doc.text(`${formatInt(employee.night_diff_minutes)}`, startX + summaryBoxW - 5, summaryBoxY + 20, { align: "right" });

    // Inside Net Pay Box
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("NET PAY", netPayBoxX + 5, summaryBoxY + 10);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    const formatMoney = (val: number | string) => {
        const num = Number(val) || 0;
        return "PHP " + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    
    // Parse Breakdown JSON
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let breakdown: any = {};
    if (typeof employee.breakdown_json === 'string') {
        try { breakdown = JSON.parse(employee.breakdown_json); } catch {}
    } else if (typeof employee.breakdown_json === 'object') {
        breakdown = employee.breakdown_json || {};
    }
    const earnings = breakdown?.earnings || {};
    const deductions = breakdown?.deductions || {};
    const totals = breakdown?.totals || { net_pay: employee.net_pay, gross_pay: employee.gross_pay, total_deductions: employee.total_deductions || 0 };

    doc.text(formatMoney(totals.net_pay || employee.net_pay), netPayBoxX + netPayBoxW - 5, summaryBoxY + 20, { align: "right" });

    // Earnings / Deductions Headers
    const edBoxY = summaryBoxY + summaryBoxH + 5;
    const edBoxH = 14;
    const leftW = (boxW / 2) - 5;
    const rightX = startX + leftW + 10;
    
    doc.setFillColor(235, 245, 255);
    doc.rect(startX, edBoxY, leftW, edBoxH, "FD");
    doc.rect(rightX, edBoxY, leftW, edBoxH, "FD");
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("EARNINGS", startX + leftW / 2, edBoxY + 10, { align: "center" });
    doc.text("DEDUCTIONS", rightX + leftW / 2, edBoxY + 10, { align: "center" });

    // Items List
    let currentY = edBoxY + edBoxH + 10;
    doc.setFont("helvetica", "normal");
    
    const subColLeft1 = startX;
    const subColLeft2 = startX + (leftW / 2);
    
    const subColRight1 = rightX;
    const subColRight2 = rightX + (leftW / 2);

    const drawItem = (label: string, value: number | string, x: number, width: number, y: number) => {
        doc.text(label.substring(0, 15).toUpperCase(), x, y);
        doc.text(formatMoney(value), x + width - 5, y, { align: "right" });
    };

    // Prepare arrays of items for 4 subcolumns
    const e1 = [
        { label: "BASIC PAY", val: earnings.basic_pay || employee.basic_pay },
        { label: "OVERTIME", val: earnings.ot_amount || employee.ot_amount },
        { label: "HOLIDAY PAY", val: earnings.holiday_pay || employee.holiday_pay },
        { label: "REST DAY", val: earnings.rest_day_amount || employee.rest_day_amount },
        { label: "NIGHT DIFF", val: earnings.night_diff_amount || employee.night_diff_amount },
        { label: "ALLOWANCE", val: employee.allowance || 0 },
    ];
    
    const e2 = [
        { label: "RETRO", val: earnings.retro_pay || employee.retro_pay },
        { label: "LEAVE PAY", val: employee.leave_amount || 0 },
        { label: "MANUAL ADDITIONS", val: earnings.manual_additions || employee.manual_additions },
    ];

    const d1 = [
        { label: "LATE", val: deductions.late_deduction || employee.late_deduction },
        { label: "UNDERTIME", val: deductions.undertime_deduction || employee.undertime_deduction },
        { label: "SHORTAGE", val: deductions.shortage_deduction || employee.shortage_deduction },
        { label: "STOCK PURCHASE", val: 0 },
        { label: "EMPLOYEE LOANS", val: employee.loan_total || 0 },
        { label: "COOP SAVINGS", val: deductions.coop_savings || employee.coop_savings || 0 },
    ];

    const benefits = deductions.benefits || {};
    const d2 = [
        { label: "COOP LOANS", val: employee.loan_coop || 0 },
        { label: "SSS", val: benefits.sss || employee.benefit_sss },
        { label: "PHILHEALTH", val: benefits.philhealth || employee.benefit_philhealth },
        { label: "PAG-IBIG", val: benefits.pagibig || employee.benefit_pagibig },
        { label: "BENEFIT LOANS", val: employee.benefit_loan_total || 0 },
        { label: "MANUAL DEDUCT...", val: deductions.manual_deductions || employee.manual_deductions },
    ];

    const maxRows = Math.max(e1.length, e2.length, d1.length, d2.length);
    const subColW = (leftW / 2);

    for (let i = 0; i < maxRows; i++) {
        if (e1[i]) drawItem(e1[i].label, e1[i].val, subColLeft1, subColW, currentY);
        if (e2[i]) drawItem(e2[i].label, e2[i].val, subColLeft2, subColW, currentY);
        if (d1[i]) drawItem(d1[i].label, d1[i].val, subColRight1, subColW, currentY);
        if (d2[i]) drawItem(d2[i].label, d2[i].val, subColRight2, subColW, currentY);
        currentY += 10;
    }

    // Dotted separator
    currentY += 5;
    doc.setLineDashPattern([2, 2], 0);
    doc.line(startX, currentY, startX + boxW, currentY);
    doc.setLineDashPattern([], 0); // reset

    // Itemization labels
    currentY += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Itemization", startX, currentY);
    doc.text("Itemization", rightX, currentY);
    doc.setFont("helvetica", "normal");
    doc.text("(none)", startX, currentY + 10);
    doc.text("(none)", rightX, currentY + 10);

    currentY += 25;

    // Bottom solid line
    doc.setLineWidth(1);
    doc.line(startX, currentY, startX + boxW, currentY);
    doc.setLineWidth(0.5);

    currentY += 15;
    
    // Totals Bottom section
    doc.setFont("helvetica", "bold");
    doc.text(`Gross: ${formatMoney(totals.gross_pay || employee.gross_pay)}`, startX + 5, currentY);
    doc.text(`Net: ${formatMoney(totals.net_pay || employee.net_pay)}`, startX + 5, currentY + 12);
    
    doc.text(`Total Deductions: ${formatMoney(totals.total_deductions || employee.total_deductions)}`, startX + boxW - 5, currentY, { align: "right" });

    // Draw main outer box
    const totalBoxHeight = (currentY + 20) - startY;
    doc.rect(startX, startY, boxW, totalBoxHeight);

    return doc.output("datauristring");
}
