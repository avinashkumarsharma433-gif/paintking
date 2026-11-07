import React, { useState } from 'react';
import { 
  Calendar, 
  Search, 
  Filter, 
  Download, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Edit3, 
  Plus, 
  ShieldCheck,
  Building2,
  FileSpreadsheet,
  Camera,
  Eye,
  X
} from 'lucide-react';
import { 
  Employee, 
  AttendanceRecord, 
  AttendanceStatus 
} from '../../types/hrAttendanceTypes';

interface HRAttendanceRegisterProps {
  records: AttendanceRecord[];
  employees: Employee[];
  onManualOverride: (recordId: string, inTime: string, outTime: string, reason: string) => void;
  onAddManualRecord: (newRecord: Omit<AttendanceRecord, 'id'>) => void;
}

export const HRAttendanceRegister: React.FC<HRAttendanceRegisterProps> = ({
  records,
  employees,
  onManualOverride,
  onAddManualRecord,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit / Override Modal
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [overrideInTime, setOverrideInTime] = useState('');
  const [overrideOutTime, setOverrideOutTime] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  // Snapshot Inspection Modal
  const [viewingEvidence, setViewingEvidence] = useState<AttendanceRecord | null>(null);

  // Filter records by date, dept, status, search
  const filteredRecords = (records || []).filter((r) => {
    if (!r || !r.id) return false;
    const matchesDate = r.date === selectedDate;
    const matchesDept = deptFilter === 'ALL' || r.department === deptFilter;
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesSearch =
      (r.employeeName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.employeeId || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDate && matchesDept && matchesStatus && matchesSearch;
  });

  // Calculate summary metrics for the day
  const totalEmployees = (employees || []).filter((e) => Boolean(e && e.id)).length;
  const presentCount = (records || []).filter((r) => Boolean(r && r.date === selectedDate && (r.status === 'PRESENT' || r.status === 'LATE'))).length;
  const lateCount = (records || []).filter((r) => Boolean(r && r.date === selectedDate && r.status === 'LATE')).length;
  const onLeaveCount = (records || []).filter((r) => Boolean(r && r.date === selectedDate && r.status === 'ON_LEAVE')).length;
  const absentCount = Math.max(0, totalEmployees - presentCount - onLeaveCount);

  const handleOpenEdit = (rec: AttendanceRecord) => {
    setEditingRecord(rec);
    setOverrideInTime(rec.inTime || '09:00:00');
    setOverrideOutTime(rec.outTime || '18:00:00');
    setOverrideReason(rec.overrideReason || 'Biometric terminal miss - verified on site');
  };

  const handleSaveOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    onManualOverride(editingRecord.id, overrideInTime, overrideOutTime, overrideReason);
    setEditingRecord(null);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Record ID', 'Employee ID', 'Name', 'Department', 'Date', 'Shift', 'In Time', 'Out Time', 'Status', 'HQ Verified', 'Manual Override'];
    const rows = filteredRecords.map((r) => [
      r.id,
      r.employeeId,
      `"${r.employeeName}"`,
      `"${r.department}"`,
      r.date,
      `"${r.shiftName}"`,
      r.inTime || '-',
      r.outTime || '-',
      r.status,
      r.inLocation?.isHQVerified ? 'YES' : 'NO',
      r.isManualOverride ? `YES (${r.overrideReason})` : 'NO',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PaintKing_Attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-[24px] border border-[#ececec] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">
              PK-OS Human Resources
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] font-semibold border border-[#f4e5be]">
              Muster Register
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif text-[#17191c] mt-1">
            Daily Attendance Register
          </h2>
          <p className="text-xs text-[#777b86] mt-0.5">
            Audit-compliant attendance logs verified with GPS Geofencing and Face Biometrics
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3.5 py-2 text-xs bg-[#fafafb] border border-[#ececec] rounded-[16px] text-[#17191c] focus:outline-none focus:border-[#c09748] shadow-2xs"
          />

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold rounded-full shadow-2xs transition cursor-pointer active:scale-95"
          >
            <Download size={14} className="text-[#c09748]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 bg-white rounded-[20px] border border-[#ececec] shadow-2xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#979799] block">Total Roster</span>
          <span className="text-xl sm:text-2xl font-serif text-[#17191c] mt-1 block">{totalEmployees}</span>
          <span className="text-[10px] text-[#777b86] mt-0.5 block">Active headcount</span>
        </div>

        <div className="p-4 bg-white rounded-[20px] border border-[#ececec] shadow-2xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#979799] block">Present Today</span>
          <span className="text-xl sm:text-2xl font-serif text-emerald-600 mt-1 block">{presentCount}</span>
          <span className="text-[10px] text-emerald-700 mt-0.5 block">
            {Math.round((presentCount / (totalEmployees || 1)) * 100)}% attendance rate
          </span>
        </div>

        <div className="p-4 bg-white rounded-[20px] border border-[#ececec] shadow-2xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#979799] block">Late Arrivals</span>
          <span className="text-xl sm:text-2xl font-serif text-amber-600 mt-1 block">{lateCount}</span>
          <span className="text-[10px] text-amber-700 mt-0.5 block">Past shift grace window</span>
        </div>

        <div className="p-4 bg-white rounded-[20px] border border-[#ececec] shadow-2xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#979799] block">On Leave</span>
          <span className="text-xl sm:text-2xl font-serif text-[#c09748] mt-1 block">{onLeaveCount}</span>
          <span className="text-[10px] text-[#8a6521] mt-0.5 block">Approved leaves</span>
        </div>

        <div className="p-4 bg-white rounded-[20px] border border-[#ececec] shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#979799] block">Absent</span>
          <span className="text-xl sm:text-2xl font-serif text-rose-600 mt-1 block">{absentCount}</span>
          <span className="text-[10px] text-rose-700 mt-0.5 block">Unreported absences</span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-5 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#979799]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search record by employee name or ID..."
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border border-[#ececec] rounded-[16px] text-[#17191c] focus:outline-none focus:border-[#c09748] shadow-2xs"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full px-3 py-2.5 text-xs bg-white border border-[#ececec] rounded-[16px] text-[#17191c] focus:outline-none focus:border-[#c09748] shadow-2xs cursor-pointer"
          >
            <option value="ALL">All Departments</option>
            <option value="Liquid Coating">Liquid Spray Painting</option>
            <option value="Hydrographics">Hydrographics (3D Dipping)</option>
            <option value="UV Digital">UV Digital Flatbed</option>
            <option value="Injection Moulding">Injection Moulding</option>
            <option value="Quality Assurance">Quality Assurance (QA)</option>
            <option value="Administration">Administration</option>
            <option value="HR">Human Resources</option>
            <option value="Maintenance">Maintenance & Tooling</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2.5 text-xs bg-white border border-[#ececec] rounded-[16px] text-[#17191c] focus:outline-none focus:border-[#c09748] shadow-2xs cursor-pointer"
          >
            <option value="ALL">All Attendance Status</option>
            <option value="PRESENT">Present (On Time)</option>
            <option value="LATE">Present (Late)</option>
            <option value="HALF_DAY">Half Day</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="ABSENT">Absent</option>
          </select>
        </div>
      </div>

      {/* 4-COLUMN COMPLIANT AUDIT TABLE (AGENTS.md) */}
      <div className="hidden sm:block bg-white rounded-[24px] border border-[#ececec] overflow-hidden shadow-2xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f2f2f3] border-b border-[#dcdfe4] text-[11px] font-semibold text-[#17191c] uppercase tracking-wider">
              <th className="py-3 px-4">Employee & Shift</th>
              <th className="py-3 px-4">In / Out Timestamps</th>
              <th className="py-3 px-4">Geofence & Distance</th>
              <th className="py-3 px-4">Status & Audit</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ececec] text-xs">
            {filteredRecords.map((rec) => (
              <tr key={rec.id} className="hover:bg-[#fafafb] transition-colors">
                {/* Column 1: Employee & Shift */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] flex items-center justify-center font-bold text-xs shrink-0">
                      {rec.employeeName[0]}
                    </div>
                    <div>
                      <span className="font-semibold text-[#17191c] block">
                        {rec.employeeName}
                      </span>
                      <span className="text-[10px] text-[#777b86]">
                        {rec.employeeId} • {rec.department}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Column 2: In / Out Timestamps & Duration */}
                <td className="py-3 px-4">
                  <div className="space-y-0.5">
                    <span className="text-xs text-[#17191c] font-medium block">
                      IN: <strong>{rec.inTime || '—'}</strong>
                    </span>
                    <span className="text-[11px] text-[#777b86] block">
                      OUT: {rec.outTime ? <strong>{rec.outTime}</strong> : <span className="text-emerald-600 font-semibold">On-Duty / Working</span>}
                    </span>
                    {rec.totalWorkMinutes !== undefined && rec.totalWorkMinutes > 0 && (
                      <span className="text-[10px] text-[#8a6521] block font-mono">
                        ⏱️ {Math.floor(rec.totalWorkMinutes / 60)}h {rec.totalWorkMinutes % 60}m worked
                      </span>
                    )}
                  </div>
                </td>

                {/* Column 3: Geofence & Distance */}
                <td className="py-3 px-4">
                  {rec.inLocation ? (
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${
                        rec.inLocation.isHQVerified ? 'bg-emerald-500' : 'bg-rose-500'
                      }`} />
                      <div>
                        <span className="text-xs text-[#17191c] font-medium block">
                          {rec.inLocation.isHQVerified ? 'Verified inside HQ' : 'Remote Location'}
                        </span>
                        <span className="text-[10px] text-[#777b86]">
                          {rec.inLocation.distanceToHQ}m from gate (±{rec.inLocation.accuracy}m)
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[11px] text-[#979799]">Manual Entry</span>
                  )}
                </td>

                {/* Column 4: Status & Audit */}
                <td className="py-3 px-4">
                  <div className="space-y-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      rec.status === 'PRESENT'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : rec.status === 'LATE'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      {rec.status === 'PRESENT' ? 'Present (On Time)' : rec.status}
                    </span>

                    {rec.isManualOverride && (
                      <span className="text-[10px] text-[#8a6521] block" title={rec.overrideReason}>
                        * Overridden by HR
                      </span>
                    )}
                  </div>
                </td>

                {/* Column 5: Action */}
                <td className="py-3 px-4 text-right space-x-1">
                  {(rec.inEvidence?.snapshotDataUrl || rec.outEvidence?.snapshotDataUrl) && (
                    <button
                      onClick={() => setViewingEvidence(rec)}
                      className="p-1.5 rounded-full text-[#8a6521] hover:text-[#17191c] hover:bg-[#faf3e0] border border-[#f4e5be] transition cursor-pointer"
                      title="View Camera Verification Photo"
                    >
                      <Camera size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenEdit(rec)}
                    className="p-1.5 rounded-full text-[#777b86] hover:text-[#17191c] hover:bg-[#ececec] transition cursor-pointer"
                    title="Edit / Manual Override"
                  >
                    <Edit3 size={14} />
                  </button>
                </td>
              </tr>
            ))}

            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-[#979799]">
                  No attendance records found for {selectedDate}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE RESPONSIVE CARDS (<640px) */}
      <div className="sm:hidden space-y-3">
        {filteredRecords.map((rec) => (
          <div key={rec.id} className="p-4 bg-[#fafafb] rounded-[18px] border border-[#ececec] space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#17191c] block">{rec.employeeName}</span>
                <span className="text-[10px] text-[#777b86]">{rec.employeeId} • {rec.department}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                rec.status === 'PRESENT'
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'bg-amber-50 text-amber-800'
              }`}>
                {rec.status}
              </span>
            </div>

            <div className="pt-2 border-t border-[#ececec] flex flex-col gap-1 text-xs text-[#777b86]">
              <div className="flex items-center justify-between">
                <span>IN: {rec.inTime || '—'}</span>
                <span>OUT: {rec.outTime || 'On-Duty'}</span>
                <div className="flex items-center gap-2">
                  {(rec.inEvidence?.snapshotDataUrl || rec.outEvidence?.snapshotDataUrl) && (
                    <button
                      onClick={() => setViewingEvidence(rec)}
                      className="p-1 text-[#8a6521] hover:text-[#17191c]"
                      title="View Photo"
                    >
                      <Camera size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenEdit(rec)}
                    className="text-xs text-[#c09748] font-semibold"
                  >
                    Override
                  </button>
                </div>
              </div>
              {rec.totalWorkMinutes !== undefined && rec.totalWorkMinutes > 0 && (
                <span className="text-[10px] text-[#8a6521] font-mono">
                  ⏱️ {Math.floor(rec.totalWorkMinutes / 60)}h {rec.totalWorkMinutes % 60}m worked
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* EDIT / MANUAL OVERRIDE MODAL */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-[#17191c]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] border border-[#ececec] shadow-xl w-full max-w-md overflow-hidden animate-in fade-in duration-200">
            <div className="p-5 border-b border-[#ececec] bg-[#fafafb]">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c09748] block">
                Audit Override Protocol
              </span>
              <h3 className="text-base font-serif text-[#17191c] mt-0.5">
                Adjust Punch Time: {editingRecord.employeeName}
              </h3>
            </div>

            <form onSubmit={handleSaveOverride} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#17191c] mb-1">
                    Punch In Time *
                  </label>
                  <input
                    type="time"
                    step="1"
                    required
                    value={overrideInTime}
                    onChange={(e) => setOverrideInTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#fafafb] border border-[#ececec] rounded-[16px] text-[#17191c] focus:outline-none focus:border-[#c09748]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#17191c] mb-1">
                    Punch Out Time
                  </label>
                  <input
                    type="time"
                    step="1"
                    value={overrideOutTime}
                    onChange={(e) => setOverrideOutTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#fafafb] border border-[#ececec] rounded-[16px] text-[#17191c] focus:outline-none focus:border-[#c09748]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#17191c] mb-1">
                  Reason for Manual Override (Mandatory Audit) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Employee forgot card / Terminal camera dirty"
                  className="w-full px-3 py-2 text-xs bg-[#fafafb] border border-[#ececec] rounded-[16px] text-[#17191c] focus:outline-none focus:border-[#c09748]"
                />
              </div>

              <div className="pt-3 border-t border-[#ececec] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#777b86] hover:text-[#17191c] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold rounded-full shadow-2xs transition cursor-pointer active:scale-95"
                >
                  Save Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* CAMERA EVIDENCE INSPECTION MODAL */}
      {viewingEvidence && (
        <div className="fixed inset-0 z-50 bg-[#17191c]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] border border-[#ececec] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in duration-200">
            <div className="p-5 border-b border-[#ececec] bg-[#fafafb] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c09748] block">
                  Biometric Audit Snapshot (Wide Angle Proof)
                </span>
                <h3 className="text-base font-serif text-[#17191c] mt-0.5">
                  Camera Evidence: {viewingEvidence.employeeName}
                </h3>
              </div>
              <button
                onClick={() => setViewingEvidence(null)}
                className="h-8 w-8 rounded-full bg-white border border-[#ececec] flex items-center justify-center text-[#777b86] hover:text-[#17191c] cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* IN PUNCH PHOTO */}
                <div className="flex flex-col items-center p-3.5 rounded-[18px] bg-[#fafafb] border border-[#ececec]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-2">
                    Punch In ({viewingEvidence.inTime || '—'})
                  </span>
                  {viewingEvidence.inEvidence?.snapshotDataUrl ? (
                    <img
                      src={viewingEvidence.inEvidence.snapshotDataUrl}
                      alt="Punch In Snapshot"
                      className="w-full h-48 object-cover rounded-xl border border-[#dcdfe4] shadow-xs"
                    />
                  ) : (
                    <div className="w-full h-48 rounded-xl bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">
                      No Photo
                    </div>
                  )}
                  <div className="mt-2 text-center text-[10px] text-[#777b86]">
                    <div>Match: {Math.round((viewingEvidence.inEvidence?.similarity || 0.95) * 100)}%</div>
                    <div>Device: {viewingEvidence.inEvidence?.deviceId || 'PK-TERMINAL'}</div>
                  </div>
                </div>

                {/* OUT PUNCH PHOTO */}
                <div className="flex flex-col items-center p-3.5 rounded-[18px] bg-[#fafafb] border border-[#ececec]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-2">
                    Punch Out ({viewingEvidence.outTime || 'On-Duty'})
                  </span>
                  {viewingEvidence.outEvidence?.snapshotDataUrl ? (
                    <img
                      src={viewingEvidence.outEvidence.snapshotDataUrl}
                      alt="Punch Out Snapshot"
                      className="w-full h-48 object-cover rounded-xl border border-[#dcdfe4] shadow-xs"
                    />
                  ) : (
                    <div className="w-full h-48 rounded-xl bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">
                      No Photo
                    </div>
                  )}
                  <div className="mt-2 text-center text-[10px] text-[#777b86]">
                    <div>Match: {Math.round((viewingEvidence.outEvidence?.similarity || 0.95) * 100)}%</div>
                    <div>Device: {viewingEvidence.outEvidence?.deviceId || 'PK-TERMINAL'}</div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#faf3e0] border border-[#f4e5be] text-xs text-[#8a6521]">
                <strong>Audit Note:</strong> Captured at verification moment. If mobile screen or paper was held in front of the lens, the photo will clearly display the phone frame/screen borders as permanent legal proof.
              </div>
            </div>

            <div className="p-4 bg-[#fafafb] border-t border-[#ececec] flex justify-end">
              <button
                onClick={() => setViewingEvidence(null)}
                className="px-5 py-2 bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold rounded-full shadow-2xs transition cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
