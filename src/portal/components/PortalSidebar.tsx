import React, { useState, useEffect } from 'react';
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
  ClipboardList,
  UserCheck,
  Wrench,
  ChevronRight,
  Paintbrush
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type PortalTab = 
  | 'dashboard'
  | 'handovers'
  | 'jobcards'
  | 'painter_desk'
  | 'billing'
  | 'stores'
  | 'paintmixing'
  | 'qa'
  | 'packing'
  | 'gatepass'
  | 'production_offering'
  | 'hr_leave'
  | 'calibration';

export const TAB_LABELS: Record<PortalTab, string> = {
  dashboard: 'Executive Cockpit',
  handovers: 'Stage Handover',
  jobcards: 'Job Cards & Batches',
  painter_desk: 'Painter Floor Desk (Kiosk)',
  billing: 'Billing & PO Rec',
  stores: 'Stores & Inward GRN',
  paintmixing: 'Paint Mixing Lab',
  qa: 'Incoming Quality Control (IQC)',
  packing: 'Packing & Box QR',
  gatepass: 'Gate Security & Inward',
  production_offering: 'Production Offering',
  hr_leave: 'HR Leave Desk',
  calibration: 'Equipment Calibration'
};

interface SubMenuItem {
  label: string;
  subTab: string;
}

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
  const { 
    currentUser, 
    unresolvedHandoversCount, 
    openOverrunCount, 
    pendingVerificationJobsCount,
    activePlant, 
    isPlantDayClosed,
    activeSubTab,
    setActiveSubTab
  } = usePortalStore();

  // Accordion open/close state for each module
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    [activeTab]: true
  });

  // Auto-expand current activeTab
  useEffect(() => {
    setExpandedSections(prev => ({
      ...prev,
      [activeTab]: true
    }));
  }, [activeTab]);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const navItems: Array<{
    id: PortalTab;
    label: string;
    subtitle: string;
    docCode: string;
    icon: any;
    badge: string | null;
    badgeColor?: string;
    highlight?: boolean;
    roles: string[];
    subItems: SubMenuItem[];
  }> = [
    {
      id: 'dashboard',
      label: 'Executive Cockpit',
      subtitle: 'Director & Plant KPI',
      docCode: 'PK-SYS-DSH-001',
      icon: LayoutDashboard,
      badge: null,
      roles: ['DIRECTOR', 'PLANT_HEAD'],
      subItems: [
        { label: 'Plant Operations & Throughput', subTab: 'OPERATIONS' },
        { label: 'Stage Loss & Reconciliation KPI', subTab: 'LOSS_KPI' },
        { label: 'Customer PO & Revenue Health', subTab: 'REVENUE' },
        { label: 'Shift Closure & EOD Status', subTab: 'EOD_STATUS' }
      ]
    },
    {
      id: 'jobcards',
      label: 'Job Cards & Batches',
      subtitle: '3-Painter Line & Colors',
      docCode: 'PK-PRD-JCR-001',
      icon: Briefcase,
      badge: openOverrunCount > 0 ? 'Color Over-run' : null,
      badgeColor: 'bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521]',
      roles: ['DIRECTOR', 'PLANT_HEAD', 'PRODUCTION', 'STORES'],
      subItems: [
        { label: 'All Job Cards (Master & Child)', subTab: 'ALL' },
        { label: 'Master Batches (Doc No: 001)', subTab: 'MASTER' },
        { label: '3-Painter Splits (P1 / P2 / P3)', subTab: 'PAINTERS' },
        { label: 'Rework & Salvage Recovery', subTab: 'REWORK' },
        { label: 'Store Demands & Arriving (MRN)', subTab: 'REQUISITIONS' },
        { label: 'Available Store Stock', subTab: 'STORE_STOCK' },
        { label: 'Painting Lines & Spray Booth Fleet', subTab: 'BOOTH_FLEET' }
      ]
    },
    {
      id: 'painter_desk',
      label: 'Painter Floor Desk',
      subtitle: 'Booth Touch Kiosk & Handshake',
      docCode: 'PK-PRD-FLR-001',
      icon: Paintbrush,
      badge: pendingVerificationJobsCount > 0 ? `${pendingVerificationJobsCount} Verification` : 'Max 2 Jobs Limit',
      badgeColor: pendingVerificationJobsCount > 0 ? 'bg-amber-100 border border-amber-300 text-amber-800' : 'bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521]',
      roles: ['DIRECTOR', 'PLANT_HEAD', 'PRODUCTION', 'OPERATOR', 'DEPT_INCHARGE'],
      subItems: [
        { label: 'Pending Work (Active Queue)', subTab: 'PENDING' },
        { label: 'Completed Work (History)', subTab: 'COMPLETED' }
      ]
    },
    {
      id: 'billing',
      label: 'Billing & PO Rec',
      subtitle: 'Commercial Invoicing & PO Balances',
      docCode: 'PK-ACC-INV-001',
      icon: ReceiptText,
      badge: 'Billed on Passed',
      badgeColor: 'bg-emerald-50 border border-emerald-200 text-emerald-800',
      roles: ['DIRECTOR', 'PLANT_HEAD', 'BILLING', 'STORES'],
      subItems: [
        { label: 'Tax Invoices (Section 31)', subTab: 'TAX_INVOICE' },
        { label: 'Delivery Challans (Rule 55)', subTab: 'DELIVERY_CHALLAN' },
        { label: 'PDI Passed Clearance Queue', subTab: 'PDI_CLEARED' },
        { label: 'Customer PO Reconciliation', subTab: 'PO_RECON' }
      ]
    },
    {
      id: 'stores',
      label: 'Stores & Inward GRN',
      subtitle: 'Stock Balances & Material Demands',
      docCode: 'PK-STR-GRN-001',
      icon: Boxes,
      badge: null,
      roles: ['DIRECTOR', 'PLANT_HEAD', 'STORES'],
      subItems: [
        { label: '1. Material Stock Tracker', subTab: 'TRACKER' },
        { label: '2. Production Demands (MRN)', subTab: 'REQUISITIONS' },
        { label: '3. Issued Slips (MIN History)', subTab: 'ISSUED_SLIPS' },
        { label: '4. Shelf-Life & Aging Watch', subTab: 'SHELF_LIFE' },
        { label: '5. Pending Inwards (Awaiting GRN)', subTab: 'PENDING' }
      ]
    },
    {
      id: 'paintmixing',
      label: 'Paint Mixing Lab',
      subtitle: 'Formulation, Viscosity & Pot-Life',
      docCode: 'PK-PRD-PMX-001',
      icon: Pipette,
      badge: null,
      roles: ['DIRECTOR', 'PLANT_HEAD', 'PRODUCTION', 'QA_QC'],
      subItems: [
        { label: 'Shade Formulations & Recipes', subTab: 'RECIPES' },
        { label: 'Ford Cup 4 Viscosity Checks', subTab: 'VISCOSITY' },
        { label: '2K Pot-Life & Expiry Watch', subTab: 'POT_LIFE' },
        { label: 'Thinner Ratio Compliance', subTab: 'THINNER' }
      ]
    },
    {
      id: 'qa',
      label: 'Incoming Quality Control (IQC)',
      subtitle: '7-Aspect Inward Gate & 20% Sampling',
      docCode: 'PK-QA-IQC-001',
      icon: CheckCircle2,
      badge: 'IQC Gate',
      badgeColor: 'bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521]',
      roles: ['DIRECTOR', 'PLANT_HEAD', 'QA_QC', 'MANAGER_QA', 'IQC_INSPECTOR'],
      subItems: [
        { label: '1. Pending Inwards (Awaiting IQC)', subTab: 'PENDING' },
        { label: '2. Completed Jobs (IQC Reports & PDF)', subTab: 'COMPLETED' }
      ]
    },
    {
      id: 'packing',
      label: 'Packing & Box QR',
      subtitle: 'Carton Barcoding & Traceability',
      docCode: 'PK-STR-PKG-001',
      icon: PackageCheck,
      badge: null,
      roles: ['DIRECTOR', 'PLANT_HEAD', 'STORES', 'PRODUCTION', 'QA_QC'],
      subItems: [
        { label: 'Box Packing Slips & QR Codes', subTab: 'PACKING_SLIPS' },
        { label: 'Barcode Traceability Scan', subTab: 'TRACEABILITY' },
        { label: 'Final Lot Palletization', subTab: 'PALLET' }
      ]
    },
    {
      id: 'gatepass',
      label: 'Gate Pass Security',
      subtitle: 'Inward & Outward Gate Passes',
      docCode: 'PK-ADM-GTP-001',
      icon: ShieldCheck,
      badge: null,
      roles: ['DIRECTOR', 'PLANT_HEAD', 'SECURITY', 'STORES'],
      subItems: [
        { label: 'Inward Gate Pass (RGP / NRGP)', subTab: 'INWARD' },
        { label: 'Outward Gate Pass (OGP)', subTab: 'OUTWARD' },
        { label: 'Vehicle & Transporter Log', subTab: 'GATE_PASS' }
      ]
    },
    {
      id: 'production_offering',
      label: 'Production Offering',
      subtitle: '4-Tier Inspection Sign-off',
      docCode: 'PK-PRD-OFF-01',
      icon: ClipboardList,
      badge: '4-Tier Sign',
      badgeColor: 'bg-blue-50 border border-blue-200 text-blue-800',
      roles: ['DIRECTOR', 'PLANT_HEAD', 'PRODUCTION', 'QA_QC', 'MANAGER_QA', 'FPA_IPQC_INSPECTOR', 'OPERATOR'],
      subItems: [
        { label: 'Line Clearance Offering Slip', subTab: 'OFFERING_SLIP' },
        { label: 'Tier 1: Operator Check', subTab: 'TIER_1' },
        { label: 'Tier 2: QC Inspector Sign', subTab: 'TIER_2' },
        { label: 'Tier 3: Line Supervisor Sign', subTab: 'TIER_3' },
        { label: 'Tier 4: Production Head Sign', subTab: 'TIER_4' }
      ]
    },
    {
      id: 'hr_leave',
      label: 'HR Leave Desk',
      subtitle: 'Attendance & Plant Shift Governance',
      docCode: 'PK-HR-LV-01',
      icon: UserCheck,
      badge: null,
      roles: ['DIRECTOR', 'PLANT_HEAD', 'HR', 'DEPT_INCHARGE', 'PRODUCTION', 'STORES', 'QA_QC', 'MANAGER_QA', 'OPERATOR', 'SECURITY', 'BILLING', 'IQC_INSPECTOR', 'FPA_IPQC_INSPECTOR', 'OQC_PDI_INSPECTOR'],
      subItems: [
        { label: 'Leave Application & Balance', subTab: 'LEAVE_APP' },
        { label: 'Shift Attendance (08:30–18:30)', subTab: 'ATTENDANCE' },
        { label: 'Operator Deployment Roster', subTab: 'ROSTER' }
      ]
    },
    {
      id: 'calibration',
      label: 'Equipment Calibration',
      subtitle: 'NABL Certified Gauges & Ovens',
      docCode: 'PK-MTN-CAL-01',
      icon: Wrench,
      badge: 'NABL Certified',
      badgeColor: 'bg-emerald-50 border border-emerald-200 text-emerald-800',
      roles: ['DIRECTOR', 'PLANT_HEAD', 'QA_QC', 'MANAGER_QA', 'PRODUCTION', 'STORES', 'FPA_IPQC_INSPECTOR'],
      subItems: [
        { label: 'Master Equipment Register', subTab: 'EQUIPMENT_REG' },
        { label: 'DFT & Gloss Meter Calibration', subTab: 'GAUGES' },
        { label: 'Calibration Due & Recertification', subTab: 'CAL_DUE' }
      ]
    }
  ];

  const visibleItems = navItems.filter(item => 
    currentUser.role === 'DIRECTOR' || 
    currentUser.role === 'PLANT_HEAD' || 
    item.roles.includes(currentUser.role)
  );

  const handleTabClick = (item: typeof navItems[0]) => {
    onSelectTab(item.id);
    if (item.subItems.length > 0) {
      setActiveSubTab(item.subItems[0].subTab);
    }
    setExpandedSections(prev => ({
      ...prev,
      [item.id]: true
    }));
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleSubItemClick = (id: PortalTab, subTabKey: string) => {
    onSelectTab(id);
    setActiveSubTab(subTabKey);
    setExpandedSections(prev => ({
      ...prev,
      [id]: true
    }));
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navContent = (
    <>
      {/* Current Workspace User Card */}
      <div className="p-3.5 border-b border-[#ececec] bg-[#fafafb]">
        <div className="text-[10px] uppercase font-bold text-[#777b86] tracking-[0.18em] mb-1.5 flex items-center justify-between">
          <span>Active Workspace</span>
          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]">
            {currentUser.role}
          </span>
        </div>
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white border border-[#ececec] shadow-xs">
          <div className="w-2 h-2 rounded-full bg-[#c09748] animate-pulse shrink-0" />
          <span className="text-xs font-semibold text-[#17191c] truncate">
            {currentUser.roleTitle}
          </span>
        </div>
      </div>

      {/* Navigation Modules List */}
      <nav className="p-3 space-y-2 overflow-y-auto flex-1 custom-scrollbar">
        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isExpanded = !!expandedSections[item.id];

          return (
            <div
              key={item.id}
              className={`rounded-[16px] transition border overflow-hidden ${
                isActive
                  ? 'border-[#f4e5be] bg-white shadow-xs ring-1 ring-[#c09748]/30'
                  : 'border-[#f2f2f3] bg-white hover:border-[#ececec]'
              }`}
            >
              {/* Main Card Header */}
              <div
                className={`w-full flex items-center justify-between p-2.5 transition select-none cursor-pointer ${
                  isActive ? 'bg-[#faf7ed]' : 'hover:bg-[#fafafb]'
                }`}
                onClick={() => handleTabClick(item)}
              >
                <div className="flex items-start gap-2.5 flex-1 min-w-0 pr-1">
                  <div className={`mt-0.5 p-1.5 rounded-[10px] shrink-0 transition ${
                    isActive ? 'bg-[#c09748] text-white shadow-xs' : 'bg-gray-100 text-[#777b86]'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold leading-tight text-[#17191c]">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold shrink-0 tracking-tight ${item.badgeColor || 'bg-gray-100 text-gray-700'}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {/* Clear, dedicated subtitle row - never cluttered */}
                    <div className="text-[10px] text-[#777b86] font-mono leading-tight mt-0.5 truncate">
                      <span className="font-semibold text-[#8a6521]">{item.docCode}</span>
                      <span className="mx-1 text-gray-300">•</span>
                      <span>{item.subtitle}</span>
                    </div>
                  </div>
                </div>

                {/* Right Expand/Collapse Chevron (>) button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSection(item.id);
                  }}
                  className={`p-1.5 rounded-full hover:bg-black/5 text-[#777b86] hover:text-[#17191c] transition shrink-0 cursor-pointer ml-1 ${
                    isExpanded ? 'text-[#c09748]' : ''
                  }`}
                  aria-label="Toggle sub-options"
                  title="Toggle sub-options"
                >
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-90 text-[#c09748]' : ''}`} />
                </button>
              </div>

              {/* Expandable Sub-options List */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden bg-[#fafafb] border-t border-[#ececec]/60"
                  >
                    <div className="py-1.5 px-2.5 pl-8 space-y-0.5">
                      {item.subItems.map((sub, sIdx) => {
                        const isSubActive = isActive && (
                          activeSubTab === sub.subTab || 
                          (!activeSubTab && sIdx === 0) ||
                          (item.id === 'qa' && (activeSubTab === 'IQC' || !activeSubTab) && sub.subTab === 'PENDING')
                        );
                        return (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => handleSubItemClick(item.id, sub.subTab)}
                            className={`w-full text-left py-1.5 px-2.5 rounded-lg text-[11px] flex items-center justify-between gap-2 transition cursor-pointer group ${
                              isSubActive
                                ? 'bg-[#faf3e0] text-[#8a6521] font-bold border border-[#f4e5be]'
                                : 'text-[#777b86] hover:text-[#17191c] hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition ${
                                isSubActive ? 'bg-[#c09748]' : 'bg-gray-400 group-hover:bg-[#c09748]'
                              }`} />
                              <span className="truncate leading-snug">{sub.label}</span>
                            </div>
                            {isSubActive && (
                              <span className="text-[9px] font-mono text-[#c09748] shrink-0 font-bold">
                                Active
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* ISO QMS Standard Footer in Sidebar */}
      <div className="p-3.5 border-t border-[#ececec] bg-[#fafafb] text-[10px] text-[#777b86] font-mono space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[#17191c] font-semibold">Controlled QMS • Rev 00</span>
          <span className="text-[#c09748] font-bold">{activePlant}</span>
        </div>
        <div className="flex items-center justify-between text-[9px]">
          <span className="text-[#777b86]">Day Shift (08:30–18:30)</span>
          <span className={`px-1.5 py-0.2 rounded-full font-bold ${
            isPlantDayClosed ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-800'
          }`}>
            {isPlantDayClosed ? 'EOD Locked' : 'Active'}
          </span>
        </div>
        <div className="text-[9px] text-[#a3a6af]">ISO 9001:2015 & IATF-16949 Certified</div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Permanent Left Sidebar */}
      <aside className="hidden lg:flex lg:w-72 xl:w-80 bg-white border-r border-[#ececec] flex-col shrink-0 h-full">
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
              className="fixed inset-y-0 left-0 w-[310px] sm:w-[340px] max-w-[88vw] bg-white border-r border-[#ececec] flex flex-col z-50 shadow-2xl lg:hidden overflow-hidden"
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
