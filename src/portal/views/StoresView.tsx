import React, { useState } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { GoodsReceiptNote, JobCard } from '../types/portalTypes';
import { Plus, Clock, CheckCircle2, Package, Droplets, ArrowDownLeft, FileText, Send, ShieldCheck } from 'lucide-react';
import { CreateGRNModal } from '../components/CreateGRNModal';
import { JobCardModal } from '../components/JobCardModal';

export const StoresView: React.FC = () => {
  const { grnList, materialInwardLogs, universalJobs, activePlant } = usePortalStore();
  const [showGRNModal, setShowGRNModal] = useState<boolean>(false);
  const [showJobCardModal, setShowJobCardModal] = useState<boolean>(false);
  const [selectedGrnForJobCard, setSelectedGrnForJobCard] = useState<GoodsReceiptNote | null>(null);

  const [activeDashboardTab, setActiveDashboardTab] = useState<'PARTY' | 'INTERNAL'>('PARTY');

  // Metrics
  const partyGrns = grnList.filter(g => g.partCode !== 'PNT-RD-01');
  const internalGrns = grnList.filter(g => g.partCode === 'PNT-RD-01');

  const totalSubstrates = partyGrns.reduce((acc, curr) => acc + (curr.totalQty || curr.actualReceivedQty || 0), 0);
  const totalPaintLitres = internalGrns.reduce((acc, curr) => acc + (curr.totalQty || curr.actualReceivedQty || 0), 0);

  const activeGrnList = activeDashboardTab === 'PARTY' ? partyGrns : internalGrns;

  const handleOpenJobCardModal = (grn: GoodsReceiptNote) => {
    setSelectedGrnForJobCard(grn);
    setShowJobCardModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-[24px] p-6 border border-[#ececec] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
              PK-STR-GRN-001 • STORE MANAGER & INVENTORY DESK
            </span>
            <span className="text-xs text-[#777b86]">
              Goods Received Note (DOC NO: 00) & Job Card Material Issue (Doc No: 001)
            </span>
          </div>
          <h1 className="text-3xl font-serif font-normal text-[#17191c] tracking-tight">
            Store Manager Intake & Job Card Dispatch
          </h1>
          <p className="text-xs text-[#777b86] mt-1">
            Receives physical material from Gate Security, generates official GRN, and issues raw substrates/paint to shop floor painters via Job Cards.
          </p>
        </div>

        <button
          onClick={() => setShowGRNModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] text-xs font-semibold shadow-sm transition cursor-pointer w-full md:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Official GRN (Doc No: 00)</span>
        </button>
      </div>

      {/* 2 DEDICATED STORE MANAGER DASHBOARD TABS */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ececec] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveDashboardTab('PARTY')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeDashboardTab === 'PARTY'
                ? 'bg-[#17191c] text-[#c09748] shadow-xs'
                : 'bg-white text-[#777b86] border border-[#ececec] hover:bg-gray-50'
            }`}
          >
            <Package className="w-4 h-4 text-[#c09748]" />
            <span>1. Party Material Inward (Customer Job Work) [{partyGrns.length}]</span>
          </button>

          <button
            onClick={() => setActiveDashboardTab('INTERNAL')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeDashboardTab === 'INTERNAL'
                ? 'bg-[#17191c] text-[#c09748] shadow-xs'
                : 'bg-white text-[#777b86] border border-[#ececec] hover:bg-gray-50'
            }`}
          >
            <Droplets className="w-4 h-4 text-blue-600" />
            <span>2. Internal Company Material Purchase [{internalGrns.length}]</span>
          </button>
        </div>

        <div className="text-xs font-mono text-[#777b86]">
          Gate Auto-Ingest: <strong className="text-[#17191c] font-bold">{materialInwardLogs.length} Receipts</strong>
        </div>
      </div>

      {/* Real-time Inventory Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-[20px] bg-white border border-[#ececec] shadow-xs space-y-1">
          <div className="text-[10px] font-bold text-[#777b86] uppercase tracking-wider flex items-center gap-1 font-mono">
            <Package className="w-3.5 h-3.5 text-[#c09748]" />
            CUSTOMER RAW SUBSTRATES IN STOCK
          </div>
          <div className="text-2xl font-serif font-bold text-[#17191c]">
            {totalSubstrates.toLocaleString('en-IN')} pcs
          </div>
          <div className="text-[11px] text-[#777b86]">ABS, PC, Nylon, Aluminum parts ready for Job Card issue</div>
        </div>

        <div className="p-4 rounded-[20px] bg-white border border-[#ececec] shadow-xs space-y-1">
          <div className="text-[10px] font-bold text-[#777b86] uppercase tracking-wider flex items-center gap-1 font-mono">
            <Droplets className="w-3.5 h-3.5 text-blue-600" />
            COMPANY PAINT & CHEMICAL STOCK
          </div>
          <div className="text-2xl font-serif font-bold text-blue-900">
            {totalPaintLitres.toLocaleString('en-IN')} Litres
          </div>
          <div className="text-[11px] text-[#777b86]">PPG/Asian Paints Polyurethane Basecoat & Hardener</div>
        </div>

        <div className="p-4 rounded-[20px] bg-white border border-[#ececec] shadow-xs space-y-1">
          <div className="text-[10px] font-bold text-[#777b86] uppercase tracking-wider flex items-center gap-1 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            UNIVERSAL JOBS IN STORE
          </div>
          <div className="text-2xl font-serif font-bold text-[#17191c]">
            {universalJobs.length} Job IDs
          </div>
          <div className="text-[11px] text-[#777b86]">Tracked via Single PK-JOB-XXXX Number</div>
        </div>

        <div className="p-4 rounded-[20px] bg-[#faf3e0]/60 border border-[#f4e5be] shadow-xs space-y-1">
          <div className="text-[10px] font-bold text-[#8a6521] uppercase tracking-wider flex items-center gap-1 font-mono">
            <ArrowDownLeft className="w-3.5 h-3.5 text-[#c09748]" />
            VERIFIED STORES INTAKE
          </div>
          <div className="text-2xl font-serif font-bold text-[#8a6521]">
            {grnList.length} Official GRNs
          </div>
          <div className="text-[11px] text-[#8a6521]/80">Format: Paintking DOC NO: 00</div>
        </div>
      </div>

      {/* Universal Single-ID Job Registry Bar for Store Manager */}
      <div className="bg-white rounded-[24px] border border-[#ececec] p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#ececec]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#faf7ed] text-[#c09748] border border-[#f4e5be] text-[10px] font-mono font-bold">
                UNIVERSAL JOB TRACKING
              </span>
              <h3 className="font-serif font-normal text-lg text-[#17191c]">
                Universal Job ID Inward & Store Handover
              </h3>
            </div>
            <p className="text-xs text-[#777b86] mt-0.5">
              1-to-1 Piece Level Records tracked under single PK-JOB-XXXX numbers.
            </p>
          </div>

          <span className="text-xs font-mono text-[#c09748] font-bold">
            {universalJobs.length} Active Universal Inwards
          </span>
        </div>

        <div className="overflow-x-auto border border-[#ececec] rounded-[16px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#fafafb] text-[#777b86] font-semibold uppercase text-[10px] tracking-wider border-b border-[#ececec]">
                <th className="p-3">Universal Job ID</th>
                <th className="p-3">Party Name / Client</th>
                <th className="p-3">Material Category</th>
                <th className="p-3">Material Description</th>
                <th className="p-3 text-center">Inward Qty</th>
                <th className="p-3 text-center">Pre-Spray IQC</th>
                <th className="p-3 text-center">Final QA Gate</th>
                <th className="p-3 text-right">Current Pipeline Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ececec] text-[#17191c]">
              {universalJobs.map(job => (
                <tr key={job.jobId} className="hover:bg-[#fafafb]">
                  <td className="p-3 font-mono font-bold text-[#c09748]">{job.jobId}</td>
                  <td className="p-3 font-medium">{job.partyName}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      job.materialCategory === 'Party Material' ? 'bg-[#faf3e0] text-[#8a6521]' : 'bg-blue-50 text-blue-800'
                    }`}>
                      {job.materialCategory}
                    </span>
                  </td>
                  <td className="p-3 text-[#777b86]">{job.materialDescription}</td>
                  <td className="p-3 text-center font-mono font-bold">{job.totalQuantity} {job.unit}</td>
                  <td className="p-3 text-center font-mono">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      job.preSprayIQC?.status === 'Pass' 
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {job.preSprayIQC ? `IQC Pass (${job.preSprayIQC.approvedPcs} Pcs)` : 'Pending IQC'}
                    </span>
                  </td>
                  <td className="p-3 text-center font-mono">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      job.finalQA?.overallStatus === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {job.finalQA ? `QA Approved (ΔE ${job.finalQA.deltaE})` : '🔒 QA Locked'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]">
                      {job.stage}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active GRN Cards List */}
      <div className="space-y-5">
        {activeGrnList.map(grn => (
          <div key={grn.grnNo} className="bg-white rounded-[24px] border border-[#ececec] p-5 sm:p-6 shadow-sm space-y-4 hover:border-[#c09748]/50 transition">
            
            {/* Header: Identification & Badges */}
            <div className="pb-3 border-b border-[#f2f2f3] space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                  <span className="font-mono text-xs font-bold text-[#c09748] px-3 py-1 rounded-full bg-[#faf7ed] border border-[#f4e5be] whitespace-nowrap shadow-xs">
                    {grn.grnNo}
                  </span>
                  <span className="text-xs text-[#777b86] font-mono whitespace-nowrap px-2.5 py-0.5 rounded-full bg-[#f2f2f3]">
                    Challan: <strong className="text-[#17191c] font-semibold">{grn.invoiceChallanNo}</strong>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10px] font-mono font-bold uppercase">
                    {grn.docNo || 'DOC NO: 00'}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs text-[#777b86] font-mono whitespace-nowrap flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#a3a6af]" />
                    Recd Date: {grn.receivedDate || grn.date}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 ${
                    grn.iqcStatus === 'Accepted' 
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                      : 'bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521]'
                  }`}>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    IQC: {grn.iqcStatus}
                  </span>
                </div>
              </div>

              {/* Customer / Supplier Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="font-serif font-normal text-xl text-[#17191c] tracking-tight pt-0.5">
                  {grn.supplierCustomer}
                </h3>
                <span className="text-xs text-[#777b86] font-mono">
                  Transporter: <strong className="text-[#17191c]">{grn.transporter}</strong> ({grn.vehicleNo})
                </span>
              </div>
            </div>

            {/* Line Items Table (Exact Image 2 Structure) */}
            {grn.items && grn.items.length > 0 ? (
              <div className="overflow-x-auto border border-[#ececec] rounded-[16px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#fafafb] text-[#777b86] font-semibold uppercase text-[10px] tracking-wider border-b border-[#ececec]">
                      <th className="p-2.5">Part Code</th>
                      <th className="p-2.5">Part Description</th>
                      <th className="p-2.5 text-center">Invoiced Qty</th>
                      <th className="p-2.5 text-center">Actual Received</th>
                      <th className="p-2.5 text-center">Short / Excess</th>
                      <th className="p-2.5 text-center">Ok By IQC</th>
                      <th className="p-2.5 text-center">Rej Qty</th>
                      <th className="p-2.5">Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ececec] text-[#17191c]">
                    {grn.items.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#fafafb]">
                        <td className="p-2.5 font-mono font-bold text-[#c09748]">{row.partCode}</td>
                        <td className="p-2.5 font-medium">{row.partDescription}</td>
                        <td className="p-2.5 text-center font-mono">{row.invoicedQty}</td>
                        <td className="p-2.5 text-center font-mono font-bold text-emerald-800 bg-emerald-50/40">
                          {row.actualReceivedQty}
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                            row.shortExcessQty < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {row.shortExcessQty}
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-mono text-emerald-700 font-semibold">{row.okByIqcQty}</td>
                        <td className="p-2.5 text-center font-mono text-red-600 font-semibold">{row.rejectionQty}</td>
                        <td className="p-2.5 text-gray-500 text-[11px]">{row.remark || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-[16px] bg-[#fafafb] border border-[#ececec] text-xs">
                <div>
                  <span className="text-[10px] font-bold text-[#777b86] uppercase">Part Code & Description</span>
                  <div className="font-semibold text-[#17191c]">{grn.description || grn.partCode}</div>
                  <div className="font-mono text-[11px] text-[#c09748]">{grn.partCode}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#777b86] uppercase">Received Count</span>
                  <div className="font-serif font-bold text-lg text-[#17191c]">{grn.actualReceivedQty || grn.totalQty} pcs</div>
                  <div className="text-[11px] text-[#777b86]">Invoiced: {grn.invoicedQty}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#777b86] uppercase">Store Incharge</span>
                  <div className="font-semibold text-[#17191c]">{grn.storeIncharge}</div>
                </div>
              </div>
            )}

            {/* Action Bar: Create Job Card & Issue Material */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-[#ececec]">
              <div className="flex items-center gap-2 text-xs text-[#777b86]">
                <span>Store Incharge: <strong className="text-[#17191c]">{grn.storeIncharge}</strong></span>
                <span>•</span>
                <span>Quality Approved: <strong className="text-emerald-800">{grn.qualityApprovedBy || 'Amit Verma (QA)'}</strong></span>
              </div>

              <button
                onClick={() => handleOpenJobCardModal(grn)}
                className="px-5 py-2.5 rounded-full bg-[#17191c] text-[#c09748] text-xs font-bold hover:bg-black transition flex items-center gap-2 cursor-pointer shadow-sm self-end sm:self-auto"
              >
                <Send className="w-3.5 h-3.5 text-[#c09748]" />
                + Create Job Card & Issue Material (Doc No: 001)
              </button>
            </div>

          </div>
        ))}

        {activeGrnList.length === 0 && (
          <div className="bg-white rounded-[24px] border border-[#ececec] p-12 text-center text-[#777b86]">
            Koi record nahi mila iss category me. Naya GRN add karein!
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateGRNModal
        isOpen={showGRNModal}
        onClose={() => setShowGRNModal(false)}
      />

      {selectedGrnForJobCard && (
        <JobCardModal
          isOpen={showJobCardModal}
          onClose={() => {
            setShowJobCardModal(false);
            setSelectedGrnForJobCard(null);
          }}
          initialData={{
            customer: selectedGrnForJobCard.supplierCustomer,
            partCode: selectedGrnForJobCard.items?.[0]?.partCode || selectedGrnForJobCard.partCode || 'SUBSTRATE',
            partDescription: selectedGrnForJobCard.items?.[0]?.partDescription || selectedGrnForJobCard.description || 'Raw Substrate',
            targetQty: selectedGrnForJobCard.totalQty || selectedGrnForJobCard.actualReceivedQty || 250,
            wNo: `WO-${selectedGrnForJobCard.grnNo.replace(/^PK-GRN-/, '').slice(-4)}`,
            storeIncharge: selectedGrnForJobCard.storeIncharge
          }}
        />
      )}
    </div>
  );
};
