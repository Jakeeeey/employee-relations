"use client";

import * as React from "react";
import { useCompany, useHandbooks } from "@/modules/er/about/hooks/useAbout";
import { CompanyProfile } from "@/modules/er/about/components/CompanyProfile";
import { HandbookList } from "@/modules/er/about/components/HandbookList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, BookOpen, ShieldCheck, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function CompanyPageClient() {
  const { company, isLoading: companyLoading } = useCompany();
  const { handbooks, isLoading: handbooksLoading } = useHandbooks();

  return (
    <div className="space-y-6">
      {/* Enterprise System Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-xs tracking-wider uppercase text-primary font-semibold">
              System / Organizational Directory
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Enterprise Infrastructure & Directory
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Central repository for statutory entity registrations, corporate charters, leadership contacts, and operational handbooks.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="border-border/80 bg-background/50 font-mono text-xs px-3 py-1.5 gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Compliance Verified
          </Badge>
        </div>
      </div>

      <Separator className="my-2 border-border/60" />

      <Tabs defaultValue="profile" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="bg-muted/60 p-1 rounded-xl h-11 border border-border/50 inline-flex items-center gap-1">
            <TabsTrigger
              value="profile"
              className="rounded-lg px-4 h-9 flex items-center gap-2 whitespace-nowrap shrink-0 data-[state=active]:bg-background data-[state=active]:shadow-xs font-medium text-xs sm:text-sm transition-all"
            >
              <Building2 className="h-4 w-4 shrink-0 text-primary" />
              <span className="whitespace-nowrap">Company Profile</span>
            </TabsTrigger>
            <TabsTrigger
              value="handbook"
              className="rounded-lg px-4 h-9 flex items-center gap-2 whitespace-nowrap shrink-0 data-[state=active]:bg-background data-[state=active]:shadow-xs font-medium text-xs sm:text-sm transition-all"
            >
              <BookOpen className="h-4 w-4 shrink-0 text-primary" />
              <span className="whitespace-nowrap">Company Handbooks</span>
              {handbooks && handbooks.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1.5 px-1.5 py-0 text-[10px] font-mono h-4 min-w-4 flex items-center justify-center rounded-full bg-primary/15 text-primary shrink-0"
                >
                  {handbooks.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Profile */}
        <TabsContent value="profile" className="space-y-4 animate-in fade-in-50 duration-300">
          {companyLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-36 w-full rounded-2xl" />
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Skeleton className="lg:col-span-8 h-64 rounded-2xl" />
                <Skeleton className="lg:col-span-4 h-64 rounded-2xl" />
                <Skeleton className="lg:col-span-6 h-56 rounded-2xl" />
                <Skeleton className="lg:col-span-6 h-56 rounded-2xl" />
              </div>
            </div>
          ) : company ? (
            <CompanyProfile company={company} />
          ) : (
            <div className="flex flex-col items-center justify-center h-80 rounded-2xl border border-dashed border-border/80 bg-muted/20 p-6 text-center space-y-3">
              <div className="p-3 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="font-semibold text-foreground">Organization Data Unavailable</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The primary organizational profile has not been provisioned or is temporarily inaccessible.
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Handbooks */}
        <TabsContent value="handbook" className="space-y-4 animate-in fade-in-50 duration-300">
          {handbooksLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-60 w-full rounded-2xl" />
              <Skeleton className="h-60 w-full rounded-2xl" />
            </div>
          ) : (
            <HandbookList handbooks={handbooks || []} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
