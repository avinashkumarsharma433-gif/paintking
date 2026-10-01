import React, { useState, useEffect, useRef } from 'react';
import { PortalProvider, usePortalStore } from './context/PortalStoreContext';
import { PortalHeader } from './components/PortalHeader';
import { PortalSidebar, PortalTab, TAB_LABELS } from './components/PortalSidebar';
import { DashboardView } from './views/DashboardView';
import { CustodyHandoverView } from './views/CustodyHandoverView';
import { JobCardsView } from './views/JobCardsView';
import { BillingView } from './views/BillingView';
import { StoresView } from './views/StoresView';
import { QAView } from './views/QAView';
import { PaintMixingView } from './views/PaintMixingView';
import { PackingView } from './views/PackingView';
import { GatePassView } from './views/GatePassView';
import { ProductionOfferingView } from './views/ProductionOfferingView';
import { HRLeaveView } from './views/HRLeaveView';
import { CalibrationView } from './views/CalibrationView';
import { UserRole } from './types/portalTypes';

interface PortalAppProps {
  onBackToWebsite: () => void;
}

const ROLE_DEFAULT_TABS: Record<UserRole, PortalTab> = {
  DIRECTOR: 'dashboard',
  PLANT_HEAD: 'dashboard',
  STORES: 'stores',
  PRODUCTION: 'jobcards',
  QA_QC: 'qa',
  BILLING: 'billing',
  SECURITY: 'gatepass',
  IQC_INSPECTOR: 'qa',
  FPA_IPQC_INSPECTOR: 'qa',
  OQC_PDI_INSPECTOR: 'qa',
  MANAGER_QA: 'qa',
  OPERATOR: 'jobcards',
  HR: 'hr_leave',
  DEPT_INCHARGE: 'hr_leave'
};

const ALL_ROLES: UserRole[] = [
  'DIRECTOR', 'PLANT_HEAD', 'STORES', 'PRODUCTION', 'QA_QC', 
  'BILLING', 'SECURITY', 'IQC_INSPECTOR', 'FPA_IPQC_INSPECTOR', 
  'OQC_PDI_INSPECTOR', 'MANAGER_QA', 'OPERATOR', 'HR', 'DEPT_INCHARGE'
];

const TAB_ALLOWED_ROLES: Record<PortalTab, UserRole[]> = {
  dashboard: ['DIRECTOR', 'PLANT_HEAD'],
  jobcards: ['DIRECTOR', 'PLANT_HEAD', 'PRODUCTION', 'STORES', 'OPERATOR', 'DEPT_INCHARGE'],
  billing: ['DIRECTOR', 'PLANT_HEAD', 'BILLING', 'STORES'],
  stores: ['DIRECTOR', 'PLANT_HEAD', 'STORES', 'IQC_INSPECTOR'],
  paintmixing: ['DIRECTOR', 'PLANT_HEAD', 'PRODUCTION', 'QA_QC', 'MANAGER_QA', 'OPERATOR'],
  qa: ['DIRECTOR', 'PLANT_HEAD', 'QA_QC', 'MANAGER_QA', 'IQC_INSPECTOR', 'FPA_IPQC_INSPECTOR', 'OQC_PDI_INSPECTOR'],
  packing: ['DIRECTOR', 'PLANT_HEAD', 'STORES', 'PRODUCTION', 'QA_QC', 'OQC_PDI_INSPECTOR'],
  gatepass: ['DIRECTOR', 'PLANT_HEAD', 'SECURITY', 'STORES'],
  production_offering: ['DIRECTOR', 'PLANT_HEAD', 'PRODUCTION', 'QA_QC', 'MANAGER_QA', 'FPA_IPQC_INSPECTOR', 'OPERATOR', 'DEPT_INCHARGE'],
  hr_leave: ALL_ROLES,
  calibration: ['DIRECTOR', 'PLANT_HEAD', 'QA_QC', 'MANAGER_QA', 'PRODUCTION', 'STORES', 'FPA_IPQC_INSPECTOR']
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
  activeKey: string;
  onReset: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class PortalErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Portal Module Caught Error:", error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (prevProps.activeKey !== this.props.activeKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 sm:p-8 bg-white rounded-[24px] border border-rose-200 shadow-sm max-w-xl mx-auto my-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center mx-auto font-bold text-xl border border-rose-200">
            ⚠️
          </div>
          <h2 className="text-xl font-serif font-normal text-[#17191c]">Module Loading Exception Caught</h2>
          <p className="text-xs text-[#777b86] leading-relaxed">
            {this.state.error?.message || "An unexpected error occurred while rendering this module."}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              this.props.onReset();
            }}
            className="px-5 py-2.5 rounded-full bg-[#17191c] text-[#c09748] font-bold text-xs cursor-pointer shadow-xs hover:bg-black transition"
          >
            Reset Module & Return to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const PortalInner: React.FC<PortalAppProps> = ({ onBackToWebsite }) => {
  const { currentUser } = usePortalStore();
  
  const [activeTab, setActiveTab] = useState<PortalTab>(() => {
    try {
      const urlTab = new URLSearchParams(window.location.search).get('tab');
      if (urlTab && urlTab in TAB_ALLOWED_ROLES) {
        const isDirectorOrHead = currentUser.role === 'DIRECTOR' || currentUser.role === 'PLANT_HEAD';
        const allowed = TAB_ALLOWED_ROLES[urlTab as PortalTab];
        if (isDirectorOrHead || (allowed && allowed.includes(currentUser.role))) {
          return urlTab as PortalTab;
        }
      }

      const savedTab = localStorage.getItem('pk_portal_active_tab');
      if (savedTab && savedTab in TAB_ALLOWED_ROLES) {
        const isDirectorOrHead = currentUser.role === 'DIRECTOR' || currentUser.role === 'PLANT_HEAD';
        const allowed = TAB_ALLOWED_ROLES[savedTab as PortalTab];
        if (isDirectorOrHead || (allowed && allowed.includes(currentUser.role))) {
          return savedTab as PortalTab;
        }
      }
    } catch (e) {
      // fallback
    }
    return ROLE_DEFAULT_TABS[currentUser.role] || 'dashboard';
  });

  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
  const prevUserRoleRef = useRef<UserRole>(currentUser.role);

  // Sync activeTab to localStorage & URL without reload
  useEffect(() => {
    try {
      localStorage.setItem('pk_portal_active_tab', activeTab);
      const url = new URL(window.location.href);
      url.searchParams.set('tab', activeTab);
      window.history.replaceState(null, '', url.toString());
    } catch (e) {
      // fallback
    }
  }, [activeTab]);

  // When switching persona, auto-navigate to that specific role's primary module & close drawer
  useEffect(() => {
    if (prevUserRoleRef.current !== currentUser.role) {
      prevUserRoleRef.current = currentUser.role;
      const targetTab = ROLE_DEFAULT_TABS[currentUser.role] || 'stores';
      setActiveTab(targetTab);
      setMobileNavOpen(false);
    }
  }, [currentUser.role]);

  // Safety protection: if current tab is not allowed for the active user, redirect to their home tab
  useEffect(() => {
    const isDirectorOrHead = currentUser.role === 'DIRECTOR' || currentUser.role === 'PLANT_HEAD';
    const allowed = TAB_ALLOWED_ROLES[activeTab];
    if (!isDirectorOrHead && (!allowed || !allowed.includes(currentUser.role))) {
      setActiveTab(ROLE_DEFAULT_TABS[currentUser.role] || 'stores');
    }
  }, [currentUser.role, activeTab]);

  const renderActiveTabContent = () => {
    // If a non-director tries to open dashboard, fallback to their default tab
    if (activeTab === 'dashboard' && currentUser.role !== 'DIRECTOR' && currentUser.role !== 'PLANT_HEAD') {
      const fallbackTab = ROLE_DEFAULT_TABS[currentUser.role] || 'stores';
      return renderTabById(fallbackTab);
    }
    return renderTabById(activeTab);
  };

  const renderTabById = (tab: PortalTab) => {
    switch (tab) {
      case 'dashboard':
        return <DashboardView onNavigateTab={(t) => { setActiveTab(t); setMobileNavOpen(false); }} />;
      case 'jobcards':
        return <JobCardsView />;
      case 'billing':
        return <BillingView />;
      case 'stores':
        return <StoresView />;
      case 'paintmixing':
        return <PaintMixingView />;
      case 'qa':
        return <QAView />;
      case 'packing':
        return <PackingView />;
      case 'gatepass':
        return <GatePassView />;
      case 'production_offering':
        return <ProductionOfferingView />;
      case 'hr_leave':
        return <HRLeaveView />;
      case 'calibration':
        return <CalibrationView />;
      default:
        return <DashboardView onNavigateTab={(t) => { setActiveTab(t); setMobileNavOpen(false); }} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafb] text-[#17191c] font-sans antialiased selection:bg-[#faf3e0] selection:text-[#8a6521]">
      <PortalHeader 
        onBackToWebsite={onBackToWebsite} 
        onToggleMobileNav={() => setMobileNavOpen(prev => !prev)}
        activeTabLabel={TAB_LABELS[activeTab] || 'Dashboard'}
      />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        <PortalSidebar 
          activeTab={activeTab} 
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setMobileNavOpen(false);
          }}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
        />

        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 max-w-7xl mx-auto w-full">
          <PortalErrorBoundary 
            activeKey={activeTab} 
            onReset={() => setActiveTab(ROLE_DEFAULT_TABS[currentUser.role] || 'stores')}
          >
            {renderActiveTabContent()}
          </PortalErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export const PortalApp: React.FC<PortalAppProps> = ({ onBackToWebsite }) => {
  return (
    <PortalProvider>
      <PortalInner onBackToWebsite={onBackToWebsite} />
    </PortalProvider>
  );
};
