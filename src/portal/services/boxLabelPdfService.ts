import { jsPDF } from 'jspdf';
import { PlantLocation } from '../types/portalTypes';
import { PAINTKING_LOGO_BASE64 } from '../utils/paintkingLogoBase64';
import { renderScannableCode39 } from './code39BarcodeService';

export interface BoxLabelItem {
  globalBoxNumber: number; // Continuous sequential counter (e.g. 1, 2, 3...)
  boxSerialText: string;   // e.g. "PK-BOX-0001"
  orderBoxIndex: number;   // e.g. 1
  totalOrderBoxes: number; // e.g. 7 ("BOX 01 OF 07")
  boxQty: number;          // e.g. 150 (or remainder 100)
  totalLotQty: number;     // e.g. 1000
  customer: string;
  woNo: string;
  partCode: string;
  partDescription: string;
  color: string;
  paintBatch: string;
  painter: string;
  packedBy: string;
  packedDate: string;
  plant: PlantLocation;
}

/**
 * Gets and updates the factory-wide continuous box counter from localStorage
 */
export function getNextBoxCounterRange(count: number): number {
  try {
    const saved = localStorage.getItem('pk_master_box_counter');
    const current = saved ? parseInt(saved, 10) : 0;
    const startNumber = current + 1;
    const newTotal = current + count;
    localStorage.setItem('pk_master_box_counter', newTotal.toString());
    return startNumber;
  } catch {
    return 1;
  }
}

export function getCurrentBoxCounter(): number {
  try {
    const saved = localStorage.getItem('pk_master_box_counter');
    return saved ? parseInt(saved, 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * Generates an industrial multi-page 4" x 6" (100mm x 150mm) PDF
 * with one page per box label in continuous sequence.
 */
export function generateMultiBoxThermalLabelPDF(boxes: BoxLabelItem[], fileNamePrefix: string) {
  if (!boxes || boxes.length === 0) return;

  // 4" x 6" in mm: 100mm x 150mm (Standard Industrial Thermal Label)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [100, 150],
  });

  boxes.forEach((box, index) => {
    if (index > 0) {
      doc.addPage([100, 150], 'portrait');
    }

    renderSingleBoxLabelPage(doc, box);
  });

  const cleanName = fileNamePrefix.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`PaintKing_Box_Labels_${cleanName}_${boxes.length}_Boxes.pdf`);
}

function renderSingleBoxLabelPage(doc: jsPDF, box: BoxLabelItem) {
  const pageW = 100;
  const pageH = 150;
  const margin = 3.5;
  const contentW = pageW - margin * 2;

  // 1. OUTER INDUSTRIAL DOUBLE BORDER
  doc.setDrawColor(23, 25, 28);
  doc.setLineWidth(0.6);
  doc.rect(margin, margin, contentW, pageH - margin * 2);

  // 2. BRAND HEADER WITH OFFICIAL LOGO & CORPORATE METADATA (EXACT QC REPORT SPEC)
  // Clean white header background with subtle border
  const headerHeight = 22;
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, margin, contentW, headerHeight, 'F');

  // Left Side: Official PaintKing Logo
  try {
    doc.addImage(PAINTKING_LOGO_BASE64, 'PNG', margin + 2.5, margin + 2.5, 34, 11.5);
  } catch {
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(23, 25, 28);
    doc.text('PAINTKING', margin + 3, margin + 8.5);
  }

  // Right Side: Standard Corporate Header (Matching QC Report Standard)
  const rightX = pageW - margin - 2.5;

  // 1. Business Name (Clean bold, standard)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(23, 25, 28); // Charcoal #17191c
  doc.text('PAINTKING', rightX, margin + 5.5, { align: 'right' });

  // 2. GSTIN & Official Phone
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.setTextColor(100, 105, 115);
  doc.text('GSTIN: 05AABCP9912K1Z4 • Phone: +91 9594591313', rightX, margin + 10.5, { align: 'right' });

  // 3. Email & Web
  doc.text('Email: info@paintking.in • Web: www.paintking.in', rightX, margin + 14.5, { align: 'right' });

  // Subtitle Strip (Champagne background with gold borders)
  const subY = margin + 17.5;
  doc.setFillColor(250, 243, 224); // #faf3e0 champagne
  doc.rect(margin, subY, contentW, 4.5, 'F');
  doc.setDrawColor(244, 229, 190);
  doc.setLineWidth(0.3);
  doc.line(margin, subY, pageW - margin, subY);
  doc.line(margin, subY + 4.5, pageW - margin, subY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.2);
  doc.setTextColor(138, 101, 33); // Deep Gold #8a6521
  doc.text('AUTOMOTIVE FINISHED GOODS CARTON IDENTIFICATION LABEL', pageW / 2, subY + 3.1, { align: 'center' });

  // 3. CONTINUOUS SERIAL BADGE & ORDER BOX INDEX STRIP
  const stripY = subY + 4.5;
  doc.setFillColor(245, 245, 247);
  doc.rect(margin, stripY, contentW, 11, 'F');
  doc.setDrawColor(200, 205, 215);
  doc.setLineWidth(0.4);
  doc.line(margin, stripY + 11, pageW - margin, stripY + 11);

  // Left: Running Master Serial (Continuous)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(119, 123, 134);
  doc.text('MASTER SERIAL NO:', margin + 3, stripY + 4);

  doc.setFont('courier', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(23, 25, 28);
  doc.text(box.boxSerialText, margin + 3, stripY + 8.5);

  // Right: Order Box Breakdown (e.g. "BOX 01 / 07")
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(119, 123, 134);
  doc.text('ORDER LOT COUNT:', pageW - margin - 3, stripY + 4, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(138, 101, 33); // #8a6521
  const boxIndexStr = `BOX ${String(box.orderBoxIndex).padStart(2, '0')} / ${String(box.totalOrderBoxes).padStart(2, '0')}`;
  doc.text(boxIndexStr, pageW - margin - 3, stripY + 8.5, { align: 'right' });

  // 4. MAIN PRODUCT SPECIFICATION GRID (Tight, Clean & Aligned)
  let curY = stripY + 11;
  doc.setLineWidth(0.25);
  doc.setDrawColor(220, 225, 230);

  const drawFieldRow = (label: string, value: string, isBoldValue = false, valueColor: [number, number, number] = [23, 25, 28]) => {
    const rowH = 5.2;
    // Row background alternating tint
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, curY, contentW, rowH, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.setTextColor(100, 105, 115);
    doc.text(label.toUpperCase(), margin + 3, curY + 3.6);

    doc.setFont('helvetica', isBoldValue ? 'bold' : 'normal');
    doc.setFontSize(isBoldValue ? 7.2 : 6.8);
    doc.setTextColor(...valueColor);
    const safeVal = value.length > 44 ? value.substring(0, 42) + '...' : value;
    doc.text(safeVal, margin + 28, curY + 3.6);

    doc.line(margin, curY + rowH, pageW - margin, curY + rowH);
    curY += rowH;
  };

  drawFieldRow('Customer:', box.customer, true);
  drawFieldRow('Work Order:', box.woNo, true, [138, 101, 33]);
  drawFieldRow('Part Code:', box.partCode, true);
  drawFieldRow('Part Name:', box.partDescription);
  drawFieldRow('Color / Shade:', box.color, true);
  drawFieldRow('Paint Batch:', box.paintBatch);
  drawFieldRow('Line / Painter:', box.painter);
  drawFieldRow('Packing Lead:', box.packedBy);
  drawFieldRow('Packing Date:', box.packedDate);

  // 5. LARGE QUANTITY HERO BLOCK
  curY += 2;
  const heroCardY = curY;
  const heroCardH = 17;
  const heroCardW = contentW - 4;
  const heroCardX = margin + 2;

  // Background container
  doc.setFillColor(250, 247, 237); // Champagne light
  doc.setDrawColor(192, 151, 72);
  doc.setLineWidth(0.45);
  doc.roundedRect(heroCardX, heroCardY, heroCardW, heroCardH, 2, 2, 'FD');

  // Subtle vertical dividing dotted line
  const dividerX = heroCardX + 50;
  doc.setDrawColor(220, 205, 175);
  doc.setLineWidth(0.3);
  doc.line(dividerX, heroCardY + 2, dividerX, heroCardY + heroCardH - 2);

  // Left Column: Box Quantity
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(138, 101, 33);
  doc.text('BOX QUANTITY:', heroCardX + 4, heroCardY + 4.8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14.5);
  doc.setTextColor(23, 25, 28);
  doc.text(`${box.boxQty} PCS`, heroCardX + 4, heroCardY + 12.2);

  // Right Column: Total Lot Size + Premium QC PASSED Badge
  const rightColX = heroCardX + heroCardW - 3;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(119, 123, 134);
  doc.text('TOTAL LOT SIZE:', rightColX, heroCardY + 4.6, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(23, 25, 28);
  doc.text(`${box.totalLotQty} PCS`, rightColX, heroCardY + 9.2, { align: 'right' });

  // Dedicated "QC PASSED" Industrial Stamp / Badge
  const badgeW = 34;
  const badgeH = 4.8;
  const badgeX = rightColX - badgeW;
  const badgeY = heroCardY + 10.6;

  // Badge Container: Emerald pill tint
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(5, 150, 105);   // emerald-600
  doc.setLineWidth(0.3);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.2, 1.2, 'FD');

  // Vector Checkmark inside badge (never corrupts like unicode ✓)
  doc.setDrawColor(4, 120, 87);
  doc.setLineWidth(0.45);
  const checkX = badgeX + 2.2;
  const checkY = badgeY + 2.4;
  doc.line(checkX, checkY, checkX + 0.9, checkY + 1.2);
  doc.line(checkX + 0.9, checkY + 1.2, checkX + 2.4, checkY - 1.2);

  // Badge Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.0);
  doc.setTextColor(4, 120, 87);
  doc.text('QC PASSED', badgeX + 5.2, badgeY + 3.4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.2);
  doc.setTextColor(16, 185, 129);
  doc.text('100% OQC & PDI', badgeX + badgeW - 1.5, badgeY + 3.4, { align: 'right' });

  curY = heroCardY + heroCardH + 2.5;

  // 6. REAL SCANNABLE CODE 39 BARCODE
  const barcodeY = curY;
  const barcodeH = 14;
  doc.setFillColor(255, 255, 255);
  doc.rect(margin + 2, barcodeY, contentW - 4, barcodeH + 5, 'F');

  // Real scannable Code 39 barcode string (e.g. PK-BOX-0001)
  const barcodeRawData = `${box.boxSerialText}`;
  renderScannableCode39(doc, barcodeRawData, margin + 5, barcodeY, contentW - 10, barcodeH);

  doc.setFont('courier', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(23, 25, 28);
  const barcodeLegend = `*${box.boxSerialText}*  |  WO: ${box.woNo}  |  QTY: ${box.boxQty} PCS`;
  doc.text(barcodeLegend, pageW / 2, barcodeY + barcodeH + 3.5, { align: 'center' });

  curY = barcodeY + barcodeH + 5.5;

  // 7. BOTTOM QUALITY AUDIT STRIP (Pixel-Perfect Alignment)
  doc.setDrawColor(200, 205, 215);
  doc.setLineWidth(0.3);
  doc.line(margin, curY, pageW - margin, curY);

  curY += 2;

  // Function to draw clean vector checkmark for audit points (prevents WinAnsi unicode corruption in PDF)
  const drawVectorCheck = (vx: number, vy: number) => {
    doc.setDrawColor(4, 120, 87);
    doc.setLineWidth(0.38);
    doc.line(vx, vy, vx + 0.7, vy + 0.9);
    doc.line(vx + 0.7, vy + 0.9, vx + 1.9, vy - 0.9);
  };

  // Left Checklist with vector ticks
  const auditCheckX = margin + 3.5;
  drawVectorCheck(auditCheckX, curY + 2.3);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.2);
  doc.setTextColor(23, 25, 28);
  doc.text('ZERO SCRATCH VERIFIED', auditCheckX + 3.5, curY + 3);

  drawVectorCheck(auditCheckX, curY + 5.5);
  doc.text('ASTM 5B ADHESION PASSED', auditCheckX + 3.5, curY + 6.2);

  drawVectorCheck(auditCheckX, curY + 8.7);
  doc.text('SPECTRO DELTA-E <= 0.70', auditCheckX + 3.5, curY + 9.4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.5);
  doc.setTextColor(119, 123, 134);
  doc.text('Do not accept box if thermal seal is tampered.', margin + 3.5, curY + 12.8);

  // Right Final QC Verification Stamp
  const stampW = 28;
  const stampH = 12;
  const stampX = pageW - margin - stampW - 1;
  const stampY = curY;

  doc.setFillColor(245, 245, 247);
  doc.rect(stampX, stampY, stampW, stampH, 'F');
  doc.setDrawColor(180, 185, 195);
  doc.setLineWidth(0.3);
  doc.rect(stampX, stampY, stampW, stampH, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.8);
  doc.setTextColor(138, 101, 33);
  doc.text('FINAL QC PASSED', stampX + stampW / 2, stampY + 4, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(23, 25, 28);
  doc.text('QA DEPT - PK', stampX + stampW / 2, stampY + 8.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(3.8);
  doc.setTextColor(119, 123, 134);
  doc.text('INSPECTOR SIGNED', stampX + stampW / 2, stampY + 11, { align: 'center' });
}
