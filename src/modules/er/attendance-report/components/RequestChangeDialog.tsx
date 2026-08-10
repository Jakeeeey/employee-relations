"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, isValid } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AttendanceLog } from "../type";

const formSchema = z.object({
  time_in: z.string().optional(),
  lunch_start: z.string().optional(),
  lunch_end: z.string().optional(),
  break_start: z.string().optional(),
  break_end: z.string().optional(),
  time_out: z.string().optional(),
  reason: z.string().min(5, "Reason must be at least 5 characters long"),
  proof: z
    .any()
    .refine((files) => files?.length > 0, "At least one proof file is required."),
});

type FormValues = z.infer<typeof formSchema>;

interface RequestChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendanceLog: AttendanceLog | null;
  userId: number;
  onSuccess?: () => void;
}

function extractTime(isoString: string | null | undefined): string {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    if (!isValid(date)) return "";
    return format(date, "HH:mm");
  } catch {
    return "";
  }
}

export function RequestChangeDialog({
  open,
  onOpenChange,
  attendanceLog,
  userId,
  onSuccess,
}: RequestChangeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      time_in: "",
      lunch_start: "",
      lunch_end: "",
      break_start: "",
      break_end: "",
      time_out: "",
      reason: "",
      proof: undefined,
    },
  });

  // Pre-fill form when the dialog opens or attendanceLog changes
  useEffect(() => {
    if (open && attendanceLog) {
      form.reset({
        time_in: extractTime(attendanceLog.time_in),
        lunch_start: extractTime(attendanceLog.lunch_start),
        lunch_end: extractTime(attendanceLog.lunch_end),
        break_start: extractTime(attendanceLog.break_start),
        break_end: extractTime(attendanceLog.break_end),
        time_out: extractTime(attendanceLog.time_out),
        reason: "",
        proof: undefined,
      });
    }
  }, [open, attendanceLog, form]);

  const onSubmit = async (data: FormValues) => {
    if (!attendanceLog) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("userId", String(userId));
      formData.append("logDate", attendanceLog.log_date);
      formData.append("reason", data.reason);
      if (data.time_in) formData.append("time_in", data.time_in);
      if (data.lunch_start) formData.append("lunch_start", data.lunch_start);
      if (data.lunch_end) formData.append("lunch_end", data.lunch_end);
      if (data.break_start) formData.append("break_start", data.break_start);
      if (data.break_end) formData.append("break_end", data.break_end);
      if (data.time_out) formData.append("time_out", data.time_out);

      // Append all selected files
      if (data.proof && data.proof.length > 0) {
        Array.from(data.proof as FileList).forEach((file) => {
          formData.append("proof", file);
        });
      }

      const response = await fetch("/api/er/attendance-report/request-change", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit request");
      }

      toast.success("Attendance change request submitted successfully!");
      onOpenChange(false);
      form.reset();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "An unknown error occurred",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
    }
    onOpenChange(isOpen);
  };

  if (!attendanceLog) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Attendance Change</DialogTitle>
          <DialogDescription>
            Request to modify attendance times for{" "}
            <span className="font-semibold text-foreground">
              {format(new Date(attendanceLog.log_date), "MMM dd, yyyy")}
            </span>
            . Leave time fields blank if you do not wish to change them.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="time_in"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time In</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time_out"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Out</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lunch_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lunch Start</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lunch_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lunch End</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="break_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Break Start</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="break_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Break End</FormLabel>
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
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain why you are requesting a change..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="proof"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proof (Attachments)</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      name={field.name}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      onChange={(e) => field.onChange(e.target.files)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
