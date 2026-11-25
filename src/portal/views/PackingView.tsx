import React, { useState, useMemo, useEffect } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { FinalQualityRelease, PackingSlipRecord } from '../types/portalTypes';
import {
  Printer,
  FileDown,
  CheckCircle2,
  Layers,
  Package,
  Search,
  Box,
  Hash,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
  Truck,
  ClipboardCheck,
  Download
} from 'lucide-react';
import {
  generateMultiBoxThermalLabelPDF,
  generateA4SheetBoxLabelsPDF,
  getNextBoxCounterRange,
  getCurrentBoxCounter,
  BoxLabelItem
} from '../services/boxLabelPdfService';
import { matchesPlant } from '../utils/portalAuth';
import { PKDropdown, PKDropdownOption } from '../components/PKDropdown';
import { PDIModal } from '../components/PDIModal';
import { downloadStandardOqcPdf, downloadStandardPdiPdf } from '../utils/pdfStandardHeader';

interface PackableSourceItem {
  key: string;
  sourceType: 'jobcard' | 'oqc_release';
  jobCardNo: string;
  woNo: string;
  customer: string;
  partCode: string;
  partDescription: string;
  color: string;
  painter: string;
  paintBatch: string;
  availableToPack: number;
  producedQty: number;
  alreadyPackedQty: number;
  existingRelease?: FinalQualityRelease;
}

const PACKING_DEFECT_REASONS = [
  'Dust Nibs / Air Lint',
  'Light / Thin Coverage',
  'Scratch / Handling Scuff',
  'Paint Run / Sagging',
  'Orange Peel / Gloss Issue',
  'Shade Variation vs Master',
  'Mould / Substrate Damage (Scrap)'
];

export const PackingView: React.FC = () => {
  const {
    qualityReleases,
    activePlant,
    currentUser,
    jobCards,
    painterAssignments,
    packingSlips,
    recordCheckAndPackBatch,
    dispatchFgStockFromPacking
  } = usePortalStore();

  const [activeSubTab, setActiveSubTab] = useState<'check_and_pack' | 'fg_report'>('check_and_pack');
  const [selectedSourceKey, setSelectedSourceKey] = useState<string>('');
  const [offeredQtyInput, setOfferedQtyInput] = useState<number>(0);
  const [packedOkInput, setPackedOkInput] = useState<number>(0);
  const [reworkReturnedInput, setReworkReturnedInput] = useState<number>(0);
  const [scrapInput, setScrapInput] = useState<number>(0);
  const [defectReason, setDefectReason] = useState<string>(PACKING_DEFECT_REASONS[0]);
  const [pcsPerBox, setPcsPerBox] = useState<number>(150);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // FG Report Filters & PDI Modal
  const [fgFilterStatus, setFgFilterStatus] = useState<'ALL' | 'IN_FG' | 'DISPATCHED'>('ALL');
  const [fgSearchQuery, setFgSearchQuery] = useState<string>('');
  const [pdiModalRelease, setPdiModalRelease] = useState<FinalQualityRelease | null>(null);

  // Build unified list of Production Job Cards + OQC Releases ready for Check & Pack
  const packableSources = useMemo<PackableSourceItem[]>(() => {
    const plantSlips = packingSlips.filter(s => matchesPlant(s.plant, activePlant));
    const items: PackableSourceItem[] = [];
    const coveredWoNos = new Set<string>();

    jobCards
      .filter(jc => matchesPlant(jc.plant, activePlant))
      .forEach(jc => {
        const jcAssignments = painterAssignments.filter(
          a => a.masterJobCardNo === jc.jobCardNo || a.masterJobCardId === jc.jobCardNo
        );
        const assignmentGoodSum = jcAssignments.reduce((sum, a) => sum + (a.actualCompletedQty || 0), 0);
        const producedQty = Math.max(jc.goodQty || 0, assignmentGoodSum, jc.targetQty || 0);
        const alreadyPackedQty = plantSlips
          .filter(s => s.jobCardNo === jc.jobCardNo || s.woNo === jc.jobCardNo || s.woNo === jc.woNo)
          .reduce((sum, s) => sum + (s.packedOkQty ?? s.packedQty ?? 0), 0);
        const availableToPack = Math.max(0, (assignmentGoodSum > 0 ? assignmentGoodSum : (jc.goodQty || jc.targetQty || 0)) - alreadyPackedQty);
        const linkedRel = qualityReleases.find(
          r => r.jobCardNo === jc.jobCardNo || r.woNo === jc.jobCardNo || r.woNo === jc.woNo
        );
        const painterLabel =
          jcAssignments[0]?.painterName || jc.assignedPainterName || jc.painterName || 'Production Floor';

        items.push({
          key: `JC:${jc.jobCardNo}`,
          sourceType: 'jobcard',
          jobCardNo: jc.jobCardNo,
          woNo: jc.woNo || jc.jobCardNo,
          customer: jc.customer,
          partCode: jc.partCode || jc.partDescription || 'PART',
          partDescription: jc.partDescription || 'Painted Component',
          color: jc.color || 'Standard Shade',
          painter: painterLabel,
          paintBatch: linkedRel?.batchNo || 'BAT-STD',
          availableToPack: availableToPack > 0 ? availableToPack : Math.max(1, jc.targetQty - alreadyPackedQty),
          producedQty,
          alreadyPackedQty,
          existingRelease: linkedRel
        });
        coveredWoNos.add(jc.jobCardNo);
        if (jc.woNo) coveredWoNos.add(jc.woNo);
      });

    // Also include legacy standalone OQC releases not linked to an active JobCard
    qualityReleases
      .filter(r => matchesPlant(r.plant, activePlant))
      .filter(r => r.oqcStatus === 'Accepted' || r.pdiStatus === 'Cleared for Invoicing')
      .filter(r => !coveredWoNos.has(r.woNo) && !(r.jobCardNo && coveredWoNos.has(r.jobCardNo)))
      .forEach(r => {
        const baseQty = r.passedQty || r.offeredQty || 0;
        const alreadyPackedQty = plantSlips
          .filter(s => s.oqcReleaseId === r.releaseId || s.woNo === r.woNo)
          .reduce((sum, s) => sum + (s.packedOkQty ?? s.packedQty ?? 0), 0);
        items.push({
          key: `REL:${r.releaseId}`,
          sourceType: 'oqc_release',
          jobCardNo: r.jobCardNo || r.woNo,
          woNo: r.woNo,
          customer: r.customer,
          partCode: r.partCode,
          partDescription: r.partDescription || r.model || 'Automotive Substrate',
          color: r.color,
          painter: 'Production Floor',
          paintBatch: r.batchNo || 'BAT-STD',
          availableToPack: Math.max(0, baseQty - alreadyPackedQty) || baseQty,
          producedQty: baseQty,
          alreadyPackedQty,
          existingRelease: r
        });
      });

    return items;
  }, [jobCards, painterAssignments, packingSlips, qualityReleases, activePlant]);

  const activeSource = useMemo(() => {
    return packableSources.find(s => s.key === selectedSourceKey) || packableSources[0] || null;
  }, [packableSources, selectedSourceKey]);

  // Sync offered & OK quantities whenever selected source switches
  useEffect(() => {
    if (!activeSource) return;
    const defaultQty = Math.max(1, activeSource.availableToPack);
    setOfferedQtyInput(defaultQty);
    setPackedOkInput(defaultQty);
    setReworkReturnedInput(0);
    setScrapInput(0);
  }, [activeSource?.key]);

  const sourceDropdownOptions: PKDropdownOption[] = useMemo(() => {
    return packableSources.map(s => ({
      value: s.key,
      label: `${s.jobCardNo} • ${s.customer} — ${s.partDescription}`,
      sublabel: `${s.color} • Painted: ${s.producedQty} Pcs • Already Packed: ${s.alreadyPackedQty} Pcs`,
      badge: `${s.availableToPack} Ready`
    }));
  }, [packableSources]);

  // Auto-balance OK = Checked - Rework - Scrap
  const handleOfferedChange = (val: number) => {
    const clean = Math.max(0, isNaN(val) ? 0 : val);
    setOfferedQtyInput(clean);
    const rw = Math.min(reworkReturnedInput, clean);
    const sc = Math.min(scrapInput, Math.max(0, clean - rw));
    setReworkReturnedInput(rw);
    setScrapInput(sc);
    setPackedOkInput(Math.max(0, clean - rw - sc));
  };

  const handlePackedOkChange = (val: number) => {
    const ok = Math.min(offeredQtyInput, Math.max(0, isNaN(val) ? 0 : val));
    setPackedOkInput(ok);
    const rem = Math.max(0, offeredQtyInput - ok);
    const sc = Math.min(scrapInput, rem);
    setScrapInput(sc);
    setReworkReturnedInput(Math.max(0, rem - sc));
  };

  const handleReworkChange = (val: number) => {
    const maxRw = Math.max(0, offeredQtyInput - scrapInput);
    const rw = Math.min(maxRw, Math.max(0, isNaN(val) ? 0 : val));
    setReworkReturnedInput(rw);
    setPackedOkInput(Math.max(0, offeredQtyInput - rw - scrapInput));
  };

  const handleScrapChange = (val: number) => {
    const maxSc = Math.max(0, offeredQtyInput - reworkReturnedInput);
    const sc = Math.min(maxSc, Math.max(0, isNaN(val) ? 0 : val));
    setScrapInput(sc);
    setPackedOkInput(Math.max(0, offeredQtyInput - reworkReturnedInput - sc));
  };

  // Auto-calculated Box Split ONLY for Packed OK Qty
  const calculatedBoxes = useMemo(() => {
    if (!activeSource || packedOkInput <= 0 || pcsPerBox <= 0) return [];
    const fullBoxes = Math.floor(packedOkInput / pcsPerBox);
    const remainder = packedOkInput % pcsPerBox;
    const totalBoxCount = remainder > 0 ? fullBoxes + 1 : fullBoxes;
    const list: Array<{ orderIndex: number; totalBoxes: number; qty: number }> = [];
    for (let i = 1; i <= fullBoxes; i++) {
      list.push({ orderIndex: i, totalBoxes: totalBoxCount, qty: pcsPerBox });
    }
    if (remainder > 0) {
      list.push({ orderIndex: totalBoxCount, totalBoxes: totalBoxCount, qty: remainder });
    }
    return list;
  }, [activeSource, packedOkInput, pcsPerBox]);

  const [currentMasterCounter, setCurrentMasterCounter] = useState<number>(() => getCurrentBoxCounter());

  const showTimedToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 5000);
  };

  const buildBoxPayloads = (startGlobalNumber: number): BoxLabelItem[] => {
    if (!activeSource) return [];
    return calculatedBoxes.map((b, idx) => {
      const globalNum = startGlobalNumber + idx;
      return {
        globalBoxNumber: globalNum,
        boxSerialText: `PK-BOX-${String(globalNum).padStart(4, '0')}`,
        orderBoxIndex: b.orderIndex,
        totalOrderBoxes: b.totalBoxes,
        boxQty: b.qty,
        totalLotQty: packedOkInput,
        customer: activeSource.customer,
        woNo: activeSource.woNo,
        partCode: activeSource.partCode,
        partDescription: activeSource.partDescription,
        color: activeSource.color,
        paintBatch: activeSource.paintBatch,
        painter: activeSource.painter,
        packedBy: currentUser?.name || 'Packing & OQC Desk',
        packedDate: new Date().toLocaleDateString('en-GB'),
        plant: activePlant
      };
    });
  };

  // Save Unified Check & Pack -> Auto-OQC + Auto-FG + Bounce-Back Rework
  const handleCompleteCheckAndPack = (printMode?: 'thermal' | 'a4') => {
    if (!activeSource || offeredQtyInput <= 0) return;

    let boxRangeLabel = 'No Boxes (0 OK)';
    if (calculatedBoxes.length > 0) {
      const startNum = getNextBoxCounterRange(calculatedBoxes.length);
      const endNum = startNum + calculatedBoxes.length - 1;
      setCurrentMasterCounter(endNum);
      boxRangeLabel =
        startNum === endNum
          ? `PK-BOX-${String(startNum).padStart(4, '0')}`
          : `PK-BOX-${String(startNum).padStart(4, '0')} – PK-BOX-${String(endNum).padStart(4, '0')}`;

      if (printMode === 'thermal') {
        generateMultiBoxThermalLabelPDF(buildBoxPayloads(startNum), `${activeSource.jobCardNo}_${activeSource.customer}`);
      } else if (printMode === 'a4') {
        generateA4SheetBoxLabelsPDF(buildBoxPayloads(startNum), `${activeSource.jobCardNo}_${activeSource.customer}`);
      }
    }

    const { slip, release } = recordCheckAndPackBatch({
      jobCardNo: activeSource.jobCardNo,
      woNo: activeSource.woNo,
      customer: activeSource.customer,
      partCode: activeSource.partCode,
      partDescription: activeSource.partDescription,
      color: activeSource.color,
      plant: activePlant === 'ALL' ? 'Haridwar' : activePlant,
      offeredQty: offeredQtyInput,
      packedOkQty: packedOkInput,
      reworkReturnedQty: reworkReturnedInput,
      scrapQty: scrapInput,
      defectReason: reworkReturnedInput + scrapInput > 0 ? defectReason : undefined,
      pcsPerBox,
      totalBoxes: calculatedBoxes.length,
      boxSerialRange: boxRangeLabel,
      painter: activeSource.painter,
      paintBatch: activeSource.paintBatch,
      packedBy: currentUser?.name || 'Packing & OQC Desk',
      existingReleaseId: activeSource.existingRelease?.releaseId
    });

    showTimedToast(
      `Check & Pack Saved (${slip.slipNo}): ${packedOkInput} Pcs FG me add hue, OQC (${release.reportNo || release.releaseId}) auto-approve hua${reworkReturnedInput > 0 ? `, aur ${reworkReturnedInput} Rework Production ko bheje gaye!` : '!'}`
    );
  };

  // Standalone Label Download without duplicate FG commit
  const handleDownloadLabelsOnly = (mode: 'thermal' | 'a4') => {
    if (!activeSource || calculatedBoxes.length === 0) return;
    const startNum = getNextBoxCounterRange(calculatedBoxes.length);
    setCurrentMasterCounter(startNum + calculatedBoxes.length - 1);
    const payloads = buildBoxPayloads(startNum);
    if (mode === 'thermal') {
      generateMultiBoxThermalLabelPDF(payloads, `${activeSource.jobCardNo}_${activeSource.customer}`);
    } else {
      generateA4SheetBoxLabelsPDF(payloads, `${activeSource.jobCardNo}_${activeSource.customer}`);
    }
  };

  // FG Stock Register Data & KPIs
  const fgRecords = useMemo(() => {
    const q = fgSearchQuery.trim().toLowerCase();
    return packingSlips
      .filter(s => matchesPlant(s.plant, activePlant))
      .filter(s => {
        const okQty = s.packedOkQty ?? s.packedQty ?? 0;
        const dispQty = s.dispatchedQty || 0;
        const bal = Math.max(0, okQty - dispQty);
        if (fgFilterStatus === 'IN_FG' && bal <= 0) return false;
        if (fgFilterStatus === 'DISPATCHED' && dispQty <= 0) return false;
        if (!q) return true;
        return (
          s.customer.toLowerCase().includes(q) ||
          (s.jobCardNo || s.woNo).toLowerCase().includes(q) ||
          s.model.toLowerCase().includes(q) ||
          s.color.toLowerCase().includes(q) ||
          s.slipNo.toLowerCase().includes(q)
        );
      });
  }, [packingSlips, activePlant, fgFilterStatus, fgSearchQuery]);

  const fgMetrics = useMemo(() => {
    const plantSlips = packingSlips.filter(s => matchesPlant(s.plant, activePlant));
    let totalPackedOk = 0;
    let totalDispatched = 0;
    let totalReworkCaught = 0;
    let awaitingPdiCount = 0;

    plantSlips.forEach(s => {
      const ok = s.packedOkQty ?? s.packedQty ?? 0;
      const disp = s.dispatchedQty || 0;
      totalPackedOk += ok;
      totalDispatched += disp;
      totalReworkCaught += s.reworkReturnedQty || 0;
      const rel = qualityReleases.find(r => r.releaseId === s.oqcReleaseId || r.woNo === s.woNo);
      if (Math.max(0, ok - disp) > 0 && (!rel || rel.pdiStatus !== 'Cleared for Invoicing')) {
        awaitingPdiCount += 1;
      }
    });

    return {
      totalPackedOk,
      inFgBalance: Math.max(0, totalPackedOk - totalDispatched),
      totalDispatched,
      totalReworkCaught,
      awaitingPdiCount
    };
  }, [packingSlips, qualityReleases, activePlant]);

  const findLinkedRelease = (slip: PackingSlipRecord): FinalQualityRelease | undefined => {
    return qualityReleases.find(
      r =>
        (slip.oqcReleaseId && r.releaseId === slip.oqcReleaseId) ||
        (slip.jobCardNo && r.jobCardNo === slip.jobCardNo) ||
        r.woNo === slip.woNo
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner + Unified Mode Switcher */}
      <div className="bg-white rounded-[24px] p-6 border border-[#ececec] shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
              PK-STR-PKG-001 • CHECK &amp; PACK + AUTO-OQC + FG
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
              FG Stock Live: {fgMetrics.inFgBalance.toLocaleString('en-IN')} Pcs
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-normal text-[#17191c] tracking-tight">
            Check &amp; Pack, Box Labels &amp; FG Stock
          </h1>
          <p className="text-xs text-[#777b86] mt-1">
            Ek hi jagah pieces check karke pack karein — OQC Report aur Finished Goods (FG) stock apne aap banega, aur kharab pieces wapas Production ko jayenge.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex p-1 rounded-full bg-[#fafafb] border border-[#ececec]">
            <button
              type="button"
              onClick={() => setActiveSubTab('check_and_pack')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'check_and_pack'
                  ? 'bg-[#c09748] text-white shadow-xs'
                  : 'text-[#777b86] hover:text-[#17191c]'
              }`}
            >
              <Package size={14} />
              <span>1. Check &amp; Pack ({packableSources.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('fg_report')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'fg_report'
                  ? 'bg-[#c09748] text-white shadow-xs'
                  : 'text-[#777b86] hover:text-[#17191c]'
              }`}
            >
              <ClipboardCheck size={14} />
              <span>2. FG Stock &amp; PDI Report ({fgRecords.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5 bg-[#fafafb] px-3.5 py-2 rounded-[18px] border border-[#ececec]">
            <div className="h-8 w-8 rounded-full bg-[#faf3e0] border border-[#f4e5be] flex items-center justify-center text-[#8a6521]">
              <Hash size={15} />
            </div>
            <div>
              <span className="text-[9.5px] font-semibold uppercase tracking-wider text-[#979799] block">Box Counter</span>
              <span className="text-sm font-mono font-bold text-[#17191c]">
                BOX #{String(currentMasterCounter).padStart(4, '0')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {toastMsg && (
        <div className="p-4 rounded-[18px] bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveSubTab('fg_report')}
            className="px-3 py-1 rounded-full bg-white border border-emerald-300 text-emerald-800 text-[11px] font-bold hover:bg-emerald-100 cursor-pointer shrink-0"
          >
            Open FG Report →
          </button>
        </div>
      )}

      {activeSubTab === 'check_and_pack' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Unified Check & Pack + Auto-OQC + Rework Return */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-white rounded-[24px] p-6 border border-[#ececec] shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f3]">
                <div className="flex items-center gap-2">
                  <Box size={18} className="text-[#c09748]" />
                  <h3 className="font-serif text-base font-semibold text-[#17191c]">
                    1. Select Painted Job / Lot &amp; Check Quantities
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] font-mono text-[10px] font-bold">
                  Auto-OQC + FG Linked
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#17191c] mb-1.5">
                  Choose Production Job Card / Lot *
                </label>
                {sourceDropdownOptions.length > 0 ? (
                  <PKDropdown
                    value={activeSource?.key || ''}
                    onChange={val => setSelectedSourceKey(val)}
                    options={sourceDropdownOptions}
                    placeholder="Select painted Job Card..."
                  />
                ) : (
                  <div className="p-3 rounded-[16px] bg-[#fafafb] border border-dashed border-[#dcdfe4] text-xs text-[#777b86]">
                    Abhi koi active Job Card ya OQC lot nahi mila. Job Cards me order create karein.
                  </div>
                )}
              </div>

              {activeSource && (
                <div className="p-4 rounded-[18px] bg-[#fafafb] border border-[#ececec] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-[#777b86] block">Party / Customer</span>
                    <strong className="text-[#17191c] truncate block">{activeSource.customer}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#777b86] block">Model &amp; Shade</span>
                    <strong className="text-[#17191c] truncate block">
                      {activeSource.partDescription} ({activeSource.color})
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#777b86] block">Painter / Line</span>
                    <strong className="text-[#17191c] truncate block">{activeSource.painter}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#777b86] block">Already Packed (FG)</span>
                    <strong className="text-emerald-700 font-mono">{activeSource.alreadyPackedQty} Pcs</strong>
                  </div>
                </div>
              )}

              {/* Check & Pack Qty Split Row (OK -> FG, Rework -> Production, Scrap -> Reject) */}
              <div className="p-4 rounded-[20px] bg-[#faf7ed] border border-[#f4e5be] space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#8a6521] flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-[#c09748]" />
                    <span>100% Piece Check &amp; Pack Entry</span>
                  </span>
                  <span className="text-[11px] text-[#777b86]">
                    Production se aaye hue pieces ko OK / Rework / Scrap me baantein
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-mono font-bold text-[#17191c] block">Checked Qty *</label>
                    <input
                      type="number"
                      min={1}
                      value={offeredQtyInput}
                      onChange={e => handleOfferedChange(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-[14px] bg-white border border-[#dcdfe4] font-mono text-sm font-bold text-[#17191c] focus:outline-none focus:border-[#c09748]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10.5px] font-mono font-bold text-emerald-800 block">Packed OK (FG)</label>
                    <input
                      type="number"
                      min={0}
                      max={offeredQtyInput}
                      value={packedOkInput}
                      onChange={e => handlePackedOkChange(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-[14px] bg-white border border-emerald-300 font-mono text-sm font-bold text-emerald-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10.5px] font-mono font-bold text-amber-800 block">Return Rework</label>
                    <input
                      type="number"
                      min={0}
                      max={offeredQtyInput}
                      value={reworkReturnedInput}
                      onChange={e => handleReworkChange(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-[14px] bg-white border border-amber-300 font-mono text-sm font-bold text-amber-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10.5px] font-mono font-bold text-rose-800 block">Dead Scrap</label>
                    <input
                      type="number"
                      min={0}
                      max={offeredQtyInput}
                      value={scrapInput}
                      onChange={e => handleScrapChange(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-[14px] bg-white border border-rose-300 font-mono text-sm font-bold text-rose-800 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label className="text-[10.5px] font-mono font-bold text-[#17191c] block">Pcs / Box *</label>
                    <input
                      type="number"
                      min={1}
                      value={pcsPerBox}
                      onChange={e => setPcsPerBox(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full px-3 py-2 rounded-[14px] bg-white border border-[#dcdfe4] font-mono text-sm font-bold text-[#17191c] focus:outline-none focus:border-[#c09748]"
                    />
                  </div>
                </div>

                {(reworkReturnedInput > 0 || scrapInput > 0) && (
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-amber-900 font-semibold shrink-0">
                      <RotateCcw size={14} className="text-amber-700" />
                      <span>Missed Defect Bounce-Back Reason:</span>
                    </div>
                    <div className="flex-1">
                      <PKDropdown
                        compact
                        value={defectReason}
                        onChange={val => setDefectReason(val)}
                        options={PACKING_DEFECT_REASONS.map(r => ({ value: r, label: r }))}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Bar: Save to FG + Auto-OQC + Optional Label Print */}
              <div className="p-4 rounded-[18px] bg-[#faf3e0] border border-[#f4e5be] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#f4e5be] flex items-center justify-center text-[#8a6521] shrink-0 font-bold font-serif text-lg">
                    {calculatedBoxes.length}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#8a6521]">
                      {calculatedBoxes.length} Boxes Ready ({packedOkInput} Pcs OK → FG Store)
                    </h4>
                    <p className="text-[11px] text-[#8a6521]/80">
                      {packedOkInput > 0
                        ? `${Math.floor(packedOkInput / pcsPerBox)} Full Box(es) of ${pcsPerBox} Pcs${packedOkInput % pcsPerBox > 0 ? ` + 1 Box of ${packedOkInput % pcsPerBox} Pcs` : ''}`
                        : '0 OK pieces — only Rework/Scrap bounce-back will be logged'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    disabled={!activeSource || offeredQtyInput <= 0}
                    onClick={() => handleCompleteCheckAndPack('a4')}
                    className="px-5 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] disabled:opacity-50 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <CheckCircle2 size={15} />
                    <span>Save Check &amp; Pack + Auto-OQC &amp; Print Stickers</span>
                  </button>
                  <button
                    type="button"
                    disabled={!activeSource || offeredQtyInput <= 0}
                    onClick={() => handleCompleteCheckAndPack()}
                    className="px-4 py-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] disabled:opacity-50 text-[#17191c] border border-[#dcdfe4] text-xs font-semibold shadow-2xs transition cursor-pointer active:scale-95"
                  >
                    Save FG Only
                  </button>
                </div>
              </div>
            </div>

            {/* Sequential Boxes Breakdown Table */}
            <div className="bg-white rounded-[24px] p-6 border border-[#ececec] shadow-2xs space-y-3">
              <h4 className="font-serif text-sm font-semibold text-[#17191c] flex items-center gap-2">
                <Layers size={15} className="text-[#c09748]" />
                <span>Multi-Box Production Roster Breakdown</span>
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#ececec] text-[10px] font-semibold uppercase text-[#777b86]">
                      <th className="py-2.5 px-3">Sequential Box</th>
                      <th className="py-2.5 px-3">Master Running No</th>
                      <th className="py-2.5 px-3 text-right">Box Qty</th>
                      <th className="py-2.5 px-3 text-right">Running Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ececec]/60">
                    {calculatedBoxes.map((b, idx) => {
                      const runningSerial = currentMasterCounter + idx + 1;
                      const runningPcs = Math.min(packedOkInput, (idx + 1) * pcsPerBox);
                      return (
                        <tr key={idx} className="hover:bg-[#fafafb]">
                          <td className="py-2.5 px-3 font-semibold text-[#17191c]">
                            Box {String(b.orderIndex).padStart(2, '0')} of {String(b.totalBoxes).padStart(2, '0')}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#c09748]">
                            PK-BOX-{String(runningSerial).padStart(4, '0')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-[#17191c]">{b.qty} Pcs</td>
                          <td className="py-2.5 px-3 text-right font-mono text-[#777b86]">
                            {runningPcs} / {packedOkInput} Pcs
                          </td>
                        </tr>
                      );
                    })}
                    {calculatedBoxes.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-xs text-[#777b86]">
                          Packed OK quantity 0 hai — stickers sirf Packed OK pieces ke liye generate honge.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Live 4" x 6" Thermal Sticker Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-[24px] p-6 border border-[#ececec] shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f3]">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#c09748]">
                  4&quot; × 6&quot; THERMAL STICKER SPECIMEN
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Page 1 of {calculatedBoxes.length || 1}
                </span>
              </div>

              <div className="border-2 border-[#17191c] rounded-xl p-4 bg-white text-[#17191c] font-mono space-y-3 shadow-md">
                <div className="border-b border-[#ececec] pb-2.5 bg-white p-3 -m-4 mb-2 rounded-t-lg flex items-center justify-between">
                  <div className="bg-[#faf3e0] border border-[#f4e5be] px-2.5 py-1.5 rounded">
                    <span className="font-serif font-bold text-sm text-[#8a6521] tracking-wider">PAINTKING</span>
                  </div>
                  <div className="text-right space-y-0.5">
                    <div className="font-serif font-bold text-xs text-[#17191c] tracking-wide">PAINTKING</div>
                    <div className="text-[6.5px] text-gray-500">GSTIN: 05AABCP9912K1Z4 • +91 9594591313</div>
                    <div className="text-[6.5px] text-gray-500">info@paintking.in • www.paintking.in</div>
                  </div>
                </div>

                <div className="bg-[#faf3e0] border border-[#f4e5be] py-1 text-center text-[7.5px] font-bold text-[#8a6521] rounded">
                  AUTOMOTIVE FINISHED GOODS CARTON IDENTIFICATION LABEL
                </div>

                <div className="flex items-center justify-between p-2 bg-[#f2f2f3] border-b border-[#dcdfe4] text-[10px]">
                  <div>
                    <span className="text-[8px] text-gray-500 block">MASTER SERIAL NO</span>
                    <strong className="text-black font-bold font-mono">
                      PK-BOX-{String(currentMasterCounter + 1).padStart(4, '0')}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] text-gray-500 block">ORDER LOT COUNT</span>
                    <strong className="text-[#8a6521] font-bold">
                      BOX 01 / {String(calculatedBoxes.length || 1).padStart(2, '0')}
                    </strong>
                  </div>
                </div>

                <div className="space-y-1.5 text-[9px] border-b border-[#dcdfe4] pb-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-semibold">CUSTOMER:</span>
                    <strong className="text-black truncate max-w-[170px]">{activeSource?.customer || '—'}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-semibold">JOB / WO NO:</span>
                    <strong className="text-[#8a6521] font-bold font-mono">{activeSource?.jobCardNo || '—'}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-semibold">PART CODE:</span>
                    <strong className="text-black font-bold font-mono">{activeSource?.partCode || '—'}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-semibold">PART NAME:</span>
                    <span className="text-black truncate max-w-[170px]">{activeSource?.partDescription || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-semibold">COLOR / SHADE:</span>
                    <strong className="text-black">{activeSource?.color || '—'}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-semibold">PACKING DATE:</span>
                    <span className="text-black font-mono">{new Date().toLocaleDateString('en-GB')}</span>
                  </div>
                </div>

                <div className="p-3 bg-[#faf7ed] border border-[#c09748]/60 rounded-xl grid grid-cols-12 items-center gap-2 relative overflow-hidden">
                  <div className="col-span-5">
                    <span className="text-[7.5px] uppercase font-bold text-[#8a6521] block tracking-wider">BOX QUANTITY</span>
                    <span className="font-serif font-bold text-2xl tracking-tight text-[#17191c]">
                      {Math.min(pcsPerBox, packedOkInput || pcsPerBox)} PCS
                    </span>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <div className="h-9 w-[1px] bg-[#e5d8b8]" />
                  </div>
                  <div className="col-span-4 text-left">
                    <span className="text-[7.5px] uppercase font-bold text-[#777b86] block tracking-wider">PACKED FG LOT</span>
                    <span className="font-mono font-bold text-sm text-[#17191c] leading-tight block">{packedOkInput} PCS</span>
                    <span className="text-[7px] font-bold text-gray-500">OQC + PACK OK</span>
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <div className="relative flex flex-col items-center justify-center w-11 h-11 rounded-full bg-[#ecfdf5] border-2 border-[#059669] shadow-2xs select-none">
                      <div className="absolute inset-0.5 rounded-full border border-[#10b981]/50" />
                      <span className="text-[9px] font-black text-[#047857] tracking-tighter leading-none relative z-10">QC</span>
                      <span className="text-[5px] font-bold text-[#059669] tracking-wider leading-none relative z-10 mt-0.5">PASSED</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  disabled={calculatedBoxes.length === 0}
                  onClick={() => handleDownloadLabelsOnly('a4')}
                  className="w-full py-2.5 bg-[#faf3e0] hover:bg-[#f4e5be] disabled:opacity-50 text-[#8a6521] border border-[#f4e5be] font-bold text-xs rounded-full shadow-2xs cursor-pointer transition flex items-center justify-center gap-2 active:scale-95"
                >
                  <Layers size={15} />
                  <span>Print A4 Labels Only (9-Up Sheet)</span>
                </button>
                <button
                  type="button"
                  disabled={calculatedBoxes.length === 0}
                  onClick={() => handleDownloadLabelsOnly('thermal')}
                  className="w-full py-2.5 bg-[#f2f2f3] hover:bg-[#e5e7eb] disabled:opacity-50 text-[#17191c] border border-[#dcdfe4] text-xs font-semibold rounded-full shadow-2xs transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                >
                  <FileDown size={15} />
                  <span>Print Thermal Stickers Only (65×95mm)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* TAB 2: FINISHED GOODS (FG) LIVE STOCK REPORT + PDI & DISPATCH */
        <div className="space-y-5">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-[20px] border border-[#ececec] shadow-2xs">
              <span className="text-[10px] font-mono uppercase text-[#777b86] font-bold block">Total Packed (FG In)</span>
              <span className="font-serif text-2xl text-[#17191c] block mt-1">
                {fgMetrics.totalPackedOk.toLocaleString('en-IN')} <span className="text-xs text-[#777b86]">Pcs</span>
              </span>
            </div>
            <div className="bg-emerald-50/70 p-4 rounded-[20px] border border-emerald-200 shadow-2xs">
              <span className="text-[10px] font-mono uppercase text-emerald-800 font-bold block">Ready in FG Store</span>
              <span className="font-serif text-2xl text-emerald-700 block mt-1">
                {fgMetrics.inFgBalance.toLocaleString('en-IN')} <span className="text-xs text-emerald-800">Pcs</span>
              </span>
            </div>
            <div className="bg-blue-50/70 p-4 rounded-[20px] border border-blue-200 shadow-2xs">
              <span className="text-[10px] font-mono uppercase text-blue-800 font-bold block">Dispatched Out</span>
              <span className="font-serif text-2xl text-blue-800 block mt-1">
                {fgMetrics.totalDispatched.toLocaleString('en-IN')} <span className="text-xs text-blue-700">Pcs</span>
              </span>
            </div>
            <div className="bg-[#faf7ed] p-4 rounded-[20px] border border-[#f4e5be] shadow-2xs">
              <span className="text-[10px] font-mono uppercase text-[#8a6521] font-bold block">Awaiting PDI</span>
              <span className="font-serif text-2xl text-[#8a6521] block mt-1">
                {fgMetrics.awaitingPdiCount} <span className="text-xs text-[#8a6521]">Lots</span>
              </span>
            </div>
            <div className="bg-amber-50/70 p-4 rounded-[20px] border border-amber-200 shadow-2xs col-span-2 lg:col-span-1">
              <span className="text-[10px] font-mono uppercase text-amber-900 font-bold block">Packing Rework Caught</span>
              <span className="font-serif text-2xl text-amber-900 block mt-1">
                {fgMetrics.totalReworkCaught.toLocaleString('en-IN')} <span className="text-xs text-amber-800">Pcs</span>
              </span>
            </div>
          </div>

          {/* Search & Filter Bar + 4-Column Desktop / Card Mobile FG Register */}
          <div className="bg-white rounded-[24px] p-6 border border-[#ececec] shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ececec]">
              <div className="flex items-center gap-2 flex-wrap">
                {(
                  [
                    { key: 'ALL', label: 'All FG Lots' },
                    { key: 'IN_FG', label: 'In FG Store (Ready)' },
                    { key: 'DISPATCHED', label: 'Dispatched' }
                  ] as const
                ).map(f => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFgFilterStatus(f.key)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                      fgFilterStatus === f.key
                        ? 'bg-[#faf3e0] text-[#8a6521] border-[#c09748]'
                        : 'bg-[#fafafb] text-[#777b86] border-[#ececec] hover:text-[#17191c]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-[#979799] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fgSearchQuery}
                  onChange={e => setFgSearchQuery(e.target.value)}
                  placeholder="Search party, job card, colour..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-[16px] bg-[#fafafb] border border-[#ececec] text-xs text-[#17191c] focus:outline-none focus:border-[#c09748]"
                />
              </div>
            </div>

            {fgRecords.length === 0 ? (
              <div className="p-10 text-center text-xs text-[#777b86] bg-[#fafafb] rounded-[18px] border border-dashed border-[#ececec] space-y-2">
                <Package className="w-8 h-8 text-[#979799] mx-auto" />
                <p className="font-serif text-base text-[#17191c]">Abhi koi FG stock entry nahi hai</p>
                <p>Tab 1 (&quot;Check &amp; Pack&quot;) me pieces pack karte hi FG Stock + Auto-OQC report yahan aa jayegi.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table (4-5 Summary Columns per AGENTS.md) */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#ececec] text-[10px] font-semibold uppercase text-[#777b86]">
                        <th className="py-3 px-3">Ref &amp; Date</th>
                        <th className="py-3 px-3">Party, Model &amp; Colour</th>
                        <th className="py-3 px-3">FG Stock &amp; Boxes</th>
                        <th className="py-3 px-3">OQC &amp; PDI Status</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ececec]/70">
                      {fgRecords.map(slip => {
                        const okQty = slip.packedOkQty ?? slip.packedQty ?? 0;
                        const dispQty = slip.dispatchedQty || 0;
                        const fgBal = Math.max(0, okQty - dispQty);
                        const linkedRel = findLinkedRelease(slip);
                        const pdiCleared = linkedRel?.pdiStatus === 'Cleared for Invoicing';

                        return (
                          <tr key={slip.slipNo} className="hover:bg-[#fafafb]">
                            <td className="py-3 px-3">
                              <div className="font-mono font-bold text-[#8a6521]">{slip.slipNo}</div>
                              <div className="text-[11px] text-[#777b86] font-mono">
                                {slip.date} • {slip.jobCardNo || slip.woNo}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-semibold text-[#17191c]">{slip.customer}</div>
                              <div className="text-[11px] text-[#777b86]">
                                {slip.model || slip.partCode} ({slip.color})
                              </div>
                              {(slip.reworkReturnedQty || 0) > 0 && (
                                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-mono font-bold">
                                  <AlertTriangle size={10} />
                                  {slip.reworkReturnedQty} Rework Returned
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 font-mono">
                              <div className="font-bold text-emerald-700">
                                {fgBal.toLocaleString('en-IN')} / {okQty.toLocaleString('en-IN')} Pcs FG
                              </div>
                              <div className="text-[11px] text-[#777b86]">
                                {slip.totalBoxes ? `${slip.totalBoxes} Boxes • ` : ''}
                                {slip.boxNo}
                              </div>
                            </td>
                            <td className="py-3 px-3 space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                                  OQC OK
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    pdiCleared
                                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                                      : 'bg-[#faf3e0] text-[#8a6521] border-[#f4e5be]'
                                  }`}
                                >
                                  {pdiCleared ? 'PDI Cleared' : 'Awaiting PDI'}
                                </span>
                              </div>
                              <div className="text-[10.5px] font-mono text-[#777b86]">
                                {fgBal <= 0 ? 'Dispatched Out' : 'In FG Store'}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                {linkedRel && (
                                  <button
                                    type="button"
                                    onClick={() => downloadStandardOqcPdf(linkedRel)}
                                    className="px-2.5 py-1 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-[11px] font-semibold transition cursor-pointer inline-flex items-center gap-1"
                                    title="Download Auto-Generated OQC PDF"
                                  >
                                    <Download size={12} className="text-[#c09748]" />
                                    <span>OQC</span>
                                  </button>
                                )}
                                {linkedRel && !pdiCleared && fgBal > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setPdiModalRelease(linkedRel)}
                                    className="px-3 py-1 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-[11px] font-bold transition cursor-pointer inline-flex items-center gap-1"
                                  >
                                    <ShieldCheck size={12} />
                                    <span>Run PDI</span>
                                  </button>
                                )}
                                {linkedRel && pdiCleared && (
                                  <button
                                    type="button"
                                    onClick={() => downloadStandardPdiPdf(linkedRel)}
                                    className="px-2.5 py-1 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-[11px] font-semibold transition cursor-pointer inline-flex items-center gap-1"
                                  >
                                    <Printer size={12} className="text-[#c09748]" />
                                    <span>PDI</span>
                                  </button>
                                )}
                                {fgBal > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      dispatchFgStockFromPacking(slip.slipNo, fgBal);
                                      showTimedToast(`✓ ${fgBal} Pcs FG Dispatched from ${slip.slipNo} — FG Balance ab 0 Pcs hai.`);
                                    }}
                                    className="px-3 py-1 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-[11px] font-semibold transition cursor-pointer inline-flex items-center gap-1"
                                  >
                                    <Truck size={12} className="text-[#c09748]" />
                                    <span>Dispatch FG</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile 3-Row Cards (<640px) */}
                <div className="sm:hidden space-y-3">
                  {fgRecords.map(slip => {
                    const okQty = slip.packedOkQty ?? slip.packedQty ?? 0;
                    const dispQty = slip.dispatchedQty || 0;
                    const fgBal = Math.max(0, okQty - dispQty);
                    const linkedRel = findLinkedRelease(slip);
                    const pdiCleared = linkedRel?.pdiStatus === 'Cleared for Invoicing';

                    return (
                      <div key={slip.slipNo} className="bg-[#fafafb] rounded-[18px] border border-[#ececec] p-3.5 space-y-2 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-[#8a6521]">{slip.slipNo}</span>
                          <span className="font-mono text-[11px] font-bold text-emerald-700">
                            {fgBal} / {okQty} Pcs FG
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-[#17191c]">{slip.customer}</div>
                          <div className="text-[11px] text-[#777b86]">
                            {slip.jobCardNo || slip.woNo} • {slip.model || slip.partCode} ({slip.color})
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <span className="px-2 py-0.5 rounded-full bg-white border border-[#ececec] text-[10px] font-bold text-[#17191c]">
                            OQC OK • {pdiCleared ? 'PDI Cleared' : 'Awaiting PDI'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {linkedRel && !pdiCleared && fgBal > 0 && (
                              <button
                                type="button"
                                onClick={() => setPdiModalRelease(linkedRel)}
                                className="px-2.5 py-1 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10.5px] font-bold"
                              >
                                PDI
                              </button>
                            )}
                            {fgBal > 0 && (
                              <button
                                type="button"
                                onClick={() => dispatchFgStockFromPacking(slip.slipNo, fgBal)}
                                className="px-2.5 py-1 rounded-full bg-[#f2f2f3] text-[#17191c] border border-[#dcdfe4] text-[10.5px] font-semibold"
                              >
                                Dispatch
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {pdiModalRelease && (
        <PDIModal
          isOpen={Boolean(pdiModalRelease)}
          release={pdiModalRelease}
          onClose={() => setPdiModalRelease(null)}
          onSuccess={() => {
            setPdiModalRelease(null);
            showTimedToast('✓ PDI Cleared & Linked to FG Stock Lot!');
          }}
        />
      )}
    </div>
  );
};
