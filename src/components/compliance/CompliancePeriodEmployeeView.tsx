import { useState, useEffect } from "react";
import { Calendar, Users, CheckCircle, AlertTriangle, Clock, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/contexts/CompanyContext";

interface Employee {
  id: string;
  name: string;
  branch: string;
}

interface ComplianceRecord {
  id: string;
  employee_id: string;
  period_identifier: string;
  completion_date: string;
  notes: string;
  status: string;
  created_at: string;
  updated_at: string;
  completed_by: string | null;
  completion_method?: string;
}

interface EmployeeComplianceStatus {
  employee: Employee;
  record: ComplianceRecord | null;
  status: 'compliant' | 'overdue' | 'due' | 'pending';
}

interface CompliancePeriodEmployeeViewProps {
  complianceTypeId: string;
  complianceTypeName: string;
  periodIdentifier: string;
  frequency: string;
  trigger: React.ReactNode;
}

export function CompliancePeriodEmployeeView({ 
  complianceTypeId, 
  complianceTypeName, 
  periodIdentifier, 
  frequency,
  trigger 
}: CompliancePeriodEmployeeViewProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [employeeStatusList, setEmployeeStatusList] = useState<EmployeeComplianceStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { companySettings } = useCompany();

  const fetchData = async () => {
    if (!open) return;
    
    try {
      setLoading(true);
      
      // Fetch all employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, name, branch')
        .order('name');

      if (employeesError) throw employeesError;

      // Fetch compliance records for this type and period
      const { data: recordsData, error: recordsError } = await supabase
        .from('compliance_period_records')
        .select('*')
        .eq('compliance_type_id', complianceTypeId)
        .eq('period_identifier', periodIdentifier)
        .order('completion_date', { ascending: false });

      if (recordsError) throw recordsError;

      setEmployees(employeesData || []);
      setRecords(recordsData || []);
      
      // Calculate employee compliance status for this specific period
      calculateEmployeeStatus(employeesData || [], recordsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error loading data",
        description: "Could not fetch employee and compliance data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateEmployeeStatus = (employeesData: Employee[], recordsData: ComplianceRecord[]) => {
    const statusList: EmployeeComplianceStatus[] = employeesData.map(employee => {
      // Find the record for this employee in this specific period
      const record = recordsData.find(record => record.employee_id === employee.id);

      let status: 'compliant' | 'overdue' | 'due' | 'pending' = 'pending';

      if (record) {
        // A record is compliant if it has a completion_date or status is completed
        if (record.status === 'completed' || record.completion_date) {
          status = 'compliant';
        } else if (record.status === 'overdue') {
          status = 'overdue';
        } else {
          status = 'due';
        }
      } else {
        // Check if we're past the period (this would be overdue)
        const now = new Date();
        const isOverdue = isPeriodOverdue(periodIdentifier, frequency, now);
        status = isOverdue ? 'overdue' : 'due';
      }

      return {
        employee,
        record: record || null,
        status
      };
    });

    setEmployeeStatusList(statusList);
  };

  const isPeriodOverdue = (periodIdentifier: string, frequency: string, currentDate: Date): boolean => {
    const now = currentDate;
    
    switch (frequency.toLowerCase()) {
      case 'annual': {
        const year = parseInt(periodIdentifier);
        const endOfYear = new Date(year, 11, 31); // December 31st
        return now > endOfYear;
      }
      case 'monthly': {
        const [year, month] = periodIdentifier.split('-').map(Number);
        const endOfMonth = new Date(year, month, 0); // Last day of the month
        return now > endOfMonth;
      }
      case 'quarterly': {
        const [year, quarterStr] = periodIdentifier.split('-');
        const quarter = parseInt(quarterStr.replace('Q', ''));
        const endMonth = quarter * 3; // Q1=3, Q2=6, Q3=9, Q4=12
        const endOfQuarter = new Date(parseInt(year), endMonth, 0); // Last day of quarter
        return now > endOfQuarter;
      }
      case 'bi-annual': {
        const [year, halfStr] = periodIdentifier.split('-');
        const half = parseInt(halfStr.replace('H', ''));
        const endMonth = half === 1 ? 6 : 12;
        const endOfHalf = new Date(parseInt(year), endMonth, 0);
        return now > endOfHalf;
      }
      default:
        return false;
    }
  };

  const getStatusBadge = (status: 'compliant' | 'overdue' | 'due' | 'pending') => {
    switch (status) {
      case 'compliant':
        return <Badge className="bg-success/10 text-success border-success/20">Compliant</Badge>;
      case 'overdue':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Overdue</Badge>;
      case 'due':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Due</Badge>;
      case 'pending':
        return <Badge className="bg-muted text-muted-foreground border-border">Pending</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground border-border">{status}</Badge>;
    }
  };

  const getStatusColor = (status: 'compliant' | 'overdue' | 'due' | 'pending') => {
    switch (status) {
      case 'compliant':
        return 'bg-success/5 border-success/20';
      case 'overdue':
        return 'bg-destructive/5 border-destructive/20';
      case 'due':
        return 'bg-warning/5 border-warning/20';
      default:
        return '';
    }
  };

  // Calculate stats for this period
  const compliantCount = employeeStatusList.filter(item => item.status === 'compliant').length;
  const overdueCount = employeeStatusList.filter(item => item.status === 'overdue').length;
  const dueCount = employeeStatusList.filter(item => item.status === 'due').length;
  const pendingCount = employeeStatusList.filter(item => item.status === 'pending').length;

  useEffect(() => {
    fetchData();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {complianceTypeName} - {periodIdentifier}
          </DialogTitle>
          <DialogDescription>
            Employee compliance status for this specific period
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-muted rounded-xl"></div>
              ))}
            </div>
            <div className="h-64 bg-muted rounded-xl"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="card-premium border-success/20 bg-gradient-to-br from-success-soft to-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Compliant</p>
                      <p className="text-2xl font-bold text-success">{compliantCount}</p>
                    </div>
                    <CheckCircle className="w-6 h-6 text-success" />
                  </div>
                </CardContent>
              </Card>

              <Card className="card-premium border-warning/20 bg-gradient-to-br from-warning-soft to-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Due</p>
                      <p className="text-2xl font-bold text-warning">{dueCount}</p>
                    </div>
                    <Clock className="w-6 h-6 text-warning" />
                  </div>
                </CardContent>
              </Card>

              <Card className="card-premium border-destructive/20 bg-gradient-to-br from-destructive-soft to-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                      <p className="text-2xl font-bold text-destructive">{overdueCount}</p>
                    </div>
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                  </div>
                </CardContent>
              </Card>

              <Card className="card-premium border-muted/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold text-muted-foreground">{pendingCount}</p>
                    </div>
                    <Users className="w-6 h-6 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Employee Table */}
            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Users className="w-6 h-6" />
                  Employee Status ({employees.length} total)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Completion Date</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeStatusList.map((item) => (
                      <TableRow key={item.employee.id} className={getStatusColor(item.status)}>
                        <TableCell className="font-medium">
                          {item.employee.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item.employee.branch}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(item.status)}
                        </TableCell>
                        <TableCell>
                          {item.record ? (() => {
                            const date = new Date(item.record.completion_date);
                            return isNaN(date.getTime()) 
                              ? item.record.completion_date 
                              : date.toLocaleDateString();
                          })() : '-'}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="flex items-center gap-2">
                            <div className="truncate" title={(() => {
                              if (!item.record?.notes) return '';
                              if (item.record?.completion_method === 'supervision') {
                                try {
                                  const j = JSON.parse(item.record.notes);
                                  const txt = (j?.freeTextNotes || '').toString().trim();
                                  return txt || '';
                                } catch {
                                  return '';
                                }
                              }
                              if (item.record?.completion_method === 'annual_appraisal') {
                                try {
                                  const j = JSON.parse(item.record.notes);
                                  const txt = (j?.freeTextNotes || '').toString().trim();
                                  return txt || '';
                                } catch {
                                  return '';
                                }
                              }
                              return item.record?.notes || '';
                            })()}>
                              {(() => {
                                if (!item.record?.notes) return '-';
                                if (item.record?.completion_method === 'supervision') {
                                  try {
                                    const j = JSON.parse(item.record.notes);
                                    const txt = (j?.freeTextNotes || '').toString().trim();
                                    return txt || '-';
                                  } catch {
                                    return '-';
                                  }
                                }
                                if (item.record?.completion_method === 'annual_appraisal') {
                                  try {
                                    const j = JSON.parse(item.record.notes);
                                    const txt = (j?.freeTextNotes || '').toString().trim();
                                    return txt || '-';
                                  } catch {
                                    return '-';
                                  }
                                }
                                return item.record?.notes || '-';
                              })()}
                            </div>
                            {item.record?.completion_method === 'annual_appraisal' && item.record?.status === 'completed' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (item.record?.notes) {
                                      try {
                                        const parsedData = JSON.parse(item.record.notes);
                                        // Import the PDF generator
                                        import('@/lib/annual-appraisal-pdf').then(({ generateAnnualAppraisalPDF }) => {
                                          generateAnnualAppraisalPDF(parsedData, item.employee.name, {
                                            name: companySettings?.name || 'Company',
                                            logo: companySettings?.logo
                                          });
                                        });
                                      } catch (error) {
                                        console.error('Error generating PDF:', error);
                                      }
                                    }
                                  }}
                                  className="h-6 w-6 p-0"
                                  title="View Record"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (item.record?.notes) {
                                      try {
                                        const parsedData = JSON.parse(item.record.notes);
                                        // Import the PDF generator
                                        import('@/lib/annual-appraisal-pdf').then(({ generateAnnualAppraisalPDF }) => {
                                          generateAnnualAppraisalPDF(parsedData, item.employee.name, {
                                            name: companySettings?.name || 'Company',
                                            logo: companySettings?.logo
                                          });
                                        });
                                      } catch (error) {
                                        console.error('Error generating PDF:', error);
                                      }
                                    }
                                  }}
                                  className="h-6 w-6 p-0"
                                  title="Download PDF"
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}