"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Concern } from "../type";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

const SUBJECT_OPTIONS = [
  "Harassment or Discrimination",
  "Workplace Conflict",
  "Policy Violation",
  "Salary or Benefits",
  "Workload or Scheduling",
  "Health or Safety",
  "Ethics or Misconduct",
  "Supervisor Relations",
  "Co-worker Relations",
  "Other",
];

const OTHER_VALUE = "__other__";

const FormSchema = z.object({
  subject_of_concern: z.string().min(1, "Subject is required"),
  concern: z.string().min(1, "Concern description is required"),
  is_anonymous: z.boolean(),
});
type FormValues = z.infer<typeof FormSchema>;

interface ConcernFormProps {
  initialData?: Concern;
  onSubmit: (data: { subject_of_concern: string; concern: string; is_anonymous: boolean }) => void;
  isLoading?: boolean;
}

export function ConcernForm({ initialData, onSubmit, isLoading }: ConcernFormProps) {
  const initialSubject = initialData?.subject_of_concern ?? "";
  const isInitialOther =
    initialSubject !== "" && !SUBJECT_OPTIONS.includes(initialSubject);

  const [isOther, setIsOther] = useState(isInitialOther);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      subject_of_concern: initialSubject,
      concern: initialData?.concern ?? "",
      is_anonymous: initialData?.is_anonymous ?? false,
    },
  });

  const handleSelectChange = (value: string) => {
    if (value === OTHER_VALUE) {
      setIsOther(true);
      form.setValue("subject_of_concern", "");
    } else {
      setIsOther(false);
      form.setValue("subject_of_concern", value);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => onSubmit(values))} className="space-y-5">
        <FormField
          control={form.control}
          name="subject_of_concern"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject of Concern</FormLabel>
              <Select
                value={isOther ? OTHER_VALUE : field.value || undefined}
                onValueChange={handleSelectChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SUBJECT_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isOther && (
                <Input
                  placeholder="Enter your subject..."
                  value={field.value ?? ""}
                  onChange={(e) => form.setValue("subject_of_concern", e.target.value)}
                  className="mt-2"
                />
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="concern"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Describe Your Concern</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide a detailed description of your concern..."
                  className="min-h-[140px] resize-y"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_anonymous"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-3 rounded-xl border p-4">
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  id="is_anonymous"
                />
                <div className="space-y-0.5">
                  <Label htmlFor="is_anonymous" className="text-sm font-medium cursor-pointer">
                    Submit anonymously
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Your identity will be hidden — only HR will see your details.
                  </p>
                </div>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Submitting..." : "Submit Concern"}
        </Button>
      </form>
    </Form>
  );
}
