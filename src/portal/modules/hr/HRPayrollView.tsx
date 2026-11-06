import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  Download, 
  Calendar, 
  Search, 
  Clock, 
  TrendingUp, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  User,
  ChevronRight,
  Eye,
  Sliders
} from 'lucide-react';
import { Employee, AttendanceRecord } from '../../types/hrAttendanceTypes';
import { 
  calculateEmployeeMonthlyPayroll, 
  exportEmployeeMonthlyPayrollCSV 
} from '../../services/payrollCalculationService';
import { generateEmployeeSalarySlipPDF } from '../../services/payrollPdfService';

interface HRPayrollViewProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  onUpdateEmployeeRate?: (empId: string, dailyRate: number) => void;
}

export const HRPayrollView: React.FC<HRPayrollViewProps> = ({
  employees,
  attendanceRecords,
  onUpdateEmployeeRate,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${y}-${m}`;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [inspectingEmpId, setInspectingEmpId] = useState<string | null>(null);

  // Rate edit modal
  const [editingRateEmp, setEditingRateEmp] = useState<Employee | null>(null);
  const [newDailyRate, setNewDailyRate] = useState<number>(750);

  // Calculate summaries for all active employees
  const allSummaries = useMemo(() => {
    return employees.map((emp) => {
      return calculateEmployeeMonthlyPayroll(emp, selectedMonth, attendanceRecords);
    });
  }, [employees, selectedMonth, attendanceRecords]);

  // Filtered summaries
  const filteredSummaries = useMemo(() => {
    return allSummaries.filter((s) => {
      const matchesSearch = 
        s.employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.employee.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = selectedDept === 'ALL' || s.employee.department === selectedDept;
      return matchesSearch && matchesDept;
    });
  }, [allSummaries, searchQuery, selectedDept]);

  // Plant aggregates
  const totalPlantPayout = filteredSummaries.reduce((acc, s) => acc + s.totalGrossPayable, 0);
  const totalPlantOtHours = filteredSummaries.reduce((acc, s) => acc + s.totalOtHours, 0);
  const totalPresentDays = filteredSummaries.reduce((acc, s) => acc + s.presentDays, 0);

  const inspectingSummary = inspectingEmpId 
    ? allSummaries.find((s) => s.employee.id === inspectingEmpId) 
    : null;

  const handleSaveRate = () => {
    if (editingRateEmp && onUpdateEmployeeRate) {
      onUpdateEmployeeRate(editingRateEmp.id, newDailyRate);
    }
    setEditingRateEmp(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-[24px] border border-[#ececec] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">
              PK-OS Industrial Payroll
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] font-semibold border border-[#f4e5be]">
              OT & Wages Engine
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif text-[#17191c] mt-1">
            Plant Attendance & Payroll Register
          </h2>
          <p className="text-xs text-[#777b86] mt-0.5">
            Automated day-wise wages calculation, OT hours tracking (1.5x) and one-click PDF payslips
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#fafafb] px-3 py-1.5 rounded-full border border-[#ececec]">
            <Calendar size={14} className="text-[#c09748]" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs bg-transparent text-[#17191c] font-semibold focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-[20px] bg-white border border-[#ececec] shadow-2xs flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-full bg-[#faf3e0] border border-[#f4e5be] flex items-center justify-center text-[#8a6521]">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#777b86]">Total Gross Payout</p>
            <h3 className="text-xl font-bold text-[#17191c] mt-0.5">₹ {totalPlantPayout.toLocaleString('en-IN')}</h3>
            <p className="text-[10px] text-[#979799] mt-0.5">For {filteredSummaries.length} enrolled staff</p>
          </div>
        </div>

        <div className="p-4 rounded-[20px] bg-white border border-[#ececec] shadow-2xs flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#777b86]">Total Overtime (OT)</p>
            <h3 className="text-xl font-bold text-[#17191c] mt-0.5">{totalPlantOtHours} Hours</h3>
            <p className="text-[10px] text-amber-600 font-medium mt-0.5">Calculated @ 1.5x hourly rate</p>
          </div>
        </div>

        <div className="p-4 rounded-[20px] bg-white border border-[#ececec] shadow-2xs flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#777b86]">Total Present Days</p>
            <h3 className="text-xl font-bold text-[#17191c] mt-0.5">{totalPresentDays} Man-Days</h3>
            <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Bio-metric confirmed</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#979799]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee or ID..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-[#ececec] rounded-full text-[#17191c] focus:outline-none focus:border-[#c09748]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-[#ececec] rounded-full text-[#17191c] focus:outline-none focus:border-[#c09748]"
          >
            <option value="ALL">All Departments</option>
            <option value="Liquid Coating">Liquid Coating</option>
            <option value="Hydrographics">Hydrographics</option>
            <option value="UV Digital">UV Digital</option>
            <option value="Injection Moulding">Injection Moulding</option>
            <option value="Quality Assurance">Quality Assurance</option>
            <option value="Administration">Administration</option>
          </select>
        </div>
      </div>

      {/* Desktop Master Table (4-5 columns design guideline) */}
      <div className="hidden sm:block bg-white rounded-[24px] border border-[#ececec] overflow-hidden shadow-2xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f2f2f3] border-b border-[#dcdfe4] text-[11px] font-bold uppercase tracking-wider text-[#17191c]">
              <th className="py-3.5 px-5">Employee & Dept</th>
              <th className="py-3.5 px-4">Daily Wage Rate</th>
              <th className="py-3.5 px-4">Attendance Stats</th>
              <th className="py-3.5 px-4">OT Hours & Pay</th>
              <th className="py-3.5 px-4">Gross Salary</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ececec] text-xs text-[#17191c]">
            {filteredSummaries.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#777b86]">
                  No employee payroll records found for this filter.
                </td>
              </tr>
            ) : (
              filteredSummaries.map((s) => (
                <tr key={s.employee.id} className="hover:bg-[#fafafb] transition">
                  <td className="py-3.5 px-5">
                    <div className="font-semibold text-[#17191c]">{s.employee.name}</div>
                    <div className="text-[11px] text-[#777b86] flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-[#c09748]">{s.employee.id}</span>
                      <span>•</span>
                      <span>{s.employee.department}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold">₹ {s.dailyRate} / day</span>
                      <button
                        onClick={() => {
                          setEditingRateEmp(s.employee);
                          setNewDailyRate(s.dailyRate);
                        }}
                        className="text-[#979799] hover:text-[#c09748] cursor-pointer"
                        title="Edit Daily Rate"
                      >
                        <Sliders size={13} />
                      </button>
                    </div>
                    <div className="text-[10px] text-[#979799]">8.0 hrs normal shift</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                        {s.presentDays} Present
                      </span>
                      {s.absentDays > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200">
                          {s.absentDays} Absent
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#777b86] mt-0.5">
                      {s.totalWorkHours} total hrs logged
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-amber-700">
                      {s.totalOtHours > 0 ? `+${s.totalOtHours} hrs OT` : 'No OT'}
                    </div>
                    <div className="text-[10px] text-[#777b86]">
                      ₹ {s.otEarnings.toLocaleString('en-IN')}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="text-sm font-bold text-[#17191c]">
                      ₹ {s.totalGrossPayable.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-[#979799]">
                      Base: ₹ {s.baseSalaryEarned.toLocaleString('en-IN')}
                    </div>
                  </td>

                  <td className="py-3.5 px-5 text-right space-x-1.5">
                    <button
                      onClick={() => setInspectingEmpId(s.employee.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold rounded-full shadow-2xs transition cursor-pointer active:scale-95"
                    >
                      <Eye size={12} className="text-[#c09748]" />
                      <span>Details</span>
                    </button>

                    <button
                      onClick={() => generateEmployeeSalarySlipPDF(s)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold rounded-full shadow-2xs transition cursor-pointer active:scale-95"
                      title="Download PDF Payslip"
                    >
                      <FileText size={12} className="text-[#8a6521]" />
                      <span>PDF</span>
                    </button>

                    <button
                      onClick={() => exportEmployeeMonthlyPayrollCSV(s)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#777b86] hover:text-[#17191c] border border-[#dcdfe4] text-xs font-semibold rounded-full shadow-2xs transition cursor-pointer active:scale-95"
                      title="Export CSV"
                    >
                      <FileSpreadsheet size={12} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List (Screen <640px) */}
      <div className="sm:hidden space-y-3">
        {filteredSummaries.map((s) => (
          <div key={s.employee.id} className="bg-[#fafafb] rounded-[18px] border border-[#ececec] p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-sm text-[#17191c]">{s.employee.name}</h4>
                <p className="text-[11px] text-[#777b86] font-mono mt-0.5">{s.employee.id} • {s.employee.department}</p>
              </div>
              <div className="text-right">
                <div className="text-base font-bold text-[#17191c]">₹ {s.totalGrossPayable.toLocaleString('en-IN')}</div>
                <div className="text-[10px] text-[#777b86]">Rate: ₹{s.dailyRate}/d</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#ececec]">
              <div>
                <span className="text-[#979799] block text-[10px]">Attendance:</span>
                <span className="font-semibold text-emerald-700">{s.presentDays} Present</span>, {s.absentDays} Absent
              </div>
              <div>
                <span className="text-[#979799] block text-[10px]">Overtime:</span>
                <span className="font-semibold text-amber-700">{s.totalOtHours} hrs</span> (₹{s.otEarnings})
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#ececec]">
              <button
                onClick={() => setInspectingEmpId(s.employee.id)}
                className="flex-1 py-1.5 bg-white border border-[#dcdfe4] rounded-full text-xs font-semibold text-[#17191c] flex items-center justify-center gap-1 shadow-2xs"
              >
                <Eye size={12} />
                <span>View Daily Logs</span>
              </button>
              <button
                onClick={() => generateEmployeeSalarySlipPDF(s)}
                className="py-1.5 px-3 bg-[#faf3e0] border border-[#f4e5be] rounded-full text-xs font-semibold text-[#8a6521] flex items-center gap-1 shadow-2xs"
              >
                <FileText size={12} />
                <span>PDF Slip</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* DETAIL INSPECT MODAL (Full 30-Day Breakdown with In/Out timestamps) */}
      {inspectingSummary && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#ececec] overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#ececec] flex items-center justify-between bg-[#fafafb]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#c09748]">
                    {inspectingSummary.month} Statement
                  </span>
                  <span className="text-xs font-mono text-[#979799]">({inspectingSummary.employee.id})</span>
                </div>
                <h3 className="text-lg font-serif font-bold text-[#17191c] mt-0.5">
                  {inspectingSummary.employee.name} — Attendance & Earnings Log
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => generateEmployeeSalarySlipPDF(inspectingSummary)}
                  className="px-3 py-1.5 bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold rounded-full shadow-2xs transition flex items-center gap-1 cursor-pointer"
                >
                  <FileText size={12} className="text-[#8a6521]" />
                  <span>Download PDF Slip</span>
                </button>
                <button
                  onClick={() => setInspectingEmpId(null)}
                  className="h-8 w-8 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] flex items-center justify-center text-[#777b86] cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body: Daily List */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-4 gap-3 bg-[#faf3e0] border border-[#f4e5be] p-3.5 rounded-[18px] text-xs">
                <div>
                  <span className="text-[#8a6521] block text-[10px] font-bold uppercase">Present Days</span>
                  <span className="text-base font-bold text-[#17191c]">{inspectingSummary.presentDays}</span>
                </div>
                <div>
                  <span className="text-[#8a6521] block text-[10px] font-bold uppercase">Absent Days</span>
                  <span className="text-base font-bold text-rose-700">{inspectingSummary.absentDays}</span>
                </div>
                <div>
                  <span className="text-[#8a6521] block text-[10px] font-bold uppercase">Total OT Hours</span>
                  <span className="text-base font-bold text-amber-700">{inspectingSummary.totalOtHours} hrs</span>
                </div>
                <div>
                  <span className="text-[#8a6521] block text-[10px] font-bold uppercase">Net Payable</span>
                  <span className="text-base font-bold text-[#8a6521]">₹ {inspectingSummary.totalGrossPayable.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="border border-[#ececec] rounded-[18px] overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#f2f2f3] text-[10px] font-bold uppercase text-[#17191c] border-b border-[#dcdfe4]">
                      <th className="py-2.5 px-3">Date & Day</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">In Punch</th>
                      <th className="py-2.5 px-3">Out Punch</th>
                      <th className="py-2.5 px-3">Work Time</th>
                      <th className="py-2.5 px-3">OT Hrs</th>
                      <th className="py-2.5 px-3 text-right">Earnings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ececec]">
                    {inspectingSummary.dailyBreakdown.map((row) => (
                      <tr key={row.date} className="hover:bg-[#fafafb]">
                        <td className="py-2 px-3 font-mono font-medium">
                          {row.date} <span className="text-[#777b86]">({row.dayName})</span>
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.status === 'PRESENT'
                              ? 'bg-emerald-50 text-emerald-700'
                              : row.status === 'LATE'
                              ? 'bg-amber-50 text-amber-700'
                              : row.status === 'ABSENT'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono">{row.inTime || '--:--'}</td>
                        <td className="py-2 px-3 font-mono">{row.outTime || '--:--'}</td>
                        <td className="py-2 px-3">{row.workHours > 0 ? `${row.workHours} hrs` : '--'}</td>
                        <td className="py-2 px-3 font-semibold text-amber-700">
                          {row.otHours > 0 ? `+${row.otHours} h` : '--'}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-[#17191c]">
                          ₹ {row.earnedAmount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#fafafb] border-t border-[#ececec] flex justify-end">
              <button
                onClick={() => setInspectingEmpId(null)}
                className="px-5 py-2 bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold rounded-full shadow-2xs transition cursor-pointer"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT DAILY WAGE RATE MODAL */}
      {editingRateEmp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-sm w-full p-5 space-y-4 shadow-2xl border border-[#ececec] animate-in fade-in zoom-in-95">
            <h3 className="text-base font-serif font-bold text-[#17191c]">
              Update Wage Rate: {editingRateEmp.name}
            </h3>
            <p className="text-xs text-[#777b86]">
              Set per-day basic rate for standard 8-hour shift.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#17191c]">Daily Rate (INR ₹)</label>
              <input
                type="number"
                value={newDailyRate}
                onChange={(e) => setNewDailyRate(Math.max(100, Number(e.target.value)))}
                className="w-full p-2.5 rounded-xl border border-[#ececec] text-sm font-semibold focus:outline-none focus:border-[#c09748]"
              />
              <p className="text-[10px] text-[#979799]">
                Estimated OT Hourly: ₹ {Math.round((newDailyRate / 8) * 1.5)} / hr
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingRateEmp(null)}
                className="px-3.5 py-1.5 text-xs text-[#777b86] hover:text-[#17191c] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRate}
                className="px-4 py-1.5 bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold rounded-full shadow-2xs transition cursor-pointer"
              >
                Save Rate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
