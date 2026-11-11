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
  Sliders,
  Calendar,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const CalibrationView: React.FC = () => {
  const { calibrationList, updateCalibration, activePlant, currentUser } = usePortalStore();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VALID' | 'DUE_SOON' | 'OVERDUE'>('ALL');
  const [editingRecord, setEditingRecord] = useState<CalibrationRecord | null>(null);

  const validCount = calibrationList.filter(c => c.status === 'Calibrated (Valid)').length;
  const dueSoonCount = calibrationList.filter(c => c.status === 'Due Soon').length;
  const overdueCount = calibrationList.filter(c => c.status === 'Overdue (Locked)').length;

  const filtered = calibrationList.filter(c => {
    const matchesSearch = 
      c.equipmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.equipmentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.makeModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.certificateNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.calibrationAgency.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'VALID') return c.status === 'Calibrated (Valid)';
    if (statusFilter === 'DUE_SOON') return c.status === 'Due Soon';
    if (statusFilter === 'OVERDUE') return c.status === 'Overdue (Locked)';
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Editorial Luxury Top Header Banner */}
      <div className="bg-white rounded-[24px] p-5 sm:p-6 border border-[#ececec] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
              PK-MTN-CAL-01 • NABL CALIBRATION MASTER
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              ISO 9001 / IATF Section K Compliant
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-normal text-[#17191c] tracking-tight">
            Quality Gauge & Instrument Calibration
          </h1>
          <p className="text-xs text-[#777b86] mt-0.5">
            Traceable master register for Spectrophotometers, Elcometer DFT Gauges, Gloss Meters, and Viscosity Cups.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-[#777b86]">Plant:</span>
          <span className="px-3 py-1 rounded-full bg-[#fafafb] border border-[#dcdfe4] text-[#17191c] font-bold">
            {activePlant}
          </span>
        </div>
      </div>

      {/* 3 Metric Summary Cards matching PaintKing Style */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div 
          onClick={() => setStatusFilter(statusFilter === 'VALID' ? 'ALL' : 'VALID')}
          className={`p-4 rounded-[20px] bg-white border transition cursor-pointer shadow-xs ${
            statusFilter === 'VALID' ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-[#ececec] hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#777b86] uppercase tracking-wider">Active & Certified</span>
            <span className="p-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-normal text-[#17191c] mt-2">
            {validCount} <span className="text-xs font-sans text-[#777b86] font-normal">Gauges Valid</span>
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 font-medium">100% Calibrated with NABL Certificate</div>
        </div>

        <div 
          onClick={() => setStatusFilter(statusFilter === 'DUE_SOON' ? 'ALL' : 'DUE_SOON')}
          className={`p-4 rounded-[20px] bg-white border transition cursor-pointer shadow-xs ${
            statusFilter === 'DUE_SOON' ? 'border-amber-500 ring-2 ring-amber-500/10' : 'border-[#ececec] hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#777b86] uppercase tracking-wider">Upcoming Expiry</span>
            <span className="p-2 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-4 h-4 text-amber-600" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-normal text-[#17191c] mt-2">
            {dueSoonCount} <span className="text-xs font-sans text-[#777b86] font-normal">Due Soon (30d)</span>
          </div>
          <div className="text-[11px] text-amber-700 mt-1 font-medium">Schedule laboratory recalibration</div>
        </div>

        <div 
          onClick={() => setStatusFilter(statusFilter === 'OVERDUE' ? 'ALL' : 'OVERDUE')}
          className={`p-4 rounded-[20px] bg-white border transition cursor-pointer shadow-xs ${
            statusFilter === 'OVERDUE' ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-[#ececec] hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#777b86] uppercase tracking-wider">Locked Out</span>
            <span className="p-2 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-normal text-[#17191c] mt-2">
            {overdueCount} <span className="text-xs font-sans text-[#777b86] font-normal">Overdue</span>
          </div>
          <div className="text-[11px] text-rose-700 mt-1 font-medium">Blocked from Shopfloor Quality release</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-[20px] border border-[#ececec] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#777b86] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search gauge code, instrument name, make, certificate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full bg-[#fafafb] border border-[#dcdfe4] text-xs text-[#17191c] placeholder:text-[#979799] focus:outline-none focus:border-[#c09748] focus:bg-white transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777b86] hover:text-[#17191c] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(['ALL', 'VALID', 'DUE_SOON', 'OVERDUE'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition whitespace-nowrap active:scale-95 ${
                statusFilter === tab
                  ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]'
                  : 'bg-[#fafafb] hover:bg-[#f2f2f3] text-[#777b86] border border-[#ececec]'
              }`}
            >
              {tab === 'ALL' && `All Instruments (${calibrationList.length})`}
              {tab === 'VALID' && `Valid (${validCount})`}
              {tab === 'DUE_SOON' && `Due Soon (${dueSoonCount})`}
              {tab === 'OVERDUE' && `Overdue (${overdueCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Card List (< 640px) */}
      <div className="block sm:hidden space-y-3">
        {filtered.map((inst) => {
          const isValid = inst.status === 'Calibrated (Valid)';
          const isDue = inst.status === 'Due Soon';

          return (
            <div key={inst.id} className="bg-white rounded-[20px] border border-[#ececec] p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#ececec]">
                <span className="font-mono font-bold text-xs text-[#c09748] px-2.5 py-0.5 rounded-full bg-[#faf7ed] border border-[#f4e5be]">
                  {inst.equipmentCode}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                  isValid 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : isDue 
                    ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {inst.status}
                </span>
              </div>

              <div>
                <div className="font-semibold text-xs text-[#17191c]">{inst.equipmentName}</div>
                <div className="text-[11px] text-[#777b86] mt-0.5 font-mono">{inst.makeModel} • S/N: {inst.serialNo}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-[12px] bg-[#fafafb] border border-[#ececec] text-[11px]">
                <div>
                  <span className="text-[#777b86]">Range:</span> <strong className="text-[#17191c] ml-1">{inst.rangeAccuracy}</strong>
                </div>
                <div>
                  <span className="text-[#777b86]">Cert No:</span> <strong className="text-[#8a6521] font-mono ml-1">{inst.certificateNo}</strong>
                </div>
                <div>
                  <span className="text-[#777b86]">Agency:</span> <span className="text-[#17191c] ml-1">{inst.calibrationAgency}</span>
                </div>
                <div>
                  <span className="text-[#777b86]">Next Due:</span> <strong className="text-[#17191c] font-mono ml-1">{inst.nextCalibrationDue}</strong>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setEditingRecord(inst)}
                  className="px-3.5 py-1.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold shadow-2xs transition cursor-pointer active:scale-95"
                >
                  Update Certificate
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View (>= 640px) */}
      <div className="hidden sm:block bg-white rounded-[24px] border border-[#ececec] shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#fafafb] border-b border-[#ececec] text-[#777b86]">
              <th className="py-2.5 px-3 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap">Gauge Code</th>
              <th className="py-2.5 px-3 font-bold text-[11px] uppercase tracking-wider">Instrument & Make</th>
              <th className="py-2.5 px-3 font-bold text-[11px] uppercase tracking-wider">Range & Accuracy</th>
              <th className="py-2.5 px-3 font-bold text-[11px] uppercase tracking-wider">NABL Agency</th>
              <th className="py-2.5 px-3 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap">Certificate No</th>
              <th className="py-2.5 px-3 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap">Next Due</th>
              <th className="py-2.5 px-3 font-bold text-center text-[11px] uppercase tracking-wider whitespace-nowrap">Status</th>
              <th className="py-2.5 px-3 font-bold text-right text-[11px] uppercase tracking-wider whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ececec]">
            {filtered.map((inst) => {
              const isValid = inst.status === 'Calibrated (Valid)';
              const isDue = inst.status === 'Due Soon';

              return (
                <tr key={inst.id} className="hover:bg-[#fafafb] transition">
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="font-mono font-bold text-xs text-[#c09748] px-2 py-0.5 rounded-full bg-[#faf7ed] border border-[#f4e5be]">
                      {inst.equipmentCode}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-xs sm:text-[13px] text-[#17191c]">{inst.equipmentName}</div>
                    <div className="text-[11px] text-[#777b86] font-mono mt-0.5">{inst.makeModel} • S/N: {inst.serialNo}</div>
                  </td>
                  <td className="py-2.5 px-3 text-[#17191c]">{inst.rangeAccuracy}</td>
                  <td className="py-2.5 px-3 text-[#777b86]">{inst.calibrationAgency}</td>
                  <td className="py-2.5 px-3 font-mono text-[#8a6521] font-semibold text-xs whitespace-nowrap">
                    {inst.certificateNo}
                  </td>
                  <td className="py-2.5 px-3 font-bold font-mono text-xs text-[#17191c] whitespace-nowrap">
                    {inst.nextCalibrationDue}
                  </td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      isValid 
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                        : isDue 
                        ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      {inst.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setEditingRecord(inst)}
                      className="px-3 py-1.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold shadow-2xs transition cursor-pointer active:scale-95"
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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[24px] max-w-md w-full p-5 sm:p-6 space-y-4 border border-[#ececec] shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#ececec]">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
                    NABL CALIBRATION UPDATE
                  </span>
                  <h3 className="text-base sm:text-lg font-serif font-normal text-[#17191c] mt-0.5">
                    Renew Gauge Certificate
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="w-8 h-8 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] flex items-center justify-center cursor-pointer transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-[#777b86] block mb-1">Instrument Under Calibration:</label>
                  <input 
                    readOnly 
                    value={`${editingRecord.equipmentCode} • ${editingRecord.equipmentName}`} 
                    className="w-full p-2.5 rounded-[14px] bg-[#fafafb] border border-[#ececec] text-[#17191c] font-semibold cursor-not-allowed" 
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#777b86] block mb-1">New NABL Certificate Number:</label>
                  <input 
                    id="newCertNo" 
                    defaultValue={editingRecord.certificateNo} 
                    className="w-full p-2.5 rounded-[14px] border border-[#dcdfe4] font-mono text-[#17191c] focus:outline-none focus:border-[#c09748]" 
                    placeholder="e.g. NABL-CAL-2026-904"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#777b86] block mb-1">Accredited Calibration Agency:</label>
                  <input 
                    id="newAgency" 
                    defaultValue={editingRecord.calibrationAgency} 
                    className="w-full p-2.5 rounded-[14px] border border-[#dcdfe4] text-[#17191c] focus:outline-none focus:border-[#c09748]" 
                    placeholder="e.g. Accurate NABL Calibration Lab"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-[#777b86] block mb-1">Calibrated Date:</label>
                    <input 
                      type="date" 
                      id="newCalDate" 
                      defaultValue={editingRecord.lastCalibrationDate} 
                      className="w-full p-2 rounded-[14px] border border-[#dcdfe4] text-[#17191c] focus:outline-none focus:border-[#c09748]" 
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[#777b86] block mb-1">Next Recertification Due:</label>
                    <input 
                      type="date" 
                      id="newDueDate" 
                      defaultValue={editingRecord.nextCalibrationDue} 
                      className="w-full p-2 rounded-[14px] border border-[#dcdfe4] text-[#17191c] focus:outline-none focus:border-[#c09748]" 
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-[#ececec]">
                  <button
                    type="button"
                    onClick={() => setEditingRecord(null)}
                    className="px-4 py-2 rounded-full border border-[#dcdfe4] text-[#777b86] hover:bg-gray-50 text-xs font-semibold cursor-pointer transition shadow-2xs"
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
                        certificateNo: cert || editingRecord.certificateNo,
                        calibrationAgency: agency || editingRecord.calibrationAgency,
                        lastCalibrationDate: calDate || editingRecord.lastCalibrationDate,
                        nextCalibrationDue: dueDate || editingRecord.nextCalibrationDue,
                        status: 'Calibrated (Valid)'
                      });
                      setEditingRecord(null);
                    }}
                    className="px-5 py-2 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs font-bold transition cursor-pointer shadow-2xs active:scale-95"
                  >
                    Save & Certify Gauge
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
