import { 
  Employee, 
  AttendanceRecord, 
  EmployeeMonthlyPayrollSummary, 
  DailyAttendanceSummary 
} from '../types/hrAttendanceTypes';

export const STANDARD_WORK_HOURS_PER_DAY = 8.0;
export const DEFAULT_DAILY_RATE = 750; // INR per day default

/**
 * Calculates monthly payroll, OT hours, and day-by-day attendance breakdown
 * for a specific employee and month (format: YYYY-MM).
 */
export function calculateEmployeeMonthlyPayroll(
  employee: Employee,
  monthStr: string, // '2026-11'
  attendanceRecords: AttendanceRecord[]
): EmployeeMonthlyPayrollSummary {
  const [yearStr, monthNumStr] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthNumStr, 10);

  // Total days in that month
  const totalDaysInMonth = new Date(year, month, 0).getDate();
  const dailyRate = employee.dailyRate || (employee.monthlySalary ? Math.round(employee.monthlySalary / 26) : DEFAULT_DAILY_RATE);
  const hourlyBaseRate = dailyRate / STANDARD_WORK_HOURS_PER_DAY;
  // Default exact proportional rate: e.g. 800/8 = 100/hr, so 2h OT = 200
  const isOtEligible = employee.isOtEligible !== false; // default true
  const otHourlyRate = isOtEligible ? (employee.otHourlyRate || hourlyBaseRate) : 0;

  let presentDays = 0;
  let halfDays = 0;
  let lateDays = 0;
  let absentDays = 0;
  let leaveDays = 0;
  let totalWorkHours = 0;
  let totalOtHours = 0;
  let baseSalaryEarned = 0;
  let otEarnings = 0;

  const dailyBreakdown: DailyAttendanceSummary[] = [];

  for (let day = 1; day <= totalDaysInMonth; day++) {
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const dateStr = `${monthStr}-${dayStr}`;
    const dateObj = new Date(year, month - 1, day);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

    // Look for attendance record
    const record = (attendanceRecords || []).find(
      (r) => r.employeeId === employee.id && r.date === dateStr
    );

    let status = record?.status;
    const inTime = record?.inTime;
    const outTime = record?.outTime;

    let workMinutes = record?.totalWorkMinutes || 0;
    if (!workMinutes && inTime && outTime) {
      const [inH, inM] = inTime.split(':').map(Number);
      const [outH, outM] = outTime.split(':').map(Number);
      const diff = (outH * 60 + outM) - (inH * 60 + inM);
      if (diff > 0) workMinutes = diff;
    }

    const workHours = Math.round((workMinutes / 60) * 10) / 10;
    let otHours = 0;
    let earnedAmount = 0;

    // Check Sunday / weekend
    const isSunday = dateObj.getDay() === 0;

    if (record && (status === 'PRESENT' || status === 'LATE' || inTime)) {
      if (status === 'LATE') lateDays++;
      presentDays++;

      // OT Calculation: work beyond 8 hours (only if eligible)
      if (isOtEligible && workHours > STANDARD_WORK_HOURS_PER_DAY) {
        otHours = Math.round((workHours - STANDARD_WORK_HOURS_PER_DAY) * 10) / 10;
      }

      earnedAmount = dailyRate + (otHours * otHourlyRate);
      baseSalaryEarned += dailyRate;
      otEarnings += (otHours * otHourlyRate);
      totalWorkHours += workHours;
      totalOtHours += otHours;
      status = status || 'PRESENT';
    } else if (record && status === 'HALF_DAY') {
      halfDays++;
      earnedAmount = dailyRate * 0.5;
      baseSalaryEarned += earnedAmount;
      totalWorkHours += (workHours || 4.0);
    } else if (record && status === 'ON_LEAVE') {
      leaveDays++;
      // Approved leave with pay
      earnedAmount = dailyRate;
      baseSalaryEarned += dailyRate;
    } else {
      // No punch record
      if (isSunday) {
        // Factory weekly off - Paid Sunday if active
        status = 'ON_LEAVE';
        earnedAmount = dailyRate;
        baseSalaryEarned += dailyRate;
        leaveDays++;
      } else {
        // Absent
        status = 'ABSENT';
        absentDays++;
        earnedAmount = 0;
      }
    }

    dailyBreakdown.push({
      date: dateStr,
      dayName,
      inTime,
      outTime,
      status: status || 'ABSENT',
      workHours,
      otHours,
      earnedAmount: Math.round(earnedAmount),
    });
  }

  const totalGrossPayable = Math.round(baseSalaryEarned + otEarnings);

  return {
    employee,
    month: monthStr,
    totalDaysInMonth,
    presentDays,
    halfDays,
    lateDays,
    absentDays,
    leaveDays,
    totalWorkHours: Math.round(totalWorkHours * 10) / 10,
    totalOtHours: Math.round(totalOtHours * 10) / 10,
    dailyRate,
    baseSalaryEarned: Math.round(baseSalaryEarned),
    otEarnings: Math.round(otEarnings),
    totalGrossPayable,
    dailyBreakdown,
  };
}

/**
 * Exports complete monthly breakdown to CSV
 */
export function exportEmployeeMonthlyPayrollCSV(summary: EmployeeMonthlyPayrollSummary) {
  const { employee, month, dailyBreakdown, totalGrossPayable, totalOtHours, baseSalaryEarned, otEarnings, presentDays, absentDays } = summary;

  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += `PAINTKING SURFACE SOLUTIONS - MONTHLY PAYROLL & ATTENDANCE STATEMENT\r\n`;
  csvContent += `Employee ID,${employee.id},Employee Name,${employee.name}\r\n`;
  csvContent += `Department,${employee.department},Designation,${employee.designation}\r\n`;
  csvContent += `Month,${month},Daily Wage Rate (INR),Rs ${summary.dailyRate}\r\n`;
  csvContent += `Present Days,${presentDays},Absent Days,${absentDays},Total OT Hours,${totalOtHours} hrs\r\n`;
  csvContent += `Base Salary Earned,Rs ${baseSalaryEarned},OT Earnings,Rs ${otEarnings},Net Gross Payable,Rs ${totalGrossPayable}\r\n\r\n`;

  // Table header
  csvContent += `Date,Day,Status,In-Time,Out-Time,Work Hours,OT Hours,Day Earnings (INR)\r\n`;

  dailyBreakdown.forEach((d) => {
    csvContent += `${d.date},${d.dayName},${d.status},${d.inTime || '--'},${d.outTime || '--'},${d.workHours},${d.otHours},${d.earnedAmount}\r\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `PaintKing_Payroll_${employee.id}_${month}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
