import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Company } from "../types";
import { Mail, Phone, MapPin, Globe } from "lucide-react";

export function CompanyProfile({ company }: { company: Company }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            {company.company_logo ? (
              <img
                src={company.company_logo}
                alt={`${company.company_name} Logo`}
                className="h-16 w-16 object-contain rounded-md"
              />
            ) : (
              <div className="h-16 w-16 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                Logo
              </div>
            )}
            <div>
              <CardTitle className="text-2xl">{company.company_name}</CardTitle>
              <CardDescription>{company.company_type || "Company Profile"}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </h4>
              <p className="text-sm">
                {[
                  company.company_address,
                  company.company_brgy,
                  company.company_city,
                  company.company_province,
                  company.company_zipCode,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Website
              </h4>
              <p className="text-sm">
                {company.company_website ? (
                  <a href={company.company_website} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    {company.company_website}
                  </a>
                ) : (
                  "N/A"
                )}
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </h4>
              <p className="text-sm">{company.company_email || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact
              </h4>
              <p className="text-sm">{company.company_contact || "N/A"}</p>
            </div>
          </div>

          {company.company_mission && (
            <div className="space-y-2 pt-4 border-t">
              <h3 className="font-semibold text-lg">Mission</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{company.company_mission}</p>
            </div>
          )}

          {company.company_vision && (
            <div className="space-y-2 pt-4 border-t">
              <h3 className="font-semibold text-lg">Vision</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{company.company_vision}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
