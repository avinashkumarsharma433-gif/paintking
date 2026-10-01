import React, { useState, useEffect, useMemo } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { JobCard, DefectCategory, MaterialRequisitionNote, RequisitionStatus } from '../types/portalTypes';
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
  PackageCheck, 
  AlertCircle, 
  ShoppingCart,
  Package,
  Eye,
  Building2,
  Settings,
  Sliders,
  Trash2,
  Check,
  Paintbrush
} from 'lucide-react';
import { JobCardModal } from '../components/JobCardModal';

export const JobCardsView: React.FC = () => {
  const { 
    jobCards, 
    universalJobs, 
    grnList,
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
    setActiveSubTab
  } = usePortalStore();

  // Active filter tab: ALL, MASTER, PAINTER_CHILD, REWORK_CHILD, REQUISITIONS, STORE_STOCK
  const [activeTab, setActiveTab] = useState<'ALL' | 'MASTER' | 'PAINTERS' | 'REWORK' | 'REQUISITIONS' | 'STORE_STOCK'>('ALL');

  // Synchronize with sidebar sub-item clicks
  useEffect(() => {
    if (activeSubTab === 'ALL' || activeSubTab === 'MASTER' || activeSubTab === 'PAINTERS' || activeSubTab === 'REWORK' || activeSubTab === 'REQUISITIONS' || activeSubTab === 'STORE_STOCK') {
      setActiveTab(activeSubTab);
    } else if (activeSubTab === 'BOOTH_FLEET') {
      setShowLineFleetModal(true);
    }
  }, [activeSubTab]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stockClientFilter, setStockClientFilter] = useState<string>('ALL');

  // Modals state
  const [selectedJobCardForProgress, setSelectedJobCardForProgress] = useState<JobCard | null>(null);
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
  const [addedSprayed, setAddedSprayed] = useState<number>(50);
  const [addedReject, setAddedReject] = useState<number>(2);
  const [selectedDefectCategory, setSelectedDefectCategory] = useState<string>('D02');

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

  // Expanded master cards for sub-tree view
  const [expandedMasterIds, setExpandedMasterIds] = useState<Record<string, boolean>>({
    'JC-1042-RED': true
  });

  // Floor Booth / Line Fleet Setup (Production Manager's Line Fleet)
  const [paintingLines, setPaintingLines] = useState<Array<{ id: string; name: string; type: string; status: 'Active' | 'Under Maintenance' | 'Changeover' }>>([
    { id: 'LINE-1', name: 'Booth #1 (Continuous Conveyor Line)', type: 'Conveyor Liquid PU', status: 'Active' },
    { id: 'LINE-2', name: 'Booth #2 (Dust-Free Pressurized Cleanroom)', type: 'Enclosed 2K High Gloss', status: 'Active' },
    { id: 'LINE-3', name: 'Booth #3 (Hydrographic Immersion & Dipping)', type: 'Water Transfer 3D', status: 'Active' },
    { id: 'LINE-4', name: 'Booth #4 (Flatbed Industrial Direct UV Plotter)', type: 'Direct UV Printing', status: 'Active' }
  ]);
  const [targetLineForReq, setTargetLineForReq] = useState<string>('Booth #1 (Continuous Conveyor Line)');
  const [showLineFleetModal, setShowLineFleetModal] = useState<boolean>(false);
  const [newLineName, setNewLineName] = useState<string>('');
  const [newLineType, setNewLineType] = useState<string>('Liquid Spray Booth');

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
    setShowBatchModal(true);
  };

  const handleCloseBatchModal = () => {
    setShowBatchModal(false);
    setSelectedJobCardForProgress(null);
  };

  const handleProgressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobCardForProgress) return;
    updateJobCardSprayed(selectedJobCardForProgress.jobCardNo, addedSprayed, addedReject, selectedDefectCategory);
    handleCloseBatchModal();
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
    setSelectedJobCardForView(null);
    setShowJobCardModal(true);
  };

  const handleViewJobCard = (jc: JobCard) => {
    setSelectedJobCardForView(jc);
    setShowJobCardModal(true);
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

  // 1-Click Job Card Creation after physical material receipt on floor
  const handleCreateJobCardFromReceivedBatch = (req: MaterialRequisitionNote) => {
    const nextJcIndex = String(jobCards.length + 1).padStart(3, '0');
    const newJobCardNo = `JC-2026-${nextJcIndex}`;
    const initialJcData: Partial<JobCard> = {
      jobCardNo: newJobCardNo,
      woNo: req.woNo || `WO-2026-${nextJcIndex}`,
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

  // Open Requisition directly from Store Stock Item for a specific Booth Line
  const handleRequestFromSpecificStock = (stockItem: any) => {
    setReqAllocationMode('new_batch');
    setReqJobCardNo('Pending Job Card Creation');
    setReqPartCode(stockItem.partCode);
    setReqPartDesc(stockItem.partDesc);
    setReqCustomer(stockItem.customer);
    setReqColor('Standard Shade');
    setReqWoNo(stockItem.challanNo || 'WO-PLANNED');
    setReqQty(stockItem.balanceAvailable > 0 ? Math.min(stockItem.balanceAvailable, 500) : 100);
    setReqUom(stockItem.uom);
    setReqUrgency('Normal');
    setShowRequisitionModal(true);
  };

  // Add / manage line fleet
  const handleAddLine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLineName.trim()) return;
    const nextNum = paintingLines.length + 1;
    const newLine = {
      id: `LINE-${nextNum}`,
      name: newLineName.trim(),
      type: newLineType,
      status: 'Active' as const
    };
    setPaintingLines(prev => [...prev, newLine]);
    setNewLineName('');
    setToastMessage(`✓ Added ${newLine.name} to shop floor fleet!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleToggleLineStatus = (id: string) => {
    setPaintingLines(prev => prev.map(line => {
      if (line.id === id) {
        const nextStatus = line.status === 'Active' ? 'Under Maintenance' : 'Active';
        return { ...line, status: nextStatus };
      }
      return line;
    }));
  };

  const handleDeleteLine = (id: string) => {
    if (paintingLines.length <= 1) {
      alert("At least one painting line/booth must remain configured.");
      return;
    }
    setPaintingLines(prev => prev.filter(line => line.id !== id));
  };

  // Live calculation of Store Stock available for Production Manager to inspect
  const storeStockList = useMemo(() => {
    return grnList.map(grn => {
      const customer = grn.supplierCustomer;
      const partCode = grn.items?.[0]?.partCode || grn.partCode || 'SUBSTRATE';
      const partDesc = grn.items?.[0]?.partDescription || grn.description || 'Raw Components';
      const totalInward = grn.actualReceivedQty || grn.totalQty || 0;
      const receivedDate = grn.receivedDate || grn.date;
      const uom = (partCode.startsWith('PNT') || partCode.startsWith('CHEM') || partDesc.toLowerCase().includes('drum') || partDesc.toLowerCase().includes('paint')) ? 'Litres' : 'Pcs';

      // Match job cards target quantity
      const matchingJobCards = jobCards.filter(jc => 
        (jc.customer && jc.customer.trim().toLowerCase() === customer.trim().toLowerCase()) ||
        (jc.partCode && jc.partCode.trim().toLowerCase() === partCode.trim().toLowerCase()) ||
        (jc.woNo && grn.invoiceChallanNo && jc.woNo.includes(grn.invoiceChallanNo))
      );
      const primaryJobCards = matchingJobCards.filter(jc => jc.jobCardType === 'master' || (!jc.jobCardType && !jc.parentJobCardId));
      const totalJobCardDemands = primaryJobCards.reduce((acc, curr) => acc + (curr.targetQty || 0), 0);

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
        vehicleNo: grn.vehicleNo,
        iqcStatus: grn.iqcStatus,
        status: balanceAvailable === 0 ? 'Exhausted' : balanceAvailable < 100 ? 'Low Balance' : 'Ready in Store'
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

  // Filter Cards
  const filteredCards = jobCards.filter(jc => {
    // Type tab filter
    if (activeTab === 'MASTER' && jc.jobCardType !== 'master') return false;
    if (activeTab === 'PAINTERS' && jc.jobCardType !== 'painter_child') return false;
    if (activeTab === 'REWORK' && jc.jobCardType !== 'rework_child') return false;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNo = jc.jobCardNo.toLowerCase().includes(q);
      const matchCustomer = jc.customer.toLowerCase().includes(q);
      const matchPart = (jc.partCode || '').toLowerCase().includes(q) || jc.partDescription.toLowerCase().includes(q);
      const matchPainter = (jc.assignedPainterName || jc.painterName || '').toLowerCase().includes(q);
      if (!matchNo && !matchCustomer && !matchPart && !matchPainter) return false;
    }
    return true;
  });

  // Calculate high-signal metrics
  const masterCount = jobCards.filter(j => j.jobCardType === 'master').length;
  const painterChildCount = jobCards.filter(j => j.jobCardType === 'painter_child').length;
  const reworkChildCount = jobCards.filter(j => j.jobCardType === 'rework_child').length;
  const totalSprayed = jobCards.reduce((acc, j) => acc + (j.jobCardType === 'painter_child' ? j.sprayedQty : 0), 0) ||
                       jobCards.reduce((acc, j) => acc + (j.jobCardType === 'master' ? j.sprayedQty : 0), 0);
  const totalRework = jobCards.filter(j => j.jobCardType === 'rework_child').reduce((acc, j) => acc + j.targetQty, 0);

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
            Master Batch Orders split into 3 distinct Painter Sub-Cards (P1, P2, P3) with dedicated Rework & Salvage recovery.
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
            <span>+ Create Master Job Card (Doc No: 001)</span>
          </button>
        </div>
      </div>

      {/* Operational Principles Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-[20px] bg-white border border-[#ececec] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#faf3e0] text-[#c09748] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#777b86] uppercase tracking-wider">3-Painter Dedicated Splitting</div>
            <div className="text-sm font-semibold text-[#17191c]">Ramesh (P1) • Suresh (P2) • Mahesh (P3)</div>
            <div className="text-[10px] text-[#777b86]">Individual piece accountability & pace parity</div>
          </div>
        </div>

        <div className="p-4 rounded-[20px] bg-white border border-[#ececec] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#777b86] uppercase tracking-wider">Rework on Rejection Loop</div>
            <div className="text-sm font-semibold text-[#17191c]">De-nibbing, Sanding & Re-spray</div>
            <div className="text-[10px] text-[#777b86]">Defects salvaged via dedicated RW Child Cards</div>
          </div>
        </div>

        <div className="p-4 rounded-[20px] bg-white border border-[#ececec] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#777b86] uppercase tracking-wider">Single Shift Floor Governance</div>
            <div className="text-sm font-semibold text-[#17191c]">08:30 – 18:30 Plant Hours</div>
            <div className="text-[10px] text-[#777b86]">Daily EOD shutdown & physical tally lock</div>
          </div>
        </div>
      </div>

      {/* Painting Lines & Spray Booth Fleet Configuration Strip */}
      <div className="bg-white rounded-[24px] border border-[#ececec] p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ececec]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#c09748] animate-pulse" />
              <h2 className="font-serif font-normal text-lg sm:text-xl text-[#17191c]">
                Operational Painting Lines & Spray Booth Fleet
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono font-bold">
                {paintingLines.filter(l => l.status === 'Active').length} Active Lines
              </span>
            </div>
            <p className="text-xs text-[#777b86] mt-0.5">
              Production Manager floor booth layout configures karta hai. Har booth ke hisaab se Store se material demand (MRN) ki jaati hai, fir receipt ke baad Job Card generate hota hai.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowLineFleetModal(true)}
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-gray-50 border border-[#ececec] text-[#17191c] hover:border-[#c09748] text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition self-start sm:self-auto"
          >
            <Settings className="w-3.5 h-3.5 text-[#c09748]" />
            <span>⚙️ Configure Booths & Lines</span>
          </button>
        </div>

        {/* Fleet Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {paintingLines.map(line => {
            const isActive = line.status === 'Active';
            return (
              <div
                key={line.id}
                className={`p-3.5 rounded-[18px] border transition flex flex-col justify-between gap-2.5 ${
                  isActive
                    ? 'border-[#ececec] bg-white hover:border-[#c09748]/50 shadow-2xs'
                    : 'border-dashed border-gray-300 bg-gray-50/70 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-mono font-bold text-[#8a6521] px-1.5 py-0.5 rounded-md bg-[#faf3e0]">
                      {line.id}
                    </span>
                    <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold ${
                      isActive ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {line.status}
                    </span>
                  </div>
                  <div className="font-semibold text-xs text-[#17191c] line-clamp-1" title={line.name}>
                    {line.name}
                  </div>
                  <div className="text-[10px] text-[#777b86] mt-0.5">
                    {line.type}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenRequisitionModal(undefined, line.name)}
                  disabled={isPlantDayClosed || !isActive}
                  className={`w-full py-1.5 rounded-full text-[11px] font-medium flex items-center justify-center gap-1 transition ${
                    isActive && !isPlantDayClosed
                      ? 'bg-[#17191c] hover:bg-black text-[#c09748] cursor-pointer shadow-2xs'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <ArrowRightLeft className="w-3 h-3 text-[#c09748]" />
                  <span>+ Demand Material</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* DEDICATED SEARCH ROW */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
          <Search className="w-4 h-4 text-[#c09748]" />
        </div>
        <input
          type="text"
          placeholder="Search Job Card, Part Code, Customer, Assigned Painter..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ paddingLeft: '40px' }}
          className="w-full pr-10 py-2.5 rounded-[16px] bg-white border border-[#ececec] text-xs text-[#17191c] placeholder:text-[#a3a6af] shadow-2xs focus:outline-none focus:border-[#c09748] focus:ring-2 focus:ring-[#c09748]/20 transition"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#777b86] hover:text-[#17191c] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Real-time Production Overview Cards - All 4 Clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Master Batches (Clickable -> Master Cards) */}
        <div
          onClick={() => setActiveTab('MASTER')}
          className={`p-4 rounded-[20px] bg-white border shadow-xs space-y-1 cursor-pointer transition hover:shadow-sm hover:border-[#c09748] active:scale-[0.98] ${
            activeTab === 'MASTER' ? 'border-[#c09748] ring-1 ring-[#c09748]/30' : 'border-[#ececec]'
          }`}
          title="Click to view Master Batch Orders"
        >
          <div className="text-[10px] font-bold text-[#777b86] uppercase tracking-wider flex items-center justify-between font-mono">
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#c09748]" />
              MASTER BATCHES
            </span>
            <span className="text-[9px] underline font-sans text-[#8a6521]">View &rarr;</span>
          </div>
          <div className="text-xl sm:text-2xl font-serif font-bold text-[#17191c]">
            {masterCount} Batches
          </div>
          <div className="text-[10px] sm:text-[11px] text-[#777b86] truncate">
            {jobCards.length} Total Cards registered
          </div>
        </div>

        {/* Card 2: 3-Painter Splits (Clickable -> Painter Cards) */}
        <div
          onClick={() => setActiveTab('PAINTERS')}
          className={`p-4 rounded-[20px] bg-white border shadow-xs space-y-1 cursor-pointer transition hover:shadow-sm hover:border-blue-400 active:scale-[0.98] ${
            activeTab === 'PAINTERS' ? 'border-blue-400 ring-1 ring-blue-300' : 'border-[#ececec]'
          }`}
          title="Click to view 3-Painter P1/P2/P3 Sub-Cards"
        >
          <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider flex items-center justify-between font-mono">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              PAINTER SPLITS
            </span>
            <span className="text-[9px] underline font-sans text-blue-600">View &rarr;</span>
          </div>
          <div className="text-xl sm:text-2xl font-serif font-bold text-blue-900">
            {painterChildCount} Sub-Cards
          </div>
          <div className="text-[10px] sm:text-[11px] text-[#777b86] truncate">
            {totalSprayed.toLocaleString('en-IN')} pcs sprayed
          </div>
        </div>

        {/* Card 3: Rework Salvage (Clickable -> Rework Child Cards) */}
        <div
          onClick={() => setActiveTab('REWORK')}
          className={`p-4 rounded-[20px] border shadow-xs space-y-1 cursor-pointer transition hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'REWORK'
              ? 'border-amber-400 ring-1 ring-amber-300 bg-amber-50/40'
              : reworkChildCount > 0
                ? 'bg-amber-50/30 border-amber-200 hover:border-amber-400'
                : 'bg-white border-[#ececec] hover:border-[#c09748]'
          }`}
          title="Click to view Rework Child Cards"
        >
          <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center justify-between font-mono">
            <span className="flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              REWORK SALVAGE
            </span>
            <span className="text-[9px] underline font-sans text-amber-700">View &rarr;</span>
          </div>
          <div className="text-xl sm:text-2xl font-serif font-bold text-amber-900">
            {reworkChildCount} RW Cards
          </div>
          <div className="text-[10px] sm:text-[11px] text-[#777b86] truncate">
            {totalRework} pcs under de-nib/respray
          </div>
        </div>

        {/* Card 4: Store Demands MRN (Clickable -> Material Demands & Stock) */}
        <div
          onClick={() => setActiveTab('REQUISITIONS')}
          className={`p-4 rounded-[20px] bg-[#faf7ed] border shadow-xs space-y-1 cursor-pointer transition hover:shadow-sm hover:border-[#c09748] active:scale-[0.98] ${
            activeTab === 'REQUISITIONS' ? 'border-[#c09748] ring-1 ring-[#c09748]/30' : 'border-[#f4e5be]'
          }`}
          title="Click to view Store Demands & Incoming Materials"
        >
          <div className="text-[10px] font-bold text-[#8a6521] uppercase tracking-wider flex items-center justify-between font-mono">
            <span className="flex items-center gap-1">
              <ArrowRightLeft className="w-3.5 h-3.5 text-[#c09748]" />
              STORE DEMANDS
            </span>
            <span className="text-[9px] underline font-sans text-[#8a6521]">View MRN &rarr;</span>
          </div>
          <div className="text-xl sm:text-2xl font-serif font-bold text-[#8a6521]">
            {materialRequisitions.length} Demands
          </div>
          <div className="text-[10px] sm:text-[11px] text-[#8a6521]/80 truncate">
            {materialRequisitions.filter(r => r.status === 'Pending Store Issue').length} Awaiting Store MIN
          </div>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* TAB 5: MATERIAL REQUISITIONS & CUSTODY ACCEPTANCE DESK                 */}
      {/* ====================================================================== */}
      {activeTab === 'REQUISITIONS' ? (
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
                            ) : isReceived ? (
                              <div className="text-right flex flex-col items-end gap-1.5">
                                <span className="text-[11px] text-emerald-800 font-bold flex items-center justify-end gap-1">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>In Active WIP</span>
                                </span>
                                <div className="text-[10px] text-[#777b86]">
                                  {req.receivedQty} {req.uom} recd by {req.receivedBy?.split(' ')[0]}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCreateJobCardFromReceivedBatch(req)}
                                  className="px-3 py-1 rounded-full bg-[#17191c] hover:bg-black text-[#c09748] font-bold text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer transition"
                                >
                                  <Plus className="w-3 h-3 text-[#c09748]" />
                                  <span>+ Create Job Card</span>
                                </button>
                              </div>
                            ) : (
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
                        <button
                          type="button"
                          onClick={() => handleCreateJobCardFromReceivedBatch(req)}
                          className="w-full py-2 rounded-full bg-[#17191c] hover:bg-black text-[#c09748] font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#c09748]" />
                          <span>+ Create Job Card from Received Batch</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : activeTab === 'STORE_STOCK' ? (
        /* ====================================================================== */
        /* TAB 6: AVAILABLE STORE INVENTORY (LIVE INWARDED LOTS & STOCK BALANCES) */
        /* ====================================================================== */
        <div className="space-y-4">
          <div className="bg-white rounded-[24px] border border-[#ececec] p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ececec]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-normal text-lg sm:text-xl text-[#17191c]">
                    Store Inward Inventory & Available Balances
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]">
                    Live Store Balance
                  </span>
                </div>
                <p className="text-xs text-[#777b86] mt-0.5">
                  Store me kis party ka kaun sa material aur substrate pada hai. Kisi bhi item par <strong>"Request Material"</strong> click karke turant Job Card demand raise karein.
                </p>
              </div>

              {/* Customer Filter */}
              <div className="flex items-center gap-2">
                <select
                  value={stockClientFilter}
                  onChange={e => setStockClientFilter(e.target.value)}
                  className="px-3.5 py-2 rounded-full border border-[#ececec] bg-white text-xs font-semibold text-[#17191c] cursor-pointer hover:border-[#c09748] transition"
                >
                  <option value="ALL">All Parties ({uniqueStockCustomers.length})</option>
                  {uniqueStockCustomers.map(cust => (
                    <option key={cust} value={cust}>{cust}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Desktop Table of Store Stock */}
            <div className="hidden md:block overflow-x-auto border border-[#ececec] rounded-[16px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#fafafb] text-[#777b86] font-semibold uppercase text-[10px] tracking-wider border-b border-[#ececec]">
                    <th className="p-3">Party / Customer</th>
                    <th className="p-3">Part Code & Description</th>
                    <th className="p-3">GRN No & Challan</th>
                    <th className="p-3 text-center">Inward Date</th>
                    <th className="p-3 text-center">Gate Inward</th>
                    <th className="p-3 text-center">Issued to Floor</th>
                    <th className="p-3 text-center">Store Balance Available</th>
                    <th className="p-3 text-right">Production Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ececec] text-[#17191c]">
                  {filteredStoreStock.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-[#777b86]">
                        No inwarded materials found in store matching your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredStoreStock.map((item, idx) => {
                      const hasBalance = item.balanceAvailable > 0;

                      return (
                        <tr key={idx} className="hover:bg-[#fafafb] transition">
                          <td className="p-3">
                            <div className="font-bold text-[#17191c] flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-[#c09748]" />
                              <span>{item.customer}</span>
                            </div>
                            <div className="text-[10px] font-mono text-gray-400 mt-0.5">Veh: {item.vehicleNo}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-mono font-bold text-[#8a6521] text-xs">{item.partCode}</div>
                            <div className="text-[11px] text-[#777b86]">{item.partDesc}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-mono font-bold text-[#17191c] text-[11px]">{item.grnNo}</div>
                            <div className="text-[10px] text-[#777b86]">Challan: {item.challanNo}</div>
                          </td>
                          <td className="p-3 text-center text-[11px] text-[#777b86]">
                            {item.receivedDate}
                          </td>
                          <td className="p-3 text-center font-mono text-xs text-[#777b86]">
                            {item.totalInward.toLocaleString('en-IN')} {item.uom}
                          </td>
                          <td className="p-3 text-center font-mono text-xs text-blue-800">
                            {item.totalIssuedToFloor.toLocaleString('en-IN')} {item.uom}
                          </td>
                          <td className="p-3 text-center">
                            <div className={`font-mono font-bold text-sm px-2.5 py-1 rounded-full inline-block ${
                              hasBalance ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {item.balanceAvailable.toLocaleString('en-IN')} {item.uom}
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            {hasBalance ? (
                              <button
                                type="button"
                                onClick={() => handleRequestFromSpecificStock(item)}
                                disabled={isPlantDayClosed}
                                className="px-3.5 py-1.5 rounded-full bg-[#17191c] hover:bg-black text-[#c09748] font-bold text-xs shadow-2xs cursor-pointer transition flex items-center gap-1.5 ml-auto"
                              >
                                <ShoppingCart className="w-3.5 h-3.5 text-[#c09748]" />
                                <span>+ Request Material</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-gray-400 italic">Fully Issued</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards for Store Stock */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {filteredStoreStock.map((item, idx) => (
                <div key={idx} className="p-4 rounded-[16px] border border-[#ececec] bg-white space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[#ececec]">
                    <div>
                      <span className="font-bold text-xs text-[#17191c]">{item.customer}</span>
                      <div className="font-mono text-[10px] text-[#8a6521]">{item.partCode}</div>
                    </div>
                    <div className={`font-mono font-bold text-xs px-2.5 py-0.5 rounded-full ${
                      item.balanceAvailable > 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-gray-100 text-gray-500'
                    }`}>
                      Bal: {item.balanceAvailable} {item.uom}
                    </div>
                  </div>

                  <div className="text-xs text-[#777b86]">
                    {item.partDesc} • GRN: <strong className="font-mono text-[#17191c]">{item.grnNo}</strong>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs p-2.5 rounded-[12px] bg-[#fafafb] border border-[#ececec]">
                    <div>
                      <span className="text-[9px] text-[#777b86] uppercase block">Total Inward</span>
                      <span className="font-mono font-bold text-[#17191c]">{item.totalInward} {item.uom}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#777b86] uppercase block">Issued to Floor</span>
                      <span className="font-mono font-bold text-blue-700">{item.totalIssuedToFloor} {item.uom}</span>
                    </div>
                  </div>

                  {item.balanceAvailable > 0 && (
                    <button
                      type="button"
                      onClick={() => handleRequestFromSpecificStock(item)}
                      disabled={isPlantDayClosed}
                      className="w-full py-2 rounded-full bg-[#17191c] text-[#c09748] font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <ShoppingCart className="w-4 h-4 text-[#c09748]" />
                      <span>+ Demand from Store ({item.balanceAvailable} Available)</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Cards Grid for Job Cards */
        <div className="space-y-4">
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

            return (
              <div
                key={jc.jobCardNo}
                className={`rounded-[24px] border transition shadow-xs overflow-hidden ${
                  isReworkChild
                    ? 'bg-amber-50/20 border-amber-200'
                    : isPainterChild
                    ? 'bg-white border-[#ececec]'
                    : 'bg-white border-[#dfdfe2]'
                }`}
              >
                {/* Main Card Header */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-[#f2f2f3]">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Type Badge */}
                        {isMaster && (
                          <span className="px-2.5 py-0.5 rounded-full bg-[#17191c] text-[#c09748] text-[10px] font-mono font-bold tracking-wider uppercase">
                            MASTER BATCH
                          </span>
                        )}
                        {isPainterChild && (
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>PAINTER CARD ({jc.assignedPainterId || 'P1'})</span>
                          </span>
                        )}
                        {isReworkChild && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1">
                            <RotateCcw className="w-3 h-3 text-amber-700" />
                            <span>REWORK SALVAGE</span>
                          </span>
                        )}

                        <span className="font-mono text-xs font-bold text-[#c09748] px-2.5 py-0.5 rounded-full bg-[#faf7ed] border border-[#f4e5be]">
                          {jc.jobCardNo}
                        </span>

                        <span className="text-xs text-[#777b86] font-mono">
                          W.No: <strong>{jc.wNo || jc.woNo}</strong>
                        </span>

                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-mono text-gray-700">
                          {jc.docNo || 'Doc No: 001'}
                        </span>
                      </div>

                      <h3 className="font-serif text-lg text-[#17191c] font-normal">
                        {jc.customer}
                      </h3>

                      <div className="text-xs text-[#777b86]">
                        {jc.partDescription} • Code: <strong className="text-[#17191c]">{jc.partCode}</strong> • Dept: <strong className="text-[#17191c]">{jc.dept || 'Cubic Line'}</strong>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        jc.status === 'Over-Run Flagged'
                          ? 'bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521]'
                          : jc.status === 'Target Met' || jc.status === 'Completed'
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                          : 'bg-[#f2f2f3] text-[#17191c]'
                      }`}>
                        {jc.status}
                      </span>

                      {/* Requisition Material from Store for this Job Card */}
                      {isMaster && (
                        <button
                          onClick={() => handleOpenRequisitionModal(jc)}
                          className="px-3.5 py-1 rounded-full bg-white border border-[#ececec] hover:border-[#c09748] text-[#17191c] text-xs font-semibold hover:bg-gray-50 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <ShoppingCart className="w-3.5 h-3.5 text-[#c09748]" />
                          <span>Request from Store</span>
                        </button>
                      )}

                      {/* Split across 3 painters action button for Master cards */}
                      {isMaster && (
                        <button
                          onClick={() => handleOpenSplitModal(jc)}
                          className="px-3.5 py-1 rounded-full bg-[#faf7ed] border border-[#f4e5be] text-[#8a6521] text-xs font-semibold hover:bg-[#faf3e0] transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Split className="w-3.5 h-3.5 text-[#c09748]" />
                          <span>{hasChildren ? 'Re-allocate 3 Painters' : 'Split Across 3 Line Painters'}</span>
                        </button>
                      )}

                      {/* Route to Rework button */}
                      {(isMaster || isPainterChild) && (
                        <button
                          onClick={() => handleOpenReworkModal(jc)}
                          className="px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold hover:bg-amber-100 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                          <span>Route Rejection to Rework</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Floor Metadata Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-[16px] bg-[#fafafb] border border-[#ececec] text-xs">
                    <div>
                      <span className="text-[#777b86] block text-[10px] uppercase font-bold">Assigned Painter</span>
                      <strong className="text-[#17191c] font-semibold">
                        {jc.assignedPainterName || jc.painterName || 'Unassigned'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#777b86] block text-[10px] uppercase font-bold">Color Shade</span>
                      <strong className="text-[#17191c] font-semibold">{jc.color}</strong>
                    </div>
                    <div>
                      <span className="text-[#777b86] block text-[10px] uppercase font-bold">Target Allocation</span>
                      <strong className="font-mono text-[#17191c]">{jc.targetQty} Pcs</strong>
                    </div>
                    <div>
                      <span className="text-[#777b86] block text-[10px] uppercase font-bold">Checking Person</span>
                      <span className="text-emerald-800 font-semibold">{jc.checkingPerson || 'Amit Verma'}</span>
                    </div>
                  </div>

                  {/* Progress & Piece Counters */}
                  <div className="space-y-2 p-3.5 rounded-[16px] bg-[#fafafb] border border-[#ececec]">
                    <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                      <span className="text-[#777b86]">
                        Progress: <strong className="font-mono text-sm text-[#17191c]">{jc.sprayedQty}</strong> / {jc.targetQty} Pcs ({progressPercent}%)
                      </span>
                      <div className="flex items-center gap-3 text-[11px] font-mono">
                        <span className="text-emerald-800 font-semibold">Good: {jc.goodQty}</span>
                        <span className="text-red-600 font-semibold">Rejection: {jc.rejectQty}</span>
                        {isReworkChild && (
                          <span className="text-amber-800 font-semibold">
                            Salvaged: {jc.reworkRecoveredQty || 0}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="w-full bg-[#f2f2f3] rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isReworkChild ? 'bg-amber-500' : 'bg-[#c09748]'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* 3-Stage Process Verification & Direct Handshake Strip */}
                  <div className="p-3.5 rounded-[16px] bg-[#fafafb] border border-[#ececec] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#c09748]" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#17191c]">
                          Floor Inter-Stage Physical Verification Pipeline
                        </span>
                      </div>
                      <span className="text-[10px] text-[#777b86]">
                        Operator marks incoming count match before starting each stage
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      {/* Stage 1: Base Coat Painting */}
                      <div className={`p-2.5 rounded-[12px] border ${
                        jc.stageProcessFirst?.isReceivedVerified
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : 'bg-white border-[#ececec]'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px] text-[#17191c]">1. Base Coat</span>
                          {jc.stageProcessFirst?.isReceivedVerified ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold flex items-center gap-1">
                              <Check className="w-2.5 h-2.5" /> Recd
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[9px]">
                              Awaiting
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-baseline justify-between text-[11px]">
                          <span className="text-[#777b86]">Ok Output:</span>
                          <span className="font-mono font-bold text-[#17191c]">{jc.stageProcessFirst?.okQty || jc.goodQty || 0} Pcs</span>
                        </div>
                        {jc.stageProcessFirst?.isReceivedVerified ? (
                          <div className="text-[10px] text-[#777b86] mt-1 pt-1 border-t border-emerald-200/60 truncate">
                            ✓ {jc.stageProcessFirst.receivedBy?.split(' ')[0]} ({jc.stageProcessFirst.totalQty} pcs)
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenStageReceiptModal(jc, 'first')}
                            disabled={isPlantDayClosed}
                            className="mt-1.5 w-full py-1 rounded-full bg-white hover:bg-gray-50 border border-[#c09748] text-[#8a6521] text-[10px] font-bold shadow-2xs cursor-pointer flex items-center justify-center gap-1 transition"
                          >
                            <CheckCircle2 className="w-3 h-3 text-[#c09748]" />
                            <span>Verify & Accept Inward</span>
                          </button>
                        )}
                      </div>

                      {/* Stage 2: Hydrographic Immersion / Direct UV */}
                      <div className={`p-2.5 rounded-[12px] border ${
                        jc.stageProcessSecond?.isReceivedVerified
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : 'bg-white border-[#ececec]'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px] text-[#17191c]">2. Dipping / UV</span>
                          {jc.stageProcessSecond?.isReceivedVerified ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold flex items-center gap-1">
                              <Check className="w-2.5 h-2.5" /> Recd
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[9px]">
                              Next In Line
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-baseline justify-between text-[11px]">
                          <span className="text-[#777b86]">Ok Output:</span>
                          <span className="font-mono font-bold text-[#17191c]">{jc.stageProcessSecond?.okQty || 0} Pcs</span>
                        </div>
                        {jc.stageProcessSecond?.isReceivedVerified ? (
                          <div className="text-[10px] text-[#777b86] mt-1 pt-1 border-t border-emerald-200/60 truncate">
                            ✓ {jc.stageProcessSecond.receivedBy?.split(' ')[0]} ({jc.stageProcessSecond.totalQty} pcs)
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenStageReceiptModal(jc, 'second')}
                            disabled={isPlantDayClosed}
                            className="mt-1.5 w-full py-1 rounded-full bg-[#17191c] hover:bg-black text-[#c09748] text-[10px] font-bold shadow-2xs cursor-pointer flex items-center justify-center gap-1 transition"
                          >
                            <PackageCheck className="w-3 h-3 text-[#c09748]" />
                            <span>Verify & Accept from S1</span>
                          </button>
                        )}
                      </div>

                      {/* Stage 3: Clear Lacquer / Top Coat & Curing */}
                      <div className={`p-2.5 rounded-[12px] border ${
                        jc.stageProcessThird?.isReceivedVerified
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : 'bg-white border-[#ececec]'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px] text-[#17191c]">3. Lacquer & Curing</span>
                          {jc.stageProcessThird?.isReceivedVerified ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold flex items-center gap-1">
                              <Check className="w-2.5 h-2.5" /> Recd
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[9px]">
                              Final Stage
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-baseline justify-between text-[11px]">
                          <span className="text-[#777b86]">Ok Output:</span>
                          <span className="font-mono font-bold text-[#17191c]">{jc.stageProcessThird?.okQty || 0} Pcs</span>
                        </div>
                        {jc.stageProcessThird?.isReceivedVerified ? (
                          <div className="text-[10px] text-[#777b86] mt-1 pt-1 border-t border-emerald-200/60 truncate">
                            ✓ {jc.stageProcessThird.receivedBy?.split(' ')[0]} ({jc.stageProcessThird.totalQty} pcs)
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenStageReceiptModal(jc, 'third')}
                            disabled={isPlantDayClosed}
                            className="mt-1.5 w-full py-1 rounded-full bg-white hover:bg-gray-50 border border-[#ececec] hover:border-[#c09748] text-[#17191c] text-[10px] font-bold shadow-2xs cursor-pointer flex items-center justify-center gap-1 transition"
                          >
                            <PackageCheck className="w-3 h-3 text-[#c09748]" />
                            <span>Verify & Accept from S2</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rework Instructions details if Rework Card */}
                  {isReworkChild && (
                    <div className="p-3 bg-amber-50/60 rounded-[14px] border border-amber-200 text-xs space-y-1">
                      <div className="flex items-center gap-2 font-semibold text-amber-900">
                        <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                        <span>Defect: {jc.defectCategory ? jc.defectCategory.replace(/_/g, ' ').toUpperCase() : 'SURFACE DEFECT'}</span>
                        <span className="px-2 py-0.2 rounded-full bg-white text-[10px] border border-amber-200">
                          Status: {jc.reworkStatus || 'Pending Sanding'}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 font-mono">
                        SOP: {jc.reworkInstructions || 'De-nib and re-spray under Senior Painter oversight.'}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[#ececec]">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleViewJobCard(jc)}
                        className="px-4 py-2 rounded-full border border-[#ececec] bg-white text-[#17191c] text-xs font-semibold hover:bg-gray-50 transition flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#c09748]" />
                        <span>View / Print Job Sheet</span>
                      </button>

                      {isMaster && hasChildren && (
                        <button
                          onClick={() => toggleMasterExpand(jc.jobCardNo)}
                          className="px-3.5 py-2 rounded-full border border-[#ececec] bg-white text-[#777b86] hover:text-[#17191c] text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          <span>{childCards.length} Sub-Cards</span>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenBatchModal(jc)}
                      disabled={isPlantDayClosed}
                      title={isPlantDayClosed ? "Floor locked after 18:30 EOD shutdown." : ""}
                      className={`px-5 py-2 rounded-full text-xs font-bold transition shadow-xs w-full sm:w-auto flex items-center justify-center gap-1.5 ${
                        isPlantDayClosed
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                          : 'bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] cursor-pointer'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Log Shift Output (+Qty)</span>
                    </button>
                  </div>
                </div>

                {/* Sub-Card Tree Expansion for Master Card */}
                {isMaster && hasChildren && isExpanded && (
                  <div className="bg-[#fafafb] border-t border-[#ececec] p-4 sm:p-5 space-y-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#777b86] flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-[#c09748]" />
                      <span>Dedicated 3-Painter Sub-Job Cards & Rework Child Ledger:</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {childCards.map(child => {
                        const isChildRework = child.jobCardType === 'rework_child';
                        const childProgress = Math.min(100, Math.round((child.sprayedQty / child.targetQty) * 100));

                        return (
                          <div 
                            key={child.jobCardNo}
                            className={`p-3.5 rounded-[16px] border bg-white space-y-2 text-xs shadow-2xs ${
                              isChildRework ? 'border-amber-300 bg-amber-50/20' : 'border-[#ececec]'
                            }`}
                          >
                            <div className="flex items-center justify-between pb-1.5 border-b border-[#ececec]">
                              <span className="font-mono font-bold text-[#c09748] text-[11px]">
                                {child.jobCardNo}
                              </span>
                              <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold ${
                                isChildRework 
                                  ? 'bg-amber-100 text-amber-800' 
                                  : 'bg-blue-50 text-blue-800'
                              }`}>
                                {isChildRework ? 'Rework RW' : (child.assignedPainterId || 'P1')}
                              </span>
                            </div>

                            <div>
                              <div className="text-[11px] font-semibold text-[#17191c]">
                                {child.assignedPainterName || child.painterName}
                              </div>
                              <div className="text-[10px] text-[#777b86]">
                                Target: {child.targetQty} Pcs | Sprayed: {child.sprayedQty} Pcs
                              </div>
                            </div>

                            <div className="w-full bg-[#f2f2f3] rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-full ${isChildRework ? 'bg-amber-500' : 'bg-[#c09748]'}`}
                                style={{ width: `${childProgress}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between pt-1 text-[10px] text-[#777b86]">
                              <span>Good: <strong className="text-emerald-800 font-mono">{child.goodQty}</strong></span>
                              <span>Rej: <strong className="text-red-600 font-mono">{child.rejectQty}</strong></span>
                              <button
                                onClick={() => handleOpenBatchModal(child)}
                                className="text-[#8a6521] hover:underline font-semibold cursor-pointer"
                              >
                                +Update
                              </button>
                            </div>
                          </div>
                        );
                      })}
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
                <span className="text-[#777b86]">Target Cap:</span>
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
                <label className="block text-[#777b86] font-medium mb-1">Shift Rejection Pcs</label>
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
                  {paintingLines.map(line => (
                    <option key={line.id} value={line.name}>
                      {line.name} ({line.type}) {line.status !== 'Active' ? `[${line.status}]` : ''}
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

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAcceptModal(false)}
                  className="px-5 py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs cursor-pointer transition flex items-center gap-1.5"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>Acknowledge Custody & Transfer to WIP</span>
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

      {/* Modal 7: Painting Lines & Spray Booth Fleet Management */}
      {showLineFleetModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-[#ececec] space-y-4 text-xs max-h-[90vh] overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-[#ececec]">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
                  PLANT CONFIGURATION • BOOTH FLEET
                </span>
                <h3 className="text-base sm:text-lg font-serif font-normal text-[#17191c] mt-1">
                  Manage Painting Lines & Spray Booth Fleet
                </h3>
              </div>
              <button
                onClick={() => setShowLineFleetModal(false)}
                className="text-[#979799] hover:text-[#17191c] cursor-pointer text-base font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-[#777b86] leading-relaxed">
              Production Manager apne plant ke active spray booths, conveyor lines aur UV/hydrographic lines yahan configure kar sakte hain. Daily planning offline hoti hai aur line ke anusaar material demand kiya jata hai.
            </p>

            {/* List of current lines */}
            <div className="space-y-2">
              <label className="block text-[#17191c] font-semibold">Active Plant Booths ({paintingLines.length})</label>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {paintingLines.map(line => (
                  <div
                    key={line.id}
                    className="p-3 rounded-[16px] border border-[#ececec] bg-[#fafafb] flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#8a6521]">{line.id}</span>
                        <span className="font-semibold text-xs text-[#17191c]">{line.name}</span>
                      </div>
                      <div className="text-[10px] text-[#777b86] mt-0.5">{line.type}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleLineStatus(line.id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition border ${
                          line.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        {line.status}
                      </button>

                      {paintingLines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteLine(line.id)}
                          className="p-1 rounded-full text-[#979799] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Remove Line"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form to add a new line */}
            <form onSubmit={handleAddLine} className="p-3.5 rounded-[16px] border border-[#f4e5be] bg-[#faf7ed]/60 space-y-3">
              <div className="font-bold text-xs text-[#8a6521] flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Painting Booth / Line</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#17191c] mb-1">Booth / Line Name</label>
                <input
                  type="text"
                  placeholder="e.g. Booth #5 (High Gloss Robotic PU Spray)"
                  value={newLineName}
                  onChange={e => setNewLineName(e.target.value)}
                  className="w-full p-2 rounded-[10px] border border-[#ececec] bg-white text-xs text-[#17191c]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#17191c] mb-1">Process Technology / Type</label>
                <select
                  value={newLineType}
                  onChange={e => setNewLineType(e.target.value)}
                  className="w-full p-2 rounded-[10px] border border-[#ececec] bg-white text-xs cursor-pointer text-[#17191c]"
                >
                  <option value="Conveyor Liquid PU">Conveyor Liquid PU</option>
                  <option value="Dust-Free Cleanroom 2K">Dust-Free Cleanroom 2K</option>
                  <option value="Water Transfer Hydrographic">Water Transfer Hydrographic (Dipping)</option>
                  <option value="Direct Flatbed UV Plotter">Direct Flatbed UV Plotter</option>
                  <option value="Manual Spray Booth">Manual Spray Booth</option>
                  <option value="Thermoplastic Injection Molding">Thermoplastic Injection Molding</option>
                  <option value="Thermal Curing Oven">Thermal Curing Oven</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-full bg-[#17191c] hover:bg-black text-[#c09748] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5 text-[#c09748]" />
                <span>+ Register New Line into Fleet</span>
              </button>
            </form>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowLineFleetModal(false)}
                className="px-5 py-2 rounded-full bg-[#17191c] text-white font-medium cursor-pointer text-xs"
              >
                Close Fleet Settings
              </button>
            </div>
          </div>
        </div>
      )}

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
