import { jsPDF } from 'jspdf';
import { BillingInvoice, MaterialInwardRecord, MaterialOutwardRecord, IQCInspectionRecord, GoodsReceiptNote, FPARecord, IPQCRecord, PreProductionInspectionRecord } from '../types/portalTypes';
import { PAINTKING_LOGO_BASE64 } from './paintkingLogoBase64';

export const TABLE_BORDER_COLOR = [180, 185, 195] as const;
export const TABLE_LINE_WIDTH = 0.45;

export interface StandardPdfHeaderOptions {
  docTitle?: string;       // e.g. 'TAX INVOICE', 'DELIVERY CHALLAN', 'GATE INWARD PASS'
  docNumber?: string;      // e.g. 'INV-2026-081', 'INW-2026-145'
  date?: string;           // e.g. '2026-09-15'
  plant?: string;          // e.g. 'Haridwar Unit', 'Vasai Unit'
  badgeText?: string;      // e.g. 'ORIGINAL FOR RECIPIENT', 'GATE VERIFIED'
  docSubtitle?: string;    // e.g. 'SEC 31 CGST ACT' or 'RULE 55 CGST RULES'
}

/**
 * Standard Company Header across ALL PaintKing PDFs
 * Updated Layout:
 * - Top thick line REMOVED
 * - Left side: Official PAINT KING Logo
 * - Right side: Business Name "PAINTKING", GST, Phone, Email, Website (right-aligned)
 * - Clean subtle divider rule
 */
export const drawStandardPdfHeader = (
  doc: jsPDF,
  _options?: StandardPdfHeaderOptions
): number => {
  // 1. Left Side: Official PaintKing Logo (w: 42mm, h: 14.5mm)
  try {
    doc.addImage(PAINTKING_LOGO_BASE64, 'PNG', 14, 7, 42, 14.5);
  } catch (err) {
    console.warn('Could not render logo in PDF, using text fallback', err);
  }

  // 2. Right Side: Company Details shifted to the Right (align: 'right' at x: 196mm)
  // Business Name (Just "PAINTKING", no "Surface Solutions")
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(23, 25, 28); // Charcoal #17191c
  doc.text('PAINTKING', 196, 11, { align: 'right' });

  // Line 1: GSTIN & Phone Number
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 105, 115);
  doc.text('GSTIN: 05AABCP9912K1Z4 • Phone: +91 9594591313', 196, 16, { align: 'right' });

  // Line 2: Email & Official Website
  doc.text('Email: info@paintking.in • Website: www.paintking.in', 196, 20.2, { align: 'right' });

  // 3. Clean Single Divider Line below header (y: 25mm)
  doc.setDrawColor(225, 225, 225);
  doc.setLineWidth(0.3);
  doc.line(14, 25, 196, 25);

  // Return safe starting Y position for document body
  return 28;
};

/**
 * Standardized Company Footer across ALL PaintKing PDFs
 */
export const drawStandardPdfFooter = (
  doc: jsPDF,
  pageNo: number = 1,
  totalPages: number = 1,
  customNote?: string,
  generatedTimestamp?: string,
  continuedToNextPage?: boolean
): void => {
  // Divider
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.2);
  doc.line(14, 283, 196, 283);

  // Left Legal Note
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(130, 130, 130);
  doc.text(
    customNote || 'PAINTKING • Computer Generated Official Record • Valid Without Physical Signature',
    14,
    288
  );

  // Right Side: Page Counter & Continued indicator (Stacked neatly, matching subtle color & size)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(130, 130, 130);

  if (continuedToNextPage && pageNo < totalPages) {
    // Top line: Page X of Y
    doc.text(
      `Page ${pageNo} of ${totalPages}`,
      196,
      286.5,
      { align: 'right' }
    );
    // Lower line: continued to next page... (subtle, clean, same font & color)
    doc.text(
      'continued to next page...',
      196,
      290.5,
      { align: 'right' }
    );
  } else {
    doc.text(
      `Page ${pageNo} of ${totalPages}`,
      196,
      288,
      { align: 'right' }
    );
  }

  // Bottom-Left Live Generation Timestamp (directly below current text)
  const timestamp =
    generatedTimestamp ||
    new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(150, 155, 165);
  doc.text(`Generated: ${timestamp}`, 14, 292);
};

/**
 * Standardized PaintKing Date Formatter
 * Converts dates to clean industrial standard: DD-MM-YYYY (e.g. 29-09-2026)
 */
export function formatDateDDMMYYYY(dateStr?: string): string {
  if (!dateStr || dateStr.trim() === '' || dateStr === '-') return '-';
  const cleanStr = dateStr.trim();

  // If already DD-MM-YYYY format: e.g. 29-09-2026
  if (/^\d{2}-\d{2}-\d{4}$/.test(cleanStr)) {
    return cleanStr;
  }

  // If YYYY-MM-DD format: e.g. 2026-09-29
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
    const [y, m, d] = cleanStr.split('-');
    return `${d}-${m}-${y}`;
  }

  // If YYYY/MM/DD format
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(cleanStr)) {
    const [y, m, d] = cleanStr.split('/');
    return `${d}-${m}-${y}`;
  }

  // Try parsing with Date object
  try {
    const d = new Date(cleanStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
  } catch {
    // fallback
  }

  return cleanStr;
}

export interface UnitBreakdown {
  isSingleUnit: boolean;
  primaryUnit: string;
  totalQty: number;
  totalItemCount: number;
  distinctUnitsCount: number;
  unitSummary: string;
  unitTotals: { unit: string; quantity: number; itemCount: number }[];
  multiItemUnitTotals: { unit: string; quantity: number; itemCount: number }[];
  displayTotal: string;
}

export function formatUnitBreakdown(items?: { quantity: number; unit?: string }[]): UnitBreakdown {
  if (!items || items.length === 0) {
    return {
      isSingleUnit: true,
      primaryUnit: 'Pcs',
      totalQty: 0,
      totalItemCount: 0,
      distinctUnitsCount: 0,
      unitSummary: '0 Pcs',
      unitTotals: [],
      multiItemUnitTotals: [],
      displayTotal: '0 Pcs'
    };
  }

  const unitMap: Record<string, { quantity: number; itemCount: number }> = {};
  let totalQty = 0;

  items.forEach(item => {
    const unit = (item.unit || 'Pcs').trim();
    const qty = Number(item.quantity) || 0;
    totalQty += qty;
    if (!unitMap[unit]) {
      unitMap[unit] = { quantity: 0, itemCount: 0 };
    }
    unitMap[unit].quantity += qty;
    unitMap[unit].itemCount += 1;
  });

  const unitTotals = Object.entries(unitMap).map(([unit, data]) => ({
    unit,
    quantity: data.quantity,
    itemCount: data.itemCount
  }));
  const multiItemUnitTotals = unitTotals.filter(u => u.itemCount > 1);
  const distinctUnitsCount = unitTotals.length;
  const isSingleUnit = distinctUnitsCount <= 1;
  const primaryUnit = isSingleUnit && unitTotals[0] ? unitTotals[0].unit : 'Mixed';

  const unitSummary = unitTotals.map(u => `${u.quantity} ${u.unit}`).join(', ');
  const displayTotal = isSingleUnit
    ? `${totalQty} ${primaryUnit}`
    : unitTotals.map(u => `${u.quantity} ${u.unit}`).join(' • ');

  return {
    isSingleUnit,
    primaryUnit,
    totalQty,
    totalItemCount: items.length,
    distinctUnitsCount,
    unitSummary,
    unitTotals,
    multiItemUnitTotals,
    displayTotal
  };
}

/**
 * Generates and downloads the Official Gate Inward Pass PDF
 */
export const downloadStandardGateInwardPdf = (item: MaterialInwardRecord): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Standard Header
  const startY = drawStandardPdfHeader(doc);

  // Document Title Bar (Clear & Professional)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(23, 25, 28);
  doc.text('GATE INWARD VERIFICATION PASS', 14, startY + 5);

  // Status Badge / Reference on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  if (item.grnNo && !item.grnNo.includes('Pending')) {
    doc.setTextColor(34, 139, 34);
    doc.text(`GRN: ${item.grnNo}`, 196, startY + 5, { align: 'right' });
  } else {
    doc.setTextColor(192, 151, 72);
    doc.text('STATUS: GATE VERIFIED (PENDING STORE GRN)', 196, startY + 5, { align: 'right' });
  }

  // Section 1: Inward & Vehicle Metadata Grid (3 Structured Rows)
  const metaY = startY + 8;
  doc.setDrawColor(220, 222, 228);
  doc.setFillColor(250, 250, 251);
  doc.roundedRect(14, metaY, 182, 44, 3, 3, 'FD');

  const metaCol1X = 20;
  const metaCol2X = 80;
  const metaCol3X = 140;

  // Helper to draw clean standardized label-value pairs with exact typographic hierarchy
  // Main Title (Label) = Black #17191c, Bold
  // Content (Value) = Grey #777b86 / (100, 105, 115), Normal
  // Wraps up to 2 lines max, truncating with '...' if longer than 2 lines
  const drawMetaField = (
    label: string,
    value: string,
    x: number,
    labelY: number,
    valueY: number,
    maxWidth: number = 52
  ) => {
    // 1. Top Title / Label: Deep Dark Black (#17191c), Bold uppercase (7.0pt)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.0);
    doc.setTextColor(23, 25, 28);
    doc.text(label, x, labelY);

    // 2. Content / Data Value: Clear Slate Grey (100, 105, 115), regular weight (8.0pt)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.0);
    doc.setTextColor(100, 105, 115);

    const cleanVal = (value || '-').trim();
    const allLines: string[] = doc.splitTextToSize(cleanVal, maxWidth);

    if (allLines.length <= 1) {
      doc.text(allLines[0] || '-', x, valueY);
    } else if (allLines.length === 2) {
      doc.text(allLines[0], x, valueY - 1.2);
      doc.text(allLines[1], x, valueY + 2.2);
    } else {
      // More than 2 lines: render line 1 and truncated line 2 with ellipsis
      doc.text(allLines[0], x, valueY - 1.2);
      let line2 = allLines[1];
      while (line2.length > 0 && doc.getTextWidth(line2 + '...') > maxWidth) {
        line2 = line2.slice(0, -1);
      }
      doc.text(line2 + '...', x, valueY + 2.2);
    }
  };

  // Row 1: INWARD SR NO. | CHALLAN DATE | RECEIVING DATE (AT GATE)
  drawMetaField('INWARD SR NO.', item.srNo, metaCol1X, metaY + 5.5, metaY + 11.0, 54);
  drawMetaField('CHALLAN DATE', formatDateDDMMYYYY(item.challanDate || item.date), metaCol2X, metaY + 5.5, metaY + 11.0, 54);
  drawMetaField('RECEIVING DATE (AT GATE)', formatDateDDMMYYYY(item.receivingDate || item.date), metaCol3X, metaY + 5.5, metaY + 11.0, 48);

  // Row 2: CHALLAN / DC NUMBER | NAME OF PARTY / VENDOR | TRANSPORTER NAME
  drawMetaField('CHALLAN / DC NUMBER', item.challanNo || '-', metaCol1X, metaY + 18.5, metaY + 24.0, 54);
  drawMetaField('NAME OF PARTY / VENDOR', item.partyName || '-', metaCol2X, metaY + 18.5, metaY + 24.0, 54);
  drawMetaField('TRANSPORTER NAME', item.transporter || 'Direct Delivery', metaCol3X, metaY + 18.5, metaY + 24.0, 48);

  // Row 3: VEHICLE NUMBER | DRIVER PHONE NO. | GST E-WAY BILL NO.
  drawMetaField('VEHICLE NUMBER', item.vehicleNo || '-', metaCol1X, metaY + 31.5, metaY + 37.0, 54);
  drawMetaField('DRIVER PHONE NO.', item.driverPhone || '-', metaCol2X, metaY + 31.5, metaY + 37.0, 54);
  drawMetaField('GST E-WAY BILL NO.', item.ewayBillNo || '-', metaCol3X, metaY + 31.5, metaY + 37.0, 48);

  // Section 2: Material Line Items Table (Adaptive Column Widths & Dynamic Multi-Line Row Heights)
  let currentPage = 1;
  const TABLE_BORDER_COLOR = [180, 185, 195] as const;
  const TABLE_LINE_WIDTH = 0.45; // Uniform line thickness matching vertical grid
  const BASE_ROW_HEIGHT = 6.0; // Compact 6.0mm rows
  const HEADER_HEIGHT = 6.5;
  const FOOTER_RESERVED_Y = 275;
  const SIGNATURE_BLOCK_HEIGHT = 44;

  const items = item.items && item.items.length > 0
    ? item.items
    : [{ id: '1', materialName: item.descriptionOfMaterial || 'Material', quantity: item.quantity || 1, unit: item.unit || 'Pcs' }];

  const breakdown = formatUnitBreakdown(items);

  // Check if any line item has a filled Item / Part Code
  const hasItemCode = items.some(it => (it as any).itemCode && (it as any).itemCode.trim().length > 0);

  // --- DYNAMIC ADAPTIVE COLUMN CALCULATION ---
  // Available total table width = 196 - 14 = 182mm
  const srColWidth = items.length > 99 ? 18 : 14;
  const itemCodeColWidth = 30; // Clean dedicated column when item codes are present
  
  // Calculate max string length for Quantity and Unit to keep them minimal and maximize Item Name width
  let maxQtyLen = 4;
  let maxUnitLen = 4;
  items.forEach(it => {
    const qLen = String(it.quantity).length;
    if (qLen > maxQtyLen) maxQtyLen = qLen;
    const uLen = (it.unit || 'Pcs').length;
    if (uLen > maxUnitLen) maxUnitLen = uLen;
  });

  const qtyColWidth = Math.min(30, Math.max(20, maxQtyLen * 3.2 + 8));
  const unitColWidth = Math.min(26, Math.max(16, maxUnitLen * 2.8 + 6));
  
  let colX: number[] = [];
  let colSrCenterX = 0;
  let colItemCodeCenterX = 0;
  let colDescStartX = 0;
  let colQtyCenterX = 0;
  let colUnitCenterX = 0;
  let descColWidth = 0;

  if (hasItemCode) {
    descColWidth = 182 - (srColWidth + itemCodeColWidth + qtyColWidth + unitColWidth);
    colX = [
      14,
      14 + srColWidth,
      14 + srColWidth + itemCodeColWidth,
      14 + srColWidth + itemCodeColWidth + descColWidth,
      14 + srColWidth + itemCodeColWidth + descColWidth + qtyColWidth,
      196
    ];
    colSrCenterX = (colX[0] + colX[1]) / 2;
    colItemCodeCenterX = (colX[1] + colX[2]) / 2;
    colDescStartX = colX[2] + 3;
    colQtyCenterX = (colX[3] + colX[4]) / 2;
    colUnitCenterX = (colX[4] + colX[5]) / 2;
  } else {
    descColWidth = 182 - (srColWidth + qtyColWidth + unitColWidth);
    colX = [
      14,
      14 + srColWidth,
      14 + srColWidth + descColWidth,
      14 + srColWidth + descColWidth + qtyColWidth,
      196
    ];
    colSrCenterX = (colX[0] + colX[1]) / 2;
    colDescStartX = colX[1] + 3;
    colQtyCenterX = (colX[2] + colX[3]) / 2;
    colUnitCenterX = (colX[3] + colX[4]) / 2;
  }

  const drawTableHeader = (y: number) => {
    // Fill Header Background with clean light grey #f2f2f3
    doc.setFillColor(242, 242, 243);
    doc.rect(14, y, 182, HEADER_HEIGHT, 'F');

    // Header top and bottom border lines
    doc.setDrawColor(...TABLE_BORDER_COLOR);
    doc.setLineWidth(TABLE_LINE_WIDTH);
    doc.line(14, y, 196, y);
    doc.line(14, y + HEADER_HEIGHT, 196, y + HEADER_HEIGHT);

    doc.setTextColor(23, 25, 28);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.text('SR NO.', colSrCenterX, y + 4.5, { align: 'center' });
    if (hasItemCode) {
      doc.text('ITEM / PART CODE', colItemCodeCenterX, y + 4.5, { align: 'center' });
    }
    doc.text('DESCRIPTION OF MATERIAL', colDescStartX, y + 4.5);
    doc.text('QUANTITY', colQtyCenterX, y + 4.5, { align: 'center' });
    doc.text('UNIT', colUnitCenterX, y + 4.5, { align: 'center' });
  };

  const drawTableVerticalLines = (headerStartY: number, endY: number) => {
    doc.setDrawColor(...TABLE_BORDER_COLOR);
    doc.setLineWidth(TABLE_LINE_WIDTH);

    // 1. Inner vertical column lines across entire table including header
    colX.slice(1, -1).forEach(x => {
      doc.line(x, headerStartY, x, endY);
    });

    // 2. Outer Table Frame (Top, Left, Right)
    doc.line(14, headerStartY, 196, headerStartY); // Top border above header
    doc.line(14, headerStartY, 14, endY);           // Outer Left border
    doc.line(196, headerStartY, 196, endY);         // Outer Right border
  };

  let currentY = metaY + 50;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(23, 25, 28);
  doc.text('MATERIAL LINE ITEMS BREAKDOWN', 14, currentY);

  currentY += 4;
  let pageTableStartY = currentY;
  drawTableHeader(currentY);
  currentY += HEADER_HEIGHT;

  items.forEach((row, idx) => {
    // Measure Description lines
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    const itemText = row.materialName || '';
    const descLines = doc.splitTextToSize(itemText, descColWidth - 6);
    const lineCount = Math.max(1, descLines.length);
    const currentRowHeight = lineCount > 1 
      ? Math.max(BASE_ROW_HEIGHT, lineCount * 3.6 + 2.4)
      : BASE_ROW_HEIGHT;

    // If next row would exceed printable area, close current page and create new page
    if (currentY + currentRowHeight > FOOTER_RESERVED_Y) {
      drawTableVerticalLines(pageTableStartY, currentY);

      doc.addPage();
      currentPage++;

      const nextStartY = drawStandardPdfHeader(doc);
      currentY = nextStartY + 6;
      pageTableStartY = currentY;
      drawTableHeader(currentY);
      currentY += HEADER_HEIGHT;
    }

    // Alternating zebra stripe
    if (idx % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(235, 238, 244);
    }
    doc.rect(14, currentY, 182, currentRowHeight, 'F');

    // Horizontal line with robust thickness matching vertical
    doc.setDrawColor(...TABLE_BORDER_COLOR);
    doc.setLineWidth(TABLE_LINE_WIDTH);
    doc.line(14, currentY + currentRowHeight, 196, currentY + currentRowHeight);

    // Text Vertical Alignment calculation
    const textBaseY = lineCount === 1 ? currentY + 4.1 : currentY + 3.8;

    doc.setTextColor(23, 25, 28);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.text(String(idx + 1), colSrCenterX, textBaseY, { align: 'center' });

    if (hasItemCode) {
      doc.setFont('helvetica', 'bold');
      doc.text((row as any).itemCode || '-', colItemCodeCenterX, textBaseY, { align: 'center' });
      doc.setFont('helvetica', 'normal');
    }

    // Render multi-line material description cleanly
    doc.text(descLines, colDescStartX, textBaseY);

    // Quantity and Unit vertically aligned
    doc.setFont('helvetica', 'bold');
    doc.text(String(row.quantity), colQtyCenterX, textBaseY, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text(row.unit || 'Pcs', colUnitCenterX, textBaseY, { align: 'center' });

    currentY += currentRowHeight;
  });

  // Calculate needed height for summary rows
  let summaryRowsHeight = 0;
  if (breakdown.isSingleUnit) {
    summaryRowsHeight = 7.0;
  } else {
    summaryRowsHeight = (breakdown.multiItemUnitTotals.length * 6.5) + 7.0;
  }

  // If table totals exceed current page, push totals to next page
  if (currentY + summaryRowsHeight > FOOTER_RESERVED_Y) {
    drawTableVerticalLines(pageTableStartY, currentY);
    doc.addPage();
    currentPage++;
    const nextStartY = drawStandardPdfHeader(doc);
    currentY = nextStartY + 6;
    pageTableStartY = currentY;
    drawTableHeader(currentY);
    currentY += HEADER_HEIGHT;
  }

  // Render Table Total Row(s) with distinct darker background so it clearly stands out
  if (breakdown.isSingleUnit) {
    doc.setFillColor(215, 220, 228); // Visibly darker solid total bar
    doc.rect(14, currentY, 182, 7.0, 'F');
    doc.setDrawColor(...TABLE_BORDER_COLOR);
    doc.setLineWidth(TABLE_LINE_WIDTH);
    doc.line(14, currentY + 7.0, 196, currentY + 7.0);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 18, 22);
    doc.text('TOTAL QUANTITY RECEIVED', colDescStartX, currentY + 4.6);
    doc.text(String(breakdown.totalQty), colQtyCenterX, currentY + 4.6, { align: 'center' });
    doc.text(breakdown.primaryUnit, colUnitCenterX, currentY + 4.6, { align: 'center' });

    currentY += 7.0;
  } else {
    if (breakdown.multiItemUnitTotals.length > 0) {
      breakdown.multiItemUnitTotals.forEach(u => {
        doc.setFillColor(235, 238, 244);
        doc.rect(14, currentY, 182, 6.5, 'F');
        doc.setDrawColor(...TABLE_BORDER_COLOR);
        doc.setLineWidth(TABLE_LINE_WIDTH);
        doc.line(14, currentY + 6.5, 196, currentY + 6.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(70, 75, 85);
        doc.text(`SUB-TOTAL (${u.unit.toUpperCase()} • ${u.itemCount} ITEMS)`, colDescStartX, currentY + 4.3);
        doc.setTextColor(23, 25, 28);
        doc.text(String(u.quantity), colQtyCenterX, currentY + 4.3, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.text(u.unit, colUnitCenterX, currentY + 4.3, { align: 'center' });

        currentY += 6.5;
      });
    }

    // Consolidated Total Summary with distinct darker background
    doc.setFillColor(215, 220, 228); // Visibly darker solid total bar
    doc.rect(14, currentY, 182, 7.0, 'F');
    doc.setDrawColor(...TABLE_BORDER_COLOR);
    doc.setLineWidth(TABLE_LINE_WIDTH);
    doc.line(14, currentY + 7.0, 196, currentY + 7.0);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 18, 22);
    doc.text(`TOTAL RECEIVED (${items.length} LINE ITEMS)`, colDescStartX, currentY + 4.6);
    doc.text(`${items.length} Items`, colQtyCenterX, currentY + 4.6, { align: 'center' });
    doc.text('Various', colUnitCenterX, currentY + 4.6, { align: 'center' });

    currentY += 7.0;
  }

  // Draw Vertical Lines for this last table segment
  drawTableVerticalLines(pageTableStartY, currentY);

  // Section 3: Verification & Custody Signatures (Dynamic Multi-Line Remarks & Signatures)
  // 1. Prepare Remarks multi-line text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.0);
  const remarksText = item.remarks || 'Boxes intact, physical seal verified at factory gate.';
  const remarkLines: string[] = doc.splitTextToSize(remarksText, 170);
  const remarkContentHeight = remarkLines.length * 3.8;

  // 2. Calculate dynamic card height to accommodate all remark lines + signatures
  const cardHeight = Math.max(36, 7.5 + 3.5 + remarkContentHeight + 5.0 + 3.5 + 4.5 + 5.5);
  const sigBlockTotalHeight = cardHeight + 6;

  // If not enough room on current page for signature card, move to fresh page
  if (currentY + sigBlockTotalHeight > FOOTER_RESERVED_Y) {
    doc.addPage();
    currentPage++;
    const nextStartY = drawStandardPdfHeader(doc);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(23, 25, 28);
    doc.text(`GATE INWARD VERIFICATION PASS • SIGN-OFF (REF: ${item.srNo})`, 14, nextStartY + 5);
    currentY = nextStartY + 10;
  } else {
    currentY += 8;
  }

  // Draw Card Container with dynamic expandable height
  doc.setDrawColor(220, 222, 228);
  doc.setFillColor(250, 250, 251);
  doc.roundedRect(14, currentY, 182, cardHeight, 3, 3, 'FD');

  // Title: Remarks (Bold Black)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.0);
  doc.setTextColor(23, 25, 28);
  doc.text('PHYSICAL INSPECTION & GATE REMARKS', 20, currentY + 7.5);

  // Remarks Value (multi-line slate grey)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.0);
  doc.setTextColor(100, 105, 115);
  doc.text(remarkLines, 20, currentY + 12.5);

  // Signatures Section - positioned dynamically below remarks
  const sigStartY = currentY + 12.5 + remarkContentHeight + 4.5;
  const securitySigX = 135; // Moved further to the right side

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.0);
  doc.setTextColor(23, 25, 28);
  doc.text('RECEIVED BY (STORE INCHARGE)', 20, sigStartY);
  doc.text('SECURITY OFFICER SIGNATURE', securitySigX, sigStartY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.0);
  doc.setTextColor(100, 105, 115);
  doc.text(item.receivedBy || 'Manoj Tiwari (Store Dept)', 20, sigStartY + 5.5);
  doc.text(item.securitySignature || 'Ram Singh (Gate Security)', securitySigX, sigStartY + 5.5);

  // Stamp Footers on All Pages with exact total pages & "Continued to Xth Page"
  const totalPages = doc.getNumberOfPages();
  const liveTimestamp = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const hasNext = p < totalPages;
    drawStandardPdfFooter(
      doc,
      p,
      totalPages,
      'PAINTKING • Official Gate Security Material Verification Pass',
      liveTimestamp,
      hasNext
    );
  }

  doc.save(`PaintKing_Inward_Pass_${item.srNo}.pdf`);
};

/**
 * Generates and downloads the Official Gate Outward Pass PDF
 */
export const downloadStandardGateOutwardPdf = (item: MaterialOutwardRecord): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Standard Header
  const startY = drawStandardPdfHeader(doc);

  // Document Title Bar (Clear & Professional)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(23, 25, 28);
  doc.text('GATE OUTWARD DISPATCH PASS', 14, startY + 5);

  // Status Badge / Reference on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(34, 139, 34);
  doc.text(`PASS NO: ${item.gatePassNo}`, 196, startY + 5, { align: 'right' });

  // Section 1: Outward & Vehicle Metadata Grid (3 Structured Rows)
  const metaY = startY + 8;
  doc.setDrawColor(220, 222, 228);
  doc.setFillColor(250, 250, 251);
  doc.roundedRect(14, metaY, 182, 44, 3, 3, 'FD');

  const metaCol1X = 20;
  const metaCol2X = 80;
  const metaCol3X = 140;

  const drawMetaField = (
    label: string,
    value: string,
    x: number,
    labelY: number,
    valueY: number,
    maxWidth: number = 52
  ) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.0);
    doc.setTextColor(23, 25, 28);
    doc.text(label, x, labelY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.0);
    doc.setTextColor(100, 105, 115);

    const cleanVal = (value || '-').trim();
    const allLines: string[] = doc.splitTextToSize(cleanVal, maxWidth);

    if (allLines.length <= 1) {
      doc.text(allLines[0] || '-', x, valueY);
    } else if (allLines.length === 2) {
      doc.text(allLines[0], x, valueY - 1.2);
      doc.text(allLines[1], x, valueY + 2.2);
    } else {
      doc.text(allLines[0], x, valueY - 1.2);
      let line2 = allLines[1];
      while (line2.length > 0 && doc.getTextWidth(line2 + '...') > maxWidth) {
        line2 = line2.slice(0, -1);
      }
      doc.text(line2 + '...', x, valueY + 2.2);
    }
  };

  // Row 1: OUTWARD SR NO. | DISPATCH DATE & TIME | GATE PASS NO.
  drawMetaField('OUTWARD SR NO.', item.srNo, metaCol1X, metaY + 5.5, metaY + 11.0, 54);
  drawMetaField('DISPATCH DATE & TIME', `${formatDateDDMMYYYY(item.date)} • ${item.outTime || 'N/A'}`, metaCol2X, metaY + 5.5, metaY + 11.0, 54);
  drawMetaField('GATE PASS NO.', item.gatePassNo, metaCol3X, metaY + 5.5, metaY + 11.0, 48);

  // Row 2: NAME OF PARTY (CUSTOMER) | VEHICLE NUMBER | TRANSPORTER NAME
  drawMetaField('NAME OF PARTY (CUSTOMER)', item.partyName || '-', metaCol1X, metaY + 18.5, metaY + 24.0, 54);
  drawMetaField('VEHICLE NUMBER', item.vehicleNo || '-', metaCol2X, metaY + 18.5, metaY + 24.0, 54);
  drawMetaField('TRANSPORTER / CARRIER', item.transporter || 'Direct Dispatch', metaCol3X, metaY + 18.5, metaY + 24.0, 48);

  // Row 3: PLANT / LOCATION | LINKED INVOICE / CHALLAN | DISPATCH STATUS
  drawMetaField('OPERATIONAL PLANT', `${item.plant || 'Main'} Unit`, metaCol1X, metaY + 31.5, metaY + 37.0, 54);
  drawMetaField('LINKED TAX INVOICE', (item as any).invoiceRef || 'Direct Factory Dispatch', metaCol2X, metaY + 31.5, metaY + 37.0, 54);
  drawMetaField('DISPATCH STATUS', 'Verified & Security Cleared', metaCol3X, metaY + 31.5, metaY + 37.0, 48);

  // Section 2: Material Line Items Table
  const tableStartY = metaY + 50;
  const HEADER_HEIGHT = 6.5;
  const ROW_HEIGHT = 9.0;

  // Draw Header (Light Grey standardized header)
  doc.setFillColor(242, 242, 243);
  doc.rect(14, tableStartY, 182, HEADER_HEIGHT, 'F');
  doc.setDrawColor(180, 185, 195);
  doc.setLineWidth(0.45);
  doc.line(14, tableStartY, 196, tableStartY);
  doc.line(14, tableStartY + HEADER_HEIGHT, 196, tableStartY + HEADER_HEIGHT);

  doc.setTextColor(23, 25, 28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.text('SR NO.', 20, tableStartY + 4.5, { align: 'center' });
  doc.text('DESCRIPTION OF MATERIAL & FINISHED GOODS', 32, tableStartY + 4.5);
  doc.text('QUANTITY', 150, tableStartY + 4.5, { align: 'center' });
  doc.text('UNIT', 180, tableStartY + 4.5, { align: 'center' });

  // Row 1
  const rowY = tableStartY + HEADER_HEIGHT;
  doc.setFillColor(255, 255, 255);
  doc.rect(14, rowY, 182, ROW_HEIGHT, 'F');

  doc.setDrawColor(180, 185, 195);
  doc.setLineWidth(0.45);
  doc.rect(14, tableStartY, 182, HEADER_HEIGHT + ROW_HEIGHT); // Outer border
  doc.line(26, tableStartY, 26, rowY + ROW_HEIGHT);
  doc.line(136, tableStartY, 136, rowY + ROW_HEIGHT);
  doc.line(166, tableStartY, 166, rowY + ROW_HEIGHT);

  doc.setTextColor(23, 25, 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.0);
  doc.text('1', 20, rowY + 5.5, { align: 'center' });
  doc.text(item.descriptionOfMaterial || 'Finished Painted Components', 32, rowY + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.text(String(item.quantity || 1), 150, rowY + 5.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(item.unit || 'Pcs', 180, rowY + 5.5, { align: 'center' });

  // Summary / Footer row
  const sumY = rowY + ROW_HEIGHT;
  doc.setFillColor(242, 242, 243);
  doc.rect(14, sumY, 182, 7.0, 'FD');
  doc.line(136, sumY, 136, sumY + 7.0);
  doc.line(166, sumY, 166, sumY + 7.0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(23, 25, 28);
  doc.text('TOTAL DISPATCHED QUANTITY', 130, sumY + 4.8, { align: 'right' });
  doc.text(String(item.quantity || 1), 150, sumY + 4.8, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(item.unit || 'Pcs', 180, sumY + 4.8, { align: 'center' });

  // Section 3: Verification & Security Remarks
  const sigBoxY = sumY + 14;
  doc.setDrawColor(220, 222, 228);
  doc.setFillColor(250, 250, 251);
  doc.roundedRect(14, sigBoxY, 182, 38, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.0);
  doc.setTextColor(23, 25, 28);
  doc.text('PHYSICAL VERIFICATION & SECURITY REMARKS', 20, sigBoxY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.0);
  doc.setTextColor(100, 105, 115);
  doc.text(item.remarks || 'Outward verified at factory gate barrier. Material cleared for physical transit.', 20, sigBoxY + 11.0);

  doc.setDrawColor(230, 230, 230);
  doc.line(20, sigBoxY + 17, 190, sigBoxY + 17);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.0);
  doc.setTextColor(23, 25, 28);
  doc.text('SECURITY OFFICER SIGN-OFF', 20, sigBoxY + 23);
  doc.text('DISPATCH / LOGISTICS INCHARGE', 120, sigBoxY + 23);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.0);
  doc.setTextColor(100, 105, 115);
  doc.text(item.securitySignature || 'Ram Singh (Gate Security)', 20, sigBoxY + 29);
  doc.text('Authorized Dispatch Desk', 120, sigBoxY + 29);

  // Footer Stamp
  const liveTimestamp = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  drawStandardPdfFooter(
    doc,
    1,
    1,
    'PAINTKING • Official Gate Security Material Outward Dispatch Record',
    liveTimestamp,
    false
  );

  doc.save(`PaintKing_Outward_Pass_${item.gatePassNo || item.srNo}.pdf`);
};

/**
 * Generates and downloads the Official GST Tax Invoice PDF (Sec 31 CGST Act)
 */
export const downloadStandardTaxInvoicePdf = (invoice: BillingInvoice): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Standard Header
  const startY = drawStandardPdfHeader(doc);

  // Document Title Bar (Clear & Professional)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(23, 25, 28);
  doc.text('TAX INVOICE (SEC 31 CGST ACT)', 14, startY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(192, 151, 72);
  doc.text('ORIGINAL FOR RECIPIENT', 196, startY + 5, { align: 'right' });

  // Section 1: Customer (Billed To) & Invoice Metadata Grid
  const metaY = startY + 8;
  doc.setDrawColor(230, 230, 230);
  doc.setFillColor(250, 250, 251);
  doc.roundedRect(14, metaY, 182, 38, 3, 3, 'FD');

  // Billed To (Left Column)
  doc.setFontSize(7.5);
  doc.setTextColor(119, 123, 134);
  doc.setFont('helvetica', 'bold');
  doc.text('BILLED TO (CUSTOMER DETAILS):', 20, metaY + 8);

  doc.setFontSize(9.5);
  doc.setTextColor(23, 25, 28);
  doc.text(invoice.customer, 20, metaY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(119, 123, 134);
  doc.text('Consignee / Delivery Address: Industrial Area Facility', 20, metaY + 19);
  doc.text(`Customer GSTIN: 27AABCT8814M1Z2 • State Code: ${invoice.plant === 'Mumbai' || invoice.plant === 'Vasai' ? '27 (Maharashtra)' : '05 (Uttarakhand)'}`, 20, metaY + 24);
  doc.text(`Work Order / Ref PO: ${invoice.woNo}`, 20, metaY + 29);

  // Invoice Metadata (Right Column)
  doc.setFont('helvetica', 'bold');
  doc.text('COMMERCIAL INVOICE METADATA:', 110, metaY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(23, 25, 28);
  doc.text(`Invoice No: `, 110, metaY + 14);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.invoiceNo, 132, metaY + 14);

  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice Date: `, 110, metaY + 19);
  doc.text(invoice.invoiceDate, 132, metaY + 19);

  doc.text(`Place of Supply: `, 110, metaY + 24);
  doc.text(`${invoice.plant} Unit State Code`, 132, metaY + 24);

  doc.text(`Reverse Charge Applicable: `, 110, metaY + 29);
  doc.text('No', 150, metaY + 29);

  // Section 2: Line Items Table (HSN 9988 Job Work with Vertical Grid Lines)
  let currentY = metaY + 45;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(23, 25, 28);
  doc.text('BILLABLE FINISHED GOODS & SURFACE TREATMENT PARTICULARS', 14, currentY);

  currentY += 4;
  const taxTableStartY = currentY;
  const taxColX = [14, 30, 98, 120, 142, 168, 196]; // Column borders

  // Table Header (Light Grey standardized header)
  doc.setFillColor(242, 242, 243);
  doc.rect(14, currentY, 182, 7.5, 'F');
  doc.setDrawColor(180, 185, 195);
  doc.setLineWidth(0.45);
  doc.line(14, currentY, 196, currentY);
  doc.line(14, currentY + 7.5, 196, currentY + 7.5);

  doc.setTextColor(23, 25, 28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('SR NO.', 22, currentY + 5, { align: 'center' });
  doc.text('PART & FINISH SPECIFICATION', 33, currentY + 5);
  doc.text('HSN / SAC', 109, currentY + 5, { align: 'center' });
  doc.text('QTY', 131, currentY + 5, { align: 'center' });
  doc.text('RATE (INR)', 155, currentY + 5, { align: 'center' });
  doc.text('AMOUNT (INR)', 182, currentY + 5, { align: 'center' });

  currentY += 7.5;
  invoice.lineItems.forEach((it, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 251);
    doc.rect(14, currentY, 182, 8.5, 'F');
    doc.setDrawColor(180, 185, 195);
    doc.setLineWidth(0.45);
    doc.line(14, currentY + 8.5, 196, currentY + 8.5);

    doc.setTextColor(23, 25, 28);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(String(idx + 1), 22, currentY + 5.5, { align: 'center' });
    
    // Description
    doc.text(`${it.colorName || 'Custom'} Surface Coating Job-Work`, 33, currentY + 5.5);
    
    // HSN Code 9988
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(192, 151, 72);
    doc.text('9988', 109, currentY + 5.5, { align: 'center' });
    
    // Qty
    doc.setTextColor(23, 25, 28);
    doc.text(String(it.billableQty || it.orderedQty), 131, currentY + 5.5, { align: 'center' });
    
    // Rate
    doc.setFont('helvetica', 'normal');
    doc.text(`₹${Number(it.unitRate).toFixed(2)}`, 155, currentY + 5.5, { align: 'center' });
    
    // Line Total
    doc.setFont('helvetica', 'bold');
    doc.text(`₹${Number(it.lineTotal).toLocaleString('en-IN')}`, 182, currentY + 5.5, { align: 'center' });

    currentY += 8.5;
  });

  // Draw Vertical Lines
  doc.setDrawColor(180, 185, 195);
  doc.setLineWidth(0.45);
  taxColX.forEach(x => {
    doc.line(x, taxTableStartY, x, currentY);
  });

  // Section 3: Tax Calculation Table
  doc.setFillColor(242, 242, 243);
  doc.rect(14, currentY, 182, 28, 'F');
  doc.setDrawColor(220, 220, 220);
  doc.rect(14, currentY, 182, 28, 'S');

  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(23, 25, 28);
  doc.text('Subtotal (Taxable Value of Job-Work):', 110, currentY + 6);
  doc.setFont('helvetica', 'bold');
  doc.text(`₹${invoice.subTotal.toLocaleString('en-IN')}`, 175, currentY + 6);

  // CGST 9%
  const cgst = invoice.cgstAmount ?? (invoice.gstAmount / 2);
  const sgst = invoice.sgstAmount ?? (invoice.gstAmount / 2);
  doc.setFont('helvetica', 'normal');
  doc.text('Central GST (CGST @ 9%):', 110, currentY + 12);
  doc.text(`₹${cgst.toLocaleString('en-IN')}`, 175, currentY + 12);

  // SGST 9%
  doc.text('State GST (SGST @ 9%):', 110, currentY + 18);
  doc.text(`₹${sgst.toLocaleString('en-IN')}`, 175, currentY + 18);

  // Grand Total Bar
  doc.setFillColor(23, 25, 28);
  doc.rect(14, currentY + 21, 182, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('TOTAL INVOICE VALUE (INR):', 110, currentY + 26);
  doc.setTextColor(192, 151, 72);
  doc.text(`₹${invoice.grandTotal.toLocaleString('en-IN')}`, 175, currentY + 26);

  currentY += 34;

  // Section 4: Bank Details & Authorized Signatory Grid
  doc.setDrawColor(230, 230, 230);
  doc.setFillColor(250, 250, 251);
  doc.roundedRect(14, currentY, 182, 38, 3, 3, 'FD');

  // Left: Banking Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(119, 123, 134);
  doc.text('BANK REMITTANCE PARTICULARS:', 20, currentY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(23, 25, 28);
  doc.text('Bank Name: HDFC Bank Ltd • Current Account', 20, currentY + 14);
  doc.text('A/c No: 50200049182314 • IFSC: HDFC0000060', 20, currentY + 19);
  doc.text('Branch: Kandivali West, Mumbai - 400067', 20, currentY + 24);
  doc.text('Terms: Payment due within 30 days of invoice receipt.', 20, currentY + 29);

  // Right: Signature Box
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(119, 123, 134);
  doc.text('FOR PAINTKING', 110, currentY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(23, 25, 28);
  doc.text(`Prepared By: ${invoice.preparedBy || 'Accounts Officer'}`, 110, currentY + 18);
  doc.setFont('helvetica', 'bold');
  doc.text('AUTHORIZED SIGNATORY (FINANCE & ACCOUNTS)', 110, currentY + 29);

  // Standard Footer
  drawStandardPdfFooter(doc, 1, 1, 'PAINTKING • Standard Tax Invoice Under Section 31 CGST Act 2017');

  doc.save(`PaintKing_Tax_Invoice_${invoice.invoiceNo}.pdf`);
};

/**
 * Generates and downloads the Official Delivery Challan PDF (Rule 55 CGST Rules)
 */
export const downloadStandardDeliveryChallanPdf = (invoice: BillingInvoice): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Standard Header
  const startY = drawStandardPdfHeader(doc);

  // Document Title Bar (Clear & Professional)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(23, 25, 28);
  doc.text('DELIVERY CHALLAN (RULE 55 CGST RULES)', 14, startY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(192, 151, 72);
  doc.text('GOODS TRANSPORT NOTE', 196, startY + 5, { align: 'right' });

  // Section 1: Consignee & Vehicle Details
  const metaY = startY + 8;
  doc.setDrawColor(230, 230, 230);
  doc.setFillColor(250, 250, 251);
  doc.roundedRect(14, metaY, 182, 38, 3, 3, 'FD');

  doc.setFontSize(7.5);
  doc.setTextColor(119, 123, 134);
  doc.setFont('helvetica', 'bold');
  doc.text('CONSIGNEE (DELIVER TO):', 20, metaY + 8);

  doc.setFontSize(9.5);
  doc.setTextColor(23, 25, 28);
  doc.text(invoice.customer, 20, metaY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(119, 123, 134);
  doc.text('Delivery Address: Customer Warehouse / Plant Facility', 20, metaY + 19);
  doc.text(`Customer GSTIN: 27AABCT8814M1Z2`, 20, metaY + 24);
  doc.text(`Against Work Order: ${invoice.woNo}`, 20, metaY + 29);

  doc.setFont('helvetica', 'bold');
  doc.text('TRANSPORT & MOVEMENT DETAILS (RULE 55):', 110, metaY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(23, 25, 28);
  doc.text('Reason for Movement: Job-Work Return of Processed Goods', 110, metaY + 14);
  doc.text(`Dispatch Plant: ${invoice.plant} Unit`, 110, metaY + 19);
  doc.text('Transporter: VRL Logistics / Dedicated Truck', 110, metaY + 24);
  doc.text('Mode of Transport: Road • Secure Industrial Transit', 110, metaY + 29);

  // Section 2: Items Table (with Vertical Grid Lines)
  let currentY = metaY + 45;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(23, 25, 28);
  doc.text('GOODS TRANSPORTED (ZERO PRICE DEMAND - STRICTLY FOR TRANSIT)', 14, currentY);

  currentY += 4;
  const dcTableStartY = currentY;
  const dcColX = [14, 30, 100, 155, 196]; // Column borders

  doc.setFillColor(242, 242, 243);
  doc.rect(14, currentY, 182, 7.5, 'F');
  doc.setDrawColor(180, 185, 195);
  doc.setLineWidth(0.45);
  doc.line(14, currentY, 196, currentY);
  doc.line(14, currentY + 7.5, 196, currentY + 7.5);

  doc.setTextColor(23, 25, 28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('SR NO.', 22, currentY + 5, { align: 'center' });
  doc.text('DESCRIPTION OF FINISHED GOODS', 33, currentY + 5);
  doc.text('PACKING PARTICULARS', 127.5, currentY + 5, { align: 'center' });
  doc.text('QUANTITY DISPATCHED', 175.5, currentY + 5, { align: 'center' });

  currentY += 7.5;
  invoice.lineItems.forEach((it, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 251);
    doc.rect(14, currentY, 182, 8.5, 'F');
    doc.setDrawColor(180, 185, 195);
    doc.setLineWidth(0.45);
    doc.line(14, currentY + 8.5, 196, currentY + 8.5);

    doc.setTextColor(23, 25, 28);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(String(idx + 1), 22, currentY + 5.5, { align: 'center' });
    doc.text(`${it.colorName || 'Custom'} Surface Coated Components`, 33, currentY + 5.5);
    doc.text('Packed in Sealed Corrugated Crates', 127.5, currentY + 5.5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(`${it.billableQty || it.orderedQty} Pcs`, 175.5, currentY + 5.5, { align: 'center' });

    currentY += 8.5;
  });

  // Total Quantity Bar
  doc.setFillColor(242, 242, 243);
  doc.rect(14, currentY, 182, 8, 'F');
  doc.setDrawColor(180, 185, 195);
  doc.setLineWidth(0.45);
  doc.line(14, currentY + 8, 196, currentY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(23, 25, 28);
  doc.text('TOTAL QUANTITY DELIVERED:', 33, currentY + 5.5);
  doc.text(`${invoice.totalBilledQty || invoice.totalOrderedQty} Pcs`, 175.5, currentY + 5.5, { align: 'center' });

  currentY += 8;

  // Draw Vertical Lines across the table
  doc.setDrawColor(180, 185, 195);
  doc.setLineWidth(0.45);
  dcColX.forEach(x => {
    doc.line(x, dcTableStartY, x, currentY);
  });

  currentY += 8;

  // Section 3: Statutory Declaration & Custody Signatures
  doc.setDrawColor(230, 230, 230);
  doc.setFillColor(250, 250, 251);
  doc.roundedRect(14, currentY, 182, 42, 3, 3, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(119, 123, 134);
  doc.text('STATUTORY RULE 55 DECLARATION:', 20, currentY + 8);
  doc.setTextColor(23, 25, 28);
  doc.text(
    'Certified that the goods being transported are finished job-work components returned under Rule 55 of the CGST Rules, 2017.',
    20,
    currentY + 13
  );
  doc.text('This delivery note is not a demand for payment. Original commercial tax invoice is dispatched separately.', 20, currentY + 17);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('DISPATCH STORE INCHARGE', 20, currentY + 28);
  doc.text('RECEIVER ACKNOWLEDGMENT (CUSTOMER STAMP)', 110, currentY + 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('PAINTKING Logistics Dept.', 20, currentY + 34);
  doc.text('Received in Good Condition • Signature & Date:', 110, currentY + 34);

  // Standard Footer
  drawStandardPdfFooter(doc, 1, 1, 'PAINTKING • Delivery Challan Issued Under Rule 55 of CGST Rules 2017');

  doc.save(`PaintKing_Delivery_Challan_${invoice.invoiceNo}.pdf`);
};

/**
 * Generates and downloads the Official Incoming Quality Inspection Report (IQC) PDF
 * Matching PaintKing's official Excel template & IATF 16949 / ISO 9001:2015 standards
 */
export const downloadStandardIQCPdf = (record: IQCInspectionRecord): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const FOOTER_RESERVED_Y = 270;
  const TABLE_BORDER_COLOR = [180, 185, 195] as const;
  const TABLE_LINE_WIDTH = 0.45;

  // Helper to sanitize non-ASCII unicode characters that glitch standard jsPDF Helvetica kerning
  const sanitizePdfText = (txt: string) => {
    if (!txt) return '';
    return txt
      .replace(/ΔE/g, 'Delta E')
      .replace(/Δ/g, 'Delta ')
      .replace(/≤/g, '<=')
      .replace(/≥/g, '>=')
      .replace(/±/g, '+/-');
  };

  const cleanMaterialName = (name: string) => {
    if (!name) return '';
    let clean = name.replace(/^\[.*?\]\s*/g, '').replace(/\[.*?\]/g, '').trim();
    clean = clean.replace(/\(\d+\s*[a-zA-Z]*\)/g, '').trim();
    return clean;
  };

  // 1. Prepare Verified Items Data
  const rawItems = (record.items && record.items.length > 0)
    ? record.items
    : [{
        id: '1',
        materialName: record.partDescription || record.partComponent || 'Raw Substrates',
        challanQty: record.invQuantity || record.totalQty || 1000,
        actualQty: record.actualReceived ?? record.totalQty ?? 1000,
        unit: record.uom || record.unit || 'Pcs',
        shortageQty: record.shortageQty || 0,
        sampleSize: record.sampleSize || Math.min(record.actualReceived || 1000, Math.max(5, Math.round((record.actualReceived || 1000) * 0.20))),
        passQty: record.passQty !== undefined ? record.passQty : (record.sampleSize || 200),
        rejectQty: record.rejectQty || 0,
        rejectionPercent: record.rejectionPercent || 0,
        defectDetail: record.rejectionDetail || 'Nil - All parts pass visual and physical checks'
      }];

  const totalChallanQty = rawItems.reduce((acc, it) => acc + (it.challanQty || it.actualQty || 0), 0) || (record.invQuantity || record.totalQty || 0);
  const totalActualQty = rawItems.reduce((acc, it) => acc + (it.actualQty || 0), 0) || (record.actualReceived ?? record.totalQty ?? 0);
  const totalShortage = rawItems.reduce((acc, it) => acc + (it.shortageQty || 0), 0) || (record.shortageQty || 0);
  const primaryUom = record.uom || record.unit || rawItems[0]?.unit || 'Pcs';

  // 2. Standard Header
  const startY = drawStandardPdfHeader(doc);

  // Document Title & Control Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(23, 25, 28);
  doc.text('INCOMING QUALITY INSPECTION REPORT', 14, startY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(119, 123, 134);
  doc.text('Doc: PK-QA-IQC-001  |  Rev: 00', 196, startY + 5, { align: 'right' });

  // 3. Top Section: Metadata Grid (3 Structured Rows)
  const metaY = startY + 8;
  const metaBoxHeight = 44;
  doc.setDrawColor(220, 222, 228);
  doc.setFillColor(250, 250, 251);
  doc.roundedRect(14, metaY, 182, metaBoxHeight, 3, 3, 'FD');

  const metaCol1X = 20;
  const metaCol2X = 80;
  const metaCol3X = 140;

  const drawMetaField = (
    label: string,
    value: string,
    x: number,
    labelY: number,
    valueY: number,
    maxWidth: number = 52
  ) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.0);
    doc.setTextColor(23, 25, 28);
    doc.text(label, x, labelY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.0);
    doc.setTextColor(100, 105, 115);

    const cleanVal = (value || '-').trim();
    const allLines: string[] = doc.splitTextToSize(cleanVal, maxWidth);

    if (allLines.length <= 1) {
      doc.text(allLines[0] || '-', x, valueY);
    } else if (allLines.length === 2) {
      doc.text(allLines[0], x, valueY - 1.2);
      doc.text(allLines[1], x, valueY + 2.2);
    } else {
      doc.text(allLines[0], x, valueY - 1.2);
      let line2 = allLines[1];
      while (line2.length > 0 && doc.getTextWidth(line2 + '...') > maxWidth) {
        line2 = line2.slice(0, -1);
      }
      doc.text(line2 + '...', x, valueY + 2.2);
    }
  };

  // Row 1: REPORT NO. | CHALLAN DATE | INSPECTION DATE
  drawMetaField('REPORT NO.', record.reportNo, metaCol1X, metaY + 5.5, metaY + 11.0, 54);
  drawMetaField('CHALLAN DATE', formatDateDDMMYYYY(record.invoiceChallanDate || record.date), metaCol2X, metaY + 5.5, metaY + 11.0, 54);
  drawMetaField('INSPECTION DATE', formatDateDDMMYYYY(record.inspectionDate || record.date), metaCol3X, metaY + 5.5, metaY + 11.0, 48);

  // Row 2: CHALLAN / INV NO. | NAME OF PARTY / VENDOR | BATCH / LOT NO.
  const vendorName = record.vendorCustomer || record.supplierCustomer || '-';
  drawMetaField('CHALLAN / INV NO.', record.invoiceChallanNo || '-', metaCol1X, metaY + 18.5, metaY + 24.0, 54);
  drawMetaField('NAME OF PARTY / VENDOR', vendorName, metaCol2X, metaY + 18.5, metaY + 24.0, 54);
  drawMetaField('BATCH / LOT NO.', record.batchNo || '-', metaCol3X, metaY + 18.5, metaY + 24.0, 48);

  // Row 3: PART / MATERIAL | INVOICE QTY | ACTUAL RECEIVED / SHORTAGE
  const partSummaryLabel = rawItems.length > 1 ? 'CONSIGNMENT / MATERIALS' : 'PART / MATERIAL';
  const partSummaryValue = rawItems.length > 1 
    ? `As Per List Below (${rawItems.length} Materials)`
    : cleanMaterialName(rawItems[0]?.materialName || record.partDescription || record.partComponent || '-');

  const invQtyText = `${totalChallanQty.toLocaleString()} ${primaryUom}`;
  const recText = totalShortage > 0 
    ? `${totalActualQty.toLocaleString()} ${primaryUom} (${totalShortage} Short)` 
    : `${totalActualQty.toLocaleString()} ${primaryUom} (Match)`;

  drawMetaField(partSummaryLabel, partSummaryValue, metaCol1X, metaY + 31.5, metaY + 37.0, 54);
  drawMetaField('INVOICE QTY', invQtyText, metaCol2X, metaY + 31.5, metaY + 37.0, 54);
  drawMetaField('ACTUAL RECEIVED / SHORTAGE', recText, metaCol3X, metaY + 31.5, metaY + 37.0, 48);

  let currentY = metaY + metaBoxHeight + 10;

  const checkPageOverflow = (neededHeight: number) => {
    if (currentY + neededHeight > FOOTER_RESERVED_Y) {
      doc.addPage();
      const nextStartY = drawStandardPdfHeader(doc);
      currentY = nextStartY + 8;
      return true;
    }
    return false;
  };

  // =========================================================================
  // TABLE 1: INWARD RECEIVED MATERIALS VERIFICATION (GATE PASS MATCHING)
  // =========================================================================
  checkPageOverflow(32);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(23, 25, 28);
  doc.text(`1. INWARD RECEIVED MATERIALS & VERIFICATION (${rawItems.length} LINE ITEMS)`, 14, currentY);

  currentY += 4.5;
  const inwTableStartY = currentY;
  const inwColX = [14, 26, 106, 136, 166, 196]; // Column vertical lines

  // Table Header
  doc.setFillColor(242, 242, 243);
  doc.rect(14, currentY, 182, 6.2, 'F');
  doc.setDrawColor(...TABLE_BORDER_COLOR);
  doc.setLineWidth(TABLE_LINE_WIDTH);
  doc.line(14, currentY, 196, currentY);
  doc.line(14, currentY + 6.2, 196, currentY + 6.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(23, 25, 28);
  doc.text('SR.', 20, currentY + 4.3, { align: 'center' });
  doc.text('DESCRIPTION OF MATERIAL / ITEM', 28, currentY + 4.3);
  doc.text('CHALLAN QTY', 121, currentY + 4.3, { align: 'center' });
  doc.text('PHYSICAL RCVD', 151, currentY + 4.3, { align: 'center' });
  doc.text('STATUS / SHORTAGE', 181, currentY + 4.3, { align: 'center' });

  currentY += 6.2;

  rawItems.forEach((item, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 250, isEven ? 255 : 250, isEven ? 255 : 251);
    doc.rect(14, currentY, 182, 6.2, 'F');
    doc.setDrawColor(...TABLE_BORDER_COLOR);
    doc.setLineWidth(TABLE_LINE_WIDTH);
    doc.line(14, currentY + 6.2, 196, currentY + 6.2);

    doc.setTextColor(23, 25, 28);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.text(String(idx + 1), 20, currentY + 4.3, { align: 'center' });

    // Normal font, not forced bold/capital
    const cName = cleanMaterialName(item.materialName);
    const mName = cName.length > 46 ? cName.slice(0, 44) + '...' : cName;
    doc.text(mName, 28, currentY + 4.3);

    const uStr = item.unit || primaryUom;
    doc.text(`${(item.challanQty || item.actualQty || 0).toLocaleString()} ${uStr}`, 121, currentY + 4.3, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.text(`${(item.actualQty || 0).toLocaleString()} ${uStr}`, 151, currentY + 4.3, { align: 'center' });

    const itShort = item.shortageQty || 0;
    if (itShort > 0) {
      doc.setTextColor(220, 38, 38);
      doc.text(`Short (${itShort})`, 181, currentY + 4.3, { align: 'center' });
    } else {
      doc.setTextColor(16, 116, 55);
      doc.text('Match (100%)', 181, currentY + 4.3, { align: 'center' });
    }

    currentY += 6.2;
  });

  // Table 1 Summary Total Row (if > 1 item)
  if (rawItems.length > 1) {
    doc.setFillColor(215, 220, 228);
    doc.rect(14, currentY, 182, 6.5, 'F');
    doc.setDrawColor(...TABLE_BORDER_COLOR);
    doc.setLineWidth(TABLE_LINE_WIDTH);
    doc.line(14, currentY + 6.5, 196, currentY + 6.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.0);
    doc.setTextColor(15, 18, 22);
    doc.text(`TOTAL CONSIGNMENT (${rawItems.length} MATERIALS):`, 28, currentY + 4.4);
    doc.text(`${totalChallanQty.toLocaleString()} ${primaryUom}`, 121, currentY + 4.4, { align: 'center' });
    doc.text(`${totalActualQty.toLocaleString()} ${primaryUom}`, 151, currentY + 4.4, { align: 'center' });

    if (totalShortage > 0) {
      doc.setTextColor(220, 38, 38);
      doc.text(`${totalShortage} Short`, 181, currentY + 4.4, { align: 'center' });
    } else {
      doc.setTextColor(16, 116, 55);
      doc.text('100% Match', 181, currentY + 4.4, { align: 'center' });
    }

    currentY += 6.5;
  }

  // Draw Vertical lines for Table 1
  doc.setDrawColor(...TABLE_BORDER_COLOR);
  doc.setLineWidth(TABLE_LINE_WIDTH);
  inwColX.forEach(x => {
    doc.line(x, inwTableStartY, x, currentY);
  });

  currentY += 16; // 3x Generous Spacing between Table 1 and Table 2

  // =========================================================================
  // TABLE 2: 7 QUALITY ASPECTS & PARAMETERS EVALUATION
  // =========================================================================
  checkPageOverflow(60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(23, 25, 28);
  doc.text('2. QUALITY INSPECTION ASPECTS & PARAMETERS EVALUATION', 14, currentY);

  currentY += 4.5;
  const aspTableStartY = currentY;
  const aspColX = [14, 26, 82, 160, 178, 196];

  doc.setFillColor(242, 242, 243);
  doc.rect(14, currentY, 182, 6.2, 'F');
  doc.setDrawColor(...TABLE_BORDER_COLOR);
  doc.setLineWidth(TABLE_LINE_WIDTH);
  doc.line(14, currentY, 196, currentY);
  doc.line(14, currentY + 6.2, 196, currentY + 6.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(23, 25, 28);
  doc.text('SR.', 20, currentY + 4.3, { align: 'center' });
  doc.text('ASPECTS / PARAMETERS', 28, currentY + 4.3);
  doc.text('METHOD OF MEASUREMENT / CRITERIA', 84, currentY + 4.3);
  doc.text('IMPACT', 169, currentY + 4.3, { align: 'center' });
  doc.text('RESULT', 187, currentY + 4.3, { align: 'center' });

  currentY += 6.2;

  const defaultAspects = [
    { srNo: 1, aspect: 'Packing (Box Condition)', methodOfMeasurement: 'Visual (Cartons Should be Proper Condition)', impact: 'Major' as const, result: record.damage === 'Fail' ? 'Fail' : 'Pass' },
    { srNo: 2, aspect: 'Traceability (Batch No)', methodOfMeasurement: 'Visual identification / lot label', impact: 'Critical' as const, result: 'Pass' },
    { srNo: 3, aspect: 'Quantity', methodOfMeasurement: 'Weight / Physical count', impact: 'Major' as const, result: (totalShortage > 0) ? `Short (${totalShortage})` : 'Pass' },
    { srNo: 4, aspect: 'Physical Inspection', methodOfMeasurement: 'No Damages / Silver Line / Lock Damages / Bend / Flash', impact: 'Critical' as const, result: (record.scratch === 'Fail' || record.damage === 'Fail') ? 'Fail' : 'Pass' },
    { srNo: 5, aspect: 'Conductivity', methodOfMeasurement: 'As per Vendor Report / Surface Resistivity', impact: 'Major' as const, result: 'Pass' },
    { srNo: 6, aspect: 'Adhesion', methodOfMeasurement: 'Cross Cut and then Tape test', impact: 'Critical' as const, result: 'Pass' },
    { srNo: 7, aspect: 'Delta Value (Spectrophotometer)', methodOfMeasurement: 'Spectrophotometer CIELAB (Target Delta E <= 1.00 for raw substrate)', impact: 'Major' as const, result: 'Pass' }
  ];

  const rawAspects = (record.aspects && record.aspects.length > 0) ? record.aspects : defaultAspects;
  const aspectsToRender = rawAspects.map(asp => ({
    ...asp,
    aspect: sanitizePdfText(asp.aspect),
    methodOfMeasurement: sanitizePdfText(asp.methodOfMeasurement),
    result: sanitizePdfText(String(asp.result))
  }));

  aspectsToRender.forEach((asp, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 250, isEven ? 255 : 250, isEven ? 255 : 251);
    doc.rect(14, currentY, 182, 6.2, 'F');
    doc.setDrawColor(...TABLE_BORDER_COLOR);
    doc.setLineWidth(TABLE_LINE_WIDTH);
    doc.line(14, currentY + 6.2, 196, currentY + 6.2);

    doc.setTextColor(23, 25, 28);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.text(String(asp.srNo || idx + 1), 20, currentY + 4.3, { align: 'center' });
    
    doc.setFont('helvetica', 'bold');
    const aspectStr = asp.aspect.length > 34 ? asp.aspect.slice(0, 32) + '...' : asp.aspect;
    doc.text(aspectStr, 28, currentY + 4.3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    const methodStr = asp.methodOfMeasurement.length > 58 ? asp.methodOfMeasurement.slice(0, 56) + '...' : asp.methodOfMeasurement;
    doc.text(methodStr, 84, currentY + 4.3);

    // Impact Badge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    if (asp.impact === 'Critical') {
      doc.setTextColor(185, 28, 28);
    } else {
      doc.setTextColor(192, 151, 72);
    }
    doc.text(asp.impact, 169, currentY + 4.3, { align: 'center' });

    // Result Badge
    const isPass = String(asp.result).toLowerCase().includes('pass');
    if (isPass) {
      doc.setTextColor(16, 116, 55);
    } else {
      doc.setTextColor(220, 38, 38);
    }
    doc.text(String(asp.result), 187, currentY + 4.3, { align: 'center' });

    currentY += 6.2;
  });

  // Draw Vertical lines for Table 2
  doc.setDrawColor(...TABLE_BORDER_COLOR);
  doc.setLineWidth(TABLE_LINE_WIDTH);
  aspColX.forEach(x => {
    doc.line(x, aspTableStartY, x, currentY);
  });

  currentY += 16; // 3x Generous Spacing between Table 2 and Table 3

  // =========================================================================
  // TABLE 3: SAMPLING QUANTITY & REJECTION BREAKDOWN (SMART BALANCED COLUMNS)
  // =========================================================================
  checkPageOverflow(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(23, 25, 28);
  doc.text('3. SAMPLING QUANTITY & REJECTION BREAKDOWN', 14, currentY);

  currentY += 4.5;
  const sampleStartY = currentY;
  // Smartly sized center 4 columns: Material (54mm), Sample (24mm), Pass (21mm), Reject (21mm), Rej% (19mm), Defect Obs (43mm)
  const sampleColX = [14, 68, 92, 113, 134, 153, 196];

  doc.setFillColor(242, 242, 243);
  doc.rect(14, currentY, 182, 6.2, 'F');
  doc.setDrawColor(...TABLE_BORDER_COLOR);
  doc.setLineWidth(TABLE_LINE_WIDTH);
  doc.line(14, currentY, 196, currentY);
  doc.line(14, currentY + 6.2, 196, currentY + 6.2);

  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(23, 25, 28);
  doc.text('MATERIAL / ITEM', 16, currentY + 4.3);
  doc.text('SAMPLE SIZE', 80, currentY + 4.3, { align: 'center' });
  doc.text('PASS QTY', 102.5, currentY + 4.3, { align: 'center' });
  doc.text('REJECT QTY', 123.5, currentY + 4.3, { align: 'center' });
  doc.text('REJECT %', 143.5, currentY + 4.3, { align: 'center' });
  doc.text('DEFECT OBSERVATION', 155, currentY + 4.3);

  currentY += 6.2;

  let totSample = 0;
  let totPass = 0;
  let totReject = 0;

  rawItems.forEach((item, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 250, isEven ? 255 : 250, isEven ? 255 : 251);
    doc.rect(14, currentY, 182, 6.2, 'F');
    doc.setDrawColor(...TABLE_BORDER_COLOR);
    doc.setLineWidth(TABLE_LINE_WIDTH);
    doc.line(14, currentY + 6.2, 196, currentY + 6.2);

    const sSize = item.sampleSize || Math.min(item.actualQty || 1000, Math.max(5, Math.round((item.actualQty || 1000) * 0.20)));
    const rQty = item.rejectQty || 0;
    const pQty = item.passQty !== undefined ? item.passQty : Math.max(0, sSize - rQty);
    const rPct = item.rejectionPercent !== undefined ? item.rejectionPercent : Number(((rQty / sSize) * 100).toFixed(1));

    totSample += sSize;
    totPass += pQty;
    totReject += rQty;

    // Normal text for material name, not bold/capital
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(23, 25, 28);
    const cleanName = cleanMaterialName(item.materialName);
    const mName = cleanName.length > 32 ? cleanName.slice(0, 30) + '...' : cleanName;
    doc.text(mName, 16, currentY + 4.3);

    doc.text(`${sSize} ${item.unit || primaryUom}`, 80, currentY + 4.3, { align: 'center' });

    doc.setTextColor(16, 116, 55);
    doc.text(`${pQty}`, 102.5, currentY + 4.3, { align: 'center' });

    if (rQty > 0) {
      doc.setTextColor(220, 38, 38);
    } else {
      doc.setTextColor(23, 25, 28);
    }
    doc.text(`${rQty}`, 123.5, currentY + 4.3, { align: 'center' });

    doc.setTextColor(23, 25, 28);
    doc.text(`${rPct}%`, 143.5, currentY + 4.3, { align: 'center' });

    doc.setFontSize(6.5);
    const dDetail = sanitizePdfText(item.defectDetail || (rQty === 0 ? 'Nil - All parts pass visual & physical checks' : 'Defect noted'));
    doc.text(dDetail.length > 36 ? dDetail.slice(0, 34) + '...' : dDetail, 155, currentY + 4.3);

    currentY += 6.2;
  });

  // Table 3 Summary Total Row (if > 1 item)
  if (rawItems.length > 1) {
    doc.setFillColor(215, 220, 228);
    doc.rect(14, currentY, 182, 6.5, 'F');
    doc.setDrawColor(...TABLE_BORDER_COLOR);
    doc.setLineWidth(TABLE_LINE_WIDTH);
    doc.line(14, currentY + 6.5, 196, currentY + 6.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.0);
    doc.setTextColor(15, 18, 22);
    doc.text('TOTAL / OVERALL SAMPLING:', 16, currentY + 4.4);
    doc.text(String(totSample), 80, currentY + 4.4, { align: 'center' });

    doc.setTextColor(16, 116, 55);
    doc.text(String(totPass), 102.5, currentY + 4.4, { align: 'center' });

    if (totReject > 0) {
      doc.setTextColor(220, 38, 38);
      doc.text(String(totReject), 123.5, currentY + 4.4, { align: 'center' });
    } else {
      doc.setTextColor(23, 25, 28);
      doc.text(String(totReject), 123.5, currentY + 4.4, { align: 'center' });
    }

    const overallPct = totSample > 0 ? Number(((totReject / totSample) * 100).toFixed(1)) : 0;
    doc.setTextColor(23, 25, 28);
    doc.text(`${overallPct}%`, 143.5, currentY + 4.4, { align: 'center' });

    doc.setFontSize(6.5);
    const sumNote = totReject === 0 ? 'Compliant' : `${totReject} rejects`;
    doc.text(sumNote, 155, currentY + 4.4);

    currentY += 6.5;
  }

  // Draw Vertical lines for Table 3
  doc.setDrawColor(...TABLE_BORDER_COLOR);
  doc.setLineWidth(TABLE_LINE_WIDTH);
  sampleColX.forEach(x => {
    doc.line(x, sampleStartY, x, currentY);
  });

  currentY += 16; // 3x Generous Spacing between Table 3 and Section 4

  // =========================================================================
  // SECTION 4: CAPA & QUALITY DISPOSITION BLOCK (DYNAMIC MULTI-LINE PARAGRAPHS)
  // =========================================================================
  const rootText = record.rootCause || 'N/A - Material compliant with PaintKing specifications';
  const corrText = record.correctiveAction || 'N/A - Direct release to primer/basecoat production queue';
  const prevText = record.preventiveAction || 'Standard supplier handling & transit protocols followed';
  const dispText = `[${(record.status || 'Accepted').toUpperCase()}] ${record.remarks || 'Material meets all quality specs. Approved for production issue.'}`;

  const textWrapWidth = 136; // Width available from x=55 to right border
  const rootLines = doc.splitTextToSize(rootText, textWrapWidth);
  const corrLines = doc.splitTextToSize(corrText, textWrapWidth);
  const prevLines = doc.splitTextToSize(prevText, textWrapWidth);
  const dispLines = doc.splitTextToSize(dispText, textWrapWidth);

  const getSectionHeight = (lines: string[]) => Math.max(1, lines.length) * 3.4 + 2.2;
  const hRoot = getSectionHeight(rootLines);
  const hCorr = getSectionHeight(corrLines);
  const hPrev = getSectionHeight(prevLines);
  const hDisp = getSectionHeight(dispLines);

  const capaBoxHeight = hRoot + hCorr + hPrev + hDisp + 4.0;

  // Check if CAPA Box + Sign-off fits or needs to overflow
  checkPageOverflow(capaBoxHeight + 24);

  doc.setDrawColor(220, 222, 228);
  doc.setFillColor(250, 250, 251);
  doc.roundedRect(14, currentY, 182, capaBoxHeight, 2.5, 2.5, 'FD');

  let rowY = currentY + 4.8;

  // Row 1: Root Cause
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(119, 123, 134);
  doc.text('ROOT CAUSE:', 18, rowY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.0);
  doc.setTextColor(23, 25, 28);
  doc.text(rootLines, 55, rowY);
  rowY += hRoot;

  // Row 2: Corrective Action
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(119, 123, 134);
  doc.text('CORRECTIVE ACTION:', 18, rowY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.0);
  doc.setTextColor(23, 25, 28);
  doc.text(corrLines, 55, rowY);
  rowY += hCorr;

  // Row 3: Preventive Action
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(119, 123, 134);
  doc.text('PREVENTIVE ACTION:', 18, rowY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.0);
  doc.setTextColor(23, 25, 28);
  doc.text(prevLines, 55, rowY);
  rowY += hPrev;

  // Row 4: Remarks / Disposition
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(119, 123, 134);
  doc.text('REMARKS / DISPOSITION:', 18, rowY);
  
  const isAccepted = record.status === 'Accepted';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.0);
  doc.setTextColor(isAccepted ? 16 : 220, isAccepted ? 116 : 38, isAccepted ? 55 : 38);
  doc.text(dispLines, 55, rowY);

  currentY += capaBoxHeight + 8.0;

  // =========================================================================
  // SECTION 5: AUTHORIZED SIGN-OFF BLOCK
  // =========================================================================
  checkPageOverflow(24);
  doc.setDrawColor(220, 222, 228);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, currentY, 182, 19, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(119, 123, 134);
  doc.text('PREPARED BY (IQC INSPECTOR):', 20, currentY + 5.2);
  doc.text('VERIFIED BY (PRODUCTION / QA MANAGER):', 110, currentY + 5.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.0);
  doc.setTextColor(23, 25, 28);
  doc.text(record.preparedBy || record.inspector || 'Manoj Tiwari (IQC Inspector)', 20, currentY + 11.0);
  doc.text(record.verifiedBy || 'Sanjay Rawat (Production Manager)', 110, currentY + 11.0);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(119, 123, 134);
  doc.text('Signature & Official Stamp Verified', 20, currentY + 15.8);
  doc.text('Approved for Job Card Ingestion', 110, currentY + 15.8);

  // Standard Footer on All Pages (Matching Inward Gate Pass Standard)
  const totalPages = doc.getNumberOfPages();
  const liveTimestamp = record.generatedTimestamp || new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const hasNext = p < totalPages;
    drawStandardPdfFooter(
      doc,
      p,
      totalPages,
      'PAINTKING • Incoming Quality Inspection Report',
      liveTimestamp,
      hasNext
    );
  }

  doc.save(`PaintKing_IQC_Report_${record.reportNo}.pdf`);
};

/**
 * Standard Goods Received Note (DOC NO: 00 • Rev.00)
 * Formatted using PaintKing's official Editorial Industrial Luxury design system
 */
export const downloadStandardGRNPdf = (grn: GoodsReceiptNote): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // 1. Standard Header with official Logo & Company Details
  const startY = drawStandardPdfHeader(doc);

  // 2. Document Title & Control Strip
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(23, 25, 28);
  doc.text('GOODS RECEIVED NOTE (GRN) • STORE INTAKE', 14, startY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(119, 123, 134);
  doc.text(`Doc: ${grn.docNo || 'DOC NO: 00'}  |  Rev: ${grn.revNo || '00'}  |  Date: ${grn.revDate || '2026-08-01'}`, 196, startY + 5, { align: 'right' });

  // 3. Section 1: Inward & Vehicle Metadata Grid (3 Structured Rows matching Gate/IQC Standard)
  const metaY = startY + 8;
  doc.setDrawColor(220, 222, 228);
  doc.setFillColor(250, 250, 251);
  doc.roundedRect(14, metaY, 182, 44, 3, 3, 'FD');

  const metaCol1X = 20;
  const metaCol2X = 80;
  const metaCol3X = 140;

  // Helper to draw clean standardized label-value pairs with exact typographic hierarchy
  const drawMetaField = (
    label: string,
    value: string,
    x: number,
    labelY: number,
    valueY: number,
    maxWidth: number = 52
  ) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.0);
    doc.setTextColor(23, 25, 28);
    doc.text(label, x, labelY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.0);
    doc.setTextColor(100, 105, 115);

    const cleanVal = (value || '-').trim();
    const allLines: string[] = doc.splitTextToSize(cleanVal, maxWidth);

    if (allLines.length <= 1) {
      doc.text(allLines[0] || '-', x, valueY);
    } else if (allLines.length === 2) {
      doc.text(allLines[0], x, valueY - 1.2);
      doc.text(allLines[1], x, valueY + 2.2);
    } else {
      doc.text(allLines[0], x, valueY - 1.2);
      let line2 = allLines[1];
      while (line2.length > 0 && doc.getTextWidth(line2 + '...') > maxWidth) {
        line2 = line2.slice(0, -1);
      }
      doc.text(line2 + '...', x, valueY + 2.2);
    }
  };

  // Row 1: GRN NUMBER | GRN DATE | INWARD RECEIVE DATE
  drawMetaField('GRN NUMBER', grn.grnNo, metaCol1X, metaY + 5.5, metaY + 11.0, 54);
  drawMetaField('GRN DATE', formatDateDDMMYYYY(grn.date), metaCol2X, metaY + 5.5, metaY + 11.0, 54);
  drawMetaField('INWARD RECEIVE DATE', formatDateDDMMYYYY(grn.receivedDate || grn.date), metaCol3X, metaY + 5.5, metaY + 11.0, 48);

  // Row 2: CHALLAN / DC NUMBER | NAME OF PARTY / VENDOR | CHALLAN DATE
  drawMetaField('CHALLAN / DC NUMBER', grn.invoiceChallanNo || '-', metaCol1X, metaY + 18.5, metaY + 24.0, 54);
  drawMetaField('NAME OF PARTY / VENDOR', grn.supplierCustomer || '-', metaCol2X, metaY + 18.5, metaY + 24.0, 54);
  drawMetaField('CHALLAN DATE', formatDateDDMMYYYY(grn.invoiceDate || grn.date), metaCol3X, metaY + 18.5, metaY + 24.0, 48);

  // Row 3: VEHICLE NUMBER | TRANSPORTER NAME | IQC INSPECTION REF
  drawMetaField('VEHICLE NUMBER', grn.vehicleNo || '-', metaCol1X, metaY + 31.5, metaY + 37.0, 54);
  drawMetaField('TRANSPORTER NAME', grn.transporter || 'Direct Delivery', metaCol2X, metaY + 31.5, metaY + 37.0, 54);
  drawMetaField('IQC INSPECTION REF', grn.sourceIqcReportNo || 'IQC-PASSED', metaCol3X, metaY + 31.5, metaY + 37.0, 48);

  // 4. Section 2: Material Items Verification Table (with Multi-Page Pagination)
  let currentY = metaY + 44 + 8;
  const colX = [14, 40, 96, 116, 134, 152, 175, 196]; // Balanced column boundaries
  const TABLE_BORDER_COLOR = [180, 185, 195] as const;
  const TABLE_LINE_WIDTH = 0.45;
  const ROW_HEIGHT = 7.0;
  const HEADER_HEIGHT = 7.0;
  const FOOTER_RESERVED_Y = 275;
  const SIGNATURE_BLOCK_HEIGHT = 36;

  const drawGrnTableHeader = (y: number) => {
    doc.setFillColor(242, 242, 243); // Clean light grey #f2f2f3
    doc.rect(14, y, 182, HEADER_HEIGHT, 'F');
    doc.setDrawColor(...TABLE_BORDER_COLOR);
    doc.setLineWidth(TABLE_LINE_WIDTH);
    doc.line(14, y, 196, y);
    doc.line(14, y + HEADER_HEIGHT, 196, y + HEADER_HEIGHT);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(23, 25, 28);
    doc.text('PART CODE', 17, y + 4.8);
    doc.text('PART DESCRIPTION', 43, y + 4.8);
    doc.text('INVOICED', 106, y + 4.8, { align: 'center' });
    doc.text('OK (IQC)', 125, y + 4.8, { align: 'center' });
    doc.text('REJ (IQC)', 143, y + 4.8, { align: 'center' });
    doc.text('ACTUAL (STORE)', 163.5, y + 4.8, { align: 'center' });
    doc.text('SHORT/EXCESS', 185.5, y + 4.8, { align: 'center' });
  };

  const drawGrnTableVerticalLines = (startY: number, endY: number, hasTotalRow: boolean = false, totalRowStartY?: number) => {
    doc.setDrawColor(...TABLE_BORDER_COLOR);
    doc.setLineWidth(TABLE_LINE_WIDTH);

    // 1. Outer Left and Right Boundaries
    doc.line(14, startY, 14, endY);
    doc.line(196, startY, 196, endY);

    // 2. Col 1 Divider (x = 40 between Part Code & Description)
    // Stops at totalRowStartY so it NEVER cuts through 'TOTAL STORE INTAKE:'
    const col1DividerEndY = (hasTotalRow && totalRowStartY !== undefined) ? totalRowStartY : endY;
    doc.line(40, startY, 40, col1DividerEndY);

    // 3. Numeric Column Dividers (run full height across data rows and total row)
    [96, 116, 134, 152, 175].forEach(x => {
      doc.line(x, startY, x, endY);
    });
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(23, 25, 28);
  doc.text('LINE ITEMS INTAKE & QUANTITY VERIFICATION (VERIFIED FROM IQC)', 14, currentY);

  currentY += 3.5;
  let pageTableStartY = currentY;
  drawGrnTableHeader(currentY);
  currentY += HEADER_HEIGHT;

  const rawItems = (grn.items && grn.items.length > 0)
    ? grn.items
    : [{
        partCode: grn.partCode || 'SUBSTRATE-01',
        partDescription: grn.description || 'Raw Components Substrate',
        invoicedQty: Number(grn.invoicedQty) || Number(grn.totalQty) || 1000,
        actualReceivedQty: Number(grn.actualReceivedQty) || Number(grn.totalQty) || 1000,
        shortExcessQty: (Number(grn.actualReceivedQty) || Number(grn.totalQty) || 1000) - (Number(grn.invoicedQty) || 1000),
        okByIqcQty: Number(grn.actualReceivedQty) || Number(grn.totalQty) || 1000,
        rejectionQty: 0,
        remark: 'IQC Inspection Passed'
      }];

  let sumInvoiced = 0;
  let sumOkIqc = 0;
  let sumRej = 0;
  let sumActual = 0;
  let sumShortExcess = 0;

  rawItems.forEach((item, idx) => {
    // If next row exceeds page limit, close current table page and start a new page
    if (currentY + ROW_HEIGHT > FOOTER_RESERVED_Y) {
      drawGrnTableVerticalLines(pageTableStartY, currentY, false);
      doc.addPage();
      const nextStartY = drawStandardPdfHeader(doc);

      currentY = nextStartY + 6;
      pageTableStartY = currentY;
      drawGrnTableHeader(currentY);
      currentY += HEADER_HEIGHT;
    }

    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 250, isEven ? 255 : 250, isEven ? 255 : 251);
    doc.rect(14, currentY, 182, ROW_HEIGHT, 'F');

    doc.setDrawColor(...TABLE_BORDER_COLOR);
    doc.setLineWidth(TABLE_LINE_WIDTH);
    doc.line(14, currentY + ROW_HEIGHT, 196, currentY + ROW_HEIGHT);

    const invQ = Number(item.invoicedQty) || 0;
    const okQ = item.okByIqcQty !== undefined ? Number(item.okByIqcQty) : (Number(item.actualReceivedQty) || 0);
    const rejQ = Number(item.rejectionQty) || 0;
    const actQ = Number(item.actualReceivedQty) || 0;
    const diffQ = item.shortExcessQty !== undefined ? Number(item.shortExcessQty) : (actQ - invQ);

    sumInvoiced += invQ;
    sumOkIqc += okQ;
    sumRej += rejQ;
    sumActual += actQ;
    sumShortExcess += diffQ;

    // Part Code (Normal Regular Charcoal Text)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.0);
    doc.setTextColor(23, 25, 28);
    doc.text(item.partCode || 'SUBSTRATE', 17, currentY + 4.8);

    // Part Description
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(23, 25, 28);
    const descText = (item.partDescription || '-').length > 34 ? (item.partDescription || '-').slice(0, 32) + '...' : (item.partDescription || '-');
    doc.text(descText, 43, currentY + 4.8);

    // Invoiced Qty
    doc.text(String(invQ), 106, currentY + 4.8, { align: 'center' });

    // Ok By IQC (Green)
    doc.setTextColor(16, 116, 55);
    doc.text(String(okQ), 125, currentY + 4.8, { align: 'center' });

    // Rej Qty (Red or Grey)
    if (rejQ > 0) {
      doc.setTextColor(220, 38, 38);
    } else {
      doc.setTextColor(119, 123, 134);
    }
    doc.text(String(rejQ), 143, currentY + 4.8, { align: 'center' });

    // Actual Received into Store (Bold Charcoal)
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(23, 25, 28);
    doc.text(String(actQ), 163.5, currentY + 4.8, { align: 'center' });

    // Short/Excess
    doc.setFont('helvetica', 'normal');
    if (diffQ < 0) {
      doc.setTextColor(220, 38, 38);
      doc.text(String(diffQ), 185.5, currentY + 4.8, { align: 'center' });
    } else if (diffQ > 0) {
      doc.setTextColor(30, 64, 175);
      doc.text(`+${diffQ}`, 185.5, currentY + 4.8, { align: 'center' });
    } else {
      doc.setTextColor(16, 116, 55);
      doc.text('0 (Match)', 185.5, currentY + 4.8, { align: 'center' });
    }

    currentY += ROW_HEIGHT;
  });

  // Check if Total Summary Row fits on this page
  if (currentY + 7.5 > FOOTER_RESERVED_Y) {
    drawGrnTableVerticalLines(pageTableStartY, currentY, false);
    doc.addPage();
    const nextStartY = drawStandardPdfHeader(doc);
    currentY = nextStartY + 6;
    pageTableStartY = currentY;
    drawGrnTableHeader(currentY);
    currentY += HEADER_HEIGHT;
  }

  const totalRowStartY = currentY;

  // Total Summary Row with distinct clean light grey background
  doc.setFillColor(242, 242, 243);
  doc.rect(14, currentY, 182, 7.5, 'F');
  doc.setDrawColor(...TABLE_BORDER_COLOR);
  doc.setLineWidth(TABLE_LINE_WIDTH);
  doc.line(14, currentY + 7.5, 196, currentY + 7.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(15, 18, 22);
  doc.text('TOTAL STORE INTAKE:', 17, currentY + 5.0);
  doc.text(String(sumInvoiced), 106, currentY + 5.0, { align: 'center' });
  doc.setTextColor(16, 116, 55);
  doc.text(String(sumOkIqc), 125, currentY + 5.0, { align: 'center' });
  doc.setTextColor(sumRej > 0 ? 220 : 119, sumRej > 0 ? 38 : 123, sumRej > 0 ? 38 : 134);
  doc.text(String(sumRej), 143, currentY + 5.0, { align: 'center' });
  doc.setTextColor(15, 18, 22);
  doc.text(`${sumActual} Pcs`, 163.5, currentY + 5.0, { align: 'center' });
  doc.text(sumShortExcess > 0 ? `+${sumShortExcess}` : String(sumShortExcess), 185.5, currentY + 5.0, { align: 'center' });

  currentY += 7.5;

  // Draw Vertical Lines for the final table segment (stopping the col1 divider before the total row)
  drawGrnTableVerticalLines(pageTableStartY, currentY, true, totalRowStartY);

  // 5. Section 3: Official Signatures Block (3 Columns)
  if (currentY + SIGNATURE_BLOCK_HEIGHT > FOOTER_RESERVED_Y) {
    doc.addPage();
    const nextStartY = drawStandardPdfHeader(doc);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(23, 25, 28);
    doc.text(`GOODS RECEIVED NOTE (GRN) • SIGNATURES (REF: ${grn.grnNo})`, 14, nextStartY + 5);
    currentY = nextStartY + 10;
  } else {
    currentY += 8;
  }

  doc.setDrawColor(220, 222, 228);
  doc.setFillColor(250, 250, 251);
  doc.roundedRect(14, currentY, 182, 24, 2.5, 2.5, 'FD');

  const sigCol1X = 18;
  const sigCol2X = 80;
  const sigCol3X = 142;

  // Titles
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(119, 123, 134);
  doc.text('STORE INCHARGE (RECEIVER):', sigCol1X, currentY + 5.5);
  doc.text('QUALITY APPROVED (IQC LEAD):', sigCol2X, currentY + 5.5);
  doc.text('APPROVED BY (PLANT HEAD):', sigCol3X, currentY + 5.5);

  // Names
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(23, 25, 28);
  doc.text(grn.storeIncharge || 'Manoj Tiwari (Stores)', sigCol1X, currentY + 12);
  doc.text(grn.qualityApprovedBy || 'Amit Verma (QA Lead)', sigCol2X, currentY + 12);
  doc.text(grn.approvedBy || 'Satish Sharma (Plant Head)', sigCol3X, currentY + 12);

  // Subtitles / Stamps
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(119, 123, 134);
  doc.text('Physical Store Intake Verified', sigCol1X, currentY + 17.5);
  doc.text('Incoming IQC Inspection Passed', sigCol2X, currentY + 17.5);
  doc.text('Plant Inventory Ingestion Authorized', sigCol3X, currentY + 17.5);

  // 6. Standard Footer on All Pages with exact total pages & "Continued to Xth Page"
  const totalPages = doc.getNumberOfPages();
  const liveTimestamp = new Date().toLocaleString('en-IN');

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const hasNext = p < totalPages;
    drawStandardPdfFooter(
      doc,
      p,
      totalPages,
      'PAINTKING • Goods Received Note (DOC NO: 00 • Rev.00) • ISO 9001:2015 & IATF 16949 Certified',
      liveTimestamp,
      hasNext
    );
  }

  doc.save(`PaintKing_GRN_${grn.grnNo}.pdf`);
};

/**
 * =========================================================================
 * OFFICIAL FIRST PART APPROVAL (FPA) REPORT PDF (UNIVERSAL PAINTKING STANDARD)
 * Revamped into an editorial, spacious 2-page layout with generous whitespace,
 * clean table borders (0.45pt), #f2f2f3 headers, dedicated physical 3M tape frame,
 * CIELAB colorimetry analysis with Master Benchmark banner, and 4-party sign-offs.
 * Fixed text wrapping, column header spacing, and table vertical dividers.
 * Doc: PK-QA-FPA-001 | Issue Date: 01.01.2021 | Rev: 02 | Rev Date: 13.02.2021
 * =========================================================================
 */
export const downloadStandardFPAPdf = (fpa: FPARecord): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const TABLE_BORDER_COLOR = [180, 185, 195] as const;
  const TABLE_LINE_WIDTH = 0.45;
  const liveTimestamp = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const drawMetaField = (
    label: string,
    value: string,
    x: number,
    labelY: number,
    valueY: number,
    maxWidth: number = 52
  ) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(23, 25, 28);
    doc.text(label, x, labelY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(100, 105, 115);

    const cleanVal = (value || '-').trim();
    const allLines: string[] = doc.splitTextToSize(cleanVal, maxWidth);

    if (allLines.length <= 1) {
      doc.text(allLines[0] || '-', x, valueY);
    } else if (allLines.length === 2) {
      doc.text(allLines[0], x, valueY - 1.2);
      doc.text(allLines[1], x, valueY + 2.2);
    } else {
      doc.text(allLines[0], x, valueY - 1.2);
      let line2 = allLines[1];
      while (line2.length > 0 && doc.getTextWidth(line2 + '...') > maxWidth) {
        line2 = line2.slice(0, -1);
      }
      doc.text(line2 + '...', x, valueY + 2.2);
    }
  };

  // =========================================================================
  // PAGE 1: EXECUTIVE CLEARANCE, METADATA, VISUAL AND ADHESION INSPECTION
  // =========================================================================
  const startY = drawStandardPdfHeader(doc);

  // Title Banner and Control Bar
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(23, 25, 28);
  doc.text('FIRST PART APPROVAL (FPA) INSPECTION REPORT', 14, startY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(192, 151, 72);
  doc.text('QUALITY GATE 2: INITIAL SAMPLE RELEASE', 196, startY + 2.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(119, 123, 134);
  doc.text('Doc: PK-QA-FPA-001  |  Rev: 02  |  Date: 13.02.2021', 196, startY + 6.5, { align: 'right' });

  // 4-Row Structured Metadata Card (12 Dedicated Individual Fields, ZERO combined '&')
  const metaY = startY + 9.5;
  const metaBoxHeight = 52;
  doc.setDrawColor(220, 222, 228);
  doc.setFillColor(250, 250, 251);
  doc.roundedRect(14, metaY, 182, metaBoxHeight, 3, 3, 'FD');

  const metaCol1X = 20;
  const metaCol2X = 80;
  const metaCol3X = 140;

  // Row 1: REPORT NUMBER | JOB CARD NUMBER | WORK ORDER NUMBER
  drawMetaField('REPORT NUMBER', fpa.reportNo, metaCol1X, metaY + 4.8, metaY + 9.8, 54);
  drawMetaField('JOB CARD NUMBER', fpa.jobCardNo || '-', metaCol2X, metaY + 4.8, metaY + 9.8, 54);
  drawMetaField('WORK ORDER NUMBER', fpa.woNo || '-', metaCol3X, metaY + 4.8, metaY + 9.8, 50);

  // Row 2: CUSTOMER NAME | PART COMPONENT | PART CODE
  drawMetaField('CUSTOMER NAME', fpa.customer || 'OEM Partner', metaCol1X, metaY + 16.8, metaY + 21.8, 54);
  drawMetaField('PART COMPONENT', fpa.partDescription || fpa.partCode || 'Bezel Frame', metaCol2X, metaY + 16.8, metaY + 21.8, 54);
  drawMetaField('PART CODE', fpa.partCode || '-', metaCol3X, metaY + 16.8, metaY + 21.8, 50);

  // Row 3: PAINT BATCH NUMBER | THINNER BATCH NUMBER | PAINT VISCOSITY
  drawMetaField('PAINT BATCH NUMBER', fpa.paintBatch || '-', metaCol1X, metaY + 28.8, metaY + 33.8, 54);
  drawMetaField('THINNER BATCH NUMBER', fpa.thinnerBatch || '-', metaCol2X, metaY + 28.8, metaY + 33.8, 54);
  drawMetaField('PAINT VISCOSITY', `${fpa.viscositySec || 15} Sec (Ford Cup 4)`, metaCol3X, metaY + 28.8, metaY + 33.8, 50);

  // Row 4: SPRAY BOOTH | OPERATING PAINTER | AUDIT DATE AND TIME
  drawMetaField('SPRAY BOOTH', fpa.booth || 'Booth 01', metaCol1X, metaY + 40.8, metaY + 45.8, 54);
  drawMetaField('OPERATING PAINTER', fpa.painter || 'Ramesh Kumar', metaCol2X, metaY + 40.8, metaY + 45.8, 54);
  drawMetaField('AUDIT DATE AND TIME', `${formatDateDDMMYYYY(fpa.date)} (${fpa.approvalTime || fpa.startupTime || '09:15 AM'})`, metaCol3X, metaY + 40.8, metaY + 45.8, 50);

  let currentY = metaY + metaBoxHeight + 10; // 10mm Generous Negative Spacing

  // -------------------------------------------------------------------------
  // SECTION 1: VISUAL INSPECTION CHECKLIST (5 SAMPLES S1 - S5)
  // -------------------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(23, 25, 28);
  doc.text('1. VISUAL INSPECTION CHECKLIST (5 PRODUCTION SAMPLES: S1 - S5)', 14, currentY);
  currentY += 4.5;

  const visTableStartY = currentY;
  const visColX = [14, 24, 70, 110, 138, 196];
  const sampleSubColX = [138, 149.6, 161.2, 172.8, 184.4, 196];
  const sampleHeaders = ['S1', 'S2', 'S3', 'S4', 'S5'];

  // Table Header
  doc.setFillColor(242, 242, 243);
  doc.rect(14, currentY, 182, 8.5, 'F');
  doc.setDrawColor(...TABLE_BORDER_COLOR);
  doc.setLineWidth(TABLE_LINE_WIDTH);
  doc.line(14, currentY, 196, currentY);
  doc.line(14, currentY + 8.5, 196, currentY + 8.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(23, 25, 28);

  doc.text('SR.', 19, currentY + 5.2, { align: 'center' });
  doc.text('PARAMETERS', 26, currentY + 5.2);
  doc.text('SPECIFICATION', 72, currentY + 5.2);
  doc.text('METHOD / TECH', 112, currentY + 5.2);

  doc.text('FPA SAMPLES OBSERVATION (S1 - S5)', 167, currentY + 3.2, { align: 'center' });
  doc.line(138, currentY + 4.2, 196, currentY + 4.2);

  sampleHeaders.forEach((sh, sIdx) => {
    const subCenterX = sampleSubColX[sIdx] + (sampleSubColX[sIdx + 1] - sampleSubColX[sIdx]) / 2;
    doc.text(sh, subCenterX, currentY + 7.5, { align: 'center' });
  });

  currentY += 8.5;

  const visualParams = [
    { code: '1', name: 'Bubble / Blistering', spec: 'Zero Allowed (Nil)', tech: 'Visual / 10x Lens' },
    { code: '2', name: 'Dust Spot / Particle Nibs', spec: 'Zero Allowed (Nil)', tech: 'Visual Check' },
    { code: '3', name: 'Over Paint / Sagging / Runs', spec: 'Zero Allowed (Nil)', tech: 'Visual Inspection' },
    { code: '4', name: 'Paint Missing / Dry Spray', spec: 'Zero Allowed (Nil)', tech: 'Visual Inspection' },
    { code: '5', name: 'Colour Uniformity and Shade', spec: 'As per Approved Sample', tech: 'Visual Comparison' },
    { code: '6', name: 'Overall Surface Finishing', spec: 'Defect-Free Class A', tech: 'Visual / Tactile' }
  ];

  visualParams.forEach((vp, vpIdx) => {
    const isEven = vpIdx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 250, isEven ? 255 : 250, isEven ? 255 : 251);
    doc.rect(14, currentY, 182, 5.8, 'F');
    doc.setDrawColor(...TABLE_BORDER_COLOR);
    doc.setLineWidth(TABLE_LINE_WIDTH);
    doc.line(14, currentY + 5.8, 196, currentY + 5.8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(23, 25, 28);
    doc.text(vp.code, 19, currentY + 3.9, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.text(vp.name, 26, currentY + 3.9);
    doc.text(vp.spec, 72, currentY + 3.9);
    doc.text(vp.tech, 112, currentY + 3.9);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 116, 55);
    sampleHeaders.forEach((_, sIdx) => {
      const subCenterX = sampleSubColX[sIdx] + (sampleSubColX[sIdx + 1] - sampleSubColX[sIdx]) / 2;
      doc.text('OK', subCenterX, currentY + 3.9, { align: 'center' });
    });

    currentY += 5.8;
  });

  // Draw Vertical lines for Table 1
  doc.setDrawColor(...TABLE_BORDER_COLOR);
  doc.setLineWidth(TABLE_LINE_WIDTH);
  visColX.forEach(x => {
    doc.line(x, visTableStartY, x, currentY);
  });
  sampleSubColX.slice(1, -1).forEach(x => {
    doc.line(x, visTableStartY + 4.2, x, currentY);
  });

  currentY += 10; // 10mm Generous Negative Spacing

  // -------------------------------------------------------------------------
  // SECTION 2: ADHESION TEST - PHYSICAL TAPE IMPRESSION BOX (ASTM 5B)
  // -------------------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(23, 25, 28);
  doc.text('2. COATING ADHESION TEST - PHYSICAL 3M TAPE SPECIMEN (ASTM D3359 / IS 101)', 14, currentY);
  currentY += 4.5;

  const adhCardHeight = 44;
  const isOk = fpa.adhesionPercent === 100 && fpa.crossCutTest === 'Pass';

  // Left Box: Technical Specifications (Width = 88mm, x: 14 to 102)
  doc.setDrawColor(220, 222, 228);
  doc.setFillColor(250, 250, 251);
  doc.roundedRect(14, currentY, 88, adhCardHeight, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(23, 25, 28);
  doc.text('CROSS-CUT ADHESION EVALUATION:', 18, currentY + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.0);
  doc.setTextColor(100, 105, 115);
  doc.text('Method / Tool:', 18, currentY + 13.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(23, 25, 28);
  doc.text('1mm Lattice Cutter + 3M #600 Tape', 42, currentY + 13.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 105, 115);
  doc.text('Standard Spec:', 18, currentY + 19.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(23, 25, 28);
  doc.text('100% Lattice Retention (0% Flaking)', 42, currentY + 19.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 105, 115);
  doc.text('ASTM Rating:', 18, currentY + 25.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(23, 25, 28);
  doc.text('Class 5B (Superior Substrate Bonding)', 42, currentY + 25.5);

  // Status Badge inside Left Box (Clean Standard Portal Theme, No Green / Artifacts)
  const badgeY = currentY + 31;
  doc.setFillColor(242, 242, 243);
  doc.setDrawColor(200, 205, 215);
  doc.roundedRect(18, badgeY, 80, 8, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(23, 25, 28);
  doc.text(
    isOk ? '100% ADHESION COMPLIANT (5B PASS)' : 'ADHESION FAILED (REJECT)',
    58,
    badgeY + 5.2,
    { align: 'center' }
  );

  // Right Box: Physical 3M Tape Sticking Zone (Width = 90mm, x: 106 to 196)
  const tapeFrameX = 106;
  const tapeFrameW = 90;
  doc.setDrawColor(160, 165, 175);
  doc.setLineWidth(0.5);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(tapeFrameX, currentY, tapeFrameW, adhCardHeight, 3, 3, 'FD');

  // Inner dashed outline for physical tape adherence
  doc.setDrawColor(190, 195, 205);
  doc.rect(tapeFrameX + 4, currentY + 4, tapeFrameW - 8, adhCardHeight - 8, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(70, 75, 85);
  doc.text('PHYSICAL TAPE IMPRESSION SPECIMEN', tapeFrameX + tapeFrameW / 2, currentY + 15, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(120, 125, 135);
  doc.text('[ AFFIX PEELED 3M #600 TAPE HERE ]', tapeFrameX + tapeFrameW / 2, currentY + 22, { align: 'center' });
  doc.text('Mandatory: Stick physical tape swatch after cross-cut pull test.', tapeFrameX + tapeFrameW / 2, currentY + 32, { align: 'center' });

  // Page 1 Footer
  drawStandardPdfFooter(
    doc,
    1,
    2,
    'PAINTKING • First Part Approval (Doc: PK-QA-FPA-001 • Rev.02) • ISO 9001:2015 and IATF 16949 Certified',
    liveTimestamp,
    true
  );

  // =========================================================================
  // PAGE 2: SPECTROPHOTOMETER ANALYSIS, QA DISPOSITION & SIGN-OFF
  // =========================================================================
  doc.addPage();
  const page2StartY = drawStandardPdfHeader(doc);

  // Page 2 Control Info Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(192, 151, 72);
  doc.text(`FPA REPORT: ${fpa.reportNo}`, 196, page2StartY + 2.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(119, 123, 134);
  doc.text(`Job Card: ${fpa.jobCardNo || '-'}  |  WO: ${fpa.woNo || '-'}`, 196, page2StartY + 6.5, { align: 'right' });

  let p2Y = page2StartY + 10;

  // -------------------------------------------------------------------------
  // SECTION 3: SPECTROPHOTOMETER COLORIMETRIC ANALYSIS
  // -------------------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(23, 25, 28);
  doc.text('3. SPECTROPHOTOMETER COLORIMETRIC ANALYSIS', 14, p2Y);
  p2Y += 4.5;

  const defaultL = (fpa.L !== undefined ? fpa.L : 42.15).toFixed(2);
  const defaultA = (fpa.a !== undefined ? fpa.a : 54.30).toFixed(2);
  const defaultB = (fpa.b !== undefined ? fpa.b : 28.10).toFixed(2);
  const defaultDeltaE = (fpa.deltaE !== undefined ? fpa.deltaE : 0.38).toFixed(2);
  const deltaLimit = fpa.deltaToleranceLimit !== undefined ? Number(fpa.deltaToleranceLimit) : 0.70;
  const isDeltaEPass = (fpa.deltaE !== undefined ? Number(fpa.deltaE) : 0.38) <= deltaLimit;

  const masterL = String(fpa.masterLab?.masterL ?? fpa.masterL ?? '42.00');
  const masterA = String(fpa.masterLab?.masterA ?? fpa.masterA ?? '54.00');
  const masterB = String(fpa.masterLab?.masterB ?? fpa.masterB ?? '28.00');
  const plaqueRef = fpa.masterLab?.masterPlaqueRef || 'Approved OEM Master Plaque Ref STD-01';

  // Master Benchmark Card
  const benchHeight = 16;
  doc.setDrawColor(220, 222, 228);
  doc.setFillColor(250, 250, 251);
  doc.roundedRect(14, p2Y, 182, benchHeight, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.0);
  doc.setTextColor(192, 151, 72);
  doc.text('MASTER TARGET REFERENCE:', 18, p2Y + 5.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(23, 25, 28);
  doc.text(`Master Plaque: `, 62, p2Y + 5.2);
  doc.setFont('helvetica', 'bold');
  doc.text(plaqueRef, 82, p2Y + 5.2);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 105, 115);
  doc.text(`Master L* = `, 18, p2Y + 11.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(23, 25, 28);
  doc.text(masterL, 34, p2Y + 11.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 105, 115);
  doc.text(`Master a* = `, 56, p2Y + 11.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(23, 25, 28);
  doc.text(masterA, 72, p2Y + 11.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 105, 115);
  doc.text(`Master b* = `, 94, p2Y + 11.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(23, 25, 28);
  doc.text(masterB, 110, p2Y + 11.5);

  doc.setFont('helvetica', 'bold');
  if (isDeltaEPass) {
    doc.setTextColor(16, 116, 55);
  } else {
    doc.setTextColor(220, 38, 38);
  }
  doc.text(`Tolerance Limit: Delta-E <= ${deltaLimit.toFixed(2)}`, 140, p2Y + 11.5);

  p2Y += benchHeight + 4.5;

  // 5-Sample Table for Spectrometer (Col X: 14, 24, 70, 110, 138, 149.6, 161.2, 172.8, 184.4, 196)
  const specTableStartY = p2Y;
  const specColX = [14, 24, 70, 110, 138, 149.6, 161.2, 172.8, 184.4, 196];
  const specSubColX = [138, 149.6, 161.2, 172.8, 184.4, 196];

  // Header Table 3
  doc.setFillColor(242, 242, 243);
  doc.rect(14, p2Y, 182, 6.8, 'F');
  doc.setDrawColor(...TABLE_BORDER_COLOR);
  doc.setLineWidth(TABLE_LINE_WIDTH);
  doc.line(14, p2Y, 196, p2Y);
  doc.line(14, p2Y + 6.8, 196, p2Y + 6.8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(23, 25, 28);

  doc.text('SR.', 19, p2Y + 4.6, { align: 'center' });
  doc.text('COLOR CHANNEL', 26, p2Y + 4.6);
  doc.text('MASTER TARGET / SPEC', 72, p2Y + 4.6);
  doc.text('METHOD', 112, p2Y + 4.6);

  sampleHeaders.forEach((sh, sIdx) => {
    const subCenterX = specSubColX[sIdx] + (specSubColX[sIdx + 1] - specSubColX[sIdx]) / 2;
    doc.text(sh, subCenterX, p2Y + 4.6, { align: 'center' });
  });

  p2Y += 6.8;

  const deltaRows = [
    {
      code: '1',
      param: 'L',
      spec: masterL,
      tech: 'Spectrometer',
      vals: fpa.deltaSamples?.L?.map(v => String(v)) || [defaultL, defaultL, defaultL, defaultL, defaultL]
    },
    {
      code: '2',
      param: 'a',
      spec: masterA,
      tech: 'Spectrometer',
      vals: fpa.deltaSamples?.a?.map(v => String(v)) || [defaultA, defaultA, defaultA, defaultA, defaultA]
    },
    {
      code: '3',
      param: 'b',
      spec: masterB,
      tech: 'Spectrometer',
      vals: fpa.deltaSamples?.b?.map(v => String(v)) || [defaultB, defaultB, defaultB, defaultB, defaultB]
    },
    {
      code: '4',
      param: 'Delta E',
      spec: `<= ${deltaLimit.toFixed(2)}`,
      tech: 'Spectrometer',
      vals: fpa.deltaSamples?.deltaE?.map(v => String(v)) || [defaultDeltaE, defaultDeltaE, defaultDeltaE, defaultDeltaE, defaultDeltaE]
    }
  ];

  deltaRows.forEach((dr, drIdx) => {
    const isEven = drIdx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 250, isEven ? 255 : 250, isEven ? 255 : 251);
    doc.rect(14, p2Y, 182, 5.8, 'F');
    doc.setDrawColor(...TABLE_BORDER_COLOR);
    doc.setLineWidth(TABLE_LINE_WIDTH);
    doc.line(14, p2Y + 5.8, 196, p2Y + 5.8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(23, 25, 28);
    doc.text(dr.code, 19, p2Y + 3.9, { align: 'center' });

    doc.text(dr.param, 26, p2Y + 3.9);
    doc.setFont('helvetica', 'normal');
    doc.text(dr.spec, 72, p2Y + 3.9);
    doc.text(dr.tech, 112, p2Y + 3.9);

    // Value in S1-S5
    doc.setFont('helvetica', 'bold');
    sampleHeaders.forEach((_, sIdx) => {
      const cellVal = dr.vals[sIdx] || '-';
      const numVal = parseFloat(cellVal);
      if (dr.code === '4') {
        if (!isNaN(numVal) && numVal <= deltaLimit) {
          doc.setTextColor(16, 116, 55);
        } else {
          doc.setTextColor(220, 38, 38);
        }
      } else {
        doc.setTextColor(23, 25, 28);
      }
      const subCenterX = specSubColX[sIdx] + (specSubColX[sIdx + 1] - specSubColX[sIdx]) / 2;
      doc.text(cellVal, subCenterX, p2Y + 3.9, { align: 'center' });
    });

    p2Y += 5.8;
  });

  // Draw Continuous Vertical Lines for Table 3 (Only through data rows, NOT cutting summary row)
  doc.setDrawColor(...TABLE_BORDER_COLOR);
  doc.setLineWidth(TABLE_LINE_WIDTH);
  specColX.forEach(x => {
    doc.line(x, specTableStartY, x, p2Y);
  });

  // Table 3 Summary Bar (Clean full-width bar with center divider only at 110)
  doc.setFillColor(215, 220, 228);
  doc.rect(14, p2Y, 182, 6.5, 'F');
  doc.setDrawColor(...TABLE_BORDER_COLOR);
  doc.setLineWidth(TABLE_LINE_WIDTH);
  doc.line(14, p2Y + 6.5, 196, p2Y + 6.5);
  doc.line(14, p2Y, 14, p2Y + 6.5);
  doc.line(196, p2Y, 196, p2Y + 6.5);
  doc.line(110, p2Y, 110, p2Y + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.0);
  doc.setTextColor(15, 18, 22);
  doc.text('CONSOLIDATED COLOR CONFORMANCE:', 26, p2Y + 4.4);
  if (isDeltaEPass) {
    doc.setTextColor(16, 116, 55);
    doc.text(`Delta-E ${defaultDeltaE} • 100% WITHIN OEM COLOR TOLERANCE (PASS)`, 114, p2Y + 4.4);
  } else {
    doc.setTextColor(220, 38, 38);
    doc.text(`Delta-E ${defaultDeltaE} • OUT OF COLOR TOLERANCE (FAIL)`, 114, p2Y + 4.4);
  }

  p2Y += 6.5;

  p2Y += 10; // 10mm Generous Negative Spacing

  // -------------------------------------------------------------------------
  // SECTION 4: QUALITY ENGINEER REMARKS - MANDATORY BENCHMARK PROTOCOL
  // Fixed multi-line text wrapping with splitTextToSize so text never overflows
  // -------------------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(23, 25, 28);
  doc.text('4. QUALITY ENGINEER REMARKS - MANDATORY FLOOR BENCHMARK PROTOCOL', 14, p2Y);
  p2Y += 4.5;

  const rawRemarks = fpa.remarks || 'Visual 5/5 OK, Cross-Cut 100% adhesion verified, Spectrometer Delta-E <= 0.70 across all 5 samples vs Master Plaque. Approved for production.';
  const sanitizedRemarks = rawRemarks
    .replace(/[\u201C\u201D"]/g, '')
    .replace(/[\u0394\u2206]/g, 'Delta-')
    .replace(/[\u2264]/g, '<=')
    .replace(/[\u2265]/g, '>=')
    .replace(/&/g, 'and')
    .replace(/\s+/g, ' ')
    .trim();

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.0);
  const remarkLines: string[] = doc.splitTextToSize(sanitizedRemarks, 172);

  const rawProtocol = 'Upon First Part Approval (FPA), 1 master-verified golden sample is physically handed over to the Booth Painter and Shift Supervisor to serve as the visual and physical benchmark standard throughout mass production.';
  const sanitizedProtocol = rawProtocol.replace(/&/g, 'and').replace(/\s+/g, ' ').trim();
  const protocolLines: string[] = doc.splitTextToSize(sanitizedProtocol, 172);

  const sec4BoxHeight = Math.max(30, 14 + remarkLines.length * 3.8 + 8 + protocolLines.length * 3.6);
  doc.setDrawColor(220, 222, 228);
  doc.setFillColor(250, 250, 251);
  doc.roundedRect(14, p2Y, 182, sec4BoxHeight, 3, 3, 'FD');

  let sec4TextY = p2Y + 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.0);
  doc.setTextColor(23, 25, 28);
  doc.text('QA DISPOSITION - LAB SUMMARY:', 18, sec4TextY);
  sec4TextY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.0);
  doc.setTextColor(70, 75, 85);
  doc.text(remarkLines, 18, sec4TextY);
  sec4TextY += remarkLines.length * 3.8 + 2.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(180, 115, 25);
  doc.text('MANDATORY PRODUCTION LINE PROTOCOL:', 18, sec4TextY);
  sec4TextY += 4.0;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(90, 95, 105);
  doc.text(protocolLines, 18, sec4TextY);

  p2Y += sec4BoxHeight + 10; // 10mm Generous Negative Spacing

  // -------------------------------------------------------------------------
  // SECTION 5: AUTHORIZED MULTI-DEPARTMENT SIGN-OFF BLOCK
  // -------------------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(23, 25, 28);
  doc.text('5. MULTI-DEPARTMENT QUALITY CONCURRENCE - MASS PRODUCTION CLEARANCE', 14, p2Y);
  p2Y += 4.5;

  const sigBoxW = 43.5;
  const sigBoxGap = 2.6;
  const sigBoxH = 28;

  const sigNodes = [
    {
      role: 'ACCEPTANCE PAINTER',
      name: fpa.acceptancePainter || fpa.painter || 'Ramesh Kumar',
      status: 'Golden Sample Received',
      isOk: true,
      sub: 'Floor Reference Standard'
    },
    {
      role: 'PRODUCTION SUPERVISOR',
      name: fpa.acceptanceProductionIncharge || 'Vikram Patel',
      status: 'Line Run Cleared',
      isOk: true,
      sub: 'Plant Shift Clearance'
    },
    {
      role: 'QA LEAD ENGINEER',
      name: fpa.qcEngineer || 'Amit Verma',
      status: 'Lab Tested and Passed',
      isOk: true,
      sub: 'Quality Gate 2 Sign-off'
    },
    {
      role: 'MANAGER QA (FINAL)',
      name: fpa.managerQAApproval ? 'Satish Sharma' : 'Pending Sign-off',
      status: fpa.managerQAApproval ? 'OFFICIALLY RELEASED' : 'Awaiting Final Review',
      isOk: fpa.managerQAApproval,
      sub: 'Mass Production Release'
    }
  ];

  sigNodes.forEach((node, idx) => {
    const boxX = 14 + idx * (sigBoxW + sigBoxGap);
    doc.setDrawColor(220, 222, 228);
    doc.setFillColor(250, 250, 251);
    doc.roundedRect(boxX, p2Y, sigBoxW, sigBoxH, 2.5, 2.5, 'FD');

    // Role Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(119, 123, 134);
    doc.text(node.role, boxX + sigBoxW / 2, p2Y + 5.5, { align: 'center' });

    // Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(23, 25, 28);
    doc.text(node.name, boxX + sigBoxW / 2, p2Y + 11.5, { align: 'center' });

    // Status Pill
    doc.setFillColor(node.isOk ? 220 : 254, node.isOk ? 252 : 226, node.isOk ? 231 : 226);
    doc.setDrawColor(node.isOk ? 134 : 252, node.isOk ? 239 : 165, node.isOk ? 172 : 165);
    doc.roundedRect(boxX + 3, p2Y + 16, sigBoxW - 6, 6.5, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.0);
    doc.setTextColor(node.isOk ? 16 : 185, node.isOk ? 116 : 28, node.isOk ? 55 : 28);
    doc.text(node.status, boxX + sigBoxW / 2, p2Y + 20.3, { align: 'center' });

    // Sub note
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(130, 135, 145);
    doc.text(node.sub, boxX + sigBoxW / 2, p2Y + 25.5, { align: 'center' });
  });

  // Page 2 Footer
  drawStandardPdfFooter(
    doc,
    2,
    2,
    'PAINTKING • First Part Approval (Doc: PK-QA-FPA-001 • Rev.02) • ISO 9001:2015 and IATF 16949 Certified',
    liveTimestamp,
    false
  );

  doc.save(`PaintKing_FPA_Report_${fpa.reportNo}.pdf`);
};

/**
/**
 * =========================================================================
 * OFFICIAL IN-PROCESS INSPECTION REPORT (IPQC) PDF (PK-QA-IPQ-001)
 * Follows PaintKing Standard: Newsreader / Helvetica, Light-Grey Headers (#f2f2f3),
 * 8 Time-Slot Matrix (Shift A: 08:00-20:00 & Shift B: 20:00-08:00), 10 Parameters
 * =========================================================================
 */
/**
 * =========================================================================
 * OFFICIAL IN-PROCESS INSPECTION REPORT (IPQC) PDF (PK-QA-IPQ-001)
 * Vertical / Portrait A4 Layout Matching Official Format
 * Follows PaintKing Standard: Light-Grey Headers (#f2f2f3),
 * 8 Time-Slot Matrix (Shift A: 08:00-20:00 & Shift B: 20:00-08:00), 10 Parameters
 * =========================================================================
 */
export const downloadStandardIPQCPdf = (ipqc: IPQCRecord): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const liveTimestamp = new Date().toLocaleString('en-IN');
  const TABLE_BORDER_COLOR = [180, 185, 195] as const;
  const TABLE_LINE_WIDTH = 0.45;

  const headerStartY = drawStandardPdfHeader(doc);
  let currentY = headerStartY + 2;

  const MARGIN_X = 12;
  const USABLE_W = 186;
  const RIGHT_X = MARGIN_X + USABLE_W; // 198mm

  // Helper for safe text rendering
  const drawTruncatedText = (
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    options?: { align?: 'left' | 'center' | 'right'; bold?: boolean; size?: number; color?: [number, number, number] }
  ) => {
    if (options?.bold) doc.setFont('helvetica', 'bold');
    else doc.setFont('helvetica', 'normal');

    if (options?.size) doc.setFontSize(options.size);
    if (options?.color) doc.setTextColor(...options.color);
    else doc.setTextColor(23, 25, 28);

    const clean = (text || '-').trim();
    let display = clean;
    if (doc.getTextWidth(display) > maxWidth) {
      while (display.length > 0 && doc.getTextWidth(display + '...') > maxWidth) {
        display = display.slice(0, -1);
      }
      display += '...';
    }
    doc.text(display, x, y, { align: options?.align || 'left' });
  };

  // 1. Title Box
  doc.setDrawColor(...TABLE_BORDER_COLOR);
  doc.setLineWidth(TABLE_LINE_WIDTH);
  doc.setFillColor(242, 242, 243);
  doc.roundedRect(MARGIN_X, currentY, USABLE_W, 8.5, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(23, 25, 28);
  doc.text('In-Process Inspection Report', MARGIN_X + USABLE_W / 2, currentY + 5.8, { align: 'center' });

  // Doc Control Info Top Right (Issue Date - 01.01.2021 | Rev No - 00 | Rev Date - 00)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.0);
  doc.setTextColor(100, 105, 115);
  doc.text(
    `Issue Date: ${ipqc.issueDate || '01.01.2021'}  |  Rev No: ${ipqc.revNo || '00'}  |  Rev Date: ${ipqc.revDate || '00'}`,
    RIGHT_X - 3,
    currentY + 5.8,
    { align: 'right' }
  );

  currentY += 11.5;

  // -------------------------------------------------------------------------
  // 2. METADATA GRID (Vertical 2-Column Multi-Row Layout)
  // -------------------------------------------------------------------------
  const metaStartY = currentY;
  const colHalfW = USABLE_W / 2; // 93mm each
  const metaRowH = 6.0;
  const totalMetaRows = 6;
  const metaHeight = metaRowH * totalMetaRows; // 36mm

  doc.setFillColor(250, 250, 251);
  doc.setDrawColor(...TABLE_BORDER_COLOR);
  doc.setLineWidth(TABLE_LINE_WIDTH);
  doc.rect(MARGIN_X, metaStartY, USABLE_W, metaHeight, 'FD');

  // Vertical dividing line between Column 1 & Column 2
  doc.line(MARGIN_X + colHalfW, metaStartY, MARGIN_X + colHalfW, metaStartY + metaHeight);

  // Horizontal dividing lines
  for (let r = 1; r < totalMetaRows; r++) {
    doc.line(MARGIN_X, metaStartY + r * metaRowH, RIGHT_X, metaStartY + r * metaRowH);
  }

  // Helper to draw clean Key-Value inside column
  const drawMetaCell = (
    label: string,
    value: string,
    x: number,
    y: number,
    colW: number,
    labelW: number = 30
  ) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(23, 25, 28);
    doc.text(`${label} :`, x + 2.5, y + 4.1);

    const valX = x + labelW;
    const maxValW = colW - labelW - 3;
    drawTruncatedText(value || '-', valX, y + 4.1, maxValW, {
      bold: false,
      size: 6.8,
      color: [70, 75, 85]
    });
  };

  // Left Column Fields
  drawMetaCell('Date', formatDateDDMMYYYY(ipqc.date), MARGIN_X, metaStartY, colHalfW, 26);
  drawMetaCell('Report No', ipqc.reportNo, MARGIN_X, metaStartY + metaRowH, colHalfW, 26);
  drawMetaCell('Customer', ipqc.customer || 'ROOP POLYMERS LTD', MARGIN_X, metaStartY + metaRowH * 2, colHalfW, 26);
  drawMetaCell('Part Description', ipqc.partDescription || 'Car AC Vent Bezel Substrate', MARGIN_X, metaStartY + metaRowH * 3, colHalfW, 26);
  drawMetaCell('Part Code', ipqc.partCode || 'RP-8841', MARGIN_X, metaStartY + metaRowH * 4, colHalfW, 26);
  drawMetaCell('Family', ipqc.family || 'Auto Vent Bezel Family', MARGIN_X, metaStartY + metaRowH * 5, colHalfW, 26);

  // Right Column Fields
  const c2X = MARGIN_X + colHalfW;
  drawMetaCell('Paint Description', ipqc.paintDescription || `${ipqc.color || 'Monza Red'} Basecoat`, c2X, metaStartY, colHalfW, 32);
  drawMetaCell('Paint Batch No', ipqc.paintBatchNumber || ipqc.paintBatch || 'BAT-PPG-2609-R4', c2X, metaStartY + metaRowH, colHalfW, 32);
  drawMetaCell('Thinner Batch', ipqc.thinnerBatchNumber || ipqc.thinnerBatch || 'THN-2609-02', c2X, metaStartY + metaRowH * 2, colHalfW, 32);
  drawMetaCell('Paint Viscosity', ipqc.paintViscosity ? `${ipqc.paintViscosity}s (FC4)` : `${ipqc.viscositySec || 15}s (FC4)`, c2X, metaStartY + metaRowH * 3, colHalfW, 32);
  drawMetaCell('Painting Booth', ipqc.paintingBooth || ipqc.booth || 'Booth #1 (Enclosed Line)', c2X, metaStartY + metaRowH * 4, colHalfW, 32);
  drawMetaCell('Painter', ipqc.painter || 'Ramesh Kumar (P1)', c2X, metaStartY + metaRowH * 5, colHalfW, 32);

  currentY = metaStartY + metaHeight + 2.5;

  // -------------------------------------------------------------------------
  // 3. WORK ORDER & SUPERVISOR STRIP
  // -------------------------------------------------------------------------
  doc.setFillColor(242, 242, 243);
  doc.setDrawColor(...TABLE_BORDER_COLOR);
  doc.setLineWidth(TABLE_LINE_WIDTH);
  doc.rect(MARGIN_X, currentY, USABLE_W, 6.0, 'FD');

  const sA = ipqc.supervisorShiftA || 'Vikram Patel (Shift A)';
  const sB = ipqc.supervisorShiftB || 'Dinesh Sharma (Shift B)';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(23, 25, 28);
  doc.text(`WO No: ${ipqc.workOrderNo || ipqc.woNo || '-'}  |  Job Card: ${ipqc.jobCardNo || '-'}  |  Supervisor A: ${sA}  |  Supervisor B: ${sB}`, MARGIN_X + 2.5, currentY + 4.1);

  currentY += 8.5; // Negative spacing before observation matrix

  // -------------------------------------------------------------------------
  // 4. 10-PARAMETER X 8 TIME-SLOT OBSERVATION MATRIX (VERTICAL / PORTRAIT FIT)
  // -------------------------------------------------------------------------
  const tableStartY = currentY;
  const colSrW = 7;
  const colParamW = 28;
  const colSpecW = 21;
  const colTechW = 22;
  const metaLeftW = colSrW + colParamW + colSpecW + colTechW; // 78mm
  const remainingW = USABLE_W - metaLeftW; // 186 - 78 = 108mm
  const slotW = remainingW / 8; // 13.5mm per slot

  const timeSlotsHeader = [
    { key: 'slot_08_11', time: '8:00-11:00', shortTime: '8-11', shift: 'Shift A' },
    { key: 'slot_11_14', time: '11:00-14:00', shortTime: '11-14', shift: 'Shift A' },
    { key: 'slot_14_17', time: '14:00-17:00', shortTime: '14-17', shift: 'Shift A' },
    { key: 'slot_17_20', time: '17:00-20:00', shortTime: '17-20', shift: 'Shift A' },
    { key: 'slot_20_23', time: '20:00-23:00', shortTime: '20-23', shift: 'Shift B' },
    { key: 'slot_23_02', time: '23:00-2:00', shortTime: '23-02', shift: 'Shift B' },
    { key: 'slot_02_05', time: '2:00-5:00', shortTime: '02-05', shift: 'Shift B' },
    { key: 'slot_05_08', time: '5:00-8:00', shortTime: '05-08', shift: 'Shift B' }
  ];

  // Header Row 1: Left Columns Spanned + Shift A (4 Slots) + Shift B (4 Slots)
  doc.setFillColor(242, 242, 243);
  doc.rect(MARGIN_X, currentY, USABLE_W, 5.0, 'F');
  doc.setDrawColor(...TABLE_BORDER_COLOR);
  doc.setLineWidth(TABLE_LINE_WIDTH);
  doc.line(MARGIN_X, currentY, RIGHT_X, currentY);
  doc.line(MARGIN_X, currentY + 5.0, RIGHT_X, currentY + 5.0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(23, 25, 28);
  doc.text('Sr.', MARGIN_X + colSrW / 2, currentY + 3.5, { align: 'center' });
  doc.text('Parameters', MARGIN_X + colSrW + 1.5, currentY + 3.5);
  doc.text('Specification', MARGIN_X + colSrW + colParamW + colSpecW / 2, currentY + 3.5, { align: 'center' });
  doc.text('Measurement', MARGIN_X + colSrW + colParamW + colSpecW + colTechW / 2, currentY + 3.5, { align: 'center' });

  // Shift A Span
  const shiftAX = MARGIN_X + metaLeftW;
  const shiftAW = slotW * 4;
  doc.text('Shift A', shiftAX + shiftAW / 2, currentY + 3.5, { align: 'center' });

  // Shift B Span
  const shiftBX = shiftAX + shiftAW;
  const shiftBW = slotW * 4;
  doc.text('Shift B', shiftBX + shiftBW / 2, currentY + 3.5, { align: 'center' });

  currentY += 5.0;

  // Header Row 2: Sub-headers (Technique & 8 Time Slots)
  doc.setFillColor(242, 242, 243);
  doc.rect(MARGIN_X, currentY, USABLE_W, 5.0, 'F');
  doc.line(MARGIN_X, currentY + 5.0, RIGHT_X, currentY + 5.0);

  doc.text('Technique', MARGIN_X + colSrW + colParamW + colSpecW + colTechW / 2, currentY + 3.5, { align: 'center' });

  doc.setFontSize(5.5);
  timeSlotsHeader.forEach((slot, sIdx) => {
    const sX = MARGIN_X + metaLeftW + sIdx * slotW;
    doc.text(slot.shortTime, sX + slotW / 2, currentY + 3.5, { align: 'center' });
  });

  currentY += 5.0;

  // Parameter Rows Definition
  const parameters = [
    { sr: '1', name: 'Bubble', spec: 'Not Allowed', tech: 'Visual', field: 'bubble', defaultVal: 'OK' },
    { sr: '2', name: 'Dust Spot', spec: 'Not Allowed', tech: 'Visual', field: 'dustSpot', defaultVal: 'OK' },
    { sr: '3', name: 'Over Paint', spec: 'Not Allowed', tech: 'Visual', field: 'overPaint', defaultVal: 'OK' },
    { sr: '4', name: 'Paint Missing', spec: 'Not Allowed', tech: 'Visual', field: 'paintMissing', defaultVal: 'OK' },
    { sr: '5', name: 'L', spec: '-', tech: 'Spectrometer', field: 'L', defaultVal: '42.15' },
    { sr: '6', name: 'A', spec: '-', tech: 'Spectrometer', field: 'a', defaultVal: '54.30' },
    { sr: '7', name: 'B', spec: '-', tech: 'Spectrometer', field: 'b', defaultVal: '28.10' },
    { sr: '8', name: 'DeltaE (Delta Value)', spec: '<= 0.70', tech: 'Spectrometer', field: 'deltaE', defaultVal: '0.40' },
    { sr: '9', name: 'Overall Finishing', spec: 'Perfect', tech: 'Visual', field: 'overallFinishing', defaultVal: 'OK' },
    { sr: '10', name: 'Adhesion Test', spec: 'Perfect', tech: 'Physical', field: 'adhesionTest', defaultVal: '100% (Pass)' }
  ];

  const rowHeight = 5.8;

  parameters.forEach((param, pIdx) => {
    const isEven = pIdx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 250, isEven ? 255 : 250, isEven ? 255 : 251);
    doc.rect(MARGIN_X, currentY, USABLE_W, rowHeight, 'F');
    doc.setDrawColor(...TABLE_BORDER_COLOR);
    doc.setLineWidth(TABLE_LINE_WIDTH);
    doc.line(MARGIN_X, currentY + rowHeight, RIGHT_X, currentY + rowHeight);

    // Sr No
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(23, 25, 28);
    doc.text(param.sr, MARGIN_X + colSrW / 2, currentY + 4.0, { align: 'center' });

    // Parameter Name
    doc.setFont('helvetica', 'normal');
    drawTruncatedText(param.name, MARGIN_X + colSrW + 1.5, currentY + 4.0, colParamW - 2, { size: 6.0 });

    // Specification
    doc.setFontSize(5.8);
    doc.text(param.spec || '-', MARGIN_X + colSrW + colParamW + colSpecW / 2, currentY + 4.0, { align: 'center' });

    // Measurement Technique
    doc.text(param.tech, MARGIN_X + colSrW + colParamW + colSpecW + colTechW / 2, currentY + 4.0, { align: 'center' });

    // Fill observations across 8 time slots
    timeSlotsHeader.forEach((slot, sIdx) => {
      const sX = MARGIN_X + metaLeftW + sIdx * slotW;
      const slotData = ipqc.timeSlots ? (ipqc.timeSlots as any)[slot.key] : null;
      let cellVal = slotData ? slotData[param.field] : null;

      if (!cellVal) {
        // Fallback to active summary values for Shift A slot 1 or 2
        if (sIdx === 0 || sIdx === 1) {
          if (param.field === 'bubble') cellVal = ipqc.bubble || 'OK';
          else if (param.field === 'dustSpot') cellVal = ipqc.dustSpot || 'OK';
          else if (param.field === 'overPaint') cellVal = ipqc.overPaint || 'OK';
          else if (param.field === 'paintMissing') cellVal = ipqc.paintMissing || 'OK';
          else if (param.field === 'L') cellVal = ipqc.L !== undefined ? String(ipqc.L) : param.defaultVal;
          else if (param.field === 'a') cellVal = ipqc.a !== undefined ? String(ipqc.a) : param.defaultVal;
          else if (param.field === 'b') cellVal = ipqc.b !== undefined ? String(ipqc.b) : param.defaultVal;
          else if (param.field === 'deltaE') cellVal = ipqc.deltaE !== undefined ? String(ipqc.deltaE) : param.defaultVal;
          else if (param.field === 'overallFinishing') cellVal = ipqc.overallFinishing || 'OK';
          else if (param.field === 'adhesionTest') cellVal = ipqc.adhesionTest || 'OK';
        }
      }

      if (cellVal) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.8);
        const strVal = String(cellVal).trim();
        if (strVal.toLowerCase() === 'fail' || strVal.toLowerCase() === 'not ok') {
          doc.setTextColor(220, 38, 38);
        } else if (strVal.toLowerCase() === 'pass' || strVal.toLowerCase() === 'ok' || strVal.toLowerCase() === 'perfect') {
          doc.setTextColor(16, 116, 55);
        } else {
          doc.setTextColor(23, 25, 28);
        }
        doc.text(strVal, sX + slotW / 2, currentY + 4.0, { align: 'center' });
      }
    });

    currentY += rowHeight;
  });

  // Draw Vertical Table Lines
  doc.setDrawColor(...TABLE_BORDER_COLOR);
  doc.setLineWidth(TABLE_LINE_WIDTH);
  // Outer boundaries
  doc.line(MARGIN_X, tableStartY, MARGIN_X, currentY);
  doc.line(RIGHT_X, tableStartY, RIGHT_X, currentY);
  // Inner column lines
  doc.line(MARGIN_X + colSrW, tableStartY, MARGIN_X + colSrW, currentY);
  doc.line(MARGIN_X + colSrW + colParamW, tableStartY, MARGIN_X + colSrW + colParamW, currentY);
  doc.line(MARGIN_X + colSrW + colParamW + colSpecW, tableStartY, MARGIN_X + colSrW + colParamW + colSpecW, currentY);
  doc.line(MARGIN_X + metaLeftW, tableStartY, MARGIN_X + metaLeftW, currentY);

  // Shift divider in row 1
  doc.line(shiftBX, tableStartY, shiftBX, currentY);

  // 8 Time-slot columns
  for (let s = 1; s < 8; s++) {
    if (s === 4) continue; // already drawn by shiftBX
    const sLineX = MARGIN_X + metaLeftW + s * slotW;
    doc.line(sLineX, tableStartY + 5.0, sLineX, currentY);
  }

  currentY += 6.0; // Negative spacing before comments

  // -------------------------------------------------------------------------
  // 5. BOTTOM SECTION: COMMENTS OF QUALITY ENGINEER & MULTI-SHIFT SIGN-OFF
  // -------------------------------------------------------------------------
  const bottomStartY = currentY;
  const commentBoxH = 13.0;
  const signBoxH = 14.0;
  const bottomTotalH = commentBoxH + signBoxH; // 27mm

  doc.setFillColor(250, 250, 251);
  doc.setDrawColor(...TABLE_BORDER_COLOR);
  doc.setLineWidth(TABLE_LINE_WIDTH);
  doc.rect(MARGIN_X, bottomStartY, USABLE_W, bottomTotalH, 'FD');

  // Comment Header & Wrapped Text
  const rawComment = ipqc.commentOfQualityEngineer || ipqc.remarks || 'Visual and Spectrometer checks pass all parameters. Surface finish clean, atomization and 100% tape adhesion verified. Authorized for mass run.';
  const cleanComment = rawComment.replace(/&/g, 'and').replace(/\s+/g, ' ').trim();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(23, 25, 28);
  doc.text('Comment of Quality Engineer :-', MARGIN_X + 3, bottomStartY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(70, 75, 85);
  const commentLines = doc.splitTextToSize(cleanComment, USABLE_W - 55);
  doc.text(commentLines, MARGIN_X + 50, bottomStartY + 4.5);

  // Horizontal divider for Signatures
  doc.line(MARGIN_X, bottomStartY + commentBoxH, RIGHT_X, bottomStartY + commentBoxH);

  // 3-Column Signatures: Shift A (62mm) | Shift B (62mm) | Verified By (62mm)
  const signColW = USABLE_W / 3;
  const signY = bottomStartY + commentBoxH;

  doc.line(MARGIN_X + signColW, signY, MARGIN_X + signColW, bottomStartY + bottomTotalH);
  doc.line(MARGIN_X + signColW * 2, signY, MARGIN_X + signColW * 2, bottomStartY + bottomTotalH);

  // Col 1: Inspected By (Shift A)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(23, 25, 28);
  doc.text('Inspected By : (Shift A)', MARGIN_X + 3, signY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(70, 75, 85);
  drawTruncatedText(ipqc.inspectedByShiftA || ipqc.inspector || 'Vikram Patel (Shift A Lead)', MARGIN_X + 3, signY + 9.5, signColW - 6, { size: 6.2 });

  // Col 2: Inspected By (Shift B)
  const signC2X = MARGIN_X + signColW;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(23, 25, 28);
  doc.text('Inspected By : (Shift B)', signC2X + 3, signY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(70, 75, 85);
  drawTruncatedText(ipqc.inspectedByShiftB || 'Kailash Yadav (QA Auditor)', signC2X + 3, signY + 9.5, signColW - 6, { size: 6.2 });

  // Col 3: Verified By
  const signC3X = MARGIN_X + signColW * 2;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(23, 25, 28);
  doc.text('Verified By :-', signC3X + 3, signY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(70, 75, 85);
  drawTruncatedText(ipqc.verifiedBy || 'Satish Sharma (Quality / Plant Head)', signC3X + 3, signY + 9.5, signColW - 6, { size: 6.2 });

  // -------------------------------------------------------------------------
  // 6. STANDARD PDF FOOTER
  // -------------------------------------------------------------------------
  drawStandardPdfFooter(
    doc,
    1,
    1,
    'PAINTKING • In-Process Inspection Report (Doc: PK-QA-IPQ-001 • Rev.00) • ISO 9001:2015 and IATF 16949 Certified',
    liveTimestamp,
    false
  );

  doc.save(`PaintKing_IPQC_Report_${ipqc.reportNo}.pdf`);
};

/**
 * =========================================================================
 * OFFICIAL PRE-PRODUCTION INSPECTION REPORT (PIR) PDF (PK-QA-PIR-001)
 * Vertical / Portrait A4 Layout (Quality Gate 1: Substrate Cleaning & Pre-Treatment)
 * Follows PaintKing Universal Standard: Light-Grey Headers (#f2f2f3),
 * 8 Critical Checkpoints, Substrate Verification, ISO 9001:2015 footer.
 * =========================================================================
 */
export const downloadStandardPreProductionPdf = (pir: PreProductionInspectionRecord): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const liveTimestamp = new Date().toLocaleString('en-IN');
  const TABLE_BORDER_COLOR = [180, 185, 195] as const;
  const TABLE_LINE_WIDTH = 0.45;

  const headerStartY = drawStandardPdfHeader(doc);
  let currentY = headerStartY + 2;

  const MARGIN_X = 12;
  const USABLE_W = 186;
  const RIGHT_X = MARGIN_X + USABLE_W; // 198mm

  // Helper for safe text truncation
  const drawTruncatedText = (
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    options?: { align?: 'left' | 'center' | 'right'; bold?: boolean; size?: number; color?: [number, number, number] }
  ) => {
    if (options?.bold) doc.setFont('helvetica', 'bold');
    else doc.setFont('helvetica', 'normal');

    if (options?.size) doc.setFontSize(options.size);
    if (options?.color) doc.setTextColor(...options.color);
    else doc.setTextColor(23, 25, 28);

    const clean = (text || '-').trim();
    let display = clean;
    if (doc.getTextWidth(display) > maxWidth) {
      while (display.length > 0 && doc.getTextWidth(display + '...') > maxWidth) {
        display = display.slice(0, -1);
      }
      display += '...';
    }
    doc.text(display, x, y, { align: options?.align || 'left' });
  };

  // 1. Title Box
  doc.setDrawColor(...TABLE_BORDER_COLOR);
  doc.setLineWidth(TABLE_LINE_WIDTH);
  doc.setFillColor(242, 242, 243);
  doc.roundedRect(MARGIN_X, currentY, USABLE_W, 8.5, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.0);
  doc.setTextColor(23, 25, 28);
  doc.text('Pre-Production Substrate & Pre-Treatment Inspection Report', MARGIN_X + USABLE_W / 2, currentY + 5.8, { align: 'center' });

  // Doc Control Info Top Right
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.0);
  doc.setTextColor(100, 105, 115);
  doc.text(
    `Doc: ${pir.docNo || 'PK-QA-PIR-001'}  |  Rev: ${pir.revNo || '00'}  |  Gate 1 Release`,
    RIGHT_X - 3,
    currentY + 5.8,
    { align: 'right' }
  );

  currentY += 11.5;

  // -------------------------------------------------------------------------
  // 2. METADATA GRID (Vertical 2-Column Multi-Row Layout)
  // -------------------------------------------------------------------------
  const metaStartY = currentY;
  const colHalfW = USABLE_W / 2; // 93mm each
  const metaRowH = 6.0;
  const totalMetaRows = 6;
  const metaHeight = metaRowH * totalMetaRows; // 36mm

  doc.setFillColor(250, 250, 251);
  doc.setDrawColor(...TABLE_BORDER_COLOR);
  doc.setLineWidth(TABLE_LINE_WIDTH);
  doc.rect(MARGIN_X, metaStartY, USABLE_W, metaHeight, 'FD');

  // Vertical dividing line
  doc.line(MARGIN_X + colHalfW, metaStartY, MARGIN_X + colHalfW, metaStartY + metaHeight);

  // Horizontal dividing lines
  for (let r = 1; r < totalMetaRows; r++) {
    doc.line(MARGIN_X, metaStartY + r * metaRowH, RIGHT_X, metaStartY + r * metaRowH);
  }

  // Key-Value drawer
  const drawMetaCell = (
    label: string,
    value: string,
    x: number,
    y: number,
    colW: number,
    labelW: number = 32
  ) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(23, 25, 28);
    doc.text(`${label} :`, x + 2.5, y + 4.1);

    const valX = x + labelW;
    const maxValW = colW - labelW - 3;
    drawTruncatedText(value || '-', valX, y + 4.1, maxValW, {
      bold: false,
      size: 6.8,
      color: [70, 75, 85]
    });
  };

  // Left Column (Job & Part Identifiers)
  drawMetaCell('Date', formatDateDDMMYYYY(pir.date), MARGIN_X, metaStartY, colHalfW, 26);
  drawMetaCell('Report No', pir.reportNo, MARGIN_X, metaStartY + metaRowH, colHalfW, 26);
  drawMetaCell('Customer', pir.customer || 'OEM Client', MARGIN_X, metaStartY + metaRowH * 2, colHalfW, 26);
  drawMetaCell('Part Description', pir.partDescription || 'Raw Substrates Component', MARGIN_X, metaStartY + metaRowH * 3, colHalfW, 26);
  drawMetaCell('Part Code', pir.partCode || 'RP-8841', MARGIN_X, metaStartY + metaRowH * 4, colHalfW, 26);
  drawMetaCell('Family', pir.family || 'Auto Mould Family', MARGIN_X, metaStartY + metaRowH * 5, colHalfW, 26);

  // Right Column (Substrate & Quantity Verification)
  const c2X = MARGIN_X + colHalfW;
  drawMetaCell('Substrate Material', pir.substrateMaterial || 'ABS Plastic', c2X, metaStartY, colHalfW, 34);
  drawMetaCell('Color / Coating Finish', pir.color || 'Monza Red Basecoat', c2X, metaStartY + metaRowH, colHalfW, 34);
  drawMetaCell('Stores Issued Qty', `${pir.issuedQty?.toLocaleString() || 0} Pcs`, c2X, metaStartY + metaRowH * 2, colHalfW, 34);
  drawMetaCell('100% Inspected Qty', `${pir.inspectedQty?.toLocaleString() || 0} Pcs`, c2X, metaStartY + metaRowH * 3, colHalfW, 34);
  drawMetaCell('Accepted / OK Qty', `${pir.acceptedQty?.toLocaleString() || 0} Pcs (Clean)`, c2X, metaStartY + metaRowH * 4, colHalfW, 34);
  drawMetaCell('Rejected Raw Qty', `${pir.rejectedQty || 0} Pcs ${pir.rejectedQty > 0 ? '(Hold / Scrap)' : '(Nil)'}`, c2X, metaStartY + metaRowH * 5, colHalfW, 34);

  currentY = metaStartY + metaHeight + 2.5;

  // -------------------------------------------------------------------------
  // 3. WORK ORDER & CUSTODY LINK STRIP
  // -------------------------------------------------------------------------
  doc.setFillColor(242, 242, 243);
  doc.setDrawColor(...TABLE_BORDER_COLOR);
  doc.setLineWidth(TABLE_LINE_WIDTH);
  doc.rect(MARGIN_X, currentY, USABLE_W, 6.0, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(23, 25, 28);
  doc.text(
    `Work Order No: ${pir.workOrderNo || '-'}   |   Job Card No: ${pir.jobCardNo || '-'}   |   Inspection Station: Pre-Treatment / Jigging Bay`,
    MARGIN_X + 2.5,
    currentY + 4.1
  );

  currentY += 8.5; // Negative spacing before checklist table

  // -------------------------------------------------------------------------
  // 4. 8 CRITICAL SUBSTRATE CHECKPOINTS TABLE
  // -------------------------------------------------------------------------
  const tableStartY = currentY;
  const colSrW = 8;
  const colParamW = 52;
  const colStandardW = 68;
  const colTechW = 34;
  const colResultW = 24; // Total = 186mm

  // Table Header
  doc.setFillColor(242, 242, 243);
  doc.rect(MARGIN_X, currentY, USABLE_W, 6.0, 'F');
  doc.setDrawColor(...TABLE_BORDER_COLOR);
  doc.setLineWidth(TABLE_LINE_WIDTH);
  doc.line(MARGIN_X, currentY, RIGHT_X, currentY);
  doc.line(MARGIN_X, currentY + 6.0, RIGHT_X, currentY + 6.0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.4);
  doc.setTextColor(23, 25, 28);
  doc.text('Sr.', MARGIN_X + colSrW / 2, currentY + 4.1, { align: 'center' });
  doc.text('Inspection Parameter / Checkpoint', MARGIN_X + colSrW + 2, currentY + 4.1);
  doc.text('Acceptance Standard / Requirement', MARGIN_X + colSrW + colParamW + 2, currentY + 4.1);
  doc.text('Inspection Technique', MARGIN_X + colSrW + colParamW + colStandardW + colTechW / 2, currentY + 4.1, { align: 'center' });
  doc.text('Result / Status', MARGIN_X + colSrW + colParamW + colStandardW + colTechW + colResultW / 2, currentY + 4.1, { align: 'center' });

  currentY += 6.0;

  const checkpoints = [
    {
      sr: '1',
      name: 'Physical Condition & Transit Check',
      standard: 'Zero cracks, dents, deep scuffs, deformation or transit breakage',
      tech: '100% Visual Inspection',
      result: pir.physicalCondition
    },
    {
      sr: '2',
      name: 'Burrs, Parting Line Flash & Sink Marks',
      standard: 'Smooth clean edges, no excessive flash, zero sink marks on cosmetic face',
      tech: 'Visual & Tactile Touch Test',
      result: pir.burrsFlashSinkMarks
    },
    {
      sr: '3',
      name: 'Oil, Grease & Mold Release Chemical',
      standard: '100% Free from silicone, grease, machining oil or mold release agents',
      tech: 'White Cloth / Solvent Wipe',
      result: pir.oilGreaseChemical
    },
    {
      sr: '4',
      name: 'Cleaning & Pre-Treatment (IPA Wiping)',
      standard: 'Substrates thoroughly cleaned with Isopropyl Alcohol (IPA) to strip contaminants',
      tech: 'Process Verification',
      result: pir.cleaningIpaWiping
    },
    {
      sr: '5',
      name: 'Static Charge De-Dusting',
      standard: 'Ionized air blown to eliminate static charge and all loose dust particles',
      tech: 'Ionized Air Blow Check',
      result: pir.staticDedusting
    },
    {
      sr: '6',
      name: 'Masking & Critical Area Protection',
      standard: 'Precision masking tape applied strictly per customer technical drawing',
      tech: 'Dimensional & Visual Check',
      result: pir.maskingProtection || 'N/A'
    },
    {
      sr: '7',
      name: 'Jigging & Hanging Orientation',
      standard: 'Firm hook clamping, stable positioning, zero touch points between components',
      tech: 'Jig Line Audit',
      result: pir.jiggingOrientation
    },
    {
      sr: '8',
      name: 'Quantity Count Verification',
      standard: 'Physical piece count matches work order issuance; rejected raw parts segregated',
      tech: '100% Part Count',
      result: pir.quantityVerification
    }
  ];

  const rowHeight = 7.2;

  checkpoints.forEach((cp, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 250, isEven ? 255 : 250, isEven ? 255 : 251);
    doc.rect(MARGIN_X, currentY, USABLE_W, rowHeight, 'F');
    doc.setDrawColor(...TABLE_BORDER_COLOR);
    doc.setLineWidth(TABLE_LINE_WIDTH);
    doc.line(MARGIN_X, currentY + rowHeight, RIGHT_X, currentY + rowHeight);

    // Sr
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(23, 25, 28);
    doc.text(cp.sr, MARGIN_X + colSrW / 2, currentY + 4.8, { align: 'center' });

    // Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.0);
    drawTruncatedText(cp.name, MARGIN_X + colSrW + 2, currentY + 4.8, colParamW - 3);

    // Standard
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.6);
    drawTruncatedText(cp.standard, MARGIN_X + colSrW + colParamW + 2, currentY + 4.8, colStandardW - 4);

    // Tech
    doc.setFontSize(5.8);
    doc.text(cp.tech, MARGIN_X + colSrW + colParamW + colStandardW + colTechW / 2, currentY + 4.8, { align: 'center' });

    // Result
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    const res = String(cp.result || 'Pass').trim();
    if (res.toLowerCase() === 'pass') {
      doc.setTextColor(16, 116, 55);
      doc.text('✓ PASS', MARGIN_X + colSrW + colParamW + colStandardW + colTechW + colResultW / 2, currentY + 4.8, { align: 'center' });
    } else if (res.toLowerCase() === 'fail') {
      doc.setTextColor(220, 38, 38);
      doc.text('✗ FAIL', MARGIN_X + colSrW + colParamW + colStandardW + colTechW + colResultW / 2, currentY + 4.8, { align: 'center' });
    } else {
      doc.setTextColor(119, 123, 134);
      doc.text('N/A', MARGIN_X + colSrW + colParamW + colStandardW + colTechW + colResultW / 2, currentY + 4.8, { align: 'center' });
    }

    currentY += rowHeight;
  });

  // Total Quantity Summary Row
  doc.setFillColor(242, 242, 243);
  doc.rect(MARGIN_X, currentY, USABLE_W, 6.2, 'F');
  doc.setDrawColor(...TABLE_BORDER_COLOR);
  doc.setLineWidth(TABLE_LINE_WIDTH);
  doc.line(MARGIN_X, currentY + 6.2, RIGHT_X, currentY + 6.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(23, 25, 28);
  doc.text('TOTAL SUBSTRATE QUANTITY:', MARGIN_X + colSrW + 2, currentY + 4.2);
  doc.text(
    `Inspected: ${pir.inspectedQty || 0} Pcs   |   Clean Accepted: ${pir.acceptedQty || 0} Pcs   |   Raw Rejected: ${pir.rejectedQty || 0} Pcs`,
    MARGIN_X + colSrW + colParamW + 2,
    currentY + 4.2
  );

  const isBatchApproved = pir.overallResult === 'Passed';
  doc.setTextColor(isBatchApproved ? 16 : 220, isBatchApproved ? 116 : 38, isBatchApproved ? 55 : 38);
  doc.text(
    isBatchApproved ? '✓ APPROVED' : 'HOLD / REJECT',
    MARGIN_X + colSrW + colParamW + colStandardW + colTechW + colResultW / 2,
    currentY + 4.2,
    { align: 'center' }
  );

  currentY += 6.2;

  // Draw Vertical Column Lines
  doc.setDrawColor(...TABLE_BORDER_COLOR);
  doc.setLineWidth(TABLE_LINE_WIDTH);
  // Outer Boundaries
  doc.line(MARGIN_X, tableStartY, MARGIN_X, currentY);
  doc.line(RIGHT_X, tableStartY, RIGHT_X, currentY);
  // Inner dividers
  doc.line(MARGIN_X + colSrW, tableStartY, MARGIN_X + colSrW, currentY);
  doc.line(MARGIN_X + colSrW + colParamW, tableStartY, MARGIN_X + colSrW + colParamW, currentY);
  doc.line(MARGIN_X + colSrW + colParamW + colStandardW, tableStartY, MARGIN_X + colSrW + colParamW + colStandardW, currentY);
  doc.line(MARGIN_X + colSrW + colParamW + colStandardW + colTechW, tableStartY, MARGIN_X + colSrW + colParamW + colStandardW + colTechW, currentY);

  currentY += 5.5; // Negative spacing before bottom remarks

  // -------------------------------------------------------------------------
  // 5. REMARKS & QUALITY GATE CLEARANCE AUTHORIZATION
  // -------------------------------------------------------------------------
  const bottomStartY = currentY;
  const commentBoxH = 13.0;
  const signBoxH = 14.0;
  const bottomTotalH = commentBoxH + signBoxH; // 27mm

  doc.setFillColor(250, 250, 251);
  doc.setDrawColor(...TABLE_BORDER_COLOR);
  doc.setLineWidth(TABLE_LINE_WIDTH);
  doc.rect(MARGIN_X, bottomStartY, USABLE_W, bottomTotalH, 'FD');

  // Remarks Header & Text
  const rawRemarks = pir.remarks || (isBatchApproved
    ? '100% Substrates cleaned with Isopropyl alcohol (IPA), static de-dusted. Zero flash, oil or burrs observed. Authorized to proceed to Gate 2 (First Part Approval / FPA test spray).'
    : 'Substrates held due to raw material defect / contamination. Do not proceed with coating without corrective action.');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(23, 25, 28);
  doc.text('Pre-Production Quality Remarks & Gate 1 Decision :-', MARGIN_X + 3, bottomStartY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.0);
  doc.setTextColor(70, 75, 85);
  const remarksLines = doc.splitTextToSize(rawRemarks, USABLE_W - 75);
  doc.text(remarksLines, MARGIN_X + 70, bottomStartY + 4.5);

  // Horizontal divider for Signatures
  doc.line(MARGIN_X, bottomStartY + commentBoxH, RIGHT_X, bottomStartY + commentBoxH);

  // 3-Column Signatures: Substrate Inspector | Production Supervisor | QA Engineer
  const signColW = USABLE_W / 3;
  const signY = bottomStartY + commentBoxH;

  doc.line(MARGIN_X + signColW, signY, MARGIN_X + signColW, bottomStartY + bottomTotalH);
  doc.line(MARGIN_X + signColW * 2, signY, MARGIN_X + signColW * 2, bottomStartY + bottomTotalH);

  // Col 1: Substrate Inspector
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(23, 25, 28);
  doc.text('Substrate Inspector', MARGIN_X + 3, signY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(70, 75, 85);
  drawTruncatedText(pir.inspectedBy || 'Kailash Yadav (Line Inspector)', MARGIN_X + 3, signY + 9.5, signColW - 6, { size: 6.2 });

  // Col 2: Production Supervisor
  const signC2X = MARGIN_X + signColW;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(23, 25, 28);
  doc.text('Production Floor Supervisor', signC2X + 3, signY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(70, 75, 85);
  drawTruncatedText(pir.productionSupervisor || 'Vikram Patel (Shift A Lead)', signC2X + 3, signY + 9.5, signColW - 6, { size: 6.2 });

  // Col 3: QA Release Engineer
  const signC3X = MARGIN_X + signColW * 2;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(23, 25, 28);
  doc.text('Quality Release Engineer', signC3X + 3, signY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(70, 75, 85);
  drawTruncatedText(pir.qaEngineer || 'Amit Verma (Lead QA Auditor)', signC3X + 3, signY + 9.5, signColW - 6, { size: 6.2 });

  // -------------------------------------------------------------------------
  // 6. STANDARD PDF FOOTER
  // -------------------------------------------------------------------------
  drawStandardPdfFooter(
    doc,
    1,
    1,
    'PAINTKING • Pre-Production Inspection Report (Doc: PK-QA-PIR-001 • Rev.00) • ISO 9001:2015 and IATF 16949 Certified',
    liveTimestamp,
    false
  );

  doc.save(`PaintKing_PreProduction_Report_${pir.reportNo}.pdf`);
};
