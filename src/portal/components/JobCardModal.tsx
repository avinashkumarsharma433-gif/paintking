import React, { useState, useEffect, useMemo } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { 
  JobCard, 
  IssuedMaterialItem, 
  JobCardProductionProgressLog,
  JobCardMaterialAllocation
} from '../types/portalTypes';
import { 
  Plus, 
  Trash2, 
  Save, 
  X, 
  Printer, 
  Layers, 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  History,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface JobCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: JobCard;
}

export const JobCardModal: React.FC<JobCardModalProps> = ({ isOpen, onClose, initialData }) => {
  const { 
    addJobCard, 
    updateJobCard,
    addJobCardProgressLog,
    createMultiPainterJobCards,
    activePlant, 
    currentUser, 
    grnList, 
    jobCards, 
    painters, 
    getPainterActiveJobCount 
  } = usePortalStore();

  const [viewMode, setViewMode] = useState<'PORTAL' | 'PRINT'>('PORTAL');

  // Metadata
  const isExistingCard = Boolean(initialData?.jobCardNo && jobCards.some(j => j.jobCardNo === initialData.jobCardNo));
  const [docNo] = useState<string>(initialData?.docNo || 'Doc No: 001');
  const [revNo] = useState<string>(initialData?.revNo || 'Rev.No: 00');
  const [revDate] = useState<string>(initialData?.revDate || new Date().toISOString().split('T')[0]);

  // INITIAL PROCESS
  const [jobCardNo] = useState<string>(initialData?.jobCardNo || `JC-2026-${String(jobCards.length + 1).padStart(3, '0')}`);
  const [wNo, setWNo] = useState<string>(initialData?.wNo || initialData?.woNo || 'WO-1042');
  const [painterName, setPainterName] = useState<string>(initialData?.assignedPainterName || initialData?.painterName || painters[0]?.name || 'Ramesh Kumar (P1)');
  const [assignedPainterId, setAssignedPainterId] = useState<string>(initialData?.assignedPainterId || painters[0]?.id || 'PAINTER-01');
  const [issueDate, setIssueDate] = useState<string>(initialData?.issueDate || new Date().toISOString().split('T')[0]);
  const [issueTime, setIssueTime] = useState<string>(initialData?.issueTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [customer, setCustomer] = useState<string>(initialData?.customer || (grnList[0]?.supplierCustomer) || 'ROOP POLYMERS LTD');
  const [partCode, setPartCode] = useState<string>(initialData?.partCode || (grnList[0]?.items?.[0]?.partCode) || 'RP-8841');
  const [selectedGrnNo, setSelectedGrnNo] = useState<string>(initialData?.sourceGrnNo || (initialData as any)?.sourceGrnNo || (initialData as any)?.grnNo || '');
  const [slaHours, setSlaHours] = useState<number>(initialData?.slaHours || 4);
  const [dept, setDept] = useState<string>(initialData?.dept || 'Booth #1 (Continuous Conveyor Line)');
  const [headerRemark] = useState<string>(initialData?.headerRemark || 'Target cap enforced for shop floor.');

  // Target Quantity for this Job Card batch
  const [targetQty, setTargetQty] = useState<number>(initialData?.targetQty || 250);
  const [batchColor, setBatchColor] = useState<string>(initialData?.color || 'Monza Red Gloss');

  // Live Hourly / Progress Logging State (For Existing Cards)
  const [showProgressLogger, setShowProgressLogger] = useState<boolean>(false);
  const [logPiecesCount, setLogPiecesCount] = useState<number>(50);
  const [logReworkCount, setLogReworkCount] = useState<number>(0);
  const [logScrapCount, setLogScrapCount] = useState<number>(0);
  const [logTimeInput, setLogTimeInput] = useState<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [logRemarksInput, setLogRemarksInput] = useState<string>('Batch passed inspection on floor');
  const [liveProgressLogs, setLiveProgressLogs] = useState<JobCardProductionProgressLog[]>(initialData?.progressLogs || []);
  const [currentSprayedQty, setCurrentSprayedQty] = useState<number>(initialData?.sprayedQty || 0);
  const [currentGoodQty, setCurrentGoodQty] = useState<number>(initialData?.goodQty || 0);
  const [currentRejectQty, setCurrentRejectQty] = useState<number>(initialData?.rejectQty || 0);

  // Multi-Painter Split in Creation Mode
  const [isMultiPainterSplit] = useState<boolean>(false);
  const [painterSplits] = useState<{ painterId: string; painterName: string; boothNo: string; targetQty: number }[]>([
    { painterId: painters[0]?.id || 'ptr_1', painterName: painters[0]?.name || 'Ramesh Kumar (P1)', boothNo: 'Booth #1', targetQty: Math.floor((initialData?.targetQty || 250) / 2) },
    { painterId: painters[1]?.id || 'ptr_2', painterName: painters[1]?.name || 'Suresh Verma (P2)', boothNo: 'Booth #2', targetQty: Math.ceil((initialData?.targetQty || 250) / 2) }
  ]);

  // Preset Color Palettes for Quick Selection
  const colorPresets = [
    { name: 'Monza Red Gloss', bg: 'bg-red-600', text: 'text-white' },
    { name: 'Piano High Gloss Black', bg: 'bg-neutral-900', text: 'text-white' },
    { name: 'Pearl Arctic White', bg: 'bg-neutral-100 border border-neutral-300', text: 'text-neutral-800' },
    { name: 'Carbon Fiber 3D Dipping', bg: 'bg-neutral-800', text: 'text-amber-400' },
    { name: 'Satin Silver Metallic', bg: 'bg-slate-300', text: 'text-slate-900' }
  ];

  // Available GRN Substrate Lots (Customer Party materials only)
  const availableGrnLots = useMemo(() => {
    return grnList.filter(g => {
      const isAccepted = (g.iqcStatus === 'Accepted' || g.iqcStatus === 'Passed' || (!g.iqcStatus && g.grnNo)) && g.iqcStatus !== 'Pending' && g.iqcStatus !== 'Rejected';
      if (!isAccepted) return false;

      // Filter out pure chemicals/paints from GRN substrate picker
      const isChemical = g.partCode?.startsWith('PNT') || g.partCode?.startsWith('CHEM') || g.description?.toLowerCase().includes('paint') || g.description?.toLowerCase().includes('thinner');
      return !isChemical;
    });
  }, [grnList]);

  // Selected GRN Details
  const selectedGrn = useMemo(() => {
    if (selectedGrnNo) {
      const match = grnList.find(g => g.grnNo === selectedGrnNo);
      if (match) return match;
    }
    if (initialData?.sourceGrnNo) {
      const match = grnList.find(g => g.grnNo === initialData.sourceGrnNo);
      if (match) return match;
    }
    if (initialData?.woNo) {
      const match = grnList.find(g => g.invoiceChallanNo === initialData.woNo || g.grnNo === initialData.woNo);
      if (match) return match;
    }
    if (customer && partCode) {
      const match = grnList.find(g => 
        g.supplierCustomer?.trim().toLowerCase() === customer.trim().toLowerCase() && 
        (g.partCode === partCode || g.items?.some(i => i.partCode === partCode))
      );
      if (match) return match;
    }
    return availableGrnLots[0] || grnList[0];
  }, [selectedGrnNo, initialData, customer, partCode, grnList, availableGrnLots]);

  // Material Allocations State: Every item from the GRN with its allocatedQty and targetColor
  const [materialAllocations, setMaterialAllocations] = useState<JobCardMaterialAllocation[]>(() => {
    if (initialData?.materialAllocations && initialData.materialAllocations.length > 0) {
      return initialData.materialAllocations;
    }
    return [];
  });

  // Initialize or re-populate materialAllocations when selectedGrn or initialData changes
  useEffect(() => {
    if (initialData?.materialAllocations && initialData.materialAllocations.length > 0) {
      setMaterialAllocations(initialData.materialAllocations);
      return;
    }

    if (selectedGrn) {
      const items = (selectedGrn.items && selectedGrn.items.length > 0)
        ? selectedGrn.items
        : [{
            partCode: selectedGrn.partCode || partCode || 'RP-8841',
            partDescription: selectedGrn.description || 'Auto AC Center Vent Bezel Substrate (ABS)',
            invoicedQty: selectedGrn.invoicedQty || selectedGrn.actualReceivedQty || 1500,
            actualReceivedQty: selectedGrn.actualReceivedQty || 1500,
            okByIqcQty: selectedGrn.actualReceivedQty || 1500,
            shortExcessQty: 0,
            rejectionQty: 0
          }];

      const defaultColors = ['Monza Red Gloss', 'Piano High Gloss Black', 'Pearl Arctic White', 'Satin Silver Metallic'];

      const initialAllocations: JobCardMaterialAllocation[] = items.map((it, idx) => {
        const inOtherCards = jobCards
          .filter(jc => (jc.sourceGrnNo === selectedGrn.grnNo || jc.woNo === selectedGrn.invoiceChallanNo) && jc.jobCardNo !== initialData?.jobCardNo)
          .reduce((sum, jc) => {
            const match = jc.materialAllocations?.find(m => m.partCode === it.partCode);
            if (match) return sum + (Number(match.allocatedQty) || 0);
            if (jc.partCode === it.partCode) return sum + (Number(jc.targetQty) || 0);
            return sum;
          }, 0);

        const totalQty = it.okByIqcQty || it.actualReceivedQty || it.invoicedQty || 0;
        const avail = Math.max(0, totalQty - inOtherCards);

        // First item default to 700 (or available), second default to 400 (or available), third to 0
        let defaultAllocated = 0;
        if (idx === 0) defaultAllocated = Math.min(avail, initialData?.targetQty || 700);
        else if (idx === 1) defaultAllocated = Math.min(avail, 400);

        return {
          id: it.id || `alloc_${idx + 1}`,
          partCode: it.partCode,
          partDescription: it.partDescription,
          grnTotalQty: totalQty,
          alreadyAllocatedQty: inOtherCards,
          availableQty: avail,
          allocatedQty: defaultAllocated,
          color: it.partCode === 'RP-8842' ? 'Piano High Gloss Black' : defaultColors[idx % defaultColors.length]
        };
      });

      setMaterialAllocations(initialAllocations);
    }
  }, [selectedGrn, initialData, jobCards]);

  // Total allocated target quantity across all materials
  const totalAllocatedTargetQty = useMemo(() => {
    return materialAllocations.reduce((sum, m) => sum + (Number(m.allocatedQty) || 0), 0);
  }, [materialAllocations]);

  // Keep targetQty in sync with totalAllocatedTargetQty
  useEffect(() => {
    if (materialAllocations.length > 0) {
      setTargetQty(totalAllocatedTargetQty);
    }
  }, [totalAllocatedTargetQty, materialAllocations.length]);

  // Over-allocated items guardrail check
  const overAllocatedItems = useMemo(() => {
    return materialAllocations.filter(m => m.allocatedQty > m.availableQty);
  }, [materialAllocations]);

  const hasOverAllocation = !isExistingCard && overAllocatedItems.length > 0;

  // Handlers to update a material's target quantity and target color
  const handleUpdateMaterialQty = (id: string, qty: number) => {
    setMaterialAllocations(prev => prev.map(m => m.id === id ? { ...m, allocatedQty: Math.max(0, qty) } : m));
  };

  const handleUpdateMaterialColor = (id: string, color: string) => {
    setMaterialAllocations(prev => prev.map(m => m.id === id ? { ...m, color } : m));
  };

  const handleAddCustomMaterial = () => {
    const newIdx = materialAllocations.length + 1;
    setMaterialAllocations(prev => [
      ...prev,
      {
        id: `custom_${Date.now()}`,
        partCode: `CUSTOM-SUB-${newIdx}`,
        partDescription: `Custom Substrate Component #${newIdx}`,
        grnTotalQty: 500,
        alreadyAllocatedQty: 0,
        availableQty: 500,
        allocatedQty: 250,
        color: 'Monza Red Gloss'
      }
    ]);
  };

  const handleRemoveMaterialAllocation = (id: string) => {
    setMaterialAllocations(prev => prev.filter(m => m.id !== id));
  };

  // Calculated SLA Target Deadline
  const calculatedDeadline = useMemo(() => {
    try {
      const d = issueDate ? new Date(issueDate) : new Date();
      if (issueTime) {
        const timeParts = issueTime.replace(/[^\d:]/g, '').split(':');
        if (timeParts.length >= 2) {
          let h = parseInt(timeParts[0], 10);
          const m = parseInt(timeParts[1], 10);
          if (issueTime.toLowerCase().includes('pm') && h < 12) h += 12;
          if (issueTime.toLowerCase().includes('am') && h === 12) h = 0;
          d.setHours(h, m, 0, 0);
        }
      }
      const deadline = new Date(d.getTime() + (slaHours * 60 * 60 * 1000));
      return deadline.toISOString();
    } catch {
      return new Date(Date.now() + slaHours * 3600000).toISOString();
    }
  }, [issueDate, issueTime, slaHours]);

  const formattedDeadlinePreview = useMemo(() => {
    try {
      const d = new Date(calculatedDeadline);
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' (' + d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ')';
    } catch {
      return `${slaHours} Hours from start`;
    }
  }, [calculatedDeadline, slaHours]);

  // FINAL PROCESS
  const [returnMaterialDesc] = useState<string>(initialData?.returnMaterialDesc || 'Unused Basecoat Paint');
  const [returnPainterName] = useState<string>(initialData?.returnPainterName || 'Ramesh Sharma');
  const [returnDate] = useState<string>(initialData?.returnDate || '');
  const [returnTime] = useState<string>(initialData?.returnTime || '');
  const [returnOkQty] = useState<number>(initialData?.returnOkQty || 0);
  const [returnRejectionQty] = useState<number>(initialData?.returnRejectionQty || 0);
  const [checkingPerson] = useState<string>(initialData?.checkingPerson || 'Amit Verma (QA Lead)');

  // ISSUE MATERIAL DETAILS TABLE (Internal chemicals / raw components)
  const [issuedMaterials, setIssuedMaterials] = useState<IssuedMaterialItem[]>(
    initialData?.issuedMaterials && initialData.issuedMaterials.length > 0 
      ? initialData.issuedMaterials
      : []
  );

  // Synchronize issuedMaterials whenever materialAllocations change
  useEffect(() => {
    if (materialAllocations.length === 0) return;

    const activeAllocations = materialAllocations.filter(m => m.allocatedQty > 0);
    if (activeAllocations.length === 0) return;

    // 1. Substrate rows for each active part with its specific color
    const substrateRows: IssuedMaterialItem[] = activeAllocations.map((m, idx) => ({
      id: `sub_${idx + 1}`,
      itemDescription: `${m.partDescription} (${m.partCode})`,
      qty: m.allocatedQty,
      colour: m.color,
      uom: 'Pcs',
      remark: `Allocated from GRN: ${selectedGrn?.grnNo || 'PK-GRN'}`
    }));

    // 2. Distinct paint colors needed for this batch
    const uniqueColors = Array.from(new Set(activeAllocations.map(m => m.color).filter(Boolean)));
    const paintRows: IssuedMaterialItem[] = uniqueColors.map((color, idx) => {
      const colorPieces = activeAllocations.filter(m => m.color === color).reduce((s, m) => s + m.allocatedQty, 0);
      const estLitres = Math.max(1, Math.ceil((colorPieces / 500) * 8));
      return {
        id: `pnt_${idx + 1}`,
        itemDescription: `${color} 2K PU Basecoat Paint (PPG)`,
        qty: estLitres,
        colour: color,
        uom: 'Litres',
        remark: 'Mix ratio 4:1:1'
      };
    });

    // 3. Solvents and clearcoat
    const commonSolvents: IssuedMaterialItem[] = [
      {
        id: 'solv_1',
        itemDescription: 'PU Thinner 400 Solvent',
        qty: Math.max(2, Math.ceil(uniqueColors.length * 2)),
        colour: 'Clear',
        uom: 'Litres',
        remark: 'Viscosity control solvent'
      },
      {
        id: 'solv_2',
        itemDescription: '2K Scratch-Resistant Clear Coat & Hardener',
        qty: Math.max(2, Math.ceil(totalAllocatedTargetQty / 200)),
        colour: 'Clear',
        uom: 'Litres',
        remark: 'Final protective gloss'
      }
    ];

    setIssuedMaterials([...substrateRows, ...paintRows, ...commonSolvents]);
  }, [materialAllocations, selectedGrn, totalAllocatedTargetQty]);

  // SIGNATURES
  const [storeIncharge] = useState<string>(initialData?.storeIncharge || currentUser.name || 'Manoj Tiwari');
  const [prodSupervisor] = useState<string>(initialData?.prodSupervisor || 'Vikram Patel');
  const [approvedBy] = useState<string>(initialData?.approvedBy || 'Satish Sharma');

  // 3-STAGE PRODUCTION PROCESS (For Existing Cards)
  const [firstStage, setFirstStage] = useState({ totalQty: initialData?.stageProcessFirst?.totalQty || 250, okQty: initialData?.stageProcessFirst?.okQty || 245, rejectionQty: initialData?.stageProcessFirst?.rejectionQty || 5 });
  const [secondStage, setSecondStage] = useState({ totalQty: initialData?.stageProcessSecond?.totalQty || 245, okQty: initialData?.stageProcessSecond?.okQty || 240, rejectionQty: initialData?.stageProcessSecond?.rejectionQty || 5 });
  const [thirdStage, setThirdStage] = useState({ totalQty: initialData?.stageProcessThird?.totalQty || 240, okQty: initialData?.stageProcessThird?.okQty || 238, rejectionQty: initialData?.stageProcessThird?.rejectionQty || 2 });
  const [stageRemark] = useState<string>(initialData?.stageRemark || 'Final lacquer cured at 80°C for 45 mins.');

  const [preparedBy] = useState<string>(initialData?.preparedBy || 'Manoj Tiwari (Stores)');
  const [checkedBy] = useState<string>(initialData?.checkedBy || 'Vikram Patel (Supervisor)');
  const [stageApprovedBy] = useState<string>(initialData?.stageApprovedBy || 'Satish Sharma (Plant Head)');

  // Sync initialData when modal opens
  useEffect(() => {
    if (initialData && isOpen) {
      if (initialData.customer) setCustomer(initialData.customer);
      if (initialData.partCode) setPartCode(initialData.partCode);
      if (initialData.targetQty) setTargetQty(initialData.targetQty);
      if (initialData.color) setBatchColor(initialData.color);
      if (initialData.woNo) setWNo(initialData.woNo);
      if (initialData.slaHours) setSlaHours(initialData.slaHours);
      if (initialData.sourceGrnNo) setSelectedGrnNo(initialData.sourceGrnNo);
      else if ((initialData as any).sourceGrnNo) setSelectedGrnNo((initialData as any).sourceGrnNo);
      else if ((initialData as any).grnNo) setSelectedGrnNo((initialData as any).grnNo);
      else if (initialData.woNo) {
        const match = grnList.find(g => g.invoiceChallanNo === initialData.woNo || g.grnNo === initialData.woNo);
        if (match) setSelectedGrnNo(match.grnNo);
      }
      if (initialData.issuedMaterials && initialData.issuedMaterials.length > 0) {
        setIssuedMaterials(initialData.issuedMaterials);
      }
      if (initialData.progressLogs) {
        setLiveProgressLogs(initialData.progressLogs);
      }
      if (initialData.sprayedQty !== undefined) setCurrentSprayedQty(initialData.sprayedQty);
      if (initialData.goodQty !== undefined) setCurrentGoodQty(initialData.goodQty);
      if (initialData.rejectQty !== undefined) setCurrentRejectQty(initialData.rejectQty);
    }
  }, [initialData, isOpen, grnList]);

  const handleAddMaterialRow = () => {
    const newId = String(issuedMaterials.length + 1);
    setIssuedMaterials([
      ...issuedMaterials,
      {
        id: newId,
        itemDescription: '',
        qty: 1,
        colour: '',
        uom: 'Litres',
        remark: ''
      }
    ]);
  };

  const handleRemoveMaterialRow = (id: string) => {
    setIssuedMaterials(issuedMaterials.filter(m => m.id !== id));
  };

  const handleUpdateMaterial = (id: string, field: keyof IssuedMaterialItem, val: any) => {
    setIssuedMaterials(prev => prev.map(item => {
      if (item.id !== id) return item;
      return { ...item, [field]: val };
    }));
  };

  // Add Live Progress Log (For Running Job Card)
  const handleAddLiveProgressLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (logPiecesCount <= 0) return;

    const now = new Date();
    const newEntry: JobCardProductionProgressLog = {
      id: `LOG-${Date.now()}`,
      timestamp: now.toISOString(),
      timeLabel: logTimeInput || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dateLabel: now.toISOString().split('T')[0],
      piecesCompleted: Number(logPiecesCount),
      cumulativeGoodQty: currentGoodQty + Number(logPiecesCount) - Number(logReworkCount) - Number(logScrapCount),
      reworkPieces: Number(logReworkCount),
      scrapPieces: Number(logScrapCount),
      painterName: painterName,
      boothNo: dept.split('(')[0]?.trim() || 'Booth #1',
      recordedBy: currentUser.name,
      remarks: logRemarksInput
    };

    setLiveProgressLogs(prev => [newEntry, ...prev]);
    setCurrentSprayedQty(prev => prev + Number(logPiecesCount));
    setCurrentGoodQty(prev => prev + Math.max(0, Number(logPiecesCount) - Number(logReworkCount) - Number(logScrapCount)));
    setCurrentRejectQty(prev => prev + Number(logReworkCount) + Number(logScrapCount));

    if (initialData?.jobCardNo) {
      addJobCardProgressLog(initialData.jobCardNo, {
        timeLabel: newEntry.timeLabel,
        dateLabel: newEntry.dateLabel,
        piecesCompleted: newEntry.piecesCompleted,
        cumulativeGoodQty: newEntry.cumulativeGoodQty,
        reworkPieces: newEntry.reworkPieces,
        scrapPieces: newEntry.scrapPieces,
        painterName: newEntry.painterName,
        boothNo: newEntry.boothNo,
        recordedBy: newEntry.recordedBy,
        remarks: newEntry.remarks
      });
    }

    setShowProgressLogger(false);
    setLogRemarksInput('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (hasOverAllocation) {
      alert(`Validation Error: One or more materials exceed the available GRN balance. Please reduce the allocated quantity.`);
      return;
    }

    if (totalAllocatedTargetQty <= 0) {
      alert("Validation Error: Please allocate at least 1 piece to a material before launching the Job Card.");
      return;
    }

    const isEditMode = Boolean(initialData?.jobCardNo);

    // Compute summary fields
    const activeMaterials = materialAllocations.filter(m => m.allocatedQty > 0);
    const summaryPartCode = activeMaterials.map(m => m.partCode).join(', ') || partCode;
    const summaryDescription = activeMaterials.map(m => `${m.partDescription} (${m.allocatedQty} Pcs)`).join(' + ') || 'Raw Part Substrate';
    const summaryColor = activeMaterials.map(m => `${m.partCode}: ${m.color}`).join(' | ') || batchColor;

    const newJobCard: JobCard = {
      docNo,
      revNo,
      revDate,
      jobCardNo,
      woNo: wNo,
      sourceGrnNo: selectedGrn?.grnNo || selectedGrnNo,
      customer,
      partCode: summaryPartCode,
      partDescription: summaryDescription,
      model: initialData?.model || 'OEM Batch',
      color: summaryColor,
      targetQty: totalAllocatedTargetQty,
      sprayedQty: currentSprayedQty,
      goodQty: currentGoodQty,
      rejectQty: currentRejectQty,
      status: initialData?.status || 'Open',
      fpaStatus: initialData?.fpaStatus || 'Approved',

      jobCardNature: 'STANDARD_PRODUCTION',
      progressLogs: liveProgressLogs,
      materialAllocations: materialAllocations,

      painterName,
      assignedPainterName: painterName,
      assignedPainterId: assignedPainterId,
      painterJobStatus: 'Assigned',
      allocatedQty: totalAllocatedTargetQty,
      wNo,
      issueDate,
      issueTime,
      leadTime: `${slaHours} Hours`,
      slaHours: slaHours,
      slaDeadline: calculatedDeadline,
      isSlaBreached: false,
      dept,

      returnMaterialDesc,
      returnPainterName,
      returnDate,
      returnTime,
      returnOkQty,
      returnRejectionQty,
      checkingPerson,
      headerRemark,

      issuedMaterials,

      storeIncharge,
      prodSupervisor,
      approvedBy,

      stageProcessFirst: firstStage,
      stageProcessSecond: secondStage,
      stageProcessThird: thirdStage,
      stageRemark,
      preparedBy,
      checkedBy,
      stageApprovedBy
    };

    if (isEditMode) {
      updateJobCard(newJobCard);
    } else if (isMultiPainterSplit) {
      createMultiPainterJobCards(newJobCard, painterSplits);
    } else {
      addJobCard(newJobCard);
    }

    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-[24px] max-w-4xl w-full p-4 sm:p-7 shadow-2xl border border-[#ececec] space-y-5 max-h-[94vh] overflow-y-auto no-scrollbar print:max-w-none print:w-full print:p-0 print:shadow-none animate-in zoom-in-95 duration-150 relative">
        
        {/* Top Header & View Toggle (Hidden on print) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3.5 border-b border-[#ececec] print:hidden">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10px] font-mono font-bold uppercase tracking-wider">
                {isExistingCard ? 'ACTIVE PRODUCTION TRACKER' : 'NEW MASTER JOB CARD (FORMAT C.01)'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#777b86] text-[10px] font-mono font-bold">
                {docNo} • {revNo}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#777b86] text-[10px] font-mono">
                Plant: {activePlant}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif text-[#17191c] font-normal tracking-tight">
              {isExistingCard ? `Job Card Floor Tracker • ${jobCardNo}` : 'Create Production Master Job Card'}
            </h2>
            <p className="text-[11px] sm:text-xs text-[#777b86]">
              {isExistingCard 
                ? 'Track live floor output pieces, record hourly production logs, and update quality milestones'
                : 'Allocate customer substrates, assign individual colors per material, and requisition required paints & chemicals'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* View Switcher Toggle */}
            <div className="flex items-center p-1 rounded-full bg-[#fafafb] border border-[#ececec] text-xs">
              <button
                type="button"
                onClick={() => setViewMode('PORTAL')}
                className={`px-3 py-1 rounded-full font-bold transition cursor-pointer ${
                  viewMode === 'PORTAL' ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]' : 'text-[#777b86]'
                }`}
              >
                Form View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('PRINT')}
                className={`px-3 py-1 rounded-full font-bold transition cursor-pointer ${
                  viewMode === 'PRINT' ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]' : 'text-[#777b86]'
                }`}
              >
                Print Sheet
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] cursor-pointer transition active:scale-95 shadow-2xs"
              title="Print Job Sheet"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#fafafb] hover:bg-[#f2f2f3] text-[#777b86] hover:text-[#17191c] border border-[#ececec] flex items-center justify-center cursor-pointer transition active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          
          {/* ========================================================================= */}
          {/* MODE 1: MODERN EDITORIAL INDUSTRIAL PORTAL VIEW */}
          {/* ========================================================================= */}
          {viewMode === 'PORTAL' && (
            <div className="space-y-5 text-xs">

              {/* ========================================================================= */}
              {/* LIVE PRODUCTION PROGRESS TRACKER (ONLY FOR RUNNING / EXISTING JOB CARDS)   */}
              {/* ========================================================================= */}
              {isExistingCard && (
                <div className="bg-white p-4.5 sm:p-5 rounded-[22px] border border-[#ececec] shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ececec]">
                    <div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#c09748]" />
                        <span className="text-[10px] font-bold text-[#c09748] uppercase tracking-wider font-mono">
                          Real-time Production Progress & Time Tracking
                        </span>
                      </div>
                      <h3 className="font-serif font-normal text-lg sm:text-xl text-[#17191c] mt-0.5">
                        Floor Output Execution Status
                      </h3>
                      <p className="text-[11px] text-[#777b86]">
                        Kitne pieces assign kiye gaye the, kitne complete hue hain aur kitne baje tak hue the—sab yahan live track hota hai.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowProgressLogger(!showProgressLogger)}
                      className="px-4 py-2 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs self-start sm:self-auto active:scale-95"
                    >
                      <Plus className="w-4 h-4 text-[#8a6521]" />
                      <span>{showProgressLogger ? 'Hide Progress Drawer' : '+ Log Pieces Output'}</span>
                    </button>
                  </div>

                  {/* 4 Stat Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-[#fafafb] p-3 rounded-[16px] border border-[#ececec] space-y-1">
                      <span className="text-[9.5px] font-mono uppercase text-[#777b86] block">Total Target</span>
                      <div className="font-mono text-xl sm:text-2xl font-bold text-[#17191c]">
                        {targetQty.toLocaleString('en-IN')} <span className="text-xs font-normal text-[#777b86]">Pcs</span>
                      </div>
                      <div className="text-[10px] text-[#777b86] font-mono">Assigned to {painterName}</div>
                    </div>

                    <div className="bg-emerald-50/70 p-3 rounded-[16px] border border-emerald-200 space-y-1">
                      <span className="text-[9.5px] font-mono uppercase text-emerald-800 font-bold block flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Good Finished (Passed)
                      </span>
                      <div className="font-mono text-xl sm:text-2xl font-bold text-emerald-900">
                        {currentGoodQty.toLocaleString('en-IN')} <span className="text-xs font-normal text-emerald-700">Pcs</span>
                      </div>
                      <div className="text-[10px] text-emerald-800 font-semibold">
                        {targetQty > 0 ? ((currentGoodQty / targetQty) * 100).toFixed(0) : 0}% Target Fulfilled
                      </div>
                    </div>

                    <div className="bg-amber-50/70 p-3 rounded-[16px] border border-amber-200 space-y-1">
                      <span className="text-[9.5px] font-mono uppercase text-amber-800 font-bold block flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Remaining to Spray
                      </span>
                      <div className="font-mono text-xl sm:text-2xl font-bold text-amber-900">
                        {Math.max(0, targetQty - currentGoodQty).toLocaleString('en-IN')} <span className="text-xs font-normal text-amber-700">Pcs</span>
                      </div>
                      <div className="text-[10px] text-amber-800">Pending on Line</div>
                    </div>

                    <div className="bg-red-50/70 p-3 rounded-[16px] border border-red-200 space-y-1">
                      <span className="text-[9.5px] font-mono uppercase text-red-800 font-bold block flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-red-600" />
                        Floor Rejection
                      </span>
                      <div className="font-mono text-xl sm:text-2xl font-bold text-red-900">
                        {currentRejectQty.toLocaleString('en-IN')} <span className="text-xs font-normal text-red-700">Pcs</span>
                      </div>
                      <div className="text-[10px] text-red-800">
                        {targetQty > 0 ? ((currentRejectQty / targetQty) * 100).toFixed(1) : 0}% Defect Rate
                      </div>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-[#777b86]">Floor Production Completion</span>
                      <span className="font-bold text-[#17191c]">
                        {currentGoodQty} / {targetQty} Pcs ({targetQty > 0 ? ((currentGoodQty / targetQty) * 100).toFixed(0) : 0}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-[#f2f2f3] rounded-full overflow-hidden flex border border-[#ececec]">
                      <div 
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${Math.min(100, targetQty > 0 ? (currentGoodQty / targetQty) * 100 : 0)}%` }}
                        title="Good Finished"
                      />
                      <div 
                        className="bg-red-400 h-full transition-all duration-300"
                        style={{ width: `${Math.min(100, targetQty > 0 ? (currentRejectQty / targetQty) * 100 : 0)}%` }}
                        title="Rejections"
                      />
                    </div>
                  </div>

                  {/* Interactive Hourly / Batch Output Logger Drawer */}
                  {showProgressLogger && (
                    <div className="bg-[#faf7ed] p-4 rounded-[18px] border border-[#f4e5be] space-y-3 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-[#8a6521]" />
                          <span className="font-mono font-bold text-xs text-[#8a6521] uppercase tracking-wide">
                            Log Production Pieces Update (Hourly Output)
                          </span>
                        </div>
                        <span className="text-[10.5px] text-[#777b86] font-mono">
                          Operator: {currentUser.name} • Plant: {activePlant}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1 font-mono">
                            Pieces Finished Now *
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={Math.max(1, targetQty - currentGoodQty)}
                            value={logPiecesCount}
                            onChange={e => setLogPiecesCount(Number(e.target.value))}
                            className="w-full h-9 px-3 rounded-[12px] border border-[#dcdfe4] bg-white font-mono font-bold text-[#17191c]"
                            placeholder="e.g. 50"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1 font-mono">
                            Time Completed *
                          </label>
                          <input
                            type="text"
                            value={logTimeInput}
                            onChange={e => setLogTimeInput(e.target.value)}
                            className="w-full h-9 px-3 rounded-[12px] border border-[#dcdfe4] bg-white font-mono text-[#17191c]"
                            placeholder="e.g. 02:45 PM"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1 font-mono">
                            Rejection / Scrap Count
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={logScrapCount}
                            onChange={e => setLogScrapCount(Number(e.target.value))}
                            className="w-full h-9 px-3 rounded-[12px] border border-[#dcdfe4] bg-white font-mono text-red-600"
                            placeholder="0"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1 font-mono">
                            Supervisor Floor Remarks
                          </label>
                          <input
                            type="text"
                            value={logRemarksInput}
                            onChange={e => setLogRemarksInput(e.target.value)}
                            className="w-full h-9 px-3 rounded-[12px] border border-[#dcdfe4] bg-white text-[#17191c]"
                            placeholder="e.g. Oven baked, cleared IQC inspection"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowProgressLogger(false)}
                          className="px-4 py-1.5 rounded-full bg-white border border-[#ececec] text-[#777b86] text-xs font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleAddLiveProgressLog}
                          className="px-5 py-1.5 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#8a6521]" />
                          <span>Record {logPiecesCount} Pcs Output</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Hourly Audit Log History Timeline */}
                  {liveProgressLogs.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-[#ececec]">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-[#777b86] uppercase font-mono">
                        <History className="w-3.5 h-3.5 text-[#c09748]" />
                        <span>Logged Output Audit History ({liveProgressLogs.length} Entries):</span>
                      </div>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar">
                        {liveProgressLogs.map((log) => (
                          <div key={log.id} className="p-2.5 rounded-[12px] bg-[#fafafb] border border-[#ececec] flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-[#ececec] text-[#8a6521]">
                                {log.timeLabel}
                              </span>
                              <span className="font-semibold text-[#17191c]">
                                +{log.piecesCompleted} Pcs Produced
                              </span>
                              <span className="text-[#777b86] text-[11px]">
                                (Total Good: <strong className="text-emerald-800">{log.cumulativeGoodQty}</strong>)
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-[#777b86]">By {log.recordedBy || 'Supervisor'}</span>
                              {log.remarks && (
                                <div className="text-[10px] text-gray-500 italic truncate max-w-xs">{log.remarks}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================================= */}
              {/* STEP 1: SUBSTRATE & CUSTOMER ORDER ALLOCATION                             */}
              {/* ========================================================================= */}
              <div className="bg-[#fafafb] p-4.5 sm:p-5 rounded-[22px] border border-[#ececec] space-y-4 shadow-2xs">
                {/* Header Strip with Customer Name & Job Card Badges */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#ececec] pb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold text-[#c09748] uppercase tracking-wider font-mono flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-[#c09748]" />
                        Step 1: Substrate & Customer Order Allocation
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-serif text-[#17191c] font-normal flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#c09748]" />
                      <span>{customer || 'Roop Polymers Ltd'}</span>
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="font-mono text-xs font-bold text-[#8a6521] px-3 py-1 rounded-full bg-[#faf3e0] border border-[#f4e5be] shadow-2xs">
                      {jobCardNo}
                    </span>
                    <span className="font-mono text-xs text-[#777b86] font-semibold px-2.5 py-1 rounded-full bg-white border border-[#ececec]">
                      Challan: {wNo}
                    </span>
                  </div>
                </div>

                {/* Inward GRN Lot & Customer Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Source GRN Lot Selector */}
                  <div className="space-y-1 sm:col-span-1">
                    <label className="block text-[10px] font-bold text-[#8a6521] uppercase font-mono">
                      Select Inward Store GRN Lot *
                    </label>
                    <select
                      value={selectedGrn?.grnNo || selectedGrnNo}
                      onChange={e => {
                        const newGrnNo = e.target.value;
                        setSelectedGrnNo(newGrnNo);
                        const found = grnList.find(g => g.grnNo === newGrnNo);
                        if (found) {
                          if (found.supplierCustomer) setCustomer(found.supplierCustomer);
                          if (found.invoiceChallanNo) setWNo(found.invoiceChallanNo);
                        }
                      }}
                      className="w-full h-9.5 px-3 rounded-[14px] border border-[#c09748]/50 bg-white font-mono font-bold text-xs text-[#17191c] focus:border-[#c09748] focus:outline-none shadow-2xs cursor-pointer"
                    >
                      {availableGrnLots.map(g => (
                        <option key={g.grnNo} value={g.grnNo}>
                          {g.grnNo} • {g.supplierCustomer} ({g.items?.length || 1} Materials)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Customer Account */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#777b86] uppercase font-mono">
                      Customer Account *
                    </label>
                    <input
                      type="text"
                      required
                      value={customer}
                      onChange={e => setCustomer(e.target.value)}
                      className="w-full h-9.5 px-3 rounded-[14px] border border-[#dcdfe4] bg-white font-semibold text-xs text-[#17191c] focus:border-[#c09748] focus:outline-none"
                    />
                  </div>

                  {/* Work Order / Challan Ref */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#777b86] uppercase font-mono">
                      Work Order / Challan Ref *
                    </label>
                    <input
                      type="text"
                      required
                      value={wNo}
                      onChange={e => setWNo(e.target.value)}
                      className="w-full h-9.5 px-3 rounded-[14px] border border-[#dcdfe4] bg-white font-mono font-bold text-xs text-[#17191c] focus:border-[#c09748] focus:outline-none"
                    />
                  </div>
                </div>

                {/* GRN Materials & Substrates List with Individual Color and Target Allocation */}
                <div className="space-y-3 pt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-[11px] font-bold text-[#8a6521] uppercase font-mono flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#8a6521]" />
                        <span>Materials & Substrates Inward in this GRN ({materialAllocations.length} Items):</span>
                      </div>
                      <p className="text-[11px] text-[#777b86]">
                        Har material ke liye pieces assign karein aur uska specific color/finish shade select karein.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddCustomMaterial}
                      className="px-3 py-1 rounded-full bg-white hover:bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs self-start sm:self-auto active:scale-95"
                    >
                      <Plus className="w-3 h-3 text-[#8a6521]" />
                      <span>+ Add Material Row</span>
                    </button>
                  </div>

                  {/* Over-allocation alert if any material exceeds available balance */}
                  {hasOverAllocation && (
                    <div className="p-3 rounded-[14px] bg-red-50 border border-red-300 text-red-800 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>
                        <strong>Quantity Over-Allocation Warning:</strong> Ek ya usse zyada materials store balance se zyada dali gayi hain: {overAllocatedItems.map(o => `${o.partCode} (${o.allocatedQty}/${o.availableQty})`).join(', ')}. Please adjust.
                      </span>
                    </div>
                  )}

                  {/* Material Items List */}
                  <div className="space-y-3">
                    {materialAllocations.map((mat, mIdx) => {
                      const isItemOver = mat.allocatedQty > mat.availableQty;
                      const isAllocated = mat.allocatedQty > 0;

                      return (
                        <div 
                          key={mat.id}
                          className={`p-3.5 sm:p-4 rounded-[18px] border transition shadow-2xs space-y-3 ${
                            isAllocated 
                              ? 'bg-white border-[#f4e5be] ring-1 ring-[#c09748]/20' 
                              : 'bg-[#fafafb] border-[#ececec] opacity-75'
                          }`}
                        >
                          {/* Top row of Item: Part code, description, and GRN balance pills */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#ececec]">
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] flex items-center justify-center font-bold font-mono text-[11px]">
                                {mIdx + 1}
                              </span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-xs text-[#8a6521]">{mat.partCode}</span>
                                  <span className="font-bold text-xs text-[#17191c]">{mat.partDescription}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-[10.5px] font-mono">
                              <span className="px-2 py-0.5 rounded-md bg-[#fafafb] border border-[#ececec] text-[#777b86]">
                                GRN Inward: <strong className="text-[#17191c]">{mat.grnTotalQty.toLocaleString('en-IN')} Pcs</strong>
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-[#fafafb] border border-[#ececec] text-[#777b86]">
                                Already in JC: <strong className="text-blue-800">{mat.alreadyAllocatedQty.toLocaleString('en-IN')} Pcs</strong>
                              </span>
                              <span className={`px-2 py-0.5 rounded-md border font-bold ${
                                mat.availableQty > 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
                              }`}>
                                Available: {mat.availableQty.toLocaleString('en-IN')} Pcs
                              </span>
                              {materialAllocations.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMaterialAllocation(mat.id)}
                                  className="text-gray-400 hover:text-red-600 transition cursor-pointer p-1"
                                  title="Remove this material"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Inputs: Target Qty AND Finish/Color Shade for THIS material */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                            {/* Field 1: Target Qty for this material */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="block text-[10px] font-bold text-[#17191c] uppercase font-mono">
                                  Target Quantity for {mat.partCode} (Pcs) *
                                </label>
                                <span className="text-[10px] text-[#777b86]">
                                  Max allowed: <strong className="text-[#8a6521] font-mono">{mat.availableQty} Pcs</strong>
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max={mat.availableQty > 0 ? mat.availableQty : undefined}
                                  value={mat.allocatedQty}
                                  onChange={e => handleUpdateMaterialQty(mat.id, Number(e.target.value))}
                                  className={`w-28 h-9 px-3 rounded-[12px] border font-mono font-bold text-xs bg-white focus:outline-none transition ${
                                    isItemOver 
                                      ? 'border-red-500 text-red-600 ring-2 ring-red-100' 
                                      : 'border-[#dcdfe4] text-[#17191c] focus:border-[#c09748]'
                                  }`}
                                />

                                {mat.availableQty > 0 && mat.allocatedQty !== mat.availableQty && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateMaterialQty(mat.id, mat.availableQty)}
                                    className="px-2.5 py-1.5 rounded-[10px] bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-[10.5px] font-bold transition cursor-pointer active:scale-95"
                                    title="Allocate all remaining balance"
                                  >
                                    ⚡ All ({mat.availableQty})
                                  </button>
                                )}

                                {mat.availableQty >= 2 && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateMaterialQty(mat.id, Math.floor(mat.availableQty / 2))}
                                    className="px-2.5 py-1.5 rounded-[10px] bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-[10.5px] font-semibold transition cursor-pointer active:scale-95"
                                    title="Split 50%"
                                  >
                                    ½ 50% ({Math.floor(mat.availableQty / 2)})
                                  </button>
                                )}

                                {mat.allocatedQty > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateMaterialQty(mat.id, 0)}
                                    className="px-2 py-1.5 rounded-[10px] bg-white hover:bg-gray-100 text-gray-500 border border-gray-200 text-[10px] transition cursor-pointer"
                                    title="Set to 0 (Don't run in this batch)"
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Field 2: Target Finish / Color for THIS material */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-bold text-[#8a6521] uppercase font-mono">
                                Finish / Color Shade for {mat.partCode} *
                              </label>
                              <input
                                type="text"
                                required={mat.allocatedQty > 0}
                                value={mat.color}
                                onChange={e => handleUpdateMaterialColor(mat.id, e.target.value)}
                                placeholder="e.g. Monza Red Gloss / Piano Black"
                                className="w-full h-9 px-3 rounded-[12px] border border-[#dcdfe4] bg-white font-semibold text-xs text-[#17191c] focus:border-[#c09748] focus:outline-none"
                              />

                              {/* Preset Color Chips for this specific material */}
                              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                {colorPresets.map((preset, pIdx) => (
                                  <button
                                    key={pIdx}
                                    type="button"
                                    onClick={() => handleUpdateMaterialColor(mat.id, preset.name)}
                                    className={`px-2 py-0.5 rounded-full text-[9.5px] font-medium transition cursor-pointer flex items-center gap-1 ${preset.bg} ${preset.text} ${
                                      mat.color === preset.name ? 'ring-2 ring-[#c09748] font-bold' : ''
                                    }`}
                                  >
                                    <span>{preset.name}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Batch Summary Bar */}
                  <div className="p-3.5 bg-white rounded-[16px] border border-[#f4e5be] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-mono font-bold text-[#8a6521]">
                        Job Card Batch Summary:
                      </span>
                      <span className="font-mono font-bold text-sm text-[#17191c]">
                        {totalAllocatedTargetQty.toLocaleString('en-IN')} Pcs Total
                      </span>
                      <span className="text-[10.5px] text-[#777b86]">
                        ({materialAllocations.filter(m => m.allocatedQty > 0).length} Materials Allocated)
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {materialAllocations.filter(m => m.allocatedQty > 0).map(m => (
                        <span key={m.id} className="px-2.5 py-1 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] font-mono text-[10px] font-bold">
                          {m.partCode}: {m.allocatedQty} Pcs ({m.color})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* STEP 2: FINISH SPECIFICATION, LINE & PAINTER ASSIGNMENT                   */}
              {/* ========================================================================= */}
              <div className="bg-[#fafafb] p-4.5 sm:p-5 rounded-[22px] border border-[#ececec] space-y-4 shadow-2xs">
                <div className="border-b border-[#ececec] pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-[#c09748] uppercase tracking-wider font-mono">
                    Step 2: Line Assignment, Painter & SLA Target Duration
                  </span>
                  <div className="flex items-center gap-2 text-[10.5px] text-[#777b86]">
                    <span>Batch Scope: </span>
                    <strong className="text-[#17191c] font-mono">{totalAllocatedTargetQty} Pcs Total</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Painting Line / Booth */}
                  <div className="space-y-1.5">
                    <label className="block text-[10.5px] font-bold text-[#777b86] uppercase font-mono">
                      Department / Painting Line *
                    </label>
                    <select
                      value={dept}
                      onChange={e => setDept(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-[14px] border border-[#dcdfe4] bg-white font-semibold text-xs text-[#17191c] focus:border-[#c09748] focus:outline-none cursor-pointer shadow-2xs"
                    >
                      <option value="Booth #1 (Continuous Conveyor Line)">Booth #1 (Continuous Conveyor Line)</option>
                      <option value="Booth #2 (Dust-Free Pressurized Cleanroom)">Booth #2 (Dust-Free Pressurized Cleanroom)</option>
                      <option value="Booth #3 (Hydrographic Immersion & Dipping)">Booth #3 (Hydrographic Immersion & Dipping)</option>
                      <option value="Booth #4 (Flatbed Industrial Direct UV Plotter)">Booth #4 (Flatbed Industrial Direct UV Plotter)</option>
                    </select>
                    <div className="text-[10px] text-[#777b86]">
                      Target Floor: <strong>{dept.split('(')[0]}</strong>
                    </div>
                  </div>

                  {/* Assign Painter */}
                  <div className="space-y-1.5">
                    <label className="block text-[10.5px] font-bold text-[#777b86] uppercase font-mono">
                      Assign Floor Painter (Max 2 Jobs) *
                    </label>
                    <select
                      required
                      value={painterName}
                      onChange={e => {
                        const selectedP = painters.find(p => p.name === e.target.value);
                        setPainterName(e.target.value);
                        if (selectedP) setAssignedPainterId(selectedP.id);
                      }}
                      className="w-full h-10 px-3.5 rounded-[14px] border border-[#dcdfe4] bg-white font-semibold text-xs text-[#17191c] focus:border-[#c09748] focus:outline-none cursor-pointer shadow-2xs"
                    >
                      {painters.map(p => {
                        const count = getPainterActiveJobCount ? getPainterActiveJobCount(p.id) : 0;
                        const isCap = count >= 2;
                        return (
                          <option key={p.id} value={p.name}>
                            {p.name} ({count}/2 Jobs){isCap ? ' - ⚠️ CAP REACHED' : ' - Available'} • {p.boothNo}
                          </option>
                        );
                      })}
                    </select>
                    <div className="text-[10px] text-[#777b86] font-mono">
                      Assigned Booth: {painters.find(p => p.name === painterName)?.boothNo || 'Booth #1'}
                    </div>
                  </div>
                </div>

                {/* SLA Target Duration & Deadline */}
                <div className="p-3.5 bg-white rounded-[16px] border border-[#f4e5be] space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="block text-[10.5px] font-bold text-[#8a6521] uppercase font-mono flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#8a6521]" />
                        <span>Target SLA Completion Duration (Time Limit to Finish Job) *</span>
                      </label>
                      <p className="text-[11px] text-[#777b86]">
                        Time limit for painter. Job finish hone ke baad ye direct <strong>Packing & Quality Inspection</strong> stage me transfer hoga.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="72"
                        required
                        value={slaHours}
                        onChange={e => setSlaHours(Math.max(1, Number(e.target.value)))}
                        className="w-20 h-9 px-2.5 rounded-[12px] border border-[#c09748] bg-[#faf7ed] font-mono font-bold text-xs text-[#17191c] text-center focus:outline-none"
                      />
                      <span className="font-mono text-xs text-[#8a6521] font-bold">Hours</span>
                    </div>
                  </div>

                  {/* Preset SLA Duration Chips */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#ececec]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        { hours: 2, label: '⏱️ 2h (Rush Batch)' },
                        { hours: 4, label: '⏱️ 4h (Standard)' },
                        { hours: 6, label: '⏱️ 6h (Multi-Coat)' },
                        { hours: 8, label: '⏱️ 8h (1 Full Shift)' },
                        { hours: 24, label: '⏱️ 24h (Next Day)' }
                      ].map(preset => (
                        <button
                          key={preset.hours}
                          type="button"
                          onClick={() => setSlaHours(preset.hours)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition cursor-pointer ${
                            slaHours === preset.hours
                              ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] font-bold shadow-2xs'
                              : 'bg-[#fafafb] text-[#777b86] border border-[#ececec] hover:bg-gray-100'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-[10.5px] font-mono font-bold">
                      <span>🎯 Target Deadline:</span>
                      <strong className="text-emerald-800">{formattedDeadlinePreview}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* STEP 3: STORE CHEMICAL & PAINT REQUISITION (MRN)                          */}
              {/* ========================================================================= */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#ececec] pb-2">
                  <div>
                    <span className="text-[11px] font-bold text-[#c09748] uppercase tracking-wider font-mono">
                      Step 3: Internal Material Requirements (Paints, Thinners & Chemicals)
                    </span>
                    <p className="text-xs text-[#777b86]">
                      Store will issue these chemicals against this Job Card via Material Issue Note (MIN)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddMaterialRow}
                    className="px-3.5 py-1.5 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs self-start sm:self-auto active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#8a6521]" />
                    <span>+ Add Chemical / Material Row</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {issuedMaterials.map((mat, idx) => (
                    <div key={mat.id || idx} className="bg-[#fafafb] p-3.5 sm:p-4 rounded-[18px] border border-[#ececec] space-y-2 relative group hover:border-[#c09748]/50 transition shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] flex items-center justify-center font-bold text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-xs text-[#17191c]">
                            {mat.uom === 'Pcs' ? 'Customer Substrate Component (Auto-synced)' : `Required Chemical #${idx + 1}`}
                          </span>
                        </div>
                        {mat.uom !== 'Pcs' && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMaterialRow(mat.id || '')}
                            className="text-gray-400 hover:text-red-600 transition cursor-pointer p-1"
                            title="Remove row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                        <div className="sm:col-span-2">
                          <label className="block text-[9.5px] font-bold text-[#777b86] uppercase mb-0.5">
                            Material / Paint Description *
                          </label>
                          <input
                            type="text"
                            required
                            value={mat.itemDescription}
                            onChange={e => handleUpdateMaterial(mat.id || '', 'itemDescription', e.target.value)}
                            placeholder="e.g. Monza Red 2K PU Basecoat Paint (PPG)"
                            className="w-full h-9 px-3 rounded-[12px] border border-[#dcdfe4] bg-white text-xs font-semibold text-[#17191c] focus:outline-none focus:border-[#c09748]"
                          />
                        </div>

                        <div>
                          <label className="block text-[9.5px] font-bold text-[#777b86] uppercase mb-0.5">
                            Demand Qty & UOM *
                          </label>
                          <div className="flex gap-1">
                            <input
                              type="number"
                              min="1"
                              required
                              value={mat.qty}
                              onChange={e => handleUpdateMaterial(mat.id || '', 'qty', Number(e.target.value))}
                              className="w-full h-9 px-3 rounded-[12px] border border-[#dcdfe4] bg-white text-xs font-mono font-bold text-[#17191c] focus:outline-none focus:border-[#c09748]"
                            />
                            <select
                              value={mat.uom || 'Pcs'}
                              onChange={e => handleUpdateMaterial(mat.id || '', 'uom', e.target.value)}
                              className="w-20 h-9 px-2 rounded-[12px] border border-[#dcdfe4] bg-white text-xs font-mono text-[#17191c]"
                            >
                              <option value="Pcs">Pcs</option>
                              <option value="Litres">Ltr</option>
                              <option value="Kg">Kg</option>
                              <option value="Sets">Set</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[9.5px] font-bold text-[#777b86] uppercase mb-0.5">
                            Color / Store Remarks
                          </label>
                          <input
                            type="text"
                            value={mat.colour || mat.remark || ''}
                            onChange={e => {
                              handleUpdateMaterial(mat.id || '', 'colour', e.target.value);
                              handleUpdateMaterial(mat.id || '', 'remark', e.target.value);
                            }}
                            placeholder="e.g. Ratio 4:1:1 / Visc 16s"
                            className="w-full h-9 px-3 rounded-[12px] border border-[#dcdfe4] bg-white text-xs text-[#17191c]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* SECTION 4: 3-STAGE INTER-STAGE PROCESS VERIFICATION (ACTIVE CARDS ONLY)   */}
              {/* ========================================================================= */}
              {isExistingCard && (
                <div className="bg-[#fafafb] p-4.5 sm:p-5 rounded-[20px] border border-[#ececec] space-y-3.5 shadow-2xs">
                  <span className="text-[10px] font-bold text-[#c09748] uppercase tracking-wider font-mono block">
                    4. 3-Stage Process Verification Checkpoints (Target: {totalAllocatedTargetQty} Pcs)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {/* Stage 1 */}
                    <div className="bg-white p-3.5 rounded-[16px] border border-[#ececec] space-y-1.5">
                      <span className="font-bold text-xs text-[#17191c] block">Stage 1: Basecoat Application</span>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-[9px] text-[#777b86] block">Inward</span>
                          <input
                            type="number"
                            value={firstStage.totalQty}
                            onChange={e => setFirstStage({ ...firstStage, totalQty: Number(e.target.value) })}
                            className="w-full h-8 px-2 border border-[#dcdfe4] rounded-lg font-mono font-bold"
                          />
                        </div>
                        <div>
                          <span className="text-[9px] text-[#777b86] block">OK Passed</span>
                          <input
                            type="number"
                            value={firstStage.okQty}
                            onChange={e => setFirstStage({ ...firstStage, okQty: Number(e.target.value) })}
                            className="w-full h-8 px-2 border border-[#dcdfe4] rounded-lg font-mono font-bold text-emerald-800"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Stage 2 */}
                    <div className="bg-white p-3.5 rounded-[16px] border border-[#ececec] space-y-1.5">
                      <span className="font-bold text-xs text-[#17191c] block">Stage 2: Dipping / UV Pattern</span>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-[9px] text-[#777b86] block">Inward</span>
                          <input
                            type="number"
                            value={secondStage.totalQty}
                            onChange={e => setSecondStage({ ...secondStage, totalQty: Number(e.target.value) })}
                            className="w-full h-8 px-2 border border-[#dcdfe4] rounded-lg font-mono font-bold"
                          />
                        </div>
                        <div>
                          <span className="text-[9px] text-[#777b86] block">OK Passed</span>
                          <input
                            type="number"
                            value={secondStage.okQty}
                            onChange={e => setSecondStage({ ...secondStage, okQty: Number(e.target.value) })}
                            className="w-full h-8 px-2 border border-[#dcdfe4] rounded-lg font-mono font-bold text-emerald-800"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Stage 3 */}
                    <div className="bg-white p-3.5 rounded-[16px] border border-[#ececec] space-y-1.5">
                      <span className="font-bold text-xs text-[#17191c] block">Stage 3: Clear Lacquer Curing</span>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-[9px] text-[#777b86] block">Inward</span>
                          <input
                            type="number"
                            value={thirdStage.totalQty}
                            onChange={e => setThirdStage({ ...thirdStage, totalQty: Number(e.target.value) })}
                            className="w-full h-8 px-2 border border-[#dcdfe4] rounded-lg font-mono font-bold"
                          />
                        </div>
                        <div>
                          <span className="text-[9px] text-[#777b86] block">OK Passed</span>
                          <input
                            type="number"
                            value={thirdStage.okQty}
                            onChange={e => setThirdStage({ ...thirdStage, okQty: Number(e.target.value) })}
                            className="w-full h-8 px-2 border border-[#dcdfe4] rounded-lg font-mono font-bold text-emerald-800"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ACTION BUTTON BAR (NO BLACK BUTTONS) */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#ececec]">
                <div className="flex items-center gap-2 text-xs text-[#777b86] self-start sm:self-auto">
                  <span className="px-3 py-1 bg-[#faf3e0] text-[#8a6521] rounded-full border border-[#f4e5be] font-mono font-bold">
                    Target: {totalAllocatedTargetQty} Pcs
                  </span>
                  <span>•</span>
                  <span>Painter: <strong className="text-[#17191c]">{painterName}</strong></span>
                  <span>•</span>
                  <span>Line: <strong className="text-[#17191c]">{dept.split('(')[0]}</strong></span>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold cursor-pointer transition active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={hasOverAllocation || totalAllocatedTargetQty <= 0}
                    className={`px-6 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 shadow-2xs transition active:scale-95 ${
                      hasOverAllocation || totalAllocatedTargetQty <= 0
                        ? 'bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed'
                        : 'bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] cursor-pointer'
                    }`}
                  >
                    <Save className="w-4 h-4 text-[#8a6521]" />
                    <span>{isExistingCard ? 'Save Job Card Updates' : '🚀 Launch Job Card & Demand Chemicals'}</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* MODE 2: PRINT SHEET FORMAT */}
          {/* ========================================================================= */}
          {viewMode === 'PRINT' && (
            <div className="space-y-4 border border-[#17191c] p-6 bg-white text-[#17191c] text-xs font-sans">
              <div className="border-b-2 border-[#17191c] pb-3 text-center">
                <div className="text-xl font-bold font-serif tracking-tight uppercase">PAINTKING SURFACE SOLUTIONS</div>
                <div className="text-xs font-semibold">JOB CARD CUBIC PAINT FRAME</div>
                <div className="text-[10px] text-gray-500 font-mono mt-0.5">{docNo} • {revNo}</div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-[#ececec] pb-3">
                <div>
                  <div><strong>Customer:</strong> {customer}</div>
                  <div><strong>Part Code:</strong> {materialAllocations.map(m => m.partCode).join(', ') || partCode}</div>
                  <div><strong>Job Card No:</strong> {jobCardNo}</div>
                  <div><strong>Target Qty:</strong> {totalAllocatedTargetQty} Pcs</div>
                </div>
                <div>
                  <div><strong>W.No / Challan:</strong> {wNo}</div>
                  <div><strong>Color / Shades:</strong> {materialAllocations.map(m => `${m.partCode}: ${m.color}`).join(' | ') || batchColor}</div>
                  <div><strong>Assigned Painter:</strong> {painterName}</div>
                  <div><strong>Date & Time:</strong> {issueDate} {issueTime}</div>
                </div>
              </div>

              <div>
                <div className="font-bold uppercase text-[11px] mb-1">Issued Materials & Chemicals:</div>
                <table className="w-full text-left border-collapse border border-[#ececec] text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 border border-[#ececec]">#</th>
                      <th className="p-2 border border-[#ececec]">Description</th>
                      <th className="p-2 border border-[#ececec]">Qty</th>
                      <th className="p-2 border border-[#ececec]">Color</th>
                      <th className="p-2 border border-[#ececec]">Remarks</th>
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

              <div className="pt-8 grid grid-cols-3 gap-6 text-center text-[11px]">
                <div className="border-t border-[#17191c] pt-1"><strong>Prepared By (Stores)</strong></div>
                <div className="border-t border-[#17191c] pt-1"><strong>Checked By (Supervisor)</strong></div>
                <div className="border-t border-[#17191c] pt-1"><strong>Approved By (Plant Head)</strong></div>
              </div>
            </div>
          )}

        </form>

      </div>
    </div>
  );
};
