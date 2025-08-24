import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileText, Send, CheckCircle } from "lucide-react";
import { TemplateManager } from "./TemplateManager";
import { SigningRequestManager } from "./SigningRequestManager";
import { CompletedDocuments } from "./CompletedDocuments";

export function DocumentSigningContent() {
  const [activeTab, setActiveTab] = useState("templates");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Document Signing</h1>
            <p className="text-muted-foreground">
              Create templates, send documents for signing, and manage digital signatures
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Requests
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Completed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-6">
            <TemplateManager />
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            <SigningRequestManager />
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            <CompletedDocuments />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}