import React from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import {
  LayoutDashboard,
  ArrowRightLeft,
  Briefcase,
  ReceiptText,
  Boxes,
  Pipette,
  CheckCircle2,
  PackageCheck,
  ShieldCheck,
  X,
  Building2,
  Clock,
  ShieldAlert,
  ClipboardList,
  UserCheck,
  Wrench,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type PortalTab = 
  | 'dashboard'
  | 'handovers'
  | 'jobcards'
  | 'billing'
  | 'stores'
  | 'paintmixing'
  | 'qa'
  | 'packing'
  | 'gatepass'
  | 'mnc_audit'
  | 'capa_8d'
  | 'production_offering'
  | 'hr_leave'
  | 'calibration';

export const TAB_LABELS: Record<PortalTab, string> = {
  dashboard: 'Executive Cockpit',
  handovers: 'Stage Handover',
  jobcards: 'Job Cards & Colors',
  billing: 'Billing & PO Rec',
  stores: 'Stores & Inward GRN',
  paintmixing: 'Paint Mixing Lab',
  qa: 'Quality Gate (FPA & IPQC)',
  packing: 'Packing & Box QR',
  gatepass: 'Gate Pass Security',
  mnc_audit: 'MNC Audit (100-Q)',
  capa_8d: '8D CAPA & 4M',
  production_offering: 'Production Offering',
  hr_leave: 'HR Leave Desk',
  calibration: 'Equipment Calibration'
};

interface PortalSidebarProps {
  activeTab: PortalTab;
  onSelectTab: (tab: PortalTab) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const PortalSidebar: React.FC<PortalSidebarProps> = ({ 
  activeTab, 
  onSelectTab,
  mobileOpen = false,
  onCloseMobile 
}) => {
  const { currentUser, unresolvedHandoversCount, openOverrunCount, activePlant, activeShift } = usePortalStore();

  const navItems = [
    {
      id: 'dashboard' as PortalTab,
      label: 'Executive Cockpit',
      docCode: 'PK-SYS-DSH-001',
      icon: LayoutDashboard,
      badge: null,
      roles: ['DIRECTOR', 'PLANT_HEAD']
    },
    {
      id: 'handovers' as PortalTab,
      label: 'Stage Handover',
      docCode: 'PK-PRD-TRF-001',
      icon: ArrowRightLeft,
      badge: unresolvedHandoversCount > 0 ? `${unresolvedHandoversCount} Loss Alert` : null,
      badgeColor: 'bg-red-500/15 border border-red-500/30 text-red-700',
      highlight: true,
      roles: ['DIRECTOR', 'PLANT_HEAD', 'PRODUCTION', 'QA_QC']
    },
    {
      id: 'jobcards' as PortalTab,
      label: 'Job Cards & Colors',
      docCode: 'PK-PRD-JCR-001',
      icon: Briefcase,
      badge: openOverrunCount > 0 ? 'Color Over-run' : null,
      badgeColor: 'bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521]',
      roles: ['DIRECTOR', 'PLANT_HEAD', 'PRODUCTION', 'STORES']
    },
    {
      id: 'billing' as PortalTab,
      label: 'Billing & PO Rec',
      docCode: 'PK-ACC-INV-001',
      icon: ReceiptText,
      badge: 'Billed on Passed',
      badgeColor: 'bg-emerald-50 border border-emerald-200 text-emerald-800',
      roles: ['DIRECTOR', 'PLANT_HEAD', 'BILLING', 'STORES']
    },
    {
      id: 'stores' as PortalTab,
      label: 'Stores & Inward GRN',
      docCode: 'PK-STR-GRN-001',
      icon: Boxes,
      badge: null,
      roles: ['DIRECTOR', 'PLANT_HEAD', 'STORES']
    },
    {
      id: 'paintmixing' as PortalTab,
      label: 'Paint Mixing & Lab',
      docCode: 'PK-PRD-PMX-001',
      icon: Pipette,
      badge: null,
      roles: ['DIRECTOR', 'PLANT_HEAD', 'PRODUCTION', 'QA_QC']
    },
    {
      id: 'qa' as PortalTab,
      label: 'Quality Gate (FPA & IPQC)',
      docCode: 'PK-QA-FPA-001',
      icon: CheckCircle2,
      badge: 'ΔE ≤ 0.70',
      badgeColor: 'bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521]',
      roles: ['DIRECTOR', 'PLANT_HEAD', 'QA_QC']
    },
    {
      id: 'packing' as PortalTab,
      label: 'Packing & Box QR',
      docCode: 'PK-STR-PKG-001',
      icon: PackageCheck,
      badge: null,
      roles: ['DIRECTOR', 'PLANT_HEAD', 'STORES', 'PRODUCTION', 'QA_QC']
    },
    {
      id: 'gatepass' as PortalTab,
      label: 'Gate Pass Security',
      docCode: 'PK-ADM-GTP-001',
      icon: ShieldCheck,
      badge: null,
      roles: ['DIRECTOR', 'PLANT_HEAD', 'SECURITY', 'STORES']
    },
    {
      id: 'mnc_audit' as PortalTab,
      label: 'MNC Audit (100-Q)',
      docCode: 'PK-MNC-AUD-V2',
      icon: Award,
      badge: 'Audit Ready',
      badgeColor: 'bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521]',
      roles: ['DIRECTOR', 'PLANT_HEAD', 'QA_QC', 'MANAGER_QA', 'PRODUCTION', 'STORES', 'IQC_INSPECTOR', 'FPA_IPQC_INSPECTOR', 'OQC_PDI_INSPECTOR', 'HR', 'DEPT_INCHARGE', 'SECURITY', 'BILLING', 'OPERATOR']
    },
    {
      id: 'capa_8d' as PortalTab,
      label: '8D CAPA & 4M',
      docCode: 'PK-QA-8D-001',
      icon: ShieldAlert,
      badge: '5-Why / Root',
      badgeColor: 'bg-rose-50 border border-rose-200 text-rose-800',
      roles: ['DIRECTOR', 'PLANT_HEAD', 'QA_QC', 'MANAGER_QA', 'PRODUCTION', 'FPA_IPQC_INSPECTOR', 'OQC_PDI_INSPECTOR']
    },
    {
      id: 'production_offering' as PortalTab,
      label: 'Production Offering',
      docCode: 'PK-PRD-OFF-01',
      icon: ClipboardList,
      badge: '4-Tier Sign',
      badgeColor: 'bg-blue-50 border border-blue-200 text-blue-800',
      roles: ['DIRECTOR', 'PLANT_HEAD', 'PRODUCTION', 'QA_QC', 'MANAGER_QA', 'FPA_IPQC_INSPECTOR', 'OPERATOR']
    },
    {
      id: 'hr_leave' as PortalTab,
      label: 'HR Leave Desk',
      docCode: 'PK-HR-LV-01',
      icon: UserCheck,
      badge: null,
      roles: ['DIRECTOR', 'PLANT_HEAD', 'HR', 'DEPT_INCHARGE', 'PRODUCTION', 'STORES', 'QA_QC', 'MANAGER_QA', 'OPERATOR', 'SECURITY', 'BILLING', 'IQC_INSPECTOR', 'FPA_IPQC_INSPECTOR', 'OQC_PDI_INSPECTOR']
    },
    {
      id: 'calibration' as PortalTab,
      label: 'Equipment Calibration',
      docCode: 'PK-MTN-CAL-01',
      icon: Wrench,
      badge: 'NABL Certified',
      badgeColor: 'bg-emerald-50 border border-emerald-200 text-emerald-800',
      roles: ['DIRECTOR', 'PLANT_HEAD', 'QA_QC', 'MANAGER_QA', 'PRODUCTION', 'STORES', 'FPA_IPQC_INSPECTOR']
    }
  ];

  const visibleItems = navItems.filter(item => 
    currentUser.role === 'DIRECTOR' || 
    currentUser.role === 'PLANT_HEAD' || 
    item.roles.includes(currentUser.role)
  );

  const handleTabClick = (id: PortalTab) => {
    onSelectTab(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navContent = (
    <>
      {/* Current Workspace User Card */}
      <div className="p-4 border-b border-[#ececec] bg-[#fafafb]">
        <div className="text-[10px] uppercase font-bold text-[#777b86] tracking-[0.18em] mb-1.5 flex items-center justify-between">
          <span>Active Workspace</span>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]">
            {currentUser.role}
          </span>
        </div>
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white border border-[#ececec] shadow-sm">
          <div className="w-2 h-2 rounded-full bg-[#c09748] animate-pulse shrink-0" />
          <span className="text-xs font-semibold text-[#17191c] truncate">
            {currentUser.roleTitle}
          </span>
        </div>
      </div>

      <nav className="p-3 space-y-1.5 overflow-y-auto flex-1 custom-scrollbar">
        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full text-left transition group cursor-pointer ${
                isActive
                  ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] font-semibold shadow-xs'
                  : 'text-[#777b86] hover:bg-[#fafafb] hover:text-[#17191c]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#c09748]' : 'text-[#777b86] group-hover:text-[#17191c]'}`} />
                <div className="truncate">
                  <div className="text-xs leading-tight">{item.label}</div>
                  <div className={`text-[10px] font-mono tracking-tight ${isActive ? 'text-[#8a6521]/80' : 'text-[#979799]'}`}>
                    {item.docCode}
                  </div>
                </div>
              </div>

              {item.badge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                  isActive ? 'bg-[#c09748] text-[#17191c]' : item.badgeColor
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ISO QMS Standard Footer in Sidebar */}
      <div className="p-4 border-t border-[#ececec] bg-[#fafafb] text-[10px] text-[#777b86] font-mono space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[#17191c] font-semibold">Controlled QMS • Rev 00</span>
          <span className="text-[#c09748] font-bold">{activePlant}</span>
        </div>
        <div className="text-[9px] text-[#a3a6af]">ISO 9001:2015 & IATF-16949 Certified</div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Permanent Left Sidebar */}
      <aside className="hidden lg:flex lg:w-64 bg-white border-r border-[#ececec] flex-col shrink-0 h-full">
        {navContent}
      </aside>

      {/* Mobile Slide-out Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 lg:hidden cursor-pointer"
            />

            {/* Slide-in Drawer Container */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="fixed inset-y-0 left-0 w-[290px] sm:w-[320px] max-w-[85vw] bg-white border-r border-[#ececec] flex flex-col z-50 shadow-2xl lg:hidden overflow-hidden"
            >
              {/* Drawer Top Header with Close Button */}
              <div className="p-3.5 border-b border-[#ececec] bg-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src="/logo.svg" alt="PaintKing" className="h-6 w-auto" />
                  <span className="text-[10px] font-mono font-bold text-[#8a6521] bg-[#faf3e0] px-2 py-0.5 rounded-full border border-[#f4e5be]">
                    OPERATIONS OS
                  </span>
                </div>
                <button
                  onClick={onCloseMobile}
                  className="p-1.5 rounded-full hover:bg-[#f2f2f3] text-[#777b86] hover:text-[#17191c] cursor-pointer transition"
                  aria-label="Close navigation drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {navContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
