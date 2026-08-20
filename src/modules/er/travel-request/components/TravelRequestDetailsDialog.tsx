/* eslint-disable @typescript-eslint/no-explicit-any */
 
 
import { TravelRequest } from "../types/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface TravelRequestDetailsDialogProps {
  request: TravelRequest | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  coas: any[];
}

export function TravelRequestDetailsDialog({ request, isOpen, onOpenChange, coas }: TravelRequestDetailsDialogProps) {
  if (!request) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "cancelled": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCOAName = (coaId: number) => {
    const coa = coas?.find((c) => c.coa_id === coaId);
    return coa ? `${coa.gl_code} - ${coa.account_title}` : `Account ID: ${coaId}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between mt-2">
            <DialogTitle className="text-xl">Travel Request Details</DialogTitle>
            <Badge className={getStatusColor(request.status)} variant="secondary">
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Destination</h4>
              <p className="text-base">{request.destination}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Travel Dates</h4>
              <p className="text-base">
                {format(new Date(request.travel_from), "MMMM d, yyyy")} - {format(new Date(request.travel_to), "MMMM d, yyyy")}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Purpose</h4>
              <p className="text-base whitespace-pre-wrap">{request.purpose}</p>
            </div>

            {request.remarks && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Remarks</h4>
                <p className="text-base whitespace-pre-wrap">{request.remarks}</p>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Budget Allocation</h4>
            {!request.requires_budget ? (
              <p className="text-sm text-muted-foreground italic">No budget requested for this travel.</p>
            ) : (
              <div className="space-y-4">
                {request.budget_items && request.budget_items.length > 0 ? (
                  <div className="rounded-md border divide-y">
                    {request.budget_items.map((item, idx) => (
                      <div key={idx} className="p-3 text-sm flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="font-medium">{getCOAName(item.coa_id)}</p>
                          {item.remarks && <p className="text-muted-foreground">{item.remarks}</p>}
                        </div>
                        <div className="font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap ml-4">
                          {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(item.amount)}
                        </div>
                      </div>
                    ))}
                    <div className="p-3 bg-muted/30 flex justify-between items-center font-semibold">
                      <span>Total Amount</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(request.total_budget || 0)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Budget data is unavailable.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


