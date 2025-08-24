import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileSignature, Plus, Eye, RefreshCw, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function SigningRequestManager() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createData, setCreateData] = useState({
    templateId: "",
    title: "",
    message: "",
    recipients: [{ name: "", email: "" }]
  });
  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templates } = useQuery({
    queryKey: ["document-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_templates")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch signing requests
  const { data: signingRequests, isLoading } = useQuery({
    queryKey: ["signing-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signing_requests")
        .select(`
          *,
          document_templates(name),
          signing_request_recipients(*)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Create signing request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (requestData: typeof createData) => {
      // Create signing request
      const { data: request, error: requestError } = await supabase
        .from("signing_requests")
        .insert({
          template_id: requestData.templateId,
          title: requestData.title,
          message: requestData.message,
          status: "sent",
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Create recipients
      const { error: recipientsError } = await supabase
        .from("signing_request_recipients")
        .insert(
          requestData.recipients.map((recipient, index) => ({
            signing_request_id: request.id,
            recipient_name: recipient.name,
            recipient_email: recipient.email,
            signing_order: index + 1,
            status: "pending"
          }))
        );

      if (recipientsError) throw recipientsError;

      // Send emails to recipients
      for (const recipient of requestData.recipients) {
        try {
          await supabase.functions.invoke("send-signing-request", {
            body: {
              recipientEmail: recipient.email,
              recipientName: recipient.name,
              documentTitle: requestData.title,
              signingUrl: `${window.location.origin}/sign/${request.signing_token}`,
              message: requestData.message
            }
          });
        } catch (emailError) {
          console.error("Failed to send email to", recipient.email, emailError);
        }
      }

      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signing-requests"] });
      setIsCreateOpen(false);
      setCreateData({
        templateId: "",
        title: "",
        message: "",
        recipients: [{ name: "", email: "" }]
      });
      toast.success("Signing request created and sent successfully");
    },
    onError: (error) => {
      toast.error("Failed to create signing request: " + error.message);
    }
  });

  const addRecipient = () => {
    setCreateData(prev => ({
      ...prev,
      recipients: [...prev.recipients, { name: "", email: "" }]
    }));
  };

  const removeRecipient = (index: number) => {
    setCreateData(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }));
  };

  const updateRecipient = (index: number, field: "name" | "email", value: string) => {
    setCreateData(prev => ({
      ...prev,
      recipients: prev.recipients.map((recipient, i) => 
        i === index ? { ...recipient, [field]: value } : recipient
      )
    }));
  };

  if (isLoading) {
    return <div className="text-center p-8">Loading signing requests...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Signing Requests</h2>
          <p className="text-muted-foreground">
            Create and manage document signing workflows
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Signing Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Signing Request</DialogTitle>
              <DialogDescription>
                Select a template and add recipients to create a new signing request
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="template">Template</Label>
                <Select
                  value={createData.templateId}
                  onValueChange={(value) => setCreateData(prev => ({ ...prev, templateId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates?.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">Document Title</Label>
                <Input
                  id="title"
                  value={createData.title}
                  onChange={(e) => setCreateData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter document title"
                />
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={createData.message}
                  onChange={(e) => setCreateData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Optional message for recipients"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Recipients</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addRecipient}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Recipient
                  </Button>
                </div>
                <div className="space-y-2">
                  {createData.recipients.map((recipient, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Recipient name"
                        value={recipient.name}
                        onChange={(e) => updateRecipient(index, "name", e.target.value)}
                      />
                      <Input
                        placeholder="Recipient email"
                        type="email"
                        value={recipient.email}
                        onChange={(e) => updateRecipient(index, "email", e.target.value)}
                      />
                      {createData.recipients.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeRecipient(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => createRequestMutation.mutate(createData)}
                disabled={
                  createRequestMutation.isPending ||
                  !createData.templateId ||
                  !createData.title ||
                  createData.recipients.some(r => !r.name || !r.email)
                }
                className="w-full"
              >
                {createRequestMutation.isPending ? "Creating..." : "Create & Send Request"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {signingRequests && signingRequests.length > 0 ? (
        <div className="space-y-4">
          {signingRequests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="font-semibold">{request.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Template: {request.document_templates?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Created: {new Date(request.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-4">
                      <Badge variant={request.status === "completed" ? "default" : "secondary"}>
                        {request.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {request.signing_request_recipients?.length || 0} recipients
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    {request.status !== "completed" && (
                      <Button variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Resend
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center p-12">
            <FileSignature className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Signing Requests Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first signing request to get started
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}