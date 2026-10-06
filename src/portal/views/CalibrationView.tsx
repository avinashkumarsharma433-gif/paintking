import React, { useState } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { CalibrationRecord } from '../types/portalTypes';
import { 
  Wrench, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Printer, 
  FileText, 
  Search, 
  ShieldCheck, 
  ExternalLink,
  Award,
  Sparkles,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const CalibrationView: React.FC = () => {
  const { calibrationList, updateCalibration, activePlant, currentUser } = usePortalStore();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingRecord, setEditingRecord] = useState<CalibrationRecord | null>(null);

  const filtered = calibrationList.filter(c => 
    c.equipmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.equipmentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.makeModel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const validCount = calibrationList.filter(c => c.status === 'Calibrated (Valid)').length;
  const dueSoonCount = calibrationList.filter(c => c.status === 'Due Soon').length;
  const overdueCount = calibrationList.filter(c => c.status === 'Overdue (Locked)').length;

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-[#17191c] via-[#212529] to-[#17191c] rounded-[24px] p-6 sm:p-8 text-white border border-[#30333a] shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c09748]/20 border border-[#c09748]/40 text-[#f4e5be] text-xs font-semibold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-[#c09748]" />
              Audit Section K Compliance • NABL Traceability Register
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif font-normal tracking-tight text-white">
              Measuring Equipment & Calibration Master
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              NABL accredited calibration certificates and calibration frequency tracking for spectrophotometers, DFT gauges, gloss meters, and viscosity cups.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md px-5 py-3 rounded-[20px] border border-white/10 text-xs">
            <div className="text-center">
              <div className="text-2xl font-serif font-bold text-emerald-400">{validCount}</div>
              <div className="text-[10px] text-slate-300 uppercase">Valid</div>
            </div>
            <div className="h-8 w-px bg-white/20"></div>
            <div className="text-center">
              <div className="text-2xl font-serif font-bold text-amber-400">{dueSoonCount}</div>
              <div className="text-[10px] text-slate-300 uppercase">Due Soon</div>
            </div>
            <div className="h-8 w-px bg-white/20"></div>
            <div className="text-center">
              <div className="text-2xl font-serif font-bold text-rose-400">{overdueCount}</div>
              <div className="text-[10px] text-slate-300 uppercase">Overdue</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4 bg-[#fafafb] p-4 rounded-[20px] border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search equipment by code, name, make..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-[16px] bg-white border border-slate-200 text-xs focus:outline-none focus:border-[#c09748]"
          />
        </div>
        <div className="text-xs text-slate-500 font-mono">
          {filtered.length} Instruments in {activePlant} Plant
        </div>
      </div>

      {/* Instruments Table */}
      <div className="bg-white rounded-[24px] border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#17191c] text-white">
            <tr>
              <th className="p-3.5">Code</th>
              <th className="p-3.5">Instrument & Make/Model</th>
              <th className="p-3.5">Range & Accuracy</th>
              <th className="p-3.5">NABL Calibration Agency</th>
              <th className="p-3.5">Certificate No</th>
              <th className="p-3.5">Last Calibrated</th>
              <th className="p-3.5">Next Due</th>
              <th className="p-3.5 text-center">Status</th>
              <th className="p-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.map((inst) => {
              const isValid = inst.status === 'Calibrated (Valid)';
              const isDue = inst.status === 'Due Soon';

              return (
                <tr key={inst.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-mono font-bold text-slate-900">{inst.equipmentCode}</td>
                  <td className="p-3.5">
                    <div className="font-semibold text-slate-900">{inst.equipmentName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{inst.makeModel} • S/N: {inst.serialNo}</div>
                  </td>
                  <td className="p-3.5 text-slate-700">{inst.rangeAccuracy}</td>
                  <td className="p-3.5 text-slate-700">{inst.calibrationAgency}</td>
                  <td className="p-3.5 font-mono text-[#c09748] font-medium">{inst.certificateNo}</td>
                  <td className="p-3.5 text-slate-600">{inst.lastCalibrationDate}</td>
                  <td className="p-3.5 font-bold font-mono text-slate-900">{inst.nextCalibrationDue}</td>
                  <td className="p-3.5 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                      isValid 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : isDue 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {inst.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => setEditingRecord(inst)}
                      className="px-3 py-1 rounded-full border border-slate-300 hover:bg-slate-100 text-slate-700 text-[11px] font-medium cursor-pointer"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL: Update Calibration Record */}
      <AnimatePresence>
        {editingRecord && (
          <div className="fixed inset-0 z-50 bg-[#fafafb] sm:bg-white overflow-y-auto flex flex-col animate-in fade-in duration-150">
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#ececec] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
                    INSTRUMENT CALIBRATION
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#777b86] text-[10px] font-mono">
                    {editingRecord.equipmentCode}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-serif font-normal text-[#17191c]">
                  Update Calibration Certificate
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="w-9 h-9 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] flex items-center justify-center cursor-pointer transition active:scale-95 shadow-2xs"
                title="Close"
              >
                <X className="w-5 h-5 text-[#17191c]" />
              </button>
            </div>

            <div className="max-w-2xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1 text-xs">
              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#777b86]">Instrument Details:</label>
                  <input readOnly value={`${editingRecord.equipmentCode} - ${editingRecord.equipmentName}`} className="w-full h-11 px-3.5 rounded-[16px] bg-[#fafafb] border border-[#ececec] text-[#17191c] font-medium" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#777b86]">New Certificate Number:</label>
                  <input id="newCertNo" defaultValue={editingRecord.certificateNo} className="w-full h-11 px-3.5 rounded-[16px] border border-[#dcdfe4] bg-white font-mono text-[#17191c] focus:outline-none focus:border-[#17191c]" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#777b86]">NABL Accredited Agency:</label>
                  <input id="newAgency" defaultValue={editingRecord.calibrationAgency} className="w-full h-11 px-3.5 rounded-[16px] border border-[#dcdfe4] bg-white text-[#17191c] focus:outline-none focus:border-[#17191c]" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#777b86]">Calibrated Date:</label>
                    <input type="date" id="newCalDate" defaultValue={editingRecord.lastCalibrationDate} className="w-full h-11 px-3.5 rounded-[16px] border border-[#dcdfe4] bg-white text-[#17191c] focus:outline-none focus:border-[#17191c]" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#777b86]">Next Due Date:</label>
                    <input type="date" id="newDueDate" defaultValue={editingRecord.nextCalibrationDue} className="w-full h-11 px-3.5 rounded-[16px] border border-[#dcdfe4] bg-white text-[#17191c] focus:outline-none focus:border-[#17191c]" />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ececec]">
                  <button
                    type="button"
                    onClick={() => setEditingRecord(null)}
                    className="px-5 py-2.5 rounded-full border border-[#ececec] text-xs font-semibold text-[#777b86] hover:bg-gray-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cert = (document.getElementById('newCertNo') as HTMLInputElement)?.value;
                      const agency = (document.getElementById('newAgency') as HTMLInputElement)?.value;
                      const calDate = (document.getElementById('newCalDate') as HTMLInputElement)?.value;
                      const dueDate = (document.getElementById('newDueDate') as HTMLInputElement)?.value;
                      updateCalibration(editingRecord.id, {
                        certificateNo: cert,
                        calibrationAgency: agency,
                        lastCalibrationDate: calDate,
                        nextCalibrationDue: dueDate,
                        status: 'Calibrated (Valid)'
                      });
                      setEditingRecord(null);
                    }}
                    className="px-6 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] font-semibold shadow-xs transition cursor-pointer"
                  >
                    Save Certificate
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
