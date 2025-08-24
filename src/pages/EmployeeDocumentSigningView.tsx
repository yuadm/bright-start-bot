import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  PenTool, 
  Loader2, 
  Shield, 
  Eye,
  User,
  Calendar,
  RotateCcw
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { CompanyProvider, useCompany } from "@/contexts/CompanyContext";
import { EnhancedPDFViewer } from "@/components/document-signing/EnhancedPDFViewer";
import "@/lib/pdf-config";

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

function EmployeeDocumentSigningContent() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { companySettings } = useCompany();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [signatures, setSignatures] = useState<Record<string, string>>({});
  const [isSigningInProgress, setIsSigningInProgress] = useState(false);
  const [hasBeenSigned, setHasBeenSigned] = useState(false);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [showFieldModal, setShowFieldModal] = useState(false);
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
      
      const { data, error } = await supabase
        .from("template_fields")
        .select("*")
        .eq("template_id", signingData.template_id)
        .order("page_number");

      if (error) throw error;
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
          // Handle signature fields
          try {
            const signatureData = value.split(',')[1];
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
          if (value === "true") {
            page.drawText("✓", {
              x: pdfX + 2,
              y: pdfY + 5,
              size: field.height - 4,
            });
          }
        } else {
          page.drawText(value.toString(), {
            x: pdfX,
            y: pdfY + (field.height / 2) - 6,
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
          expired_at: new Date().toISOString(),
        })
        .eq("id", recipient.id);

      if (updateError) throw updateError;

      // Create signed document record
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
      setHasBeenSigned(true);
      toast.success("Document signed successfully!");
      queryClient.invalidateQueries({ queryKey: ["signing-request", token] });
    },
    onError: (error: any) => {
      console.error("Error signing document:", error);
      toast.error("Failed to sign document: " + error.message);
      setIsSigningInProgress(false);
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
        return !fieldValues[field.id];
      }
      return !fieldValues[field.id];
    });

    if (missingFields.length > 0) {
      // Navigate to first missing field
      if (missingFields[0]) {
        setCurrentPage(missingFields[0].page_number);
        setSelectedField(missingFields[0].id);
        setShowFieldModal(true);
        toast.error(`Please complete the required field: ${missingFields[0].field_name}`);
      }
      return;
    }

    setIsSigningInProgress(true);
    completeSigning.mutate();
  };

  const handleFieldClick = (fieldId: string) => {
    setSelectedField(fieldId);
    setShowFieldModal(true);
  };

  const closeFieldModal = () => {
    setShowFieldModal(false);
    setSelectedField(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg font-medium">Loading document...</p>
            <p className="text-sm text-muted-foreground mt-2">Please wait while we prepare your document</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !signingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Document Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6">The signing link is invalid or has expired.</p>
            <Button onClick={() => navigate("/")}>Return to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const recipient = signingData.signing_request_recipients[0];
  const isAlreadySigned = recipient?.status === "signed" || hasBeenSigned;
  const isExpired = recipient?.expired_at !== null;

  if (isAlreadySigned || isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-green-600">
              {isExpired ? "Link Expired" : "Already Signed"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-600" />
            <p className="mb-6">
              {isExpired 
                ? "This signing link has expired and is no longer accessible." 
                : "This document has already been signed successfully."
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

  const selectedFieldData = templateFields?.find(field => field.id === selectedField);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {companySettings.logo && (
                <img
                  src={companySettings.logo}
                  alt={companySettings.name}
                  className="h-8 w-8 object-contain"
                />
              )}
              <div>
                <h1 className="font-semibold text-lg">{companySettings.name || 'Document Signing'}</h1>
                <p className="text-sm text-muted-foreground">{signingData.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {completedRequiredFields.length} of {requiredFields.length} required fields completed
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Secure
              </Badge>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span>Progress:</span>
              <div className="flex-1 bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${requiredFields.length > 0 ? (completedRequiredFields.length / requiredFields.length) * 100 : 100}%` }}
                />
              </div>
              <span className="text-xs font-medium">
                {requiredFields.length > 0 ? Math.round((completedRequiredFields.length / requiredFields.length) * 100) : 100}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="relative">
          {/* PDF Viewer */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {signingData.document_templates.name}
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  Tap on the highlighted fields to complete them
                </div>
              </div>
              {signingData.message && (
                <p className="text-sm text-muted-foreground">{signingData.message}</p>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[80vh]">
                {pdfUrl && (
                  <EnhancedPDFViewer
                    pdfUrl={pdfUrl}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    scale={scale}
                    onScaleChange={setScale}
                    className="h-full"
                    showToolbar={true}
                    overlayContent={
                      <>
                        {templateFields
                          ?.filter(field => field.page_number === currentPage)
                          .map((field) => {
                            const isCompleted = field.field_type === "signature" 
                              ? signatures[field.id] 
                              : fieldValues[field.id];
                            
                            return (
                              <div
                                key={field.id}
                                className={`absolute border-2 rounded cursor-pointer flex items-center justify-center text-xs font-medium transition-all hover:scale-105 ${
                                  isCompleted 
                                    ? 'border-green-500 bg-green-100/90 text-green-700' 
                                    : field.is_required 
                                      ? 'border-red-400 bg-red-100/90 text-red-700' 
                                      : 'border-blue-400 bg-blue-100/90 text-blue-700'
                                }`}
                                style={{
                                  left: field.x_position * scale,
                                  top: field.y_position * scale,
                                  width: field.width * scale,
                                  height: field.height * scale,
                                  zIndex: 10
                                }}
                                title={`${field.field_name}${field.is_required ? ' (Required)' : ''}`}
                                onClick={() => handleFieldClick(field.id)}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                  <>
                                    {field.field_type === "signature" ? "✍️" : 
                                     field.field_type === "checkbox" ? "☐" :
                                     field.field_type === "date" ? "📅" : "📝"}
                                    <span className="ml-1 truncate text-xs">
                                      {field.field_name}
                                    </span>
                                  </>
                                )}
                              </div>
                            );
                          })}
                      </>
                    }
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Floating Complete Button */}
          <div className="fixed bottom-6 right-6 z-50">
            <Button
              onClick={handleSubmit}
              disabled={completeSigning.isPending || !isFormComplete || isSigningInProgress}
              size="lg"
              className={`shadow-lg ${
                isFormComplete 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              {completeSigning.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing...
                </>
              ) : isFormComplete ? (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Complete Document
                </>
              ) : (
                <>
                  Complete {requiredFields.length - completedRequiredFields.length} more field{requiredFields.length - completedRequiredFields.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Field Modal */}
      {showFieldModal && selectedFieldData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {selectedFieldData.field_type === "signature" ? (
                    <PenTool className="h-5 w-5" />
                  ) : selectedFieldData.field_type === "checkbox" ? (
                    <Checkbox className="h-5 w-5" />
                  ) : selectedFieldData.field_type === "date" ? (
                    <Calendar className="h-5 w-5" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                  {selectedFieldData.field_name}
                  {selectedFieldData.is_required && <span className="text-red-500">*</span>}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={closeFieldModal}>
                  ✕
                </Button>
              </div>
              {selectedFieldData.placeholder_text && (
                <p className="text-sm text-muted-foreground">{selectedFieldData.placeholder_text}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedFieldData.field_type === "signature" ? (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-1">
                    <SignatureCanvas
                      ref={(ref) => signatureRefs.current[selectedFieldData.id] = ref}
                      canvasProps={{
                        width: 600,
                        height: 200,
                        className: 'signature-canvas w-full h-full bg-background rounded'
                      }}
                      onEnd={() => handleSignature(selectedFieldData.id)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => clearSignature(selectedFieldData.id)}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                    {signatures[selectedFieldData.id] && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Signed
                      </Badge>
                    )}
                  </div>
                </div>
              ) : selectedFieldData.field_type === "checkbox" ? (
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={selectedFieldData.id}
                    checked={fieldValues[selectedFieldData.id] === "true"}
                    onCheckedChange={(checked) => 
                      handleFieldChange(selectedFieldData.id, checked ? "true" : "false")
                    }
                    className="h-5 w-5"
                  />
                  <Label htmlFor={selectedFieldData.id} className="text-sm">
                    {selectedFieldData.placeholder_text || "Check this box"}
                  </Label>
                </div>
              ) : selectedFieldData.field_type === "date" ? (
                <div className="relative">
                  <Input
                    type="date"
                    value={fieldValues[selectedFieldData.id] || ""}
                    onChange={(e) => handleFieldChange(selectedFieldData.id, e.target.value)}
                    placeholder={selectedFieldData.placeholder_text}
                    className="pl-10"
                  />
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              ) : (
                <Input
                  type="text"
                  value={fieldValues[selectedFieldData.id] || ""}
                  onChange={(e) => handleFieldChange(selectedFieldData.id, e.target.value)}
                  placeholder={selectedFieldData.placeholder_text || `Enter ${selectedFieldData.field_name.toLowerCase()}`}
                  className="text-lg"
                />
              )}
              
              <div className="flex gap-2 pt-4">
                <Button onClick={closeFieldModal} className="flex-1">
                  {(selectedFieldData.field_type === "signature" ? signatures[selectedFieldData.id] : fieldValues[selectedFieldData.id]) 
                    ? 'Done' : 'Save'
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Success Modal */}
      {hasBeenSigned && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">Document Signed Successfully!</CardTitle>
              <p className="text-muted-foreground mt-2">
                Thank you for completing the signing process
              </p>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">What happens next?</h3>
                <p className="text-sm text-muted-foreground">
                  A copy of the signed document has been sent to all relevant parties. 
                  You will receive a confirmation email shortly.
                </p>
              </div>
              
              <Button 
                onClick={() => {
                  window.close();
                  if (!window.closed) {
                    navigate("/", { replace: true });
                  }
                }}
                size="lg"
                className="w-full"
              >
                Close Window
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function EmployeeDocumentSigningView() {
  return (
    <CompanyProvider>
      <EmployeeDocumentSigningContent />
    </CompanyProvider>
  );
}