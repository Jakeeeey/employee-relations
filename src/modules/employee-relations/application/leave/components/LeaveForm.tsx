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
import { format, differenceInDays } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useEffect } from "react";

interface LeaveFormProps {
  initialData?: LeaveRequest;
  onSubmit: (data: CreateLeaveInput) => Promise<void>;
  isLoading?: boolean;
}

export function LeaveForm({ initialData, onSubmit, isLoading }: LeaveFormProps) {
  const form = useForm<CreateLeaveInput>({
    resolver: zodResolver(CreateLeaveSchema),
    defaultValues: {
      leave_type: initialData?.leave_type || "vacation",
      leave_start: initialData?.leave_start || null,
      leave_end: initialData?.leave_end || null,
      total_days: initialData?.total_days || 0,
      reason: initialData?.reason || "",
      user_id: initialData?.user_id || 0,
      department_id: initialData?.department_id || null,
      remarks: initialData?.remarks || null,
    },
  });

  const { setValue, control } = form;
  const leaveStart = useWatch({ control, name: "leave_start" });
  const leaveEnd = useWatch({ control, name: "leave_end" });

  useEffect(() => {
    if (leaveStart && leaveEnd) {
      if (leaveEnd >= leaveStart) {
        const start = new Date(leaveStart);
        const end = new Date(leaveEnd);
        const diff = differenceInDays(end, start) + 1;
        setValue("total_days", diff, { shouldValidate: true });
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
                      disabled={(date) => (leaveStart ? format(date, "yyyy-MM-dd") < leaveStart : false)}
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

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Update Leave Request" : "Submit Leave Request"}
        </Button>
      </form>
    </Form>
  );
}
