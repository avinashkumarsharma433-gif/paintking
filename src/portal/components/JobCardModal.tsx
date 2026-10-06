import React, { useState, useEffect, useMemo } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { JobCard, IssuedMaterialItem } from '../types/portalTypes';
import { 
  Plus, 
  Trash2, 
  Save, 
  Printer, 
  Layers, 
  User, 
  Calendar, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Package, 
  ShieldCheck, 
  ArrowRightLeft,
  X,
  Droplets,
  Palette,
  Check,
  RotateCcw,
  Lock,
  Truck,
  FileText
} from 'lucide-react';

interface JobCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<JobCard>;
}

export const JobCardModal: React.FC<JobCardModalProps> = ({ isOpen, onClose, initialData }) => {
  const { addJobCard, activePlant, currentUser, grnList, jobCards, painters, getPainterActiveJobCount } = usePortalStore();

  const [viewMode, setViewMode] = useState<'PORTAL' | 'PRINT'>('PORTAL');

  // Metadata
  const [docNo] = useState<string>(initialData?.docNo || 'Doc No: 001');
  const [revNo] = useState<string>(initialData?.revNo || 'Rev.No: 00');
  const [revDate] = useState<string>(initialData?.revDate || new Date().toISOString().split('T')[0]);

  // INITIAL PROCESS
  const [jobCardNo, setJobCardNo] = useState<string>(initialData?.jobCardNo || `JC-${Math.floor(1000 + Math.random() * 9000)}-RD`);
  const [wNo, setWNo] = useState<string>(initialData?.wNo || initialData?.woNo || 'WO-1042');
  const [painterName, setPainterName] = useState<string>(initialData?.assignedPainterName || initialData?.painterName || painters[0]?.name || 'Ramesh Kumar (P1)');
  const [assignedPainterId, setAssignedPainterId] = useState<string>(initialData?.assignedPainterId || painters[0]?.id || 'PAINTER-01');
  const [issueDate, setIssueDate] = useState<string>(initialData?.issueDate || new Date().toISOString().split('T')[0]);
  const [issueTime, setIssueTime] = useState<string>(initialData?.issueTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [customer, setCustomer] = useState<string>(initialData?.customer || (grnList[0]?.supplierCustomer) || 'ROOP POLYMERS LTD');
  const [partCode, setPartCode] = useState<string>(initialData?.partCode || (grnList[0]?.items?.[0]?.partCode) || 'RP-8841');
  const [selectedGrnNo, setSelectedGrnNo] = useState<string>(initialData?.sourceGrnNo || (initialData as any)?.sourceGrnNo || (initialData as any)?.grnNo || '');
  const [leadTime, setLeadTime] = useState<string>(initialData?.leadTime || '4 Hours');
  const [dept, setDept] = useState<string>(initialData?.dept || 'Booth #1 (Continuous Conveyor Line)');
  const [headerRemark, setHeaderRemark] = useState<string>(initialData?.headerRemark || 'Target cap enforced for shop floor.');

  // Target Quantity for this Job Card batch
  const [targetQty, setTargetQty] = useState<number>(initialData?.targetQty || 250);
  const [batchColor, setBatchColor] = useState<string>(initialData?.color || 'Monza Red Gloss');

  // FINAL PROCESS
  const [returnMaterialDesc, setReturnMaterialDesc] = useState<string>(initialData?.returnMaterialDesc || 'Unused Basecoat Monza Red');
  const [returnPainterName, setReturnPainterName] = useState<string>(initialData?.returnPainterName || 'Ramesh Sharma');
  const [returnDate, setReturnDate] = useState<string>(initialData?.returnDate || '');
  const [returnTime, setReturnTime] = useState<string>(initialData?.returnTime || '');
  const [returnOkQty, setReturnOkQty] = useState<number>(initialData?.returnOkQty || 0);
  const [returnRejectionQty, setReturnRejectionQty] = useState<number>(initialData?.returnRejectionQty || 0);
  const [checkingPerson, setCheckingPerson] = useState<string>(initialData?.checkingPerson || 'Amit Verma (QA Lead)');

  // ISSUE MATERIAL DETAILS TABLE (Internal chemicals / raw components)
  const [issuedMaterials, setIssuedMaterials] = useState<IssuedMaterialItem[]>(
    initialData?.issuedMaterials && initialData.issuedMaterials.length > 0 
      ? initialData.issuedMaterials
      : [
          {
            id: '1',
            itemDescription: initialData?.partDescription || 'Auto AC Center Vent Bezel Substrate (ABS)',
            qty: initialData?.targetQty || 250,
            colour: initialData?.color || 'Raw Substrate Tone',
            uom: 'Pcs',
            remark: 'Issued from Stores'
          },
          {
            id: '2',
            itemDescription: 'Monza Red 2K PU Basecoat Paint (PPG)',
            qty: 10,
            colour: 'Monza Red Gloss',
            uom: 'Litres',
            remark: 'Mix ratio 4:1:1'
          },
          {
            id: '3',
            itemDescription: 'PU Thinner 400 Solvent',
            qty: 2,
            colour: 'Clear',
            uom: 'Litres',
            remark: 'Standard thinner'
          }
        ]
  );

  // SIGNATURES
  const [storeIncharge, setStoreIncharge] = useState<string>(initialData?.storeIncharge || currentUser.name || 'Manoj Tiwari');
  const [prodSupervisor, setProdSupervisor] = useState<string>(initialData?.prodSupervisor || 'Vikram Patel');
  const [approvedBy, setApprovedBy] = useState<string>(initialData?.approvedBy || 'Satish Sharma');

  // 3-STAGE PRODUCTION PROCESS
  const [firstStage, setFirstStage] = useState({ totalQty: initialData?.stageProcessFirst?.totalQty || 250, okQty: initialData?.stageProcessFirst?.okQty || 245, rejectionQty: initialData?.stageProcessFirst?.rejectionQty || 5 });
  const [secondStage, setSecondStage] = useState({ totalQty: initialData?.stageProcessSecond?.totalQty || 245, okQty: initialData?.stageProcessSecond?.okQty || 240, rejectionQty: initialData?.stageProcessSecond?.rejectionQty || 5 });
  const [thirdStage, setThirdStage] = useState({ totalQty: initialData?.stageProcessThird?.totalQty || 240, okQty: initialData?.stageProcessThird?.okQty || 235, rejectionQty: initialData?.stageProcessThird?.rejectionQty || 5 });
  const [stageRemark, setStageRemark] = useState<string>(initialData?.stageRemark || 'Final lacquer cured at 80°C for 45 mins.');

  const [preparedBy, setPreparedBy] = useState<string>(initialData?.preparedBy || 'Manoj Tiwari (Stores)');
  const [checkedBy, setCheckedBy] = useState<string>(initialData?.checkedBy || 'Vikram Patel (Supervisor)');
  const [stageApprovedBy, setStageApprovedBy] = useState<string>(initialData?.stageApprovedBy || 'Satish Sharma (Plant Head)');

  // Sync initialData when modal opens
  useEffect(() => {
    if (initialData && isOpen) {
      if (initialData.customer) setCustomer(initialData.customer);
      if (initialData.partCode) setPartCode(initialData.partCode);
      if (initialData.targetQty) setTargetQty(initialData.targetQty);
      if (initialData.color) setBatchColor(initialData.color);
      if (initialData.woNo) setWNo(initialData.woNo);
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
    }
  }, [initialData, isOpen, grnList]);

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

  // Selected GRN Details & Dynamic Remaining Balance Computation
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
    return availableGrnLots.find(g => g.supplierCustomer?.trim().toLowerCase() === customer?.trim().toLowerCase()) || availableGrnLots[0] || grnList[0];
  }, [grnList, selectedGrnNo, initialData, customer, partCode, availableGrnLots]);

  const grnTotalQty = useMemo(() => {
    if (!selectedGrn) return initialData?.targetQty || 1000;
    return Number(selectedGrn.actualReceivedQty) || Number(selectedGrn.totalQty) || 1000;
  }, [selectedGrn, initialData]);

  // Materials / Substrates inside this GRN
  const grnItemsList = useMemo(() => {
    if (selectedGrn?.items && selectedGrn.items.length > 0) {
      return selectedGrn.items;
    }
    if (selectedGrn) {
      return [{
        id: '1',
        partCode: selectedGrn.partCode || partCode || 'SUBSTRATE-01',
        partDescription: selectedGrn.description || initialData?.partDescription || 'Raw Substrate Injection Molded Parts',
        invoicedQty: selectedGrn.invoicedQty || selectedGrn.actualReceivedQty || grnTotalQty,
        actualReceivedQty: selectedGrn.actualReceivedQty || selectedGrn.totalQty || grnTotalQty,
        shortExcessQty: 0,
        okByIqcQty: selectedGrn.actualReceivedQty || selectedGrn.totalQty || grnTotalQty,
        rejectionQty: 0,
        remark: 'IQC Passed Store Stock'
      }];
    }
    return [];
  }, [selectedGrn, partCode, initialData, grnTotalQty]);

  // Existing Master Job Cards created against this GRN
  const existingJobCardsForGrn = useMemo(() => {
    return jobCards.filter(jc => {
      // Exclude the current job card if editing
      if (initialData?.jobCardNo && jc.jobCardNo === initialData.jobCardNo) return false;
      const isMaster = jc.jobCardType === 'master' || (!jc.jobCardType && !jc.parentJobCardId);
      if (!isMaster) return false;

      return (
        (selectedGrn && (jc.sourceGrnNo === selectedGrn.grnNo || jc.woNo === selectedGrn.invoiceChallanNo || jc.wNo === selectedGrn.invoiceChallanNo)) ||
        (selectedGrn && jc.customer?.trim().toLowerCase() === selectedGrn.supplierCustomer?.trim().toLowerCase() && jc.partCode === selectedGrn.partCode)
      );
    });
  }, [jobCards, selectedGrn, initialData]);

  const alreadyAllocatedQty = useMemo(() => {
    return existingJobCardsForGrn.reduce((sum, jc) => sum + (Number(jc.targetQty) || 0), 0);
  }, [existingJobCardsForGrn]);

  const maxAllowedTargetQty = useMemo(() => {
    return Math.max(0, grnTotalQty - alreadyAllocatedQty);
  }, [grnTotalQty, alreadyAllocatedQty]);

  const isOverAllocated = targetQty > maxAllowedTargetQty;

  // Preset Color Palettes for Quick Selection
  const colorPresets = [
    { name: 'Monza Red Gloss', bg: 'bg-red-600', text: 'text-white' },
    { name: 'Piano High Gloss Black', bg: 'bg-neutral-900', text: 'text-white' },
    { name: 'Pearl Arctic White', bg: 'bg-neutral-100 border border-neutral-300', text: 'text-neutral-800' },
    { name: 'Carbon Fiber 3D Dipping', bg: 'bg-neutral-800', text: 'text-amber-400' },
    { name: 'Satin Silver Metallic', bg: 'bg-slate-300', text: 'text-slate-900' }
  ];

  // Sync targetQty changes into row 1 (Substrate row) and stage counts
  const handleTargetQtyChange = (newQty: number) => {
    setTargetQty(newQty);
    setIssuedMaterials(prev => prev.map((item, idx) => {
      if (idx === 0) {
        return { ...item, qty: newQty, colour: batchColor };
      }
      return item;
    }));
    setFirstStage(prev => ({ ...prev, totalQty: newQty, okQty: Math.max(0, newQty - 5) }));
    setSecondStage(prev => ({ ...prev, totalQty: Math.max(0, newQty - 5), okQty: Math.max(0, newQty - 10) }));
    setThirdStage(prev => ({ ...prev, totalQty: Math.max(0, newQty - 10), okQty: Math.max(0, newQty - 15) }));
  };

  const handleColorChange = (newColor: string) => {
    setBatchColor(newColor);
    setIssuedMaterials(prev => prev.map((item, idx) => {
      if (idx === 0 || idx === 1) {
        return { ...item, colour: newColor };
      }
      return item;
    }));
  };

  if (!isOpen) return null;

  const handleAddMaterialRow = () => {
    setIssuedMaterials([
      ...issuedMaterials,
      {
        id: Date.now().toString(),
        itemDescription: 'High-Gloss Clear Protective Lacquer',
        qty: 5,
        colour: 'Clear Topcoat',
        uom: 'Litres',
        remark: 'Top UV cured coat'
      }
    ]);
  };

  const handleRemoveMaterialRow = (id: string) => {
    if (issuedMaterials.length <= 1) return;
    setIssuedMaterials(issuedMaterials.filter(m => m.id !== id));
  };

  const handleUpdateMaterial = (id: string, field: keyof IssuedMaterialItem, val: any) => {
    setIssuedMaterials(prev => prev.map(item => {
      if (item.id !== id) return item;
      return { ...item, [field]: val };
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (isOverAllocated) {
      alert(`Validation Error: Target quantity (${targetQty} Pcs) cannot exceed the remaining available GRN balance of ${maxAllowedTargetQty} Pcs.`);
      return;
    }

    if (targetQty <= 0) {
      alert("Validation Error: Target quantity must be greater than 0.");
      return;
    }

    const newJobCard: JobCard = {
      docNo,
      revNo,
      revDate,
      jobCardNo,
      woNo: wNo,
      sourceGrnNo: selectedGrn?.grnNo || selectedGrnNo,
      customer,
      partCode: partCode || initialData?.partCode || 'SUBSTRATE',
      partDescription: issuedMaterials[0]?.itemDescription || 'Raw Part Substrate',
      model: initialData?.model || 'OEM Batch',
      color: batchColor,
      targetQty: targetQty,
      sprayedQty: initialData?.sprayedQty || 0,
      goodQty: initialData?.goodQty || 0,
      rejectQty: initialData?.rejectQty || 0,
      status: initialData?.status || 'Open',
      fpaStatus: initialData?.fpaStatus || 'Approved',

      painterName,
      assignedPainterName: painterName,
      assignedPainterId: assignedPainterId,
      painterJobStatus: 'Assigned',
      allocatedQty: targetQty,
      wNo,
      issueDate,
      issueTime,
      leadTime,
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

    addJobCard(newJobCard);
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-[24px] max-w-4xl w-full p-4 sm:p-7 shadow-2xl border border-[#ececec] space-y-5 max-h-[94vh] overflow-y-auto no-scrollbar print:max-w-none print:w-full print:p-0 print:shadow-none animate-in zoom-in-95 duration-150 relative">
        
        {/* Top Header & View Toggle (Hidden on print) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3.5 border-b border-[#ececec] print:hidden">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10px] font-mono font-bold uppercase tracking-wider">
                MASTER JOB CARD (FORMAT C.01)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#777b86] text-[10px] font-mono font-bold">
                {docNo} • {revNo}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#777b86] text-[10px] font-mono">
                Plant: {activePlant}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif text-[#17191c] font-normal tracking-tight">
              Create Production Master Job Card
            </h2>
            <p className="text-[11px] sm:text-xs text-[#777b86]">
              Allocate customer raw substrates, enforce GRN target cap & demand required internal paints and chemicals
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
              {/* SECTION 1: LINKED CUSTOMER SUBSTRATE & STORE GRN LOT                      */}
              {/* ========================================================================= */}
              <div className="bg-[#fafafb] p-4.5 sm:p-5 rounded-[20px] border border-[#ececec] space-y-4 shadow-2xs">
                
                {/* Header Strip with Customer Name & Job Card Badges */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#ececec] pb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-[#c09748] uppercase tracking-wider font-mono flex items-center gap-1">
                        <Lock className="w-3 h-3 text-[#c09748]" />
                        1. Linked Customer Substrate & Store GRN Lot
                      </span>
                    </div>
                    <h3 className="text-base sm:text-xl font-serif text-[#17191c] font-normal flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-[#c09748]" />
                      <span>{customer || 'SPARK MINDA AUTOMOTIVE LTD'}</span>
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

                {/* Linked GRN Info Card (Auto-Linked, No select dropdown) */}
                <div className="p-3.5 sm:p-4 bg-[#faf7ed] rounded-[18px] border border-[#f4e5be] space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#f4e5be]/70">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#c09748]/15 border border-[#c09748]/30 flex items-center justify-center text-[#8a6521]">
                        <Package className="w-4 h-4 text-[#8a6521]" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-[#8a6521] uppercase tracking-wider font-mono">
                          Source Store Inward GRN Lot (Auto-Linked):
                        </div>
                        <div className="font-mono font-bold text-sm text-[#17191c] flex items-center gap-2">
                          <span>{selectedGrn?.grnNo || initialData?.sourceGrnNo || 'PK-GRN-2026-881'}</span>
                          <span className="text-[10px] font-mono font-normal text-[#777b86] px-2 py-0.5 rounded-md bg-white border border-[#f4e5be]">
                            Locked from Selected Item
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>IQC Verified & Store Received</span>
                      </span>
                      <span className="text-[11px] font-mono text-[#777b86] bg-white px-2.5 py-1 rounded-full border border-[#f4e5be]">
                        Plant: {selectedGrn?.plant || activePlant}
                      </span>
                    </div>
                  </div>

                  {/* Metadata Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="bg-white/90 p-2.5 rounded-[12px] border border-[#f4e5be]">
                      <span className="text-[9.5px] text-[#777b86] uppercase font-mono block">Challan / W.No</span>
                      <span className="font-mono font-bold text-[#17191c] truncate block" title={selectedGrn?.invoiceChallanNo || wNo}>
                        {selectedGrn?.invoiceChallanNo || wNo}
                      </span>
                    </div>
                    <div className="bg-white/90 p-2.5 rounded-[12px] border border-[#f4e5be]">
                      <span className="text-[9.5px] text-[#777b86] uppercase font-mono block">Inward Date</span>
                      <span className="font-mono font-semibold text-[#17191c]">
                        {selectedGrn?.date || selectedGrn?.receivedDate || issueDate}
                      </span>
                    </div>
                    <div className="bg-white/90 p-2.5 rounded-[12px] border border-[#f4e5be]">
                      <span className="text-[9.5px] text-[#777b86] uppercase font-mono block">Vehicle No</span>
                      <span className="font-mono font-semibold text-[#17191c]">
                        {selectedGrn?.vehicleNo || 'MH-04-AZ-9912'}
                      </span>
                    </div>
                    <div className="bg-white/90 p-2.5 rounded-[12px] border border-[#f4e5be]">
                      <span className="text-[9.5px] text-[#777b86] uppercase font-mono block">Transporter</span>
                      <span className="font-semibold text-[#17191c] truncate block" title={selectedGrn?.transporter || 'Direct Delivery'}>
                        {selectedGrn?.transporter || 'Direct Party Vehicle'}
                      </span>
                    </div>
                  </div>

                  {/* Material / Substrate Line Items Table from this GRN */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[10.5px] font-bold text-[#8a6521] uppercase font-mono">
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#8a6521]" />
                        Materials & Substrates in this GRN ({grnItemsList.length} Items):
                      </span>
                    </div>
                    
                    <div className="overflow-x-auto rounded-[14px] border border-[#f4e5be] bg-white">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#faf7ed] text-[#8a6521] font-mono text-[10px] uppercase tracking-wider border-b border-[#f4e5be]">
                            <th className="py-2.5 px-3">Part Code</th>
                            <th className="py-2.5 px-3">Substrate / Description</th>
                            <th className="py-2.5 px-3 text-center">Challan Qty</th>
                            <th className="py-2.5 px-3 text-center">Inward OK Qty</th>
                            <th className="py-2.5 px-3 text-center">IQC Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f4e5be]/50">
                          {grnItemsList.map((item, iIdx) => {
                            const isCurrentPart = item.partCode === partCode;
                            return (
                              <tr key={iIdx} className={isCurrentPart ? 'bg-[#faf3e0]/40 font-semibold' : 'hover:bg-[#fafafb]'}>
                                <td className="py-2.5 px-3 font-mono font-bold text-[#8a6521]">
                                  {item.partCode}
                                  {isCurrentPart && (
                                    <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] bg-[#c09748] text-white uppercase font-sans">
                                      Active Job Target
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-[#17191c]">
                                  {item.partDescription}
                                </td>
                                <td className="py-2.5 px-3 text-center font-mono text-[#777b86]">
                                  {(item.invoicedQty || item.actualReceivedQty || grnTotalQty).toLocaleString('en-IN')} Pcs
                                </td>
                                <td className="py-2.5 px-3 text-center font-mono font-bold text-[#17191c]">
                                  {(item.actualReceivedQty || item.okByIqcQty || grnTotalQty).toLocaleString('en-IN')} Pcs
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                                    Passed ✓
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Dynamic 4-Tile Guardrail Summary Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
                    <div className="p-2.5 rounded-[14px] bg-white border border-[#f4e5be]">
                      <span className="text-[9.5px] text-[#777b86] uppercase font-mono block">Customer Account</span>
                      <span className="font-bold text-xs text-[#17191c] truncate block" title={customer}>{customer}</span>
                    </div>
                    <div className="p-2.5 rounded-[14px] bg-white border border-[#f4e5be]">
                      <span className="text-[9.5px] text-[#777b86] uppercase font-mono block">GRN Inward Total</span>
                      <span className="font-mono font-bold text-xs text-[#17191c]">{grnTotalQty.toLocaleString('en-IN')} Pcs</span>
                    </div>
                    <div className="p-2.5 rounded-[14px] bg-white border border-[#f4e5be]">
                      <span className="text-[9.5px] text-[#777b86] uppercase font-mono block">Already in Job Cards</span>
                      <span className="font-mono font-bold text-xs text-blue-800">
                        {alreadyAllocatedQty.toLocaleString('en-IN')} Pcs ({existingJobCardsForGrn.length} Cards)
                      </span>
                    </div>
                    <div className={`p-2.5 rounded-[14px] border ${
                      maxAllowedTargetQty > 0 ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900' : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                      <span className="text-[9.5px] uppercase font-mono font-semibold block">Max Available for This Card</span>
                      <span className="font-mono font-bold text-xs">
                        {maxAllowedTargetQty.toLocaleString('en-IN')} Pcs
                      </span>
                    </div>
                  </div>

                  {/* Over-allocation warning banner */}
                  {isOverAllocated && (
                    <div className="p-3 rounded-[14px] bg-red-50 border border-red-300 text-red-800 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>
                        <strong>Guardrail Blocked:</strong> Target quantity (<strong>{targetQty} Pcs</strong>) exceeds the remaining available GRN balance of <strong>{maxAllowedTargetQty} Pcs</strong>. Please reduce the quantity.
                      </span>
                    </div>
                  )}
                </div>

                {/* Target Qty Input with Quick-Fill Pill Controls */}
                <div className="p-3.5 bg-white rounded-[16px] border border-[#ececec] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10.5px] font-bold text-[#17191c] uppercase font-mono">
                      Target Quantity for this Job Card (Pcs) *
                    </label>
                    <div className="text-[11px] text-[#777b86]">
                      Max allowed unallocated balance: <strong className="text-[#8a6521] font-mono">{maxAllowedTargetQty} Pcs</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max={maxAllowedTargetQty > 0 ? maxAllowedTargetQty : undefined}
                      required
                      value={targetQty}
                      onChange={e => handleTargetQtyChange(Number(e.target.value))}
                      className={`w-32 h-10 px-3.5 rounded-[12px] border font-mono font-bold text-sm bg-white focus:outline-none transition shadow-2xs ${
                        isOverAllocated 
                          ? 'border-red-500 text-red-600 focus:ring-2 focus:ring-red-200' 
                          : 'border-[#dcdfe4] text-[#17191c] focus:border-[#c09748]'
                      }`}
                    />

                    {maxAllowedTargetQty > 0 && targetQty !== maxAllowedTargetQty && (
                      <button
                        type="button"
                        onClick={() => handleTargetQtyChange(maxAllowedTargetQty)}
                        className="px-3 py-2 rounded-[12px] bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-[11px] font-bold transition cursor-pointer shadow-2xs active:scale-95"
                        title="Allocate full remaining GRN balance"
                      >
                        ⚡ Fill All ({maxAllowedTargetQty})
                      </button>
                    )}

                    {maxAllowedTargetQty >= 2 && (
                      <button
                        type="button"
                        onClick={() => handleTargetQtyChange(Math.floor(maxAllowedTargetQty / 2))}
                        className="px-3 py-2 rounded-[12px] bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-[11px] font-semibold transition cursor-pointer shadow-2xs active:scale-95"
                        title="Split into 50% batch"
                      >
                        ½ Split 50% ({Math.floor(maxAllowedTargetQty / 2)})
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* SECTION 2: BATCH FINISH SPECIFICATION & LINE ASSIGNMENT                   */}
              {/* ========================================================================= */}
              <div className="bg-[#fafafb] p-4.5 sm:p-5 rounded-[20px] border border-[#ececec] space-y-3.5 shadow-2xs">
                <div className="border-b border-[#ececec] pb-2">
                  <span className="text-[10px] font-bold text-[#c09748] uppercase tracking-wider font-mono">
                    2. Batch Finish Specification & Line Assignment
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {/* Color Shade Input + Preset Pills */}
                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                    <label className="block text-[10.5px] font-bold text-[#777b86] uppercase font-mono">
                      Batch Finish / Color Shade *
                    </label>
                    <input
                      type="text"
                      required
                      value={batchColor}
                      onChange={e => handleColorChange(e.target.value)}
                      placeholder="e.g. Monza Red Gloss / Piano Black"
                      className="w-full h-10 px-3.5 rounded-[12px] border border-[#dcdfe4] bg-white font-semibold text-[#17191c] focus:border-[#c09748] focus:outline-none shadow-2xs"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {colorPresets.map((preset, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => handleColorChange(preset.name)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition cursor-pointer flex items-center gap-1 ${preset.bg} ${preset.text}`}
                        >
                          <span>{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Painting Line / Department */}
                  <div className="space-y-1.5">
                    <label className="block text-[10.5px] font-bold text-[#777b86] uppercase font-mono">
                      Department / Painting Line *
                    </label>
                    <select
                      value={dept}
                      onChange={e => setDept(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-[12px] border border-[#dcdfe4] bg-white font-semibold text-[#17191c] focus:border-[#c09748] focus:outline-none cursor-pointer shadow-2xs"
                    >
                      <option value="Booth #1 (Continuous Conveyor Line)">Booth #1 (Continuous Conveyor Line)</option>
                      <option value="Booth #2 (Dust-Free Pressurized Cleanroom)">Booth #2 (Dust-Free Pressurized Cleanroom)</option>
                      <option value="Booth #3 (Hydrographic Immersion & Dipping)">Booth #3 (Hydrographic Immersion & Dipping)</option>
                      <option value="Booth #4 (Flatbed Industrial Direct UV Plotter)">Booth #4 (Flatbed Industrial Direct UV Plotter)</option>
                    </select>
                    <div className="text-[10px] text-[#777b86]">
                      Target Line: <strong>{dept.split('(')[0]}</strong>
                    </div>
                  </div>

                  {/* Assign Floor Painter */}
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
                      className="w-full h-10 px-3.5 rounded-[12px] border border-[#dcdfe4] bg-white font-semibold text-[#17191c] focus:border-[#c09748] focus:outline-none cursor-pointer shadow-2xs"
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
                      Booth: {painters.find(p => p.name === painterName)?.boothNo || 'Booth #1'}
                    </div>
                  </div>
                </div>

                {/* Second row: Part Code, Work Order & Lead Time */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#777b86] uppercase font-mono">
                      Part Code (OEM Spec) *
                    </label>
                    <input
                      type="text"
                      required
                      value={partCode}
                      onChange={e => setPartCode(e.target.value)}
                      placeholder="e.g. RP-8841 / MS-VENT-01"
                      className="w-full h-9 px-3 rounded-[12px] border border-[#dcdfe4] bg-white font-mono font-bold text-xs text-[#17191c]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#777b86] uppercase font-mono">
                      Work Order Ref (W.No) *
                    </label>
                    <input
                      type="text"
                      required
                      value={wNo}
                      onChange={e => setWNo(e.target.value)}
                      className="w-full h-9 px-3 rounded-[12px] border border-[#dcdfe4] bg-white font-mono font-bold text-xs text-[#17191c]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#777b86] uppercase font-mono">
                      Issue Date & Time *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        required
                        value={issueDate}
                        onChange={e => setIssueDate(e.target.value)}
                        className="w-full h-9 px-2.5 rounded-[12px] border border-[#dcdfe4] bg-white text-xs"
                      />
                      <input
                        type="text"
                        required
                        value={issueTime}
                        onChange={e => setIssueTime(e.target.value)}
                        className="w-24 h-9 px-2.5 rounded-[12px] border border-[#dcdfe4] bg-white text-xs text-center font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* SECTION 3: REQUIRED INTERNAL CHEMICALS & PAINTS DEMAND (MRN)              */}
              {/* ========================================================================= */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#ececec] pb-2">
                  <div>
                    <span className="text-[11px] font-bold text-[#c09748] uppercase tracking-wider font-mono">
                      3. Internal Material Requirements (Paints, Thinners & Chemicals)
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
                    <div key={mat.id} className="bg-[#fafafb] p-3.5 sm:p-4 rounded-[18px] border border-[#ececec] space-y-2 relative group hover:border-[#c09748]/50 transition shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] flex items-center justify-center font-bold text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-xs text-[#17191c]">
                            {idx === 0 ? 'Customer Substrate Component (Auto-synced)' : `Internal Chemical #${idx}`}
                          </span>
                        </div>
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMaterialRow(mat.id)}
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
                            onChange={e => handleUpdateMaterial(mat.id, 'itemDescription', e.target.value)}
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
                              onChange={e => handleUpdateMaterial(mat.id, 'qty', Number(e.target.value))}
                              className="w-full h-9 px-3 rounded-[12px] border border-[#dcdfe4] bg-white text-xs font-mono font-bold text-[#17191c] focus:outline-none focus:border-[#c09748]"
                            />
                            <select
                              value={mat.uom || 'Pcs'}
                              onChange={e => handleUpdateMaterial(mat.id, 'uom', e.target.value)}
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
                            Mix Ratio / Store Remarks
                          </label>
                          <input
                            type="text"
                            value={mat.remark || ''}
                            onChange={e => handleUpdateMaterial(mat.id, 'remark', e.target.value)}
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
              {/* SECTION 4: 3-STAGE INTER-STAGE PROCESS VERIFICATION                       */}
              {/* ========================================================================= */}
              <div className="bg-[#fafafb] p-4.5 sm:p-5 rounded-[20px] border border-[#ececec] space-y-3.5 shadow-2xs">
                <span className="text-[10px] font-bold text-[#c09748] uppercase tracking-wider font-mono block">
                  4. 3-Stage Process Verification Checkpoints (Target: {targetQty} Pcs)
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

              {/* ACTION BUTTON BAR (NO BLACK BUTTONS) */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#ececec]">
                <div className="flex items-center gap-2 text-xs text-[#777b86] self-start sm:self-auto">
                  <span className="px-3 py-1 bg-[#faf3e0] text-[#8a6521] rounded-full border border-[#f4e5be] font-mono font-bold">
                    Target: {targetQty} Pcs
                  </span>
                  <span>•</span>
                  <span>Painter: <strong className="text-[#17191c]">{painterName}</strong></span>
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
                    disabled={isOverAllocated}
                    className={`px-6 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 shadow-2xs transition active:scale-95 ${
                      isOverAllocated
                        ? 'bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed'
                        : 'bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] cursor-pointer'
                    }`}
                  >
                    <Save className="w-4 h-4 text-[#8a6521]" />
                    <span>Create Master Job Card & Demand Chemicals</span>
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
                  <div><strong>Part Code:</strong> {partCode}</div>
                  <div><strong>Job Card No:</strong> {jobCardNo}</div>
                  <div><strong>Target Qty:</strong> {targetQty} Pcs</div>
                </div>
                <div>
                  <div><strong>W.No / Challan:</strong> {wNo}</div>
                  <div><strong>Color / Shade:</strong> {batchColor}</div>
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
