import { jsPDF } from 'jspdf';
import { Employee, AttendanceRecord } from '../types/hrAttendanceTypes';
import { 
  drawStandardPdfHeader, 
  TABLE_BORDER_COLOR, 
  TABLE_LINE_WIDTH 
} from '../utils/pdfStandardHeader';

/**
 * Generate monthly Muster Roll (Form 28 / Factory Attendance Sheet) in CSV format.
 * If employeeFilter is provided, exports ONLY matching employees; otherwise exports all.
 */
export function exportPlantMusterRollCSV(
  employees: Employee[], 
  records: AttendanceRecord[], 
  month: string, // e.g. "2026-11"
  employeeFilter?: string // Optional search name or ID
) {
  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr);
  const monthIdx = parseInt(monthStr) - 1;
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

  // Filter employees if search filter is active
  const targetEmployees = employeeFilter && employeeFilter.trim()
    ? employees.filter((e) =>
        e.name.toLowerCase().includes(employeeFilter.toLowerCase()) ||
        e.id.toLowerCase().includes(employeeFilter.toLowerCase())
      )
    : employees;

  if (targetEmployees.length === 0) {
    alert('No matching employee found to export for the given search criteria.');
    return;
  }

  // CSV Header
  const dayCols = Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0'));
  const header = ['Emp ID', 'Name', 'Department', 'Designation', ...dayCols, 'Total Present', 'Half Days', 'Total Absent', 'Total Work Hours'];

  const rows = targetEmployees.map((emp) => {
    let presentCount = 0;
    let halfDayCount = 0;
    let absentCount = 0;
    let totalMinutes = 0;

    const dayStatusCols = dayCols.map((day) => {
      const dateStr = `${month}-${day}`;
      const rec = records.find((r) => r.employeeId === emp.id && r.date === dateStr);
      if (!rec || !rec.inTime) {
        // Check if Sunday
        const curDate = new Date(`${dateStr}T12:00:00`);
        if (curDate.getDay() === 0) {
          return 'WO'; // Weekly Off
        }
        absentCount++;
        return 'A';
      }

      if (rec.status === 'HALF_DAY') {
        halfDayCount++;
        totalMinutes += rec.totalWorkMinutes || 240;
        return 'HD';
      }

      presentCount++;
      totalMinutes += rec.totalWorkMinutes || 480;
      return 'P';
    });

    const hours = (totalMinutes / 60).toFixed(1);

    return [
      emp.id,
      `"${emp.name}"`,
      `"${emp.department}"`,
      `"${emp.designation}"`,
      ...dayStatusCols,
      presentCount,
      halfDayCount,
      absentCount,
      hours,
    ].join(',');
  });

  const csvContent = [header.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);

  const fileSuffix = targetEmployees.length === 1 
    ? `_${targetEmployees[0].name.replace(/\s+/g, '_')}_${targetEmployees[0].id}`
    : '';

  link.setAttribute('download', `PaintKing_Plant_Muster_Roll_${month}${fileSuffix}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
