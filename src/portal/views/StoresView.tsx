import React, { useState } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { GoodsReceiptNote } from '../types/portalTypes';
import { Plus, Clock, CheckCircle2, Package, Droplets, ShieldCheck, ArrowDownLeft } from 'lucide-react';
import { QuickInwardModal } from '../components/QuickInwardModal';

export const StoresView: React.FC = () => {
  const { grnList, materialInwardLogs, activePlant } = usePortalStore();
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'SUBSTRATE' | 'PAINT_CHEMICAL'>('ALL');

  // Count metrics
  const totalSubstrates = grnList.filter(g => g.partCode !== 'PNT-RD-01').reduce((acc, curr) => acc + curr.actualReceivedQty, 0);
  const totalPaintLitres = grnList.filter(g => g.partCode === 'PNT-RD-01').reduce((acc, curr) => acc + curr.actualReceivedQty, 0);

  const filteredGrns = grnList.filter(grn => {
    if (filterCategory === 'SUBSTRATE') return grn.partCode !== 'PNT-RD-01';
    if (filterCategory === 'PAINT_CHEMICAL') return grn.partCode === 'PNT-RD-01';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ISO Header Banner */}
      <div className="bg-white rounded-[24px] p-6 border border-[#ececec] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
              PK-STR-GRN-001 • INWARD & STORES DESK
            </span>
            <span className="text-xs text-[#777b86]">
              Goods Receipt Note & Store Material Intake
            </span>
          </div>
          <h1 className="text-3xl font-serif font-normal text-[#17191c] tracking-tight">
            Stores Intake & Inventory Dashboard
          </h1>
          <p className="text-xs text-[#777b86] mt-1">
            Logs incoming customer raw substrates & company paint/chemical purchases received from Security Gate.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] text-xs font-semibold shadow-sm transition cursor-pointer w-full md:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Naya Maal Inward Karein (New GRN)</span>
        </button>
      </div>

      {/* Real-time Inventory Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-[20px] bg-white border border-[#ececec] shadow-xs space-y-1">
          <div className="text-[10px] font-bold text-[#777b86] uppercase tracking-wider flex items-center gap-1 font-mono">
            <Package className="w-3.5 h-3.5 text-[#c09748]" />
            CUSTOMER RAW SUBSTRATES IN STOCK
          </div>
          <div className="text-2xl font-serif font-bold text-[#17191c]">
            {totalSubstrates.toLocaleString('en-IN')} pcs
          </div>
          <div className="text-[11px] text-[#777b86]">ABS, PC, Nylon, Aluminum parts ready for jigging</div>
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

        <div className="p-4 rounded-[20px] bg-[#faf3e0]/60 border border-[#f4e5be] shadow-xs space-y-1">
          <div className="text-[10px] font-bold text-[#8a6521] uppercase tracking-wider flex items-center gap-1 font-mono">
            <ArrowDownLeft className="w-3.5 h-3.5 text-[#c09748]" />
            SECURITY GATE AUTO-INGESTED LOGS
          </div>
          <div className="text-2xl font-serif font-bold text-[#8a6521]">
            {materialInwardLogs.length} Gate Receipts
          </div>
          <div className="text-[11px] text-[#8a6521]/80">Auto-synced from Main Security Inward Register</div>
        </div>
      </div>

      {/* Filter Category Switches */}
      <div className="flex items-center gap-2 border-b border-[#ececec] pb-3">
        <button
          onClick={() => setFilterCategory('ALL')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
            filterCategory === 'ALL'
              ? 'bg-[#17191c] text-[#c09748]'
              : 'bg-white text-[#777b86] border border-[#ececec]'
          }`}
        >
          Sabhi Items ({grnList.length})
        </button>
        <button
          onClick={() => setFilterCategory('SUBSTRATE')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
            filterCategory === 'SUBSTRATE'
              ? 'bg-[#17191c] text-[#c09748]'
              : 'bg-white text-[#777b86] border border-[#ececec]'
          }`}
        >
          Customer Raw Substrates Only
        </button>
        <button
          onClick={() => setFilterCategory('PAINT_CHEMICAL')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
            filterCategory === 'PAINT_CHEMICAL'
              ? 'bg-[#17191c] text-[#c09748]'
              : 'bg-white text-[#777b86] border border-[#ececec]'
          }`}
        >
          Company Paint / Chemical Purchase Only
        </button>
      </div>

      {/* GRN Cards */}
      <div className="space-y-4">
        {filteredGrns.map(grn => (
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
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    grn.partCode === 'PNT-RD-01' ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {grn.partCode === 'PNT-RD-01' ? 'Company Paint Purchase' : 'Customer Raw Parts'}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs text-[#777b86] font-mono whitespace-nowrap flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#a3a6af]" />
                    {grn.date}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 ${
                    grn.iqcStatus === 'Accepted' 
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                      : 'bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521]'
                  }`}>
                    {grn.iqcStatus === 'Accepted' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                    IQC: {grn.iqcStatus}
                  </span>
                </div>
              </div>

              {/* Customer / Supplier Title */}
              <h3 className="font-serif font-normal text-lg sm:text-xl text-[#17191c] tracking-tight pt-0.5">
                {grn.supplierCustomer}
              </h3>
            </div>

            {/* Information Grid Container */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-[16px] bg-[#fafafb] border border-[#ececec] text-xs">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-[#777b86] uppercase tracking-wider block">
                  Part Description
                </span>
                <div className="font-medium text-[#17191c] leading-snug">{grn.description}</div>
                <div className="font-mono text-[#a3a6af] text-[11px]">Code: {grn.partCode}</div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-[#777b86] uppercase tracking-wider block">
                  Truck / Transporter
                </span>
                <div className="font-mono font-semibold text-[#17191c]">{grn.vehicleNo}</div>
                <div className="text-[#777b86]">{grn.transporter}</div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-[#777b86] uppercase tracking-wider block">
                  Received Count
                </span>
                <div className="text-xl font-serif font-normal text-[#17191c]">{grn.actualReceivedQty} pcs / units</div>
                <div className="text-[#777b86] text-[11px]">Invoiced: {grn.invoicedQty}</div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-[#777b86] uppercase tracking-wider block">
                  Store Incharge
                </span>
                <div className="font-medium text-[#17191c]">{grn.storeIncharge}</div>
                <div className="text-[#777b86] text-[11px]">Plant: <strong className="text-[#17191c] font-medium">{grn.plant}</strong></div>
              </div>
            </div>

            {/* Color Splits Registered at Inward */}
            {grn.colorSplits.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-bold text-[#777b86] uppercase tracking-[0.16em] block mb-2">
                  Customer Color Breakdown (Job Requirement):
                </span>
                <div className="flex flex-wrap gap-2">
                  {grn.colorSplits.map(cs => (
                    <div 
                      key={cs.colorCode} 
                      className="px-3 py-1.5 rounded-full bg-[#fafafb] border border-[#ececec] text-xs flex items-center gap-2 shadow-2xs"
                    >
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cs.colorName.includes('Red') ? 'bg-red-500' : 'bg-[#17191c]'}`} />
                      <span className="font-medium text-[#17191c] whitespace-nowrap">{cs.colorName}:</span>
                      <strong className="font-mono text-[#17191c] whitespace-nowrap">{cs.orderedQty} Pcs</strong>
                      <span className="text-[#777b86] whitespace-nowrap text-[11px]">(@ ₹{cs.unitRate}/pc)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Inward Modal */}
      <QuickInwardModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  );
};

