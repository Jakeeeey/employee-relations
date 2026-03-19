"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OvertimeRequest, CreateOvertimeInput, CreateOvertimeSchema } from "../types";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEffect } from "react";
import { format, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface OvertimeFormProps {
  initialData?: OvertimeRequest;
  onSubmit: (data: CreateOvertimeInput) => void;
  isLoading?: boolean;
}

export function OvertimeForm({ initialData, onSubmit, isLoading }: OvertimeFormProps) {
  const form = useForm<CreateOvertimeInput>({
    resolver: zodResolver(CreateOvertimeSchema),
    defaultValues: {
      user_id: initialData?.user_id || 0,
      department_id: initialData?.department_id || null,
      request_date: initialData?.request_date || format(new Date(), "yyyy-MM-dd"),
      sched_timeout: initialData?.sched_timeout ? initialData.sched_timeout.substring(0, 5) : "17:30",
      ot_from: initialData?.ot_from ? initialData.ot_from.substring(0, 5) : "17:30",
      ot_to: initialData?.ot_to ? initialData.ot_to.substring(0, 5) : "19:30",
      purpose: initialData?.purpose || "",
      remarks: initialData?.remarks || "",
      duration_minutes: initialData?.duration_minutes || 120,
    },
  });

  const otFrom = useWatch({ control: form.control, name: "ot_from" });
  const otTo = useWatch({ control: form.control, name: "ot_to" });

  useEffect(() => {
    if (otFrom && otTo) {
      try {
        const fromTime = parse(otFrom, "HH:mm", new Date());
        let toTime = parse(otTo, "HH:mm", new Date());
        
        // Handle cross-midnight logic if toTime is earlier than fromTime
        if (toTime < fromTime) {
          toTime = new Date(toTime.getTime() + 24 * 60 * 60 * 1000);
        }

        let diffMins = (toTime.getTime() - fromTime.getTime()) / 60000;
        
        if (diffMins < 0) diffMins = 0;
        
        form.setValue("duration_minutes", diffMins);
      } catch {
        // Handle invalid time gracefully
      }
    }
  }, [otFrom, otTo, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        <FormField
          control={form.control}
          name="request_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Request Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
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
          name="sched_timeout"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scheduled Time Out</FormLabel>
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="ot_from"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Overtime Start (From)</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ot_to"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Overtime End (To)</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="duration_minutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (Minutes)</FormLabel>
              <FormControl>
                <Input type="number" readOnly className="bg-muted" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="purpose"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purpose</FormLabel>
              <FormControl>
                <Textarea placeholder="Explain your reason for overtime" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Saving..." : initialData ? "Update Request" : "Submit Request"}
        </Button>
      </form>
    </Form>
  );
}
