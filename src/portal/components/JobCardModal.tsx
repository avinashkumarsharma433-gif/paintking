import React, { useState, useEffect, useMemo } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { JobCard, IssuedMaterialItem } from '../types/portalTypes';
import { Plus, Trash2, Save, Printer, Layers, User, Calendar, Clock, Sparkles, CheckCircle2, AlertTriangle, Building2, Package, ShieldCheck, ArrowRightLeft } from 'lucide-react';

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
  const [selectedGrnNo, setSelectedGrnNo] = useState<string>(initialData?.woNo || grnList[0]?.grnNo || '');
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
      if (initialData.issuedMaterials && initialData.issuedMaterials.length > 0) {
        setIssuedMaterials(initialData.issuedMaterials);
      }
    }
  }, [initialData, isOpen]);

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
    return grnList.find(g => g.grnNo === selectedGrnNo) || availableGrnLots.find(g => g.supplierCustomer === customer) || availableGrnLots[0];
  }, [grnList, selectedGrnNo, availableGrnLots, customer]);

  const grnTotalQty = useMemo(() => {
    if (!selectedGrn) return initialData?.targetQty || 1000;
    return Number(selectedGrn.actualReceivedQty) || Number(selectedGrn.totalQty) || 1000;
  }, [selectedGrn, initialData]);

  // Existing Master Job Cards created against this GRN
  const existingJobCardsForGrn = useMemo(() => {
    return jobCards.filter(jc => {
      // Exclude the current job card if editing
      if (initialData?.jobCardNo && jc.jobCardNo === initialData.jobCardNo) return false;
      const isMaster = jc.jobCardType === 'master' || (!jc.jobCardType && !jc.parentJobCardId);
      if (!isMaster) return false;

      return (
        (selectedGrn && (jc.woNo === selectedGrn.invoiceChallanNo || jc.wNo === selectedGrn.invoiceChallanNo)) ||
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-[24px] max-w-4xl w-full p-4 sm:p-7 shadow-2xl border border-[#ececec] space-y-6 max-h-[94vh] overflow-y-auto no-scrollbar print:max-w-none print:w-full print:p-0 print:shadow-none">
        
        {/* Top Header & View Toggle (Hidden on print) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#ececec] print:hidden">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10px] font-mono font-bold uppercase tracking-wider">
                MASTER JOB CARD CREATION
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#777b86] text-[10px] font-mono font-bold">
                {docNo} • {revNo}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif text-[#17191c] font-normal tracking-tight">
              Create Production Job Card & Batch
            </h2>
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
                Print Sheet Format
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
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* ========================================================================= */}
          {/* MODE 1: MODERN EDITORIAL INDUSTRIAL PORTAL VIEW */}
          {/* ========================================================================= */}
          {viewMode === 'PORTAL' && (
            <div className="space-y-6 text-xs">
              
              {/* SECTION A: GRN ALLOCATION GUARDRAIL & LOT SELECTION HERO CARD */}
              <div className="bg-[#fafafb] p-5 sm:p-6 rounded-[24px] border border-[#ececec] space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#ececec] pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-[#c09748] uppercase tracking-wider font-mono">
                      1. Customer Part & GRN Allocation Guardrail
                    </span>
                    <h3 className="text-xl font-serif text-[#17191c] font-normal mt-0.5">
                      {customer || 'Select Customer / OEM Client'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#8a6521] px-3 py-1 rounded-full bg-[#faf3e0] border border-[#f4e5be]">
                      {jobCardNo}
                    </span>
                    <span className="font-mono text-xs text-[#777b86] font-semibold">
                      W.No: {wNo}
                    </span>
                  </div>
                </div>

                {/* GRN Lot Selector Strip */}
                <div className="p-4 bg-[#faf7ed] rounded-[20px] border border-[#f4e5be] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-[#8a6521]" />
                      <span className="text-xs font-bold text-[#8a6521] uppercase tracking-wider font-mono">
                        Source Store Inward GRN Lot:
                      </span>
                    </div>
                    <select
                      value={selectedGrnNo}
                      onChange={e => {
                        const chosen = grnList.find(g => g.grnNo === e.target.value);
                        if (chosen) {
                          setSelectedGrnNo(chosen.grnNo);
                          setCustomer(chosen.supplierCustomer || customer);
                          setWNo(chosen.invoiceChallanNo || wNo);
                          const firstItem = chosen.items?.[0];
                          if (firstItem) {
                            setPartCode(firstItem.partCode || partCode);
                          }
                        }
                      }}
                      className="px-3 py-1.5 rounded-[12px] border border-[#c09748] bg-white font-mono font-bold text-xs text-[#17191c] cursor-pointer focus:outline-none"
                    >
                      <option value="">-- Select Customer GRN Lot --</option>
                      {availableGrnLots.map(g => (
                        <option key={g.grnNo} value={g.grnNo}>
                          {g.grnNo} • {g.supplierCustomer} ({g.actualReceivedQty || g.totalQty} pcs) • Ch: {g.invoiceChallanNo}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dynamic Balance Guardrail Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-center">
                    <div className="p-2.5 rounded-[14px] bg-white border border-[#f4e5be]">
                      <span className="text-[10px] text-[#777b86] uppercase font-mono block">GRN Inward Total</span>
                      <span className="font-mono font-bold text-sm text-[#17191c]">{grnTotalQty.toLocaleString('en-IN')} Pcs</span>
                    </div>
                    <div className="p-2.5 rounded-[14px] bg-white border border-[#f4e5be]">
                      <span className="text-[10px] text-[#777b86] uppercase font-mono block">Already in Job Cards</span>
                      <span className="font-mono font-bold text-sm text-blue-800">
                        {alreadyAllocatedQty.toLocaleString('en-IN')} Pcs ({existingJobCardsForGrn.length} Cards)
                      </span>
                    </div>
                    <div className={`p-2.5 rounded-[14px] border ${
                      maxAllowedTargetQty > 0 ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900' : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                      <span className="text-[10px] uppercase font-mono font-semibold block">Max Available for this Card</span>
                      <span className="font-mono font-bold text-sm">
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

                {/* Core Job Card Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1 font-mono">
                      Target Quantity (Pcs) * [Max: {maxAllowedTargetQty}]
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={maxAllowedTargetQty > 0 ? maxAllowedTargetQty : undefined}
                      required
                      value={targetQty}
                      onChange={e => handleTargetQtyChange(Number(e.target.value))}
                      className={`w-full p-2.5 rounded-[16px] border font-mono font-bold text-sm bg-white focus:outline-none transition ${
                        isOverAllocated 
                          ? 'border-red-500 text-red-600 focus:ring-2 focus:ring-red-200' 
                          : 'border-[#ececec] text-[#17191c] focus:border-[#c09748]'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1 font-mono">
                      Batch Finish / Color Shade *
                    </label>
                    <input
                      type="text"
                      required
                      value={batchColor}
                      onChange={e => handleColorChange(e.target.value)}
                      placeholder="e.g. Monza Red Gloss / Piano Black"
                      className="w-full p-2.5 rounded-[16px] border border-[#ececec] bg-white font-semibold text-[#17191c] focus:border-[#c09748] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1 font-mono">
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
                      className="w-full p-2.5 rounded-[16px] border border-[#ececec] bg-white font-semibold text-[#17191c] focus:border-[#c09748] focus:outline-none cursor-pointer"
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
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1 font-mono">
                      Work Order (W.No) *
                    </label>
                    <input
                      type="text"
                      required
                      value={wNo}
                      onChange={e => setWNo(e.target.value)}
                      className="w-full p-2.5 rounded-[16px] border border-[#ececec] bg-white font-mono font-bold text-[#17191c] focus:border-[#c09748] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1 font-mono">
                      Customer / Client Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customer}
                      onChange={e => setCustomer(e.target.value)}
                      placeholder="e.g. ROOP POLYMERS LTD / MARUTI SUZUKI"
                      className="w-full p-2.5 rounded-[16px] border border-[#ececec] bg-white font-semibold text-[#17191c] focus:border-[#c09748] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1 font-mono">
                      Part Code (OEM Spec) *
                    </label>
                    <input
                      type="text"
                      required
                      value={partCode}
                      onChange={e => setPartCode(e.target.value)}
                      placeholder="e.g. RP-8841 / MS-VENT-01"
                      className="w-full p-2.5 rounded-[16px] border border-[#ececec] bg-white font-mono font-bold text-[#17191c]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1 font-mono">
                      Department / Shop Floor Line *
                    </label>
                    <input
                      type="text"
                      required
                      value={dept}
                      onChange={e => setDept(e.target.value)}
                      className="w-full p-2.5 rounded-[16px] border border-[#ececec] bg-white font-semibold text-[#17191c]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1 font-mono">
                      Issue Date & Time *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        required
                        value={issueDate}
                        onChange={e => setIssueDate(e.target.value)}
                        className="w-full p-2.5 rounded-[16px] border border-[#ececec] bg-white text-[11px]"
                      />
                      <input
                        type="text"
                        required
                        value={issueTime}
                        onChange={e => setIssueTime(e.target.value)}
                        className="w-24 p-2.5 rounded-[16px] border border-[#ececec] bg-white text-[11px] text-center font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION B: INTERNAL MATERIAL REQUIREMENTS & STORE DEMAND (MRN) */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#ececec] pb-2">
                  <div>
                    <span className="text-[11px] font-bold text-[#c09748] uppercase tracking-wider font-mono">
                      2. Internal Material Requirements (Paints, Thinners & Chemicals)
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

                <div className="space-y-3">
                  {issuedMaterials.map((mat, idx) => (
                    <div key={mat.id} className="bg-[#fafafb] p-4 rounded-[20px] border border-[#ececec] space-y-2 relative group hover:border-[#c09748]/50 transition shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] flex items-center justify-center font-bold text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-xs text-[#17191c]">
                            {idx === 0 ? 'Customer Substrate Component' : `Internal Chemical #${idx}`}
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

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[9px] font-bold text-[#777b86] uppercase mb-0.5">
                            Material / Paint Description *
                          </label>
                          <input
                            type="text"
                            required
                            value={mat.itemDescription}
                            onChange={e => handleUpdateMaterial(mat.id, 'itemDescription', e.target.value)}
                            placeholder="e.g. Monza Red 2K PU Basecoat Paint (PPG)"
                            className="w-full p-2 rounded-[12px] border border-[#ececec] bg-white text-xs font-semibold text-[#17191c] focus:outline-none focus:border-[#c09748]"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-[#777b86] uppercase mb-0.5">
                            Demand Qty & UOM *
                          </label>
                          <div className="flex gap-1">
                            <input
                              type="number"
                              min="1"
                              required
                              value={mat.qty}
                              onChange={e => handleUpdateMaterial(mat.id, 'qty', Number(e.target.value))}
                              className="w-full p-2 rounded-[12px] border border-[#ececec] bg-white text-xs font-mono font-bold text-[#17191c] focus:outline-none focus:border-[#c09748]"
                            />
                            <select
                              value={mat.uom || 'Pcs'}
                              onChange={e => handleUpdateMaterial(mat.id, 'uom', e.target.value)}
                              className="p-2 rounded-[12px] border border-[#ececec] bg-white text-xs font-mono text-[#17191c]"
                            >
                              <option value="Pcs">Pcs</option>
                              <option value="Litres">Ltr</option>
                              <option value="Kg">Kg</option>
                              <option value="Sets">Set</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-[#777b86] uppercase mb-0.5">
                            Mix Ratio / Store Remarks
                          </label>
                          <input
                            type="text"
                            value={mat.remark || ''}
                            onChange={e => handleUpdateMaterial(mat.id, 'remark', e.target.value)}
                            placeholder="e.g. Ratio 4:1:1 / Visc 16s"
                            className="w-full p-2 rounded-[12px] border border-[#ececec] bg-white text-xs text-[#17191c]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION C: 3-STAGE INTER-STAGE PROCESS COUNTS */}
              <div className="bg-[#fafafb] p-5 sm:p-6 rounded-[24px] border border-[#ececec] space-y-4">
                <span className="text-[10px] font-bold text-[#c09748] uppercase tracking-wider font-mono block">
                  3. 3-Stage Process Verification (Target: {targetQty} Pcs)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Stage 1 */}
                  <div className="bg-white p-4 rounded-[18px] border border-[#ececec] space-y-2">
                    <span className="font-bold text-xs text-[#17191c] block">Stage 1: Basecoat Application</span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-[9px] text-[#777b86] block">Inward</span>
                        <input
                          type="number"
                          value={firstStage.totalQty}
                          onChange={e => setFirstStage({ ...firstStage, totalQty: Number(e.target.value) })}
                          className="w-full p-1.5 border border-[#ececec] rounded-lg font-mono font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-[#777b86] block">OK Passed</span>
                        <input
                          type="number"
                          value={firstStage.okQty}
                          onChange={e => setFirstStage({ ...firstStage, okQty: Number(e.target.value) })}
                          className="w-full p-1.5 border border-[#ececec] rounded-lg font-mono font-bold text-emerald-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stage 2 */}
                  <div className="bg-white p-4 rounded-[18px] border border-[#ececec] space-y-2">
                    <span className="font-bold text-xs text-[#17191c] block">Stage 2: Dipping / UV Pattern</span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-[9px] text-[#777b86] block">Inward</span>
                        <input
                          type="number"
                          value={secondStage.totalQty}
                          onChange={e => setSecondStage({ ...secondStage, totalQty: Number(e.target.value) })}
                          className="w-full p-1.5 border border-[#ececec] rounded-lg font-mono font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-[#777b86] block">OK Passed</span>
                        <input
                          type="number"
                          value={secondStage.okQty}
                          onChange={e => setSecondStage({ ...secondStage, okQty: Number(e.target.value) })}
                          className="w-full p-1.5 border border-[#ececec] rounded-lg font-mono font-bold text-emerald-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stage 3 */}
                  <div className="bg-white p-4 rounded-[18px] border border-[#ececec] space-y-2">
                    <span className="font-bold text-xs text-[#17191c] block">Stage 3: Clear Lacquer Curing</span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-[9px] text-[#777b86] block">Inward</span>
                        <input
                          type="number"
                          value={thirdStage.totalQty}
                          onChange={e => setThirdStage({ ...thirdStage, totalQty: Number(e.target.value) })}
                          className="w-full p-1.5 border border-[#ececec] rounded-lg font-mono font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-[#777b86] block">OK Passed</span>
                        <input
                          type="number"
                          value={thirdStage.okQty}
                          onChange={e => setThirdStage({ ...thirdStage, okQty: Number(e.target.value) })}
                          className="w-full p-1.5 border border-[#ececec] rounded-lg font-mono font-bold text-emerald-800"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTON BAR (NO BLACK BUTTONS) */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#ececec]">
                <div className="flex items-center gap-2 text-xs text-[#777b86]">
                  <span>Target Batch: <strong className="text-[#17191c]">{targetQty} Pcs</strong></span>
                  <span>•</span>
                  <span>Painter: <strong className="text-[#8a6521]">{painterName}</strong></span>
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
