import { jsPDF } from 'jspdf';
import { EmployeeMonthlyPayrollSummary } from '../types/hrAttendanceTypes';
import { 
  drawStandardPdfHeader, 
  TABLE_BORDER_COLOR, 
  TABLE_LINE_WIDTH 
} from '../utils/pdfStandardHeader';

export function generateEmployeeSalarySlipPDF(summary: EmployeeMonthlyPayrollSummary) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const { employee, month, dailyBreakdown, totalGrossPayable, totalOtHours, baseSalaryEarned, otEarnings, presentDays, absentDays, leaveDays, halfDays, dailyRate } = summary;

  // 1. Draw Universal Standard PaintKing Header
  let currentY = drawStandardPdfHeader(doc, {
    docTitle: 'MONTHLY PAYSLIP & ATTENDANCE STATEMENT',
    docNumber: `PAY-${employee.id}-${month.replace('-', '')}`,
    date: new Date().toISOString().split('T')[0],
    plant: 'Vapi / Haridwar Industrial Unit',
    badgeText: 'OFFICIAL HR RECORD',
    docSubtitle: 'FORM IV - PAYMENT OF WAGES ACT',
  });

  currentY += 6;

  // 2. Employee Metadata Grid
  doc.setFillColor(250, 250, 251);
  doc.setDrawColor(...TABLE_BORDER_COLOR);
  doc.setLineWidth(TABLE_LINE_WIDTH);
  doc.roundedRect(14, currentY, 182, 26, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(23, 25, 28);

  // Col 1
  doc.text(`Employee: ${employee.name}`, 18, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(119, 123, 134);
  doc.text(`ID: ${employee.id}  •  Dept: ${employee.department}`, 18, currentY + 12);
  doc.text(`Designation: ${employee.designation}`, 18, currentY + 18);
  doc.text(`Shift: ${employee.shift}`, 18, currentY + 23);

  // Col 2
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(23, 25, 28);
  doc.text(`Statement Period: ${month}`, 110, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(119, 123, 134);
  doc.text(`Wage Rate: Rs ${dailyRate} / day  (8.0 hrs normal shift)`, 110, currentY + 12);
  doc.text(`Attendance: ${presentDays} Present | ${absentDays} Absent | ${leaveDays} Off/Leave`, 110, currentY + 18);
  doc.text(`OT Logged: ${totalOtHours} Hours  |  OT Rate: 1.5x`, 110, currentY + 23);

  currentY += 32;

  // 3. Earnings Summary Highlight Bar
  doc.setFillColor(242, 242, 243);
  doc.roundedRect(14, currentY, 182, 16, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.0);
  doc.setTextColor(23, 25, 28);
  doc.text('EARNINGS BREAKDOWN:', 18, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Base Wage: Rs ${baseSalaryEarned.toLocaleString('en-IN')}`, 18, currentY + 11.5);
  doc.text(`OT Earnings: Rs ${otEarnings.toLocaleString('en-IN')}`, 75, currentY + 11.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.0);
  doc.setTextColor(138, 101, 33); // Gold tint text #8a6521
  doc.text(`NET PAYABLE: Rs ${totalGrossPayable.toLocaleString('en-IN')}`, 135, currentY + 10.5);

  currentY += 22;

  // 4. Daily Attendance & OT Log Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.0);
  doc.setTextColor(23, 25, 28);
  doc.text('DAY-BY-DAY ATTENDANCE, PUNCH TIMINGS & OT REGISTER', 14, currentY - 2);

  // Table Headers
  const colWidths = [22, 16, 24, 25, 25, 22, 22, 26]; // Total: 182mm
  const colPositions = [14, 36, 52, 76, 101, 126, 148, 170];
  const headers = ['Date', 'Day', 'Status', 'In Punch', 'Out Punch', 'Work Hrs', 'OT Hrs', 'Day Total'];

  const headerHeight = 6.5;
  doc.setFillColor(242, 242, 243);
  doc.rect(14, currentY, 182, headerHeight, 'F');
  doc.setDrawColor(...TABLE_BORDER_COLOR);
  doc.setLineWidth(TABLE_LINE_WIDTH);
  doc.rect(14, currentY, 182, headerHeight, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.0);
  doc.setTextColor(23, 25, 28);

  headers.forEach((h, i) => {
    doc.text(h, colPositions[i] + 2, currentY + 4.5);
  });

  currentY += headerHeight;

  // Table Rows (30/31 days)
  const rowHeight = 4.8;
  dailyBreakdown.forEach((row, idx) => {
    if (currentY + rowHeight > 280) {
      doc.addPage();
      currentY = 20;
    }

    const isEven = idx % 2 === 0;
    if (!isEven) {
      doc.setFillColor(250, 250, 251);
      doc.rect(14, currentY, 182, rowHeight, 'F');
    }

    // Row borders
    doc.setDrawColor(...TABLE_BORDER_COLOR);
    doc.setLineWidth(TABLE_LINE_WIDTH);
    doc.rect(14, currentY, 182, rowHeight, 'D');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(23, 25, 28);

    doc.text(row.date, colPositions[0] + 2, currentY + 3.4);
    doc.text(row.dayName, colPositions[1] + 2, currentY + 3.4);

    // Status colored text
    if (row.status === 'PRESENT' || row.status === 'LATE') {
      doc.setTextColor(16, 120, 70); // Dark Green
    } else if (row.status === 'ABSENT') {
      doc.setTextColor(180, 40, 40); // Dark Red
    } else {
      doc.setTextColor(120, 100, 30); // Ochre / Amber
    }
    doc.text(row.status, colPositions[2] + 2, currentY + 3.4);

    doc.setTextColor(23, 25, 28);
    doc.text(row.inTime || '--', colPositions[3] + 2, currentY + 3.4);
    doc.text(row.outTime || '--', colPositions[4] + 2, currentY + 3.4);
    doc.text(row.workHours > 0 ? `${row.workHours} h` : '--', colPositions[5] + 2, currentY + 3.4);

    if (row.otHours > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(138, 101, 33);
      doc.text(`+${row.otHours} h`, colPositions[6] + 2, currentY + 3.4);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(23, 25, 28);
    } else {
      doc.text('--', colPositions[6] + 2, currentY + 3.4);
    }

    doc.setFont('helvetica', 'bold');
    doc.text(`Rs ${row.earnedAmount}`, colPositions[7] + 2, currentY + 3.4);
    doc.setFont('helvetica', 'normal');

    currentY += rowHeight;
  });

  // Footer Total Bar
  doc.setFillColor(235, 238, 244);
  doc.rect(14, currentY, 182, 6.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(23, 25, 28);
  doc.text('TOTAL MONTHLY PAYABLE', 18, currentY + 4.5);
  doc.text(`${totalOtHours} OT Hrs`, colPositions[6] + 2, currentY + 4.5);
  doc.text(`Rs ${totalGrossPayable.toLocaleString('en-IN')}`, colPositions[7] + 2, currentY + 4.5);

  // Save PDF
  doc.save(`PaintKing_Payslip_${employee.id}_${month}.pdf`);
}
