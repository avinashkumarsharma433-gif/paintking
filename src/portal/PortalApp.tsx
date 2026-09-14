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
import { MncAuditView } from './views/MncAuditView';
import { Capa8DView } from './views/Capa8DView';
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
  IQC_INSPECTOR: 'stores',
  FPA_IPQC_INSPECTOR: 'qa',
  OQC_PDI_INSPECTOR: 'packing',
  MANAGER_QA: 'mnc_audit',
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
  handovers: ['DIRECTOR', 'PLANT_HEAD', 'PRODUCTION', 'QA_QC', 'MANAGER_QA', 'FPA_IPQC_INSPECTOR', 'DEPT_INCHARGE'],
  jobcards: ['DIRECTOR', 'PLANT_HEAD', 'PRODUCTION', 'STORES', 'OPERATOR', 'DEPT_INCHARGE'],
  billing: ['DIRECTOR', 'PLANT_HEAD', 'BILLING', 'STORES'],
  stores: ['DIRECTOR', 'PLANT_HEAD', 'STORES', 'IQC_INSPECTOR'],
  paintmixing: ['DIRECTOR', 'PLANT_HEAD', 'PRODUCTION', 'QA_QC', 'MANAGER_QA', 'OPERATOR'],
  qa: ['DIRECTOR', 'PLANT_HEAD', 'QA_QC', 'MANAGER_QA', 'IQC_INSPECTOR', 'FPA_IPQC_INSPECTOR', 'OQC_PDI_INSPECTOR'],
  packing: ['DIRECTOR', 'PLANT_HEAD', 'STORES', 'PRODUCTION', 'QA_QC', 'OQC_PDI_INSPECTOR'],
  gatepass: ['DIRECTOR', 'PLANT_HEAD', 'SECURITY', 'STORES'],
  mnc_audit: ALL_ROLES,
  capa_8d: ['DIRECTOR', 'PLANT_HEAD', 'QA_QC', 'MANAGER_QA', 'PRODUCTION', 'FPA_IPQC_INSPECTOR', 'OQC_PDI_INSPECTOR'],
  production_offering: ['DIRECTOR', 'PLANT_HEAD', 'PRODUCTION', 'QA_QC', 'MANAGER_QA', 'FPA_IPQC_INSPECTOR', 'OPERATOR', 'DEPT_INCHARGE'],
  hr_leave: ALL_ROLES,
  calibration: ['DIRECTOR', 'PLANT_HEAD', 'QA_QC', 'MANAGER_QA', 'PRODUCTION', 'STORES', 'FPA_IPQC_INSPECTOR']
};

const PortalInner: React.FC<PortalAppProps> = ({ onBackToWebsite }) => {
  const { currentUser } = usePortalStore();
  const [activeTab, setActiveTab] = useState<PortalTab>(() => ROLE_DEFAULT_TABS[currentUser.role] || 'dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
  const prevUserRoleRef = useRef<UserRole>(currentUser.role);

  // When switching persona, auto-navigate to that specific role's primary module & close drawer
  useEffect(() => {
    if (prevUserRoleRef.current !== currentUser.role) {
      prevUserRoleRef.current = currentUser.role;
      setActiveTab(ROLE_DEFAULT_TABS[currentUser.role] || 'stores');
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
      case 'handovers':
        return <CustodyHandoverView />;
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
      case 'mnc_audit':
        return <MncAuditView />;
      case 'capa_8d':
        return <Capa8DView />;
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
          {renderActiveTabContent()}
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
