import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Check, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface PaintkingDateTimePickerProps {
  dateValue: string; // "YYYY-MM-DD" or "DD-MM-YYYY"
  timeValue: string; // "hh:mm AM/PM" or "HH:mm"
  onChange: (dateStr: string, timeStr: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTE_PRESETS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export const PaintkingDateTimePicker: React.FC<PaintkingDateTimePickerProps> = ({
  dateValue,
  timeValue,
  onChange,
  label,
  placeholder = 'Select Deadline Date & Time',
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Parse Date helper
  const parseDate = (dStr?: string) => {
    if (!dStr) return new Date();
    if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) {
      const [y, m, d] = dStr.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    if (/^\d{2}-\d{2}-\d{4}$/.test(dStr)) {
      const [d, m, y] = dStr.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    const d = new Date(dStr);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  // Parse Time helper
  const parseTime = (tStr?: string) => {
    let hour = 7;
    let minute = 0;
    let period: 'AM' | 'PM' = 'PM';

    if (tStr) {
      const clean = tStr.trim();
      const isPM = clean.toUpperCase().includes('PM');
      const isAM = clean.toUpperCase().includes('AM');
      const parts = clean.replace(/[^\d:]/g, '').split(':');
      if (parts.length >= 2) {
        let h = parseInt(parts[0], 10);
        let m = parseInt(parts[1], 10);
        if (isNaN(h)) h = 7;
        if (isNaN(m)) m = 0;

        if (isPM || isAM) {
          hour = h > 12 ? h - 12 : (h === 0 ? 12 : h);
          period = isPM ? 'PM' : 'AM';
        } else {
          // 24h format
          if (h >= 12) {
            period = 'PM';
            hour = h > 12 ? h - 12 : 12;
          } else {
            period = 'AM';
            hour = h === 0 ? 12 : h;
          }
        }
        minute = Math.min(59, Math.max(0, m));
      }
    }
    return { hour, minute, period };
  };

  // Selected date & time states
  const initialDate = parseDate(dateValue);
  const initialTime = parseTime(timeValue);

  // Temporary working state while modal is open
  const [tempDate, setTempDate] = useState<Date>(initialDate);
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());
  const [tempHour, setTempHour] = useState<number>(initialTime.hour);
  const [tempMinute, setTempMinute] = useState<number>(initialTime.minute);
  const [tempPeriod, setTempPeriod] = useState<'AM' | 'PM'>(initialTime.period);

  // When opening modal, synchronize temp state with current props
  const handleOpenModal = () => {
    if (disabled) return;
    const d = parseDate(dateValue);
    const t = parseTime(timeValue);
    setTempDate(d);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setTempHour(t.hour);
    setTempMinute(t.minute);
    setTempPeriod(t.period);
    setIsOpen(true);
  };

  // Calendar matrix calculation
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(v => v - 1);
    } else {
      setViewMonth(v => v - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(v => v + 1);
    } else {
      setViewMonth(v => v + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const newDate = new Date(viewYear, viewMonth, day);
    setTempDate(newDate);
  };

  // Apply quick date preset
  const handleSetQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setTempDate(d);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  // Apply quick time preset
  const handleSetQuickTime = (hour: number, minute: number, period: 'AM' | 'PM') => {
    setTempHour(hour);
    setTempMinute(minute);
    setTempPeriod(period);
  };

  // Confirm changes
  const handleConfirm = () => {
    const y = tempDate.getFullYear();
    const m = String(tempDate.getMonth() + 1).padStart(2, '0');
    const d = String(tempDate.getDate()).padStart(2, '0');
    const formattedDate = `${y}-${m}-${d}`;

    const formattedHour = String(tempHour).padStart(2, '0');
    const formattedMinute = String(tempMinute).padStart(2, '0');
    const formattedTime = `${formattedHour}:${formattedMinute} ${tempPeriod}`;

    onChange(formattedDate, formattedTime);
    setIsOpen(false);
  };

  // Formatted display in trigger button
  const formattedDisplay = (() => {
    if (!dateValue) return '';
    try {
      const d = parseDate(dateValue);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const dateFormatted = `${day}-${month}-${year}`;
      const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });
      return `${dayName}, ${dateFormatted} • ${timeValue || '06:00 PM'}`;
    } catch {
      return `${dateValue} • ${timeValue}`;
    }
  })();

  const isSelectedDate = (day: number) => {
    return (
      tempDate.getDate() === day &&
      tempDate.getMonth() === viewMonth &&
      tempDate.getFullYear() === viewYear
    );
  };

  const isTodayDate = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === viewMonth &&
      today.getFullYear() === viewYear
    );
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-[10px] font-bold text-[#777b86] uppercase font-mono mb-1.5">
          {label}
        </label>
      )}

      {/* Main Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleOpenModal}
        className={`w-full h-11 px-3.5 rounded-[16px] border bg-white flex items-center justify-between text-left transition-all cursor-pointer shadow-2xs group ${
          isOpen
            ? 'border-[#c09748] ring-2 ring-[#c09748]/20 bg-[#faf7ed]/30'
            : 'border-[#dcdfe4] hover:border-[#c09748]/60 hover:bg-[#fafafb]'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <div className="w-7 h-7 rounded-[10px] bg-[#faf3e0] border border-[#f4e5be] flex items-center justify-center shrink-0 text-[#8a6521]">
            <CalendarIcon className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-mono font-bold text-xs text-[#17191c] block truncate">
              {formattedDisplay || placeholder}
            </span>
            <span className="text-[10px] text-[#777b86] block font-mono">
              Click to configure exact date, shift & completion time
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] group-hover:bg-[#f4e5be] transition">
            Change Time
          </span>
          <Clock className="w-3.5 h-3.5 text-[#c09748]" />
        </div>
      </button>

      {/* Modal Dialog Portal */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-2xl rounded-[24px] border border-[#ececec] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            {/* Header: Date & Time Highlight */}
            <div className="p-4 sm:p-5 border-b border-[#f4e5be] bg-gradient-to-r from-[#faf7ed] to-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#c09748] uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#c09748]" />
                  <span>Strict Completion Deadline Picker</span>
                </span>
                <div className="text-base sm:text-lg font-serif text-[#17191c] mt-0.5">
                  {tempDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3.5 py-1.5 rounded-[14px] bg-white border border-[#f4e5be] shadow-2xs text-center">
                  <div className="text-[9.5px] font-mono uppercase text-[#777b86] font-bold">Target Time</div>
                  <div className="font-mono text-lg sm:text-xl font-bold text-[#8a6521]">
                    {String(tempHour).padStart(2, '0')}:{String(tempMinute).padStart(2, '0')} {tempPeriod}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 text-[#777b86] hover:text-[#17191c] border border-[#ececec] flex items-center justify-center cursor-pointer transition active:scale-95 shadow-2xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dual Panel Body: Calendar (Left) + Time Selector (Right) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#ececec] p-4 sm:p-5 gap-4 sm:gap-5 overflow-y-auto max-h-[70vh]">
              
              {/* Left Column: Interactive Date Calendar */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-[#17191c]">
                      {MONTH_NAMES[viewMonth]}
                    </span>
                    <span className="font-mono text-xs text-[#777b86]">
                      {viewYear}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={prevMonth}
                      className="w-7 h-7 rounded-[8px] hover:bg-gray-100 text-[#777b86] hover:text-[#17191c] flex items-center justify-center transition cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={nextMonth}
                      className="w-7 h-7 rounded-[8px] hover:bg-gray-100 text-[#777b86] hover:text-[#17191c] flex items-center justify-center transition cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Weekday Labels */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {DAY_NAMES.map(d => (
                    <div key={d} className="text-[10px] font-bold text-[#777b86] uppercase font-mono">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Days Matrix */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {/* Previous month leading days */}
                  {Array.from({ length: firstDayOfWeek }).map((_, idx) => {
                    const prevDayNum = daysInPrevMonth - firstDayOfWeek + idx + 1;
                    return (
                      <div
                        key={`prev-${idx}`}
                        className="h-8 flex items-center justify-center text-[11px] text-gray-300 font-mono"
                      >
                        {prevDayNum}
                      </div>
                    );
                  })}

                  {/* Current month days */}
                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const selected = isSelectedDate(dayNum);
                    const today = isTodayDate(dayNum);

                    return (
                      <button
                        key={dayNum}
                        type="button"
                        onClick={() => handleSelectDay(dayNum)}
                        className={`h-8 rounded-[10px] text-xs font-mono font-bold transition flex items-center justify-center cursor-pointer relative ${
                          selected
                            ? 'bg-[#c09748] text-white shadow-2xs font-extrabold'
                            : today
                            ? 'bg-[#faf7ed] text-[#8a6521] border border-[#f4e5be]'
                            : 'hover:bg-[#fafafb] text-[#17191c]'
                        }`}
                      >
                        {dayNum}
                        {today && !selected && (
                          <span className="w-1 h-1 rounded-full bg-[#c09748] absolute bottom-1" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Quick Date Shortcuts */}
                <div className="pt-2 border-t border-[#f2f2f3] flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono text-[#777b86]">Quick Date:</span>
                  <button
                    type="button"
                    onClick={() => handleSetQuickDate(0)}
                    className="px-2.5 py-1 rounded-full bg-[#fafafb] hover:bg-[#faf7ed] hover:text-[#8a6521] border border-[#ececec] text-[10px] font-mono font-medium transition cursor-pointer"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetQuickDate(1)}
                    className="px-2.5 py-1 rounded-full bg-[#fafafb] hover:bg-[#faf7ed] hover:text-[#8a6521] border border-[#ececec] text-[10px] font-mono font-medium transition cursor-pointer"
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetQuickDate(2)}
                    className="px-2.5 py-1 rounded-full bg-[#fafafb] hover:bg-[#faf7ed] hover:text-[#8a6521] border border-[#ececec] text-[10px] font-mono font-medium transition cursor-pointer"
                  >
                    +2 Days
                  </button>
                </div>
              </div>

              {/* Right Column: Interactive Time Selector */}
              <div className="space-y-3.5 sm:pl-1">
                {/* AM / PM Toggle Pill */}
                <div className="flex items-center justify-between pb-1 border-b border-[#f2f2f3]">
                  <span className="text-[10.5px] font-bold uppercase font-mono text-[#777b86]">
                    Select Shift / Period:
                  </span>
                  <div className="p-0.5 rounded-full bg-[#fafafb] border border-[#dcdfe4] flex items-center text-xs">
                    <button
                      type="button"
                      onClick={() => setTempPeriod('AM')}
                      className={`px-3 py-1 rounded-full font-bold font-mono transition cursor-pointer ${
                        tempPeriod === 'AM'
                          ? 'bg-[#c09748] text-white shadow-2xs'
                          : 'text-[#777b86] hover:text-[#17191c]'
                      }`}
                    >
                      AM
                    </button>
                    <button
                      type="button"
                      onClick={() => setTempPeriod('PM')}
                      className={`px-3 py-1 rounded-full font-bold font-mono transition cursor-pointer ${
                        tempPeriod === 'PM'
                          ? 'bg-[#c09748] text-white shadow-2xs'
                          : 'text-[#777b86] hover:text-[#17191c]'
                      }`}
                    >
                      PM
                    </button>
                  </div>
                </div>

                {/* Hour Selection (1 to 12) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase font-mono text-[#777b86]">
                      Select Hour (1 - 12):
                    </span>
                    <span className="text-[11px] font-mono font-bold text-[#8a6521]">
                      {String(tempHour).padStart(2, '0')} Hr
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {HOURS.map((h) => {
                      const isSel = tempHour === h;
                      return (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setTempHour(h)}
                          className={`py-1.5 rounded-[10px] text-xs font-mono font-bold transition cursor-pointer border ${
                            isSel
                              ? 'bg-[#c09748] text-white border-[#c09748] shadow-2xs'
                              : 'bg-white hover:bg-[#fafafb] text-[#17191c] border-[#ececec]'
                          }`}
                        >
                          {String(h).padStart(2, '0')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Minute Selection (Intervals + Direct Input) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase font-mono text-[#777b86]">
                      Select Minute:
                    </span>
                    <div className="flex items-center gap-1 font-mono text-xs">
                      <span className="text-[#777b86] text-[10px]">Exact:</span>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={tempMinute}
                        onChange={e => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) setTempMinute(Math.min(59, Math.max(0, val)));
                        }}
                        className="w-12 h-6 px-1 text-center font-bold font-mono text-xs rounded-[6px] border border-[#f4e5be] bg-[#faf7ed] text-[#8a6521]"
                      />
                      <span className="text-[10px] text-[#777b86]">min</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-6 gap-1">
                    {MINUTE_PRESETS.map((m) => {
                      const isSel = tempMinute === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setTempMinute(m)}
                          className={`py-1 rounded-[8px] text-[11px] font-mono transition cursor-pointer border ${
                            isSel
                              ? 'bg-[#faf3e0] text-[#8a6521] border-[#f4e5be] font-bold shadow-2xs'
                              : 'bg-white hover:bg-gray-50 text-[#777b86] border-[#ececec]'
                          }`}
                        >
                          :{String(m).padStart(2, '0')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Shift Shortcut Presets */}
                <div className="pt-2 border-t border-[#f2f2f3] space-y-1">
                  <div className="text-[10px] font-mono text-[#777b86]">Standard Plant Shift Deadlines:</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSetQuickTime(2, 0, 'PM')}
                      className="p-1.5 rounded-[8px] bg-[#fafafb] hover:bg-[#faf7ed] border border-[#ececec] text-left transition cursor-pointer"
                    >
                      <div className="text-[10px] font-bold text-[#17191c]">02:00 PM</div>
                      <div className="text-[9px] text-[#777b86] truncate">Shift 1 Cutoff</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuickTime(6, 0, 'PM')}
                      className="p-1.5 rounded-[8px] bg-[#fafafb] hover:bg-[#faf7ed] border border-[#ececec] text-left transition cursor-pointer"
                    >
                      <div className="text-[10px] font-bold text-[#17191c]">06:00 PM</div>
                      <div className="text-[9px] text-[#777b86] truncate">General Shift End</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuickTime(8, 0, 'PM')}
                      className="p-1.5 rounded-[8px] bg-[#fafafb] hover:bg-[#faf7ed] border border-[#ececec] text-left transition cursor-pointer"
                    >
                      <div className="text-[10px] font-bold text-[#17191c]">08:00 PM</div>
                      <div className="text-[9px] text-[#777b86] truncate">Overtime Window</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuickTime(10, 0, 'PM')}
                      className="p-1.5 rounded-[8px] bg-[#fafafb] hover:bg-[#faf7ed] border border-[#ececec] text-left transition cursor-pointer"
                    >
                      <div className="text-[10px] font-bold text-[#17191c]">10:00 PM</div>
                      <div className="text-[9px] text-[#777b86] truncate">Shift 2 Cutoff</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-3.5 sm:p-4 border-t border-[#ececec] bg-[#fafafb] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-mono text-[#777b86]">
                <Clock className="w-3.5 h-3.5 text-[#c09748]" />
                <span>Selected: <strong className="text-[#17191c]">{tempDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })} • {String(tempHour).padStart(2, '0')}:{String(tempMinute).padStart(2, '0')} {tempPeriod}</strong></span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-full bg-white hover:bg-gray-100 text-[#17191c] border border-[#dcdfe4] text-xs font-semibold cursor-pointer active:scale-95 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="px-5 py-2 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 transition"
                >
                  <Check className="w-3.5 h-3.5 text-[#8a6521]" />
                  <span>Confirm & Set Deadline</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
