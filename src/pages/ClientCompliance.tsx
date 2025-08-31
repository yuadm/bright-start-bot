import { useParams, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ClientCompliancePeriodView } from "@/components/clients/ClientCompliancePeriodView";
import { ArrowLeft, Calendar, CheckCircle, Clock, AlertTriangle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ComplianceType {
  id: string;
  name: string;
  description: string;
  frequency: string;
}

interface ComplianceStats {
  totalClients: number;
  completedClients: number;
  dueClients: number;
  overdueClients: number;
  pendingClients: number;
  completionRate: number;
}

interface BranchStats {
  branchName: string;
  completionRate: number;
  totalClients: number;
  completedClients: number;
}

export default function ClientCompliance() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<ComplianceStats>({
    totalClients: 0,
    completedClients: 0,
    dueClients: 0,
    overdueClients: 0,
    pendingClients: 0,
    completionRate: 0
  });
  const [branchStats, setBranchStats] = useState<BranchStats[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<string>("");
  const [loading, setLoading] = useState(true);
  
  const complianceType = location.state?.complianceType as ComplianceType;

  useEffect(() => {
    if (id && complianceType) {
      fetchComplianceStats();
    }
  }, [id, complianceType]);

  const getCurrentPeriod = () => {
    const now = new Date();
    switch (complianceType.frequency.toLowerCase()) {
      case 'quarterly':
        return `${now.getFullYear()}-Q${Math.ceil((now.getMonth() + 1) / 3)}`;
      case 'annual':
        return now.getFullYear().toString();
      case 'monthly':
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      default:
        return now.getFullYear().toString();
    }
  };

  const fetchComplianceStats = async () => {
    try {
      setLoading(true);
      const period = getCurrentPeriod();
      setCurrentPeriod(period);

      // Fetch all clients
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select(`
          *,
          branches (
            name
          )
        `)
        .eq('is_active', true);

      if (clientsError) throw clientsError;

      // Fetch compliance records for current period
      const { data: records, error: recordsError } = await supabase
        .from('client_compliance_period_records')
        .select('*')
        .eq('client_compliance_type_id', id)
        .eq('period_identifier', period);

      if (recordsError) throw recordsError;

      // Calculate overall stats
      const totalClients = clients?.length || 0;
      const completedRecords = records?.filter(r => r.status === 'completed') || [];
      const pendingRecords = records?.filter(r => r.status === 'pending') || [];
      const overdueRecords = records?.filter(r => r.status === 'overdue') || [];
      
      const completedClients = completedRecords.length;
      const pendingClients = pendingRecords.length;
      const overdueClients = overdueRecords.length;
      const dueClients = totalClients - completedClients;
      const completionRate = totalClients > 0 ? (completedClients / totalClients) * 100 : 0;

      setStats({
        totalClients,
        completedClients,
        dueClients,
        overdueClients,
        pendingClients,
        completionRate
      });

      // Calculate branch stats
      const branchMap = new Map<string, { total: number; completed: number; name: string }>();
      
      clients?.forEach(client => {
        const branchName = client.branches?.name || 'Unassigned';
        if (!branchMap.has(client.branch_id || 'unassigned')) {
          branchMap.set(client.branch_id || 'unassigned', {
            total: 0,
            completed: 0,
            name: branchName
          });
        }
        const branch = branchMap.get(client.branch_id || 'unassigned')!;
        branch.total++;

        const clientRecord = records?.find(r => r.client_id === client.id);
        if (clientRecord?.status === 'completed') {
          branch.completed++;
        }
      });

      const branchStatsArray: BranchStats[] = Array.from(branchMap.entries()).map(([_, data]) => ({
        branchName: data.name,
        completionRate: data.total > 0 ? (data.completed / data.total) * 100 : 0,
        totalClients: data.total,
        completedClients: data.completed
      }));

      setBranchStats(branchStatsArray);
    } catch (error) {
      console.error('Error fetching compliance stats:', error);
      toast({
        title: "Error loading data",
        description: "Could not fetch compliance statistics.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!id || !complianceType) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/compliance')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Compliance
          </Button>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-4">Compliance Type Not Found</h1>
            <p className="text-muted-foreground">The requested compliance type could not be found.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-xl"></div>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/compliance')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Compliance
          </Button>
          
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold text-primary">{complianceType.name}</h1>
            <p className="text-muted-foreground">{complianceType.description}</p>
          </div>
        </div>

        {/* Compliance Requirements Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Compliance Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Frequency */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Frequency</p>
                <Badge className="bg-primary/10 text-primary border-primary/20 capitalize">
                  {complianceType.frequency}
                </Badge>
              </div>

              {/* Current Period */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Current Period</p>
                <p className="text-lg font-semibold">{currentPeriod}</p>
              </div>

              {/* Client Compliance */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Client Compliance</p>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{stats.completedClients}/{stats.totalClients}</p>
                  <p className="text-sm text-muted-foreground">{stats.completionRate.toFixed(0)}% compliant</p>
                </div>
              </div>

              {/* Branch Completion */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Branch Completion</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {branchStats.map((branch, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{branch.branchName}</span>
                      <span className="font-medium">{branch.completionRate.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-success/5 border-success/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-success/10">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-success">{stats.completedClients}</p>
                  <p className="text-sm text-muted-foreground">Compliant</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-warning/5 border-warning/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-warning/10">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-warning">{stats.dueClients}</p>
                  <p className="text-sm text-muted-foreground">Due</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-destructive/5 border-destructive/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-destructive/10">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive">{stats.overdueClients}</p>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/5 border-muted/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-muted/10">
                  <Users className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-muted-foreground">{stats.pendingClients}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Period View */}
        <ClientCompliancePeriodView 
          complianceTypeId={id}
          complianceTypeName={complianceType.name}
          frequency={complianceType.frequency}
        />
      </div>
    </MainLayout>
  );
}