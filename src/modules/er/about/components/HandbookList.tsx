import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CompanyHandbook } from "../types";
import { FileText, Download } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export function HandbookList({ handbooks }: { handbooks: CompanyHandbook[] }) {
  if (handbooks.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-40 text-muted-foreground">
          <FileText className="h-10 w-10 mb-2 opacity-20" />
          <p>No handbooks available at this time.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {handbooks.map((handbook) => (
        <Card key={handbook.id} className="overflow-hidden">
          <CardHeader className="bg-muted/40 pb-4">
            <CardTitle>{handbook.title}</CardTitle>
            {handbook.updated_at && (
              <CardDescription>
                Last updated: {formatDateTime(new Date(handbook.updated_at))}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="pt-4">
            {handbook.description && (
              <p className="text-sm text-muted-foreground mb-6 whitespace-pre-wrap">
                {handbook.description}
              </p>
            )}

            {handbook.attachments && handbook.attachments.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Attachments</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {handbook.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 border rounded-md bg-card"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="h-5 w-5 text-primary shrink-0" />
                        <span className="text-sm truncate" title={attachment.file_name}>
                          {attachment.file_name}
                        </span>
                      </div>
                      <Button variant="ghost" size="icon" asChild>
                        <a
                          href={attachment.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={attachment.file_name}
                        >
                          <Download className="h-4 w-4" />
                          <span className="sr-only">Download {attachment.file_name}</span>
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
  );
}
