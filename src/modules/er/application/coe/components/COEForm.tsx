"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { COERequest } from "../type";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Check, ChevronDown } from "lucide-react";

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
  remarks: z.string().optional(),
});
type FormValues = z.infer<typeof FormSchema>;

interface COEFormProps {
  initialData?: COERequest;
  onSubmit: (data: { purpose: string; remarks?: string }) => void;
  isLoading?: boolean;
}

export function COEForm({ initialData, onSubmit, isLoading }: COEFormProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [search, setSearch] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      purpose: initialData?.purpose ?? "",
      remarks: initialData?.remarks ?? "",
    },
  });

  const purposeValue = form.watch("purpose"); // eslint-disable-line react-hooks/incompatible-library

  const filteredOptions = search
    ? PURPOSE_OPTIONS.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : PURPOSE_OPTIONS;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => onSubmit(values))} className="space-y-4">
        <FormField
          control={form.control}
          name="purpose"
          render={({ field }) => (
            <FormItem className="relative">
              <FormLabel>Purpose</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    placeholder="Type a purpose or select from suggestions..."
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      setSearch(e.target.value);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </FormControl>
              {showSuggestions && (
                <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
                  <Command>
                    <CommandList>
                      <CommandGroup>
                        {filteredOptions.length === 0 ? (
                          <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                            {search ? "No matching suggestions. Continue typing..." : "Type to see suggestions"}
                          </div>
                        ) : (
                          filteredOptions.map((option) => (
                            <CommandItem
                              key={option}
                              value={option}
                              onSelect={() => {
                                field.onChange(option);
                                setShowSuggestions(false);
                                setSearch("");
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  purposeValue === option ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {option}
                            </CommandItem>
                          ))
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="remarks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Remarks / Reason</FormLabel>
              <FormControl>
                <textarea
                  {...field}
                  placeholder="Optional notes or reason for the request..."
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
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
