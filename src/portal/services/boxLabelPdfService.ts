import { jsPDF } from 'jspdf';
import { PlantLocation } from '../types/portalTypes';
import { PAINTKING_LOGO_BASE64 } from '../utils/paintkingLogoBase64';

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
 * Generates an industrial multi-page PDF where each page is an exact 65mm x 95mm sticker
 * (identical in dimensions, proportions, and design to the A4 stacked version).
 */
export function generateMultiBoxThermalLabelPDF(boxes: BoxLabelItem[], fileNamePrefix: string) {
  if (!boxes || boxes.length === 0) return;

  // Exact 65mm x 95mm label dimensions per user requirement
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [65, 95],
  });

  boxes.forEach((box, index) => {
    if (index > 0) {
      doc.addPage([65, 95], 'portrait');
    }

    // Render exact same 65mm x 95mm cell at (0, 0)
    renderCompactStickerCell(doc, box, 0, 0, 65, 95);
  });

  const cleanName = fileNamePrefix.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`PaintKing_Box_Labels_${cleanName}_${boxes.length}_Boxes.pdf`);
}

/**
 * Generates an A4 sheet layout with exactly 9 labels per page (3 columns x 3 rows).
 * Each sticker cell is 65mm x 95mm with cutting guides.
 */
export function generateA4SheetBoxLabelsPDF(boxes: BoxLabelItem[], fileNamePrefix: string) {
  if (!boxes || boxes.length === 0) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4', // 210mm x 297mm
  });

  const cellW = 65; // mm per user requirement
  const cellH = 95; // mm per user requirement
  const cols = 3;
  const rows = 3;
  const labelsPerPage = cols * rows; // 9 labels per A4 page

  // A4 = 210 x 297 mm
  // 3 * 65 = 195 mm -> left margin = 7.5 mm
  // 3 * 95 = 285 mm -> top margin = 6.0 mm
  const startX = 7.5;
  const startY = 6.0;

  const totalPages = Math.ceil(boxes.length / labelsPerPage);

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) {
      doc.addPage('a4', 'portrait');
    }

    const pageBoxes = boxes.slice(page * labelsPerPage, (page + 1) * labelsPerPage);

    pageBoxes.forEach((box, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = startX + col * cellW;
      const y = startY + row * cellH;

      renderCompactStickerCell(doc, box, x, y, cellW, cellH);
    });
  }

  const cleanName = fileNamePrefix.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`PaintKing_A4_9Up_Labels_${cleanName}_${boxes.length}_Boxes.pdf`);
}

/**
 * Renders a single 65mm x 95mm high-density label inside an A4 sheet grid
 * Vertically distributed to fill the full 95mm height elegantly without dead bottom space.
 */
function renderCompactStickerCell(doc: jsPDF, box: BoxLabelItem, x: number, y: number, w: number, h: number) {
  const pad = 2.0;
  const innerW = w - pad * 2;

  // Outer border & cutting mark (Exact 65mm x 95mm boundary)
  doc.setDrawColor(180, 185, 195);
  doc.setLineWidth(0.35);
  doc.roundedRect(x + 0.5, y + 0.5, w - 1.0, h - 1.0, 1.5, 1.5, 'S');

  // 1. Header background (Spacious 16.5mm)
  const headerH = 16.5;
  doc.setFillColor(255, 255, 255);
  doc.rect(x + pad, y + pad, innerW, headerH, 'F');

  // Logo on top left
  try {
    doc.addImage(PAINTKING_LOGO_BASE64, 'PNG', x + pad + 1.2, y + pad + 2.0, 23, 8.5);
  } catch {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.0);
    doc.setTextColor(23, 25, 28);
    doc.text('PAINTKING', x + pad + 1.2, y + pad + 7);
  }

  // Right Header Text
  const rX = x + w - pad - 1.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.0);
  doc.setTextColor(23, 25, 28);
  doc.text('PAINTKING', rX, y + pad + 4.2, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.0);
  doc.setTextColor(100, 105, 115);
  doc.text('GSTIN: 05AABCP9912K1Z4', rX, y + pad + 8.2, { align: 'right' });
  doc.text('Phone: +91 9594591313', rX, y + pad + 11.5, { align: 'right' });

  // 2. Subtitle Strip
  const subY = y + pad + headerH;
  doc.setFillColor(250, 243, 224); // Champagne
  doc.rect(x + pad, subY, innerW, 3.8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.0);
  doc.setTextColor(138, 101, 33);
  doc.text('FINISHED GOODS CARTON IDENTIFICATION LABEL', x + w / 2, subY + 2.6, { align: 'center' });

  // 3. Serial & Box Count Strip
  const stripY = subY + 3.8;
  doc.setFillColor(245, 245, 247);
  doc.rect(x + pad, stripY, innerW, 8.5, 'F');
  doc.setDrawColor(210, 215, 222);
  doc.setLineWidth(0.25);
  doc.line(x + pad, stripY + 8.5, x + w - pad, stripY + 8.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.4);
  doc.setTextColor(119, 123, 134);
  doc.text('SERIAL NO:', x + pad + 2, stripY + 3.3);

  doc.setFont('courier', 'bold');
  doc.setFontSize(8.0);
  doc.setTextColor(23, 25, 28);
  doc.text(box.boxSerialText, x + pad + 2, stripY + 7.0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.4);
  doc.setTextColor(119, 123, 134);
  doc.text('ORDER COUNT:', rX, stripY + 3.3, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(138, 101, 33);
  const boxIndexStr = `BOX ${String(box.orderBoxIndex).padStart(2, '0')}/${String(box.totalOrderBoxes).padStart(2, '0')}`;
  doc.text(boxIndexStr, rX, stripY + 7.0, { align: 'right' });

  // 4. Field Rows (Each row expanded to 4.7mm for perfect vertical breathing room: 9 rows * 4.7mm = 42.3mm)
  let curY = stripY + 8.5;
  const drawCompactRow = (label: string, value: string, isBold = false, isAccent = false) => {
    const rowH = 4.7;
    doc.setFillColor(255, 255, 255);
    doc.rect(x + pad, curY, innerW, rowH, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.8);
    doc.setTextColor(100, 105, 115);
    doc.text(label.toUpperCase(), x + pad + 2.0, curY + 3.3);

    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(isBold ? 6.2 : 5.8);
    if (isAccent) {
      doc.setTextColor(138, 101, 33);
    } else {
      doc.setTextColor(23, 25, 28);
    }
    const safeVal = value.length > 30 ? value.substring(0, 28) + '...' : value;
    doc.text(safeVal, x + pad + 21, curY + 3.3);

    doc.setDrawColor(225, 229, 235);
    doc.setLineWidth(0.2);
    doc.line(x + pad, curY + rowH, x + w - pad, curY + rowH);
    curY += rowH;
  };

  drawCompactRow('Customer:', box.customer, true);
  drawCompactRow('Work Order:', box.woNo, true, true);
  drawCompactRow('Part Code:', box.partCode, true);
  drawCompactRow('Part Name:', box.partDescription);
  drawCompactRow('Color / Shade:', box.color, true);
  drawCompactRow('Paint Batch:', box.paintBatch);
  drawCompactRow('Line / Painter:', box.painter);
  drawCompactRow('Packing Lead:', box.packedBy);
  drawCompactRow('Packing Date:', box.packedDate);

  // 5. Hero Quantity & QC Passed Stamp Box (Height 17.5mm - exactly reaches bottom)
  curY += 1.2;
  const heroCardY = curY;
  const heroCardH = 17.5;
  const heroCardW = innerW - 1.0;
  const heroCardX = x + pad + 0.5;

  doc.setFillColor(250, 247, 237);
  doc.setDrawColor(192, 151, 72);
  doc.setLineWidth(0.4);
  doc.roundedRect(heroCardX, heroCardY, heroCardW, heroCardH, 2.0, 2.0, 'FD');

  // Divider
  doc.setDrawColor(220, 205, 175);
  doc.setLineWidth(0.25);
  doc.line(heroCardX + 31, heroCardY + 1.8, heroCardX + 31, heroCardY + heroCardH - 1.8);

  // Left: Box Qty
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.0);
  doc.setTextColor(138, 101, 33);
  doc.text('BOX QUANTITY:', heroCardX + 2.5, heroCardY + 4.8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(23, 25, 28);
  doc.text(`${box.boxQty} PCS`, heroCardX + 2.5, heroCardY + 12.8);

  // Middle: Total Lot Size
  const lotX = heroCardX + 33.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.8);
  doc.setTextColor(119, 123, 134);
  doc.text('TOTAL LOT SIZE:', lotX, heroCardY + 4.8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.0);
  doc.setTextColor(23, 25, 28);
  doc.text(`${box.totalLotQty} PCS`, lotX, heroCardY + 10.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.0);
  doc.setTextColor(119, 123, 134);
  doc.text('100% INSPECTED', lotX, heroCardY + 14.5);

  // Right: Circular QC Passed Stamp (pure text, no tick)
  const cX = heroCardX + heroCardW - 8.0;
  const cY = heroCardY + 8.8;
  const oR = 5.6;
  const iR = 4.6;

  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(5, 150, 105);
  doc.setLineWidth(0.4);
  doc.circle(cX, cY, oR, 'FD');

  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.2);
  doc.circle(cX, cY, iR, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(4, 120, 87);
  doc.text('QC', cX, cY - 0.2, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(3.4);
  doc.setTextColor(5, 150, 105);
  doc.text('PASSED', cX, cY + 3.0, { align: 'center' });
}

function renderSingleBoxLabelPage(doc: jsPDF, box: BoxLabelItem) {
  const pageW = 100;
  const pageH = 100;
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
  const heroCardH = 20; // Expanded nicely for full breathing room
  const heroCardW = contentW - 4;
  const heroCardX = margin + 2;

  // Background container
  doc.setFillColor(250, 247, 237); // Champagne light
  doc.setDrawColor(192, 151, 72);
  doc.setLineWidth(0.45);
  doc.roundedRect(heroCardX, heroCardY, heroCardW, heroCardH, 2.5, 2.5, 'FD');

  // Subtle vertical dividing dotted line
  const dividerX = heroCardX + 50;
  doc.setDrawColor(220, 205, 175);
  doc.setLineWidth(0.3);
  doc.line(dividerX, heroCardY + 2.5, dividerX, heroCardY + heroCardH - 2.5);

  // Left Column: Box Quantity
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(138, 101, 33);
  doc.text('BOX QUANTITY:', heroCardX + 4.5, heroCardY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(23, 25, 28);
  doc.text(`${box.boxQty} PCS`, heroCardX + 4.5, heroCardY + 14.2);

  // Middle Column: Total Lot Size (Cleanly positioned between dividers)
  const lotColX = heroCardX + 54;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.0);
  doc.setTextColor(119, 123, 134);
  doc.text('TOTAL LOT SIZE:', lotColX, heroCardY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(23, 25, 28);
  doc.text(`${box.totalLotQty} PCS`, lotColX, heroCardY + 12.0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.8);
  doc.setTextColor(119, 123, 134);
  doc.text('100% INSPECTED', lotColX, heroCardY + 16.5);

  // Far Right: Authentic Circular "QC PASSED" Green Sticker Stamp (Pure Text, No Tick)
  const circleCenterX = heroCardX + heroCardW - 10.5;
  const circleCenterY = heroCardY + 10.0;
  const outerR = 7.0;
  const innerR = 5.8;

  // Outer green fill circle with border
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(5, 150, 105);   // emerald-600
  doc.setLineWidth(0.5);
  doc.circle(circleCenterX, circleCenterY, outerR, 'FD');

  // Inner circular ring
  doc.setDrawColor(16, 185, 129);  // emerald-500
  doc.setLineWidth(0.25);
  doc.circle(circleCenterX, circleCenterY, innerR, 'S');

  // Centered Badge Text inside circle (No tickmark)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.0);
  doc.setTextColor(4, 120, 87);
  doc.text('QC', circleCenterX, circleCenterY - 0.4, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.2);
  doc.setTextColor(5, 150, 105);
  doc.text('PASSED', circleCenterX, circleCenterY + 3.4, { align: 'center' });
}
