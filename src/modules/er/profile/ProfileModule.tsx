"use client";

import { UserProfile } from "./types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Heart,
  Droplet,
  Users
} from "lucide-react";

interface ProfileModuleProps {
  profile: UserProfile;
}

export function ProfileModule({ profile }: ProfileModuleProps) {
  const fullName = [profile.user_fname, profile.user_mname, profile.user_lname, profile.suffix_name]
    .filter(Boolean)
    .join(" ");

  const initials = (profile.user_fname?.[0] || "") + (profile.user_lname?.[0] || "");
  const avatarUrl = profile.user_image ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/assets/${profile.user_image}` : "";

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="border-none shadow-md bg-gradient-to-br from-background to-muted/30 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-24 bg-primary/10"></div>
        <CardContent className="pt-12 pb-6 relative z-10 flex flex-col sm:flex-row items-center gap-6">
          <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
            <AvatarImage src={avatarUrl} alt={fullName} className="object-cover" />
            <AvatarFallback className="text-2xl font-bold bg-primary/5 text-primary">{initials}</AvatarFallback>
          </Avatar>
          
          <div className="text-center sm:text-left space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{fullName}</h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-muted-foreground">
              <span className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                {profile.user_position || "No Position"}
              </span>
              <span>•</span>
              <span>{profile.department_name || "No Department"}</span>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-2 justify-center sm:justify-start">
              {profile.employment_status_name && (
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                  {profile.employment_status_name}
                </Badge>
              )}
              {profile.user_tags && profile.user_tags.split(",").map((tag: string) => (
                <Badge key={tag} variant="outline">{tag.trim()}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full sm:w-auto grid-cols-2 lg:grid-cols-4 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="personal" className="rounded-lg">Personal</TabsTrigger>
          <TabsTrigger value="employment" className="rounded-lg">Employment</TabsTrigger>
          <TabsTrigger value="government" className="rounded-lg">Gov. IDs</TabsTrigger>
          <TabsTrigger value="emergency" className="rounded-lg">Emergency</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="personal" className="focus-visible:outline-none focus-visible:ring-0">
            <Card className="shadow-sm border-muted">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoItem icon={<Mail className="w-4 h-4" />} label="Email" value={profile.user_email} />
                <InfoItem icon={<Phone className="w-4 h-4" />} label="Contact Number" value={profile.user_contact} />
                <InfoItem icon={<MapPin className="w-4 h-4" />} label="Address" value={[profile.user_brgy, profile.user_city, profile.user_province].filter(Boolean).join(", ")} />
                <InfoItem icon={<Calendar className="w-4 h-4" />} label="Birthday" value={profile.user_bday ? new Date(profile.user_bday).toLocaleDateString() : null} />
                <InfoItem label="Gender" value={profile.gender} />
                <InfoItem label="Civil Status" value={profile.civil_status} />
                <InfoItem label="Nationality" value={profile.nationality} />
                <InfoItem icon={<Droplet className="w-4 h-4 text-red-500" />} label="Blood Type" value={profile.blood_type} />
                <InfoItem label="Religion" value={profile.religion} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employment" className="focus-visible:outline-none focus-visible:ring-0">
            <Card className="shadow-sm border-muted">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  Employment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoItem label="Date of Hire" value={profile.user_dateOfHire ? new Date(profile.user_dateOfHire).toLocaleDateString() : null} />
                <InfoItem label="Position" value={profile.user_position} />
                <InfoItem label="Department" value={profile.department_name} />
                <InfoItem label="Employee Status" value={profile.employment_status_name} />
                <InfoItem label="Employee ID (External)" value={profile.user_id?.toString()} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="government" className="focus-visible:outline-none focus-visible:ring-0">
            <Card className="shadow-sm border-muted">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Government IDs
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoItem label="SSS Number" value={profile.user_sss} />
                <InfoItem label="PhilHealth" value={profile.user_philhealth} />
                <InfoItem label="TIN" value={profile.user_tin} />
                <InfoItem label="Pag-IBIG" value={profile.user_pagibig} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emergency" className="focus-visible:outline-none focus-visible:ring-0">
            <Card className="shadow-sm border-muted bg-red-50/50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-red-600 dark:text-red-400">
                  <Heart className="w-5 h-5" />
                  Emergency Contact
                </CardTitle>
                <CardDescription>
                  In case of emergency, this person will be contacted.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoItem icon={<Users className="w-4 h-4" />} label="Contact Name" value={profile.emergency_contact_name} />
                <InfoItem icon={<Phone className="w-4 h-4" />} label="Contact Number" value={profile.emergency_contact_number} />
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function InfoItem({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col space-y-1">
      <div className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </div>
      <div className="font-medium text-foreground">
        {value || <span className="text-muted-foreground/50 italic">Not specified</span>}
      </div>
    </div>
  );
}
