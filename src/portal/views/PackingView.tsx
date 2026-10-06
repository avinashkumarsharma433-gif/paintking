import React, { useState } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { Printer, Plus, QrCode, CheckCircle2, ShieldAlert, X, Check, Box } from 'lucide-react';
import { PackingSlipRecord } from '../types/portalTypes';

export const PackingView: React.FC = () => {
  const { packingSlips, qualityReleases, addPackingSlip, canPrintPackingSlip, activePlant, currentUser } = usePortalStore();
  const [selectedSlip, setSelectedSlip] = useState(packingSlips[0] || null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // New Packing Slip Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPdiWo, setSelectedPdiWo] = useState<string>('');
  const [boxCount, setBoxCount] = useState<number>(50);
  const [boxLabel, setBoxLabel] = useState<string>('BOX-01/06');

  // Filter QA Releases ready for packing
  const clearedPdiReleases = qualityReleases.filter(r => r.pdiStatus === 'Cleared for Invoicing' || r.oqcStatus === 'Accepted');

  const handleCreatePackingSlip = (e: React.FormEvent) => {
    e.preventDefault();
    const rel = clearedPdiReleases.find(r => r.woNo === selectedPdiWo) || clearedPdiReleases[0];
    if (!rel) {
      alert('No QA/PDI cleared batches available for packing.');
      return;
    }

    const newSlip: PackingSlipRecord = {
      slipNo: `PKG-2026-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().split('T')[0],
      plant: activePlant,
      customer: rel.customer,
      woNo: rel.woNo,
      partCode: rel.partCode,
      model: 'Automotive Spec (PDI Cleared)',
      color: rel.color,
      boxNo: boxLabel,
      packedQty: boxCount,
      painter: '3-Painter Line Squad',
      paintBatch: 'BAT-PPG-2609-R4',
      packedBy: currentUser?.name || 'Gopal Singh (Packing Lead)',
      qcVerified: true
    };

    addPackingSlip(newSlip);
    setSelectedSlip(newSlip);
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[24px] p-6 border border-[#ececec] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
              PK-STR-PKG-001 • TRACEABILITY
            </span>
            <span className="text-xs text-[#777b86]">
              Box Packing Register & Barcode / QR Label Generator
            </span>
          </div>
          <h1 className="text-3xl font-serif font-normal text-[#17191c] tracking-tight">
            Packing Register & Box Identification
          </h1>
          <p className="text-xs text-[#777b86] mt-1">
            Generates 4" x 6" box labels with full painter, paint batch, and WO traceability
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => {
              if (clearedPdiReleases.length > 0) {
                setSelectedPdiWo(clearedPdiReleases[0].woNo);
              }
              setShowCreateModal(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] text-xs font-bold transition shadow-xs cursor-pointer w-full md:w-auto"
          >
            <Plus className="w-4 h-4 text-[#17191c]" />
            <span>+ Create Packing Slip from Cleared PDI</span>
          </button>
          <span className="text-xs font-mono text-[#c09748] font-bold hidden sm:inline">
            Plant: {activePlant}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {packingSlips.map(ps => (
          <div key={ps.slipNo} className="bg-white rounded-[24px] border border-[#ececec] p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#f2f2f3] gap-2.5">
              <div className="space-y-1">
                <span className="font-mono text-xs font-bold text-[#c09748] px-2.5 py-0.5 rounded-full bg-[#faf7ed] border border-[#f4e5be] whitespace-nowrap">
                  {ps.slipNo}
                </span>
                <h3 className="font-serif font-normal text-lg text-[#17191c]">{ps.customer}</h3>
                <div className="text-xs text-[#777b86]">{ps.model} • {ps.color}</div>
              </div>
              <div className="text-left sm:text-right self-start sm:self-auto shrink-0">
                <span className="font-serif text-2xl font-normal text-[#17191c]">{ps.packedQty} pcs</span>
                <div className="text-[10px] text-emerald-700 font-semibold">✓ QC Inspected</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3.5 bg-[#fafafb] rounded-[16px] border border-[#ececec] text-xs">
              <div>Boxes: <strong className="text-[#17191c]">{ps.boxNo}</strong></div>
              <div>Painter: <strong className="text-[#17191c]">{ps.painter}</strong></div>
              <div>Paint Batch: <strong className="text-[#17191c] font-mono">{ps.paintBatch}</strong></div>
              <div>Packed by: <strong className="text-[#17191c]">{ps.packedBy}</strong> on {ps.date}</div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setSelectedSlip(ps);
                  setShowPrintModal(true);
                }}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#c09748] text-[#17191c] text-xs font-semibold hover:bg-[#a97e35] transition cursor-pointer shadow-sm w-full sm:w-auto"
              >
                <Printer className="w-3.5 h-3.5 text-[#17191c]" />
                <span>Print Thermal Sticker (4x6)</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Box Thermal Sticker Preview */}
      {showPrintModal && selectedSlip && (
        <div className="fixed inset-0 z-50 bg-[#fafafb] sm:bg-white overflow-y-auto flex flex-col animate-in fade-in duration-150">
          {/* Sticky Top Header Bar */}
          <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#ececec] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
                  Packing Slip
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#777b86] text-[10px] font-mono">
                  {selectedSlip.slipNo}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-normal text-[#17191c]">
                Thermal Label (4"x6") Specification Preview
              </h3>
            </div>
            <button 
              type="button"
              onClick={() => setShowPrintModal(false)}
              className="w-9 h-9 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] flex items-center justify-center cursor-pointer transition active:scale-95 shadow-2xs"
              title="Close"
            >
              <X className="w-5 h-5 text-[#17191c]" />
            </button>
          </div>

          {/* Body Container */}
          <div className="max-w-lg mx-auto w-full p-4 sm:p-8 space-y-6 flex-1 text-xs">
            {/* Industrial 4" x 6" Thermal Sticker Mockup */}
            <div className="border-2 border-black p-5 space-y-4 font-mono bg-white text-[#17191c] select-none rounded-[12px] shadow-sm">
              <div className="text-center border-b-2 border-black pb-2">
                <div className="font-serif font-bold text-base tracking-wide">
                  PAINTKING SOLUTIONS PVT. LTD.
                </div>
                <div className="text-[9px] font-sans text-gray-700">
                  {activePlant} Unit • ISO 9001:2015 & IATF-16949 Certified
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider mt-1 bg-black text-white px-2 py-0.5 inline-block rounded-xs">
                  AUTOMOTIVE FINISHED GOODS BOX LABEL
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] border-b border-black pb-2">
                <div>
                  <span className="text-gray-600 block text-[9px]">CUSTOMER:</span>
                  <span className="font-bold text-xs">{selectedSlip.customer}</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-600 block text-[9px]">BOX IDENTIFICATION:</span>
                  <span className="font-bold text-xs">{selectedSlip.boxNo}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-[10px] border-b border-black pb-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">PART CODE:</span>
                  <span className="font-bold font-mono">{selectedSlip.partCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">MODEL / SPEC:</span>
                  <span className="font-semibold">{selectedSlip.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">COLOR SHADE:</span>
                  <span className="font-bold">{selectedSlip.color}</span>
                </div>
              </div>

              <div className="p-3 bg-gray-100 border border-black rounded-sm flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase font-bold text-gray-700 block">BOX COUNT:</span>
                  <span className="font-serif font-bold text-2xl tracking-tight">{selectedSlip.packedQty} PCS</span>
                </div>
                <div className="text-right text-[10px]">
                  <div className="font-bold text-emerald-800">✓ 100% PDI PASSED</div>
                  <div className="text-gray-600 font-sans text-[9px]">ΔE ≤ 0.70 & ASTM 5B</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[9px] border-b border-black pb-2">
                <div>
                  <span className="text-gray-600">PAINTER:</span> {selectedSlip.painter}
                </div>
                <div className="text-right">
                  <span className="text-gray-600">PAINT BATCH:</span> {selectedSlip.paintBatch}
                </div>
                <div>
                  <span className="text-gray-600">PACKED BY:</span> {selectedSlip.packedBy}
                </div>
                <div className="text-right">
                  <span className="text-gray-600">DATE:</span> {selectedSlip.date}
                </div>
              </div>

              {/* Barcode / QR Simulation */}
              <div className="pt-2 flex flex-col items-center justify-center space-y-1">
                <div className="w-full flex items-center justify-center gap-0.5 h-10 px-4 bg-white">
                  {[4, 2, 6, 1, 3, 5, 2, 7, 3, 1, 4, 6, 2, 5, 3, 2, 6, 1, 4, 3, 5, 2, 6, 4, 2, 5, 1, 7, 3, 2, 4, 5, 2, 6, 1, 4].map((h, i) => (
                    <div 
                      key={i} 
                      className={`bg-black h-full ${i % 3 === 0 ? 'w-1' : i % 2 === 0 ? 'w-0.5' : 'w-1.5'}`} 
                    />
                  ))}
                </div>
                <div className="font-mono text-[9px] tracking-widest text-center">
                  *{selectedSlip.slipNo}*
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-[#ececec]">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-5 py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium text-xs cursor-pointer hover:bg-[#fafafb] transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const gate = canPrintPackingSlip(selectedSlip.woNo);
                  if (!gate.allowed) {
                    alert(`QA Gatekeeper Lock: Cannot print packing slip for ${selectedSlip.woNo}.\n\nReason: ${gate.reason}`);
                    return;
                  }
                  window.print();
                }}
                className="px-6 py-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold shadow-2xs cursor-pointer transition active:scale-95 flex items-center gap-2"
              >
                <Printer className="w-3.5 h-3.5 text-[#c09748]" />
                <span>Print Thermal Sticker</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create New Packing Slip from QA/PDI Cleared Order */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-[#fafafb] sm:bg-white overflow-y-auto flex flex-col animate-in fade-in duration-150">
          {/* Sticky Top Header Bar */}
          <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#ececec] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
                  Box Packaging
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#777b86] text-[10px] font-mono">
                  PDI Cleared Batch
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-normal text-[#17191c]">
                Create Box Packing Slip from Cleared PDI
              </h3>
            </div>
            <button 
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="w-9 h-9 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] flex items-center justify-center cursor-pointer transition active:scale-95 shadow-2xs"
              title="Close"
            >
              <X className="w-5 h-5 text-[#17191c]" />
            </button>
          </div>

          {/* Body Container */}
          <div className="max-w-xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1 text-xs">
            <form onSubmit={handleCreatePackingSlip} className="space-y-4">
              <div>
                <label className="block text-[#17191c] font-semibold mb-1">
                  PDI Cleared Work Order / Batch *
                </label>
                <select
                  value={selectedPdiWo}
                  onChange={e => setSelectedPdiWo(e.target.value)}
                  className="w-full p-3 rounded-[14px] border border-[#ececec] bg-white text-xs font-medium cursor-pointer focus:border-[#c09748] focus:outline-none"
                  required
                >
                  {clearedPdiReleases.map(rel => (
                    <option key={rel.releaseId} value={rel.woNo}>
                      {rel.woNo} • {rel.customer} ({rel.partCode} - {rel.color})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#17191c] font-semibold mb-1">
                  Box Serial / Identification *
                </label>
                <input
                  type="text"
                  value={boxLabel}
                  onChange={e => setBoxLabel(e.target.value)}
                  placeholder="e.g. BOX-01/06"
                  className="w-full p-3 rounded-[14px] border border-[#ececec] bg-white font-mono text-xs focus:border-[#c09748] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[#17191c] font-semibold mb-1">
                  Packed Box Count (Pcs) *
                </label>
                <input
                  type="number"
                  value={boxCount}
                  onChange={e => setBoxCount(Math.max(1, Number(e.target.value)))}
                  className="w-full p-3 rounded-[14px] border border-[#ececec] bg-white font-mono font-bold text-sm text-[#17191c] focus:border-[#c09748] focus:outline-none"
                  min={1}
                  required
                />
              </div>

              <div className="pt-4 border-t border-[#ececec] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium cursor-pointer hover:bg-[#fafafb]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold shadow-2xs cursor-pointer transition active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-[#c09748]" />
                  <span>Generate Box Label</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
