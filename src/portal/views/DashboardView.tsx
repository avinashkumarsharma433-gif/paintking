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
  HelpCircle, 
  Clock 
} from 'lucide-react';

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
    openOverrunCount 
  } = usePortalStore();

  const [showInwardModal, setShowInwardModal] = useState<boolean>(false);

  const totalSprayed = jobCards.reduce((acc, curr) => acc + curr.sprayedQty, 0);
  const totalGood = jobCards.reduce((acc, curr) => acc + curr.goodQty, 0);
  const totalReject = jobCards.reduce((acc, curr) => acc + curr.rejectQty, 0);
  const rejectPercent = totalSprayed > 0 ? ((totalReject / totalSprayed) * 100).toFixed(1) : '0';
  const totalInvoicedRevenue = billingInvoices.reduce((acc, curr) => acc + curr.grandTotal, 0);

  return (
    <div className="space-y-6">
      {/* Top Editorial Banner */}
      <div className="bg-white rounded-[24px] p-6 text-[#17191c] border border-[#ececec] shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold border border-[#f4e5be]">
                PK-SYS-DSH-001 • REV 00
              </span>
              <span className="text-xs text-[#777b86]">
                Editorial Operations Cockpit
              </span>
            </div>
            <h1 className="text-3xl font-serif font-normal tracking-tight text-[#17191c]">
              {activePlant} Plant Analytics
            </h1>
            <p className="text-xs text-[#777b86] mt-1">
              Active Shift: <span className="text-[#17191c] font-medium">{activeShift}</span> • ISO 9001:2015 Continuous QMS Control
            </p>
          </div>

          {/* Quick Problem Focus & Inward Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
            <button
              onClick={() => setShowInwardModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] text-xs font-semibold shadow-sm transition cursor-pointer w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 text-[#17191c]" />
              <span>+ Naya Maal Inward Karein</span>
            </button>
            <button
              onClick={() => onNavigateTab('handovers')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-semibold transition cursor-pointer w-full sm:w-auto"
            >
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>{unresolvedHandoversCount} Handover Loss Alert</span>
            </button>
            <button
              onClick={() => onNavigateTab('billing')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#fafafb] hover:bg-[#faf3e0] border border-[#ececec] text-[#17191c] text-xs font-semibold transition cursor-pointer w-full sm:w-auto"
            >
              <Receipt className="w-4 h-4 text-[#c09748]" />
              <span>Billing Desk</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visual 4-Step Guide: PaintKing Portal me Kaam Kaise Karein */}
      <div className="bg-white rounded-[24px] p-5 border border-[#ececec] shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#f2f2f3]">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-full bg-[#faf3e0] text-[#8a6521]">
              <HelpCircle className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#17191c]">
                Quick Guide: Daily Shopfloor Execution Pipeline
              </h3>
              <p className="text-[11px] text-[#777b86]">Standard PaintKing Industrial Lifecycle</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-[#c09748] font-semibold">4 Controlled Steps</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Step 1 */}
          <div 
            onClick={() => setShowInwardModal(true)}
            className="p-4 rounded-[20px] bg-[#fafafb] hover:bg-[#faf3e0]/40 border border-[#ececec] hover:border-[#c09748] transition cursor-pointer group"
          >
            <div className="flex items-center justify-between text-[#8a6521] font-bold text-[11px] mb-1.5">
              <span>STEP 1: INWARD</span>
              <Boxes className="w-4 h-4 text-[#c09748] group-hover:scale-110 transition" />
            </div>
            <div className="font-serif font-normal text-sm text-[#17191c] mb-1">Customer Material Inward</div>
            <p className="text-[11px] text-[#777b86] leading-relaxed">
              Truck arrival par <strong>"+ Naya Maal Inward Karein"</strong> dabayein aur color breakdown (250 Red + 750 Black) enter karein.
            </p>
          </div>

          {/* Step 2 */}
          <div 
            onClick={() => onNavigateTab('jobcards')}
            className="p-4 rounded-[20px] bg-[#fafafb] hover:bg-[#faf3e0]/40 border border-[#ececec] hover:border-[#c09748] transition cursor-pointer group"
          >
            <div className="flex items-center justify-between text-[#17191c] font-bold text-[11px] mb-1.5">
              <span>STEP 2: FLOOR RUN</span>
              <Clock className="w-4 h-4 text-[#777b86] group-hover:scale-110 transition" />
            </div>
            <div className="font-serif font-normal text-sm text-[#17191c] mb-1">Job Cards & Color Caps</div>
            <p className="text-[11px] text-[#777b86] leading-relaxed">
              Painter ke tablet par 250 Red ka target cap auto-set hota hai taaki 300 spray hone par turant over-run flag ho.
            </p>
          </div>

          {/* Step 3 */}
          <div 
            onClick={() => onNavigateTab('handovers')}
            className="p-4 rounded-[20px] bg-[#fafafb] hover:bg-red-50/50 border border-[#ececec] hover:border-red-400 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between text-red-700 font-bold text-[11px] mb-1.5">
              <span>STEP 3: HANDOVER</span>
              <ArrowRightLeft className="w-4 h-4 text-red-600 group-hover:scale-110 transition" />
            </div>
            <div className="font-serif font-normal text-sm text-[#17191c] mb-1">Inter-Stage Handover</div>
            <p className="text-[11px] text-[#777b86] leading-relaxed">
              Worker A se B ko dete waqt physical tray count verify karein, taaki <strong>30 missing pieces usi waqt pakde jayein</strong>.
            </p>
          </div>

          {/* Step 4 */}
          <div 
            onClick={() => onNavigateTab('billing')}
            className="p-4 rounded-[20px] bg-[#fafafb] hover:bg-emerald-50/50 border border-[#ececec] hover:border-emerald-400 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between text-emerald-800 font-bold text-[11px] mb-1.5">
              <span>STEP 4: BILLING</span>
              <Receipt className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition" />
            </div>
            <div className="font-serif font-normal text-sm text-[#17191c] mb-1">Smart Invoicing Desk</div>
            <p className="text-[11px] text-[#777b86] leading-relaxed">
              Quality pass hone ke baad bill sirf <strong>actually delivered 950 pieces</strong> ka banega; 50 excess buffer me rahenge.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid (Floating Artifact Style) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-[20px] border border-[#ececec] shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#777b86]">Total Sprayed</div>
          <div className="text-2xl font-serif font-normal text-[#17191c] mt-1">{totalSprayed.toLocaleString()}</div>
          <div className="text-[10px] text-emerald-700 flex items-center gap-1 mt-0.5 font-medium">
            <TrendingUp className="w-3 h-3" /> Active Shift Run
          </div>
        </div>

        <div className="bg-white p-4 rounded-[20px] border border-[#ececec] shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#777b86]">Good / Passed</div>
          <div className="text-2xl font-serif font-normal text-emerald-700 mt-1">{totalGood.toLocaleString()}</div>
          <div className="text-[10px] text-[#777b86] mt-0.5">OQC Cleared</div>
        </div>

        <div className="bg-white p-4 rounded-[20px] border border-[#ececec] shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#777b86]">Scrap Rate</div>
          <div className="text-2xl font-serif font-normal text-red-600 mt-1">{totalReject} pcs</div>
          <div className="text-[10px] text-red-600 font-medium mt-0.5">{rejectPercent}% Rejection</div>
        </div>

        <div className="bg-white p-4 rounded-[20px] border border-[#ececec] shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#777b86]">Paint Efficiency</div>
          <div className="text-2xl font-serif font-normal text-[#c09748] mt-1">42 pcs/L</div>
          <div className="text-[10px] text-[#777b86] mt-0.5">Monza Red 2K PU</div>
        </div>

        <div className="bg-white p-4 rounded-[20px] border border-[#ececec] shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#777b86]">Billed Value</div>
          <div className="text-xl font-serif font-normal text-[#17191c] mt-1">₹{totalInvoicedRevenue.toLocaleString()}</div>
          <div className="text-[10px] text-emerald-700 mt-0.5 font-medium">Delivered Parts Only</div>
        </div>

        <div className="bg-white p-4 rounded-[20px] border border-[#ececec] shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#777b86]">Handover Loss</div>
          <div className="text-2xl font-serif font-normal text-red-600 mt-1">30 pcs</div>
          <div className="text-[10px] text-red-600 font-semibold mt-0.5">Stage 2 ➔ 3 Handoff</div>
        </div>
      </div>

      {/* Spotlight on The Two Floor Problems */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Ground Problem 2 Alert Box: Inter-Stage Loss */}
        <div className="bg-[#fff9f9] border border-red-200 rounded-[24px] p-5 shadow-sm space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-full bg-red-100 text-red-600 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-red-950">
                  Floor Problem 2: Inter-Stage Handover Shrinkage Alert
                </h3>
                <p className="text-xs text-red-700">
                  Worker A sent 300 pieces, but Worker B counted only 270 pieces!
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-red-600 text-white text-[11px] font-bold self-start sm:self-auto shrink-0 whitespace-nowrap">
              -30 Pcs Missing
            </span>
          </div>

          <div className="bg-white p-4 rounded-[16px] border border-red-200 text-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-1 text-[#17191c]">
              <span className="text-[#777b86]">Work Order:</span>
              <span className="font-mono font-bold">WO-1042 (Car AC Vent Bezel)</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-1 text-[#17191c]">
              <span className="text-[#777b86]">Transfer Station:</span>
              <span className="font-medium">Base Coat Booth #2 ➔ Hydro Dipping Line</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-1 text-[#17191c]">
              <span className="text-[#777b86]">Responsible Operators:</span>
              <span className="font-medium">Ramesh (Sender) ➔ Suresh (Receiver)</span>
            </div>
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px]">
              <strong>Investigation Finding:</strong> 15 found stuck on upper oven rack, 10 dropped/chipped, 5 unaccounted loss. Zero mystery!
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('handovers')}
            className="w-full py-2.5 px-4 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Open Inter-Stage Handover Ledger (PK-PRD-TRF-001)</span>
          </button>
        </div>

        {/* Ground Problem 1 Alert Box: Color Split & Billing */}
        <div className="bg-[#faf3e0] border border-[#f4e5be] rounded-[24px] p-5 shadow-sm space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-full bg-white text-[#8a6521] shadow-sm shrink-0">
                <Boxes className="w-5 h-5 text-[#c09748]" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#17191c]">
                  Floor Problem 1: Color Split & Billing Reconciliation
                </h3>
                <p className="text-xs text-[#8a6521]">
                  Order was 250 Red + 750 Black. Painter sprayed 300 Red + 700 Black.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#c09748] text-[#17191c] text-[11px] font-bold self-start sm:self-auto shrink-0 whitespace-nowrap">
              +50 Floor Buffer
            </span>
          </div>

          <div className="bg-white p-4 rounded-[16px] border border-[#f4e5be] text-xs space-y-2">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-100">
                <div className="text-[10px] font-bold uppercase text-red-600">Monza Red Gloss</div>
                <div className="text-base font-serif font-normal text-red-950 mt-0.5">300 / 250 Target</div>
                <div className="text-[10px] text-amber-800 font-semibold">+50 Extra Held in Buffer</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#fafafb] border border-[#ececec]">
                <div className="text-[10px] font-bold uppercase text-gray-700">Matte Jet Black</div>
                <div className="text-base font-serif font-normal text-gray-900 mt-0.5">700 / 750 Target</div>
                <div className="text-[10px] text-red-600 font-semibold">50 Pcs Pending Backlog</div>
              </div>
            </div>
            <div className="p-2.5 bg-[#faf7ed] border border-[#c09748]/30 rounded-xl text-[#8a6521] text-[11px]">
              <strong>Billing Rule:</strong> Only 950 delivered pieces are billed (₹20,250). Extra 50 Red are NOT billed until client signs approval!
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('billing')}
            className="w-full py-2.5 px-4 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Receipt className="w-4 h-4 text-[#17191c]" />
            <span>Open Billing Reconciliation & Invoice Generator</span>
          </button>
        </div>
      </div>

      {/* Defect Pareto Section from Master Data */}
      <div className="bg-white rounded-[24px] border border-[#ececec] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f3]">
          <div>
            <h3 className="text-base font-serif font-normal text-[#17191c]">
              Defect Pareto & ISO Rejection Analysis (D01 – D16)
            </h3>
            <p className="text-xs text-[#777b86]">
              Controlled categories from PK_Master Data • Real-time shift defect frequencies
            </p>
          </div>
          <span className="text-xs font-mono text-[#c09748] font-semibold">
            PK-QA-REJ-001
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {defects.slice(0, 8).map(d => (
            <div key={d.code} className="p-3 rounded-[16px] bg-[#fafafb] border border-[#ececec] text-center hover:border-[#c09748] transition">
              <div className="text-[10px] font-mono font-bold text-[#c09748]">{d.code}</div>
              <div className="text-xs font-medium text-[#17191c] truncate mt-0.5" title={d.name}>{d.name}</div>
              <div className="text-lg font-serif font-normal text-[#17191c] mt-1">{d.count}</div>
              <div className={`text-[9px] font-semibold uppercase tracking-wider ${d.severity === 'Critical' ? 'text-red-600' : 'text-[#8a6521]'}`}>
                {d.severity}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Inward Modal */}
      <QuickInwardModal
        isOpen={showInwardModal}
        onClose={() => setShowInwardModal(false)}
        onSuccessNavigateToJobCards={() => onNavigateTab('jobcards')}
      />
    </div>
  );
};
