import { jsPDF } from 'jspdf';
import { Employee } from '../types/hrAttendanceTypes';
import { 
  drawStandardPdfHeader, 
  TABLE_BORDER_COLOR, 
  TABLE_LINE_WIDTH 
} from '../utils/pdfStandardHeader';

/**
 * Generates an official PaintKing industrial ID Card for an employee
 * Standard CR80 badge size (54mm x 85.6mm portrait badge)
 */
export function generateEmployeeIdCardPDF(employee: Employee) {
  // CR80 badge dimensions in mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [54, 86], // Standard ID card size
  });

  const cardW = 54;
  const cardH = 86;

  // 1. Background Card & Outer Border
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(2, 2, cardW - 4, cardH - 4, 3, 3, 'FD');

  // Top Accent Header
  doc.setFillColor(23, 25, 28); // #17191c
  doc.rect(2, 2, cardW - 4, 18, 'F');

  // Gold Stripe
  doc.setFillColor(192, 151, 72); // #c09748
  doc.rect(2, 20, cardW - 4, 1.2, 'F');

  // Company Brand
  doc.setFont('times', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('PAINTKING', cardW / 2, 7.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.5);
  doc.setTextColor(192, 151, 72);
  doc.text('SURFACE SOLUTIONS INDIA', cardW / 2, 11, { align: 'center' });

  doc.setFontSize(4);
  doc.setTextColor(163, 166, 175);
  doc.text('ISO 9001:2015 CERTIFIED PLANT BADGE', cardW / 2, 14.5, { align: 'center' });

  // 2. Photo Box / Avatar
  const photoY = 24;
  const photoSize = 22;
  const photoX = (cardW - photoSize) / 2;

  doc.setFillColor(250, 243, 224); // #faf3e0
  doc.setDrawColor(244, 229, 190);
  doc.setLineWidth(0.3);
  doc.roundedRect(photoX, photoY, photoSize, photoSize, 2, 2, 'FD');

  if (employee.avatarUrl && employee.avatarUrl.startsWith('data:image')) {
    try {
      doc.addImage(employee.avatarUrl, 'JPEG', photoX, photoY, photoSize, photoSize);
    } catch {
      drawAvatarFallback(doc, employee.name, photoX, photoY, photoSize);
    }
  } else {
    drawAvatarFallback(doc, employee.name, photoX, photoY, photoSize);
  }

  // 3. Employee Name & ID
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(23, 25, 28);
  doc.text(employee.name.toUpperCase(), cardW / 2, 50, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(192, 151, 72);
  doc.text(employee.id, cardW / 2, 53.5, { align: 'center' });

  // 4. Details Table
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.5);
  doc.setTextColor(119, 123, 134);

  let metaY = 57.5;
  const drawRow = (label: string, val: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(119, 123, 134);
    doc.text(label, 6, metaY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(23, 25, 28);
    doc.text(val, 20, metaY);
    metaY += 3.5;
  };

  drawRow('Designation:', employee.designation);
  drawRow('Dept:', employee.department);
  drawRow('Shift:', employee.shift.split('(')[0].trim());
  drawRow('Phone:', employee.phone);
  drawRow('Location:', employee.locationId ? employee.locationId.toUpperCase() : 'MUMBAI / HARIDWAR');

  // 5. Card Footer
  doc.setFillColor(242, 242, 243);
  doc.rect(2, 77, cardW - 4, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(3.8);
  doc.setTextColor(23, 25, 28);
  doc.text('EMERGENCY: +91 9594591313', cardW / 2, 80, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(3.2);
  doc.setTextColor(119, 123, 134);
  doc.text('Property of PaintKing. If found, return to HR Desk.', cardW / 2, 82.5, { align: 'center' });

  doc.save(`PaintKing_ID_Card_${employee.id}_${employee.name.replace(/\s+/g, '_')}.pdf`);
}

function drawAvatarFallback(doc: jsPDF, name: string, x: number, y: number, size: number) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(138, 101, 33);
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  doc.text(initials, x + size / 2, y + size / 2 + 3.5, { align: 'center' });
}
