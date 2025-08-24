import { usePermissions } from '@/contexts/PermissionsContext';

export function usePagePermissions() {
  const { hasPageAction, isAdmin } = usePermissions();

  // Employees permissions
  const canViewEmployees = () => isAdmin || hasPageAction('employees', 'view');
  const canCreateEmployees = () => isAdmin || hasPageAction('employees', 'create');
  const canEditEmployees = () => isAdmin || hasPageAction('employees', 'edit');
  const canDeleteEmployees = () => isAdmin || hasPageAction('employees', 'delete');

  // Leaves permissions
  const canViewLeaves = () => isAdmin || hasPageAction('leaves', 'view');
  const canCreateLeaves = () => isAdmin || hasPageAction('leaves', 'create');
  const canEditLeaves = () => isAdmin || hasPageAction('leaves', 'edit');
  const canDeleteLeaves = () => isAdmin || hasPageAction('leaves', 'delete');
  const canApproveLeaves = () => isAdmin || hasPageAction('leaves', 'approve');

  // Documents permissions
  const canViewDocuments = () => isAdmin || hasPageAction('documents', 'view');
  const canCreateDocuments = () => isAdmin || hasPageAction('documents', 'create');
  const canEditDocuments = () => isAdmin || hasPageAction('documents', 'edit');
  const canDeleteDocuments = () => isAdmin || hasPageAction('documents', 'delete');
  const canUploadDocuments = () => isAdmin || hasPageAction('documents', 'upload');

  // Document Signing permissions
  const canViewDocumentSigning = () => isAdmin || hasPageAction('document-signing', 'view');
  const canCreateDocumentSigning = () => isAdmin || hasPageAction('document-signing', 'create');
  const canEditDocumentSigning = () => isAdmin || hasPageAction('document-signing', 'edit');
  const canDeleteDocumentSigning = () => isAdmin || hasPageAction('document-signing', 'delete');
  const canSignDocuments = () => isAdmin || hasPageAction('document-signing', 'sign');

  // Compliance permissions
  const canViewCompliance = () => isAdmin || hasPageAction('compliance', 'view');
  const canCreateCompliance = () => isAdmin || hasPageAction('compliance', 'create');
  const canEditCompliance = () => isAdmin || hasPageAction('compliance', 'edit');
  const canDeleteCompliance = () => isAdmin || hasPageAction('compliance', 'delete');

  // Reports permissions
  const canViewReports = () => isAdmin || hasPageAction('reports', 'view');
  const canGenerateReports = () => isAdmin || hasPageAction('reports', 'generate');
  const canExportReports = () => isAdmin || hasPageAction('reports', 'export');

  // Job Applications permissions
  const canViewJobApplications = () => isAdmin || hasPageAction('job-applications', 'view');
  const canCreateJobApplications = () => isAdmin || hasPageAction('job-applications', 'create');
  const canEditJobApplications = () => isAdmin || hasPageAction('job-applications', 'edit');
  const canDeleteJobApplications = () => isAdmin || hasPageAction('job-applications', 'delete');
  const canReviewJobApplications = () => isAdmin || hasPageAction('job-applications', 'review');

  // Settings permissions
  const canViewSettings = () => isAdmin || hasPageAction('settings', 'view');
  const canEditSettings = () => isAdmin || hasPageAction('settings', 'edit');

  // User Management permissions
  const canViewUserManagement = () => isAdmin || hasPageAction('user-management', 'view');
  const canCreateUsers = () => isAdmin || hasPageAction('user-management', 'create');
  const canEditUsers = () => isAdmin || hasPageAction('user-management', 'edit');
  const canDeleteUsers = () => isAdmin || hasPageAction('user-management', 'delete');

  return {
    // Employees
    canViewEmployees,
    canCreateEmployees,
    canEditEmployees,
    canDeleteEmployees,

    // Leaves
    canViewLeaves,
    canCreateLeaves,
    canEditLeaves,
    canDeleteLeaves,
    canApproveLeaves,

    // Documents
    canViewDocuments,
    canCreateDocuments,
    canEditDocuments,
    canDeleteDocuments,
    canUploadDocuments,

    // Document Signing
    canViewDocumentSigning,
    canCreateDocumentSigning,
    canEditDocumentSigning,
    canDeleteDocumentSigning,
    canSignDocuments,

    // Compliance
    canViewCompliance,
    canCreateCompliance,
    canEditCompliance,
    canDeleteCompliance,

    // Reports
    canViewReports,
    canGenerateReports,
    canExportReports,

    // Job Applications
    canViewJobApplications,
    canCreateJobApplications,
    canEditJobApplications,
    canDeleteJobApplications,
    canReviewJobApplications,

    // Settings
    canViewSettings,
    canEditSettings,

    // User Management
    canViewUserManagement,
    canCreateUsers,
    canEditUsers,
    canDeleteUsers,

    // Generic function for custom checks
    hasPageAction
  };
}