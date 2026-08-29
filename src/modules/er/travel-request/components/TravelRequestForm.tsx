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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Trash2, MapPin, FileText, Send, Wallet, ReceiptText, Banknote } from "lucide-react";

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-4">
        <div className={cn("grid gap-8 items-start transition-all duration-300", requiresBudget ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1")}>
          
          {/* LEFT COLUMN: Main Details */}
          <div className={cn("space-y-6", requiresBudget ? "lg:col-span-5" : "w-full max-w-3xl mx-auto")}>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold tracking-tight">Travel Details</h3>
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9 bg-background/50 focus:bg-background transition-colors" placeholder="e.g. Tokyo, Japan" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="travel_from"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" className="bg-background/50 focus:bg-background transition-colors" {...field} />
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
                        <Input type="date" className="bg-background/50 focus:bg-background transition-colors" {...field} />
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
                      <Textarea 
                        className="resize-none bg-background/50 focus:bg-background transition-colors min-h-[100px]" 
                        placeholder="Please describe the main purpose of this travel..." 
                        {...field} 
                      />
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
                    <FormLabel>Remarks <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
                    <FormControl>
                      <div className="relative">
                        <FileText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9 bg-background/50 focus:bg-background transition-colors" placeholder="Any additional notes" {...field} value={field.value || ""} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="requires_budget"
              render={({ field }) => (
                <FormItem className={cn(
                  "flex flex-row items-start space-x-4 space-y-0 rounded-xl border p-5 transition-all duration-300",
                  field.value 
                    ? "bg-primary/5 border-primary/30 shadow-sm" 
                    : "bg-muted/30 hover:bg-muted/50 border-border/50"
                )}>
                  <FormControl>
                    <Checkbox
                      className="mt-1"
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (!checked) {
                          remove();
                        } else if (fields.length === 0) {
                          append({ amount: 0, remarks: "", coa_id: undefined as any });
                        }
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1.5 flex-1 cursor-pointer" onClick={() => {
                    const newValue = !field.value;
                    field.onChange(newValue);
                    if (!newValue) {
                      remove();
                    } else if (fields.length === 0) {
                      append({ amount: 0, remarks: "", coa_id: undefined as any });
                    }
                  }}>
                    <FormLabel className="text-base font-semibold cursor-pointer flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-primary" />
                      Request Budget Allocation
                    </FormLabel>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Check this option if you need to request a cash advance or budget allocation for this trip.
                    </p>
                  </div>
                </FormItem>
              )}
            />
          </div>

          {/* RIGHT COLUMN: Budget Allocation */}
          {requiresBudget && (
            <div className="lg:col-span-7 space-y-6 h-full animate-in fade-in slide-in-from-right-4 duration-500">
              <Card className="h-full border-border/50 shadow-md bg-card overflow-hidden flex flex-col">
                <CardHeader className="border-b bg-muted/10 px-6 py-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Banknote className="h-5 w-5 text-emerald-600" />
                        Budget Items
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Break down your estimated expenses for this trip.
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full px-4 border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors"
                      onClick={() => append({ amount: 0, remarks: "", coa_id: undefined as any })}
                    >
                      <Plus className="mr-1.5 h-4 w-4" />
                      Add Item
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 bg-slate-50/30 dark:bg-slate-900/10">
                  {fields.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center border-b border-border/50 bg-background/50">
                      <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                        <ReceiptText className="h-6 w-6 text-muted-foreground/60" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">No budget items added.</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-[250px]">Click &quot;Add Item&quot; to start breaking down your expenses.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {fields.map((field, index) => (
                        <div key={field.id} className="group relative p-6 bg-background transition-all hover:bg-muted/10">
                          
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md">
                              Item {index + 1}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground opacity-50 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all rounded-full"
                              onClick={() => remove(index)}
                              disabled={fields.length === 1}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                            <FormField
                              control={form.control}
                              name={`budget_items.${index}.coa_id`}
                              render={({ field: selectField }) => (
                                <FormItem className="md:col-span-5">
                                  <FormLabel className="text-xs font-semibold text-muted-foreground">Expense Category</FormLabel>
                                  <Select
                                    onValueChange={(value) => selectField.onChange(Number(value))}
                                    value={selectField.value?.toString() || ""}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="w-full bg-background/50 h-9">
                                        <SelectValue placeholder="Select category" />
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

                            <FormField
                              control={form.control}
                              name={`budget_items.${index}.amount`}
                              render={({ field: inputField }) => (
                                <FormItem className="md:col-span-3">
                                  <FormLabel className="text-xs font-semibold text-muted-foreground">Amount</FormLabel>
                                  <FormControl>
                                    <div className="relative flex items-center">
                                      <span className="absolute left-2.5 text-muted-foreground text-[13px] font-medium pointer-events-none">₱</span>
                                      <Input 
                                        className="pl-7 pr-3 bg-background/50 h-9 font-medium"
                                        type="number" 
                                        step="0.01" 
                                        placeholder="0.00" 
                                        {...inputField} 
                                        onChange={(e) => inputField.onChange(parseFloat(e.target.value))}
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`budget_items.${index}.remarks`}
                              render={({ field: inputField }) => (
                                <FormItem className="md:col-span-4">
                                  <FormLabel className="text-xs font-semibold text-muted-foreground">Item Details</FormLabel>
                                  <FormControl>
                                    <Input className="bg-background/50 h-9" placeholder="e.g. Flight, Hotel..." {...inputField} value={inputField.value || ""} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {form.formState.errors.budget_items?.root && (
                    <p className="text-sm font-medium text-destructive mt-2 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-destructive inline-block"></span>
                      {form.formState.errors.budget_items.root.message}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end border-t border-border/50 pt-6 mt-8">
          <Button type="submit" disabled={isLoading} size="lg" className="w-full sm:w-auto min-w-[200px] shadow-md rounded-full font-medium">
            {isLoading ? (
              "Submitting Request..."
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Request
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
