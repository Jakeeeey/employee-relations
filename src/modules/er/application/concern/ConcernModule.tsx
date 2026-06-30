"use client";

import { useState } from "react";
import { ConcernTable } from "./components/ConcernTable";
import { ConcernForm } from "./components/ConcernForm";
import { useConcern } from "./hooks/useConcern";
import { Concern, ConcernAttachment } from "./type";
import { Button } from "@/components/ui/button";
import {
  Plus, RotateCcw, AlertCircle, FileText, Loader2, X, ArrowRight, Calendar,
  AlertTriangle, Paperclip, Eye, Download, Image as ImageIcon, FileVideo,
  FileAudio, FileSpreadsheet, FileWarning,
} from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

function statusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status.toUpperCase()) {
    case "PENDING": return "secondary";
    case "IN_REVIEW": return "default";
    case "DISMISSED": return "destructive";
    default: return "outline";
  }
}

function statusBadgeClass(status: string): string {
  switch (status.toUpperCase()) {
    case "RESOLVED": return "bg-green-600 text-white dark:bg-green-500 dark:text-white";
    default: return "";
  }
}

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface ConcernModuleProps {
  userId: number;
}

function getAttachmentIcon(fileType: string | null | undefined, fileName: string) {
  const type = (fileType ?? "").toLowerCase();
  const ext = (fileName ?? "").split(".").pop()?.toLowerCase() ?? "";

  if (type.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext)) {
    return { Icon: ImageIcon, tint: "text-violet-600 bg-violet-500/10" };
  }
  if (type.startsWith("video/") || ["mp4", "webm", "mov", "avi", "mkv"].includes(ext)) {
    return { Icon: FileVideo, tint: "text-pink-600 bg-pink-500/10" };
  }
  if (type.startsWith("audio/") || ["mp3", "wav", "ogg", "m4a", "flac"].includes(ext)) {
    return { Icon: FileAudio, tint: "text-amber-600 bg-amber-500/10" };
  }
  if (type.includes("spreadsheet") || type.includes("excel") ||
    ["xlsx", "xls", "csv", "ods"].includes(ext)) {
    return { Icon: FileSpreadsheet, tint: "text-emerald-600 bg-emerald-500/10" };
  }
  if (type === "application/pdf" || ext === "pdf") {
    return { Icon: FileText, tint: "text-red-600 bg-red-500/10" };
  }
  return { Icon: Paperclip, tint: "text-sky-600 bg-sky-500/10" };
}

type PreviewKind = "image" | "video" | "pdf" | "text" | "none";

function previewKind(fileType: string | null | undefined, fileName: string): PreviewKind {
  const type = (fileType ?? "").toLowerCase();
  const ext = (fileName ?? "").split(".").pop()?.toLowerCase() ?? "";

  if (type.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "avif"].includes(ext)) {
    return "image";
  }
  if (type.startsWith("video/") || ["mp4", "webm", "ogv", "mov", "mkv"].includes(ext)) {
    if (type.startsWith("video/") || ["mp4", "webm", "ogv"].includes(ext)) return "video";
  }
  if (type === "application/pdf" || ext === "pdf") {
    return "pdf";
  }
  if (type.startsWith("text/") || type === "application/json" || type === "application/javascript" ||
    type === "application/xml" ||
    ["txt", "md", "markdown", "json", "csv", "log", "html", "htm", "xml", "js", "ts", "tsx", "css", "yml", "yaml"].includes(ext)) {
    return "text";
  }
  return "none";
}

const ITEMS_PER_PAGE = 10;
type StatusFilter = "all" | "PENDING" | "IN_REVIEW" | "RESOLVED" | "DISMISSED";

export default function ConcernModule({ userId }: ConcernModuleProps) {
  const { concerns, isLoading, error, refresh, uploadProgress, submitConcernWithAttachments, fetchAttachments } = useConcern();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingConcern, setViewingConcern] = useState<Concern | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [attachments, setAttachments] = useState<ConcernAttachment[]>([]);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>("");
  const [previewFileType, setPreviewFileType] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setIsDialogOpen(true);
  };

  const handleOpenView = (concern: Concern) => {
    setViewingConcern(concern);
    setIsViewDialogOpen(true);
    setIsLoadingAttachments(true);
    fetchAttachments(concern.id ?? 0)
      .then((data) => setAttachments(data))
      .catch(() => setAttachments([]))
      .finally(() => setIsLoadingAttachments(false));
  };

  const handlePreview = (path: string, fileName: string, fileType?: string | null) => {
    const encoded = encodeURIComponent(path);
    setPreviewUrl(`/api/er/application/concern/file?path=${encoded}`);
    setPreviewTitle(fileName || "Attachment");
    setPreviewFileType(fileType ?? null);
  };

  const handleDownload = async (path: string, fileName: string) => {
    const encoded = encodeURIComponent(path);
    const url = `/api/er/application/concern/file?path=${encoded}&download=1`;
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return;
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("[download] failed", err);
    }
  };

  const onSubmit = async (data: { subject_of_concern: string; concern: string; is_anonymous: boolean }, files: File[]) => {
    await submitConcernWithAttachments(
      {
        user_id: userId,
        subject_of_concern: data.subject_of_concern,
        concern: data.concern,
        is_anonymous: data.is_anonymous,
      },
      files,
    );
    setIsDialogOpen(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
      setCurrentPage(1);
    } catch (err) {
      console.error("Error refreshing concerns:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredConcerns =
    statusFilter === "all"
      ? concerns
      : concerns.filter((c) => c.status?.toUpperCase() === statusFilter);

  const totalPages = Math.ceil(filteredConcerns.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredConcerns.length);
  const paginatedConcerns = filteredConcerns.slice(startIndex, endIndex);

  if (isLoading && concerns.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner />
      </div>
    );
  }

  if (error && concerns.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Employee Concerns</h2>
          <p className="text-muted-foreground">
            File and manage your workplace concerns.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex-1 sm:flex-none h-9 text-sm w-auto justify-center px-3 font-normal border border-slate-200 dark:border-slate-700"
          >
            <RotateCcw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button onClick={handleOpenCreate} className="flex-1 sm:flex-none">
            <Plus className="mr-2 h-4 w-4" />
            New Concern
          </Button>
        </div>
      </div>

      <Card className="border border-slate-200 dark:border-slate-700">
        <CardHeader>
          <div className="flex items-center gap-3 w-full">
            <CardTitle className="shrink-0">All Concerns</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Showing {filteredConcerns.length} record(s)
            </CardDescription>
            <div className="ml-auto">
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val as StatusFilter);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-7 text-xs w-auto min-w-[110px] justify-start pl-2.5 text-left font-normal border border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_REVIEW">In Review</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="DISMISSED">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredConcerns.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No concerns found</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border border-slate-200 dark:border-slate-700 overflow-x-auto">
                <ConcernTable
                  data={paginatedConcerns}
                  onView={handleOpenView}
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
                <div className="text-sm text-muted-foreground order-2 sm:order-1">
                  Page {currentPage} of {totalPages} &bull; Showing {endIndex} of{" "}
                  {filteredConcerns.length} records
                </div>
                <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none border border-slate-200 dark:border-slate-700"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none border border-slate-200 dark:border-slate-700"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg overflow-hidden max-sm:max-h-[85vh] max-sm:overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Concern</DialogTitle>
          </DialogHeader>
          <ConcernForm
            onSubmit={onSubmit}
            isLoading={isLoading}
            uploadProgress={uploadProgress}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-lg p-0 rounded-2xl overflow-hidden max-sm:max-h-[85vh] max-sm:overflow-y-auto">
          {viewingConcern && (
            <>
              <div className="bg-gradient-to-r from-primary/10 via-background to-primary/5 p-5 pb-4 border-b">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-xl shrink-0">
                    <FileText className="h-5 w-5 text-primary stroke-[2.5px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="text-lg font-bold tracking-tight">
                      Concern Details
                    </DialogTitle>
                    <p className="text-xs font-medium opacity-70 mt-0.5">
                      Reference #{viewingConcern.id}
                    </p>
                  </div>
                  <Badge
                    variant={statusBadgeVariant(viewingConcern.status ?? "PENDING")}
                    className={statusBadgeClass(viewingConcern.status ?? "PENDING")}
                  >
                    {formatStatus(viewingConcern.status ?? "PENDING")}
                  </Badge>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="rounded-xl border bg-card p-4 space-y-3 [word-break:break-word]">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-primary/5">
                      <ArrowRight className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Subject of Concern</span>
                  </div>
                  <p className="text-sm font-medium pl-9">
                    {viewingConcern.is_anonymous ? "——— (Anonymous)" : viewingConcern.subject_of_concern}
                  </p>
                </div>

                  <div className="rounded-xl border bg-card p-4 space-y-3 [word-break:break-word]">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-primary/5">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Concern</span>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto pl-9">
                      <p className="text-sm whitespace-pre-wrap">
                        {viewingConcern.concern}
                      </p>
                    </div>
                  </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border bg-card p-4 space-y-3 [word-break:break-word]">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-primary/5">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Filed At</span>
                    </div>
                  <p className="text-sm font-medium pl-9">
                    {viewingConcern.created_at
                        ? format(new Date(viewingConcern.created_at), "PPP")
                        : "-"}
                    </p>
                  </div>

                  <div className="rounded-xl border bg-card p-4 space-y-3 [word-break:break-word]">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-primary/5">
                        <AlertTriangle className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Anonymous</span>
                    </div>
                    <p className="text-sm font-medium pl-9">
                      {viewingConcern.is_anonymous ? "Yes" : "No"}
                    </p>
                  </div>
                </div>

                <Separator className="my-2" />

                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Attachments ({attachments.length})
                    </span>
                  </div>
                  {isLoadingAttachments ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Loading attachments...
                    </div>
                  ) : attachments.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">No attachments.</p>
                  ) : (
                    <div className="max-h-[250px] overflow-y-auto space-y-1.5 pr-1">
                      {attachments.map((att) => {
                        const { Icon, tint } = getAttachmentIcon(att.file_type, att.file_name);
                        return (
                          <div
                            key={att.id}
                            className="flex items-center gap-3 p-3 bg-muted/20 border rounded-lg min-w-0 w-full"
                          >
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tint}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium [word-break:break-word] flex-1 max-w-[260px]">
                              {att.file_name}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="Preview"
                              onClick={() => handlePreview(att.file_path, att.file_name, att.file_type)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="Download"
                              onClick={() => handleDownload(att.file_path, att.file_name)}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-5 pb-5 pt-0 flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsViewDialogOpen(false)}
                  className="flex-1 h-10 rounded-xl font-medium text-muted-foreground hover:bg-muted"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewUrl} onOpenChange={(open) => { if (!open) { setPreviewUrl(null); setPreviewFileType(null); } }}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-[900px] overflow-hidden p-0 rounded-2xl border-2 shadow-2xl max-sm:max-h-[85vh] max-sm:overflow-y-auto"
        >
          {previewUrl && (() => {
            const kind = previewKind(previewFileType, previewTitle);
            const { Icon, tint } = getAttachmentIcon(previewFileType, previewTitle);

            return (
              <>
                <div className="bg-gradient-to-r from-primary/10 via-background to-primary/5 p-5 pb-3">
                  <DialogHeader>
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl shrink-0 ${tint}`}>
                        <Icon className="h-5 w-5 stroke-[2.5px]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <DialogTitle className="text-lg font-bold tracking-tight line-clamp-1 [word-break:break-word]">
                          {previewTitle}
                        </DialogTitle>
                        <p className="text-xs font-medium opacity-70">
                          {kind === "pdf" ? "PDF Document" :
                           kind === "image" ? "Image" :
                           kind === "video" ? "Video" :
                           kind === "text" ? "Text File" : "File Preview"}
                        </p>
                      </div>
                    </div>
                  </DialogHeader>
                </div>

                <Separator className="bg-primary/10" />

                <div className="p-5">
                  <div className="rounded-xl border bg-muted/20 overflow-hidden">
                    {kind === "pdf" && (
                      <div className="h-[60vh] overflow-auto bg-zinc-100">
                        <iframe src={previewUrl} title={previewTitle} className="w-full h-full border-0" />
                      </div>
                    )}
                    {kind === "image" && (
                      <div className="flex items-center justify-center bg-zinc-950/5 p-4 max-h-[60vh]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={previewUrl} alt={previewTitle} className="max-w-full max-h-[56vh] object-contain rounded-lg shadow-sm" />
                      </div>
                    )}
                    {kind === "video" && (
                      <div className="flex items-center justify-center bg-black p-4 max-h-[60vh]">
                        <video src={previewUrl} controls className="max-w-full max-h-[56vh] rounded-lg">
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}
                    {kind === "text" && <TextPreview url={previewUrl} />}
                    {kind === "none" && <PreviewUnavailable />}
                  </div>
                </div>

                <div className="px-5 pb-5 pt-0 flex flex-col sm:flex-row gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => { setPreviewUrl(null); setPreviewFileType(null); }}
                    className="flex-1 h-11 rounded-xl font-bold text-muted-foreground hover:bg-muted"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Close
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TextPreview({ url }: { url: string }) {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textError, setTextError] = useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load preview");
        const text = await res.text();
        if (!cancelled) { setTextContent(text); setTextError(null); }
      })
      .catch((err: Error) => {
        if (!cancelled) { setTextError(err.message); setTextContent(null); }
      });
    return () => { cancelled = true; };
  }, [url]);

  return (
    <div className="h-[60vh] overflow-auto">
      {textError ? (
        <PreviewUnavailable message={textError} />
      ) : textContent === null ? (
        <div className="flex items-center justify-center h-full gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading preview...
        </div>
      ) : (
        <pre className="text-xs font-mono whitespace-pre-wrap [word-break:break-word] p-4 text-foreground/90 select-none pointer-events-none">
          {textContent}
        </pre>
      )}
    </div>
  );
}

function PreviewUnavailable({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-6">
      <div className="p-3 rounded-full bg-amber-500/10">
        <FileWarning className="h-6 w-6 text-amber-600" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">No preview available</p>
        <p className="text-xs text-muted-foreground/70 max-w-sm">
          {message || "This file type cannot be previewed in the browser."}
        </p>
      </div>
    </div>
  );
}
