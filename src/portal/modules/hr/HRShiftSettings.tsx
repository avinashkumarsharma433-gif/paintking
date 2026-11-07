import React, { useState } from 'react';
import { 
  Clock, 
  Calendar, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck,
  Moon,
  Sun,
  Save,
  RotateCcw
} from 'lucide-react';
import { PlantShiftDefinition, PlantHoliday } from '../../types/hrAttendanceTypes';

interface HRShiftSettingsProps {
  shifts: PlantShiftDefinition[];
  holidays: PlantHoliday[];
  onSaveShifts: (shifts: PlantShiftDefinition[]) => void;
  onSaveHolidays: (holidays: PlantHoliday[]) => void;
}

export const HRShiftSettings: React.FC<HRShiftSettingsProps> = ({
  shifts,
  holidays,
  onSaveShifts,
  onSaveHolidays,
}) => {
  const [activeTab, setActiveTab] = useState<'SHIFTS' | 'HOLIDAYS'>('SHIFTS');
  const [localShifts, setLocalShifts] = useState<PlantShiftDefinition[]>(shifts);
  const [localHolidays, setLocalHolidays] = useState<PlantHoliday[]>(holidays);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New Holiday Form
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('');

  // Shift Editing
  const [editingShift, setEditingShift] = useState<PlantShiftDefinition | null>(null);

  const handleUpdateShift = (id: string, updates: Partial<PlantShiftDefinition>) => {
    setLocalShifts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const handleSaveAllShifts = () => {
    onSaveShifts(localShifts);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayName.trim() || !newHolidayDate) return;
    const newHol: PlantHoliday = {
      id: `HOL-${Date.now()}`,
      name: newHolidayName.trim(),
      date: newHolidayDate,
      isOptional: false,
    };
    const updated = [...localHolidays, newHol].sort((a, b) => a.date.localeCompare(b.date));
    setLocalHolidays(updated);
    onSaveHolidays(updated);
    setNewHolidayName('');
    setNewHolidayDate('');
  };

  const handleDeleteHoliday = (id: string) => {
    const updated = localHolidays.filter((h) => h.id !== id);
    setLocalHolidays(updated);
    onSaveHolidays(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-[24px] border border-[#ececec] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">
              PK-OS Plant Governance
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] font-semibold border border-[#f4e5be]">
              Shift Timings & Rules
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif text-[#17191c] mt-1">
            Plant Shifts, Grace Periods & Factory Calendar
          </h2>
          <p className="text-xs text-[#777b86] mt-0.5">
            Configure industrial shift timing boundaries, late punch grace windows, and paid holiday schedule
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-[#fafafb] border border-[#ececec] rounded-full shrink-0">
          <button
            onClick={() => setActiveTab('SHIFTS')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
              activeTab === 'SHIFTS'
                ? 'bg-white text-[#17191c] shadow-2xs border border-[#dcdfe4]'
                : 'text-[#777b86] hover:text-[#17191c]'
            }`}
          >
            Shift Timing Rules
          </button>
          <button
            onClick={() => setActiveTab('HOLIDAYS')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
              activeTab === 'HOLIDAYS'
                ? 'bg-white text-[#17191c] shadow-2xs border border-[#dcdfe4]'
                : 'text-[#777b86] hover:text-[#17191c]'
            }`}
          >
            Plant Holidays ({localHolidays.length})
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-[16px] bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>Shift timings and grace rules successfully saved to plant operational state!</span>
        </div>
      )}

      {/* TAB 1: SHIFTS */}
      {activeTab === 'SHIFTS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {localShifts.map((shift) => (
              <div
                key={shift.id}
                className="p-5 bg-white rounded-[24px] border border-[#ececec] shadow-2xs space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      shift.isNightShift 
                        ? 'bg-[#17191c] text-amber-300' 
                        : 'bg-[#faf3e0] text-[#8a6521]'
                    }`}>
                      {shift.isNightShift ? <Moon size={18} /> : <Sun size={18} />}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#17191c]">{shift.name}</h3>
                      <span className="text-[10px] font-mono text-[#c09748]">{shift.code}</span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    shift.isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {shift.isActive ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#f2f2f3]">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#777b86] mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={shift.startTime}
                      onChange={(e) => handleUpdateShift(shift.id, { startTime: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-[#fafafb] border border-[#ececec] rounded-[14px] text-[#17191c] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#777b86] mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={shift.endTime}
                      onChange={(e) => handleUpdateShift(shift.id, { endTime: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-[#fafafb] border border-[#ececec] rounded-[14px] text-[#17191c] font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#777b86] mb-1">
                      Grace Time (Mins)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={shift.graceMinutes}
                      onChange={(e) => handleUpdateShift(shift.id, { graceMinutes: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 text-xs bg-[#fafafb] border border-[#ececec] rounded-[14px] text-[#17191c]"
                    />
                    <span className="text-[9px] text-[#979799] mt-0.5 block">Punch after +{shift.graceMinutes}m is LATE</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#777b86] mb-1">
                      Half-Day Min (Hours)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="8"
                      step="0.5"
                      value={shift.halfDayThresholdHours}
                      onChange={(e) => handleUpdateShift(shift.id, { halfDayThresholdHours: parseFloat(e.target.value) || 4 })}
                      className="w-full px-3 py-1.5 text-xs bg-[#fafafb] border border-[#ececec] rounded-[14px] text-[#17191c]"
                    />
                    <span className="text-[9px] text-[#979799] mt-0.5 block">&lt; {shift.halfDayThresholdHours}h logged = Half Day</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveAllShifts}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold rounded-full shadow-2xs transition cursor-pointer active:scale-95"
            >
              <Save size={14} className="text-[#c09748]" />
              <span>Save Shift Governance Rules</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: HOLIDAYS */}
      {activeTab === 'HOLIDAYS' && (
        <div className="space-y-4">
          {/* Add Holiday Form */}
          <form
            onSubmit={handleAddHoliday}
            className="p-5 bg-white rounded-[24px] border border-[#ececec] shadow-2xs flex flex-col sm:flex-row items-end gap-3"
          >
            <div className="flex-1 w-full">
              <label className="block text-[11px] font-semibold text-[#17191c] mb-1">
                Holiday / Plant Shutdown Name *
              </label>
              <input
                type="text"
                required
                value={newHolidayName}
                onChange={(e) => setNewHolidayName(e.target.value)}
                placeholder="e.g. Diwali / Republic Day / Annual Tooling Maintenance"
                className="w-full px-3.5 py-2 text-xs bg-[#fafafb] border border-[#ececec] rounded-[16px] text-[#17191c] focus:outline-none focus:border-[#c09748]"
              />
            </div>

            <div className="w-full sm:w-56">
              <label className="block text-[11px] font-semibold text-[#17191c] mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={newHolidayDate}
                onChange={(e) => setNewHolidayDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-[#fafafb] border border-[#ececec] rounded-[16px] text-[#17191c] focus:outline-none focus:border-[#c09748]"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold rounded-full shadow-2xs transition cursor-pointer active:scale-95 shrink-0"
            >
              <Plus size={14} className="text-[#c09748]" />
              <span>Add Holiday</span>
            </button>
          </form>

          {/* Holiday List Table */}
          <div className="bg-white rounded-[24px] border border-[#ececec] shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs text-[#17191c]">
              <thead className="bg-[#fafafb] border-b border-[#ececec] text-[10px] uppercase font-semibold text-[#777b86] tracking-wider">
                <tr>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5">Day</th>
                  <th className="py-3 px-5">Holiday / Occasion</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececec]/60">
                {localHolidays.map((hol) => {
                  const d = new Date(hol.date);
                  const dayName = d.toLocaleDateString('en-IN', { weekday: 'long' });
                  return (
                    <tr key={hol.id} className="hover:bg-[#fafafb]/50">
                      <td className="py-3.5 px-5 font-mono text-xs font-bold text-[#c09748]">{hol.date}</td>
                      <td className="py-3.5 px-5 text-[#777b86]">{dayName}</td>
                      <td className="py-3.5 px-5 font-medium text-[#17191c]">{hol.name}</td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => handleDeleteHoliday(hol.id)}
                          className="p-1.5 rounded-full text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Holiday"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {localHolidays.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-[#979799]">
                      No plant holidays scheduled yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
