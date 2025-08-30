
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DateTextPicker } from "@/components/ui/date-text-picker";
import { AlertTriangle, CheckCircle, Clock, Edit, Save, X } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import countries from "world-countries";

interface Document {
  id: string;
  employee_id: string;
  document_type_id: string;
  branch_id: string;
  document_number?: string;
  issue_date?: string;
  expiry_date: string;
  status: string;
  notes?: string;
  country?: string;
  nationality_status?: string;
  employees?: {
    name: string;
    email: string;
    branch: string;
  };
  document_types?: {
    name: string;
  };
}

interface Employee {
  id: string;
  name: string;
  email: string;
  branch: string;
  sponsored?: boolean;
  twenty_hours?: boolean;
}

interface DocumentType {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
}

interface DocumentViewDialogProps {
  document: Document | null;
  open: boolean;
  onClose: () => void;
  employees: Employee[];
  documentTypes: DocumentType[];
  branches: Branch[];
  onSave?: () => void;
}

const COUNTRY_NAMES = countries.map((c) => c.name.common).sort();

export function DocumentViewDialog({ 
  document, 
  open, 
  onClose, 
  employees, 
  documentTypes, 
  branches, 
  onSave 
}: DocumentViewDialogProps) {
  const [employeeDocuments, setEmployeeDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [sponsored, setSponsored] = useState(false);
  const [twentyHours, setTwentyHours] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (document && open) {
      fetchEmployeeDocuments(document.employee_id);
    }
  }, [document, open]);

  useEffect(() => {
    if (editingDoc && employees.length > 0) {
      const employee = employees.find(emp => emp.id === editingDoc.employee_id);
      if (employee) {
        setSponsored(employee.sponsored || false);
        setTwentyHours(employee.twenty_hours || false);
      }
    }
  }, [editingDoc, employees]);

  const fetchEmployeeDocuments = async (employeeId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('document_tracker')
        .select(`
          *,
          employees (name, email, branch),
          document_types (name)
        `)
        .eq('employee_id', employeeId);

      if (error) throw error;
      setEmployeeDocuments(data || []);
    } catch (error) {
      console.error('Error fetching employee documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (doc: Document) => {
    setEditingDocId(doc.id);
    setEditingDoc({ ...doc });
  };

  const handleCancelEdit = () => {
    setEditingDocId(null);
    setEditingDoc(null);
  };

  const handleSaveEdit = async () => {
    if (!editingDoc) return;

    try {
      // Determine document status based on expiry date
      let status = "valid";
      if (!isNaN(Date.parse(editingDoc.expiry_date))) {
        const expiryDate = new Date(editingDoc.expiry_date);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        
        if (daysUntilExpiry < 0) {
          status = "expired";
        } else if (daysUntilExpiry <= 30) {
          status = "expiring";
        }
      }

      // Update document
      const { error: docError } = await supabase
        .from('document_tracker')
        .update({
          employee_id: editingDoc.employee_id,
          document_type_id: editingDoc.document_type_id,
          document_number: editingDoc.document_number,
          issue_date: editingDoc.issue_date,
          expiry_date: editingDoc.expiry_date,
          country: editingDoc.country,
          nationality_status: editingDoc.nationality_status,
          notes: editingDoc.notes,
          status: status
        })
        .eq('id', editingDoc.id);

      if (docError) throw docError;

      // Update employee sponsored/twenty_hours status if changed
      const employee = employees.find(emp => emp.id === editingDoc.employee_id);
      if (employee && (employee.sponsored !== sponsored || employee.twenty_hours !== twentyHours)) {
        const { error: empError } = await supabase
          .from('employees')
          .update({
            sponsored: sponsored,
            twenty_hours: twentyHours
          })
          .eq('id', editingDoc.employee_id);

        if (empError) throw empError;
      }

      toast({
        title: "Success",
        description: "Document updated successfully",
      });

      setEditingDocId(null);
      setEditingDoc(null);
      fetchEmployeeDocuments(editingDoc.employee_id);
      if (onSave) onSave();
    } catch (error) {
      console.error('Error updating document:', error);
      toast({
        title: "Error",
        description: "Failed to update document",
        variant: "destructive"
      });
    }
  };

  const handleEmployeeChange = (employeeId: string) => {
    if (!editingDoc) return;
    
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
      setEditingDoc({
        ...editingDoc,
        employee_id: employeeId,
      });
      setSponsored(employee.sponsored || false);
      setTwentyHours(employee.twenty_hours || false);
    }
  };

  const handleDocumentTypeChange = async (docTypeId: string) => {
    if (!editingDoc) return;

    setEditingDoc({
      ...editingDoc,
      document_type_id: docTypeId,
    });

    // Auto-populate fields from similar document if exists
    try {
      const { data: similarDocs } = await supabase
        .from('document_tracker')
        .select('*')
        .eq('employee_id', editingDoc.employee_id)
        .eq('document_type_id', docTypeId)
        .neq('id', editingDoc.id)
        .limit(1);

      if (similarDocs && similarDocs.length > 0) {
        const similarDoc = similarDocs[0];
        setEditingDoc(prev => prev ? {
          ...prev,
          country: prev.country || similarDoc.country,
          nationality_status: prev.nationality_status || similarDoc.nationality_status,
        } : null);
      }
    } catch (error) {
      console.error('Error fetching similar documents:', error);
    }
  };

  if (!document) return null;

  const getStatusBadge = (document: Document) => {
    // If expiry_date is not a valid date (text entry), show as valid
    if (isNaN(Date.parse(document.expiry_date))) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Valid
      </Badge>;
    }

    const expiryDate = new Date(document.expiry_date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (daysUntilExpiry < 0) {
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Expired
      </Badge>;
    } else if (daysUntilExpiry <= 30) {
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        <Clock className="w-3 h-3 mr-1" />
        Expiring ({daysUntilExpiry} days)
      </Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Valid
      </Badge>;
    }
  };

  const renderDocumentCard = (doc: Document) => {
    const isEditing = editingDocId === doc.id;
    
    if (isEditing && editingDoc) {
      return (
        <div key={doc.id} className="p-4 border rounded-lg space-y-4 bg-muted/50">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">
              <Select
                value={editingDoc.document_type_id}
                onValueChange={handleDocumentTypeChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </h4>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdit}>
                <Save className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Employee</label>
              <Select
                value={editingDoc.employee_id}
                onValueChange={handleEmployeeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} - {employee.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Document Number</label>
              <Input
                value={editingDoc.document_number || ''}
                onChange={(e) => setEditingDoc({
                  ...editingDoc,
                  document_number: e.target.value
                })}
                placeholder="Enter document number"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Issue Date</label>
              <DateTextPicker
                value={editingDoc.issue_date || ''}
                onChange={(date) => setEditingDoc({
                  ...editingDoc,
                  issue_date: typeof date === 'string' ? date : (date ? date.toISOString().split('T')[0] : '')
                })}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Expiry Date *</label>
              <DateTextPicker
                value={editingDoc.expiry_date}
                onChange={(date) => setEditingDoc({
                  ...editingDoc,
                  expiry_date: typeof date === 'string' ? date : (date ? date.toISOString().split('T')[0] : editingDoc.expiry_date)
                })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Country</label>
              <Select
                value={editingDoc.country || ''}
                onValueChange={(value) => setEditingDoc({
                  ...editingDoc,
                  country: value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_NAMES.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Nationality Status</label>
              <Select
                value={editingDoc.nationality_status || ''}
                onValueChange={(value) => setEditingDoc({
                  ...editingDoc,
                  nationality_status: value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="National">National</SelectItem>
                  <SelectItem value="Non-National">Non-National</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Textarea
              value={editingDoc.notes || ''}
              onChange={(e) => setEditingDoc({
                ...editingDoc,
                notes: e.target.value
              })}
              placeholder="Add any notes..."
              className="min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`sponsored-${doc.id}`}
                checked={sponsored}
                onChange={(e) => setSponsored(e.target.checked)}
                className="rounded"
              />
              <label htmlFor={`sponsored-${doc.id}`} className="text-sm font-medium">
                Sponsored Employee
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`twenty-hours-${doc.id}`}
                checked={twentyHours}
                onChange={(e) => setTwentyHours(e.target.checked)}
                className="rounded"
              />
              <label htmlFor={`twenty-hours-${doc.id}`} className="text-sm font-medium">
                20 Hours Restriction
              </label>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={doc.id} className="p-4 border rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">{doc.document_types?.name}</h4>
          <div className="flex items-center gap-2">
            {getStatusBadge(doc)}
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleEdit(doc)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Document Number:</span>
            <p className="font-mono">{doc.document_number || 'N/A'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Expiry Date:</span>
            <p>{isNaN(Date.parse(doc.expiry_date)) ? doc.expiry_date : new Date(doc.expiry_date).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Issue Date:</span>
            <p>{doc.issue_date ? (isNaN(Date.parse(doc.issue_date)) ? doc.issue_date : new Date(doc.issue_date).toLocaleDateString()) : 'N/A'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Country:</span>
            <p>{doc.country || 'N/A'}</p>
          </div>
        </div>

        <div className="text-sm">
          <span className="text-muted-foreground">Nationality Status:</span>
          <p>{doc.nationality_status || 'N/A'}</p>
        </div>

        {doc.notes && (
          <div className="text-sm">
            <span className="text-muted-foreground">Notes:</span>
            <p className="mt-1">{doc.notes}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Document Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Employee Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Employee</label>
              <p className="text-sm font-medium">{document.employees?.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-sm break-all">{document.employees?.email || 'N/A'}</p>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Branch</label>
              <p className="text-sm">{document.employees?.branch}</p>
            </div>
          </div>

          {/* All Document Types for Employee */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">All Document Types</label>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading documents...</p>
            ) : (
              <div className="space-y-4 mt-2">
                {employeeDocuments.map(renderDocumentCard)}
                {employeeDocuments.length === 0 && (
                  <p className="text-sm text-muted-foreground">No documents found for this employee.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
