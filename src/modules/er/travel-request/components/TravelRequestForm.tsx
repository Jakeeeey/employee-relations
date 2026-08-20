/* eslint-disable @typescript-eslint/no-explicit-any */
 
 
"use client";

import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TravelRequestFormInput, TravelRequestFormInputSchema } from "../types/schema";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface TravelRequestFormProps {
  onSubmit: (data: TravelRequestFormInput) => void;
  isLoading?: boolean;
  coas: any[];
}

export function TravelRequestForm({ onSubmit, isLoading, coas }: TravelRequestFormProps) {
  const form = useForm<TravelRequestFormInput>({
    resolver: zodResolver(TravelRequestFormInputSchema),
    defaultValues: {
      travel_from: "",
      travel_to: "",
      destination: "",
      purpose: "",
      requires_budget: false,
      remarks: "",
      budget_items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: "budget_items",
    control: form.control,
  });

  const requiresBudget = useWatch({
    control: form.control,
    name: "requires_budget",
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className={cn("grid gap-8 items-start transition-all duration-300", requiresBudget ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1")}>
          
          {/* LEFT COLUMN: Main Details */}
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination</FormLabel>
                  <FormControl>
                    <Input placeholder="City, Country" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="travel_from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="travel_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose of Travel</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Client meeting, Conference, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Additional notes" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requires_budget"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-muted/20">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (!checked) {
                          // Clear budget items when unchecked
                          remove();
                        } else if (fields.length === 0) {
                          // Add one empty item to start with
                          append({ amount: 0, remarks: "", coa_id: undefined as any });
                        }
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Requires Budget Allocation</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Check this if you need to request budget for this travel.
                    </p>
                  </div>
                </FormItem>
              )}
            />
          </div>

          {/* RIGHT COLUMN: Budget Allocation */}
          {requiresBudget && (
            <div className="space-y-6 h-full min-h-[300px]">
              <Card className="h-full border-slate-200/80 shadow-sm bg-slate-50/50 dark:bg-slate-900/20">
                <CardHeader className="flex flex-row items-center justify-between py-4">
                  <CardTitle className="text-base">Budget Items</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ amount: 0, remarks: "", coa_id: undefined as any })}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="relative p-4 rounded-md border bg-background shadow-sm space-y-4">
                      
                      {/* Item Header & Delete */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-muted-foreground">Line Item {index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name={`budget_items.${index}.coa_id`}
                        render={({ field: selectField }) => (
                          <FormItem className="w-full">
                            <FormLabel className="text-xs">Chart of Account</FormLabel>
                            <Select
                              onValueChange={(value) => selectField.onChange(Number(value))}
                              value={selectField.value?.toString() || ""}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select GL Account" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {coas?.map((coa) => (
                                  <SelectItem key={coa.coa_id} value={coa.coa_id.toString()}>
                                    {coa.gl_code} - {coa.account_title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-4">
                        <FormField
                          control={form.control}
                          name={`budget_items.${index}.amount`}
                          render={({ field: inputField }) => (
                            <FormItem className="w-1/3">
                              <FormLabel className="text-xs">Amount</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  placeholder="0.00" 
                                  {...inputField} 
                                  onChange={(e) => inputField.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`budget_items.${index}.remarks`}
                          render={({ field: inputField }) => (
                            <FormItem className="flex-1">
                              <FormLabel className="text-xs">Remarks</FormLabel>
                              <FormControl>
                                <Input placeholder="Hotel, Flight..." {...inputField} value={inputField.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                  {form.formState.errors.budget_items?.root && (
                    <p className="text-sm font-medium text-destructive mt-2">
                      {form.formState.errors.budget_items.root.message}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t pt-4">
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </form>
    </Form>
  );
}


