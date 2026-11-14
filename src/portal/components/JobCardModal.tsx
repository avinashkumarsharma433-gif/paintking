import React, { useState, useEffect, useMemo } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { 
  JobCard, 
  IssuedMaterialItem, 
  JobCardProductionProgressLog,
  DefectCategory,
  CoatingProcessStage,
  DailyMaterialConsumptionSnapshot,
  JobCardDailyTargetRecord,
  PreProductionInspectionRecord,
  FPARecord,
  IPQCRecord,
  PainterAssignment,
  AssignmentProcessStage
} from '../types/portalTypes';
import { 
  Plus, 
  Trash2, 
  Save, 
  Printer, 
  Layers, 
  Building2, 
  CheckCircle2, 
  Clock, 
  History, 
  TrendingUp, 
  AlertCircle,
  Paintbrush,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Calendar,
  X,
  FileText,
  PackageCheck,
  Download,
  ChevronDown,
  Check,
  Lock,
  Unlock,
  Edit3,
  Tag,
  Eye,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Users,
  User,
  Rocket
} from 'lucide-react';
import { PaintkingDatePicker } from './PaintkingDatePicker';
import { PaintkingDateTimePicker } from './PaintkingDateTimePicker';
import { CustomCombobox, ComboboxOption } from './CustomCombobox';
import { TypeableDropdown } from './TypeableDropdown';
import { matchesPlant } from '../utils/portalAuth';
import { 
  downloadStandardJobCardPdf,
  downloadStandardPreProductionPdf,
  downloadStandardFPAPdf,
  downloadStandardIPQCPdf,
  downloadStandardProductionOfferingPdf
} from '../utils/pdfStandardHeader';
import { BalanceReturnModal } from './BalanceReturnModal';
import { PreProductionInspectionModal } from './PreProductionInspectionModal';
import { FPAModal } from './FPAModal';
import { IPQCModal } from './IPQCModal';
import { DailyAssignmentModal } from './DailyAssignmentModal';

interface JobCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: JobCard;
}

const DEFECT_LABELS: Record<DefectCategory, string> = {
  dust_nibs: 'Dust Nibs / Air Lint (D01)',
  paint_run: 'Paint Run / Sagging (D02)',
  orange_peel: 'Orange Peel / Texture (D03)',
  scratch: 'Scratch / Handling Scuff (D04)',
  undercoat_show: 'Undercoat Show / Low Film (D05)',
  shade_deviation: 'Shade / Color Mismatch (D06)',
  pinhole: 'Pinholes / Solvent Pop (D07)',
  none: 'No Specific Defect / Floor Scrap'
};

const DEFECT_PRESET_OPTIONS = [
  'Dust Nibs / Air Lint (D01)',
  'Paint Run / Sagging (D02)',
  'Orange Peel / Texture (D03)',
  'Scratch / Handling Scuff (D04)',
  'Undercoat Show / Low Film (D05)',
  'Shade / Color Mismatch (D06)',
  'Pinholes / Solvent Pop (D07)',
  'Edge Dry Spray / Thin Coat',
  'Water Spots / Rinse Marks',
  'Moulding Flash / Parting Line Burr',
  'Contamination / Substrate Spot'
];

const ISO_REWORK_ACTIONS = [
  '2000-Grit Wet Sanding + Re-Clear Coat',
  'De-nibbing & Machine Compound Buffing',
  'Spot Feather Sanding & Local Shade Touch-Up',
  'Chemical Strip & Complete Surface Re-Spray',
  'Oven Re-bake & Cure Cycle (65°C / 45m)',
  'Direct Machine Polish (Minor Surface Scuff)'
];

interface StageConfig {
  key: CoatingProcessStage;
  num: number;
  label: string;
  shortLabel: string;
  description: string;
  badge: string;
}

const getStagesForProcess = (processType?: string): StageConfig[] => {
  const p = (processType || '').toLowerCase();
  if (p.includes('hydrographic')) {
    return [
      {
        key: 'stage_1_primer',
        num: 1,
        label: 'Stage 1: Basecoat Ground Tone & Prep',
        shortLabel: 'Base Ground',
        description: 'Base color adhesion undercoat',
        badge: 'Ground Coat'
      },
      {
        key: 'stage_2_basecoat',
        num: 2,
        label: 'Stage 2: 3D PVA Immersion Dipping & Rinse',
        shortLabel: '3D Dipping',
        description: 'Water film transfer pattern & warm rinse',
        badge: 'Hydro Dipped'
      },
      {
        key: 'stage_3_topcoat',
        num: 3,
        label: 'Stage 3: 2K Clear Topcoat & Oven Bake',
        shortLabel: 'Clear & QC',
        description: 'Protective gloss lacquer & oven curing',
        badge: 'Clear Topcoat'
      }
    ];
  }
  if (p.includes('digital') || p.includes('uv')) {
    return [
      {
        key: 'stage_1_primer',
        num: 1,
        label: 'Stage 1: Antistatic Primer Wipe & Prep',
        shortLabel: 'Primer Wipe',
        description: 'Solvent wipe and adhesion promoter',
        badge: 'Pre-Treated'
      },
      {
        key: 'stage_2_basecoat',
        num: 2,
        label: 'Stage 2: 1440 DPI Direct UV Print Pass',
        shortLabel: 'UV Print',
        description: 'Flatbed piezoelectric multi-pass print',
        badge: 'UV Printed'
      },
      {
        key: 'stage_3_topcoat',
        num: 3,
        label: 'Stage 3: UV Hardened Clear Topcoat & QC',
        shortLabel: 'UV Clear',
        description: 'Instant LED UV clear curing & final QC',
        badge: 'Final Inspected'
      }
    ];
  }
  if (p.includes('mould') || p.includes('mold') || p.includes('injection')) {
    return [
      {
        key: 'stage_1_primer',
        num: 1,
        label: 'Stage 1: Injection Moulding Machine Cycle',
        shortLabel: 'Moulding',
        description: 'Tool clamping, polymer melt shot & chill',
        badge: 'Moulded'
      },
      {
        key: 'stage_2_basecoat',
        num: 2,
        label: 'Stage 2: Degating, Deflashing & Trimming',
        shortLabel: 'Deflash',
        description: 'Runner trimming, sink mark & flash inspection',
        badge: 'Deflashed'
      },
      {
        key: 'stage_3_topcoat',
        num: 3,
        label: 'Stage 3: Annealing & Dimensional Final QC',
        shortLabel: 'QC & Pack',
        description: 'Stress relief bake and micrometer clearance',
        badge: 'Approved Pcs'
      }
    ];
  }
  // Default: Liquid PU Spray Painting
  return [
    {
      key: 'stage_1_primer',
      num: 1,
      label: 'Stage 1: Pre-Treatment & Primer Undercoat',
      shortLabel: 'Primer Undercoat',
      description: 'Surface degrease, flame treat & adhesion primer',
      badge: 'Primer Coat'
    },
    {
      key: 'stage_2_basecoat',
      num: 2,
      label: 'Stage 2: Basecoat Colour Application',
      shortLabel: 'Basecoat Colour',
      description: 'Shade coat application & flash-off',
      badge: 'Colour Coat'
    },
    {
      key: 'stage_3_topcoat',
      num: 3,
      label: 'Stage 3: 2K PU Clear Lacquer & Oven Cure',
      shortLabel: 'Clear Topcoat',
      description: 'High-gloss/matt clear protection & 65°C bake',
      badge: 'Clear & QC'
    }
  ];
};

const STEP_TITLES = [
  '1. Master Order Details (Tier 1)',
  '2. Substrate & Overall SLA (Tier 1)',
  '3. Painter Shift Quotas (Tier 2)',
  '4. Company Consumables & Launch (Tier 3)'
];

export const JobCardModal: React.FC<JobCardModalProps> = ({ isOpen, onClose, initialData }) => {
  const { 
    addJobCard, 
    updateJobCard,
    addJobCardProgressLog,
    activePlant, 
    currentUser, 
    grnList, 
    jobCards, 
    painters, 
    paintingBooths,
    getPainterActiveJobCount,
    balanceReturnSlips,
    preProductionReports,
    fpaRecords,
    ipqcRecords,
    painterAssignments,
    assignmentMaterialLogs,
    deleteJobCard,
    createPainterAssignment,
    issueAssignmentMaterials,
    updateAssignmentMaterialLog,
    recordAssignmentStageOutput
  } = usePortalStore();

  const [viewMode, setViewMode] = useState<'PORTAL' | 'PRINT'>('PORTAL');
  const [showReturnModal, setShowReturnModal] = useState<boolean>(false);

  // Metadata
  const isExistingCard = Boolean(initialData?.jobCardNo && jobCards.some(j => j.jobCardNo === initialData.jobCardNo));
  const docNo = initialData?.docNo || 'Doc No: 001';
  const revNo = initialData?.revNo || 'Rev.No: 01';
  const revDate = initialData?.revDate || new Date().toISOString().split('T')[0];

  // Current Step in the Single-Point Wizard (1, 2, 3, or 4)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // =========================================================================
  // POINT 1: Party & Work Order Details
  // =========================================================================
  const [jobCardNo, setJobCardNo] = useState<string>(initialData?.jobCardNo || `JC-2026-${String(jobCards.length + 1).padStart(3, '0')}`);
  const [selectedGrnNo, setSelectedGrnNo] = useState<string>(initialData?.sourceGrnNo || (initialData as any)?.grnNo || '');
  const [customer, setCustomer] = useState<string>(initialData?.customer || '');
  const [wNo, setWNo] = useState<string>(initialData?.wNo || initialData?.woNo || '');
  const [processType, setProcessType] = useState<string>(
    initialData?.processType || 'Liquid PU Spray Painting'
  );
  // System auto-registers current issue date and time in the background
  const [issueDate] = useState<string>(initialData?.issueDate || new Date().toISOString().split('T')[0]);
  const [issueTime] = useState<string>(
    initialData?.issueTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  // =========================================================================
  // POINT 2: Substrate, Pieces & Colour
  // =========================================================================
  const [partCode, setPartCode] = useState<string>(initialData?.partCode || '');
  const [partDescription, setPartDescription] = useState<string>(
    initialData?.partDescription || ''
  );
  const [targetQty, setTargetQty] = useState<number>(initialData?.targetQty || 100);
  const [dailyTargetQty, setDailyTargetQty] = useState<number>(() => {
    if (initialData?.dailyTargetQty) return initialData.dailyTargetQty;
    const t = initialData?.targetQty || 100;
    return t > 1000 ? Math.min(2000, t) : t;
  });
  const [batchColor, setBatchColor] = useState<string>(initialData?.color || '');

  // =========================================================================
  // POINT 3: Painter, Booth & Strict Deadline
  // =========================================================================
  const [painterName, setPainterName] = useState<string>(
    initialData?.assignedPainterName || initialData?.painterName || painters[0]?.name || 'Ramesh Kumar (P1)'
  );
  const [assignedPainterId, setAssignedPainterId] = useState<string>(
    initialData?.assignedPainterId || painters[0]?.id || 'PAINTER-01'
  );
  const [dept, setDept] = useState<string>(initialData?.dept || 'Booth #1 (Continuous Conveyor Line)');
  
  // Strict Deadline Date & Time
  const defaultDeadlineDate = () => {
    if (initialData?.deadlineDate) return initialData.deadlineDate;
    if (initialData?.slaDeadline) return initialData.slaDeadline.split('T')[0];
    const d = new Date();
    d.setHours(d.getHours() + 4);
    return d.toISOString().split('T')[0];
  };

  const defaultDeadlineTime = () => {
    if (initialData?.deadlineTime) return initialData.deadlineTime;
    if (initialData?.slaDeadline) {
      const d = new Date(initialData.slaDeadline);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const d = new Date();
    d.setHours(d.getHours() + 4);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const [deadlineDate, setDeadlineDate] = useState<string>(defaultDeadlineDate);
  const [deadlineTime, setDeadlineTime] = useState<string>(defaultDeadlineTime);
  const [slaHours, setSlaHours] = useState<number>(initialData?.slaHours || 4);

  // Tier-2 Shift Painter Line Allocations (Multi-Painter Shift Quotas)
  const [initialPainterAllocs, setInitialPainterAllocs] = useState<Array<{
    id: string;
    painterId: string;
    painterName: string;
    boothNumber: string;
    processStage: AssignmentProcessStage;
    colorShade?: string;
    dailyTargetQty: number;
  }>>(() => [
    {
      id: 'alloc-1',
      painterId: initialData?.assignedPainterId || painters[0]?.id || 'PAINTER-01',
      painterName: initialData?.assignedPainterName || initialData?.painterName || painters[0]?.name || 'Ramesh Kumar (P1)',
      boothNumber: initialData?.dept || paintingBooths[0]?.name || 'Booth #1 (Continuous Conveyor Line)',
      processStage: 'Full Coating System',
      colorShade: initialData?.color && initialData.color !== 'Multi-Colour / Painter-Wise' ? initialData.color : '',
      dailyTargetQty: initialData?.dailyTargetQty || (initialData?.targetQty ? Math.min(2000, initialData.targetQty) : 100)
    }
  ]);

  const handleAddPainterAlloc = () => {
    const nextIdx = initialPainterAllocs.length + 1;
    const fallbackPainter = painters[nextIdx - 1] || painters[0] || { id: `P-${nextIdx}`, name: `Painter ${nextIdx}` };
    const fallbackBooth = paintingBooths[nextIdx - 1] || paintingBooths[0] || { name: `Booth #${nextIdx}` };
    const totalAllocated = initialPainterAllocs.reduce((sum, a) => sum + (Number(a.dailyTargetQty) || 0), 0);
    const remaining = Math.max(0, targetQty - totalAllocated);
    setInitialPainterAllocs(prev => [
      ...prev,
      {
        id: `alloc-${Date.now()}-${nextIdx}`,
        painterId: fallbackPainter.id,
        painterName: fallbackPainter.name,
        boothNumber: fallbackBooth.name,
        processStage: 'Full Coating System',
        colorShade: batchColor || '',
        dailyTargetQty: remaining > 0 ? Math.min(remaining, 1000) : 500
      }
    ]);
  };

  const handleRemovePainterAlloc = (id: string) => {
    if (initialPainterAllocs.length <= 1) return;
    setInitialPainterAllocs(prev => prev.filter(a => a.id !== id));
  };

  const handleUpdatePainterAlloc = (id: string, fieldOrUpdates: string | Record<string, any>, value?: any) => {
    setInitialPainterAllocs(prev => prev.map(a => {
      if (a.id !== id) return a;
      if (typeof fieldOrUpdates === 'object') {
        return { ...a, ...fieldOrUpdates };
      }
      if (fieldOrUpdates === 'painterName') {
        const matched = painters.find(p => p.name === value);
        return { ...a, painterName: value, painterId: matched?.id || `PAINTER-${Date.now()}` };
      }
      return { ...a, [fieldOrUpdates]: value };
    }));
  };

  const totalAllocatedShift = useMemo(() => {
    return initialPainterAllocs.reduce((sum, a) => sum + (Number(a.dailyTargetQty) || 0), 0);
  }, [initialPainterAllocs]);

  // =========================================================================
  // POINT 4: Company Issued Materials Table (Paints & Thinners)
  // =========================================================================
  // Helper to extract strictly company consumables (excluding party raw substrates)
  const sanitizeCompanyMaterials = (items?: IssuedMaterialItem[], targetSubstrateDesc?: string) => {
    if (!items || items.length === 0) return [];
    const partDescLower = (targetSubstrateDesc || '').toLowerCase().trim();
    return items.filter(item => {
      const uomLower = (item.uom || '').toLowerCase().trim();
      const descLower = (item.itemDescription || '').toLowerCase().trim();
      const isParty = 
        item.category === 'PARTY_MATERIAL' || 
        item.materialType === 'substrate' || 
        uomLower === 'pcs' || 
        uomLower === 'pieces' || 
        uomLower === 'nos' ||
        (partDescLower && descLower.includes(partDescLower)) ||
        (descLower.includes('substrate') && !descLower.includes('paint') && !descLower.includes('primer')) ||
        (descLower.includes('bezel') && !descLower.includes('paint') && !descLower.includes('primer'));
      return !isParty;
    });
  };

  const [issuedMaterials, setIssuedMaterials] = useState<IssuedMaterialItem[]>(() => {
    const rawList = initialData?.issuedMaterials;
    const sanitized = sanitizeCompanyMaterials(rawList, initialData?.partDescription);
    if (sanitized.length > 0) {
      return sanitized;
    }
    const basePcs = initialData?.targetQty || 250;
    const estPaintLitres = Math.max(1, Math.ceil((basePcs / 500) * 8));
    return [
      {
        id: '1',
        itemDescription: `${initialData?.color || 'Monza Red Gloss'} 2K PU Basecoat Paint (PPG)`,
        materialType: 'paint',
        category: 'COMPANY_CONSUMABLE',
        qty: estPaintLitres,
        consumedQty: 0,
        floorBalanceQty: estPaintLitres,
        colour: initialData?.color || 'Monza Red Gloss',
        uom: 'Litres',
        remark: 'Mix ratio 4:1:1'
      },
      {
        id: '2',
        itemDescription: 'PU Thinner 400 Solvent',
        materialType: 'thinner',
        category: 'COMPANY_CONSUMABLE',
        qty: Math.max(1, Math.ceil(estPaintLitres * 0.4)),
        consumedQty: 0,
        floorBalanceQty: Math.max(1, Math.ceil(estPaintLitres * 0.4)),
        colour: 'Clear',
        uom: 'Litres',
        remark: 'Viscosity control solvent'
      },
      {
        id: '3',
        itemDescription: '2K Scratch-Resistant Hardener',
        materialType: 'hardener',
        category: 'COMPANY_CONSUMABLE',
        qty: Math.max(1, Math.ceil(estPaintLitres * 0.25)),
        consumedQty: 0,
        floorBalanceQty: Math.max(1, Math.ceil(estPaintLitres * 0.25)),
        colour: 'Clear',
        uom: 'Litres',
        remark: 'Reaction curing agent'
      },
      {
        id: '4',
        itemDescription: '2K Polyurethane Clear Lacquer Topcoat',
        materialType: 'clear_coat',
        category: 'COMPANY_CONSUMABLE',
        qty: Math.max(1, Math.ceil(basePcs / 200)),
        consumedQty: 0,
        floorBalanceQty: Math.max(1, Math.ceil(basePcs / 200)),
        colour: 'Clear Gloss',
        uom: 'Litres',
        remark: 'Protective topcoat layer'
      }
    ];
  });

  // =========================================================================
  // LIVE PROCESS TRACKER & INCREMENTAL BATCH OUTPUT LOGGING
  // =========================================================================
  const [currentGoodQty, setCurrentGoodQty] = useState<number>(initialData?.goodQty || 0);
  const [currentReworkQty, setCurrentReworkQty] = useState<number>(initialData?.reworkQty || initialData?.reworkRecoveredQty || 0);
  const [currentRejectQty, setCurrentRejectQty] = useState<number>(initialData?.rejectQty || 0);
  const [liveProgressLogs, setLiveProgressLogs] = useState<JobCardProductionProgressLog[]>(initialData?.progressLogs || []);

  const [selectedStage, setSelectedStage] = useState<CoatingProcessStage>('stage_1_primer');
  const [showOutputLogger, setShowOutputLogger] = useState<boolean>(false);
  const [logPiecesSprayed, setLogPiecesSprayed] = useState<number>(100);
  const [logGoodPieces, setLogGoodPieces] = useState<number>(95);
  const [logReworkPieces, setLogReworkPieces] = useState<number>(3);
  const [logRejectPieces, setLogRejectPieces] = useState<number>(2);
  const [logDefectCategory, setLogDefectCategory] = useState<DefectCategory>('dust_nibs');
  const [logDefectReason, setLogDefectReason] = useState<string>('Dust Nibs / Air Lint (D01)');
  const [logReworkAction, setLogReworkAction] = useState<string>('2000-Grit Wet Sanding + Re-Clear Coat');
  const [logTimeInput, setLogTimeInput] = useState<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [logRemarksInput, setLogRemarksInput] = useState<string>('');

  // Step 2 Color dropdown state
  const [showColorDropdown, setShowColorDropdown] = useState<boolean>(false);

  // Dedicated Audit Trail Popup Modal state
  const [showAuditLogsModal, setShowAuditLogsModal] = useState<boolean>(false);

  // Dedicated Tab state for Existing Job Card ('EXECUTION' | 'PAINTER_ASSIGNMENTS' | 'QUALITY')
  const [existingCardTab, setExistingCardTab] = useState<'EXECUTION' | 'PAINTER_ASSIGNMENTS' | 'QUALITY'>('EXECUTION');

  // Selected Painter Filter inside Merged Tab 2 ('' before init -> auto-selects first painter; 'ALL' -> All Painters)
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');

  // Inline Chemical Issue & Usage Update states inside Merged Tab 2
  const [showIssueChemDrawer, setShowIssueChemDrawer] = useState<boolean>(false);
  const [chemName, setChemName] = useState<string>('Basecoat 2K PU Paint');
  const [chemType, setChemType] = useState<'Base Paint' | 'Topcoat' | 'Hardener' | 'Thinner' | 'Cleaning Solvent'>('Base Paint');
  const [chemBatch, setChemBatch] = useState<string>('');
  const [chemQty, setChemQty] = useState<number>(10);
  const [chemUom, setChemUom] = useState<'Litres' | 'Kg' | 'Pcs'>('Litres');
  const [editingMatLogId, setEditingMatLogId] = useState<string | null>(null);
  const [editGoodReturnQty, setEditGoodReturnQty] = useState<number>(0);
  const [editFloorWasteQty, setEditFloorWasteQty] = useState<number>(0);
  const [editMatBatch, setEditMatBatch] = useState<string>('');

  // 3-Tier Daily Assignment Modal inside JobCardModal
  const [showDailyAssignModal, setShowDailyAssignModal] = useState<boolean>(false);

  // Quality Gates Modals State
  const [showPirModal, setShowPirModal] = useState<boolean>(false);
  const [showFpaModal, setShowFpaModal] = useState<boolean>(false);
  const [showIpqcModal, setShowIpqcModal] = useState<boolean>(false);

  // Quality Records & Live Status for Current Job Card
  const activePirRecord = useMemo(() => {
    return preProductionReports.find(r => r.jobCardNo === jobCardNo);
  }, [preProductionReports, jobCardNo]);
  const isPirPassed = activePirRecord?.overallResult === 'Passed';

  const activeFpaRecord = useMemo(() => {
    return fpaRecords.find(r => r.jobCardNo === jobCardNo);
  }, [fpaRecords, jobCardNo]);
  const isFpaApproved = activeFpaRecord?.overallResult === 'Approved';

  const activeIpqcRecords = useMemo(() => {
    return ipqcRecords.filter(r => r.jobCardNo === jobCardNo || (r.woNo && (r.woNo === wNo || r.workOrderNo === wNo)));
  }, [ipqcRecords, jobCardNo, wNo]);

  const currentJcForModals: JobCard = useMemo(() => {
    const liveJc = jobCards.find(j => j.jobCardNo === jobCardNo);
    if (liveJc) {
      return {
        ...liveJc,
        goodQty: Math.max(liveJc.goodQty || 0, currentGoodQty || 0)
      };
    }
    return initialData || ({
      id: jobCardNo,
      jobCardNo,
      docNo,
      revNo,
      revDate,
      customer,
      wNo,
      woNo: wNo,
      sourceGrnNo: selectedGrnNo,
      partName: partDescription,
      partDescription,
      partCode,
      rawPartCode: partCode,
      substrateMaterial: (initialData as any)?.substrateMaterial || 'ABS (Acrylonitrile Butadiene Styrene)',
      processType,
      color: batchColor,
      targetQty,
      goodQty: currentGoodQty,
      reworkQty: currentReworkQty,
      rejectQty: currentRejectQty,
      stage: currentStep,
      status: (initialData?.status || 'Open') as any,
      date: issueDate,
      issueDate,
      issueTime,
      deliveryDate: defaultDeadlineDate(),
      assignedPainterName: painterName,
      painterName,
      boothNo: dept.split('(')[0]?.trim() || 'Booth #1',
      plant: activePlant
    } as unknown as JobCard);
  }, [initialData, jobCards, jobCardNo, docNo, revNo, revDate, customer, wNo, selectedGrnNo, partDescription, partCode, processType, batchColor, targetQty, currentGoodQty, currentReworkQty, currentRejectQty, currentStep, issueDate, issueTime, painterName, dept, activePlant]);

  // =========================================================================
  // DAILY PRODUCTION TRACKING & CONSUMABLES USAGE STATE
  // =========================================================================
  const [selectedProductionDate, setSelectedProductionDate] = useState<string>('ALL');
  const [selectedPainterFilter, setSelectedPainterFilter] = useState<string>('ALL');
  const [selectedMatForUsage, setSelectedMatForUsage] = useState<IssuedMaterialItem | null>(null);
  const [usageConsumedInput, setUsageConsumedInput] = useState<number>(0);
  const [usageRemarkInput, setUsageRemarkInput] = useState<string>('');
  const [showUsageModal, setShowUsageModal] = useState<boolean>(false);
  const [isEditingDailyQuota, setIsEditingDailyQuota] = useState<boolean>(false);
  const [editDailyQuotaInput, setEditDailyQuotaInput] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Distinct Painter list associated with this Job Card
  const currentJcAssignments = useMemo(() => {
    return painterAssignments.filter(a => a.masterJobCardNo === jobCardNo || (a as any).masterJobCardId === jobCardNo);
  }, [painterAssignments, jobCardNo]);

  useEffect(() => {
    if (currentJcAssignments.length > 0 && !selectedAssignmentId) {
      setSelectedAssignmentId(currentJcAssignments[0].id);
    }
  }, [currentJcAssignments, selectedAssignmentId]);

  const activeTab2Assignment = useMemo(() => {
    if (selectedAssignmentId === 'ALL' || !selectedAssignmentId) return null;
    return currentJcAssignments.find(a => a.id === selectedAssignmentId || a.assignmentId === selectedAssignmentId) || null;
  }, [currentJcAssignments, selectedAssignmentId]);

  const jcPainters = useMemo(() => {
    const set = new Set<string>();
    if (painterName && painterName.trim()) set.add(painterName.trim());
    currentJcAssignments.forEach(a => { if (a.painterName) set.add(a.painterName.trim()); });
    liveProgressLogs.forEach(l => { if (l.painterName) set.add(l.painterName.trim()); });
    return Array.from(set).filter(Boolean);
  }, [painterName, currentJcAssignments, liveProgressLogs]);

  // Previously used shades from system history + standard factory tones
  const historicalColors = useMemo(() => {
    const set = new Set<string>();
    const defaults = [
      'Piano High Gloss Black',
      'Monza Red Gloss',
      'Pearl Arctic White',
      'Satin Silver Metallic',
      'Matt Charcoal Grey',
      'Carbon Fiber 3D Dipping',
      'Deep Royal Navy Blue',
      'Champagne Gold Satin',
      'Gloss Alpine White',
      'Phantom Metallic Black'
    ];
    defaults.forEach(c => set.add(c));
    if (jobCards && jobCards.length > 0) {
      jobCards.forEach(j => {
        if (j.color && j.color.trim()) set.add(j.color.trim());
      });
    }
    return Array.from(set);
  }, [jobCards]);

  const filteredColors = useMemo(() => {
    if (!batchColor.trim()) return historicalColors;
    const q = batchColor.toLowerCase().trim();
    return historicalColors.filter(c => c.toLowerCase().includes(q));
  }, [batchColor, historicalColors]);

  // Dynamic Booth Options mapped strictly from Central Booth Fleet (filtered by plant)
  const boothOptions = useMemo<ComboboxOption[]>(() => {
    const targetPlant = activePlant !== 'ALL' ? activePlant : (initialData?.plant || 'Haridwar');
    const availableBooths = paintingBooths.filter(b => matchesPlant(b.plant, targetPlant));
    const list: ComboboxOption[] = availableBooths.map(b => {
      const isMaintenance = b.status === 'Under Maintenance';
      const isChangeover = b.status === 'Changeover';
      return {
        value: b.name,
        label: b.name,
        sublabel: `${b.type} • Cap: ${b.capacityPerShift?.toLocaleString('en-IN') || 1000} pcs/shift`,
        badge: isMaintenance ? '⚠️ Maintenance' : isChangeover ? '🔄 Changeover' : 'Active Line',
        badgeColor: isMaintenance 
          ? 'bg-amber-50 text-amber-800 border border-amber-200' 
          : isChangeover 
          ? 'bg-blue-50 text-blue-800 border border-blue-200' 
          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
      };
    });

    if (dept && !list.some(b => b.value === dept)) {
      list.unshift({
        value: dept,
        label: dept,
        sublabel: 'Assigned Shop Line',
        badge: 'Assigned Line',
        badgeColor: 'bg-[#faf7ed] text-[#8a6521] border border-[#f4e5be]'
      });
    }

    return list;
  }, [paintingBooths, dept, activePlant, initialData]);

  // Dynamic Painter Options mapped strictly from Central Painters Fleet (filtered by plant)
  const painterOptions = useMemo<ComboboxOption[]>(() => {
    const targetPlant = activePlant !== 'ALL' ? activePlant : (initialData?.plant || 'Haridwar');
    const availablePainters = painters.filter(p => matchesPlant(p.plant, targetPlant));
    const list: ComboboxOption[] = availablePainters.map(p => {
      const count = getPainterActiveJobCount ? getPainterActiveJobCount(p.name) : 0;
      const isCap = count >= 2;
      return {
        value: p.name,
        label: p.name,
        sublabel: `${p.boothNo || 'Dynamic Allocation'} • ${p.specialization || 'Coating Specialist'}`,
        badge: isCap 
          ? '⚠️ 2/2 Jobs Capped' 
          : `${count}/2 Active Jobs`,
        badgeColor: isCap 
          ? 'bg-rose-50 text-rose-700 border border-rose-200' 
          : count === 1 
          ? 'bg-amber-50 text-amber-700 border border-amber-200' 
          : 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        isCapped: isCap
      };
    });

    if (painterName && !list.some(p => p.value === painterName)) {
      list.unshift({
        value: painterName,
        label: painterName,
        sublabel: 'Assigned Floor Operator',
        badge: 'Assigned Operator',
        badgeColor: 'bg-[#faf7ed] text-[#8a6521] border border-[#f4e5be]'
      });
    }

    return list;
  }, [painters, getPainterActiveJobCount, painterName, activePlant, initialData]);

  // Available Store GRN lots (Customer accepted lots)
  const availableGrnLots = useMemo(() => {
    return grnList.filter(g => {
      const isAccepted = (g.iqcStatus === 'Accepted' || g.iqcStatus === 'Passed' || (!g.iqcStatus && g.grnNo)) && g.iqcStatus !== 'Pending' && g.iqcStatus !== 'Rejected';
      if (!isAccepted) return false;
      const isChemical = g.partCode?.startsWith('PNT') || g.partCode?.startsWith('CHEM') || g.description?.toLowerCase().includes('paint') || g.description?.toLowerCase().includes('thinner');
      return !isChemical;
    });
  }, [grnList]);

  // Selected GRN details with intelligent multi-priority lookup
  const selectedGrn = useMemo(() => {
    // 1. Explicitly selected GRN
    if (selectedGrnNo) {
      const match = grnList.find(g => g.grnNo === selectedGrnNo);
      if (match) return match;
    }
    // 2. Pre-filled source GRN from initialData
    if (initialData?.sourceGrnNo) {
      const match = grnList.find(g => g.grnNo === initialData.sourceGrnNo);
      if (match) return match;
    }
    // 3. Match by Delivery Challan No / Work Order No
    const challan = (wNo || initialData?.woNo || initialData?.wNo || '').trim().toLowerCase();
    if (challan) {
      const match = grnList.find(g => g.invoiceChallanNo && g.invoiceChallanNo.trim().toLowerCase() === challan);
      if (match) return match;
    }
    // 4. Match by Part Code & Customer Name
    const targetCustomer = (customer || initialData?.customer || '').trim().toLowerCase();
    const targetPart = (partCode || initialData?.partCode || '').trim().toLowerCase();
    if (targetCustomer && targetPart) {
      const match = availableGrnLots.find(g => 
        g.supplierCustomer?.trim().toLowerCase() === targetCustomer &&
        (g.partCode?.trim().toLowerCase() === targetPart || g.items?.some(it => it.partCode?.trim().toLowerCase() === targetPart))
      );
      if (match) return match;
    }
    // 5. Match by Part Code alone
    if (targetPart) {
      const match = availableGrnLots.find(g => 
        g.partCode?.trim().toLowerCase() === targetPart || g.items?.some(it => it.partCode?.trim().toLowerCase() === targetPart)
      );
      if (match) return match;
    }
    // 6. Match by Customer alone
    if (targetCustomer) {
      const match = availableGrnLots.find(g => g.supplierCustomer?.trim().toLowerCase() === targetCustomer);
      if (match) return match;
    }
    // 7. If no explicit selection or exact match, return null to allow clean manual input
    return null;
  }, [selectedGrnNo, initialData, grnList, availableGrnLots, wNo, customer, partCode]);

  // Sync selectedGrnNo state when selectedGrn is resolved
  useEffect(() => {
    if (selectedGrn?.grnNo && (!selectedGrnNo || selectedGrnNo !== selectedGrn.grnNo)) {
      if (!initialData?.jobCardNo) {
        setSelectedGrnNo(selectedGrn.grnNo);
      }
    } else if (!selectedGrn && !initialData?.sourceGrnNo) {
      setSelectedGrnNo('');
    }
  }, [selectedGrn, selectedGrnNo, initialData]);

  // Available balance in selected GRN lot
  const availableStoreBalance = useMemo(() => {
    if (!selectedGrn) {
      return initialData?.targetQty || 0;
    }
    const totalInward = Number(selectedGrn.actualReceivedQty) || Number(selectedGrn.invoicedQty) || Number(selectedGrn.totalQty) || 0;
    
    // Only deduct master / primary job cards to avoid double-counting child splits
    const inOtherCards = jobCards
      .filter(jc => {
        const isMaster = jc.jobCardType === 'master' || (!jc.jobCardType && !jc.parentJobCardId);
        if (!isMaster) return false;
        if (jc.jobCardNo === (initialData?.jobCardNo || jobCardNo)) return false;
        
        const matchesGrn = jc.sourceGrnNo && jc.sourceGrnNo === selectedGrn.grnNo;
        const matchesChallan = selectedGrn.invoiceChallanNo && (
          (jc.woNo && jc.woNo.trim().toLowerCase() === selectedGrn.invoiceChallanNo.trim().toLowerCase()) ||
          (jc.wNo && jc.wNo.trim().toLowerCase() === selectedGrn.invoiceChallanNo.trim().toLowerCase())
        );
        return matchesGrn || matchesChallan;
      })
      .reduce((sum, jc) => sum + (Number(jc.targetQty) || 0), 0);

    const balance = Math.max(0, totalInward - inOtherCards);
    
    // Safety check: if balance evaluates to 0 but this is a priority order or initialData with positive targetQty,
    // and the selected GRN customer does not match the card customer, use initialData.targetQty
    if (balance === 0 && initialData?.targetQty && !isExistingCard) {
      const cardCust = (customer || initialData.customer || '').trim().toLowerCase();
      const grnCust = (selectedGrn.supplierCustomer || '').trim().toLowerCase();
      if (cardCust && grnCust && !grnCust.includes(cardCust) && !cardCust.includes(grnCust)) {
        return initialData.targetQty;
      }
    }
    
    return balance;
  }, [selectedGrn, jobCards, initialData, jobCardNo, isExistingCard, customer]);

  // Additional Material Issue on Existing Job Card
  const [showAddMaterialDrawer, setShowAddMaterialDrawer] = useState<boolean>(false);
  const [newMatDesc, setNewMatDesc] = useState<string>('');
  const [newMatQty, setNewMatQty] = useState<number>(1);
  const [newMatUom, setNewMatUom] = useState<string>('Litres');
  const [newMatColour, setNewMatColour] = useState<string>('Clear');
  const [newMatRemark, setNewMatRemark] = useState<string>('');

  const handleAddAdditionalMaterial = () => {
    if (!newMatDesc.trim() || newMatQty <= 0) {
      alert('Please enter a valid material description and quantity.');
      return;
    }

    const newItem: IssuedMaterialItem = {
      id: `mat_${Date.now()}`,
      itemDescription: newMatDesc.trim(),
      qty: newMatQty,
      uom: newMatUom,
      category: 'COMPANY_CONSUMABLE',
      materialType: 'consumable',
      consumedQty: 0,
      floorBalanceQty: newMatQty,
      colour: newMatColour.trim() || 'Clear',
      remark: newMatRemark.trim() || 'Additional floor issue to painter'
    };

    const updatedMaterials = [...issuedMaterials, newItem];
    setIssuedMaterials(updatedMaterials);

    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    const matLogEntry: JobCardProductionProgressLog = {
      id: `LOG-MAT-${Date.now()}`,
      timestamp: now.toISOString(),
      dateLabel: dateFormatted,
      timeLabel: timeFormatted,
      actionType: 'MATERIAL_ISSUED',
      actionTitle: `Additional Chemical / Material Issued: ${newMatDesc.trim()}`,
      exactChanges: [
        `Issued Material: ${newMatDesc.trim()}`,
        `Quantity Issued: +${newMatQty} ${newMatUom}`,
        `Shade / Grade: ${newMatColour.trim() || 'Clear'}`,
        `Assigned Painter: ${painterName} (${dept.split('(')[0]?.trim() || 'Booth #1'})`,
        `Floor Purpose: ${newMatRemark.trim() || 'Shop floor replenishment'}`,
        `Total Materials on Job: ${updatedMaterials.length} Items`
      ],
      piecesCompleted: 0,
      cumulativeGoodQty: currentGoodQty,
      painterName: painterName,
      boothNo: dept.split('(')[0]?.trim() || 'Booth #1',
      recordedBy: currentUser.name || 'Vikram Patel',
      remarks: newMatRemark.trim() || undefined
    };

    const updatedLogs = [matLogEntry, ...liveProgressLogs];
    setLiveProgressLogs(updatedLogs);

    if (isExistingCard && initialData) {
      const updatedCard: JobCard = {
        ...initialData,
        issuedMaterials: updatedMaterials,
        progressLogs: updatedLogs
      };
      updateJobCard(updatedCard);
    }

    setNewMatDesc('');
    setNewMatQty(1);
    setNewMatRemark('');
    setShowAddMaterialDrawer(false);
  };

  const handleDownloadPdf = () => {
    const currentCard: JobCard = {
      ...(initialData || {}),
      docNo,
      revNo,
      revDate,
      jobCardNo,
      woNo: wNo,
      wNo: wNo,
      sourceGrnNo: selectedGrn?.grnNo || selectedGrnNo,
      customer,
      partCode,
      partDescription,
      color: batchColor.trim() || 'Multi-Colour / Painter-Wise',
      targetQty,
      dailyTargetQty,
      dailyIssuedQty: dailyTargetQty,
      sprayedQty: currentGoodQty + currentReworkQty + currentRejectQty,
      goodQty: currentGoodQty,
      reworkQty: currentReworkQty,
      rejectQty: currentRejectQty,
      remainingQty: Math.max(0, targetQty - currentGoodQty - currentReworkQty - currentRejectQty),
      status: (currentGoodQty + currentReworkQty >= targetQty && targetQty > 0) ? 'Target Met' : (currentGoodQty > 0 ? 'In Process' : 'Open'),
      painterName,
      assignedPainterName: painterName,
      assignedPainterId,
      dept,
      processType,
      issueDate,
      issueTime,
      deadlineDate,
      deadlineTime,
      issuedMaterials,
      progressLogs: liveProgressLogs,
      plant: activePlant,
      prodSupervisor: currentUser.name || 'Vikram Patel'
    };
    downloadStandardJobCardPdf(currentCard);
  };

  // Sync initialData when modal opens
  useEffect(() => {
    if (initialData && isOpen) {
      if (initialData.jobCardNo) setJobCardNo(initialData.jobCardNo);
      if (initialData.customer) setCustomer(initialData.customer);
      if (initialData.partCode) setPartCode(initialData.partCode);
      if (initialData.partDescription) setPartDescription(initialData.partDescription);
      if (initialData.targetQty) {
        setTargetQty(initialData.targetQty);
        setDailyTargetQty(initialData.dailyTargetQty || (initialData.targetQty > 1000 ? Math.min(2000, initialData.targetQty) : initialData.targetQty));
      }
      if (initialData.dailyTargetQty) setDailyTargetQty(initialData.dailyTargetQty);
      if (initialData.color) setBatchColor(initialData.color);
      if (initialData.woNo) setWNo(initialData.woNo);
      if (initialData.wNo) setWNo(initialData.wNo);
      if (initialData.sourceGrnNo) {
        setSelectedGrnNo(initialData.sourceGrnNo);
      } else if (initialData.woNo || initialData.wNo) {
        const challan = (initialData.woNo || initialData.wNo || '').trim().toLowerCase();
        const matchingGrn = grnList.find(g => g.invoiceChallanNo && g.invoiceChallanNo.trim().toLowerCase() === challan);
        if (matchingGrn) {
          setSelectedGrnNo(matchingGrn.grnNo);
        }
      }
      if (initialData.assignedPainterName) setPainterName(initialData.assignedPainterName);
      if (initialData.dept) setDept(initialData.dept);
      if (initialData.goodQty !== undefined) setCurrentGoodQty(initialData.goodQty);
      if (initialData.reworkQty !== undefined) setCurrentReworkQty(initialData.reworkQty);
      else if (initialData.reworkRecoveredQty !== undefined) setCurrentReworkQty(initialData.reworkRecoveredQty);
      if (initialData.rejectQty !== undefined) setCurrentRejectQty(initialData.rejectQty);
      const storeJc = jobCards.find(j => j.jobCardNo === initialData.jobCardNo);
      if (storeJc?.progressLogs) setLiveProgressLogs(storeJc.progressLogs);
      else if (initialData.progressLogs) setLiveProgressLogs(initialData.progressLogs);
      if (initialData.issuedMaterials && initialData.issuedMaterials.length > 0) {
        const sanitized = sanitizeCompanyMaterials(initialData.issuedMaterials, initialData.partDescription);
        if (sanitized.length > 0) {
          setIssuedMaterials(sanitized);
        }
      }
      if (initialData.deadlineDate) setDeadlineDate(initialData.deadlineDate);
      if (initialData.deadlineTime) setDeadlineTime(initialData.deadlineTime);
    }
  }, [initialData, isOpen, grnList]);

  // Remaining pieces calculation
  const remainingQty = Math.max(0, targetQty - currentGoodQty - currentReworkQty - currentRejectQty);
  const totalSprayedSoFar = currentGoodQty + currentReworkQty + currentRejectQty;
  const progressPercent = targetQty > 0 ? Math.min(100, Math.round((currentGoodQty / targetQty) * 100)) : 0;
  const totalAchievedPercent = targetQty > 0 ? Math.min(100, Math.round(((currentGoodQty + currentReworkQty) / targetQty) * 100)) : 0;
  const reworkPercent = totalSprayedSoFar > 0 ? ((currentReworkQty / totalSprayedSoFar) * 100).toFixed(1) : '0.0';
  const scrapPercent = totalSprayedSoFar > 0 ? ((currentRejectQty / totalSprayedSoFar) * 100).toFixed(1) : '0.0';
  const defectPercent = totalSprayedSoFar > 0 ? (((currentReworkQty + currentRejectQty) / totalSprayedSoFar) * 100).toFixed(1) : '0.0';

  // Multi-Stage Coating Process Configuration & Dynamic Counters
  const processStages = useMemo(() => getStagesForProcess(processType), [processType]);

  const stageCounts = useMemo(() => {
    const stage1Logs = liveProgressLogs.filter(l => l.processStage === 'stage_1_primer');
    const stage2Logs = liveProgressLogs.filter(l => l.processStage === 'stage_2_basecoat');
    const stage3Logs = liveProgressLogs.filter(l => l.processStage === 'stage_3_topcoat' || !l.processStage);

    // Stage 1: Primer / Ground Coat / Surface Prep
    const s1Sprayed = stage1Logs.reduce((sum, l) => sum + (l.piecesCompleted || 0), 0) || (initialData?.primerCompletedQty || 0);
    const s1Good = stage1Logs.length > 0
      ? stage1Logs.reduce((sum, l) => sum + (l.goodPieces ?? Math.max(0, (l.piecesCompleted || 0) - (l.reworkPieces || 0) - (l.scrapPieces || 0))), 0)
      : Math.max(0, (initialData?.primerCompletedQty || 0) - (initialData?.primerRejectQty || 0));
    const s1Scrap = stage1Logs.reduce((sum, l) => sum + (l.scrapPieces || 0), 0) || (initialData?.primerRejectQty || 0);
    const s1ReworkLogged = stage1Logs.reduce((sum, l) => sum + (l.reworkPieces || 0), 0);
    const s1Pending = Math.max(0, targetQty - s1Good - s1Scrap);
    const s1ActiveRework = Math.min(s1Pending, s1ReworkLogged);
    const s1Rejects = s1Scrap + s1ActiveRework;

    // Stage 2: Basecoat Colour / 3D Pattern / Print Pass
    const s1GoodCap = s1Good;
    const s2Sprayed = stage2Logs.reduce((sum, l) => sum + (l.piecesCompleted || 0), 0) || (initialData?.basecoatCompletedQty || 0);
    const s2Good = stage2Logs.length > 0
      ? stage2Logs.reduce((sum, l) => sum + (l.goodPieces ?? Math.max(0, (l.piecesCompleted || 0) - (l.reworkPieces || 0) - (l.scrapPieces || 0))), 0)
      : Math.max(0, (initialData?.basecoatCompletedQty || 0) - (initialData?.basecoatRejectQty || 0));
    const s2Scrap = stage2Logs.reduce((sum, l) => sum + (l.scrapPieces || 0), 0) || (initialData?.basecoatRejectQty || 0);
    const s2ReworkLogged = stage2Logs.reduce((sum, l) => sum + (l.reworkPieces || 0), 0);
    const s2Pending = Math.max(0, s1GoodCap - s2Good - s2Scrap);
    const s2ActiveRework = Math.min(s2Pending, s2ReworkLogged);
    const s2Rejects = s2Scrap + s2ActiveRework;

    // Stage 3: Topcoat Clear / Final Dimensional Inspection
    const s2GoodCap = s2Good;
    const s3Sprayed = stage3Logs.reduce((sum, l) => sum + (l.piecesCompleted || 0), 0) || (initialData?.topcoatCompletedQty || (initialData?.goodQty || 0) + (initialData?.rejectQty || 0));
    const s3Good = stage3Logs.length > 0 
      ? stage3Logs.reduce((sum, l) => sum + (l.goodPieces ?? Math.max(0, (l.piecesCompleted || 0) - (l.reworkPieces || 0) - (l.scrapPieces || 0))), 0)
      : (initialData?.goodQty ?? currentGoodQty);
    const s3Scrap = stage3Logs.reduce((sum, l) => sum + (l.scrapPieces || 0), 0) || (initialData?.topcoatRejectQty || currentRejectQty);
    const s3ReworkLogged = stage3Logs.reduce((sum, l) => sum + (l.reworkPieces || 0), 0);
    const s3Pending = Math.max(0, s2GoodCap - s3Good - s3Scrap);
    const s3ActiveRework = Math.min(s3Pending, s3ReworkLogged || (initialData?.reworkQty || currentReworkQty));
    const s3Rejects = s3Scrap + s3ActiveRework;

    return {
      stage1: { completed: s1Sprayed, good: s1Good, rework: s1ActiveRework, totalRework: s1ReworkLogged, scrap: s1Scrap, rejects: s1Rejects, pending: s1Pending },
      stage2: { completed: s2Sprayed, good: s2Good, rework: s2ActiveRework, totalRework: s2ReworkLogged, scrap: s2Scrap, rejects: s2Rejects, pending: s2Pending },
      stage3: { completed: s3Sprayed, good: s3Good, rework: s3ActiveRework, totalRework: s3ReworkLogged, scrap: s3Scrap, rejects: s3Rejects, pending: s3Pending }
    };
  }, [liveProgressLogs, initialData, targetQty, currentGoodQty, currentRejectQty, currentReworkQty]);

  // Helper to get stage totals for the currently selected Tab 2 painter assignment
  const getAssignmentStageSums = (asg: PainterAssignment, stageKey: CoatingProcessStage) => {
    const matchingLogs = liveProgressLogs.filter(
      l =>
        l.processStage === stageKey &&
        (l.assignmentId === asg.id ||
          l.assignmentId === asg.assignmentId ||
          (!l.assignmentId &&
            currentJcAssignments[0]?.id === asg.id &&
            l.painterName &&
            l.painterName.trim().toLowerCase() === asg.painterName.trim().toLowerCase()))
    );
    return {
      good: matchingLogs.reduce((s, l) => s + (l.goodPieces || l.piecesCompleted || 0), 0),
      rework: matchingLogs.reduce((s, l) => s + (l.reworkPieces || 0), 0),
      scrap: matchingLogs.reduce((s, l) => s + (l.scrapPieces || 0), 0)
    };
  };

  // Live metrics for a painter assignment:
  // Completed Good = ONLY Stage 3 (Clear Topcoat) OK pieces (passed all 3 stages)
  // Rework & Dead Scrap = summed cleanly across all 3 stages so neither is conflated
  const getAssignmentLiveMetrics = (asg: PainterAssignment) => {
    const s1 = getAssignmentStageSums(asg, 'stage_1_primer');
    const s2 = getAssignmentStageSums(asg, 'stage_2_basecoat');
    const s3 = getAssignmentStageSums(asg, 'stage_3_topcoat');
    const hasStageLogs =
      s1.good + s1.rework + s1.scrap +
      s2.good + s2.rework + s2.scrap +
      s3.good + s3.rework + s3.scrap > 0;

    const completedGood = hasStageLogs ? s3.good : (asg.actualCompletedQty || 0);
    const rework = hasStageLogs ? (s1.rework + s2.rework + s3.rework) : (asg.rejectReworkQty || 0);
    const scrap = hasStageLogs ? (s1.scrap + s2.scrap + s3.scrap) : (asg.scrapQty || 0);
    const pending = Math.max(0, (asg.dailyTargetQty || 0) - completedGood - scrap);
    const efficiency = (asg.dailyTargetQty || 0) > 0
      ? Math.min(100, Math.round((completedGood / asg.dailyTargetQty) * 100))
      : 0;

    return { completedGood, rework, scrap, pending, efficiency };
  };

  // Strict sequential stage cap for an assignment:
  // - Stage 1 receives raw quota (dailyTargetQty - s1Good - s1Scrap)
  // - Stage 2 receives ONLY Stage 1 OK pieces (unless Stage 1 has 0 logs on a pure-Basecoat shift)
  // - Stage 3 receives ONLY Stage 2 OK pieces (unless Stages 1 & 2 have 0 logs on a pure-Topcoat shift)
  const getAssignmentStageMaxAllowed = (asg: PainterAssignment, stageKey: CoatingProcessStage): number => {
    const s1 = getAssignmentStageSums(asg, 'stage_1_primer');
    const s2 = getAssignmentStageSums(asg, 'stage_2_basecoat');
    const s3 = getAssignmentStageSums(asg, 'stage_3_topcoat');
    const s1HasLogs = s1.good + s1.rework + s1.scrap > 0;
    const s2HasLogs = s2.good + s2.rework + s2.scrap > 0;

    if (stageKey === 'stage_1_primer') {
      return Math.max(0, asg.dailyTargetQty - s1.good - s1.scrap);
    }
    if (stageKey === 'stage_2_basecoat') {
      if (s1HasLogs) {
        return Math.max(0, s1.good - s2.good - s2.scrap);
      }
      return asg.processStage === 'Basecoat' ? Math.max(0, asg.dailyTargetQty - s2.good - s2.scrap) : 0;
    }
    if (s2HasLogs) {
      return Math.max(0, s2.good - s3.good - s3.scrap);
    }
    if (s1HasLogs) {
      return 0;
    }
    return asg.processStage === 'Topcoat / Clear Coat' ? Math.max(0, asg.dailyTargetQty - s3.good - s3.scrap) : 0;
  };

  // Strict Sequential Stage Handshake Logic (assignment-scoped when logging for a selected painter):
  // - Stage 1 Input: Raw substrate parts from Stores (targetQty). Remaining = targetQty - s1Good - s1Scrap
  // - Stage 2 Input: Good Pieces passed by Stage 1 (stageCounts.stage1.good)
  // - Stage 3 Input: Good Pieces passed by Stage 2 (stageCounts.stage2.good)
  const currentStageMaxAllowed = useMemo(() => {
    if (activeTab2Assignment) {
      return getAssignmentStageMaxAllowed(activeTab2Assignment, selectedStage);
    }
    if (selectedStage === 'stage_1_primer') {
      return Math.max(0, targetQty - stageCounts.stage1.good - stageCounts.stage1.scrap);
    }
    if (selectedStage === 'stage_2_basecoat') {
      return Math.max(0, stageCounts.stage1.good - stageCounts.stage2.good - stageCounts.stage2.scrap);
    }
    return Math.max(0, stageCounts.stage2.good - stageCounts.stage3.good - stageCounts.stage3.scrap);
  }, [selectedStage, targetQty, stageCounts, activeTab2Assignment, liveProgressLogs]);

  // Stage-by-Stage Rejection Rates & Overall Job Rejection Rate
  const stage1RejRate = stageCounts.stage1.completed > 0 
    ? ((stageCounts.stage1.rejects / stageCounts.stage1.completed) * 100).toFixed(1) 
    : '0.0';
  const stage2RejRate = stageCounts.stage2.completed > 0 
    ? ((stageCounts.stage2.rejects / stageCounts.stage2.completed) * 100).toFixed(1) 
    : '0.0';
  const stage3RejRate = stageCounts.stage3.completed > 0 
    ? ((stageCounts.stage3.rejects / stageCounts.stage3.completed) * 100).toFixed(1) 
    : '0.0';

  const totalRejectionsAllStages = stageCounts.stage1.rejects + stageCounts.stage2.rejects + stageCounts.stage3.rejects;
  const overallJobRejRate = targetQty > 0 
    ? ((totalRejectionsAllStages / targetQty) * 100).toFixed(1) 
    : '0.0';

  const activeStageConfig = useMemo(() => {
    return processStages.find(s => s.key === selectedStage) || processStages[0];
  }, [processStages, selectedStage]);

  const handleSelectStage = (stageKey: CoatingProcessStage) => {
    setSelectedStage(stageKey);
    let maxForStage = 0;
    if (activeTab2Assignment) {
      maxForStage = getAssignmentStageMaxAllowed(activeTab2Assignment, stageKey);
    } else if (stageKey === 'stage_1_primer') {
      maxForStage = Math.max(0, targetQty - stageCounts.stage1.good - stageCounts.stage1.scrap);
    } else if (stageKey === 'stage_2_basecoat') {
      maxForStage = Math.max(0, stageCounts.stage1.good - stageCounts.stage2.good - stageCounts.stage2.scrap);
    } else {
      maxForStage = Math.max(0, stageCounts.stage2.good - stageCounts.stage3.good - stageCounts.stage3.scrap);
    }
    const defaultSprayed = Math.min(100, Math.max(0, maxForStage));
    setLogPiecesSprayed(defaultSprayed);
    setLogGoodPieces(defaultSprayed);
    setLogReworkPieces(0);
    setLogRejectPieces(0);
  };

  // Strict Deadline Date & Time Calculator
  const deadlineTimestamp = useMemo(() => {
    try {
      let year = new Date().getFullYear();
      let month = new Date().getMonth() + 1;
      let day = new Date().getDate();

      if (deadlineDate && deadlineDate.includes('-')) {
        const parts = deadlineDate.split('-').map(Number);
        if (parts[0] > 1000) {
          // YYYY-MM-DD
          year = parts[0];
          month = parts[1];
          day = parts[2];
        } else if (parts[2] > 1000) {
          // DD-MM-YYYY
          day = parts[0];
          month = parts[1];
          year = parts[2];
        }
      }
      
      const d = new Date(year, (month || 1) - 1, day || 1);
      if (deadlineTime) {
        const parts = deadlineTime.replace(/[^\d:]/g, '').split(':');
        if (parts.length >= 2) {
          let h = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10);
          if (deadlineTime.toLowerCase().includes('pm') && h < 12) h += 12;
          if (deadlineTime.toLowerCase().includes('am') && h === 12) h = 0;
          d.setHours(h, m, 0, 0);
        }
      }
      return d;
    } catch {
      return new Date(Date.now() + 4 * 3600000);
    }
  }, [deadlineDate, deadlineTime]);

  const deadlineStatus = useMemo(() => {
    const now = new Date();
    const diffMs = deadlineTimestamp.getTime() - now.getTime();
    const isCompleted = remainingQty === 0;

    if (isCompleted) {
      return {
        label: 'Target Completed',
        badgeColor: 'bg-[#faf3e0] text-[#8a6521] border-[#f4e5be]',
        detail: 'Sabhi pieces successfully spray & verify ho chuke hain'
      };
    }

    if (diffMs < 0) {
      const overdueMins = Math.abs(Math.round(diffMs / 60000));
      const hours = Math.floor(overdueMins / 60);
      const mins = overdueMins % 60;
      return {
        label: '⚠️ Deadline Breached / Delayed',
        badgeColor: 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse',
        detail: `Overdue by ${hours > 0 ? `${hours}h ` : ''}${mins}m`
      };
    }

    const remainingMins = Math.round(diffMs / 60000);
    const hours = Math.floor(remainingMins / 60);
    const mins = remainingMins % 60;

    if (hours < 2) {
      return {
        label: '⚡ Urgent - Shift Ending Soon',
        badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
        detail: `${hours > 0 ? `${hours}h ` : ''}${mins}m remaining to finish`
      };
    }

    return {
      label: 'On Schedule',
      badgeColor: 'bg-[#faf7ed] text-[#8a6521] border-[#f4e5be]',
      detail: `${hours}h ${mins}m left to finish target`
    };
  }, [deadlineTimestamp, remainingQty]);

  const handleApplyPresetDeadline = (presetHours: number) => {
    setSlaHours(presetHours);
    const target = new Date(Date.now() + presetHours * 3600000);
    setDeadlineDate(target.toISOString().split('T')[0]);
    setDeadlineTime(target.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  // Helpers to normalize and match date strings reliably across ISO YYYY-MM-DD and DD-MM-YYYY
  const normalizeToIsoDate = (dStr?: string): string => {
    if (!dStr) return '';
    const trimmed = dStr.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
    const parts = trimmed.split('-');
    if (parts.length === 3 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return trimmed;
  };

  const doesLogMatchDate = (log: JobCardProductionProgressLog, targetDate: string): boolean => {
    if (!targetDate || targetDate === 'ALL') return true;
    const isoTarget = normalizeToIsoDate(targetDate);
    if (log.timestamp && normalizeToIsoDate(log.timestamp.slice(0, 10)) === isoTarget) return true;
    if (log.dateLabel && normalizeToIsoDate(log.dateLabel) === isoTarget) return true;
    return false;
  };

  // Extract all distinct working dates for this Job Card (for Date Filter)
  const productionDates = useMemo(() => {
    const dates = new Set<string>();
    if (initialData?.issueDate) dates.add(normalizeToIsoDate(initialData.issueDate));
    if (initialData?.createdAt) dates.add(normalizeToIsoDate(initialData.createdAt.split('T')[0]));
    if (liveProgressLogs && liveProgressLogs.length > 0) {
      liveProgressLogs.forEach(l => {
        if (l.dateLabel) dates.add(normalizeToIsoDate(l.dateLabel));
        else if (l.timestamp) dates.add(normalizeToIsoDate(l.timestamp.split('T')[0]));
      });
    }
    if (initialData?.dailyProductionHistory && initialData.dailyProductionHistory.length > 0) {
      initialData.dailyProductionHistory.forEach(d => {
        if (d.date) dates.add(normalizeToIsoDate(d.date));
      });
    }
    const todayStr = new Date().toISOString().split('T')[0];
    dates.add(todayStr);
    return Array.from(dates).filter(Boolean).sort().reverse();
  }, [initialData, liveProgressLogs]);

  // Selected Date Breakdown Summary
  const selectedDateSummary = useMemo(() => {
    if (selectedProductionDate === 'ALL') return null;
    const isoSelected = normalizeToIsoDate(selectedProductionDate);
    const dateLogs = liveProgressLogs.filter(l => doesLogMatchDate(l, isoSelected));
    const dayHistory = initialData?.dailyProductionHistory?.find(d => normalizeToIsoDate(d.date) === isoSelected);
    const dayCompleted = dateLogs.reduce((s, l) => s + (l.piecesCompleted || 0), 0) || dayHistory?.goodPieces || 0;
    const dayRejects = dateLogs.reduce((s, l) => s + (l.reworkPieces || 0) + (l.scrapPieces || 0), 0) || dayHistory?.scrapPieces || 0;
    const dayTarget = dayHistory?.dailyTarget || dailyTargetQty || (targetQty <= 1000 ? targetQty : 1000);
    const dayReturned = dayHistory?.returnedPieces || 0;

    return {
      date: isoSelected,
      target: dayTarget,
      completed: dayCompleted,
      rejects: dayRejects,
      returned: dayReturned,
      achievement: dayTarget > 0 ? Math.min(100, Math.round((dayCompleted / dayTarget) * 100)) : 0
    };
  }, [selectedProductionDate, liveProgressLogs, initialData, dailyTargetQty, targetQty]);

  // Only Company Consumables (Paints, Thinners, Hardeners, Clear Lacquers)
  // Party Substrate components are tracked separately stage-by-stage in the live process tracker below
  const companyMaterials = useMemo(() => {
    const filtered = sanitizeCompanyMaterials(issuedMaterials, initialData?.partDescription || partDescription);
    if (filtered.length > 0) return filtered;
    // Default fallback if initialData only had raw substrate parts
    const basePcs = targetQty || 250;
    const estPaintLitres = Math.max(1, Math.ceil((basePcs / 500) * 8));
    return [
      {
        id: 'mat_gen_paint',
        itemDescription: `${batchColor} 2K PU Basecoat Paint (PPG)`,
        qty: estPaintLitres,
        colour: batchColor,
        uom: 'Litres',
        category: 'COMPANY_CONSUMABLE' as const,
        materialType: 'paint' as const,
        consumedQty: 0,
        floorBalanceQty: estPaintLitres,
        remark: 'Mix ratio 4:1:1'
      },
      {
        id: 'mat_gen_thinner',
        itemDescription: 'PU Thinner 400 Solvent',
        qty: Math.max(1, Math.ceil(estPaintLitres * 0.4)),
        colour: 'Clear',
        uom: 'Litres',
        category: 'COMPANY_CONSUMABLE' as const,
        materialType: 'thinner' as const,
        consumedQty: 0,
        floorBalanceQty: Math.max(1, Math.ceil(estPaintLitres * 0.4)),
        remark: 'Viscosity control solvent'
      },
      {
        id: 'mat_gen_hardener',
        itemDescription: '2K Scratch-Resistant Hardener',
        qty: Math.max(1, Math.ceil(estPaintLitres * 0.25)),
        colour: 'Clear',
        uom: 'Litres',
        category: 'COMPANY_CONSUMABLE' as const,
        materialType: 'hardener' as const,
        consumedQty: 0,
        floorBalanceQty: Math.max(1, Math.ceil(estPaintLitres * 0.25)),
        remark: 'Reaction curing agent'
      }
    ];
  }, [issuedMaterials, targetQty, batchColor, initialData, partDescription]);

  // Handle Update Material Usage on Floor
  const handleOpenUpdateUsage = (mat: IssuedMaterialItem) => {
    setSelectedMatForUsage(mat);
    setUsageConsumedInput(mat.consumedQty !== undefined ? mat.consumedQty : 0);
    setUsageRemarkInput(mat.remark || '');
    setShowUsageModal(true);
  };

  const handleSaveDailyQuota = () => {
    const val = Math.max(1, Math.min(targetQty, Number(editDailyQuotaInput) || 1));
    setDailyTargetQty(val);
    setIsEditingDailyQuota(false);

    if (initialData?.jobCardNo) {
      updateJobCard({
        ...initialData,
        dailyTargetQty: val,
        dailyIssuedQty: val
      });
    }

    setToastMessage(`✓ Daily production quota updated to ${val.toLocaleString('en-IN')} Pcs/Day`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveMaterialUsage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatForUsage) return;
    const newConsumed = Math.max(0, Number(usageConsumedInput));
    const exists = issuedMaterials.some(m => m.id === selectedMatForUsage.id || m.itemDescription === selectedMatForUsage.itemDescription);
    let updated: IssuedMaterialItem[];
    if (exists) {
      updated = issuedMaterials.map(m => {
        if (m.id === selectedMatForUsage.id || m.itemDescription === selectedMatForUsage.itemDescription) {
          return {
            ...m,
            consumedQty: newConsumed,
            floorBalanceQty: Math.max(0, Number((m.qty - newConsumed).toFixed(2))),
            remark: usageRemarkInput || m.remark
          };
        }
        return m;
      });
    } else {
      updated = [
        ...issuedMaterials,
        {
          ...selectedMatForUsage,
          consumedQty: newConsumed,
          floorBalanceQty: Math.max(0, Number((selectedMatForUsage.qty - newConsumed).toFixed(2))),
          remark: usageRemarkInput || selectedMatForUsage.remark
        }
      ];
    }

    setIssuedMaterials(updated);

    if (initialData?.jobCardNo) {
      updateJobCard({
        ...initialData,
        issuedMaterials: updated
      });
    }

    setToastMessage(`✓ Material usage updated: ${selectedMatForUsage.itemDescription} (${newConsumed} ${selectedMatForUsage.uom} used on floor)`);
    setTimeout(() => setToastMessage(null), 4000);
    setShowUsageModal(false);
    setSelectedMatForUsage(null);
  };

  const handleRecalculateMaterials = (newTarget: number) => {
    const estPaintLitres = Math.max(1, Math.ceil((newTarget / 500) * 8));
    setIssuedMaterials([
      {
        id: '1',
        itemDescription: `${batchColor} 2K PU Basecoat Paint (PPG)`,
        qty: estPaintLitres,
        colour: batchColor,
        uom: 'Litres',
        remark: 'Mix ratio 4:1:1'
      },
      {
        id: '2',
        itemDescription: 'PU Thinner 400 Solvent',
        qty: Math.max(1, Math.ceil(estPaintLitres * 0.4)),
        colour: 'Clear',
        uom: 'Litres',
        remark: 'Viscosity control solvent'
      },
      {
        id: '3',
        itemDescription: '2K Scratch-Resistant Hardener',
        qty: Math.max(1, Math.ceil(estPaintLitres * 0.25)),
        colour: 'Clear',
        uom: 'Litres',
        remark: 'Reaction curing agent'
      },
      {
        id: '4',
        itemDescription: '2K Clear Lacquer Topcoat',
        qty: Math.max(1, Math.ceil(newTarget / 200)),
        colour: 'Clear Gloss',
        uom: 'Litres',
        remark: 'Final protective gloss'
      }
    ]);
  };

  // Material Row Actions
  const handleAddMaterialRow = () => {
    const newId = String(issuedMaterials.length + 1);
    setIssuedMaterials(prev => [
      ...prev,
      {
        id: newId,
        itemDescription: 'PU Thinner Medium',
        materialType: 'thinner',
        category: 'COMPANY_CONSUMABLE',
        qty: 1,
        colour: 'Clear',
        uom: 'Litres',
        remark: 'Shop floor addition'
      }
    ]);
  };

  const handleRemoveMaterialRow = (id: string) => {
    setIssuedMaterials(prev => prev.filter(m => m.id !== id));
  };

  const handleUpdateMaterial = (id: string, field: keyof IssuedMaterialItem, val: any) => {
    setIssuedMaterials(prev => prev.map(m => m.id === id ? { ...m, [field]: val } : m));
  };

  // Incremental Batch Output Logging (Stage-Aware)
  const handleSprayedPiecesChange = (val: number) => {
    if (isNaN(val)) val = 0;
    const sprayed = Math.min(currentStageMaxAllowed, Math.max(0, val));
    setLogPiecesSprayed(sprayed);
    const nonGood = logReworkPieces + logRejectPieces;
    setLogGoodPieces(Math.max(0, sprayed - nonGood));
  };

  const handleGoodPiecesChange = (val: number) => {
    if (isNaN(val)) val = 0;
    const maxAllowed = logPiecesSprayed;
    const good = Math.min(maxAllowed, Math.max(0, val));
    setLogGoodPieces(good);
    const remainingDefects = Math.max(0, logPiecesSprayed - good);
    setLogReworkPieces(remainingDefects);
    setLogRejectPieces(0);
  };

  const handleReworkPiecesChange = (val: number) => {
    if (isNaN(val)) val = 0;
    const rw = Math.max(0, val);
    const maxRw = Math.max(0, logPiecesSprayed - logRejectPieces);
    const finalRw = Math.min(maxRw, rw);
    setLogReworkPieces(finalRw);
    setLogGoodPieces(Math.max(0, logPiecesSprayed - finalRw - logRejectPieces));
  };

  const handleRejectPiecesChange = (val: number) => {
    if (isNaN(val)) val = 0;
    const rej = Math.max(0, val);
    const maxRej = Math.max(0, logPiecesSprayed - logReworkPieces);
    const finalRej = Math.min(maxRej, rej);
    setLogRejectPieces(finalRej);
    setLogGoodPieces(Math.max(0, logPiecesSprayed - logReworkPieces - finalRej));
  };

  const handleSaveOutputBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (logPiecesSprayed <= 0 || logPiecesSprayed > currentStageMaxAllowed) return;

    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
    const timeFormatted = logTimeInput || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    const isFinalStage = selectedStage === 'stage_3_topcoat';
    const newGoodTotal = isFinalStage ? (currentGoodQty + logGoodPieces) : currentGoodQty;
    const newRejectTotal = currentRejectQty + logRejectPieces;
    const newReworkTotal = isFinalStage
      ? Math.max(0, currentReworkQty + logReworkPieces - (logGoodPieces > 0 && currentReworkQty > 0 ? Math.min(currentReworkQty, logGoodPieces) : 0))
      : currentReworkQty;

    const matchedCategory = (Object.keys(DEFECT_LABELS) as DefectCategory[]).find(
      cat => DEFECT_LABELS[cat].toLowerCase() === logDefectReason.trim().toLowerCase()
    ) || (logDefectReason.toLowerCase().includes('run') ? 'paint_run'
      : logDefectReason.toLowerCase().includes('peel') ? 'orange_peel'
      : logDefectReason.toLowerCase().includes('scratch') ? 'scratch'
      : logDefectReason.toLowerCase().includes('undercoat') ? 'undercoat_show'
      : logDefectReason.toLowerCase().includes('shade') || logDefectReason.toLowerCase().includes('color') ? 'shade_deviation'
      : logDefectReason.toLowerCase().includes('pinhole') ? 'pinhole'
      : 'dust_nibs');

    const targetAssignment = activeTab2Assignment;
    const resolvedPainterName = targetAssignment ? targetAssignment.painterName : painterName;
    const resolvedBoothNo = targetAssignment
      ? (targetAssignment.boothNumber || (targetAssignment as any).boothNo || 'Booth #1')
      : (dept.split('(')[0]?.trim() || 'Booth #1');

    const newLogEntry: JobCardProductionProgressLog = {
      id: `LOG-${Date.now()}`,
      timestamp: now.toISOString(),
      timeLabel: timeFormatted,
      dateLabel: dateFormatted,
      actionType: 'BATCH_OUTPUT',
      actionTitle: `${activeStageConfig.shortLabel}: Batch of ${logPiecesSprayed} Pcs Processed`,
      piecesCompleted: logPiecesSprayed,
      goodPieces: logGoodPieces,
      cumulativeGoodQty: newGoodTotal,
      reworkPieces: logReworkPieces,
      scrapPieces: logRejectPieces,
      defectCategory: (logReworkPieces > 0 || logRejectPieces > 0) ? matchedCategory : 'none',
      defectReason: (logReworkPieces > 0 || logRejectPieces > 0) ? logDefectReason.trim() : undefined,
      reworkAction: logReworkPieces > 0 ? logReworkAction.trim() : undefined,
      qaVerified: true,
      qaVerifiedBy: currentUser.name || 'Quality Inspector',
      processStage: selectedStage,
      stageName: activeStageConfig.label,
      assignmentId: targetAssignment?.id,
      painterName: resolvedPainterName,
      boothNo: resolvedBoothNo,
      recordedBy: currentUser.name || 'Vikram Patel',
      remarks: logRemarksInput.trim() || undefined
    };

    setLiveProgressLogs(prev => [newLogEntry, ...prev]);
    if (isFinalStage) {
      setCurrentGoodQty(newGoodTotal);
    }
    setCurrentReworkQty(newReworkTotal);
    setCurrentRejectQty(newRejectTotal);

    if (initialData?.jobCardNo) {
      addJobCardProgressLog(initialData.jobCardNo, {
        timeLabel: newLogEntry.timeLabel,
        dateLabel: newLogEntry.dateLabel,
        actionType: 'BATCH_OUTPUT',
        actionTitle: newLogEntry.actionTitle,
        exactChanges: newLogEntry.exactChanges,
        piecesCompleted: logPiecesSprayed,
        goodPieces: logGoodPieces,
        cumulativeGoodQty: newGoodTotal,
        reworkPieces: logReworkPieces,
        scrapPieces: logRejectPieces,
        defectCategory: newLogEntry.defectCategory,
        defectReason: newLogEntry.defectReason,
        reworkAction: newLogEntry.reworkAction,
        qaVerified: true,
        qaVerifiedBy: newLogEntry.qaVerifiedBy,
        processStage: selectedStage,
        stageName: activeStageConfig.label,
        assignmentId: targetAssignment?.id,
        painterName: newLogEntry.painterName,
        boothNo: newLogEntry.boothNo,
        recordedBy: newLogEntry.recordedBy,
        remarks: newLogEntry.remarks
      });
    }

    if (targetAssignment) {
      recordAssignmentStageOutput(
        targetAssignment.id,
        selectedStage,
        logGoodPieces,
        logReworkPieces,
        logRejectPieces
      );
    }

    setShowOutputLogger(false);
    setLogRemarksInput('');
    const nextMax = targetAssignment
      ? Math.max(0, currentStageMaxAllowed - logGoodPieces - logRejectPieces)
      : isFinalStage
        ? Math.max(0, targetQty - newGoodTotal - newRejectTotal)
        : Math.max(0, currentStageMaxAllowed - logGoodPieces);
    const defaultNext = Math.min(100, Math.max(1, nextMax));
    setLogPiecesSprayed(defaultNext);
    setLogGoodPieces(defaultNext);
    setLogReworkPieces(0);
    setLogRejectPieces(0);
  };

  // Step Validation & Navigation
  const validateCurrentStep = (step: number): boolean => {
    if (step === 1) {
      if (!customer.trim()) {
        alert('Please specify the Customer / Party name.');
        return false;
      }
      if (!wNo.trim()) {
        alert('Please specify the Challan / Work Order Ref.');
        return false;
      }
      // Strict check: if no GRN exists in store inventory, alert the user
      if (availableGrnLots.length === 0 && !selectedGrn && !isExistingCard) {
        const proceedStandalone = window.confirm(
          '⚠️ Notice: Store Inward (GRN) me koi physical inward recorded nahi hai. Kya aap bina Store GRN ke Direct Job Card create karna chahte hain?'
        );
        if (!proceedStandalone) return false;
      }
      return true;
    }
    if (step === 2) {
      if (targetQty <= 0) {
        alert('Please allocate at least 1 piece for this job card.');
        return false;
      }
      if (availableStoreBalance > 0 && targetQty > availableStoreBalance) {
        alert(`Allocated quantity (${targetQty}) cannot exceed available Store Inward balance (${availableStoreBalance} Pcs).`);
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (initialPainterAllocs.length === 0) {
        alert('Please allocate at least one painter line assignment.');
        return false;
      }
      for (const alloc of initialPainterAllocs) {
        if (!alloc.painterName.trim()) {
          alert('Please select a painter name for all allocation rows.');
          return false;
        }
        if (alloc.dailyTargetQty <= 0) {
          alert('Daily shift target quantity must be greater than zero for all allocated painters.');
          return false;
        }
      }
      return true;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateCurrentStep(currentStep)) {
      setCurrentStep(prev => Math.min(4, prev + 1));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  // Final Launch Handler
  const handleLaunchJobCard = () => {
    if (!validateCurrentStep(1) || !validateCurrentStep(2) || !validateCurrentStep(3)) return;

    let logsToSave = [...liveProgressLogs];
    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    if (!isExistingCard) {
      const creationLog: JobCardProductionProgressLog = {
        id: `LOG-CREATE-${Date.now()}`,
        timestamp: now.toISOString(),
        dateLabel: dateFormatted,
        timeLabel: timeFormatted,
        actionType: 'JOB_CREATED',
        actionTitle: `Job Card Initialized & Released to Shop Floor (${jobCardNo})`,
        exactChanges: [
          `Job Card Number: ${jobCardNo}`,
          `Customer / Party: ${customer}`,
          `Work Order / Challan: ${wNo}`,
          `Part Specification: ${partCode} - ${partDescription}`,
          `Target Pieces Allocated: ${targetQty.toLocaleString('en-IN')} Pieces`,
          `Target Finish Shade: ${batchColor}`,
          `Assigned Floor Painter: ${painterName} (${dept.split('(')[0]?.trim() || 'Booth #1'})`,
          `Finish Deadline: ${deadlineDate} • ${deadlineTime}`,
          `Initial Company Issued Materials: ${issuedMaterials.length} Items`,
          `Production Plant: ${activePlant}`
        ],
        piecesCompleted: 0,
        cumulativeGoodQty: 0,
        painterName: painterName,
        boothNo: dept.split('(')[0]?.trim() || 'Booth #1',
        recordedBy: currentUser.name || 'Vikram Patel',
        remarks: 'New Job Card initialized and released for shop floor coating'
      };
      logsToSave = [creationLog, ...logsToSave];
    } else if (initialData) {
      const detailChanges: string[] = [];
      if (initialData.assignedPainterName && initialData.assignedPainterName !== painterName) {
        detailChanges.push(`Reassigned Painter: From "${initialData.assignedPainterName}" to "${painterName}"`);
      }
      if (initialData.deadlineDate && (initialData.deadlineDate !== deadlineDate || initialData.deadlineTime !== deadlineTime)) {
        detailChanges.push(`Updated Deadline: To "${deadlineDate} • ${deadlineTime}"`);
      }
      if (initialData.color && initialData.color !== batchColor) {
        detailChanges.push(`Updated Target Shade: From "${initialData.color}" to "${batchColor}"`);
      }
      if (detailChanges.length > 0) {
        const editLog: JobCardProductionProgressLog = {
          id: `LOG-EDIT-${Date.now()}`,
          timestamp: now.toISOString(),
          dateLabel: dateFormatted,
          timeLabel: timeFormatted,
          actionType: 'DETAILS_UPDATED',
          actionTitle: `Job Card Master Specifications Modified`,
          exactChanges: detailChanges,
          piecesCompleted: 0,
          cumulativeGoodQty: currentGoodQty,
          painterName: painterName,
          boothNo: dept.split('(')[0]?.trim() || 'Booth #1',
          recordedBy: currentUser.name || 'Vikram Patel',
          remarks: 'Master specifications updated by supervisor'
        };
        logsToSave = [editLog, ...logsToSave];
      }
    }

    // Enforce 1 GRN = 1 Master Job Card
    const resolvedGrnNo = selectedGrn?.grnNo || selectedGrnNo;
    if (!isExistingCard && resolvedGrnNo) {
      const existingMaster = jobCards.find(jc => jc.sourceGrnNo === resolvedGrnNo);
      if (existingMaster) {
        alert(`Master Job Card (${existingMaster.jobCardNo}) already exists for GRN ${resolvedGrnNo}. Open it to add painter assignments.`);
        return;
      }
    }

    const totalAllocatedShift = initialPainterAllocs.reduce((s, a) => s + (Number(a.dailyTargetQty) || 0), 0);
    const primaryPainter = initialPainterAllocs[0];

    const finalCard: JobCard = {
      ...(initialData || {}),
      docNo,
      revNo,
      revDate,
      jobCardNo,
      woNo: wNo,
      wNo: wNo,
      sourceGrnNo: selectedGrn?.grnNo || selectedGrnNo,
      customer,
      partCode,
      partDescription,
      color: batchColor.trim() || 'Multi-Colour / Painter-Wise',
      targetQty,
      dailyTargetQty: totalAllocatedShift > 0 ? totalAllocatedShift : dailyTargetQty,
      dailyIssuedQty: totalAllocatedShift > 0 ? totalAllocatedShift : dailyTargetQty,
      sprayedQty: currentGoodQty + currentReworkQty + currentRejectQty,
      goodQty: currentGoodQty,
      reworkQty: currentReworkQty,
      rejectQty: currentRejectQty,
      remainingQty: Math.max(0, targetQty - currentGoodQty - currentReworkQty - currentRejectQty),
      status: (currentGoodQty + currentReworkQty >= targetQty && targetQty > 0) ? 'Target Met' : (currentGoodQty > 0 ? 'In Process' : 'Open'),
      
      painterName: primaryPainter?.painterName || painterName,
      assignedPainterName: primaryPainter?.painterName || painterName,
      assignedPainterId: primaryPainter?.painterId || assignedPainterId,
      dept: primaryPainter?.boothNumber || dept,
      boothNo: (primaryPainter?.boothNumber || dept).split('(')[0]?.trim(),
      
      issueDate,
      issueTime,
      slaHours,
      slaDeadline: deadlineTimestamp.toISOString(),
      deadlineDate,
      deadlineTime,
      isSlaBreached: new Date() > deadlineTimestamp && (targetQty - currentGoodQty) > 0,
      
      issuedMaterials,
      progressLogs: logsToSave,
      primerCompletedQty: stageCounts.stage1.completed,
      primerRejectQty: stageCounts.stage1.rejects,
      basecoatCompletedQty: stageCounts.stage2.completed,
      basecoatRejectQty: stageCounts.stage2.rejects,
      topcoatCompletedQty: stageCounts.stage3.completed,
      topcoatRejectQty: stageCounts.stage3.rejects,
      
      storeIncharge: initialData?.storeIncharge || 'Manoj Tiwari',
      prodSupervisor: currentUser.name || 'Vikram Patel',
      approvedBy: initialData?.approvedBy || 'Satish Sharma (Plant Head)'
    };

    if (isExistingCard) {
      updateJobCard(finalCard);
    } else {
      addJobCard(finalCard);

      // Automatically register Tier-2 Painter Assignments
      initialPainterAllocs.forEach(alloc => {
        if (alloc.dailyTargetQty > 0) {
          const res = createPainterAssignment({
            masterJobCardNo: finalCard.jobCardNo,
            assignmentDate: issueDate,
            shift: 'General Day Shift (08:30 - 18:30)',
            painterId: alloc.painterId,
            painterName: alloc.painterName,
            boothNumber: alloc.boothNumber,
            processStage: alloc.processStage,
            colorShade: alloc.colorShade?.trim() || batchColor.trim() || undefined,
            dailyTargetQty: alloc.dailyTargetQty,
            remarks: 'Shift allocation at Job Card launch'
          });

          // Automatically register Tier-3 Material Traceability Logs
          if (res?.success && res.assignment && issuedMaterials.length > 0) {
            const allocFraction = totalAllocatedShift > 0 ? (alloc.dailyTargetQty / totalAllocatedShift) : 1;
            issueAssignmentMaterials(res.assignment.id, issuedMaterials.map(m => ({
              materialName: m.itemDescription,
              materialType: (m.materialType === 'paint' ? 'Base Paint' : m.materialType === 'hardener' ? 'Hardener' : m.materialType === 'thinner' ? 'Thinner' : m.materialType === 'clear' ? 'Topcoat' : 'Base Paint') as any,
              batchNumber: m.batchNumber || `LOT-${finalCard.jobCardNo.slice(-4)}`,
              issuedQty: Math.max(0.2, Number((m.qty * allocFraction).toFixed(2))),
              uom: m.uom as any,
              standardNormPerPiece: 0.040
            })));
          }
        }
      });
    }

    onClose();
  };

  // =========================================================================
  // RENDER DEDICATED DAILY PRODUCTION & CHEMICAL CONSUMPTION LEDGER
  // =========================================================================
  const renderDailyLedgerContent = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const activeDateStr = selectedProductionDate === 'ALL' ? null : normalizeToIsoDate(selectedProductionDate);
    const dateLogs = liveProgressLogs
      .filter(l => doesLogMatchDate(l, selectedProductionDate))
      .filter(l => selectedPainterFilter === 'ALL' || (l.painterName && l.painterName.trim().toLowerCase() === selectedPainterFilter.trim().toLowerCase()));

    // Filtered painter assignments & logs for selected painter
    const activePainterAssignment = currentJcAssignments.find(a => 
      selectedPainterFilter !== 'ALL' && a.painterName.trim().toLowerCase() === selectedPainterFilter.trim().toLowerCase()
    );

    // Dynamic metrics based on selected painter & date
    const painterTargetPcs = selectedPainterFilter !== 'ALL' 
      ? (activePainterAssignment?.dailyTargetQty || dailyTargetQty)
      : (selectedDateSummary ? selectedDateSummary.target : targetQty);

    const painterGoodPcs = selectedPainterFilter !== 'ALL'
      ? dateLogs.reduce((s, l) => s + (l.goodPieces || l.piecesCompleted || 0), 0)
      : (selectedDateSummary ? selectedDateSummary.completed : currentGoodQty);

    const painterRejectPcs = selectedPainterFilter !== 'ALL'
      ? dateLogs.reduce((s, l) => s + (l.reworkPieces || 0) + (l.scrapPieces || 0), 0)
      : (selectedDateSummary ? selectedDateSummary.rejects : currentRejectQty);

    const painterScrapPcs = selectedPainterFilter !== 'ALL'
      ? dateLogs.reduce((s, l) => s + (l.scrapPieces || 0), 0)
      : currentRejectQty;

    const painterReworkPcs = selectedPainterFilter !== 'ALL'
      ? dateLogs.reduce((s, l) => s + (l.reworkPieces || 0), 0)
      : currentReworkQty;

    const painterRemainingPcs = Math.max(0, painterTargetPcs - painterGoodPcs - painterScrapPcs);
    const painterAchievedPct = painterTargetPcs > 0 ? Math.min(100, Math.round((painterGoodPcs / painterTargetPcs) * 100)) : 0;
    const painterScrapPct = painterTargetPcs > 0 ? ((painterScrapPcs / painterTargetPcs) * 100).toFixed(1) : '0.0';

    return (
      <div className="space-y-5">
        {/* Top Control Bar: Shift Identity */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#faf7ed] via-white to-white rounded-[22px] border border-[#f4e5be] shadow-2xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#faf3e0] border border-[#f4e5be] flex items-center justify-center text-[#8a6521] shrink-0">
              <Calendar className="w-5 h-5 text-[#8a6521]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a6521] font-mono">
                  Daily Shift Production & Chemicals Ledger
                </span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]">
                  {productionDates.length} Working {productionDates.length === 1 ? 'Date' : 'Dates'} Recorded
                </span>
                {selectedPainterFilter !== 'ALL' && (
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    Filtered by Painter: {selectedPainterFilter}
                  </span>
                )}
              </div>
              <h3 className="font-serif font-normal text-base sm:text-lg text-[#17191c] mt-0.5">
                {activeDateStr ? `Working Date Log: ${activeDateStr}` : 'Cumulative Production & Chemical Consumption Overview'}
              </h3>
            </div>
          </div>
        </div>

        {/* Filters Bar: Date Selector & Painter Selector */}
        <div className="p-4 bg-white rounded-[22px] border border-[#ececec] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          {/* Left: Date Picker & Quick Date Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#777b86]">
              Working Date:
            </span>
            <div className="w-44">
              <PaintkingDatePicker
                value={selectedProductionDate === 'ALL' ? '' : selectedProductionDate}
                onChange={(dateVal) => setSelectedProductionDate(dateVal || 'ALL')}
                placeholder="Pick Date 📅"
                highlightedDates={productionDates}
                className="bg-[#fafafb] border-[#dcdfe4] shadow-2xs text-xs"
              />
            </div>
            <button
              type="button"
              onClick={() => setSelectedProductionDate('ALL')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs ${
                selectedProductionDate === 'ALL'
                  ? 'bg-[#17191c] text-white'
                  : 'bg-[#fafafb] text-[#777b86] hover:text-[#17191c] border border-[#ececec]'
              }`}
            >
              All Dates
            </button>
            {productionDates.slice(0, 3).map(date => {
              const isSelected = activeDateStr === date;
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => setSelectedProductionDate(date)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs ${
                    isSelected
                      ? 'bg-[#8a6521] text-white'
                      : 'bg-[#fafafb] text-[#777b86] hover:text-[#17191c] border border-[#ececec]'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} />
                  <span>{date}</span>
                </button>
              );
            })}
          </div>

          {/* Right: Painter Filter Selector */}
          <div className="flex items-center gap-2 flex-wrap pt-2 md:pt-0 border-t md:border-t-0 border-[#ececec]">
            <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#8a6521] flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#c09748]" />
              <span>Filter Painter:</span>
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedPainterFilter('ALL')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs ${
                  selectedPainterFilter === 'ALL'
                    ? 'bg-[#8a6521] text-white'
                    : 'bg-[#fafafb] text-[#777b86] hover:text-[#17191c] border border-[#ececec]'
                }`}
              >
                All Painters ({jcPainters.length})
              </button>
              {jcPainters.map(p => {
                const isSelected = selectedPainterFilter === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSelectedPainterFilter(p)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs ${
                      isSelected
                        ? 'bg-[#17191c] text-white shadow-xs'
                        : 'bg-[#fafafb] text-[#777b86] hover:text-[#17191c] border border-[#ececec]'
                    }`}
                  >
                    <span>{p.split(' ')[0]}</span>
                    {activePainterAssignment && activePainterAssignment.painterName === p && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4 Quantitative Output Milestone Cards (Filtered by Date and Painter) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-[20px] border border-[#ececec] shadow-xs text-center space-y-1">
            <span className="text-[10px] text-[#777b86] uppercase font-mono font-bold block">
              {selectedPainterFilter !== 'ALL' ? `${selectedPainterFilter.split(' ')[0]}'s Target` : 'Allocated Target'}
            </span>
            <span className="font-mono font-bold text-xl text-[#17191c] block">
              {painterTargetPcs.toLocaleString('en-IN')} <span className="text-xs font-normal text-[#777b86]">Pcs</span>
            </span>
            <span className="text-[10.5px] text-[#777b86] block font-mono">
              {selectedPainterFilter !== 'ALL' ? 'Painter Target Quota' : (selectedDateSummary ? 'Shift Quota' : 'Total Base Target')}
            </span>
          </div>

          <div className="bg-emerald-50/80 p-4 rounded-[20px] border border-emerald-200 shadow-xs text-center space-y-1">
            <span className="text-[10px] text-emerald-800 uppercase font-mono font-bold block">Finished Good Output</span>
            <span className="font-mono font-bold text-xl text-emerald-700 block">
              {painterGoodPcs.toLocaleString('en-IN')} <span className="text-xs font-normal text-emerald-800">Pcs</span>
            </span>
            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              {painterAchievedPct}% Achieved
            </span>
          </div>

          <div className="bg-rose-50/80 p-4 rounded-[20px] border border-rose-200 shadow-xs text-center space-y-1">
            <span className="text-[10px] text-rose-800 uppercase font-mono font-bold block">Defects & Rejection</span>
            <span className="font-mono font-bold text-xl text-rose-700 block">
              {painterRejectPcs.toLocaleString('en-IN')} <span className="text-xs font-normal text-rose-800">Pcs</span>
            </span>
            <span className="text-[10.5px] text-rose-800 block font-mono">{painterScrapPct}% Defect Rate</span>
          </div>

          <div className="bg-amber-50/80 p-4 rounded-[20px] border border-amber-200 shadow-xs text-center space-y-1">
            <span className="text-[10px] text-amber-800 uppercase font-mono font-bold block">Remaining Floor WIP</span>
            <span className="font-mono font-bold text-xl text-amber-900 block">
              {painterRemainingPcs.toLocaleString('en-IN')} <span className="text-xs font-normal text-amber-800">Pcs</span>
            </span>
            <span className="text-[10.5px] text-amber-800 block font-mono">To Be Finished</span>
          </div>
        </div>

        {/* Company Materials / Chemicals Consumed Section */}
        <div className="bg-white p-5 sm:p-6 rounded-[24px] border border-[#ececec] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#ececec]">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#c09748]" />
                <h4 className="font-serif font-normal text-base sm:text-lg text-[#17191c]">
                  Company Chemicals & Consumables Consumed
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]">
                  {activeDateStr ? `Date: ${activeDateStr}` : 'Cumulative (All Dates)'}
                </span>
              </div>
              <p className="text-xs text-[#777b86] mt-0.5">
                Exact paints, thinners, and hardeners consumed by painter {selectedPainterFilter !== 'ALL' ? selectedPainterFilter : (painterName || 'Vikram Patel')} on the floor.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {companyMaterials.map((m, idx) => {
              let consumedVal = 0;
              if (activeDateStr) {
                const dayRecord = initialData?.dailyProductionHistory?.find(d => normalizeToIsoDate(d.date) === activeDateStr);
                const dayMat = dayRecord?.materialsConsumed?.find(mc => mc.materialId === m.id || mc.itemDescription === m.itemDescription);
                if (dayMat) {
                  consumedVal = dayMat.consumedQty;
                } else if (selectedDateSummary && selectedDateSummary.completed > 0) {
                  const ratio = targetQty > 0 ? (selectedDateSummary.completed / targetQty) : 0.5;
                  consumedVal = Number(((m.qty * ratio) || (m.materialType === 'paint' ? 4 : 1.5)).toFixed(2));
                }
              } else {
                consumedVal = m.consumedQty || 0;
              }

              const totalIssued = m.qty || 0;
              const floorBal = m.floorBalanceQty !== undefined ? m.floorBalanceQty : Math.max(0, Number((totalIssued - (m.consumedQty || 0)).toFixed(2)));
              const pctUsed = totalIssued > 0 ? Math.min(100, Math.round(((m.consumedQty || 0) / totalIssued) * 100)) : 0;

              return (
                <div key={m.id || idx} className="p-4 rounded-[18px] bg-[#fafafb] border border-[#ececec] space-y-3 shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-[#17191c]">{m.itemDescription}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]">
                          {m.materialType?.toUpperCase() || 'CHEMICAL'}
                        </span>
                        <span className="text-[10px] text-[#777b86] font-mono">{m.colour || 'Clear / Spec'}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[9.5px] text-[#777b86] uppercase font-mono block">
                        {activeDateStr ? 'Date Consumed' : 'Total Consumed'}
                      </span>
                      <span className="font-mono font-bold text-base text-[#8a6521]">
                        {consumedVal} {m.uom}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#ececec] flex items-center justify-between text-xs text-[#777b86]">
                    <span>Store Issued: <strong className="font-mono text-[#17191c] font-bold">{totalIssued} {m.uom}</strong></span>
                    <span>Floor Balance: <strong className="font-mono text-emerald-800 font-bold">{floorBal} {m.uom}</strong></span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-[#777b86]">
                      <span>Cumulative Usage</span>
                      <span>{pctUsed}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
                      <div 
                        className="h-full bg-[#c09748] rounded-full transition-all"
                        style={{ width: `${pctUsed}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Date-wise Shift Batches Logged */}
        <div className="bg-white p-5 sm:p-6 rounded-[24px] border border-[#ececec] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#ececec]">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#c09748]" />
                <h4 className="font-serif font-normal text-base sm:text-lg text-[#17191c]">
                  Shop Floor Time-Slot Batches Logged
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]">
                  {dateLogs.length} {dateLogs.length === 1 ? 'Batch' : 'Batches'}
                </span>
              </div>
              <p className="text-xs text-[#777b86] mt-0.5">
                Individual coating runs, ISO defect entries & corrective actions recorded for this date.
              </p>
            </div>
          </div>

          {dateLogs.length === 0 ? (
            <div className="p-6 rounded-[18px] bg-[#fafafb] border border-[#ececec] text-center text-xs text-[#777b86] space-y-1">
              <History className="w-6 h-6 text-[#dcdfe4] mx-auto mb-1" />
              <p className="font-semibold text-[#17191c]">No individual time-slot batches logged for this date.</p>
              <p>Shift output was logged as cumulative pieces or recorded in shift summary.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {dateLogs.map((log, idx) => (
                <div key={log.id || idx} className="p-3.5 rounded-[16px] bg-[#fafafb] border border-[#ececec] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-[#17191c]">
                        {log.timeLabel || (log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Shift Log')}
                      </span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]">
                        {log.stageName || (log.processStage === 'stage_1_primer' ? 'Stage 1 Primer' : log.processStage === 'stage_2_basecoat' ? 'Stage 2 Basecoat' : 'Stage 3 Topcoat')}
                      </span>
                      <span className="text-[#777b86] font-mono">By {log.painterName || painterName || 'Painter'}</span>
                    </div>
                    {log.defectReason && (
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-rose-800 font-semibold">Defect: {log.defectReason}</span>
                        {log.reworkAction && (
                          <span className="text-[#8a6521]">➔ ISO Action: {log.reworkAction}</span>
                        )}
                      </div>
                    )}
                    {log.remarks && (
                      <div className="text-[11px] text-[#777b86] italic">Note: {log.remarks}</div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                    <span className="px-2.5 py-1 rounded-full font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs">
                      +{log.goodPieces || log.piecesCompleted || 0} Good
                    </span>
                    {(log.reworkPieces || 0) > 0 && (
                      <span className="px-2.5 py-1 rounded-full font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200 text-xs">
                        +{log.reworkPieces} Rework
                      </span>
                    )}
                    {(log.scrapPieces || 0) > 0 && (
                      <span className="px-2.5 py-1 rounded-full font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200 text-xs">
                        +{log.scrapPieces} Scrap
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Master Working Dates History Ledger Table */}
        <div className="bg-white p-5 sm:p-6 rounded-[24px] border border-[#ececec] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#ececec]">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#c09748]" />
                <h4 className="font-serif font-normal text-base sm:text-lg text-[#17191c]">
                  All Working Dates Ledger for {jobCardNo}
                </h4>
              </div>
              <p className="text-xs text-[#777b86] mt-0.5">
                Summary record of all working shifts, target achievement, and chemical consumption on each date.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border border-[#ececec] rounded-[18px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f2f2f3] text-[#17191c] font-mono border-b border-[#ececec]">
                  <th className="py-2.5 px-3 font-bold">Working Date</th>
                  <th className="py-2.5 px-3 font-bold text-center">Daily Quota</th>
                  <th className="py-2.5 px-3 font-bold text-center text-emerald-800">Good Finished</th>
                  <th className="py-2.5 px-3 font-bold text-center text-rose-800">Scrap / Defect</th>
                  <th className="py-2.5 px-3 font-bold text-center">Achievement</th>
                  <th className="py-2.5 px-4 font-bold">Paints Consumed (Est)</th>
                  <th className="py-2.5 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececec]">
                {productionDates.map((date, idx) => {
                  const dayLogs = liveProgressLogs.filter(l => doesLogMatchDate(l, date));
                  const dayHist = initialData?.dailyProductionHistory?.find(d => normalizeToIsoDate(d.date) === date);
                  const dayGood = dayLogs.reduce((s, l) => s + (l.piecesCompleted || 0), 0) || dayHist?.goodPieces || 0;
                  const dayScrap = dayLogs.reduce((s, l) => s + (l.scrapPieces || 0) + (l.reworkPieces || 0), 0) || dayHist?.scrapPieces || 0;
                  const dayQuota = dayHist?.dailyTarget || dailyTargetQty || (targetQty <= 1000 ? targetQty : 1000);
                  const achPct = dayQuota > 0 ? Math.min(100, Math.round((dayGood / dayQuota) * 100)) : 0;
                  const isCurActive = activeDateStr === date;

                  return (
                    <tr key={date} className={`transition ${isCurActive ? 'bg-[#faf7ed]' : idx % 2 === 1 ? 'bg-[#fafafb]' : 'bg-white'}`}>
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-[#17191c] flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isCurActive ? 'bg-[#c09748]' : 'bg-emerald-500'}`} />
                          <span>{date}</span>
                          {date === todayStr && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-100 text-emerald-800 font-sans font-semibold">
                              Today
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-semibold text-[#17191c]">
                        {dayQuota.toLocaleString('en-IN')} Pcs
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700">
                        {dayGood.toLocaleString('en-IN')} Pcs
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-rose-700">
                        {dayScrap} Pcs
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                          achPct >= 80 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : achPct > 0 ? 'bg-[#faf3e0] text-[#8a6521] border-[#f4e5be]' : 'bg-gray-100 text-[#777b86] border-gray-200'
                        }`}>
                          {achPct}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#777b86] font-mono text-[11px]">
                        {dayGood > 0 ? `~${Number(((dayGood / (targetQty || 250)) * 8).toFixed(1))}L Basecoat • ~${Number(((dayGood / (targetQty || 250)) * 3).toFixed(1))}L Thinner` : '0L'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedProductionDate(date)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer shadow-2xs ${
                            isCurActive
                              ? 'bg-[#8a6521] text-white'
                              : 'bg-white hover:bg-[#f2f2f3] text-[#8a6521] border border-[#f4e5be]'
                          }`}
                        >
                          {isCurActive ? 'Viewing' : 'Inspect'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // RENDER DEDICATED QUALITY CONTROL GATES (PIR • FPA • IPQC)
  // =========================================================================
  const renderQualityTabContent = () => {
    return (
      <div className="space-y-6">
        {/* Top Quality Pipeline Overview */}
        <div className="bg-white p-5 rounded-[24px] border border-[#ececec] shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#faf3e0] border border-[#f4e5be] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#8a6521]" />
              </div>
              <div>
                <h3 className="font-serif font-normal text-lg sm:text-xl text-[#17191c]">
                  Quality Assurance Gates & Release Traceability
                </h3>
                <p className="text-xs text-[#777b86] font-mono mt-0.5">
                  Job Card: <strong className="text-[#17191c]">{jobCardNo}</strong> • Part: <strong className="text-[#17191c]">{partCode}</strong> • IATF 16949 / ISO 9001:2015 Compliant
                </p>
              </div>
            </div>

            {/* Overall Gate Clearance Status */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 border ${
                isPirPassed 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {isPirPassed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                <span>Gate 1 (PIR): {isPirPassed ? 'Passed' : 'Pending'}</span>
              </span>

              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 border ${
                isFpaApproved 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}>
                {isFpaApproved ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Sparkles className="w-3.5 h-3.5 text-blue-600" />}
                <span>Gate 2 (FPA): {isFpaApproved ? 'Approved' : 'Pending'}</span>
              </span>

              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 border bg-[#faf7ed] text-[#8a6521] border-[#f4e5be]">
                <Clock className="w-3.5 h-3.5 text-[#c09748]" />
                <span>Gate 3 (IPQC): {activeIpqcRecords.length} Audits</span>
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* GATE 1: PRE-PRODUCTION INSPECTION REPORT (PIR / PK-QA-PIR-001)            */}
        {/* ========================================================================= */}
        <div className="bg-white p-5 sm:p-6 rounded-[24px] border border-[#ececec] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f2f2f3]">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-[#faf3e0] text-[#8a6521] font-mono font-bold text-xs flex items-center justify-center border border-[#f4e5be]">
                G1
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-serif font-normal text-base sm:text-lg text-[#17191c]">
                    Gate 1: Pre-Production QC Inspection (PIR)
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-gray-100 text-gray-700 border border-gray-200">
                    Doc: PK-QA-PIR-001
                  </span>
                </div>
                <p className="text-xs text-[#777b86]">
                  Raw Substrates & Chemical Batch Verification before loading conveyor
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {activePirRecord ? (
                <>
                  <button
                    type="button"
                    onClick={() => downloadStandardPreProductionPdf(activePirRecord)}
                    className="px-3.5 py-1.5 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                    title="Download Official PIR PDF"
                  >
                    <Download className="w-3.5 h-3.5 text-[#8a6521]" />
                    <span>Download PIR PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPirModal(true)}
                    className="px-3.5 py-1.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#777b86]" />
                    <span>Edit / Re-Inspect</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPirModal(true)}
                  className="px-4 py-2 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Perform Gate 1 Check (PIR)</span>
                </button>
              )}
            </div>
          </div>

          {activePirRecord ? (
            <div className="space-y-4">
              {/* Report Metadata Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-[16px] bg-[#fafafb] border border-[#ececec]">
                  <span className="text-[10px] text-[#777b86] font-mono uppercase block">Report Number</span>
                  <span className="font-mono font-bold text-[#17191c]">{activePirRecord.reportNo}</span>
                </div>
                <div className="p-3 rounded-[16px] bg-[#fafafb] border border-[#ececec]">
                  <span className="text-[10px] text-[#777b86] font-mono uppercase block">Inspection Date</span>
                  <span className="font-mono font-bold text-[#17191c]">{activePirRecord.date}</span>
                </div>
                <div className="p-3 rounded-[16px] bg-[#fafafb] border border-[#ececec]">
                  <span className="text-[10px] text-[#777b86] font-mono uppercase block">Inspector / QA</span>
                  <span className="font-semibold text-[#17191c]">{activePirRecord.inspectedBy} / {activePirRecord.qaEngineer}</span>
                </div>
                <div className="p-3 rounded-[16px] bg-[#fafafb] border border-[#ececec]">
                  <span className="text-[10px] text-[#777b86] font-mono uppercase block">Overall Result</span>
                  <span className={`inline-block font-mono font-bold ${activePirRecord.overallResult === 'Passed' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    ● {activePirRecord.overallResult.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Quantities Verified */}
              <div className="p-3.5 rounded-[18px] bg-gradient-to-r from-[#faf7ed] to-white border border-[#f4e5be] flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-[10.5px] font-mono font-bold uppercase text-[#8a6521]">Substrate Material:</span>{' '}
                  <strong className="text-[#17191c]">{activePirRecord.substrateMaterial}</strong>
                </div>
                <div className="flex items-center gap-4 font-mono">
                  <span>Issued: <strong>{activePirRecord.issuedQty}</strong></span>
                  <span>•</span>
                  <span>Inspected: <strong>{activePirRecord.inspectedQty}</strong></span>
                  <span>•</span>
                  <span className="text-emerald-700 font-bold">Accepted: {activePirRecord.acceptedQty}</span>
                  {activePirRecord.rejectedQty > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-rose-700 font-bold">Rejected: {activePirRecord.rejectedQty}</span>
                    </>
                  )}
                </div>
              </div>

              {/* 8 Critical Substrate Checkpoints */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#777b86] font-mono block mb-2">
                  8 Critical Pre-Production Checkpoints (ASTM / IATF Standard)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                  {[
                    { label: '1. Physical Condition (No Dents)', val: activePirRecord.physicalCondition },
                    { label: '2. Burrs, Flash & Sink Marks', val: activePirRecord.burrsFlashSinkMarks },
                    { label: '3. Oil / Grease Free', val: activePirRecord.oilGreaseChemical },
                    { label: '4. IPA Chemical Wipe Clean', val: activePirRecord.cleaningIpaWiping },
                    { label: '5. Ionized Static Dedusting', val: activePirRecord.staticDedusting },
                    { label: '6. Masking & Hole Plugging', val: activePirRecord.maskingProtection },
                    { label: '7. Jigging & Hanging Orientation', val: activePirRecord.jiggingOrientation },
                    { label: '8. Physical Qty Verification', val: activePirRecord.quantityVerification },
                  ].map((chk, cIdx) => (
                    <div key={cIdx} className="p-2.5 rounded-[14px] bg-[#fafafb] border border-[#ececec] flex items-center justify-between gap-2">
                      <span className="text-[11px] text-[#777b86] truncate" title={chk.label}>{chk.label}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        chk.val === 'Pass' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : chk.val === 'N/A'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {chk.val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-[20px] bg-amber-50/50 border border-dashed border-amber-300 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center mx-auto text-amber-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-bold text-sm text-[#17191c]">Gate 1 Inspection Pending</h5>
                <p className="text-xs text-[#777b86] max-w-md mx-auto mt-1">
                  Raw substrates received from Store must be verified for flash, burrs, transit scratches, and degreased with IPA before conveyor hanging.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPirModal(true)}
                className="px-5 py-2 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Perform Gate 1 Substrate Check (PIR)</span>
              </button>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* GATE 2: FIRST PART APPROVAL (FPA - GOLDEN GATE / PK-QA-FPA-001)            */}
        {/* ========================================================================= */}
        <div className="bg-white p-5 sm:p-6 rounded-[24px] border border-[#ececec] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f2f2f3]">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-[#faf3e0] text-[#8a6521] font-mono font-bold text-xs flex items-center justify-center border border-[#f4e5be]">
                G2
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-serif font-normal text-base sm:text-lg text-[#17191c]">
                    Gate 2: First Part Approval (FPA - Golden Gate)
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-gray-100 text-gray-700 border border-gray-200">
                    Doc: PK-QA-FPA-001
                  </span>
                </div>
                <p className="text-xs text-[#777b86]">
                  Golden Sample release approval: Spectrophotometer &Delta;E &lt; 1.0, DFT microns, ASTM 5B Adhesion
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {activeFpaRecord ? (
                <>
                  <button
                    type="button"
                    onClick={() => downloadStandardFPAPdf(activeFpaRecord)}
                    className="px-3.5 py-1.5 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                    title="Download Official FPA PDF"
                  >
                    <Download className="w-3.5 h-3.5 text-[#8a6521]" />
                    <span>Download FPA PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFpaModal(true)}
                    className="px-3.5 py-1.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#777b86]" />
                    <span>Re-Test / Edit FPA</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowFpaModal(true)}
                  className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Perform First Part Approval (FPA)</span>
                </button>
              )}
            </div>
          </div>

          {activeFpaRecord ? (
            <div className="space-y-4">
              {/* Technical Measurement Cards (Spectrophotometer, DFT, Gloss, Adhesion) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-[20px] bg-emerald-50/70 border border-emerald-200/80 shadow-2xs text-center space-y-1">
                  <span className="text-[10px] text-emerald-800 uppercase font-mono font-bold block">
                    Spectrophotometer &Delta;E
                  </span>
                  <span className="font-mono font-bold text-2xl text-emerald-900 block">
                    {activeFpaRecord.deltaE !== undefined ? Number(activeFpaRecord.deltaE).toFixed(2) : '0.42'}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 block">
                    Tolerance &lt; 1.00 (Pass)
                  </span>
                </div>

                <div className="p-4 rounded-[20px] bg-[#fafafb] border border-[#ececec] shadow-2xs text-center space-y-1">
                  <span className="text-[10px] text-[#777b86] uppercase font-mono font-bold block">
                    Film Thickness (DFT)
                  </span>
                  <span className="font-mono font-bold text-2xl text-[#17191c] block">
                    {activeFpaRecord.dftMicrons ?? '38'} <span className="text-xs font-normal text-[#777b86]">µm</span>
                  </span>
                  <span className="text-[10px] font-mono text-[#777b86] block">
                    Spec: 35–45 µm
                  </span>
                </div>

                <div className="p-4 rounded-[20px] bg-[#fafafb] border border-[#ececec] shadow-2xs text-center space-y-1">
                  <span className="text-[10px] text-[#777b86] uppercase font-mono font-bold block">
                    60° Gloss Value
                  </span>
                  <span className="font-mono font-bold text-2xl text-[#17191c] block">
                    {activeFpaRecord.glossValue60 ?? '92'} <span className="text-xs font-normal text-[#777b86]">GU</span>
                  </span>
                  <span className="text-[10px] font-mono text-[#777b86] block">
                    High Gloss PU Clear
                  </span>
                </div>

                <div className="p-4 rounded-[20px] bg-emerald-50/70 border border-emerald-200/80 shadow-2xs text-center space-y-1">
                  <span className="text-[10px] text-emerald-800 uppercase font-mono font-bold block">
                    ASTM D3359 Adhesion
                  </span>
                  <span className="font-mono font-bold text-2xl text-emerald-900 block">
                    {activeFpaRecord.crossHatchAdhesion ?? '5B'}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 block">
                    100% Intact / Zero Flake
                  </span>
                </div>
              </div>

              {/* FPA Context Metadata */}
              <div className="p-4 rounded-[18px] bg-[#fafafb] border border-[#ececec] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-[#777b86] font-mono uppercase block">Report & Date</span>
                  <span className="font-mono font-bold text-[#17191c]">{activeFpaRecord.reportNo}</span>
                  <div className="text-[11px] text-[#777b86] font-mono">{activeFpaRecord.date}</div>
                </div>
                <div>
                  <span className="text-[10px] text-[#777b86] font-mono uppercase block">Painter & Booth</span>
                  <span className="font-semibold text-[#17191c]">{activeFpaRecord.painter}</span>
                  <div className="text-[11px] text-[#777b86] font-mono">{activeFpaRecord.booth}</div>
                </div>
                <div>
                  <span className="text-[10px] text-[#777b86] font-mono uppercase block">Paint Batch</span>
                  <span className="font-mono font-bold text-[#8a6521]">{activeFpaRecord.paintBatch}</span>
                  <div className="text-[11px] text-[#777b86]">{activeFpaRecord.color}</div>
                </div>
                <div>
                  <span className="text-[10px] text-[#777b86] font-mono uppercase block">QA Authorization</span>
                  <span className="font-semibold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{activeFpaRecord.qcEngineer}</span>
                  </span>
                  <div className="text-[10px] text-[#777b86] font-mono">
                    {activeFpaRecord.managerQAApproval ? 'Manager QA Released' : 'Pending Verification'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-[20px] bg-blue-50/50 border border-dashed border-blue-300 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center mx-auto text-blue-700">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-bold text-sm text-[#17191c]">First Part Approval (FPA) Pending</h5>
                <p className="text-xs text-[#777b86] max-w-md mx-auto mt-1">
                  1–5 trial pieces must be test sprayed and verified with Spectrophotometer (&Delta;E &lt; 1.0), DFT coating thickness, and ASTM D3359 cross-hatch tape test before mass production.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFpaModal(true)}
                className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Perform First Part Approval (FPA)</span>
              </button>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* GATE 3: IN-PROCESS QUALITY CONTROL (IPQC / PK-QA-IPQ-001)                 */}
        {/* ========================================================================= */}
        <div className="bg-white p-5 sm:p-6 rounded-[24px] border border-[#ececec] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f2f2f3]">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-[#faf3e0] text-[#8a6521] font-mono font-bold text-xs flex items-center justify-center border border-[#f4e5be]">
                G3
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-serif font-normal text-base sm:text-lg text-[#17191c]">
                    Gate 3: In-Process Quality Control (IPQC Line Audits)
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-gray-100 text-gray-700 border border-gray-200">
                    Doc: PK-QA-IPQ-001
                  </span>
                </div>
                <p className="text-xs text-[#777b86]">
                  Conveyor line inspection records across shift time-slots (8:00–11:00, 11:00–14:00, etc.)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIpqcModal(true)}
              className="px-4 py-2 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold shadow-2xs transition cursor-pointer flex items-center gap-1.5 active:scale-95 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5 text-[#c09748]" />
              <span>Record Line Audit (IPQC)</span>
            </button>
          </div>

          {activeIpqcRecords.length > 0 ? (
            <div className="space-y-3">
              {activeIpqcRecords.map((rec, rIdx) => (
                <div 
                  key={rec.reportNo || rIdx}
                  className="p-4 rounded-[18px] bg-[#fafafb] border border-[#ececec] hover:border-[#c09748]/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-[#17191c]">{rec.reportNo}</span>
                      <span className="px-2 py-0.5 rounded-full bg-white text-[#777b86] border border-[#ececec] font-mono text-[10px]">
                        {rec.date}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#faf7ed] text-[#8a6521] border border-[#f4e5be] font-mono text-[10px] font-bold">
                        {rec.shift || 'Shift A'} • {rec.booth || 'Booth #1'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        (rec.result || 'Pass') === 'Pass' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {rec.result || 'Pass'}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#777b86]">
                      Painter: <strong className="text-[#17191c]">{rec.painter}</strong> • Inspector: <strong className="text-[#17191c]">{rec.inspector || rec.verifiedBy || 'QC Inspector'}</strong>
                      {rec.deltaE !== undefined && (
                        <span> • Spectro &Delta;E: <strong className="text-[#8a6521] font-mono">{Number(rec.deltaE).toFixed(2)}</strong></span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => downloadStandardIPQCPdf(rec)}
                    className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#faf3e0] text-[#8a6521] border border-[#ececec] hover:border-[#f4e5be] text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs self-start sm:self-auto shrink-0"
                    title="Download Official IPQC PDF"
                  >
                    <Download className="w-3.5 h-3.5 text-[#8a6521]" />
                    <span>Download IPQC PDF</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-[20px] bg-gray-50/70 border border-dashed border-gray-300 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center mx-auto text-gray-500 shadow-2xs">
                <Clock className="w-5 h-5 text-[#c09748]" />
              </div>
              <div>
                <h5 className="font-bold text-sm text-[#17191c]">No In-Process Audits Recorded Yet</h5>
                <p className="text-xs text-[#777b86] max-w-md mx-auto mt-1">
                  Once mass production is running on the conveyor, record periodic 3-hour shift time-slot audits (bubbles, dust nibs, finish quality, &Delta;E).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowIpqcModal(true)}
                className="px-5 py-2 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 text-[#c09748]" />
                <span>Record First Line Audit (IPQC)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#fafafb] overflow-y-auto w-screen h-screen min-h-screen flex flex-col font-sans antialiased text-[#17191c]">
      
      {/* ========================================================================= */}
      {/* FULL PAGE DEDICATED HEADER WITH BREADCRUMB & STEPPER                      */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#ececec] px-4 sm:px-8 lg:px-10 py-3.5 shadow-2xs print:hidden">
        <div className="max-w-[1520px] mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] transition cursor-pointer active:scale-95 flex items-center gap-1.5 text-xs font-semibold"
            title="Return to Job Cards List"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Job Cards</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10px] font-mono font-bold uppercase tracking-wider">
                {isExistingCard ? 'LIVE PROCESS TRACKER' : `CREATION STEP ${currentStep} OF 4`}
              </span>
              <span className="text-[11px] font-mono text-[#777b86]">
                {jobCardNo} • {docNo} • Plant: {activePlant}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-serif text-[#17191c] font-normal leading-tight mt-0.5">
              {isExistingCard 
                ? `Job Card Execution Tracker • ${customer} (${jobCardNo})` 
                : STEP_TITLES[currentStep - 1]}
            </h1>
          </div>
        </div>

        {/* Right Action Icons: Mode Switcher & Close */}
        <div className="flex items-center gap-2.5">
          {isExistingCard && (
            <>
              {(currentGoodQty > 0 || (currentJcForModals.goodQty || 0) > 0) && (
                <button
                  type="button"
                  onClick={() => downloadStandardProductionOfferingPdf(currentJcForModals)}
                  className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#fafafb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                  title="Download Production Offering & QA Handover Slip (Doc: PK-PRD-OFF-01)"
                >
                  <FileText className="w-3.5 h-3.5 text-[#c09748]" />
                  <span className="hidden sm:inline">Offering Slip</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="px-3.5 py-1.5 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                title="Download Job Card PDF Slip to print and hand to painter"
              >
                <Download className="w-3.5 h-3.5 text-[#8a6521]" />
                <span className="hidden sm:inline">Download PDF Slip</span>
              </button>
            </>
          )}

          <div className="flex items-center p-1 rounded-full bg-[#fafafb] border border-[#ececec] text-xs">
            <button
              type="button"
              onClick={() => setViewMode('PORTAL')}
              className={`px-3 py-1 rounded-full font-bold transition cursor-pointer ${
                viewMode === 'PORTAL' ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]' : 'text-[#777b86]'
              }`}
            >
              Interactive View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('PRINT')}
              className={`px-3 py-1 rounded-full font-bold transition cursor-pointer ${
                viewMode === 'PRINT' ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]' : 'text-[#777b86]'
              }`}
            >
              Print Slip
            </button>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] cursor-pointer transition active:scale-95 shadow-2xs"
            title="Print Job Slip"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#fafafb] hover:bg-[#f2f2f3] text-[#777b86] hover:text-[#17191c] border border-[#ececec] flex items-center justify-center cursor-pointer transition active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* STANDARDIZED COMPACT CONNECTED PILL STEPPER (Shown when creating new Job Card) */}
      {/* ========================================================================= */}
      {!isExistingCard && viewMode === 'PORTAL' && (
        <div className="bg-white border-b border-[#ececec] py-2 px-4">
          <div className="flex items-center justify-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar">
            {[
              { num: 1, label: '1. Master Order' },
              { num: 2, label: '2. Substrate & SLA' },
              { num: 3, label: '3. Painter Quotas' },
              { num: 4, label: '4. Materials & Launch' }
            ].map((st, idx, arr) => {
              const isActive = currentStep === st.num;
              const isDone = currentStep > st.num;
              return (
                <React.Fragment key={st.num}>
                  <button
                    key={st.num}
                    type="button"
                    onClick={() => {
                      if (st.num < currentStep || validateCurrentStep(currentStep)) {
                        setCurrentStep(st.num);
                      }
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border shrink-0 ${
                      isActive
                        ? 'bg-[#faf3e0] text-[#8a6521] border-[#f4e5be] shadow-2xs ring-1 ring-[#c09748]/20'
                        : isDone
                        ? 'bg-[#faf7ed] text-[#17191c] border-[#f4e5be]'
                        : 'bg-white text-[#777b86] border-[#e5e7eb] hover:border-gray-400'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                      isActive
                        ? 'bg-[#c09748] text-white shadow-2xs'
                        : isDone
                        ? 'bg-[#8a6521] text-white'
                        : 'bg-gray-200 text-[#777b86]'
                    }`}>
                      {isDone ? '✓' : st.num}
                    </span>
                    <span>{st.label}</span>
                  </button>
                  {idx < arr.length - 1 && (
                    <div className="w-4 sm:w-8 h-px bg-[#e5e7eb] shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN CONTENT CANVAS (Single Point Question Displayed At A Time)           */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-[1520px] mx-auto w-full px-4 sm:px-8 lg:px-10 py-6 space-y-6">
        
        

        {/* ========================================================================= */}
        {/* VIEW MODE 1: INTERACTIVE STEP-BY-STEP QUESTION WIZARD                     */}
        {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* VIEW MODE 1: ORGANIZED READ-ONLY VIEW (FOR EXISTING / CREATED JOB CARDS) */}
        {/* ========================================================================= */}
        {viewMode === 'PORTAL' && isExistingCard && (
          <div className="space-y-6">

            {/* Top Master Summary Banner for Existing Job Card */}
            <div className="bg-white rounded-[24px] p-6 sm:p-7 border border-[#ececec] shadow-xs">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]">
                      {jobCardNo}
                    </span>
                    <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-[#faf7ed] text-[#17191c] border border-[#f4e5be] flex items-center gap-1.5 shadow-2xs">
                      <PackageCheck className="w-3.5 h-3.5 text-[#c09748]" />
                      <span>GRN: {selectedGrnNo || 'PK-GRN-VERIFIED'}</span>
                    </span>
                    <span className="text-[11px] font-sans font-semibold px-2.5 py-0.5 rounded-full bg-[#fafafb] text-[#777b86] border border-[#ececec]">
                      Plant: {activePlant}
                    </span>
                    <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#faf7ed] text-[#8a6521] border border-[#f4e5be]">
                      ● ACTIVE FLOOR EXECUTION
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to permanently delete Job Card ${jobCardNo}? This action cannot be undone.`)) {
                        deleteJobCard(jobCardNo);
                        onClose();
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                    title="Permanently Delete this Job Card"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Delete Job Card</span>
                  </button>
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif text-[#17191c] font-normal tracking-tight">
                  {customer}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[#777b86] font-mono">
                  <span>Part: <strong className="text-[#17191c]">{partCode}</strong> ({partDescription})</span>
                  <span>•</span>
                  <span>Process: <strong className="text-[#17191c] font-sans">{processType}</strong></span>
                  <span>•</span>
                  <span>Challan / WO: <strong className="text-[#17191c]">{wNo}</strong></span>
                  <span>•</span>
                  <span>Painter: <strong className="text-[#8a6521] font-sans">{painterName}</strong></span>
                </div>
              </div>
            </div>

            {/* Dedicated Sub-view Tab Navigation for Existing Job Card (3-Tier + QA) */}
            <div className="flex items-center gap-2 border-b border-[#ececec] pb-3 flex-wrap">
              {/* Tier 1: Master Order Overview */}
              <button
                type="button"
                onClick={() => setExistingCardTab('EXECUTION')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  existingCardTab === 'EXECUTION'
                    ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] shadow-2xs ring-1 ring-[#c09748]/20'
                    : 'bg-white text-[#777b86] hover:text-[#17191c] border border-[#ececec]'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-[#c09748]" />
                <span>1. Master Order Overview</span>
              </button>

              {/* Merged Tier 2 + 3: Painter Operations & Material Ledger */}
              <button
                type="button"
                onClick={() => setExistingCardTab('PAINTER_ASSIGNMENTS')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  existingCardTab === 'PAINTER_ASSIGNMENTS'
                    ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] shadow-2xs ring-1 ring-[#c09748]/20'
                    : 'bg-white text-[#777b86] hover:text-[#17191c] border border-[#ececec]'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-[#c09748]" />
                <span>2. Painter Operations &amp; Material Ledger ({currentJcAssignments.length})</span>
              </button>

              {/* QA Gates */}
              <button
                type="button"
                onClick={() => setExistingCardTab('QUALITY')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  existingCardTab === 'QUALITY'
                    ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] shadow-2xs ring-1 ring-[#c09748]/20'
                    : 'bg-white text-[#777b86] hover:text-[#17191c] border border-[#ececec]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#c09748]" />
                <span>3. Quality Control Gates (PIR • FPA • IPQC)</span>
                {isFpaApproved ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    ✓ FPA Approved
                  </span>
                ) : isPirPassed ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    Gate 2: FPA Due
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    Gate 1: PIR Due
                  </span>
                )}
              </button>
            </div>

            {existingCardTab === 'EXECUTION' ? (
              <div className="space-y-6">

            {/* Read-Only Quality Gate Status Strip */}
            <div className={`p-3.5 rounded-[20px] border shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
              isFpaApproved
                ? 'bg-emerald-50/70 border-emerald-200'
                : isPirPassed
                ? 'bg-blue-50/70 border-blue-200'
                : 'bg-amber-50/70 border-amber-200'
            }`}>
              <div className="flex items-center gap-2.5">
                {isFpaApproved ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                ) : isPirPassed ? (
                  <Sparkles className="w-4 h-4 text-blue-700 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                )}
                <div className="text-xs">
                  <span className="font-bold text-[#17191c]">
                    {isFpaApproved
                      ? `Quality Cleared (${activeFpaRecord?.reportNo || 'FPA Approved'})`
                      : isPirPassed
                      ? `Gate 1 PIR Cleared (${activePirRecord?.reportNo}) • Gate 2 FPA Pending`
                      : 'Gate 1 Pre-Production Inspection (PIR) Pending'}
                  </span>
                  <span className="text-[#777b86] ml-2 hidden sm:inline">
                    {isFpaApproved
                      ? `ΔE: ${activeFpaRecord?.deltaE ?? '0.42'} • Adhesion: ${activeFpaRecord?.crossHatchAdhesion ?? '5B'}`
                      : 'Complete quality gates in Tab 4 before mass line release.'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExistingCardTab('QUALITY')}
                className="px-3.5 py-1.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold shadow-2xs transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shrink-0 active:scale-95"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#c09748]" />
                <span>Open Quality Gates</span>
              </button>
            </div>

            {/* 1. Master Job Card Full Details & Active Painters (100% Read-Only) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Customer & Order Reference */}
              <div className="bg-white p-5 rounded-[24px] border border-[#ececec] shadow-xs flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10.5px] font-bold text-[#c09748] uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#c09748]" />
                    <span>Customer & Order Reference</span>
                  </span>
                  <div className="mt-2.5">
                    <div className="text-[11px] font-medium text-[#777b86]">Customer / Party Name</div>
                    <div className="text-sm font-bold text-[#17191c] font-sans truncate mt-0.5" title={customer}>
                      {customer}
                    </div>
                    <div className="text-xs text-[#777b86] truncate mt-0.5">
                      Challan / WO Ref: <strong className="font-mono text-[#17191c] font-medium">{wNo || '-'}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-[#f2f2f3] space-y-2 text-xs">
                  <div className="flex justify-between items-center h-6">
                    <span className="text-[#777b86]">Finishing Process:</span>
                    <span className="font-semibold text-[#17191c] truncate max-w-[170px] text-right">{processType}</span>
                  </div>
                  <div className="flex justify-between items-center h-6">
                    <span className="text-[#777b86]">Linked GRN:</span>
                    <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#faf7ed] text-[#8a6521] border border-[#f4e5be]">
                      {selectedGrnNo || 'PK-GRN-VERIFIED'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center h-6">
                    <span className="text-[#777b86]">Issued Date:</span>
                    <span className="font-mono text-[11px] font-semibold text-[#17191c]">{issueDate}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Component & Order Specifications */}
              <div className="bg-white p-5 rounded-[24px] border border-[#ececec] shadow-xs flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10.5px] font-bold text-[#c09748] uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#c09748]" />
                    <span>Component & Order Specifications</span>
                  </span>
                  <div className="mt-2.5">
                    <div className="text-[11px] font-medium text-[#777b86]">Part Specification</div>
                    <div className="text-sm font-bold text-[#17191c] font-mono truncate mt-0.5" title={partCode}>
                      {partCode}
                    </div>
                    <div className="text-xs text-[#777b86] truncate mt-0.5" title={partDescription}>
                      {partDescription || 'Automotive Component Substrate'}
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-[#f2f2f3] space-y-2 text-xs">
                  <div className="flex justify-between items-center h-6">
                    <span className="text-[#777b86]">Total Order Qty:</span>
                    <span className="font-mono font-bold text-xs text-[#17191c]">
                      {targetQty.toLocaleString('en-IN')} Pieces
                    </span>
                  </div>
                  <div className="flex justify-between items-center h-6">
                    <span className="text-[#777b86]">Colour Assignment:</span>
                    <span className="text-[11px] font-semibold text-[#777b86]">
                      Per Painter Shift
                    </span>
                  </div>
                  <div className="flex justify-between items-center h-6">
                    <span className="text-[#777b86]">Finish Deadline:</span>
                    <span className="font-mono font-bold text-[11px] text-[#17191c]">{deadlineDate} • {deadlineTime}</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Active Painters on This Master Job Card (Read-Only) */}
              <div className="bg-white p-5 rounded-[24px] border border-[#ececec] shadow-xs flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10.5px] font-bold text-[#c09748] uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#c09748]" />
                      <span>Active Painters ({currentJcAssignments.length})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setExistingCardTab('PAINTER_ASSIGNMENTS')}
                      className="text-[10px] font-bold text-[#8a6521] hover:underline cursor-pointer"
                    >
                      Manage in Tab 2 →
                    </button>
                  </div>

                  <div className="mt-2.5 space-y-2 max-h-[148px] overflow-y-auto pr-0.5">
                    {currentJcAssignments.length > 0 ? (
                      currentJcAssignments.map((asg) => {
                        const metrics = getAssignmentLiveMetrics(asg);
                        return (
                        <div key={asg.id} className="p-2.5 rounded-[14px] bg-[#fafafb] border border-[#ececec] flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#17191c] truncate">{asg.painterName}</div>
                            <div className="text-[10px] text-[#777b86] font-mono flex items-center gap-1.5 truncate">
                              <span>{asg.boothNumber || (asg as any).boothNo || 'Booth #1'}</span>
                              <span>•</span>
                              <span>{asg.processStage || 'Full System'}</span>
                              {asg.colorShade && (
                                <>
                                  <span>•</span>
                                  <span className="text-[#8a6521] font-semibold">{asg.colorShade}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-[11px] text-[#8a6521] bg-[#faf3e0] px-2 py-0.5 rounded-full border border-[#f4e5be]">
                              {metrics.completedGood} / {asg.dailyTargetQty} Pcs
                            </span>
                            <span className={`block text-[9px] font-mono mt-0.5 ${asg.status.includes('Met') ? 'text-emerald-700 font-bold' : asg.status.includes('Active') ? 'text-blue-700' : 'text-[#777b86]'}`}>
                              {asg.status}
                            </span>
                          </div>
                        </div>
                        );
                      })
                    ) : (
                      <div className="p-3.5 rounded-[14px] bg-[#fafafb] border border-dashed border-[#ececec] text-center space-y-1">
                        <div className="text-xs font-semibold text-[#17191c]">No painters assigned yet</div>
                        <div className="text-[11px] text-[#777b86]">
                          Open Tab 2 (Painter Shift Assignments) to assign painters, daily targets, colours &amp; chemicals.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2.5 border-t border-[#f2f2f3] flex justify-between items-center text-xs h-6">
                  <span className="text-[#777b86]">Deadline Status:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${deadlineStatus.badgeColor}`}>
                    {deadlineStatus.label}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Total Materials & Chemicals Summary (Read-Only Roll-Up across all Painters) */}
            {(() => {
              const jcLogs = assignmentMaterialLogs.filter(
                l => l.masterJobCardNo === jobCardNo || (l as any).masterJobCardId === jobCardNo
              );
              const aggregatedMap = new Map<string, {
                materialName: string;
                materialType: string;
                uom: string;
                issued: number;
                returned: number;
                wastage: number;
                netConsumed: number;
                painters: Set<string>;
                batches: Set<string>;
              }>();

              jcLogs.forEach(log => {
                const key = `${log.materialName}__${log.materialType}__${log.uom}`;
                const existing = aggregatedMap.get(key) || {
                  materialName: log.materialName,
                  materialType: log.materialType,
                  uom: log.uom,
                  issued: 0,
                  returned: 0,
                  wastage: 0,
                  netConsumed: 0,
                  painters: new Set<string>(),
                  batches: new Set<string>()
                };
                existing.issued += Number(log.issuedQty || 0);
                existing.returned += Number(log.goodReturnedQty || 0);
                existing.wastage += Number(log.floorWastageExpiredQty || 0);
                existing.netConsumed += Number(log.netConsumedQty || 0);
                if (log.painterName) existing.painters.add(log.painterName);
                if (log.batchNumber) existing.batches.add(log.batchNumber);
                aggregatedMap.set(key, existing);
              });

              const aggregatedMaterials = Array.from(aggregatedMap.values());
              const hasTier3Logs = aggregatedMaterials.length > 0;

              return (
                <div className="bg-white p-6 sm:p-7 rounded-[24px] border border-[#ececec] shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ececec]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#c09748]" />
                        <h3 className="font-serif font-normal text-lg sm:text-xl text-[#17191c]">
                          Total Materials &amp; Chemicals Used
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]">
                          Read-Only Job Summary
                        </span>
                      </div>
                      <p className="text-xs text-[#777b86] mt-0.5">
                        Total paints, hardeners &amp; thinners issued and consumed across all painter shifts on this job card.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExistingCardTab('PAINTER_ASSIGNMENTS')}
                      className="text-xs font-bold text-[#8a6521] hover:underline cursor-pointer self-start sm:self-auto"
                    >
                      Manage Painters &amp; Chemicals in Tab 2 →
                    </button>
                  </div>

                  {hasTier3Logs ? (
                    <div className="border border-[#ececec] rounded-[18px] overflow-hidden bg-white shadow-2xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-[#f2f2f3] text-[#17191c] font-mono border-b border-[#ececec]">
                              <th className="py-2.5 px-3 font-bold w-10 text-center">#</th>
                              <th className="py-2.5 px-4 font-bold min-w-[200px]">Material Description</th>
                              <th className="py-2.5 px-3 font-bold text-right whitespace-nowrap">Total Issued</th>
                              <th className="py-2.5 px-3 font-bold text-right text-emerald-800 whitespace-nowrap">Good Returned</th>
                              <th className="py-2.5 px-3 font-bold text-right text-rose-800 whitespace-nowrap">Floor Wastage</th>
                              <th className="py-2.5 px-3 font-bold text-right text-[#8a6521] whitespace-nowrap">Net Consumed</th>
                              <th className="py-2.5 px-3 font-bold text-center">UOM</th>
                              <th className="py-2.5 px-4 font-bold whitespace-nowrap">Batches / Painters</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#ececec]">
                            {aggregatedMaterials.map((mat, idx) => (
                              <tr key={`${mat.materialName}-${idx}`} className={idx % 2 === 1 ? 'bg-[#fafafb]' : 'bg-white'}>
                                <td className="py-3 px-3 text-center font-mono text-[#777b86] font-semibold">{idx + 1}</td>
                                <td className="py-3 px-4">
                                  <div className="font-semibold text-[#17191c]">{mat.materialName}</div>
                                  <span className="text-[10px] text-[#777b86] uppercase font-mono">{mat.materialType}</span>
                                </td>
                                <td className="py-3 px-3 text-right font-mono font-bold text-[#17191c]">{mat.issued.toFixed(2)}</td>
                                <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-700">{mat.returned.toFixed(2)}</td>
                                <td className="py-3 px-3 text-right font-mono font-semibold text-rose-700">{mat.wastage.toFixed(2)}</td>
                                <td className="py-3 px-3 text-right font-mono font-bold text-[#8a6521]">{mat.netConsumed.toFixed(2)}</td>
                                <td className="py-3 px-3 text-center font-mono text-[#777b86]">{mat.uom}</td>
                                <td className="py-3 px-4 text-xs text-[#777b86]">
                                  <div className="font-mono text-[11px] text-[#17191c]">
                                    {Array.from(mat.batches).join(', ') || '-'}
                                  </div>
                                  <div className="text-[10px] text-[#777b86]">
                                    Painters: {Array.from(mat.painters).join(', ') || '-'}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : companyMaterials.length > 0 ? (
                    <div className="border border-[#ececec] rounded-[18px] overflow-hidden bg-white shadow-2xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-[#f2f2f3] text-[#17191c] font-mono border-b border-[#ececec]">
                              <th className="py-2.5 px-3 font-bold w-10 text-center">#</th>
                              <th className="py-2.5 px-4 font-bold min-w-[200px]">Material Description</th>
                              <th className="py-2.5 px-3 font-bold text-center whitespace-nowrap">Store Issued</th>
                              <th className="py-2.5 px-3 font-bold text-center text-[#8a6521] whitespace-nowrap">Actual Consumed</th>
                              <th className="py-2.5 px-3 font-bold text-center text-emerald-800 whitespace-nowrap">Floor Balance</th>
                              <th className="py-2.5 px-2 font-bold text-center">UOM</th>
                              <th className="py-2.5 px-3 font-bold whitespace-nowrap">Shade / Batch</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#ececec]">
                            {companyMaterials.map((item, idx) => {
                              const consumed = item.consumedQty !== undefined ? item.consumedQty : 0;
                              const balance = item.floorBalanceQty !== undefined ? item.floorBalanceQty : Math.max(0, Number((item.qty - consumed).toFixed(2)));
                              return (
                                <tr key={item.id || idx} className={idx % 2 === 1 ? 'bg-[#fafafb]' : 'bg-white'}>
                                  <td className="py-3 px-3 text-center font-mono text-[#777b86] font-semibold">{idx + 1}</td>
                                  <td className="py-3 px-4 font-semibold text-[#17191c]">{item.itemDescription}</td>
                                  <td className="py-3 px-3 text-center font-mono font-bold text-[#17191c]">{item.qty}</td>
                                  <td className="py-3 px-3 text-center font-mono font-bold text-[#8a6521]">{consumed}</td>
                                  <td className="py-3 px-3 text-center font-mono font-bold text-emerald-800">{balance}</td>
                                  <td className="py-3 px-2 text-center font-mono text-[#777b86]">{item.uom}</td>
                                  <td className="py-3 px-3 font-mono text-xs text-[#777b86]">{item.colour || item.batchNo || '-'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-[#777b86] bg-[#fafafb] rounded-[16px] border border-dashed border-[#ececec]">
                      No paints, thinners, or hardeners have been issued yet. Assign a painter &amp; issue materials in Tab 2 (Painter Shift Assignments).
                    </div>
                  )}

                </div>
              );
            })()}

            {/* 2B. Working Dates & Painter Shift Ledger (Read-Only Date-Wise History) */}
            <div className="bg-white p-6 sm:p-7 rounded-[24px] border border-[#ececec] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#ececec]">
                <div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#c09748]" />
                    <h3 className="font-serif font-normal text-lg sm:text-xl text-[#17191c]">
                      Working Dates &amp; Painter Shift Ledger for {jobCardNo}
                    </h3>
                  </div>
                  <p className="text-xs text-[#777b86] mt-0.5">
                    Date-wise list of every painter shift, spray booth, daily target quota, good output, scrap, and achievement %.
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] self-start sm:self-auto">
                  {currentJcAssignments.length} {currentJcAssignments.length === 1 ? 'Shift Entry' : 'Shift Entries'}
                </span>
              </div>

              {currentJcAssignments.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#777b86] bg-[#fafafb] rounded-[16px] border border-dashed border-[#ececec]">
                  No working dates recorded yet. Assign a painter in Tab 2 (Painter Shift Assignments) to start tracking daily shifts.
                </div>
              ) : (
                <div className="border border-[#ececec] rounded-[18px] overflow-hidden bg-white shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#f2f2f3] text-[#17191c] font-mono border-b border-[#ececec]">
                          <th className="py-2.5 px-4 font-bold whitespace-nowrap">Date</th>
                          <th className="py-2.5 px-4 font-bold min-w-[160px]">Painter</th>
                          <th className="py-2.5 px-4 font-bold whitespace-nowrap">Booth</th>
                          <th className="py-2.5 px-3 font-bold text-right whitespace-nowrap">Daily Quota</th>
                          <th className="py-2.5 px-3 font-bold text-right text-emerald-800 whitespace-nowrap">Good</th>
                          <th className="py-2.5 px-3 font-bold text-right text-rose-800 whitespace-nowrap">Scrap</th>
                          <th className="py-2.5 px-4 font-bold text-center whitespace-nowrap">Achieved</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ececec]">
                        {[...currentJcAssignments]
                          .sort((a, b) => (b.assignmentDate || '').localeCompare(a.assignmentDate || ''))
                          .map((asg, idx) => {
                            const todayIso = new Date().toISOString().split('T')[0];
                            const metrics = getAssignmentLiveMetrics(asg);
                            const quota = Number(asg.dailyTargetQty || 0);
                            const good = metrics.completedGood;
                            const scrap = metrics.scrap;
                            const achievedPct = metrics.efficiency;

                            return (
                              <tr key={asg.id || idx} className={idx % 2 === 1 ? 'bg-[#fafafb]' : 'bg-white'}>
                                <td className="py-3 px-4 font-mono font-bold text-[#17191c] whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${asg.assignmentDate === todayIso ? 'bg-emerald-500' : 'bg-[#c09748]'}`} />
                                    <span>{asg.assignmentDate}</span>
                                    {asg.assignmentDate === todayIso && (
                                      <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        Today
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="font-semibold text-[#17191c]">{asg.painterName}</div>
                                  {asg.colorShade && (
                                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]">
                                      {asg.colorShade}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 font-mono text-[#777b86] whitespace-nowrap">
                                  {(asg.boothNumber || (asg as any).boothNo || '-').split('(')[0].trim()}
                                </td>
                                <td className="py-3 px-3 text-right font-mono font-bold text-[#17191c] whitespace-nowrap">
                                  {quota.toLocaleString('en-IN')} Pcs
                                </td>
                                <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                                  {good.toLocaleString('en-IN')} Pcs
                                </td>
                                <td className="py-3 px-3 text-right font-mono font-bold text-rose-700 whitespace-nowrap">
                                  {scrap.toLocaleString('en-IN')} Pcs
                                </td>
                                <td className="py-3 px-4 text-center whitespace-nowrap">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border ${
                                    achievedPct >= 100
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : achievedPct > 0
                                      ? 'bg-[#faf3e0] text-[#8a6521] border-[#f4e5be]'
                                      : 'bg-[#f2f2f3] text-[#777b86] border-[#ececec]'
                                  }`}>
                                    {achievedPct}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* 3. MASTER ORDER TOTAL PIECES & COMPLETION STATUS (Read-Only) */}
            <div className="bg-white p-6 sm:p-7 rounded-[24px] border border-[#ececec] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ececec]">
                <div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#c09748]" />
                    <span className="text-[10px] font-bold text-[#c09748] uppercase tracking-wider font-mono">
                      Master Order Completion Summary
                    </span>
                  </div>
                  <h2 className="font-serif font-normal text-xl text-[#17191c] mt-0.5">
                    Total Pieces Completed &amp; Remaining Status
                  </h2>
                </div>

                <div className={`px-3 py-1 rounded-full border text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-2xs self-start sm:self-auto ${deadlineStatus.badgeColor}`}>
                  <span>Deadline: {deadlineDate} • {deadlineTime}</span>
                  <span className="opacity-80">({deadlineStatus.label})</span>
                </div>
              </div>

              {/* 5 Metric Cards Grid (Total Job Card Status) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="bg-[#fafafb] p-3.5 rounded-[16px] border border-[#ececec] space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[#777b86] font-bold block flex items-center gap-1">
                    <Layers className="w-3 h-3 text-[#c09748]" />
                    Total Order Qty
                  </span>
                  <div className="font-mono text-xl font-bold text-[#17191c]">
                    {targetQty.toLocaleString('en-IN')} <span className="text-xs font-normal text-[#777b86]">Pcs</span>
                  </div>
                  <div className="text-[10px] text-[#777b86] font-mono truncate">
                    {currentJcAssignments.length} Shift Assignment(s)
                  </div>
                </div>

                <div className="bg-[#faf7ed] p-3.5 rounded-[16px] border border-[#f4e5be] space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[#8a6521] font-bold block flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#c09748]" />
                    Completed OK
                  </span>
                  <div className="font-mono text-xl font-bold text-[#8a6521]">
                    {currentGoodQty.toLocaleString('en-IN')} <span className="text-xs font-normal text-[#777b86]">Pcs</span>
                  </div>
                  <div className="text-[10px] text-[#8a6521] font-semibold font-mono">
                    {progressPercent}% First-Pass Yield
                  </div>
                </div>

                <div className="bg-amber-50/70 p-3.5 rounded-[16px] border border-amber-200 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-amber-800 font-bold block flex items-center gap-1">
                    <RotateCcw className="w-3 h-3 text-amber-600" />
                    Rework (Salvage)
                  </span>
                  <div className="font-mono text-xl font-bold text-amber-900">
                    {currentReworkQty.toLocaleString('en-IN')} <span className="text-xs font-normal text-amber-700">Pcs</span>
                  </div>
                  <div className="text-[10px] text-amber-800 font-mono">
                    {reworkPercent}% Reworked
                  </div>
                </div>

                <div className="bg-rose-50/70 p-3.5 rounded-[16px] border border-rose-200 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-rose-800 font-bold block flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                    Dead Scrap (Rej)
                  </span>
                  <div className="font-mono text-xl font-bold text-rose-900">
                    {currentRejectQty.toLocaleString('en-IN')} <span className="text-xs font-normal text-rose-700">Pcs</span>
                  </div>
                  <div className="text-[10px] text-rose-800 font-mono">
                    {scrapPercent}% Scrap Rate
                  </div>
                </div>

                <div className="bg-[#fafafb] p-3.5 rounded-[16px] border border-[#ececec] space-y-1 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-mono uppercase text-[#777b86] font-bold block flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#979799]" />
                    Remaining
                  </span>
                  <div className="font-mono text-xl font-bold text-[#17191c]">
                    {remainingQty.toLocaleString('en-IN')} <span className="text-xs font-normal text-[#777b86]">Pcs</span>
                  </div>
                  <div className="text-[10px] text-[#777b86] font-mono">
                    {remainingQty === 0 ? '100% Target Met' : 'Pending Balance'}
                  </div>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-[#777b86]">
                    Order Completion: <strong className="text-[#8a6521]">{currentGoodQty} Good</strong> + <strong className="text-amber-800">{currentReworkQty} Rework</strong> + <strong className="text-rose-700">{currentRejectQty} Scrap</strong> of {targetQty} Pcs
                  </span>
                  <span className="font-bold text-[#17191c]">{totalAchievedPercent}% Net Passed</span>
                </div>
                <div className="h-2.5 w-full bg-[#f2f2f3] rounded-full overflow-hidden flex border border-[#ececec]">
                  <div
                    className="bg-[#c09748] h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, targetQty > 0 ? (currentGoodQty / targetQty) * 100 : 0)}%` }}
                    title={`Good Pieces: ${currentGoodQty}`}
                  />
                  <div
                    className="bg-amber-400 h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, targetQty > 0 ? (currentReworkQty / targetQty) * 100 : 0)}%` }}
                    title={`Rework Recovered: ${currentReworkQty}`}
                  />
                  <div
                    className="bg-rose-500 h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, targetQty > 0 ? (currentRejectQty / targetQty) * 100 : 0)}%` }}
                    title={`Dead Scrap: ${currentRejectQty}`}
                  />
                </div>
              </div>
            </div>
          </div>
      ) : existingCardTab === 'QUALITY' ? (
        renderQualityTabContent()
      ) : (
        /* MERGED TAB 2: PAINTER OPERATIONS, 3-STAGE OUTPUT & COMPANY CONSUMABLES */
        <div className="space-y-5">
          {/* Top Control Bar + Painter Filter Pills */}
          <div className="p-5 bg-white rounded-[24px] border border-[#ececec] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#c09748]" />
                  <span className="text-[11px] font-mono font-bold text-[#8a6521] uppercase tracking-wider">
                    Painter Operations • 3-Stage Output &amp; Company Consumables
                  </span>
                </div>
                <h3 className="font-serif font-normal text-lg sm:text-xl text-[#17191c] mt-0.5">
                  Daily Painter Shifts, Stage Production &amp; Chemical Usage ({jobCardNo})
                </h3>
                <p className="text-xs text-[#777b86] mt-0.5">
                  Select any painter below to inspect shift quota, update company paint usage, log Stage 1/2/3 output, and review timestamped activity.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowDailyAssignModal(true)}
                className="px-5 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Assign Painter (Today's Target)</span>
              </button>
            </div>

            {currentJcAssignments.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-[#ececec]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#777b86] font-bold mr-1">
                  Painter Filter:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAssignmentId('ALL');
                    setShowOutputLogger(false);
                    setShowIssueChemDrawer(false);
                    setEditingMatLogId(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    selectedAssignmentId === 'ALL'
                      ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] ring-1 ring-[#c09748]/30 shadow-2xs'
                      : 'bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-[#8a6521]" />
                  <span>All Painters ({currentJcAssignments.length})</span>
                </button>

                {currentJcAssignments.map(asg => {
                  const isSelected = activeTab2Assignment?.id === asg.id;
                  const isClosed = asg.status.startsWith('Closed');
                  return (
                    <button
                      key={asg.id}
                      type="button"
                      onClick={() => {
                        setSelectedAssignmentId(asg.id);
                        setShowOutputLogger(false);
                        setShowIssueChemDrawer(false);
                        setEditingMatLogId(null);
                      }}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                        isSelected
                          ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] ring-1 ring-[#c09748]/30 font-bold shadow-2xs'
                          : 'bg-white hover:bg-[#fafafb] text-[#17191c] border border-[#ececec]'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isClosed ? 'bg-emerald-500' : 'bg-[#c09748]'}`} />
                      <span>{asg.painterName.split('(')[0].trim()}</span>
                      <span className="text-[10px] font-mono text-[#777b86]">• {asg.assignmentDate}</span>
                      {asg.colorShade && (
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-mono bg-[#faf7ed] text-[#8a6521] border border-[#f4e5be]">
                          {asg.colorShade}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {currentJcAssignments.length === 0 ? (
            <div className="p-10 text-center text-xs text-[#777b86] bg-white rounded-[24px] border border-dashed border-[#ececec] space-y-3">
              <Users className="w-10 h-10 text-[#979799] mx-auto" />
              <div className="space-y-1">
                <p className="font-serif text-base text-[#17191c]">No painters assigned to {jobCardNo} yet</p>
                <p>Click <strong>"+ Assign Painter (Today's Target)"</strong> above to assign a painter, colour shade, daily piece quota, and company paints/thinners.</p>
              </div>
            </div>
          ) : activeTab2Assignment ? (
            /* SELECTED PAINTER COMPLETE WORKSPACE */
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* 1. Shift Identity & 4 Quantitative KPIs */}
              <div className="bg-white rounded-[24px] p-6 border border-[#ececec] shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#ececec]">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-[#faf3e0] border border-[#f4e5be] flex items-center justify-center text-[#8a6521] shrink-0">
                      <User className="w-5 h-5 text-[#8a6521]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-[#8a6521] bg-[#faf3e0] px-2.5 py-0.5 rounded-full border border-[#f4e5be]">
                          {activeTab2Assignment.assignmentId}
                        </span>
                        <span className="text-[11px] text-[#777b86] font-mono">
                          {activeTab2Assignment.assignmentDate} • {activeTab2Assignment.shift}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          activeTab2Assignment.status.startsWith('Closed')
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}>
                          {activeTab2Assignment.status}
                        </span>
                        {activeTab2Assignment.colorShade && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#faf7ed] text-[#8a6521] border border-[#f4e5be] flex items-center gap-1">
                            <Paintbrush className="w-3 h-3 text-[#c09748]" />
                            {activeTab2Assignment.colorShade}
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif font-normal text-xl text-[#17191c] mt-1">
                        {activeTab2Assignment.painterName} — {activeTab2Assignment.boothNumber || (activeTab2Assignment as any).boothNo || 'Booth #1'}
                      </h3>
                      <p className="text-[11px] font-mono text-[#777b86]">
                        Assigned Process Focus: <strong className="text-[#17191c]">{activeTab2Assignment.processStage}</strong>
                        {activeTab2Assignment.supervisorNotes ? ` • Note: ${activeTab2Assignment.supervisorNotes}` : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 5 Dedicated KPI Cards (Target, Completed OK All Stages, Rework, Dead Scrap, Pending Balance) */}
                {(() => {
                  const metrics = getAssignmentLiveMetrics(activeTab2Assignment);
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div className="bg-[#fafafb] p-4 rounded-[20px] border border-[#ececec] text-center space-y-1">
                        <span className="text-[10px] text-[#777b86] uppercase font-mono font-bold block">Assigned Today Target</span>
                        <span className="font-mono font-bold text-xl text-[#17191c] block">
                          {activeTab2Assignment.dailyTargetQty.toLocaleString()} <span className="text-xs font-normal text-[#777b86]">Pcs</span>
                        </span>
                        <span className="text-[10.5px] text-[#777b86] block font-mono">Shift Quota</span>
                      </div>

                      <div className="bg-emerald-50/80 p-4 rounded-[20px] border border-emerald-200 text-center space-y-1">
                        <span className="text-[10px] text-emerald-800 uppercase font-mono font-bold block">Completed Good Output</span>
                        <span className="font-mono font-bold text-xl text-emerald-700 block">
                          {metrics.completedGood.toLocaleString()} <span className="text-xs font-normal text-emerald-800">Pcs</span>
                        </span>
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {metrics.efficiency}% All-Stages OK
                        </span>
                      </div>

                      <div className="bg-amber-50/80 p-4 rounded-[20px] border border-amber-200 text-center space-y-1">
                        <span className="text-[10px] text-amber-800 uppercase font-mono font-bold block">Rework (Salvage)</span>
                        <span className="font-mono font-bold text-xl text-amber-900 block">
                          {metrics.rework.toLocaleString()} <span className="text-xs font-normal text-amber-800">Pcs</span>
                        </span>
                        <span className="text-[10.5px] text-amber-800 block font-mono">Touch-Up / Re-Spray</span>
                      </div>

                      <div className="bg-rose-50/80 p-4 rounded-[20px] border border-rose-200 text-center space-y-1">
                        <span className="text-[10px] text-rose-800 uppercase font-mono font-bold block">Dead Scrap (Rej)</span>
                        <span className="font-mono font-bold text-xl text-rose-700 block">
                          {metrics.scrap.toLocaleString()} <span className="text-xs font-normal text-rose-800">Pcs</span>
                        </span>
                        <span className="text-[10.5px] text-rose-800 block font-mono">Permanent Loss</span>
                      </div>

                      <div className="bg-[#faf7ed] p-4 rounded-[20px] border border-[#f4e5be] text-center space-y-1 col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-[#8a6521] uppercase font-mono font-bold block">Pending Shift Balance</span>
                        <span className="font-mono font-bold text-xl text-[#17191c] block">
                          {metrics.pending.toLocaleString()} <span className="text-xs font-normal text-[#777b86]">Pcs</span>
                        </span>
                        <span className="text-[10.5px] text-[#8a6521] block font-mono">To Be Finished</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* 2. 3-Stage Process Tracker & Stage Output Batch Logger */}
              <div className="bg-white rounded-[24px] p-6 border border-[#ececec] shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ececec]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#c09748]" />
                      <span className="font-mono text-xs font-bold text-[#17191c] uppercase tracking-wider">
                        3-Stage Production Output Tracker ({activeTab2Assignment.painterName.split('(')[0].trim()})
                      </span>
                    </div>
                    <p className="text-xs text-[#777b86] mt-0.5">
                      Log Stage 1 (Primer), Stage 2 (Basecoat), or Stage 3 (Clear Topcoat) pieces OK, Rework &amp; Dead Scrap for this painter.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!showOutputLogger) {
                        handleSelectStage(selectedStage);
                        setShowOutputLogger(true);
                      } else {
                        setShowOutputLogger(false);
                      }
                    }}
                    className="px-4 py-2 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] font-bold text-xs transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto active:scale-95 shadow-2xs"
                  >
                    {showOutputLogger ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>{showOutputLogger ? 'Close Logger Form' : '+ Log Stage Output'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {processStages.map((st) => {
                    const sums = getAssignmentStageSums(activeTab2Assignment, st.key);
                    const isStageActive = selectedStage === st.key;

                    return (
                      <div
                        key={st.key}
                        className={`p-4 rounded-[18px] border space-y-3 transition ${
                          isStageActive
                            ? 'bg-[#faf7ed] border-[#c09748]/50 shadow-2xs'
                            : 'bg-[#fafafb] border-[#ececec]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8a6521] font-bold block">
                              Stage {st.num} • {st.badge}
                            </span>
                            <span className="font-bold text-xs text-[#17191c] block mt-0.5">{st.shortLabel}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              handleSelectStage(st.key);
                              setShowOutputLogger(true);
                            }}
                            className="px-2.5 py-1 rounded-full bg-white hover:bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10.5px] font-bold transition cursor-pointer shrink-0 active:scale-95"
                          >
                            + Log
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                          <div className="p-2 rounded-[10px] bg-emerald-50/80 border border-emerald-200">
                            <span className="text-[9px] text-emerald-800 uppercase font-mono block">OK</span>
                            <strong className="text-emerald-700 font-mono text-sm">{sums.good}</strong>
                          </div>
                          <div className="p-2 rounded-[10px] bg-amber-50/80 border border-amber-200">
                            <span className="text-[9px] text-amber-800 uppercase font-mono block">Rework</span>
                            <strong className="text-amber-800 font-mono text-sm">{sums.rework}</strong>
                          </div>
                          <div className="p-2 rounded-[10px] bg-rose-50/80 border border-rose-200">
                            <span className="text-[9px] text-rose-800 uppercase font-mono block">Scrap</span>
                            <strong className="text-rose-700 font-mono text-sm">{sums.scrap}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Inline Interactive Stage Output Form */}
                {showOutputLogger && (
                  <form
                    onSubmit={handleSaveOutputBatch}
                    className="p-5 rounded-[20px] bg-[#faf7ed] border border-[#f4e5be] space-y-4 animate-in fade-in duration-150"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#f4e5be]">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#8a6521] font-bold block">
                          Logging Production Batch for {activeTab2Assignment.painterName}
                        </span>
                        <h4 className="font-serif text-base text-[#17191c]">
                          {activeStageConfig.label} • Remaining Quota on Stage: {currentStageMaxAllowed.toLocaleString()} Pcs
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {processStages.map(st => (
                          <button
                            key={st.key}
                            type="button"
                            onClick={() => handleSelectStage(st.key)}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                              selectedStage === st.key
                                ? 'bg-[#c09748] text-white shadow-2xs'
                                : 'bg-white text-[#8a6521] border border-[#f4e5be]'
                            }`}
                          >
                            Stage {st.num}: {st.shortLabel}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10.5px] font-mono font-bold text-[#17191c] block">
                          Pieces Processed *
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={Math.max(1, currentStageMaxAllowed)}
                          value={logPiecesSprayed}
                          onChange={e => handleSprayedPiecesChange(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-[14px] bg-white border border-[#dcdfe4] font-mono text-sm font-bold text-[#17191c] focus:outline-none focus:border-[#c09748]"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10.5px] font-mono font-bold text-emerald-800 block">
                          Passed OK (Good)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={logPiecesSprayed}
                          value={logGoodPieces}
                          onChange={e => handleGoodPiecesChange(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-[14px] bg-white border border-emerald-300 font-mono text-sm font-bold text-emerald-800 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10.5px] font-mono font-bold text-amber-800 block">
                          Rework (Salvage)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={logPiecesSprayed}
                          value={logReworkPieces}
                          onChange={e => handleReworkPiecesChange(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-[14px] bg-white border border-amber-300 font-mono text-sm font-bold text-amber-900 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10.5px] font-mono font-bold text-rose-800 block">
                          Dead Scrap (Rej)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={logPiecesSprayed}
                          value={logRejectPieces}
                          onChange={e => handleRejectPiecesChange(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-[14px] bg-white border border-rose-300 font-mono text-sm font-bold text-rose-800 focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>

                    {(logReworkPieces > 0 || logRejectPieces > 0) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <label className="text-[10.5px] font-mono font-bold text-rose-900 block">
                            Defect Reason (ISO QA Code)
                          </label>
                          <select
                            value={logDefectReason}
                            onChange={e => setLogDefectReason(e.target.value)}
                            className="w-full px-3 py-2 rounded-[14px] bg-white border border-[#dcdfe4] text-xs font-medium text-[#17191c] focus:outline-none focus:border-[#c09748]"
                          >
                            {DEFECT_PRESET_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>

                        {logReworkPieces > 0 && (
                          <div className="space-y-1">
                            <label className="text-[10.5px] font-mono font-bold text-amber-900 block">
                              ISO 8.7 Corrective / Rework Action
                            </label>
                            <select
                              value={logReworkAction}
                              onChange={e => setLogReworkAction(e.target.value)}
                              className="w-full px-3 py-2 rounded-[14px] bg-white border border-[#dcdfe4] text-xs font-medium text-[#17191c] focus:outline-none focus:border-[#c09748]"
                            >
                              {ISO_REWORK_ACTIONS.map(act => (
                                <option key={act} value={act}>{act}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      <div className="space-y-1">
                        <label className="text-[10.5px] font-mono font-bold text-[#777b86] block">
                          Batch Log Time
                        </label>
                        <input
                          type="text"
                          value={logTimeInput}
                          onChange={e => setLogTimeInput(e.target.value)}
                          placeholder="e.g. 02:30 PM"
                          className="w-full px-3 py-2 rounded-[14px] bg-white border border-[#dcdfe4] font-mono text-xs text-[#17191c] focus:outline-none focus:border-[#c09748]"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10.5px] font-mono font-bold text-[#777b86] block">
                          Supervisor / Floor Remarks (Optional)
                        </label>
                        <input
                          type="text"
                          value={logRemarksInput}
                          onChange={e => setLogRemarksInput(e.target.value)}
                          placeholder="e.g. Booth #2 pressure stable, flash-off checked..."
                          className="w-full px-3 py-2 rounded-[14px] bg-white border border-[#dcdfe4] text-xs text-[#17191c] focus:outline-none focus:border-[#c09748]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowOutputLogger(false)}
                        className="px-4 py-2 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={logPiecesSprayed <= 0 || currentStageMaxAllowed <= 0}
                        className="px-5 py-2 rounded-full bg-[#c09748] hover:bg-[#a97e35] disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Stage {activeStageConfig.num} Output Batch</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* 3. Company Paints, Thinners & Consumables (Issue + Live Usage Update) */}
              {(() => {
                const painterChemLogs = assignmentMaterialLogs.filter(
                  l =>
                    l.assignmentId === activeTab2Assignment.assignmentId ||
                    l.assignmentId === activeTab2Assignment.id ||
                    ((l.masterJobCardNo === jobCardNo || (l as any).masterJobCardId === jobCardNo) &&
                      l.painterName === activeTab2Assignment.painterName)
                );

                return (
                  <div className="bg-white rounded-[24px] p-6 border border-[#ececec] shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ececec]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#c09748]" />
                          <span className="font-mono text-xs font-bold text-[#17191c] uppercase tracking-wider">
                            Company Paints, Thinners &amp; Consumables Issued to {activeTab2Assignment.painterName.split('(')[0].trim()}
                          </span>
                        </div>
                        <p className="text-xs text-[#777b86] mt-0.5">
                          Issue additional paint/thinner/hardener or click <strong>Update Usage</strong> on any row to record good returned &amp; floor wastage.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowIssueChemDrawer(prev => !prev)}
                        className="px-4 py-2 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] font-bold text-xs transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto active:scale-95 shadow-2xs"
                      >
                        {showIssueChemDrawer ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>{showIssueChemDrawer ? 'Close Issue Form' : '+ Issue Paint / Thinner'}</span>
                      </button>
                    </div>

                    {showIssueChemDrawer && (
                      <div className="p-4 rounded-[18px] bg-[#faf7ed] border border-[#f4e5be] space-y-3 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#8a6521]">
                            Issue Company Material to {activeTab2Assignment.assignmentId}
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {[
                              { label: 'Basecoat PU Paint', type: 'Base Paint' as const },
                              { label: 'PU Thinner 400 Solvent', type: 'Thinner' as const },
                              { label: '2K PU Hardener', type: 'Hardener' as const },
                              { label: '2K Clear Lacquer', type: 'Topcoat' as const }
                            ].map(preset => (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => {
                                  setChemName(preset.label);
                                  setChemType(preset.type);
                                }}
                                className="px-2.5 py-0.5 rounded-full bg-white hover:bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10px] font-semibold cursor-pointer"
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                          <div className="sm:col-span-4 space-y-1">
                            <label className="text-[10px] font-mono font-bold text-[#17191c] block">Material Name *</label>
                            <input
                              type="text"
                              value={chemName}
                              onChange={e => setChemName(e.target.value)}
                              className="w-full px-3 py-2 rounded-[14px] bg-white border border-[#dcdfe4] text-xs font-medium text-[#17191c] focus:outline-none focus:border-[#c09748]"
                              placeholder="e.g. Basecoat 2K PU Paint"
                            />
                          </div>
                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-[10px] font-mono font-bold text-[#17191c] block">Type</label>
                            <select
                              value={chemType}
                              onChange={e => setChemType(e.target.value as any)}
                              className="w-full px-2.5 py-2 rounded-[14px] bg-white border border-[#dcdfe4] text-xs text-[#17191c] focus:outline-none focus:border-[#c09748]"
                            >
                              <option value="Base Paint">Base Paint</option>
                              <option value="Topcoat">Topcoat</option>
                              <option value="Hardener">Hardener</option>
                              <option value="Thinner">Thinner</option>
                              <option value="Cleaning Solvent">Cleaning Solvent</option>
                            </select>
                          </div>
                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-[10px] font-mono font-bold text-[#17191c] block">Batch No.</label>
                            <input
                              type="text"
                              value={chemBatch}
                              onChange={e => setChemBatch(e.target.value)}
                              placeholder="B-2026-01"
                              className="w-full px-3 py-2 rounded-[14px] bg-white border border-[#dcdfe4] font-mono text-xs text-[#17191c] focus:outline-none focus:border-[#c09748]"
                            />
                          </div>
                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-[10px] font-mono font-bold text-[#17191c] block">Issued Qty *</label>
                            <input
                              type="number"
                              min={0.1}
                              step="0.1"
                              value={chemQty}
                              onChange={e => setChemQty(Number(e.target.value))}
                              className="w-full px-3 py-2 rounded-[14px] bg-white border border-[#dcdfe4] font-mono text-xs font-bold text-[#17191c] focus:outline-none focus:border-[#c09748]"
                            />
                          </div>
                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-[10px] font-mono font-bold text-[#17191c] block">UOM</label>
                            <select
                              value={chemUom}
                              onChange={e => setChemUom(e.target.value as any)}
                              className="w-full px-2.5 py-2 rounded-[14px] bg-white border border-[#dcdfe4] text-xs text-[#17191c] focus:outline-none focus:border-[#c09748]"
                            >
                              <option value="Litres">Litres</option>
                              <option value="Kg">Kg</option>
                              <option value="Pcs">Pcs</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowIssueChemDrawer(false)}
                            className="px-4 py-1.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!chemName.trim() || chemQty <= 0) return;
                              issueAssignmentMaterials(activeTab2Assignment.id, [
                                {
                                  materialName: chemName.trim(),
                                  materialType: chemType,
                                  batchNumber: chemBatch.trim() || undefined,
                                  issuedQty: chemQty,
                                  uom: chemUom
                                }
                              ]);
                              setShowIssueChemDrawer(false);
                              setChemBatch('');
                            }}
                            className="px-4 py-1.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Issue to Painter</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {painterChemLogs.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[#777b86] bg-[#fafafb] rounded-[16px] border border-dashed border-[#ececec]">
                        No paints, thinners, or hardeners issued yet for this assignment. Click <strong>"+ Issue Paint / Thinner"</strong> above to hand over material from store.
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-[#ececec] rounded-[18px]">
                        <table className="w-full text-left text-xs bg-white border-collapse">
                          <thead className="bg-[#f2f2f3] text-[#17191c] text-[11px] font-bold border-b border-[#ececec]">
                            <tr>
                              <th className="p-3">Material &amp; Batch</th>
                              <th className="p-3 text-right">Store Issued</th>
                              <th className="p-3 text-right">Good Returned</th>
                              <th className="p-3 text-right">Floor Wastage</th>
                              <th className="p-3 text-right text-[#8a6521]">Net Consumed</th>
                              <th className="p-3 text-right">Usage Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#ececec]">
                            {painterChemLogs.map(log => {
                              const isEditingThis = editingMatLogId === log.id;
                              const previewNet = Math.max(0, Number((log.issuedQty - editGoodReturnQty).toFixed(3)));

                              return (
                                <tr key={log.id} className="hover:bg-[#fafafb] transition">
                                  <td className="p-3 font-mono text-[11px]">
                                    <div className="font-bold text-[#17191c] font-sans text-xs">{log.materialName}</div>
                                    {isEditingThis ? (
                                      <input
                                        type="text"
                                        value={editMatBatch}
                                        onChange={e => setEditMatBatch(e.target.value)}
                                        placeholder="Batch #"
                                        className="mt-1 px-2 py-1 rounded-[10px] border border-[#dcdfe4] text-[11px] w-32 font-mono focus:outline-none focus:border-[#c09748]"
                                      />
                                    ) : (
                                      <span className="text-[10px] text-[#777b86]">
                                        {log.materialType} • Batch: {log.batchNumber || 'N/A'}
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 text-right font-mono font-semibold text-[#17191c]">
                                    {log.issuedQty} {log.uom}
                                  </td>
                                  <td className="p-3 text-right font-mono text-emerald-700 font-medium">
                                    {isEditingThis ? (
                                      <input
                                        type="number"
                                        min={0}
                                        max={log.issuedQty}
                                        step="0.1"
                                        value={editGoodReturnQty}
                                        onChange={e => setEditGoodReturnQty(Number(e.target.value))}
                                        className="w-20 px-2 py-1 rounded-[10px] border border-emerald-300 text-right font-mono text-xs focus:outline-none focus:border-emerald-500"
                                      />
                                    ) : (
                                      `${log.goodReturnedQty} ${log.uom}`
                                    )}
                                  </td>
                                  <td className="p-3 text-right font-mono text-rose-700 font-medium">
                                    {isEditingThis ? (
                                      <input
                                        type="number"
                                        min={0}
                                        step="0.1"
                                        value={editFloorWasteQty}
                                        onChange={e => setEditFloorWasteQty(Number(e.target.value))}
                                        className="w-20 px-2 py-1 rounded-[10px] border border-rose-300 text-right font-mono text-xs focus:outline-none focus:border-rose-500"
                                      />
                                    ) : (
                                      `${log.floorWastageExpiredQty} ${log.uom}`
                                    )}
                                  </td>
                                  <td className="p-3 text-right font-mono font-bold text-[#8a6521]">
                                    <div>{isEditingThis ? previewNet : log.netConsumedQty} {log.uom}</div>
                                    {log.perPieceConsumption ? (
                                      <span className="text-[10px] font-normal text-[#777b86]">
                                        {log.perPieceConsumption} {log.uom}/pc
                                      </span>
                                    ) : null}
                                  </td>
                                  <td className="p-3 text-right whitespace-nowrap">
                                    {isEditingThis ? (
                                      <div className="inline-flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            updateAssignmentMaterialLog(log.id, {
                                              goodReturnedQty: editGoodReturnQty,
                                              floorWastageExpiredQty: editFloorWasteQty,
                                              batchNumber: editMatBatch.trim() || undefined
                                            });
                                            setEditingMatLogId(null);
                                          }}
                                          className="px-3 py-1 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-white text-[11px] font-bold transition cursor-pointer"
                                        >
                                          Save
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEditingMatLogId(null)}
                                          className="px-2.5 py-1 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] text-[11px] font-semibold transition cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingMatLogId(log.id);
                                          setEditGoodReturnQty(log.goodReturnedQty || 0);
                                          setEditFloorWasteQty(log.floorWastageExpiredQty || 0);
                                          setEditMatBatch(log.batchNumber || '');
                                        }}
                                        className="px-3 py-1.5 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-[11px] font-bold transition cursor-pointer inline-flex items-center gap-1 active:scale-95"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                        <span>Update Usage</span>
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 4. Timestamped Painter Activity & Stage Output Logs */}
              {(() => {
                const painterActivityLogs = liveProgressLogs.filter(
                  l =>
                    l.assignmentId === activeTab2Assignment.id ||
                    l.assignmentId === activeTab2Assignment.assignmentId ||
                    (!l.assignmentId &&
                      l.painterName &&
                      l.painterName.trim().toLowerCase() === activeTab2Assignment.painterName.trim().toLowerCase())
                );

                return (
                  <div className="bg-white rounded-[24px] p-6 border border-[#ececec] shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#ececec]">
                      <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-[#c09748]" />
                        <h4 className="font-serif font-normal text-base text-[#17191c]">
                          Timestamped Activity &amp; Stage Output Logs — {activeTab2Assignment.painterName.split('(')[0].trim()}
                        </h4>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]">
                        {painterActivityLogs.length} Entries
                      </span>
                    </div>

                    {painterActivityLogs.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[#777b86] bg-[#fafafb] rounded-[16px] border border-dashed border-[#ececec]">
                        No stage output logs recorded yet for this painter. Use <strong>"+ Log Stage Output"</strong> above to record batch completions by time.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {painterActivityLogs.map(log => (
                          <div
                            key={log.id}
                            className="p-3.5 rounded-[16px] bg-[#fafafb] border border-[#ececec] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-[11px] font-bold text-[#8a6521] bg-[#faf3e0] px-2 py-0.5 rounded-full border border-[#f4e5be]">
                                  {log.dateLabel} • {log.timeLabel}
                                </span>
                                {log.stageName && (
                                  <span className="px-2 py-0.5 rounded-full bg-white border border-[#ececec] text-[10.5px] font-semibold text-[#17191c]">
                                    {log.stageName}
                                  </span>
                                )}
                                <span className="font-semibold text-[#17191c]">{log.actionTitle}</span>
                              </div>
                              {(log.defectReason || log.reworkAction || log.remarks) && (
                                <p className="text-[11px] text-[#777b86]">
                                  {log.defectReason ? `Defect: ${log.defectReason}` : ''}
                                  {log.reworkAction ? ` • Action: ${log.reworkAction}` : ''}
                                  {log.remarks ? ` • ${log.remarks}` : ''}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 font-mono text-[11px] shrink-0">
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                                +{log.goodPieces ?? log.piecesCompleted ?? 0} OK
                              </span>
                              {(log.reworkPieces || 0) > 0 && (
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                                  +{log.reworkPieces} RW
                                </span>
                              )}
                              {(log.scrapPieces || 0) > 0 && (
                                <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-bold">
                                  +{log.scrapPieces} Scrap
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            /* ALL PAINTERS COMBINED SUMMARY VIEW */
            <div className="space-y-5">
              {/* All Assignments Summary List */}
              <div className="bg-white rounded-[24px] p-6 border border-[#ececec] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-normal text-base text-[#17191c]">
                    All Painter Shift Assignments ({currentJcAssignments.length})
                  </h4>
                  <span className="text-xs text-[#777b86]">
                    Click any painter to update stage output &amp; consumables
                  </span>
                </div>

                <div className="space-y-3">
                  {currentJcAssignments.map(asg => {
                    const metrics = getAssignmentLiveMetrics(asg);
                    return (
                      <div
                        key={asg.id}
                        className="p-4 rounded-[18px] bg-[#fafafb] border border-[#ececec] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap font-mono">
                            <span className="font-bold text-[#c09748]">{asg.assignmentId}</span>
                            <span className="text-gray-300">•</span>
                            <span className="px-2 py-0.5 rounded-full bg-white border border-[#ececec] text-[#17191c] font-bold">
                              {asg.assignmentDate} ({asg.shift})
                            </span>
                            {asg.colorShade && (
                              <span className="px-2 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] font-bold">
                                {asg.colorShade}
                              </span>
                            )}
                            <span className="font-semibold text-[#17191c] font-sans">
                              Painter: <strong>{asg.painterName}</strong> ({asg.boothNumber || (asg as any).boothNo || 'Booth #1'})
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-[#777b86] flex-wrap">
                            <span>Target: <strong className="text-[#17191c] font-mono">{asg.dailyTargetQty} pcs</strong></span>
                            <span>Completed OK: <strong className="text-emerald-700 font-mono font-bold">{metrics.completedGood} pcs</strong></span>
                            {metrics.rework > 0 && (
                              <span className="text-amber-800 font-mono">Rework: <strong>{metrics.rework}</strong> pcs</span>
                            )}
                            {metrics.scrap > 0 && (
                              <span className="text-rose-700 font-mono">Scrap: <strong>{metrics.scrap}</strong> pcs</span>
                            )}
                            <span className="text-amber-800 font-mono font-bold">Efficiency: {metrics.efficiency}%</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                          <button
                            type="button"
                            onClick={() => setSelectedAssignmentId(asg.id)}
                            className="px-3.5 py-1.5 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] font-bold text-xs transition cursor-pointer flex items-center gap-1 active:scale-95 shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#8a6521]" />
                            <span>Open Painter Workspace</span>
                          </button>

                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                            asg.status === 'Closed - Target Met'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : asg.status === 'Closed - Partial/Incomplete'
                                ? 'bg-amber-50 text-amber-900 border border-amber-200'
                                : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}>
                            {asg.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Combined Chemical Material Traceability Ledger */}
              <div className="bg-white rounded-[24px] p-6 border border-[#ececec] shadow-xs space-y-4">
                <h4 className="font-serif font-normal text-base text-[#17191c]">
                  All Chemicals Issued &amp; Consumed Across Painters
                </h4>

                {assignmentMaterialLogs.filter(l => l.masterJobCardNo === jobCardNo || (l as any).masterJobCardId === jobCardNo).length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#777b86] bg-[#fafafb] rounded-[16px] border border-dashed border-[#ececec]">
                    No shift chemical logs recorded yet for this job card. Select a painter above to issue paints or thinners.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-[#ececec] rounded-[18px]">
                    <table className="w-full text-left text-xs bg-white border-collapse">
                      <thead className="bg-[#f2f2f3] text-[#17191c] text-[11px] font-bold border-b border-[#ececec]">
                        <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">Painter</th>
                          <th className="p-3">Material &amp; Type</th>
                          <th className="p-3 text-right">Issued</th>
                          <th className="p-3 text-right">Good Return</th>
                          <th className="p-3 text-right">Floor Wastage</th>
                          <th className="p-3 text-right">Net Consumed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ececec]">
                        {assignmentMaterialLogs.filter(l => l.masterJobCardNo === jobCardNo || (l as any).masterJobCardId === jobCardNo).map(log => (
                          <tr key={log.id} className="hover:bg-[#fafafb] transition">
                            <td className="p-3 font-mono text-[11px] text-[#777b86]">{log.logDate}</td>
                            <td className="p-3 font-semibold text-[#17191c]">{log.painterName}</td>
                            <td className="p-3 font-mono text-[11px]">
                              <div className="font-sans font-semibold text-[#17191c]">{log.materialName}</div>
                              <span className="text-[10px] text-[#777b86]">{log.materialType} • Batch: {log.batchNumber || 'N/A'}</span>
                            </td>
                            <td className="p-3 text-right font-mono">{log.issuedQty} {log.uom}</td>
                            <td className="p-3 text-right font-mono text-emerald-700 font-medium">{log.goodReturnedQty} {log.uom}</td>
                            <td className="p-3 text-right font-mono text-rose-700 font-medium">{log.floorWastageExpiredQty} {log.uom}</td>
                            <td className="p-3 text-right font-mono font-bold text-[#8a6521]">{log.netConsumedQty} {log.uom}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Combined Timestamped Logs */}
              <div className="bg-white rounded-[24px] p-6 border border-[#ececec] shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#ececec]">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-[#c09748]" />
                    <h4 className="font-serif font-normal text-base text-[#17191c]">
                      All Painter Activity &amp; Stage Output Logs ({liveProgressLogs.length})
                    </h4>
                  </div>
                </div>
                {liveProgressLogs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#777b86] bg-[#fafafb] rounded-[16px] border border-dashed border-[#ececec]">
                    No production batch logs recorded yet. Select any painter above to log 3-stage output.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {liveProgressLogs.slice(0, 15).map(log => (
                      <div key={log.id} className="p-3 rounded-[14px] bg-[#fafafb] border border-[#ececec] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10.5px] font-bold text-[#8a6521] bg-[#faf3e0] px-2 py-0.5 rounded-full border border-[#f4e5be]">
                            {log.dateLabel} • {log.timeLabel}
                          </span>
                          {log.painterName && <strong className="text-[#17191c]">{log.painterName.split('(')[0].trim()}</strong>}
                          <span className="text-[#777b86]">{log.actionTitle}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                            +{log.goodPieces ?? log.piecesCompleted ?? 0} OK
                          </span>
                          {(log.reworkPieces || 0) > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold">+{log.reworkPieces} RW</span>
                          )}
                          {(log.scrapPieces || 0) > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-bold">+{log.scrapPieces} Scrap</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

            {/* 4. Action Footer for Existing Card */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#ececec]">
              <div className="flex items-center gap-2 text-xs text-[#777b86] font-mono">
                <span>Job Card: <strong className="text-[#17191c]">{jobCardNo}</strong></span>
                <span>•</span>
                <span>Target: <strong className="text-[#17191c]">{targetQty} Pcs</strong></span>
                <span>•</span>
                <span>Plant: <strong className="text-[#8a6521]">{activePlant}</strong></span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(true)}
                  className="px-4 py-2.5 rounded-full bg-[#faf7ed] hover:bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-xs font-bold transition cursor-pointer flex items-center gap-2 active:scale-95 shadow-2xs"
                  title="Generate final Return to Store slip when Job Card is completed"
                >
                  <RotateCcw className="w-4 h-4 text-[#c09748]" />
                  <span>Return Leftover to Store</span>
                </button>
                {(currentGoodQty > 0 || (currentJcForModals.goodQty || 0) > 0) && (
                  <button
                    type="button"
                    onClick={() => downloadStandardProductionOfferingPdf(currentJcForModals)}
                    className="px-4 py-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold transition cursor-pointer flex items-center gap-2 active:scale-95 shadow-2xs"
                    title="Download Production Offering & QA Handover Slip (Doc: PK-PRD-OFF-01)"
                  >
                    <FileText className="w-4 h-4 text-[#777b86]" />
                    <span>Offering Slip (PK-PRD-OFF-01)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="px-5 py-2.5 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs font-bold transition cursor-pointer flex items-center gap-2 active:scale-95 shadow-2xs"
                >
                  <Download className="w-4 h-4 text-[#8a6521]" />
                  <span>Download Job Card PDF (Print for Painter)</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold cursor-pointer transition active:scale-95"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW MODE 2: STEP-BY-STEP CREATION WIZARD (ONLY FOR NEW JOB CARDS)        */}
        {/* ========================================================================= */}
        {viewMode === 'PORTAL' && !isExistingCard && (
          <div className="space-y-6">

            {/* ===================================================================== */}
            {/* POINT 1: PARTY, WORK ORDER & BATCH IDENTIFICATION                     */}
            {/* ===================================================================== */}
            {!isExistingCard && currentStep === 1 && (
              <div className="bg-white p-6 sm:p-7 rounded-[24px] border border-[#ececec] shadow-xs space-y-5">
                
                {/* Header Strip with Title & Job Card Tracing Badge */}
                <div className="pb-3.5 border-b border-[#ececec] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-6 h-6 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] flex items-center justify-center font-bold font-mono text-xs shadow-2xs">
                        1
                      </span>
                      <span className="text-[11px] font-bold text-[#c09748] uppercase tracking-wider font-mono">
                        Point 1: Party & Work Order Identification
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-serif text-[#17191c] font-normal">
                      Ham Painter ko kis party / customer ka kaam de rahe hain?
                    </h3>
                    <p className="text-xs text-[#777b86] mt-0.5">
                      Customer account, delivery challan reference aur finishing process type confirm karein.
                    </p>
                  </div>

                  {/* Identification Badge: Clean Job Card Tracing Pill */}
                  <div className="shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#faf7ed] border border-[#f4e5be] shadow-2xs self-start sm:self-auto">
                    <Tag className="w-3.5 h-3.5 text-[#c09748]" />
                    <span className="text-[10px] font-mono uppercase font-bold text-[#777b86]">Job Card No:</span>
                    <span className="font-mono text-xs font-bold text-[#8a6521] tracking-tight">{jobCardNo}</span>
                    <span className="text-[9.5px] font-sans font-semibold bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] px-2 py-0.5 rounded-full uppercase">
                      System Generated
                    </span>
                  </div>
                </div>

                {/* Linked Store Inward Intake Lot Verification Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 rounded-[16px] bg-[#faf7ed] border border-[#f4e5be]">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-7 h-7 rounded-full bg-[#f4e5be]/70 flex items-center justify-center shrink-0">
                      <PackageCheck className="w-3.5 h-3.5 text-[#8a6521]" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-xs flex-1">
                      <span className="text-[10px] font-mono uppercase font-bold text-[#8a6521] tracking-wide shrink-0">
                        Link Store Inward (GRN):
                      </span>
                      {availableGrnLots.length > 0 ? (
                        <select
                          value={selectedGrnNo}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedGrnNo(val);
                            if (val) {
                              const found = availableGrnLots.find(g => g.grnNo === val);
                              if (found) {
                                if (found.supplierCustomer) setCustomer(found.supplierCustomer);
                                if (found.invoiceChallanNo) setWNo(found.invoiceChallanNo);
                                const pCode = found.items?.[0]?.partCode || found.partCode;
                                if (pCode) setPartCode(pCode);
                                const pDesc = found.items?.[0]?.partDescription || found.description;
                                if (pDesc) setPartDescription(pDesc);
                                const qty = Number(found.actualReceivedQty) || Number(found.totalQty) || 0;
                                if (qty > 0) {
                                  setTargetQty(qty);
                                  setDailyTargetQty(Math.min(2000, qty));
                                }
                              }
                            }
                          }}
                          className="h-8 px-2.5 rounded-full border border-[#f4e5be] bg-white font-mono text-xs font-bold text-[#17191c] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#c09748]"
                        >
                          <option value="">-- Standalone / Manual (No GRN Linked) --</option>
                          {availableGrnLots.map(g => (
                            <option key={g.grnNo} value={g.grnNo}>
                              {g.grnNo} • {g.supplierCustomer} ({(g.actualReceivedQty || g.totalQty || 0).toLocaleString('en-IN')} Pcs)
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-[#777b86] italic">
                          No Store Inward (GRN) records found. Creating Standalone Master Job Card.
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedGrn ? (
                    <span className="text-[9.5px] font-sans font-semibold bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs flex items-center gap-1.5 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#c09748]" />
                      <span>Verified Linked</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold uppercase bg-white px-2.5 py-1 rounded-full border border-amber-200 text-amber-800 shrink-0">
                      Direct / Standalone
                    </span>
                  )}
                </div>

                {/* 3 Form Fields in Premium Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* 1. Customer / Party Name */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#17191c] uppercase tracking-wider font-mono">
                      <Building2 className="w-3.5 h-3.5 text-[#c09748]" />
                      <span>1. Customer / Party Name</span>
                      <span className="text-[#c09748]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customer}
                      onChange={e => setCustomer(e.target.value)}
                      className="w-full h-11 px-4 rounded-[16px] border border-[#dcdfe4] bg-[#fafafb] hover:bg-white focus:bg-white font-semibold text-xs text-[#17191c] focus:border-[#c09748] focus:ring-2 focus:ring-[#c09748]/15 focus:outline-none transition-all shadow-2xs"
                      placeholder="e.g. TATA AUTOCOMP SYSTEMS LTD"
                    />
                  </div>

                  {/* 2. Customer Delivery Challan No */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#17191c] uppercase tracking-wider font-mono">
                      <FileText className="w-3.5 h-3.5 text-[#c09748]" />
                      <span>2. Customer Delivery Challan No</span>
                      <span className="text-[#c09748]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={wNo}
                      onChange={e => setWNo(e.target.value)}
                      className="w-full h-11 px-4 rounded-[16px] border border-[#dcdfe4] bg-[#fafafb] hover:bg-white focus:bg-white font-mono font-bold text-xs text-[#17191c] focus:border-[#c09748] focus:ring-2 focus:ring-[#c09748]/15 focus:outline-none transition-all shadow-2xs"
                      placeholder="e.g. TAT/PUN/8841"
                    />
                  </div>

                  {/* 3. Finishing Process Type */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#8a6521] uppercase tracking-wider font-mono">
                      <Sparkles className="w-3.5 h-3.5 text-[#c09748]" />
                      <span>3. Finishing Process Type</span>
                      <span className="text-[#c09748]">*</span>
                    </label>
                    <select
                      value={processType}
                      onChange={e => {
                        const newProc = e.target.value;
                        setProcessType(newProc);
                        if (newProc.includes('Hydrographic')) {
                          setDept('Booth #3 (Hydrographic Immersion & Dipping)');
                        } else if (newProc.includes('UV')) {
                          setDept('Booth #4 (Flatbed Industrial Direct UV Plotter)');
                        } else if (newProc.includes('Moulding')) {
                          setDept('Injection Moulding Bay');
                        } else {
                          setDept('Booth #1 (Continuous Conveyor Line)');
                        }
                      }}
                      className="w-full h-11 px-4 rounded-[16px] border border-[#f4e5be] bg-[#faf7ed]/70 hover:bg-[#faf7ed] focus:bg-white font-semibold text-xs text-[#17191c] focus:border-[#c09748] focus:ring-2 focus:ring-[#c09748]/15 focus:outline-none transition-all shadow-2xs cursor-pointer"
                    >
                      <option value="Liquid PU Spray Painting">Liquid PU Spray Painting</option>
                      <option value="3D Hydrographic Dipping">3D Hydrographic Dipping</option>
                      <option value="Flatbed UV Direct Digital Printing">Flatbed UV Direct Digital Printing</option>
                      <option value="Thermoplastic Injection Moulding">Thermoplastic Injection Moulding</option>
                    </select>
                  </div>
                </div>

                {/* Subtitle / System registration bar */}
                <div className="pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#777b86] font-mono border-t border-[#f2f2f3]">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#c09748]" />
                    <span>System Auto-Registration: <strong className="text-[#17191c] font-sans font-semibold">{issueDate} • {issueTime}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#c09748]"></span>
                    <span>Active Production Unit: <strong className="text-[#8a6521] font-sans font-semibold">{activePlant}</strong></span>
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================================== */}
            {/* TIER 1: STEP 2 - SUBSTRATE SPECS, MASTER TARGET & OVERALL DEADLINE SLA */}
            {/* ===================================================================== */}
            {!isExistingCard && currentStep === 2 && (
              <div className="bg-white p-6 sm:p-7 rounded-[24px] border border-[#ececec] shadow-xs space-y-5">
                <div className="pb-3.5 border-b border-[#ececec] flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-6 h-6 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] flex items-center justify-center font-bold font-mono text-xs">
                        2
                      </span>
                      <span className="text-[11px] font-bold text-[#c09748] uppercase tracking-wider font-mono">
                        Tier 1: Substrate Specs, Total PO Target & Overall Deadline SLA
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-serif text-[#17191c] font-normal">
                      Kaun sa part spray karna hai, total master order target kitna hai aur final completion deadline kya hai?
                    </h3>
                    <p className="text-xs text-[#777b86] mt-0.5">
                      Substrate part specifications, approved finish shade, customer PO order quantity aur final delivery SLA deadline set karein.
                    </p>
                  </div>

                  {/* System Generated Job Card Tracing Badge */}
                  <div className="shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#faf7ed] border border-[#f4e5be] shadow-2xs self-start md:self-auto">
                    <Tag className="w-3.5 h-3.5 text-[#c09748]" />
                    <span className="text-[10px] font-mono uppercase font-bold text-[#777b86]">Job Card No:</span>
                    <span className="font-mono text-xs font-bold text-[#8a6521] tracking-tight">{jobCardNo}</span>
                    <span className="text-[9.5px] font-sans font-semibold bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] px-2 py-0.5 rounded-full uppercase">
                      System Generated
                    </span>
                  </div>
                </div>

                {/* Unified Management Card: Substrate Details, Quantity Allocation & Colour Selection */}
                <div className="bg-[#fafafb] p-5 sm:p-7 rounded-[24px] border border-[#ececec] shadow-xs space-y-5">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column: Substrate Specifications & Total PO Target */}
                    <div className="space-y-4">
                      {/* Substrate Part Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-bold text-[#17191c] uppercase font-mono">
                            Part Code / Substrate Code *
                          </label>
                          <input
                            type="text"
                            required
                            value={partCode}
                            onChange={e => setPartCode(e.target.value)}
                            className="w-full h-11 px-3.5 rounded-[14px] border border-[#dcdfe4] font-mono font-bold text-xs bg-white text-[#17191c] focus:outline-none focus:border-[#c09748]"
                            placeholder="e.g. RP-8841 / SUB-01"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-bold text-[#17191c] uppercase font-mono">
                            Substrate Description *
                          </label>
                          <input
                            type="text"
                            required
                            value={partDescription}
                            onChange={e => setPartDescription(e.target.value)}
                            className="w-full h-11 px-3.5 rounded-[14px] border border-[#dcdfe4] text-xs font-semibold bg-white text-[#17191c] focus:outline-none focus:border-[#c09748]"
                            placeholder="e.g. Center Vent Bezel (ABS)"
                          />
                        </div>
                      </div>

                      {/* Overall Order Target */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-bold text-[#17191c] uppercase font-mono">
                            Total Order Quantity (Master PO Target) *
                          </label>
                          <span className="text-[10px] text-[#777b86]">Total Customer Work Order</span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <input
                            type="number"
                            min="1"
                            max={availableStoreBalance > 0 ? availableStoreBalance : undefined}
                            required
                            value={targetQty}
                            onChange={e => {
                              const raw = Number(e.target.value);
                              if (isNaN(raw)) return;
                              const val = Math.max(1, raw);
                              const clamped = availableStoreBalance > 0 ? Math.min(availableStoreBalance, val) : val;
                              setTargetQty(clamped);
                              const newDaily = Math.min(dailyTargetQty, clamped);
                              setDailyTargetQty(newDaily);
                              handleRecalculateMaterials(newDaily);
                            }}
                            className="w-36 h-11 px-3.5 rounded-[14px] border border-[#c09748] font-mono font-bold text-base bg-white text-[#17191c] focus:outline-none shadow-2xs"
                          />

                          {availableStoreBalance > 0 && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setTargetQty(availableStoreBalance);
                                  const newDaily = Math.min(dailyTargetQty, availableStoreBalance);
                                  setDailyTargetQty(newDaily);
                                  handleRecalculateMaterials(newDaily);
                                }}
                                className="px-3 py-2.5 rounded-[12px] bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs font-bold transition cursor-pointer active:scale-95 shadow-2xs"
                              >
                                All ({availableStoreBalance})
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const half = Math.floor(availableStoreBalance / 2);
                                  setTargetQty(half);
                                  const newDaily = Math.min(dailyTargetQty, half);
                                  setDailyTargetQty(newDaily);
                                  handleRecalculateMaterials(newDaily);
                                }}
                                className="px-3 py-2.5 rounded-[12px] bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold transition cursor-pointer active:scale-95 shadow-2xs"
                              >
                                50%
                              </button>
                            </>
                          )}

                          {[100, 250, 500, 1000, 2500].map(cnt => (
                            <button
                              key={cnt}
                              type="button"
                              onClick={() => {
                                setTargetQty(cnt);
                                const newDaily = Math.min(dailyTargetQty, cnt);
                                setDailyTargetQty(newDaily);
                                handleRecalculateMaterials(newDaily);
                              }}
                              className={`px-3 py-2.5 rounded-[12px] text-xs font-mono transition cursor-pointer shadow-2xs ${
                                targetQty === cnt
                                  ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] font-bold'
                                  : 'bg-white border border-[#ececec] text-[#777b86] hover:bg-gray-50'
                              }`}
                            >
                              {cnt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Approved Finish Shade & Overall SLA Deadline */}
                    <div className="space-y-4">
                      {/* Approved Finish Shade */}
                      <div className="space-y-2 relative">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-bold text-[#17191c] uppercase font-mono">
                            Reference / Default Shade (Optional — Colours set per Painter)
                          </label>
                          <span className="text-[10px] text-[#777b86] font-mono">
                            Direct Typing + Suggestions
                          </span>
                        </div>

                        <div className="relative">
                          <input
                            type="text"
                            value={batchColor}
                            onChange={e => {
                              setBatchColor(e.target.value);
                              setShowColorDropdown(true);
                            }}
                            onFocus={() => setShowColorDropdown(true)}
                            placeholder="Type colour (e.g. Monza Red Gloss, Piano Black, Pearl White)..."
                            className="w-full h-11 pl-4 pr-10 rounded-[14px] border border-[#dcdfe4] bg-white font-semibold text-xs text-[#17191c] focus:border-[#c09748] focus:ring-2 focus:ring-[#c09748]/15 focus:outline-none transition shadow-2xs"
                          />
                          <button
                            type="button"
                            onClick={() => setShowColorDropdown(!showColorDropdown)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777b86] hover:text-[#17191c] p-1 cursor-pointer transition"
                            title="Show previously used shades"
                          >
                            <ChevronDown className={`w-4 h-4 transition-transform ${showColorDropdown ? 'rotate-180' : ''}`} />
                          </button>

                          {/* Interactive Dropdown Menu for Previous Shades */}
                          {showColorDropdown && filteredColors.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-[16px] border border-[#ececec] shadow-xl z-30 py-2 max-h-52 overflow-y-auto no-scrollbar animate-in fade-in duration-100">
                              <div className="px-3 py-1 text-[10px] font-mono uppercase font-bold text-[#777b86] border-b border-[#ececec] flex items-center justify-between">
                                <span>Previously Used Factory Shades</span>
                                <span>{filteredColors.length} Found</span>
                              </div>
                              {filteredColors.map((col, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setBatchColor(col);
                                    setShowColorDropdown(false);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-[#17191c] hover:bg-[#faf7ed] hover:text-[#8a6521] transition cursor-pointer flex items-center justify-between group"
                                >
                                  <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#c09748]/60 group-hover:bg-[#c09748]" />
                                    <span>{col}</span>
                                  </span>
                                  {batchColor === col && <Check className="w-3.5 h-3.5 text-[#8a6521]" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Overall Master SLA Completion Deadline */}
                      <div className="p-3.5 bg-white rounded-[18px] border border-[#f4e5be] space-y-2.5 shadow-2xs">
                        <div className="flex items-center justify-between pb-1 border-b border-[#f2f2f3]">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-[#8a6521]" />
                            <span className="text-xs font-bold text-[#17191c] uppercase font-mono">
                              Overall Job Completion SLA Deadline *
                            </span>
                          </div>
                          <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${deadlineStatus.badgeColor}`}>
                            {deadlineStatus.label}
                          </div>
                        </div>

                        <PaintkingDateTimePicker
                          dateValue={deadlineDate}
                          timeValue={deadlineTime}
                          onChange={(newDate, newTime) => {
                            setDeadlineDate(newDate);
                            setDeadlineTime(newTime);
                          }}
                        />

                        {/* Presets */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-[#777b86] font-mono">SLA Presets:</span>
                          {[
                            { hours: 4, label: '4h (Rush)' },
                            { hours: 8, label: '8h (1 Shift)' },
                            { hours: 24, label: '24h (1 Day)' },
                            { hours: 48, label: '48h (2 Days)' },
                            { hours: 72, label: '72h (3 Days)' }
                          ].map(preset => (
                            <button
                              key={preset.hours}
                              type="button"
                              onClick={() => handleApplyPresetDeadline(preset.hours)}
                              className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-mono transition cursor-pointer ${
                                slaHours === preset.hours
                                  ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] font-bold shadow-2xs'
                                  : 'bg-[#fafafb] text-[#777b86] border border-[#ececec] hover:bg-gray-100'
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================================== */}
            {/* TIER 2: STEP 3 - PAINTER SHIFT LINE ALLOCATIONS                       */}
            {/* ===================================================================== */}
            {!isExistingCard && currentStep === 3 && (
              <div className="bg-white p-6 sm:p-7 rounded-[24px] border border-[#ececec] shadow-xs space-y-6">
                <div className="pb-3 border-b border-[#ececec] flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-6 h-6 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] flex items-center justify-center font-bold font-mono text-xs">
                        3
                      </span>
                      <span className="text-[11px] font-bold text-[#c09748] uppercase tracking-wider font-mono">
                        Tier 2: Painter Shift Line Allocations & Daily Quotas
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-serif text-[#17191c] font-normal">
                      Aaj ke shift mein kaun se painters kaun se booth par kitne pieces spray karenge?
                    </h3>
                    <p className="text-xs text-[#777b86] mt-0.5">
                      Multiple painters can work concurrently across booths. Each shift allocation is closed at shift end.
                    </p>
                  </div>

                  {/* Order Allocation Live Counter */}
                  <div className="shrink-0 flex items-center gap-2 p-2.5 rounded-[16px] bg-[#fafafb] border border-[#ececec]">
                    <div className="text-center px-3 border-r border-[#ececec]">
                      <span className="text-[9.5px] uppercase font-mono text-[#777b86] block">Master PO Target</span>
                      <strong className="font-mono text-xs text-[#17191c]">{targetQty.toLocaleString('en-IN')} Pcs</strong>
                    </div>
                    <div className="text-center px-3 border-r border-[#ececec]">
                      <span className="text-[9.5px] uppercase font-mono text-[#8a6521] block">Today Allocated</span>
                      <strong className="font-mono text-xs text-[#8a6521] font-bold">{totalAllocatedShift.toLocaleString('en-IN')} Pcs</strong>
                    </div>
                    <div className="text-center px-3">
                      <span className="text-[9.5px] uppercase font-mono text-[#777b86] block">Unallocated Balance</span>
                      <strong className={`font-mono text-xs ${targetQty - totalAllocatedShift < 0 ? 'text-rose-600 font-bold' : 'text-[#17191c]'}`}>
                        {Math.max(0, targetQty - totalAllocatedShift).toLocaleString('en-IN')} Pcs
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Shift Details Banner */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#faf7ed] rounded-[18px] border border-[#f4e5be] text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#8a6521]" />
                    <span className="font-mono font-bold text-[#17191c]">Date: {issueDate}</span>
                    <span className="text-[#a3a6af]">•</span>
                    <span className="font-mono text-[#8a6521] font-semibold">General Day Shift (08:30 - 18:30)</span>
                  </div>
                  <span className="text-[10.5px] font-mono text-[#777b86]">
                    Plant: <strong className="text-[#17191c]">{activePlant} Unit</strong>
                  </span>
                </div>

                {/* Multi-Painter Allocation Table / Cards */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase text-[#17191c] tracking-wider">
                      Shift Painter Line Allocations ({initialPainterAllocs.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddPainterAlloc}
                      className="px-3.5 py-1.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#c09748]" />
                      <span>+ Add Another Painter</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {initialPainterAllocs.map((alloc, idx) => (
                      <div
                        key={alloc.id}
                        className="p-4 rounded-[20px] bg-[#fafafb] border border-[#ececec] space-y-3 shadow-2xs"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-[#f2f2f3]">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#faf3e0] text-[#8a6521] font-mono font-bold text-[11px] flex items-center justify-center border border-[#f4e5be]">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-[#17191c]">
                              Painter Allocation #{idx + 1}
                            </span>
                          </div>
                          {initialPainterAllocs.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePainterAlloc(alloc.id)}
                              className="w-7 h-7 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition cursor-pointer"
                              title="Remove Allocation"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                          {/* Painter Combobox */}
                          <div>
                            <label className="block text-[10.5px] font-bold text-[#17191c] uppercase font-mono mb-1">
                              Painter *
                            </label>
                            <select
                              value={alloc.painterName}
                              onChange={(e) => {
                                const val = e.target.value;
                                const matched = painters.find(p => p.name === val);
                                handleUpdatePainterAlloc(alloc.id, {
                                  painterName: val,
                                  painterId: matched?.id || `PAINTER-${Date.now()}`
                                });
                              }}
                              className="w-full h-10 px-3 rounded-[14px] border border-[#dcdfe4] bg-white font-medium text-xs text-[#17191c] focus:outline-none focus:border-[#c09748]"
                            >
                              {painters.length > 0 ? (
                                painters.map(p => (
                                  <option key={p.id} value={p.name}>
                                    {p.name} ({p.code || 'PTR'})
                                  </option>
                                ))
                              ) : (
                                <>
                                  <option value="Ramesh Kumar (P1)">Ramesh Kumar (P1)</option>
                                  <option value="Suresh Verma (P2)">Suresh Verma (P2)</option>
                                  <option value="Dinesh Pal (P3)">Dinesh Pal (P3)</option>
                                </>
                              )}
                            </select>
                          </div>

                          {/* Spray Booth Line */}
                          <div>
                            <label className="block text-[10.5px] font-bold text-[#17191c] uppercase font-mono mb-1">
                              Spray Booth / Line *
                            </label>
                            <select
                              value={alloc.boothNumber}
                              onChange={(e) => handleUpdatePainterAlloc(alloc.id, { boothNumber: e.target.value })}
                              className="w-full h-10 px-3 rounded-[14px] border border-[#dcdfe4] bg-white font-medium text-xs text-[#17191c] focus:outline-none focus:border-[#c09748]"
                            >
                              {paintingBooths.length > 0 ? (
                                paintingBooths.map(b => (
                                  <option key={b.id} value={b.name}>
                                    {b.name}
                                  </option>
                                ))
                              ) : (
                                <>
                                  <option value="Booth #1 (Continuous Conveyor Line)">Booth #1 (Continuous Conveyor Line)</option>
                                  <option value="Booth #2 (Manual Batch Booth)">Booth #2 (Manual Batch Booth)</option>
                                </>
                              )}
                            </select>
                          </div>

                          {/* Coating Process Stage */}
                          <div>
                            <label className="block text-[10.5px] font-bold text-[#17191c] uppercase font-mono mb-1">
                              Coating Stage *
                            </label>
                            <select
                              value={alloc.processStage}
                              onChange={(e) => handleUpdatePainterAlloc(alloc.id, { processStage: e.target.value as any })}
                              className="w-full h-10 px-3 rounded-[14px] border border-[#dcdfe4] bg-white font-medium text-xs text-[#17191c] focus:outline-none focus:border-[#c09748]"
                            >
                              <option value="Full Coating System">Full Coating System (3-Stage)</option>
                              <option value="Stage 1: Primer Undercoat">Stage 1: Primer Undercoat</option>
                              <option value="Stage 2: Basecoat Colour">Stage 2: Basecoat Colour</option>
                              <option value="Stage 3: Clear Topcoat">Stage 3: Clear Topcoat</option>
                            </select>
                          </div>

                          {/* Daily Target Quota */}
                          <div>
                            <label className="block text-[10.5px] font-bold text-[#8a6521] uppercase font-mono mb-1 flex items-center justify-between">
                              <span>Shift Target (Pcs) *</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const otherAllocated = initialPainterAllocs
                                    .filter(a => a.id !== alloc.id)
                                    .reduce((sum, a) => sum + (Number(a.dailyTargetQty) || 0), 0);
                                  const rem = Math.max(0, targetQty - otherAllocated);
                                  handleUpdatePainterAlloc(alloc.id, { dailyTargetQty: rem });
                                }}
                                className="text-[9.5px] text-[#c09748] hover:underline cursor-pointer"
                              >
                                Fill Balance
                              </button>
                            </label>
                            <input
                              type="number"
                              min="1"
                              max={targetQty}
                              required
                              value={alloc.dailyTargetQty}
                              onChange={(e) => handleUpdatePainterAlloc(alloc.id, { dailyTargetQty: Math.max(0, Number(e.target.value)) })}
                              className="w-full h-10 px-3 rounded-[14px] border border-[#8a6521] bg-white font-mono font-bold text-xs text-[#17191c] focus:outline-none focus:border-[#c09748]"
                              placeholder="Quota Pcs"
                            />
                          </div>
                        </div>

                        {/* Painter-Specific Colour / Shade */}
                        <div>
                          <label className="block text-[10.5px] font-bold text-[#17191c] uppercase font-mono mb-1">
                            Assigned Colour / Shade for this Painter
                          </label>
                          <input
                            type="text"
                            value={alloc.colorShade || ''}
                            onChange={(e) => handleUpdatePainterAlloc(alloc.id, { colorShade: e.target.value })}
                            placeholder="e.g. Monza Red Gloss, Piano Black, Pearl White"
                            className="w-full h-10 px-3 rounded-[14px] border border-[#dcdfe4] bg-white font-semibold text-xs text-[#17191c] focus:outline-none focus:border-[#c09748]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalAllocatedShift > targetQty && (
                    <div className="p-3 rounded-[14px] bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>
                        ⚠️ Total shift allocated quota ({totalAllocatedShift.toLocaleString('en-IN')} Pcs) cannot exceed Master PO Target ({targetQty.toLocaleString('en-IN')} Pcs).
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===================================================================== */}
            {/* POINT 4: COMPANY ISSUED MATERIALS & FINAL LAUNCH                      */}
            {/* ===================================================================== */}
            {!isExistingCard && currentStep === 4 && (
              <div className="bg-white p-6 sm:p-7 rounded-[24px] border border-[#ececec] shadow-xs space-y-5">
                <div className="pb-3 border-b border-[#ececec] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-6 h-6 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] flex items-center justify-center font-bold font-mono text-xs">
                        4
                      </span>
                      <span className="text-[11px] font-bold text-[#c09748] uppercase tracking-wider font-mono">
                        Point 4: Company Issued Materials (Paints, Thinners & Chemicals)
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-serif text-[#17191c] font-normal">
                      Uss kaam ko karne ke liye company usko kitna material de rahi hai?
                    </h3>
                    <p className="text-xs text-[#777b86] mt-0.5">
                      Basecoat paint, thinners, hardeners aur lacquers ki quantities verify karein.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRecalculateMaterials(dailyTargetQty)}
                      className="px-3 py-1.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-[10.5px] font-semibold transition cursor-pointer shadow-2xs active:scale-95"
                    >
                      Auto-Scale for Today's Target ({dailyTargetQty} Pcs)
                    </button>

                    <button
                      type="button"
                      onClick={handleAddMaterialRow}
                      className="px-3.5 py-1.5 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#8a6521]" />
                      <span>Add Material Row</span>
                    </button>
                  </div>
                </div>

                {/* Table of Issued Materials */}
                <div className="space-y-2.5">
                  {issuedMaterials.map((mat, idx) => (
                    <div key={mat.id || idx} className="bg-[#fafafb] p-3.5 rounded-[16px] border border-[#ececec] space-y-2 group hover:border-[#c09748]/50 transition shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] flex items-center justify-center font-bold text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-xs text-[#17191c]">
                            {mat.itemDescription}
                          </span>
                        </div>
                        {issuedMaterials.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMaterialRow(mat.id || '')}
                            className="text-gray-400 hover:text-rose-600 transition cursor-pointer p-1"
                            title="Remove row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-xs items-end">
                        {/* Material Type Dropdown */}
                        <div className="sm:col-span-3">
                          <label className="block text-[9px] font-bold text-[#777b86] uppercase mb-0.5">
                            Classification *
                          </label>
                          <select
                            value={mat.materialType || 'paint'}
                            onChange={e => handleUpdateMaterial(mat.id || '', 'materialType', e.target.value)}
                            className="w-full h-8.5 px-2 rounded-[10px] border border-[#dcdfe4] bg-white text-xs font-semibold text-[#17191c]"
                          >
                            <option value="paint">Paint / Basecoat</option>
                            <option value="thinner">Thinner / Reducer</option>
                            <option value="hardener">Hardener / Catalyst</option>
                            <option value="primer">Primer / Undercoat</option>
                            <option value="clear_coat">Clear Coat / PU Lacquer</option>
                            <option value="activator">Activator / Immersion</option>
                            <option value="uv_ink">UV Ink / Printing</option>
                            <option value="consumable">Other Consumable</option>
                          </select>
                        </div>

                        {/* Description */}
                        <div className="sm:col-span-4">
                          <label className="block text-[9px] font-bold text-[#777b86] uppercase mb-0.5">
                            Material / Chemical / Shade Description *
                          </label>
                          <input
                            type="text"
                            required
                            value={mat.itemDescription}
                            onChange={e => handleUpdateMaterial(mat.id || '', 'itemDescription', e.target.value)}
                            placeholder={mat.materialType === 'thinner' ? 'e.g. PU Thinner Slow' : mat.materialType === 'hardener' ? 'e.g. MS Hardener Fast' : 'e.g. PPG Rosso Corsa 932'}
                            className="w-full h-8.5 px-2.5 rounded-[10px] border border-[#dcdfe4] bg-white text-xs font-semibold text-[#17191c]"
                          />
                        </div>

                        {/* Quantity & Unit */}
                        <div className="sm:col-span-3">
                          <label className="block text-[9px] font-bold text-[#777b86] uppercase mb-0.5">
                            Issued Qty & Unit *
                          </label>
                          <div className="flex gap-1">
                            <input
                              type="number"
                              min="0.1"
                              step="0.1"
                              required
                              value={mat.qty}
                              onChange={e => handleUpdateMaterial(mat.id || '', 'qty', Number(e.target.value))}
                              className="w-full h-8.5 px-2.5 rounded-[10px] border border-[#dcdfe4] bg-white text-xs font-mono font-bold text-[#17191c]"
                            />
                            <select
                              value={mat.uom || 'Litres'}
                              onChange={e => handleUpdateMaterial(mat.id || '', 'uom', e.target.value)}
                              className="w-16 h-8.5 px-1.5 rounded-[10px] border border-[#dcdfe4] bg-white text-xs font-mono text-[#17191c]"
                            >
                              <option value="Litres">Ltr</option>
                              <option value="Kg">Kg</option>
                              <option value="Pcs">Pcs</option>
                              <option value="Sets">Set</option>
                            </select>
                          </div>
                        </div>

                        {/* Remarks */}
                        <div className="sm:col-span-2">
                          <label className="block text-[9px] font-bold text-[#777b86] uppercase mb-0.5">
                            Mix Ratio / Notes
                          </label>
                          <input
                            type="text"
                            value={mat.colour || mat.remark || ''}
                            onChange={e => {
                              handleUpdateMaterial(mat.id || '', 'colour', e.target.value);
                              handleUpdateMaterial(mat.id || '', 'remark', e.target.value);
                            }}
                            placeholder="e.g. 4:1 Ratio"
                            className="w-full h-8.5 px-2 rounded-[10px] border border-[#dcdfe4] bg-white text-xs text-[#17191c]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 3-Tier Final Launch Summary Box */}
                <div className="p-4 rounded-[18px] bg-[#faf7ed] border border-[#f4e5be] space-y-3 text-xs">
                  <div className="flex items-center gap-2 font-mono font-bold text-[#8a6521] uppercase text-[10.5px]">
                    <Sparkles className="w-3.5 h-3.5 text-[#8a6521]" />
                    <span>3-Tier Architecture Launch Summary Review:</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                    <div className="p-2.5 rounded-[12px] bg-white border border-[#f4e5be] space-y-1">
                      <span className="font-mono font-bold text-[#8a6521] text-[10px] uppercase block">Tier 1: Master Order Contract</span>
                      <div>Party: <strong className="text-[#17191c]">{customer}</strong></div>
                      <div>Part: <strong className="text-[#17191c]">{partCode} • {partDescription}</strong></div>
                      <div>Master PO Target: <strong className="text-[#17191c] font-mono">{targetQty.toLocaleString('en-IN')} Pcs</strong></div>
                      <div>Shade: <strong className="text-[#8a6521]">{batchColor}</strong></div>
                      <div>SLA Deadline: <strong className="text-[#8a6521] font-mono">{deadlineDate} • {deadlineTime}</strong></div>
                    </div>

                    <div className="p-2.5 rounded-[12px] bg-white border border-[#f4e5be] space-y-1">
                      <span className="font-mono font-bold text-[#8a6521] text-[10px] uppercase block">Tier 2: Shift Painter Line Allocations</span>
                      <div>Painters: <strong className="text-[#17191c]">{initialPainterAllocs.length} Assigned</strong></div>
                      <div>Total Today Quota: <strong className="text-[#8a6521] font-mono">{totalAllocatedShift.toLocaleString('en-IN')} Pcs</strong></div>
                      <div className="text-[10px] text-[#777b86] truncate">
                        {initialPainterAllocs.map(a => `${a.painterName} (${a.dailyTargetQty} pcs)`).join(', ')}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-[12px] bg-white border border-[#f4e5be] space-y-1">
                      <span className="font-mono font-bold text-[#8a6521] text-[10px] uppercase block">Tier 3: Issued Chemical Consumables</span>
                      <div>Consumables: <strong className="text-[#17191c]">{issuedMaterials.length} Items Issued</strong></div>
                      <div className="text-[10px] text-[#777b86]">
                        Traceable batches handed over to floor. Reconciled upon shift close.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isExistingCard && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#ececec]">
              <div className="flex items-center gap-2 text-xs text-[#777b86]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold cursor-pointer transition active:scale-95"
                >
                  Cancel
                </button>
                <span>•</span>
                <span className="font-mono">
                  {isExistingCard ? 'Floor Execution Mode' : `Step ${currentStep} of 4`}
                </span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                {/* Previous Step Button */}
                {!isExistingCard && currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-5 py-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-2xs"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Previous Step</span>
                  </button>
                )}

                {/* Next Step Button */}
                {!isExistingCard && currentStep < 4 && (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 py-2.5 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs font-bold transition cursor-pointer flex items-center gap-2 active:scale-95 shadow-2xs"
                  >
                    <span>Next: {STEP_TITLES[currentStep]}</span>
                    <ArrowRight className="w-4 h-4 text-[#8a6521]" />
                  </button>
                )}

                {/* Finish & Launch Button on Step 4 or Save for Existing */}
                {currentStep === 4 && (
                  <button
                    type="button"
                    onClick={handleLaunchJobCard}
                    className="px-6 py-2.5 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs font-bold transition cursor-pointer flex items-center gap-2 active:scale-95 shadow-2xs"
                  >
                    <Rocket className="w-4 h-4 text-[#8a6521]" />
                    <span>Launch Master Job Card & Floor Execution</span>
                  </button>
                )}
              </div>
            </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW MODE 2: PRINT SHEET FORMAT (OFFICIAL FORMAT C.01 / DOC NO: 001)      */}
        {/* ========================================================================= */}
        {viewMode === 'PRINT' && (
          <div className="space-y-4 border border-[#17191c] p-6 bg-white text-[#17191c] text-xs font-sans rounded-[16px] shadow-sm">
            <div className="border-b-2 border-[#17191c] pb-3 text-center">
              <div className="text-xl font-bold font-serif tracking-tight uppercase">PAINTKING SURFACE SOLUTIONS</div>
              <div className="text-xs font-semibold tracking-wider">JOB CARD CUBIC PAINT FRAME (DOC NO: 001)</div>
              <div className="text-[10px] text-gray-500 font-mono mt-0.5">{docNo} • {revNo} • Plant: {activePlant}</div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b border-[#ececec] pb-3 text-xs">
              <div className="space-y-1">
                <div><strong>Customer / Party:</strong> {customer}</div>
                <div><strong>Part Code:</strong> {partCode}</div>
                <div><strong>Description:</strong> {partDescription}</div>
                <div><strong>Job Card No:</strong> {jobCardNo}</div>
                <div><strong>Total Target Given:</strong> <span className="font-mono font-bold text-sm">{targetQty} Pcs</span></div>
              </div>
              <div className="space-y-1">
                <div><strong>W.No / Challan:</strong> {wNo}</div>
                <div><strong>Finish / Colour:</strong> {batchColor}</div>
                <div><strong>Assigned Painter:</strong> {painterName}</div>
                <div><strong>Department / Booth:</strong> {dept.split('(')[0]}</div>
                <div><strong>Target Deadline:</strong> {deadlineDate} • {deadlineTime}</div>
              </div>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-300 rounded text-xs grid grid-cols-5 gap-2 text-center">
              <div>
                <div className="text-[10px] text-gray-500 uppercase">Total Given</div>
                <div className="font-bold text-sm">{targetQty} Pcs</div>
              </div>
              <div>
                <div className="text-[10px] text-[#8a6521] uppercase">Good Passed</div>
                <div className="font-bold text-sm text-[#8a6521]">{currentGoodQty} Pcs</div>
              </div>
              <div>
                <div className="text-[10px] text-amber-800 uppercase">Rework Recovered</div>
                <div className="font-bold text-sm text-amber-800">{currentReworkQty} Pcs</div>
              </div>
              <div>
                <div className="text-[10px] text-rose-800 uppercase">Dead Scrap</div>
                <div className="font-bold text-sm text-rose-800">{currentRejectQty} Pcs</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-700 uppercase">Remaining Balance</div>
                <div className="font-bold text-sm text-gray-700">{remainingQty} Pcs</div>
              </div>
            </div>

            <div>
              <div className="font-bold uppercase text-[11px] mb-1">Company Issued Materials & Chemicals:</div>
              <table className="w-full text-left border-collapse border border-[#ececec] text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border border-[#ececec]">#</th>
                    <th className="p-2 border border-[#ececec]">Description</th>
                    <th className="p-2 border border-[#ececec]">Qty</th>
                    <th className="p-2 border border-[#ececec]">Colour</th>
                    <th className="p-2 border border-[#ececec]">Remarks / Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {companyMaterials.map((m, i) => (
                    <tr key={i}>
                      <td className="p-2 border border-[#ececec]">{i + 1}</td>
                      <td className="p-2 border border-[#ececec] font-medium">{m.itemDescription}</td>
                      <td className="p-2 border border-[#ececec] font-mono">{m.qty} {m.uom}</td>
                      <td className="p-2 border border-[#ececec]">{m.colour}</td>
                      <td className="p-2 border border-[#ececec]">{m.remark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <div className="font-bold uppercase text-[11px] mb-1">3-Stage Coating Process Execution & Sign-off:</div>
              <table className="w-full text-left border-collapse border border-[#ececec] text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border border-[#ececec] w-8 text-center">#</th>
                    <th className="p-2 border border-[#ececec]">Stage Description</th>
                    <th className="p-2 border border-[#ececec]">Operator Sign</th>
                    <th className="p-2 border border-[#ececec] text-center">OK Pieces</th>
                    <th className="p-2 border border-[#ececec] text-center">Rework (RW)</th>
                    <th className="p-2 border border-[#ececec] text-center">Dead Scrap</th>
                    <th className="p-2 border border-[#ececec]">QC Sign</th>
                  </tr>
                </thead>
                <tbody>
                  {processStages.map((st, i) => {
                    const counts = st.key === 'stage_1_primer' ? stageCounts.stage1 : st.key === 'stage_2_basecoat' ? stageCounts.stage2 : stageCounts.stage3;
                    return (
                      <tr key={st.key}>
                        <td className="p-2 border border-[#ececec] text-center font-bold">{i + 1}</td>
                        <td className="p-2 border border-[#ececec] font-medium">
                          {st.label}
                          <div className="text-[10px] text-gray-500">{st.description}</div>
                        </td>
                        <td className="p-2 border border-[#ececec] text-gray-400">[   ] Signed</td>
                        <td className="p-2 border border-[#ececec] text-center font-mono font-bold text-[#8a6521]">
                          {counts.good > 0 ? `${counts.good} Pcs` : '____ Pcs'}
                        </td>
                        <td className="p-2 border border-[#ececec] text-center font-mono text-amber-800">
                          {counts.rework > 0 ? `${counts.rework} Pcs` : '____ Pcs'}
                        </td>
                        <td className="p-2 border border-[#ececec] text-center font-mono text-rose-700">
                          {counts.scrap > 0 ? `${counts.scrap} Pcs` : '____ Pcs'}
                        </td>
                        <td className="p-2 border border-[#ececec] text-gray-400">[   ] Verified</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pt-8 grid grid-cols-3 gap-6 text-center text-[11px]">
              <div className="border-t border-[#17191c] pt-1">
                <strong>Prepared By (Supervisor)</strong>
                <div className="text-[10px] text-gray-500">{currentUser.name || 'Vikram Patel'}</div>
              </div>
              <div className="border-t border-[#17191c] pt-1">
                <strong>Received By (Painter)</strong>
                <div className="text-[10px] text-gray-500">{painterName}</div>
              </div>
              <div className="border-t border-[#17191c] pt-1">
                <strong>Approved By (Plant Head)</strong>
                <div className="text-[10px] text-gray-500">Satish Sharma</div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* ACTIVITY & AUDIT TRAIL POPUP MODAL DIALOG                                  */}
      {/* ========================================================================= */}
      {showAuditLogsModal && (
        <div 
          className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
          onClick={() => setShowAuditLogsModal(false)}
        >
          <div 
            className="bg-white w-full max-w-4xl max-h-[88vh] rounded-[24px] border border-[#ececec] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#ececec] flex items-center justify-between bg-[#fafafb]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#faf3e0] border border-[#f4e5be] flex items-center justify-center shrink-0">
                  <History className="w-5 h-5 text-[#8a6521]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] font-bold text-[#c09748] uppercase tracking-wider font-mono">
                      Audit Trail & Floor Execution History
                    </span>
                    <span className="text-[10px] font-mono font-bold text-[#8a6521] bg-[#faf3e0] px-2.5 py-0.5 rounded-full border border-[#f4e5be]">
                      {liveProgressLogs.length} Events Logged
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-serif text-[#17191c] font-normal mt-0.5">
                    Production Activity Log • {jobCardNo}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAuditLogsModal(false)}
                className="w-8 h-8 rounded-full bg-white hover:bg-[#f2f2f3] text-[#777b86] hover:text-[#17191c] border border-[#ececec] flex items-center justify-center cursor-pointer transition active:scale-95"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body - Scrollable Cards */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-3 max-h-[calc(88vh-130px)] bg-[#fafafb]/50">
              {liveProgressLogs.length === 0 ? (
                <div className="p-8 rounded-[20px] bg-white border border-[#ececec] text-center text-xs text-[#777b86] space-y-2">
                  <History className="w-8 h-8 text-[#dcdfe4] mx-auto" />
                  <p className="font-semibold text-[#17191c]">No activity logged yet.</p>
                  <p>Any floor batch output or material issue will be recorded here with timestamp, actor & metrics.</p>
                </div>
              ) : (
                liveProgressLogs.map((log) => {
                  const stageCfg = processStages.find(s => s.key === log.processStage) || (
                    log.processStage === 'stage_1_primer' ? processStages[0] :
                    log.processStage === 'stage_2_basecoat' ? processStages[1] :
                    processStages[2]
                  );

                  const isMaterial = log.actionType === 'MATERIAL_ISSUED';
                  const isJobCreate = log.actionType === 'JOB_CREATED';
                  const isDetailsEdit = log.actionType === 'DETAILS_UPDATED';
                  const isBatch = log.actionType === 'BATCH_OUTPUT' || (!isMaterial && !isJobCreate && !isDetailsEdit && (log.piecesCompleted > 0 || log.goodPieces !== undefined));

                  // Batch metrics
                  const sprayed = log.piecesCompleted || 0;
                  const passed = log.goodPieces !== undefined ? log.goodPieces : Math.max(0, sprayed - (log.reworkPieces || 0));
                  const rejects = log.reworkPieces || 0;
                  const batchRejRate = sprayed > 0 ? ((rejects / sprayed) * 100).toFixed(1) : '0.0';
                  const defectLabel = (log.defectCategory && log.defectCategory !== 'none')
                    ? DEFECT_LABELS[log.defectCategory]
                    : (log.defectReason || (rejects > 0 ? 'Defect Recorded' : 'Zero Defect'));

                  return (
                    <div 
                      key={log.id} 
                      className="p-4 rounded-[18px] bg-white border border-[#ececec] hover:border-[#c09748]/50 transition space-y-2.5 text-xs shadow-2xs"
                    >
                      {/* Top Metadata Header: Date, Time, Action Badge & Actor */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#f2f2f3]">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Date & Time Badge */}
                          <span className="px-2.5 py-1 rounded-full bg-[#faf7ed] text-[#8a6521] border border-[#f4e5be] font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-2xs">
                            <Calendar className="w-3.5 h-3.5 text-[#c09748]" />
                            <span>{log.dateLabel || 'Today'}</span>
                            <span className="opacity-40">•</span>
                            <Clock className="w-3.5 h-3.5 text-[#c09748]" />
                            <span>{log.timeLabel}</span>
                          </span>

                          {/* Action Type Badge */}
                          {isMaterial ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-mono font-bold uppercase flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-600" />
                              <span>Material Issue</span>
                            </span>
                          ) : isJobCreate ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-bold uppercase flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Job Card Created</span>
                            </span>
                          ) : isDetailsEdit ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-mono font-bold uppercase flex items-center gap-1">
                              <Edit3 className="w-3 h-3 text-blue-600" />
                              <span>Master Update</span>
                            </span>
                          ) : (
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border uppercase flex items-center gap-1 ${
                              log.processStage === 'stage_1_primer'
                                ? 'bg-slate-100 text-slate-800 border-slate-300'
                                : log.processStage === 'stage_2_basecoat'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : 'bg-[#faf3e0] text-[#8a6521] border-[#f4e5be]'
                            }`}>
                              <TrendingUp className="w-3 h-3 text-[#c09748]" />
                              <span>{log.stageName || stageCfg?.shortLabel || 'Batch Output'}</span>
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] font-mono text-[#777b86]">
                          Logged By: <strong className="text-[#17191c] font-sans">{log.recordedBy || 'Supervisor'}</strong> • Booth: <strong className="text-[#17191c] font-sans">{log.boothNo || 'Booth #1'}</strong>
                        </div>
                      </div>

                      {/* Title of the event */}
                      <div className="font-semibold text-xs text-[#17191c] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#c09748]" />
                        <span>{log.actionTitle || (isBatch ? `${stageCfg?.shortLabel || 'Batch'}: ${sprayed} Pieces Coated` : 'Job Card Update')}</span>
                      </div>

                      {/* If Batch: Clean 4-Metric Grid */}
                      {isBatch ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                            {/* Total Sprayed */}
                            <div className="p-2.5 rounded-[12px] bg-[#fafafb] border border-[#ececec]">
                              <div className="text-[9.5px] uppercase text-[#777b86] font-bold">1. Total Sprayed</div>
                              <div className="text-sm font-bold text-[#17191c] mt-0.5">{sprayed} Pcs</div>
                              <div className="text-[9.5px] text-[#777b86] mt-0.5">Floor Input</div>
                            </div>

                            {/* Good Passed */}
                            <div className="p-2.5 rounded-[12px] bg-emerald-50/70 border border-emerald-200">
                              <div className="text-[9.5px] uppercase text-emerald-800 font-bold">2. Passed OK</div>
                              <div className="text-sm font-bold text-emerald-700 mt-0.5">+{passed} Pcs</div>
                              <div className="text-[9.5px] text-emerald-800 mt-0.5">Quality Verified</div>
                            </div>

                            {/* Rework Recovered */}
                            <div className={`p-2.5 rounded-[12px] border ${(log.reworkPieces || 0) > 0 ? 'bg-amber-50/80 border-amber-200' : 'bg-[#fafafb] border-[#ececec]'}`}>
                              <div className={`text-[9.5px] uppercase font-bold ${(log.reworkPieces || 0) > 0 ? 'text-amber-800' : 'text-[#777b86]'}`}>3. Rework (RW)</div>
                              <div className={`text-sm font-bold mt-0.5 ${(log.reworkPieces || 0) > 0 ? 'text-amber-800' : 'text-[#777b86]'}`}>{log.reworkPieces || 0} Pcs</div>
                              <div className={`text-[9.5px] mt-0.5 ${(log.reworkPieces || 0) > 0 ? 'text-amber-800 font-medium' : 'text-[#777b86]'}`}>
                                {(log.reworkPieces || 0) > 0 ? 'Touch-up / Re-spray' : 'No Rework'}
                              </div>
                            </div>

                            {/* Dead Scrap */}
                            <div className={`p-2.5 rounded-[12px] border ${(log.scrapPieces || 0) > 0 ? 'bg-rose-50/80 border-rose-200' : 'bg-[#fafafb] border-[#ececec]'}`}>
                              <div className={`text-[9.5px] uppercase font-bold ${(log.scrapPieces || 0) > 0 ? 'text-rose-800' : 'text-[#777b86]'}`}>4. Dead Scrap</div>
                              <div className={`text-sm font-bold mt-0.5 ${(log.scrapPieces || 0) > 0 ? 'text-rose-700' : 'text-[#777b86]'}`}>{log.scrapPieces || 0} Pcs</div>
                              <div className={`text-[9.5px] mt-0.5 ${(log.scrapPieces || 0) > 0 ? 'text-rose-700 font-medium' : 'text-[#777b86]'}`}>
                                {(log.scrapPieces || 0) > 0 ? 'Challan Deduction' : 'Zero Scrap (100% OK)'}
                              </div>
                            </div>
                          </div>

                          {/* Dedicated ISO 9001 (Cl 8.7) Quality & Disposition Record Card */}
                          {((log.reworkPieces || 0) > 0 || (log.scrapPieces || 0) > 0 || log.defectReason || log.reworkAction) && (
                            <div className="p-3 rounded-[14px] bg-[#faf7ed] border border-[#f4e5be] space-y-2">
                              <div className="flex items-center justify-between flex-wrap gap-2 pb-1.5 border-b border-[#f4e5be]/70 text-[10.5px] font-mono">
                                <span className="font-bold text-[#8a6521] uppercase flex items-center gap-1.5">
                                  <AlertCircle className="w-3.5 h-3.5 text-[#c09748]" />
                                  <span>ISO 9001:2015 (Cl 8.7) Defect & Corrective Disposition</span>
                                </span>
                                {log.qaVerified && (
                                  <span className="font-bold text-emerald-800 bg-white/90 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                                    ✓ QA Verified: {log.qaVerifiedBy || 'Quality Inspector'}
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div className="p-2.5 rounded-[10px] bg-white border border-[#ececec]">
                                  <span className="text-[9.5px] uppercase font-mono font-bold text-[#777b86] block">
                                    Defect Reason / Type:
                                  </span>
                                  <span className="font-semibold text-[#17191c] text-xs block mt-1 break-words">
                                    {log.defectReason || (log.defectCategory && log.defectCategory !== 'none' ? DEFECT_LABELS[log.defectCategory] : 'Shop Floor Defect Recorded')}
                                  </span>
                                </div>

                                <div className="p-2.5 rounded-[10px] bg-white border border-amber-200">
                                  <span className="text-[9.5px] uppercase font-mono font-bold text-amber-800 block">
                                    ISO Corrective Action Taken:
                                  </span>
                                  <span className="font-semibold text-amber-900 text-xs block mt-1 break-words">
                                    {log.reworkAction || 'Touch-up Wet Sanding & Re-spray'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Sequential Pipeline Flow Note */}
                          <div className="p-2 px-3 rounded-[10px] bg-[#fafafb] border border-[#ececec] text-[11px] font-mono flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 text-[#17191c]">
                              {log.processStage === 'stage_1_primer' ? (
                                <>
                                  <ArrowRight className="w-3.5 h-3.5 text-[#c09748] shrink-0" />
                                  <span>Pipeline Handover: <strong>{passed} Good OK pieces</strong> are now available as input for <strong>Stage 2 (Basecoat)</strong>.</span>
                                </>
                              ) : log.processStage === 'stage_2_basecoat' ? (
                                <>
                                  <ArrowRight className="w-3.5 h-3.5 text-[#c09748] shrink-0" />
                                  <span>Pipeline Handover: <strong>{passed} Good OK pieces</strong> are now available as input for <strong>Stage 3 (Clear Topcoat & Final QC)</strong>.</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>Final Inspection Complete: <strong>{passed} pieces</strong> passed QA and ready for packing/dispatch.</span>
                                </>
                              )}
                            </div>
                            {log.cumulativeGoodQty !== undefined && log.cumulativeGoodQty > 0 && (
                              <span className="text-[#8a6521] font-bold shrink-0">
                                Cumulative Job Good: {log.cumulativeGoodQty} Pcs
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Non-Batch Events */
                        <div className="space-y-1.5">
                          {log.exactChanges && log.exactChanges.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {log.exactChanges.map((change, cIdx) => (
                                <span 
                                  key={cIdx} 
                                  className="px-2.5 py-1 rounded-[10px] bg-[#fafafb] border border-[#dcdfe4] text-[11px] font-mono text-[#17191c] shadow-2xs"
                                >
                                  {change}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Remarks if any */}
                      {log.remarks && (
                        <div className="text-[11px] text-[#777b86] italic bg-[#faf7ed]/60 px-3 py-1.5 rounded-[12px] border border-[#f4e5be] flex items-center gap-1.5">
                          <span className="not-italic font-semibold text-[#8a6521]">Supervisor Note:</span>
                          <span className="text-[#17191c] not-italic">{log.remarks}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 border-t border-[#ececec] bg-white flex items-center justify-between">
              <div className="text-[11px] font-mono text-[#777b86]">
                Job Card: <strong className="text-[#17191c]">{jobCardNo}</strong> • Target: <strong className="text-[#17191c]">{targetQty} Pcs</strong> • Plant: <strong className="text-[#8a6521]">{activePlant}</strong>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditLogsModal(false)}
                className="px-5 py-2 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold cursor-pointer active:scale-95 transition"
              >
                Close Log View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Material Usage Modal */}
      {showUsageModal && selectedMatForUsage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-[24px] max-w-md w-full p-6 shadow-2xl border border-[#ececec] space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f3]">
              <div>
                <h3 className="font-serif font-normal text-lg text-[#17191c]">
                  Update Material Usage on Floor
                </h3>
                <p className="text-xs text-[#777b86] mt-0.5 font-mono">
                  Job Card: <strong className="text-[#c09748]">{jobCardNo}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowUsageModal(false);
                  setSelectedMatForUsage(null);
                }}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-[#17191c] flex items-center justify-center text-xs font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-[#fafafb] rounded-[16px] border border-[#ececec] space-y-2 text-xs">
              <div className="font-semibold text-sm text-[#17191c]">
                {selectedMatForUsage.itemDescription}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 border-t border-[#ececec]">
                <div>
                  <span className="text-[#777b86] block">Store Issued Qty:</span>
                  <strong className="text-[#17191c] text-xs">{selectedMatForUsage.qty} {selectedMatForUsage.uom}</strong>
                </div>
                <div>
                  <span className="text-[#777b86] block">Floor Balance (Remaining):</span>
                  <strong className="text-emerald-800 text-xs">
                    {Math.max(0, Number((selectedMatForUsage.qty - Number(usageConsumedInput || 0)).toFixed(2)))} {selectedMatForUsage.uom}
                  </strong>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveMaterialUsage} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#17191c] uppercase font-mono mb-1">
                  Actual Quantity Consumed / Mixed ({selectedMatForUsage.uom}) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max={selectedMatForUsage.qty * 1.5}
                  value={usageConsumedInput}
                  onChange={e => setUsageConsumedInput(Number(e.target.value))}
                  className="w-full p-2.5 rounded-[14px] border border-[#dcdfe4] bg-[#faf7ed] font-mono font-bold text-base text-[#8a6521] focus:border-[#c09748] focus:outline-none"
                  required
                />
                <span className="text-[10px] text-[#777b86] block mt-1">
                  Remaining unopened stock will be auto-calculated as Floor Balance.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#17191c] uppercase font-mono mb-1">
                  Floor Usage Remarks (Optional)
                </label>
                <input
                  type="text"
                  value={usageRemarkInput}
                  onChange={e => setUsageRemarkInput(e.target.value)}
                  placeholder="e.g. Mixed in booth #1 for shift batch run"
                  className="w-full p-2.5 rounded-[14px] border border-[#dcdfe4] bg-white text-xs text-[#17191c] focus:border-[#c09748] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f2f2f3]">
                <button
                  type="button"
                  onClick={() => {
                    setShowUsageModal(false);
                    setSelectedMatForUsage(null);
                  }}
                  className="px-4 py-2 rounded-full border border-[#ececec] text-xs font-semibold text-[#777b86] hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#17191c] hover:bg-[#2e3238] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Save className="w-3.5 h-3.5 text-[#c09748]" />
                  <span>Save Material Usage</span>
                </button>
              </div>
            </form>
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

      {/* Production Balance Return Modal */}
      {showReturnModal && (
        <BalanceReturnModal
          isOpen={showReturnModal}
          onClose={() => setShowReturnModal(false)}
          preselectedJobCardNo={jobCardNo}
          onSuccess={() => {
            setShowReturnModal(false);
          }}
        />
      )}

      {/* Quality Control Gate 1: Pre-Production Inspection (PIR) Modal */}
      {showPirModal && (
        <PreProductionInspectionModal
          isOpen={showPirModal}
          onClose={() => setShowPirModal(false)}
          jobCard={currentJcForModals}
          onSuccess={() => setShowPirModal(false)}
        />
      )}

      {/* Quality Control Gate 2: First Part Approval (FPA Golden Sample) Modal */}
      {showFpaModal && (
        <FPAModal
          isOpen={showFpaModal}
          onClose={() => setShowFpaModal(false)}
          jobCard={currentJcForModals}
          onSuccess={() => setShowFpaModal(false)}
        />
      )}

      {/* Quality Control Gate 3: In-Process Quality Control (IPQC Line Audits) Modal */}
      {showIpqcModal && (
        <IPQCModal
          isOpen={showIpqcModal}
          onClose={() => setShowIpqcModal(false)}
          jobCard={currentJcForModals}
          onSuccess={() => setShowIpqcModal(false)}
        />
      )}

      {/* 3-Tier Daily Painter Assignment Modal */}
      {showDailyAssignModal && (
        <DailyAssignmentModal
          isOpen={showDailyAssignModal}
          onClose={() => setShowDailyAssignModal(false)}
          masterJobCard={currentJcForModals}
          existingAssignments={currentJcAssignments}
          painters={painters.filter(p => matchesPlant(p.plant, activePlant))}
          booths={paintingBooths.filter(b => matchesPlant(b.plant, activePlant))}
          onAssign={(assignmentData) => {
            const res = createPainterAssignment(assignmentData);
            if (res?.success) {
              setToastMessage(`✓ Daily target assigned to ${assignmentData.painterName}!`);
              setTimeout(() => setToastMessage(null), 3500);
            }
            return res;
          }}
        />
      )}
    </div>
  );
};
