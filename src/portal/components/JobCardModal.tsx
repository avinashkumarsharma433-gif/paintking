import React, { useState, useEffect, useMemo } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { 
  JobCard, 
  IssuedMaterialItem, 
  JobCardProductionProgressLog,
  DefectCategory,
  CoatingProcessStage
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
  RotateCcw
} from 'lucide-react';
import { PaintkingDatePicker } from './PaintkingDatePicker';
import { PaintkingDateTimePicker } from './PaintkingDateTimePicker';
import { CustomCombobox, ComboboxOption } from './CustomCombobox';
import { downloadStandardJobCardPdf } from '../utils/pdfStandardHeader';
import { BalanceReturnModal } from './BalanceReturnModal';

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
  '1. Party & Work Order Details',
  '2. Substrate, Pieces & Colour',
  '3. Painter, Booth & Deadline',
  '4. Company Issued Materials & Launch'
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
    balanceReturnSlips
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
  const [customer, setCustomer] = useState<string>(initialData?.customer || 'ROOP POLYMERS LTD');
  const [wNo, setWNo] = useState<string>(initialData?.wNo || initialData?.woNo || 'WO-1042');
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
  const [partCode, setPartCode] = useState<string>(initialData?.partCode || 'RP-8841');
  const [partDescription, setPartDescription] = useState<string>(
    initialData?.partDescription || 'Auto AC Center Vent Bezel Substrate (ABS)'
  );
  const [targetQty, setTargetQty] = useState<number>(initialData?.targetQty || 250);
  const [batchColor, setBatchColor] = useState<string>(initialData?.color || 'Monza Red Gloss');

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

  // =========================================================================
  // POINT 4: Company Issued Materials Table (Paints & Thinners)
  // =========================================================================
  const [issuedMaterials, setIssuedMaterials] = useState<IssuedMaterialItem[]>(() => {
    if (initialData?.issuedMaterials && initialData.issuedMaterials.length > 0) {
      return initialData.issuedMaterials;
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
  const [currentRejectQty, setCurrentRejectQty] = useState<number>(initialData?.rejectQty || 0);
  const [liveProgressLogs, setLiveProgressLogs] = useState<JobCardProductionProgressLog[]>(initialData?.progressLogs || []);

  const [selectedStage, setSelectedStage] = useState<CoatingProcessStage>('stage_1_primer');
  const [showOutputLogger, setShowOutputLogger] = useState<boolean>(false);
  const [logPiecesSprayed, setLogPiecesSprayed] = useState<number>(100);
  const [logGoodPieces, setLogGoodPieces] = useState<number>(95);
  const [logRejectPieces, setLogRejectPieces] = useState<number>(5);
  const [logDefectCategory, setLogDefectCategory] = useState<DefectCategory>('dust_nibs');
  const [logTimeInput, setLogTimeInput] = useState<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [logRemarksInput, setLogRemarksInput] = useState<string>('');

  // Step 2 Color dropdown state
  const [showColorDropdown, setShowColorDropdown] = useState<boolean>(false);

  // Dedicated Audit Trail Popup Modal state
  const [showAuditLogsModal, setShowAuditLogsModal] = useState<boolean>(false);

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

  // Dynamic Booth Options mapped strictly from Central Booth Fleet
  const boothOptions = useMemo<ComboboxOption[]>(() => {
    const list: ComboboxOption[] = paintingBooths.map(b => {
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
  }, [paintingBooths, dept]);

  // Dynamic Painter Options mapped strictly from Central Painters Fleet
  const painterOptions = useMemo<ComboboxOption[]>(() => {
    const list: ComboboxOption[] = painters.map(p => {
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
  }, [painters, getPainterActiveJobCount, painterName]);

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
    // 7. Fallback to first available store lot
    return availableGrnLots[0] || grnList[0];
  }, [selectedGrnNo, initialData, grnList, availableGrnLots, wNo, customer, partCode]);

  // Sync selectedGrnNo state when selectedGrn is resolved
  useEffect(() => {
    if (selectedGrn?.grnNo && (!selectedGrnNo || selectedGrnNo !== selectedGrn.grnNo)) {
      if (!initialData?.jobCardNo) {
        setSelectedGrnNo(selectedGrn.grnNo);
      }
    }
  }, [selectedGrn, selectedGrnNo, initialData]);

  // Available balance in selected GRN lot
  const availableStoreBalance = useMemo(() => {
    if (!selectedGrn) {
      return initialData?.targetQty || 300;
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
      color: batchColor,
      targetQty,
      sprayedQty: currentGoodQty + currentRejectQty,
      goodQty: currentGoodQty,
      rejectQty: currentRejectQty,
      remainingQty: Math.max(0, targetQty - currentGoodQty - currentRejectQty),
      status: (currentGoodQty >= targetQty && targetQty > 0) ? 'Target Met' : (currentGoodQty > 0 ? 'In Process' : 'Open'),
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
      if (initialData.targetQty) setTargetQty(initialData.targetQty);
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
      if (initialData.rejectQty !== undefined) setCurrentRejectQty(initialData.rejectQty);
      if (initialData.progressLogs) setLiveProgressLogs(initialData.progressLogs);
      if (initialData.issuedMaterials && initialData.issuedMaterials.length > 0) {
        setIssuedMaterials(initialData.issuedMaterials);
      }
      if (initialData.deadlineDate) setDeadlineDate(initialData.deadlineDate);
      if (initialData.deadlineTime) setDeadlineTime(initialData.deadlineTime);
    }
  }, [initialData, isOpen, grnList]);

  // Remaining pieces calculation
  const remainingQty = Math.max(0, targetQty - currentGoodQty - currentRejectQty);
  const totalSprayedSoFar = currentGoodQty + currentRejectQty;
  const progressPercent = targetQty > 0 ? Math.min(100, Math.round((currentGoodQty / targetQty) * 100)) : 0;
  const defectPercent = totalSprayedSoFar > 0 ? ((currentRejectQty / totalSprayedSoFar) * 100).toFixed(1) : '0.0';

  // Multi-Stage Coating Process Configuration & Dynamic Counters
  const processStages = useMemo(() => getStagesForProcess(processType), [processType]);

  const stageCounts = useMemo(() => {
    const stage1Logs = liveProgressLogs.filter(l => l.processStage === 'stage_1_primer');
    const stage2Logs = liveProgressLogs.filter(l => l.processStage === 'stage_2_basecoat');
    const stage3Logs = liveProgressLogs.filter(l => l.processStage === 'stage_3_topcoat' || !l.processStage);

    const s1Completed = stage1Logs.reduce((sum, l) => sum + (l.piecesCompleted || 0), 0) || (initialData?.primerCompletedQty || 0);
    const s1Rejects = stage1Logs.reduce((sum, l) => sum + (l.reworkPieces || 0) + (l.scrapPieces || 0), 0) || (initialData?.primerRejectQty || 0);
    const s1Good = Math.max(0, s1Completed - s1Rejects);

    const s2Completed = stage2Logs.reduce((sum, l) => sum + (l.piecesCompleted || 0), 0) || (initialData?.basecoatCompletedQty || 0);
    const s2Rejects = stage2Logs.reduce((sum, l) => sum + (l.reworkPieces || 0) + (l.scrapPieces || 0), 0) || (initialData?.basecoatRejectQty || 0);
    const s2Good = Math.max(0, s2Completed - s2Rejects);

    const s3Completed = stage3Logs.reduce((sum, l) => sum + (l.piecesCompleted || 0), 0) || (initialData?.topcoatCompletedQty || (initialData?.goodQty || 0) + (initialData?.rejectQty || 0));
    const s3Rejects = stage3Logs.reduce((sum, l) => sum + (l.reworkPieces || 0) + (l.scrapPieces || 0), 0) || (initialData?.topcoatRejectQty || currentRejectQty);
    const s3Good = stage3Logs.length > 0 
      ? Math.max(0, s3Completed - s3Rejects)
      : (initialData?.goodQty || currentGoodQty);

    return {
      stage1: { completed: s1Completed, good: s1Good, rejects: s1Rejects },
      stage2: { completed: s2Completed, good: s2Good, rejects: s2Rejects },
      stage3: { completed: s3Completed, good: s3Good, rejects: s3Rejects }
    };
  }, [liveProgressLogs, initialData, currentGoodQty, currentRejectQty]);

  // Strict Sequential Stage Handshake Logic:
  // - Stage 1 Input: Raw substrate parts from Stores (targetQty)
  // - Stage 2 Input: ONLY the Good Pieces passed by Stage 1 (stageCounts.stage1.good)
  // - Stage 3 Input: ONLY the Good Pieces passed by Stage 2 (stageCounts.stage2.good)
  const currentStageMaxAllowed = useMemo(() => {
    if (selectedStage === 'stage_1_primer') {
      return Math.max(0, targetQty - stageCounts.stage1.completed);
    }
    if (selectedStage === 'stage_2_basecoat') {
      // Stage 2 can NEVER spray or pass more pieces than what Stage 1 passed as OK
      return Math.max(0, stageCounts.stage1.good - stageCounts.stage2.completed);
    }
    // stage_3_topcoat: can NEVER spray or pass more pieces than what Stage 2 passed as OK
    return Math.max(0, stageCounts.stage2.good - stageCounts.stage3.completed);
  }, [selectedStage, targetQty, stageCounts]);

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
    if (stageKey === 'stage_1_primer') {
      maxForStage = Math.max(0, targetQty - stageCounts.stage1.completed);
    } else if (stageKey === 'stage_2_basecoat') {
      maxForStage = Math.max(0, stageCounts.stage1.good - stageCounts.stage2.completed);
    } else {
      maxForStage = Math.max(0, stageCounts.stage2.good - stageCounts.stage3.completed);
    }
    const defaultSprayed = Math.min(100, maxForStage);
    setLogPiecesSprayed(defaultSprayed);
    setLogGoodPieces(defaultSprayed);
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
    const maxAllowed = currentStageMaxAllowed;
    const sprayed = Math.min(maxAllowed, Math.max(0, val));
    setLogPiecesSprayed(sprayed);
    const rej = Math.min(sprayed, logRejectPieces);
    setLogRejectPieces(rej);
    setLogGoodPieces(Math.max(0, sprayed - rej));
  };

  const handleGoodPiecesChange = (val: number) => {
    if (isNaN(val)) val = 0;
    const maxAllowed = logPiecesSprayed;
    const good = Math.min(maxAllowed, Math.max(0, val));
    setLogGoodPieces(good);
    setLogRejectPieces(Math.max(0, logPiecesSprayed - good));
  };

  const handleRejectPiecesChange = (val: number) => {
    if (isNaN(val)) val = 0;
    const maxAllowed = logPiecesSprayed;
    const rej = Math.min(maxAllowed, Math.max(0, val));
    setLogRejectPieces(rej);
    setLogGoodPieces(Math.max(0, logPiecesSprayed - rej));
  };

  const handleSaveOutputBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (logPiecesSprayed <= 0) return;

    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
    const timeFormatted = logTimeInput || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    const isFinalStage = selectedStage === 'stage_3_topcoat';
    const newGoodTotal = isFinalStage ? (currentGoodQty + logGoodPieces) : currentGoodQty;
    const newRejectTotal = currentRejectQty + logRejectPieces;

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
      reworkPieces: logRejectPieces,
      scrapPieces: 0,
      defectCategory: logRejectPieces > 0 ? logDefectCategory : 'none',
      defectReason: logRejectPieces > 0 ? DEFECT_LABELS[logDefectCategory] : undefined,
      processStage: selectedStage,
      stageName: activeStageConfig.label,
      painterName: painterName,
      boothNo: dept.split('(')[0]?.trim() || 'Booth #1',
      recordedBy: currentUser.name || 'Vikram Patel',
      remarks: logRemarksInput.trim() || undefined
    };

    setLiveProgressLogs(prev => [newLogEntry, ...prev]);
    if (isFinalStage) {
      setCurrentGoodQty(newGoodTotal);
    }
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
        reworkPieces: logRejectPieces,
        scrapPieces: 0,
        defectCategory: newLogEntry.defectCategory,
        processStage: selectedStage,
        stageName: activeStageConfig.label,
        painterName: newLogEntry.painterName,
        boothNo: newLogEntry.boothNo,
        recordedBy: newLogEntry.recordedBy,
        remarks: newLogEntry.remarks
      });
    }

    setShowOutputLogger(false);
    setLogRemarksInput('');
    const nextMax = isFinalStage
      ? Math.max(0, targetQty - newGoodTotal - newRejectTotal)
      : Math.max(0, currentStageMaxAllowed - logPiecesSprayed);
    const defaultNext = Math.min(100, Math.max(1, nextMax));
    setLogPiecesSprayed(defaultNext);
    setLogGoodPieces(defaultNext);
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
      return true;
    }
    if (step === 2) {
      if (targetQty <= 0) {
        alert('Please allocate at least 1 piece for this job card.');
        return false;
      }
      if (!batchColor.trim()) {
        alert('Please specify the target colour / finish shade.');
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (!painterName.trim()) {
        alert('Please select an assigned painter.');
        return false;
      }
      if (!deadlineDate.trim()) {
        alert('Please pick a finish deadline date.');
        return false;
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
      color: batchColor,
      targetQty,
      sprayedQty: currentGoodQty + currentRejectQty,
      goodQty: currentGoodQty,
      rejectQty: currentRejectQty,
      remainingQty: Math.max(0, targetQty - currentGoodQty - currentRejectQty),
      status: (currentGoodQty >= targetQty && targetQty > 0) ? 'Target Met' : (currentGoodQty > 0 ? 'In Process' : 'Open'),
      
      painterName,
      assignedPainterName: painterName,
      assignedPainterId: assignedPainterId,
      dept,
      boothNo: dept.split('(')[0]?.trim(),
      
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
    }

    onClose();
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
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-3.5 py-1.5 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              title="Download Job Card PDF Slip to print and hand to painter"
            >
              <Download className="w-3.5 h-3.5 text-[#8a6521]" />
              <span className="hidden sm:inline">Download PDF Slip</span>
            </button>
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
              { num: 1, label: '1. Party & Work Order' },
              { num: 2, label: '2. Substrate & Colour' },
              { num: 3, label: '3. Painter & Deadline' },
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

            {/* 1. Core Handover Summary (3 Structured Read-Only Cards - Non-Editable) */}
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
                      Challan / WO Ref: <strong className="font-mono text-[#17191c] font-medium">{wNo}</strong>
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
                </div>
              </div>

              {/* Card 2: Component & Target Specifications */}
              <div className="bg-white p-5 rounded-[24px] border border-[#ececec] shadow-xs flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10.5px] font-bold text-[#c09748] uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#c09748]" />
                    <span>Component & Target Specifications</span>
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
                    <span className="text-[#777b86]">Target Pieces:</span>
                    <span className="font-mono font-bold text-xs text-[#17191c]">
                      {targetQty.toLocaleString('en-IN')} Pieces
                    </span>
                  </div>
                  <div className="flex justify-between items-center h-6">
                    <span className="text-[#777b86]">Target Colour:</span>
                    <span className="font-bold text-[11px] text-[#8a6521] bg-[#faf3e0] px-2.5 py-0.5 rounded-full border border-[#f4e5be] truncate max-w-[170px]">
                      {batchColor}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Floor Handover & Deadline */}
              <div className="bg-white p-5 rounded-[24px] border border-[#ececec] shadow-xs flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10.5px] font-bold text-[#c09748] uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#c09748]" />
                    <span>Floor Handover & Deadline</span>
                  </span>
                  <div className="mt-2.5">
                    <div className="text-[11px] font-medium text-[#777b86]">Assigned Line Painter</div>
                    <div className="text-sm font-bold text-[#17191c] font-sans truncate mt-0.5" title={painterName}>
                      {painterName}
                    </div>
                    <div className="text-xs text-[#777b86] truncate mt-0.5" title={dept}>
                      {dept}
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-[#f2f2f3] space-y-2 text-xs">
                  <div className="flex justify-between items-center h-6">
                    <span className="text-[#777b86]">Finish Deadline:</span>
                    <span className="font-mono font-bold text-xs text-[#17191c]">{deadlineDate} • {deadlineTime}</span>
                  </div>
                  <div className="flex justify-between items-center h-6">
                    <span className="text-[#777b86]">Deadline Status:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${deadlineStatus.badgeColor}`}>
                      {deadlineStatus.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Company Issued Materials Table (with "+ Issue Additional Paint / Consumable") */}
            <div className="bg-white p-6 sm:p-7 rounded-[24px] border border-[#ececec] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ececec]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#c09748]" />
                    <h3 className="font-serif font-normal text-lg sm:text-xl text-[#17191c]">
                      Company Issued Paints & Consumables
                    </h3>
                  </div>
                  <p className="text-xs text-[#777b86] mt-0.5">
                    Materials handed over to the painter for this job. You can issue additional paints or solvents below.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setShowReturnModal(true)}
                    className="px-4 py-2 rounded-full bg-[#faf7ed] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#c09748]" />
                    <span>Return Balance to Store</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddMaterialDrawer(!showAddMaterialDrawer)}
                    className="px-4 py-2 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#8a6521]" />
                    <span>{showAddMaterialDrawer ? 'Cancel Additional Issue' : 'Issue Additional Material'}</span>
                  </button>
                </div>
              </div>

              {/* Add Additional Material Drawer */}
              {showAddMaterialDrawer && (
                <div className="p-4 sm:p-5 bg-[#faf7ed] rounded-[20px] border border-[#f4e5be] space-y-3.5 animate-in fade-in duration-150">
                  <div className="font-mono text-xs font-bold text-[#8a6521] uppercase tracking-wide flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#8a6521]" />
                    <span>Issue Additional Paint, Thinner, Hardener or Consumable to Painter:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1 font-mono">
                        Material Description *
                      </label>
                      <input
                        type="text"
                        value={newMatDesc}
                        onChange={e => setNewMatDesc(e.target.value)}
                        placeholder="e.g. PU Thinner 400 Solvent (Viscosity Boost)"
                        className="w-full h-9.5 px-3 rounded-[12px] border border-[#dcdfe4] bg-white font-semibold text-xs text-[#17191c] focus:border-[#c09748] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1 font-mono">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={newMatQty}
                        onChange={e => setNewMatQty(Number(e.target.value))}
                        className="w-full h-9.5 px-3 rounded-[12px] border border-[#dcdfe4] bg-white font-mono font-bold text-xs text-[#17191c] focus:border-[#c09748] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1 font-mono">
                        Unit of Measure (UOM)
                      </label>
                      <select
                        value={newMatUom}
                        onChange={e => setNewMatUom(e.target.value)}
                        className="w-full h-9.5 px-2.5 rounded-[12px] border border-[#dcdfe4] bg-white font-semibold text-xs text-[#17191c] focus:border-[#c09748] focus:outline-none cursor-pointer"
                      >
                        <option value="Litres">Litres</option>
                        <option value="Kgs">Kgs</option>
                        <option value="Pcs">Pcs</option>
                        <option value="Cans">Cans</option>
                        <option value="Rolls">Rolls</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                    <input
                      type="text"
                      value={newMatRemark}
                      onChange={e => setNewMatRemark(e.target.value)}
                      placeholder="Floor remark (e.g. Issued to Ramesh Kumar for viscosity adjustment)"
                      className="w-full sm:flex-1 h-9.5 px-3 rounded-[12px] border border-[#dcdfe4] bg-white text-xs text-[#17191c] focus:border-[#c09748] focus:outline-none"
                    />
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setShowAddMaterialDrawer(false)}
                        className="px-3.5 py-1.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddAdditionalMaterial}
                        className="px-4 py-1.5 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#8a6521]" />
                        <span>Save to Job Card</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Materials Table (Read-Only Table) */}
              <div className="border border-[#ececec] rounded-[18px] overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#f2f2f3] text-[#17191c] font-mono border-b border-[#ececec]">
                      <th className="py-2.5 px-4 font-bold w-12 text-center">#</th>
                      <th className="py-2.5 px-4 font-bold">Material Description</th>
                      <th className="py-2.5 px-4 font-bold text-center">Qty</th>
                      <th className="py-2.5 px-4 font-bold text-center">UOM</th>
                      <th className="py-2.5 px-4 font-bold">Shade / Grade</th>
                      <th className="py-2.5 px-4 font-bold">Floor Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ececec]">
                    {issuedMaterials.map((item, idx) => (
                      <tr key={item.id} className={idx % 2 === 1 ? 'bg-[#fafafb]' : 'bg-white'}>
                        <td className="py-2.5 px-4 text-center font-mono text-[#777b86] font-semibold">{idx + 1}</td>
                        <td className="py-2.5 px-4 font-semibold text-[#17191c]">{item.itemDescription}</td>
                        <td className="py-2.5 px-4 text-center font-mono font-bold text-[#17191c]">{item.qty}</td>
                        <td className="py-2.5 px-4 text-center font-mono text-[#777b86]">{item.uom}</td>
                        <td className="py-2.5 px-4 font-mono text-[#777b86]">{item.colour || '-'}</td>
                        <td className="py-2.5 px-4 text-[#777b86]">{item.remark || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Reconciliation Card: Issued = Good + Reject + Returned + Variance */}
              {(() => {
                const jcReturnSlips = balanceReturnSlips.filter(r => r.jobCardNo === jobCardNo);
                const totalReturned = jcReturnSlips
                  .flatMap(r => r.lines)
                  .reduce((sum, line) => sum + Number(line.storeCountedQty || line.returnedQtyClaimed || 0), 0);
                const goodPieces = stageCounts.stage2.completed || initialData?.goodQty || 0;
                const rejectPieces = stageCounts.stage2.rejects || initialData?.rejectQty || 0;
                const totalAccounted = goodPieces + rejectPieces + totalReturned;
                const variance = targetQty - totalAccounted;

                return (
                  <div className="p-4 bg-[#fafafb] rounded-[18px] border border-[#ececec] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <RotateCcw className="w-3.5 h-3.5 text-[#c09748]" />
                        <span className="font-mono text-xs font-bold text-[#17191c] uppercase tracking-wide">
                          Material & Output Reconciliation Rule
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#777b86]">
                        {jcReturnSlips.length} Return Slip(s) Logged
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      <div className="bg-white p-2.5 rounded-[12px] border border-[#ececec]">
                        <span className="text-[10px] text-[#777b86] uppercase font-mono block">Target Demand</span>
                        <span className="font-mono font-bold text-sm text-[#17191c]">{targetQty} Pcs</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-[12px] border border-[#ececec]">
                        <span className="text-[10px] text-emerald-700 uppercase font-mono block">Good Output</span>
                        <span className="font-mono font-bold text-sm text-emerald-800">{goodPieces} Pcs</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-[12px] border border-[#ececec]">
                        <span className="text-[10px] text-rose-700 uppercase font-mono block">Rejection Scrap</span>
                        <span className="font-mono font-bold text-sm text-rose-800">{rejectPieces} Pcs</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-[12px] border border-[#ececec]">
                        <span className="text-[10px] text-[#8a6521] uppercase font-mono block">Returned to Store</span>
                        <span className="font-mono font-bold text-sm text-[#8a6521]">{totalReturned} Pcs</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] pt-1 border-t border-[#f2f2f3]">
                      <span className="text-[#777b86]">
                        Reconciliation: <strong className="font-mono">Issued ({targetQty}) = Good ({goodPieces}) + Reject ({rejectPieces}) + Returned ({totalReturned}) + Variance ({variance})</strong>
                      </span>
                      {variance === 0 ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
                          ✓ 100% Balanced (0 Variance)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200 self-start sm:self-auto">
                          ⚠ Discrepancy: {variance > 0 ? `+${variance}` : variance} Pcs Variance
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

                        {/* ================================================================= */}
            {/* 3. LIVE SHOP FLOOR PROCESS OUTPUT TRACKER & PIECE LOGGING        */}
            {/* Placed at the bottom of the Job Card per floor manager workflow  */}
            {/* ================================================================= */}
            <div className="bg-white p-5 rounded-[24px] border border-[#ececec] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ececec]">
              <div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#c09748]" />
                  <span className="text-[10px] font-bold text-[#c09748] uppercase tracking-wider font-mono">
                    Live Shop Floor Process Output Tracker
                  </span>
                </div>
                <h2 className="font-serif font-normal text-xl text-[#17191c] mt-0.5">
                  Production Pieces & Rejection Status
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className={`px-3 py-1 rounded-full border text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-2xs ${deadlineStatus.badgeColor}`}>
                  <span>🎯 Deadline: {deadlineDate} • {deadlineTime}</span>
                  <span className="opacity-80">({deadlineStatus.label})</span>
                </div>

                {remainingQty === 0 && targetQty > 0 ? (
                  <div className="px-4 py-1.5 rounded-full bg-[#faf7ed] text-[#8a6521] border border-[#f4e5be] text-xs font-bold flex items-center gap-1.5 shadow-2xs select-none cursor-default">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#8a6521]" />
                    <span>Target Completed (100% Finished)</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!showOutputLogger) {
                        let initialStage: CoatingProcessStage = 'stage_1_primer';
                        if (stageCounts.stage1.completed >= targetQty && stageCounts.stage2.completed < (stageCounts.stage1.good || targetQty)) {
                          initialStage = 'stage_2_basecoat';
                        } else if (stageCounts.stage2.completed >= (stageCounts.stage1.good || targetQty)) {
                          initialStage = 'stage_3_topcoat';
                        }
                        handleSelectStage(initialStage);
                      }
                      setShowOutputLogger(!showOutputLogger);
                    }}
                    className="px-4 py-1.5 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#8a6521]" />
                    <span>{showOutputLogger ? 'Hide Output Drawer' : 'Log Output Pieces'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* 3-Stage Coating Milestone Progression Ribbon */}
            <div className="bg-[#fafafb] p-4.5 rounded-[22px] border border-[#ececec] space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-[#ececec]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#c09748]" />
                  <span className="text-[11px] font-mono font-bold text-[#17191c] uppercase tracking-wider">
                    3-Stage Coating Flow & Defect Control
                  </span>
                  <span className="text-[10px] font-sans text-[#777b86]">
                    (Stage 1 Primer ➔ Stage 2 Basecoat ➔ Stage 3 Clear Topcoat)
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10.5px] font-mono font-bold text-[#8a6521] bg-[#faf3e0] px-2.5 py-0.5 rounded-full border border-[#f4e5be]">
                    Target: {targetQty.toLocaleString('en-IN')} Pcs
                  </span>
                  <span className={`text-[10.5px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                    totalRejectionsAllStages > 0 ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-[#faf7ed] text-[#8a6521] border-[#f4e5be]'
                  }`}>
                    Total Defects: {totalRejectionsAllStages} Pcs ({overallJobRejRate}%)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {processStages.map((st) => {
                  const counts = st.key === 'stage_1_primer' 
                    ? stageCounts.stage1 
                    : st.key === 'stage_2_basecoat' 
                    ? stageCounts.stage2 
                    : stageCounts.stage3;
                  
                  const inputCap = st.key === 'stage_1_primer'
                    ? targetQty
                    : st.key === 'stage_2_basecoat'
                    ? stageCounts.stage1.good
                    : stageCounts.stage2.good;

                  const rejRate = st.key === 'stage_1_primer'
                    ? stage1RejRate
                    : st.key === 'stage_2_basecoat'
                    ? stage2RejRate
                    : stage3RejRate;

                  const isComplete = inputCap > 0 && counts.completed >= inputCap;
                  const isStarted = counts.completed > 0;
                  const isLocked = st.key !== 'stage_1_primer' && inputCap === 0;
                  const pct = inputCap > 0 ? Math.min(100, Math.round((counts.good / inputCap) * 100)) : 0;

                  return (
                    <div 
                      key={st.key}
                      className={`p-4 rounded-[18px] border transition flex flex-col justify-between space-y-3 ${
                        isLocked
                          ? 'bg-gray-50/70 border-gray-200 opacity-60'
                          : isComplete
                          ? 'bg-[#faf7ed] border-[#f4e5be] shadow-xs'
                          : isStarted
                          ? 'bg-white border-[#c09748]/50 shadow-xs'
                          : 'bg-white border-[#ececec]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#17191c] flex items-center gap-1.5">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isComplete ? 'bg-[#8a6521] text-white' : 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]'
                            }`}>
                              {isComplete ? '✓' : st.num}
                            </span>
                            <span>{st.shortLabel}</span>
                          </span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                            isLocked
                              ? 'bg-gray-100 text-[#777b86] border-gray-200'
                              : isComplete 
                              ? 'bg-[#faf3e0] text-[#8a6521] border-[#f4e5be]' 
                              : isStarted 
                              ? 'bg-amber-50 text-amber-800 border-amber-200' 
                              : 'bg-gray-100 text-[#777b86] border-gray-200'
                          }`}>
                            {isLocked ? 'Waiting for Prev Stage' : isComplete ? 'Stage Complete' : isStarted ? `${counts.good}/${inputCap} OK` : 'Pending'}
                          </span>
                        </div>

                        <div className="text-xs font-semibold text-[#17191c] truncate">
                          {st.label.replace(/^Stage \d:\s*/, '')}
                        </div>
                      </div>

                      {/* Clean 4-Metric Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="p-2 rounded-[10px] bg-[#fafafb] border border-[#ececec]">
                          <div className="text-[9.5px] uppercase text-[#777b86]">Inward Input</div>
                          <div className="font-bold text-[#17191c] mt-0.5">{inputCap} Pcs</div>
                        </div>

                        <div className="p-2 rounded-[10px] bg-[#faf7ed] border border-[#f4e5be]">
                          <div className="text-[9.5px] uppercase text-[#8a6521]">Passed OK</div>
                          <div className="font-bold text-[#8a6521] mt-0.5">+{counts.good} Pcs</div>
                        </div>

                        <div className={`p-2 rounded-[10px] border ${counts.rejects > 0 ? 'bg-rose-50 border-rose-200' : 'bg-[#fafafb] border-[#ececec]'}`}>
                          <div className={`text-[9.5px] uppercase ${counts.rejects > 0 ? 'text-rose-800' : 'text-[#777b86]'}`}>Rejections</div>
                          <div className={`font-bold mt-0.5 ${counts.rejects > 0 ? 'text-rose-700' : 'text-[#777b86]'}`}>{counts.rejects} Pcs</div>
                        </div>

                        <div className={`p-2 rounded-[10px] border ${counts.rejects > 0 ? 'bg-rose-50/70 border-rose-200' : 'bg-[#faf7ed] border-[#f4e5be]'}`}>
                          <div className="text-[9.5px] uppercase text-[#777b86]">Rejection Rate</div>
                          <div className={`font-bold mt-0.5 ${counts.rejects > 0 ? 'text-rose-700' : 'text-[#8a6521]'}`}>{rejRate}%</div>
                        </div>
                      </div>

                      {/* Micro Progress Bar */}
                      <div className="space-y-1">
                        <div className="h-2 w-full bg-[#f2f2f3] rounded-full overflow-hidden flex border border-[#ececec]">
                          <div 
                            className="bg-[#c09748] h-full transition-all duration-300"
                            style={{ width: `${inputCap > 0 ? Math.min(100, (counts.good / inputCap) * 100) : 0}%` }}
                            title={`Good: ${counts.good}`}
                          />
                          {counts.rejects > 0 && (
                            <div 
                              className="bg-rose-500 h-full transition-all duration-300"
                              style={{ width: `${inputCap > 0 ? Math.min(100, (counts.rejects / inputCap) * 100) : 0}%` }}
                              title={`Rejects: ${counts.rejects}`}
                            />
                          )}
                        </div>
                        <div className="flex justify-between text-[10px] font-mono text-[#777b86]">
                          <span>{inputCap > 0 ? Math.round((counts.good / inputCap) * 100) : 0}% Good Yield</span>
                          {counts.rejects > 0 && <span className="text-rose-700 font-semibold">{rejRate}% Defect Rate</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4 Metric Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#fafafb] p-3.5 rounded-[18px] border border-[#ececec] space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#777b86] font-bold block flex items-center gap-1">
                  <Layers className="w-3 h-3 text-[#c09748]" />
                  Total Given (Shuru me)
                </span>
                <div className="font-mono text-2xl font-bold text-[#17191c]">
                  {targetQty.toLocaleString('en-IN')} <span className="text-xs font-normal text-[#777b86]">Pcs</span>
                </div>
                <div className="text-[10px] text-[#777b86] font-mono truncate">
                  Assigned: {painterName}
                </div>
              </div>

              <div className="bg-[#faf7ed] p-3.5 rounded-[18px] border border-[#f4e5be] space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#8a6521] font-bold block flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#c09748]" />
                  Good Passed (Hue hain)
                </span>
                <div className="font-mono text-2xl font-bold text-[#17191c]">
                  {currentGoodQty.toLocaleString('en-IN')} <span className="text-xs font-normal text-[#777b86]">Pcs</span>
                </div>
                <div className="text-[10px] text-[#8a6521] font-semibold font-mono">
                  {progressPercent}% Target Completed
                </div>
              </div>

              <div className="bg-rose-50/70 p-3.5 rounded-[18px] border border-rose-200 space-y-1">
                <span className="text-[10px] font-mono uppercase text-rose-800 font-bold block flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-rose-600" />
                  Rejection / Defect
                </span>
                <div className="font-mono text-2xl font-bold text-rose-900">
                  {currentRejectQty.toLocaleString('en-IN')} <span className="text-xs font-normal text-rose-700">Pcs</span>
                </div>
                <div className="text-[10px] text-rose-800 font-mono">
                  {defectPercent}% Defect Rate
                </div>
              </div>

              <div className="bg-amber-50/70 p-3.5 rounded-[18px] border border-amber-200 space-y-1">
                <span className="text-[10px] font-mono uppercase text-amber-800 font-bold block flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600" />
                  Remaining (Bache hain)
                </span>
                <div className="font-mono text-2xl font-bold text-amber-900">
                  {remainingQty.toLocaleString('en-IN')} <span className="text-xs font-normal text-amber-700">Pcs</span>
                </div>
                <div className="text-[10px] text-amber-800 font-mono">
                  {remainingQty === 0 ? '🎉 100% Complete' : 'Pending on Floor'}
                </div>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-[#777b86]">
                  Execution Balance: <strong className="text-[#8a6521]">{currentGoodQty} Good</strong> + <strong className="text-rose-700">{currentRejectQty} Rej</strong> of {targetQty} Pcs
                </span>
                <span className="font-bold text-[#17191c]">{progressPercent}% Complete</span>
              </div>
              <div className="h-2.5 w-full bg-[#f2f2f3] rounded-full overflow-hidden flex border border-[#ececec]">
                <div 
                  className="bg-[#c09748] h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, targetQty > 0 ? (currentGoodQty / targetQty) * 100 : 0)}%` }}
                  title={`Good Pieces: ${currentGoodQty}`}
                />
                <div 
                  className="bg-rose-500 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, targetQty > 0 ? (currentRejectQty / targetQty) * 100 : 0)}%` }}
                  title={`Rejections: ${currentRejectQty}`}
                />
              </div>
            </div>

            {/* Interactive Batch Output Drawer */}
            {showOutputLogger && (
              <div className="bg-[#faf7ed] p-4.5 rounded-[20px] border border-[#f4e5be] space-y-3.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-[#f4e5be]">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#8a6521]" />
                    <span className="font-mono font-bold text-xs text-[#8a6521] uppercase tracking-wide">
                      Record Floor Batch Output (e.g. 500 Pcs Trolley Finished)
                    </span>
                  </div>
                  <span className="text-[10.5px] text-[#777b86] font-mono">
                    Operator: {currentUser.name} • Booth: {dept.split('(')[0]}
                  </span>
                </div>

                {/* Coating Stage Selector Buttons */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold text-[#8a6521] uppercase font-mono">
                      Select Coating / Processing Stage *
                    </label>
                    <span className="text-[10px] font-mono text-[#777b86]">
                      Max Inward Allowed for this Coat: <strong className="text-[#8a6521]">{currentStageMaxAllowed} Pcs</strong>
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {processStages.map((st) => {
                      const isSelected = selectedStage === st.key;
                      const inputCap = st.key === 'stage_1_primer'
                        ? targetQty
                        : st.key === 'stage_2_basecoat'
                        ? stageCounts.stage1.good
                        : stageCounts.stage2.good;
                      const stageInfo = st.key === 'stage_1_primer' 
                        ? stageCounts.stage1 
                        : st.key === 'stage_2_basecoat' 
                        ? stageCounts.stage2 
                        : stageCounts.stage3;
                      const isLocked = st.key !== 'stage_1_primer' && inputCap === 0;

                      return (
                        <button
                          key={st.key}
                          type="button"
                          onClick={() => handleSelectStage(st.key)}
                          className={`p-3 rounded-[14px] border text-left transition cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-white border-[#c09748] ring-2 ring-[#c09748]/30 shadow-2xs'
                              : isLocked
                              ? 'bg-gray-100/80 border-gray-200 opacity-60'
                              : 'bg-white/80 border-[#dcdfe4] hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold font-mono ${isSelected ? 'text-[#8a6521]' : 'text-[#17191c]'}`}>
                              {st.label}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#8a6521]" />}
                          </div>
                          <div className="flex items-center justify-between mt-1 text-[10px] font-mono text-[#777b86]">
                            <span>Input: {inputCap} Pcs</span>
                            <span>Done: <strong>{stageInfo.good}</strong> Pcs</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* If selected stage has 0 allowed input, show clear industrial guidance */}
                {currentStageMaxAllowed === 0 && (
                  <div className="p-3 rounded-[14px] bg-amber-50 border border-amber-200 text-xs text-amber-900 font-mono flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>
                      {selectedStage === 'stage_1_primer'
                        ? `Stage 1 ka pura target (${targetQty} Pcs) spray ho chuka hai.`
                        : selectedStage === 'stage_2_basecoat'
                        ? `Stage 1 se sirf ${stageCounts.stage1.good} pieces pass hue the aur sabhi Stage 2 me process ho chuke hain (ya Stage 1 abhi run nahi hua hai).`
                        : `Stage 2 se sirf ${stageCounts.stage2.good} pieces pass hue the aur sabhi Stage 3 me process ho chuke hain.`}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold text-[#17191c] uppercase font-mono">
                        Pieces Sprayed Now ({activeStageConfig.shortLabel}) *
                      </label>
                      <span className="text-[10px] text-[#8a6521] font-mono font-bold">
                        (Max: {currentStageMaxAllowed})
                      </span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      max={currentStageMaxAllowed}
                      value={logPiecesSprayed || ''}
                      onChange={e => handleSprayedPiecesChange(Number(e.target.value))}
                      className="w-full h-9.5 px-3 rounded-[12px] border border-[#dcdfe4] bg-white font-mono font-bold text-sm text-[#17191c]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#8a6521] uppercase mb-1 font-mono">
                      Good Passed (OK) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={logPiecesSprayed}
                      value={logGoodPieces}
                      onChange={e => handleGoodPiecesChange(Number(e.target.value))}
                      className="w-full h-9.5 px-3 rounded-[12px] border border-[#f4e5be] bg-white font-mono font-bold text-sm text-[#17191c] focus:border-[#c09748] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-rose-800 uppercase mb-1 font-mono">
                      Rejection / Defect Count
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={logPiecesSprayed}
                      value={logRejectPieces}
                      onChange={e => handleRejectPiecesChange(Number(e.target.value))}
                      className="w-full h-9.5 px-3 rounded-[12px] border border-rose-300 bg-white font-mono font-bold text-sm text-rose-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1 font-mono">
                      Defect Reason / Type
                    </label>
                    <select
                      disabled={logRejectPieces === 0}
                      value={logDefectCategory}
                      onChange={e => setLogDefectCategory(e.target.value as DefectCategory)}
                      className="w-full h-9.5 px-2 rounded-[12px] border border-[#dcdfe4] bg-white text-xs font-semibold text-[#17191c]"
                    >
                      <option value="dust_nibs">Dust Nibs / Air Lint</option>
                      <option value="paint_run">Paint Run / Sagging</option>
                      <option value="orange_peel">Orange Peel / Texture</option>
                      <option value="scratch">Scratch / Handling</option>
                      <option value="undercoat_show">Undercoat Show</option>
                      <option value="shade_deviation">Shade Mismatch</option>
                      <option value="pinhole">Pinholes / Pop</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1 font-mono">
                      Time Logged *
                    </label>
                    <input
                      type="text"
                      value={logTimeInput}
                      onChange={e => setLogTimeInput(e.target.value)}
                      className="w-full h-9 px-3 rounded-[12px] border border-[#dcdfe4] bg-white font-mono text-[#17191c]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1 font-mono">
                      Supervisor Floor Remarks
                    </label>
                    <input
                      type="text"
                      value={logRemarksInput}
                      onChange={e => setLogRemarksInput(e.target.value)}
                      className="w-full h-9 px-3 rounded-[12px] border border-[#dcdfe4] bg-white text-[#17191c]"
                      placeholder="e.g. Trolley #1 baked at 65°C, adhesion clear"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-[12px] bg-white border border-[#f4e5be] text-[11px] text-[#8a6521]">
                  ⚡ <strong>Stage Impact ({activeStageConfig.shortLabel}):</strong> Logging: <strong>+{logGoodPieces} Good OK</strong>, <strong>+{logRejectPieces} Rejections</strong>.
                  {selectedStage === 'stage_3_topcoat' ? (
                    <> Final good completion will increase to <strong>{currentGoodQty + logGoodPieces} Pcs</strong> (Remaining: <strong>{Math.max(0, remainingQty - logPiecesSprayed)} Pcs</strong>).</>
                  ) : (
                    <> Intermediate WIP pieces will now advance to {selectedStage === 'stage_1_primer' ? 'Stage 2 (Basecoat Colour)' : 'Stage 3 (Clear Topcoat & Final QC)'}.</>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowOutputLogger(false)}
                    className="px-4 py-1.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveOutputBatch}
                    disabled={logPiecesSprayed <= 0 || logPiecesSprayed > currentStageMaxAllowed}
                    className="px-5 py-1.5 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#8a6521]" />
                    <span>Record {logPiecesSprayed} Pcs for {activeStageConfig.shortLabel}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Activity & Audit Trail Strip with "View Logs" Trigger */}
            <div className="pt-3 border-t border-[#ececec]">
              <div className="p-3.5 rounded-[18px] bg-[#fafafb] border border-[#ececec] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#faf3e0] border border-[#f4e5be] flex items-center justify-center shrink-0">
                    <History className="w-4 h-4 text-[#8a6521]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#17191c]">Activity & Production Audit Trail</span>
                      <span className="text-[10.5px] font-mono font-bold text-[#8a6521] bg-[#faf3e0] px-2.5 py-0.5 rounded-full border border-[#f4e5be]">
                        {liveProgressLogs.length} Events Logged
                      </span>
                    </div>
                    <div className="text-[11px] text-[#777b86] mt-0.5">
                      {liveProgressLogs.length > 0
                        ? `Latest: ${liveProgressLogs[0].actionTitle || 'Batch Processed'} (${liveProgressLogs[0].dateLabel || 'Today'} • ${liveProgressLogs[0].timeLabel})`
                        : 'No events logged yet. Batch outputs and material additions will be recorded here.'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAuditLogsModal(true)}
                    className="px-4 py-2 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#8a6521]" />
                    <span>View Logs</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

            {/* 4. Action Footer for Existing Card */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#ececec]">
              <div className="flex items-center gap-2 text-xs text-[#777b86] font-mono">
                <span>Job Card: <strong className="text-[#17191c]">{jobCardNo}</strong></span>
                <span>•</span>
                <span>Target: <strong className="text-[#17191c]">{targetQty} Pcs</strong></span>
                <span>•</span>
                <span>Plant: <strong className="text-[#8a6521]">{activePlant}</strong></span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
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
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-[#f4e5be]/70 flex items-center justify-center shrink-0">
                      <PackageCheck className="w-3.5 h-3.5 text-[#8a6521]" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="text-[10px] font-mono uppercase font-bold text-[#8a6521] tracking-wide">
                        Linked Store Inward GRN:
                      </span>
                      <span className="font-mono font-bold text-[#17191c] bg-white px-2.5 py-0.5 rounded-full border border-[#f4e5be] shadow-2xs">
                        {selectedGrn?.grnNo || selectedGrnNo || 'PK-GRN-2026-1250'}
                      </span>
                      <span className="text-[#a3a6af] font-normal">•</span>
                      <span className="text-[#555863] font-sans font-semibold">
                        {selectedGrn?.supplierCustomer || customer}
                      </span>
                      <span className="text-[#8a6521] font-mono text-[11px] font-normal">
                        ({(selectedGrn?.actualReceivedQty || selectedGrn?.totalQty || 300).toLocaleString('en-IN')} Pcs Inward)
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 self-start sm:self-auto">
                    <span className="text-[9.5px] font-sans font-semibold bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#c09748]" />
                      <span>Verified Auto-Linked</span>
                    </span>
                  </div>
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
            {/* POINT 2: SUBSTRATE COMPONENT, PIECES & COLOUR                         */}
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
                        Point 2: Substrate Component, Pieces & Target Colour
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-serif text-[#17191c] font-normal">
                      Painter ko kaun sa part, kitne pieces aur unpe kya colour karna hai?
                    </h3>
                    <p className="text-xs text-[#777b86] mt-0.5">
                      Component code, piece quantity aur customer ka approved shade code specify karein.
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
                  
                  {/* Card Header Strip: Title, Part Info & Store Stock Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#ececec]">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#c09748]" />
                        <span className="font-mono text-xs font-bold text-[#17191c] uppercase tracking-wider">
                          Production Allocation & Target Finish Shade
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#777b86]">
                        <span>Job Card Tracing No: <strong className="font-mono text-[#8a6521] font-bold bg-[#faf7ed] px-2.5 py-0.5 rounded-full border border-[#f4e5be] shadow-2xs">{jobCardNo}</strong></span>
                        <span>•</span>
                        <span>Part Code: <strong className="font-mono text-[#17191c] font-bold">{partCode || 'RP-8841'}</strong></span>
                        <span>•</span>
                        <span>Part Name: <strong className="text-[#17191c] font-semibold">{partDescription || 'Component Description'}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-[#777b86] self-start sm:self-center">
                      <span>Store Stock:</span>
                      <span className="font-bold text-[#8a6521] bg-[#faf3e0] px-3 py-1 rounded-full border border-[#f4e5be]">
                        {availableStoreBalance.toLocaleString('en-IN')} Pcs Available
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column: Pieces to Spray (Quantity Allocation) */}
                    <div className="space-y-3">
                      <label className="block text-[11px] font-bold text-[#17191c] uppercase font-mono">
                        Pieces to Spray (Target Quantity) *
                      </label>

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
                            handleRecalculateMaterials(clamped);
                          }}
                          className="w-36 h-11 px-3.5 rounded-[14px] border border-[#c09748] font-mono font-bold text-base bg-white text-[#17191c] focus:outline-none shadow-2xs"
                        />

                        <button
                          type="button"
                          onClick={() => {
                            setTargetQty(availableStoreBalance);
                            handleRecalculateMaterials(availableStoreBalance);
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
                            handleRecalculateMaterials(half);
                          }}
                          className="px-3 py-2.5 rounded-[12px] bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold transition cursor-pointer active:scale-95 shadow-2xs"
                        >
                          50%
                        </button>

                        {[100, 250, 500, 1000].map(cnt => (
                          cnt <= availableStoreBalance && (
                            <button
                              key={cnt}
                              type="button"
                              onClick={() => {
                                setTargetQty(cnt);
                                handleRecalculateMaterials(cnt);
                              }}
                              className={`px-3 py-2.5 rounded-[12px] text-xs font-mono transition cursor-pointer shadow-2xs ${
                                targetQty === cnt
                                  ? 'bg-[#17191c] text-[#c09748] font-bold'
                                  : 'bg-white border border-[#ececec] text-[#777b86] hover:bg-gray-50'
                              }`}
                            >
                              {cnt}
                            </button>
                          )
                        ))}
                      </div>

                      {/* Live Allocation Summary Bar */}
                      <div className="space-y-1.5 pt-1 text-[11px] font-mono text-[#777b86]">
                        <div className="flex justify-between">
                          <span>Assigning: <strong className="text-[#17191c]">{targetQty.toLocaleString('en-IN')}</strong> of {availableStoreBalance.toLocaleString('en-IN')} Pcs</span>
                          <span className="font-bold text-[#8a6521]">
                            {availableStoreBalance > 0 ? Math.round((targetQty / availableStoreBalance) * 100) : 100}% Allocated
                          </span>
                        </div>
                        <div className="h-2 w-full bg-[#ececec] rounded-full overflow-hidden">
                          <div 
                            className="bg-[#c09748] h-full transition-all duration-300"
                            style={{ width: `${Math.min(100, availableStoreBalance > 0 ? (targetQty / availableStoreBalance) * 100 : 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Target Colour / Finish Shade with Autocomplete Dropdown */}
                    <div className="space-y-3 relative">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold text-[#17191c] uppercase font-mono">
                          Target Colour / Finish Shade *
                        </label>
                        <span className="text-[10px] text-[#777b86] font-mono">
                          Direct Typing + Dropdown Suggestions
                        </span>
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={batchColor}
                          onChange={e => {
                            setBatchColor(e.target.value);
                            setShowColorDropdown(true);
                          }}
                          onFocus={() => setShowColorDropdown(true)}
                          placeholder="Type or choose colour (e.g. Monza Red Gloss, Piano Black)..."
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
                              <span>Previously Used & Approved Factory Shades</span>
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

                      <div className="p-2.5 rounded-[12px] bg-white border border-[#ececec] text-[11px] text-[#777b86] flex items-center justify-between">
                        <span>Current Selected Shade: <strong className="text-[#8a6521]">{batchColor || 'Not specified'}</strong></span>
                        <span className="font-mono text-[10px] text-[#979799]">Direct custom typing enabled</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================================== */}
            {/* POINT 3: PAINTER, BOOTH & STRICT DEADLINE                             */}
            {/* ===================================================================== */}
            {!isExistingCard && currentStep === 3 && (
              <div className="bg-white p-6 sm:p-7 rounded-[24px] border border-[#ececec] shadow-xs space-y-6">
                <div className="pb-3 border-b border-[#ececec]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-6 h-6 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] flex items-center justify-center font-bold font-mono text-xs">
                      3
                    </span>
                    <span className="text-[11px] font-bold text-[#c09748] uppercase tracking-wider font-mono">
                      Point 3: Painter, Spray Booth & Strict Completion Deadline
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-serif text-[#17191c] font-normal">
                    Kaun sa painter spray karega aur kis date/time ke andar kaam finish karna hoga?
                  </h3>
                  <p className="text-xs text-[#777b86] mt-0.5">
                    Painter assignment with live workload status aur exact completion deadline set karein.
                  </p>
                </div>

                {/* 2-Column Responsive Form Fields for Booth & Painter */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Department / Spray Booth Line */}
                  <CustomCombobox
                    label="Department / Painting Line"
                    required
                    options={boothOptions}
                    value={dept}
                    onChange={(val) => setDept(val)}
                    placeholder="Select or enter spray booth line..."
                    searchPlaceholder="Search booth or type new booth name..."
                    allowCustom={true}
                    customTypePrompt="+ Add & Type Custom Spray Booth / Line"
                  />

                  {/* Assign Painter */}
                  <CustomCombobox
                    label="Assign Floor Painter (Max 2 Jobs Limit)"
                    required
                    options={painterOptions}
                    value={painterName}
                    onChange={(val) => {
                      setPainterName(val);
                      const matched = painters.find(p => p.name === val);
                      if (matched) {
                        setAssignedPainterId(matched.id);
                      } else {
                        setAssignedPainterId(`PAINTER-${Date.now()}`);
                      }
                    }}
                    placeholder="Select or enter painter name..."
                    searchPlaceholder="Search painter or type new name..."
                    allowCustom={true}
                    customTypePrompt="+ Add & Type New Floor Painter Name"
                  />
                </div>

                {/* Combined Strict Deadline Box */}
                <div className="p-4 sm:p-5 bg-[#fafafb] rounded-[22px] border border-[#f4e5be] space-y-3.5 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-[#f2f2f3]">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#8a6521]" />
                      <span className="text-xs font-bold text-[#17191c] uppercase font-mono tracking-wide">
                        Strict Completion Deadline (Date & Time Target) *
                      </span>
                    </div>

                    <div className={`px-3 py-1 rounded-full text-[10.5px] font-mono font-bold border self-start sm:self-auto ${deadlineStatus.badgeColor}`}>
                      {deadlineStatus.label}
                    </div>
                  </div>

                  {/* Unified Date & Time Picker */}
                  <PaintkingDateTimePicker
                    dateValue={deadlineDate}
                    timeValue={deadlineTime}
                    onChange={(newDate, newTime) => {
                      setDeadlineDate(newDate);
                      setDeadlineTime(newTime);
                    }}
                  />

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#ececec]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-[#777b86] font-mono font-medium">Quick Presets:</span>
                      {[
                        { hours: 2, label: '2h (Rush)' },
                        { hours: 4, label: '4h (Standard)' },
                        { hours: 8, label: '8h (1 Shift)' },
                        { hours: 24, label: '24h (Next Day)' },
                        { hours: 48, label: '48h (2 Days)' }
                      ].map(preset => (
                        <button
                          key={preset.hours}
                          type="button"
                          onClick={() => handleApplyPresetDeadline(preset.hours)}
                          className={`px-3 py-1 rounded-full text-[11px] font-mono transition cursor-pointer ${
                            slaHours === preset.hours
                              ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] font-bold shadow-2xs'
                              : 'bg-white text-[#777b86] border border-[#ececec] hover:bg-gray-100'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    <span className="text-[10.5px] text-[#777b86] font-mono">
                      Calculated Target: <strong className="text-[#17191c] font-sans">{deadlineDate} • {deadlineTime}</strong>
                    </span>
                  </div>
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
                      onClick={() => handleRecalculateMaterials(targetQty)}
                      className="px-3 py-1.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-[10.5px] font-semibold transition cursor-pointer shadow-2xs active:scale-95"
                    >
                      Auto-Scale for {targetQty} Pcs
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

                {/* Final Launch Summary Capsule */}
                <div className="p-4 rounded-[18px] bg-[#faf7ed] border border-[#f4e5be] space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-mono font-bold text-[#8a6521] uppercase text-[10.5px]">
                    <Sparkles className="w-3.5 h-3.5 text-[#8a6521]" />
                    <span>Job Card Launch Summary Review:</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div>Party: <strong className="text-[#17191c]">{customer}</strong></div>
                    <div>Part: <strong className="text-[#17191c]">{partCode}</strong></div>
                    <div>Pieces: <strong className="text-[#17191c] font-mono">{targetQty} Pcs</strong></div>
                    <div>Colour: <strong className="text-[#17191c]">{batchColor}</strong></div>
                    <div>Painter: <strong className="text-[#17191c]">{painterName}</strong></div>
                    <div>Booth: <strong className="text-[#17191c]">{dept.split('(')[0]}</strong></div>
                    <div className="sm:col-span-2">Deadline: <strong className="text-[#8a6521] font-mono">{deadlineDate} • {deadlineTime}</strong></div>
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
                    <Save className="w-4 h-4 text-[#8a6521]" />
                    <span>Finish & Launch Job Card for Painter</span>
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

            <div className="p-3 bg-gray-50 border border-gray-300 rounded text-xs grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-[10px] text-gray-500 uppercase">Total Given</div>
                <div className="font-bold text-sm">{targetQty} Pcs</div>
              </div>
              <div>
                <div className="text-[10px] text-[#8a6521] uppercase">Good Passed</div>
                <div className="font-bold text-sm text-[#8a6521]">{currentGoodQty} Pcs</div>
              </div>
              <div>
                <div className="text-[10px] text-rose-800 uppercase">Rejections</div>
                <div className="font-bold text-sm text-rose-800">{currentRejectQty} Pcs</div>
              </div>
              <div>
                <div className="text-[10px] text-amber-800 uppercase">Remaining Balance</div>
                <div className="font-bold text-sm text-amber-800">{remainingQty} Pcs</div>
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
                  {issuedMaterials.map((m, i) => (
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
                    <th className="p-2 border border-[#ececec] text-center">Rejections</th>
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
                        <td className="p-2 border border-[#ececec] text-center font-mono text-rose-700">
                          {counts.rejects > 0 ? `${counts.rejects} Pcs` : '____ Pcs'}
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

                            {/* Rejections */}
                            <div className={`p-2.5 rounded-[12px] border ${rejects > 0 ? 'bg-rose-50/80 border-rose-200' : 'bg-[#fafafb] border-[#ececec]'}`}>
                              <div className={`text-[9.5px] uppercase font-bold ${rejects > 0 ? 'text-rose-800' : 'text-[#777b86]'}`}>3. Rejections</div>
                              <div className={`text-sm font-bold mt-0.5 ${rejects > 0 ? 'text-rose-700' : 'text-[#777b86]'}`}>{rejects} Pcs</div>
                              <div className={`text-[9.5px] truncate mt-0.5 ${rejects > 0 ? 'text-rose-700 font-medium' : 'text-[#777b86]'}`}>
                                {rejects > 0 ? defectLabel : 'Zero Defects (100% OK)'}
                              </div>
                            </div>

                            {/* Stage Rejection % */}
                            <div className={`p-2.5 rounded-[12px] border ${rejects > 0 ? 'bg-rose-50/50 border-rose-200' : 'bg-[#faf7ed] border-[#f4e5be]'}`}>
                              <div className="text-[9.5px] uppercase text-[#777b86] font-bold">4. Stage Rejection %</div>
                              <div className={`text-sm font-bold mt-0.5 ${rejects > 0 ? 'text-rose-700' : 'text-[#8a6521]'}`}>{batchRejRate}%</div>
                              <div className="text-[9.5px] text-[#777b86] mt-0.5">
                                {rejects > 0 ? 'Defects Found' : 'First-Pass Yield'}
                              </div>
                            </div>
                          </div>

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
    </div>
  );
};
