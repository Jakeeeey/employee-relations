"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UndertimeRequest, CreateUndertimeInput, CreateUndertimeSchema } from "../types";
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

interface UndertimeFormProps {
  initialData?: UndertimeRequest;
  onSubmit: (data: CreateUndertimeInput) => void;
  isLoading?: boolean;
}

export function UndertimeForm({ initialData, onSubmit, isLoading }: UndertimeFormProps) {
  const form = useForm<CreateUndertimeInput>({
    resolver: zodResolver(CreateUndertimeSchema),
    defaultValues: {
      user_id: initialData?.user_id || 0,
      department_id: initialData?.department_id || null,
      request_date: initialData?.request_date || format(new Date(), "yyyy-MM-dd"),
      sched_timeout: initialData?.sched_timeout ? initialData.sched_timeout.substring(0, 5) : "17:00",
      actual_timeout: initialData?.actual_timeout ? initialData.actual_timeout.substring(0, 5) : "15:00",
      reason: initialData?.reason || "",
      remarks: initialData?.remarks || "",
      duration_minutes: initialData?.duration_minutes || 120,
    },
  });

  const schedOut = useWatch({ control: form.control, name: "sched_timeout" });
  const actualOut = useWatch({ control: form.control, name: "actual_timeout" });

  useEffect(() => {
    if (schedOut && actualOut) {
      try {
        const schedTime = parse(schedOut, "HH:mm", new Date());
        const actualTime = parse(actualOut, "HH:mm", new Date());
        let diffMins = (schedTime.getTime() - actualTime.getTime()) / 60000;
        
        if (diffMins < 0) diffMins = 0;
        
        form.setValue("duration_minutes", diffMins);
      } catch {
        // Handle invalid time gracefully
      }
    }
  }, [schedOut, actualOut, form]);

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

        <div className="grid grid-cols-2 gap-4">
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

          <FormField
            control={form.control}
            name="actual_timeout"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Requested Time Out</FormLabel>
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
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason</FormLabel>
              <FormControl>
                <Textarea placeholder="Explain your reason for undertime" {...field} />
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
