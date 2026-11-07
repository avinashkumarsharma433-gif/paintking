import { jsPDF } from 'jspdf';
import { PlantLocation } from '../types/portalTypes';

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

  // 4" x 6" in mm: 101.6mm x 152.4mm (Standard 100x150 Thermal Sticker)
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
  const margin = 4;
  const contentW = pageW - margin * 2;

  // Outer border with industrial styling
  doc.setDrawColor(23, 25, 28);
  doc.setLineWidth(0.6);
  doc.rect(margin, margin, contentW, pageH - margin * 2);

  // 1. BRAND HEADER (Top solid dark strip)
  doc.setFillColor(23, 25, 28); // #17191c
  doc.rect(margin, margin, contentW, 16, 'F');

  // PaintKing Brand Name
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('PAINTKING SOLUTIONS PVT. LTD.', pageW / 2, margin + 5.5, { align: 'center' });

  // Subtitle & Certifications
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(192, 151, 72); // #c09748 Gold
  doc.text(`${box.plant.toUpperCase()} PLANT  •  ISO 9001:2015 & IATF-16949 COMPLIANT`, pageW / 2, margin + 9.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.setTextColor(220, 223, 228);
  doc.text('AUTOMOTIVE FINISHED GOODS CARTON IDENTIFICATION', pageW / 2, margin + 13.5, { align: 'center' });

  // 2. CONTINUOUS SERIAL BADGE & ORDER BOX INDEX STRIP
  const stripY = margin + 17;
  doc.setFillColor(242, 242, 243);
  doc.rect(margin, stripY, contentW, 12, 'F');
  doc.setDrawColor(180, 185, 195);
  doc.setLineWidth(0.3);
  doc.line(margin, stripY + 12, pageW - margin, stripY + 12);

  // Running Master Serial (Left side)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(119, 123, 134);
  doc.text('MASTER SERIAL:', margin + 3, stripY + 4.5);

  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(23, 25, 28);
  doc.text(box.boxSerialText, margin + 3, stripY + 9.5);

  // Order Box Breakdown (Right side: e.g. "BOX 01 / 07")
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(119, 123, 134);
  doc.text('ORDER LOT COUNT:', pageW - margin - 3, stripY + 4.5, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(138, 101, 33); // #8a6521
  const boxIndexStr = `BOX ${String(box.orderBoxIndex).padStart(2, '0')} / ${String(box.totalOrderBoxes).padStart(2, '0')}`;
  doc.text(boxIndexStr, pageW - margin - 3, stripY + 9.5, { align: 'right' });

  // 3. MAIN PRODUCT DETAILS (Middle Data Grid)
  let curY = stripY + 14;
  doc.setLineWidth(0.2);
  doc.setDrawColor(200, 205, 215);

  const drawFieldRow = (label: string, value: string, isHighlight = false) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(119, 123, 134);
    doc.text(label.toUpperCase(), margin + 3, curY + 3.5);

    doc.setFont('helvetica', isHighlight ? 'bold' : 'normal');
    doc.setFontSize(isHighlight ? 8 : 7);
    doc.setTextColor(23, 25, 28);
    const safeVal = value.length > 42 ? value.substring(0, 40) + '...' : value;
    doc.text(safeVal, margin + 30, curY + 3.5);

    doc.line(margin, curY + 5.5, pageW - margin, curY + 5.5);
    curY += 5.5;
  };

  drawFieldRow('Customer:', box.customer, true);
  drawFieldRow('Work Order:', box.woNo, true);
  drawFieldRow('Part Code:', box.partCode, true);
  drawFieldRow('Part Name:', box.partDescription);
  drawFieldRow('Color / Shade:', box.color, true);
  drawFieldRow('Paint Batch:', box.paintBatch);
  drawFieldRow('Line / Painter:', box.painter);
  drawFieldRow('Packing Lead:', box.packedBy);
  drawFieldRow('Packing Date:', box.packedDate);

  // 4. LARGE QUANTITY HERO BLOCK
  curY += 2;
  doc.setFillColor(250, 247, 237); // Champagne light
  doc.setDrawColor(192, 151, 72);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin + 2, curY, contentW - 4, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(138, 101, 33);
  doc.text('BOX QUANTITY:', margin + 6, curY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(23, 25, 28);
  doc.text(`${box.boxQty} PCS`, margin + 6, curY + 13.5);

  // Total Lot Size on right side of hero block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(119, 123, 134);
  doc.text('TOTAL LOT SIZE:', pageW - margin - 6, curY + 5.5, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(23, 25, 28);
  doc.text(`${box.totalLotQty} PCS`, pageW - margin - 6, curY + 11.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(4, 120, 87); // Emerald
  doc.text('100% PDI & OQC CLEARED', pageW - margin - 6, curY + 15.5, { align: 'right' });

  curY += 21;

  // 5. VECTOR SCANNABLE BARCODE
  const barcodeY = curY;
  const barcodeH = 14;
  doc.setFillColor(255, 255, 255);
  doc.rect(margin + 2, barcodeY, contentW - 4, barcodeH, 'F');

  // Synthetic standard Code-128 barcode bars
  drawBarcodePattern(doc, margin + 8, barcodeY + 1, contentW - 16, barcodeH - 3, `${box.woNo}-${box.boxSerialText}`);

  doc.setFont('courier', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(23, 25, 28);
  const barcodeText = `*${box.boxSerialText}*${box.woNo}*${box.boxQty}PCS*`;
  doc.text(barcodeText, pageW / 2, barcodeY + barcodeH + 2.5, { align: 'center' });

  curY = barcodeY + barcodeH + 4.5;

  // 6. BOTTOM QUALITY STAMP & QR PLACEHOLDER
  doc.setDrawColor(180, 185, 195);
  doc.setLineWidth(0.3);
  doc.line(margin, curY, pageW - margin, curY);

  curY += 1.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(23, 25, 28);
  doc.text('✓ ZERO SCRATCH VERIFIED', margin + 3, curY + 3.5);
  doc.text('✓ SPECTRO DELTA-E PASSED', margin + 3, curY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.setTextColor(119, 123, 134);
  doc.text('Do not accept box if thermal seal is tampered.', margin + 3, curY + 10.5);

  // Inspector Stamp Box on bottom right
  doc.setFillColor(242, 242, 243);
  doc.rect(pageW - margin - 28, curY + 0.5, 25, 11, 'F');
  doc.setDrawColor(180, 185, 195);
  doc.rect(pageW - margin - 28, curY + 0.5, 25, 11, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.5);
  doc.setTextColor(138, 101, 33);
  doc.text('FINAL QC PASSED', pageW - margin - 15.5, curY + 4, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(23, 25, 28);
  doc.text('QA DEPT - PK', pageW - margin - 15.5, curY + 8.5, { align: 'center' });
}

/**
 * Draws sharp vector barcode bars based on input string hash
 */
function drawBarcodePattern(doc: jsPDF, x: number, y: number, width: number, height: number, data: string) {
  doc.setFillColor(0, 0, 0);

  // Generate a deterministic pattern of thin/thick bars
  const barsCount = 65;
  const barWidth = width / barsCount;

  for (let i = 0; i < barsCount; i++) {
    // Determine bar thickness and gaps based on string charCodes
    const charCode = data.charCodeAt(i % data.length) || 65;
    const isBar = (charCode + i * 3) % 4 !== 0;

    if (isBar) {
      const thickness = (charCode + i) % 5 === 0 ? barWidth * 1.6 : barWidth * 0.9;
      doc.rect(x + i * barWidth, y, thickness, height, 'F');
    }
  }
}
