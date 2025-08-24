import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, FileText } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { EnhancedPDFViewer } from "@/components/document-signing/EnhancedPDFViewer";
import "@/lib/pdf-config"; // Initialize PDF.js configuration

interface SigningRequestData {
  id: string;
  template_id: string;
  title: string;
  message: string;
  status: string;
  document_templates: {
    name: string;
    file_path: string;
  };
  signing_request_recipients: {
    id: string;
    recipient_name: string;
    recipient_email: string;
    status: string;
    access_token: string;
    expired_at?: string;
    access_count?: number;
  }[];
}

interface TemplateField {
  id: string;
  field_name: string;
  field_type: string;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  page_number: number;
  is_required: boolean;
  placeholder_text?: string;
}

export default function DocumentSigningView() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [signatures, setSignatures] = useState<Record<string, string>>({});
  const [isSigningInProgress, setIsSigningInProgress] = useState(false);
  const [hasBeenSigned, setHasBeenSigned] = useState(false);
  const signatureRefs = useRef<Record<string, SignatureCanvas | null>>({});

  // Fetch signing request data
  const { data: signingData, isLoading, error } = useQuery({
    queryKey: ["signing-request", token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signing_requests")
        .select(`
          *,
          document_templates (name, file_path),
          signing_request_recipients (*)
        `)
        .eq("signing_token", token)
        .single();

      if (error) throw error;
      
      // Track access for expiration checking
      if (data?.signing_request_recipients?.[0]) {
        await supabase
          .from("signing_request_recipients")
          .update({ 
            access_count: (data.signing_request_recipients[0].access_count || 0) + 1 
          })
          .eq("id", data.signing_request_recipients[0].id);
      }
      
      return data as SigningRequestData;
    },
    enabled: !!token,
  });

  // Fetch template fields
  const { data: templateFields } = useQuery({
    queryKey: ["template-fields", signingData?.template_id],
    queryFn: async () => {
      if (!signingData?.template_id) return [];
      
      console.log("Fetching template fields for template_id:", signingData.template_id);
      
      const { data, error } = await supabase
        .from("template_fields")
        .select("*")
        .eq("template_id", signingData.template_id)
        .order("page_number");

      if (error) {
        console.error("Error fetching template fields:", error);
        throw error;
      }
      
      console.log("Template fields data:", data);
      return data as TemplateField[];
    },
    enabled: !!signingData?.template_id,
  });

  // Load PDF when data is available
  useEffect(() => {
    if (signingData?.document_templates?.file_path) {
      const url = `${supabase.storage.from("company-assets").getPublicUrl(signingData.document_templates.file_path).data.publicUrl}`;
      setPdfUrl(url);
    }
  }, [signingData]);

  // Complete signing mutation
  const completeSigning = useMutation({
    mutationFn: async () => {
      if (!signingData || !templateFields) return;

      const recipient = signingData.signing_request_recipients[0];
      if (!recipient) throw new Error("No recipient found");

      // Generate final PDF with filled fields and signatures
      const originalPdfUrl = `${supabase.storage.from("company-assets").getPublicUrl(signingData.document_templates.file_path).data.publicUrl}`;
      const originalPdfResponse = await fetch(originalPdfUrl);
      const originalPdfBytes = await originalPdfResponse.arrayBuffer();

      const pdfDoc = await PDFDocument.load(originalPdfBytes);
      const pages = pdfDoc.getPages();

      // Add field values and signatures to the PDF
      for (const field of templateFields) {
        const page = pages[field.page_number - 1];
        if (!page) continue;

        const value = field.field_type === "signature" ? signatures[field.id] : fieldValues[field.id];
        if (!value) continue;

        // Get page dimensions for coordinate conversion
        const { height: pageHeight } = page.getSize();
        
        // Convert web coordinates to PDF coordinates (Y-axis is flipped in PDF)
        const pdfX = field.x_position;
        const pdfY = pageHeight - field.y_position - field.height;

        if (field.field_type === "signature") {
          // Handle signature fields - convert base64 to image and embed
          try {
            const signatureData = value.split(',')[1]; // Remove data:image/png;base64, prefix
            const signatureBytes = Uint8Array.from(atob(signatureData), c => c.charCodeAt(0));
            const signatureImage = await pdfDoc.embedPng(signatureBytes);
            
            page.drawImage(signatureImage, {
              x: pdfX,
              y: pdfY,
              width: field.width,
              height: field.height,
            });
          } catch (error) {
            console.error("Error adding signature:", error);
          }
        } else if (field.field_type === "checkbox") {
          // Handle checkbox fields
          if (value === "true") {
            page.drawText("✓", {
              x: pdfX + 2,
              y: pdfY + 5,
              size: field.height - 4,
            });
          }
        } else {
          // Handle text fields
          page.drawText(value.toString(), {
            x: pdfX,
            y: pdfY + (field.height / 2) - 6, // Center text vertically
            size: Math.min(12, field.height - 4),
          });
        }
      }

      // Generate the final PDF
      const finalPdfBytes = await pdfDoc.save();
      const finalPdfBlob = new Blob([finalPdfBytes], { type: 'application/pdf' });

      // Upload the final PDF to storage
      const fileName = `${Date.now()}_${signingData.title}_signed.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("company-assets")
        .upload(`signed-documents/${fileName}`, finalPdfBlob);

      if (uploadError) throw uploadError;

      // Update recipient status to signed and mark as expired
      const { error: updateError } = await supabase
        .from("signing_request_recipients")
        .update({
          status: "signed",
          signed_at: new Date().toISOString(),
          expired_at: new Date().toISOString(), // Immediately expire the link
        })
        .eq("id", recipient.id);

      if (updateError) throw updateError;

      // Create signed document record with field data
      const signedDocumentData = {
        signing_request_id: signingData.id,
        final_document_path: `signed-documents/${fileName}`,
        completion_data: {
          recipient_id: recipient.id,
          field_data: {
            ...fieldValues,
            ...signatures,
          },
        },
        completed_at: new Date().toISOString(),
      };

      const { error: docError } = await supabase
        .from("signed_documents")
        .insert(signedDocumentData);

      if (docError) throw docError;

      // Send completion notification
      await supabase.functions.invoke("send-completion-notification", {
        body: {
          documentTitle: signingData.title,
          recipientName: recipient.recipient_name,
          recipientEmail: recipient.recipient_email,
        },
      });
    },
    onSuccess: () => {
      setHasBeenSigned(true); // Immediately mark as signed locally
      toast.success("Document signed successfully!");
      queryClient.invalidateQueries({ queryKey: ["signing-request", token] });
      // Close the tab/window or redirect to success page
      setTimeout(() => {
        window.close();
        // If window.close() doesn't work (e.g., not opened by JS), redirect
        if (!window.closed) {
          navigate("/", { replace: true });
        }
      }, 2000);
    },
    onError: (error: any) => {
      console.error("Error signing document:", error);
      toast.error("Failed to sign document: " + error.message);
      setIsSigningInProgress(false); // Reset signing state on error
    },
  });

  const handleFieldChange = (fieldId: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSignature = (fieldId: string) => {
    const canvas = signatureRefs.current[fieldId];
    if (canvas && !canvas.isEmpty()) {
      const dataURL = canvas.toDataURL();
      setSignatures(prev => ({ ...prev, [fieldId]: dataURL }));
    }
  };

  const clearSignature = (fieldId: string) => {
    const canvas = signatureRefs.current[fieldId];
    if (canvas) {
      canvas.clear();
    }
    setSignatures(prev => {
      const newSignatures = { ...prev };
      delete newSignatures[fieldId];
      return newSignatures;
    });
  };

  const handleSubmit = () => {
    if (!templateFields || isSigningInProgress) return;

    // Prevent multiple submissions
    if (completeSigning.isPending) {
      toast.error("Document is already being signed, please wait...");
      return;
    }

    // Check required fields
    const requiredFields = templateFields.filter(field => field.is_required);
    const missingFields = requiredFields.filter(field => {
      if (field.field_type === "signature") {
        return !signatures[field.id];
      }
      if (field.field_type === "checkbox") {
        return !fieldValues[field.id]; // Checkbox can be true or false, just check if it's set
      }
      return !fieldValues[field.id];
    });

    if (missingFields.length > 0) {
      toast.error("Please fill all required fields");
      return;
    }

    // Set signing in progress to prevent multiple clicks
    setIsSigningInProgress(true);
    completeSigning.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !signingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Document Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">The signing link is invalid or has expired.</p>
            <Button onClick={() => navigate("/")}>Return to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const recipient = signingData.signing_request_recipients[0];
  const isAlreadySigned = recipient?.status === "signed" || hasBeenSigned;
  const isExpired = recipient?.expired_at !== null;
  const hasAccessedAfterSigning = recipient?.status === "signed" && (recipient?.access_count || 0) > 1;

  if (isAlreadySigned || isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-green-600">
              {isExpired ? "Link Expired" : "Already Signed"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">
              {isExpired 
                ? "This signing link has expired and is no longer accessible." 
                : "This document has already been signed."
              }
            </p>
            <Button onClick={() => navigate("/")}>Return to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate form completion
  const requiredFields = templateFields?.filter(field => field.is_required) || [];
  const completedRequiredFields = requiredFields.filter(field => {
    if (field.field_type === "signature") {
      return signatures[field.id];
    }
    return fieldValues[field.id];
  });
  const isFormComplete = requiredFields.length > 0 && completedRequiredFields.length === requiredFields.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {signingData.title}
            </CardTitle>
            <p className="text-muted-foreground">
              Please review and sign this document: {signingData.document_templates.name}
            </p>
            {signingData.message && (
              <p className="text-sm italic">{signingData.message}</p>
            )}
            <div className="mt-4 flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Progress: {completedRequiredFields.length} of {requiredFields.length} required fields completed
              </div>
              <div className="w-48 bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${requiredFields.length > 0 ? (completedRequiredFields.length / requiredFields.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* PDF Viewer */}
          <div className="lg:col-span-3">
            <Card className="h-[800px]">
              <CardHeader className="pb-4">
                <CardTitle>Document</CardTitle>
              </CardHeader>
              <CardContent className="h-full p-0">
                {pdfUrl && (
                  <EnhancedPDFViewer
                    pdfUrl={pdfUrl}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    scale={scale}
                    onScaleChange={setScale}
                    className="h-full"
                    overlayContent={
                      <>
                        {/* Render interactive field overlays */}
                        {templateFields
                          ?.filter(field => field.page_number === currentPage)
                          .map((field) => (
                            <div
                              key={field.id}
                              className="absolute border-2 border-blue-400 bg-blue-100/80 rounded cursor-pointer flex items-center justify-center text-xs font-medium text-blue-700 hover:bg-blue-200/80 transition-colors"
                              style={{
                                left: field.x_position * scale,
                                top: field.y_position * scale,
                                width: field.width * scale,
                                height: field.height * scale,
                                zIndex: 10
                              }}
                              title={`${field.field_name}${field.is_required ? ' (Required)' : ''}`}
                            >
                              {field.field_type === "signature" ? "✍️" : 
                               field.field_type === "checkbox" ? "☐" :
                               field.field_type === "date" ? "📅" : "📝"}
                              <span className="ml-1 truncate">
                                {field.field_name}
                              </span>
                            </div>
                          ))}
                      </>
                    }
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Form Fields Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Complete the Form</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Fill in all required fields to sign the document
                </p>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
                {/* Show all fields grouped by page */}
                {templateFields && templateFields.length > 0 ? (
                  Object.entries(
                    templateFields.reduce((acc, field) => {
                      if (!acc[field.page_number]) acc[field.page_number] = [];
                      acc[field.page_number].push(field);
                      return acc;
                    }, {} as Record<number, TemplateField[]>)
                  ).map(([pageNum, fields]) => (
                    <div key={pageNum} className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
                        <span>Page {pageNum}</span>
                        {parseInt(pageNum) === currentPage && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">Current</span>
                        )}
                      </div>
                      
                      {fields.map((field) => (
                        <div key={field.id} className="space-y-2 p-3 border rounded-lg bg-muted/50">
                          <Label className="flex items-center gap-2 text-sm">
                            {field.field_name}
                            {field.is_required && <span className="text-red-500">*</span>}
                            {(field.field_type === "signature" ? signatures[field.id] : fieldValues[field.id]) && (
                              <span className="text-green-600 text-xs">✓</span>
                            )}
                          </Label>

                          {field.field_type === "signature" ? (
                            <div className="space-y-2">
                              <div className="border border-dashed border-gray-300 rounded p-2 bg-white">
                                <SignatureCanvas
                                  ref={(ref) => (signatureRefs.current[field.id] = ref)}
                                  canvasProps={{
                                    width: 250,
                                    height: 100,
                                    className: "w-full h-20 border rounded",
                                  }}
                                  onEnd={() => handleSignature(field.id)}
                                />
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => clearSignature(field.id)}
                                className="w-full"
                              >
                                Clear
                              </Button>
                            </div>
                          ) : field.field_type === "checkbox" ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={field.id}
                                checked={fieldValues[field.id] === "true"}
                                onChange={(e) => handleFieldChange(field.id, e.target.checked.toString())}
                                className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                              />
                              <label htmlFor={field.id} className="text-sm">
                                {field.placeholder_text || "Check if applicable"}
                              </label>
                            </div>
                          ) : (
                            <Input
                              type={field.field_type === "date" ? "date" : "text"}
                              value={fieldValues[field.id] || ""}
                              onChange={(e) => handleFieldChange(field.id, e.target.value)}
                              placeholder={field.placeholder_text || `Enter ${field.field_name.toLowerCase()}`}
                              className="text-sm"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No form fields found for this document.</p>
                )}

                <div className="pt-4 space-y-2 border-t">
                  <Button
                    onClick={handleSubmit}
                    disabled={completeSigning.isPending || !isFormComplete || isSigningInProgress}
                    className="w-full"
                  >
                    {completeSigning.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {!isFormComplete ? `Complete ${requiredFields.length - completedRequiredFields.length} more field${requiredFields.length - completedRequiredFields.length !== 1 ? 's' : ''}` : 'Sign Document'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => navigate("/")}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}