import React from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export const GatePassView: React.FC = () => {
  const { gatePasses, updateGatePassStatus, activePlant } = usePortalStore();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[24px] p-6 border border-[#ececec] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
              PK-ADM-GTP-001 • SECURITY DESK
            </span>
            <span className="text-xs text-[#777b86]">
              Main Gate Inward & Outward Movement Pass
            </span>
          </div>
          <h1 className="text-3xl font-serif font-normal text-[#17191c] tracking-tight">
            Gate Pass Security Desk
          </h1>
          <p className="text-xs text-[#777b86] mt-1">
            Vehicle & truck logging • Verifies delivery challan and outward tax invoices
          </p>
        </div>

        <span className="text-xs font-mono text-[#c09748] font-bold">
          Plant: {activePlant}
        </span>
      </div>

      <div className="space-y-4">
        {gatePasses.map(gp => (
          <div key={gp.gatePassNo} className="bg-white rounded-[24px] border border-[#ececec] p-6 shadow-sm space-y-4">
            {/* Gate Pass Header */}
            <div className="pb-3 border-b border-[#f2f2f3] space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#c09748] px-3 py-1 rounded-full bg-[#faf7ed] border border-[#f4e5be] whitespace-nowrap shadow-xs">
                    {gp.gatePassNo}
                  </span>
                  <span className={`px-3 py-0.5 rounded-full text-xs font-medium flex items-center gap-1.5 whitespace-nowrap ${
                    gp.type === 'Inward' ? 'bg-[#fafafb] border border-[#ececec] text-[#17191c]' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  }`}>
                    {gp.type === 'Inward' ? <ArrowDownLeft className="w-3.5 h-3.5 text-[#c09748]" /> : <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />}
                    {gp.type} ({gp.movementType})
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-xs self-start sm:self-auto">
                  <span className="text-[#777b86] font-mono whitespace-nowrap">{gp.date} {gp.time}</span>
                  <span className={`px-3 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${
                    gp.status === 'Closed' ? 'bg-[#f2f2f3] text-[#777b86]' : 'bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521]'
                  }`}>
                    {gp.status}
                  </span>
                </div>
              </div>

              <h3 className="font-serif font-normal text-lg sm:text-xl text-[#17191c] tracking-tight pt-0.5">
                {gp.partyName}
              </h3>
            </div>

            {/* Information Grid Container */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-[16px] bg-[#fafafb] border border-[#ececec] text-xs">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-[#777b86] uppercase tracking-wider block">Vehicle & Driver</span>
                <div className="font-mono font-semibold text-[#17191c]">{gp.vehicleNo}</div>
                <div className="text-[#777b86] text-[11px]">{gp.driverPhone}</div>
              </div>
              <div className="sm:col-span-2 space-y-0.5">
                <span className="text-[11px] font-semibold text-[#777b86] uppercase tracking-wider block">Material & Reference</span>
                <div className="font-medium text-[#17191c]">{gp.itemDescription}</div>
                <div className="font-mono text-[#a3a6af] text-[11px]">Ref Doc: {gp.referenceDoc}</div>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-[#777b86] uppercase tracking-wider block">Quantity & Security</span>
                <div className="font-serif font-normal text-xl text-[#17191c]">{gp.qty} pcs</div>
                <div className="text-[11px] text-[#777b86]">Officer: <strong className="text-[#17191c] font-medium">{gp.securityOfficer}</strong></div>
              </div>
            </div>

            {gp.status === 'Open' && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => updateGatePassStatus(gp.gatePassNo, 'Closed')}
                  className="flex items-center justify-center px-5 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] text-xs font-semibold transition cursor-pointer shadow-sm w-full sm:w-auto"
                >
                  Confirm Physical Exit & Close Pass
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
