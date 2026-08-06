"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateLeaveSchema, CreateLeaveInput, LeaveTypeEnum, LeaveRequest } from "../types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";

interface LeaveFormProps {
  initialData?: LeaveRequest;
  onSubmit: (data: CreateLeaveInput) => Promise<void>;
  isLoading?: boolean;
  userId?: number;
}

export function LeaveForm({ initialData, onSubmit, isLoading, userId }: LeaveFormProps) {
  const [balance, setBalance] = useState<{
    vacation: { limit: number; used: number; remaining: number };
    sick: { limit: number; used: number; remaining: number };
  } | null>(null);

  const form = useForm<CreateLeaveInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(CreateLeaveSchema) as any,
    defaultValues: {
      leave_type: initialData?.leave_type || "vacation",
      leave_start: initialData?.leave_start || null,
      leave_end: initialData?.leave_end || null,
      total_days: initialData?.total_days || 0,
      reason: initialData?.reason || "",
      user_id: initialData?.user_id || userId || 0,
      department_id: initialData?.department_id || null,
      remarks: initialData?.remarks || null,
      is_paid: initialData?.is_paid || false,
    },
  });

  const { setValue, control } = form;
  const leaveStart = useWatch({ control, name: "leave_start" });
  const leaveEnd = useWatch({ control, name: "leave_end" });
  const leaveType = useWatch({ control, name: "leave_type" });
  const isPaid = useWatch({ control, name: "is_paid" });
  const totalDays = useWatch({ control, name: "total_days" });

  useEffect(() => {
    const fetchBalance = async () => {
      const activeUserId = userId || initialData?.user_id;
      if (!activeUserId) return;
      try {
        const excludeParam = initialData?.leave_id ? `&excludeLeaveId=${initialData.leave_id}` : "";
        const res = await fetch(`/api/er/application/leave/balance?userId=${activeUserId}${excludeParam}`);
        const result = await res.json();
        if (result.ok) {
          setBalance(result.data);
        }
      } catch (err) {
        console.error("Failed to fetch leave balance", err);
      }
    };

    fetchBalance();
  }, [userId, initialData?.user_id, initialData?.leave_id]);

  useEffect(() => {
    if (leaveType !== "vacation" && leaveType !== "sick") {
      setValue("is_paid", false, { shouldValidate: true });
    }
  }, [leaveType, setValue]);

  const remainingDays = balance
    ? leaveType === "vacation"
      ? balance.vacation.remaining
      : leaveType === "sick"
      ? balance.sick.remaining
      : 0
    : 0;

  const isPaidExceeded = isPaid && totalDays > remainingDays;

  useEffect(() => {
    if (leaveStart && leaveEnd) {
      if (leaveEnd >= leaveStart) {
        let count = 0;
        const current = new Date(leaveStart);
        const end = new Date(leaveEnd);
        
        while (current <= end) {
          if (current.getDay() !== 0) { // 0 = Sunday
            count++;
          }
          current.setDate(current.getDate() + 1);
        }
        
        setValue("total_days", count, { shouldValidate: true });
      } else {
        setValue("total_days", 0, { shouldValidate: true });
      }
    }
  }, [leaveStart, leaveEnd, setValue]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="leave_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Leave Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {LeaveTypeEnum.options.map((option) => (
                    <SelectItem key={option} value={option} className="capitalize">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="leave_start"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                      disabled={(date) => date.getDay() === 0}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="leave_end"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                      disabled={(date) => 
                        date.getDay() === 0 || (leaveStart ? format(date, "yyyy-MM-dd") < leaveStart : false)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="total_days"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Total Days</FormLabel>
              <FormControl>
                <Input {...field} type="number" disabled className="bg-muted" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {(leaveType === "vacation" || leaveType === "sick") && (
          <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
            <FormField
              control={form.control}
              name="is_paid"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <FormLabel className="text-sm font-semibold">Paid Leave</FormLabel>
                    <div className="text-xs text-muted-foreground">
                      Deduct requested days from your paid leave balance.
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {isPaid && balance && (
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs border-t pt-3">
                <div className="p-2 rounded bg-muted/40">
                  <div className="font-semibold text-muted-foreground">Annual Limit</div>
                  <div className="text-sm font-bold mt-1 text-foreground">
                    {leaveType === "vacation" ? balance.vacation.limit : balance.sick.limit} d
                  </div>
                </div>
                <div className="p-2 rounded bg-muted/40">
                  <div className="font-semibold text-muted-foreground">Used</div>
                  <div className="text-sm font-bold mt-1 text-amber-600">
                    {leaveType === "vacation" ? balance.vacation.used : balance.sick.used} d
                  </div>
                </div>
                <div className="p-2 rounded bg-muted/40">
                  <div className="font-semibold text-muted-foreground">Remaining</div>
                  <div className="text-sm font-bold mt-1 text-emerald-600">
                    {leaveType === "vacation" ? balance.vacation.remaining : balance.sick.remaining} d
                  </div>
                </div>
              </div>
            )}

            {isPaid && isPaidExceeded && (
              <div className="text-xs font-semibold text-destructive mt-1">
                Warning: Requesting {totalDays} day(s) exceeds your remaining paid balance of {remainingDays} day(s).
              </div>
            )}
          </div>
        )}

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter reason for leave..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading || isPaidExceeded}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Update Leave Request" : "Submit Leave Request"}
        </Button>
      </form>
    </Form>
  );
}
