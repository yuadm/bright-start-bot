import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, Briefcase, FileText, Settings, List, Phone, BarChart3 } from "lucide-react";
import { JobPositionSettings } from "./JobPositionSettings";
import { ApplicationShiftSettings } from "./ApplicationShiftSettings";
import { ApplicationSkillsSettings } from "./ApplicationSkillsSettings";
import { ApplicationPersonalSettings } from "./ApplicationPersonalSettings";
import { ApplicationStatusSettings } from "./ApplicationStatusSettings";
import { ApplicationFieldSettings } from "./ApplicationFieldSettings";
import { ApplicationStepSettings } from "./ApplicationStepSettings";
import { ApplicationEmergencySettings } from "./ApplicationEmergencySettings";

export function ApplicationSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Job Application Settings</h2>
        <p className="text-muted-foreground">
          Configure all aspects of your job application process and forms.
        </p>
      </div>

      <Tabs defaultValue="positions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="positions" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Positions
          </TabsTrigger>
          <TabsTrigger value="shifts" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Shifts
          </TabsTrigger>
          <TabsTrigger value="skills" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Skills
          </TabsTrigger>
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Personal Info
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            App Status
          </TabsTrigger>
          <TabsTrigger value="fields" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Fields
          </TabsTrigger>
          <TabsTrigger value="steps" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            Steps
          </TabsTrigger>
          <TabsTrigger value="emergency" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Emergency
          </TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="space-y-6">
          <JobPositionSettings />
        </TabsContent>

        <TabsContent value="shifts" className="space-y-6">
          <ApplicationShiftSettings />
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          <ApplicationSkillsSettings />
        </TabsContent>

        <TabsContent value="personal" className="space-y-6">
          <ApplicationPersonalSettings />
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          <ApplicationStatusSettings />
        </TabsContent>

        <TabsContent value="fields" className="space-y-6">
          <ApplicationFieldSettings />
        </TabsContent>

        <TabsContent value="steps" className="space-y-6">
          <ApplicationStepSettings />
        </TabsContent>

        <TabsContent value="emergency" className="space-y-6">
          <ApplicationEmergencySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}