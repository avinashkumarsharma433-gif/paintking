import React, { useState, useMemo } from 'react';
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
  ShieldCheck,
  Truck,
  ClipboardCheck,
  Download,
  Tag,
  X
} from 'lucide-react';
import {
  generateMultiBoxThermalLabelPDF,
  generateA4SheetBoxLabelsPDF,
  getNextBoxCounterRange,
  getCurrentBoxCounter,
  BoxLabelItem
} from '../services/boxLabelPdfService';
import { matchesPlant } from '../utils/portalAuth';
import { PDIModal } from '../components/PDIModal';
import { downloadStandardOqcPdf, downloadStandardPdiPdf } from '../utils/pdfStandardHeader';

interface OqcPackableRow {
  rowKey: string;
  releaseId: string;
  reportNo: string;
  oqcDate: string;
  jobCardNo: string;
  woNo: string;
  customer: string;
  assignmentId?: string;
  partCode: string;
  partDescription: string;
  color: string;
  painter: string;
  paintBatch: string;
  oqcPassedQty: number;
  alreadyPackedQty: number;
  readyToPackQty: number;
}

export const PackingView: React.FC = () => {
  const {
    qualityReleases,
    activePlant,
    currentUser,
    packingSlips,
    packOqcClearedItem,
    updatePackingSlipBoxes,
    dispatchFgStockFromPacking
  } = usePortalStore();

  const [activeSubTab, setActiveSubTab] = useState<'oqc_queue' | 'fg_labels'>('oqc_queue');
  const [partyFilter, setPartyFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [packQtyEdits, setPackQtyEdits] = useState<Record<string, number>>({});
  const [pcsPerBoxEdits, setPcsPerBoxEdits] = useState<Record<string, number>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Tab 2 (FG & Reprint Labels)
  const [fgFilterStatus, setFgFilterStatus] = useState<'ALL' | 'IN_FG' | 'DISPATCHED'>('ALL');
  const [fgSearchQuery, setFgSearchQuery] = useState<string>('');
  const [pdiModalRelease, setPdiModalRelease] = useState<FinalQualityRelease | null>(null);

  // Box Label Reprint / Preview Modal
  const [labelTargetSlip, setLabelTargetSlip] = useState<PackingSlipRecord | null>(null);
  const [modalPcsPerBox, setModalPcsPerBox] = useState<number>(150);
  const [currentMasterCounter, setCurrentMasterCounter] = useState<number>(() => getCurrentBoxCounter());

  const showTimedToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 5000);
  };

  // Expand ONLY OQC Accepted Releases into Packable Model Rows (Zero checking / Zero Rework here!)
  const packableOqcRows = useMemo<OqcPackableRow[]>(() => {
    const plantSlips = packingSlips.filter(s => matchesPlant(s.plant, activePlant));
    const rows: OqcPackableRow[] = [];

    qualityReleases
      .filter(r => matchesPlant(r.plant, activePlant) && r.oqcStatus === 'Accepted' && r.passedQty > 0)
      .forEach(rel => {
        const items =
          rel.oqcCheckedItems && rel.oqcCheckedItems.length > 0
            ? rel.oqcCheckedItems.filter(it => it.passedOkQty > 0)
            : [
                {
                  assignmentId: undefined,
                  partCode: rel.partCode,
                  partDescription: rel.partDescription || rel.model || rel.partCode,
                  color: rel.color,
                  painter: 'Production Floor',
                  paintBatch: rel.batchNo || 'BAT-STD',
                  offeredQty: rel.offeredQty,
                  passedOkQty: rel.passedQty,
                  reworkQty: 0,
                  scrapQty: 0
                }
              ];

        items.forEach((it, idx) => {
          const alreadyPackedQty = plantSlips
            .filter(s => {
              const sameRel = s.oqcReleaseId === rel.releaseId || s.woNo === rel.woNo;
              if (!sameRel) return false;
              if (it.assignmentId && s.assignmentId) return s.assignmentId === it.assignmentId;
              return s.partCode === it.partCode && s.color === it.color;
            })
            .reduce((sum, s) => sum + (s.packedOkQty ?? s.packedQty ?? 0), 0);

          const readyToPackQty = Math.max(0, it.passedOkQty - alreadyPackedQty);
          if (readyToPackQty > 0) {
            rows.push({
              rowKey: `${rel.releaseId}:${it.assignmentId || idx}:${it.partCode}`,
              releaseId: rel.releaseId,
              reportNo: rel.reportNo || rel.releaseId,
              oqcDate: rel.oqcDate || rel.date,
              jobCardNo: rel.jobCardNo || rel.woNo,
              woNo: rel.woNo,
              customer: rel.customer,
              assignmentId: it.assignmentId,
              partCode: it.partCode,
              partDescription: it.partDescription,
              color: it.color,
              painter: it.painter || 'Production Line',
              paintBatch: it.paintBatch || rel.batchNo || 'BAT-STD',
              oqcPassedQty: it.passedOkQty,
              alreadyPackedQty,
              readyToPackQty
            });
          }
        });
      });

    return rows;
  }, [qualityReleases, packingSlips, activePlant]);

  const distinctParties = useMemo(() => {
    return Array.from(new Set(packableOqcRows.map(r => r.customer).filter(Boolean)));
  }, [packableOqcRows]);

  const filteredQueueRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return packableOqcRows.filter(r => {
      if (partyFilter !== 'ALL' && r.customer !== partyFilter) return false;
      if (!q) return true;
      return (
        r.customer.toLowerCase().includes(q) ||
        r.reportNo.toLowerCase().includes(q) ||
        r.jobCardNo.toLowerCase().includes(q) ||
        r.partDescription.toLowerCase().includes(q) ||
        r.partCode.toLowerCase().includes(q) ||
        r.color.toLowerCase().includes(q)
      );
    });
  }, [packableOqcRows, partyFilter, searchQuery]);

  // Group OQC-cleared models by Party + OQC Report
  const groupedByOqcReport = useMemo(() => {
    const map = new Map<
      string,
      {
        releaseId: string;
        reportNo: string;
        oqcDate: string;
        jobCardNo: string;
        customer: string;
        rows: OqcPackableRow[];
        totalReadyPcs: number;
      }
    >();

    filteredQueueRows.forEach(r => {
      const existing = map.get(r.releaseId);
      if (existing) {
        existing.rows.push(r);
        existing.totalReadyPcs += r.readyToPackQty;
      } else {
        map.set(r.releaseId, {
          releaseId: r.releaseId,
          reportNo: r.reportNo,
          oqcDate: r.oqcDate,
          jobCardNo: r.jobCardNo,
          customer: r.customer,
          rows: [r],
          totalReadyPcs: r.readyToPackQty
        });
      }
    });

    return Array.from(map.values());
  }, [filteredQueueRows]);

  const getPackQty = (r: OqcPackableRow) => {
    const v = packQtyEdits[r.rowKey];
    return v !== undefined ? Math.min(r.readyToPackQty, Math.max(0, v)) : r.readyToPackQty;
  };

  const getPcsPerBox = (r: OqcPackableRow) => {
    const v = pcsPerBoxEdits[r.rowKey];
    return v !== undefined ? Math.max(1, v) : Math.min(150, Math.max(1, r.readyToPackQty));
  };

  // Pack + Auto-Allocate Box Counter + Download Stickers + Add to FG Store
  const handlePackAndGenerateLabels = (r: OqcPackableRow, mode: 'a4' | 'thermal') => {
    const qtyToPack = getPackQty(r);
    const boxCap = getPcsPerBox(r);
    if (qtyToPack <= 0 || boxCap <= 0) return;

    const fullBoxes = Math.floor(qtyToPack / boxCap);
    const rem = qtyToPack % boxCap;
    const totalBoxes = rem > 0 ? fullBoxes + 1 : fullBoxes;

    const startNum = getNextBoxCounterRange(totalBoxes);
    const endNum = startNum + totalBoxes - 1;
    setCurrentMasterCounter(endNum);

    const rangeLabel =
      startNum === endNum
        ? `PK-BOX-${String(startNum).padStart(4, '0')}`
        : `PK-BOX-${String(startNum).padStart(4, '0')} – PK-BOX-${String(endNum).padStart(4, '0')}`;

    const payloads: BoxLabelItem[] = [];
    for (let i = 0; i < totalBoxes; i++) {
      const boxQty = i < fullBoxes ? boxCap : rem;
      const globalNum = startNum + i;
      payloads.push({
        globalBoxNumber: globalNum,
        boxSerialText: `PK-BOX-${String(globalNum).padStart(4, '0')}`,
        orderBoxIndex: i + 1,
        totalOrderBoxes: totalBoxes,
        boxQty,
        totalLotQty: qtyToPack,
        customer: r.customer,
        woNo: r.jobCardNo,
        partCode: r.partCode,
        partDescription: r.partDescription,
        color: r.color,
        paintBatch: r.paintBatch,
        painter: r.painter,
        packedBy: currentUser?.name || 'Packing Team',
        packedDate: new Date().toLocaleDateString('en-GB'),
        plant: activePlant === 'ALL' ? 'Haridwar' : activePlant
      });
    }

    if (mode === 'thermal') {
      generateMultiBoxThermalLabelPDF(payloads, `${r.reportNo}_${r.partCode}`);
    } else {
      generateA4SheetBoxLabelsPDF(payloads, `${r.reportNo}_${r.partCode}`);
    }

    const slip = packOqcClearedItem({
      releaseId: r.releaseId,
      jobCardNo: r.jobCardNo,
      woNo: r.woNo,
      assignmentId: r.assignmentId,
      customer: r.customer,
      partCode: r.partCode,
      partDescription: r.partDescription,
      color: r.color,
      plant: activePlant === 'ALL' ? 'Haridwar' : activePlant,
      packQty: qtyToPack,
      pcsPerBox: boxCap,
      totalBoxes,
      boxSerialRange: rangeLabel,
      painter: r.painter,
      paintBatch: r.paintBatch,
      packedBy: currentUser?.name || 'Packing Team'
    });

    showTimedToast(
      `✓ ${r.partDescription} (${qtyToPack} Pcs) Packed into ${totalBoxes} Box(es) (${rangeLabel}) & FG Stock Updated (${slip.slipNo})!`
    );
  };

  // Pack all models under 1 OQC Report in 1 click + Combined A4 Label PDF
  const handlePackAllInOqcGroup = (group: {
    releaseId: string;
    reportNo: string;
    jobCardNo: string;
    customer: string;
    rows: OqcPackableRow[];
  }) => {
    const validRows = group.rows.filter(r => getPackQty(r) > 0);
    if (validRows.length === 0) return;

    const allPayloads: BoxLabelItem[] = [];
    let totalBoxesCreated = 0;

    validRows.forEach(r => {
      const qtyToPack = getPackQty(r);
      const boxCap = getPcsPerBox(r);
      const fullBoxes = Math.floor(qtyToPack / boxCap);
      const rem = qtyToPack % boxCap;
      const totalBoxes = rem > 0 ? fullBoxes + 1 : fullBoxes;
      const startNum = getNextBoxCounterRange(totalBoxes);
      const endNum = startNum + totalBoxes - 1;
      setCurrentMasterCounter(endNum);
      totalBoxesCreated += totalBoxes;

      const rangeLabel =
        startNum === endNum
          ? `PK-BOX-${String(startNum).padStart(4, '0')}`
          : `PK-BOX-${String(startNum).padStart(4, '0')} – PK-BOX-${String(endNum).padStart(4, '0')}`;

      for (let i = 0; i < totalBoxes; i++) {
        const boxQty = i < fullBoxes ? boxCap : rem;
        const globalNum = startNum + i;
        allPayloads.push({
          globalBoxNumber: globalNum,
          boxSerialText: `PK-BOX-${String(globalNum).padStart(4, '0')}`,
          orderBoxIndex: i + 1,
          totalOrderBoxes: totalBoxes,
          boxQty,
          totalLotQty: qtyToPack,
          customer: r.customer,
          woNo: r.jobCardNo,
          partCode: r.partCode,
          partDescription: r.partDescription,
          color: r.color,
          paintBatch: r.paintBatch,
          painter: r.painter,
          packedBy: currentUser?.name || 'Packing Team',
          packedDate: new Date().toLocaleDateString('en-GB'),
          plant: activePlant === 'ALL' ? 'Haridwar' : activePlant
        });
      }

      packOqcClearedItem({
        releaseId: r.releaseId,
        jobCardNo: r.jobCardNo,
        woNo: r.woNo,
        assignmentId: r.assignmentId,
        customer: r.customer,
        partCode: r.partCode,
        partDescription: r.partDescription,
        color: r.color,
        plant: activePlant === 'ALL' ? 'Haridwar' : activePlant,
        packQty: qtyToPack,
        pcsPerBox: boxCap,
        totalBoxes,
        boxSerialRange: rangeLabel,
        painter: r.painter,
        paintBatch: r.paintBatch,
        packedBy: currentUser?.name || 'Packing Team'
      });
    });

    if (allPayloads.length > 0) {
      generateA4SheetBoxLabelsPDF(allPayloads, `${group.reportNo}_${group.customer}_ALL_BOXES`);
    }

    showTimedToast(
      `✓ ${group.customer} (${validRows.length} Models • ${totalBoxesCreated} Boxes) Packed & Box Stickers Generated!`
    );
  };

  // Tab 2: FG Stock & Label Reprint Register
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
    let totalBoxes = 0;

    plantSlips.forEach(s => {
      totalPackedOk += s.packedOkQty ?? s.packedQty ?? 0;
      totalDispatched += s.dispatchedQty || 0;
      totalBoxes += s.totalBoxes || 0;
    });

    return {
      totalPackedOk,
      inFgBalance: Math.max(0, totalPackedOk - totalDispatched),
      totalDispatched,
      totalBoxes
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
        packedBy: labelTargetSlip.packedBy || currentUser?.name || 'Packing Team',
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
    showTimedToast(`✓ ${modalCalculatedBoxes.length} Box Labels (${rangeLabel}) printed!`);
  };

  const totalModelsReadyCount = packableOqcRows.length;
  const totalPiecesReadyCount = packableOqcRows.reduce((s, r) => s + r.readyToPackQty, 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Clean Single-Line Tab Bar */}
      <div className="bg-white rounded-[24px] p-5 sm:p-6 border border-[#ececec] shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
              PK-STR-PKG-001 • FAST PACKING &amp; BOX LABELS
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-normal text-[#17191c] tracking-tight">
              OQC Cleared Packing Queue &amp; Box Labels
            </h1>
            <p className="text-xs text-[#777b86]">
              Yahan sirf QC Manager se OQC-Passed clean pieces aate hain — Packing team bina check kiye sidha Pack karke Box Labels print karegi.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold whitespace-nowrap">
              Ready to Pack: {totalModelsReadyCount} Models ({totalPiecesReadyCount.toLocaleString('en-IN')} Pcs)
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-[#fafafb] text-[#17191c] border border-[#ececec] text-xs font-mono font-semibold whitespace-nowrap">
              FG Stock: {fgMetrics.inFgBalance.toLocaleString('en-IN')} Pcs
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-[#ececec] flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveSubTab('oqc_queue')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeSubTab === 'oqc_queue'
                ? 'bg-[#c09748] text-white shadow-xs'
                : 'bg-[#fafafb] text-[#777b86] border border-[#ececec] hover:text-[#17191c]'
            }`}
          >
            <Package size={14} className="shrink-0" />
            <span>1. OQC Passed — Print Box Labels ({totalModelsReadyCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('fg_labels')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeSubTab === 'fg_labels'
                ? 'bg-[#c09748] text-white shadow-xs'
                : 'bg-[#fafafb] text-[#777b86] border border-[#ececec] hover:text-[#17191c]'
            }`}
          >
            <ClipboardCheck size={14} className="shrink-0" />
            <span>2. FG Stock &amp; Reprint Labels ({fgRecords.length})</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-4 rounded-[18px] bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          {activeSubTab === 'oqc_queue' && (
            <button
              type="button"
              onClick={() => setActiveSubTab('fg_labels')}
              className="px-3.5 py-1.5 rounded-full bg-white border border-emerald-300 text-emerald-800 text-[11px] font-bold hover:bg-emerald-100 cursor-pointer shrink-0 self-start sm:self-auto"
            >
              Open FG Stock Register →
            </button>
          )}
        </div>
      )}

      {activeSubTab === 'oqc_queue' ? (
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
                const count = packableOqcRows.filter(r => r.customer === party).length;
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

            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-[#979799] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search party, OQC, model..."
                className="w-full pl-9 pr-3.5 py-2 rounded-[16px] bg-[#fafafb] border border-[#ececec] text-xs text-[#17191c] focus:outline-none focus:border-[#c09748]"
              />
            </div>
          </div>

          {groupedByOqcReport.length === 0 ? (
            <div className="bg-white rounded-[24px] p-10 border border-dashed border-[#dcdfe4] text-center space-y-3">
              <Package className="w-10 h-10 text-[#979799] mx-auto" />
              <div className="space-y-1">
                <p className="font-serif text-lg text-[#17191c]">
                  Abhi koi OQC-Passed pieces Packing ke liye queue me nahi hain
                </p>
                <p className="text-xs text-[#777b86] max-w-lg mx-auto">
                  Jab QC Manager <strong>QA Hub → Gate 4: OQC</strong> me pieces check karke OQC Report create karega, woh saare OK models yahan Box Label print ke liye dikh jayenge.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {groupedByOqcReport.map(group => (
                <div
                  key={group.releaseId}
                  className="bg-white rounded-[24px] p-6 border border-[#ececec] shadow-2xs space-y-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 border-b border-[#ececec]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] font-mono text-[11px] font-bold">
                        {group.reportNo}
                      </span>
                      <span className="font-mono text-xs text-[#777b86]">{group.jobCardNo}</span>
                      <span className="font-serif text-lg text-[#17191c]">{group.customer}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[11px] font-bold">
                        {group.rows.length} Model{group.rows.length > 1 ? 's' : ''} • {group.totalReadyPcs.toLocaleString('en-IN')} OQC Passed OK
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePackAllInOqcGroup(group)}
                      className="px-5 py-2 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5 self-start lg:self-auto active:scale-95"
                    >
                      <Tag size={14} />
                      <span>Pack All {group.rows.length} Models &amp; Print A4 Box Labels</span>
                    </button>
                  </div>

                  {/* Clean Zero-Inspection Model List: Qty + Pcs/Box + Generate Box Labels */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#ececec] text-[10px] font-semibold uppercase text-[#777b86]">
                          <th className="py-2.5 px-3">Model &amp; Colour</th>
                          <th className="py-2.5 px-3 text-center">OQC Passed</th>
                          <th className="py-2.5 px-3 w-32">Qty to Pack *</th>
                          <th className="py-2.5 px-3 w-28">Pcs / Box *</th>
                          <th className="py-2.5 px-3 text-center">Boxes</th>
                          <th className="py-2.5 px-3 text-right">Generate Box Labels</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ececec]/70">
                        {group.rows.map(r => {
                          const packQty = getPackQty(r);
                          const boxCap = getPcsPerBox(r);
                          const boxesCount = packQty > 0 ? Math.ceil(packQty / boxCap) : 0;
                          return (
                            <tr key={r.rowKey} className="hover:bg-[#fafafb]">
                              <td className="py-3 px-3">
                                <div className="font-semibold text-[#17191c]">{r.partDescription}</div>
                                <div className="text-[11px] text-[#777b86] flex items-center gap-1.5 mt-0.5">
                                  <span className="font-mono">{r.partCode}</span>
                                  <span>•</span>
                                  <span className="px-2 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10px] font-bold">
                                    {r.color}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-center font-mono">
                                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                                  {r.readyToPackQty} Pcs OK
                                </span>
                              </td>
                              <td className="py-3 px-2">
                                <input
                                  type="number"
                                  min={1}
                                  max={r.readyToPackQty}
                                  value={packQty}
                                  onChange={e =>
                                    setPackQtyEdits(prev => ({
                                      ...prev,
                                      [r.rowKey]: Math.min(r.readyToPackQty, Math.max(0, Number(e.target.value) || 0))
                                    }))
                                  }
                                  className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-emerald-300 font-mono text-xs font-bold text-emerald-800 focus:outline-none focus:border-emerald-500"
                                />
                              </td>
                              <td className="py-3 px-2">
                                <input
                                  type="number"
                                  min={1}
                                  value={boxCap}
                                  onChange={e =>
                                    setPcsPerBoxEdits(prev => ({
                                      ...prev,
                                      [r.rowKey]: Math.max(1, Number(e.target.value) || 1)
                                    }))
                                  }
                                  className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[#dcdfe4] font-mono text-xs font-bold text-[#17191c] focus:outline-none focus:border-[#c09748]"
                                />
                              </td>
                              <td className="py-3 px-3 text-center font-mono font-bold text-[#8a6521]">
                                {boxesCount} Box{boxesCount !== 1 ? 'es' : ''}
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={packQty <= 0}
                                    onClick={() => handlePackAndGenerateLabels(r, 'a4')}
                                    className="px-3.5 py-1.5 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] disabled:opacity-50 text-[#8a6521] border border-[#f4e5be] text-[11px] font-bold transition cursor-pointer inline-flex items-center gap-1 active:scale-95"
                                  >
                                    <Layers size={12} />
                                    <span>A4 Labels</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={packQty <= 0}
                                    onClick={() => handlePackAndGenerateLabels(r, 'thermal')}
                                    className="px-3 py-1.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] disabled:opacity-50 text-[#17191c] border border-[#dcdfe4] text-[11px] font-semibold transition cursor-pointer inline-flex items-center gap-1 active:scale-95"
                                  >
                                    <FileDown size={12} className="text-[#c09748]" />
                                    <span>Thermal</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards (<768px) */}
                  <div className="md:hidden space-y-3">
                    {group.rows.map(r => {
                      const packQty = getPackQty(r);
                      const boxCap = getPcsPerBox(r);
                      const boxesCount = packQty > 0 ? Math.ceil(packQty / boxCap) : 0;
                      return (
                        <div key={r.rowKey} className="p-3.5 rounded-[18px] bg-[#fafafb] border border-[#ececec] space-y-2.5 text-xs">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-semibold text-[#17191c]">{r.partDescription}</div>
                              <div className="text-[11px] text-[#777b86]">{r.color}</div>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold text-[11px]">
                              {r.readyToPackQty} OK
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[10px] font-mono text-[#777b86] block">Pack Qty</span>
                              <input
                                type="number"
                                min={1}
                                max={r.readyToPackQty}
                                value={packQty}
                                onChange={e =>
                                  setPackQtyEdits(prev => ({
                                    ...prev,
                                    [r.rowKey]: Math.min(r.readyToPackQty, Math.max(0, Number(e.target.value) || 0))
                                  }))
                                }
                                className="w-full px-2.5 py-1.5 rounded-[10px] bg-white border border-emerald-300 font-mono font-bold text-xs"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] font-mono text-[#777b86] block">Pcs / Box ({boxesCount} Box)</span>
                              <input
                                type="number"
                                min={1}
                                value={boxCap}
                                onChange={e =>
                                  setPcsPerBoxEdits(prev => ({
                                    ...prev,
                                    [r.rowKey]: Math.max(1, Number(e.target.value) || 1)
                                  }))
                                }
                                className="w-full px-2.5 py-1.5 rounded-[10px] bg-white border border-[#dcdfe4] font-mono font-bold text-xs"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handlePackAndGenerateLabels(r, 'a4')}
                              className="flex-1 py-2 rounded-full bg-[#c09748] text-white font-bold text-xs"
                            >
                              Print A4 Labels
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePackAndGenerateLabels(r, 'thermal')}
                              className="flex-1 py-2 rounded-full bg-[#f2f2f3] text-[#17191c] border border-[#dcdfe4] font-semibold text-xs"
                            >
                              Thermal
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: FG STOCK & LABEL REPRINT REGISTER */
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
            <div className="bg-[#faf7ed] p-4 rounded-[20px] border border-[#f4e5be] shadow-2xs">
              <span className="text-[10px] font-mono uppercase text-[#8a6521] font-bold block">Carton Boxes Labeled</span>
              <span className="font-serif text-2xl text-[#8a6521] block mt-1">
                {fgMetrics.totalBoxes.toLocaleString('en-IN')} <span className="text-xs text-[#8a6521]">Boxes</span>
              </span>
            </div>
          </div>

          <div className="bg-white rounded-[24px] p-6 border border-[#ececec] shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ececec]">
              <div className="flex items-center gap-2 flex-wrap">
                {(
                  [
                    { key: 'ALL', label: 'All Packed FG' },
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
                  placeholder="Search party, model, box serial..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-[16px] bg-[#fafafb] border border-[#ececec] text-xs text-[#17191c] focus:outline-none focus:border-[#c09748]"
                />
              </div>
            </div>

            {fgRecords.length === 0 ? (
              <div className="p-10 text-center text-xs text-[#777b86] bg-[#fafafb] rounded-[18px] border border-dashed border-[#ececec] space-y-2">
                <Box className="w-8 h-8 text-[#979799] mx-auto" />
                <p className="font-serif text-base text-[#17191c]">Abhi koi FG Box Packed nahi hua hai</p>
                <p>Tab 1 (&quot;OQC Passed — Print Box Labels&quot;) me pack karte hi yahan FG stock aur stickers record aa jayega.</p>
              </div>
            ) : (
              <>
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#ececec] text-[10px] font-semibold uppercase text-[#777b86]">
                        <th className="py-3 px-3">Packing Slip &amp; Date</th>
                        <th className="py-3 px-3">Party, Model &amp; Colour</th>
                        <th className="py-3 px-3">FG Stock &amp; Box Serials</th>
                        <th className="py-3 px-3">OQC / PDI Status</th>
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
                                  OQC Passed
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
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLabelTargetSlip(slip);
                                    setModalPcsPerBox(slip.pcsPerBox && slip.pcsPerBox > 0 ? slip.pcsPerBox : Math.min(150, okQty || 1));
                                  }}
                                  className="px-3 py-1 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-[11px] font-bold transition cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Tag size={12} />
                                  <span>Reprint Labels</span>
                                </button>
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
                                    className="px-2.5 py-1 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-[11px] font-semibold transition cursor-pointer inline-flex items-center gap-1"
                                  >
                                    <ShieldCheck size={12} className="text-[#c09748]" />
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

                    return (
                      <div key={slip.slipNo} className="bg-[#fafafb] rounded-[18px] border border-[#ececec] p-3.5 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-[#8a6521]">{slip.slipNo}</span>
                          <span className="font-mono font-bold text-emerald-700">{fgBal} / {okQty} Pcs FG</span>
                        </div>
                        <div>
                          <div className="font-semibold text-[#17191c]">{slip.customer}</div>
                          <div className="text-[11px] text-[#777b86]">{slip.model} ({slip.color}) • {slip.boxNo}</div>
                        </div>
                        <div className="flex gap-1.5 flex-wrap pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setLabelTargetSlip(slip);
                              setModalPcsPerBox(slip.pcsPerBox && slip.pcsPerBox > 0 ? slip.pcsPerBox : Math.min(150, okQty || 1));
                            }}
                            className="px-3 py-1 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[11px] font-bold"
                          >
                            Reprint Labels
                          </button>
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

      {/* REPRINT BOX LABEL MODAL */}
      {labelTargetSlip && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-[24px] max-w-3xl w-full p-6 border border-[#ececec] shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#ececec]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#8a6521] block">
                  {labelTargetSlip.slipNo} • {labelTargetSlip.customer}
                </span>
                <h3 className="font-serif text-xl text-[#17191c]">
                  Reprint Box Labels — {labelTargetSlip.model} ({labelTargetSlip.color})
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="p-4 rounded-[18px] bg-[#faf7ed] border border-[#f4e5be] space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-[#777b86]">Packed Lot Qty:</span>
                  <strong className="font-mono">{labelTargetSlip.packedOkQty ?? labelTargetSlip.packedQty ?? 0} Pcs</strong>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#17191c] block">Pcs Per Box *</label>
                  <input
                    type="number"
                    min={1}
                    value={modalPcsPerBox}
                    onChange={e => setModalPcsPerBox(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-3 py-2 rounded-[14px] bg-white border border-[#dcdfe4] font-mono text-sm font-bold"
                  />
                </div>
                <div className="text-xs text-[#8a6521] font-semibold">
                  Boxes: <strong>{modalCalculatedBoxes.length}</strong> (Next Counter: BOX #{String(currentMasterCounter + 1).padStart(4, '0')})
                </div>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => handlePrintModalLabels('a4')}
                  className="w-full py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Layers size={15} />
                  <span>Print A4 9-Up Sheet ({modalCalculatedBoxes.length} Labels)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintModalLabels('thermal')}
                  className="w-full py-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <FileDown size={15} />
                  <span>Print Thermal Stickers (65×95mm)</span>
                </button>
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
            showTimedToast('✓ PDI Cleared & Linked to FG Lot!');
          }}
        />
      )}
    </div>
  );
};
