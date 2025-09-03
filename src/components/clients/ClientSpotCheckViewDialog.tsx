import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ClientSpotCheckFormData } from "./ClientSpotCheckFormDialog";

interface ClientSpotCheckViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ClientSpotCheckFormData | null;
  clientName?: string;
}

export default function ClientSpotCheckViewDialog({ 
  open, 
  onOpenChange, 
  data,
  clientName 
}: ClientSpotCheckViewDialogProps) {
  if (!data) return null;

  const getRatingBadge = (value?: string) => {
    switch (value) {
      case 'poor':
        return <Badge variant="destructive">Poor</Badge>;
      case 'fair':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Fair</Badge>;
      case 'good':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Good</Badge>;
      case 'very_good':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Very Good</Badge>;
      case 'excellent':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Excellent</Badge>;
      case 'not_applicable':
        return <Badge variant="secondary">N/A</Badge>;
      default:
        return <Badge variant="outline">Not Rated</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Client Spot Check Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="font-medium text-muted-foreground">Client Name:</span>
                <p>{clientName || 'Unknown Client'}</p>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-muted-foreground">Service User Name:</span>
                <p>{data.serviceUserName}</p>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-muted-foreground">Care Workers:</span>
                <p>{data.careWorkers}</p>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-muted-foreground">Date:</span>
                <p>{data.date}</p>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-muted-foreground">Time:</span>
                <p>{data.time}</p>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-muted-foreground">Performed By:</span>
                <p>{data.performedBy}</p>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-muted-foreground">Completed By:</span>
                <p>{data.completedBy}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Assessment Results */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Assessment Results</h3>
            <div className="space-y-4">
              {data.observations.map((obs, index) => (
                <div key={obs.id || index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="font-medium text-sm flex-1">{obs.label}</h4>
                    <div className="shrink-0">
                      {getRatingBadge(obs.value)}
                    </div>
                  </div>
                  
                  {obs.comments && (
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">Comments:</span>
                      <p className="text-sm bg-muted/30 p-2 rounded border-l-4 border-primary/20">
                        {obs.comments}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}