import React, { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { useCompany } from "@/contexts/CompanyContext";
import { useToast } from "@/hooks/use-toast";

export interface SpotCheckObservation {
  id: string;
  label: string;
  value?: "yes" | "no";
  comments?: string;
}

export interface SpotCheckFormData {
  serviceUserName: string;
  careWorker1: string;
  careWorker2: string;
  date: string; // yyyy-MM-dd
  timeFrom: string; // HH:mm
  timeTo: string; // HH:mm
  carriedBy: string;
  observations: SpotCheckObservation[];
}

interface SpotCheckFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SpotCheckFormData) => void;
  initialData?: SpotCheckFormData | null;
  periodIdentifier?: string; // e.g., 2025-Q2
  frequency?: string; // e.g., 'quarterly'
}

export default function SpotCheckFormDialog({ open, onOpenChange, onSubmit, initialData, periodIdentifier, frequency }: SpotCheckFormDialogProps) {
  const { companySettings } = useCompany();
  const { toast } = useToast();

  const [errors, setErrors] = useState<{
    serviceUserName?: string;
    careWorker1?: string;
    date?: string;
    timeFrom?: string;
    timeTo?: string;
    carriedBy?: string;
    observations?: Record<string, string>;
  }>({});

  const [form, setForm] = useState<SpotCheckFormData>({
    serviceUserName: "",
    careWorker1: "",
    careWorker2: "",
    date: "",
    timeFrom: "",
    timeTo: "",
    carriedBy: "",
    observations: [],
  });

  const observationItems = useMemo<SpotCheckObservation[]>(
    () => [
      { id: "arrives_on_time", label: "Care Worker arrives at the Service User's home on time" },
      { id: "keys_or_alerts", label: "Care Worker has keys for entry/Alerts the Service User upon arrival / key safe number" },
      { id: "id_badge", label: "Care Worker is wearing a valid and current ID badge" },
      { id: "safe_hygiene_ppe", label: "Care Worker practices safe hygiene (use of PPE clothing, gloves/aprons etc.)" },
      { id: "checks_care_plan", label: "Care Worker checks Service User's care plan upon arrival" },
      { id: "equipment_used_properly", label: "Equipment (hoists etc) used properly" },
      { id: "food_safety", label: "Care Worker practices proper food safety and hygiene principles" },
      { id: "vigilant_hazards", label: "Care Worker is vigilant for hazards in the Service User's home" },
      { id: "communicates_user", label: "Care Worker communicates with the Service User (tasks to be done, maintaining confidentiality)" },
      { id: "asks_satisfaction", label: "Care Worker asks Service User if he/she is satisfied with the service" },
      { id: "daily_report_forms", label: "Care Worker completes Daily Report forms satisfactorily" },
      { id: "snacks_stored_properly", label: "Snacks left for the Service User are covered and stored properly" },
      { id: "leaves_premises_locked", label: "Care Worker leaves premises, locking doors behind him/her" },
    ],
    []
  );

// Initialize form on open
React.useEffect(() => {
  if (!open) return;

  // Build base observations from template
  const baseObservations = observationItems.map((item) => ({ id: item.id, label: item.label } as SpotCheckObservation));

  if (initialData) {
    // Merge initial observations with base list to ensure consistency
    const mergedObservations = baseObservations.map((base) => {
      const existing = initialData.observations.find((o) => o.id === base.id);
      return existing ? { ...base, value: existing.value, comments: existing.comments } : base;
    });

    setForm({
      serviceUserName: initialData.serviceUserName || "",
      careWorker1: initialData.careWorker1 || "",
      careWorker2: initialData.careWorker2 || "",
      date: initialData.date || "",
      timeFrom: initialData.timeFrom || "",
      timeTo: initialData.timeTo || "",
      carriedBy: initialData.carriedBy || "",
      observations: mergedObservations,
    });
  } else {
    setForm((prev) => ({
      ...prev,
      observations: baseObservations,
    }));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [open, initialData, observationItems]);

  const updateField = (key: keyof SpotCheckFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateObservation = (id: string, changes: Partial<SpotCheckObservation>) => {
    setForm((prev) => ({
      ...prev,
      observations: prev.observations.map((obs) => (obs.id === id ? { ...obs, ...changes } : obs)),
    }));
  };

  const handleSubmit = () => {
    const newErrors: typeof errors = { observations: {} };

    if (!form.serviceUserName) newErrors.serviceUserName = "Required";
    if (!form.careWorker1) newErrors.careWorker1 = "Required";
    if (!form.date) newErrors.date = "Required";
    if (!form.timeFrom) newErrors.timeFrom = "Required";
    if (!form.timeTo) newErrors.timeTo = "Required";
    if (!form.carriedBy) newErrors.carriedBy = "Required";

    for (const obs of form.observations) {
      if (!obs.value) {
        newErrors.observations![obs.id] = "Select Yes or No";
      } else if (obs.value === "no" && !obs.comments?.trim()) {
        newErrors.observations![obs.id] = "Comments are required for 'No'";
      }
    }

    const hasErrors =
      !!newErrors.serviceUserName ||
      !!newErrors.careWorker1 ||
      !!newErrors.date ||
      !!newErrors.timeFrom ||
      !!newErrors.timeTo ||
      !!newErrors.carriedBy ||
      Object.keys(newErrors.observations || {}).length > 0;

    if (hasErrors) {
      setErrors(newErrors);
      toast({ title: "Please fix the highlighted fields", variant: "destructive" });
      return;
    }

    setErrors({});
    onSubmit(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-lg md:max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Spot Check</DialogTitle>
          <DialogDescription>Fill out the spot check form below</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Logo */}
          {companySettings?.logo && (
            <div className="flex justify-center">
              <img
                src={companySettings.logo}
                alt={`${companySettings.name || "Company"} logo`}
                className="h-12 object-contain"
                loading="lazy"
              />
            </div>
          )}

          {/* Header fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Service User's Name</Label>
              <Input
                value={form.serviceUserName}
                onChange={(e) => updateField("serviceUserName", e.target.value)}
                aria-invalid={!!errors.serviceUserName}
                className={errors.serviceUserName ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.serviceUserName && <p className="text-destructive text-xs mt-1">{errors.serviceUserName}</p>}
            </div>
            <div className="space-y-1">
              <Label>Care Worker(s) attending</Label>
              <Input
                value={form.careWorker1}
                onChange={(e) => updateField("careWorker1", e.target.value)}
                placeholder="Name 1"
                aria-invalid={!!errors.careWorker1}
                className={errors.careWorker1 ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.careWorker1 && <p className="text-destructive text-xs mt-1">{errors.careWorker1}</p>}
            </div>
            <div className="space-y-1">
              <Label>Care Worker(s) attending</Label>
              <Input value={form.careWorker2} onChange={(e) => updateField("careWorker2", e.target.value)} placeholder="Name 2 (optional)" />
            </div>
<div className="space-y-1">
  <Label>Date of spot check</Label>
  <Popover>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        className="w-full justify-start text-left font-normal"
        aria-invalid={!!errors.date}
      >
        {form.date ? format(new Date(form.date), "PPP") : "Pick a date"}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
      <Calendar
        mode="single"
        selected={form.date ? new Date(form.date) : undefined}
        onSelect={(date) => date && updateField("date", format(date, "yyyy-MM-dd"))}
        disabled={(date) => {
          if (frequency?.toLowerCase() === 'quarterly' && periodIdentifier?.includes('-Q')) {
            const [y, qStr] = periodIdentifier.split('-Q');
            const year = parseInt(y);
            const q = parseInt(qStr);
            if (!isNaN(year) && !isNaN(q)) {
              const startMonth = (q - 1) * 3;
              const minDate = new Date(year, startMonth, 1);
              const maxDate = new Date(year, startMonth + 3, 0);
              return date < minDate || date > maxDate;
            }
          }
          return false;
        }}
        initialFocus
        className="p-3 pointer-events-auto"
      />
    </PopoverContent>
  </Popover>
  {errors.date && <p className="text-destructive text-xs mt-1">{errors.date}</p>}
</div>
            <div className="space-y-1">
              <Label>Time of spot check (From)</Label>
              <Input
                type="time"
                value={form.timeFrom}
                onChange={(e) => updateField("timeFrom", e.target.value)}
                aria-invalid={!!errors.timeFrom}
                className={errors.timeFrom ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.timeFrom && <p className="text-destructive text-xs mt-1">{errors.timeFrom}</p>}
            </div>
            <div className="space-y-1">
              <Label>Time of spot check (To)</Label>
              <Input
                type="time"
                value={form.timeTo}
                onChange={(e) => updateField("timeTo", e.target.value)}
                aria-invalid={!!errors.timeTo}
                className={errors.timeTo ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.timeTo && <p className="text-destructive text-xs mt-1">{errors.timeTo}</p>}
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Spot Check carried out by</Label>
              <Input
                value={form.carriedBy}
                onChange={(e) => updateField("carriedBy", e.target.value)}
                aria-invalid={!!errors.carriedBy}
                className={errors.carriedBy ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.carriedBy && <p className="text-destructive text-xs mt-1">{errors.carriedBy}</p>}
            </div>
          </div>

          {/* Observation section */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold">B: OBSERVATION</h3>
            {/* Desktop/tablet grid */}
            <div className="hidden md:grid grid-cols-12 gap-2 text-sm">
              <div className="col-span-6 font-medium">Item</div>
              <div className="col-span-2 font-medium">Yes</div>
              <div className="col-span-2 font-medium">No</div>
              <div className="col-span-2 font-medium">Observation/comments</div>

              {observationItems.map((item) => {
                const current = form.observations.find((o) => o.id === item.id);
                const err = errors.observations?.[item.id];
                return (
                  <React.Fragment key={item.id}>
                    <div className="col-span-6 py-2">{item.label}</div>
                    <div className="col-span-2 py-2">
<Button
  variant={current?.value === "yes" ? "default" : "outline"}
  size="sm"
  className="w-full justify-center"
  onClick={() => updateObservation(item.id, { value: "yes", comments: current?.comments })}
  aria-label={`${item.label} - Yes`}
>
  <Check className="h-4 w-4" />
</Button>
                    </div>
                    <div className="col-span-2 py-2">
<Button
  variant={current?.value === "no" ? "destructive" : "outline"}
  size="sm"
  className="w-full justify-center"
  onClick={() => updateObservation(item.id, { value: "no" })}
  aria-label={`${item.label} - No`}
>
  <X className="h-4 w-4" />
</Button>
                    </div>
                    <div className="col-span-2 py-1">
<Input
  placeholder={current?.value === "no" ? "Required for 'No'" : "Optional"}
  value={current?.comments || ""}
  onChange={(e) => updateObservation(item.id, { comments: e.target.value })}
  aria-invalid={!!err}
  className={err ? "border-destructive focus-visible:ring-destructive" : ""}
/>
{err && <p className="text-destructive text-xs mt-1">{err}</p>}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Mobile stacked cards */}
            <div className="md:hidden space-y-3">
              {observationItems.map((item) => {
                const current = form.observations.find((o) => o.id === item.id);
                const err = errors.observations?.[item.id];
                return (
                  <div key={item.id} className="rounded-lg border p-3 space-y-2">
                    <div className="font-medium text-sm">{item.label}</div>
<div className="flex items-center gap-3">
  <Button
    variant={current?.value === "yes" ? "default" : "outline"}
    size="sm"
    className="flex-1 justify-center"
    onClick={() => updateObservation(item.id, { value: "yes", comments: current?.comments })}
    aria-label={`${item.label} - Yes`}
  >
    <Check className="h-4 w-4" />
  </Button>
  <Button
    variant={current?.value === "no" ? "destructive" : "outline"}
    size="sm"
    className="flex-1 justify-center"
    onClick={() => updateObservation(item.id, { value: "no" })}
    aria-label={`${item.label} - No`}
  >
    <X className="h-4 w-4" />
  </Button>
</div>
<Input
  placeholder={current?.value === "no" ? "Required for 'No'" : "Optional"}
  value={current?.comments || ""}
  onChange={(e) => updateObservation(item.id, { comments: e.target.value })}
  aria-invalid={!!err}
  className={err ? "border-destructive focus-visible:ring-destructive" : ""}
/>
{err && <p className="text-destructive text-xs mt-1">{err}</p>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Save Spot Check</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
