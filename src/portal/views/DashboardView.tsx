import React, { useState } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { PortalTab } from '../components/PortalSidebar';
import { QuickInwardModal } from '../components/QuickInwardModal';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Receipt, 
  ArrowRightLeft, 
  ShieldAlert, 
  Boxes, 
  Plus, 
  ArrowRight, 
  Clock,
  Sparkles,
  Moon,
  Sun,
  RotateCcw,
  UserCheck,
  Activity,
  Layers,
  ShieldCheck,
  Hammer,
  Filter,
  Building2,
  Zap,
  Calendar,
  Flag,
  Check,
  Send,
  X
} from 'lucide-react';
import { DefectCategory, ProductionPriorityLevel, PlantHeadPriorityAssignment, ShiftType } from '../types/portalTypes';

interface DashboardViewProps {
  onNavigateTab: (tab: PortalTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab }) => {
  const {
    jobCards,
    grnList = [],
    plantHeadPriorities = [],
    assignProductionPriority,
    currentUser, 
    handovers, 
    billingInvoices, 
    defects, 
    activePlant, 
    activeShift,
    unresolvedHandoversCount,
    openOverrunCount,
    dayEndClosures,
    isPlantDayClosed,
    executeDayEndClosure,
    reopenPlant,
    routeToRework
  } = usePortalStore();

  
  // Plant Head Store Priority Scheduling State
  const [showPriorityModal, setShowPriorityModal] = useState<boolean>(false);
  const [selectedStockForPriority, setSelectedStockForPriority] = useState<any | null>(null);
  const [priorityLevelInput, setPriorityLevelInput] = useState<ProductionPriorityLevel>('P1_URGENT');
  const [targetDateInput, setTargetDateInput] = useState<string>(new Date().toISOString().split('T')[0]);
  const [targetShiftInput, setTargetShiftInput] = useState<ShiftType>('General Day Shift (08:30 - 18:30)');
  const [instructionsInput, setInstructionsInput] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'P1_URGENT' | 'P2_HIGH' | 'P3_NORMAL' | 'HOLD' | 'UNASSIGNED'>('ALL');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Synchronized Store Stock Items with Priority Status
  const storeStockItems = React.useMemo(() => {
    return grnList
      .filter(g => g.iqcStatus !== 'Rejected')
      .map(grn => {
        const partCode = grn.items?.[0]?.partCode || grn.partCode || 'SUBSTRATE';
        const partDesc = grn.items?.[0]?.partDescription || grn.description || 'Raw Molded Components';
        const totalInward = grn.totalQty || grn.actualReceivedQty || grn.invoicedQty || 0;
        const uom = 'Pcs';
        const customer = grn.supplierCustomer;

        const matchingJobCards = jobCards.filter(jc => 
          (jc.customer && jc.customer.trim().toLowerCase() === customer.trim().toLowerCase()) ||
          (jc.partCode && jc.partCode.trim().toLowerCase() === partCode.trim().toLowerCase()) ||
          (jc.woNo && grn.invoiceChallanNo && jc.woNo.includes(grn.invoiceChallanNo)) ||
          (jc.wNo && grn.invoiceChallanNo && jc.wNo.includes(grn.invoiceChallanNo))
        );
        const primaryJobCards = matchingJobCards.filter(jc => jc.jobCardType === 'master' || (!jc.jobCardType && !jc.parentJobCardId));
        const totalIssuedToFloor = primaryJobCards.reduce((acc, curr) => acc + (Number(curr.targetQty) || 0), 0);
        const balanceAvailable = Math.max(0, totalInward - totalIssuedToFloor);

        const priority = plantHeadPriorities.find(p => 
          (p.grnNo && p.grnNo === grn.grnNo) ||
          (p.customer.toLowerCase().trim() === customer.toLowerCase().trim() && p.partCode.toLowerCase().trim() === partCode.toLowerCase().trim())
        );

        return {
          grnNo: grn.grnNo,
          challanNo: grn.invoiceChallanNo,
          receivedDate: grn.receivedDate || grn.date,
          customer,
          partCode,
          partDesc,
          uom,
          totalInward,
          totalIssuedToFloor,
          balanceAvailable,
          priorityRecord: priority,
          vehicleNo: grn.vehicleNo
        };
      });
  }, [grnList, jobCards, plantHeadPriorities]);

  const p1Count = storeStockItems.filter(s => s.priorityRecord?.priorityLevel === 'P1_URGENT').length;
  const p2Count = storeStockItems.filter(s => s.priorityRecord?.priorityLevel === 'P2_HIGH').length;
  const p3Count = storeStockItems.filter(s => s.priorityRecord?.priorityLevel === 'P3_NORMAL').length;
  const unassignedCount = storeStockItems.filter(s => !s.priorityRecord).length;

  const filteredStoreStockItems = React.useMemo(() => {
    return storeStockItems.filter(item => {
      if (priorityFilter === 'ALL') return true;
      if (priorityFilter === 'UNASSIGNED') return !item.priorityRecord;
      return item.priorityRecord?.priorityLevel === priorityFilter;
    });
  }, [storeStockItems, priorityFilter]);

  const handleOpenPriorityModal = (stockItem: any) => {
    setSelectedStockForPriority(stockItem);
    const existing = stockItem.priorityRecord;
    if (existing) {
      setPriorityLevelInput(existing.priorityLevel);
      setTargetDateInput(existing.targetDate || new Date().toISOString().split('T')[0]);
      setTargetShiftInput(existing.targetShift || 'General Day Shift (08:30 - 18:30)');
      setInstructionsInput(existing.plantHeadRemarks || '');
    } else {
      setPriorityLevelInput('P1_URGENT');
      setTargetDateInput(new Date().toISOString().split('T')[0]);
      setTargetShiftInput('General Day Shift (08:30 - 18:30)');
      setInstructionsInput(`Critical batch order for ${stockItem.customer}. Run as planned priority.`);
    }
    setShowPriorityModal(true);
  };

  const handleSavePriority = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockForPriority) return;

    assignProductionPriority({
      grnNo: selectedStockForPriority.grnNo,
      challanNo: selectedStockForPriority.challanNo,
      customer: selectedStockForPriority.customer,
      partCode: selectedStockForPriority.partCode,
      partDescription: selectedStockForPriority.partDesc,
      availableQty: selectedStockForPriority.balanceAvailable,
      uom: selectedStockForPriority.uom,
      priorityLevel: priorityLevelInput,
      targetDate: targetDateInput,
      targetShift: targetShiftInput,
            assignedToProductionManager: 'Vikram Patel (Production Manager)',
      plantHeadRemarks: instructionsInput || `Run with priority by Vikram Patel.`,
      assignedBy: `${currentUser.name} (${currentUser.roleTitle})`,
      plant: activePlant
    });

    setShowPriorityModal(false);
    setToastMsg(`✓ Priority successfully assigned for ${selectedStockForPriority.customer} (${priorityLevelInput.replace('_', ' ')}) to Production Manager!`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const [showInwardModal, setShowInwardModal] = useState<boolean>(false);
  const [showEodModal, setShowEodModal] = useState<boolean>(false);
  const [eodRemarks, setEodRemarks] = useState<string>('');

  // Rework Route Modal
  const [showReworkModal, setShowReworkModal] = useState<boolean>(false);
  const [selectedParentJc, setSelectedParentJc] = useState<string>('JC-1042-RED');
  const [reworkQtyInput, setReworkQtyInput] = useState<number>(10);
  const [defectCatInput, setDefectCatInput] = useState<DefectCategory>('dust_nibs');
  const [reworkInstructionsInput, setReworkInstructionsInput] = useState<string>('De-nib with 1500 grit, solvent clean and apply 1 touch-up mist coat.');

  // High-signal Operational Aggregations
  const masterJobCards = jobCards.filter(j => j.jobCardType === 'master' || (!j.jobCardType && !j.parentJobCardId));
  const painterChildCards = jobCards.filter(j => j.jobCardType === 'painter_child');
  const reworkChildCards = jobCards.filter(j => j.jobCardType === 'rework_child');

  const totalSprayed = jobCards.reduce((acc, curr) => acc + (curr.sprayedQty || 0), 0);
  const totalGood = jobCards.reduce((acc, curr) => acc + (curr.goodQty || 0), 0);
  const totalReworkQueue = reworkChildCards.filter(r => r.status !== 'Completed').reduce((acc, curr) => acc + (curr.targetQty || 0), 0);
  const totalReworkRecovered = reworkChildCards.reduce((acc, curr) => acc + (curr.reworkRecoveredQty || 0), 0);
  const totalScrap = jobCards.reduce((acc, curr) => acc + (curr.scrapQty || 0), 0);
  
  const firstPassYield = totalSprayed > 0 ? (((totalSprayed - totalReworkQueue - totalScrap) / totalSprayed) * 100).toFixed(1) : '98.2';
  const reworkRecoveryRate = (totalReworkRecovered + totalScrap) > 0 
    ? ((totalReworkRecovered / (totalReworkRecovered + totalScrap)) * 100).toFixed(1)
    : '94.3';

  const totalInvoicedRevenue = billingInvoices.reduce((acc, curr) => acc + curr.grandTotal, 0);

  // 3-Painters Specific Metrics
  const painter1Card = painterChildCards.find(p => p.assignedPainterName?.includes('Painter 1') || p.jobCardNo.includes('-P1'));
  const painter2Card = painterChildCards.find(p => p.assignedPainterName?.includes('Painter 2') || p.jobCardNo.includes('-P2'));
  const painter3Card = painterChildCards.find(p => p.assignedPainterName?.includes('Painter 3') || p.jobCardNo.includes('-P3'));

  const p1Sprayed = painter1Card?.sprayedQty || 650;
  const p1Target = painter1Card?.targetQty || 1000;
  const p1Good = painter1Card?.firstPassGoodQty || 638;
  const p1Rework = painter1Card?.reworkFlaggedQty || 12;

  const p2Sprayed = painter2Card?.sprayedQty || 620;
  const p2Target = painter2Card?.targetQty || 1000;
  const p2Good = painter2Card?.firstPassGoodQty || 611;
  const p2Rework = painter2Card?.reworkFlaggedQty || 9;

  const p3Sprayed = painter3Card?.sprayedQty || 640;
  const p3Target = painter3Card?.targetQty || 1000;
  const p3Good = painter3Card?.firstPassGoodQty || 626;
  const p3Rework = painter3Card?.reworkFlaggedQty || 14;

  const handleConfirmEod = () => {
    executeDayEndClosure(eodRemarks);
    setShowEodModal(false);
  };

  const handleRouteReworkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    routeToRework(selectedParentJc, reworkQtyInput, defectCatInput, reworkInstructionsInput);
    setShowReworkModal(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Operational State */}
      <div className="bg-white rounded-[24px] p-6 border border-[#ececec] shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-[#faf3e0] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold border border-[#f4e5be]">
                PK-OPS-DSH-001 • VASAI PLANT
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                isPlantDayClosed 
                  ? 'bg-rose-50 text-rose-800 border-rose-200' 
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                {isPlantDayClosed ? (
                  <>
                    <Moon className="w-3.5 h-3.5 text-rose-600" />
                    <span>EOD Shutdown (Locked for Night)</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Single General Day Shift: Active (08:30 – 18:30)</span>
                  </>
                )}
              </span>
            </div>
            <h1 className="text-3xl font-serif font-normal tracking-tight text-[#17191c]">
              {activePlant} Operations Cockpit
            </h1>
            <p className="text-xs text-[#777b86] mt-1">
              Real-time monitoring: 3-Painter Line Parity, Rework Recovery, and Single Shift Production Flow.
            </p>
          </div>

          {/* Quick Primary Actions */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <button
              onClick={() => setShowInwardModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#17191c]" />
              <span>+ Inward Intake (GRN)</span>
            </button>

            <button
              onClick={() => setShowReworkModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#fafafb] hover:bg-[#f2f2f3] border border-[#ececec] text-[#17191c] text-xs font-semibold transition cursor-pointer"
            >
              <Hammer className="w-4 h-4 text-[#c09748]" />
              <span>+ Route to Rework</span>
            </button>

            {isPlantDayClosed ? (
              <button
                onClick={reopenPlant}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
              >
                <Sun className="w-4 h-4 text-white" />
                <span>Re-open Morning Shift</span>
              </button>
            ) : (
              <button
                onClick={() => setShowEodModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#17191c] hover:bg-gray-800 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
              >
                <Moon className="w-4 h-4 text-[#c09748]" />
                <span>Day-End (EOD) Shutdown</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Top Metric Cards (High Signal, Crisp Data) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Daily Output */}
        <div className="bg-white p-4 rounded-[20px] border border-[#ececec] shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#777b86]">Today's Sprayed</div>
          <div className="text-2xl font-serif font-normal text-[#17191c] mt-1.5">{totalSprayed.toLocaleString()} <span className="text-xs font-sans text-[#777b86]">/ 2,000 pcs</span></div>
          <div className="text-[10px] text-emerald-700 flex items-center gap-1 mt-1 font-medium">
            <TrendingUp className="w-3 h-3 text-emerald-600" /> 95.5% Shift Target Met
          </div>
        </div>

        {/* First Pass Yield */}
        <div className="bg-white p-4 rounded-[20px] border border-[#ececec] shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#777b86]">First Pass Yield</div>
          <div className="text-2xl font-serif font-normal text-emerald-700 mt-1.5">{firstPassYield}%</div>
          <div className="text-[10px] text-[#777b86] mt-1">Zero Touch-Up Passed</div>
        </div>

        {/* Rework Queue & Recovery Rate */}
        <div className="bg-white p-4 rounded-[20px] border border-[#ececec] shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#777b86]">Rework Recovery</div>
          <div className="text-2xl font-serif font-normal text-[#c09748] mt-1.5">{reworkRecoveryRate}%</div>
          <div className="text-[10px] text-emerald-700 mt-1 font-medium">33/35 Salvaged from Defect</div>
        </div>

        {/* Irrecoverable Scrap Rate */}
        <div className="bg-white p-4 rounded-[20px] border border-[#ececec] shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#777b86]">Irrecoverable Scrap</div>
          <div className="text-2xl font-serif font-normal text-rose-600 mt-1.5">{totalScrap} pcs</div>
          <div className="text-[10px] text-emerald-700 font-medium mt-1">0.10% (OEM Spec &lt;0.5%)</div>
        </div>

        {/* Active Line Orders */}
        <div className="bg-white p-4 rounded-[20px] border border-[#ececec] shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#777b86]">Active WIP Lots</div>
          <div className="text-2xl font-serif font-normal text-[#17191c] mt-1.5">{masterJobCards.length} Batches</div>
          <div className="text-[10px] text-[#777b86] mt-1">3 Line Booths Engaged</div>
        </div>

        {/* Billed Revenue */}
        <div className="bg-white p-4 rounded-[20px] border border-[#ececec] shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#777b86]">Billed Value</div>
          <div className="text-xl font-serif font-normal text-[#17191c] mt-1.5">₹{totalInvoicedRevenue.toLocaleString()}</div>
          <div className="text-[10px] text-emerald-700 font-medium mt-1">Delivered Parts Only</div>
        </div>
      </div>

      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#17191c] text-[#c09748] px-5 py-3 rounded-full shadow-2xl border border-[#c09748]/40 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2.5 PLANT HEAD STORE STOCK & DAILY PRODUCTION PRIORITY ALLOCATOR DESK    */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-[24px] p-5 sm:p-6 border border-[#ececec] shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#ececec]">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-[#c09748] animate-pulse" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8a6521] bg-[#faf3e0] px-2.5 py-0.5 rounded-full border border-[#f4e5be]">
                PLANT HEAD SCHEDULER • SATISH SHARMA
              </span>
              <span className="text-[10px] font-mono text-[#777b86]">
                Target Assignee: <strong>Vikram Patel (Production Manager)</strong>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-normal text-[#17191c] tracking-tight">
              Store Material Stock & Production Priority Allocator
            </h2>
            <p className="text-xs text-[#777b86] mt-1">
              Store me aaye huye sabhi raw substrates aur paint stock ki list. Plant Head delivery SLA aur line constraints dekh kar <strong>P1 Urgent, P2 High, P3 Normal</strong> priority assign karta hai jo direct Production Manager ke dashboard me reflect hoti hai.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => onNavigateTab('jobcards')}
              className="px-4 py-2 rounded-full bg-[#17191c] hover:bg-black text-[#c09748] text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
            >
              <span>View Production Queue</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#c09748]" />
            </button>
          </div>
        </div>

        {/* Priority KPI Metric Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div 
            onClick={() => setPriorityFilter('ALL')}
            className={`p-3 rounded-[16px] border cursor-pointer transition flex flex-col justify-between ${
              priorityFilter === 'ALL' ? 'bg-[#fafafb] border-[#17191c] shadow-xs' : 'bg-white border-[#ececec] hover:border-[#c09748]'
            }`}
          >
            <span className="text-[10px] font-bold text-[#777b86] uppercase font-mono">Total Store Lots</span>
            <div className="text-lg font-serif font-bold text-[#17191c] mt-1">{storeStockItems.length} Lots</div>
            <span className="text-[10px] text-[#777b86]">All Inwarded Lots</span>
          </div>

          <div 
            onClick={() => setPriorityFilter('P1_URGENT')}
            className={`p-3 rounded-[16px] border cursor-pointer transition flex flex-col justify-between ${
              priorityFilter === 'P1_URGENT' ? 'bg-rose-50 border-rose-300 shadow-xs' : 'bg-white border-[#ececec] hover:border-rose-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-rose-800 uppercase font-mono flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                P1 - Urgent
              </span>
              <span className="text-[9px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded">Line Risk</span>
            </div>
            <div className="text-lg font-serif font-bold text-rose-700 mt-1">{p1Count} Batches</div>
            <span className="text-[10px] text-rose-600">Immediate Run Required</span>
          </div>

          <div 
            onClick={() => setPriorityFilter('P2_HIGH')}
            className={`p-3 rounded-[16px] border cursor-pointer transition flex flex-col justify-between ${
              priorityFilter === 'P2_HIGH' ? 'bg-amber-50 border-amber-300 shadow-xs' : 'bg-white border-[#ececec] hover:border-amber-300'
            }`}
          >
            <span className="text-[10px] font-bold text-amber-800 uppercase font-mono">P2 - High Priority</span>
            <div className="text-lg font-serif font-bold text-amber-800 mt-1">{p2Count} Batches</div>
            <span className="text-[10px] text-amber-700">Next In-Line Queue</span>
          </div>

          <div 
            onClick={() => setPriorityFilter('P3_NORMAL')}
            className={`p-3 rounded-[16px] border cursor-pointer transition flex flex-col justify-between ${
              priorityFilter === 'P3_NORMAL' ? 'bg-blue-50 border-blue-300 shadow-xs' : 'bg-white border-[#ececec] hover:border-blue-300'
            }`}
          >
            <span className="text-[10px] font-bold text-blue-800 uppercase font-mono">P3 - Standard</span>
            <div className="text-lg font-serif font-bold text-blue-800 mt-1">{p3Count} Batches</div>
            <span className="text-[10px] text-blue-600">FIFO Schedule</span>
          </div>

          <div 
            onClick={() => setPriorityFilter('UNASSIGNED')}
            className={`p-3 rounded-[16px] border cursor-pointer transition flex flex-col justify-between ${
              priorityFilter === 'UNASSIGNED' ? 'bg-gray-100 border-gray-400 shadow-xs' : 'bg-white border-[#ececec] hover:border-gray-400'
            }`}
          >
            <span className="text-[10px] font-bold text-gray-600 uppercase font-mono">Unassigned</span>
            <div className="text-lg font-serif font-bold text-gray-700 mt-1">{unassignedCount} Lots</div>
            <span className="text-[10px] text-gray-500">Awaiting Priority</span>
          </div>
        </div>

        {/* Priority Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[#777b86] font-semibold mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#c09748]" /> Filter:
            </span>
            {(['ALL', 'P1_URGENT', 'P2_HIGH', 'P3_NORMAL', 'UNASSIGNED'] as const).map(tabKey => (
              <button
                key={tabKey}
                onClick={() => setPriorityFilter(tabKey)}
                className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition ${
                  priorityFilter === tabKey 
                    ? 'bg-[#17191c] text-[#c09748]' 
                    : 'bg-[#fafafb] text-[#777b86] border border-[#ececec] hover:border-[#c09748]'
                }`}
              >
                {tabKey === 'ALL' ? 'All Store Lots' : tabKey === 'P1_URGENT' ? '🚨 P1 Urgent' : tabKey === 'P2_HIGH' ? '⚡ P2 High' : tabKey === 'P3_NORMAL' ? '📋 P3 Standard' : '⏳ Unassigned'}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-[#777b86] font-mono">
            Showing <strong>{filteredStoreStockItems.length}</strong> material lots in Store
          </span>
        </div>

        {/* Desktop Table of Store Stock & Plant Head Priority */}
        <div className="hidden md:block overflow-x-auto border border-[#ececec] rounded-[18px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#fafafb] text-[#777b86] font-semibold uppercase text-[10px] tracking-wider border-b border-[#ececec]">
                <th className="p-3.5">Party / Customer</th>
                <th className="p-3.5">Part Code & Description</th>
                <th className="p-3.5">GRN & Challan</th>
                <th className="p-3.5 text-center">Store Balance</th>
                <th className="p-3.5">Assigned Priority Level</th>
                <th className="p-3.5">Target Date & Floor Directive</th>
                <th className="p-3.5 text-right">Plant Head Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ececec] text-[#17191c]">
              {filteredStoreStockItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#777b86]">
                    No material lots found matching the selected priority filter.
                  </td>
                </tr>
              ) : (
                filteredStoreStockItems.map((item, idx) => {
                  const prio = item.priorityRecord;
                  const isP1 = prio?.priorityLevel === 'P1_URGENT';
                  const isP2 = prio?.priorityLevel === 'P2_HIGH';
                  const isP3 = prio?.priorityLevel === 'P3_NORMAL';
                  const isHold = prio?.priorityLevel === 'HOLD';
                  const isJobCardCreated = prio?.status === 'Job Card Launched' || prio?.status === 'Completed';

                  return (
                    <tr key={idx} className={`hover:bg-[#fafafb] transition ${isP1 ? 'bg-rose-50/15' : ''}`}>
                      <td className="p-3.5">
                        <div className="font-bold text-[#17191c] flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#c09748]" />
                          <span>{item.customer}</span>
                        </div>
                        <div className="text-[10px] font-mono text-[#777b86] mt-0.5">Rec: {item.receivedDate}</div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-mono font-bold text-[#8a6521]">{item.partCode}</div>
                        <div className="text-[11px] text-[#777b86] truncate max-w-[220px]">{item.partDesc}</div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-mono font-bold text-[#17191c] text-[11px]">{item.grnNo}</div>
                        <div className="text-[10px] text-[#777b86] font-mono">Challan: {item.challanNo}</div>
                      </td>

                      <td className="p-3.5 text-center">
                        <span className={`font-mono font-bold text-xs px-2.5 py-1 rounded-full inline-block border ${
                          item.balanceAvailable > 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}>
                          {item.balanceAvailable.toLocaleString('en-IN')} {item.uom}
                        </span>
                        <div className="text-[10px] text-[#777b86] font-mono mt-0.5">Inward: {item.totalInward} {item.uom}</div>
                      </td>

                      <td className="p-3.5">
                        {prio ? (
                          <div className="space-y-1">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold border ${
                              isP1 
                                ? 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-200 animate-pulse' 
                                : isP2 
                                  ? 'bg-amber-50 text-amber-800 border-amber-300' 
                                  : isP3 
                                    ? 'bg-blue-50 text-blue-800 border-blue-200' 
                                    : 'bg-gray-100 text-gray-700 border-gray-300'
                            }`}>
                              <Zap className="w-3 h-3" />
                              <span>{isP1 ? 'P1 - URGENT (Line Risk)' : isP2 ? 'P2 - HIGH PRIORITY' : isP3 ? 'P3 - STANDARD FIFO' : 'HOLD'}</span>
                            </span>
                            
                          </div>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono text-gray-500 bg-gray-100 border border-dashed border-gray-300">
                            ⏳ Unscheduled
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        {prio ? (
                          <div className="space-y-0.5">
                            <div className="text-[11px] font-semibold text-[#17191c] flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-[#c09748]" />
                              <span>Target: {prio.targetDate}</span>
                            </div>
                            <div className="text-[10px] text-[#8a6521] italic bg-[#faf7ed] p-1.5 rounded-md border border-[#f4e5be] line-clamp-2">
                              "{prio.plantHeadRemarks}"
                            </div>
                            <div className="text-[9px] text-[#777b86]">
                              Status: {isJobCardCreated ? <strong className="text-emerald-700">✓ Job Card Launched ({prio.linkedJobCardNo || 'Active'})</strong> : <strong className="text-amber-700">Assigned to Vikram Patel</strong>}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">No directives assigned yet</span>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenPriorityModal(item)}
                          className="px-3.5 py-1.5 rounded-full bg-[#17191c] hover:bg-black text-[#c09748] font-bold text-xs shadow-2xs cursor-pointer transition inline-flex items-center gap-1.5 ml-auto active:scale-95"
                        >
                          <Flag className="w-3.5 h-3.5 text-[#c09748]" />
                          <span>{prio ? 'Edit Priority' : '+ Assign Priority'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards for Store Stock & Priority */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {filteredStoreStockItems.map((item, idx) => {
            const prio = item.priorityRecord;
            const isP1 = prio?.priorityLevel === 'P1_URGENT';
            return (
              <div 
                key={idx}
                className={`p-4 rounded-[18px] border bg-white space-y-3 shadow-2xs ${isP1 ? 'border-rose-200 bg-rose-50/10' : 'border-[#ececec]'}`}
              >
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#ececec]">
                  <div>
                    <span className="font-bold text-xs text-[#17191c]">{item.customer}</span>
                    <div className="font-mono text-[10px] text-[#8a6521]">{item.partCode}</div>
                  </div>
                  {prio ? (
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                      isP1 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {prio.priorityLevel.replace('_', ' ')}
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400 font-mono">Unassigned</span>
                  )}
                </div>

                <div className="text-xs text-[#777b86]">
                  {item.partDesc} • Store Bal: <strong className="text-[#17191c] font-mono">{item.balanceAvailable} {item.uom}</strong>
                </div>

                {prio && (
                  <div className="p-2.5 rounded-[12px] bg-[#fafafb] border border-[#ececec] text-xs space-y-1">
                    <div className="flex justify-between font-semibold text-[#17191c]">
                      <span>Target Date: {prio.targetDate}</span>
                      
                    </div>
                    <p className="text-[11px] text-[#8a6521] italic">"{prio.plantHeadRemarks}"</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleOpenPriorityModal(item)}
                  className="w-full py-2.5 rounded-full bg-[#17191c] text-[#c09748] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
                >
                  <Flag className="w-3.5 h-3.5 text-[#c09748]" />
                  <span>{prio ? 'Update Priority Order' : '+ Set Priority for Production'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. The 3 Line Painters Output & Parity Grid (Confirmed Floor Architecture) */}
      <div className="bg-white rounded-[24px] p-6 border border-[#ececec] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#ececec]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#c09748]"></span>
              <h2 className="text-base font-serif font-medium text-[#17191c]">
                3-Painter Line Allocation & Daily Output Parity
              </h2>
            </div>
            <p className="text-xs text-[#777b86] mt-0.5">
              1 Master Batch divides across 3 line painters for strict individual operator accountability.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Line Balanced: 98.4% Pace Parity (Zero Bottlenecks)</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Painter 1: Ramesh Kumar */}
          <div className="p-4 rounded-[20px] bg-[#fafafb] border border-[#ececec] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#c09748]">
                  BOOTH #1 • CONVEYOR LINE
                </span>
                <h3 className="font-serif font-medium text-sm text-[#17191c]">Ramesh Kumar (P1)</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#ececec] text-xs font-mono font-bold text-[#17191c]">
                JC-1042-RED-P1
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-white rounded-[14px] border border-[#ececec]">
                <div className="text-[10px] text-[#777b86] uppercase font-semibold">Allocated</div>
                <div className="font-bold text-[#17191c] mt-0.5">{p1Target} pcs</div>
              </div>
              <div className="p-2 bg-emerald-50/60 rounded-[14px] border border-emerald-200/60">
                <div className="text-[10px] text-emerald-800 uppercase font-semibold">First Pass</div>
                <div className="font-bold text-emerald-700 mt-0.5">{p1Good} pcs</div>
              </div>
              <div className="p-2 bg-amber-50/60 rounded-[14px] border border-amber-200/60">
                <div className="text-[10px] text-amber-800 uppercase font-semibold">To Rework</div>
                <div className="font-bold text-amber-700 mt-0.5">{p1Rework} pcs</div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-[#777b86]">
                <span>Progress: {p1Sprayed} / {p1Target} pcs</span>
                <span className="font-semibold text-[#17191c]">{((p1Sprayed / p1Target) * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#c09748] rounded-full" style={{ width: `${(p1Sprayed / p1Target) * 100}%` }}></div>
              </div>
            </div>
          </div>

          {/* Painter 2: Suresh Verma */}
          <div className="p-4 rounded-[20px] bg-[#fafafb] border border-[#ececec] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#c09748]">
                  BOOTH #2 • ENCLOSED CLEANROOM
                </span>
                <h3 className="font-serif font-medium text-sm text-[#17191c]">Suresh Verma (P2)</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#ececec] text-xs font-mono font-bold text-[#17191c]">
                JC-1042-RED-P2
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-white rounded-[14px] border border-[#ececec]">
                <div className="text-[10px] text-[#777b86] uppercase font-semibold">Allocated</div>
                <div className="font-bold text-[#17191c] mt-0.5">{p2Target} pcs</div>
              </div>
              <div className="p-2 bg-emerald-50/60 rounded-[14px] border border-emerald-200/60">
                <div className="text-[10px] text-emerald-800 uppercase font-semibold">First Pass</div>
                <div className="font-bold text-emerald-700 mt-0.5">{p2Good} pcs</div>
              </div>
              <div className="p-2 bg-amber-50/60 rounded-[14px] border border-amber-200/60">
                <div className="text-[10px] text-amber-800 uppercase font-semibold">To Rework</div>
                <div className="font-bold text-amber-700 mt-0.5">{p2Rework} pcs</div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-[#777b86]">
                <span>Progress: {p2Sprayed} / {p2Target} pcs</span>
                <span className="font-semibold text-[#17191c]">{((p2Sprayed / p2Target) * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#c09748] rounded-full" style={{ width: `${(p2Sprayed / p2Target) * 100}%` }}></div>
              </div>
            </div>
          </div>

          {/* Painter 3: Mahesh Sharma */}
          <div className="p-4 rounded-[20px] bg-[#fafafb] border border-[#ececec] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#c09748]">
                  BOOTH #3 • HIGH-GLOSS CHAMBER
                </span>
                <h3 className="font-serif font-medium text-sm text-[#17191c]">Mahesh Sharma (P3)</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#ececec] text-xs font-mono font-bold text-[#17191c]">
                JC-1042-RED-P3
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-white rounded-[14px] border border-[#ececec]">
                <div className="text-[10px] text-[#777b86] uppercase font-semibold">Allocated</div>
                <div className="font-bold text-[#17191c] mt-0.5">{p3Target} pcs</div>
              </div>
              <div className="p-2 bg-emerald-50/60 rounded-[14px] border border-emerald-200/60">
                <div className="text-[10px] text-emerald-800 uppercase font-semibold">First Pass</div>
                <div className="font-bold text-emerald-700 mt-0.5">{p3Good} pcs</div>
              </div>
              <div className="p-2 bg-amber-50/60 rounded-[14px] border border-amber-200/60">
                <div className="text-[10px] text-amber-800 uppercase font-semibold">To Rework</div>
                <div className="font-bold text-amber-700 mt-0.5">{p3Rework} pcs</div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-[#777b86]">
                <span>Progress: {p3Sprayed} / {p3Target} pcs</span>
                <span className="font-semibold text-[#17191c]">{((p3Sprayed / p3Target) * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#c09748] rounded-full" style={{ width: `${(p3Sprayed / p3Target) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Two Clean Operational Centers (60% Live Batches, 40% Rework & Quality Gate) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Live Floor Batches (60%) */}
        <div className="lg:col-span-7 bg-white rounded-[24px] p-6 border border-[#ececec] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#ececec]">
            <div>
              <h2 className="font-serif font-medium text-base text-[#17191c]">Active Manufacturing Batches</h2>
              <p className="text-xs text-[#777b86]">Master Orders & their child line splits</p>
            </div>
            <button
              onClick={() => onNavigateTab('jobcards')}
              className="text-xs font-semibold text-[#c09748] hover:text-[#a97e35] flex items-center gap-1 cursor-pointer"
            >
              <span>View All Job Cards</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {masterJobCards.slice(0, 3).map((jc) => {
              const children = jobCards.filter(c => c.parentJobCardId === jc.jobCardNo);
              const p1 = children.find(c => c.jobCardNo.endsWith('-P1'));
              const p2 = children.find(c => c.jobCardNo.endsWith('-P2'));
              const p3 = children.find(c => c.jobCardNo.endsWith('-P3'));
              const rw = children.find(c => c.jobCardType === 'rework_child');

              return (
                <div key={jc.jobCardNo} className="p-4 rounded-[20px] bg-[#fafafb] border border-[#ececec] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#c09748]">{jc.jobCardNo}</span>
                        <span className="text-xs font-semibold text-[#17191c]">• {jc.customer}</span>
                      </div>
                      <div className="text-xs text-[#777b86] mt-0.5">
                        {jc.partDescription} ({jc.color})
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200">
                        {jc.status}
                      </span>
                      <span className="text-xs font-mono font-bold text-[#17191c]">
                        {jc.targetQty} pcs
                      </span>
                    </div>
                  </div>

                  {/* 3-Painter Sub-Card Breakdown Pills */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#ececec]">
                    <span className="text-[10px] font-semibold uppercase text-[#777b86] tracking-wider">Line Splits:</span>
                    <span className="px-2.5 py-1 rounded-full bg-white border border-[#ececec] text-[11px] font-medium text-[#17191c]">
                      P1: <strong className="text-emerald-700">{p1?.sprayedQty || 650}</strong>/{p1?.targetQty || 1000}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-white border border-[#ececec] text-[11px] font-medium text-[#17191c]">
                      P2: <strong className="text-emerald-700">{p2?.sprayedQty || 620}</strong>/{p2?.targetQty || 1000}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-white border border-[#ececec] text-[11px] font-medium text-[#17191c]">
                      P3: <strong className="text-emerald-700">{p3?.sprayedQty || 640}</strong>/{p3?.targetQty || 1000}
                    </span>
                    {rw && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-800">
                        🔁 RW: {rw.reworkRecoveredQty || 33}/{rw.targetQty} pcs Recovered
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Formal Rework & Recovery Hub (40%) */}
        <div className="lg:col-span-5 bg-white rounded-[24px] p-6 border border-[#ececec] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#ececec]">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-full bg-[#faf3e0] text-[#8a6521]">
                <RotateCcw className="w-4 h-4 text-[#c09748]" />
              </span>
              <div>
                <h2 className="font-serif font-medium text-base text-[#17191c]">Rework & Salvage Hub</h2>
                <p className="text-xs text-[#777b86]">Dedicated defect recovery pipeline</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
              {totalReworkQueue} Pcs In Process
            </span>
          </div>

          {/* Rework Protocol Pipeline Steps */}
          <div className="p-3.5 rounded-[18px] bg-[#fafafb] border border-[#ececec] space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#777b86]">Standard Rework Protocol:</span>
            <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
              <div className="p-1.5 bg-white rounded-xl border border-[#ececec]">
                <div className="font-bold text-[#17191c]">1. Sanding</div>
                <div className="text-[9px] text-[#777b86]">1500 Grit</div>
              </div>
              <div className="p-1.5 bg-white rounded-xl border border-[#ececec]">
                <div className="font-bold text-[#17191c]">2. Clean</div>
                <div className="text-[9px] text-[#777b86]">Solvent Wipe</div>
              </div>
              <div className="p-1.5 bg-white rounded-xl border border-[#ececec]">
                <div className="font-bold text-[#17191c]">3. Re-coat</div>
                <div className="text-[9px] text-[#777b86]">Mist Topcoat</div>
              </div>
              <div className="p-1.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="font-bold text-emerald-800">4. Re-bake</div>
                <div className="text-[9px] text-emerald-700">75°C Cured</div>
              </div>
            </div>
          </div>

          {/* Active Rework Card Preview */}
          <div className="space-y-2.5">
            {reworkChildCards.map((rw) => (
              <div key={rw.jobCardNo} className="p-3.5 rounded-[18px] bg-[#faf7ed] border border-[#f4e5be] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-xs text-[#8a6521]">{rw.jobCardNo}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-[#f4e5be] font-semibold text-[#8a6521]">
                      {rw.defectCategory?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#17191c]">
                    {rw.goodQty} / {rw.targetQty} Pcs Cleared
                  </span>
                </div>
                <p className="text-[11px] text-[#777b86] leading-relaxed">
                  {rw.reworkInstructions || 'De-nib surface with 1500 grit abrasive paper and re-spray.'}
                </p>
                <div className="flex items-center justify-between pt-1.5 border-t border-[#f4e5be]/60 text-[10px] text-emerald-800 font-semibold">
                  <span>✓ 33 Saved from Scrapping</span>
                  <span className="text-rose-700">2 Discarded (Substrate Crack)</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigateTab('qa')}
            className="w-full py-2.5 rounded-full bg-[#17191c] hover:bg-gray-800 text-white text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-[#c09748]" />
            <span>Open Quality & Rework Clearance Queue</span>
          </button>
        </div>
      </div>

      {/* MODAL: Daily Day-End (EOD) Shutdown Modal */}
      {showEodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-6 space-y-5 border border-[#ececec] shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#ececec]">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-full bg-[#17191c] text-[#c09748]">
                  <Moon className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-serif font-medium text-lg text-[#17191c]">
                    Execute Evening Plant Shutdown (EOD)
                  </h3>
                  <p className="text-xs text-[#777b86]">
                    Single General Day Shift • Vasai Unit
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEodModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-[#fafafb] rounded-[18px] border border-[#ececec] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#777b86]">Total Sprayed Today:</span>
                <span className="font-bold text-[#17191c]">{totalSprayed} pcs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777b86]">First-Pass Accepted:</span>
                <span className="font-bold text-emerald-700">{totalGood} pcs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777b86]">Pending in Rework Racks:</span>
                <span className="font-bold text-amber-700">{totalReworkQueue} pcs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777b86]">Total Non-Salvageable Scrap:</span>
                <span className="font-bold text-rose-700">{totalScrap} pcs</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#777b86]">
                Supervisor Evening Handover & Cleaning Notes
              </label>
              <textarea
                value={eodRemarks}
                onChange={(e) => setEodRemarks(e.target.value)}
                rows={3}
                placeholder="Spray booths flushed with thinner, exhaust filters purged, overnight WIP locked in designated holding bays..."
                className="w-full p-3 rounded-[14px] border border-[#e5e7eb] text-xs text-[#17191c] focus:outline-none focus:border-[#17191c]"
              />
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowEodModal(false)}
                className="flex-1 py-2.5 rounded-full border border-[#ececec] text-xs font-semibold text-[#777b86] hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEod}
                className="flex-1 py-2.5 rounded-full bg-[#17191c] hover:bg-gray-800 text-white text-xs font-semibold transition cursor-pointer"
              >
                Lock & Close Plant for Night
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Route Defective Batch to Rework */}
      {showReworkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-6 space-y-5 border border-[#ececec] shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#ececec]">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-full bg-[#faf3e0] text-[#8a6521]">
                  <Hammer className="w-5 h-5 text-[#c09748]" />
                </span>
                <div>
                  <h3 className="font-serif font-medium text-lg text-[#17191c]">
                    Route Defective Parts to Rework
                  </h3>
                  <p className="text-xs text-[#777b86]">
                    Avoid unnecessary scrap — salvage parts through controlled touch-up
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReworkModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRouteReworkSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#777b86]">
                  Select Parent Job Card
                </label>
                <select
                  value={selectedParentJc}
                  onChange={(e) => setSelectedParentJc(e.target.value)}
                  className="w-full h-10 px-3 rounded-[12px] border border-[#e5e7eb] text-xs text-[#17191c] bg-white"
                >
                  {jobCards.filter(j => j.jobCardType !== 'rework_child').map(jc => (
                    <option key={jc.jobCardNo} value={jc.jobCardNo}>
                      {jc.jobCardNo} • {jc.partDescription} ({jc.color})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#777b86]">
                    Defective Pieces Qty
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={reworkQtyInput}
                    onChange={(e) => setReworkQtyInput(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-[12px] border border-[#e5e7eb] text-xs text-[#17191c]"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#777b86]">
                    Defect Category
                  </label>
                  <select
                    value={defectCatInput}
                    onChange={(e) => setDefectCatInput(e.target.value as DefectCategory)}
                    className="w-full h-10 px-3 rounded-[12px] border border-[#e5e7eb] text-xs text-[#17191c] bg-white"
                  >
                    <option value="dust_nibs">Dust Nibs / Air Lint</option>
                    <option value="paint_run">Paint Run / Sagging</option>
                    <option value="orange_peel">Orange Peel Texture</option>
                    <option value="scratch">Surface Handling Scratch</option>
                    <option value="undercoat_show">Undercoat / Shadow Flaw</option>
                    <option value="shade_deviation">Color Tone Drift (ΔE &gt; 0.70)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#777b86]">
                  Rework Standard Operating Instructions
                </label>
                <textarea
                  value={reworkInstructionsInput}
                  onChange={(e) => setReworkInstructionsInput(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-[12px] border border-[#e5e7eb] text-xs text-[#17191c]"
                  required
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReworkModal(false)}
                  className="flex-1 py-2.5 rounded-full border border-[#ececec] text-xs font-semibold text-[#777b86] hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] text-xs font-semibold transition cursor-pointer shadow-xs"
                >
                  Spawn Rework Child Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inward Modal */}
      
      {/* ========================================================================= */}
      {/* PLANT HEAD PRIORITY ASSIGNMENT MODAL DIALOG                               */}
      {/* ========================================================================= */}
      {showPriorityModal && selectedStockForPriority && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-[24px] max-w-xl w-full p-5 sm:p-7 shadow-2xl border border-[#ececec] space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#ececec]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] text-[10px] font-mono font-bold border border-[#f4e5be]">
                    PLANT HEAD PRODUCTION DIRECTIVE
                  </span>
                  <span className="text-[10px] font-mono text-[#777b86]">
                    GRN: {selectedStockForPriority.grnNo}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-lg sm:text-xl text-[#17191c]">
                  Assign Production Priority & Floor Directive
                </h3>
                <p className="text-xs text-[#777b86] mt-0.5">
                  Party: <strong>{selectedStockForPriority.customer}</strong> • Substrate: <strong>{selectedStockForPriority.partCode}</strong> ({selectedStockForPriority.balanceAvailable} {selectedStockForPriority.uom})
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowPriorityModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-[#17191c] font-bold flex items-center justify-center cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePriority} className="space-y-4 text-xs">
              {/* Priority Level Radio Selector */}
              <div>
                <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1.5 font-mono">
                  Select Production Priority Level *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label 
                    onClick={() => setPriorityLevelInput('P1_URGENT')}
                    className={`p-3 rounded-[16px] border cursor-pointer transition flex flex-col justify-between ${
                      priorityLevelInput === 'P1_URGENT' 
                        ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/30' 
                        : 'bg-white border-[#ececec] hover:border-rose-300'
                    }`}
                  >
                    <div className="font-bold text-rose-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                      <span>🚨 P1 - Urgent</span>
                    </div>
                    <p className="text-[10px] text-rose-700 mt-1">Line stoppage risk / Run first shift</p>
                  </label>

                  <label 
                    onClick={() => setPriorityLevelInput('P2_HIGH')}
                    className={`p-3 rounded-[16px] border cursor-pointer transition flex flex-col justify-between ${
                      priorityLevelInput === 'P2_HIGH' 
                        ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/30' 
                        : 'bg-white border-[#ececec] hover:border-amber-300'
                    }`}
                  >
                    <div className="font-bold text-amber-800 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-600" />
                      <span>⚡ P2 - High</span>
                    </div>
                    <p className="text-[10px] text-amber-700 mt-1">Next in queue after urgent lot</p>
                  </label>

                  <label 
                    onClick={() => setPriorityLevelInput('P3_NORMAL')}
                    className={`p-3 rounded-[16px] border cursor-pointer transition flex flex-col justify-between ${
                      priorityLevelInput === 'P3_NORMAL' 
                        ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-400/30' 
                        : 'bg-white border-[#ececec] hover:border-blue-300'
                    }`}
                  >
                    <div className="font-bold text-blue-800 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                      <span>📋 P3 - Standard</span>
                    </div>
                    <p className="text-[10px] text-blue-700 mt-1">Standard FIFO sequence batch</p>
                  </label>
                </div>
              </div>

              {/* Target Date */}
              <div>
                <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1 font-mono">
                  Target Completion Date *
                </label>
                <input
                  type="date"
                  required
                  value={targetDateInput}
                  onChange={e => setTargetDateInput(e.target.value)}
                  className="w-full p-2.5 rounded-[16px] border border-[#ececec] bg-white text-xs font-semibold focus:border-[#c09748] focus:outline-none"
                />
              </div>

              

              {/* Directive Notes for Production Manager */}
              <div>
                <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1 font-mono">
                  Floor Directives for Vikram Patel (Production Manager) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={instructionsInput}
                  onChange={e => setInstructionsInput(e.target.value)}
                  placeholder="e.g. Tata Autocomp urgent delivery. Paint after White batch on Line 1. Confirm viscosity 18s prior to spray."
                  className="w-full p-2.5 rounded-[16px] border border-[#ececec] bg-white text-xs focus:border-[#c09748] focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#ececec]">
                <button
                  type="button"
                  onClick={() => setShowPriorityModal(false)}
                  className="px-4 py-2 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#17191c] hover:bg-black text-[#c09748] font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition active:scale-95"
                >
                  <Send className="w-3.5 h-3.5 text-[#c09748]" />
                  <span>Lock Priority & Dispatch to Production</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showInwardModal && (
        <QuickInwardModal onClose={() => setShowInwardModal(false)} />
      )}
    </div>
  );
};
