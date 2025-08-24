import { useEffect, useState } from "react";
import { Users, Calendar, FileX, Shield, TrendingUp, Clock } from "lucide-react";
import { StatCard } from "./StatCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DocumentCountryMap } from "./DocumentCountryMap";

interface DashboardStats {
  totalEmployees: number;
  leavesThisMonth: number;
  expiringDocuments: number;
  complianceDue: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    leavesThisMonth: 0,
    expiringDocuments: 0,
    complianceDue: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      // Fetch total employees
      const { count: employeeCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true });

      // Fetch leaves this month
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      const { count: leavesCount } = await supabase
        .from('leaves')
        .select('*', { count: 'exact', head: true })
        .gte('start_date', `${currentMonth}-01`)
        .lt('start_date', `${currentMonth}-32`)
        .eq('status', 'approved');

      // Fetch expiring documents (within 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const { count: expiringDocsCount } = await supabase
        .from('document_tracker')
        .select('*', { count: 'exact', head: true })
        .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0])
        .gte('expiry_date', new Date().toISOString().split('T')[0]);

      // Fetch compliance tasks due (simplified - count all records)
      const { count: complianceCount } = await supabase
        .from('compliance_records')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalEmployees: employeeCount || 0,
        leavesThisMonth: leavesCount || 0,
        expiringDocuments: expiringDocsCount || 0,
        complianceDue: complianceCount || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: "Error loading dashboard",
        description: "Could not fetch dashboard statistics. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded-lg w-64"></div>
          <div className="h-5 bg-muted rounded w-96"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2 animate-fade-in">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-lg text-muted-foreground">
          Welcome back! Here's your HR & Compliance overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          description="Active staff members"
          icon={Users}
          variant="default"
          trend={{ value: 12, label: "vs last month" }}
        />
        
        <StatCard
          title="Leaves This Month"
          value={stats.leavesThisMonth}
          description="Approved leave days"
          icon={Calendar}
          variant="success"
          trend={{ value: -5, label: "vs last month" }}
        />
        
        <StatCard
          title="Expiring Documents"
          value={stats.expiringDocuments}
          description="Due within 30 days"
          icon={FileX}
          variant="warning"
          trend={{ value: 3, label: "vs last month" }}
        />
        
        <StatCard
          title="Compliance Tasks"
          value={stats.complianceDue}
          description="Active records"
          icon={Shield}
          variant="danger"
          trend={{ value: -8, label: "vs last month" }}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-premium p-6 space-y-4 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              <p className="text-sm text-muted-foreground">Latest system updates</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-2 h-2 rounded-full bg-success"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">New employee onboarded</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-2 h-2 rounded-full bg-warning"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Document expiring soon</p>
                <p className="text-xs text-muted-foreground">5 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Compliance task completed</p>
                <p className="text-xs text-muted-foreground">1 day ago</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card-premium p-6 space-y-4 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-warning to-warning/80 flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Upcoming Deadlines</h3>
              <p className="text-sm text-muted-foreground">Items requiring attention</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-destructive-soft border border-destructive/20">
              <div>
                <p className="text-sm font-medium text-destructive">BRP Documents Review</p>
                <p className="text-xs text-muted-foreground">3 documents expiring</p>
              </div>
              <span className="text-xs font-medium text-destructive">2 days</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-warning-soft border border-warning/20">
              <div>
                <p className="text-sm font-medium text-warning">Monthly Compliance Check</p>
                <p className="text-xs text-muted-foreground">All branches</p>
              </div>
              <span className="text-xs font-medium text-warning">1 week</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary-soft border border-primary/20">
              <div>
                <p className="text-sm font-medium text-primary">Employee Review Cycle</p>
                <p className="text-xs text-muted-foreground">Q1 evaluations</p>
              </div>
              <span className="text-xs font-medium text-primary">2 weeks</span>
            </div>
          </div>
        </div>

        {/* Documents by Country */}
        <section aria-labelledby="documents-by-country" className="card-premium p-6 space-y-4 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <FileX className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 id="documents-by-country" className="text-lg font-semibold">Documents by Country</h2>
              <p className="text-sm text-muted-foreground">Interactive world map of document distribution</p>
            </div>
          </div>
          <DocumentCountryMap />
        </section>
      </div>
    </div>
  );
}