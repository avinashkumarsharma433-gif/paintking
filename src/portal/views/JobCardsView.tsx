import React, { useState, useEffect, useMemo, useRef } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { JobCard, DefectCategory, MaterialRequisitionNote, RequisitionStatus, PlantHeadPriorityAssignment, ProductionPriorityLevel, PaintingBooth, PainterProfile } from '../types/portalTypes';
import { 
  AlertTriangle, 
  Plus, 
  Printer, 
  FileText, 
  CheckCircle2, 
  Layers, 
  Send, 
  Clock, 
  ShieldCheck, 
  Split, 
  RotateCcw, 
  Users, 
  Search, 
  CheckCircle, 
  Filter, 
  ChevronDown, 
  ChevronRight, 
  TrendingUp, 
  AlertOctagon, 
  Sparkles, 
  ArrowRightLeft,
  ArrowRight, 
  PackageCheck, 
  AlertCircle, 
  ShoppingCart,
  Package,
  Eye,
  Building2,
  Settings,
  Sliders,
  Trash2,
  X,
  Check,
  Paintbrush,
  FlaskConical,
  Pipette,
  Download,
  Lock,
  Flag,
  Calendar,
  Zap,
  Edit,
  UserCheck,
  UserX
} from 'lucide-react';
import { JobCardModal } from '../components/JobCardModal';
import { PreProductionInspectionModal } from '../components/PreProductionInspectionModal';
import { FPAModal } from '../components/FPAModal';
import { IPQCModal } from '../components/IPQCModal';
import { BoothConfigModal } from '../components/BoothConfigModal';
import { PainterConfigModal } from '../components/PainterConfigModal';
import { PainterDetailProfileView } from './PainterDetailProfileView';
import { downloadStandardPreProductionPdf, downloadStandardFPAPdf, downloadStandardIPQCPdf, downloadStandardJobCardPdf } from '../utils/pdfStandardHeader';
import { BalanceReturnModal } from '../components/BalanceReturnModal';

interface FilterOption {
  value: string;
  label: string;
  badge?: string | number;
  icon?: React.ReactNode;
}

const PortalFilterSelect: React.FC<{
  value: string;
  onChange: (val: string) => void;
  options: FilterOption[];
  icon: React.ReactNode;
  placeholder?: string;
  className?: string;
  searchable?: boolean;
}> = ({
  value,
  onChange,
  options,
  icon,
  placeholder = 'Select...',
  className = '',
  searchable = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value) || options[0];
  const isFiltered = value !== 'ALL';

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const term = searchTerm.toLowerCase();
    return options.filter(opt => opt.label.toLowerCase().includes(term));
  }, [options, searchTerm]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[40px] px-3.5 rounded-[14px] text-xs font-medium cursor-pointer border transition flex items-center justify-between gap-2 shadow-2xs ${
          isFiltered
            ? 'bg-[#faf7ed] border-[#c09748] text-[#8a6521] font-semibold ring-1 ring-[#c09748]/30'
            : isOpen
            ? 'bg-white border-[#c09748] text-[#17191c] ring-1 ring-[#c09748]/20'
            : 'bg-[#fafafb] hover:bg-white border-[#ececec] text-[#17191c]'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <div className="shrink-0">{icon}</div>
          <span className="truncate text-xs">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedOption?.badge !== undefined && selectedOption.badge !== '' && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                isFiltered
                  ? 'bg-[#c09748] text-white'
                  : 'bg-[#f2f2f3] text-[#777b86]'
              }`}
            >
              {selectedOption.badge}
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#777b86] transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#17191c]' : ''
            }`}
          />
        </div>
      </button>

      {/* Floating Luxury Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-full min-w-[240px] max-w-[340px] bg-white rounded-[18px] border border-[#ececec] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.16)] p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
          {searchable && options.length > 5 && (
            <div className="relative p-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#777b86]" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                autoFocus
                onClick={e => e.stopPropagation()}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-[10px] bg-[#fafafb] border border-[#ececec] text-[#17191c] placeholder:text-[#a3a6af] focus:outline-none focus:border-[#c09748] focus:bg-white transition"
              />
            </div>
          )}

          <div className="max-h-60 overflow-y-auto no-scrollbar space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-[#777b86]">
                No matching options
              </div>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`w-full px-3 py-2 rounded-[12px] text-xs flex items-center justify-between gap-2 cursor-pointer transition text-left ${
                      isSelected
                        ? 'bg-[#faf7ed] text-[#8a6521] font-bold border border-[#f4e5be]'
                        : 'hover:bg-[#fafafb] text-[#17191c] font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-[#c09748] shrink-0" />
                      ) : (
                        opt.icon && <div className="shrink-0">{opt.icon}</div>
                      )}
                      <span className="truncate">{opt.label}</span>
                    </div>

                    {opt.badge !== undefined && opt.badge !== '' && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono shrink-0 font-medium ${
                          isSelected
                            ? 'bg-[#c09748] text-white font-bold'
                            : 'bg-[#f2f2f3] text-[#777b86]'
                        }`}
                      >
                        {opt.badge}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const JobCardsView: React.FC = () => {
  const {
    jobCards,
    plantHeadPriorities = [],
    updatePriorityStatus, 
    universalJobs, 
    grnList,
    preProductionReports,
    addPreProductionReport,
    fpaRecords,
    ipqcRecords,
    updateJobCardSprayed, 
    defects, 
    activePlant, 
    canStartBulkProduction,
    splitJobCardToPainters,
    routeToRework,
    isPlantDayClosed,
    materialRequisitions,
    createMaterialRequisition,
    acceptMaterialRequisition,
    updateJobCardStageReceipt,
    currentUser,
    activeSubTab,
    setActiveSubTab,
    paintingBooths,
    addPaintingBooth,
    updatePaintingBooth,
    deletePaintingBooth,
    toggleBoothStatus,
    painters,
    addPainter,
    updatePainter,
    deletePainter,
    togglePainterStatus,
    getPainterActiveJobCount,
    canAssignPainter,
    assignJobCardToPainter,
    verifyAndAcceptJob,
    rejectAndRequestRework,
    getPainterPerformanceStats,
    pendingVerificationJobsCount,
    requestNextDayTarget
  } = usePortalStore();

  // Multi-Day Shift Quota Modal State
  const [showNextQuotaModal, setShowNextQuotaModal] = useState<boolean>(false);
  const [selectedJcForQuota, setSelectedJcForQuota] = useState<JobCard | null>(null);
  const [nextQuotaInput, setNextQuotaInput] = useState<number>(2000);

  // Active filter tab: PRIORITY_QUEUE, ALL, REQUISITIONS, BOOTH_FLEET
  const [activeTab, setActiveTab] = useState<'PRIORITY_QUEUE' | 'ALL' | 'REQUISITIONS' | 'BOOTH_FLEET'>('ALL');

  // Quality Gates: 1. PIR (Pre-Production Substrate), 2. FPA (Golden Gate), 3. IPQC Line Modal States
  const [showPirModal, setShowPirModal] = useState<boolean>(false);
  const [selectedJcForPir, setSelectedJcForPir] = useState<JobCard | null>(null);
  const [showFpaModal, setShowFpaModal] = useState<boolean>(false);
  const [selectedJcForFpa, setSelectedJcForFpa] = useState<JobCard | null>(null);
  const [showIpqcModal, setShowIpqcModal] = useState<boolean>(false);
  const [selectedJcForIpqc, setSelectedJcForIpqc] = useState<JobCard | null>(null);

  // Painter SLA Performance Details Modal State
  const [selectedPainterForSlaModal, setSelectedPainterForSlaModal] = useState<any | null>(null);

  // Synchronize with sidebar sub-item clicks
  useEffect(() => {
    if (activeSubTab === 'PRIORITY_QUEUE' || activeSubTab === 'ALL' || activeSubTab === 'REQUISITIONS' || activeSubTab === 'BOOTH_FLEET') {
      setActiveTab(activeSubTab as any);
    } else if (activeSubTab === 'PAINTERS' || activeSubTab === 'REWORK') {
      setActiveTab('ALL');
    }
  }, [activeSubTab]);

  const handleSelectTab = (tab: 'PRIORITY_QUEUE' | 'ALL' | 'REQUISITIONS' | 'BOOTH_FLEET') => {
    setActiveTab(tab);
    setActiveSubTab(tab);
  };

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stockClientFilter, setStockClientFilter] = useState<string>('ALL');

  // Job Cards Multi-Filters State (Painter, Active Client, Status)
  const [painterFilter, setPainterFilter] = useState<string>('ALL');
  const [customerFilter, setCustomerFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [selectedJobCardForProgress, setSelectedJobCardForProgress] = useState<JobCard | null>(null);
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
  const [addedSprayed, setAddedSprayed] = useState<number>(50);
  const [addedReject, setAddedReject] = useState<number>(2);
  const [selectedDefectCategory, setSelectedDefectCategory] = useState<string>('D02');

  // Company Consumables Batch Consumption State (Litres)
  const [paintConsumedInput, setPaintConsumedInput] = useState<number>(0.8);
  const [thinnerConsumedInput, setThinnerConsumedInput] = useState<number>(0.3);
  const [hardenerConsumedInput, setHardenerConsumedInput] = useState<number>(0.2);
  const [clearConsumedInput, setClearConsumedInput] = useState<number>(0.3);

  // 3-Painter Split Modal State
  const [showSplitModal, setShowSplitModal] = useState<boolean>(false);
  const [selectedMasterForSplit, setSelectedMasterForSplit] = useState<JobCard | null>(null);
  const [p1Painter, setP1Painter] = useState<string>('Ramesh Kumar (P1)');
  const [p2Painter, setP2Painter] = useState<string>('Suresh Verma (P2)');
  const [p3Painter, setP3Painter] = useState<string>('Mahesh Sharma (P3)');
  const [p1Qty, setP1Qty] = useState<number>(0);
  const [p2Qty, setP2Qty] = useState<number>(0);
  const [p3Qty, setP3Qty] = useState<number>(0);

  // Available Floor Painter Profiles
  const availablePainters = [
    'Ramesh Kumar (P1)',
    'Suresh Verma (P2)',
    'Mahesh Sharma (P3)',
    'Kailash Yadav (Senior Coating Tech)',
    'Raju Painter (Booth Specialist)',
    'Vikram Singh (PU Spray Tech)'
  ];

  // Rework Routing Modal State
  const [showReworkModal, setShowReworkModal] = useState<boolean>(false);
  const [selectedCardForRework, setSelectedCardForRework] = useState<JobCard | null>(null);
  const [reworkQty, setReworkQty] = useState<number>(10);
  const [reworkDefect, setReworkDefect] = useState<DefectCategory>('dust_nibs');
  const [reworkInstruction, setReworkInstruction] = useState<string>('De-nib with P1500 wet sandpaper, wipe clean with solvent, re-apply clear lacquer and bake at 65°C for 30m.');

  // Job Card Create/View Modal State
  const [showJobCardModal, setShowJobCardModal] = useState<boolean>(false);
  const [selectedJobCardForView, setSelectedJobCardForView] = useState<JobCard | null>(null);

  // Balance Return to Store Modal State
  const [showReturnModal, setShowReturnModal] = useState<boolean>(false);
  const [jobCardForReturn, setJobCardForReturn] = useState<string | undefined>(undefined);

  // Expanded master cards for sub-tree view
  const [expandedMasterIds, setExpandedMasterIds] = useState<Record<string, boolean>>({
    'JC-1042-RED': true
  });

  // Floor Booth / Line Fleet & Painter Fleet Modals
  const [targetLineForReq, setTargetLineForReq] = useState<string>('Booth #1 (Continuous Conveyor Line)');
  const [showBoothModal, setShowBoothModal] = useState<boolean>(false);
  const [editingBooth, setEditingBooth] = useState<PaintingBooth | null>(null);
  const [showPainterModal, setShowPainterModal] = useState<boolean>(false);
  const [editingPainter, setEditingPainter] = useState<PainterProfile | null>(null);
  const [selectedPainterForDetail, setSelectedPainterForDetail] = useState<PainterProfile | null>(null);

  // Material Requisition (MRN) Raise Modal State
  const [showRequisitionModal, setShowRequisitionModal] = useState<boolean>(false);
  const [reqAllocationMode, setReqAllocationMode] = useState<'new_batch' | 'existing_jc'>('new_batch');
  const [reqJobCardNo, setReqJobCardNo] = useState<string>('Pending Job Card Creation');
  const [reqPartCode, setReqPartCode] = useState<string>('');
  const [reqPartDesc, setReqPartDesc] = useState<string>('');
  const [reqCustomer, setReqCustomer] = useState<string>('');
  const [reqColor, setReqColor] = useState<string>('');
  const [reqWoNo, setReqWoNo] = useState<string>('');
  const [reqQty, setReqQty] = useState<number>(200);
  const [reqUom, setReqUom] = useState<string>('Pcs');
  const [reqUrgency, setReqUrgency] = useState<'Normal' | 'High (Line Stoppage Risk)' | 'Urgent Batch Run'>('Normal');
  const [reqRequestedBy, setReqRequestedBy] = useState<string>('Vikram Patel (Production Manager)');

  // MRN Inward Custody Acceptance Modal State
  const [showAcceptModal, setShowAcceptModal] = useState<boolean>(false);
  const [selectedReqForAccept, setSelectedReqForAccept] = useState<MaterialRequisitionNote | null>(null);
  const [actualReceivedCount, setActualReceivedCount] = useState<number>(0);
  const [acceptingPerson, setAcceptingPerson] = useState<string>('Vikram Patel (Line Supervisor)');
  const [discrepancyReasonChoice, setDiscrepancyReasonChoice] = useState<MaterialRequisitionNote['discrepancyReason']>('Count Shortage from Store');
  const [acceptRemarks, setAcceptRemarks] = useState<string>('Material received and counted physically on shop floor.');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Inter-Stage Handshake & Receipt Modal State (Direct floor handover between Stage 1 -> 2 -> 3)
  const [showStageReceiptModal, setShowStageReceiptModal] = useState<boolean>(false);
  const [selectedJcForStageReceipt, setSelectedJcForStageReceipt] = useState<JobCard | null>(null);
  const [targetStageKey, setTargetStageKey] = useState<'first' | 'second' | 'third'>('second');
  const [stageReceiptOperator, setStageReceiptOperator] = useState<string>('Kailash Yadav (Stage Operator)');
  const [stageExpectedCount, setStageExpectedCount] = useState<number>(0);
  const [stageVerifiedCount, setStageVerifiedCount] = useState<number>(0);
  const [stageHandshakeNotes, setStageHandshakeNotes] = useState<string>('Count verified physically before process initiation.');

  // Painter Assignment Modal State (Max-2 Guardrail)
  const [showAssignPainterModal, setShowAssignPainterModal] = useState<boolean>(false);
  const [selectedJcForAssign, setSelectedJcForAssign] = useState<JobCard | null>(null);
  const [selectedPainterToAssign, setSelectedPainterToAssign] = useState<string>('Ramesh Kumar (P1)');
  const [assignPainterError, setAssignPainterError] = useState<string | null>(null);

  // PM Floor Verification Review Modal State
  const [showVerificationModal, setShowVerificationModal] = useState<boolean>(false);
  const [selectedJcForVerification, setSelectedJcForVerification] = useState<JobCard | null>(null);
  const [verificationRemarksInput, setVerificationRemarksInput] = useState<string>('Approved and verified on shop floor.');
  const [reworkRemarksInput, setReworkRemarksInput] = useState<string>('Requires de-nibbing and clear coat respray.');

  const toggleMasterExpand = (id: string) => {
    setExpandedMasterIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenStageReceiptModal = (jc: JobCard, stage: 'first' | 'second' | 'third') => {
    setSelectedJcForStageReceipt(jc);
    setTargetStageKey(stage);
    
    // Determine expected count from prior stage output or target
    let expected = jc.targetQty;
    if (stage === 'first') {
      expected = jc.issuedRawQty || jc.targetQty;
    } else if (stage === 'second') {
      expected = jc.stageProcessFirst?.okQty || jc.goodQty || jc.targetQty;
    } else if (stage === 'third') {
      expected = jc.stageProcessSecond?.okQty || jc.stageProcessFirst?.okQty || jc.goodQty || jc.targetQty;
    }
    setStageExpectedCount(expected);
    setStageVerifiedCount(expected);
    setStageReceiptOperator(currentUser?.name || 'Floor Operator');
    setStageHandshakeNotes(`Physically verified and accepted from prior stage at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}.`);
    setShowStageReceiptModal(true);
  };

  const handleStageReceiptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJcForStageReceipt) return;

    updateJobCardStageReceipt(
      selectedJcForStageReceipt.jobCardNo,
      targetStageKey,
      stageReceiptOperator,
      Number(stageVerifiedCount),
      stageHandshakeNotes
    );

    const diff = Number(stageVerifiedCount) - stageExpectedCount;
    setShowStageReceiptModal(false);
    setSelectedJcForStageReceipt(null);
    setToastMessage(
      diff === 0 
        ? `✓ Stage ${targetStageKey === 'first' ? '1 (Base Coat)' : targetStageKey === 'second' ? '2 (Dipping/UV)' : '3 (Clear Lacquer)'} receipt confirmed with exact match (${stageVerifiedCount} pcs)!`
        : `⚠️ Stage receipt recorded with count variance: ${diff > 0 ? `+${diff}` : diff} pcs flagged.`
    );
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleOpenBatchModal = (jc: JobCard) => {
    const gateCheck = canStartBulkProduction(jc.jobCardNo);
    if (!gateCheck.allowed) {
      if (!confirm(`Quality Gate 2 (FPA Golden Gate) Advisory:\n\n${gateCheck.reason}\n\nDo you want to proceed under authorized production supervisor dispensation?`)) {
        return;
      }
    }
    setSelectedJobCardForProgress(jc);
    const defSprayed = Math.min(250, Math.max(50, jc.targetQty - jc.sprayedQty));
    setAddedSprayed(defSprayed);
    setAddedReject(0);
    setPaintConsumedInput(Number(((defSprayed / 500) * 8).toFixed(1)));
    setThinnerConsumedInput(Number(((defSprayed / 500) * 3.2).toFixed(1)));
    setHardenerConsumedInput(Number(((defSprayed / 500) * 2.0).toFixed(1)));
    setClearConsumedInput(Number(((defSprayed / 200) * 1.0).toFixed(1)));
    setShowBatchModal(true);
  };

  const handleCloseBatchModal = () => {
    setShowBatchModal(false);
    setSelectedJobCardForProgress(null);
  };

  const handleProgressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobCardForProgress) return;
    updateJobCardSprayed(
      selectedJobCardForProgress.jobCardNo,
      addedSprayed,
      addedReject,
      selectedDefectCategory,
      {
        paint: Number(paintConsumedInput) || 0,
        thinner: Number(thinnerConsumedInput) || 0,
        hardener: Number(hardenerConsumedInput) || 0,
        clear: Number(clearConsumedInput) || 0
      }
    );
    handleCloseBatchModal();
  };

  const handleOpenNextQuotaModal = (jc: JobCard) => {
    setSelectedJcForQuota(jc);
    const remaining = Math.max(0, jc.targetQty - (jc.goodQty || 0));
    setNextQuotaInput(Math.min(remaining, jc.dailyTargetQty || 2000));
    setShowNextQuotaModal(true);
  };

  const handleNextQuotaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJcForQuota) return;
    const res = requestNextDayTarget({
      jobCardNo: selectedJcForQuota.jobCardNo,
      nextDayTarget: Number(nextQuotaInput),
      requestedBy: currentUser?.name || 'Production Supervisor'
    });
    if (res.success) {
      setToastMessage(`✓ Shift Quota of ${nextQuotaInput} Pcs requested from Store! Generated ${res.mrnNo}.`);
      setShowNextQuotaModal(false);
      setSelectedJcForQuota(null);
      setTimeout(() => setToastMessage(null), 5000);
    } else {
      alert(res.error || 'Failed to request quota');
    }
  };

  const handleOpenSplitModal = (masterJc: JobCard) => {
    setSelectedMasterForSplit(masterJc);
    const total = masterJc.targetQty;
    // Default equal 3-way split
    const splitEach = Math.floor(total / 3);
    const remainder = total - (splitEach * 2);
    setP1Qty(splitEach);
    setP2Qty(splitEach);
    setP3Qty(remainder);
    setShowSplitModal(true);
  };

  const handleSplitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMasterForSplit) return;
    const sum = Number(p1Qty) + Number(p2Qty) + Number(p3Qty);
    if (sum !== selectedMasterForSplit.targetQty) {
      alert(`Allocation total (${sum}) does not match Master Target Qty (${selectedMasterForSplit.targetQty}). Adjust values.`);
      return;
    }
    splitJobCardToPainters(selectedMasterForSplit.jobCardNo, [
      { painterName: p1Painter, allocatedQty: Number(p1Qty) },
      { painterName: p2Painter, allocatedQty: Number(p2Qty) },
      { painterName: p3Painter, allocatedQty: Number(p3Qty) }
    ]);
    setShowSplitModal(false);
    setSelectedMasterForSplit(null);
  };

  const handleOpenReworkModal = (card: JobCard) => {
    setSelectedCardForRework(card);
    setReworkQty(Math.max(1, card.rejectQty || 5));
    setShowReworkModal(true);
  };

  const handleReworkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCardForRework) return;
    routeToRework(selectedCardForRework.jobCardNo, reworkQty, reworkDefect, reworkInstruction);
    setShowReworkModal(false);
    setSelectedCardForRework(null);
  };

  const handleCreateNewJobCard = () => {
    const firstAvailable = storeStockList.find(s => !s.isInternalConsumable && s.balanceAvailable > 0) || storeStockList.find(s => !s.isInternalConsumable) || storeStockList[0];
    if (firstAvailable) {
      handleRequestFromSpecificStock(firstAvailable);
    } else {
      setSelectedJobCardForView(null);
      setShowJobCardModal(true);
    }
  };

  const handleViewJobCard = (jc: JobCard) => {
    setSelectedJobCardForView(jc);
    setShowJobCardModal(true);
  };

  const handleOpenAssignPainterModal = (jc: JobCard) => {
    setSelectedJcForAssign(jc);
    setSelectedPainterToAssign(jc.assignedPainterName || 'Ramesh Kumar (P1)');
    setAssignPainterError(null);
    setShowAssignPainterModal(true);
  };

  const handleAssignPainterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJcForAssign) return;

    const result = assignJobCardToPainter(selectedJcForAssign.jobCardNo, selectedPainterToAssign);
    if (!result.success) {
      setAssignPainterError(result.message);
      return;
    }

    setShowAssignPainterModal(false);
    setSelectedJcForAssign(null);
    setToastMessage(`✓ Job Card ${selectedJcForAssign.jobCardNo} successfully assigned to ${selectedPainterToAssign}!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenVerificationModal = (jc: JobCard) => {
    setSelectedJcForVerification(jc);
    setVerificationRemarksInput(`Physical inspection passed on shop floor. Verified by ${currentUser.name}.`);
    setReworkRemarksInput('Rejection observed: Need de-nibbing and clear coat respray.');
    setShowVerificationModal(true);
  };

  const handleDirectVerifyAccept = (jc: JobCard) => {
    verifyAndAcceptJob(jc.jobCardNo, currentUser.name, 'Approved & Verified on Shop Floor by Production Manager');
    setShowVerificationModal(false);
    setSelectedJcForVerification(null);
    setToastMessage(`✓ Job Card ${jc.jobCardNo} verified & accepted! Painter slot freed.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDirectRequestRework = (jc: JobCard) => {
    rejectAndRequestRework(jc.jobCardNo, reworkRemarksInput || 'Rework required after PM inspection');
    setShowVerificationModal(false);
    setSelectedJcForVerification(null);
    setToastMessage(`⚠️ Job Card ${jc.jobCardNo} routed back for floor rework.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Open Requisition (MRN) Modal - demanded for a specific Painting Line / Booth
  const handleOpenRequisitionModal = (targetJc?: JobCard, targetLine?: string) => {
    if (targetLine) {
      setTargetLineForReq(targetLine);
    }
    if (targetJc) {
      setReqAllocationMode('existing_jc');
      setReqJobCardNo(targetJc.jobCardNo);
      setReqPartCode(targetJc.partCode || 'SUBSTRATE-01');
      setReqPartDesc(targetJc.partDescription || 'Raw Molded Substrates');
      setReqCustomer(targetJc.customer);
      setReqColor(targetJc.color || 'Standard');
      setReqWoNo(targetJc.woNo || targetJc.wNo || 'WO-1042');
      const unissued = Math.max(50, (targetJc.targetQty || 500) - (targetJc.issuedRawQty || 0));
      setReqQty(unissued > 0 ? unissued : 200);
      setReqUom('Pcs');
    } else {
      setReqAllocationMode('new_batch');
      setReqJobCardNo('Pending Job Card Creation');
      setReqCustomer('OEM Client');
      setReqPartCode('SUB-ABS-01');
      setReqPartDesc('Raw Injection Molded ABS Components');
      setReqColor('Standard Tone');
      setReqWoNo(`WO-${Math.floor(1000 + Math.random() * 9000)}`);
      setReqQty(250);
      setReqUom('Pcs');
    }
    setReqUrgency('Normal');
    setShowRequisitionModal(true);
  };

  const handleSelectJobCardInModal = (jcNo: string) => {
    if (jcNo === 'NEW_BATCH') {
      setReqAllocationMode('new_batch');
      setReqJobCardNo('Pending Job Card Creation');
      return;
    }
    const found = jobCards.find(j => j.jobCardNo === jcNo);
    if (found) {
      setReqAllocationMode('existing_jc');
      setReqJobCardNo(found.jobCardNo);
      setReqPartCode(found.partCode || 'SUBSTRATE-01');
      setReqPartDesc(found.partDescription || 'Raw Molded Substrates');
      setReqCustomer(found.customer);
      setReqColor(found.color || 'Standard');
      setReqWoNo(found.woNo || found.wNo || 'WO-1042');
      const unissued = Math.max(50, (found.targetQty || 500) - (found.issuedRawQty || 0));
      setReqQty(unissued > 0 ? unissued : 200);
    }
  };

  const handleRequisitionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reqQty <= 0) return;

    createMaterialRequisition({
      plant: activePlant,
      jobCardNo: reqAllocationMode === 'existing_jc' && reqJobCardNo !== 'Pending Job Card Creation' 
        ? reqJobCardNo 
        : `Line: ${targetLineForReq} (Planned Batch)`,
      woNo: reqWoNo || 'WO-PLANNED',
      customer: reqCustomer || 'OEM Client',
      partCode: reqPartCode || 'SUBSTRATE',
      partDescription: reqPartDesc || 'Substrates',
      colorName: reqColor,
      requestedQty: Number(reqQty),
      uom: reqUom,
      requiredShift: 'General Day Shift (08:30 - 18:30)',
      requestedBy: reqRequestedBy,
      urgency: reqUrgency
    });

    setShowRequisitionModal(false);
    setToastMessage(`✓ Material Requisition sent to Store! Demanded ${reqQty} ${reqUom} for ${targetLineForReq}.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Open Store MRN Custody Verification Modal
  const handleOpenAcceptModal = (req: MaterialRequisitionNote) => {
    setSelectedReqForAccept(req);
    const expected = req.issuedQty || req.requestedQty;
    setActualReceivedCount(expected);
    setAcceptingPerson(currentUser?.name || 'Vikram Patel (Line Supervisor)');
    setDiscrepancyReasonChoice('Count Shortage from Store');
    setAcceptRemarks(`Material received and verified on floor against Store Issue Slip ${req.issuedSlipNo || 'MIN-DIRECT'}.`);
    setShowAcceptModal(true);
  };

  const handleAcceptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReqForAccept) return;

    const expected = selectedReqForAccept.issuedQty || selectedReqForAccept.requestedQty;
    const isDiscrepant = actualReceivedCount !== expected;

    acceptMaterialRequisition(
      selectedReqForAccept.mrnNo,
      Number(actualReceivedCount),
      acceptingPerson,
      isDiscrepant ? discrepancyReasonChoice : undefined,
      acceptRemarks
    );

    setShowAcceptModal(false);
    setToastMessage(`✓ Floor Custody Accepted: ${actualReceivedCount} ${selectedReqForAccept.uom} taken into WIP!`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleAcceptAndOpenPir = () => {
    if (!selectedReqForAccept) return;

    const expected = selectedReqForAccept.issuedQty || selectedReqForAccept.requestedQty;
    const isDiscrepant = actualReceivedCount !== expected;

    acceptMaterialRequisition(
      selectedReqForAccept.mrnNo,
      Number(actualReceivedCount),
      acceptingPerson,
      isDiscrepant ? discrepancyReasonChoice : undefined,
      acceptRemarks
    );

    const matchedJc = jobCards.find(
      j => j.jobCardNo.toLowerCase() === selectedReqForAccept.jobCardNo.toLowerCase() ||
           (j.woNo && selectedReqForAccept.woNo && j.woNo.toLowerCase() === selectedReqForAccept.woNo.toLowerCase())
    );

    setShowAcceptModal(false);

    if (matchedJc) {
      setSelectedJcForPir({
        ...matchedJc,
        targetQty: Number(actualReceivedCount),
        issuedRawQty: Number(actualReceivedCount)
      });
    } else {
      setSelectedJcForPir({
        jobCardNo: selectedReqForAccept.jobCardNo,
        woNo: selectedReqForAccept.woNo,
        customer: selectedReqForAccept.customer,
        partCode: selectedReqForAccept.partCode,
        partDescription: selectedReqForAccept.partDescription,
        color: selectedReqForAccept.colorName || 'Standard OEM Tone',
        targetQty: Number(actualReceivedCount),
        issuedRawQty: Number(actualReceivedCount),
        sprayedQty: 0,
        goodQty: 0,
        rejectQty: 0,
        status: 'Open',
        jobCardType: 'master',
        docNo: 'Doc No: 001',
        dept: 'Cubic Line',
        boothNo: 'Booth #1',
        painterName: 'Ramesh Kumar (P1)',
        checkingPerson: 'Amit Verma'
      });
    }
    setShowPirModal(true);
  };

  // 1-Click Job Card Creation after physical material receipt on floor
  const handleCreateJobCardFromReceivedBatch = (req: MaterialRequisitionNote) => {
    const nextJcIndex = String(jobCards.length + 1).padStart(3, '0');
    const newJobCardNo = `JC-2026-${nextJcIndex}`;
    const initialJcData: Partial<JobCard> = {
      jobCardNo: newJobCardNo,
      woNo: req.woNo || `WO-2026-${nextJcIndex}`,
      wNo: req.woNo || `WO-2026-${nextJcIndex}`,
      sourceGrnNo: req.sourceGrnNo,
      customer: req.customer,
      partCode: req.partCode,
      partDescription: req.partDescription,
      color: req.colorName || 'Standard OEM Tone',
      targetQty: req.receivedQty || req.issuedQty || req.requestedQty,
      issuedRawQty: req.receivedQty || req.issuedQty || req.requestedQty,
      sprayedQty: 0,
      goodQty: 0,
      rejectQty: 0,
      status: 'Open',
      jobCardType: 'master',
      docNo: 'Doc No: 001',
      dept: targetLineForReq,
      boothNo: targetLineForReq,
      painterName: 'Ramesh Kumar (P1)',
      checkingPerson: 'Amit Verma'
    };

    setSelectedJobCardForView(initialJcData as JobCard);
    setShowJobCardModal(true);
  };

  
  // Production Manager 1-Click Job Card Creation from Plant Head Priority Order
  const handleLaunchJobCardFromPriority = (priorityOrder: PlantHeadPriorityAssignment, defaultQty?: number) => {
    const nextJcIndex = String(jobCards.length + 1).padStart(3, '0');
    const totalOrder = priorityOrder.totalOrderQty || (priorityOrder.id === 'PRIO-2026-001' ? 10000 : priorityOrder.availableQty);
    const availableCount = defaultQty !== undefined ? defaultQty : (totalOrder > 0 ? totalOrder : 250);
    
    const initialJcData: Partial<JobCard> = {
      jobCardNo: `JC-2026-${nextJcIndex}`,
      woNo: priorityOrder.challanNo || `WO-2026-${nextJcIndex}`,
      wNo: priorityOrder.challanNo || `WO-2026-${nextJcIndex}`,
      sourceGrnNo: priorityOrder.grnNo,
      customer: priorityOrder.customer,
      partCode: priorityOrder.partCode,
      partDescription: priorityOrder.partDescription,
      color: priorityOrder.color || 'Monza Red Gloss',
      targetQty: availableCount,
      issuedRawQty: availableCount,
      sprayedQty: 0,
      goodQty: 0,
      rejectQty: 0,
      status: 'Open',
      jobCardType: 'master',
      docNo: 'Doc No: 001',
      dept: priorityOrder.recommendedBooth || 'Booth #1 (Automotive Robotic Line)',
      boothNo: priorityOrder.recommendedBooth || 'Booth #1 (Automotive Robotic Line)',
      painterName: 'Ramesh Kumar (P1)',
      assignedPainterName: 'Ramesh Kumar (P1)',
      assignedPainterId: 'PAINTER-01',
      checkingPerson: 'Amit Verma (QA Lead)',
      headerRemark: `PLANT HEAD DIRECTIVE [${priorityOrder.priorityLevel.replace('_', ' ')}]: ${priorityOrder.plantHeadRemarks}`,
      issuedMaterials: [
        {
          id: '1',
          itemDescription: `${priorityOrder.color || 'Basecoat'} 2K PU Paint`,
          materialType: 'paint',
          category: 'COMPANY_CONSUMABLE',
          qty: Math.max(5, Math.round(availableCount * 0.05)),
          consumedQty: 0,
          floorBalanceQty: Math.max(5, Math.round(availableCount * 0.05)),
          colour: priorityOrder.color || 'Basecoat Tone',
          uom: 'Litres',
          remark: 'Store paint batch'
        },
        {
          id: '2',
          itemDescription: 'PU Thinner 400 Solvent',
          materialType: 'thinner',
          category: 'COMPANY_CONSUMABLE',
          qty: Math.max(2, Math.round(availableCount * 0.02)),
          consumedQty: 0,
          floorBalanceQty: Math.max(2, Math.round(availableCount * 0.02)),
          colour: 'Clear',
          uom: 'Litres',
          remark: 'Solvent line mix'
        },
        {
          id: '3',
          itemDescription: '2K Scratch-Resistant Hardener',
          materialType: 'hardener',
          category: 'COMPANY_CONSUMABLE',
          qty: Math.max(1, Math.round(availableCount * 0.015)),
          consumedQty: 0,
          floorBalanceQty: Math.max(1, Math.round(availableCount * 0.015)),
          colour: 'Clear',
          uom: 'Litres',
          remark: 'Reaction curing agent'
        }
      ]
    };

    setSelectedJobCardForView(initialJcData as JobCard);
    setShowJobCardModal(true);
  };

  // DIRECT 1-CLICK JOB CARD CREATION & STORE MATERIAL DEMAND from Store Stock Item
  const handleRequestFromSpecificStock = (stockItem: any) => {
    const nextJcIndex = String(jobCards.length + 1).padStart(3, '0');
    const availableCount = stockItem.balanceAvailable > 0 ? stockItem.balanceAvailable : 250;
    
    const initialJcData: Partial<JobCard> = {
      jobCardNo: `JC-2026-${nextJcIndex}`,
      woNo: stockItem.challanNo || `WO-2026-${nextJcIndex}`,
      wNo: stockItem.challanNo || `WO-2026-${nextJcIndex}`,
      sourceGrnNo: stockItem.grnNo,
      customer: stockItem.customer,
      partCode: stockItem.partCode,
      partDescription: stockItem.partDesc,
      color: 'Monza Red Gloss',
      targetQty: availableCount,
      issuedRawQty: availableCount,
      sprayedQty: 0,
      goodQty: 0,
      rejectQty: 0,
      status: 'Open',
      jobCardType: 'master',
      docNo: 'Doc No: 001',
      dept: 'Booth #1 (Continuous Conveyor Line)',
      boothNo: 'Booth #1 (Continuous Conveyor Line)',
      painterName: 'Ramesh Kumar (P1)',
      assignedPainterName: 'Ramesh Kumar (P1)',
      assignedPainterId: 'PAINTER-01',
      checkingPerson: 'Amit Verma (QA Lead)',
      issuedMaterials: [
        {
          id: '1',
          itemDescription: 'Monza Red 2K PU Basecoat Paint (PPG)',
          materialType: 'paint',
          category: 'COMPANY_CONSUMABLE',
          qty: Math.max(5, Math.round(availableCount * 0.05)),
          consumedQty: 0,
          floorBalanceQty: Math.max(5, Math.round(availableCount * 0.05)),
          colour: 'Monza Red Gloss',
          uom: 'Litres',
          remark: 'Store paint batch'
        },
        {
          id: '2',
          itemDescription: 'PU Thinner 400 Solvent',
          materialType: 'thinner',
          category: 'COMPANY_CONSUMABLE',
          qty: Math.max(2, Math.round(availableCount * 0.02)),
          consumedQty: 0,
          floorBalanceQty: Math.max(2, Math.round(availableCount * 0.02)),
          colour: 'Clear',
          uom: 'Litres',
          remark: 'Solvent line mix'
        },
        {
          id: '3',
          itemDescription: '2K Scratch-Resistant Hardener',
          materialType: 'hardener',
          category: 'COMPANY_CONSUMABLE',
          qty: Math.max(1, Math.round(availableCount * 0.015)),
          consumedQty: 0,
          floorBalanceQty: Math.max(1, Math.round(availableCount * 0.015)),
          colour: 'Clear',
          uom: 'Litres',
          remark: 'Reaction curing agent'
        }
      ]
    };

    setSelectedJobCardForView(initialJcData as JobCard);
    setShowJobCardModal(true);
  };

  // Delete confirmation handlers for Booths and Painters
  const handleDeleteBooth = (id: string, name: string) => {
    if (paintingBooths.length <= 1) {
      alert("At least one painting booth must remain configured in the fleet.");
      return;
    }
    if (window.confirm(`Are you sure you want to remove "${name}" from the booth fleet?`)) {
      deletePaintingBooth(id);
      setToastMessage(`✓ Removed ${name} from booth fleet`);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const handleDeletePainter = (id: string, name: string) => {
    if (painters.length <= 1) {
      alert("At least one painter must remain configured in the fleet.");
      return;
    }
    const targetPainter = painters.find(p => p.id === id);
    if (targetPainter) {
      const pName = targetPainter.name.toLowerCase().trim();
      const pCode = targetPainter.code?.toLowerCase().trim();
      const count = jobCards.filter(jc => {
        const assigned = (jc.assignedPainterName || (jc as any).painterName || '').toLowerCase().trim();
        const assignedId = (jc.assignedPainterId || '').toLowerCase().trim();
        return (
          assignedId === id.toLowerCase() ||
          (pCode && (assigned.includes(pCode) || assignedId === pCode)) ||
          assigned === pName ||
          assigned.includes(pName)
        );
      }).length;

      if (count > 0) {
        alert(`Cannot delete "${name}": This technician has ${count} Job Card(s) recorded in the system. In order to preserve manufacturing audit trails and quality history, deletion is blocked. You can set their status to "On Leave" instead.`);
        return;
      }
    }
    if (window.confirm(`Are you sure you want to remove painter "${name}" from the fleet?`)) {
      deletePainter(id);
      setToastMessage(`✓ Removed painter ${name} from fleet`);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  // Live calculation of Store Stock available for Production Manager to inspect
  const storeStockList = useMemo(() => {
    return grnList
      .filter(grn => (grn.iqcStatus === 'Accepted' || grn.iqcStatus === 'Passed' || (!grn.iqcStatus && grn.grnNo)) && grn.iqcStatus !== 'Pending' && grn.iqcStatus !== 'Rejected')
      .map(grn => {
        const customer = grn.supplierCustomer;
        const partCode = grn.items?.[0]?.partCode || grn.partCode || 'SUBSTRATE';
        const partDesc = grn.items?.[0]?.partDescription || grn.description || 'Raw Components';
        const totalInward = Number(grn.actualReceivedQty) || Number(grn.totalQty) || 0;
        const receivedDate = grn.receivedDate || grn.date;
        const uom = (partCode.startsWith('PNT') || partCode.startsWith('CHEM') || partCode.startsWith('THN') || partCode.startsWith('HDN') || partDesc.toLowerCase().includes('drum') || partDesc.toLowerCase().includes('paint') || partDesc.toLowerCase().includes('thinner')) ? 'Litres' : 'Pcs';

        const isInternalConsumable = 
          partCode.startsWith('PNT') ||
          partCode.startsWith('CHEM') ||
          partCode.startsWith('THN') ||
          partCode.startsWith('HDN') ||
          partCode.startsWith('CLR') ||
          uom === 'Litres' ||
          partDesc.toLowerCase().includes('paint') ||
          partDesc.toLowerCase().includes('thinner') ||
          partDesc.toLowerCase().includes('solvent') ||
          partDesc.toLowerCase().includes('hardener') ||
          partDesc.toLowerCase().includes('lacquer') ||
          partDesc.toLowerCase().includes('chemical') ||
          customer.toLowerCase().includes('ppg') ||
          customer.toLowerCase().includes('berger') ||
          customer.toLowerCase().includes('asian paints') ||
          grn.remarks?.toLowerCase().includes('internal');

        // Match job cards target quantity
        const matchingJobCards = jobCards.filter(jc => 
          (jc.customer && jc.customer.trim().toLowerCase() === customer.trim().toLowerCase()) ||
          (jc.partCode && jc.partCode.trim().toLowerCase() === partCode.trim().toLowerCase()) ||
          (jc.woNo && grn.invoiceChallanNo && jc.woNo.includes(grn.invoiceChallanNo)) ||
          (jc.wNo && grn.invoiceChallanNo && jc.wNo.includes(grn.invoiceChallanNo))
        );
        const primaryJobCards = matchingJobCards.filter(jc => jc.jobCardType === 'master' || (!jc.jobCardType && !jc.parentJobCardId));
        const totalJobCardDemands = primaryJobCards.reduce((acc, curr) => acc + (Number(curr.targetQty) || 0), 0);

        const totalIssuedToFloor = totalJobCardDemands;
        const balanceAvailable = Math.max(0, totalInward - totalIssuedToFloor);

        return {
          grnNo: grn.grnNo,
          challanNo: grn.invoiceChallanNo,
          receivedDate,
          customer,
          partCode,
          partDesc,
          uom,
          totalInward,
          totalIssuedToFloor,
          balanceAvailable,
          jobCardsCount: primaryJobCards.length,
          vehicleNo: grn.vehicleNo,
          iqcStatus: grn.iqcStatus,
          isInternalConsumable,
          status: isInternalConsumable 
            ? 'Internal Chemical / Consumable' 
            : balanceAvailable === 0 
              ? 'Exhausted (100% Allocated)' 
              : balanceAvailable < 100 
                ? 'Low Balance' 
                : 'Ready in Store'
        };
      });
  }, [grnList, jobCards]);

  const uniqueStockCustomers = useMemo(() => {
    return Array.from(new Set(storeStockList.map(s => s.customer))).filter(Boolean);
  }, [storeStockList]);

  const filteredStoreStock = useMemo(() => {
    return storeStockList.filter(item => {
      if (stockClientFilter !== 'ALL' && item.customer !== stockClientFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.customer.toLowerCase().includes(q) ||
        item.partCode.toLowerCase().includes(q) ||
        item.partDesc.toLowerCase().includes(q) ||
        item.grnNo.toLowerCase().includes(q) ||
        item.challanNo.toLowerCase().includes(q)
      );
    });
  }, [storeStockList, stockClientFilter, searchQuery]);

  // Helper to determine if a job card has cleared PIR (Gate 1)
  const checkIsPirPassed = (jc: JobCard): boolean => {
    if (jc.pirStatus === 'Passed') return true;
    const match = preProductionReports.find(
      p => p.overallResult === 'Passed' && (
        p.jobCardNo.toLowerCase() === jc.jobCardNo.toLowerCase() ||
        (jc.parentJobCardId && p.jobCardNo.toLowerCase() === jc.parentJobCardId.toLowerCase()) ||
        (jc.woNo && p.workOrderNo && p.workOrderNo.trim().toLowerCase() === jc.woNo.trim().toLowerCase()) ||
        (jc.customer && p.customer && jc.customer.trim().toLowerCase() === p.customer.trim().toLowerCase() &&
         jc.partCode && p.partCode && jc.partCode.trim().toLowerCase() === p.partCode.trim().toLowerCase())
      )
    );
    return !!match;
  };

  // Helper to determine if a job card has cleared FPA (Gate 2)
  const checkIsFpaApproved = (jc: JobCard): boolean => {
    if (jc.fpaStatus === 'Approved') return true;
    const match = fpaRecords.find(
      f => f.overallResult === 'Approved' && (
        f.jobCardNo.toLowerCase() === jc.jobCardNo.toLowerCase() ||
        (jc.parentJobCardId && f.jobCardNo.toLowerCase() === jc.parentJobCardId.toLowerCase()) ||
        (jc.woNo && f.woNo && f.woNo.trim().toLowerCase() === jc.woNo.trim().toLowerCase()) ||
        (jc.customer && f.customer && jc.customer.trim().toLowerCase() === f.customer.trim().toLowerCase() &&
         jc.partCode && f.partCode && jc.partCode.trim().toLowerCase() === f.partCode.trim().toLowerCase())
      )
    );
    return !!match;
  };

  // Available Painter Options for Dropdown Filter
  // STRICT RULE: Only painters with at least 1 currently assigned job card appear.
  const availablePainterOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();

    jobCards.forEach(jc => {
      const rawName = (jc.assignedPainterName || jc.painterName || '').trim();
      if (!rawName) return;

      const matched = painters.find(p => {
        const pName = p.name.toLowerCase().trim();
        const firstName = pName.split(' ')[0];
        const pCode = p.code?.toLowerCase().trim();
        const rLower = rawName.toLowerCase();
        const assignedId = (jc.assignedPainterId || '').toLowerCase().trim();
        return (
          assignedId === p.id.toLowerCase() ||
          (pCode && (rLower.includes(pCode) || assignedId === pCode)) ||
          rLower === pName ||
          rLower.includes(pName) ||
          (firstName && firstName.length > 2 && rLower.includes(firstName))
        );
      });

      const key = matched ? matched.name : rawName;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, {
          id: matched ? matched.id : key,
          name: key,
          count: 1
        });
      }
    });

    // Strictly filter out any painter with 0 job cards
    return Array.from(map.values())
      .filter(p => p.count > 0)
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [jobCards, painters, activeTab]);

  // Active Parties / Clients Options for Dropdown Filter
  // STRICT RULE: Only parties that currently have at least 1 ACTIVE job card appear.
  // If a party has 0 job cards or all its job cards are completed/closed, it will NEVER appear in this dropdown.
  const activeClientOptions = useMemo(() => {
    const map = new Map<string, { name: string; activeCount: number }>();

    jobCards.forEach(jc => {
      const cust = (jc.customer || '').trim();
      if (!cust) return;

      const s = (jc.status || '').toLowerCase().trim();
      const isClosed = 
        s === 'completed' || 
        s === 'closed' || 
        s === 'target met' || 
        s === 'verified & accepted' || 
        s === 'verified';

      // If job is finished/closed, do NOT count it as active
      if (isClosed) return;

      const key = cust.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.activeCount += 1;
      } else {
        map.set(key, { name: cust, activeCount: 1 });
      }
    });

    // Strictly filter out any party with 0 active job cards
    return Array.from(map.values())
      .filter(c => c.activeCount > 0)
      .sort((a, b) => b.activeCount - a.activeCount || a.name.localeCompare(b.name));
  }, [jobCards, activeTab]);

  // Reset dropdown selection safely if the selected party or painter has 0 matching jobs in current view
  useEffect(() => {
    if (customerFilter !== 'ALL') {
      const exists = activeClientOptions.some(c => c.name.toLowerCase() === customerFilter.toLowerCase());
      if (!exists) setCustomerFilter('ALL');
    }
  }, [activeClientOptions, customerFilter]);

  useEffect(() => {
    if (painterFilter !== 'ALL') {
      const exists = availablePainterOptions.some(p => p.name.toLowerCase() === painterFilter.toLowerCase());
      if (!exists) setPainterFilter('ALL');
    }
  }, [availablePainterOptions, painterFilter]);

  // Real-time metrics for Quick Filter Chips
  const filterStats = useMemo(() => {
    let activeCount = 0;
    let completedCount = 0;
    let overdueCount = 0;
    let pirPendingCount = 0;
    let fpaPendingCount = 0;

    jobCards.forEach(jc => {
      const s = (jc.status || '').toLowerCase().trim();
      const isClosed = 
        s === 'completed' || 
        s === 'closed' || 
        s === 'target met' || 
        s === 'verified & accepted' || 
        s === 'verified';
      const isSlaBreachedNow = jc.isSlaBreached || (!isClosed && jc.slaDeadline && new Date() > new Date(jc.slaDeadline));

      if (!isClosed) {
        activeCount += 1;
        if (isSlaBreachedNow) overdueCount += 1;
        if (!checkIsPirPassed(jc)) pirPendingCount += 1;
        if (!checkIsFpaApproved(jc)) fpaPendingCount += 1;
      } else {
        completedCount += 1;
      }
    });

    return {
      total: jobCards.length,
      active: activeCount,
      completed: completedCount,
      overdue: overdueCount,
      pirPending: pirPendingCount,
      fpaPending: fpaPendingCount
    };
  }, [jobCards, activeTab, preProductionReports, fpaRecords]);

  // Luxury Dropdown Options Maps
  const painterDropdownOptions: FilterOption[] = useMemo(() => [
    { value: 'ALL', label: 'All Painters', badge: availablePainterOptions.length },
    ...availablePainterOptions.map(p => ({
      value: p.name,
      label: p.name,
      badge: p.count > 0 ? `${p.count} jobs` : undefined
    }))
  ], [availablePainterOptions]);

  const customerDropdownOptions: FilterOption[] = useMemo(() => [
    { value: 'ALL', label: 'All Active Parties', badge: activeClientOptions.length },
    ...activeClientOptions.map(c => ({
      value: c.name,
      label: c.name,
      badge: `${c.activeCount} active`
    }))
  ], [activeClientOptions]);

  const statusDropdownOptions: FilterOption[] = useMemo(() => [
    { value: 'ALL', label: 'All Statuses', badge: filterStats.total },
    { value: 'ACTIVE_ONLY', label: 'Active Only', badge: filterStats.active },
    { value: 'COMPLETED', label: 'Completed', badge: filterStats.completed },
    { value: 'SLA_OVERDUE', label: '⚠️ SLA Overdue', badge: filterStats.overdue },
    { value: 'PIR_PENDING', label: 'Gate 1: PIR Pending', badge: filterStats.pirPending },
    { value: 'FPA_PENDING', label: 'Gate 2: FPA Pending', badge: filterStats.fpaPending },
    { value: 'OVER_RUN', label: 'Over-Run Flagged' },
  ], [filterStats]);

  const isFilterActive = searchQuery.trim() !== '' || painterFilter !== 'ALL' || customerFilter !== 'ALL' || statusFilter !== 'ALL';

  const handleResetFilters = () => {
    setSearchQuery('');
    setPainterFilter('ALL');
    setCustomerFilter('ALL');
    setStatusFilter('ALL');
  };

  // Filter Cards based on active tab, search query, painter, customer, and status
  const filteredCards = jobCards.filter(jc => {
    // 1. Painter Filter
    if (painterFilter !== 'ALL') {
      const raw = (jc.assignedPainterName || jc.painterName || '').toLowerCase().trim();
      const assignedId = (jc.assignedPainterId || '').toLowerCase().trim();
      const target = painterFilter.toLowerCase().trim();
      const firstName = target.split(' ')[0];

      const matches =
        raw === target ||
        raw.includes(target) ||
        target.includes(raw) ||
        assignedId === target ||
        (firstName && firstName.length > 2 && raw.includes(firstName));

      if (!matches) return false;
    }

    // 2. Active Party / Client Filter
    if (customerFilter !== 'ALL') {
      if ((jc.customer || '').trim().toLowerCase() !== customerFilter.trim().toLowerCase()) {
        return false;
      }
    }

    // 3. Status & Urgency Filter
    if (statusFilter !== 'ALL') {
      const s = (jc.status || '').toLowerCase().trim();
      const isClosed = 
        s === 'completed' || 
        s === 'closed' || 
        s === 'target met' || 
        s === 'verified & accepted' || 
        s === 'verified';
      const isSlaBreachedNow = jc.isSlaBreached || (!isClosed && jc.slaDeadline && new Date() > new Date(jc.slaDeadline));

      if (statusFilter === 'ACTIVE_ONLY') {
        if (isClosed) return false;
      } else if (statusFilter === 'SLA_OVERDUE') {
        if (isClosed || !isSlaBreachedNow) return false;
      } else if (statusFilter === 'PIR_PENDING') {
        if (isClosed || checkIsPirPassed(jc)) return false;
      } else if (statusFilter === 'FPA_PENDING') {
        if (isClosed || checkIsFpaApproved(jc)) return false;
      } else if (statusFilter === 'OVER_RUN') {
        if (jc.status !== 'Over-Run Flagged') return false;
      } else if (statusFilter === 'COMPLETED') {
        if (!isClosed) return false;
      }
    }

    // 4. Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNo = jc.jobCardNo.toLowerCase().includes(q);
      const matchCustomer = jc.customer.toLowerCase().includes(q);
      const matchPart = (jc.partCode || '').toLowerCase().includes(q) || jc.partDescription.toLowerCase().includes(q);
      const matchPainter = (jc.assignedPainterName || jc.painterName || '').toLowerCase().includes(q);
      const matchColor = (jc.color || '').toLowerCase().includes(q);
      const matchWo = (jc.wNo || jc.woNo || '').toLowerCase().includes(q);
      if (!matchNo && !matchCustomer && !matchPart && !matchPainter && !matchColor && !matchWo) return false;
    }

    return true;
  });

  // Calculate high-signal metrics
  const totalSprayed = jobCards.reduce((acc, j) => acc + (j.jobCardType === 'painter_child' ? j.sprayedQty : 0), 0) ||
                       jobCards.reduce((acc, j) => acc + (j.jobCardType === 'master' ? j.sprayedQty : 0), 0);
  const totalRework = jobCards.filter(j => j.jobCardType === 'rework_child').reduce((acc, j) => acc + j.targetQty, 0);

  // Dedicated Full Page View: Painter Profile & Date-wise Production History (No popups)
  if (selectedPainterForDetail) {
    return (
      <div className="space-y-6">
        <PainterDetailProfileView
          painter={selectedPainterForDetail}
          onBack={() => setSelectedPainterForDetail(null)}
          onEdit={(p) => {
            setEditingPainter(p);
            setShowPainterModal(true);
          }}
          onViewJobCard={(jc) => {
            setSelectedJobCardForView(jc);
            setShowJobCardModal(true);
          }}
        />

        {/* Edit Painter Modal if triggered from profile view */}
        <PainterConfigModal
          isOpen={showPainterModal}
          onClose={() => {
            setShowPainterModal(false);
            setEditingPainter(null);
          }}
          editingPainter={editingPainter}
          availableBooths={paintingBooths}
          onSave={(data) => {
            addPainter(data);
            setToastMessage(`✓ Added painter ${data.name} to technician fleet!`);
            setTimeout(() => setToastMessage(null), 3500);
          }}
          onUpdate={(id, updates) => {
            updatePainter(id, updates);
            setSelectedPainterForDetail(prev => prev && prev.id === id ? { ...prev, ...updates } : prev);
            setToastMessage(`✓ Updated painter ${updates.name || ''} profile`);
            setTimeout(() => setToastMessage(null), 3500);
          }}
        />

        {/* Job Card View/Edit Modal if triggered from profile ledger */}
        <JobCardModal
          isOpen={showJobCardModal}
          onClose={() => {
            setShowJobCardModal(false);
            setSelectedJobCardForView(null);
          }}
          initialData={selectedJobCardForView}
          isViewOnly={true}
        />

        {/* Floating Feedback Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#17191c] text-white px-5 py-3 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2 border border-[#c09748]/50 animate-in slide-in-from-bottom-5">
            <CheckCircle2 className="w-4 h-4 text-[#c09748]" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner - Standardized Persona Layout */}
      <div className="bg-white rounded-[24px] p-5 sm:p-6 border border-[#ececec] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
              PK-PRD-JCR-001 • PRODUCTION FLOOR DESK
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#17191c] text-[10px] font-semibold">
              👤 {currentUser.name} ({currentUser.roleTitle})
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-bold flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-600" />
              <span>SINGLE DAY SHIFT (08:30 – 18:30) • {activePlant}</span>
            </span>
            {isPlantDayClosed && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-bold">
                EOD SHUTDOWN LOCKED
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-normal text-[#17191c] tracking-tight">
            Job Cards & 3-Painter Line Operations
          </h1>
          <p className="text-xs text-[#777b86] mt-1">
            Floor Job Cards, daily quotas, painter line assignments, and plant head priority orders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => handleOpenRequisitionModal()}
            disabled={isPlantDayClosed}
            title={isPlantDayClosed ? "Floor operations locked after 18:30 EOD shutdown." : ""}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold shadow-xs transition w-full md:w-auto ${
              isPlantDayClosed
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                : 'bg-white hover:bg-gray-50 text-[#17191c] border border-[#f4e5be] shadow-2xs hover:border-[#c09748] cursor-pointer'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4 text-[#c09748]" />
            <span>+ Request Material (MRN)</span>
          </button>

          <button
            onClick={handleCreateNewJobCard}
            disabled={isPlantDayClosed}
            title={isPlantDayClosed ? "Floor operations locked after 18:30 EOD shutdown." : ""}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold shadow-xs transition w-full md:w-auto ${
              isPlantDayClosed
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                : 'bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] cursor-pointer'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Job Card</span>
          </button>
        </div>
      </div>

      {/* Plant Head Priority Master Banner */}
      {(() => {
        const pendingPriorities = plantHeadPriorities.filter(p => p.status === 'Priority Assigned');
        const p1Orders = pendingPriorities.filter(p => p.priorityLevel === 'P1_URGENT');
        if (pendingPriorities.length === 0) return null;

        return (
          <div className="p-4 rounded-[20px] bg-gradient-to-r from-[#faf3e0] via-[#faf7ed] to-white border border-[#f4e5be] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#17191c] text-[#c09748] flex items-center justify-center shrink-0">
                <Flag className="w-4 h-4 text-[#c09748]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs sm:text-sm text-[#17191c]">
                    Plant Head Priority Queue Active ({pendingPriorities.length} Orders Assigned)
                  </h3>
                  {p1Orders.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[9px] font-mono font-bold animate-pulse">
                      🚨 {p1Orders.length} P1 Critical
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#8a6521] mt-0.5">
                  Satish Sharma (Plant Head) has prioritized store material batches for Vikram Patel (Production Manager). Create Job Cards as per priority sequence.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleSelectTab('PRIORITY_QUEUE')}
              className="px-4 py-2 rounded-full bg-[#17191c] hover:bg-black text-[#c09748] text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-xs active:scale-95"
            >
              <span>View Priority Queue ({pendingPriorities.length})</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#c09748]" />
            </button>
          </div>
        );
      })()}

      {/* ====================================================================== */}
      {/* 2. TAB NAVIGATION CHIPS (7 SUB-MODULES LINKED)                            */}
      {/* ====================================================================== */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#ececec] pb-3">
        <button
          onClick={() => handleSelectTab('PRIORITY_QUEUE')}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'PRIORITY_QUEUE'
              ? 'bg-[#17191c] text-[#c09748] shadow-xs'
              : 'bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Plant Head Priorities ({plantHeadPriorities.filter(p => p.status === 'Priority Assigned').length})</span>
        </button>
        <button
          onClick={() => handleSelectTab('ALL')}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
            activeTab === 'ALL'
              ? 'bg-[#17191c] text-[#c09748] shadow-xs'
              : 'bg-white hover:bg-[#fafafb] text-[#777b86] border border-[#ececec]'
          }`}
        >
          All Job Cards ({jobCards.length})
        </button>
        <button
          onClick={() => handleSelectTab('REQUISITIONS')}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
            activeTab === 'REQUISITIONS'
              ? 'bg-[#17191c] text-[#c09748] shadow-xs'
              : 'bg-white hover:bg-[#fafafb] text-[#777b86] border border-[#ececec]'
          }`}
        >
          Store Demands (MRN) ({materialRequisitions.length})
        </button>
                <button
          onClick={() => handleSelectTab('BOOTH_FLEET')}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'BOOTH_FLEET'
              ? 'bg-[#17191c] text-[#c09748] shadow-xs'
              : 'bg-white hover:bg-[#fafafb] text-[#777b86] border border-[#ececec]'
          }`}
        >
          <Settings className="w-3.5 h-3.5 text-[#c09748]" />
          <span>Painting Lines & Spray Booth Fleet ({paintingBooths.length})</span>
        </button>
      </div>

      {/* PENDING FLOOR VERIFICATION REVIEW DESK (MANAGER ACCEPTANCE GATEWAY) */}
      {pendingVerificationJobsCount > 0 && (
        <div className="p-4 sm:p-5 rounded-[24px] bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white border border-amber-300 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
              <h2 className="font-serif font-normal text-base sm:text-lg text-[#17191c]">
                ⚡ Urgent Floor Action: {pendingVerificationJobsCount} Job Cards Awaiting Production Manager Verification
              </h2>
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 self-start sm:self-auto">
              Painter marked finished • Slot locked until verified
            </span>
          </div>
          <p className="text-xs text-[#777b86]">
            Floor painters ne yeh jobs finish mark kar diye hain. Physical quality verify karke <strong>"Verify & Accept"</strong> click karein taaki painter ka slot free ho sake, ya <strong>"Request Rework"</strong> karein.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {jobCards.filter(j => j.painterJobStatus === 'Pending Verification' || j.status === 'Pending Verification').map(jc => (
              <div
                key={jc.jobCardNo}
                className="p-3.5 rounded-[18px] bg-white border border-amber-200 shadow-xs flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-mono font-bold text-[#8a6521] bg-[#faf3e0] px-2 py-0.5 rounded-md">
                      {jc.jobCardNo}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                      Finished at {jc.painterFinishedAt ? new Date(jc.painterFinishedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Floor'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#17191c]">{jc.partDescription}</div>
                  <div className="text-[11px] text-[#777b86] flex items-center justify-between mt-1 font-mono">
                    <span>Target: <strong>{jc.targetQty} pcs</strong></span>
                    <span className="text-emerald-700">OK: <strong>{jc.sprayedQty || jc.targetQty} pcs</strong></span>
                    <span className="text-rose-700">Rej: <strong>{jc.rejectQty || 0} pcs</strong></span>
                  </div>
                  <div className="text-[11px] text-[#17191c] font-semibold mt-1.5 flex items-center gap-1">
                    <Paintbrush className="w-3 h-3 text-[#c09748]" />
                    <span>Painter: {jc.assignedPainterName || jc.painterName || 'Floor Sprayer'}</span>
                  </div>
                  {jc.painterNotes && (
                    <div className="text-[10px] text-[#777b86] italic bg-[#fafafb] p-1.5 rounded-lg mt-1.5 border border-[#ececec]">
                      "{jc.painterNotes}"
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#ececec]">
                  <button
                    type="button"
                    onClick={() => handleDirectRequestRework(jc)}
                    className="py-1.5 px-2 rounded-full border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold cursor-pointer transition text-center"
                  >
                    🔄 Request Rework
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDirectVerifyAccept(jc)}
                    className="py-1.5 px-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold cursor-pointer transition shadow-xs flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>✓ Verify & Accept</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DEDICATED SEARCH & MULTI-FILTER CONTROL BAR for Job Cards */}
      {activeTab === 'ALL' && (
        <div className="bg-white rounded-[22px] border border-[#ececec] p-3 sm:p-3.5 shadow-xs">
          {/* Main Controls Row: Search (flex-1) + 3 Equal-Width Dropdowns (sm:w-[215px]) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input (Expands to fill available space) */}
            <div className="flex-1 min-w-[200px] relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                <Search className="w-4 h-4 text-[#c09748]" />
              </div>
              <input
                type="text"
                placeholder="Search Job Card, Part Code, Customer, Painter..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '40px' }}
                className="w-full pr-9 py-2.5 rounded-[14px] bg-[#fafafb] hover:bg-white focus:bg-white border border-[#ececec] text-xs text-[#17191c] placeholder:text-[#a3a6af] focus:outline-none focus:border-[#c09748] focus:ring-2 focus:ring-[#c09748]/20 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#777b86] hover:text-[#17191c] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Painter Dropdown Filter (Equal width: 215px) */}
            <div className="w-full sm:w-[215px] shrink-0">
              <PortalFilterSelect
                value={painterFilter}
                onChange={setPainterFilter}
                options={painterDropdownOptions}
                icon={<Paintbrush className="w-3.5 h-3.5 text-[#c09748]" />}
                placeholder="All Painters"
                searchable={true}
              />
            </div>

            {/* Active Party / Clients Dropdown Filter (Equal width: 215px) */}
            <div className="w-full sm:w-[215px] shrink-0">
              <PortalFilterSelect
                value={customerFilter}
                onChange={setCustomerFilter}
                options={customerDropdownOptions}
                icon={<Building2 className="w-3.5 h-3.5 text-[#c09748]" />}
                placeholder="Active Parties"
                searchable={true}
              />
            </div>

            {/* Status / Urgency Dropdown Filter (Equal width: 215px) */}
            <div className="w-full sm:w-[215px] shrink-0">
              <PortalFilterSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={statusDropdownOptions}
                icon={<Filter className="w-3.5 h-3.5 text-[#c09748]" />}
                placeholder="All Statuses"
                searchable={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 5: MATERIAL REQUISITIONS & CUSTODY ACCEPTANCE DESK                 */}
      {/* ====================================================================== */}
      
      {activeTab === 'PRIORITY_QUEUE' ? (
        /* ====================================================================== */
        /* TAB 0: PLANT HEAD PRIORITY ORDERS QUEUE (ASSIGNED TO PRODUCTION MGR)   */
        /* ====================================================================== */
        <div className="space-y-4">
          <div className="bg-white rounded-[24px] border border-[#ececec] p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ececec]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#c09748] animate-pulse" />
                  <h3 className="font-serif font-normal text-lg sm:text-2xl text-[#17191c]">
                    Plant Head Priority Production Orders
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]">
                    Satish Sharma's Schedule
                  </span>
                </div>
                <p className="text-xs text-[#777b86] mt-1">
                  Plant Head ne delivery commitments aur line changeover minimize karne ke hisaab se orders prioritize kiye hain. Production Manager in orders par <strong>"+ Create Job Card"</strong> click karke booth aur painter assign karta hai.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-[#777b86]">
                Pending Launches: <strong className="text-[#17191c]">{plantHeadPriorities.filter(p => p.status === 'Priority Assigned').length}</strong>
              </div>
            </div>

            {/* Priority Cards List */}
            <div className="space-y-3.5">
              {plantHeadPriorities.length === 0 ? (
                <div className="p-8 text-center text-[#777b86] space-y-2">
                  <Flag className="w-8 h-8 text-[#979799] mx-auto" />
                  <p className="font-serif text-base text-[#17191c]">No Priority Orders Assigned</p>
                  <p className="text-xs">Plant Head ne abhi tak kisi store stock par priority assign nahi ki hai.</p>
                </div>
              ) : (
                plantHeadPriorities
                  .sort((a, b) => {
                    const weight = { P1_URGENT: 1, P2_HIGH: 2, P3_NORMAL: 3, HOLD: 4 };
                    return (weight[a.priorityLevel] || 9) - (weight[b.priorityLevel] || 9);
                  })
                  .map((prio) => {
                    const isP1 = prio.priorityLevel === 'P1_URGENT';
                    const isP2 = prio.priorityLevel === 'P2_HIGH';
                    const isP3 = prio.priorityLevel === 'P3_NORMAL';
                    
                    // Strict matching for this specific priority batch (avoids pulling unrelated historical cards)
                    const matchingJobCards = jobCards.filter(jc => 
                      (prio.linkedJobCardNo && jc.jobCardNo === prio.linkedJobCardNo) ||
                      (jc.sourceGrnNo && prio.grnNo && jc.sourceGrnNo === prio.grnNo) ||
                      (jc.wNo && prio.challanNo && jc.wNo.toLowerCase().trim() === prio.challanNo.toLowerCase().trim()) ||
                      (jc.woNo && prio.challanNo && jc.woNo.toLowerCase().trim() === prio.challanNo.toLowerCase().trim())
                    );

                    // Dynamic multi-card allocation calculation
                    const totalLotQty = prio.totalOrderQty || (prio.id === 'PRIO-2026-001' ? 10000 : prio.availableQty);
                    const allocatedQty = matchingJobCards.reduce((acc, jc) => acc + (Number(jc.targetQty) || 0), 0);
                    const remainingQtyToAllocate = Math.max(0, totalLotQty - allocatedQty);
                    const hasJobCards = matchingJobCards.length > 0;
                    const isFullyAllocated = hasJobCards && remainingQtyToAllocate === 0;
                    const allocationPercent = Math.min(100, Math.round((allocatedQty / totalLotQty) * 100));

                    return (
                      <div
                        key={prio.id}
                        className={`p-5 sm:p-6 rounded-[24px] border transition shadow-xs space-y-4 bg-white ${
                          isP1
                            ? 'border-rose-200 ring-1 ring-rose-100 hover:border-rose-300'
                            : isP2
                              ? 'border-amber-200 ring-1 ring-amber-100 hover:border-amber-300'
                              : 'border-[#ececec] hover:border-[#c09748]'
                        }`}
                      >
                        {/* 1. TOP UTILITY HEADER: Priority badge, Challan & Due Date */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#ececec]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border shadow-2xs ${
                              isP1 
                                ? 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse' 
                                : isP2 
                                  ? 'bg-amber-50 text-amber-800 border-amber-200' 
                                  : 'bg-[#faf3e0] text-[#8a6521] border-[#f4e5be]'
                            }`}>
                              {isP1 ? 'Priority 1: Critical Line Shortage' : isP2 ? 'Priority 2: High Priority' : 'Priority 3: Standard FIFO'}
                            </span>

                            <span className="text-xs font-mono text-[#777b86] px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec]">
                              {prio.challanNo ? `Challan: ${prio.challanNo}` : prio.id}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs font-mono text-[#777b86]">
                            <Calendar className="w-3.5 h-3.5 text-[#c09748]" />
                            <span>Target Date: <strong className="text-[#17191c] font-semibold">{prio.targetDate}</strong></span>
                          </div>
                        </div>

                        {/* 2. MAIN DETAILS: Customer Name & Part Description */}
                        <div>
                          <h4 className="font-serif font-normal text-xl sm:text-2xl text-[#17191c] flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-[#c09748] shrink-0" />
                            <span>{prio.customer}</span>
                          </h4>
                          <p className="text-xs text-[#777b86] mt-1">
                            Part: <strong className="font-mono text-[#17191c]">{prio.partCode}</strong> • {prio.partDescription}
                          </p>
                        </div>

                        {/* 3. PLANT HEAD DIRECTIVE (Concise & Elegant) */}
                        {prio.plantHeadRemarks && (
                          <div className="p-3 rounded-[16px] bg-[#faf7ed] border border-[#f4e5be] text-xs text-[#8a6521] italic flex items-center gap-2.5">
                            <span className="font-bold not-italic font-mono uppercase text-[10px] text-[#8a6521] px-2 py-0.5 rounded-md bg-white border border-[#f4e5be] shrink-0">
                              Directive
                            </span>
                            <span className="truncate leading-relaxed">"{prio.plantHeadRemarks}"</span>
                          </div>
                        )}

                        {/* 4. VISUAL QUANTITY ALLOCATION PROGRESS STRIP */}
                        <div className="space-y-2 bg-[#fafafb] p-3.5 rounded-[18px] border border-[#ececec]">
                          <div className="flex items-center justify-between text-xs font-mono flex-wrap gap-2">
                            <span className="text-[#777b86]">
                              Total Lot: <strong className="text-[#17191c] font-bold">{totalLotQty.toLocaleString('en-IN')} {prio.uom}</strong> • Allocated: <strong className="text-[#8a6521] font-bold">{allocatedQty.toLocaleString('en-IN')} {prio.uom}</strong> ({allocationPercent}%)
                            </span>
                            <span className={`font-bold px-2.5 py-0.5 rounded-full text-xs ${
                              remainingQtyToAllocate > 0
                                ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]'
                                : 'bg-[#faf7ed] text-[#8a6521] border border-[#f4e5be]'
                            }`}>
                              {remainingQtyToAllocate > 0
                                ? `${remainingQtyToAllocate.toLocaleString('en-IN')} Pcs Unassigned`
                                : '100% Fully Allocated'}
                            </span>
                          </div>

                          <div className="h-2 w-full bg-[#e5e7eb] rounded-full overflow-hidden">
                            <div 
                              className="bg-[#c09748] h-full transition-all duration-300 rounded-full"
                              style={{ width: `${allocationPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* 5. FOOTER: Active Job Cards & Primary Action Button */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#f2f2f3]">
                          {/* Left: Active Cards Badges */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {matchingJobCards.length > 0 ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-mono text-[#777b86]">Active Cards:</span>
                                {matchingJobCards.slice(0, 3).map(c => (
                                  <button
                                    key={c.jobCardNo}
                                    type="button"
                                    onClick={() => {
                                      setSelectedJobCardForView(c);
                                      setShowJobCardModal(true);
                                    }}
                                    className="px-2.5 py-1 rounded-full bg-white hover:bg-gray-100 border border-[#dcdfe4] text-xs font-mono font-bold text-[#17191c] cursor-pointer shadow-2xs transition active:scale-95"
                                    title={`Open ${c.jobCardNo}`}
                                  >
                                    {c.jobCardNo} ({c.targetQty} Pcs)
                                  </button>
                                ))}
                                {matchingJobCards.length > 3 && (
                                  <span className="text-xs text-[#777b86] font-mono">
                                    +${matchingJobCards.length - 3} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-[#777b86] font-mono">No Job Card issued yet</span>
                            )}
                          </div>

                          {/* Right: Action Button */}
                          <div>
                            {remainingQtyToAllocate > 0 ? (
                              <button
                                type="button"
                                onClick={() => handleLaunchJobCardFromPriority(prio, remainingQtyToAllocate)}
                                disabled={isPlantDayClosed}
                                className="px-5 py-2.5 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] font-bold text-xs shadow-2xs cursor-pointer transition flex items-center gap-1.5 active:scale-95"
                              >
                                <Plus className="w-3.5 h-3.5 text-[#8a6521]" />
                                <span>{hasJobCards ? `Create Next Job Card (${remainingQtyToAllocate.toLocaleString('en-IN')} Pcs Left)` : `Create Job Card for this Order (${totalLotQty.toLocaleString('en-IN')} Pcs)`}</span>
                              </button>
                            ) : (
                              <div className="px-4 py-2 rounded-full bg-[#faf7ed] text-[#8a6521] border border-[#f4e5be] text-xs font-mono font-bold flex items-center gap-1.5 shadow-2xs">
                                <CheckCircle className="w-3.5 h-3.5 text-[#c09748]" />
                                <span>Order 100% Fully Allocated</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'REQUISITIONS' ? (

        <div className="space-y-4">
          <div className="bg-white rounded-[24px] border border-[#ececec] p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ececec]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-normal text-lg sm:text-xl text-[#17191c]">
                    Store Material Demands & Floor Inward Custody Desk
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]">
                    MRN Handshake Desk
                  </span>
                </div>
                <p className="text-xs text-[#777b86] mt-0.5">
                  Production Manager store se raw substrates/paints demand karta hai. Store MIN slip bhejta hai, aur supervisor physical verify karke custody accept karta hai.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenRequisitionModal()}
                disabled={isPlantDayClosed}
                className="px-4 py-2 rounded-full bg-[#17191c] hover:bg-black text-[#c09748] font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition select-none self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5 text-[#c09748]" />
                <span>+ Raise New Requisition (MRN)</span>
              </button>
            </div>

            {/* Desktop Table for Material Requisitions */}
            <div className="hidden md:block overflow-x-auto border border-[#ececec] rounded-[16px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#fafafb] text-[#777b86] font-semibold uppercase text-[10px] tracking-wider border-b border-[#ececec]">
                    <th className="p-3">MRN No & Timestamp</th>
                    <th className="p-3">Target Job Card & Customer</th>
                    <th className="p-3">Material & Specification</th>
                    <th className="p-3 text-center">Demanded Qty</th>
                    <th className="p-3">Urgency & Shift</th>
                    <th className="p-3 text-center">Store Dispatch Status</th>
                    <th className="p-3 text-right">Floor Custody Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ececec] text-[#17191c]">
                  {materialRequisitions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-[#777b86]">
                        No material requisitions raised yet. Click <strong>"+ Raise New Requisition"</strong> to demand materials from store.
                      </td>
                    </tr>
                  ) : (
                    materialRequisitions.map((req, idx) => {
                      const isPending = req.status === 'Pending Store Issue';
                      const isDispatched = req.status === 'Dispatched by Store';
                      const isReceived = req.status === 'Received by Production';
                      const isDiscrepant = req.status === 'Discrepancy Flagged';

                      return (
                        <tr key={idx} className="hover:bg-[#fafafb] transition">
                          <td className="p-3">
                            <div className="font-mono font-bold text-[#c09748]">{req.mrnNo}</div>
                            <div className="text-[11px] text-[#777b86]">{req.date} {req.time}</div>
                            <div className="text-[10px] font-mono text-gray-400">{req.plant}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-mono font-bold text-[#17191c]">{req.jobCardNo}</div>
                            <div className="font-mono text-xs text-[#8a6521]">WO: {req.woNo}</div>
                            <div className="text-[10px] text-[#777b86]">{req.customer}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-[#17191c]">{req.partDescription}</div>
                            <div className="font-mono text-[11px] text-[#777b86]">Code: {req.partCode}</div>
                            {req.colorName && (
                              <div className="text-[10px] text-[#8a6521]">Shade: {req.colorName}</div>
                            )}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-sm bg-[#faf7ed]/60 text-[#8a6521]">
                            {req.requestedQty.toLocaleString('en-IN')} {req.uom}
                            {req.issuedQty !== undefined && req.issuedQty !== req.requestedQty && (
                              <div className="text-[10px] font-normal text-[#777b86]">
                                Store Issued: {req.issuedQty} {req.uom}
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              req.urgency.includes('High') || req.urgency.includes('Urgent')
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {req.urgency}
                            </span>
                            <div className="text-[10px] text-[#777b86] mt-0.5 truncate max-w-[120px]">
                              Req by: {req.requestedBy}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              isPending
                                ? 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse'
                                : isDispatched
                                  ? 'bg-blue-50 text-blue-900 border-blue-200'
                                  : isReceived
                                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                    : 'bg-rose-50 text-rose-900 border-rose-300'
                            }`}>
                              {req.status}
                            </span>
                            {req.issuedSlipNo && (
                              <div className="text-[10px] font-mono text-blue-700 mt-1">
                                Slip: {req.issuedSlipNo}
                              </div>
                            )}
                            {req.discrepancyQty !== undefined && req.discrepancyQty !== 0 && (
                              <div className="text-[10px] font-bold text-rose-700 mt-0.5">
                                Diff: {req.discrepancyQty > 0 ? `-${req.discrepancyQty} Shortage` : `+${Math.abs(req.discrepancyQty)} Excess`}
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {isDispatched ? (
                              <button
                                type="button"
                                onClick={() => handleOpenAcceptModal(req)}
                                className="px-3.5 py-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer transition flex items-center gap-1.5 ml-auto"
                              >
                                <PackageCheck className="w-3.5 h-3.5" />
                                <span>✓ Accept & Take Custody</span>
                              </button>
                            ) : isPending ? (
                              <span className="text-[11px] text-amber-700 font-medium italic">
                                Awaiting Store MIN Issue...
                              </span>
                            ) : isReceived ? (() => {
                              const reqMatchingPir = preProductionReports.find(
                                p => p.jobCardNo.toLowerCase() === req.jobCardNo.toLowerCase() ||
                                     (req.woNo && p.workOrderNo && p.workOrderNo.toLowerCase() === req.woNo.toLowerCase())
                              );

                              return (
                                <div className="text-right flex flex-col items-end gap-1.5">
                                  <span className="text-[11px] text-emerald-800 font-bold flex items-center justify-end gap-1">
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>In Active WIP</span>
                                  </span>
                                  <div className="text-[10px] text-[#777b86]">
                                    {req.receivedQty} {req.uom} recd by {req.receivedBy?.split(' ')[0]}
                                  </div>
                                  <div className="flex items-center gap-1.5 pt-0.5">
                                    {reqMatchingPir ? (
                                      <button
                                        type="button"
                                        onClick={() => downloadStandardPreProductionPdf(reqMatchingPir)}
                                        className="px-2.5 py-1 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] font-bold text-[10px] flex items-center gap-1 shadow-2xs cursor-pointer transition"
                                        title={`Download PIR PDF (${reqMatchingPir.reportNo})`}
                                      >
                                        <Download className="w-3 h-3 text-[#c09748]" />
                                        <span>PIR PDF ({reqMatchingPir.reportNo})</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const matchedJc = jobCards.find(
                                            j => j.jobCardNo.toLowerCase() === req.jobCardNo.toLowerCase() ||
                                                 (j.woNo && req.woNo && j.woNo.toLowerCase() === req.woNo.toLowerCase())
                                          );
                                          if (matchedJc) {
                                            setSelectedJcForPir(matchedJc);
                                          } else {
                                            setSelectedJcForPir({
                                              jobCardNo: req.jobCardNo,
                                              woNo: req.woNo,
                                              customer: req.customer,
                                              partCode: req.partCode,
                                              partDescription: req.partDescription,
                                              color: req.colorName || 'Standard OEM Tone',
                                              targetQty: req.receivedQty || req.issuedQty || req.requestedQty,
                                              issuedRawQty: req.receivedQty || req.issuedQty || req.requestedQty,
                                              sprayedQty: 0,
                                              goodQty: 0,
                                              rejectQty: 0,
                                              status: 'Open',
                                              jobCardType: 'master',
                                              docNo: 'Doc No: 001',
                                              dept: 'Cubic Line',
                                              boothNo: 'Booth #1',
                                              painterName: 'Ramesh Kumar (P1)',
                                              checkingPerson: 'Amit Verma'
                                            });
                                          }
                                          setShowPirModal(true);
                                        }}
                                        className="px-2.5 py-1 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] font-bold text-[10px] flex items-center gap-1 shadow-2xs cursor-pointer transition"
                                      >
                                        <Sparkles className="w-3 h-3 text-[#c09748]" />
                                        <span>+ Generate PIR Report</span>
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleCreateJobCardFromReceivedBatch(req)}
                                      className="px-3 py-1 rounded-full bg-[#17191c] hover:bg-black text-[#c09748] font-bold text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer transition"
                                    >
                                      <Plus className="w-3 h-3 text-[#c09748]" />
                                      <span>+ Job Card</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })() : (
                              <div className="text-right">
                                <span className="text-[11px] text-rose-700 font-bold flex items-center justify-end gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Discrepancy Logged</span>
                                </span>
                                <div className="text-[10px] text-[#777b86]">
                                  Count: {req.receivedQty}/{req.issuedQty || req.requestedQty}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View: Cards for Requisitions */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {materialRequisitions.map((req, idx) => {
                const isPending = req.status === 'Pending Store Issue';
                const isDispatched = req.status === 'Dispatched by Store';
                const isReceived = req.status === 'Received by Production';
                const isDiscrepant = req.status === 'Discrepancy Flagged';

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-[16px] border bg-white space-y-3 shadow-2xs ${
                      isDiscrepant ? 'border-rose-200 bg-rose-50/20' : isDispatched ? 'border-blue-200 bg-blue-50/10' : 'border-[#ececec]'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[#ececec]">
                      <div>
                        <span className="font-mono font-bold text-xs text-[#c09748]">{req.mrnNo}</span>
                        <div className="text-[10px] text-[#777b86]">{req.date} {req.time}</div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isPending
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : isDispatched
                            ? 'bg-blue-50 text-blue-900 border-blue-200'
                            : isReceived
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                              : 'bg-rose-50 text-rose-900 border-rose-300'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      <div className="font-bold text-[#17191c]">{req.jobCardNo} • {req.customer}</div>
                      <div className="text-[#777b86]">{req.partDescription} ({req.partCode})</div>
                      {req.colorName && <div className="text-[#8a6521]">Shade: {req.colorName}</div>}
                    </div>

                    <div className="p-2.5 rounded-[12px] bg-[#fafafb] border border-[#ececec] flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[9px] text-[#777b86] uppercase block">Demanded Qty</span>
                        <span className="font-mono font-bold text-[#8a6521]">{req.requestedQty} {req.uom}</span>
                      </div>
                      {req.issuedSlipNo && (
                        <div className="text-right">
                          <span className="text-[9px] text-[#777b86] uppercase block">Store Slip</span>
                          <span className="font-mono font-bold text-blue-700">{req.issuedSlipNo}</span>
                        </div>
                      )}
                    </div>

                    {isDispatched && (
                      <button
                        type="button"
                        onClick={() => handleOpenAcceptModal(req)}
                        className="w-full py-2 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <PackageCheck className="w-4 h-4" />
                        <span>✓ Verify & Accept Floor Custody</span>
                      </button>
                    )}

                    {isReceived && (
                      <div className="space-y-2 pt-2 border-t border-[#ececec]">
                        <div className="flex items-center justify-between text-xs text-emerald-800 font-bold">
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Received in WIP</span>
                          </span>
                          <span className="text-[11px] font-mono text-[#777b86]">
                            {req.receivedQty} {req.uom}
                          </span>
                        </div>
                        {(() => {
                          const reqMatchingPir = preProductionReports.find(
                            p => p.jobCardNo.toLowerCase() === req.jobCardNo.toLowerCase() ||
                                 (req.woNo && p.workOrderNo && p.workOrderNo.toLowerCase() === req.woNo.toLowerCase())
                          );

                          return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {reqMatchingPir ? (
                                <button
                                  type="button"
                                  onClick={() => downloadStandardPreProductionPdf(reqMatchingPir)}
                                  className="w-full py-2 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition"
                                >
                                  <Download className="w-3.5 h-3.5 text-[#c09748]" />
                                  <span>Download PIR PDF</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const matchedJc = jobCards.find(
                                      j => j.jobCardNo.toLowerCase() === req.jobCardNo.toLowerCase() ||
                                           (j.woNo && req.woNo && j.woNo.toLowerCase() === req.woNo.toLowerCase())
                                    );
                                    if (matchedJc) {
                                      setSelectedJcForPir(matchedJc);
                                    } else {
                                      setSelectedJcForPir({
                                        jobCardNo: req.jobCardNo,
                                        woNo: req.woNo,
                                        customer: req.customer,
                                        partCode: req.partCode,
                                        partDescription: req.partDescription,
                                        color: req.colorName || 'Standard OEM Tone',
                                        targetQty: req.receivedQty || req.issuedQty || req.requestedQty,
                                        issuedRawQty: req.receivedQty || req.issuedQty || req.requestedQty,
                                        sprayedQty: 0,
                                        goodQty: 0,
                                        rejectQty: 0,
                                        status: 'Open',
                                        jobCardType: 'master',
                                        docNo: 'Doc No: 001',
                                        dept: 'Cubic Line',
                                        boothNo: 'Booth #1',
                                        painterName: 'Ramesh Kumar (P1)',
                                        checkingPerson: 'Amit Verma'
                                      });
                                    }
                                    setShowPirModal(true);
                                  }}
                                  className="w-full py-2 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-[#c09748]" />
                                  <span>+ Generate PIR Report</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleCreateJobCardFromReceivedBatch(req)}
                                className="w-full py-2 rounded-full bg-[#17191c] hover:bg-black text-[#c09748] font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition"
                              >
                                <Plus className="w-3.5 h-3.5 text-[#c09748]" />
                                <span>+ Create Job Card</span>
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : activeTab === 'BOOTH_FLEET' ? (
        /* ====================================================================== */
        /* TAB 7: CENTRAL SPRAY BOOTH & PAINTER TECHNICIAN FLEET MANAGEMENT       */
        /* ====================================================================== */
        <div className="space-y-6">
          {/* SECTION 1: SPRAY BOOTHS & PAINTING LINES FLEET */}
          <div className="bg-white rounded-[24px] border border-[#ececec] p-4 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ececec]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#c09748] animate-pulse" />
                  <h3 className="font-serif font-normal text-lg sm:text-2xl text-[#17191c]">
                    Operational Painting Lines & Spray Booth Fleet
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono font-bold">
                    {paintingBooths.filter(b => b.status === 'Active').length}/{paintingBooths.length} Active Lines
                  </span>
                </div>
                <p className="text-xs text-[#777b86] mt-1">
                  Configure shop floor spray booths and conveyor lines. Booths configured here appear across Job Card Point 3 allocation and Material Demands (MRN).
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingBooth(null);
                  setShowBoothModal(true);
                }}
                className="px-4 py-2 rounded-full bg-[#17191c] hover:bg-[#23272f] text-[#c09748] font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition self-start sm:self-auto active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 text-[#c09748]" />
                <span>+ Add Painting Booth</span>
              </button>
            </div>

            {/* Comprehensive Fleet Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {paintingBooths.map(booth => {
                const isActive = booth.status === 'Active';
                const isMaintenance = booth.status === 'Under Maintenance';
                return (
                  <div
                    key={booth.id}
                    className={`p-4 rounded-[20px] border transition flex flex-col justify-between gap-3.5 ${
                      isActive
                        ? 'border-[#f4e5be] bg-white hover:border-[#c09748] shadow-xs'
                        : isMaintenance
                        ? 'border-amber-200 bg-amber-50/30'
                        : 'border-purple-200 bg-purple-50/30'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-mono font-bold text-[#8a6521] px-2 py-0.5 rounded-md bg-[#faf3e0] border border-[#f4e5be]">
                          {booth.id}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleBoothStatus(booth.id)}
                          title="Click to toggle booth operational status"
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition border ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : isMaintenance
                              ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                              : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                          }`}
                        >
                          {isActive ? '● Active Line' : isMaintenance ? '⚠️ Maintenance' : '🔄 Changeover'}
                        </button>
                      </div>

                      <h4 className="font-bold text-sm text-[#17191c] leading-snug">
                        {booth.name}
                      </h4>
                      <div className="text-xs text-[#777b86] mt-0.5 font-mono">
                        {booth.type}
                      </div>

                      <div className="mt-3 p-2.5 rounded-[12px] bg-[#fafafb] border border-[#ececec] text-[11px] text-[#777b86] space-y-1">
                        <div className="flex justify-between">
                          <span>Capacity:</span>
                          <strong className="text-[#17191c]">{(booth.capacityPerShift || 1000).toLocaleString()} pcs/shift</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Air Pressure:</span>
                          <strong className="text-[#17191c]">{booth.airPressureBar || 4.0} Bar</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Curing Temp:</span>
                          <strong className="text-[#17191c]">{booth.curingTempC || 60}°C</strong>
                        </div>
                        {booth.primaryPainterName && (
                          <div className="flex justify-between pt-1 border-t border-[#ececec]">
                            <span>Primary Tech:</span>
                            <span className="font-semibold text-[#8a6521]">{booth.primaryPainterName}</span>
                          </div>
                        )}
                      </div>

                      {booth.notes && (
                        <p className="text-[10px] text-[#979799] italic mt-1.5 line-clamp-1">
                          "{booth.notes}"
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 pt-2 border-t border-[#ececec]">
                      <button
                        type="button"
                        onClick={() => handleOpenRequisitionModal(undefined, booth.name)}
                        disabled={isPlantDayClosed || !isActive}
                        className={`w-full py-1.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                          isActive && !isPlantDayClosed
                            ? 'bg-[#17191c] hover:bg-[#23272f] text-[#c09748] cursor-pointer shadow-2xs'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 text-[#c09748]" />
                        <span>Demand Material (MRN)</span>
                      </button>

                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBooth(booth);
                            setShowBoothModal(true);
                          }}
                          className="flex-1 py-1 px-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-[11px] font-semibold transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Edit className="w-3 h-3 text-[#777b86]" />
                          <span>Edit Booth</span>
                        </button>

                        {paintingBooths.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteBooth(booth.id, booth.name)}
                            className="p-1.5 rounded-full text-[#979799] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete Booth"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: FLOOR PAINTERS & COATING TECHNICIANS FLEET */}
          <div className="bg-white rounded-[24px] border border-[#ececec] p-4 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ececec]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#c09748] animate-pulse" />
                  <h3 className="font-serif font-normal text-lg sm:text-2xl text-[#17191c]">
                    Floor Painters & Coating Technicians Fleet
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono font-bold">
                    {painters.length} Certified Painters
                  </span>
                </div>
                <p className="text-xs text-[#777b86] mt-1">
                  Yahan configure kiye gaye technicians hi Job Card creation me painter selection combobox me visible hote hain. Max 2 simultaneous job cards allowed per painter.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingPainter(null);
                  setShowPainterModal(true);
                }}
                className="px-4 py-2 rounded-full bg-[#17191c] hover:bg-[#23272f] text-[#c09748] font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition self-start sm:self-auto active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 text-[#c09748]" />
                <span>+ Add New Painter</span>
              </button>
            </div>

            {/* Painters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {painters.map(painter => {
                const activeJobsCount = getPainterActiveJobCount(painter.name);
                const isCapped = !canAssignPainter(painter.name);
                const stats = getPainterPerformanceStats(painter.id);

                const painterJobCards = jobCards.filter(jc => {
                  const pName = painter.name.toLowerCase().trim();
                  const firstName = pName.split(' ')[0];
                  const pCode = painter.code?.toLowerCase().trim();
                  const assigned = (jc.assignedPainterName || (jc as any).painterName || '').toLowerCase().trim();
                  const assignedId = (jc.assignedPainterId || '').toLowerCase().trim();
                  return (
                    assignedId === painter.id.toLowerCase() ||
                    (pCode && (assigned.includes(pCode) || assignedId === pCode)) ||
                    assigned === pName ||
                    assigned.includes(pName) ||
                    (firstName && assigned.includes(firstName))
                  );
                });
                const hasExistingJobs = painterJobCards.length > 0;

                return (
                  <div
                    key={painter.id}
                    className={`p-4 rounded-[20px] border transition flex flex-col justify-between gap-3.5 ${
                      isCapped
                        ? 'border-amber-200 bg-amber-50/20'
                        : 'border-[#ececec] bg-white hover:border-[#c09748] shadow-xs'
                    }`}
                  >
                    <div>
                      {/* Top Bar: Code badge & Status */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] font-bold flex items-center justify-center font-mono text-xs">
                            {painter.code}
                          </span>
                          <span className="text-[11px] font-mono text-[#777b86]">
                            ID: {painter.id}
                          </span>
                          {hasExistingJobs && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-bold flex items-center gap-0.5" title="ERP Protected">
                              <Lock className="w-2.5 h-2.5" />
                              <span>{painterJobCards.length} Jobs</span>
                            </span>
                          )}
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-800 border-emerald-200">
                          ● Active
                        </span>
                      </div>

                      {/* Name & Specialization */}
                      <h4 className="font-bold text-sm text-[#17191c]">
                        {painter.name}
                      </h4>
                      <div className="text-xs text-[#c09748] font-medium mt-0.5">
                        {painter.specialization || 'General Spray Coating'}
                      </div>

                      {/* Station details */}
                      <div className="mt-2 text-[11px] text-[#777b86] space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-[#979799]" />
                          <span>Station: <strong className="text-[#17191c]">{painter.boothNo || 'Dynamic Allocation'}</strong></span>
                        </div>
                        {painter.phone && (
                          <div className="text-[10px] text-[#979799] font-mono">
                            ☎ {painter.phone}
                          </div>
                        )}
                      </div>

                      {/* Workload Meter (Max 2 Jobs) */}
                      <div className="mt-3 p-2.5 rounded-[14px] bg-[#fafafb] border border-[#ececec] space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-[#17191c]">Active Workload:</span>
                          <span className={`font-mono font-bold ${
                            isCapped ? 'text-amber-700' : 'text-emerald-700'
                          }`}>
                            {activeJobsCount} / 2 Slots
                          </span>
                        </div>

                        {/* Visual 2-slot bars */}
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className={`h-2 rounded-full transition ${
                            activeJobsCount >= 1 ? 'bg-[#c09748]' : 'bg-[#e5e7eb]'
                          }`} />
                          <div className={`h-2 rounded-full transition ${
                            activeJobsCount >= 2 ? 'bg-[#c09748]' : 'bg-[#e5e7eb]'
                          }`} />
                        </div>

                        <div className="text-[10px] text-right font-medium">
                          {isCapped ? (
                            <span className="text-amber-700 font-semibold">⚠️ Floor Max Capacity (2/2)</span>
                          ) : (
                            <span className="text-emerald-700">✓ Ready to receive next Job Card</span>
                          )}
                        </div>
                      </div>

                      {/* Performance Quick Summary */}
                      <div className="mt-2 pt-2 border-t border-[#ececec] flex items-center justify-between text-[10px] text-[#777b86]">
                        <span>Done: <strong className="text-[#17191c]">{stats.completedJobs}</strong></span>
                        <span>Pass Rate: <strong className="text-emerald-700">{stats.passRate}%</strong></span>
                        <span>Rating: <strong className="text-[#8a6521]">★ {stats.rating}</strong></span>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="space-y-2 pt-2 border-t border-[#ececec]">
                      <button
                        type="button"
                        onClick={() => setSelectedPainterForDetail(painter)}
                        className="w-full py-2 px-3 rounded-full bg-[#17191c] hover:bg-[#23272f] text-[#c09748] text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#c09748]" />
                        <span>View Profile & Job History ({painterJobCards.length}) →</span>
                      </button>

                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPainter(painter);
                            setShowPainterModal(true);
                          }}
                          className="flex-1 py-1.5 px-3 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <Edit className="w-3 h-3 text-[#777b86]" />
                          <span>Edit Profile</span>
                        </button>

                        {hasExistingJobs ? (
                          <button
                            type="button"
                            onClick={() => {
                              alert(`Cannot delete "${painter.name}": This technician has ${painterJobCards.length} Job Card(s) in system records. In order to preserve manufacturing audit trails and quality history, deletion is blocked. You can set their status to "On Leave" instead.`);
                            }}
                            className="p-1.5 rounded-full text-amber-700 bg-amber-50 hover:bg-amber-100 transition cursor-pointer border border-amber-300"
                            title={`Protected: ${painterJobCards.length} Job Cards linked`}
                          >
                            <Lock className="w-3.5 h-3.5 text-amber-700" />
                          </button>
                        ) : painters.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => handleDeletePainter(painter.id, painter.name)}
                            className="p-1.5 rounded-full text-[#979799] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete Painter"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Cards Grid for Job Cards */
        <div className="space-y-3.5">
          {/* List Header: Active Filter Reset on Left & Showing Count on Top Right */}
          <div className="flex items-center justify-between text-xs px-1">
            <div>
              {isFilterActive && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3 py-1 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-[11px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                >
                  <X className="w-3 h-3 text-[#c09748]" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>

            <div className="text-xs text-[#777b86] ml-auto font-medium">
              Showing <strong className="text-[#17191c] font-mono font-bold">{filteredCards.length}</strong> of <strong className="font-mono">{filterStats.total}</strong> Cards
            </div>
          </div>

          {filteredCards.length === 0 ? (
            <div className="bg-white rounded-[24px] border border-[#ececec] p-10 text-center space-y-3">
              <FileText className="w-8 h-8 text-[#979799] mx-auto" />
              <h3 className="font-serif text-lg text-[#17191c]">No Job Cards Found</h3>
              <p className="text-xs text-[#777b86]">No job cards match your active filter criteria.</p>
            </div>
          ) : (
          filteredCards.map(jc => {
            const isMaster = jc.jobCardType === 'master';
            const isPainterChild = jc.jobCardType === 'painter_child';
            const isReworkChild = jc.jobCardType === 'rework_child';
            const progressPercent = Math.min(100, Math.round((jc.sprayedQty / jc.targetQty) * 100));

            // If this is a master card, locate any associated children
            const childCards = isMaster 
              ? jobCards.filter(c => c.parentJobCardId === jc.jobCardNo)
              : [];
            const isExpanded = !!expandedMasterIds[jc.jobCardNo];
            const hasChildren = childCards.length > 0;

            // Lot-Wide Pre-Production Inspection (PIR) Resolution
            const matchingPir = preProductionReports.find(
              p => p.overallResult === 'Passed' && (
                p.jobCardNo.toLowerCase() === jc.jobCardNo.toLowerCase() ||
                (jc.parentJobCardId && p.jobCardNo.toLowerCase() === jc.parentJobCardId.toLowerCase()) ||
                (jc.woNo && p.workOrderNo && p.workOrderNo.trim().toLowerCase() === jc.woNo.trim().toLowerCase()) ||
                (jc.customer && p.customer && jc.customer.trim().toLowerCase() === p.customer.trim().toLowerCase() &&
                 jc.partCode && p.partCode && jc.partCode.trim().toLowerCase() === p.partCode.trim().toLowerCase())
              )
            ) || preProductionReports.find(
              p => p.jobCardNo.toLowerCase() === jc.jobCardNo.toLowerCase() ||
                   (jc.woNo && p.workOrderNo && p.workOrderNo.trim().toLowerCase() === jc.woNo.trim().toLowerCase())
            );

            const isPirPassed = jc.pirStatus === 'Passed' || (matchingPir?.overallResult === 'Passed');
            const activePirReportNo = jc.pirReportNo || matchingPir?.reportNo;

            // Lot-Wide FPA Resolution: Check if this Job Card or ANY card in the same Lot/WO/Customer+Part passed FPA
            const matchingFpa = fpaRecords.find(
              f => f.overallResult === 'Approved' && (
                f.jobCardNo.toLowerCase() === jc.jobCardNo.toLowerCase() ||
                (jc.parentJobCardId && f.jobCardNo.toLowerCase() === jc.parentJobCardId.toLowerCase()) ||
                (jc.woNo && f.woNo && f.woNo.trim().toLowerCase() === jc.woNo.trim().toLowerCase()) ||
                (jc.customer && f.customer && jc.customer.trim().toLowerCase() === f.customer.trim().toLowerCase() &&
                 jc.partCode && f.partCode && jc.partCode.trim().toLowerCase() === f.partCode.trim().toLowerCase())
              )
            ) || fpaRecords.find(
              f => f.jobCardNo.toLowerCase() === jc.jobCardNo.toLowerCase() ||
                   (jc.woNo && f.woNo && f.woNo.trim().toLowerCase() === jc.woNo.trim().toLowerCase())
            );

            const isFpaApproved = jc.fpaStatus === 'Approved' || (matchingFpa?.overallResult === 'Approved');
            const activeFpaReportNo = jc.fpaReportNo || matchingFpa?.reportNo;

            const isClosed = jc.status === 'Completed' || jc.status === 'Target Met' || jc.status === 'Verified & Accepted';
            const isSlaBreachedNow = (jc.isSlaBreached) || (!isClosed && jc.slaDeadline && new Date() > new Date(jc.slaDeadline));
            const effectiveDailyTarget = jc.dailyTargetQty || (jc.targetQty <= 1000 ? jc.targetQty : 1000);
            const todaySprayed = jc.sprayedQty || (jc.goodQty + (jc.rejectQty || 0)) || 0;
            const shiftPercent = effectiveDailyTarget > 0 ? Math.min(100, Math.round((todaySprayed / effectiveDailyTarget) * 100)) : 0;
            const poPercent = jc.targetQty > 0 ? Math.min(100, Math.round(((jc.goodQty || 0) / jc.targetQty) * 100)) : 0;

            return (
              <div
                key={jc.jobCardNo}
                className={`rounded-[20px] border p-4 sm:p-5 transition shadow-2xs hover:border-[#c09748]/60 space-y-3.5 bg-white ${
                  isReworkChild
                    ? 'border-amber-200 bg-amber-50/15'
                    : isPainterChild
                    ? 'border-[#ececec]'
                    : 'border-[#dfdfe2]'
                }`}
              >
                {/* 1. Top Utility Strip: Ref, Type Badges, QA Gates & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#f2f2f3]">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Job Card No Chip (Primary Anchor) */}
                    <span className="font-mono text-[11px] font-bold text-[#8a6521] px-2.5 py-0.5 rounded-full bg-[#faf7ed] border border-[#f4e5be]">
                      {jc.jobCardNo}
                    </span>

                    {/* Type Badge */}
                    {isMaster && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#f2f2f3] border border-[#dcdfe4] text-[#17191c] text-[11px] font-mono font-bold tracking-wide uppercase">
                        MASTER BATCH
                      </span>
                    )}
                    {isPainterChild && (
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-mono font-bold tracking-wide uppercase flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>PAINTER CARD ({jc.assignedPainterId || 'P1'})</span>
                      </span>
                    )}
                    {isReworkChild && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-mono font-bold tracking-wide uppercase flex items-center gap-1">
                        <RotateCcw className="w-3 h-3 text-amber-700" />
                        <span>REWORK SALVAGE</span>
                      </span>
                    )}

                    {/* Work Order */}
                    <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#777b86] text-[11px] font-mono">
                      WO: <strong className="text-[#17191c] font-semibold">{jc.wNo || jc.woNo || '-'}</strong>
                    </span>

                    {/* Plant & Booth */}
                    <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#777b86] text-[11px] font-mono hidden md:inline-flex items-center gap-1">
                      📍 {jc.plant || 'Haridwar'} ({jc.dept?.split('(')[0]?.trim() || jc.boothNo || 'Booth #1'})
                    </span>

                    {/* QA Gates Mini Pills */}
                    {isPirPassed ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-mono font-bold flex items-center gap-1" title={activePirReportNo ? `PIR Cleared under ${activePirReportNo}` : 'PIR Passed'}>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Gate 1: PIR ✓</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-mono font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>Gate 1: PIR Pending</span>
                      </span>
                    )}

                    {isFpaApproved ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-mono font-bold flex items-center gap-1" title={activeFpaReportNo ? `FPA Approved under ${activeFpaReportNo}` : 'FPA Approved'}>
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>Gate 2: FPA ✓</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 text-[11px] font-mono font-semibold flex items-center gap-1">
                        <span>Gate 2: FPA Pending</span>
                      </span>
                    )}
                  </div>

                  {/* Right Side: Status Badge & SLA (Confusing non-clickable Open pill removed) */}
                  <div className="flex items-center gap-2">
                    {isClosed ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-mono font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Time Se Hua ✓</span>
                      </span>
                    ) : isSlaBreachedNow ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-100 border border-rose-300 text-rose-900 text-[11px] font-mono font-bold flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>SLA Overdue</span>
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* 2. Main Content Grid: Customer & Part (Left) | Target Quota & Progress (Center) | Primary Actions (Right) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {/* Left: Customer & Part specs (6 cols) */}
                  <div className="md:col-span-6 space-y-1">
                    <h3 className="font-serif text-base sm:text-lg text-[#17191c] font-normal leading-snug">
                      {jc.customer}
                    </h3>
                    <p className="text-xs text-[#777b86] line-clamp-1">
                      {jc.partDescription} • Code: <strong className="text-[#17191c] font-mono">{jc.partCode}</strong>
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#777b86] pt-0.5">
                      <span>Shade: <strong className="text-[#17191c]">{jc.color}</strong></span>
                      <span>•</span>
                      <span>Painter: <strong className="text-[#17191c]">{jc.assignedPainterName || jc.painterName || 'Unassigned'}</strong></span>
                      {jc.deadlineDate && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-[#8a6521]">Target SLA: {jc.slaHours || 4}h</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Center: Shift & Total Progress (3 cols) */}
                  <div className="md:col-span-3 space-y-1.5 p-2.5 rounded-[14px] bg-[#fafafb] border border-[#ececec]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#777b86] text-[11px]">Today's Shift:</span>
                      <span className="font-mono font-bold text-[#17191c]">
                        {todaySprayed} <span className="text-[#777b86] font-normal">/ {effectiveDailyTarget} Pcs</span>
                      </span>
                    </div>
                    <div className="w-full bg-[#ececec] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#c09748]"
                        style={{ width: `${shiftPercent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10.5px] text-[#777b86]">
                      <span>PO: {jc.goodQty || 0}/{jc.targetQty} Pcs</span>
                      <span className="font-mono font-bold text-[#8a6521]">{poPercent}% Complete</span>
                    </div>
                  </div>

                  {/* Right: Actions (3 cols) */}
                  <div className="md:col-span-3 flex md:flex-col items-center md:items-end justify-end gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleViewJobCard(jc)}
                      className="w-full sm:w-auto md:w-full px-4 py-2 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#c09748]" />
                      <span>View Job Card</span>
                    </button>

                    <div className="flex items-center gap-1.5 w-full sm:w-auto md:w-full justify-end">
                      <button
                        type="button"
                        onClick={() => downloadStandardJobCardPdf(jc)}
                        className="flex-1 md:flex-initial px-3 py-1.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-[11px] font-semibold transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs active:scale-95"
                        title="Download PDF Slip"
                      >
                        <Download className="w-3 h-3 text-[#777b86]" />
                        <span>PDF</span>
                      </button>

                      {isMaster && hasChildren && (
                        <button
                          type="button"
                          onClick={() => toggleMasterExpand(jc.jobCardNo)}
                          className="px-2.5 py-1.5 rounded-full border border-[#ececec] bg-white hover:bg-gray-50 text-[#777b86] text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer"
                          title="Toggle Sub-Cards"
                        >
                          {isExpanded ? <ChevronDown className="w-3 h-3 text-[#c09748]" /> : <ChevronRight className="w-3 h-3 text-[#c09748]" />}
                          <span>{childCards.length}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sub-Card Tree Expansion for Master Card */}
                {isMaster && hasChildren && isExpanded && (
                  <div className="bg-[#fafafb] border-t border-[#ececec] p-3 rounded-[14px] space-y-2 mt-2">
                    <div className="text-[10.5px] font-bold uppercase tracking-wider text-[#777b86] flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-[#c09748]" />
                      <span>Dedicated 3-Painter Sub-Job Cards & Rework Child Ledger ({childCards.length}):</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {childCards.map(child => (
                        <div
                          key={child.jobCardNo}
                          onClick={() => handleViewJobCard(child)}
                          className="p-2.5 rounded-[12px] bg-white border border-[#ececec] hover:border-[#c09748] cursor-pointer transition text-xs space-y-1 shadow-2xs"
                        >
                          <div className="flex items-center justify-between font-mono text-[11px]">
                            <span className="font-bold text-[#c09748]">{child.jobCardNo}</span>
                            <span className="text-[#777b86]">{child.assignedPainterId || 'P1'}</span>
                          </div>
                          <div className="text-[11px] text-[#17191c] font-medium truncate">
                            {child.assignedPainterName || 'Painter'}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-[#777b86] pt-1 border-t border-[#f2f2f3]">
                            <span>{child.sprayedQty || 0} / {child.targetQty} Pcs</span>
                            <span className="font-bold text-[#8a6521]">
                              {Math.min(100, Math.round(((child.sprayedQty || 0) / child.targetQty) * 100))}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      )}

      {/* Modal 1: Log Shift Progress */}
      {showBatchModal && selectedJobCardForProgress && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-md w-full p-4 sm:p-6 shadow-2xl border border-[#ececec] space-y-4 text-xs max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center pb-3 border-b border-[#ececec]">
              <div>
                <h3 className="text-base font-serif font-normal text-[#17191c]">
                  Log Floor Shift Batch Progress
                </h3>
                <p className="text-[11px] text-[#777b86]">
                  Job Card: <strong className="font-mono text-[#c09748]">{selectedJobCardForProgress.jobCardNo}</strong>
                </p>
              </div>
              <button 
                onClick={handleCloseBatchModal} 
                className="font-bold text-[#979799] hover:text-[#17191c] cursor-pointer text-base"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-[#fafafb] rounded-[16px] border border-[#ececec] space-y-1">
              <div className="flex justify-between">
                <span className="text-[#777b86]">Operator / Painter:</span>
                <strong className="text-[#17191c]">{selectedJobCardForProgress.assignedPainterName || selectedJobCardForProgress.painterName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777b86]">Color Shade:</span>
                <strong className="text-[#17191c]">{selectedJobCardForProgress.color}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777b86]">Today's Shift Quota:</span>
                <strong className="text-[#8a6521] font-mono">{selectedJobCardForProgress.dailyTargetQty || selectedJobCardForProgress.targetQty} pcs</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777b86]">Total PO Target Cap:</span>
                <strong className="text-[#17191c] font-mono">{selectedJobCardForProgress.targetQty} pcs</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777b86]">Currently Sprayed:</span>
                <strong className="text-[#17191c] font-mono">{selectedJobCardForProgress.sprayedQty} pcs</strong>
              </div>
            </div>

            <form onSubmit={handleProgressSubmit} className="space-y-3">
              <div>
                <label className="block text-[#777b86] font-medium mb-1">Additional Sprayed Pcs</label>
                <input
                  type="number"
                  value={addedSprayed}
                  onChange={e => setAddedSprayed(Math.max(0, Number(e.target.value)))}
                  className="w-full p-2.5 rounded-[16px] border border-[#ececec] font-serif text-lg font-normal text-[#17191c] focus:border-[#c09748] focus:outline-none"
                  min={0}
                  required
                />
              </div>

              <div>
                <label className="block text-[#777b86] font-medium mb-1">
                  <span>Permanent Scrap / Dead Loss (Pcs)</span>
                  <span className="text-[10px] text-gray-400 block font-normal">Factory rework is handled in-booth. Only record unrecoverable dead scrap.</span>
                </label>
                <input
                  type="number"
                  value={addedReject}
                  onChange={e => setAddedReject(Math.max(0, Number(e.target.value)))}
                  className="w-full p-2.5 rounded-[16px] border border-[#ececec] font-serif text-lg font-normal text-red-600 focus:border-red-400 focus:outline-none"
                  min={0}
                  required
                />
              </div>

              <div>
                <label className="block text-[#777b86] font-medium mb-1">
                  Defect Category (PK_Master Defect Library)
                </label>
                <select
                  value={selectedDefectCategory}
                  onChange={e => setSelectedDefectCategory(e.target.value)}
                  className="w-full p-2.5 rounded-[16px] border border-[#ececec] bg-white text-[#17191c] text-xs font-medium focus:border-[#c09748] focus:outline-none cursor-pointer"
                >
                  {defects.map(d => (
                    <option key={d.code} value={d.code}>
                      {d.code} - {d.name} ({d.severity})
                    </option>
                  ))}
                </select>
              </div>

              {/* Company Consumables Floor Usage Tracking */}
              <div className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-[16px] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#8a6521]">
                    <Pipette className="w-3.5 h-3.5 text-[#c09748]" />
                    <span>Company Consumables Mixed & Consumed (Litres)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPaintConsumedInput(Number(((addedSprayed / 500) * 8).toFixed(1)));
                      setThinnerConsumedInput(Number(((addedSprayed / 500) * 3.2).toFixed(1)));
                      setHardenerConsumedInput(Number(((addedSprayed / 500) * 2.0).toFixed(1)));
                      setClearConsumedInput(Number(((addedSprayed / 200) * 1.0).toFixed(1)));
                    }}
                    className="text-[10px] font-semibold text-[#8a6521] hover:underline cursor-pointer"
                  >
                    Auto-Estimate ({addedSprayed} Pcs)
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-semibold text-[#777b86] block mb-0.5">2K Basecoat (L)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={paintConsumedInput}
                      onChange={e => setPaintConsumedInput(Math.max(0, Number(e.target.value)))}
                      className="w-full p-2 rounded-[12px] border border-[#ececec] bg-white font-mono text-xs font-bold text-[#17191c] focus:border-[#c09748] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-[#777b86] block mb-0.5">PU Thinner (L)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={thinnerConsumedInput}
                      onChange={e => setThinnerConsumedInput(Math.max(0, Number(e.target.value)))}
                      className="w-full p-2 rounded-[12px] border border-[#ececec] bg-white font-mono text-xs font-bold text-[#17191c] focus:border-[#c09748] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-[#777b86] block mb-0.5">2K Hardener (L)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={hardenerConsumedInput}
                      onChange={e => setHardenerConsumedInput(Math.max(0, Number(e.target.value)))}
                      className="w-full p-2 rounded-[12px] border border-[#ececec] bg-white font-mono text-xs font-bold text-[#17191c] focus:border-[#c09748] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-[#777b86] block mb-0.5">Clear Lacquer (L)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={clearConsumedInput}
                      onChange={e => setClearConsumedInput(Math.max(0, Number(e.target.value)))}
                      className="w-full p-2 rounded-[12px] border border-[#ececec] bg-white font-mono text-xs font-bold text-[#17191c] focus:border-[#c09748] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseBatchModal}
                  className="px-5 py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium cursor-pointer hover:bg-[#fafafb] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] font-semibold shadow-xs cursor-pointer transition"
                >
                  Update Job Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Split Master Card Across 3 Dedicated Painters */}
      {showSplitModal && selectedMasterForSplit && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-6 shadow-2xl border border-[#ececec] space-y-4 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-[#ececec]">
              <div>
                <h3 className="text-base font-serif font-normal text-[#17191c]">
                  Split Master Batch Across 3 Line Painters
                </h3>
                <p className="text-[11px] text-[#777b86]">
                  Master: <strong className="font-mono text-[#c09748]">{selectedMasterForSplit.jobCardNo}</strong> ({selectedMasterForSplit.targetQty} Pcs)
                </p>
              </div>
              <button 
                onClick={() => setShowSplitModal(false)}
                className="text-[#979799] hover:text-[#17191c] cursor-pointer text-base"
              >
                ✕
              </button>
            </div>

            <p className="text-[#777b86] leading-relaxed">
              In accordance with PaintKing floor policy, every batch is split across 3 line painters for piece accountability, individual yield calculation, and rework traceability.
            </p>

            <form onSubmit={handleSplitSubmit} className="space-y-3.5">
              <div className="space-y-3 p-3.5 bg-[#fafafb] rounded-[18px] border border-[#ececec]">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[#17191c] font-semibold">
                      Painter 1 Allocation (Pcs)
                    </label>
                    <select
                      value={p1Painter}
                      onChange={e => setP1Painter(e.target.value)}
                      className="text-xs p-1 rounded-[8px] border border-[#ececec] bg-white font-medium text-[#17191c]"
                    >
                      {availablePainters.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="number"
                    value={p1Qty}
                    onChange={e => setP1Qty(Number(e.target.value))}
                    min={0}
                    className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white font-mono font-bold text-sm text-[#17191c]"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[#17191c] font-semibold">
                      Painter 2 Allocation (Pcs)
                    </label>
                    <select
                      value={p2Painter}
                      onChange={e => setP2Painter(e.target.value)}
                      className="text-xs p-1 rounded-[8px] border border-[#ececec] bg-white font-medium text-[#17191c]"
                    >
                      {availablePainters.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="number"
                    value={p2Qty}
                    onChange={e => setP2Qty(Number(e.target.value))}
                    min={0}
                    className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white font-mono font-bold text-sm text-[#17191c]"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[#17191c] font-semibold">
                      Painter 3 Allocation (Pcs)
                    </label>
                    <select
                      value={p3Painter}
                      onChange={e => setP3Painter(e.target.value)}
                      className="text-xs p-1 rounded-[8px] border border-[#ececec] bg-white font-medium text-[#17191c]"
                    >
                      {availablePainters.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="number"
                    value={p3Qty}
                    onChange={e => setP3Qty(Number(e.target.value))}
                    min={0}
                    className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white font-mono font-bold text-sm text-[#17191c]"
                    required
                  />
                </div>
              </div>

              <div className="p-3 rounded-[12px] bg-[#faf3e0] border border-[#f4e5be] flex items-center justify-between text-xs">
                <span className="text-[#8a6521] font-semibold">Total Split vs Target Cap:</span>
                <span className={`font-mono font-bold ${
                  (Number(p1Qty) + Number(p2Qty) + Number(p3Qty)) === selectedMasterForSplit.targetQty
                    ? 'text-emerald-800'
                    : 'text-red-700'
                }`}>
                  {Number(p1Qty) + Number(p2Qty) + Number(p3Qty)} / {selectedMasterForSplit.targetQty} Pcs
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowSplitModal(false)}
                  className="px-5 py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] font-bold shadow-xs cursor-pointer transition"
                >
                  Generate 3 Painter Job Cards
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Route Rejection to Dedicated Rework Child Card */}
      {showReworkModal && selectedCardForRework && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-md w-full p-6 shadow-2xl border border-[#ececec] space-y-4 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-[#ececec]">
              <div>
                <h3 className="text-base font-serif font-normal text-[#17191c]">
                  Route Parts to Rework & Salvage Hub
                </h3>
                <p className="text-[11px] text-[#777b86]">
                  Source: <strong className="font-mono text-[#c09748]">{selectedCardForRework.jobCardNo}</strong>
                </p>
              </div>
              <button 
                onClick={() => setShowReworkModal(false)}
                className="text-[#979799] hover:text-[#17191c] cursor-pointer text-base"
              >
                ✕
              </button>
            </div>

            <p className="text-[#777b86] leading-relaxed">
              At PaintKing, rejected parts are not scrapped prematurely. Flagged pieces enter a dedicated Rework Child Card for de-nibbing, touch-up sanding, re-spraying, and re-baking to salvage yield.
            </p>

            <form onSubmit={handleReworkSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[#17191c] font-semibold mb-1">Rework Quantity (Pcs)</label>
                <input
                  type="number"
                  value={reworkQty}
                  onChange={e => setReworkQty(Math.max(1, Number(e.target.value)))}
                  className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white font-mono font-bold text-sm text-[#17191c]"
                  min={1}
                  required
                />
              </div>

              <div>
                <label className="block text-[#17191c] font-semibold mb-1">Defect Classification</label>
                <select
                  value={reworkDefect}
                  onChange={e => setReworkDefect(e.target.value as DefectCategory)}
                  className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white text-xs font-medium cursor-pointer"
                >
                  <option value="dust_nibs">Dust Nibs (Surface Dust / Particles)</option>
                  <option value="paint_run">Paint Run / Sagging</option>
                  <option value="orange_peel">Orange Peel Texture</option>
                  <option value="pinholes">Pinholes / Micro-bubbles</option>
                  <option value="color_mismatch">Color Tone / Shade Mismatch</option>
                  <option value="adhesion_failure">Adhesion Flaking / Peeling</option>
                  <option value="scratches">Transit / Handling Scratches</option>
                </select>
              </div>

              <div>
                <label className="block text-[#17191c] font-semibold mb-1">Rework SOP Instructions</label>
                <textarea
                  value={reworkInstruction}
                  onChange={e => setReworkInstruction(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white text-xs leading-relaxed"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowReworkModal(false)}
                  className="px-5 py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-xs cursor-pointer transition"
                >
                  Create Rework Child Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Create / View Full Excel Job Card (Doc No: 001) */}
      {showJobCardModal && (
        <JobCardModal
          isOpen={showJobCardModal}
          onClose={() => {
            setShowJobCardModal(false);
            setSelectedJobCardForView(null);
          }}
          initialData={selectedJobCardForView || undefined}
        />
      )}

      {/* Modal 5: Raise Material Requisition (MRN) to Store */}
      {showRequisitionModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-[#ececec] space-y-4 text-xs max-h-[90vh] overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-[#ececec]">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
                  PK-PRD-MRN-001 • DEMAND NOTE
                </span>
                <h3 className="text-base sm:text-lg font-serif font-normal text-[#17191c] mt-1">
                  Demand Raw Material from Stores (MRN)
                </h3>
              </div>
              <button 
                onClick={() => setShowRequisitionModal(false)}
                className="text-[#979799] hover:text-[#17191c] cursor-pointer text-base font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-[#777b86] leading-relaxed">
              Shop floor production ke liye raw substrate components ya paint batches demand karein. Store Manager is request ke against official MIN slip issue karega. Material physical receive hone ke baad floor par Job Card generate hoga.
            </p>

            <form onSubmit={handleRequisitionSubmit} className="space-y-3.5">
              {/* Target Line / Booth Selection */}
              <div>
                <label className="block text-[#17191c] font-semibold mb-1">Target Painting Line / Spray Booth</label>
                <select
                  value={targetLineForReq}
                  onChange={e => setTargetLineForReq(e.target.value)}
                  className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white text-xs font-semibold text-[#17191c] cursor-pointer"
                >
                  {paintingBooths.map(booth => (
                    <option key={booth.id} value={booth.name}>
                      {booth.name} ({booth.type}) {booth.status !== 'Active' ? `[${booth.status}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Allocation Mode: New Batch vs Existing Job Card */}
              <div>
                <label className="block text-[#17191c] font-semibold mb-1">Demand Purpose / Allocation Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReqAllocationMode('new_batch');
                      setReqJobCardNo('Pending Job Card Creation');
                    }}
                    className={`p-2.5 rounded-[12px] text-xs font-semibold border text-left cursor-pointer transition ${
                      reqAllocationMode === 'new_batch'
                        ? 'border-[#c09748] bg-[#faf7ed] text-[#8a6521]'
                        : 'border-[#ececec] bg-white text-[#777b86]'
                    }`}
                  >
                    <div className="font-bold">★ New Planned Batch</div>
                    <div className="text-[10px] text-[#777b86] font-normal mt-0.5">
                      Demand raw stock; Job Card post-receipt
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReqAllocationMode('existing_jc');
                      if (jobCards.length > 0) handleSelectJobCardInModal(jobCards[0].jobCardNo);
                    }}
                    className={`p-2.5 rounded-[12px] text-xs font-semibold border text-left cursor-pointer transition ${
                      reqAllocationMode === 'existing_jc'
                        ? 'border-[#c09748] bg-[#faf7ed] text-[#8a6521]'
                        : 'border-[#ececec] bg-white text-[#777b86]'
                    }`}
                  >
                    <div className="font-bold">Existing Job Card</div>
                    <div className="text-[10px] text-[#777b86] font-normal mt-0.5">
                      Top-up stock for running Job Card
                    </div>
                  </button>
                </div>
              </div>

              {reqAllocationMode === 'existing_jc' ? (
                <div>
                  <label className="block text-[#17191c] font-semibold mb-1">Select Target Job Card</label>
                  <select
                    value={reqJobCardNo}
                    onChange={e => handleSelectJobCardInModal(e.target.value)}
                    className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white text-xs font-medium cursor-pointer"
                    required
                  >
                    {jobCards.map(j => (
                      <option key={j.jobCardNo} value={j.jobCardNo}>
                        {j.jobCardNo} • {j.customer} ({j.partCode}) - Target: {j.targetQty} Pcs
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[#17191c] font-semibold mb-1">Pick from Available Store Stock (Optional Shortcut)</label>
                  <select
                    onChange={e => {
                      if (!e.target.value) return;
                      const selected = storeStockList.find(s => s.grnNo === e.target.value);
                      if (selected) {
                        setReqCustomer(selected.customer);
                        setReqPartCode(selected.partCode);
                        setReqPartDesc(selected.partDesc);
                        setReqWoNo(selected.challanNo || 'WO-PLANNED');
                        setReqQty(selected.balanceAvailable > 0 ? Math.min(selected.balanceAvailable, 500) : 100);
                        setReqUom(selected.uom);
                      }
                    }}
                    className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-[#fafafb] text-xs font-medium cursor-pointer text-[#17191c]"
                  >
                    <option value="">-- Choose from available store inward stock --</option>
                    {storeStockList.filter(s => s.balanceAvailable > 0).map(s => (
                      <option key={s.grnNo} value={s.grnNo}>
                        {s.customer} • {s.partDesc} ({s.partCode}) — {s.balanceAvailable} {s.uom} available
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#17191c] font-semibold mb-1">Customer / Party</label>
                  <input
                    type="text"
                    value={reqCustomer}
                    onChange={e => setReqCustomer(e.target.value)}
                    readOnly={reqAllocationMode === 'existing_jc'}
                    className={`w-full p-2.5 rounded-[12px] border border-[#ececec] text-xs font-semibold text-[#17191c] ${
                      reqAllocationMode === 'existing_jc' ? 'bg-gray-50' : 'bg-white'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#17191c] font-semibold mb-1">Work Order (W.No / Challan)</label>
                  <input
                    type="text"
                    value={reqWoNo}
                    onChange={e => setReqWoNo(e.target.value)}
                    readOnly={reqAllocationMode === 'existing_jc'}
                    className={`w-full p-2.5 rounded-[12px] border border-[#ececec] font-mono text-xs text-[#17191c] ${
                      reqAllocationMode === 'existing_jc' ? 'bg-gray-50' : 'bg-white'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#17191c] font-semibold mb-1">Part Code</label>
                  <input
                    type="text"
                    value={reqPartCode}
                    onChange={e => setReqPartCode(e.target.value)}
                    readOnly={reqAllocationMode === 'existing_jc'}
                    className={`w-full p-2.5 rounded-[12px] border border-[#ececec] font-mono font-bold text-xs text-[#8a6521] ${
                      reqAllocationMode === 'existing_jc' ? 'bg-gray-50' : 'bg-white'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#17191c] font-semibold mb-1">Color / Finish Shade</label>
                  <input
                    type="text"
                    value={reqColor}
                    onChange={e => setReqColor(e.target.value)}
                    className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white text-xs text-[#17191c]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#17191c] font-semibold mb-1">Material / Component Description</label>
                <input
                  type="text"
                  value={reqPartDesc}
                  onChange={e => setReqPartDesc(e.target.value)}
                  readOnly={reqAllocationMode === 'existing_jc'}
                  className={`w-full p-2.5 rounded-[12px] border border-[#ececec] text-xs font-medium text-[#17191c] ${
                    reqAllocationMode === 'existing_jc' ? 'bg-gray-50' : 'bg-white'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#17191c] font-semibold mb-1">Requested Quantity</label>
                  <input
                    type="number"
                    value={reqQty}
                    onChange={e => setReqQty(Math.max(1, Number(e.target.value)))}
                    className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white font-mono font-bold text-sm text-[#17191c]"
                    min={1}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#17191c] font-semibold mb-1">Unit of Measure (UOM)</label>
                  <select
                    value={reqUom}
                    onChange={e => setReqUom(e.target.value)}
                    className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white text-xs font-medium cursor-pointer"
                  >
                    <option value="Pcs">Pcs (Molded Substrates)</option>
                    <option value="Litres">Litres (Basecoat/Clear)</option>
                    <option value="Kg">Kg (Raw Thermoplastic Granules)</option>
                    <option value="Drums">Drums / Barrels</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#17191c] font-semibold mb-1">Urgency Level</label>
                  <select
                    value={reqUrgency}
                    onChange={e => setReqUrgency(e.target.value as any)}
                    className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white text-xs font-medium cursor-pointer"
                  >
                    <option value="Normal">Normal Production Run</option>
                    <option value="High (Line Stoppage Risk)">High (Line Stoppage Risk)</option>
                    <option value="Urgent Batch Run">Urgent Batch Run</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#17191c] font-semibold mb-1">Requested By (Supervisor)</label>
                  <input
                    type="text"
                    value={reqRequestedBy}
                    onChange={e => setReqRequestedBy(e.target.value)}
                    className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white text-xs font-medium text-[#17191c]"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowRequisitionModal(false)}
                  className="px-5 py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#17191c] hover:bg-black text-[#c09748] font-bold shadow-xs cursor-pointer transition flex items-center gap-1.5"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-[#c09748]" />
                  <span>Submit Demands to Store</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 6: Floor Custody Verification & Acceptance Handshake */}
      {showAcceptModal && selectedReqForAccept && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-[#ececec] space-y-4 text-xs max-h-[90vh] overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-[#ececec]">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono uppercase tracking-widest font-bold">
                  PK-CUSTODY-VERIFY • FLOOR INWARD
                </span>
                <h3 className="text-base sm:text-lg font-serif font-normal text-[#17191c] mt-1">
                  Floor Custody Acceptance & Handshake
                </h3>
              </div>
              <button 
                onClick={() => setShowAcceptModal(false)}
                className="text-[#979799] hover:text-[#17191c] cursor-pointer text-base font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-[#777b86] leading-relaxed">
              Store se aane wale material trolley ko physically count karein. Agar physical count aur Store MIN slip count me farak hai toh discrepancy record karein.
            </p>

            {/* Store Issue Metadata Card */}
            <div className="p-3.5 rounded-[16px] bg-[#fafafb] border border-[#ececec] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#777b86]">Demanded Requisition:</span>
                <strong className="font-mono text-[#c09748]">{selectedReqForAccept.mrnNo}</strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#777b86]">Store MIN Issue Slip:</span>
                <strong className="font-mono text-blue-700">{selectedReqForAccept.issuedSlipNo || 'MIN-DIRECT'}</strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#777b86]">Target Job Card:</span>
                <strong className="font-mono text-[#17191c]">{selectedReqForAccept.jobCardNo} ({selectedReqForAccept.customer})</strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#777b86]">Store Dispatched Qty:</span>
                <strong className="font-mono text-sm text-[#8a6521]">
                  {selectedReqForAccept.issuedQty || selectedReqForAccept.requestedQty} {selectedReqForAccept.uom}
                </strong>
              </div>
            </div>

            <form onSubmit={handleAcceptSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[#17191c] font-semibold mb-1">
                  Physical Count Verified on Floor ({selectedReqForAccept.uom})
                </label>
                <input
                  type="number"
                  value={actualReceivedCount}
                  onChange={e => setActualReceivedCount(Math.max(0, Number(e.target.value)))}
                  className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white font-mono font-bold text-base text-[#17191c]"
                  min={0}
                  required
                />
                {(selectedReqForAccept.issuedQty || selectedReqForAccept.requestedQty) !== actualReceivedCount && (
                  <div className="mt-1.5 p-2 rounded-[10px] bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>
                      Count Discrepancy Detected: {(selectedReqForAccept.issuedQty || selectedReqForAccept.requestedQty) - actualReceivedCount > 0
                        ? `${(selectedReqForAccept.issuedQty || selectedReqForAccept.requestedQty) - actualReceivedCount} Pieces Shortage from Store`
                        : `${actualReceivedCount - (selectedReqForAccept.issuedQty || selectedReqForAccept.requestedQty)} Pieces Excess counted`}
                    </span>
                  </div>
                )}
              </div>

              {(selectedReqForAccept.issuedQty || selectedReqForAccept.requestedQty) !== actualReceivedCount && (
                <div>
                  <label className="block text-rose-800 font-semibold mb-1">Discrepancy Reason</label>
                  <select
                    value={discrepancyReasonChoice}
                    onChange={e => setDiscrepancyReasonChoice(e.target.value as any)}
                    className="w-full p-2.5 rounded-[12px] border border-rose-300 bg-rose-50/50 text-xs font-medium cursor-pointer"
                  >
                    <option value="Count Shortage from Store">Count Shortage from Store</option>
                    <option value="Damaged in Trolley Transit">Damaged in Trolley Transit</option>
                    <option value="Wrong Shade / Drum">Wrong Shade / Drum</option>
                    <option value="Packaging Tear">Packaging Tear</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[#17191c] font-semibold mb-1">Receiving Supervisor / Custodian Name</label>
                <input
                  type="text"
                  value={acceptingPerson}
                  onChange={e => setAcceptingPerson(e.target.value)}
                  className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white text-xs font-medium text-[#17191c]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#17191c] font-semibold mb-1">Custody Notes / Trolley Remarks</label>
                <textarea
                  value={acceptRemarks}
                  onChange={e => setAcceptRemarks(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white text-xs leading-relaxed"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAcceptModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs cursor-pointer transition flex items-center justify-center gap-1.5"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>Acknowledge Custody</span>
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAndOpenPir}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#17191c] hover:bg-black text-[#c09748] font-bold shadow-xs cursor-pointer transition flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-[#c09748]" />
                  <span>✓ Accept & Generate PIR Report</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 8: Inter-Stage Floor Verification & Handshake */}
      {showStageReceiptModal && selectedJcForStageReceipt && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-md w-full p-5 sm:p-6 shadow-2xl border border-[#ececec] space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-[#ececec]">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
                  STAGE HANDSHAKE & VERIFICATION
                </span>
                <h3 className="text-base font-serif font-normal text-[#17191c] mt-1">
                  {targetStageKey === 'first' ? 'Stage 1: Base Coat Inward' : targetStageKey === 'second' ? 'Stage 2: Dipping / UV Inward' : 'Stage 3: Clear Lacquer / Top Coat'}
                </h3>
              </div>
              <button 
                onClick={() => setShowStageReceiptModal(false)}
                className="text-[#979799] hover:text-[#17191c] cursor-pointer text-base font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-[#fafafb] rounded-[16px] border border-[#ececec] space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#777b86]">Job Card:</span>
                <span className="font-mono font-bold text-[#c09748]">{selectedJcForStageReceipt.jobCardNo}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#777b86]">Part & Client:</span>
                <span className="font-semibold text-[#17191c]">{selectedJcForStageReceipt.partDescription} ({selectedJcForStageReceipt.customer})</span>
              </div>
              <div className="flex justify-between text-xs pt-1 border-t border-[#ececec]">
                <span className="text-[#777b86]">Prior Stage Expected Pieces:</span>
                <span className="font-mono font-bold text-sm text-[#17191c]">{stageExpectedCount} Pcs</span>
              </div>
            </div>

            <form onSubmit={handleStageReceiptSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[#17191c] font-semibold mb-1">
                  Physical Verified Count (Pcs)
                </label>
                <input
                  type="number"
                  value={stageVerifiedCount}
                  onChange={e => setStageVerifiedCount(Number(e.target.value))}
                  min={0}
                  className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white text-base font-mono font-bold text-[#17191c]"
                  required
                />
                {stageVerifiedCount !== stageExpectedCount && (
                  <div className="mt-1.5 p-2 rounded-[10px] bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>
                      Count Variance: {stageExpectedCount - stageVerifiedCount > 0 
                        ? `-${stageExpectedCount - stageVerifiedCount} Pcs Shortage from previous stage` 
                        : `+${stageVerifiedCount - stageExpectedCount} Pcs Excess`}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[#17191c] font-semibold mb-1">Receiving Operator / In-Charge</label>
                <input
                  type="text"
                  value={stageReceiptOperator}
                  onChange={e => setStageReceiptOperator(e.target.value)}
                  className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white text-xs font-medium text-[#17191c]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#17191c] font-semibold mb-1">Floor Handshake Remarks / Condition</label>
                <textarea
                  value={stageHandshakeNotes}
                  onChange={e => setStageHandshakeNotes(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white text-xs leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowStageReceiptModal(false)}
                  className="px-5 py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] font-bold shadow-xs cursor-pointer transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify & Accept ({stageVerifiedCount} Pcs)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 7A: Painting Booth Fleet Configuration Modal */}
      <BoothConfigModal
        isOpen={showBoothModal}
        onClose={() => {
          setShowBoothModal(false);
          setEditingBooth(null);
        }}
        editingBooth={editingBooth}
        onSave={(data) => {
          addPaintingBooth(data);
          setToastMessage(`✓ Added ${data.name} to spray booth fleet!`);
          setTimeout(() => setToastMessage(null), 3500);
        }}
        onUpdate={(id, updates) => {
          updatePaintingBooth(id, updates);
          setToastMessage(`✓ Updated booth specifications`);
          setTimeout(() => setToastMessage(null), 3500);
        }}
      />

      {/* Modal 7B: Painter / Operator Fleet Configuration Modal */}
      <PainterConfigModal
        isOpen={showPainterModal}
        onClose={() => {
          setShowPainterModal(false);
          setEditingPainter(null);
        }}
        editingPainter={editingPainter}
        availableBooths={paintingBooths}
        onSave={(data) => {
          addPainter(data);
          setToastMessage(`✓ Added painter ${data.name} to technician fleet!`);
          setTimeout(() => setToastMessage(null), 3500);
        }}
        onUpdate={(id, updates) => {
          updatePainter(id, updates);
          setToastMessage(`✓ Updated painter ${updates.name || ''} profile`);
          setTimeout(() => setToastMessage(null), 3500);
        }}
      />

      {/* ====================================================================== */}
      {/* MODAL 8: PAINTER FLOOR ASSIGNMENT WITH MAX-2 GUARDRAIL                 */}
      {/* ====================================================================== */}
      {showAssignPainterModal && selectedJcForAssign && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-[#ececec] space-y-4 text-xs max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-[#ececec]">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
                  FLOOR WORKLOAD GOVERNANCE • MAX 2 JOBS
                </span>
                <h3 className="text-base sm:text-lg font-serif font-normal text-[#17191c] mt-1">
                  Assign Job Card to Floor Painter
                </h3>
              </div>
              <button
                onClick={() => setShowAssignPainterModal(false)}
                className="text-[#979799] hover:text-[#17191c] cursor-pointer text-base font-bold"
              >
                ✕
              </button>
            </div>

            {/* Selected Job Card details */}
            <div className="p-3.5 rounded-[16px] bg-[#fafafb] border border-[#ececec] space-y-1.5 font-mono">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#17191c]">{selectedJcForAssign.jobCardNo}</span>
                <span className="text-[#8a6521] font-bold">{selectedJcForAssign.targetQty} Pcs Target</span>
              </div>
              <div className="text-xs text-[#777b86] font-sans">
                {selectedJcForAssign.customer} • {selectedJcForAssign.partDescription} ({selectedJcForAssign.partCode})
              </div>
            </div>

            {assignPainterError && (
              <div className="p-3 rounded-[14px] bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{assignPainterError}</span>
              </div>
            )}

            <form onSubmit={handleAssignPainterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#17191c] mb-1.5">
                  Select Target Floor Painter (Showing Live Workload):
                </label>
                <div className="space-y-2">
                  {painters.map(painter => {
                    const activeCount = getPainterActiveJobCount(painter.name);
                    const isAvailable = canAssignPainter(painter.name);
                    const isSelected = selectedPainterToAssign === painter.name;

                    return (
                      <div
                        key={painter.id}
                        onClick={() => {
                          if (isAvailable) {
                            setSelectedPainterToAssign(painter.name);
                            setAssignPainterError(null);
                          }
                        }}
                        className={`p-3 rounded-[16px] border transition flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-[#c09748] bg-[#faf7ed] ring-2 ring-[#c09748]/30 cursor-pointer'
                            : isAvailable
                              ? 'border-[#ececec] bg-white hover:border-[#c09748]/60 cursor-pointer'
                              : 'border-dashed border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="radio"
                            name="painter_selection"
                            checked={isSelected}
                            disabled={!isAvailable}
                            onChange={() => {
                              setSelectedPainterToAssign(painter.name);
                              setAssignPainterError(null);
                            }}
                            className="text-[#c09748] focus:ring-[#c09748]"
                          />
                          <div>
                            <div className="font-bold text-xs text-[#17191c]">{painter.name}</div>
                            <div className="text-[10px] text-[#777b86]">{painter.boothNumber} • {painter.specialization}</div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            activeCount === 0
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : activeCount === 1
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}>
                            {activeCount}/2 Active
                          </span>
                          <div className="text-[9px] text-[#777b86] mt-0.5">
                            {isAvailable ? 'Available for job' : '⚠️ CAP REACHED'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAssignPainterModal(false)}
                  className="px-5 py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canAssignPainter(selectedPainterToAssign)}
                  className={`px-6 py-2.5 rounded-full font-bold shadow-xs transition flex items-center gap-1.5 ${
                    canAssignPainter(selectedPainterToAssign)
                      ? 'bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] cursor-pointer'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Paintbrush className="w-4 h-4" />
                  <span>Assign to {selectedPainterToAssign.split(' ')[0]}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL 9: PM FLOOR VERIFICATION & REWORK DESK MODAL                    */}
      {/* ====================================================================== */}
      {showVerificationModal && selectedJcForVerification && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-[#ececec] space-y-4 text-xs max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-[#ececec]">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-mono uppercase tracking-widest font-bold">
                  PM VERIFICATION GATEWAY
                </span>
                <h3 className="text-base sm:text-lg font-serif font-normal text-[#17191c] mt-1">
                  Verify & Accept Finished Job Card
                </h3>
              </div>
              <button
                onClick={() => setShowVerificationModal(false)}
                className="text-[#979799] hover:text-[#17191c] cursor-pointer text-base font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-[16px] bg-[#fafafb] border border-[#ececec] space-y-2">
              <div className="flex items-center justify-between font-mono">
                <span className="font-bold text-sm text-[#17191c]">{selectedJcForVerification.jobCardNo}</span>
                <span className="text-emerald-700 font-bold">Sprayed: {selectedJcForVerification.sprayedQty || selectedJcForVerification.targetQty} Pcs</span>
              </div>
              <div className="text-xs text-[#777b86]">
                {selectedJcForVerification.customer} • {selectedJcForVerification.partDescription}
              </div>
              <div className="text-xs text-[#17191c] font-semibold flex items-center gap-1.5 pt-1">
                <Paintbrush className="w-3.5 h-3.5 text-[#c09748]" />
                <span>Finished by: {selectedJcForVerification.assignedPainterName || selectedJcForVerification.painterName}</span>
              </div>
              {selectedJcForVerification.painterNotes && (
                <div className="text-[11px] text-[#777b86] italic bg-white p-2 rounded-lg border border-[#ececec]">
                  "{selectedJcForVerification.painterNotes}"
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#17191c] mb-1">PM Inspection Verification Remarks</label>
                <input
                  type="text"
                  value={verificationRemarksInput}
                  onChange={e => setVerificationRemarksInput(e.target.value)}
                  className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white text-xs text-[#17191c]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleDirectRequestRework(selectedJcForVerification)}
                  className="py-2.5 px-4 rounded-full border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs cursor-pointer transition text-center"
                >
                  🔄 Request Floor Rework
                </button>
                <button
                  type="button"
                  onClick={() => handleDirectVerifyAccept(selectedJcForVerification)}
                  className="py-2.5 px-4 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer transition shadow-xs flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>✓ Accept & Complete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL 10: PAINTER SLA & ON-TIME PERFORMANCE BREAKDOWN MODAL           */}
      {/* ====================================================================== */}
      {selectedPainterForSlaModal && (() => {
        const painter = selectedPainterForSlaModal;
        const stats = getPainterPerformanceStats(painter.name);
        const painterJobCards = jobCards.filter(
          j => (j.assignedPainterId === painter.id || j.assignedPainterName?.toLowerCase().includes(painter.name.toLowerCase().split(' ')[0]) || j.painterName?.toLowerCase().includes(painter.name.toLowerCase().split(' ')[0]))
        );

        return (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-[24px] max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-[#ececec] space-y-4 text-xs max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-start pb-3 border-b border-[#ececec]">
                <div className="flex items-center gap-3">
                  <img
                    src={painter.avatar}
                    alt={painter.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#c09748]"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono font-bold uppercase">
                        {painter.code} • {painter.boothNo}
                      </span>
                      {stats.hasDelayedJobs ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-100 border border-rose-300 text-rose-900 text-[10px] font-bold">
                          ⚠️ Profile Marked: Delayed Jobs
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-[10px] font-bold">
                          ⭐ 100% On-Time Record
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-serif font-normal text-[#17191c] mt-0.5">
                      {painter.name} — SLA Performance Desk
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPainterForSlaModal(null)}
                  className="text-[#979799] hover:text-[#17191c] cursor-pointer text-base font-bold p-1"
                >
                  ✕
                </button>
              </div>

              {/* Performance Score Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-[16px] bg-[#fafafb] border border-[#ececec]">
                  <span className="text-[10px] text-[#777b86] uppercase font-bold block">Total Assigned</span>
                  <strong className="font-mono text-base text-[#17191c]">{stats.totalAssigned} Jobs</strong>
                </div>
                <div className="p-3 rounded-[16px] bg-[#fafafb] border border-[#ececec]">
                  <span className="text-[10px] text-[#777b86] uppercase font-bold block">Active on Floor</span>
                  <strong className="font-mono text-base text-blue-700">{stats.activeJobs} Jobs ({stats.activeSlotsOccupied}/2 Slots)</strong>
                </div>
                <div className="p-3 rounded-[16px] bg-emerald-50/60 border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 uppercase font-bold block">Time Se Kiye (On-Time)</span>
                  <strong className="font-mono text-base text-emerald-800">{stats.onTimeJobs} Jobs ✓</strong>
                </div>
                <div className={`p-3 rounded-[16px] border ${stats.delayedJobs > 0 ? 'bg-rose-50 border-rose-300' : 'bg-[#fafafb] border-[#ececec]'}`}>
                  <span className={`text-[10px] uppercase font-bold block ${stats.delayedJobs > 0 ? 'text-rose-800' : 'text-[#777b86]'}`}>
                    Time Se Nahi Hua (Delayed)
                  </span>
                  <strong className={`font-mono text-base ${stats.delayedJobs > 0 ? 'text-rose-700' : 'text-gray-400'}`}>
                    {stats.delayedJobs} Jobs ⚠️
                  </strong>
                </div>
              </div>

              {/* Individual Assigned Jobs Audit List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#17191c] uppercase tracking-wider font-mono">
                  Assigned Job Cards & SLA Audit Trail ({painterJobCards.length})
                </h4>

                {painterJobCards.length === 0 ? (
                  <div className="p-6 text-center text-[#777b86] bg-[#fafafb] rounded-[16px] border border-[#ececec]">
                    No job cards assigned to this painter yet.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                    {painterJobCards.map(jc => {
                      const isClosed = jc.status === 'Completed' || jc.status === 'Verified & Accepted' || jc.status === 'Target Met';
                      const isBreached = jc.isSlaBreached || (!isClosed && jc.slaDeadline && new Date() > new Date(jc.slaDeadline));

                      return (
                        <div
                          key={jc.jobCardNo}
                          className="p-3 rounded-[16px] bg-[#fafafb] border border-[#ececec] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-bold text-[#8a6521] bg-[#faf3e0] px-2 py-0.5 rounded-md text-[11px]">
                                {jc.jobCardNo}
                              </span>
                              <span className="font-semibold text-[#17191c]">{jc.partDescription}</span>
                              <span className="text-[11px] text-[#777b86]">({jc.customer})</span>
                            </div>
                            <div className="text-[11px] text-[#777b86] flex flex-wrap items-center gap-3 font-mono">
                              <span>Target: <strong>{jc.targetQty} pcs</strong></span>
                              <span>Target SLA: <strong>{jc.slaHours || 4}h</strong></span>
                              {jc.slaDeadline && (
                                <span>Deadline: <strong>{new Date(jc.slaDeadline).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</strong></span>
                              )}
                              {jc.closedAt && (
                                <span>Closed At: <strong>{new Date(jc.closedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</strong></span>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2 self-end sm:self-auto">
                            {isClosed ? (
                              jc.isOnTimeCompleted === false || jc.isSlaBreached ? (
                                <span className="px-2.5 py-1 rounded-full bg-rose-100 border border-rose-300 text-rose-900 font-bold text-[10px] flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  <span>Time Se Nahi Hua (Delayed)</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-[10px] flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Time Se Hua ✓</span>
                                </span>
                              )
                            ) : isBreached ? (
                              <span className="px-2.5 py-1 rounded-full bg-rose-100 border border-rose-300 text-rose-900 font-bold text-[10px] flex items-center gap-1 animate-pulse">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                <span>⚠️ SLA Breached (Late)</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 font-semibold text-[10px] flex items-center gap-1">
                                <Clock className="w-3 h-3 text-blue-600" />
                                <span>In Progress (On-Track)</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-[#ececec] flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedPainterForSlaModal(null)}
                  className="px-5 py-2 rounded-full bg-[#17191c] text-white hover:bg-black font-semibold text-xs transition cursor-pointer"
                >
                  Close SLA Desk
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ====================================================================== */}
      {/* MODAL 10B: PRE-PRODUCTION INSPECTION (PIR / PRE-SPRAY CHECK) MODAL     */}
      {/* ====================================================================== */}
      <PreProductionInspectionModal
        isOpen={showPirModal}
        onClose={() => {
          setShowPirModal(false);
          setSelectedJcForPir(null);
        }}
        jobCard={selectedJcForPir}
      />

      {/* ====================================================================== */}
      {/* MODAL 11: FPA (FIRST PART APPROVAL) GOLDEN SAMPLE TEST MODAL           */}
      {/* ====================================================================== */}
      <FPAModal
        isOpen={showFpaModal}
        onClose={() => {
          setShowFpaModal(false);
          setSelectedJcForFpa(null);
        }}
        jobCard={selectedJcForFpa}
      />

      {/* ====================================================================== */}
      {/* MODAL 12: 3-HOURLY IPQC (IN-PROCESS QUALITY CONTROL) AUDIT MODAL       */}
      {/* ====================================================================== */}
      <IPQCModal
        isOpen={showIpqcModal}
        onClose={() => {
          setShowIpqcModal(false);
          setSelectedJcForIpqc(null);
        }}
        jobCard={selectedJcForIpqc}
      />

      {/* ====================================================================== */}
      {/* MODAL 13: BALANCE RETURN TO STORE MODAL                                */}
      {/* ====================================================================== */}
      {showReturnModal && (
        <BalanceReturnModal
          isOpen={showReturnModal}
          onClose={() => {
            setShowReturnModal(false);
            setJobCardForReturn(undefined);
          }}
          preselectedJobCardNo={jobCardForReturn}
          onSuccess={(rtnNo) => {
            setShowReturnModal(false);
            setJobCardForReturn(undefined);
            setToastMessage(`Balance return slip ${rtnNo} generated & submitted to store.`);
            setTimeout(() => setToastMessage(null), 4000);
          }}
        />
      )}

      {/* ====================================================================== */}
      {/* MODAL 14: NEXT DAY QUOTA REQUISITION MODAL (DAILY PRODUCTION TARGET)   */}
      {/* ====================================================================== */}
      {showNextQuotaModal && selectedJcForQuota && (() => {
        const remainingToProduce = Math.max(0, selectedJcForQuota.targetQty - (selectedJcForQuota.goodQty || 0) - (selectedJcForQuota.rejectQty || 0));

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white rounded-[24px] max-w-lg w-full p-6 shadow-2xl border border-[#ececec] space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f3]">
                <div>
                  <h3 className="font-serif font-normal text-xl text-[#17191c]">
                    Request Next Day Shift Quota
                  </h3>
                  <p className="text-xs text-[#777b86] mt-0.5">
                    Job Card: <strong className="font-mono text-[#c09748]">{selectedJcForQuota.jobCardNo}</strong> | {selectedJcForQuota.customer}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowNextQuotaModal(false);
                    setSelectedJcForQuota(null);
                  }}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-[#17191c] flex items-center justify-center text-xs font-bold transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Order Context Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#fafafb] p-3 rounded-[16px] border border-[#ececec] text-center">
                <div>
                  <span className="text-[10px] text-[#777b86] uppercase block font-semibold">Total Order PO</span>
                  <strong className="font-mono text-sm text-[#17191c]">{selectedJcForQuota.targetQty} Pcs</strong>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-800 uppercase block font-semibold">Completed Good</span>
                  <strong className="font-mono text-sm text-emerald-700">{selectedJcForQuota.goodQty || 0} Pcs</strong>
                </div>
                <div>
                  <span className="text-[10px] text-rose-800 uppercase block font-semibold">Dead Scrap</span>
                  <strong className="font-mono text-sm text-rose-600">{selectedJcForQuota.rejectQty || 0} Pcs</strong>
                </div>
                <div>
                  <span className="text-[10px] text-amber-800 uppercase block font-semibold">Remaining</span>
                  <strong className="font-mono text-sm text-amber-900">{remainingToProduce} Pcs</strong>
                </div>
              </div>

              <form onSubmit={handleNextQuotaSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#17191c] uppercase tracking-wider mb-1.5">
                    Tomorrow's Daily Production Target (Pieces)
                  </label>
                  <input
                    type="number"
                    value={nextQuotaInput}
                    onChange={e => setNextQuotaInput(Math.max(1, Math.min(remainingToProduce, Number(e.target.value))))}
                    className="w-full p-3 rounded-[16px] border border-[#ececec] font-mono text-xl font-bold text-[#8a6521] bg-[#faf7ed] focus:border-[#c09748] focus:outline-none"
                    min={1}
                    max={remainingToProduce}
                    required
                  />
                  <div className="flex items-center justify-between text-[11px] text-[#777b86] mt-1.5">
                    <span>Capped at Remaining PO Balance: <strong>{remainingToProduce} Pcs</strong></span>
                    <button
                      type="button"
                      onClick={() => setNextQuotaInput(Math.min(remainingToProduce, selectedJcForQuota.dailyTargetQty || 2000))}
                      className="text-[#8a6521] font-semibold hover:underline cursor-pointer"
                    >
                      Use Standard Shift ({Math.min(remainingToProduce, selectedJcForQuota.dailyTargetQty || 2000)} Pcs)
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-[14px] text-xs text-blue-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
                    <span>Automatic Material Requisition Note (MRN)</span>
                  </div>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    Submitting this form automatically generates a high-priority MRN to the Store for <strong>{nextQuotaInput} Pcs</strong> raw substrates plus proportional chemical paints & thinners calculated for this shift only.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ececec]">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNextQuotaModal(false);
                      setSelectedJcForQuota(null);
                    }}
                    className="px-4 py-2 rounded-full border border-[#ececec] text-xs font-semibold text-[#777b86] hover:text-[#17191c] hover:bg-gray-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-full bg-[#17191c] hover:bg-[#2e3238] text-white text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5 text-[#c09748]" />
                    <span>Send Quota Requisition to Store</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Floating Feedback Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#17191c] text-white px-5 py-3 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2 border border-[#c09748]/50 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-[#c09748]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
