import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  UserProfile,
  UserRole,
  PlantLocation,
  ShiftType,
  GoodsReceiptNote,
  IQCInspectionRecord,
  JobCard,
  FPARecord,
  PaintMixingRecord,
  IPQCRecord,
  PackingSlipRecord,
  FinalQualityRelease,
  BillingInvoice,
  BillableLineItem,
  GatePassRecord,
  MaterialInwardRecord,
  MaterialOutwardRecord,
  DefectItem,
  UniversalJobRecord,
  PreSprayIQCRecord,
  FinalQAGateRecord,
  JobPipelineStage,
  Capa8DRecord,
  FourMChangeRecord,
  ProductionOfferingReport,
  HRLeaveRecord,
  CalibrationRecord,
  AuditQuestionItem,
  PlantDayEndClosure,
  JobCardType,
  DefectCategory,
  MaterialRequisitionNote,
  PainterProfile,
  PainterJobStatus,
  PreProductionInspectionRecord,
  PlantHeadPriorityAssignment,
  ProductionPriorityLevel,
  JobCardNature,
  SamplingRecipeSheet,
  SamplingPartyApproval,
  JobCardProductionProgressLog,
  CoatingProcessStage,
  PaintingBooth,
  ProcessStageCount,
  StockCategory,
  StockMaterialType,
  StockBatch,
  BatchIssueLine,
  FifoOverrideLog,
  FifoOverrideReasonCode,
  BalanceReturnSlip,
  BalanceReturnLine,
  BalanceReturnCondition,
  RequisitionLineItem,
  PlantShiftConfig,
  JobCardDailyTargetRecord,
  PainterAssignment,
  PainterDailyMaterialAllocation,
  PainterFloorDemandEntry,
  AssignmentMaterialLog,
  AssignmentStatus,
  MasterJobCard,
  resolveJobCardInwardParts,
  computeAssignmentBalance,
  isLegacyDemoJobCard,
  extractJobCardSeq,
  getNextJobCardNo
} from '../types/portalTypes';
import {
  applyIssueToBatches,
  validateIssue,
  applyReturn,
  isChemicalConsumable
} from '../utils/stockEngine';
import {
  INITIAL_UNIVERSAL_JOBS,
  INITIAL_GRN_DATA,
  INITIAL_IQC_RECORDS,
  INITIAL_JOB_CARDS,
  INITIAL_PRE_PRODUCTION_REPORTS,
  INITIAL_FPA_RECORDS,
  INITIAL_PAINT_MIXING,
  INITIAL_IPQC_RECORDS,
  INITIAL_PACKING_SLIPS,
  INITIAL_QUALITY_RELEASES,
  INITIAL_BILLING_INVOICES,
  INITIAL_GATE_PASSES,
  INITIAL_MATERIAL_INWARD,
  INITIAL_MATERIAL_OUTWARD,
  MASTER_DEFECTS,
  INITIAL_CAPA_8D_RECORDS,
  INITIAL_4M_CHANGE_RECORDS,
  INITIAL_PRODUCTION_OFFERING_REPORTS,
  INITIAL_HR_LEAVE_RECORDS,
  INITIAL_CALIBRATION_RECORDS,
  INITIAL_MNC_AUDIT_QUESTIONS,
  INITIAL_DAY_END_CLOSURES,
  INITIAL_PAINTERS,
  INITIAL_PAINTING_BOOTHS,
  INITIAL_REQUISITIONS,
  INITIAL_PLANT_HEAD_PRIORITIES,
  INITIAL_STOCK_BATCHES,
  INITIAL_FIFO_OVERRIDE_LOGS,
  INITIAL_BALANCE_RETURN_SLIPS
} from '../data/mockInitialData';
import { persistRemoteState, fetchAllRemoteState } from '../lib/supabaseClient';
import { matchesPlant } from '../utils/portalAuth';


interface PortalContextType {
  // Authentication & Context
  currentUser: UserProfile;
  switchUser: (userId: string) => void;
  canSwitchPlant: boolean;
  logoutUser: () => void;
  activePlant: PlantLocation | 'ALL';
  setActivePlant: (plant: PlantLocation | 'ALL') => void;
  activeShift: ShiftType;
  setActiveShift: (shift: ShiftType) => void;
  activeSubTab: string | null;
  setActiveSubTab: (subTab: string | null) => void;

  // Data Collections
  universalJobs: UniversalJobRecord[];
  grnList: GoodsReceiptNote[];
  iqcRecords: IQCInspectionRecord[];
  jobCards: JobCard[];
  painters: PainterProfile[];
  paintingBooths: PaintingBooth[];
  pendingVerificationJobsCount: number;

  // Painting Lines & Spray Booth Fleet Management
  addPaintingBooth: (booth: Omit<PaintingBooth, 'id'>) => void;
  updatePaintingBooth: (id: string, updates: Partial<PaintingBooth>) => void;
  deletePaintingBooth: (id: string) => void;
  toggleBoothStatus: (id: string) => void;

  // Floor Painters Fleet CRUD Management
  addPainter: (painter: Omit<PainterProfile, 'id'>) => void;
  updatePainter: (id: string, updates: Partial<PainterProfile>) => void;
  deletePainter: (id: string) => void;
  togglePainterStatus: (id: string) => void;

  // 3-Tier Spray Painting Job Card Architecture (PK-OS 2026)
  painterAssignments: PainterAssignment[];
  assignmentMaterialLogs: AssignmentMaterialLog[];
  createPainterAssignment: (
    assignmentData: Omit<PainterAssignment, 'id' | 'status' | 'actualCompletedQty' | 'rejectReworkQty' | 'scrapQty' | 'stageOkQty' | 'stageReworkQty' | 'stageScrapQty'>,
    masterJobCardOverride?: JobCard
  ) => { success: boolean; error?: string; assignment?: PainterAssignment };
  closePainterAssignment: (
    assignmentId: string,
    completionData: {
      actualCompletedQty: number;
      rejectReworkQty: number;
      scrapQty?: number;
      stageOkQty: number;
      stageReworkQty: number;
      stageScrapQty: number;
      defectCategory?: DefectCategory | string;
      remarks?: string;
    },
    materialReconciliations?: Array<{
      materialName: string;
      materialType: 'Base Paint' | 'Topcoat' | 'Hardener' | 'Thinner' | 'Cleaning Solvent';
      batchNumber?: string;
      issuedQty: number;
      goodReturnedQty: number;
      floorWastageExpiredQty: number;
      uom: 'Litres' | 'Kg' | 'Pcs';
      standardNormPerPiece?: number;
    }>
  ) => { success: boolean; error?: string };
  issueAssignmentMaterials: (
    assignmentId: string,
    materials: Array<{
      materialName: string;
      materialType: 'Base Paint' | 'Topcoat' | 'Hardener' | 'Thinner' | 'Cleaning Solvent';
      batchNumber?: string;
      issuedQty: number;
      uom: 'Litres' | 'Kg' | 'Pcs';
      standardNormPerPiece?: number;
    }>,
    targetAssignmentOverride?: PainterAssignment
  ) => void;
  requestAssignmentChemicals: (
    assignmentId: string,
    materials: PainterDailyMaterialAllocation[]
  ) => { success: boolean; mrnNo?: string; error?: string };
  addTargetToPainterAssignment: (
    assignmentId: string,
    extraPartyQty: number,
    extraChemicals?: PainterDailyMaterialAllocation[],
    masterJobCardOverride?: JobCard
  ) => { success: boolean; mrnNo?: string; error?: string };
  updateAssignmentMaterialLog: (
    logId: string,
    updates: { goodReturnedQty: number; floorWastageExpiredQty: number; batchNumber?: string }
  ) => void;
  recordAssignmentStageOutput: (
    assignmentId: string,
    stage: CoatingProcessStage,
    goodDelta: number,
    reworkDelta: number,
    scrapDelta: number
  ) => void;
  getPainterConsumablesLedger: (painterIdOrName?: string) => {
    totalIssuedLitres: number;
    totalReturnedGoodLitres: number;
    totalFloorWastageLitres: number;
    netConsumedLitres: number;
    totalPiecesPainted: number;
    avgLitrePerPiece: number;
    highWastageLogsCount: number;
    logs: AssignmentMaterialLog[];
  };
  plantHeadPriorities: PlantHeadPriorityAssignment[];
  assignProductionPriority: (assignment: Omit<PlantHeadPriorityAssignment, 'id' | 'assignedAt' | 'status'>) => void;
  updatePriorityStatus: (priorityId: string, status: PlantHeadPriorityAssignment['status'], linkedJobCardNo?: string) => void;

  // Painter Workspace & Max-2 Guardrail Methods
  getPainterActiveJobCount: (painterNameOrId: string) => number;
  canAssignPainter: (painterNameOrId: string) => boolean;
  assignJobCardToPainter: (jobCardNo: string, painterName: string) => { success: boolean; error?: string };
  startPainterJob: (jobCardNo: string, painterName: string) => void;
  markPainterJobFinished: (jobCardNo: string, painterNotes?: string) => void;
  verifyAndAcceptJob: (jobCardNo: string, okQty: number, rejQty: number, remarks?: string) => void;
  rejectAndRequestRework: (jobCardNo: string, reworkInstruction: string, defect: DefectCategory) => void;
  getPainterPerformanceStats: (painterNameOrId: string) => {
    totalJobs: number;
    activeJobs: number;
    completedJobs: number;
    onTimeJobs: number;
    delayedJobs: number;
    onTimePercentage: number;
    hasDelayedJobs: boolean;
    breachedJobCards: JobCard[];
    onTimeJobCards: JobCard[];
    passRate: number;
    rating: number;
  };

  preProductionReports: PreProductionInspectionRecord[];
  addPreProductionReport: (report: PreProductionInspectionRecord) => void;
  fpaRecords: FPARecord[];
  paintMixing: PaintMixingRecord[];
  ipqcRecords: IPQCRecord[];
  packingSlips: PackingSlipRecord[];
  qualityReleases: FinalQualityRelease[];
  billingInvoices: BillingInvoice[];
  gatePasses: GatePassRecord[];
  materialInwardLogs: MaterialInwardRecord[];
  materialOutwardLogs: MaterialOutwardRecord[];
  defects: DefectItem[];
  materialRequisitions: MaterialRequisitionNote[];

  // Store Role Upgrade: Batch-Wise Stock, FIFO/FEFO & Balance Returns (PK-OS Upgrade)
  stockBatches: StockBatch[];
  fifoOverrideLogs: FifoOverrideLog[];
  balanceReturnSlips: BalanceReturnSlip[];
  addStockBatch: (batch: StockBatch) => void;
  updateStockBatch: (batchId: string, updates: Partial<StockBatch>) => void;
  issueMaterialRequisitionWithBatches: (params: {
    mrnNo: string;
    issuedSlipNo?: string;
    storeInchargeName: string;
    storeRemarks?: string;
    lineAllocations: Array<{
      requisitionLineId?: string;
      itemName: string;
      isDirectUnbatched?: boolean;
      batchLines: BatchIssueLine[];
    }>;
    fifoStatus?: 'FIFO OK' | 'FIFO Override';
    overrideReasonCode?: FifoOverrideReasonCode;
    overrideRemark?: string;
  }) => { success: boolean; error?: string; minNo: string };
  createBalanceReturnSlip: (slip: Omit<BalanceReturnSlip, 'rtnNo' | 'status'>) => BalanceReturnSlip;
  acceptBalanceReturnSlip: (
    rtnNo: string,
    verifiedLinesOrReceivedBy?: Array<{
      lineId: string;
      storeCountedQty: number;
      condition: BalanceReturnCondition;
      remarks?: string;
    }> | string,
    receivedByStoreOrDecision?: string,
    supervisorDecision?: string
  ) => void;
  plantShiftConfig: PlantShiftConfig;
  updatePlantShiftConfig: (updates: Partial<PlantShiftConfig>) => void;
  executePlantClosingReconciliation: (overrideDate?: string) => {
    reconciledCount: number;
    generatedSlips: BalanceReturnSlip[];
  };
  requestNextDayTarget: (params: {
    jobCardNo: string;
    nextDayTarget: number;
    requestedBy?: string;
  }) => { success: boolean; error?: string; mrnNo?: string };
  flagBalanceReturnDiscrepancy: (
    rtnNo: string,
    discrepancyLines: Array<{
      lineId: string;
      storeCountedQty: number;
      condition: BalanceReturnCondition;
      remarks?: string;
    }>,
    remarks?: string
  ) => void;
  supervisorSignOffBalanceReturn: (
    rtnNo: string,
    supervisorName: string,
    decision: string,
    notes?: string
  ) => void;

  // Store <-> Production Material Handshake Engine
  createMaterialRequisition: (req: Omit<MaterialRequisitionNote, 'mrnNo' | 'status' | 'date' | 'time'>) => void;
  issueMaterialRequisition: (
    mrnNo: string,
    issuedSlipNo: string,
    sourceGrnNo: string,
    issuedQty: number,
    storeInchargeName: string,
    storeRemarks?: string
  ) => void;
  acceptMaterialRequisition: (
    mrnNo: string,
    receivedQty: number,
    receivedBy: string,
    discrepancyReason?: MaterialRequisitionNote['discrepancyReason'],
    productionRemarks?: string
  ) => void;

  // Next-Gen Universal Job Engine Actions
  addUniversalJob: (job: UniversalJobRecord) => void;
  submitPreSprayIQC: (
    jobId: string,
    inspectedQty: number,
    approvedQty: number,
    rejectedQty: number,
    defectReason?: PreSprayIQCRecord['defectReason'],
    remarks?: string
  ) => void;
  submitFinalQA: (
    jobId: string,
    deltaE: number,
    adhesionTest: 'Pass (100% Tape)' | 'Fail (Flaking)',
    goodQty: number,
    rejectQty: number,
    remarks?: string
  ) => void;
  advanceJobStage: (jobId: string, nextStage: JobPipelineStage) => void;

  // Logic Engine Actions
  addGRN: (grn: GoodsReceiptNote) => void;
  addIQCRecord: (iqc: IQCInspectionRecord) => void;
  submitMasterIQCReport: (report: IQCInspectionRecord) => void;
  addIPQCRecord: (ipqc: IPQCRecord) => void;
  addOQCRelease: (release: FinalQualityRelease) => void;
  submitPdiClearance: (releaseId: string, pdiData: Partial<FinalQualityRelease>) => void;
  getNextUniqueJobCardNo: () => string;
  addJobCard: (jc: JobCard) => JobCard;
  deleteJobCard: (jobCardNo: string) => void;
  updateJobCard: (jc: JobCard) => void;
  addJobCardProgressLog: (jobCardNo: string, log: Omit<JobCardProductionProgressLog, 'id' | 'timestamp'>) => void;
  updateSamplingRecipe: (jobCardNo: string, recipe: Partial<SamplingRecipeSheet>) => void;
  updateSamplingPartyStatus: (jobCardNo: string, status: SamplingPartyApproval['status'], feedback?: string) => void;
  lockSamplingAsMasterRecipe: (jobCardNo: string) => void;
  createMultiPainterJobCards: (parentData: JobCard, splits: { painterId: string; painterName: string; boothNo: string; targetQty: number }[]) => void;
  addMaterialInwardRecord: (record: MaterialInwardRecord) => void;
  addMaterialOutwardRecord: (record: MaterialOutwardRecord) => void;

  
  // Problem 1: Job Cards, Target Caps & Color Over-run
  updateJobCardProgress: (
    jobCardNo: string,
    addedSprayedQty: number,
    addedRejectQty?: number,
    consumablesUsage?: { [key: string]: number }
  ) => void;
  updateJobCardSprayed: (
    jobCardNo: string,
    addedSprayedQty: number,
    addedRejectQty?: number,
    defectCategory?: string,
    consumablesUsage?: { [key: string]: number }
  ) => void;

  // Quality FPA Golden Gate
  createFPARecord: (fpa: Omit<FPARecord, 'reportNo' | 'overallResult'>) => void;
  addFPATest: (fpa: Omit<FPARecord, 'reportNo' | 'overallResult'>) => void;

  // Problem 1: Smart Billing Engine Actions
  toggleInvoiceExcessApproval: (invoiceNo: string, lineItemId: string) => void;
  toggleClientConcession: (invoiceNo: string, lineItemId: string) => void;
  generateNewInvoiceFromPDI: (woNo: string) => void;
  createCustomTaxInvoice: (invoice: BillingInvoice) => void;
  recordInvoicePayment: (invoiceNo: string, paymentRef: string) => void;
  markInvoiceDispatched: (invoiceNo: string, gatePassNo: string) => void;

  // Gate Pass
  createGatePass: (gp: GatePassRecord) => void;
  updateGatePassStatus: (gatePassNo: string, status: GatePassRecord['status']) => void;

  // Active Discrepancy Alerts Counter
  openOverrunCount: number;

  // 100-Question MNC Audit Engine (Module E)
  auditQuestions: AuditQuestionItem[];
  updateAuditAnswer: (id: string, updates: Partial<AuditQuestionItem>) => void;
  resetAuditToStandard: () => void;

  // 8D CAPA & 4M Change Control (Section J)
  capa8DList: Capa8DRecord[];
  addCapa8D: (capa: Capa8DRecord) => void;
  updateCapa8D: (id: string, updates: Partial<Capa8DRecord>) => void;
  fourMChanges: FourMChangeRecord[];
  addFourMChange: (change: FourMChangeRecord) => void;

  // Production Offering Report (PRD-OFF) (Module C)
  productionOfferings: ProductionOfferingReport[];
  addProductionOffering: (offering: ProductionOfferingReport) => void;
  signProductionOffering: (
    id: string,
    stage: 'Prepared' | 'Checked' | 'QA' | 'Approved',
    signerName: string
  ) => void;

  // HR Leave Application (Module A / Format A.12)
  hrLeaves: HRLeaveRecord[];
  addHRLeave: (leave: HRLeaveRecord) => void;
  approveHRLeave: (
    id: string,
    stage: 'Dept Incharge' | 'HR' | 'MD',
    status: 'Approved' | 'Rejected',
    remarks?: string,
    signerName?: string
  ) => void;

  // Machine Calibration Master Register (Section K)
  calibrationList: CalibrationRecord[];
  updateCalibration: (id: string, updates: Partial<CalibrationRecord>) => void;

  // 5-Stage Sequential Quality Gatekeeper Functions
  canIssueJobCard: (grnNo: string) => { allowed: boolean; reason?: string };
  canStartBulkProduction: (jobCardNo: string) => { allowed: boolean; reason?: string };
  canPrintPackingSlip: (jobCardNo: string) => { allowed: boolean; reason?: string };

  // 3-Painters, Rework & Single Shift Day-End Operations
  dayEndClosures: PlantDayEndClosure[];
  isPlantDayClosed: boolean;
  splitJobCardToPainters: (masterJobCardNo: string, splits: { painterName: string; allocatedQty: number }[]) => void;
  routeToRework: (parentJobCardNo: string, reworkQty: number, defectCategory: DefectCategory, instructions: string) => void;
  passReworkClearance: (reworkJobCardNo: string, salvagedQty: number, scrapQty: number) => void;
  updateJobCardStageReceipt: (
    jobCardNo: string,
    stage: 'first' | 'second' | 'third',
    data: {
      receivedQty: number;
      operatorName: string;
      notes?: string;
      okQty?: number;
      rejectionQty?: number;
    }
  ) => void;
  addPackingSlip: (slip: PackingSlipRecord) => void;
  executeDayEndClosure: (notes?: string) => void;
  reopenPlant: () => void;
}

const PK_STORAGE_VERSION = '3.4.0-zero-demo-guarantee';
const TRANSACTIONAL_STORAGE_KEYS = [
  'pk_painter_assignments',
  'pk_assignment_material_logs',
  'pk_painters',
  'pk_painting_booths',
  'pk_plant_head_priorities',
  'pk_universal_jobs',
  'pk_stock_batches',
  'pk_fifo_override_logs',
  'pk_balance_return_slips',
  'pk_grn_data',
  'pk_material_requisitions',
  'pk_iqc_data',
  'pk_jobcards_data',
  'pk_pir_data',
  'pk_fpa_data',
  'pk_pmx_data',
  'pk_ipqc_data',
  'pk_packing_data',
  'pk_quality_releases',
  'pk_billing_invoices',
  'pk_gate_passes',
  'pk_material_inward',
  'pk_material_outward',
  'pk_capa_8d',
  'pk_4m_changes',
  'pk_prod_offerings',
  'pk_hr_leaves',
  'pk_day_end_closures',
  'pk_master_box_counter'
];

function ensureCleanStorageVersion(): void {
  try {
    if (localStorage.getItem('pk_storage_version') !== PK_STORAGE_VERSION) {
      for (const k of TRANSACTIONAL_STORAGE_KEYS) {
        localStorage.removeItem(k);
      }
      localStorage.setItem('pk_storage_version', PK_STORAGE_VERSION);
    }
    // Targeted scrubber for any lingering demo job card cache (never deletes real JC-2026-001 cards)
    const rawJc = localStorage.getItem('pk_jobcards_data');
    if (rawJc && (rawJc.includes('ROOP POLYMERS') || rawJc.includes('Demo Party') || rawJc.includes('WO-1042'))) {
      const parsed = JSON.parse(rawJc);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((j: any) => !isLegacyDemoJobCard(j));
        localStorage.setItem('pk_jobcards_data', JSON.stringify(cleaned));
      }
    }
  } catch {
    // ignore storage errors
  }
}

export function clearLocalPortalCache(): void {
  try {
    for (const k of TRANSACTIONAL_STORAGE_KEYS) {
      localStorage.removeItem(k);
    }
    localStorage.removeItem('pk_current_user');
    localStorage.removeItem('pk_portal_active_tab');
    localStorage.removeItem('pk_active_plant');
  } catch {
    // ignore storage errors
  }
}

function filterValidAssignments(assignments: PainterAssignment[], cards: JobCard[]): PainterAssignment[] {
  const cardByNo = new Map(cards.map(c => [c.jobCardNo, c]));
  return assignments.filter(a => {
    const jcNo = a.masterJobCardNo || a.masterJobCardId || '';
    const parent = cardByNo.get(jcNo);
    if (!parent) return false;
    if (
      parent.issueDate &&
      a.assignmentDate &&
      /^\d{4}-\d{2}-\d{2}$/.test(parent.issueDate) &&
      /^\d{4}-\d{2}-\d{2}$/.test(a.assignmentDate) &&
      a.assignmentDate < parent.issueDate
    ) {
      return false;
    }
    return true;
  });
}

function filterValidMaterialLogs(
  logs: AssignmentMaterialLog[],
  validAssignments: PainterAssignment[]
): AssignmentMaterialLog[] {
  const validAsgIds = new Set(validAssignments.map(a => a.id));
  return logs.filter(l => Boolean(l.assignmentId && validAsgIds.has(l.assignmentId)));
}

function sanitizePriorityLinks(
  priorities: PlantHeadPriorityAssignment[],
  cards: JobCard[]
): PlantHeadPriorityAssignment[] {
  const cardByNo = new Map(cards.map(c => [c.jobCardNo, c]));
  return priorities.map(p => {
    if (!p.linkedJobCardNo) return p;
    const linked = cardByNo.get(p.linkedJobCardNo);
    const prioCust = (p.customer || '').trim().toLowerCase();
    const jcCust = (linked?.customer || '').trim().toLowerCase();
    const prioGrn = (p.grnNo || '').trim().toLowerCase();
    const jcGrn = (linked?.sourceGrnNo || '').trim().toLowerCase();
    const isValidOwner =
      Boolean(linked) &&
      (!prioCust || !jcCust || prioCust === jcCust) &&
      (!prioGrn || !jcGrn || prioGrn === jcGrn);
    if (!isValidOwner) {
      return {
        ...p,
        status: p.status === 'Job Card Launched' ? 'Priority Assigned' : p.status,
        linkedJobCardNo: undefined
      };
    }
    return p;
  });
}

const PortalContext = createContext<PortalContextType | undefined>(undefined);

export const PortalProvider: React.FC<{
  children: React.ReactNode;
  authenticatedUser: UserProfile;
  onLogout: () => void;
}> = ({ children, authenticatedUser, onLogout }) => {
  ensureCleanStorageVersion();
  const isCloudHydratedRef = useRef<boolean>(false);

  const canSwitchPlant =
    authenticatedUser.role === 'SUPER_ADMIN' ||
    authenticatedUser.role === 'DIRECTOR' ||
    authenticatedUser.assignedPlant === 'ALL';

  // Current logged in user is strictly derived from verified Supabase Auth + pk_portal_users
  const [currentUser, setCurrentUser] = useState<UserProfile>(authenticatedUser);

  useEffect(() => {
    setCurrentUser(authenticatedUser);
  }, [authenticatedUser]);

  const [activePlant, setActivePlantState] = useState<PlantLocation | 'ALL'>(() => {
    if (authenticatedUser.assignedPlant && authenticatedUser.assignedPlant !== 'ALL') {
      return authenticatedUser.assignedPlant;
    }
    const s = localStorage.getItem('pk_active_plant');
    if (s === 'ALL' || s === 'Haridwar' || s === 'Vasai' || s === 'Vapi' || s === 'Mumbai') {
      return s as PlantLocation | 'ALL';
    }
    return authenticatedUser.role === 'SUPER_ADMIN' || authenticatedUser.role === 'DIRECTOR'
      ? 'ALL'
      : (authenticatedUser.plant || 'Haridwar');
  });

  useEffect(() => {
    if (authenticatedUser.assignedPlant && authenticatedUser.assignedPlant !== 'ALL') {
      setActivePlantState(authenticatedUser.assignedPlant);
    }
  }, [authenticatedUser.assignedPlant]);

  const setActivePlant = (plant: PlantLocation | 'ALL') => {
    if (!canSwitchPlant && authenticatedUser.assignedPlant && authenticatedUser.assignedPlant !== 'ALL') {
      return;
    }
    setActivePlantState(plant);
    try {
      localStorage.setItem('pk_active_plant', plant);
    } catch {
      // ignore
    }
  };

  const logoutUser = () => {
    clearLocalPortalCache();
    onLogout();
  };
  const [activeShift, setActiveShift] = useState<ShiftType>(() => {
    const s = localStorage.getItem('pk_active_shift');
    return (s as ShiftType) || 'General Day Shift (08:30 - 18:30)';
  });

  const [dayEndClosures, setDayEndClosures] = useState<PlantDayEndClosure[]>(() => {
    const s = localStorage.getItem('pk_day_end_closures');
    return s ? JSON.parse(s) : INITIAL_DAY_END_CLOSURES;
  });

  const [isPlantDayClosed, setIsPlantDayClosed] = useState<boolean>(() => {
    return false;
  });

  const [activeSubTab, setActiveSubTab] = useState<string | null>(null);

  const syncState = (key: string, value: unknown) => {
    localStorage.setItem(key, JSON.stringify(value));
    if (isCloudHydratedRef.current) {
      persistRemoteState(key, value, currentUser?.name);
    }
  };

  useEffect(() => {
    syncState('pk_day_end_closures', dayEndClosures);
  }, [dayEndClosures]);

  // Smart Cache Helper: Merges newly seeded records into existing localStorage state without overwriting user data
  function mergeByUniqueKey<T>(savedRaw: string | null, initial: T[], key: keyof T): T[] {
    if (!savedRaw) return initial;
    try {
      const saved = JSON.parse(savedRaw);
      if (!Array.isArray(saved)) return initial;
      const savedKeys = new Set(saved.map((item: any) => String(item[key])));
      const missingFromInitial = initial.filter((item: any) => !savedKeys.has(String(item[key])));
      if (missingFromInitial.length === 0) return saved;
      return [...missingFromInitial, ...saved];
    } catch (e) {
      return initial;
    }
  }

  // Operational State Collections with smart localStorage syncing
  
  const [plantHeadPriorities, setPlantHeadPriorities] = useState<PlantHeadPriorityAssignment[]>(() => {
    return mergeByUniqueKey(localStorage.getItem('pk_plant_head_priorities'), INITIAL_PLANT_HEAD_PRIORITIES, 'id');
  });

  useEffect(() => {
    syncState('pk_plant_head_priorities', plantHeadPriorities);
  }, [plantHeadPriorities]);

  const assignProductionPriority = (assignment: Omit<PlantHeadPriorityAssignment, 'id' | 'assignedAt' | 'status'>) => {
    const nextId = `PRIO-2026-${String(plantHeadPriorities.length + 1).padStart(3, '0')}`;
    const newRecord: PlantHeadPriorityAssignment = {
      ...assignment,
      id: nextId,
      assignedAt: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      status: 'Priority Assigned'
    };
    setPlantHeadPriorities(prev => [newRecord, ...prev.filter(p => !(p.grnNo === assignment.grnNo && p.partCode === assignment.partCode))]);
  };

  const updatePriorityStatus = (priorityId: string, status: PlantHeadPriorityAssignment['status'], linkedJobCardNo?: string) => {
    setPlantHeadPriorities(prev => prev.map(p => {
      if (p.id === priorityId || (linkedJobCardNo && p.linkedJobCardNo === linkedJobCardNo)) {
        return {
          ...p,
          status,
          linkedJobCardNo: linkedJobCardNo || p.linkedJobCardNo
        };
      }
      return p;
    }));
  };

  const [universalJobs, setUniversalJobs] = useState<UniversalJobRecord[]>(() => {
    return mergeByUniqueKey(localStorage.getItem('pk_universal_jobs'), INITIAL_UNIVERSAL_JOBS, 'jobId');
  });

  const [stockBatches, setStockBatches] = useState<StockBatch[]>(() => {
    return mergeByUniqueKey(localStorage.getItem('pk_stock_batches'), INITIAL_STOCK_BATCHES, 'batchId');
  });

  const [fifoOverrideLogs, setFifoOverrideLogs] = useState<FifoOverrideLog[]>(() => {
    return mergeByUniqueKey(localStorage.getItem('pk_fifo_override_logs'), INITIAL_FIFO_OVERRIDE_LOGS, 'id');
  });

  const [balanceReturnSlips, setBalanceReturnSlips] = useState<BalanceReturnSlip[]>(() => {
    return mergeByUniqueKey(localStorage.getItem('pk_balance_return_slips'), INITIAL_BALANCE_RETURN_SLIPS, 'rtnNo');
  });

  useEffect(() => {
    // Hydrate initial state from Supabase if available in cloud
    async function hydrateCloudState() {
      try {
        const remote = await fetchAllRemoteState();
        if (remote) {
          if (Array.isArray(remote.pk_universal_jobs)) setUniversalJobs(remote.pk_universal_jobs as UniversalJobRecord[]);
          if (Array.isArray(remote.pk_stock_batches)) setStockBatches(remote.pk_stock_batches as StockBatch[]);
          if (Array.isArray(remote.pk_fifo_override_logs)) setFifoOverrideLogs(remote.pk_fifo_override_logs as FifoOverrideLog[]);
          if (Array.isArray(remote.pk_balance_return_slips)) setBalanceReturnSlips(remote.pk_balance_return_slips as BalanceReturnSlip[]);
          if (remote.pk_plant_shift_config && typeof remote.pk_plant_shift_config === 'object') {
            setPlantShiftConfig(prev => ({ ...prev, ...(remote.pk_plant_shift_config as Partial<PlantShiftConfig>) }));
          }
          if (Array.isArray(remote.pk_grn_data)) setGrnList(remote.pk_grn_data as GoodsReceiptNote[]);
          if (Array.isArray(remote.pk_material_requisitions)) setMaterialRequisitions(remote.pk_material_requisitions as MaterialRequisitionNote[]);
          if (Array.isArray(remote.pk_iqc_data)) setIqcRecords(remote.pk_iqc_data as IQCInspectionRecord[]);
          let hydratedCards = jobCards;
          if (Array.isArray(remote.pk_jobcards_data)) {
            const seenNos = new Set<string>();
            hydratedCards = (remote.pk_jobcards_data as JobCard[]).filter(j => {
              if (isLegacyDemoJobCard(j) || !j.jobCardNo || seenNos.has(j.jobCardNo)) return false;
              seenNos.add(j.jobCardNo);
              return true;
            });
            setJobCards(hydratedCards);
          }
          if (Array.isArray(remote.pk_plant_head_priorities)) {
            setPlantHeadPriorities(sanitizePriorityLinks(remote.pk_plant_head_priorities as PlantHeadPriorityAssignment[], hydratedCards));
          }
          if (typeof remote.pk_jobcard_seq_counter === 'number' && !isNaN(remote.pk_jobcard_seq_counter)) {
            setJobCardSeqCounter(prev => {
              const merged = Math.max(prev, remote.pk_jobcard_seq_counter as number);
              localStorage.setItem('pk_jobcard_seq_counter', String(merged));
              return merged;
            });
          }
          let hydratedAsgs = painterAssignments;
          if (Array.isArray(remote.pk_painter_assignments)) {
            hydratedAsgs = filterValidAssignments(remote.pk_painter_assignments as PainterAssignment[], hydratedCards);
            setPainterAssignments(hydratedAsgs);
          }
          if (Array.isArray(remote.pk_assignment_material_logs)) {
            const cleanedLogs = filterValidMaterialLogs(remote.pk_assignment_material_logs as AssignmentMaterialLog[], hydratedAsgs);
            setAssignmentMaterialLogs(cleanedLogs);
          }
          if (Array.isArray(remote.pk_painters)) setPainters((remote.pk_painters as PainterProfile[]).map(p => ({ ...p, plant: (p.plant as PlantLocation) || 'Haridwar' })));
          if (Array.isArray(remote.pk_painting_booths)) setPaintingBooths((remote.pk_painting_booths as PaintingBooth[]).map(b => ({ ...b, plant: (b.plant as PlantLocation) || 'Haridwar' })));
          if (Array.isArray(remote.pk_pir_data)) setPreProductionReports(remote.pk_pir_data as PreProductionInspectionRecord[]);
          if (Array.isArray(remote.pk_fpa_data)) setFpaRecords(remote.pk_fpa_data as FPARecord[]);
          if (Array.isArray(remote.pk_pmx_data)) setPaintMixing(remote.pk_pmx_data as PaintMixingRecord[]);
          if (Array.isArray(remote.pk_ipqc_data)) setIpqcRecords(remote.pk_ipqc_data as IPQCRecord[]);
          if (Array.isArray(remote.pk_packing_data)) setPackingSlips(remote.pk_packing_data as PackingSlipRecord[]);
          if (Array.isArray(remote.pk_quality_releases)) setQualityReleases(remote.pk_quality_releases as FinalQualityRelease[]);
          if (Array.isArray(remote.pk_billing_invoices)) setBillingInvoices(remote.pk_billing_invoices as BillingInvoice[]);
          if (Array.isArray(remote.pk_gate_passes)) setGatePasses(remote.pk_gate_passes as GatePassRecord[]);
          if (Array.isArray(remote.pk_material_inward)) setMaterialInwardLogs(remote.pk_material_inward as MaterialInwardRecord[]);
          if (Array.isArray(remote.pk_material_outward)) setMaterialOutwardLogs(remote.pk_material_outward as MaterialOutwardRecord[]);
          if (Array.isArray(remote.pk_calibration_list)) setCalibrationList(remote.pk_calibration_list as CalibrationRecord[]);
          if (Array.isArray(remote.pk_audit_questions)) setAuditQuestions(remote.pk_audit_questions as AuditQuestionItem[]);
          if (Array.isArray(remote.pk_capa_8d)) setCapa8DList(remote.pk_capa_8d as Capa8DRecord[]);
          if (Array.isArray(remote.pk_4m_changes)) setFourMChanges(remote.pk_4m_changes as FourMChangeRecord[]);
          if (Array.isArray(remote.pk_prod_offerings)) setProductionOfferings(remote.pk_prod_offerings as ProductionOfferingReport[]);
          if (Array.isArray(remote.pk_hr_leaves)) setHrLeaves(remote.pk_hr_leaves as HRLeaveRecord[]);
          if (Array.isArray(remote.pk_day_end_closures)) setDayEndClosures(remote.pk_day_end_closures as PlantDayEndClosure[]);
        }
      } catch (e) {
        console.warn('Hydration error:', e);
      } finally {
        isCloudHydratedRef.current = true;
      }
    }
    hydrateCloudState();
  }, []);

  useEffect(() => {
    syncState('pk_stock_batches', stockBatches);
  }, [stockBatches]);

  useEffect(() => {
    syncState('pk_fifo_override_logs', fifoOverrideLogs);
  }, [fifoOverrideLogs]);

  useEffect(() => {
    syncState('pk_balance_return_slips', balanceReturnSlips);
  }, [balanceReturnSlips]);

  // Plant Shift & 20:45 Floor Return Cutoff Configuration (9 PM Factory Closing)
  const DEFAULT_PLANT_SHIFT_CONFIG: PlantShiftConfig = {
    shiftName: 'General Production Day Shift',
    startTime: '08:30',
    closingTime: '21:00', // 9:00 PM Factory Closing
    floorCutoffTime: '20:45', // 8:45 PM Floor Return Cutoff (15-min transit window)
    transitWindowMinutes: 15,
    autoReconcileEnabled: true,
  };

  const [plantShiftConfig, setPlantShiftConfig] = useState<PlantShiftConfig>(() => {
    try {
      const saved = localStorage.getItem('pk_plant_shift_config');
      if (saved) return { ...DEFAULT_PLANT_SHIFT_CONFIG, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return DEFAULT_PLANT_SHIFT_CONFIG;
  });

  useEffect(() => {
    syncState('pk_plant_shift_config', plantShiftConfig);
  }, [plantShiftConfig]);

  const updatePlantShiftConfig = (updates: Partial<PlantShiftConfig>) => {
    setPlantShiftConfig(prev => ({ ...prev, ...updates }));
  };

  const [grnList, setGrnList] = useState<GoodsReceiptNote[]>(() => {
    return mergeByUniqueKey(localStorage.getItem('pk_grn_data'), INITIAL_GRN_DATA, 'grnNo');
  });

  const [materialRequisitions, setMaterialRequisitions] = useState<MaterialRequisitionNote[]>(() => {
    return mergeByUniqueKey(localStorage.getItem('pk_material_requisitions'), INITIAL_REQUISITIONS, 'mrnNo');
  });

  const latestReqsRef = useRef<MaterialRequisitionNote[]>(materialRequisitions);
  latestReqsRef.current = materialRequisitions;
  const mrnSeqRef = useRef<number>(
    materialRequisitions.reduce((max, r) => {
      const m = (r.mrnNo || '').match(/MRN-\d{4}-(\d+)/i);
      const n = m ? parseInt(m[1], 10) : 0;
      return !isNaN(n) && n > max ? n : max;
    }, 0)
  );
  useEffect(() => {
    latestReqsRef.current = materialRequisitions;
    const peak = materialRequisitions.reduce((max, r) => {
      const m = (r.mrnNo || '').match(/MRN-\d{4}-(\d+)/i);
      const n = m ? parseInt(m[1], 10) : 0;
      return !isNaN(n) && n > max ? n : max;
    }, 0);
    if (peak > mrnSeqRef.current) mrnSeqRef.current = peak;
  }, [materialRequisitions]);

  useEffect(() => {
    syncState('pk_material_requisitions', materialRequisitions);
  }, [materialRequisitions]);

  // Store Role Upgrade: Batch-Wise Stock Management & Returns Engine
  const addStockBatch = (batch: StockBatch) => {
    setStockBatches(prev => [batch, ...prev]);
  };

  const updateStockBatch = (batchId: string, updates: Partial<StockBatch>) => {
    setStockBatches(prev => prev.map(b => b.batchId === batchId ? { ...b, ...updates } : b));
  };

  const issueMaterialRequisitionWithBatches = (params: {
    mrnNo: string;
    issuedSlipNo?: string;
    storeInchargeName: string;
    storeRemarks?: string;
    lineAllocations: Array<{
      requisitionLineId?: string;
      itemName: string;
      isDirectUnbatched?: boolean;
      batchLines: BatchIssueLine[];
    }>;
    fifoStatus?: 'FIFO OK' | 'FIFO Override';
    overrideReasonCode?: FifoOverrideReasonCode;
    overrideRemark?: string;
  }): { success: boolean; error?: string; minNo: string } => {
    const allIssueLines: BatchIssueLine[] = [];
    const batchedIssueLines: BatchIssueLine[] = [];
    const batchIdSet = new Set(stockBatches.map(b => b.batchId));

    params.lineAllocations.forEach(la => {
      la.batchLines.forEach(bl => {
        if (Number(bl.issuedQty) > 0) {
          allIssueLines.push(bl);
          if (!la.isDirectUnbatched && batchIdSet.has(bl.batchId)) {
            batchedIssueLines.push(bl);
          }
        }
      });
    });

    if (allIssueLines.length === 0) {
      return { success: false, error: 'At least one item must have an issue quantity greater than zero.', minNo: '' };
    }

    // 1. Strict validation with pure engine for all real store batches
    if (batchedIssueLines.length > 0) {
      const validation = validateIssue(batchedIssueLines, stockBatches);
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(' | '), minNo: '' };
      }

      // 2. Atomically deduct balances from store stock batches
      const updatedBatches = applyIssueToBatches(batchedIssueLines, stockBatches);
      setStockBatches(updatedBatches);
    }

    const targetMrn = latestReqsRef.current.find(r => r.mrnNo === params.mrnNo);

    // 3. Generate unique MIN slip number
    const existingMinPeak = latestReqsRef.current.reduce((max, r) => {
      const m = (r.issuedSlipNo || r.minNo || '').match(/MIN-\d{4}-(\d+)/i);
      const n = m ? parseInt(m[1], 10) : 0;
      return !isNaN(n) && n > max ? n : max;
    }, 0);
    const minNo = params.issuedSlipNo || `MIN-${new Date().getFullYear()}-${String(Math.max(existingMinPeak, latestReqsRef.current.length) + 1).padStart(3, '0')}`;
    const timestamp = `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    // 4. Update MRN status & batch allocations
    setMaterialRequisitions(prev => prev.map(req => {
      if (req.mrnNo !== params.mrnNo) return req;

      const updatedReqLines = (req.requisitionLines || []).map(rLine => {
        const alloc = params.lineAllocations.find(la => la.requisitionLineId === rLine.id || la.itemName === rLine.itemName);
        if (!alloc) return rLine;
        const lineIssuedQty = alloc.batchLines.reduce((acc, bl) => acc + Number(bl.issuedQty || 0), 0);
        const linePendingQty = Math.max(0, rLine.requestedQty - lineIssuedQty);
        return {
          ...rLine,
          issuedQty: lineIssuedQty,
          issuedLines: alloc.batchLines,
          pendingQty: linePendingQty,
          status: (linePendingQty <= 0.001 ? 'Fully Issued' : 'Partially Issued') as 'Fully Issued' | 'Partially Issued'
        };
      });

      const partyIssuedTotal = updatedReqLines
        .filter(l => l.category === 'PARTY_MATERIAL')
        .reduce((acc, l) => acc + Number(l.issuedQty || 0), 0);
      const totalIssued = updatedReqLines.length > 0 && partyIssuedTotal > 0
        ? partyIssuedTotal
        : allIssueLines.reduce((acc, l) => acc + Number(l.issuedQty || 0), 0);
      const isPartial = updatedReqLines.length > 0
        ? updatedReqLines.some(l => (l.pendingQty || 0) > 0.001)
        : totalIssued < req.requestedQty;
      const pendingQty = Math.max(0, req.requestedQty - totalIssued);

      const grnSummary = Array.from(new Set(allIssueLines.map(l => l.grnNo).filter(Boolean))).join(', ');

      return {
        ...req,
        status: isPartial ? 'Partially Issued' : 'Dispatched by Store',
        issuedSlipNo: minNo,
        minNo,
        sourceGrnNo: grnSummary || req.sourceGrnNo,
        issuedQty: totalIssued,
        pendingQty,
        storeInchargeName: params.storeInchargeName,
        storeIssuedTimestamp: timestamp,
        storeRemarks: params.storeRemarks,
        fifoStatus: params.fifoStatus || 'FIFO OK',
        overrideReasonCode: params.overrideReasonCode,
        overrideRemark: params.overrideRemark,
        batchLines: allIssueLines,
        requisitionLines: updatedReqLines.length > 0 ? updatedReqLines : req.requisitionLines
      };
    }));

    // 4B. Sync Store -> Production Floor Transfer to Painter Assignments & Chemical Logs
    if (targetMrn) {
      const coveredAsgIds = new Set<string>(
        (targetMrn.painterDemands || []).map(pd => pd.assignmentId).filter(Boolean)
      );
      latestAssignmentsRef.current.forEach(a => {
        if (a.storeDemandMrnNo === params.mrnNo) coveredAsgIds.add(a.id);
      });

      const transferredLogs: AssignmentMaterialLog[] = [];
      const reqLines = targetMrn.requisitionLines || [];

      params.lineAllocations.forEach((alloc, allocIdx) => {
        const matchedReqLine = reqLines.find(rl => rl.id === alloc.requisitionLineId || rl.itemName === alloc.itemName);
        const isParty = matchedReqLine?.category === 'PARTY_MATERIAL' || (!matchedReqLine && !isChemicalConsumable(undefined, undefined, alloc.itemName));
        if (isParty) return;

        const lineIssuedQty = alloc.batchLines.reduce((sum, bl) => sum + Number(bl.issuedQty || 0), 0);
        if (lineIssuedQty <= 0) return;

        const batchSummary = alloc.batchLines
          .map(bl => bl.supplierBatchNo || bl.grnNo || 'STORE-MIN')
          .filter(Boolean)
          .join(', ') || minNo;

        // Match requesting painters on this MRN
        const matchingPainterDemands = (targetMrn.painterDemands || []).filter(pd =>
          pd.companyMaterials.some(cm =>
            cm.materialName.trim().toLowerCase() === alloc.itemName.trim().toLowerCase()
          )
        );

        if (matchingPainterDemands.length > 0) {
          const totalReqForMat = matchingPainterDemands.reduce((sum, pd) => {
            const pQty = pd.companyMaterials
              .filter(cm => cm.materialName.trim().toLowerCase() === alloc.itemName.trim().toLowerCase())
              .reduce((s, cm) => s + Number(cm.qty || 0), 0);
            return sum + pQty;
          }, 0);

          matchingPainterDemands.forEach((pd, pdIdx) => {
            const matchingCm = pd.companyMaterials.find(
              cm => cm.materialName.trim().toLowerCase() === alloc.itemName.trim().toLowerCase()
            );
            const painterReqQty = pd.companyMaterials
              .filter(cm => cm.materialName.trim().toLowerCase() === alloc.itemName.trim().toLowerCase())
              .reduce((s, cm) => s + Number(cm.qty || 0), 0);
            const ratio = totalReqForMat > 0 ? painterReqQty / totalReqForMat : 1 / matchingPainterDemands.length;
            const painterIssued = Number((lineIssuedQty * ratio).toFixed(2));
            const asgObj = latestAssignmentsRef.current.find(a => a.id === pd.assignmentId);

            transferredLogs.push({
              id: `MAT-LOG-${Date.now()}-${allocIdx}-${pdIdx}`,
              assignmentId: pd.assignmentId,
              masterJobCardNo: targetMrn.jobCardNo,
              masterJobCardId: targetMrn.jobCardNo,
              painterId: pd.painterId,
              painterName: pd.painterName,
              date: pd.assignmentDate || targetMrn.date,
              logDate: pd.assignmentDate || targetMrn.date,
              shift: asgObj?.shift || 'General Day Shift (08:30 - 18:30)',
              materialName: alloc.itemName,
              materialType: matchingCm?.materialType || 'Base Paint',
              batchNumber: batchSummary,
              issuedQty: painterIssued,
              goodReturnedQty: 0,
              floorWastageExpiredQty: 0,
              netConsumedQty: painterIssued,
              uom: (matchedReqLine?.uom as 'Litres' | 'Kg' | 'Pcs') || matchingCm?.uom || 'Litres',
              standardNormPerPiece: 0.04,
              transferStatus: 'Transferred to Floor',
              mrnNo: targetMrn.mrnNo,
              minNo,
              loggedAt: new Date().toISOString()
            });
          });
        } else if (coveredAsgIds.size > 0) {
          const firstAsgId = Array.from(coveredAsgIds)[0];
          const asgObj = latestAssignmentsRef.current.find(a => a.id === firstAsgId);
          if (asgObj) {
            transferredLogs.push({
              id: `MAT-LOG-${Date.now()}-${allocIdx}`,
              assignmentId: asgObj.id,
              masterJobCardNo: targetMrn.jobCardNo,
              masterJobCardId: targetMrn.jobCardNo,
              painterId: asgObj.painterId,
              painterName: asgObj.painterName,
              date: asgObj.assignmentDate,
              logDate: asgObj.assignmentDate,
              shift: asgObj.shift,
              materialName: alloc.itemName,
              materialType: 'Base Paint',
              batchNumber: batchSummary,
              issuedQty: lineIssuedQty,
              goodReturnedQty: 0,
              floorWastageExpiredQty: 0,
              netConsumedQty: lineIssuedQty,
              uom: (matchedReqLine?.uom as 'Litres' | 'Kg' | 'Pcs') || 'Litres',
              standardNormPerPiece: 0.04,
              transferStatus: 'Transferred to Floor',
              mrnNo: targetMrn.mrnNo,
              minNo,
              loggedAt: new Date().toISOString()
            });
          }
        }
      });

      if (transferredLogs.length > 0) {
        setAssignmentMaterialLogs(prev => [...transferredLogs, ...prev]);
      }

      if (coveredAsgIds.size > 0) {
        setPainterAssignments(prev => {
          const next = prev.map(a => {
            if (!coveredAsgIds.has(a.id)) return a;
            const myLogs = transferredLogs.filter(l => l.assignmentId === a.id);
            return {
              ...a,
              storeTransferStatus: 'Transferred to Floor' as const,
              storeMinNo: minNo,
              materialLogs: myLogs.length > 0 ? [...(a.materialLogs || []), ...myLogs] : a.materialLogs
            };
          });
          latestAssignmentsRef.current = next;
          return next;
        });
      }
    }

    // 5. Audit override if logged
    if (params.fifoStatus === 'FIFO Override' && params.overrideReasonCode) {
      const overrideLog: FifoOverrideLog = {
        id: `OVR-2026-${String(fifoOverrideLogs.length + 1).padStart(3, '0')}`,
        mrnNo: params.mrnNo,
        minNo,
        itemName: params.lineAllocations[0]?.itemName || 'Consumable Item',
        suggestedBatchId: 'FEFO/FIFO-SUGGESTION',
        issuedBatchId: allIssueLines[0]?.batchId || '',
        reasonCode: params.overrideReasonCode,
        remark: params.overrideRemark || 'Manual storekeeper override logged.',
        issuedBy: params.storeInchargeName,
        timestamp,
        plant: activePlant
      };
      setFifoOverrideLogs(prev => [overrideLog, ...prev]);
    }

    return { success: true, minNo };
  };

  const createBalanceReturnSlip = (slip: Omit<BalanceReturnSlip, 'rtnNo' | 'status'>): BalanceReturnSlip => {
    const rtnNo = `RTN-2026-${String(balanceReturnSlips.length + 1).padStart(3, '0')}`;
    const newSlip: BalanceReturnSlip = {
      ...slip,
      rtnNo,
      date: slip.date || new Date().toISOString().split('T')[0],
      time: slip.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      plant: slip.plant || activePlant,
      status: 'Pending Store Verification'
    };
    setBalanceReturnSlips(prev => [newSlip, ...prev]);

    // Update the Job Card's floor balances and returned counts
    if (slip.jobCardNo) {
      setJobCards(prev => prev.map(jc => {
        if (jc.jobCardNo !== slip.jobCardNo) return jc;
        const returnedPcs = slip.lines
          .filter(l => l.category === 'PARTY_MATERIAL' || l.uom === 'Pcs')
          .reduce((sum, l) => sum + Number(l.returnedQtyClaimed || 0), 0);

        // Also deduct returned floor balance from company consumables
        const updatedMaterials = (jc.issuedMaterials || []).map(m => {
          const matchedReturn = slip.lines.find(l => 
            l.itemName.toLowerCase().includes(m.itemDescription.toLowerCase()) || 
            m.itemDescription.toLowerCase().includes(l.itemName.toLowerCase()) || 
            (m.batchNo && l.batchId === m.batchNo)
          );
          if (matchedReturn && matchedReturn.returnedQtyClaimed > 0) {
            const currentFloorBal = m.floorBalanceQty !== undefined ? m.floorBalanceQty : m.qty;
            return {
              ...m,
              floorBalanceQty: Math.max(0, Number((currentFloorBal - matchedReturn.returnedQtyClaimed).toFixed(2))),
              remark: `${m.remark || ''} (Returned ${matchedReturn.returnedQtyClaimed} ${m.uom} on ${rtnNo})`.trim()
            };
          }
          return m;
        });

        const isNowFullyFinished = ((jc.goodQty || 0) + (jc.rejectQty || 0) + returnedPcs) >= (jc.targetQty || 0);

        return {
          ...jc,
          issuedMaterials: updatedMaterials,
          returnRejectionQty: (jc.returnRejectionQty || 0) + returnedPcs,
          status: isNowFullyFinished ? 'Completed' : jc.status
        };
      }));
    }

    return newSlip;
  };

  const acceptBalanceReturnSlip = (
    rtnNo: string,
    verifiedLinesOrReceivedBy?: Array<{
      lineId: string;
      storeCountedQty: number;
      condition: BalanceReturnCondition;
      remarks?: string;
    }> | string,
    receivedByStoreOrDecision?: string,
    supervisorDecision?: string
  ) => {
    setBalanceReturnSlips(prev => prev.map(slip => {
      if (slip.rtnNo !== rtnNo) return slip;

      let updatedLines = slip.lines;
      let receiver = currentUser?.name || 'Manoj Tiwari (Stores)';
      let decision = supervisorDecision;

      if (Array.isArray(verifiedLinesOrReceivedBy)) {
        updatedLines = slip.lines.map(line => {
          const v = verifiedLinesOrReceivedBy.find(vl => vl.lineId === line.id);
          if (!v) return line;
          const counted = Number(v.storeCountedQty);
          return {
            ...line,
            storeCountedQty: counted,
            condition: v.condition,
            variance: line.returnedQtyClaimed - counted,
            remarks: v.remarks || line.remarks
          };
        });
        if (typeof receivedByStoreOrDecision === 'string') {
          receiver = receivedByStoreOrDecision;
        }
      } else if (typeof verifiedLinesOrReceivedBy === 'string') {
        receiver = verifiedLinesOrReceivedBy;
        if (typeof receivedByStoreOrDecision === 'string') {
          decision = receivedByStoreOrDecision;
        }
        updatedLines = slip.lines.map(line => ({
          ...line,
          storeCountedQty: line.storeCountedQty > 0 ? line.storeCountedQty : line.returnedQtyClaimed,
          variance: 0
        }));
      }

      const updatedSlip: BalanceReturnSlip = {
        ...slip,
        lines: updatedLines,
        receivedByStore: receiver,
        status: 'Accepted',
        supervisorSignOff: decision ? {
          signedBy: currentUser?.name || receiver,
          timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          decision: decision
        } : slip.supervisorSignOff
      };

      setStockBatches(currBatches => applyReturn(updatedSlip, currBatches));
      return updatedSlip;
    }));
  };

  const flagBalanceReturnDiscrepancy = (
    rtnNo: string,
    discrepancyLines: Array<{
      lineId: string;
      storeCountedQty: number;
      condition: BalanceReturnCondition;
      remarks?: string;
    }>,
    remarks?: string
  ) => {
    setBalanceReturnSlips(prev => prev.map(slip => {
      if (slip.rtnNo !== rtnNo) return slip;

      const updatedLines = slip.lines.map(line => {
        const d = discrepancyLines.find(dl => dl.lineId === line.id);
        if (!d) return line;
        const counted = Number(d.storeCountedQty);
        return {
          ...line,
          storeCountedQty: counted,
          condition: d.condition,
          variance: line.returnedQtyClaimed - counted,
          remarks: d.remarks || line.remarks
        };
      });

      return {
        ...slip,
        lines: updatedLines,
        status: 'Discrepancy Flagged',
        remarks: remarks || slip.remarks
      };
    }));
  };

  const supervisorSignOffBalanceReturn = (
    rtnNo: string,
    supervisorName: string,
    decision: string,
    notes?: string
  ) => {
    setBalanceReturnSlips(prev => prev.map(slip => {
      if (slip.rtnNo !== rtnNo) return slip;
      const updatedSlip: BalanceReturnSlip = {
        ...slip,
        status: 'Closed with Supervisor Sign-off',
        supervisorSignOff: {
          signedBy: supervisorName,
          timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          decision,
          notes
        }
      };
      setStockBatches(currBatches => applyReturn(updatedSlip, currBatches));
      return updatedSlip;
    }));
  };

  // Store <-> Production Material Handshake Handlers
  const createMaterialRequisition = (req: Omit<MaterialRequisitionNote, 'mrnNo' | 'status' | 'date' | 'time'>) => {
    const mrnNo = `MRN-2026-${String(materialRequisitions.length + 1).padStart(3, '0')}`;
    const newReq: MaterialRequisitionNote = {
      ...req,
      mrnNo,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Pending Store Issue'
    };
    setMaterialRequisitions(prev => [newReq, ...prev]);
  };

  const issueMaterialRequisition = (
    mrnNo: string,
    issuedSlipNo: string,
    sourceGrnNo: string,
    issuedQty: number,
    storeInchargeName: string,
    storeRemarks?: string
  ) => {
    setMaterialRequisitions(prev => prev.map(req => {
      if (req.mrnNo !== mrnNo) return req;
      return {
        ...req,
        status: 'Dispatched by Store',
        issuedSlipNo,
        sourceGrnNo,
        issuedQty,
        storeInchargeName,
        storeIssuedTimestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        storeRemarks
      };
    }));
  };

  const acceptMaterialRequisition = (
    mrnNo: string,
    receivedQty: number,
    receivedBy: string,
    discrepancyReason?: MaterialRequisitionNote['discrepancyReason'],
    productionRemarks?: string
  ) => {
    setMaterialRequisitions(prev => prev.map(req => {
      if (req.mrnNo !== mrnNo) return req;
      const expected = req.issuedQty || req.requestedQty;
      const discrepancy = expected - receivedQty;
      const isDiscrepant = discrepancy !== 0;

      return {
        ...req,
        status: isDiscrepant ? 'Discrepancy Flagged' : 'Received by Production',
        receivedQty,
        receivedBy,
        receivedTimestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        discrepancyQty: isDiscrepant ? discrepancy : 0,
        discrepancyReason,
        productionRemarks
      };
    }));
  };

  useEffect(() => {
    syncState('pk_universal_jobs', universalJobs);
  }, [universalJobs]);

  const addUniversalJob = (job: UniversalJobRecord) => {
    setUniversalJobs(prev => [job, ...prev]);
  };

  const submitPreSprayIQC = (
    jobId: string,
    inspectedQty: number,
    approvedQty: number,
    rejectedQty: number,
    defectReason?: PreSprayIQCRecord['defectReason'],
    remarks?: string
  ) => {
    setUniversalJobs(prev => prev.map(job => {
      if (job.jobId !== jobId) return job;
      return {
        ...job,
        currentStage: '4. Shop Floor Spraying',
        isPreSprayIqcApproved: true,
        preSprayIQC: {
          inspectedQty,
          approvedQty,
          rejectedQty,
          defectReason,
          inspector: currentUser.name || 'IQC Inspector',
          timestamp: new Date().toLocaleString(),
          status: 'Passed',
          remarks
        },
        pieceTracking: {
          ...job.pieceTracking,
          preSprayApproved: approvedQty,
          preSprayRejected: rejectedQty,
          sprayedGood: approvedQty
        }
      };
    }));
  };

  const submitFinalQA = (
    jobId: string,
    deltaE: number,
    adhesionTest: 'Pass (100% Tape)' | 'Fail (Flaking)',
    goodQty: number,
    rejectQty: number,
    remarks?: string
  ) => {
    const isPass = deltaE <= 0.70 && adhesionTest === 'Pass (100% Tape)';
    setUniversalJobs(prev => prev.map(job => {
      if (job.jobId !== jobId) return job;
      return {
        ...job,
        currentStage: isPass ? '6. Billing Invoice' : '5. Strict Final QA',
        isFinalQaApproved: isPass,
        finalQA: {
          spectrophotometerDeltaE: deltaE,
          adhesionTest,
          goodQty,
          rejectQty,
          qcEngineer: currentUser.name || 'QA Lead',
          timestamp: new Date().toLocaleString(),
          status: isPass ? 'Approved' : 'Rejected',
          remarks
        },
        pieceTracking: {
          ...job.pieceTracking,
          finalQaPassed: isPass ? goodQty : 0,
          finalQaRejected: rejectQty,
          billedQty: isPass ? goodQty : 0
        }
      };
    }));
  };

  const advanceJobStage = (jobId: string, nextStage: JobPipelineStage) => {
    setUniversalJobs(prev => prev.map(job => {
      if (job.jobId !== jobId) return job;
      return { ...job, currentStage: nextStage };
    }));
  };

  const [iqcRecords, setIqcRecords] = useState<IQCInspectionRecord[]>(() => {
    return mergeByUniqueKey(localStorage.getItem('pk_iqc_data'), INITIAL_IQC_RECORDS, 'reportNo');
  });

  const [jobCardSeqCounter, setJobCardSeqCounter] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem('pk_jobcard_seq_counter') || '0');
      return isNaN(saved) ? 0 : saved;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    syncState('pk_jobcard_seq_counter', jobCardSeqCounter);
  }, [jobCardSeqCounter]);

  const [jobCards, setJobCards] = useState<JobCard[]>(() => {
    const raw = mergeByUniqueKey(localStorage.getItem('pk_jobcards_data'), INITIAL_JOB_CARDS, 'jobCardNo');
    const seenNos = new Set<string>();
    return raw.filter(j => {
      if (isLegacyDemoJobCard(j) || !j.jobCardNo || seenNos.has(j.jobCardNo)) return false;
      seenNos.add(j.jobCardNo);
      return true;
    });
  });

  const [painterAssignments, setPainterAssignments] = useState<PainterAssignment[]>(() => {
    try {
      const s = localStorage.getItem('pk_painter_assignments');
      const parsed: PainterAssignment[] = s ? JSON.parse(s) : [];
      return filterValidAssignments(Array.isArray(parsed) ? parsed : [], jobCards);
    } catch {
      return [];
    }
  });

  const latestAssignmentsRef = useRef<PainterAssignment[]>(painterAssignments);
  latestAssignmentsRef.current = painterAssignments;
  const asgSeqRef = useRef<number>(
    painterAssignments.reduce((max, a) => {
      const m = (a.id || '').match(/ASG-\d{4}-(\d+)/i);
      const n = m ? parseInt(m[1], 10) : 0;
      return !isNaN(n) && n > max ? n : max;
    }, 0)
  );
  useEffect(() => {
    latestAssignmentsRef.current = painterAssignments;
    const peak = painterAssignments.reduce((max, a) => {
      const m = (a.id || '').match(/ASG-\d{4}-(\d+)/i);
      const n = m ? parseInt(m[1], 10) : 0;
      return !isNaN(n) && n > max ? n : max;
    }, 0);
    if (peak > asgSeqRef.current) asgSeqRef.current = peak;
  }, [painterAssignments]);

  const [assignmentMaterialLogs, setAssignmentMaterialLogs] = useState<AssignmentMaterialLog[]>(() => {
    try {
      const s = localStorage.getItem('pk_assignment_material_logs');
      const parsed: AssignmentMaterialLog[] = s ? JSON.parse(s) : [];
      return Array.isArray(parsed)
        ? filterValidMaterialLogs(parsed, painterAssignments)
        : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    syncState('pk_painter_assignments', painterAssignments);
  }, [painterAssignments]);

  useEffect(() => {
    syncState('pk_assignment_material_logs', assignmentMaterialLogs);
  }, [assignmentMaterialLogs]);

  const [painters, setPainters] = useState<PainterProfile[]>(() => {
    const raw = mergeByUniqueKey(localStorage.getItem('pk_painters'), INITIAL_PAINTERS, 'id');
    return raw.map(p => ({
      ...p,
      plant: (p.plant as PlantLocation) || 'Haridwar'
    }));
  });

  const [paintingBooths, setPaintingBooths] = useState<PaintingBooth[]>(() => {
    const raw = mergeByUniqueKey(localStorage.getItem('pk_painting_booths'), INITIAL_PAINTING_BOOTHS, 'id');
    return raw.map(b => ({
      ...b,
      plant: (b.plant as PlantLocation) || 'Haridwar'
    }));
  });

  useEffect(() => {
    syncState('pk_painting_booths', paintingBooths);
  }, [paintingBooths]);

  // Painting Lines & Spray Booth Fleet Handlers
  const addPaintingBooth = (boothData: Omit<PaintingBooth, 'id'>) => {
    const nextId = `LINE-${paintingBooths.length + 1}`;
    const fallbackPlant: PlantLocation = activePlant === 'ALL' ? 'Haridwar' : activePlant;
    const newBooth: PaintingBooth = {
      ...boothData,
      plant: boothData.plant || fallbackPlant,
      id: nextId
    };
    setPaintingBooths(prev => [...prev, newBooth]);
  };

  const updatePaintingBooth = (id: string, updates: Partial<PaintingBooth>) => {
    setPaintingBooths(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deletePaintingBooth = (id: string) => {
    if (paintingBooths.length <= 1) {
      alert('At least one painting line/booth must remain in the fleet.');
      return;
    }
    setPaintingBooths(prev => prev.filter(b => b.id !== id));
  };

  const toggleBoothStatus = (id: string) => {
    setPaintingBooths(prev => prev.map(b => {
      if (b.id === id) {
        const nextStatus = b.status === 'Active' ? 'Under Maintenance' : 'Active';
        return { ...b, status: nextStatus };
      }
      return b;
    }));
  };

  // Floor Painters Fleet CRUD Handlers
  const addPainter = (painterData: Omit<PainterProfile, 'id'>) => {
    const nextNum = painters.length + 1;
    const nextId = `ptr_${nextNum}_${Date.now()}`;
    const fallbackPlant: PlantLocation = activePlant === 'ALL' ? 'Haridwar' : activePlant;
    const newPainter: PainterProfile = {
      ...painterData,
      id: nextId,
      plant: (painterData.plant as PlantLocation) || fallbackPlant,
      avatar: painterData.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80`,
      code: painterData.code || `P${nextNum}`,
      status: painterData.status || 'Active',
      onTimeJobsCount: 0,
      delayedJobsCount: 0
    };
    setPainters(prev => [...prev, newPainter]);
  };

  const updatePainter = (id: string, updates: Partial<PainterProfile>) => {
    setPainters(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePainter = (id: string) => {
    if (painters.length <= 1) {
      alert('At least one painter must remain in the fleet.');
      return;
    }
    const target = painters.find(p => p.id === id);
    if (target) {
      const pName = target.name.toLowerCase().trim();
      const pCode = target.code?.toLowerCase().trim();
      const hasExistingJobs = jobCards.some(jc => {
        const assigned = (jc.assignedPainterName || (jc as any).painterName || '').toLowerCase().trim();
        const assignedId = (jc.assignedPainterId || '').toLowerCase().trim();
        return (
          assignedId === id.toLowerCase() ||
          (pCode && (assigned.includes(pCode) || assignedId === pCode)) ||
          assigned === pName ||
          assigned.includes(pName)
        );
      });

      if (hasExistingJobs) {
        alert(`Cannot delete "${target.name}": This technician has active or historical Job Cards in system records. In order to preserve manufacturing audit trails and quality history, this painter cannot be deleted. You can mark their status as "On Leave" instead.`);
        return;
      }
    }
    setPainters(prev => prev.filter(p => p.id !== id));
  };

  const togglePainterStatus = (id: string) => {
    setPainters(prev => prev.map(p => {
      if (p.id === id) {
        const nextStatus = p.status === 'Active' ? 'On Leave' : 'Active';
        return { ...p, status: nextStatus };
      }
      return p;
    }));
  };

  const [preProductionReports, setPreProductionReports] = useState<PreProductionInspectionRecord[]>(() => {
    return mergeByUniqueKey(localStorage.getItem('pk_pir_data'), INITIAL_PRE_PRODUCTION_REPORTS, 'reportNo');
  });

  const [fpaRecords, setFpaRecords] = useState<FPARecord[]>(() => {
    return mergeByUniqueKey(localStorage.getItem('pk_fpa_data'), INITIAL_FPA_RECORDS, 'reportNo');
  });

  const [paintMixing, setPaintMixing] = useState<PaintMixingRecord[]>(() => {
    return mergeByUniqueKey(localStorage.getItem('pk_pmx_data'), INITIAL_PAINT_MIXING, 'mixNo');
  });

  const [ipqcRecords, setIpqcRecords] = useState<IPQCRecord[]>(() => {
    return mergeByUniqueKey(localStorage.getItem('pk_ipqc_data'), INITIAL_IPQC_RECORDS, 'reportNo');
  });

  const [packingSlips, setPackingSlips] = useState<PackingSlipRecord[]>(() => {
    return mergeByUniqueKey(localStorage.getItem('pk_packing_data'), INITIAL_PACKING_SLIPS, 'slipNo');
  });

  const [qualityReleases, setQualityReleases] = useState<FinalQualityRelease[]>(() => {
    return mergeByUniqueKey(localStorage.getItem('pk_quality_releases'), INITIAL_QUALITY_RELEASES, 'releaseId');
  });

  const [billingInvoices, setBillingInvoices] = useState<BillingInvoice[]>(() => {
    return mergeByUniqueKey(localStorage.getItem('pk_billing_invoices'), INITIAL_BILLING_INVOICES, 'invoiceNo');
  });

  const [gatePasses, setGatePasses] = useState<GatePassRecord[]>(() => {
    return mergeByUniqueKey(localStorage.getItem('pk_gate_passes'), INITIAL_GATE_PASSES, 'gatePassNo');
  });

  const [materialInwardLogs, setMaterialInwardLogs] = useState<MaterialInwardRecord[]>(() => {
    return mergeByUniqueKey(localStorage.getItem('pk_material_inward'), INITIAL_MATERIAL_INWARD, 'srNo');
  });

  const [materialOutwardLogs, setMaterialOutwardLogs] = useState<MaterialOutwardRecord[]>(() => {
    return mergeByUniqueKey(localStorage.getItem('pk_material_outward'), INITIAL_MATERIAL_OUTWARD, 'gatePassNo');
  });

  const [defects, setDefects] = useState<DefectItem[]>(MASTER_DEFECTS);

  // Module E: 100-Question MNC Audit Engine State
  const [auditQuestions, setAuditQuestions] = useState<AuditQuestionItem[]>(() => {
    const s = localStorage.getItem('pk_audit_questions');
    return s ? JSON.parse(s) : INITIAL_MNC_AUDIT_QUESTIONS;
  });

  // Module E / J: 8D CAPA Records State
  const [capa8DList, setCapa8DList] = useState<Capa8DRecord[]>(() => {
    const s = localStorage.getItem('pk_capa_8d');
    return s ? JSON.parse(s) : INITIAL_CAPA_8D_RECORDS;
  });

  // Module E / J: 4M Change Control Register State
  const [fourMChanges, setFourMChanges] = useState<FourMChangeRecord[]>(() => {
    const s = localStorage.getItem('pk_4m_changes');
    return s ? JSON.parse(s) : INITIAL_4M_CHANGE_RECORDS;
  });

  // Module C: Production Offering Report State (PRD-OFF)
  const [productionOfferings, setProductionOfferings] = useState<ProductionOfferingReport[]>(() => {
    const s = localStorage.getItem('pk_prod_offerings');
    return s ? JSON.parse(s) : INITIAL_PRODUCTION_OFFERING_REPORTS;
  });

  // Module A: HR Leave Applications State (Format A.12)
  const [hrLeaves, setHrLeaves] = useState<HRLeaveRecord[]>(() => {
    try {
      const s = localStorage.getItem('pk_hr_leaves');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter((l): l is HRLeaveRecord => Boolean(l && l.id));
          if (valid.length > 0) return valid;
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_HR_LEAVE_RECORDS;
  });

  // Module K: Machine & Measuring Calibration Register State
  const [calibrationList, setCalibrationList] = useState<CalibrationRecord[]>(() => {
    const s = localStorage.getItem('pk_calibration_list');
    return s ? JSON.parse(s) : INITIAL_CALIBRATION_RECORDS;
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('pk_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('pk_active_plant', activePlant);
  }, [activePlant]);

  useEffect(() => {
    localStorage.setItem('pk_active_shift', activeShift);
  }, [activeShift]);

  useEffect(() => {
    syncState('pk_grn_data', grnList);
  }, [grnList]);

  useEffect(() => {
    syncState('pk_jobcards_data', jobCards);
  }, [jobCards]);

  useEffect(() => {
    syncState('pk_painters', painters);
  }, [painters]);

  useEffect(() => {
    syncState('pk_pir_data', preProductionReports);
  }, [preProductionReports]);

  useEffect(() => {
    syncState('pk_fpa_data', fpaRecords);
  }, [fpaRecords]);

  useEffect(() => {
    syncState('pk_pmx_data', paintMixing);
  }, [paintMixing]);

  useEffect(() => {
    syncState('pk_ipqc_data', ipqcRecords);
  }, [ipqcRecords]);

  useEffect(() => {
    syncState('pk_iqc_data', iqcRecords);
  }, [iqcRecords]);

  useEffect(() => {
    syncState('pk_packing_data', packingSlips);
  }, [packingSlips]);

  useEffect(() => {
    syncState('pk_quality_releases', qualityReleases);
  }, [qualityReleases]);

  useEffect(() => {
    syncState('pk_billing_invoices', billingInvoices);
  }, [billingInvoices]);

  useEffect(() => {
    syncState('pk_gate_passes', gatePasses);
  }, [gatePasses]);

  useEffect(() => {
    syncState('pk_material_inward', materialInwardLogs);
  }, [materialInwardLogs]);

  useEffect(() => {
    syncState('pk_calibration_list', calibrationList);
  }, [calibrationList]);

  useEffect(() => {
    syncState('pk_material_outward', materialOutwardLogs);
  }, [materialOutwardLogs]);

  useEffect(() => {
    syncState('pk_audit_questions', auditQuestions);
  }, [auditQuestions]);

  useEffect(() => {
    syncState('pk_capa_8d', capa8DList);
  }, [capa8DList]);

  useEffect(() => {
    syncState('pk_4m_changes', fourMChanges);
  }, [fourMChanges]);

  useEffect(() => {
    syncState('pk_prod_offerings', productionOfferings);
  }, [productionOfferings]);

  useEffect(() => {
    syncState('pk_hr_leaves', hrLeaves);
  }, [hrLeaves]);

  // 20:45 Cutoff Automated Floor Reconciliation Engine (15m before 21:00 Factory Closing)
  const executePlantClosingReconciliation = (overrideDate?: string): {
    reconciledCount: number;
    generatedSlips: BalanceReturnSlip[];
  } => {
    const todayStr = overrideDate || new Date().toISOString().split('T')[0];
    const generatedSlips: BalanceReturnSlip[] = [];

    // Filter active / in-progress job cards
    const activeJobs = jobCards.filter(jc => 
      jc.status !== 'Closed' && 
      jc.status !== 'Completed' &&
      (!activePlant || !jc.plant || jc.plant.toLowerCase() === activePlant.toLowerCase())
    );

    activeJobs.forEach((jc) => {
      // 1. Determine issued substrate pieces to floor for today's shift (Daily Target Quota)
      const linkedMrn = materialRequisitions.find(m => m.jobCardNo === jc.jobCardNo);
      
      let shiftTargetPieces = Number(jc.dailyIssuedQty || jc.dailyTargetQty || 0);
      let linkedBatchId = '';
      let linkedGrn = jc.sourceGrnNo || '';
      let partDesc = jc.partDescription || `${jc.partCode || 'Part'} Substrates`;

      if (linkedMrn && linkedMrn.requisitionLines && linkedMrn.requisitionLines.length > 0) {
        const substrateLine = linkedMrn.requisitionLines.find(l => 
          l.category === 'PARTY_MATERIAL' || 
          l.materialType === 'substrate' ||
          l.itemName.toLowerCase().includes('substrate') ||
          (l.uom && l.uom.toLowerCase() === 'pcs')
        ) || linkedMrn.requisitionLines[0];

        if (substrateLine) {
          if (!shiftTargetPieces) {
            shiftTargetPieces = Number(substrateLine.issuedQty || substrateLine.requestedQty || 0);
          }
          partDesc = substrateLine.itemName;
          if (substrateLine.issuedLines && substrateLine.issuedLines.length > 0) {
            linkedBatchId = substrateLine.issuedLines[0].batchId || '';
            linkedGrn = substrateLine.issuedLines[0].grnNo || linkedGrn;
          }
        }
      }

      if (shiftTargetPieces === 0) {
        if (jc.issuedMaterials && jc.issuedMaterials.length > 0) {
          const subMat = jc.issuedMaterials.find(m => m.materialType === 'substrate' || m.uom === 'Pcs') || jc.issuedMaterials[0];
          shiftTargetPieces = Number(subMat.qty || 0);
          linkedBatchId = subMat.batchNo || linkedBatchId;
          linkedGrn = subMat.grnNo || linkedGrn;
        } else {
          shiftTargetPieces = Number(jc.targetQty || 0);
        }
      }

      // 2. Determine processed / sprayed pieces in today's shift
      const priorGood = (jc.dailyProductionHistory || []).reduce((acc, h) => acc + (h.goodPieces || 0), 0);
      const todaySprayed = Math.min(
        shiftTargetPieces,
        Math.max(0, Number(jc.sprayedQty || ((jc.goodQty || 0) + (jc.rejectQty || 0)) || 0) - priorGood)
      );

      // 3. Compute unconsumed floor balance for today's shift
      const unconsumedBalance = Math.max(0, shiftTargetPieces - todaySprayed);

      if (unconsumedBalance > 0) {
        // Prevent duplicate return slip for this Job Card today
        const alreadyExists = balanceReturnSlips.some(s => 
          s.jobCardNo === jc.jobCardNo &&
          s.date === todayStr &&
          (s.status === 'Pending Store Verification' || s.generationType === 'PLANT_CLOSING_AUTO')
        );

        if (!alreadyExists) {
          const slipIndex = balanceReturnSlips.length + generatedSlips.length + 1;
          const rtnNo = `RTN-2026-${String(slipIndex).padStart(3, '0')}`;
          
          const newSlip: BalanceReturnSlip = {
            rtnNo,
            date: todayStr,
            time: '08:45 PM',
            plant: (jc.plant as PlantLocation) || activePlant || 'Haridwar',
            jobCardNo: jc.jobCardNo,
            mrnNo: linkedMrn?.mrnNo || 'MRN-AUTO',
            minNo: linkedMrn?.minNo || linkedMrn?.issuedSlipNo || 'MIN-FLOOR',
            returnedBy: 'Floor Supervisor (20:45 Cutoff - 15m to 21:00 Close)',
            receivedByStore: 'Manoj Tiwari (Store Incharge)',
            status: 'Pending Store Verification',
            isAutoGenerated: true,
            generationType: 'PLANT_CLOSING_AUTO',
            floorCutoffTime: '20:45',
            transitWindowMinutes: 15,
            lines: [
              {
                id: `rtn_line_${Date.now()}_${slipIndex}`,
                itemName: partDesc,
                batchId: linkedBatchId || `LOT-${jc.partCode || 'SUB'}-${jc.jobCardNo}`,
                grnNo: linkedGrn || 'PK-GRN-RETURN',
                supplierBatchNo: linkedBatchId || `LOT-${jc.partCode || 'SUB'}`,
                category: 'PARTY_MATERIAL',
                materialType: 'substrate',
                issuedQty: shiftTargetPieces,
                processedQty: todaySprayed,
                returnedQtyClaimed: unconsumedBalance,
                storeCountedQty: unconsumedBalance,
                uom: 'Pcs',
                condition: 'Unopened / Intact',
                variance: 0,
                remarks: `20:45 Cutoff: Shift Target ${shiftTargetPieces} Pcs - Sprayed ${todaySprayed} Pcs = ${unconsumedBalance} Pcs unconsumed floor return.`
              }
            ],
            remarks: `Factory closes at 21:00 (9 PM). System auto-generated at 20:45 floor cutoff with 15-minute window for physical transit down to stores.`
          };

          generatedSlips.push(newSlip);
        }
      }

      // Record daily production history entry if not already logged today
      const alreadyHasDailyLog = (jc.dailyProductionHistory || []).some(h => h.date === todayStr);
      if (!alreadyHasDailyLog) {
        const achievement = shiftTargetPieces > 0 ? Math.min(100, Math.round((todaySprayed / shiftTargetPieces) * 100)) : 100;
        const dailyRecord: JobCardDailyTargetRecord = {
          date: todayStr,
          shiftName: activeShift,
          dailyTarget: jc.dailyTargetQty || shiftTargetPieces,
          issuedPieces: shiftTargetPieces,
          goodPieces: todaySprayed,
          scrapPieces: Math.max(0, jc.rejectQty || 0),
          returnedPieces: unconsumedBalance,
          achievementPercent: achievement,
          isClosed: true,
          reconciledAt: '20:45',
          notes: `EOD Reconciled: ${todaySprayed}/${shiftTargetPieces} finished (${achievement}%), ${unconsumedBalance} returned to store.`
        };

        setJobCards(prev => prev.map(item => {
          if (item.jobCardNo !== jc.jobCardNo) return item;
          return {
            ...item,
            dailyProductionHistory: [dailyRecord, ...(item.dailyProductionHistory || [])]
          };
        }));
      }
    });

    if (generatedSlips.length > 0) {
      setBalanceReturnSlips(prev => [...generatedSlips, ...prev]);
      setPlantShiftConfig(prev => ({ ...prev, lastReconciledDate: todayStr }));
    }

    return {
      reconciledCount: generatedSlips.length,
      generatedSlips
    };
  };

  // Request Next Day / Shift Quota from Store (Multi-Day Job Card Workflow)
  const requestNextDayTarget = (params: {
    jobCardNo: string;
    nextDayTarget: number;
    requestedBy?: string;
  }): { success: boolean; error?: string; mrnNo?: string } => {
    const jc = jobCards.find(j => j.jobCardNo === params.jobCardNo);
    if (!jc) return { success: false, error: 'Job Card not found' };

    const remainingToProduce = Math.max(0, jc.targetQty - (jc.goodQty || 0));
    if (remainingToProduce <= 0) {
      return { success: false, error: 'Job Card total target is already completed!' };
    }

    const targetToAssign = Math.min(params.nextDayTarget, remainingToProduce);
    if (targetToAssign <= 0) {
      return { success: false, error: 'Target quantity must be greater than 0' };
    }

    // 1. Calculate chemical consumables strictly scaled for this target
    const estPaintLitres = Math.max(1, Math.ceil((targetToAssign / 500) * 8));
    const chemicals = [
      {
        id: `rl_chem_paint_${Date.now()}`,
        itemCode: 'PAINT-2K',
        itemName: `${jc.color} 2K PU Basecoat Paint`,
        category: 'COMPANY_CONSUMABLE' as StockCategory,
        materialType: 'paint' as StockMaterialType,
        requestedQty: estPaintLitres,
        uom: 'Litres',
        colour: jc.color,
        status: 'Pending' as const
      },
      {
        id: `rl_chem_thinner_${Date.now()}`,
        itemCode: 'THINNER-400',
        itemName: 'PU Thinner 400 Solvent',
        category: 'COMPANY_CONSUMABLE' as StockCategory,
        materialType: 'thinner' as StockMaterialType,
        requestedQty: Math.max(1, Math.ceil(estPaintLitres * 0.4)),
        uom: 'Litres',
        colour: 'Clear',
        status: 'Pending' as const
      },
      {
        id: `rl_chem_hardener_${Date.now()}`,
        itemCode: 'HARDENER-2K',
        itemName: '2K Scratch-Resistant Hardener',
        category: 'COMPANY_CONSUMABLE' as StockCategory,
        materialType: 'paint' as StockMaterialType,
        requestedQty: Math.max(1, Math.ceil(estPaintLitres * 0.25)),
        uom: 'Litres',
        colour: 'Clear',
        status: 'Pending' as const
      },
      {
        id: `rl_chem_clear_${Date.now()}`,
        itemCode: 'CLEAR-COAT',
        itemName: '2K Clear Lacquer Topcoat',
        category: 'COMPANY_CONSUMABLE' as StockCategory,
        materialType: 'paint' as StockMaterialType,
        requestedQty: Math.max(1, Math.ceil(targetToAssign / 200)),
        uom: 'Litres',
        colour: 'Clear Gloss',
        status: 'Pending' as const
      }
    ];

    const reqLines: RequisitionLineItem[] = [
      {
        id: `rl_sub_${Date.now()}`,
        itemCode: jc.partCode || 'SUBSTRATE',
        itemName: jc.partDescription || 'Component Substrate',
        category: 'PARTY_MATERIAL',
        materialType: 'substrate',
        requestedQty: targetToAssign,
        uom: 'Pcs',
        customer: jc.customer,
        partCode: jc.partCode,
        colour: jc.color,
        status: 'Pending'
      },
      ...chemicals
    ];

    const mrnNo = `MRN-2026-${String(materialRequisitions.length + 1).padStart(3, '0')}`;
    const newMrn: MaterialRequisitionNote = {
      mrnNo,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      plant: (jc.plant as PlantLocation) || activePlant || 'Haridwar',
      jobCardNo: jc.jobCardNo,
      woNo: jc.woNo || 'WO-AUTO',
      customer: jc.customer,
      partCode: jc.partCode,
      partDescription: jc.partDescription,
      colorName: jc.color,
      requestedQty: targetToAssign,
      uom: 'Pcs',
      requiredShift: activeShift,
      requestedBy: params.requestedBy || currentUser.name || 'Production Supervisor',
      urgency: 'High (Line Stoppage Risk)',
      status: 'Pending Store Issue',
      requisitionLines: reqLines,
      productionRemarks: `Next Shift Production Quota for Painter [${jc.assignedPainterName || jc.painterName}]. Demanded: ${targetToAssign} Pcs (Total Order: ${jc.targetQty} Pcs, Completed: ${jc.goodQty || 0} Pcs).`
    };

    setMaterialRequisitions(prev => [newMrn, ...prev]);

    // Update job card daily target and status
    setJobCards(prev => prev.map(j => {
      if (j.jobCardNo !== params.jobCardNo) return j;
      return {
        ...j,
        dailyTargetQty: targetToAssign,
        dailyIssuedQty: targetToAssign,
        status: 'In Process'
      };
    }));

    return { success: true, mrnNo };
  };

  // Automated background check for 20:45 cutoff
  useEffect(() => {
    if (!plantShiftConfig.autoReconcileEnabled) return;
    const interval = setInterval(() => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${hours}:${minutes}`;
      const today = now.toISOString().split('T')[0];

      if (currentTime >= plantShiftConfig.floorCutoffTime && plantShiftConfig.lastReconciledDate !== today) {
        executePlantClosingReconciliation();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [plantShiftConfig, jobCards, balanceReturnSlips]);

  useEffect(() => {
    localStorage.setItem('pk_calibration_list', JSON.stringify(calibrationList));
  }, [calibrationList]);

  const addMaterialInwardRecord = (record: MaterialInwardRecord) => {
    const fallbackPlant: PlantLocation = activePlant === 'ALL' ? 'Haridwar' : activePlant;
    const recordWithDefaults: MaterialInwardRecord = {
      ...record,
      plant: record.plant || fallbackPlant,
      iqcStatus: record.iqcStatus || 'Pending',
      status: record.status || 'Pending IQC Inspection'
    };
    setMaterialInwardLogs(prev => [recordWithDefaults, ...prev]);
  };


  const addMaterialOutwardRecord = (record: MaterialOutwardRecord) => {
    const fallbackPlant: PlantLocation = activePlant === 'ALL' ? 'Haridwar' : activePlant;
    const recordWithDefaults: MaterialOutwardRecord = {
      ...record,
      plant: record.plant || fallbackPlant,
    };
    setMaterialOutwardLogs(prev => [recordWithDefaults, ...prev]);

    // Update Gate Pass status to Security Out
    const matchingGp = gatePasses.find(gp => gp.gatePassNo === record.gatePassNo || gp.vehicleNo === record.vehicleNo);
    if (matchingGp) {
      setGatePasses(prev => prev.map(gp => gp.gatePassNo === matchingGp.gatePassNo ? { ...gp, status: 'Closed' } : gp));
    }
  };


  const switchUser = (_userId: string) => {
    // Role switching disabled: identity is strictly enforced by Supabase Auth + pk_portal_users
  };

  const getAllKnownJobCardNos = (): string[] => [
    ...jobCards.map(j => j.jobCardNo),
    ...materialRequisitions.map(r => r.jobCardNo),
    ...painterAssignments.map(a => a.masterJobCardNo || a.masterJobCardId || ''),
    ...preProductionReports.map(p => p.jobCardNo),
    ...fpaRecords.map(f => f.jobCardNo),
    ...ipqcRecords.map(i => i.jobCardNo),
    ...qualityReleases.map(q => q.jobCardNo),
    ...packingSlips.map(s => s.jobCardNo),
    ...billingInvoices.map(b => b.jobCardNo)
  ].filter(Boolean);

  const getNextUniqueJobCardNo = (): string => {
    return getNextJobCardNo(jobCards, jobCardSeqCounter, getAllKnownJobCardNos());
  };

  const addJobCard = (jc: JobCard): JobCard => {
    const knownNos = getAllKnownJobCardNos();
    const usedSet = new Set(knownNos.map(n => n.trim().toLowerCase()));
    const peakExistingSeq = knownNos.reduce((m, n) => Math.max(m, extractJobCardSeq(n)), jobCardSeqCounter);
    const requestedNo = (jc.jobCardNo || '').trim();
    const requestedSeq = extractJobCardSeq(requestedNo);
    const isDuplicateOrStale =
      !requestedNo ||
      usedSet.has(requestedNo.toLowerCase()) ||
      (requestedSeq > 0 && requestedSeq <= peakExistingSeq);

    const resolvedJobCardNo = isDuplicateOrStale
      ? getNextJobCardNo(jobCards, peakExistingSeq, knownNos)
      : requestedNo;

    const finalSeq = Math.max(peakExistingSeq, extractJobCardSeq(resolvedJobCardNo));
    setJobCardSeqCounter(finalSeq);
    try {
      localStorage.setItem('pk_jobcard_seq_counter', String(finalSeq));
    } catch {
      // ignore storage errors
    }

    const fallbackPlant: PlantLocation = activePlant === 'ALL' ? 'Haridwar' : activePlant;
    const hasAssignedPainter = Boolean((jc.assignedPainterName || jc.painterName || '').trim());
    const formattedJc: JobCard = {
      ...jc,
      jobCardNo: resolvedJobCardNo,
      plant: jc.plant || fallbackPlant,
      painterJobStatus: hasAssignedPainter ? (jc.painterJobStatus || 'Assigned') : undefined,
      assignedPainterName: jc.assignedPainterName || jc.painterName || '',
      allocatedQty: hasAssignedPainter ? (jc.allocatedQty || jc.targetQty) : 0,
      dailyTargetQty: hasAssignedPainter ? (jc.dailyTargetQty || 0) : 0,
      fpaStatus: jc.fpaStatus || 'Approved',
      status: jc.status || 'Open'
    };

    setJobCards(prev => (prev.some(existing => existing.jobCardNo === formattedJc.jobCardNo) ? prev : [formattedJc, ...prev]));
    latestAssignmentsRef.current = latestAssignmentsRef.current.filter(
      a => a.masterJobCardNo !== formattedJc.jobCardNo && a.masterJobCardId !== formattedJc.jobCardNo
    );
    setPainterAssignments(prev =>
      prev.filter(a => a.masterJobCardNo !== formattedJc.jobCardNo && a.masterJobCardId !== formattedJc.jobCardNo)
    );
    setAssignmentMaterialLogs(prev =>
      prev.filter(l => l.masterJobCardNo !== formattedJc.jobCardNo && l.masterJobCardId !== formattedJc.jobCardNo)
    );

    // Auto-link Plant Head priority status strictly to matching GRN or Customer+Challan+Part
    setPlantHeadPriorities(prev => prev.map(p => {
      const sameGrn = Boolean(p.grnNo && formattedJc.sourceGrnNo && p.grnNo === formattedJc.sourceGrnNo);
      const sameCustAndPart =
        p.customer.toLowerCase().trim() === formattedJc.customer.toLowerCase().trim() &&
        p.partCode.toLowerCase().trim() === formattedJc.partCode.toLowerCase().trim() &&
        (!p.challanNo || !(formattedJc.woNo || formattedJc.wNo) || p.challanNo.toLowerCase().trim() === (formattedJc.woNo || formattedJc.wNo || '').toLowerCase().trim());
      const isMatch = sameGrn || sameCustAndPart;
      if (isMatch && p.status === 'Priority Assigned') {
        return {
          ...p,
          status: 'Job Card Launched',
          linkedJobCardNo: formattedJc.jobCardNo
        };
      }
      return p;
    }));

    // Floor Demands (MRN) are strictly raised when Painter(s) are assigned with daily Party + Company Material allocations.
    return formattedJc;
  };

  const updateJobCard = (jc: JobCard) => {
    setJobCards(prev => prev.map(existing => existing.jobCardNo === jc.jobCardNo ? { ...existing, ...jc } : existing));
  };

  const deleteJobCard = (jobCardNo: string) => {
    setJobCards(prev => {
      const next = prev.filter(existing => existing.jobCardNo !== jobCardNo);
      syncState('pk_jobcards_data', next);
      return next;
    });
    latestAssignmentsRef.current = latestAssignmentsRef.current.filter(
      a => a.masterJobCardNo !== jobCardNo && a.masterJobCardId !== jobCardNo
    );
    setPainterAssignments(prev =>
      prev.filter(a => a.masterJobCardNo !== jobCardNo && a.masterJobCardId !== jobCardNo)
    );
    setAssignmentMaterialLogs(prev =>
      prev.filter(l => l.masterJobCardNo !== jobCardNo && l.masterJobCardId !== jobCardNo)
    );
    latestReqsRef.current = latestReqsRef.current.filter(r => r.jobCardNo !== jobCardNo);
    setMaterialRequisitions(prev => prev.filter(r => r.jobCardNo !== jobCardNo));
    setPlantHeadPriorities(prev =>
      prev.map(p =>
        p.linkedJobCardNo === jobCardNo
          ? { ...p, status: 'Priority Assigned', linkedJobCardNo: undefined }
          : p
      )
    );
  };

  const addJobCardProgressLog = (jobCardNo: string, log: Omit<JobCardProductionProgressLog, 'id' | 'timestamp'>) => {
    const now = new Date();
    const defaultDate = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
    const defaultTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    const newLog: JobCardProductionProgressLog = {
      ...log,
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: now.toISOString(),
      timeLabel: log.timeLabel || defaultTime,
      dateLabel: log.dateLabel || defaultDate
    };

    setJobCards(prev => prev.map(jc => {
      if (jc.jobCardNo !== jobCardNo) return jc;

      const updatedLogs = [newLog, ...(jc.progressLogs || [])];
      
      const isStage1 = log.processStage === 'stage_1_primer';
      const isStage2 = log.processStage === 'stage_2_basecoat';
      const isStage3 = log.processStage === 'stage_3_topcoat' || !log.processStage;

      const primerCompleted = (jc.primerCompletedQty || 0) + (isStage1 ? log.piecesCompleted : 0);
      const primerReject = (jc.primerRejectQty || 0) + (isStage1 ? (log.reworkPieces || 0) : 0);
      const basecoatCompleted = (jc.basecoatCompletedQty || 0) + (isStage2 ? log.piecesCompleted : 0);
      const basecoatReject = (jc.basecoatRejectQty || 0) + (isStage2 ? (log.reworkPieces || 0) : 0);
      const topcoatCompleted = (jc.topcoatCompletedQty || 0) + (isStage3 ? log.piecesCompleted : 0);
      const topcoatReject = (jc.topcoatRejectQty || 0) + (isStage3 ? (log.reworkPieces || 0) : 0);

      const newSprayed = (jc.sprayedQty || 0) + (isStage3 ? log.piecesCompleted : 0);
      const netGood = log.goodPieces !== undefined ? log.goodPieces : (log.piecesCompleted - (log.reworkPieces || 0) - (log.scrapPieces || 0));
      const newGood = isStage3 ? Math.max(0, (jc.goodQty || 0) + Math.max(0, netGood)) : (jc.goodQty || 0);
      const newRework = (jc.reworkQty || 0) + (log.reworkPieces || 0);
      const newReject = (jc.rejectQty || 0) + (log.scrapPieces || 0);
      const remaining = Math.max(0, (jc.targetQty || 0) - newGood - newReject);
      
      let nextStatus = jc.status;
      if (newGood >= jc.targetQty) {
        nextStatus = 'Target Met';
      } else if (newGood > 0 && nextStatus === 'Open') {
        nextStatus = 'In Process';
      }

      return {
        ...jc,
        sprayedQty: newSprayed,
        goodQty: newGood,
        reworkQty: newRework,
        rejectQty: newReject,
        remainingQty: remaining,
        primerCompletedQty: primerCompleted,
        primerRejectQty: primerReject,
        basecoatCompletedQty: basecoatCompleted,
        basecoatRejectQty: basecoatReject,
        topcoatCompletedQty: topcoatCompleted,
        topcoatRejectQty: topcoatReject,
        status: nextStatus,
        progressLogs: updatedLogs
      };
    }));
  };

  const updateSamplingRecipe = (jobCardNo: string, recipe: Partial<SamplingRecipeSheet>) => {
    setJobCards(prev => prev.map(jc => {
      if (jc.jobCardNo !== jobCardNo) return jc;
      return {
        ...jc,
        samplingRecipe: {
          ...(jc.samplingRecipe || {
            basePaintBrand: 'Asian Paints PPG',
            basePaintCode: 'PU-BLK-99',
            hardenerCode: 'HARD-PU-20',
            thinnerCode: 'THN-FAST-01',
            mixingRatio: '4:1:1',
            viscositySec: 18,
            airPressureBar: 2.2,
            nozzleSizeMm: 1.3,
            numberOfCoats: '1 Primer + 2 Base + 1 Clear',
            flashOffMins: 10,
            bakingTempC: 65,
            bakingTimeMins: 30,
            achievedDeltaE: 0.38,
            achievedGloss60: 92,
            technicianPainter: jc.assignedPainterName || 'Ramesh Kumar',
            labChemist: 'Dr. S. Nair'
          }),
          ...recipe,
          loggedAt: new Date().toISOString()
        }
      };
    }));
  };

  const updateSamplingPartyStatus = (jobCardNo: string, status: SamplingPartyApproval['status'], feedback?: string) => {
    setJobCards(prev => prev.map(jc => {
      if (jc.jobCardNo !== jobCardNo) return jc;
      const prevApproval = jc.samplingApproval || { status: 'Pending In-House Trial' };
      return {
        ...jc,
        samplingApproval: {
          ...prevApproval,
          status,
          partyFeedback: feedback !== undefined ? feedback : prevApproval.partyFeedback,
          dispatchedAt: status === 'Sample Dispatched to Party' ? new Date().toISOString().split('T')[0] : prevApproval.dispatchedAt,
          approvedAt: status === 'Party Approved' ? new Date().toISOString().split('T')[0] : prevApproval.approvedAt
        }
      };
    }));
  };

  const lockSamplingAsMasterRecipe = (jobCardNo: string) => {
    setJobCards(prev => prev.map(jc => {
      if (jc.jobCardNo !== jobCardNo) return jc;
      if (!jc.samplingRecipe) return jc;
      return {
        ...jc,
        samplingRecipe: {
          ...jc.samplingRecipe,
          isLockedAsMasterRecipe: true
        },
        samplingApproval: {
          ...(jc.samplingApproval || { status: 'Party Approved' }),
          status: 'Party Approved',
          approvedAt: new Date().toISOString().split('T')[0]
        }
      };
    }));
  };

  const createMultiPainterJobCards = (
    parentData: JobCard, 
    splits: { painterId: string; painterName: string; boothNo: string; targetQty: number }[]
  ) => {
    const masterCard: JobCard = {
      ...parentData,
      jobCardType: 'master',
      status: 'Open',
      allocatedQty: parentData.targetQty,
      sprayedQty: 0,
      goodQty: 0,
      rejectQty: 0
    };

    const childCards: JobCard[] = splits.map((split, idx) => ({
      ...parentData,
      jobCardNo: `${parentData.jobCardNo}-P${idx + 1}`,
      jobCardType: 'painter_child',
      parentJobCardId: parentData.jobCardNo,
      targetQty: split.targetQty,
      allocatedQty: split.targetQty,
      assignedPainterId: split.painterId,
      assignedPainterName: split.painterName,
      painterName: split.painterName,
      sprayedQty: 0,
      goodQty: 0,
      rejectQty: 0,
      status: 'Open',
      painterJobStatus: 'Assigned',
      progressLogs: []
    }));

    setJobCards(prev => [masterCard, ...childCards, ...prev]);

    setPlantHeadPriorities(prev => prev.map(p => {
      const isMatch = (p.grnNo && parentData.issuedMaterials?.some(m => m.remark?.includes(p.grnNo))) ||
                      (p.customer.toLowerCase().trim() === parentData.customer.toLowerCase().trim() && p.partCode.toLowerCase().trim() === parentData.partCode.toLowerCase().trim());
      if (isMatch && p.status === 'Priority Assigned') {
        return {
          ...p,
          status: 'Job Card Launched',
          linkedJobCardNo: parentData.jobCardNo
        };
      }
      return p;
    }));

    const autoMrn: MaterialRequisitionNote = {
      mrnNo: `MRN-2026-${String(materialRequisitions.length + 1).padStart(3, '0')}`,
      date: parentData.issueDate || new Date().toISOString().split('T')[0],
      time: parentData.issueTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      partDescription: parentData.partDescription || 'Component Substrate',
      requestedQty: parentData.targetQty || 0,
      uom: parentData.issuedMaterials?.[0]?.uom || 'Pcs',
      requiredShift: activeShift || 'General Day Shift (08:30 - 18:30)',
      urgency: parentData.targetQty > 500 ? 'High (Line Stoppage Risk)' : 'Normal',
      jobCardNo: parentData.jobCardNo,
      woNo: parentData.woNo,
      customer: parentData.customer,
      partCode: parentData.partCode,
      requestedItems: parentData.issuedMaterials?.map(m => ({
        itemCode: m.itemDescription.substring(0, 10).toUpperCase(),
        itemDescription: m.itemDescription,
        requiredQty: m.qty,
        uom: m.uom,
        issuedQty: 0,
        pendingQty: m.qty,
        batchLotNo: `LOT-${Date.now().toString().slice(-4)}`
      })) || [],
      requestedBy: currentUser.name,
      requestedAt: `${parentData.issueDate} ${parentData.issueTime}`,
      status: 'DEMAND_RAISED_TO_STORE',
      priority: parentData.targetQty > 500 ? 'URGENT' : 'HIGH',
      plant: activePlant
    };
    setMaterialRequisitions(prev => [autoMrn, ...prev]);
  };

  const addGRN = (grn: GoodsReceiptNote) => {
    if (!grn || !grn.grnNo) return;
    setGrnList(prev => [grn, ...prev]);

    // Auto-create StockBatch records from GRN lines (Store Role Stock Inward)
    const newStockBatches: StockBatch[] = [];
    if (grn.items && grn.items.length > 0) {
      grn.items.forEach((item, idx) => {
        const isChemical = isChemicalConsumable(item.materialType, item.category, item.partDescription);
        const isParty = item.category === 'PARTY_MATERIAL' || (
          !isChemical && 
          grn.supplierCustomer && 
          !grn.supplierCustomer.toLowerCase().includes('asian') && 
          !grn.supplierCustomer.toLowerCase().includes('ppg') && 
          !grn.supplierCustomer.toLowerCase().includes('berger')
        );

        const category: StockCategory = item.category || (isParty ? 'PARTY_MATERIAL' : 'COMPANY_CONSUMABLE');
        const materialType: StockMaterialType = item.materialType || (isChemical ? 'paint' : 'substrate');

        newStockBatches.push({
          batchId: `SB-${grn.grnNo}-${item.partCode || idx + 1}`,
          itemCode: item.partCode || 'ITEM-01',
          itemName: item.partDescription,
          category,
          materialType,
          supplierBatchNo: item.supplierBatchNo || grn.batchNo || `LOT-${grn.grnNo.slice(-4)}`,
          grnNo: grn.grnNo,
          plant: grn.plant,
          customer: grn.supplierCustomer,
          partCode: item.partCode,
          receivedDate: grn.receivedDate || grn.date,
          mfgDate: item.mfgDate || grn.mfgDate,
          expiryDate: item.expiryDate || grn.expiryDate,
          uom: item.uom || (item.partDescription?.toLowerCase().includes('paint') || item.partDescription?.toLowerCase().includes('litre') ? 'Litres' : 'Pcs'),
          receivedQty: Number(item.actualReceivedQty || item.invoicedQty || 0),
          balanceQty: Number(item.actualReceivedQty || item.invoicedQty || 0),
          status: 'Available',
          storageLocation: 'Stores Intake Bay'
        });
      });
    } else {
      const isChemical = isChemicalConsumable(undefined, undefined, grn.description);
      const isParty = !isChemical && grn.supplierCustomer && !grn.supplierCustomer.toLowerCase().includes('asian') && !grn.supplierCustomer.toLowerCase().includes('ppg');

      newStockBatches.push({
        batchId: `SB-${grn.grnNo}-MAIN`,
        itemCode: grn.partCode || 'ITEM-01',
        itemName: grn.description || 'Inward Material Lot',
        category: isParty ? 'PARTY_MATERIAL' : 'COMPANY_CONSUMABLE',
        materialType: isChemical ? 'paint' : 'substrate',
        supplierBatchNo: grn.batchNo || `LOT-${grn.grnNo.slice(-4)}`,
        grnNo: grn.grnNo,
        plant: grn.plant,
        customer: grn.supplierCustomer,
        partCode: grn.partCode,
        receivedDate: grn.receivedDate || grn.date,
        mfgDate: grn.mfgDate,
        expiryDate: grn.expiryDate,
        uom: (grn as any).uom || (isChemical ? 'Litres' : 'Pcs'),
        receivedQty: Number(grn.actualReceivedQty || grn.invoicedQty || 0),
        balanceQty: Number(grn.actualReceivedQty || grn.invoicedQty || 0),
        status: 'Available',
        storageLocation: 'Stores Intake Bay'
      });
    }

    if (newStockBatches.length > 0) {
      setStockBatches(prev => [...newStockBatches, ...prev]);
    }

    // Update matching Material Inward Log so it is marked as GRN Created
    setMaterialInwardLogs(prev => prev.map(inw => {
      const isMatch = (grn.sourceIqcReportNo && inw.iqcReportNo === grn.sourceIqcReportNo) ||
                      (grn.invoiceChallanNo && inw.challanNo === grn.invoiceChallanNo) ||
                      (grn.supplierCustomer && inw.partyName === grn.supplierCustomer && inw.challanNo === grn.invoiceChallanNo);
      if (isMatch) {
        return {
          ...inw,
          grnNo: grn.grnNo,
          status: 'GRN Created - In Stores'
        };
      }
      return inw;
    }));

    // Also update matching IQC record if present
    setIqcRecords(prev => prev.map(rec => {
      const isMatch = (grn.sourceIqcReportNo && rec.reportNo === grn.sourceIqcReportNo) ||
                      (grn.invoiceChallanNo && rec.invoiceChallanNo === grn.invoiceChallanNo);
      if (isMatch) {
        return {
          ...rec,
          status: 'Accepted'
        };
      }
      return rec;
    }));
  };

  // PROBLEM 1: Job Cards & Target Caps
  const updateJobCardProgress = (
    jobCardNo: string,
    addedSprayedQty: number,
    addedRejectQty: number = 0,
    consumablesUsage?: { [key: string]: number }
  ) => {
    setJobCards(prev => prev.map(jc => {
      if (jc.jobCardNo !== jobCardNo) return jc;

      const newSprayed = Math.max(0, jc.sprayedQty + Number(addedSprayedQty || 0));
      const newReject = Math.max(0, jc.rejectQty + Number(addedRejectQty || 0));
      const newGood = Math.max(0, newSprayed - newReject);

      let newStatus: JobCard['status'] = jc.status;
      if (newSprayed > jc.targetQty) {
        newStatus = 'Over-Run Flagged';
      } else if (newSprayed === jc.targetQty) {
        newStatus = 'Target Met';
      } else if (newSprayed > 0) {
        newStatus = 'In Process';
      } else {
        newStatus = 'Open';
      }

      const netAddedGood = Math.max(0, Number(addedSprayedQty || 0) - Number(addedRejectQty || 0));

      // Synchronize both Party Material (Pcs) & Company Consumables (Litres)
      const existingMats = (jc.issuedMaterials && jc.issuedMaterials.length > 0)
        ? jc.issuedMaterials
        : [
            {
              id: 'mat_sub_gen',
              itemDescription: jc.partDescription || 'Component Substrate',
              qty: jc.dailyIssuedQty || jc.dailyTargetQty || jc.targetQty,
              colour: 'Raw Substrate Tone',
              uom: 'Pcs',
              category: 'PARTY_MATERIAL' as StockCategory,
              materialType: 'substrate' as StockMaterialType,
              consumedQty: 0,
              floorBalanceQty: jc.dailyIssuedQty || jc.dailyTargetQty || jc.targetQty
            },
            {
              id: 'mat_paint_gen',
              itemDescription: `${jc.color} 2K PU Basecoat Paint`,
              qty: Math.max(2, Math.ceil(((jc.dailyTargetQty || jc.targetQty) / 500) * 8)),
              colour: jc.color,
              uom: 'Litres',
              category: 'COMPANY_CONSUMABLE' as StockCategory,
              materialType: 'paint' as StockMaterialType,
              consumedQty: 0,
              floorBalanceQty: Math.max(2, Math.ceil(((jc.dailyTargetQty || jc.targetQty) / 500) * 8))
            },
            {
              id: 'mat_thinner_gen',
              itemDescription: 'PU Thinner 400 Solvent',
              qty: Math.max(1, Math.ceil(((jc.dailyTargetQty || jc.targetQty) / 500) * 3.2)),
              colour: 'Clear',
              uom: 'Litres',
              category: 'COMPANY_CONSUMABLE' as StockCategory,
              materialType: 'thinner' as StockMaterialType,
              consumedQty: 0,
              floorBalanceQty: Math.max(1, Math.ceil(((jc.dailyTargetQty || jc.targetQty) / 500) * 3.2))
            },
            {
              id: 'mat_hardener_gen',
              itemDescription: '2K Scratch-Resistant Hardener',
              qty: Math.max(1, Math.ceil(((jc.dailyTargetQty || jc.targetQty) / 500) * 2.0)),
              colour: 'Clear',
              uom: 'Litres',
              category: 'COMPANY_CONSUMABLE' as StockCategory,
              materialType: 'hardener' as StockMaterialType,
              consumedQty: 0,
              floorBalanceQty: Math.max(1, Math.ceil(((jc.dailyTargetQty || jc.targetQty) / 500) * 2.0))
            }
          ];

      const updatedMaterials = existingMats.map(m => {
        const isParty = m.category === 'PARTY_MATERIAL' || m.materialType === 'substrate' || m.uom === 'Pcs';
        if (isParty) {
          const newCons = Math.min(m.qty, (m.consumedQty || 0) + Number(addedSprayedQty || 0));
          return {
            ...m,
            consumedQty: newCons,
            floorBalanceQty: Math.max(0, m.qty - newCons)
          };
        } else {
          // Company Consumable Chemical
          let consumedNow = 0;
          if (consumablesUsage) {
            if (m.id && consumablesUsage[m.id] !== undefined) consumedNow = Number(consumablesUsage[m.id]);
            else if (m.materialType && consumablesUsage[m.materialType] !== undefined) consumedNow = Number(consumablesUsage[m.materialType]);
            else if (m.itemDescription && consumablesUsage[m.itemDescription] !== undefined) consumedNow = Number(consumablesUsage[m.itemDescription]);
          }
          if (consumedNow === 0 && addedSprayedQty > 0) {
            // Auto standard theoretical estimation based on sprayed pieces
            if (m.materialType === 'paint' || m.itemDescription.toLowerCase().includes('paint') || m.itemDescription.toLowerCase().includes('basecoat')) {
              consumedNow = Number(((Number(addedSprayedQty) / 500) * 8).toFixed(2));
            } else if (m.materialType === 'thinner' || m.itemDescription.toLowerCase().includes('thinner')) {
              consumedNow = Number(((Number(addedSprayedQty) / 500) * 3.2).toFixed(2));
            } else if (m.materialType === 'hardener' || m.itemDescription.toLowerCase().includes('hardener')) {
              consumedNow = Number(((Number(addedSprayedQty) / 500) * 2.0).toFixed(2));
            } else {
              consumedNow = Number(((Number(addedSprayedQty) / 200) * 1.0).toFixed(2));
            }
          }
          const updatedConsumed = Number(((m.consumedQty || 0) + consumedNow).toFixed(2));
          return {
            ...m,
            consumedQty: updatedConsumed,
            floorBalanceQty: Math.max(0, Number((m.qty - updatedConsumed).toFixed(2)))
          };
        }
      });

      return {
        ...jc,
        sprayedQty: newSprayed,
        goodQty: newGood,
        rejectQty: newReject,
        firstPassGoodQty: (jc.firstPassGoodQty || 0) + netAddedGood,
        status: newStatus,
        issuedMaterials: updatedMaterials
      };
    }));
  };

  const updateJobCardSprayed = (
    jobCardNo: string,
    addedSprayedQty: number,
    addedRejectQty: number = 0,
    defectCategory?: string,
    consumablesUsage?: { [key: string]: number }
  ) => {
    updateJobCardProgress(jobCardNo, addedSprayedQty, addedRejectQty, consumablesUsage);

    if (addedRejectQty > 0 && defectCategory) {
      setDefects(prev => prev.map(d => {
        if (d.code === defectCategory || d.name === defectCategory) {
          return { ...d, count: d.count + Number(addedRejectQty) };
        }
        return d;
      }));
    }
  };

  // 3-Painters Sub-Job Card Split Logic
  const splitJobCardToPainters = (
    masterJobCardNo: string,
    splits: { painterName: string; allocatedQty: number }[]
  ) => {
    setJobCards(prev => {
      const master = prev.find(j => j.jobCardNo === masterJobCardNo);
      if (!master) return prev;

      const childCards: JobCard[] = splits.map((s, idx) => ({
        ...master,
        docNo: `${master.docNo || 'Doc No: 001'}-P${idx + 1}`,
        jobCardNo: `${master.jobCardNo}-P${idx + 1}`,
        jobCardType: 'painter_child',
        parentJobCardId: master.jobCardNo,
        assignedPainterName: s.painterName,
        allocatedQty: s.allocatedQty,
        targetQty: s.allocatedQty,
        sprayedQty: 0,
        goodQty: 0,
        firstPassGoodQty: 0,
        rejectQty: 0,
        reworkFlaggedQty: 0,
        status: 'In Process',
        boothNo: `Booth #${idx + 1}`,
        dept: `Booth #${idx + 1} (Line Spray)`
      }));

      const updatedMaster: JobCard = {
        ...master,
        jobCardType: 'master',
        status: 'In Process'
      };

      return [
        updatedMaster,
        ...childCards,
        ...prev.filter(j => j.jobCardNo !== masterJobCardNo)
      ];
    });
  };

  // Rework on Rejection Routing Logic with Deterministic Sequential Indexing (RW1, RW2...)
  const routeToRework = (
    parentJobCardNo: string,
    reworkQty: number,
    defectCategory: DefectCategory,
    instructions: string
  ) => {
    setJobCards(prev => {
      const parent = prev.find(j => j.jobCardNo === parentJobCardNo);
      if (!parent) return prev;

      const existingReworkCount = prev.filter(j => j.parentJobCardId === parentJobCardNo && j.jobCardType === 'rework_child').length;
      const reworkCardNo = `${parentJobCardNo}-RW${existingReworkCount + 1}`;
      const reworkCard: JobCard = {
        ...parent,
        docNo: `${parent.docNo || 'Doc No: 001'}-RW${existingReworkCount + 1}`,
        jobCardNo: reworkCardNo,
        jobCardType: 'rework_child',
        parentJobCardId: parentJobCardNo,
        defectCategory,
        reworkInstructions: instructions,
        reworkStatus: 'Pending Sanding',
        targetQty: reworkQty,
        allocatedQty: reworkQty,
        sprayedQty: reworkQty,
        goodQty: reworkQty,
        rejectQty: 0,
        reworkRecoveredQty: reworkQty,
        scrapQty: 0,
        status: 'In Process',
        partDescription: `${parent.partDescription} [REWORK SALVAGE]`,
        dept: 'Rework Station & Booth #1'
      };

      return [
        reworkCard,
        ...prev.map(j => {
          if (j.jobCardNo !== parentJobCardNo) return j;
          return {
            ...j,
            reworkFlaggedQty: (j.reworkFlaggedQty || 0) + reworkQty
          };
        })
      ];
    });
  };

  // Inspect & Pass Rework Clearance Action
  const passReworkClearance = (reworkJobCardNo: string, salvagedQty: number, scrapQty: number) => {
    setJobCards(prev => {
      const rw = prev.find(j => j.jobCardNo === reworkJobCardNo);
      if (!rw) return prev;

      return prev.map(j => {
        if (j.jobCardNo === reworkJobCardNo) {
          return {
            ...j,
            reworkRecoveredQty: salvagedQty,
            scrapQty,
            reworkStatus: 'Passed QC',
            status: 'Completed'
          };
        }
        if (j.jobCardNo === rw.parentJobCardId) {
          return {
            ...j,
            goodQty: (j.goodQty || 0) + salvagedQty,
            scrapQty: (j.scrapQty || 0) + scrapQty
          };
        }
        return j;
      });
    });
  };

  // Dynamic Stage Receipt & Handshake: Each stage operator verifies incoming pieces from previous stage
  const updateJobCardStageReceipt = (
    jobCardNo: string,
    stage: 'first' | 'second' | 'third',
    data: {
      receivedQty: number;
      operatorName: string;
      notes?: string;
      okQty?: number;
      rejectionQty?: number;
    }
  ) => {
    setJobCards(prev => prev.map(jc => {
      if (jc.jobCardNo !== jobCardNo) return jc;

      const currentStageObj = stage === 'first' 
        ? jc.stageProcessFirst 
        : stage === 'second' 
        ? jc.stageProcessSecond 
        : jc.stageProcessThird;

      const prevOk = stage === 'second' 
        ? (jc.stageProcessFirst?.okQty || jc.targetQty) 
        : stage === 'third' 
        ? (jc.stageProcessSecond?.okQty || jc.targetQty) 
        : jc.targetQty;

      const diff = data.receivedQty - prevOk;
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const nowDate = new Date().toISOString().slice(0, 10);

      const updatedStageData: ProcessStageCount = {
        totalQty: data.receivedQty,
        okQty: data.okQty !== undefined ? data.okQty : (currentStageObj?.okQty || data.receivedQty),
        rejectionQty: data.rejectionQty !== undefined ? data.rejectionQty : (currentStageObj?.rejectionQty || 0),
        receivedBy: data.operatorName,
        receivedTimestamp: `${nowDate} ${nowTime}`,
        isReceivedVerified: true,
        receivedDiscrepancyQty: diff !== 0 ? diff : 0,
        stageOperatorNotes: data.notes || currentStageObj?.stageOperatorNotes || ''
      };

      if (stage === 'first') {
        return { ...jc, stageProcessFirst: updatedStageData };
      } else if (stage === 'second') {
        return { ...jc, stageProcessSecond: updatedStageData };
      } else {
        return { ...jc, stageProcessThird: updatedStageData };
      }
    }));
  };

  // Dynamic Packing Slip Registration
  const addPackingSlip = (slip: PackingSlipRecord) => {
    setPackingSlips(prev => [slip, ...prev]);
  };

  // ======================================================================
  // 3-TIER SPRAY PAINTING JOB CARD & CONSUMABLES ENGINE (PK-OS 2026)
  // ======================================================================

  // Helper: map PainterDailyMaterialAllocation type -> StockMaterialType
  const mapPainterMatTypeToStockType = (
    mType: PainterDailyMaterialAllocation['materialType']
  ): StockMaterialType => {
    if (mType === 'Topcoat') return 'clear_coat';
    if (mType === 'Hardener') return 'hardener';
    if (mType === 'Thinner' || mType === 'Cleaning Solvent') return 'thinner';
    return 'paint';
  };

  // Helper: build consolidated Floor Demand MRN lines & painter breakdown for pending assignments
  const buildConsolidatedFloorDemand = (
    parentJob: JobCard,
    demands: PainterFloorDemandEntry[]
  ): { reqLines: RequisitionLineItem[]; totalPartyPcs: number; summaryText: string } => {
    const partyMap = new Map<string, RequisitionLineItem>();
    const chemMap = new Map<string, RequisitionLineItem>();

    demands.forEach((pd, idx) => {
      if (pd.partyTargetQty > 0) {
        const pCode = (pd.partCode || parentJob.partCode || 'SUBSTRATE').trim();
        const pDesc = (pd.partDescription || parentJob.partDescription || 'Component Substrate').trim();
        const key = `${pCode.toLowerCase()}__${pDesc.toLowerCase()}`;
        const existing = partyMap.get(key);
        if (existing) {
          existing.requestedQty += Number(pd.partyTargetQty || 0);
          existing.assignmentIds = Array.from(new Set([...(existing.assignmentIds || []), pd.assignmentId]));
          existing.painterNames = Array.from(new Set([...(existing.painterNames || []), pd.painterName]));
        } else {
          partyMap.set(key, {
            id: `rl_sub_${idx}_${Date.now()}`,
            itemCode: pCode,
            itemName: pDesc,
            category: 'PARTY_MATERIAL',
            materialType: 'substrate',
            requestedQty: Number(pd.partyTargetQty || 0),
            uom: 'Pcs',
            customer: parentJob.customer,
            partCode: pCode,
            colour: pd.colorShade || parentJob.color,
            status: 'Pending',
            assignmentIds: [pd.assignmentId],
            painterNames: [pd.painterName]
          });
        }
      }

      (pd.companyMaterials || []).forEach((cm, cIdx) => {
        if (!cm.materialName.trim() || Number(cm.qty) <= 0) return;
        const cKey = `${cm.materialName.trim().toLowerCase()}__${cm.materialType}__${cm.uom}`;
        const existingChem = chemMap.get(cKey);
        if (existingChem) {
          existingChem.requestedQty = Number((existingChem.requestedQty + Number(cm.qty)).toFixed(2));
          existingChem.assignmentIds = Array.from(new Set([...(existingChem.assignmentIds || []), pd.assignmentId]));
          existingChem.painterNames = Array.from(new Set([...(existingChem.painterNames || []), pd.painterName]));
        } else {
          chemMap.set(cKey, {
            id: `rl_chem_${idx}_${cIdx}_${Date.now()}`,
            itemCode: cm.materialName.slice(0, 10).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'CHEM',
            itemName: cm.materialName.trim(),
            category: 'COMPANY_CONSUMABLE',
            materialType: mapPainterMatTypeToStockType(cm.materialType),
            requestedQty: Number(Number(cm.qty).toFixed(2)),
            uom: cm.uom || 'Litres',
            colour: cm.colour || pd.colorShade || parentJob.color,
            status: 'Pending',
            assignmentIds: [pd.assignmentId],
            painterNames: [pd.painterName]
          });
        }
      });
    });

    const reqLines = [...Array.from(partyMap.values()), ...Array.from(chemMap.values())];
    const totalPartyPcs = Array.from(partyMap.values()).reduce((sum, l) => sum + Number(l.requestedQty || 0), 0);
    const painterListStr = demands.map(d => `${d.painterName.split('(')[0].trim()} (${d.partyTargetQty} Pcs)`).join(', ');
    const summaryText = `Floor Demand for ${demands.length} Painter(s): ${painterListStr}. Party Substrate: ${totalPartyPcs} Pcs + ${chemMap.size} Daily Chemical Item(s).`;

    return { reqLines, totalPartyPcs, summaryText };
  };

  // Upsert exact Floor Demand (MRN) for a Job Card's pending painter assignments
  const upsertPendingFloorDemand = (
    parentJob: JobCard,
    allAssignmentsForJob: PainterAssignment[],
    targetDate: string
  ): string => {
    const dispatchedAsgIds = new Set<string>();
    latestReqsRef.current.forEach(r => {
      if (r.jobCardNo === parentJob.jobCardNo && r.status !== 'Pending Store Issue' && r.status !== 'Cancelled') {
        (r.painterDemands || []).forEach(pd => {
          if (pd.assignmentId) dispatchedAsgIds.add(pd.assignmentId);
        });
      }
    });

    const pendingAsgsForDate = allAssignmentsForJob.filter(
      a => a.assignmentDate === targetDate && !dispatchedAsgIds.has(a.id)
    );
    const activePendingAsgs = pendingAsgsForDate.length > 0 ? pendingAsgsForDate : allAssignmentsForJob.filter(a => !dispatchedAsgIds.has(a.id));

    const painterDemands: PainterFloorDemandEntry[] = activePendingAsgs.map(a => ({
      assignmentId: a.id,
      painterId: a.painterId,
      painterName: a.painterName,
      boothNumber: a.boothNumber,
      assignmentDate: a.assignmentDate,
      partCode: a.partCode || parentJob.partCode,
      partDescription: a.partDescription || parentJob.partDescription,
      colorShade: a.colorShade || parentJob.color,
      partyTargetQty: Number(a.dailyTargetQty || 0),
      uom: 'Pcs',
      companyMaterials: a.plannedMaterials || []
    }));

    const { reqLines, totalPartyPcs, summaryText } = buildConsolidatedFloorDemand(parentJob, painterDemands);
    const existingPendingMrn = latestReqsRef.current.find(
      r => r.jobCardNo === parentJob.jobCardNo && r.date === targetDate && r.status === 'Pending Store Issue'
    );

    const mrnNo = existingPendingMrn
      ? existingPendingMrn.mrnNo
      : (() => {
          mrnSeqRef.current = Math.max(mrnSeqRef.current, latestReqsRef.current.length) + 1;
          return `MRN-${new Date().getFullYear()}-${String(mrnSeqRef.current).padStart(3, '0')}`;
        })();

    const allShades = Array.from(new Set(painterDemands.map(d => d.colorShade).filter(Boolean))).join(', ');
    const allParts = Array.from(new Set(painterDemands.map(d => d.partDescription).filter(Boolean))).join(' + ');
    const allPartCodes = Array.from(new Set(painterDemands.map(d => d.partCode).filter(Boolean))).join(', ');

    const nextMrnObj: MaterialRequisitionNote = existingPendingMrn
      ? {
          ...existingPendingMrn,
          partCode: allPartCodes || parentJob.partCode,
          partDescription: allParts || parentJob.partDescription,
          colorName: allShades || parentJob.color,
          requestedQty: totalPartyPcs,
          uom: 'Pcs',
          sourceGrnNo: parentJob.sourceGrnNo || existingPendingMrn.sourceGrnNo,
          painterDemands,
          requisitionLines: reqLines,
          productionRemarks: summaryText
        }
      : {
          mrnNo,
          date: targetDate || new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          plant: parentJob.plant || (activePlant === 'ALL' ? 'Haridwar' : activePlant),
          jobCardNo: parentJob.jobCardNo,
          woNo: parentJob.woNo || 'WO-AUTO',
          customer: parentJob.customer,
          partCode: allPartCodes || parentJob.partCode,
          partDescription: allParts || parentJob.partDescription,
          colorName: allShades || parentJob.color,
          requestedQty: totalPartyPcs,
          uom: 'Pcs',
          sourceGrnNo: parentJob.sourceGrnNo,
          requiredShift: activeShift,
          requestedBy: parentJob.prodSupervisor || currentUser.name || 'Production Manager',
          urgency: 'High (Line Stoppage Risk)',
          status: 'Pending Store Issue',
          painterDemands,
          requisitionLines: reqLines,
          productionRemarks: summaryText
        };

    if (existingPendingMrn) {
      latestReqsRef.current = latestReqsRef.current.map(r => (r.mrnNo === mrnNo ? nextMrnObj : r));
      setMaterialRequisitions(prev => prev.map(r => (r.mrnNo === mrnNo ? nextMrnObj : r)));
    } else {
      latestReqsRef.current = [nextMrnObj, ...latestReqsRef.current];
      setMaterialRequisitions(prev => [nextMrnObj, ...prev]);
    }

    return mrnNo;
  };

  const createPainterAssignment = (
    assignmentData: Omit<PainterAssignment, 'id' | 'status' | 'actualCompletedQty' | 'rejectReworkQty' | 'scrapQty' | 'stageOkQty' | 'stageReworkQty' | 'stageScrapQty'>,
    masterJobCardOverride?: JobCard
  ): { success: boolean; error?: string; assignment?: PainterAssignment } => {
    const parentJob = masterJobCardOverride || jobCards.find(j => j.jobCardNo === assignmentData.masterJobCardNo);
    if (!parentJob) {
      return { success: false, error: `Master Job Card ${assignmentData.masterJobCardNo} not found.` };
    }

    const currentAssignments = latestAssignmentsRef.current;

    // Calculate committed & completed pieces (per-part when multiple inward parts exist, plus overall master balance)
    const inwardParts = resolveJobCardInwardParts(parentJob, grnList);
    const {
      balancePending,
      isPartScoped,
      selectedPart
    } = computeAssignmentBalance(
      parentJob,
      currentAssignments,
      inwardParts,
      assignmentData.partCode || assignmentData.partDescription
    );
    const availableToAssign = balancePending;

    if (assignmentData.dailyTargetQty > availableToAssign) {
      return {
        success: false,
        error: isPartScoped && selectedPart
          ? `Daily Target Qty (${assignmentData.dailyTargetQty} pcs) exceeds remaining balance (${availableToAssign} pcs) for ${selectedPart.partDescription} (${selectedPart.partCode}).`
          : `Daily Target Qty (${assignmentData.dailyTargetQty} pcs) exceeds remaining unallocated balance (${availableToAssign} pcs). Master Pending: ${balancePending} pcs.`
      };
    }

    const resolvedPartCode = assignmentData.partCode || selectedPart?.partCode || parentJob.partCode;
    const resolvedPartDescription = assignmentData.partDescription || selectedPart?.partDescription || parentJob.partDescription;

    const maxAsgSeq = currentAssignments.reduce((max, a) => {
      const m = (a.id || '').match(/ASG-\d{4}-(\d+)/i);
      const n = m ? parseInt(m[1], 10) : 0;
      return !isNaN(n) && n > max ? n : max;
    }, 0);
    asgSeqRef.current = Math.max(asgSeqRef.current, maxAsgSeq) + 1;
    const nextId = `ASG-${new Date().getFullYear()}-${String(asgSeqRef.current).padStart(4, '0')}`;
    const cleanedPlannedMaterials = (assignmentData.plannedMaterials || []).filter(
      m => m.materialName.trim() && Number(m.qty) > 0
    );

    const newAssignment: PainterAssignment = {
      ...assignmentData,
      partCode: resolvedPartCode,
      partDescription: resolvedPartDescription,
      plannedMaterials: cleanedPlannedMaterials,
      storeTransferStatus: 'Pending Store Transfer',
      id: nextId,
      assignmentId: nextId,
      masterJobCardNo: assignmentData.masterJobCardNo,
      masterJobCardId: assignmentData.masterJobCardNo,
      status: 'Active',
      actualCompletedQty: 0,
      rejectReworkQty: 0,
      scrapQty: 0,
      stageOkQty: 0,
      stageReworkQty: 0,
      stageScrapQty: 0,
      efficiencyPercent: 0,
      efficiency: 0,
      startedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextAllAssignments = [newAssignment, ...currentAssignments];
    const jobCardAssignmentsAfter = nextAllAssignments.filter(
      a => a.masterJobCardNo === parentJob.jobCardNo || a.masterJobCardId === parentJob.jobCardNo
    );

    // Raise or update exact Store Floor Demand (MRN) with all pending painters + their Party & Company materials
    const mrnNo = upsertPendingFloorDemand(parentJob, jobCardAssignmentsAfter, assignmentData.assignmentDate);
    newAssignment.storeDemandMrnNo = mrnNo;

    const coveredIds = new Set(jobCardAssignmentsAfter.map(a => a.id));
    latestAssignmentsRef.current = nextAllAssignments.map(a =>
      a.id === newAssignment.id || (coveredIds.has(a.id) && !a.storeMinNo && a.assignmentDate === assignmentData.assignmentDate)
        ? { ...a, storeDemandMrnNo: mrnNo }
        : a
    );
    setPainterAssignments(latestAssignmentsRef.current);

    // Update Master Job Card status & assigned painter metadata
    const totalAllocatedForCard = jobCardAssignmentsAfter.reduce((sum, a) => sum + Number(a.dailyTargetQty || 0), 0);
    setJobCards(prev => prev.map(jc => {
      if (jc.jobCardNo !== assignmentData.masterJobCardNo) return jc;
      const currentList = jc.assignments || [];
      return {
        ...jc,
        status: jc.status === 'Open' ? 'In Process' : jc.status,
        painterJobStatus: 'Assigned',
        assignedPainterName: jc.assignedPainterName || newAssignment.painterName,
        painterName: jc.painterName || newAssignment.painterName,
        allocatedQty: totalAllocatedForCard,
        dailyTargetQty: totalAllocatedForCard,
        assignments: [newAssignment, ...currentList]
      };
    }));

    return { success: true, assignment: newAssignment };
  };

  const requestAssignmentChemicals = (
    assignmentId: string,
    materials: PainterDailyMaterialAllocation[]
  ): { success: boolean; mrnNo?: string; error?: string } => {
    const cleanMats = materials.filter(m => m.materialName.trim() && Number(m.qty) > 0);
    if (cleanMats.length === 0) {
      return { success: false, error: 'Please specify at least one chemical with quantity > 0.' };
    }
    const targetAsg = latestAssignmentsRef.current.find(a => a.id === assignmentId);
    if (!targetAsg) {
      return { success: false, error: `Assignment ${assignmentId} not found.` };
    }
    const parentJob = jobCards.find(j => j.jobCardNo === targetAsg.masterJobCardNo);
    if (!parentJob) {
      return { success: false, error: `Master Job Card ${targetAsg.masterJobCardNo} not found.` };
    }

    const updatedAsg: PainterAssignment = {
      ...targetAsg,
      plannedMaterials: [...(targetAsg.plannedMaterials || []), ...cleanMats]
    };

    const existingPendingMrn = latestReqsRef.current.find(
      r => r.jobCardNo === parentJob.jobCardNo && r.date === targetAsg.assignmentDate && r.status === 'Pending Store Issue'
    );

    let mrnNo: string;
    if (existingPendingMrn) {
      latestAssignmentsRef.current = latestAssignmentsRef.current.map(a =>
        a.id === assignmentId ? updatedAsg : a
      );
      const jobAsgs = latestAssignmentsRef.current.filter(
        a => a.masterJobCardNo === parentJob.jobCardNo || a.masterJobCardId === parentJob.jobCardNo
      );
      mrnNo = upsertPendingFloorDemand(parentJob, jobAsgs, targetAsg.assignmentDate);
      updatedAsg.storeDemandMrnNo = mrnNo;
    } else {
      // Previous MRN already dispatched by Store -> raise supplementary Floor Demand strictly for the extra company chemicals
      mrnSeqRef.current = Math.max(mrnSeqRef.current, latestReqsRef.current.length) + 1;
      mrnNo = `MRN-${new Date().getFullYear()}-${String(mrnSeqRef.current).padStart(3, '0')}`;
      const suppDemands: PainterFloorDemandEntry[] = [
        {
          assignmentId: targetAsg.id,
          painterId: targetAsg.painterId,
          painterName: targetAsg.painterName,
          boothNumber: targetAsg.boothNumber,
          assignmentDate: targetAsg.assignmentDate,
          partCode: targetAsg.partCode || parentJob.partCode,
          partDescription: targetAsg.partDescription || parentJob.partDescription,
          colorShade: targetAsg.colorShade || parentJob.color,
          partyTargetQty: 0,
          uom: 'Pcs',
          companyMaterials: cleanMats
        }
      ];
      const { reqLines } = buildConsolidatedFloorDemand(parentJob, suppDemands);
      const totalChemQty = reqLines.reduce((sum, l) => sum + Number(l.requestedQty || 0), 0);
      const suppMrn: MaterialRequisitionNote = {
        mrnNo,
        date: targetAsg.assignmentDate || new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        plant: parentJob.plant || (activePlant === 'ALL' ? 'Haridwar' : activePlant),
        jobCardNo: parentJob.jobCardNo,
        woNo: parentJob.woNo || 'WO-AUTO',
        customer: parentJob.customer,
        partCode: targetAsg.partCode || parentJob.partCode,
        partDescription: `${targetAsg.partDescription || parentJob.partDescription} (Extra Chemical Demand)`,
        colorName: targetAsg.colorShade || parentJob.color,
        requestedQty: totalChemQty,
        uom: cleanMats[0]?.uom || 'Litres',
        sourceGrnNo: parentJob.sourceGrnNo,
        requiredShift: activeShift,
        requestedBy: parentJob.prodSupervisor || currentUser.name || 'Production Manager',
        urgency: 'High (Line Stoppage Risk)',
        status: 'Pending Store Issue',
        painterDemands: suppDemands,
        requisitionLines: reqLines,
        productionRemarks: `Supplementary chemical demand for ${targetAsg.painterName} (${targetAsg.assignmentId}): ${cleanMats.map(c => `${c.materialName} (${c.qty} ${c.uom})`).join(', ')}`
      };
      latestReqsRef.current = [suppMrn, ...latestReqsRef.current];
      setMaterialRequisitions(prev => [suppMrn, ...prev]);
      updatedAsg.storeTransferStatus = 'Pending Store Transfer';
      updatedAsg.storeDemandMrnNo = mrnNo;
    }

    latestAssignmentsRef.current = latestAssignmentsRef.current.map(a =>
      a.id === assignmentId ? updatedAsg : a
    );
    setPainterAssignments(latestAssignmentsRef.current);
    return { success: true, mrnNo };
  };

  const addTargetToPainterAssignment = (
    assignmentId: string,
    extraPartyQty: number,
    extraChemicals: PainterDailyMaterialAllocation[] = [],
    masterJobCardOverride?: JobCard
  ): { success: boolean; mrnNo?: string; error?: string } => {
    const targetAsg = latestAssignmentsRef.current.find(a => a.id === assignmentId);
    if (!targetAsg) {
      return { success: false, error: `Assignment ${assignmentId} not found.` };
    }

    const parentJob = masterJobCardOverride || jobCards.find(j => j.jobCardNo === targetAsg.masterJobCardNo);
    if (!parentJob) {
      return { success: false, error: `Master Job Card ${targetAsg.masterJobCardNo} not found.` };
    }

    const qtyToAdd = Math.floor(Number(extraPartyQty) || 0);
    if (qtyToAdd <= 0) {
      return { success: false, error: 'Add-on Party Material quantity must be greater than zero.' };
    }

    // Strict check: Party Material target add-on ONLY allowed when current daily target is 100% finished
    const jobAsgs = latestAssignmentsRef.current.filter(
      a => a.masterJobCardNo === parentJob.jobCardNo || a.masterJobCardId === parentJob.jobCardNo
    );
    const asgLogs = (parentJob.progressLogs || []).filter(
      l =>
        l.assignmentId === targetAsg.id ||
        l.assignmentId === targetAsg.assignmentId ||
        (!l.assignmentId &&
          jobAsgs[0]?.id === targetAsg.id &&
          l.painterName &&
          l.painterName.trim().toLowerCase() === targetAsg.painterName.trim().toLowerCase())
    );
    const hasStageLogs = asgLogs.length > 0;
    const completedGood = hasStageLogs
      ? asgLogs
          .filter(l => l.processStage === 'stage_3_topcoat')
          .reduce((s, l) => s + Number(l.goodPieces || l.piecesCompleted || 0), 0)
      : Number(targetAsg.actualCompletedQty || 0);
    const scrap = hasStageLogs
      ? asgLogs.reduce((s, l) => s + Number(l.scrapPieces || 0), 0)
      : Number(targetAsg.scrapQty || 0);
    const pendingShiftBalance = Math.max(0, Number(targetAsg.dailyTargetQty || 0) - completedGood - scrap);

    if (pendingShiftBalance > 0) {
      return {
        success: false,
        error: `Current daily target is not finished (${pendingShiftBalance} Pcs pending). Complete today's quota before adding Party Material target. Note: Company consumables can still be added anytime.`
      };
    }

    // Validate against Master Job Card / Part remaining balance
    const inwardParts = resolveJobCardInwardParts(parentJob, grnList);
    const {
      balancePending,
      isPartScoped,
      selectedPart
    } = computeAssignmentBalance(
      parentJob,
      latestAssignmentsRef.current,
      inwardParts,
      targetAsg.partCode || targetAsg.partDescription
    );

    if (qtyToAdd > balancePending) {
      return {
        success: false,
        error: isPartScoped && selectedPart
          ? `Add-on Qty (${qtyToAdd} pcs) exceeds remaining order balance (${balancePending} pcs) for ${selectedPart.partDescription} (${selectedPart.partCode}).`
          : `Add-on Qty (${qtyToAdd} pcs) exceeds remaining Master Job Card balance (${balancePending} pcs).`
      };
    }

    const cleanChems = (extraChemicals || []).filter(m => m.materialName.trim() && Number(m.qty) > 0);
    const updatedTargetQty = Number(targetAsg.dailyTargetQty || 0) + qtyToAdd;

    // Raise dedicated Add-On Floor Demand MRN for Store Transfer & new MIN Slip
    mrnSeqRef.current = Math.max(mrnSeqRef.current, latestReqsRef.current.length) + 1;
    const addonMrnNo = `MRN-${new Date().getFullYear()}-${String(mrnSeqRef.current).padStart(3, '0')}`;
    const addonDemands: PainterFloorDemandEntry[] = [
      {
        assignmentId: targetAsg.id,
        painterId: targetAsg.painterId,
        painterName: targetAsg.painterName,
        boothNumber: targetAsg.boothNumber,
        assignmentDate: targetAsg.assignmentDate,
        partCode: targetAsg.partCode || parentJob.partCode,
        partDescription: targetAsg.partDescription || parentJob.partDescription,
        colorShade: targetAsg.colorShade || parentJob.color,
        partyTargetQty: qtyToAdd,
        uom: 'Pcs',
        companyMaterials: cleanChems
      }
    ];
    const { reqLines } = buildConsolidatedFloorDemand(parentJob, addonDemands);
    const addonMrn: MaterialRequisitionNote = {
      mrnNo: addonMrnNo,
      date: targetAsg.assignmentDate || new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      plant: parentJob.plant || (activePlant === 'ALL' ? 'Haridwar' : activePlant),
      jobCardNo: parentJob.jobCardNo,
      woNo: parentJob.woNo || 'WO-AUTO',
      customer: parentJob.customer,
      partCode: targetAsg.partCode || parentJob.partCode,
      partDescription: `${targetAsg.partDescription || parentJob.partDescription} (Add-On Target)`,
      colorName: targetAsg.colorShade || parentJob.color,
      requestedQty: qtyToAdd,
      uom: 'Pcs',
      sourceGrnNo: parentJob.sourceGrnNo,
      requiredShift: activeShift,
      requestedBy: parentJob.prodSupervisor || currentUser.name || 'Production Manager',
      urgency: 'High (Line Stoppage Risk)',
      status: 'Pending Store Issue',
      painterDemands: addonDemands,
      requisitionLines: reqLines,
      productionRemarks: `Add-On Target (+${qtyToAdd} Pcs) for ${targetAsg.painterName} after completing previous daily quota.${cleanChems.length > 0 ? ` + Extra Chemicals: ${cleanChems.map(c => `${c.materialName} (${c.qty} ${c.uom})`).join(', ')}` : ''}`
    };

    latestReqsRef.current = [addonMrn, ...latestReqsRef.current];
    setMaterialRequisitions(prev => [addonMrn, ...prev]);

    const updatedAsg: PainterAssignment = {
      ...targetAsg,
      dailyTargetQty: updatedTargetQty,
      status: 'Active',
      plannedMaterials: [...(targetAsg.plannedMaterials || []), ...cleanChems],
      storeDemandMrnNo: addonMrnNo,
      storeTransferStatus: 'Pending Store Transfer'
    };

    latestAssignmentsRef.current = latestAssignmentsRef.current.map(a =>
      a.id === assignmentId ? updatedAsg : a
    );
    setPainterAssignments(latestAssignmentsRef.current);

    // Log audit event and update allocated totals on Master Job Card
    const now = new Date();
    const addonLog: JobCardProductionProgressLog = {
      id: `LOG-ADDON-${Date.now()}`,
      timestamp: now.toISOString(),
      dateLabel: `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`,
      timeLabel: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      actionType: 'DETAILS_UPDATED',
      actionTitle: `Party Material Add-On Target (+${qtyToAdd} Pcs) — ${targetAsg.painterName}`,
      exactChanges: [
        `Previous Daily Target: ${(updatedTargetQty - qtyToAdd).toLocaleString('en-IN')} Pcs (Finished)`,
        `Added Party Target: +${qtyToAdd.toLocaleString('en-IN')} Pcs (${targetAsg.partDescription || parentJob.partDescription})`,
        `New Daily Target: ${updatedTargetQty.toLocaleString('en-IN')} Pcs`,
        `Floor Demand MRN Raised: ${addonMrnNo}`
      ],
      piecesCompleted: 0,
      cumulativeGoodQty: completedGood,
      assignmentId: targetAsg.id,
      painterName: targetAsg.painterName,
      boothNo: targetAsg.boothNumber,
      recordedBy: currentUser.name || 'Production Supervisor',
      remarks: `Extra target issued in remaining shift time (${addonMrnNo})`
    };

    setJobCards(prev => prev.map(jc => {
      if (jc.jobCardNo !== parentJob.jobCardNo) return jc;
      return {
        ...jc,
        allocatedQty: Number(jc.allocatedQty || 0) + qtyToAdd,
        dailyTargetQty: Number(jc.dailyTargetQty || 0) + qtyToAdd,
        status: jc.status === 'Target Met' ? 'In Process' : jc.status,
        assignments: (jc.assignments || []).map(a => (a.id === assignmentId ? updatedAsg : a)),
        progressLogs: [addonLog, ...(jc.progressLogs || [])]
      };
    }));

    return { success: true, mrnNo: addonMrnNo };
  };

  const issueAssignmentMaterials = (
    assignmentId: string,
    materials: Array<{
      materialName: string;
      materialType: 'Base Paint' | 'Topcoat' | 'Hardener' | 'Thinner' | 'Cleaning Solvent';
      batchNumber?: string;
      issuedQty: number;
      uom: 'Litres' | 'Kg' | 'Pcs';
      standardNormPerPiece?: number;
    }>,
    targetAssignmentOverride?: PainterAssignment
  ) => {
    // Store chemicals can strictly ONLY be issued against a valid assigned painter shift
    const targetAssignment = targetAssignmentOverride || painterAssignments.find(a => a.id === assignmentId);
    if (!targetAssignment) return;

    const newLogs: AssignmentMaterialLog[] = materials.map((m, idx) => ({
      id: `MAT-LOG-${Date.now()}-${idx}`,
      assignmentId,
      masterJobCardNo: targetAssignment.masterJobCardNo,
      masterJobCardId: targetAssignment.masterJobCardNo,
      painterId: targetAssignment.painterId,
      painterName: targetAssignment.painterName,
      date: targetAssignment.assignmentDate,
      logDate: targetAssignment.assignmentDate,
      shift: targetAssignment.shift,
      materialName: m.materialName,
      materialType: m.materialType,
      batchNumber: m.batchNumber || `LOT-${targetAssignment.masterJobCardNo.slice(-4)}`,
      issuedQty: m.issuedQty,
      goodReturnedQty: 0,
      floorWastageExpiredQty: 0,
      netConsumedQty: m.issuedQty,
      uom: m.uom,
      standardNormPerPiece: m.standardNormPerPiece || 0.040,
      loggedAt: new Date().toISOString()
    }));

    setAssignmentMaterialLogs(prev => [...newLogs, ...prev]);

    // Attach to assignment's materialLogs
    setPainterAssignments(prev => prev.map(a => {
      if (a.id !== assignmentId) return a;
      return {
        ...a,
        materialLogs: [...(a.materialLogs || []), ...newLogs]
      };
    }));
  };

  const closePainterAssignment = (
    assignmentId: string,
    completionData: {
      actualCompletedQty: number;
      rejectReworkQty: number;
      scrapQty?: number;
      stageOkQty: number;
      stageReworkQty: number;
      stageScrapQty: number;
      defectCategory?: DefectCategory | string;
      remarks?: string;
    },
    materialReconciliations?: Array<{
      materialName: string;
      materialType: 'Base Paint' | 'Topcoat' | 'Hardener' | 'Thinner' | 'Cleaning Solvent';
      batchNumber?: string;
      issuedQty: number;
      goodReturnedQty: number;
      floorWastageExpiredQty: number;
      uom: 'Litres' | 'Kg' | 'Pcs';
      standardNormPerPiece?: number;
    }>
  ): { success: boolean; error?: string } => {
    const targetAssignment = painterAssignments.find(a => a.id === assignmentId);
    if (!targetAssignment) {
      return { success: false, error: `Assignment ${assignmentId} not found.` };
    }

    const efficiency = targetAssignment.dailyTargetQty > 0
      ? Math.round((completionData.actualCompletedQty / targetAssignment.dailyTargetQty) * 100)
      : 100;

    const newStatus: AssignmentStatus = completionData.actualCompletedQty >= targetAssignment.dailyTargetQty
      ? 'Closed - Target Met'
      : 'Closed - Partial/Incomplete';

    const closedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Reconcile Material Logs
    if (materialReconciliations && materialReconciliations.length > 0) {
      materialReconciliations.forEach(rec => {
        const netConsumed = Math.max(0, rec.issuedQty - rec.goodReturnedQty);
        const perPiece = completionData.actualCompletedQty > 0
          ? Number((netConsumed / completionData.actualCompletedQty).toFixed(4))
          : 0;
        const norm = rec.standardNormPerPiece || 0.040;
        const isHighWastage = perPiece > norm * 1.25; // >25% above standard norm

        const existingLogIndex = assignmentMaterialLogs.findIndex(
          l => l.assignmentId === assignmentId && l.materialName === rec.materialName
        );

        if (existingLogIndex >= 0) {
          setAssignmentMaterialLogs(prev => prev.map((l, i) => {
            if (i !== existingLogIndex) return l;
            return {
              ...l,
              goodReturnedQty: rec.goodReturnedQty,
              floorWastageExpiredQty: rec.floorWastageExpiredQty,
              netConsumedQty: netConsumed,
              perPieceConsumption: perPiece,
              highWastageFlag: isHighWastage
            };
          }));
        } else {
          const newLog: AssignmentMaterialLog = {
            id: `MAT-LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            assignmentId,
            masterJobCardNo: targetAssignment.masterJobCardNo,
            painterId: targetAssignment.painterId,
            painterName: targetAssignment.painterName,
            date: targetAssignment.assignmentDate,
            shift: targetAssignment.shift,
            materialName: rec.materialName,
            materialType: rec.materialType,
            batchNumber: rec.batchNumber,
            issuedQty: rec.issuedQty,
            goodReturnedQty: rec.goodReturnedQty,
            floorWastageExpiredQty: rec.floorWastageExpiredQty,
            netConsumedQty: netConsumed,
            perPieceConsumption: perPiece,
            uom: rec.uom,
            highWastageFlag: isHighWastage,
            standardNormPerPiece: norm,
            loggedAt: new Date().toISOString()
          };
          setAssignmentMaterialLogs(prev => [newLog, ...prev]);
        }
      });
    }

    // Update assignment record
    setPainterAssignments(prev => prev.map(a => {
      if (a.id !== assignmentId) return a;
      return {
        ...a,
        actualCompletedQty: completionData.actualCompletedQty,
        rejectReworkQty: completionData.rejectReworkQty,
        scrapQty: completionData.scrapQty || 0,
        stageOkQty: completionData.stageOkQty,
        stageReworkQty: completionData.stageReworkQty,
        stageScrapQty: completionData.stageScrapQty,
        defectCategory: completionData.defectCategory,
        status: newStatus,
        closedAt: closedTime,
        closedBy: currentUser?.name || 'Supervisor',
        efficiencyPercent: efficiency,
        efficiency,
        remarks: completionData.remarks || a.remarks
      };
    }));

    // Recalculate Master Job Card Totals
    setJobCards(prev => prev.map(jc => {
      if (jc.jobCardNo !== targetAssignment.masterJobCardNo) return jc;

      // Sum all closed assignments including this one
      const otherAssignments = painterAssignments.filter(
        a => a.masterJobCardNo === jc.jobCardNo && a.id !== assignmentId
      );
      const totalOkFromAssignments = otherAssignments.reduce((sum, a) => sum + (a.stageOkQty || a.actualCompletedQty || 0), 0) + completionData.stageOkQty;
      const totalRejectFromAssignments = otherAssignments.reduce((sum, a) => sum + (a.stageReworkQty || a.rejectReworkQty || 0), 0) + completionData.stageReworkQty;

      const newBalance = Math.max(0, jc.targetQty - totalOkFromAssignments);
      const isOrderComplete = newBalance <= 0;

      // Check if deadline passed
      const isOverdue = jc.deadlineDate && new Date(jc.deadlineDate) < new Date() && !isOrderComplete;
      const newStatus = isOrderComplete
        ? 'Completed'
        : isOverdue
        ? 'Over-Run Flagged'
        : 'In Process';

      return {
        ...jc,
        goodQty: totalOkFromAssignments,
        sprayedQty: totalOkFromAssignments + totalRejectFromAssignments,
        rejectQty: totalRejectFromAssignments,
        status: newStatus
      };
    }));

    return { success: true };
  };

  const updateAssignmentMaterialLog = (
    logId: string,
    updates: { goodReturnedQty: number; floorWastageExpiredQty: number; batchNumber?: string }
  ) => {
    const targetLog = assignmentMaterialLogs.find(l => l.id === logId);
    if (!targetLog) return;

    const parentAssignment = painterAssignments.find(
      a => a.id === targetLog.assignmentId || a.assignmentId === targetLog.assignmentId
    );
    const completedQty = parentAssignment?.actualCompletedQty || 0;
    const goodReturned = Math.max(0, Math.min(targetLog.issuedQty, updates.goodReturnedQty));
    const floorWastage = Math.max(0, updates.floorWastageExpiredQty);
    const netConsumed = Math.max(0, Number((targetLog.issuedQty - goodReturned).toFixed(3)));
    const perPiece = completedQty > 0 ? Number((netConsumed / completedQty).toFixed(4)) : 0;
    const norm = targetLog.standardNormPerPiece || 0.040;
    const isHighWastage = perPiece > 0 && perPiece > norm * 1.25;

    const updatedLog: AssignmentMaterialLog = {
      ...targetLog,
      goodReturnedQty: goodReturned,
      floorWastageExpiredQty: floorWastage,
      netConsumedQty: netConsumed,
      batchNumber: updates.batchNumber !== undefined ? updates.batchNumber : targetLog.batchNumber,
      perPieceConsumption: perPiece,
      highWastageFlag: isHighWastage,
      loggedAt: new Date().toISOString()
    };

    setAssignmentMaterialLogs(prev => prev.map(l => (l.id === logId ? updatedLog : l)));
    setPainterAssignments(prev => prev.map(a => {
      if (a.id !== targetLog.assignmentId && a.assignmentId !== targetLog.assignmentId) return a;
      const existingLogs = a.materialLogs || [];
      return {
        ...a,
        materialLogs: existingLogs.map(ml => (ml.id === logId ? updatedLog : ml))
      };
    }));
  };

  const recordAssignmentStageOutput = (
    assignmentId: string,
    stage: CoatingProcessStage,
    goodDelta: number,
    reworkDelta: number,
    scrapDelta: number
  ) => {
    setPainterAssignments(prev => prev.map(a => {
      if (a.id !== assignmentId && a.assignmentId !== assignmentId) return a;

      // Count as Completed Good Output ONLY once all stages pass (Stage 3: Clear Topcoat)
      const newActualCompleted = (a.actualCompletedQty || 0) + (stage === 'stage_3_topcoat' ? goodDelta : 0);
      const newRework = (a.rejectReworkQty || 0) + reworkDelta;
      const newScrap = (a.scrapQty || 0) + scrapDelta;
      const eff = a.dailyTargetQty > 0 ? Math.min(100, Math.round((newActualCompleted / a.dailyTargetQty) * 100)) : 0;

      return {
        ...a,
        actualCompletedQty: newActualCompleted,
        rejectReworkQty: newRework,
        scrapQty: newScrap,
        stageOkQty: (a.stageOkQty || 0) + goodDelta,
        stageReworkQty: (a.stageReworkQty || 0) + reworkDelta,
        stageScrapQty: (a.stageScrapQty || 0) + scrapDelta,
        efficiencyPercent: eff,
        efficiency: eff
      };
    }));
  };

  const getPainterConsumablesLedger = (painterIdOrName?: string) => {
    let logs = assignmentMaterialLogs;
    if (painterIdOrName && painterIdOrName.trim() !== '') {
      const q = painterIdOrName.trim().toLowerCase();
      logs = logs.filter(l => 
        (l.painterId && l.painterId.toLowerCase() === q) ||
        (l.painterName && l.painterName.toLowerCase().includes(q))
      );
    }

    const totalIssuedLitres = logs.reduce((sum, l) => sum + (l.issuedQty || 0), 0);
    const totalReturnedGoodLitres = logs.reduce((sum, l) => sum + (l.goodReturnedQty || 0), 0);
    const totalFloorWastageLitres = logs.reduce((sum, l) => sum + (l.floorWastageExpiredQty || 0), 0);
    const netConsumedLitres = logs.reduce((sum, l) => sum + (l.netConsumedQty || 0), 0);

    // Sum pieces painted across matched assignments
    const matchedAssignmentIds = new Set(logs.map(l => l.assignmentId));
    const totalPiecesPainted = painterAssignments
      .filter(a => matchedAssignmentIds.has(a.id))
      .reduce((sum, a) => sum + (a.actualCompletedQty || 0), 0);

    const avgLitrePerPiece = totalPiecesPainted > 0
      ? Number((netConsumedLitres / totalPiecesPainted).toFixed(4))
      : 0;

    const highWastageLogsCount = logs.filter(l => l.highWastageFlag).length;

    return {
      totalIssuedLitres,
      totalReturnedGoodLitres,
      totalFloorWastageLitres,
      netConsumedLitres,
      totalPiecesPainted,
      avgLitrePerPiece,
      highWastageLogsCount,
      logs
    };
  };

  // Painter Workload & Max-2 Active Jobs Guardrail Helpers
  const getPainterActiveJobCount = (painterNameOrId: string): number => {
    if (!painterNameOrId) return 0;
    const cleanTarget = painterNameOrId.trim().toLowerCase();
    return jobCards
      .filter(jc => matchesPlant(jc.plant, activePlant))
      .filter(jc => {
        const assigned = (jc.assignedPainterName || jc.painterName || '').trim().toLowerCase();
        const isMatchingPainter = assigned.includes(cleanTarget) || cleanTarget.includes(assigned);
        const isJobActive = jc.status !== 'Completed' && jc.status !== 'Closed' && jc.painterJobStatus !== 'Verified & Accepted';
        return isMatchingPainter && isJobActive;
      }).length;
  };

  const canAssignPainter = (painterNameOrId: string): boolean => {
    return getPainterActiveJobCount(painterNameOrId) < 2;
  };

  const assignJobCardToPainter = (jobCardNo: string, painterName: string): { success: boolean; error?: string } => {
    const currentActiveCount = getPainterActiveJobCount(painterName);
    if (currentActiveCount >= 2) {
      return {
        success: false,
        error: `Guardrail Blocked: Painter "${painterName}" already has ${currentActiveCount}/2 active jobs. Complete one job before assigning another.`
      };
    }

    setJobCards(prev => prev.map(jc => {
      if (jc.jobCardNo !== jobCardNo) return jc;
      return {
        ...jc,
        assignedPainterName: painterName,
        painterName: painterName,
        painterJobStatus: 'Assigned',
        status: jc.status === 'Open' ? 'In Process' : jc.status
      };
    }));

    return { success: true };
  };

  const startPainterJob = (jobCardNo: string, painterName: string) => {
    setJobCards(prev => prev.map(jc => {
      if (jc.jobCardNo !== jobCardNo) return jc;
      return {
        ...jc,
        assignedPainterName: jc.assignedPainterName || painterName,
        painterName: jc.painterName || painterName,
        painterJobStatus: 'In Progress',
        painterStartedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'In Process'
      };
    }));
  };

  const markPainterJobFinished = (jobCardNo: string, painterNotes?: string) => {
    setJobCards(prev => prev.map(jc => {
      if (jc.jobCardNo !== jobCardNo) return jc;
      return {
        ...jc,
        painterJobStatus: 'Painter Finished (Pending Review)',
        painterFinishedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        painterNotes: painterNotes || 'Work finished by painter and submitted for floor verification',
        status: 'In Process'
      };
    }));
  };

  const verifyAndAcceptJob = (jobCardNo: string, okQty: number, rejQty: number, remarks?: string) => {
    setJobCards(prev => prev.map(jc => {
      if (jc.jobCardNo !== jobCardNo) return jc;
      const totalCount = okQty + rejQty;
      const now = new Date();
      const isLate = jc.slaDeadline ? now > new Date(jc.slaDeadline) : false;

      return {
        ...jc,
        painterJobStatus: 'Verified & Accepted',
        verifiedBy: currentUser.name,
        verifiedAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        verificationRemarks: remarks || 'Floor inspected and accepted by Production Manager',
        status: 'Completed',
        goodQty: okQty,
        rejectQty: rejQty,
        sprayedQty: totalCount,
        firstPassGoodQty: okQty,
        closedAt: now.toISOString(),
        isOnTimeCompleted: !isLate,
        isSlaBreached: isLate
      };
    }));
  };

  const getPainterPerformanceStats = (painterNameOrId: string) => {
    if (!painterNameOrId) {
      return {
        totalJobs: 0,
        activeJobs: 0,
        completedJobs: 0,
        onTimeJobs: 0,
        delayedJobs: 0,
        onTimePercentage: 100,
        hasDelayedJobs: false,
        breachedJobCards: [] as JobCard[],
        onTimeJobCards: [] as JobCard[],
        passRate: 100,
        rating: 5.0
      };
    }
    const cleanTarget = painterNameOrId.trim().toLowerCase();
    const assignedJobs = jobCards.filter(jc => {
      const assignedName = (jc.assignedPainterName || jc.painterName || '').trim().toLowerCase();
      const assignedId = (jc.assignedPainterId || '').trim().toLowerCase();
      return assignedName.includes(cleanTarget) || cleanTarget.includes(assignedName) || assignedId === cleanTarget;
    });

    const active = assignedJobs.filter(j => j.status !== 'Completed' && j.status !== 'Closed' && j.painterJobStatus !== 'Verified & Accepted');
    const completed = assignedJobs.filter(j => j.status === 'Completed' || j.status === 'Closed' || j.painterJobStatus === 'Verified & Accepted');

    const breachedJobCards: JobCard[] = [];
    const onTimeJobCards: JobCard[] = [];

    assignedJobs.forEach(jc => {
      const isFinished = jc.status === 'Completed' || jc.status === 'Closed' || jc.painterJobStatus === 'Verified & Accepted';
      if (isFinished) {
        if (jc.isOnTimeCompleted === false || jc.isSlaBreached === true) {
          breachedJobCards.push(jc);
        } else {
          onTimeJobCards.push(jc);
        }
      } else {
        // If still active, check if deadline has already passed
        if (jc.slaDeadline && new Date() > new Date(jc.slaDeadline)) {
          breachedJobCards.push(jc);
        }
      }
    });

    const evaluatedCount = onTimeJobCards.length + breachedJobCards.length;
    const onTimePercentage = evaluatedCount > 0 ? Math.round((onTimeJobCards.length / evaluatedCount) * 100) : 100;
    const passRate = evaluatedCount > 0 ? onTimePercentage : 100;
    const rating = passRate >= 95 ? 5.0 : passRate >= 85 ? 4.8 : passRate >= 75 ? 4.2 : 3.8;

    return {
      totalJobs: assignedJobs.length,
      activeJobs: active.length,
      completedJobs: completed.length,
      onTimeJobs: onTimeJobCards.length,
      delayedJobs: breachedJobCards.length,
      onTimePercentage,
      hasDelayedJobs: breachedJobCards.length > 0,
      breachedJobCards,
      onTimeJobCards,
      passRate,
      rating
    };
  };

  const rejectAndRequestRework = (jobCardNo: string, reworkInstruction: string, defect: DefectCategory) => {
    setJobCards(prev => prev.map(jc => {
      if (jc.jobCardNo !== jobCardNo) return jc;
      return {
        ...jc,
        painterJobStatus: 'Rework Requested',
        reworkInstructions: reworkInstruction,
        defectCategory: defect,
        verificationRemarks: `Rework Flagged: ${reworkInstruction}`
      };
    }));
  };

  const pendingVerificationJobsCount = jobCards
    .filter(j => matchesPlant(j.plant, activePlant))
    .filter(j => j.painterJobStatus === 'Painter Finished (Pending Review)').length;

  // Single General Day Shift Day-End (EOD) Plant Shutdown
  const executeDayEndClosure = (notes?: string) => {
    const totalSprayed = jobCards.reduce((acc, curr) => acc + (curr.sprayedQty || 0), 0);
    const totalGood = jobCards.reduce((acc, curr) => acc + (curr.goodQty || 0), 0);
    const totalRework = jobCards.filter(j => j.jobCardType === 'rework_child' && j.status !== 'Completed').reduce((acc, curr) => acc + (curr.targetQty || 0), 0);
    const totalScrap = jobCards.reduce((acc, curr) => acc + (curr.scrapQty || 0), 0);

    const newClosure: PlantDayEndClosure = {
      id: `EOD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
      plant: activePlant,
      closureDate: new Date().toISOString().slice(0, 10),
      shiftName: 'General Day Shift (08:30 - 18:30)',
      totalPiecesSprayed: totalSprayed,
      totalFirstPassGood: totalGood,
      totalReworkInQueue: totalRework,
      totalScrap: totalScrap,
      overnightWipCount: 150,
      status: 'EOD Shutdown (Locked)',
      closedBy: currentUser.name,
      closedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      remarks: notes || 'Evening plant shutdown executed. Spray booths locked and WIP safely stored until morning.'
    };

    setDayEndClosures(prev => [newClosure, ...prev]);
    setIsPlantDayClosed(true);
  };

  const reopenPlant = () => {
    setIsPlantDayClosed(false);
  };

  // Quality Gate 1: Pre-Production Substrate & Pre-Treatment Inspection Report (PIR)
  const addPreProductionReport = (report: PreProductionInspectionRecord) => {
    setPreProductionReports(prev => [report, ...prev]);

    const isPassed = report.overallResult === 'Passed';
    const statusVal = isPassed ? 'Passed' : report.overallResult === 'Hold' ? 'Hold' : 'Rejected';

    // Update Job Card PIR Status Lot-Wide
    setJobCards(prev => prev.map(jc => {
      const matchExact = jc.jobCardNo && report.jobCardNo && jc.jobCardNo.toLowerCase() === report.jobCardNo.toLowerCase();
      const matchParent = (jc.parentJobCardId && report.jobCardNo && jc.parentJobCardId.toLowerCase() === report.jobCardNo.toLowerCase()) ||
                          (jc.jobCardNo && report.jobCardNo && jc.jobCardNo.toLowerCase() === report.jobCardNo.toLowerCase());
      const matchWo = jc.woNo && report.workOrderNo && jc.woNo.trim().toLowerCase() === report.workOrderNo.trim().toLowerCase();
      const matchLotCustomerPart = jc.customer && report.customer &&
                                   jc.customer.trim().toLowerCase() === report.customer.trim().toLowerCase() &&
                                   jc.partCode && report.partCode &&
                                   jc.partCode.trim().toLowerCase() === report.partCode.trim().toLowerCase();

      if (matchExact || matchParent || matchWo || matchLotCustomerPart) {
        return {
          ...jc,
          pirStatus: statusVal,
          pirReportNo: report.reportNo,
          pirPassedAt: isPassed ? (report.date || new Date().toISOString()) : undefined
        };
      }
      return jc;
    }));
  };

  // Quality FPA Golden Gate
  const createFPARecord = (fpaData: Omit<FPARecord, 'reportNo' | 'overallResult'>) => {
    // STRICT RULE: Delta-E <= deltaToleranceLimit (default 0.70) AND Adhesion == 100% AND crossCutTest == Pass
    const limit = fpaData.deltaToleranceLimit !== undefined ? fpaData.deltaToleranceLimit : 0.70;
    const isApproved = fpaData.deltaE <= limit && fpaData.adhesionPercent === 100 && fpaData.crossCutTest === 'Pass';
    const overallResult: FPARecord['overallResult'] = isApproved ? 'Approved' : 'Hold';

    const currentYear = new Date().getFullYear();
    const newFpa: FPARecord = {
      ...fpaData,
      reportNo: `PK-FPA-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`,
      overallResult
    };

    setFpaRecords(prev => [newFpa, ...prev]);

    // Update corresponding Job Card FPA status across all cards in the lot/batch family!
    setJobCards(prev => prev.map(jc => {
      const matchExact = jc.jobCardNo.toLowerCase() === fpaData.jobCardNo.toLowerCase();
      const matchParent = (jc.parentJobCardId && jc.parentJobCardId.toLowerCase() === fpaData.jobCardNo.toLowerCase()) ||
                          (fpaData.jobCardNo && jc.jobCardNo.toLowerCase() === fpaData.jobCardNo.toLowerCase());
      const matchWo = jc.woNo && fpaData.woNo && jc.woNo.trim().toLowerCase() === fpaData.woNo.trim().toLowerCase();
      const matchLotCustomerPart = jc.customer && fpaData.customer &&
                                   jc.customer.trim().toLowerCase() === fpaData.customer.trim().toLowerCase() &&
                                   jc.partCode && fpaData.partCode &&
                                   jc.partCode.trim().toLowerCase() === fpaData.partCode.trim().toLowerCase();

      if (matchExact || matchParent || matchWo || matchLotCustomerPart) {
        return { 
          ...jc, 
          fpaStatus: overallResult,
          fpaReportNo: newFpa.reportNo
        };
      }
      return jc;
    }));
  };

  const addFPATest = createFPARecord;

  // PROBLEM 1: Smart Billing Engine Toggle / Client Concession
  const toggleInvoiceExcessApproval = (invoiceNo: string, lineItemId: string) => {
    setBillingInvoices(prev => prev.map(inv => {
      if (inv.invoiceNo !== invoiceNo) return inv;

      let updatedTotalBilledQty = 0;
      const updatedLines = inv.lineItems.map(item => {
        if (item.id === lineItemId) {
          const newApproved = !item.excessApprovedByClient;
          // If approved by client, bill ordered + excess (e.g. 250 + 50 = 300). If not approved, bill ordered (250).
          const newBillable = newApproved ? item.orderedQty + item.excessQty : item.orderedQty;
          const newLineTotal = Math.round(newBillable * item.unitRate * 100) / 100;
          updatedTotalBilledQty += newBillable;
          return {
            ...item,
            excessApprovedByClient: newApproved,
            billableQty: newBillable,
            lineTotal: newLineTotal,
            status: (newApproved ? 'Contract Fulfilled' : (item.excessQty > 0 ? 'Excess On Hold' : 'Contract Fulfilled')) as BillableLineItem['status']
          };
        }
        updatedTotalBilledQty += item.billableQty;
        return item;
      });

      const newSubTotal = Math.round(updatedLines.reduce((acc, curr) => acc + curr.lineTotal, 0) * 100) / 100;
      // GST: CGST (9%) + SGST (9%) (Total 18%)
      const cgstAmount = Math.round(newSubTotal * 0.09 * 100) / 100;
      const sgstAmount = Math.round(newSubTotal * 0.09 * 100) / 100;
      const newGst = Math.round((cgstAmount + sgstAmount) * 100) / 100;
      const newGrand = Math.round((newSubTotal + newGst) * 100) / 100;

      return {
        ...inv,
        lineItems: updatedLines,
        subTotal: newSubTotal,
        gstPercent: 18,
        gstAmount: newGst,
        cgstAmount,
        sgstAmount,
        grandTotal: newGrand,
        totalBilledQty: updatedTotalBilledQty
      };
    }));
  };

  const toggleClientConcession = toggleInvoiceExcessApproval;

  const generateNewInvoiceFromPDI = (woNo: string) => {
    // Generate invoice from cleared PDI / OQC releases
    const releases = qualityReleases.filter(r => r.woNo === woNo);
    if (!releases.length) return;

    const newLines = releases.map((r, i) => {
      const isRed = r.color.includes('Red');
      const poOrdered = isRed ? 250 : 750;
      const unitRate = isRed ? 25 : 20;
      const billable = Math.min(r.passedQty, poOrdered);
      const excess = Math.max(0, r.passedQty - poOrdered);
      return {
        id: `li_${i}_${Date.now()}`,
        colorName: r.color,
        orderedQty: poOrdered,
        passedAndPackedQty: r.passedQty,
        billableQty: billable,
        excessQty: excess,
        excessApprovedByClient: false,
        unitRate,
        lineTotal: Math.round(billable * unitRate * 100) / 100,
        status: 'Contract Fulfilled' as const
      };
    });

    const subTotal = Math.round(newLines.reduce((acc, curr) => acc + curr.lineTotal, 0) * 100) / 100;
    const cgstAmount = Math.round(subTotal * 0.09 * 100) / 100;
    const sgstAmount = Math.round(subTotal * 0.09 * 100) / 100;
    const gstAmount = Math.round((cgstAmount + sgstAmount) * 100) / 100;
    const currentYear = new Date().getFullYear();

    const newInvoice: BillingInvoice = {
      invoiceNo: `PK-TAX-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      woNo,
      customer: releases[0].customer,
      plant: activePlant,
      lineItems: newLines,
      subTotal,
      gstPercent: 18,
      gstAmount,
      cgstAmount,
      sgstAmount,
      grandTotal: Math.round((subTotal + gstAmount) * 100) / 100,
      totalOrderedQty: newLines.reduce((acc, curr) => acc + curr.orderedQty, 0),
      totalBilledQty: newLines.reduce((acc, curr) => acc + curr.billableQty, 0),
      status: 'Generated',
      preparedBy: currentUser.name
    };

    setBillingInvoices(prev => [newInvoice, ...prev]);
    if (woNo) {
      setUniversalJobs(prev => prev.map(job => 
        job.jobNumber === woNo 
          ? { ...job, currentStage: '6. Billing Invoice' }
          : job
      ));
    }
  };

  const createCustomTaxInvoice = (invoice: BillingInvoice) => {
    setBillingInvoices(prev => {
      const exists = prev.some(inv => inv.invoiceNo === invoice.invoiceNo);
      if (exists) {
        return prev.map(inv => inv.invoiceNo === invoice.invoiceNo ? invoice : inv);
      }
      return [invoice, ...prev];
    });

    if (invoice.woNo) {
      setUniversalJobs(prev => prev.map(job => 
        job.jobNumber === invoice.woNo 
          ? { ...job, currentStage: '6. Billing Invoice' }
          : job
      ));
    }
  };

  const recordInvoicePayment = (invoiceNo: string, paymentRef: string) => {
    setBillingInvoices(prev => prev.map(inv => {
      if (inv.invoiceNo === invoiceNo) {
        return {
          ...inv,
          paymentStatus: 'Paid / Advance Verified',
          paymentRef,
          paymentDate: new Date().toISOString().split('T')[0],
          paymentReceivedBy: currentUser.name
        };
      }
      return inv;
    }));
  };

  const markInvoiceDispatched = (invoiceNo: string, gatePassNo: string) => {
    setBillingInvoices(prev => prev.map(inv => {
      if (inv.invoiceNo === invoiceNo) {
        return {
          ...inv,
          status: 'Dispatched',
          balanceBacklogNote: `Dispatched under Outward Gate Pass ${gatePassNo}`
        };
      }
      return inv;
    }));

    const invoice = billingInvoices.find(inv => inv.invoiceNo === invoiceNo);
    if (invoice?.woNo) {
      setUniversalJobs(prev => prev.map(job => 
        job.jobNumber === invoice.woNo 
          ? { ...job, currentStage: '7. Outward Dispatched' }
          : job
      ));
    }
  };

  const createGatePass = (gp: GatePassRecord) => {
    setGatePasses(prev => [gp, ...prev]);
  };

  const updateGatePassStatus = (gatePassNo: string, status: GatePassRecord['status']) => {
    setGatePasses(prev => prev.map(gp => gp.gatePassNo === gatePassNo ? { ...gp, status } : gp));
  };
  const addIQCRecord = (iqc: IQCInspectionRecord) => {
    setIqcRecords(prev => [iqc, ...prev]);
  };

  const submitMasterIQCReport = (report: IQCInspectionRecord) => {
    setIqcRecords(prev => {
      const filtered = prev.filter(r => r.reportNo !== report.reportNo);
      return [report, ...filtered];
    });

    // Link and update Material Inward Log status
    setMaterialInwardLogs(prev => prev.map(inw => {
      const isMatch = (report.inwardSrNo && inw.srNo === report.inwardSrNo) ||
                      (report.invoiceChallanNo && inw.challanNo === report.invoiceChallanNo) ||
                      (inw.iqcReportNo && inw.iqcReportNo === report.reportNo);
      if (isMatch) {
        return {
          ...inw,
          iqcStatus: report.status === 'Accepted' 
            ? 'Passed' 
            : report.status === 'Part Accepted'
              ? 'Part Accepted'
              : report.status === 'Rejected' 
                ? 'Rejected' 
                : report.hasDiscrepancy 
                  ? 'Discrepancy Halt' 
                  : 'Passed',
          iqcReportNo: report.reportNo,
          status: report.status === 'Accepted' 
            ? 'IQC Cleared - Awaiting Stores GRN' 
            : report.status === 'Part Accepted'
              ? 'Part Accepted - Ready for Stores GRN'
              : report.status === 'Rejected'
                ? 'IQC Rejected - Return to Party'
                : inw.status
        };
      }
      return inw;
    }));

    // Update GRN if matching
    setGrnList(prev => prev.map(grn => {
      if ((grn.sourceIqcReportNo && grn.sourceIqcReportNo === report.reportNo) || (report.inwardSrNo && grn.remarks?.includes(report.inwardSrNo))) {
        return {
          ...grn,
          iqcStatus: report.status === 'Accepted' ? 'Accepted' : report.status === 'Part Accepted' ? 'Part Accepted' : report.status === 'Rejected' ? 'Rejected' : 'Hold',
          actualReceivedQty: report.actualReceived || grn.actualReceivedQty
        };
      }
      return grn;
    }));
  };

  const addIPQCRecord = (ipqc: IPQCRecord) => {
    setIpqcRecords(prev => [ipqc, ...prev]);
  };

  const addOQCRelease = (release: FinalQualityRelease) => {
    setQualityReleases(prev => [release, ...prev]);

    // Automatically generate/update Tax Invoice for Billing Desk when OQC & PDI is cleared!
    if (release.pdiStatus === 'Cleared for Invoicing') {
      const isRed = release.color.includes('Red');
      const poOrdered = isRed ? 250 : 750;
      const unitRate = isRed ? 25 : 20;
      const billable = Math.min(release.passedQty, poOrdered);
      const excess = Math.max(0, release.passedQty - poOrdered);

      const lineItem: BillableLineItem = {
        id: `li_${Date.now()}`,
        colorName: release.color,
        orderedQty: poOrdered,
        passedAndPackedQty: release.passedQty,
        billableQty: billable,
        excessQty: excess,
        excessApprovedByClient: false,
        unitRate,
        lineTotal: Math.round(billable * unitRate * 100) / 100,
        status: 'Contract Fulfilled'
      };

      const subTotal = lineItem.lineTotal;
      const cgstAmount = Math.round(subTotal * 0.09 * 100) / 100;
      const sgstAmount = Math.round(subTotal * 0.09 * 100) / 100;
      const gstAmount = Math.round((cgstAmount + sgstAmount) * 100) / 100;
      const currentYear = new Date().getFullYear();

      const newInvoice: BillingInvoice = {
        invoiceNo: `PK-TAX-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`,
        invoiceDate: release.date || new Date().toISOString().split('T')[0],
        woNo: release.woNo,
        customer: release.customer,
        plant: release.plant || activePlant,
        lineItems: [lineItem],
        subTotal,
        gstPercent: 18,
        gstAmount,
        cgstAmount,
        sgstAmount,
        grandTotal: Math.round((subTotal + gstAmount) * 100) / 100,
        totalOrderedQty: poOrdered,
        totalBilledQty: billable,
        status: 'Generated',
        preparedBy: release.inspector || currentUser.name,
        balanceBacklogNote: `OQC Release ${release.releaseId} cleared. Billed strictly on ${billable} pcs passed.`
      };

      setBillingInvoices(prev => [newInvoice, ...prev]);
    }
  };

  const submitPdiClearance = (releaseId: string, pdiData: Partial<FinalQualityRelease>) => {
    setQualityReleases(prev => prev.map(rel => {
      if (rel.releaseId === releaseId || rel.woNo === releaseId) {
        const updated: FinalQualityRelease = {
          ...rel,
          ...pdiData,
          pdiStatus: pdiData.pdiStatus || 'Cleared for Invoicing',
          pdiDate: pdiData.pdiDate || new Date().toISOString().split('T')[0],
          pdiInspector: pdiData.pdiInspector || currentUser.name
        };

        if (updated.pdiStatus === 'Cleared for Invoicing') {
          // Re-link generated invoice directly into the quality release record
          generateNewInvoiceFromPDI(updated.woNo);
          const currentYear = new Date().getFullYear();
          updated.invoiceNumber = updated.invoiceNumber || `PK-TAX-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`;
        }

        return updated;
      }
      return rel;
    }));
  };

  // Module E: Audit Actions
  const updateAuditAnswer = (id: string, updates: Partial<AuditQuestionItem>) => {
    setAuditQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const resetAuditToStandard = () => {
    setAuditQuestions(INITIAL_MNC_AUDIT_QUESTIONS);
    localStorage.removeItem('pk_audit_questions');
  };

  // Module E / J: 8D CAPA Actions
  const addCapa8D = (capa: Capa8DRecord) => {
    setCapa8DList(prev => [capa, ...prev]);
  };

  const updateCapa8D = (id: string, updates: Partial<Capa8DRecord>) => {
    setCapa8DList(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  // Module E / J: 4M Change Control
  const addFourMChange = (change: FourMChangeRecord) => {
    setFourMChanges(prev => [change, ...prev]);
  };

  // Module C: Production Offering Report
  const addProductionOffering = (offering: ProductionOfferingReport) => {
    setProductionOfferings(prev => [offering, ...prev]);
  };

  const signProductionOffering = (
    id: string,
    stage: 'Prepared' | 'Checked' | 'QA' | 'Approved',
    signerName: string
  ) => {
    const timestamp = new Date().toLocaleString();
    setProductionOfferings(prev => prev.map(rep => {
      if (rep.id !== id) return rep;
      if (stage === 'Prepared') {
        return { ...rep, preparedBy: signerName, preparedDate: timestamp, status: 'Offered to QA' };
      } else if (stage === 'Checked') {
        return { ...rep, checkedBy: signerName, checkedDate: timestamp };
      } else if (stage === 'QA') {
        return { ...rep, qaCheckedBy: signerName, qaDate: timestamp, status: 'QA Inspected' };
      } else if (stage === 'Approved') {
        return { ...rep, approvedBy: signerName, approvalDate: timestamp, status: 'Approved' };
      }
      return rep;
    }));
  };

  // Module A: HR Leave Actions (Format A.12)
  const addHRLeave = (leave: HRLeaveRecord) => {
    setHrLeaves(prev => [leave, ...prev]);
  };

  const approveHRLeave = (
    id: string,
    stage: 'Dept Incharge' | 'HR' | 'MD',
    status: 'Approved' | 'Rejected',
    remarks?: string,
    signerName?: string
  ) => {
    const timestamp = new Date().toLocaleString();
    setHrLeaves(prev => (prev || []).filter((l): l is HRLeaveRecord => Boolean(l && l.id)).map(lv => {
      if (lv.id !== id) return lv;
      if (stage === 'Dept Incharge') {
        return {
          ...lv,
          deptInchargeStatus: status === 'Approved' ? 'Recommended' : 'Rejected',
          deptInchargeRemarks: remarks,
          deptInchargeName: signerName || currentUser.name,
          deptInchargeSignDate: timestamp,
          finalStatus: status === 'Approved' ? 'In Review' : 'Rejected'
        };
      } else if (stage === 'HR') {
        return {
          ...lv,
          hrStatus: status === 'Approved' ? 'Verified' : 'Rejected',
          hrRemarks: remarks,
          hrName: signerName || currentUser.name,
          hrSignDate: timestamp,
          finalStatus: status === 'Approved' ? 'In Review' : 'Rejected'
        };
      } else if (stage === 'MD') {
        return {
          ...lv,
          mdStatus: status === 'Approved' ? 'Sanctioned' : 'Rejected',
          mdName: signerName || currentUser.name,
          mdSignDate: timestamp,
          finalStatus: status === 'Approved' ? 'Sanctioned' : 'Rejected'
        };
      }
      return lv;
    }));
  };

  // Module K: Calibration Actions
  const updateCalibration = (id: string, updates: Partial<CalibrationRecord>) => {
    setCalibrationList(prev => prev.map(cal => cal.id === id ? { ...cal, ...updates } : cal));
  };

  // Strict 5-Stage Sequential Quality Gatekeeper Functions
  const canIssueJobCard = (grnNo: string): { allowed: boolean; reason?: string } => {
    const grn = grnList.find(g => g.grnNo === grnNo);
    if (!grn) return { allowed: false, reason: 'GRN record not found in system.' };
    if (grn.iqcStatus === 'Rejected' || grn.iqcStatus === 'Hold') {
      return { allowed: false, reason: `Gate 1 Block: GRN ${grnNo} is on IQC ${grn.iqcStatus}. Raw substrate cannot be issued to Job Card.` };
    }
    return { allowed: true };
  };

  const canStartBulkProduction = (jobCardNo: string): { allowed: boolean; reason?: string; fpaReportNo?: string } => {
    const jc = jobCards.find(j => j.jobCardNo === jobCardNo);
    if (!jc) return { allowed: false, reason: 'Job Card not found.' };

    // Check if Job Card is directly marked approved or has an approved FPA in the lot family
    if (jc.fpaStatus === 'Approved') {
      return { allowed: true, fpaReportNo: jc.fpaReportNo };
    }

    const matchingFpa = fpaRecords.find(f => {
      if (f.overallResult !== 'Approved') return false;
      const directMatch = f.jobCardNo.toLowerCase() === jobCardNo.toLowerCase();
      const parentMatch = jc.parentJobCardId && f.jobCardNo.toLowerCase() === jc.parentJobCardId.toLowerCase();
      const woMatch = jc.woNo && f.woNo && jc.woNo.trim().toLowerCase() === f.woNo.trim().toLowerCase();
      const customerPartMatch = jc.customer && f.customer &&
                                jc.customer.trim().toLowerCase() === f.customer.trim().toLowerCase() &&
                                jc.partCode && f.partCode &&
                                jc.partCode.trim().toLowerCase() === f.partCode.trim().toLowerCase();
      return directMatch || parentMatch || woMatch || customerPartMatch;
    });

    if (!matchingFpa) {
      return {
        allowed: false,
        reason: `Gate 2 Block (FPA Golden Gate): No approved First Part Approval found for ${jobCardNo} or its lot (${jc.customer} - ${jc.partCode}). Spectrophotometer ΔE ≤ 0.70 and 100% tape adhesion approval required before bulk spray run.`
      };
    }
    return { allowed: true, fpaReportNo: matchingFpa.reportNo };
  };

  const canPrintPackingSlip = (jobCardNo: string): { allowed: boolean; reason?: string } => {
    const jc = jobCards.find(j => j.jobCardNo === jobCardNo);
    if (!jc) return { allowed: false, reason: 'Job Card not found.' };
    const rel = qualityReleases.find(q => q.woNo === jc.woNo || q.partCode === jc.partCode);
    if (rel && (rel.oqcStatus === 'Rejected' || rel.pdiStatus === 'Hold')) {
      return {
        allowed: false,
        reason: `Gate 5 Block (PDI Release): Outgoing quality release is on ${rel.oqcStatus} / ${rel.pdiStatus}. 4"x6" Thermal Packing Slip cannot be released.`
      };
    }
    return { allowed: true };
  };

  // Counts for Top Notification badges
  const openOverrunCount = jobCards.filter(jc => jc.status === 'Over-Run Flagged').length;

  return (
    <PortalContext.Provider
      value={{
        currentUser,
        switchUser,
        canSwitchPlant,
        logoutUser,
        activePlant,
        setActivePlant,
        activeShift,
        setActiveShift,
        universalJobs,
        addUniversalJob,
        submitPreSprayIQC,
        submitFinalQA,
        advanceJobStage,
        grnList,
        iqcRecords,
        jobCards,
        painters,
        paintingBooths,
        addPaintingBooth,
        updatePaintingBooth,
        deletePaintingBooth,
        toggleBoothStatus,
        addPainter,
        updatePainter,
        deletePainter,
        togglePainterStatus,
        pendingVerificationJobsCount,
        getPainterActiveJobCount,
        canAssignPainter,
        assignJobCardToPainter,
        startPainterJob,
        markPainterJobFinished,
        verifyAndAcceptJob,
        rejectAndRequestRework,
        getPainterPerformanceStats,
        preProductionReports,
        addPreProductionReport,
        fpaRecords,
        paintMixing,
        ipqcRecords,
        packingSlips,
        qualityReleases,
        billingInvoices,
        gatePasses,
        materialInwardLogs,
        materialOutwardLogs,
        defects,
        materialRequisitions,
        createMaterialRequisition,
        issueMaterialRequisition,
        acceptMaterialRequisition,
        addGRN,
        addIQCRecord,
        submitMasterIQCReport,
        addIPQCRecord,
        addOQCRelease,
        submitPdiClearance,
        getNextUniqueJobCardNo,
        addJobCard,
        deleteJobCard,
        updateJobCard,
        addJobCardProgressLog,
        updateSamplingRecipe,
        updateSamplingPartyStatus,
        lockSamplingAsMasterRecipe,
        createMultiPainterJobCards,
        addMaterialInwardRecord,
        addMaterialOutwardRecord,

        updateJobCardProgress,
        updateJobCardSprayed,
        createFPARecord,
        addFPATest,
        toggleInvoiceExcessApproval,
        toggleClientConcession,
        generateNewInvoiceFromPDI,
        createCustomTaxInvoice,
        recordInvoicePayment,
        markInvoiceDispatched,
        createGatePass,
        updateGatePassStatus,
        openOverrunCount,

        // Module E: MNC Audit
        auditQuestions,
        updateAuditAnswer,
        resetAuditToStandard,

        // Module E / J: 8D CAPA & 4M
        capa8DList,
        addCapa8D,
        updateCapa8D,
        fourMChanges,
        addFourMChange,

        // Module C: Production Offering
        productionOfferings,
        addProductionOffering,
        signProductionOffering,

        // Module A: HR Leaves
        hrLeaves,
        addHRLeave,
        approveHRLeave,

        // Module K: Calibration
        calibrationList,
        updateCalibration,

        // Gatekeeper helpers
        canIssueJobCard,
        canStartBulkProduction,
        canPrintPackingSlip,

        // 3-Painters, Rework & Single Shift Day-End Operations
        dayEndClosures,
        isPlantDayClosed,
        splitJobCardToPainters,
        routeToRework,
        passReworkClearance,
        updateJobCardStageReceipt,
        addPackingSlip,
        executeDayEndClosure,
        reopenPlant,
        plantHeadPriorities,
        assignProductionPriority,
        updatePriorityStatus,
        activeSubTab,
        setActiveSubTab,

        // 3-Tier Spray Painting Job Card Architecture (PK-OS 2026)
        painterAssignments,
        assignmentMaterialLogs,
        createPainterAssignment,
        closePainterAssignment,
        issueAssignmentMaterials,
        requestAssignmentChemicals,
        addTargetToPainterAssignment,
        updateAssignmentMaterialLog,
        recordAssignmentStageOutput,
        getPainterConsumablesLedger,

        // Store Role Upgrade: Batch-Wise Stock, FIFO/FEFO & Balance Returns (PK-OS Upgrade)
        stockBatches,
        fifoOverrideLogs,
        balanceReturnSlips,
        addStockBatch,
        updateStockBatch,
        issueMaterialRequisitionWithBatches,
        createBalanceReturnSlip,
        acceptBalanceReturnSlip,
        flagBalanceReturnDiscrepancy,
        supervisorSignOffBalanceReturn,
        plantShiftConfig,
        updatePlantShiftConfig,
        executePlantClosingReconciliation,
        requestNextDayTarget
      }}
    >
      {children}
    </PortalContext.Provider>
  );
};

export const usePortalStore = () => {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error('usePortalStore must be used within a PortalProvider');
  }
  return context;
};
