"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Company } from "../types";
import {
  FileText,
  MapPin,
  Phone,
  Globe,
  Mail,
  Calendar,
  Building,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Compass,
  Hash,
  Share2,
  Layers,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface CopyableFieldProps {
  label: string;
  value?: string | null;
  icon?: React.ElementType;
  copyable?: boolean;
}

function CopyableField({ label, value, icon: Icon, copyable = false }: CopyableFieldProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`Copied ${label} to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-border/50 bg-background/50 p-3.5 transition-all duration-200 hover:border-primary/40 hover:bg-muted/30">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {copyable && value && (
          <button
            type="button"
            onClick={handleCopy}
            title={`Copy ${label}`}
            className="opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-foreground focus:opacity-100"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>
      <div className="mt-1 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
        <span className="text-sm font-medium text-foreground truncate">
          {value || <span className="text-muted-foreground/60 italic font-normal">Not Provided</span>}
        </span>
      </div>
    </div>
  );
}

export function CompanyProfile({ company }: { company: Company }) {
  const getImageUrl = (logoUrl: string) => {
    if (logoUrl.startsWith("http") || logoUrl.startsWith("data:")) {
      return logoUrl;
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "";
    return `${baseUrl}/assets/${logoUrl}`;
  };

  const fullAddress = [
    company.company_address,
    company.company_brgy,
    company.company_city,
    company.company_province,
    company.company_zipCode,
  ]
    .filter(Boolean)
    .join(", ");

  const mapsQuery = fullAddress ? encodeURIComponent(fullAddress) : "";

  return (
    <div className="space-y-6">
      {/* Executive Hero Banner Card */}
      <Card className="relative overflow-hidden border-border/60 bg-gradient-to-r from-card via-card to-primary/5 shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
            <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-2xl border-2 border-border/80 p-3 flex items-center justify-center bg-card shadow-sm shrink-0 overflow-hidden group">
              {company.company_logo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={getImageUrl(company.company_logo)}
                  alt={company.company_name || "Company Logo"}
                  className="h-full w-full object-contain transition-transform group-hover:scale-105"
                />
              ) : (
                <Building className="h-12 w-12 text-muted-foreground/40" />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-primary/30 text-primary font-mono text-[10px] uppercase font-bold tracking-wider">
                  <ShieldCheck className="w-3 h-3 mr-1 text-primary" /> Verified Entity
                </Badge>
                {company.company_type && (
                  <Badge variant="secondary" className="font-mono text-[10px] uppercase">
                    {company.company_type}
                  </Badge>
                )}
                {company.company_department && (
                  <Badge variant="secondary" className="font-mono text-[10px] uppercase bg-muted/60">
                    Dept: {company.company_department}
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {company.company_name || "Enterprise Profile"}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-mono">
                <span className="inline-flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-md border border-border/40">
                  <Hash className="w-3 h-3 text-primary" />
                  {company.company_code || "CODE-N/A"}
                </span>
                {company.company_dateAdmitted && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Est. {formatDateTime(new Date(company.company_dateAdmitted)).split(",")[0]}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Links */}
          <div className="flex flex-wrap md:flex-col items-stretch gap-2 w-full sm:w-auto shrink-0">
            {company.company_website && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 font-medium border-border/80 shadow-xs"
                asChild
              >
                <a
                  href={company.company_website.startsWith("http") ? company.company_website : `https://${company.company_website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Globe className="h-4 w-4 text-primary" />
                  Visit Portal
                  <ExternalLink className="h-3 w-3 ml-0.5 opacity-60" />
                </a>
              </Button>
            )}

            {company.company_email && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 font-medium border-border/80 shadow-xs"
                asChild
              >
                <a href={`mailto:${company.company_email}`}>
                  <Mail className="h-4 w-4 text-primary" />
                  Email Office
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bento Grid Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Mission & Strategic Vision (8 Cols) */}
        <Card className="lg:col-span-8 border-border/60 shadow-xs">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Compass className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Organizational Charter & Vision</CardTitle>
                <CardDescription className="text-xs">Guiding principles and operational directives</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-primary">
                <Sparkles className="w-3.5 h-3.5" /> Corporate Mission
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed text-foreground/90 font-medium italic">
                &ldquo;{company.company_mission || "To deliver exceptional institutional excellence, reliable service delivery, and digital governance across all operations."}&rdquo;
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-primary">
                <Layers className="w-3.5 h-3.5" /> Corporate Vision
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm leading-relaxed text-foreground/90 font-medium italic">
                &ldquo;{company.company_vision || "To stand as the leading benchmark for reliable, automated, and citizen-first administrative enterprise systems."}&rdquo;
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Official Registration & Compliance (4 Cols) */}
        <Card className="lg:col-span-4 border-border/60 shadow-xs flex flex-col">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Legal & Compliance</CardTitle>
                <CardDescription className="text-xs">Statutory and registration identifiers</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-3 flex-1 flex flex-col justify-between">
            <CopyableField
              label="Registration Number"
              value={company.company_registrationNumber}
              icon={FileText}
              copyable
            />
            <CopyableField
              label="Tax Identification Number (TIN)"
              value={company.company_tin}
              icon={Hash}
              copyable
            />
            <CopyableField
              label="Date Admitted"
              value={
                company.company_dateAdmitted
                  ? formatDateTime(new Date(company.company_dateAdmitted)).split(",")[0]
                  : null
              }
              icon={Calendar}
            />
          </CardContent>
        </Card>

        {/* Address & Physical Location (6 Cols) */}
        <Card className="lg:col-span-6 border-border/60 shadow-xs">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Headquarters & Location</CardTitle>
                  <CardDescription className="text-xs">Physical facilities and mailing address</CardDescription>
                </div>
              </div>
              {mapsQuery && (
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs font-mono text-primary" asChild>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`} target="_blank" rel="noopener noreferrer">
                    <MapPin className="h-3 w-3" />
                    Maps <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <CopyableField
                label="Street Address"
                value={company.company_address}
                icon={MapPin}
                copyable
              />
            </div>
            <CopyableField label="Barangay" value={company.company_brgy} />
            <CopyableField label="City / Municipality" value={company.company_city} />
            <CopyableField label="Province" value={company.company_province} />
            <CopyableField label="ZIP Code" value={company.company_zipCode} copyable />
          </CardContent>
        </Card>

        {/* Communication & Channels (6 Cols) */}
        <Card className="lg:col-span-6 border-border/60 shadow-xs">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Contact & Communications</CardTitle>
                <CardDescription className="text-xs">Direct organizational inboxes and phones</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <CopyableField
                label="Direct Line / Mobile"
                value={company.company_contact}
                icon={Phone}
                copyable
              />
            </div>
            <CopyableField
              label="Primary Business Email"
              value={company.company_email}
              icon={Mail}
              copyable
            />
            <CopyableField
              label="Outlook Email"
              value={company.company_outlook}
              icon={Mail}
              copyable
            />
            <CopyableField
              label="Gmail Inbox"
              value={company.company_gmail}
              icon={Mail}
              copyable
            />
            <CopyableField
              label="Social (Facebook)"
              value={company.company_facebook}
              icon={Share2}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
