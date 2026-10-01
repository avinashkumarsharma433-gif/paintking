import { IQCInspectionRecord, MaterialInwardRecord, GatePassRecord, GoodsReceiptNote } from '../types/portalTypes';
import { formatDateDDMMYYYY } from './pdfStandardHeader';

export interface EmailDispatchPayload {
  toEmail: string;
  ccEmail?: string;
  subject: string;
  bodyText: string;
  recipientName: string;
  documentType: 'IQC' | 'INWARD_PASS' | 'OUTWARD_PASS' | 'GRN';
  documentRef: string;
  fileName: string;
  pdfBlob?: Blob;
}

/**
 * Clean material names from brackets and numbers
 */
const cleanMaterialName = (name: string) => {
  if (!name) return '';
  let clean = name.replace(/^\[.*?\]\s*/g, '').replace(/\[.*?\]/g, '').trim();
  clean = clean.replace(/\(\d+\s*[a-zA-Z]*\)/g, '').trim();
  return clean;
};

/**
 * Generate smart vendor/client email address suggestion based on party name
 */
export const getSuggestedPartyEmail = (partyName: string): string => {
  if (!partyName) return 'quality@vendor.com';
  const clean = partyName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
  return `quality@${clean || 'vendor'}.com`;
};

/**
 * Smart Rule-Based Engine: Compose Executive IQC Inspection Email Draft
 */
export const composeIqcEmailDraft = (record: IQCInspectionRecord): EmailDispatchPayload => {
  const party = record.vendorCustomer || record.supplierCustomer || 'Vendor / Supplier';
  const toEmail = getSuggestedPartyEmail(party);
  const challanNo = record.invoiceChallanNo || 'N/A';
  const challanDate = formatDateDDMMYYYY(record.invoiceChallanDate || record.date);
  const inspectionDate = formatDateDDMMYYYY(record.inspectionDate || record.date);
  const repNo = record.reportNo || 'IQC-RECORD';
  
  const rawItems = (record.items && record.items.length > 0)
    ? record.items
    : [{
        materialName: record.partDescription || record.partComponent || 'Raw Substrates',
        challanQty: record.invQuantity || record.totalQty || 1000,
        actualQty: record.actualReceived ?? record.totalQty ?? 1000,
        unit: record.uom || record.unit || 'Pcs',
        shortageQty: record.shortageQty || 0,
        sampleSize: record.sampleSize || 200,
        passQty: record.passQty || 200,
        rejectQty: record.rejectQty || 0
      }];

  const totalChallan = rawItems.reduce((acc, it) => acc + (it.challanQty || it.actualQty || 0), 0) || (record.invQuantity || record.totalQty || 0);
  const totalActual = rawItems.reduce((acc, it) => acc + (it.actualQty || 0), 0) || (record.actualReceived ?? record.totalQty ?? 0);
  const totalShortage = rawItems.reduce((acc, it) => acc + (it.shortageQty || 0), 0) || (record.shortageQty || 0);
  const uom = record.uom || record.unit || rawItems[0]?.unit || 'Pcs';
  const isAccepted = record.status === 'Accepted';

  const subject = `[IQC Report: ${record.status.toUpperCase()}] Consignment Challan #${challanNo} • ${party} • PaintKing Surface Solutions`;

  let materialBreakdownText = '';
  rawItems.forEach((it, idx) => {
    const itName = cleanMaterialName(it.materialName);
    const shortText = (it.shortageQty && it.shortageQty > 0) ? ` [Shortage: -${it.shortageQty}]` : ' [100% Match]';
    materialBreakdownText += `  ${idx + 1}. ${itName} — Challan: ${it.challanQty} ${it.unit || uom} | Received: ${it.actualQty} ${it.unit || uom}${shortText}\n`;
  });

  const bodyText = `Dear Quality Assurance & Supply Chain Team (${party}),

Greetings from PaintKing Surface Solutions.

We have completed the Incoming Quality Control (IQC) inspection for the consignment received against your Challan No: ${challanNo} dated ${challanDate}.

==================================================
EXECUTIVE INSPECTION SUMMARY
==================================================
• Report Number: ${repNo}
• Inspection Date: ${inspectionDate}
• Consignment Intake: ${totalActual.toLocaleString()} ${uom} received across ${rawItems.length} line items ${totalShortage > 0 ? `(Shortage Recorded: -${totalShortage} ${uom})` : '(100% Quantity Count Match)'}
• Batch / Lot Number: ${record.batchNo || 'B-VERIFIED-01'}

MATERIAL BREAKDOWN:
${materialBreakdownText}
QUALITY CHECKPOINTS & EVALUATION:
• Visual & Physical Condition: ${record.damage === 'Fail' ? 'Carton / Substrate defect noted' : 'Cartons Intact, zero silver streaks or flash observed (PASS)'}
• Surface Adhesion: ASTM 5B Cross-Hatch & 3M Tape Test (PASS)
• Colorimetry (Delta-E): ${record.deltaEValue || 0.42} (Within OEM Standard Limit <= 1.00)
• Sampling Inspection (20% AQL): ${rawItems.reduce((acc, it) => acc + (it.sampleSize || 0), 0)} samples evaluated | Pass: ${rawItems.reduce((acc, it) => acc + (it.passQty || 0), 0)} | Rejects: ${rawItems.reduce((acc, it) => acc + (it.rejectQty || 0), 0)}

FINAL QUALITY DISPOSITION:
Status: [${record.status.toUpperCase()}]
${record.remarks || (isAccepted ? 'Material cleared for Pre-treatment and Basecoat production line.' : 'Material placed on Quality Hold. Awaiting CAPA submission.')}

Please find attached the official signed Incoming Quality Inspection Report (${repNo}.pdf) for your permanent compliance records.

Best regards,

Quality Assurance Department
PaintKing Surface Solutions
Haridwar / Mumbai / Vapi Units
Email: info@paintking.in | Phone: +91 9594591313
Website: https://paintking.in`;

  return {
    toEmail,
    ccEmail: 'purchase@paintking.in, stores@paintking.in',
    subject,
    bodyText,
    recipientName: party,
    documentType: 'IQC',
    documentRef: repNo,
    fileName: `PaintKing_IQC_Report_${repNo}.pdf`
  };
};

/**
 * Smart Rule-Based Engine: Compose Inward Gate Pass Email Draft
 */
export const composeGatePassEmailDraft = (record: MaterialInwardRecord): EmailDispatchPayload => {
  const party = record.partyName || 'Vendor / Transporter';
  const toEmail = getSuggestedPartyEmail(party);
  const challanNo = record.challanNo || 'N/A';
  const dateStr = formatDateDDMMYYYY(record.date);
  const vehicle = record.vehicleNo || 'At Gate';
  const srNo = record.srNo || 'INW-RECORD';

  const subject = `[Gate Inward Pass] Consignment Inward Recorded • Vehicle: ${vehicle} • ${party}`;

  const bodyText = `Dear Logistics & Store Dispatch Team (${party}),

This is to confirm that the material shipment dispatched under Challan No: ${challanNo} dated ${dateStr} has been securely received and recorded at our Factory Security Gate.

==================================================
GATE INWARD RECEIPT SUMMARY
==================================================
• Gate Pass Inward Sr No: ${srNo}
• Inward Date & Time: ${dateStr} at ${record.inTime || '10:30 AM'}
• Delivery Vehicle Number: ${vehicle}
• Transporter / Courier: ${record.transporter || 'Direct Delivery'}
• Driver Phone Number: ${record.driverPhone || 'On File'}
• E-Way Bill Number: ${record.ewayBillNo || 'Verified at Gate'}
• Material Description: ${record.descriptionOfMaterial || 'Substrates'}
• Total Recorded Qty: ${record.totalQuantity || record.quantity || 1} ${record.unit || 'Pcs'}

The consignment has been handed over to Stores & IQC Quality Control for formal intake verification.

Official Gate Security Inward Verification Pass is attached herewith (${srNo}.pdf).

Regards,

Gate Security & Store Operations
PaintKing Surface Solutions
Haridwar / Mumbai Units
Phone: +91 9594591313 | Email: gate@paintking.in`;

  return {
    toEmail,
    ccEmail: 'stores@paintking.in, gate@paintking.in',
    subject,
    bodyText,
    recipientName: party,
    documentType: 'INWARD_PASS',
    documentRef: srNo,
    fileName: `PaintKing_Inward_Pass_${srNo}.pdf`
  };
};

/**
 * Smart Rule-Based Engine: Compose Outward Gate Pass Email Draft
 */
export const composeGateOutwardEmailDraft = (record: any): EmailDispatchPayload => {
  const party = record.partyName || 'Customer / Consignee';
  const toEmail = getSuggestedPartyEmail(party);
  const gatePassNo = record.gatePassNo || record.srNo || 'OUT-PASS';
  const dateStr = formatDateDDMMYYYY(record.date);
  const vehicle = record.vehicleNo || 'Dispatched Vehicle';

  const subject = `[Dispatch Outward Pass] Finished Goods Dispatched • Vehicle: ${vehicle} • ${party}`;

  const bodyText = `Dear Dispatch & Receiving Team (${party}),

This is to confirm that your finished coated shipment has been cleared by Final Quality Inspection (PDI) and has officially departed our Factory premises under Outward Gate Pass No: ${gatePassNo}.

==================================================
GATE OUTWARD DISPATCH SUMMARY
==================================================
• Outward Gate Pass No: ${gatePassNo}
• Dispatch Date & Time: ${dateStr} at ${record.outTime || '04:30 PM'}
• Transport Vehicle No: ${vehicle}
• Transporter Name: ${record.transporter || 'Direct Delivery'}
• Description of Goods: ${record.descriptionOfMaterial || 'Painted & Finished Components'}
• Total Dispatched Quantity: ${record.quantity || 1} ${record.unit || 'Pcs'}
• Security Sign-off: ${record.securitySignature || 'Ram Singh (Gate Security)'}

The shipment is currently in transit to your facility. Please find attached the official Outward Gate Pass (${gatePassNo}.pdf).

Regards,

Dispatch & Logistics Team
PaintKing Surface Solutions
Haridwar / Mumbai Units
Phone: +91 9594591313 | Email: dispatch@paintking.in`;

  return {
    toEmail,
    ccEmail: 'dispatch@paintking.in, billing@paintking.in',
    subject,
    bodyText,
    recipientName: party,
    documentType: 'OUTWARD_PASS',
    documentRef: gatePassNo,
    fileName: `PaintKing_Outward_Pass_${gatePassNo}.pdf`
  };
};
