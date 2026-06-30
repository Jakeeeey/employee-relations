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
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState, useRef } from "react";
import { Paperclip, Upload, X, FileText } from "lucide-react";

const OTHER_VALUE = "__other__";

const SUBJECT_OPTIONS = [
  { value: "Harassment or Discrimination", label: "Harassment or Discrimination" },
  { value: "Workplace Conflict", label: "Workplace Conflict" },
  { value: "Policy Violation", label: "Policy Violation" },
  { value: "Salary or Benefits", label: "Salary or Benefits" },
  { value: "Workload or Scheduling", label: "Workload or Scheduling" },
  { value: "Health or Safety", label: "Health or Safety" },
  { value: "Ethics or Misconduct", label: "Ethics or Misconduct" },
  { value: "Supervisor Relations", label: "Supervisor Relations" },
  { value: "Co-worker Relations", label: "Co-worker Relations" },
  { value: OTHER_VALUE, label: "Other" },
];

const FormSchema = z.object({
  subject_of_concern: z.string().min(1, "Subject is required"),
  concern: z.string().min(1, "Concern description is required"),
  is_anonymous: z.boolean(),
});
type FormValues = z.infer<typeof FormSchema>;

interface ConcernFormProps {
  initialData?: Concern;
  onSubmit: (data: { subject_of_concern: string; concern: string; is_anonymous: boolean }, files: File[]) => void;
  isLoading?: boolean;
  uploadProgress?: { uploading: boolean; uploadCount: number; totalCount: number } | null;
}

export function ConcernForm({ initialData, onSubmit, isLoading, uploadProgress }: ConcernFormProps) {
  const initialSubject = initialData?.subject_of_concern ?? "";
  const isInitialOther =
    initialSubject !== "" && !SUBJECT_OPTIONS.some((o) => o.value === initialSubject);

  const [isOther, setIsOther] = useState(isInitialOther);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = (values: FormValues) => {
    onSubmit(values, selectedFiles);
  };

  const isUploading = uploadProgress?.uploading ?? false;
  const uploadCount = uploadProgress?.uploadCount ?? 0;
  const totalCount = uploadProgress?.totalCount ?? 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="subject_of_concern"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject of Concern</FormLabel>
              <SearchableSelect
                options={SUBJECT_OPTIONS}
                value={isOther ? OTHER_VALUE : field.value || ""}
                onValueChange={handleSelectChange}
                placeholder="Select subject"
              />
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

        <div className="space-y-2">
          <Label className="text-xs font-medium flex items-center gap-1.5">
            <Paperclip className="h-3 w-3" />
            Attachments <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <div
            className="flex items-center gap-3 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground">
              Click to attach files (PDF, images, documents)
            </span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          {selectedFiles.length > 0 && (
            <div className="max-h-[200px] overflow-y-auto space-y-1.5 mt-2 pr-1">
              {selectedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 border min-w-0 w-full"
                >
                  <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-xs font-medium truncate flex-1">{file.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{formatFileSize(file.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="p-0.5 rounded-full hover:bg-muted transition-colors shrink-0"
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading || isUploading}>
          {isUploading
            ? `Uploading files (${uploadCount}/${totalCount})...`
            : isLoading
            ? "Submitting..."
            : selectedFiles.length > 0
            ? `Submit Concern (${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""})`
            : "Submit Concern"}
        </Button>
      </form>
    </Form>
  );
}
