import React, { useState, useMemo } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import {
  FinalQualityRelease,
  PackingSlipRecord,
  resolveJobCardInwardParts
} from '../types/portalTypes';
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
  Download,
  Tag,
  X,
  Check
} from 'lucide-react';
import {
  generateMultiBoxThermalLabelPDF,
  generateA4SheetBoxLabelsPDF,
  getNextBoxCounterRange,
  getCurrentBoxCounter,
  BoxLabelItem
} from '../services/boxLabelPdfService';
import { matchesPlant } from '../utils/portalAuth';
import { PKDropdown } from '../components/PKDropdown';
import { PDIModal } from '../components/PDIModal';
import { downloadStandardOqcPdf, downloadStandardPdiPdf } from '../utils/pdfStandardHeader';

interface ReadyModelRow {
  rowKey: string;
  jobCardNo: string;
  woNo: string;
  customer: string;
  assignmentId?: string;
  partCode: string;
  partDescription: string;
  color: string;
  painter: string;
  paintBatch: string;
  prodOkQty: number;
  alreadyCheckedQty: number;
  readyQty: number;
}

interface RowEditCounts {
  okQty: number;
  reworkQty: number;
  scrapQty: number;
  defectReason: string;
}

const PACKING_DEFECT_REASONS = [
  'Dust Spot / Air Lint',
  'Scratch / Handling Scuff',
  'Paint Missing / Thin Coat',
  'Over Paint / Run / Sagging',
  'Bubble / Pinhole',
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
    materialInwardLogs,
    ipqcRecords,
    fpaRecords,
    recordCheckAndPackBatch,
    recordMultiModelCheckAndPackBatch,
    updatePackingSlipBoxes,
    dispatchFgStockFromPacking
  } = usePortalStore();

  const [activeSubTab, setActiveSubTab] = useState<'ready_queue' | 'reports_fg'>('ready_queue');
  const [partyFilter, setPartyFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showPendingProd, setShowPendingProd] = useState<boolean>(false);
  const [rowEdits, setRowEdits] = useState<Record<string, RowEditCounts>>({});
  const [visualChecksByJc, setVisualChecksByJc] = useState<
    Record<
      string,
      {
        dustSpot: 'Pass' | 'Fail';
        scratch: 'Pass' | 'Fail';
        paintMissing: 'Pass' | 'Fail';
        bubbleOverPaint: 'Pass' | 'Fail';
        colourShade: 'Pass' | 'Fail';
      }
    >
  >({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Tab 2 (Reports & FG) states
  const [fgFilterStatus, setFgFilterStatus] = useState<'ALL' | 'IN_FG' | 'DISPATCHED'>('ALL');
  const [fgSearchQuery, setFgSearchQuery] = useState<string>('');
  const [pdiModalRelease, setPdiModalRelease] = useState<FinalQualityRelease | null>(null);

  // Dedicated Box Label Generator Modal (opens AFTER report creation)
  const [labelTargetSlip, setLabelTargetSlip] = useState<PackingSlipRecord | null>(null);
  const [modalPcsPerBox, setModalPcsPerBox] = useState<number>(150);
  const [currentMasterCounter, setCurrentMasterCounter] = useState<number>(() => getCurrentBoxCounter());

  const showTimedToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 5000);
  };

  // Resolve EVERY model with OK pieces from Production (per assignment/model/colour!)
  const readyModelRows = useMemo<ReadyModelRow[]>(() => {
    const plantSlips = packingSlips.filter(s => matchesPlant(s.plant, activePlant));
    const rows: ReadyModelRow[] = [];

    jobCards
      .filter(jc => matchesPlant(jc.plant, activePlant))
      .forEach(jc => {
        const jcAssignments = painterAssignments.filter(
          a => a.masterJobCardNo === jc.jobCardNo || a.masterJobCardId === jc.jobCardNo
        );

        if (jcAssignments.length > 0) {
          jcAssignments.forEach(asg => {
            // Production OK from stage_3_topcoat logs or assignment.actualCompletedQty
            const stage3Logs = (jc.progressLogs || []).filter(
              l =>
                l.assignmentId === asg.id &&
                l.processStage === 'stage_3_topcoat' &&
                l.actionType !== 'BATCH_OUTPUT'
            );
            const _sumLogs = stage3Logs.reduce((s, l) => s + (l.goodPieces || 0), 0);
            const prodOkQty = Math.max(asg.actualCompletedQty || 0, _sumLogs);

            const alreadyCheckedQty = plantSlips
              .filter(
                s =>
                  s.assignmentId === asg.id ||
                  (!s.assignmentId &&
                    (s.jobCardNo === jc.jobCardNo || s.woNo === jc.woNo) &&
                    s.partCode === (asg.partCode || jc.partCode) &&
                    s.color === (asg.colorShade || jc.color))
              )
              .reduce((sum, s) => sum + (s.offeredQty ?? s.packedOkQty ?? s.packedQty ?? 0), 0);

            const readyQty = Math.max(0, prodOkQty - alreadyCheckedQty);
            rows.push({
              rowKey: `ASG:${asg.id}`,
              jobCardNo: jc.jobCardNo,
              woNo: jc.woNo || jc.jobCardNo,
              customer: jc.customer,
              assignmentId: asg.id,
              partCode: asg.partCode || jc.partCode || 'PART',
              partDescription: asg.partDescription || jc.partDescription || asg.partCode || 'Painted Component',
              color: asg.colorShade || jc.color || 'Standard Shade',
              painter: asg.painterName,
              paintBatch:
                ipqcRecords.find(ip => ip.jobCardNo === jc.jobCardNo || ip.woNo === jc.woNo)?.paintBatchNumber ||
                fpaRecords.find(f => f.jobCardNo === jc.jobCardNo || f.woNo === jc.woNo)?.paintBatch ||
                'BAT-STD',
              prodOkQty,
              alreadyCheckedQty,
              readyQty
            });
          });
        } else {
          // Legacy Job Card without Tier-2 painter assignments: resolve inward models
          const parts = resolveJobCardInwardParts(jc, materialInwardLogs);
          const totalJobOk = jc.goodQty || 0;
          if (parts.length > 0 && totalJobOk > 0) {
            parts.forEach((p, idx) => {
              const partOk = parts.length === 1 ? totalJobOk : Math.min(totalJobOk, p.targetQty);
              const alreadyCheckedQty = plantSlips
                .filter(
                  s =>
                    (s.jobCardNo === jc.jobCardNo || s.woNo === jc.woNo) &&
                    s.partCode === p.partCode
                )
                .reduce((sum, s) => sum + (s.offeredQty ?? s.packedOkQty ?? s.packedQty ?? 0), 0);
              const readyQty = Math.max(0, partOk - alreadyCheckedQty);
              rows.push({
                rowKey: `JC:${jc.jobCardNo}:P${idx}:${p.partCode}`,
                jobCardNo: jc.jobCardNo,
                woNo: jc.woNo || jc.jobCardNo,
                customer: jc.customer,
                partCode: p.partCode,
                partDescription: p.partDescription,
                color: jc.color || 'Standard Shade',
                painter: jc.assignedPainterName || jc.painterName || 'Production Floor',
                paintBatch: 'BAT-STD',
                prodOkQty: partOk,
                alreadyCheckedQty,
                readyQty
              });
            });
          }
        }
      });

    return rows;
  }, [jobCards, painterAssignments, packingSlips, materialInwardLogs, ipqcRecords, fpaRecords, activePlant]);

  const distinctParties = useMemo(() => {
    return Array.from(new Set(readyModelRows.map(r => r.customer).filter(Boolean)));
  }, [readyModelRows]);

  const filteredReadyRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return readyModelRows.filter(r => {
      if (!showPendingProd && r.readyQty <= 0) return false;
      if (partyFilter !== 'ALL' && r.customer !== partyFilter) return false;
      if (!q) return true;
      return (
        r.customer.toLowerCase().includes(q) ||
        r.jobCardNo.toLowerCase().includes(q) ||
        r.partDescription.toLowerCase().includes(q) ||
        r.partCode.toLowerCase().includes(q) ||
        r.color.toLowerCase().includes(q) ||
        r.painter.toLowerCase().includes(q)
      );
    });
  }, [readyModelRows, showPendingProd, partyFilter, searchQuery]);

  // Group filtered rows by Party + Job Card so all 10 models under 1 Party appear neatly together
  const groupedByJobCard = useMemo(() => {
    const map = new Map<
      string,
      {
        jobCardNo: string;
        woNo: string;
        customer: string;
        rows: ReadyModelRow[];
        totalReady: number;
      }
    >();
    filteredReadyRows.forEach(r => {
      const existing = map.get(r.jobCardNo);
      if (existing) {
        existing.rows.push(r);
        existing.totalReady += r.readyQty;
      } else {
        map.set(r.jobCardNo, {
          jobCardNo: r.jobCardNo,
          woNo: r.woNo,
          customer: r.customer,
          rows: [r],
          totalReady: r.readyQty
        });
      }
    });
    return Array.from(map.values());
  }, [filteredReadyRows]);

  const getRowValues = (r: ReadyModelRow): RowEditCounts => {
    return (
      rowEdits[r.rowKey] || {
        okQty: r.readyQty,
        reworkQty: 0,
        scrapQty: 0,
        defectReason: PACKING_DEFECT_REASONS[0]
      }
    );
  };

  const updateRowCounts = (r: ReadyModelRow, field: 'ok' | 'rework' | 'scrap', rawVal: number) => {
    const val = Math.max(0, isNaN(rawVal) ? 0 : rawVal);
    const maxCap = r.readyQty;
    const prev = getRowValues(r);

    let okQty = prev.okQty;
    let reworkQty = prev.reworkQty;
    let scrapQty = prev.scrapQty;

    if (field === 'ok') {
      okQty = Math.min(maxCap, val);
      const rem = Math.max(0, maxCap - okQty);
      scrapQty = Math.min(prev.scrapQty, rem);
      reworkQty = Math.max(0, rem - scrapQty);
    } else if (field === 'rework') {
      const maxRw = Math.max(0, maxCap - prev.scrapQty);
      reworkQty = Math.min(maxRw, val);
      okQty = Math.max(0, maxCap - reworkQty - prev.scrapQty);
    } else {
      const maxSc = Math.max(0, maxCap - prev.reworkQty);
      scrapQty = Math.min(maxSc, val);
      okQty = Math.max(0, maxCap - prev.reworkQty - scrapQty);
    }

    setRowEdits(curr => ({
      ...curr,
      [r.rowKey]: {
        okQty,
        reworkQty,
        scrapQty,
        defectReason: prev.defectReason
      }
    }));
  };

  const updateRowReason = (r: ReadyModelRow, reason: string) => {
    const prev = getRowValues(r);
    setRowEdits(curr => ({
      ...curr,
      [r.rowKey]: { ...prev, defectReason: reason }
    }));
  };

  const getJcVisualChecks = (jcNo: string) => {
    return (
      visualChecksByJc[jcNo] || {
        dustSpot: 'Pass' as const,
        scratch: 'Pass' as const,
        paintMissing: 'Pass' as const,
        bubbleOverPaint: 'Pass' as const,
        colourShade: 'Pass' as const
      }
    );
  };

  const toggleJcVisualCheck = (
    jcNo: string,
    key: 'dustSpot' | 'scratch' | 'paintMissing' | 'bubbleOverPaint' | 'colourShade'
  ) => {
    const current = getJcVisualChecks(jcNo);
    setVisualChecksByJc(prev => ({
      ...prev,
      [jcNo]: {
        ...current,
        [key]: current[key] === 'Pass' ? 'Fail' : 'Pass'
      }
    }));
  };

  const getIpqcDeltaForJob = (jcNo: string, woNo: string) => {
    const m = ipqcRecords.find(ip => ip.jobCardNo === jcNo || ip.woNo === woNo);
    if (!m) return null;
    return Number(m.deltaE || 0);
  };

  // Save a single model row directly
  const handleSaveSingleModel = (r: ReadyModelRow) => {
    if (r.readyQty <= 0) return;
    const vals = getRowValues(r);
    const totalChecked = vals.okQty + vals.reworkQty + vals.scrapQty;
    if (totalChecked <= 0) return;

    const { slip, release } = recordCheckAndPackBatch({
      jobCardNo: r.jobCardNo,
      woNo: r.woNo,
      assignmentId: r.assignmentId,
      customer: r.customer,
      partCode: r.partCode,
      partDescription: r.partDescription,
      color: r.color,
      plant: activePlant === 'ALL' ? 'Haridwar' : activePlant,
      offeredQty: totalChecked,
      packedOkQty: vals.okQty,
      reworkReturnedQty: vals.reworkQty,
      scrapQty: vals.scrapQty,
      defectReason: vals.reworkQty + vals.scrapQty > 0 ? vals.defectReason : undefined,
      pcsPerBox: 0,
      totalBoxes: 0,
      boxSerialRange: 'Labels Pending',
      painter: r.painter,
      paintBatch: r.paintBatch,
      packedBy: currentUser?.name || 'Packing & OQC Desk'
    });

    setRowEdits(curr => {
      const next = { ...curr };
      delete next[r.rowKey];
      return next;
    });

    showTimedToast(
      `✓ ${r.partDescription} (${r.color}) Saved (${slip.slipNo} • OQC ${release.reportNo}): ${vals.okQty} OK${vals.reworkQty > 0 ? `, ${vals.reworkQty} Rework` : ''}${vals.scrapQty > 0 ? `, ${vals.scrapQty} Reject` : ''}. Ab Tab 2 se Box Labels generate karein!`
    );
  };

  // Save ALL ready models of 1 Party / Job Card into 1 Combined OQC Report + per-model FG entries
  const handleSavePartyBatch = (group: {
    jobCardNo: string;
    woNo: string;
    customer: string;
    rows: ReadyModelRow[];
  }) => {
    const readyItems = group.rows.filter(r => r.readyQty > 0);
    if (readyItems.length === 0) return;

    const itemsPayload = readyItems
      .map(r => {
        const vals = getRowValues(r);
        const offeredQty = vals.okQty + vals.reworkQty + vals.scrapQty;
        return {
          assignmentId: r.assignmentId,
          partCode: r.partCode,
          partDescription: r.partDescription,
          color: r.color,
          painter: r.painter,
          paintBatch: r.paintBatch,
          offeredQty,
          packedOkQty: vals.okQty,
          reworkReturnedQty: vals.reworkQty,
          scrapQty: vals.scrapQty,
          defectReason: vals.reworkQty + vals.scrapQty > 0 ? vals.defectReason : undefined
        };
      })
      .filter(it => it.offeredQty > 0);

    if (itemsPayload.length === 0) return;

    const { slips, release } = recordMultiModelCheckAndPackBatch({
      jobCardNo: group.jobCardNo,
      woNo: group.woNo,
      customer: group.customer,
      plant: activePlant === 'ALL' ? 'Haridwar' : activePlant,
      packedBy: currentUser?.name || 'Packing & OQC Desk',
      visualChecks: getJcVisualChecks(group.jobCardNo),
      items: itemsPayload
    });

    setRowEdits(curr => {
      const next = { ...curr };
      readyItems.forEach(r => delete next[r.rowKey]);
      return next;
    });

    const totalOk = itemsPayload.reduce((s, i) => s + i.packedOkQty, 0);
    const totalRw = itemsPayload.reduce((s, i) => s + i.reworkReturnedQty, 0);
    const totalSc = itemsPayload.reduce((s, i) => s + i.scrapQty, 0);

    showTimedToast(
      `✓ ${group.customer} (${itemsPayload.length} Models) Packed & 1 Combined OQC (${release.reportNo}) Created! ${totalOk} OK → FG${totalRw > 0 ? `, ${totalRw} Rework` : ''}${totalSc > 0 ? `, ${totalSc} Reject` : ''}. (${slips.length} slips ready for Box Labels)`
    );
  };

  // Tab 2: Reports & FG Register
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
    let totalRejected = 0;

    plantSlips.forEach(s => {
      const ok = s.packedOkQty ?? s.packedQty ?? 0;
      const disp = s.dispatchedQty || 0;
      totalPackedOk += ok;
      totalDispatched += disp;
      totalReworkCaught += s.reworkReturnedQty || 0;
      totalRejected += s.scrapQty || 0;
    });

    return {
      reportsCount: plantSlips.length,
      totalPackedOk,
      inFgBalance: Math.max(0, totalPackedOk - totalDispatched),
      totalDispatched,
      totalReworkCaught,
      totalRejected
    };
  }, [packingSlips, activePlant]);

  const findLinkedRelease = (slip: PackingSlipRecord): FinalQualityRelease | undefined => {
    return qualityReleases.find(
      r =>
        (slip.oqcReleaseId && r.releaseId === slip.oqcReleaseId) ||
        (slip.jobCardNo && r.jobCardNo === slip.jobCardNo) ||
        r.woNo === slip.woNo
    );
  };

  // Box Label Calculation inside Post-Report Modal
  const modalCalculatedBoxes = useMemo(() => {
    if (!labelTargetSlip) return [];
    const lotOk = labelTargetSlip.packedOkQty ?? labelTargetSlip.packedQty ?? 0;
    if (lotOk <= 0 || modalPcsPerBox <= 0) return [];
    const fullBoxes = Math.floor(lotOk / modalPcsPerBox);
    const remainder = lotOk % modalPcsPerBox;
    const totalBoxCount = remainder > 0 ? fullBoxes + 1 : fullBoxes;
    const list: Array<{ orderIndex: number; totalBoxes: number; qty: number }> = [];
    for (let i = 1; i <= fullBoxes; i++) {
      list.push({ orderIndex: i, totalBoxes: totalBoxCount, qty: modalPcsPerBox });
    }
    if (remainder > 0) {
      list.push({ orderIndex: totalBoxCount, totalBoxes: totalBoxCount, qty: remainder });
    }
    return list;
  }, [labelTargetSlip, modalPcsPerBox]);

  const handlePrintModalLabels = (mode: 'a4' | 'thermal') => {
    if (!labelTargetSlip || modalCalculatedBoxes.length === 0) return;
    const lotOk = labelTargetSlip.packedOkQty ?? labelTargetSlip.packedQty ?? 0;
    const startNum = getNextBoxCounterRange(modalCalculatedBoxes.length);
    const endNum = startNum + modalCalculatedBoxes.length - 1;
    setCurrentMasterCounter(endNum);

    const payloads: BoxLabelItem[] = modalCalculatedBoxes.map((b, idx) => {
      const globalNum = startNum + idx;
      return {
        globalBoxNumber: globalNum,
        boxSerialText: `PK-BOX-${String(globalNum).padStart(4, '0')}`,
        orderBoxIndex: b.orderIndex,
        totalOrderBoxes: b.totalBoxes,
        boxQty: b.qty,
        totalLotQty: lotOk,
        customer: labelTargetSlip.customer,
        woNo: labelTargetSlip.jobCardNo || labelTargetSlip.woNo,
        partCode: labelTargetSlip.partCode,
        partDescription: labelTargetSlip.partDescription || labelTargetSlip.model,
        color: labelTargetSlip.color,
        paintBatch: labelTargetSlip.paintBatch || 'BAT-STD',
        painter: labelTargetSlip.painter || 'Production Line',
        packedBy: labelTargetSlip.packedBy || currentUser?.name || 'Packing Desk',
        packedDate: labelTargetSlip.date || new Date().toLocaleDateString('en-GB'),
        plant: labelTargetSlip.plant || activePlant
      };
    });

    if (mode === 'thermal') {
      generateMultiBoxThermalLabelPDF(payloads, `${labelTargetSlip.slipNo}_${labelTargetSlip.partCode}`);
    } else {
      generateA4SheetBoxLabelsPDF(payloads, `${labelTargetSlip.slipNo}_${labelTargetSlip.partCode}`);
    }

    const rangeLabel =
      startNum === endNum
        ? `PK-BOX-${String(startNum).padStart(4, '0')}`
        : `PK-BOX-${String(startNum).padStart(4, '0')} – PK-BOX-${String(endNum).padStart(4, '0')}`;
    updatePackingSlipBoxes(labelTargetSlip.slipNo, rangeLabel, modalPcsPerBox, modalCalculatedBoxes.length);
    setLabelTargetSlip(prev =>
      prev ? { ...prev, boxNo: rangeLabel, pcsPerBox: modalPcsPerBox, totalBoxes: modalCalculatedBoxes.length } : null
    );
    showTimedToast(`✓ ${modalCalculatedBoxes.length} Box Labels (${rangeLabel}) generated for ${labelTargetSlip.model}!`);
  };

  const totalModelsReadyCount = readyModelRows.filter(r => r.readyQty > 0).length;
  const totalPiecesReadyCount = readyModelRows.reduce((s, r) => s + r.readyQty, 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Switcher */}
      <div className="bg-white rounded-[24px] p-6 border border-[#ececec] shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
              PK-STR-PKG-001 • PACKING &amp; OQC DESK
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
              {totalModelsReadyCount} Models Ready ({totalPiecesReadyCount.toLocaleString('en-IN')} Pcs)
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#fafafb] text-[#17191c] border border-[#ececec] font-mono font-semibold">
              FG Stock: {fgMetrics.inFgBalance.toLocaleString('en-IN')} Pcs
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-normal text-[#17191c] tracking-tight">
            Packing Queue, OQC Reports &amp; Box Labels
          </h1>
          <p className="text-xs text-[#777b86] mt-1">
            Step 1: Production se OK hokar aaye har Party &amp; Model par OK / Rework / Rejection enter karein • Step 2: Report banne ke baad uspar Box Labels generate karein.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex p-1 rounded-full bg-[#fafafb] border border-[#ececec]">
            <button
              type="button"
              onClick={() => setActiveSubTab('ready_queue')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'ready_queue'
                  ? 'bg-[#c09748] text-white shadow-xs'
                  : 'text-[#777b86] hover:text-[#17191c]'
              }`}
            >
              <Package size={14} />
              <span>1. Production OK List ({totalModelsReadyCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('reports_fg')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'reports_fg'
                  ? 'bg-[#c09748] text-white shadow-xs'
                  : 'text-[#777b86] hover:text-[#17191c]'
              }`}
            >
              <ClipboardCheck size={14} />
              <span>2. Packing / OQC &amp; Box Labels ({fgRecords.length})</span>
            </button>
          </div>
        </div>
      </div>

      {toastMsg && (
        <div className="p-4 rounded-[18px] bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          {activeSubTab === 'ready_queue' && (
            <button
              type="button"
              onClick={() => setActiveSubTab('reports_fg')}
              className="px-3.5 py-1.5 rounded-full bg-white border border-emerald-300 text-emerald-800 text-[11px] font-bold hover:bg-emerald-100 cursor-pointer shrink-0 self-start sm:self-auto"
            >
              Go to Reports &amp; Generate Box Labels →
            </button>
          )}
        </div>
      )}

      {activeSubTab === 'ready_queue' ? (
        /* TAB 1: CLEAN PARTY & MODEL-WISE PRODUCTION OK LIST */
        <div className="space-y-5">
          {/* Party Filter Pills + Search */}
          <div className="bg-white rounded-[24px] p-5 border border-[#ececec] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10.5px] font-mono uppercase tracking-wider font-bold text-[#777b86] mr-1">
                PARTY FILTER:
              </span>
              <button
                type="button"
                onClick={() => setPartyFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                  partyFilter === 'ALL'
                    ? 'bg-[#faf3e0] text-[#8a6521] border-[#c09748]'
                    : 'bg-[#fafafb] text-[#777b86] border-[#ececec] hover:text-[#17191c]'
                }`}
              >
                All Parties ({distinctParties.length})
              </button>
              {distinctParties.map(party => {
                const count = readyModelRows.filter(r => r.customer === party && r.readyQty > 0).length;
                return (
                  <button
                    key={party}
                    type="button"
                    onClick={() => setPartyFilter(party)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                      partyFilter === party
                        ? 'bg-[#faf3e0] text-[#8a6521] border-[#c09748]'
                        : 'bg-[#fafafb] text-[#777b86] border-[#ececec] hover:text-[#17191c]'
                    }`}
                  >
                    {party} ({count})
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => setShowPendingProd(prev => !prev)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition cursor-pointer ${
                  showPendingProd
                    ? 'bg-[#faf3e0] text-[#8a6521] border-[#f4e5be]'
                    : 'bg-[#fafafb] text-[#777b86] border-[#ececec]'
                }`}
              >
                {showPendingProd ? 'Showing All Assigned Models' : 'Showing Production OK Only'}
              </button>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-[#979799] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search party, model, shade..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-[16px] bg-[#fafafb] border border-[#ececec] text-xs text-[#17191c] focus:outline-none focus:border-[#c09748]"
                />
              </div>
            </div>
          </div>

          {groupedByJobCard.length === 0 ? (
            <div className="bg-white rounded-[24px] p-10 border border-dashed border-[#dcdfe4] text-center space-y-3">
              <Package className="w-10 h-10 text-[#979799] mx-auto" />
              <div className="space-y-1">
                <p className="font-serif text-lg text-[#17191c]">
                  Abhi Production se koi OK pieces Packing me nahi aaye hain
                </p>
                <p className="text-xs text-[#777b86] max-w-lg mx-auto">
                  Jab Production Supervisor <strong>Job Cards &amp; Batches</strong> me Painter ka EOD Final OK save karega, toh woh saare Party &amp; Models yahan list me automatically dikh jayenge.
                </p>
              </div>
              {readyModelRows.length > 0 && !showPendingProd && (
                <button
                  type="button"
                  onClick={() => setShowPendingProd(true)}
                  className="px-4 py-2 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs font-bold cursor-pointer transition"
                >
                  View Assigned Models Awaiting Production EOD ({readyModelRows.length})
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {groupedByJobCard.map(group => {
                const ipqcDelta = getIpqcDeltaForJob(group.jobCardNo, group.woNo);
                const visual = getJcVisualChecks(group.jobCardNo);
                const readyCountInGroup = group.rows.filter(r => r.readyQty > 0).length;

                return (
                  <div
                    key={group.jobCardNo}
                    className="bg-white rounded-[24px] p-6 border border-[#ececec] shadow-2xs space-y-4"
                  >
                    {/* Party & Job Card Group Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 border-b border-[#ececec]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] font-mono text-[11px] font-bold">
                            {group.jobCardNo}
                          </span>
                          <span className="font-serif text-lg text-[#17191c]">{group.customer}</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[11px] font-bold">
                            {group.rows.length} Model{group.rows.length > 1 ? 's' : ''} • {group.totalReady.toLocaleString('en-IN')} Pcs OK from Production
                          </span>
                          {ipqcDelta !== null ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-mono text-[10.5px] font-bold flex items-center gap-1">
                              <ShieldCheck size={12} />
                              <span>IPQC ΔE {ipqcDelta} Auto-Linked</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] text-[#777b86] border border-[#ececec] font-mono text-[10.5px]">
                              Visual Sample Shade Match
                            </span>
                          )}
                        </div>
                      </div>

                      {readyCountInGroup > 0 && (
                        <button
                          type="button"
                          onClick={() => handleSavePartyBatch(group)}
                          className="px-5 py-2 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5 self-start lg:self-auto active:scale-95"
                        >
                          <CheckCircle2 size={14} />
                          <span>
                            Save All {readyCountInGroup} Model{readyCountInGroup > 1 ? 's' : ''} &amp; Create 1 OQC Report
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Quick 5-Point Batch Visual Checks (No Delta-E typing needed!) */}
                    <div className="p-3 rounded-[16px] bg-[#faf7ed] border border-[#f4e5be] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <span className="text-[10.5px] font-mono font-bold uppercase text-[#8a6521] shrink-0">
                        Lot Visual Check (OQC):
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(
                          [
                            { key: 'dustSpot', label: 'Dust Free' },
                            { key: 'scratch', label: 'Scratch / Damage Free' },
                            { key: 'paintMissing', label: 'No Paint Missing' },
                            { key: 'bubbleOverPaint', label: 'No Bubble / Run' },
                            { key: 'colourShade', label: 'Shade & Finish OK' }
                          ] as const
                        ).map(chk => {
                          const isPass = visual[chk.key] === 'Pass';
                          return (
                            <button
                              key={chk.key}
                              type="button"
                              onClick={() => toggleJcVisualCheck(group.jobCardNo, chk.key)}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                                isPass
                                  ? 'bg-white text-emerald-800 border-emerald-300'
                                  : 'bg-rose-50 text-rose-800 border-rose-300'
                              }`}
                            >
                              {isPass ? <Check size={11} /> : <AlertTriangle size={11} />}
                              <span>{chk.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Desktop Model List Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#ececec] text-[10px] font-semibold uppercase text-[#777b86]">
                            <th className="py-2.5 px-3">Model &amp; Colour</th>
                            <th className="py-2.5 px-3 text-center">Prod OK</th>
                            <th className="py-2.5 px-3 w-28">Packing OK</th>
                            <th className="py-2.5 px-3 w-28">Rework</th>
                            <th className="py-2.5 px-3 w-28">Rejection</th>
                            <th className="py-2.5 px-3">Defect Reason (If Rework/Reject)</th>
                            <th className="py-2.5 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#ececec]/70">
                          {group.rows.map(r => {
                            const vals = getRowValues(r);
                            const hasDefects = vals.reworkQty > 0 || vals.scrapQty > 0;
                            const isReady = r.readyQty > 0;
                            return (
                              <tr key={r.rowKey} className={isReady ? 'hover:bg-[#fafafb]' : 'opacity-60 bg-[#fafafb]'}>
                                <td className="py-3 px-3">
                                  <div className="font-semibold text-[#17191c]">{r.partDescription}</div>
                                  <div className="text-[11px] text-[#777b86] flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    <span className="font-mono">{r.partCode}</span>
                                    <span>•</span>
                                    <span className="px-2 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10px] font-bold">
                                      {r.color}
                                    </span>
                                    <span>• {r.painter.split('(')[0].trim()}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-center font-mono">
                                  {isReady ? (
                                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                                      {r.readyQty} Pcs
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-[#777b86]">
                                      {r.alreadyCheckedQty > 0 ? `${r.alreadyCheckedQty} Packed` : '0 OK Yet'}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-2">
                                  <input
                                    type="number"
                                    min={0}
                                    max={r.readyQty}
                                    disabled={!isReady}
                                    value={vals.okQty}
                                    onChange={e => updateRowCounts(r, 'ok', Number(e.target.value))}
                                    className="w-full px-2.5 py-1.5 rounded-[12px] bg-white border border-emerald-300 font-mono text-xs font-bold text-emerald-800 disabled:bg-[#f2f2f3] focus:outline-none focus:border-emerald-500"
                                  />
                                </td>
                                <td className="py-3 px-2">
                                  <input
                                    type="number"
                                    min={0}
                                    max={r.readyQty}
                                    disabled={!isReady}
                                    value={vals.reworkQty}
                                    onChange={e => updateRowCounts(r, 'rework', Number(e.target.value))}
                                    className="w-full px-2.5 py-1.5 rounded-[12px] bg-white border border-amber-300 font-mono text-xs font-bold text-amber-900 disabled:bg-[#f2f2f3] focus:outline-none focus:border-amber-500"
                                  />
                                </td>
                                <td className="py-3 px-2">
                                  <input
                                    type="number"
                                    min={0}
                                    max={r.readyQty}
                                    disabled={!isReady}
                                    value={vals.scrapQty}
                                    onChange={e => updateRowCounts(r, 'scrap', Number(e.target.value))}
                                    className="w-full px-2.5 py-1.5 rounded-[12px] bg-white border border-rose-300 font-mono text-xs font-bold text-rose-800 disabled:bg-[#f2f2f3] focus:outline-none focus:border-rose-500"
                                  />
                                </td>
                                <td className="py-3 px-2 min-w-[180px]">
                                  {hasDefects && isReady ? (
                                    <PKDropdown
                                      compact
                                      value={vals.defectReason}
                                      onChange={val => updateRowReason(r, val)}
                                      options={PACKING_DEFECT_REASONS.map(d => ({ value: d, label: d }))}
                                    />
                                  ) : (
                                    <span className="text-[11px] text-[#979799] font-mono">—</span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-right">
                                  {isReady ? (
                                    <button
                                      type="button"
                                      onClick={() => handleSaveSingleModel(r)}
                                      className="px-3.5 py-1.5 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-[11px] font-bold transition cursor-pointer active:scale-95"
                                    >
                                      Save Model
                                    </button>
                                  ) : (
                                    <span className="text-[10.5px] font-mono text-[#979799]">Pending</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Model Cards (<768px) */}
                    <div className="md:hidden space-y-3">
                      {group.rows.map(r => {
                        const vals = getRowValues(r);
                        const hasDefects = vals.reworkQty > 0 || vals.scrapQty > 0;
                        const isReady = r.readyQty > 0;
                        return (
                          <div
                            key={r.rowKey}
                            className="p-3.5 rounded-[18px] bg-[#fafafb] border border-[#ececec] space-y-2.5 text-xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-semibold text-[#17191c]">{r.partDescription}</div>
                                <div className="text-[11px] text-[#777b86]">
                                  {r.color} • {r.painter.split('(')[0].trim()}
                                </div>
                              </div>
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold text-[11px] shrink-0">
                                {r.readyQty} Ready
                              </span>
                            </div>

                            {isReady && (
                              <>
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <span className="text-[10px] font-mono font-bold text-emerald-800 block mb-0.5">OK</span>
                                    <input
                                      type="number"
                                      min={0}
                                      max={r.readyQty}
                                      value={vals.okQty}
                                      onChange={e => updateRowCounts(r, 'ok', Number(e.target.value))}
                                      className="w-full px-2 py-1.5 rounded-[10px] bg-white border border-emerald-300 font-mono text-xs font-bold text-emerald-800"
                                    />
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-mono font-bold text-amber-800 block mb-0.5">Rework</span>
                                    <input
                                      type="number"
                                      min={0}
                                      max={r.readyQty}
                                      value={vals.reworkQty}
                                      onChange={e => updateRowCounts(r, 'rework', Number(e.target.value))}
                                      className="w-full px-2 py-1.5 rounded-[10px] bg-white border border-amber-300 font-mono text-xs font-bold text-amber-900"
                                    />
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-mono font-bold text-rose-800 block mb-0.5">Reject</span>
                                    <input
                                      type="number"
                                      min={0}
                                      max={r.readyQty}
                                      value={vals.scrapQty}
                                      onChange={e => updateRowCounts(r, 'scrap', Number(e.target.value))}
                                      className="w-full px-2 py-1.5 rounded-[10px] bg-white border border-rose-300 font-mono text-xs font-bold text-rose-800"
                                    />
                                  </div>
                                </div>

                                {hasDefects && (
                                  <PKDropdown
                                    compact
                                    value={vals.defectReason}
                                    onChange={val => updateRowReason(r, val)}
                                    options={PACKING_DEFECT_REASONS.map(d => ({ value: d, label: d }))}
                                  />
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleSaveSingleModel(r)}
                                  className="w-full py-2 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] font-bold text-xs cursor-pointer"
                                >
                                  Save {r.partDescription} Report
                                </button>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: CREATED PACKING + OQC REPORTS, FG STOCK & BOX LABEL GENERATION */
        <div className="space-y-5">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-[20px] border border-[#ececec] shadow-2xs">
              <span className="text-[10px] font-mono uppercase text-[#777b86] font-bold block">Total Packed (FG)</span>
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
            <div className="bg-amber-50/70 p-4 rounded-[20px] border border-amber-200 shadow-2xs">
              <span className="text-[10px] font-mono uppercase text-amber-900 font-bold block">Packing Rework</span>
              <span className="font-serif text-2xl text-amber-900 block mt-1">
                {fgMetrics.totalReworkCaught.toLocaleString('en-IN')} <span className="text-xs text-amber-800">Pcs</span>
              </span>
            </div>
            <div className="bg-rose-50/70 p-4 rounded-[20px] border border-rose-200 shadow-2xs col-span-2 lg:col-span-1">
              <span className="text-[10px] font-mono uppercase text-rose-900 font-bold block">Packing Rejection</span>
              <span className="font-serif text-2xl text-rose-800 block mt-1">
                {fgMetrics.totalRejected.toLocaleString('en-IN')} <span className="text-xs text-rose-700">Pcs</span>
              </span>
            </div>
          </div>

          <div className="bg-white rounded-[24px] p-6 border border-[#ececec] shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ececec]">
              <div className="flex items-center gap-2 flex-wrap">
                {(
                  [
                    { key: 'ALL', label: 'All Reports' },
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
                  placeholder="Search party, model, OQC..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-[16px] bg-[#fafafb] border border-[#ececec] text-xs text-[#17191c] focus:outline-none focus:border-[#c09748]"
                />
              </div>
            </div>

            {fgRecords.length === 0 ? (
              <div className="p-10 text-center text-xs text-[#777b86] bg-[#fafafb] rounded-[18px] border border-dashed border-[#ececec] space-y-2">
                <Box className="w-8 h-8 text-[#979799] mx-auto" />
                <p className="font-serif text-base text-[#17191c]">Abhi koi Packing Report create nahi hui hai</p>
                <p>Tab 1 (&quot;Production OK List&quot;) me model check karke Save karte hi report aur Box Label option yahan dikh jayega.</p>
              </div>
            ) : (
              <>
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#ececec] text-[10px] font-semibold uppercase text-[#777b86]">
                        <th className="py-3 px-3">Report &amp; Date</th>
                        <th className="py-3 px-3">Party, Model &amp; Colour</th>
                        <th className="py-3 px-3">FG Stock &amp; Box Labels</th>
                        <th className="py-3 px-3">OQC / PDI / ΔE</th>
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
                        const hasBoxes = Boolean(slip.totalBoxes && slip.totalBoxes > 0);

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
                              {((slip.reworkReturnedQty || 0) > 0 || (slip.scrapQty || 0) > 0) && (
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  {(slip.reworkReturnedQty || 0) > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-mono font-bold">
                                      {slip.reworkReturnedQty} Rework
                                    </span>
                                  )}
                                  {(slip.scrapQty || 0) > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-mono font-bold">
                                      {slip.scrapQty} Reject
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3 font-mono">
                              <div className="font-bold text-emerald-700">
                                {fgBal.toLocaleString('en-IN')} / {okQty.toLocaleString('en-IN')} Pcs FG
                              </div>
                              <div className="text-[11px] text-[#777b86]">
                                {hasBoxes ? `${slip.totalBoxes} Boxes (${slip.boxNo})` : 'Box Labels Not Printed Yet'}
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
                              {linkedRel && linkedRel.deltaE > 0 && (
                                <div className="text-[10px] font-mono text-[#777b86]">
                                  {linkedRel.deltaSource || 'IPQC'} ΔE: {linkedRel.deltaE}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                {okQty > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setLabelTargetSlip(slip);
                                      setModalPcsPerBox(slip.pcsPerBox && slip.pcsPerBox > 0 ? slip.pcsPerBox : Math.min(150, okQty));
                                    }}
                                    className="px-3 py-1 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-white text-[11px] font-bold transition cursor-pointer inline-flex items-center gap-1 shadow-2xs active:scale-95"
                                  >
                                    <Tag size={12} />
                                    <span>{hasBoxes ? 'Reprint Labels' : 'Generate Box Labels'}</span>
                                  </button>
                                )}
                                {linkedRel && (
                                  <button
                                    type="button"
                                    onClick={() => downloadStandardOqcPdf(linkedRel)}
                                    className="px-2.5 py-1 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-[11px] font-semibold transition cursor-pointer inline-flex items-center gap-1"
                                  >
                                    <Download size={12} className="text-[#c09748]" />
                                    <span>OQC</span>
                                  </button>
                                )}
                                {linkedRel && !pdiCleared && fgBal > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setPdiModalRelease(linkedRel)}
                                    className="px-2.5 py-1 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-[11px] font-bold transition cursor-pointer inline-flex items-center gap-1"
                                  >
                                    <ShieldCheck size={12} />
                                    <span>PDI</span>
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
                                      showTimedToast(`✓ ${fgBal} Pcs FG Dispatched (${slip.model}).`);
                                    }}
                                    className="px-2.5 py-1 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-[11px] font-semibold transition cursor-pointer inline-flex items-center gap-1"
                                  >
                                    <Truck size={12} className="text-[#c09748]" />
                                    <span>Dispatch</span>
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

                {/* Mobile Cards */}
                <div className="sm:hidden space-y-3">
                  {fgRecords.map(slip => {
                    const okQty = slip.packedOkQty ?? slip.packedQty ?? 0;
                    const dispQty = slip.dispatchedQty || 0;
                    const fgBal = Math.max(0, okQty - dispQty);
                    const linkedRel = findLinkedRelease(slip);

                    return (
                      <div key={slip.slipNo} className="bg-[#fafafb] rounded-[18px] border border-[#ececec] p-3.5 space-y-2 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-[#8a6521]">{slip.slipNo}</span>
                          <span className="font-mono font-bold text-emerald-700">{fgBal} / {okQty} Pcs FG</span>
                        </div>
                        <div>
                          <div className="font-semibold text-[#17191c]">{slip.customer}</div>
                          <div className="text-[11px] text-[#777b86]">{slip.model} ({slip.color})</div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {okQty > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setLabelTargetSlip(slip);
                                setModalPcsPerBox(slip.pcsPerBox && slip.pcsPerBox > 0 ? slip.pcsPerBox : Math.min(150, okQty));
                              }}
                              className="px-3 py-1 rounded-full bg-[#c09748] text-white text-[11px] font-bold"
                            >
                              Generate Box Labels
                            </button>
                          )}
                          {linkedRel && (
                            <button
                              type="button"
                              onClick={() => downloadStandardOqcPdf(linkedRel)}
                              className="px-2.5 py-1 rounded-full bg-[#f2f2f3] text-[#17191c] border border-[#dcdfe4] text-[11px] font-semibold"
                            >
                              OQC PDF
                            </button>
                          )}
                          {fgBal > 0 && (
                            <button
                              type="button"
                              onClick={() => dispatchFgStockFromPacking(slip.slipNo, fgBal)}
                              className="px-2.5 py-1 rounded-full bg-[#f2f2f3] text-[#17191c] border border-[#dcdfe4] text-[11px] font-semibold"
                            >
                              Dispatch
                            </button>
                          )}
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

      {/* POST-REPORT BOX LABEL GENERATOR MODAL */}
      {labelTargetSlip && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-[24px] max-w-4xl w-full p-6 border border-[#ececec] shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#ececec]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#8a6521] block">
                  {labelTargetSlip.slipNo} • {labelTargetSlip.customer}
                </span>
                <h3 className="font-serif text-xl text-[#17191c]">
                  Generate Carton Box Labels — {labelTargetSlip.model} ({labelTargetSlip.color})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLabelTargetSlip(null)}
                className="w-8 h-8 rounded-full bg-[#fafafb] border border-[#ececec] flex items-center justify-center text-[#777b86] hover:text-[#17191c] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <div className="lg:col-span-6 space-y-4">
                <div className="p-4 rounded-[18px] bg-[#faf7ed] border border-[#f4e5be] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#777b86]">Packed OK Lot Qty:</span>
                    <strong className="font-mono text-[#17191c]">
                      {labelTargetSlip.packedOkQty ?? labelTargetSlip.packedQty ?? 0} Pcs
                    </strong>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#17191c] block">
                      Pcs Per Box (Carton Capacity) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={modalPcsPerBox}
                      onChange={e => setModalPcsPerBox(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full px-3.5 py-2.5 rounded-[14px] bg-white border border-[#dcdfe4] font-mono text-sm font-bold text-[#17191c] focus:outline-none focus:border-[#c09748]"
                    />
                  </div>
                  <div className="text-xs text-[#8a6521] font-semibold">
                    Total Boxes: <strong>{modalCalculatedBoxes.length}</strong> (Running counter: BOX #{String(currentMasterCounter + 1).padStart(4, '0')})
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto rounded-[16px] border border-[#ececec]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#fafafb] border-b border-[#ececec] text-[10px] uppercase text-[#777b86]">
                      <tr>
                        <th className="py-2 px-3">Box</th>
                        <th className="py-2 px-3">Serial Preview</th>
                        <th className="py-2 px-3 text-right">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ececec]/60">
                      {modalCalculatedBoxes.map((b, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-semibold">Box {b.orderIndex} / {b.totalBoxes}</td>
                          <td className="py-2 px-3 font-mono font-bold text-[#c09748]">
                            PK-BOX-{String(currentMasterCounter + idx + 1).padStart(4, '0')}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold">{b.qty} Pcs</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handlePrintModalLabels('a4')}
                    className="w-full py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Layers size={15} />
                    <span>Export A4 9-Up Label Sheet ({modalCalculatedBoxes.length} Stickers)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePrintModalLabels('thermal')}
                    className="w-full py-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <FileDown size={15} />
                    <span>Download Individual Thermal Stickers (65×95mm)</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="border-2 border-[#17191c] rounded-xl p-4 bg-white text-[#17191c] font-mono space-y-2.5 text-[10px]">
                  <div className="flex items-center justify-between border-b border-[#ececec] pb-2">
                    <span className="font-serif font-bold text-sm text-[#8a6521] bg-[#faf3e0] px-2 py-1 rounded border border-[#f4e5be]">
                      PAINTKING
                    </span>
                    <div className="text-right text-[7px] text-gray-500">
                      <div className="font-bold text-xs text-[#17191c]">PAINTKING</div>
                      <div>AUTOMOTIVE FINISHED GOODS LABEL</div>
                    </div>
                  </div>
                  <div className="flex justify-between p-2 bg-[#f2f2f3] rounded">
                    <span>SERIAL: <strong>PK-BOX-{String(currentMasterCounter + 1).padStart(4, '0')}</strong></span>
                    <strong className="text-[#8a6521]">BOX 01 / {String(modalCalculatedBoxes.length || 1).padStart(2, '0')}</strong>
                  </div>
                  <div className="space-y-1 text-[9.5px]">
                    <div className="flex justify-between"><span className="text-gray-500">CUSTOMER:</span><strong>{labelTargetSlip.customer}</strong></div>
                    <div className="flex justify-between"><span className="text-gray-500">JOB CARD:</span><strong className="text-[#8a6521]">{labelTargetSlip.jobCardNo || labelTargetSlip.woNo}</strong></div>
                    <div className="flex justify-between"><span className="text-gray-500">MODEL:</span><strong>{labelTargetSlip.model}</strong></div>
                    <div className="flex justify-between"><span className="text-gray-500">COLOUR:</span><strong>{labelTargetSlip.color}</strong></div>
                    <div className="flex justify-between"><span className="text-gray-500">PACKED BY:</span><span>{labelTargetSlip.packedBy}</span></div>
                  </div>
                  <div className="p-2.5 bg-[#faf7ed] border border-[#c09748]/60 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-[8px] text-[#8a6521] block font-bold">BOX QTY</span>
                      <strong className="font-serif text-xl">{modalCalculatedBoxes[0]?.qty || modalPcsPerBox} PCS</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] text-[#777b86] block font-bold">TOTAL LOT</span>
                      <strong className="text-sm">{labelTargetSlip.packedOkQty ?? labelTargetSlip.packedQty ?? 0} PCS</strong>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#ecfdf5] border-2 border-[#059669] flex flex-col items-center justify-center text-[#047857]">
                      <span className="text-[8px] font-black leading-none">QC</span>
                      <span className="text-[5px] font-bold leading-none">PASS</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
            showTimedToast('✓ PDI Cleared & Linked to Packing / FG Lot!');
          }}
        />
      )}
    </div>
  );
};
