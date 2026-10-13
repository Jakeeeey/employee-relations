/* eslint-disable @typescript-eslint/no-explicit-any */
 
"use client";

import { useRef, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Plus,
  Trash2,
  MapPin,
  FileText,
  Send,
  Wallet,
  ReceiptText,
  Banknote,
  Paperclip,
  Upload,
  X,
  Eye,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

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

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function TravelRequestForm({ onSubmit, isLoading, coas }: TravelRequestFormProps) {
  const [uploadedFile, setUploadedFile] = useState<{
    id: string;
    name: string;
    size: number;
    type: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isAttachmentRequired, setIsAttachmentRequired] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<TravelRequestFormInput>({
    resolver: zodResolver(TravelRequestFormInputSchema),
    mode: "onChange",
    defaultValues: {
      travel_from: "",
      travel_to: "",
      destination: "",
      purpose: "",
      requires_budget: false,
      attachment_uuid: null,
      remarks: "",
      budget_items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: "budget_items",
    control: form.control,
  });

  const travelFrom = useWatch({
    control: form.control,
    name: "travel_from",
  });

  const requiresBudget = useWatch({
    control: form.control,
    name: "requires_budget",
  });

  const watchedBudgetItems = useWatch({
    control: form.control,
    name: "budget_items",
  }) || [];

  const totalBudget = (watchedBudgetItems || []).reduce((acc, curr) => {
    const amt = Number(curr?.amount) || 0;
    return acc + amt;
  }, 0);

  const handleFileUpload = async (file: File) => {
    const validExtensions = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(ext)) {
      setUploadError("Invalid file type. Only PDF, JPG, PNG, and WEBP formats are allowed.");
      toast.error("Invalid File Type", { description: "Please upload a PDF or image file." });
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError("File size exceeds 15MB limit.");
      toast.error("File Too Large", { description: "Maximum allowed file size is 15MB." });
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/er/travel-request/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || "Failed to upload file");
      }

      const json = await res.json();
      const fileId = json.file_id;

      setUploadedFile({
        id: fileId,
        name: json.filename_download || file.name,
        size: json.filesize || file.size,
        type: json.type || file.type,
      });

      form.setValue("attachment_uuid", fileId, { shouldValidate: true });
      toast.success("Document Uploaded", {
        description: `${file.name} attached successfully to travel order.`,
      });
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload file");
      toast.error("Upload Failed", { description: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFormSubmit = (data: TravelRequestFormInput) => {
    if (data.travel_from && data.travel_to && new Date(data.travel_from) > new Date(data.travel_to)) {
      form.setError("travel_to", {
        type: "manual",
        message: "End date cannot be before the start date",
      });
      toast.error("Invalid Dates", {
        description: "The travel end date cannot be before the start date.",
      });
      return;
    }

    if (isAttachmentRequired && !data.attachment_uuid) {
      setUploadError("Official Communication Letter or Memo is required before submitting.");
      toast.error("Document Required", {
        description: "Please attach an official communication letter or memo as supporting document.",
      });
      return;
    }
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8 py-4">
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
                        <Input
                          type="date"
                          className="bg-background/50 focus:bg-background transition-colors"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            const newFrom = e.target.value;
                            const currentTo = form.getValues("travel_to");
                            if (currentTo && newFrom && currentTo < newFrom) {
                              form.setValue("travel_to", newFrom, { shouldValidate: true });
                            } else {
                              form.trigger("travel_to");
                            }
                          }}
                        />
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
                        <Input
                          type="date"
                          min={travelFrom || undefined}
                          className="bg-background/50 focus:bg-background transition-colors"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            form.trigger("travel_to");
                          }}
                        />
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

              {/* Supporting Document: Communication Letter / Memo */}
              <div className="rounded-xl border border-border/70 bg-card p-5 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/40">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-primary" />
                      Official Communication Letter / Memo
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Attach official letter, memorandum, or invitation as supporting document.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isAttachmentRequired ? "default" : "secondary"} className="text-[10px] font-mono uppercase">
                      {isAttachmentRequired ? "Required" : "Optional"}
                    </Badge>
                  </div>
                </div>

                {/* Validation setting toggle */}
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Checkbox
                    id="require-memo"
                    checked={isAttachmentRequired}
                    onCheckedChange={(checked) => {
                      setIsAttachmentRequired(Boolean(checked));
                      if (!checked) setUploadError(null);
                    }}
                  />
                  <label htmlFor="require-memo" className="cursor-pointer font-medium text-foreground">
                    Enforce memo attachment requirement for this request
                  </label>
                </div>

                {/* Hidden native input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />

                {uploadedFile ? (
                  /* Uploaded Document Card */
                  <div className="flex items-center justify-between p-3.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-md bg-emerald-500/10 text-emerald-600 shrink-0">
                        {uploadedFile.type.includes("pdf") ? (
                          <FileText className="w-5 h-5" />
                        ) : (
                          <ImageIcon className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-semibold text-foreground truncate" title={uploadedFile.name}>
                          {uploadedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(uploadedFile.size)} • <span className="text-emerald-600 font-medium">Ready to submit</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs text-primary hover:bg-primary/10"
                        onClick={() => window.open(`/api/er/travel-request/file?path=${uploadedFile.id}`, "_blank")}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> Preview
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setUploadedFile(null);
                          form.setValue("attachment_uuid", null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      >
                        <X className="w-3.5 h-3.5 mr-1" /> Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Dropzone / Upload area */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all text-center",
                      uploadError
                        ? "border-destructive/60 bg-destructive/5 hover:border-destructive"
                        : "border-border/80 hover:border-primary/50 hover:bg-muted/20"
                    )}
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2 py-2">
                        <Loader2 className="w-7 h-7 text-primary animate-spin" />
                        <p className="text-xs font-semibold text-foreground">Uploading communication letter...</p>
                        <p className="text-[11px] text-muted-foreground">Please wait while the document is being processed.</p>
                      </div>
                    ) : (
                      <>
                        <div className="p-3 rounded-full bg-primary/10 text-primary mb-2">
                          <Upload className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-semibold text-foreground">
                          Click to upload or drag & drop official memo / letter
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          PDF, JPG, PNG or WEBP (Max 15MB)
                        </p>
                      </>
                    )}
                  </div>
                )}

                {uploadError && (
                  <p className="text-xs font-medium text-destructive flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {uploadError}
                  </p>
                )}
              </div>
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
                    <div className="p-6 space-y-4">
                      {fields.map((field, index) => {
                        const currentCoaId = form.watch(`budget_items.${index}.coa_id`);
                        const selectedCoa = coas?.find((c) => c.coa_id === currentCoaId);

                        return (
                          <div
                            key={field.id}
                            className="p-4 rounded-xl border border-border/80 bg-background/80 shadow-2xs space-y-3.5 hover:border-primary/40 transition-colors"
                          >
                            <div className="flex items-center justify-between pb-2 border-b border-border/40">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[11px] font-mono uppercase bg-muted/60">
                                  Item {index + 1}
                                </Badge>
                                {selectedCoa && (
                                  <span className="text-xs text-muted-foreground truncate max-w-[260px] sm:max-w-md">
                                    <span className="font-semibold text-foreground/80">{selectedCoa.gl_code}</span> &bull; {selectedCoa.account_title}
                                  </span>
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors rounded-full"
                                onClick={() => remove(index)}
                                disabled={fields.length === 1}
                                title={fields.length === 1 ? "At least one item is required" : "Remove item"}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>

                            {/* Expense Category (Full width to comfortably accommodate long GL accounts) */}
                            <FormField
                              control={form.control}
                              name={`budget_items.${index}.coa_id`}
                              render={({ field: selectField }) => (
                                <FormItem className="w-full space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <FormLabel className="text-xs font-semibold text-muted-foreground">
                                      Expense Category
                                    </FormLabel>
                                    <span className="text-[10px] text-muted-foreground">
                                      Chart of Accounts (COA)
                                    </span>
                                  </div>
                                  <Select
                                    onValueChange={(value) => selectField.onChange(Number(value))}
                                    value={selectField.value?.toString() || ""}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="w-full bg-background h-10 px-3 text-left [&>span]:truncate [&>span]:block [&>span]:text-left [&>span]:flex-1 [&>span]:min-w-0 overflow-hidden">
                                        <SelectValue placeholder="Select an expense category..." />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="max-h-72">
                                      {coas?.map((coa) => (
                                        <SelectItem key={coa.coa_id} value={coa.coa_id.toString()} className="py-2.5">
                                          <div className="flex items-center gap-2 text-left">
                                            <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                                              {coa.gl_code}
                                            </Badge>
                                            <span className="text-xs font-medium text-foreground truncate max-w-[340px]">
                                              {coa.account_title}
                                            </span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Amount & Item Details side-by-side */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start pt-1">
                              <FormField
                                control={form.control}
                                name={`budget_items.${index}.amount`}
                                render={({ field: inputField }) => (
                                  <FormItem className="sm:col-span-5 space-y-1.5">
                                    <FormLabel className="text-xs font-semibold text-muted-foreground">
                                      Estimated Amount
                                    </FormLabel>
                                    <FormControl>
                                      <div className="relative flex items-center">
                                        <span className="absolute left-3 text-muted-foreground text-sm font-semibold pointer-events-none">₱</span>
                                        <Input
                                          className="pl-7 pr-3 bg-background h-10 font-semibold text-emerald-600 dark:text-emerald-400 text-sm"
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          placeholder="0.00"
                                          {...inputField}
                                          value={inputField.value === 0 && !inputField.value?.toString().includes(".") ? "" : inputField.value ?? ""}
                                          onFocus={(e) => e.target.select()}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            inputField.onChange(val === "" ? 0 : parseFloat(val) || 0);
                                          }}
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
                                  <FormItem className="sm:col-span-7 space-y-1.5">
                                    <FormLabel className="text-xs font-semibold text-muted-foreground">
                                      Item Details / Remarks
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        className="bg-background h-10 text-xs"
                                        placeholder="e.g. Flight ticket, lodging, fuel, per diem..."
                                        {...inputField}
                                        value={inputField.value || ""}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Running Total & Summary Footer */}
                  {fields.length > 0 && (
                    <div className="p-4 bg-muted/40 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                          Total Requested Budget
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {fields.length} {fields.length === 1 ? "expense item" : "expense items"} planned
                        </span>
                      </div>
                      <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        {new Intl.NumberFormat("en-PH", {
                          style: "currency",
                          currency: "PHP",
                        }).format(totalBudget)}
                      </div>
                    </div>
                  )}

                  {form.formState.errors.budget_items?.root && (
                    <p className="text-sm font-medium text-destructive p-4 pt-0 flex items-center gap-1.5">
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
