import React, { useState } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { GoodsReceiptNote } from '../types/portalTypes';
import { Plus, Clock, CheckCircle2 } from 'lucide-react';
import { QuickInwardModal } from '../components/QuickInwardModal';

export const StoresView: React.FC = () => {
  const { grnList, activePlant } = usePortalStore();
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  return (
    <div className="space-y-6">
      {/* ISO Header Banner */}
      <div className="bg-white rounded-[24px] p-6 border border-[#ececec] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
              PK-STR-GRN-001 • INWARD CUSTODY
            </span>
            <span className="text-xs text-[#777b86]">
              Goods Receipt Note & Subcontracting Customer Inward Register
            </span>
          </div>
          <h1 className="text-3xl font-serif font-normal text-[#17191c] tracking-tight">
            Stores & Goods Receipt Note (GRN)
          </h1>
          <p className="text-xs text-[#777b86] mt-1">
            Logs incoming raw substrates & paints • Enforces PO color breakdowns upon truck arrival
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

      {/* GRN Cards */}
      <div className="space-y-4">
        {grnList.map(grn => (
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
                <div className="text-xl font-serif font-normal text-[#17191c]">{grn.actualReceivedQty} pcs</div>
                <div className="text-[#777b86] text-[11px]">Invoiced: {grn.invoicedQty} pcs</div>
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
