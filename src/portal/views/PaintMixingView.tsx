import React from 'react';
import { usePortalStore } from '../context/PortalStoreContext';

export const PaintMixingView: React.FC = () => {
  const { paintMixing, activePlant } = usePortalStore();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[24px] p-6 border border-[#ececec] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
              PK-PRD-PMX-001 • CHEMICAL LAB
            </span>
            <span className="text-xs text-[#777b86]">
              Controlled Viscosity, Mixing Ratios & Pot Life Management
            </span>
          </div>
          <h1 className="text-3xl font-serif font-normal text-[#17191c] tracking-tight">
            Paint Mixing & Formulation Lab
          </h1>
          <p className="text-xs text-[#777b86] mt-1">
            Controls mixing ratios (4:1:1) and Ford Cup 4 viscosity timing to prevent application defects
          </p>
        </div>

        <span className="text-xs font-mono text-[#c09748] font-bold">
          Plant: {activePlant}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {paintMixing.map(pm => (
          <div key={pm.mixNo} className="bg-white rounded-[24px] border border-[#ececec] p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#f2f2f3] gap-2">
              <div>
                <span className="font-mono text-xs font-bold text-[#c09748] px-2.5 py-0.5 rounded-full bg-[#faf7ed] border border-[#f4e5be] whitespace-nowrap">
                  {pm.mixNo}
                </span>
                <h3 className="text-lg font-serif font-normal text-[#17191c] mt-1">{pm.color}</h3>
              </div>
              <span className="self-start sm:self-auto px-3 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold whitespace-nowrap">
                Batch Verified
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center p-3.5 bg-[#fafafb] rounded-[16px] border border-[#ececec]">
              <div>
                <div className="text-[10px] text-[#777b86] font-bold uppercase tracking-wider">Base Paint</div>
                <div className="font-serif font-normal text-base sm:text-lg text-[#17191c] mt-0.5">{pm.paintQtyL} L</div>
                <div className="text-[10px] text-[#a3a6af] font-mono truncate">{pm.paintBatch}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#777b86] font-bold uppercase tracking-wider">Hardener</div>
                <div className="font-serif font-normal text-base sm:text-lg text-[#17191c] mt-0.5">{pm.hardenerQtyL} L</div>
                <div className="text-[10px] text-[#a3a6af] font-mono truncate">{pm.hardenerBatch}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#777b86] font-bold uppercase tracking-wider">Thinner</div>
                <div className="font-serif font-normal text-base sm:text-lg text-[#17191c] mt-0.5">{pm.thinnerQtyL} L</div>
                <div className="text-[10px] text-[#a3a6af] font-mono truncate">{pm.thinnerBatch}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1 p-3 bg-[#fafafb] rounded-[14px] border border-[#ececec]">
              <div>
                <span className="text-[#777b86]">Ratio:</span> <strong className="text-[#17191c] font-mono ml-1">{pm.mixRatio}</strong>
              </div>
              <div>
                <span className="text-[#777b86]">Viscosity (Ford 4):</span> <strong className="text-[#8a6521] font-mono ml-1">{pm.viscosityFordCupSec}s</strong>
              </div>
              <div>
                <span className="text-[#777b86]">Pot Life:</span> <strong className="text-red-700 ml-1">{pm.potLifeEnd}</strong>
              </div>
            </div>

            <div className="text-[11px] text-[#777b86] pt-3 border-t border-[#f2f2f3] flex flex-wrap items-center justify-between gap-2">
              <span>Mixed by: <strong className="text-[#17191c]">{pm.mixedBy}</strong></span>
              <span>Usage: <strong className="text-[#17191c]">{pm.usageBooth}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
