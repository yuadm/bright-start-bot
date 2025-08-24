
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Shield,
  Settings,
  UserCog,
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Briefcase,
  FileSignature,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { usePermissions } from "@/contexts/PermissionsContext";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    description: "Overview & Analytics",
    requiredPage: "/"
  },
  {
    title: "Employees",
    url: "/employees",
    icon: Users,
    description: "Manage Staff",
    requiredPage: "/employees"
  },
  {
    title: "Leaves",
    url: "/leaves",
    icon: Calendar,
    description: "Time Off Management",
    requiredPage: "/leaves"
  },
  {
    title: "Documents",
    url: "/documents",
    icon: FileText,
    description: "Document Tracking",
    requiredPage: "/documents"
  },
  {
    title: "Document Signing",
    url: "/document-signing",
    icon: FileSignature,
    description: "Digital Signatures",
    requiredPage: "/document-signing"
  },
  {
    title: "Compliance",
    url: "/compliance",
    icon: Shield,
    description: "Regulatory Tasks",
    requiredPage: "/compliance"
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
    description: "Analytics & Export",
    requiredPage: "/reports"
  },
  {
    title: "Job Applications",
    url: "/job-applications",
    icon: Briefcase,
    description: "Review Applications",
    requiredPage: "/job-applications"
  },
];

const settingsItems = [
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    description: "System Configuration",
    requiredPage: "/settings"
  },
  {
    title: "User Management",
    url: "/user-management",
    icon: UserCog,
    description: "Roles & Permissions",
    requiredPage: "/user-management"
  },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const { companySettings } = useCompany();
  const { user, userRole, signOut } = useAuth();
  const { hasPageAccess, loading: permissionsLoading, error } = usePermissions();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };

  const getNavClassName = (path: string) => {
    const active = isActive(path);
    return cn(
      "group relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
      "hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5",
      "hover:shadow-sm hover:scale-[1.02]",
      active
        ? "bg-gradient-primary text-primary-foreground shadow-glow"
        : "text-sidebar-foreground hover:text-sidebar-primary"
    );
  };

  // Filter navigation items based on permissions (only when not loading)
  const accessibleNavigationItems = permissionsLoading 
    ? [] 
    : navigationItems.filter(item => hasPageAccess(item.requiredPage));

  const accessibleSettingsItems = permissionsLoading 
    ? [] 
    : settingsItems.filter(item => hasPageAccess(item.requiredPage));

  return (
    <Sidebar
      className={cn(
        "border-r border-sidebar-border bg-gradient-surface transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center overflow-hidden">
                {companySettings.logo ? (
                  <img
                    src={companySettings.logo}
                    alt="Company Logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Shield className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-lg font-bold text-sidebar-foreground">
                  {companySettings.name}
                </h1>
                <p className="text-xs text-sidebar-foreground/60">
                  {companySettings.tagline}
                </p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className={cn(
              "w-8 h-8 p-0 hover:bg-sidebar-accent",
              collapsed && "mx-auto"
            )}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        {permissionsLoading ? (
          <div className="space-y-4">
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-sidebar-accent rounded w-20"></div>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-sidebar-accent rounded"></div>
              ))}
            </div>
            <div className="animate-pulse space-y-2 mt-8">
              <div className="h-4 bg-sidebar-accent rounded w-24"></div>
              {[1, 2].map((i) => (
                <div key={i} className="h-10 bg-sidebar-accent rounded"></div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <div className="text-destructive text-sm mb-2">Failed to load permissions</div>
            <div className="text-xs text-muted-foreground">Please refresh the page</div>
          </div>
        ) : (
          <>
            <SidebarGroup>
              {!collapsed && (
                <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/60 font-semibold mb-2">
                  Main Menu
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {accessibleNavigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={collapsed ? item.title : undefined}>
                        <NavLink to={item.url} className={getNavClassName(item.url)}>
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          {!collapsed && (
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">{item.title}</div>
                              <div className="text-xs opacity-60 truncate">
                                {item.description}
                              </div>
                            </div>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {accessibleSettingsItems.length > 0 && (
              <SidebarGroup className="mt-8">
                {!collapsed && (
                  <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/60 font-semibold mb-2">
                    Administration
                  </SidebarGroupLabel>
                )}
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {accessibleSettingsItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild tooltip={collapsed ? item.title : undefined}>
                          <NavLink to={item.url} className={getNavClassName(item.url)}>
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            {!collapsed && (
                              <div className="flex-1 min-w-0">
                                <div className="font-medium">{item.title}</div>
                                <div className="text-xs opacity-60 truncate">
                                  {item.description}
                                </div>
                              </div>
                            )}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-3 py-3 space-y-2">
        {!collapsed ? (
          <>
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-sidebar-accent/50">
              <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-sidebar-foreground">
                  {user?.email || 'Unknown User'}
                </div>
                <div className="text-xs text-sidebar-foreground/60 capitalize">
                  {userRole || 'user'}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="w-full justify-start gap-3 px-3 py-2 text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </>
        ) : (
          <div className="space-y-2">
            <div className="w-8 h-8 mx-auto rounded-full bg-gradient-primary flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="w-8 h-8 mx-auto p-0 hover:bg-sidebar-accent"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
