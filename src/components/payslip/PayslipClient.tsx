"use client";

import { useState } from "react";
import { LockKeyhole, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordPromptDialog } from "@/components/payslip/PasswordPromptDialog";
import { buildPayslipsPdf } from "@/utils/payslipPdf";
import { toast } from "sonner";

export function PayslipClient() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfDataUri, setPdfDataUri] = useState<string | null>(null);

  const handleVerifyPassword = async (password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/er/payslip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Failed to verify password");
        return;
      }

      if (result.ok && result.data) {
        toast.success("Password verified. Generating Payslip...");
        const { employee, run, company } = result.data;
        const pdfUri = buildPayslipsPdf({ employee, run, company });
        setPdfDataUri(pdfUri);
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error("Payslip verification error", error);
      toast.error("An error occurred while verifying the password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!pdfDataUri) return;
    const link = document.createElement("a");
    link.href = pdfDataUri;
    link.download = `Payslip_Current.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container max-w-4xl py-8 mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Payslip</h1>
        <p className="text-muted-foreground mt-2">
          View and download your most recent payslip securely.
        </p>
      </div>

      {!pdfDataUri ? (
        <Card className="max-w-md mx-auto mt-12 text-center py-6">
          <CardHeader>
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
              <LockKeyhole className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Payslip Locked</CardTitle>
            <CardDescription>
              Your payslip contains highly sensitive information.
              Please authenticate to view it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" onClick={() => setIsDialogOpen(true)} className="w-full">
              <LockKeyhole className="mr-2 h-4 w-4" />
              Unlock Payslip
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-8">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b">
            <div>
              <CardTitle className="text-xl flex items-center">
                <FileText className="mr-2 h-5 w-5 text-primary" />
                Latest Payslip Generated
              </CardTitle>
              <CardDescription className="mt-1">
                Your payslip has been successfully unlocked.
              </CardDescription>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleDownload} variant="default">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="w-full h-[800px] border rounded-md overflow-hidden bg-muted">
              <iframe 
                src={pdfDataUri} 
                className="w-full h-full" 
                title="Payslip PDF Preview"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <PasswordPromptDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleVerifyPassword}
        isLoading={isLoading}
      />
    </div>
  );
}
