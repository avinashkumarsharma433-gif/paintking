import React, { useState, useMemo } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { 
  Printer, 
  Plus, 
  FileDown, 
  CheckCircle2, 
  Layers, 
  Package, 
  Search,
  Box,
  Hash,
  Sparkles
} from 'lucide-react';
import { 
  generateMultiBoxThermalLabelPDF, 
  getNextBoxCounterRange, 
  getCurrentBoxCounter,
  BoxLabelItem 
} from '../services/boxLabelPdfService';

export const PackingView: React.FC = () => {
  const { qualityReleases, activePlant, currentUser, jobCards } = usePortalStore();

  // Filter QA Releases that are OQC Accepted or PDI Cleared
  const readyLots = useMemo(() => {
    return qualityReleases.filter(r => r.oqcStatus === 'Accepted' || r.pdiStatus === 'Cleared for Invoicing');
  }, [qualityReleases]);

  const [selectedLotId, setSelectedLotId] = useState<string>(readyLots[0]?.releaseId || '');
  const [pcsPerBox, setPcsPerBox] = useState<number>(150);
  const [customTotalPcs, setCustomTotalPcs] = useState<number | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Selected Lot Details
  const activeLot = useMemo(() => {
    return readyLots.find(r => r.releaseId === selectedLotId) || readyLots[0] || null;
  }, [readyLots, selectedLotId]);

  // Total Quantity for Packing (defaults to passedQty from OQC)
  const lotTotalPcs = customTotalPcs !== null 
    ? customTotalPcs 
    : (activeLot?.passedQty || activeLot?.offeredQty || 1000);

  // Auto-calculated Box Split
  const calculatedBoxes = useMemo(() => {
    if (!activeLot || lotTotalPcs <= 0 || pcsPerBox <= 0) return [];

    const fullBoxes = Math.floor(lotTotalPcs / pcsPerBox);
    const remainder = lotTotalPcs % pcsPerBox;
    const totalBoxCount = remainder > 0 ? fullBoxes + 1 : fullBoxes;

    const list: Array<{ orderIndex: number; totalBoxes: number; qty: number }> = [];

    for (let i = 1; i <= fullBoxes; i++) {
      list.push({
        orderIndex: i,
        totalBoxes: totalBoxCount,
        qty: pcsPerBox,
      });
    }

    if (remainder > 0) {
      list.push({
        orderIndex: totalBoxCount,
        totalBoxes: totalBoxCount,
        qty: remainder,
      });
    }

    return list;
  }, [activeLot, lotTotalPcs, pcsPerBox]);

  // Current global running box counter
  const [currentMasterCounter, setCurrentMasterCounter] = useState<number>(() => getCurrentBoxCounter());

  // Generate & Download Multi-Page Thermal Label PDF
  const handleGenerateAndDownloadPDF = () => {
    if (!activeLot || calculatedBoxes.length === 0) {
      alert('Please select a valid OQC cleared lot and enter valid box capacity.');
      return;
    }

    // Allocate continuous sequential numbers (1, 2, 3...)
    const startGlobalNumber = getNextBoxCounterRange(calculatedBoxes.length);
    setCurrentMasterCounter(startGlobalNumber + calculatedBoxes.length - 1);

    // Try finding linked painter info from Job Card
    const matchingJc = jobCards.find(j => j.jobCardNo === activeLot.woNo || j.woNo === activeLot.woNo);
    const painterName = matchingJc?.assignedPainterName || matchingJc?.painterName || 'Booth 1 Line Squad';
    const paintBatch = activeLot.batchNo || 'BAT-PPG-2609-R4';

    const boxPayloads: BoxLabelItem[] = calculatedBoxes.map((b, idx) => {
      const globalNum = startGlobalNumber + idx;
      const serialText = `PK-BOX-${String(globalNum).padStart(4, '0')}`;

      return {
        globalBoxNumber: globalNum,
        boxSerialText: serialText,
        orderBoxIndex: b.orderIndex,
        totalOrderBoxes: b.totalBoxes,
        boxQty: b.qty,
        totalLotQty: lotTotalPcs,
        customer: activeLot.customer,
        woNo: activeLot.woNo,
        partCode: activeLot.partCode,
        partDescription: activeLot.partDescription || activeLot.model || 'Automotive Molded Substrate',
        color: activeLot.color,
        paintBatch,
        painter: painterName,
        packedBy: currentUser?.name || 'Gopal Singh (Stores Dispatch)',
        packedDate: new Date().toLocaleDateString('en-GB'),
        plant: activePlant,
      };
    });

    generateMultiBoxThermalLabelPDF(boxPayloads, `${activeLot.woNo}_${activeLot.customer}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-[24px] p-6 border border-[#ececec] shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
              PK-STR-PKG-001 • PACKING & THERMAL LABELS
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
              Continuous Box Serial Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-normal text-[#17191c] tracking-tight">
            Carton Box Label Generator & Auto-Splitter
          </h1>
          <p className="text-xs text-[#777b86] mt-1">
            Automatically calculates box requirements and generates sequential 4" × 6" thermal stickers with scannable barcodes
          </p>
        </div>

        {/* Running Counter Metric Badge */}
        <div className="flex items-center gap-3 bg-[#fafafb] px-4 py-3 rounded-[20px] border border-[#ececec]">
          <div className="h-10 w-10 rounded-full bg-[#faf3e0] border border-[#f4e5be] flex items-center justify-center text-[#8a6521]">
            <Hash size={18} />
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#979799] block">
              Continuous Box Counter
            </span>
            <span className="text-lg font-mono font-bold text-[#17191c]">
              BOX #{String(currentMasterCounter).padStart(4, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* Main Split Grid: Configuration & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Box Split Configuration (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-[24px] p-6 border border-[#ececec] shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f3]">
              <div className="flex items-center gap-2">
                <Box size={18} className="text-[#c09748]" />
                <h3 className="font-serif text-base font-semibold text-[#17191c]">
                  1. Select OQC Cleared Lot & Set Packaging
                </h3>
              </div>
              <span className="text-xs text-[#777b86]">
                {readyLots.length} Lots Available
              </span>
            </div>

            {/* Lot Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-[#17191c] mb-1.5">
                Choose OQC / PDI Approved Lot *
              </label>
              <select
                value={selectedLotId}
                onChange={(e) => {
                  setSelectedLotId(e.target.value);
                  setCustomTotalPcs(null);
                }}
                className="w-full p-3 rounded-[16px] border border-[#ececec] bg-[#fafafb] text-xs font-semibold text-[#17191c] focus:outline-none focus:border-[#c09748] cursor-pointer"
              >
                {readyLots.map((lot) => (
                  <option key={lot.releaseId} value={lot.releaseId}>
                    {lot.woNo} • {lot.customer} — {lot.partCode} ({lot.color}) • Good: {lot.passedQty || lot.offeredQty} Pcs
                  </option>
                ))}
                {readyLots.length === 0 && (
                  <option value="">No OQC cleared lots currently available</option>
                )}
              </select>
            </div>

            {/* Selected Lot Snapshot Card */}
            {activeLot && (
              <div className="p-4 rounded-[18px] bg-[#fafafb] border border-[#ececec] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-[#777b86] block">Customer</span>
                  <strong className="text-[#17191c] truncate block">{activeLot.customer}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#777b86] block">Part Code</span>
                  <strong className="text-[#17191c] font-mono">{activeLot.partCode}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#777b86] block">Shade / Color</span>
                  <strong className="text-[#17191c]">{activeLot.color}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#777b86] block">OQC Inspection</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    <span>Passed</span>
                  </span>
                </div>
              </div>
            )}

            {/* Quantities & Packaging Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-[#17191c] mb-1">
                  Total Lot Quantity To Pack (Pcs) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={lotTotalPcs}
                  onChange={(e) => setCustomTotalPcs(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#fafafb] border border-[#ececec] rounded-[16px] text-[#17191c] font-mono font-bold focus:outline-none focus:border-[#c09748]"
                />
                <span className="text-[10px] text-[#979799] mt-0.5 block">
                  Original OQC Pass: {activeLot?.passedQty || activeLot?.offeredQty || 1000} Pcs
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#17191c] mb-1">
                  Box Capacity / Pcs Per Box *
                </label>
                <input
                  type="number"
                  min="1"
                  value={pcsPerBox}
                  onChange={(e) => setPcsPerBox(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#fafafb] border border-[#ececec] rounded-[16px] text-[#17191c] font-mono font-bold focus:outline-none focus:border-[#c09748]"
                />
                <span className="text-[10px] text-[#8a6521] font-semibold mt-0.5 block">
                  e.g. 50, 100 or 150 pieces per carton
                </span>
              </div>
            </div>

            {/* Calculation Result Summary Bar */}
            <div className="p-4 rounded-[18px] bg-[#faf3e0] border border-[#f4e5be] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#f4e5be] flex items-center justify-center text-[#8a6521] shrink-0 font-bold font-serif text-lg">
                  {calculatedBoxes.length}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#8a6521]">
                    {calculatedBoxes.length} Total Boxes Calculated
                  </h4>
                  <p className="text-[11px] text-[#8a6521]/80">
                    {Math.floor(lotTotalPcs / pcsPerBox)} Full Box(es) of {pcsPerBox} Pcs
                    {lotTotalPcs % pcsPerBox > 0 && ` + 1 Box of ${lotTotalPcs % pcsPerBox} Pcs`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateAndDownloadPDF}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold rounded-full shadow-2xs transition cursor-pointer active:scale-95 shrink-0"
              >
                <Printer size={15} className="text-[#c09748]" />
                <span>Generate & Download ({calculatedBoxes.length} Labels)</span>
              </button>
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
                    const runningPcs = Math.min(lotTotalPcs, (idx + 1) * pcsPerBox);

                    return (
                      <tr key={idx} className="hover:bg-[#fafafb]">
                        <td className="py-2.5 px-3 font-semibold text-[#17191c]">
                          Box {String(b.orderIndex).padStart(2, '0')} of {String(b.totalBoxes).padStart(2, '0')}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#c09748]">
                          PK-BOX-{String(runningSerial).padStart(4, '0')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#17191c]">
                          {b.qty} Pcs
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#777b86]">
                          {runningPcs} / {lotTotalPcs} Pcs
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live 4" x 6" Thermal Sticker Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-[24px] p-6 border border-[#ececec] shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f3]">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#c09748]">
                4" × 6" THERMAL STICKER SPECIMEN
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Page 1 of {calculatedBoxes.length || 1}
              </span>
            </div>

            {/* Industrial 4x6 Label Mockup */}
            <div className="border-2 border-[#17191c] rounded-lg p-4 bg-white text-[#17191c] font-mono space-y-3 shadow-md">
              {/* Header */}
              <div className="text-center border-b-2 border-[#17191c] pb-2.5 bg-[#17191c] text-white p-2.5 -m-4 mb-2 rounded-t-sm">
                <div className="font-serif font-bold text-sm tracking-wide">
                  PAINTKING SOLUTIONS PVT. LTD.
                </div>
                <div className="text-[8px] text-[#c09748] font-bold">
                  {activePlant.toUpperCase()} UNIT • ISO 9001:2015 & IATF-16949 COMPLIANT
                </div>
                <div className="text-[7.5px] text-neutral-300 mt-0.5">
                  AUTOMOTIVE FINISHED GOODS CARTON LABEL
                </div>
              </div>

              {/* Master Serial Strip */}
              <div className="flex items-center justify-between p-2 bg-[#f2f2f3] border-b border-[#dcdfe4] text-[10px]">
                <div>
                  <span className="text-[8px] text-gray-500 block">MASTER SERIAL</span>
                  <strong className="text-black font-bold">PK-BOX-{String(currentMasterCounter + 1).padStart(4, '0')}</strong>
                </div>
                <div className="text-right">
                  <span className="text-[8px] text-gray-500 block">ORDER LOT BREAKDOWN</span>
                  <strong className="text-[#8a6521] font-bold">BOX 01 / {String(calculatedBoxes.length || 1).padStart(2, '0')}</strong>
                </div>
              </div>

              {/* Data Rows */}
              <div className="space-y-1 text-[9px] border-b border-black pb-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">CUSTOMER:</span>
                  <strong className="text-black truncate max-w-[170px]">{activeLot?.customer || 'ROOP POLYMERS LTD'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">WORK ORDER:</span>
                  <strong className="text-black">{activeLot?.woNo || 'WO-1042'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">PART CODE:</span>
                  <strong className="text-black font-bold">{activeLot?.partCode || 'RP-8841-A'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">PART NAME:</span>
                  <span className="text-black truncate max-w-[170px]">{activeLot?.partDescription || 'AC Vent Bezel'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">COLOR SHADE:</span>
                  <strong className="text-black">{activeLot?.color || 'Monza Red'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">DATE:</span>
                  <span className="text-black">{new Date().toLocaleDateString('en-GB')}</span>
                </div>
              </div>

              {/* Large Quantity Box */}
              <div className="p-3 bg-[#faf7ed] border-2 border-[#c09748] rounded flex items-center justify-between">
                <div>
                  <span className="text-[8px] uppercase font-bold text-[#8a6521] block">BOX QUANTITY</span>
                  <span className="font-serif font-bold text-2xl tracking-tight text-black">
                    {pcsPerBox} PCS
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[8px] text-gray-600 block">TOTAL LOT SIZE</span>
                  <span className="font-bold text-xs text-black">{lotTotalPcs} PCS</span>
                  <div className="text-[8px] text-emerald-800 font-bold mt-0.5">✓ 100% OQC PASSED</div>
                </div>
              </div>

              {/* Barcode Simulation */}
              <div className="pt-1 flex flex-col items-center justify-center space-y-1">
                <div className="w-full flex items-center justify-center gap-0.5 h-9 px-2 bg-white">
                  {[4, 2, 6, 1, 3, 5, 2, 7, 3, 1, 4, 6, 2, 5, 3, 2, 6, 1, 4, 3, 5, 2, 6, 4, 2, 5, 1, 7, 3, 2, 4, 5, 2, 6, 1, 4, 2, 5, 3].map((h, i) => (
                    <div 
                      key={i} 
                      className={`bg-black h-full ${i % 3 === 0 ? 'w-1' : i % 2 === 0 ? 'w-0.5' : 'w-1.5'}`} 
                    />
                  ))}
                </div>
                <div className="font-mono text-[8px] tracking-widest text-center">
                  *PK-BOX-{String(currentMasterCounter + 1).padStart(4, '0')}*{activeLot?.woNo || 'WO-1042'}*{pcsPerBox}PCS*
                </div>
              </div>
            </div>

            {/* Direct Action */}
            <button
              onClick={handleGenerateAndDownloadPDF}
              className="w-full py-3 bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] font-bold text-xs rounded-full shadow-sm cursor-pointer transition flex items-center justify-center gap-2 active:scale-95"
            >
              <FileDown size={16} />
              <span>Download Printable PDF ({calculatedBoxes.length} Pages)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
