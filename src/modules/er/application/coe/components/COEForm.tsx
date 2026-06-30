"use client";

import { useState, useRef, useEffect } from "react";
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
import { Input } from "@/components/ui/input";

const PURPOSE_OPTIONS = [
  "Employment Verification",
  "Visa Application",
  "Loan Application",
  "Training",
  "Government Compliance",
  "Transfer",
];

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
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      purpose: initialData?.purpose ?? "",
    },
  });

  const purposeValue = form.watch("purpose");

  useEffect(() => {
    if (!purposeValue) {
      setSuggestions(PURPOSE_OPTIONS);
      return;
    }
    const q = purposeValue.toLowerCase();
    const filtered = PURPOSE_OPTIONS.filter((o) => o.toLowerCase().includes(q));
    const matchesSelected = PURPOSE_OPTIONS.some((o) => o === purposeValue);
    setSuggestions(matchesSelected ? [] : filtered);
  }, [purposeValue]);

  useEffect(() => {
    if (!open) setHighlightIndex(-1);
  }, [open]);

  const handleSelect = (value: string) => {
    form.setValue("purpose", value);
    setOpen(false);
    setHighlightIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setOpen(true);
        e.preventDefault();
        return;
      }
    }
    if (e.key === "ArrowDown") {
      setHighlightIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
      e.preventDefault();
    } else if (e.key === "Enter" && highlightIndex >= 0 && suggestions[highlightIndex]) {
      handleSelect(suggestions[highlightIndex]);
      e.preventDefault();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (listRef.current && listRef.current.contains(e.relatedTarget as Node)) return;
    setTimeout(() => setOpen(false), 200);
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
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    ref={(e) => {
                      field.ref(e);
                      (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
                    }}
                    placeholder="Type or select a purpose..."
                    onFocus={() => setOpen(true)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                  />
                  {open && suggestions.length > 0 && (
                    <div
                      ref={listRef}
                      className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border bg-popover p-1 shadow-md"
                    >
                      {suggestions.map((option, idx) => (
                        <button
                          key={option}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSelect(option)}
                          className={`w-full rounded-md px-3 py-1.5 text-left text-sm ${
                            idx === highlightIndex
                              ? "bg-accent text-accent-foreground"
                              : "text-popover-foreground"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
