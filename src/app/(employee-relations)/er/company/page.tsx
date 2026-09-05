"use client";

import { useCompany, useHandbooks } from "@/modules/er/about/hooks/useAbout";
import { CompanyProfile } from "@/modules/er/about/components/CompanyProfile";
import { HandbookList } from "@/modules/er/about/components/HandbookList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Building, BookOpen } from "lucide-react";

export default function AboutPage() {
  const { company, isLoading: companyLoading } = useCompany();
  const { handbooks, isLoading: handbooksLoading } = useHandbooks();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">About Company</h2>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Company Profile
          </TabsTrigger>
          <TabsTrigger value="handbook" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Company Handbook
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          {companyLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-[400px] w-full" />
            </div>
          ) : company ? (
            <CompanyProfile company={company} />
          ) : (
            <div className="flex h-[400px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
              Failed to load company profile.
            </div>
          )}
        </TabsContent>

        <TabsContent value="handbook" className="space-y-4">
          {handbooksLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <HandbookList handbooks={handbooks} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
