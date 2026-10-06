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
  Hammer
} from 'lucide-react';
import { DefectCategory } from '../types/portalTypes';

interface DashboardViewProps {
  onNavigateTab: (tab: PortalTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab }) => {
  const { 
    jobCards, 
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
        <div className="fixed inset-0 z-50 bg-[#fafafb] sm:bg-white overflow-y-auto flex flex-col animate-in fade-in duration-150">
          <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#ececec] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
                  PLANT OPERATIONS
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#777b86] text-[10px] font-mono">
                  EOD-SHUTDOWN
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-normal text-[#17191c]">
                Execute Evening Plant Shutdown (EOD)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowEodModal(false)}
              className="w-9 h-9 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] flex items-center justify-center cursor-pointer transition active:scale-95 shadow-2xs"
              title="Close"
            >
              <X className="w-5 h-5 text-[#17191c]" />
            </button>
          </div>

          <div className="max-w-2xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1 text-xs">
            <div className="p-4 bg-white rounded-[18px] border border-[#ececec] space-y-3 shadow-2xs">
              <div className="flex items-center gap-2 pb-2 border-b border-[#ececec]">
                <Moon className="w-4 h-4 text-[#c09748]" />
                <span className="font-semibold text-xs text-[#17191c]">Shift Summary • Vasai Plant Unit</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-[#fafafb] rounded-[14px] border border-[#ececec]">
                  <div className="text-[10px] text-[#777b86] uppercase tracking-wider font-semibold">Total Sprayed</div>
                  <div className="text-base font-bold text-[#17191c] mt-0.5">{totalSprayed} pcs</div>
                </div>
                <div className="p-3 bg-[#fafafb] rounded-[14px] border border-[#ececec]">
                  <div className="text-[10px] text-[#777b86] uppercase tracking-wider font-semibold">First-Pass Good</div>
                  <div className="text-base font-bold text-emerald-700 mt-0.5">{totalGood} pcs</div>
                </div>
                <div className="p-3 bg-[#fafafb] rounded-[14px] border border-[#ececec]">
                  <div className="text-[10px] text-[#777b86] uppercase tracking-wider font-semibold">Pending Rework</div>
                  <div className="text-base font-bold text-amber-700 mt-0.5">{totalReworkQueue} pcs</div>
                </div>
                <div className="p-3 bg-[#fafafb] rounded-[14px] border border-[#ececec]">
                  <div className="text-[10px] text-[#777b86] uppercase tracking-wider font-semibold">Total Scrap</div>
                  <div className="text-base font-bold text-rose-700 mt-0.5">{totalScrap} pcs</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#777b86]">
                Supervisor Evening Handover & Cleaning Notes
              </label>
              <textarea
                value={eodRemarks}
                onChange={(e) => setEodRemarks(e.target.value)}
                rows={4}
                placeholder="Spray booths flushed with thinner, exhaust filters purged, overnight WIP locked in designated holding bays..."
                className="w-full p-3.5 rounded-[16px] border border-[#dcdfe4] text-xs text-[#17191c] bg-white focus:outline-none focus:border-[#17191c]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ececec]">
              <button
                type="button"
                onClick={() => setShowEodModal(false)}
                className="px-5 py-2.5 rounded-full border border-[#ececec] text-xs font-semibold text-[#777b86] hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEod}
                className="px-6 py-2.5 rounded-full bg-[#17191c] hover:bg-gray-800 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
              >
                Lock & Close Plant for Night
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Route Defective Batch to Rework */}
      {showReworkModal && (
        <div className="fixed inset-0 z-50 bg-[#fafafb] sm:bg-white overflow-y-auto flex flex-col animate-in fade-in duration-150">
          <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#ececec] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
                  QUALITY REWORK
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#777b86] text-[10px] font-mono">
                  SALVAGE ROUTE
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-normal text-[#17191c]">
                Route Defective Parts to Rework
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowReworkModal(false)}
              className="w-9 h-9 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] flex items-center justify-center cursor-pointer transition active:scale-95 shadow-2xs"
              title="Close"
            >
              <X className="w-5 h-5 text-[#17191c]" />
            </button>
          </div>

          <div className="max-w-2xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1 text-xs">
            <form onSubmit={handleRouteReworkSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#777b86]">
                  Select Parent Job Card
                </label>
                <select
                  value={selectedParentJc}
                  onChange={(e) => setSelectedParentJc(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-[16px] border border-[#dcdfe4] text-xs text-[#17191c] bg-white"
                >
                  {jobCards.filter(j => j.jobCardType !== 'rework_child').map(jc => (
                    <option key={jc.jobCardNo} value={jc.jobCardNo}>
                      {jc.jobCardNo} • {jc.partDescription} ({jc.color})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#777b86]">
                    Defective Pieces Qty
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={reworkQtyInput}
                    onChange={(e) => setReworkQtyInput(Number(e.target.value))}
                    className="w-full h-11 px-3.5 rounded-[16px] border border-[#dcdfe4] text-xs text-[#17191c] bg-white"
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
                    className="w-full h-11 px-3.5 rounded-[16px] border border-[#dcdfe4] text-xs text-[#17191c] bg-white"
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
                  rows={3}
                  className="w-full p-3.5 rounded-[16px] border border-[#dcdfe4] text-xs text-[#17191c] bg-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ececec]">
                <button
                  type="button"
                  onClick={() => setShowReworkModal(false)}
                  className="px-5 py-2.5 rounded-full border border-[#ececec] text-xs font-semibold text-[#777b86] hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] text-xs font-semibold transition cursor-pointer shadow-xs"
                >
                  Spawn Rework Child Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inward Modal */}
      {showInwardModal && (
        <QuickInwardModal onClose={() => setShowInwardModal(false)} />
      )}
    </div>
  );
};
