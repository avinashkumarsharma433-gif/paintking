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
  Sparkles
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
          <thead className="bg-[#17191c] text-white text-[11px] font-bold uppercase tracking-wider">
            <tr>
              <th className="py-2 px-3 whitespace-nowrap">Code</th>
              <th className="py-2 px-3">Instrument & Make/Model</th>
              <th className="py-2 px-3">Range & Accuracy</th>
              <th className="py-2 px-3">NABL Calibration Agency</th>
              <th className="py-2 px-3 whitespace-nowrap">Certificate No</th>
              <th className="py-2 px-3 whitespace-nowrap">Last Calibrated</th>
              <th className="py-2 px-3 whitespace-nowrap">Next Due</th>
              <th className="py-2 px-3 text-center whitespace-nowrap">Status</th>
              <th className="py-2 px-3 text-right whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.map((inst) => {
              const isValid = inst.status === 'Calibrated (Valid)';
              const isDue = inst.status === 'Due Soon';

              return (
                <tr key={inst.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold text-xs sm:text-[13px] text-slate-900 whitespace-nowrap">{inst.equipmentCode}</td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-xs sm:text-[13px] text-slate-900">{inst.equipmentName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{inst.makeModel} • S/N: {inst.serialNo}</div>
                  </td>
                  <td className="py-2.5 px-3 text-xs sm:text-[13px] text-slate-700">{inst.rangeAccuracy}</td>
                  <td className="py-2.5 px-3 text-xs sm:text-[13px] text-slate-700">{inst.calibrationAgency}</td>
                  <td className="py-2.5 px-3 font-mono text-[#c09748] font-semibold text-xs sm:text-[13px] whitespace-nowrap">{inst.certificateNo}</td>
                  <td className="py-2.5 px-3 text-slate-600 text-[11px] whitespace-nowrap">{inst.lastCalibrationDate}</td>
                  <td className="py-2.5 px-3 font-bold font-mono text-xs sm:text-[13px] text-slate-900 whitespace-nowrap">{inst.nextCalibrationDue}</td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      isValid 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : isDue 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {inst.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => setEditingRecord(inst)}
                      className="px-3 py-1.5 rounded-full border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer transition active:scale-95"
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[24px] max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-lg font-serif text-slate-900">Update Calibration Certificate</h3>
                <button
                  onClick={() => setEditingRecord(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Instrument:</label>
                  <input readOnly value={`${editingRecord.equipmentCode} - ${editingRecord.equipmentName}`} className="w-full p-2.5 rounded-[12px] bg-slate-50 border border-slate-200" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">New Certificate Number:</label>
                  <input id="newCertNo" defaultValue={editingRecord.certificateNo} className="w-full p-2.5 rounded-[12px] border border-slate-300 font-mono" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">NABL Accredited Agency:</label>
                  <input id="newAgency" defaultValue={editingRecord.calibrationAgency} className="w-full p-2.5 rounded-[12px] border border-slate-300" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Calibrated Date:</label>
                    <input type="date" id="newCalDate" defaultValue={editingRecord.lastCalibrationDate} className="w-full p-2 rounded-[12px] border border-slate-300" />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Next Due Date:</label>
                    <input type="date" id="newDueDate" defaultValue={editingRecord.nextCalibrationDue} className="w-full p-2 rounded-[12px] border border-slate-300" />
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    onClick={() => setEditingRecord(null)}
                    className="px-4 py-2 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
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
                    className="px-5 py-2 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] font-semibold cursor-pointer"
                  >
                    Save Certificate
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
