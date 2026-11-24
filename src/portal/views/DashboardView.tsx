import React, { useState } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { PortalTab } from '../components/PortalSidebar';
import { PaintkingDatePicker } from '../components/PaintkingDatePicker';
import { matchesPlant } from '../utils/portalAuth';
import { isChemicalConsumable } from '../utils/stockEngine';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Clock,
  Moon,
  Sun,
  Layers,
  Hammer,
  Search,
  Building2,
  Zap,
  Calendar,
  Flag,
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
    stockBatches = [],
    painterAssignments = [],
    plantHeadPriorities = [],
    assignProductionPriority,
    currentUser, 
    billingInvoices, 
    defects, 
    activePlant, 
    activeShift,
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
  const [prioritySearch, setPrioritySearch] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Plant Scoped Collections (Strict Plant Isolation Guard)
  const plantJobCards = React.useMemo(() => {
    return jobCards.filter(j => matchesPlant(j.plant, activePlant));
  }, [jobCards, activePlant]);

  const plantInvoices = React.useMemo(() => {
    return billingInvoices.filter(i => matchesPlant(i.plant, activePlant));
  }, [billingInvoices, activePlant]);

  const plantGrnList = React.useMemo(() => {
    return grnList.filter(g => matchesPlant(g.plant, activePlant));
  }, [grnList, activePlant]);

  const plantPriorities = React.useMemo(() => {
    return plantHeadPriorities.filter(p => matchesPlant(p.plant, activePlant));
  }, [plantHeadPriorities, activePlant]);

  // Synchronized Store Stock Items with Priority Status (Strict: 100% GRN + IQC Cleared Party Material Only)
  const storeStockItems = React.useMemo(() => {
    return plantGrnList
      .filter(g => {
        if (!g.grnNo) return false;
        const isIqcCleared =
          g.iqcStatus === 'Accepted' || g.iqcStatus === 'Passed' || g.iqcStatus === 'Part Accepted';
        if (!isIqcCleared) return false;

        const firstItem = g.items?.[0];
        const partDesc = firstItem?.partDescription || g.description || '';
        const custLower = (g.supplierCustomer || '').toLowerCase();
        const isCompanyConsumable =
          firstItem?.category === 'COMPANY_CONSUMABLE' ||
          isChemicalConsumable(firstItem?.materialType, firstItem?.category, partDesc) ||
          custLower.includes('asian paints') ||
          custLower.includes('ppg') ||
          custLower.includes('berger');
        return !isCompanyConsumable;
      })
      .map(grn => {
        const partCode = grn.items?.[0]?.partCode || grn.partCode || 'SUBSTRATE';
        const partDesc = grn.items?.[0]?.partDescription || grn.description || 'Raw Molded Components';
        const partCount = grn.items?.length || 1;
        const totalInward = grn.totalQty || grn.actualReceivedQty || grn.invoicedQty || 0;
        const uom = 'Pcs';
        const customer = grn.supplierCustomer;

        const linkedMasterCard = plantJobCards.find(
          jc =>
            (jc.jobCardType === 'master' || (!jc.jobCardType && !jc.parentJobCardId)) &&
            ((jc.sourceGrnNo && jc.sourceGrnNo === grn.grnNo) ||
              (!jc.sourceGrnNo &&
                jc.customer?.trim().toLowerCase() === customer.trim().toLowerCase() &&
                jc.partCode?.trim().toLowerCase() === partCode.trim().toLowerCase()))
        );

        const grnBatches = stockBatches.filter(
          b => b.grnNo === grn.grnNo && b.category === 'PARTY_MATERIAL'
        );
        const transferredToPainters = linkedMasterCard
          ? painterAssignments
              .filter(
                a =>
                  a.masterJobCardNo === linkedMasterCard.jobCardNo ||
                  a.masterJobCardId === linkedMasterCard.jobCardNo
              )
              .reduce((sum, a) => sum + Number(a.actualCompletedQty || 0), 0)
          : 0;

        const balanceAvailable =
          grnBatches.length > 0
            ? grnBatches.reduce((sum, b) => sum + Number(b.balanceQty || 0), 0)
            : Math.max(0, totalInward - transferredToPainters);
        const totalIssuedToFloor = Math.max(0, totalInward - balanceAvailable);

        const priority = plantPriorities.find(
          p =>
            (p.grnNo && p.grnNo === grn.grnNo) ||
            (!p.grnNo &&
              p.customer.toLowerCase().trim() === customer.toLowerCase().trim() &&
              p.partCode.toLowerCase().trim() === partCode.toLowerCase().trim())
        );

        return {
          grnNo: grn.grnNo,
          challanNo: grn.invoiceChallanNo,
          receivedDate: grn.receivedDate || grn.date,
          customer,
          partCode,
          partDesc,
          partCount,
          uom,
          totalInward,
          totalIssuedToFloor,
          balanceAvailable,
          linkedJobCardNo: priority?.linkedJobCardNo || linkedMasterCard?.jobCardNo,
          priorityRecord: priority,
          vehicleNo: grn.vehicleNo
        };
      });
  }, [plantGrnList, plantJobCards, stockBatches, painterAssignments, plantPriorities]);

  const p1Count = storeStockItems.filter(s => s.priorityRecord?.priorityLevel === 'P1_URGENT').length;
  const p2Count = storeStockItems.filter(s => s.priorityRecord?.priorityLevel === 'P2_HIGH').length;
  const p3Count = storeStockItems.filter(s => s.priorityRecord?.priorityLevel === 'P3_NORMAL').length;
  const unassignedCount = storeStockItems.filter(s => !s.priorityRecord).length;

  const filteredStoreStockItems = React.useMemo(() => {
    const q = prioritySearch.trim().toLowerCase();
    return storeStockItems.filter(item => {
      if (priorityFilter === 'UNASSIGNED') {
        if (item.priorityRecord) return false;
      } else if (priorityFilter !== 'ALL') {
        if (item.priorityRecord?.priorityLevel !== priorityFilter) return false;
      }
      if (!q) return true;
      return (
        item.customer.toLowerCase().includes(q) ||
        item.partCode.toLowerCase().includes(q) ||
        item.partDesc.toLowerCase().includes(q) ||
        item.grnNo.toLowerCase().includes(q) ||
        (item.challanNo || '').toLowerCase().includes(q) ||
        (item.linkedJobCardNo || '').toLowerCase().includes(q)
      );
    });
  }, [storeStockItems, priorityFilter, prioritySearch]);

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

    const res = assignProductionPriority({
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
      plant: activePlant === 'ALL' ? (selectedStockForPriority.plant || 'Haridwar') : activePlant
    });

    if (!res) {
      setShowPriorityModal(false);
      setToastMsg(`⚠️ Blocked: GRN ${selectedStockForPriority.grnNo} ka 100% GRN & IQC clearance verify nahi hua.`);
      setTimeout(() => setToastMsg(null), 4500);
      return;
    }

    setShowPriorityModal(false);
    setToastMsg(`✓ Priority set & Master Job Card (${res.jobCard.jobCardNo}) auto-created for ${selectedStockForPriority.customer}!`);
    setTimeout(() => setToastMsg(null), 4500);
  };

  const [showEodModal, setShowEodModal] = useState<boolean>(false);
  const [eodRemarks, setEodRemarks] = useState<string>('');

  // Rework Route Modal
  const [showReworkModal, setShowReworkModal] = useState<boolean>(false);
  const [selectedParentJc, setSelectedParentJc] = useState<string>('');
  const [reworkQtyInput, setReworkQtyInput] = useState<number>(0);
  const [defectCatInput, setDefectCatInput] = useState<DefectCategory>('dust_nibs');
  const [reworkInstructionsInput, setReworkInstructionsInput] = useState<string>('De-nib with 1500 grit, solvent clean and apply 1 touch-up mist coat.');

  // High-signal Operational Aggregations
  const masterJobCards = plantJobCards.filter(j => j.jobCardType === 'master' || (!j.jobCardType && !j.parentJobCardId));
  const reworkChildCards = plantJobCards.filter(j => j.jobCardType === 'rework_child');

  const totalSprayed = plantJobCards.reduce((acc, curr) => acc + (curr.sprayedQty || 0), 0);
  const totalGood = plantJobCards.reduce((acc, curr) => acc + (curr.goodQty || 0), 0);
  const totalReworkQueue = reworkChildCards.filter(r => r.status !== 'Completed').reduce((acc, curr) => acc + (curr.targetQty || 0), 0);
  const totalReworkRecovered = reworkChildCards.reduce((acc, curr) => acc + (curr.reworkRecoveredQty || 0), 0);
  const totalScrap = plantJobCards.reduce((acc, curr) => acc + (curr.scrapQty || 0), 0);
  
  const firstPassYield = totalSprayed > 0 ? (((totalSprayed - totalReworkQueue - totalScrap) / totalSprayed) * 100).toFixed(1) : '0.0';
  const reworkRecoveryRate = (totalReworkRecovered + totalScrap) > 0 
    ? ((totalReworkRecovered / (totalReworkRecovered + totalScrap)) * 100).toFixed(1)
    : '0.0';

  const totalInvoicedRevenue = plantInvoices.reduce((acc, curr) => acc + curr.grandTotal, 0);

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
            <TrendingUp className="w-3 h-3 text-emerald-600" /> {totalSprayed > 0 ? `${((totalSprayed / 2000) * 100).toFixed(1)}% Shift Target Met` : '0.0% Shift Output'}
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
          <div className="text-[10px] text-emerald-700 mt-1 font-medium">{totalReworkRecovered}/{totalReworkRecovered + totalScrap} Salvaged from Defect</div>
        </div>

        {/* Irrecoverable Scrap Rate */}
        <div className="bg-white p-4 rounded-[20px] border border-[#ececec] shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#777b86]">Irrecoverable Scrap</div>
          <div className="text-2xl font-serif font-normal text-rose-600 mt-1.5">{totalScrap} pcs</div>
          <div className="text-[10px] text-emerald-700 font-medium mt-1">{totalSprayed > 0 ? `${((totalScrap / totalSprayed) * 100).toFixed(2)}%` : '0.00%'} (OEM Spec &lt;0.5%)</div>
        </div>

        {/* Active Line Orders */}
        <div className="bg-white p-4 rounded-[20px] border border-[#ececec] shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#777b86]">Active WIP Lots</div>
          <div className="text-2xl font-serif font-normal text-[#17191c] mt-1.5">{masterJobCards.length} Batches</div>
          <div className="text-[10px] text-[#777b86] mt-1">{new Set(plantJobCards.map(j => j.boothNo).filter(Boolean)).size} Line Booths Engaged</div>
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
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2 h-2 rounded-full bg-[#c09748]" />
              <span className="text-[10.5px] font-mono font-bold uppercase tracking-widest text-[#8a6521] bg-[#faf3e0] px-2.5 py-0.5 rounded-full border border-[#f4e5be]">
                Plant Head Scheduler • {currentUser.name}
              </span>
              <span className="text-[11px] font-mono text-[#777b86]">
                IQC-Cleared Party Stock → Auto Master Job Card
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-normal text-[#17191c] tracking-tight">
              Store Material Stock &amp; Production Priority Allocator
            </h2>
            <p className="text-xs text-[#777b86]">
              All IQC-cleared Party Material GRNs ready in Store. Assigning priority automatically launches a Master Job Card to the Production queue.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('jobcards')}
            className="px-4 py-2 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs font-bold transition inline-flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap self-start md:self-auto shrink-0"
          >
            <span>View Production Queue</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#8a6521]" />
          </button>
        </div>

        {/* Interactive Priority KPI Filter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <button
            type="button"
            onClick={() => setPriorityFilter('ALL')}
            className={`p-3.5 rounded-[18px] border text-left cursor-pointer transition flex flex-col justify-between ${
              priorityFilter === 'ALL'
                ? 'bg-[#faf7ed] border-[#c09748] ring-1 ring-[#c09748]/30 shadow-2xs'
                : 'bg-[#fafafb] border-[#ececec] hover:border-[#c09748]'
            }`}
          >
            <span className="text-[10px] font-bold text-[#8a6521] uppercase font-mono tracking-wider">All Party Lots</span>
            <div className="text-xl font-serif font-normal text-[#17191c] mt-1">{storeStockItems.length} Lots</div>
            <span className="text-[10.5px] text-[#777b86]">GRN &amp; IQC Cleared</span>
          </button>

          <button
            type="button"
            onClick={() => setPriorityFilter('P1_URGENT')}
            className={`p-3.5 rounded-[18px] border text-left cursor-pointer transition flex flex-col justify-between ${
              priorityFilter === 'P1_URGENT'
                ? 'bg-rose-50 border-rose-300 ring-1 ring-rose-300/40 shadow-2xs'
                : 'bg-white border-[#ececec] hover:border-rose-300'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-bold text-rose-800 uppercase font-mono flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                <span>P1 Urgent</span>
              </span>
              <span className="text-[9.5px] font-mono font-bold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded-full">Risk</span>
            </div>
            <div className="text-xl font-serif font-normal text-rose-700 mt-1">{p1Count} Batches</div>
            <span className="text-[10.5px] text-rose-700">Immediate Shift Run</span>
          </button>

          <button
            type="button"
            onClick={() => setPriorityFilter('P2_HIGH')}
            className={`p-3.5 rounded-[18px] border text-left cursor-pointer transition flex flex-col justify-between ${
              priorityFilter === 'P2_HIGH'
                ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-300/40 shadow-2xs'
                : 'bg-white border-[#ececec] hover:border-amber-300'
            }`}
          >
            <span className="text-[10px] font-bold text-amber-800 uppercase font-mono flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-600" />
              <span>P2 High</span>
            </span>
            <div className="text-xl font-serif font-normal text-amber-800 mt-1">{p2Count} Batches</div>
            <span className="text-[10.5px] text-amber-700">Next In-Line Queue</span>
          </button>

          <button
            type="button"
            onClick={() => setPriorityFilter('P3_NORMAL')}
            className={`p-3.5 rounded-[18px] border text-left cursor-pointer transition flex flex-col justify-between ${
              priorityFilter === 'P3_NORMAL'
                ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300/40 shadow-2xs'
                : 'bg-white border-[#ececec] hover:border-blue-300'
            }`}
          >
            <span className="text-[10px] font-bold text-blue-800 uppercase font-mono flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-blue-600" />
              <span>P3 Standard</span>
            </span>
            <div className="text-xl font-serif font-normal text-blue-800 mt-1">{p3Count} Batches</div>
            <span className="text-[10.5px] text-blue-700">Standard FIFO Flow</span>
          </button>

          <button
            type="button"
            onClick={() => setPriorityFilter('UNASSIGNED')}
            className={`p-3.5 rounded-[18px] border text-left cursor-pointer transition flex flex-col justify-between ${
              priorityFilter === 'UNASSIGNED'
                ? 'bg-[#f2f2f3] border-[#a3a6af] ring-1 ring-[#a3a6af]/40 shadow-2xs'
                : 'bg-white border-[#ececec] hover:border-[#c09748]'
            }`}
          >
            <span className="text-[10px] font-bold text-[#777b86] uppercase font-mono flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-[#777b86]" />
              <span>Unassigned</span>
            </span>
            <div className="text-xl font-serif font-normal text-[#17191c] mt-1">{unassignedCount} Lots</div>
            <span className="text-[10.5px] text-[#777b86]">Awaiting Priority</span>
          </button>
        </div>

        {/* Unified Search & Count Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-[#777b86] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={prioritySearch}
              onChange={e => setPrioritySearch(e.target.value)}
              placeholder="Search party, part code, GRN, challan, or JC number..."
              className="w-full h-9 pl-9 pr-8 rounded-full bg-[#fafafb] border border-[#dcdfe4] text-xs text-[#17191c] placeholder:text-[#a3a6af] focus:outline-none focus:border-[#c09748] focus:bg-white transition"
            />
            {prioritySearch && (
              <button
                type="button"
                onClick={() => setPrioritySearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777b86] hover:text-[#17191c] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-[#777b86]">
            {(priorityFilter !== 'ALL' || prioritySearch.trim() !== '') && (
              <button
                type="button"
                onClick={() => {
                  setPriorityFilter('ALL');
                  setPrioritySearch('');
                }}
                className="px-3 py-1 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] font-bold transition cursor-pointer inline-flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
            <span>
              Showing <strong className="text-[#17191c]">{filteredStoreStockItems.length}</strong> of{' '}
              <strong className="text-[#17191c]">{storeStockItems.length}</strong> Store lots
            </span>
          </div>
        </div>

        {/* Desktop 5-Column Priority Queue Table (PK-OS Standard) */}
        <div className="hidden md:block overflow-x-auto border border-[#ececec] rounded-[20px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#fafafb] text-[#777b86] font-bold uppercase text-[10.5px] tracking-wider border-b border-[#ececec]">
                <th className="py-2.5 px-4">Party &amp; Material</th>
                <th className="py-2.5 px-3 whitespace-nowrap">GRN &amp; Challan</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Store Stock</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Priority &amp; Master Card</th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ececec] text-[#17191c]">
              {filteredStoreStockItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-[#777b86]">
                    No IQC-cleared Party Material lots match the current filter.
                  </td>
                </tr>
              ) : (
                filteredStoreStockItems.map(item => {
                  const prio = item.priorityRecord;
                  const isP1 = prio?.priorityLevel === 'P1_URGENT';
                  const isP2 = prio?.priorityLevel === 'P2_HIGH';
                  const isP3 = prio?.priorityLevel === 'P3_NORMAL';
                  const isLaunched = Boolean(item.linkedJobCardNo);

                  return (
                    <tr key={item.grnNo} className={`hover:bg-[#fafafb] transition ${isP1 ? 'bg-rose-50/15' : ''}`}>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[13px] text-[#17191c] flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#c09748] shrink-0" />
                          <span>{item.customer}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5 text-[11px] text-[#777b86]">
                          <span className="font-mono font-bold text-[#8a6521]">{item.partCode}</span>
                          <span>•</span>
                          <span className="truncate max-w-[230px]" title={item.partDesc}>{item.partDesc}</span>
                          {item.partCount > 1 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10px] font-mono font-bold">
                              +{item.partCount - 1} more
                            </span>
                          )}
                          <span>•</span>
                          <span className="font-mono">Rec: {item.receivedDate}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-mono font-bold text-[#17191c] text-xs">{item.grnNo}</div>
                        <div className="text-[11px] text-[#777b86] font-mono mt-0.5">Challan: {item.challanNo || '-'}</div>
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span className={`font-mono font-bold text-xs px-2.5 py-0.5 rounded-full inline-block border ${
                          item.balanceAvailable > 0
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-[#f2f2f3] text-[#777b86] border-[#dcdfe4]'
                        }`}>
                          {item.balanceAvailable.toLocaleString('en-IN')} {item.uom}
                        </span>
                        <div className="text-[10.5px] text-[#777b86] font-mono mt-0.5">
                          Inward: {item.totalInward.toLocaleString('en-IN')} {item.uom}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {prio ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold border ${
                                isP1
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : isP2
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : isP3
                                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                                      : 'bg-[#f2f2f3] text-[#777b86] border-[#dcdfe4]'
                              }`}>
                                {isP1 ? <AlertTriangle className="w-3 h-3" /> : isP2 ? <Zap className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
                                <span>{isP1 ? 'P1 Urgent' : isP2 ? 'P2 High' : isP3 ? 'P3 Standard' : 'Hold'}</span>
                              </span>
                              {isLaunched && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10.5px] font-mono font-bold">
                                  {item.linkedJobCardNo}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#777b86] flex items-center gap-1.5" title={prio.plantHeadRemarks}>
                              <Calendar className="w-3 h-3 text-[#c09748] shrink-0" />
                              <span className="font-mono text-[#17191c] font-semibold shrink-0">{prio.targetDate}</span>
                              {prio.plantHeadRemarks && (
                                <span className="truncate max-w-[190px] text-[#777b86]">• {prio.plantHeadRemarks}</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono text-[#777b86] bg-[#fafafb] border border-dashed border-[#dcdfe4]">
                            <Clock className="w-3 h-3" />
                            <span>Unscheduled</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenPriorityModal(item)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-2xs cursor-pointer transition inline-flex items-center gap-1.5 ml-auto active:scale-95 border ${
                            prio
                              ? 'bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border-[#dcdfe4]'
                              : 'bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border-[#f4e5be]'
                          }`}
                        >
                          <Flag className="w-3.5 h-3.5 text-[#c09748]" />
                          <span>{prio ? 'Edit Priority' : '+ Set Priority'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile 3-Row Cards for Store Stock & Priority */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {filteredStoreStockItems.map(item => {
            const prio = item.priorityRecord;
            const isP1 = prio?.priorityLevel === 'P1_URGENT';
            const isP2 = prio?.priorityLevel === 'P2_HIGH';
            return (
              <div
                key={item.grnNo}
                className={`p-3.5 rounded-[18px] border bg-[#fafafb] space-y-2.5 shadow-2xs ${
                  isP1 ? 'border-rose-200' : 'border-[#ececec]'
                }`}
              >
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#ececec]">
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-[#17191c] truncate">{item.customer}</div>
                    <div className="font-mono text-[10.5px] text-[#8a6521]">
                      {item.partCode} • {item.grnNo}
                    </div>
                  </div>
                  {prio ? (
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border shrink-0 ${
                      isP1
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : isP2
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                    }`}>
                      {isP1 ? 'P1 Urgent' : isP2 ? 'P2 High' : 'P3 Standard'}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-[#777b86] bg-white border border-[#ececec] shrink-0">
                      Unassigned
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 text-xs text-[#777b86]">
                  <span className="truncate">{item.partDesc}</span>
                  <span className="font-mono font-bold text-[#17191c] shrink-0">
                    {item.balanceAvailable.toLocaleString('en-IN')} / {item.totalInward.toLocaleString('en-IN')} {item.uom}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="text-[11px] font-mono text-[#777b86]">
                    {item.linkedJobCardNo ? (
                      <span className="font-bold text-emerald-700">{item.linkedJobCardNo} • {prio?.targetDate}</span>
                    ) : (
                      <span>Challan: {item.challanNo || '-'}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenPriorityModal(item)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer active:scale-95 border ${
                      prio
                        ? 'bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border-[#dcdfe4]'
                        : 'bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border-[#f4e5be]'
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5 text-[#c09748]" />
                    <span>{prio ? 'Edit Priority' : '+ Set Priority'}</span>
                  </button>
                </div>
              </div>
            );
          })}
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
                  {plantJobCards.filter(j => j.jobCardType !== 'rework_child').map(jc => (
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
                className="w-8 h-8 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
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
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>P1 - Urgent</span>
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
                      <span>P2 - High</span>
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
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      <span>P3 - Standard</span>
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
                <PaintkingDatePicker
                  value={targetDateInput}
                  onChange={setTargetDateInput}
                  placeholder="DD-MM-YYYY"
                  required
                />
              </div>

              {/* Directive Notes for Production Team */}
              <div>
                <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1 font-mono">
                  Floor Directives for Production Team *
                </label>
                <textarea
                  required
                  rows={3}
                  value={instructionsInput}
                  onChange={e => setInstructionsInput(e.target.value)}
                  placeholder="e.g. Urgent OEM delivery. Confirm shade & booth before starting shift."
                  className="w-full p-2.5 rounded-[16px] border border-[#ececec] bg-white text-xs focus:border-[#c09748] focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#ececec]">
                <button
                  type="button"
                  onClick={() => setShowPriorityModal(false)}
                  className="px-4 py-2 rounded-full border border-[#dcdfe4] bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] font-semibold cursor-pointer transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-2xs transition active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Lock Priority &amp; Launch Master Job Card</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
