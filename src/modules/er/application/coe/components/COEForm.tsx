"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { COERequest } from "../type";
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

const PURPOSE_OPTIONS = [
  "Employment Verification",
  "Visa Application",
  "Loan Application",
  "Training",
  "Government Compliance",
  "Transfer",
];

const OTHER_VALUE = "__other__";

const FormSchema = z.object({
  purpose: z.string().min(1, "Purpose is required"),
});
type FormValues = z.infer<typeof FormSchema>;

interface COEFormProps {
  initialData?: COERequest;
  onSubmit: (data: { purpose: string }) => void;
  isLoading?: boolean;
}

export function COEForm({ initialData, onSubmit, isLoading }: COEFormProps) {
  const initialPurpose = initialData?.purpose ?? "";
  const isInitialOther =
    initialPurpose !== "" && !PURPOSE_OPTIONS.includes(initialPurpose);

  const [isOther, setIsOther] = useState(isInitialOther);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      purpose: initialPurpose,
    },
  });

  const handleSelectChange = (value: string) => {
    if (value === OTHER_VALUE) {
      setIsOther(true);
      form.setValue("purpose", "");
    } else {
      setIsOther(false);
      form.setValue("purpose", value);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => onSubmit(values))} className="space-y-4">
        <FormField
          control={form.control}
          name="purpose"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purpose</FormLabel>
              <Select
                value={isOther ? OTHER_VALUE : field.value || undefined}
                onValueChange={handleSelectChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PURPOSE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                  <SelectItem value={OTHER_VALUE}>Other (specify)</SelectItem>
                </SelectContent>
              </Select>
              {isOther && (
                <Input
                  placeholder="Enter your purpose..."
                  value={field.value ?? ""}
                  onChange={(e) => form.setValue("purpose", e.target.value)}
                  className="mt-2"
                />
              )}
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
