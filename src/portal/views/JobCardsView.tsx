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
  Paintbrush,
  FlaskConical,
  Download,
  Lock
} from 'lucide-react';
import { JobCardModal } from '../components/JobCardModal';
import { PreProductionInspectionModal } from '../components/PreProductionInspectionModal';
import { FPAModal } from '../components/FPAModal';
import { IPQCModal } from '../components/IPQCModal';
import { downloadStandardPreProductionPdf, downloadStandardFPAPdf, downloadStandardIPQCPdf } from '../utils/pdfStandardHeader';

export const JobCardsView: React.FC = () => {
  const { 
    jobCards, 
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
    painters,
    getPainterActiveJobCount,
    canAssignPainter,
    assignJobCardToPainter,
    verifyAndAcceptJob,
    rejectAndRequestRework,
    getPainterPerformanceStats,
    pendingVerificationJobsCount
  } = usePortalStore();

  // Active filter tab: ALL, MASTER, PAINTERS, REWORK, REQUISITIONS, STORE_STOCK, BOOTH_FLEET
  const [activeTab, setActiveTab] = useState<'ALL' | 'MASTER' | 'PAINTERS' | 'REWORK' | 'REQUISITIONS' | 'STORE_STOCK' | 'BOOTH_FLEET'>('ALL');

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
    if (activeSubTab === 'ALL' || activeSubTab === 'MASTER' || activeSubTab === 'PAINTERS' || activeSubTab === 'REWORK' || activeSubTab === 'REQUISITIONS' || activeSubTab === 'STORE_STOCK' || activeSubTab === 'BOOTH_FLEET') {
      setActiveTab(activeSubTab as any);
    }
  }, [activeSubTab]);

  const handleSelectTab = (tab: 'ALL' | 'MASTER' | 'PAINTERS' | 'REWORK' | 'REQUISITIONS' | 'STORE_STOCK' | 'BOOTH_FLEET') => {
    setActiveTab(tab);
    setActiveSubTab(tab);
  };

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
          itemDescription: stockItem.partDesc || 'ABS Raw Substrates',
          qty: availableCount,
          colour: 'Raw Tone',
          uom: stockItem.uom || 'Pcs',
          remark: `Store Lot ${stockItem.grnNo} (${stockItem.customer})`
        },
        {
          id: '2',
          itemDescription: 'Monza Red 2K PU Basecoat Paint (PPG)',
          qty: Math.max(5, Math.round(availableCount * 0.05)),
          colour: 'Monza Red Gloss',
          uom: 'Litres',
          remark: 'Store paint batch'
        },
        {
          id: '3',
          itemDescription: 'PU Thinner 400 Solvent',
          qty: Math.max(2, Math.round(availableCount * 0.02)),
          colour: 'Clear',
          uom: 'Litres',
          remark: 'Solvent line mix'
        }
      ]
    };

    setSelectedJobCardForView(initialJcData as JobCard);
    setShowJobCardModal(true);
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

      {/* ====================================================================== */}
      {/* 2. TAB NAVIGATION CHIPS (7 SUB-MODULES LINKED)                            */}
      {/* ====================================================================== */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#ececec] pb-3">
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
          onClick={() => handleSelectTab('MASTER')}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
            activeTab === 'MASTER'
              ? 'bg-[#17191c] text-[#c09748] shadow-xs'
              : 'bg-white hover:bg-[#fafafb] text-[#777b86] border border-[#ececec]'
          }`}
        >
          Master Batches ({masterCount})
        </button>
        <button
          onClick={() => handleSelectTab('PAINTERS')}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
            activeTab === 'PAINTERS'
              ? 'bg-[#17191c] text-[#c09748] shadow-xs'
              : 'bg-white hover:bg-[#fafafb] text-[#777b86] border border-[#ececec]'
          }`}
        >
          3-Painter Splits ({painterChildCount})
        </button>
        <button
          onClick={() => handleSelectTab('REWORK')}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
            activeTab === 'REWORK'
              ? 'bg-[#17191c] text-[#c09748] shadow-xs'
              : 'bg-white hover:bg-[#fafafb] text-[#777b86] border border-[#ececec]'
          }`}
        >
          Rework & Salvage ({reworkChildCount})
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
          onClick={() => handleSelectTab('STORE_STOCK')}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
            activeTab === 'STORE_STOCK'
              ? 'bg-[#17191c] text-[#c09748] shadow-xs'
              : 'bg-white hover:bg-[#fafafb] text-[#777b86] border border-[#ececec]'
          }`}
        >
          Available Store Stock ({storeStockList.length})
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
          <span>Painting Lines & Spray Booth Fleet ({paintingLines.length})</span>
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

      {/* DEDICATED SEARCH ROW for Cards */}
      {(activeTab === 'ALL' || activeTab === 'MASTER' || activeTab === 'PAINTERS' || activeTab === 'REWORK') && (
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
      )}

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
                    Store me live substrate aur paint stock. Kisi bhi item par <strong>"+ Create Job Card"</strong> click karke turant Job Card banayein, painter assign karein, aur Store ko material release demand bhejein.
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
                            {item.isInternalConsumable ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#faf7ed] border border-[#f4e5be] text-[#8a6521] text-[11px] font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#c09748]" />
                                <span>Internal Chemical Stock</span>
                              </span>
                            ) : hasBalance ? (
                              <button
                                type="button"
                                onClick={() => handleRequestFromSpecificStock(item)}
                                disabled={isPlantDayClosed}
                                className="px-3.5 py-1.5 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] font-bold text-xs shadow-2xs cursor-pointer transition flex items-center gap-1.5 ml-auto active:scale-95"
                              >
                                <Plus className="w-3.5 h-3.5 text-[#8a6521]" />
                                <span>+ Create Job Card ({item.balanceAvailable} {item.uom})</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-gray-400 font-mono italic">
                                Fully Allocated ({item.jobCardsCount} Cards)
                              </span>
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
                      <span className="text-[9px] text-[#777b86] uppercase block">Allocated to Cards</span>
                      <span className="font-mono font-bold text-blue-700">{item.totalIssuedToFloor} {item.uom}</span>
                    </div>
                  </div>

                  {item.isInternalConsumable ? (
                    <div className="text-center py-2 px-3 rounded-full bg-[#faf7ed] border border-[#f4e5be] text-[#8a6521] text-xs font-semibold">
                      Internal Chemical / Paint Stock (Issued via MIN)
                    </div>
                  ) : item.balanceAvailable > 0 ? (
                    <button
                      type="button"
                      onClick={() => handleRequestFromSpecificStock(item)}
                      disabled={isPlantDayClosed}
                      className="w-full py-2.5 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                    >
                      <Plus className="w-4 h-4 text-[#8a6521]" />
                      <span>+ Create Job Card ({item.balanceAvailable} {item.uom})</span>
                    </button>
                  ) : (
                    <div className="text-center text-xs text-gray-400 py-1 font-mono italic">
                      Fully Allocated Across {item.jobCardsCount} Job Cards
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeTab === 'BOOTH_FLEET' ? (
        /* ====================================================================== */
        /* TAB 7: PAINTING LINES & SPRAY BOOTH FLEET DEDICATED VIEW               */
        /* ====================================================================== */
        <div className="space-y-4">
          <div className="bg-white rounded-[24px] border border-[#ececec] p-4 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ececec]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#c09748] animate-pulse" />
                  <h3 className="font-serif font-normal text-lg sm:text-2xl text-[#17191c]">
                    Operational Painting Lines & Spray Booth Fleet
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono font-bold">
                    {paintingLines.filter(l => l.status === 'Active').length}/{paintingLines.length} Active Lines
                  </span>
                </div>
                <p className="text-xs text-[#777b86] mt-1">
                  Production Manager har booth ke hisaab se Store se material demand (MRN) raise karta hai aur line throughput monitor karta hai.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowLineFleetModal(true)}
                className="px-4 py-2 rounded-full bg-[#17191c] hover:bg-black text-[#c09748] font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5 text-[#c09748]" />
                <span>+ Add / Configure Booths</span>
              </button>
            </div>

            {/* Comprehensive Fleet Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {paintingLines.map(line => {
                const isActive = line.status === 'Active';
                return (
                  <div
                    key={line.id}
                    className={`p-4 rounded-[20px] border transition flex flex-col justify-between gap-4 ${
                      isActive
                        ? 'border-[#f4e5be] bg-white hover:border-[#c09748] shadow-xs'
                        : 'border-dashed border-gray-300 bg-gray-50/70 opacity-75'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-mono font-bold text-[#8a6521] px-2 py-0.5 rounded-md bg-[#faf3e0]">
                          {line.id}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {line.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-[#17191c]">
                        {line.name}
                      </h4>
                      <div className="text-xs text-[#777b86] mt-1 font-mono">
                        Tech: {line.type}
                      </div>
                      <div className="text-[11px] text-[#8a6521] mt-2 p-2 rounded-[12px] bg-[#fafafb] border border-[#ececec]">
                        Capacity: <strong>1,200 pcs / shift</strong> • Air Pressure: 4.2 Bar
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-[#ececec]">
                      <button
                        type="button"
                        onClick={() => handleOpenRequisitionModal(undefined, line.name)}
                        disabled={isPlantDayClosed || !isActive}
                        className={`w-full py-2 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                          isActive && !isPlantDayClosed
                            ? 'bg-[#17191c] hover:bg-black text-[#c09748] cursor-pointer shadow-2xs'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 text-[#c09748]" />
                        <span>+ Demand Material (MRN)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
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

                        {/* Gate 1: Pre-Production Inspection (PIR) Badge */}
                        {isPirPassed ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-bold flex items-center gap-1" title={activePirReportNo ? `Substrates Cleared under ${activePirReportNo}` : 'PIR Passed'}>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Gate 1: PIR Cleared ✓ {activePirReportNo ? `(${activePirReportNo})` : ''}</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-[10px] font-mono font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-700" />
                            <span>Gate 1: PIR Pending</span>
                          </span>
                        )}

                        {/* Gate 2: FPA Golden Gate Status Badge - Lot Synced */}
                        {isFpaApproved ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-bold flex items-center gap-1" title={activeFpaReportNo ? `Approved under ${activeFpaReportNo}` : 'FPA Approved for this Lot'}>
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span>Gate 2: FPA Approved ✓ {activeFpaReportNo ? `(${activeFpaReportNo})` : ''}</span>
                          </span>
                        ) : !isPirPassed ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-gray-100 border border-gray-300 text-gray-600 text-[10px] font-mono font-bold flex items-center gap-1" title="Complete Pre-Production Inspection first to unlock FPA">
                            <Lock className="w-3 h-3 text-gray-500" />
                            <span>Gate 2: FPA Locked (PIR Required)</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-[10px] font-mono font-bold flex items-center gap-1">
                            <FlaskConical className="w-3 h-3 text-amber-700" />
                            <span>Gate 2: FPA Pending</span>
                          </span>
                        )}

                        {/* SLA / On-Time Marking Badge */}
                        {(() => {
                          const isClosed = jc.status === 'Completed' || jc.status === 'Verified & Accepted' || jc.status === 'Target Met';
                          const isSlaBreachedNow = (jc.isSlaBreached) || (!isClosed && jc.slaDeadline && new Date() > new Date(jc.slaDeadline));
                          
                          if (isClosed) {
                            if (jc.isOnTimeCompleted === false || jc.isSlaBreached) {
                              return (
                                <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-mono font-bold flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  <span>Time Se Nahi Hua (Delayed)</span>
                                </span>
                              );
                            }
                            return (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Time Se Hua ✓</span>
                              </span>
                            );
                          }
                          
                          if (isSlaBreachedNow) {
                            return (
                              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 border border-rose-300 text-rose-900 text-[10px] font-mono font-bold flex items-center gap-1 animate-pulse">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                <span>⚠️ SLA Overdue</span>
                              </span>
                            );
                          }

                          return (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#faf7ed] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#c09748]" />
                              <span>SLA: {jc.slaHours || 4}h Limit</span>
                            </span>
                          );
                        })()}
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

                      {/* Gate 1: PIR Action Button */}
                      <button
                        onClick={() => {
                          if (matchingPir) {
                            downloadStandardPreProductionPdf(matchingPir);
                          } else {
                            setSelectedJcForPir(jc);
                            setShowPirModal(true);
                          }
                        }}
                        className={`px-3.5 py-1 rounded-full text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 ${
                          isPirPassed
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                            : 'bg-[#faf7ed] border border-[#f4e5be] text-[#8a6521] hover:bg-[#faf3e0]'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-[#c09748]" />
                        <span>{isPirPassed ? (activePirReportNo ? `PIR Ready (${activePirReportNo}) ✓` : 'PIR Ready ✓') : '+ Perform PIR Check'}</span>
                      </button>

                      {/* Gate 2: FPA Golden Gate Action Button (Strictly Locked if PIR Not Passed) */}
                      <button
                        disabled={!isPirPassed && !isFpaApproved}
                        onClick={() => {
                          if (matchingFpa) {
                            downloadStandardFPAPdf(matchingFpa);
                          } else if (isPirPassed) {
                            setSelectedJcForFpa(jc);
                            setShowFpaModal(true);
                          }
                        }}
                        title={!isPirPassed && !isFpaApproved ? 'Gate 1 Pre-Production Substrate Inspection must be passed before FPA test' : undefined}
                        className={`px-3.5 py-1 rounded-full text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs active:scale-95 ${
                          isFpaApproved
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 cursor-pointer'
                            : !isPirPassed
                            ? 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed opacity-75'
                            : 'bg-[#faf7ed] border border-[#f4e5be] text-[#8a6521] hover:bg-[#faf3e0] cursor-pointer'
                        }`}
                      >
                        {!isPirPassed && !isFpaApproved ? (
                          <Lock className="w-3.5 h-3.5 text-gray-400" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-[#c09748]" />
                        )}
                        <span>{isFpaApproved ? (activeFpaReportNo ? `FPA Ready (${activeFpaReportNo}) ✓` : 'FPA Approved ✓') : !isPirPassed ? 'FPA Locked (PIR Req.)' : '+ Perform FPA Test'}</span>
                      </button>

                      {/* In-Process 3-Hourly IPQC Action */}
                      <button
                        onClick={() => {
                          setSelectedJcForIpqc(jc);
                          setShowIpqcModal(true);
                        }}
                        className="px-3.5 py-1 rounded-full bg-white border border-[#ececec] hover:border-[#c09748] text-[#17191c] text-xs font-semibold hover:bg-gray-50 transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                      >
                        <Clock className="w-3.5 h-3.5 text-[#c09748]" />
                        <span>+ Log 3h IPQC</span>
                      </button>

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
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-3 rounded-[16px] bg-[#fafafb] border border-[#ececec] text-xs">
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
                      <span className="text-[#777b86] block text-[10px] uppercase font-bold">Target SLA Limit</span>
                      <span className="font-mono text-[#17191c] font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#c09748]" />
                        <span>{jc.slaHours || 4} Hours</span>
                      </span>
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

                  {/* QUALITY GATES: 1. PIR (PRE-PRODUCTION) -> 2. FPA (GOLDEN GATE) -> 3. IPQC AUDITS */}
                  {(() => {
                    const matchingIpqc = ipqcRecords.filter(
                      i => (jc.woNo && i.woNo.toLowerCase() === jc.woNo.toLowerCase()) || i.partCode.toLowerCase() === jc.partCode.toLowerCase()
                    );

                    return (
                      <div className="p-3.5 rounded-[18px] bg-gradient-to-r from-[#faf7ed] via-[#fafafb] to-white border border-[#f4e5be] space-y-2.5 text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#f4e5be]/60 pb-2">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-[#c09748]" />
                            <span className="font-bold uppercase tracking-wider text-[11px] text-[#17191c] font-mono">
                              Quality Gates: 1. PIR Substrate Check &rarr; 2. FPA Golden Lab &rarr; 3. IPQC Line Audits
                            </span>
                          </div>
                          <span className="text-[10px] text-[#8a6521] font-mono font-semibold">
                            Sequential Release: 100% Pre-Check &bull; &Delta;E &le; 0.70 &bull; ASTM 5B
                          </span>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                          {/* GATE 1: Pre-Production Inspection (PIR / Pre-Spray Substrate Check) */}
                          <div className={`p-3 rounded-[14px] border space-y-1.5 shadow-2xs ${
                            isPirPassed ? 'bg-white border-emerald-200' : 'bg-amber-50/50 border-amber-200'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-bold text-[#777b86] font-mono flex items-center gap-1">
                                <PackageCheck className="w-3.5 h-3.5 text-[#c09748]" />
                                Gate 1: Pre-Production (PIR)
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                                isPirPassed ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900 animate-pulse'
                              }`}>
                                {isPirPassed ? '✓ PASSED (GATE 1 OK)' : '⚠️ AWAITING PRE-CHECK'}
                              </span>
                            </div>

                            {matchingPir ? (
                              <div className="space-y-1 text-[11px]">
                                <div className="flex items-center justify-between font-mono">
                                  <span className="text-[#777b86]">Report: <strong>{matchingPir.reportNo}</strong></span>
                                  <span className="text-emerald-700 font-bold">8/8 Checks Pass</span>
                                </div>
                                <div className="text-[10px] text-[#777b86] truncate">
                                  Accepted: {matchingPir.acceptedQty} / {matchingPir.inspectedQty} pcs &bull; By: {matchingPir.inspectorName}
                                </div>
                                <div className="pt-1 flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => downloadStandardPreProductionPdf(matchingPir)}
                                    className="px-2.5 py-1 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10px] font-bold hover:bg-[#f4e5be] transition flex items-center gap-1 cursor-pointer shadow-2xs"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Download PIR PDF ({matchingPir.reportNo})</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1.5 pt-0.5">
                                <p className="text-[10.5px] text-[#777b86]">
                                  100% Pre-treatment check (IPA wipe, burrs/flash, jigging, piece count) required from Stores to Floor.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedJcForPir(jc);
                                    setShowPirModal(true);
                                  }}
                                  className="px-3 py-1.5 rounded-full bg-[#17191c] hover:bg-black text-[#c09748] text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
                                >
                                  <PackageCheck className="w-3 h-3 text-[#c09748]" />
                                  <span>+ Perform PIR Substrate Check</span>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* GATE 2: First Part Approval (FPA - Golden Gate) */}
                          <div className={`p-3 rounded-[14px] border space-y-1.5 shadow-2xs ${
                            !isPirPassed 
                              ? 'bg-gray-50/70 border-gray-200 opacity-80' 
                              : isFpaApproved 
                                ? 'bg-white border-emerald-200' 
                                : 'bg-white border-[#ececec]'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-bold text-[#777b86] font-mono flex items-center gap-1">
                                <FlaskConical className="w-3.5 h-3.5 text-[#c09748]" />
                                Gate 2: First Part Approval (FPA)
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                                !isPirPassed
                                  ? 'bg-gray-200 text-gray-700'
                                  : isFpaApproved
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : 'bg-amber-100 text-amber-900'
                              }`}>
                                {!isPirPassed ? '🔒 LOCKED (NEEDS PIR)' : isFpaApproved ? '✓ APPROVED (LOT RELEASED)' : '⚠️ PENDING LAB CHECK'}
                              </span>
                            </div>

                            {!isPirPassed ? (
                              <div className="space-y-1 pt-1 text-[10.5px] text-gray-500">
                                <p className="italic">
                                  Gate 2 is locked until Gate 1 (Pre-Production Inspection) is recorded and passed for this batch.
                                </p>
                              </div>
                            ) : matchingFpa ? (
                              <div className="space-y-1 text-[11px]">
                                <div className="flex items-center justify-between font-mono">
                                  <span className="text-[#777b86]">Report: <strong>{matchingFpa.reportNo}</strong></span>
                                  <span className="text-emerald-700 font-bold">&Delta;E = {matchingFpa.deltaE} (Pass)</span>
                                  <span className="text-emerald-700 font-bold">Adh: {matchingFpa.adhesionPercent}%</span>
                                </div>
                                <div className="text-[10px] text-[#777b86] truncate">
                                  Audited by: {matchingFpa.qcEngineer} &bull; Viscosity: {matchingFpa.viscositySec}s (FC4)
                                </div>
                                <div className="pt-1 flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => downloadStandardFPAPdf(matchingFpa)}
                                    className="px-2.5 py-1 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10px] font-bold hover:bg-[#f4e5be] transition flex items-center gap-1 cursor-pointer shadow-2xs"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Download FPA PDF ({matchingFpa.reportNo})</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1.5 pt-0.5">
                                <p className="text-[10.5px] text-[#777b86]">
                                  Initial 5 sample test pieces must be recorded before continuing mass production.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedJcForFpa(jc);
                                    setShowFpaModal(true);
                                  }}
                                  className="px-3 py-1.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-white text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
                                >
                                  <Sparkles className="w-3 h-3 text-white" />
                                  <span>+ Record FPA Golden Sample Test</span>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* GATE 3: 3-Hourly IPQC In-Process Trail */}
                          <div className="p-3 rounded-[14px] bg-white border border-[#ececec] space-y-1.5 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-bold text-[#777b86] font-mono flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-[#c09748]" />
                                Gate 3: IPQC ({matchingIpqc.length} Logs)
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedJcForIpqc(jc);
                                  setShowIpqcModal(true);
                                }}
                                className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-[10px] font-bold transition cursor-pointer shadow-2xs"
                              >
                                + Log Audit
                              </button>
                            </div>

                            {matchingIpqc.length > 0 ? (
                              <div className="space-y-1 text-[11px]">
                                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                  {matchingIpqc.map((ip, ipIdx) => (
                                    <span
                                      key={ipIdx}
                                      onClick={() => downloadStandardIPQCPdf(ip)}
                                      title={`Click to download ${ip.reportNo} PDF`}
                                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer hover:opacity-80 transition ${
                                        ip.result === 'Pass' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                                      }`}
                                    >
                                      <span>{ip.checkTime}</span>
                                      <span>({ip.result === 'Pass' ? '✓' : '⚠️'})</span>
                                      <Download className="w-2.5 h-2.5 ml-0.5" />
                                    </span>
                                  ))}
                                </div>
                                <div className="text-[10px] text-[#777b86] pt-0.5">
                                  Latest Audit: {matchingIpqc[0].checkTime} &bull; &Delta;E: {matchingIpqc[0].deltaE} &bull; Booth: {matchingIpqc[0].booth}
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1 pt-0.5">
                                <p className="text-[10.5px] text-[#777b86]">
                                  No 3-hourly line audits logged yet for this batch. Log audits at 09:00, 12:00, 15:00.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

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
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-[#c09748]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#c09748]" />}
                          <span>{childCards.length} Sub-Cards</span>
                        </button>
                      )}

                      {/* Assign Floor Painter Button */}
                      <button
                        onClick={() => handleOpenAssignPainterModal(jc)}
                        disabled={isPlantDayClosed}
                        className="px-3.5 py-2 rounded-full border border-[#f4e5be] bg-[#faf7ed] text-[#8a6521] hover:bg-[#faf3e0] text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                        title="Assign to floor painter with max-2 active card limit check"
                      >
                        <Paintbrush className="w-3.5 h-3.5 text-[#c09748]" />
                        <span>{jc.assignedPainterName ? `Painter: ${jc.assignedPainterName.split(' ')[0]}` : 'Assign Painter'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {jc.painterJobStatus === 'Pending Verification' ? (
                        <button
                          onClick={() => handleOpenVerificationModal(jc)}
                          className="px-4 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto animate-pulse"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify & Accept</span>
                        </button>
                      ) : (
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
                      )}
                    </div>
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
