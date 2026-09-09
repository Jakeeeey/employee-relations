"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CompanyHandbook } from "../types";
import {
  FolderOpen,
  Clock,
  Search,
  BookOpen,
  FileCheck2,
  Paperclip,
  ArrowDownToLine,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export function HandbookList({ handbooks }: { handbooks: CompanyHandbook[] }) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredHandbooks = React.useMemo(() => {
    if (!searchTerm.trim()) return handbooks;
    const q = searchTerm.toLowerCase();
    return handbooks.filter(
      (hb) =>
        hb.title.toLowerCase().includes(q) ||
        hb.description?.toLowerCase().includes(q) ||
        hb.attachments?.some((att) => att.file_name.toLowerCase().includes(q))
    );
  }, [handbooks, searchTerm]);

  if (handbooks.length === 0) {
    return (
      <Card className="border-dashed border-border/80 bg-muted/20">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-muted/60 border border-border/60 flex items-center justify-center">
            <FolderOpen className="h-7 w-7 text-muted-foreground/60" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">No Handbooks Indexed</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              There are currently no company handbooks, standard operating procedures, or policy manuals uploaded for this organization.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Summary Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search handbooks, procedures, or files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-card border-border/60"
          />
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs px-3 py-1 bg-card border-border/60 text-muted-foreground">
            Showing <strong className="text-foreground mx-1">{filteredHandbooks.length}</strong> of {handbooks.length} documents
          </Badge>
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm("")}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {filteredHandbooks.length === 0 ? (
        <div className="p-8 text-center border rounded-2xl bg-card border-dashed border-border/60">
          <p className="text-sm text-muted-foreground">
            No handbooks matched your search query &ldquo;<strong className="text-foreground">{searchTerm}</strong>&rdquo;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredHandbooks.map((handbook) => (
            <Card
              key={handbook.id}
              className="group overflow-hidden border-border/60 hover:border-primary/50 hover:shadow-md transition-all duration-300 bg-card flex flex-col h-full rounded-2xl"
            >
              <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-base sm:text-lg font-bold truncate group-hover:text-primary transition-colors">
                        {handbook.title}
                      </CardTitle>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-mono">
                      <span>DOC-#{handbook.id}</span>
                      {handbook.updated_at && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(new Date(handbook.updated_at)).split(",")[0]}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-wider shrink-0">
                    Policy
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-4">
                {handbook.description ? (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {handbook.description}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground/60 italic">
                    No detailed description provided for this manual.
                  </p>
                )}

                {/* Attachments Section */}
                {handbook.attachments && handbook.attachments.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Paperclip className="h-3.5 w-3.5 text-primary" />
                        Resources ({handbook.attachments.length})
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      {handbook.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="group/item flex items-center justify-between p-3 border border-border/60 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-center gap-3 overflow-hidden min-w-0">
                            <div className="p-2 rounded-lg bg-background border border-border/60 text-primary shrink-0">
                              <FileCheck2 className="h-4 w-4" />
                            </div>
                            <span
                              className="text-xs sm:text-sm font-medium truncate text-foreground/90 group-hover/item:text-foreground transition-colors"
                              title={attachment.file_name}
                            >
                              {attachment.file_name}
                            </span>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-xs font-medium border-border/70 hover:border-primary/50 shrink-0 ml-2"
                            asChild
                          >
                            <a
                              href={attachment.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={attachment.file_name}
                            >
                              <ArrowDownToLine className="h-3.5 w-3.5 text-primary" />
                              <span className="hidden sm:inline">Download</span>
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
