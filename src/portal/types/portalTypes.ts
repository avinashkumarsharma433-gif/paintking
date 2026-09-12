/**
 * PaintKing Operations OS - Core Domain Types
 * Based on Paintking_Master_Formats_System_v1.xlsx & Floor Dynamics
 */

export type UserRole = 
  | 'DIRECTOR'         // Executive / Director (Kuldeep Singh, Gurprit Singh)
  | 'PLANT_HEAD'       // Plant Head (Vasai / Haridwar)
  | 'STORES'           // Stores & Inventory Manager
  | 'PRODUCTION'       // Production Supervisor / Booth Incharge
  | 'QA_QC'            // QA / QC Inspector & QA Manager
  | 'BILLING'          // Billing & Accounts Desk
  | 'SECURITY';        // Security Gate Guard

export type PlantLocation = 'Vasai' | 'Haridwar' | 'Vapi' | 'Mumbai';

export type ShiftType = 'Day 12H' | 'Night 12H';

export type DocumentStatus = 'Draft' | 'Submitted' | 'Verified' | 'Approved' | 'Hold' | 'Closed';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  plant: PlantLocation;
  avatar: string;
}

// 1. Inward Goods Receipt Note (PK-STR-GRN-001)
export interface OrderColorSplit {
  colorName: string;
  colorCode: string;
  orderedQty: number;
  unitRate: number;
  paintedQty?: number;
  passedQty?: number;
  billableQty?: number;
  status?: 'Pending' | 'In-Production' | 'Completed' | 'Over-Run';
}

export interface GoodsReceiptNote {
  grnNo: string;
  date: string;
  plant: PlantLocation;
  supplierCustomer: string;
  invoiceChallanNo: string;
  invoiceDate: string;
  vehicleNo: string;
  transporter: string;
  partCode: string;
  description: string;
  batchNo: string;
  invoicedQty: number;
  actualReceivedQty: number;
  colorSplits: OrderColorSplit[]; // Problem 1: Color Breakdown from Day 1
  iqcStatus: 'Pending' | 'Accepted' | 'Part Accepted' | 'Rejected' | 'Hold';
  storeIncharge: string;
  remarks?: string;
}

// 2. Inter-Stage Handover & Custody Transfer (PK-PRD-TRF-001) - Problem 2: 30 Missing Pieces Fix
export type ProductionStage = 
  | 'Raw Stores'
  | 'Surface Prep & Jigging'
  | 'Base Coat Painting'
  | 'Hydrographic Dipping / UV'
  | 'Clear Lacquer / Top Coat'
  | 'Oven Curing & De-jigging'
  | 'Final QA & Packing';

export interface CustodyHandover {
  transferId: string;
  date: string;
  time: string;
  plant: PlantLocation;
  woNo: string;
  jobCardNo: string;
  partCode: string;
  color: string;
  fromStage: ProductionStage;
  toStage: ProductionStage;
  senderName: string;
  senderQty: number;
  receiverName?: string;
  receiverQty?: number;
  status: 'Pending Receipt' | 'Accepted (Match)' | 'Discrepancy Halt' | 'Supervisor Resolved';
  discrepancyQty?: number; // e.g. -30
  discrepancyReason?: 'Dropped / In-Transit Damage' | 'Left in Drying/Oven Rack' | 'Booth Scrap' | 'Unaccounted Loss';
  discrepancyNote?: string;
  supervisorAction?: string;
  supervisorApprovedBy?: string;
  resolvedAt?: string;
}

// 3. Job Card with Color Caps (PK-PRD-JCR-001)
export interface JobCard {
  jobCardNo: string;
  woNo: string;
  customer: string;
  partCode: string;
  partDescription: string;
  model: string;
  color: string;
  targetQty: number;           // Target Cap e.g. 250 Red
  issuedRawQty: number;
  sprayedQty: number;          // Actual sprayed count
  goodQty: number;
  rejectQty: number;
  boothNo: string;
  painterName: string;
  paintBatch: string;
  thinnerBatch: string;
  hardenerBatch: string;
  status: 'Open' | 'In Process' | 'Target Met' | 'Over-Run Flagged' | 'Completed' | 'Closed';
  fpaStatus: 'Pending' | 'Approved' | 'Hold' | 'Rejected';
  startTime?: string;
  endTime?: string;
}

// 4. First Part Approval (FPA - Golden Gate) (PK-QA-FPA-001)
export interface FPARecord {
  reportNo: string;
  date: string;
  plant: PlantLocation;
  woNo: string;
  jobCardNo: string;
  customer: string;
  partCode: string;
  color: string;
  paintBatch: string;
  painter: string;
  booth: string;
  viscositySec: number;        // Ford Cup 4 viscosity (e.g. 14-16s)
  sample1: 'Pass' | 'Fail';
  sample2: 'Pass' | 'Fail';
  sample3: 'Pass' | 'Fail';
  sample4: 'Pass' | 'Fail';
  sample5: 'Pass' | 'Fail';
  L: number;
  a: number;
  b: number;
  deltaE: number;              // Must be <= 0.70
  adhesionPercent: number;     // Must be 100%
  crossCutTest: 'Pass' | 'Fail';
  tapeTest: 'Pass' | 'Fail';
  conductivity: 'Pass' | 'Fail' | 'N/A';
  overallResult: 'Approved' | 'Hold' | 'Rejected';
  qcEngineer: string;
  managerQAApproval: boolean;
  remarks?: string;
}

// 5. Paint Mixing Record (PK-PRD-PMX-001)
export interface PaintMixingRecord {
  mixNo: string;
  date: string;
  plant: PlantLocation;
  woNo: string;
  color: string;
  paintCode: string;
  paintBatch: string;
  paintQtyL: number;
  hardenerCode: string;
  hardenerBatch: string;
  hardenerQtyL: number;
  thinnerCode: string;
  thinnerBatch: string;
  thinnerQtyL: number;
  mixRatio: string;            // e.g. 4:1:1
  viscosityFordCupSec: number; // e.g. 15s
  potLifeEnd: string;
  mixedBy: string;
  usageBooth: string;
}

// 6. 3-Hourly IPQC Inspection (PK-QA-IPQ-001)
export interface IPQCRecord {
  reportNo: string;
  date: string;
  plant: PlantLocation;
  shift: ShiftType;
  checkTime: string;           // e.g. 09:00, 12:00, 15:00
  woNo: string;
  partCode: string;
  color: string;
  painter: string;
  booth: string;
  bubble: 'Pass' | 'Fail';
  dust: 'Pass' | 'Fail';
  overPaint: 'Pass' | 'Fail';
  missingPaint: 'Pass' | 'Fail';
  scratch: 'Pass' | 'Fail';
  deltaE: number;
  adhesionPercent: number;
  result: 'Pass' | 'Fail' | 'Hold';
  inspector: string;
}

// 7. Packing & Box Traceability (PK-STR-PKG-001)
export interface PackingSlipRecord {
  slipNo: string;
  date: string;
  plant: PlantLocation;
  customer: string;
  woNo: string;
  partCode: string;
  model: string;
  color: string;
  boxNo: string;
  packedQty: number;
  painter: string;
  paintBatch: string;
  packedBy: string;
  qcVerified: boolean;
}

// 8. OQC & PDI Final Quality Release (PK-QA-OQC-001 & PK-QA-PDI-001)
export interface FinalQualityRelease {
  releaseId: string;
  date: string;
  plant: PlantLocation;
  woNo: string;
  customer: string;
  partCode: string;
  color: string;
  offeredQty: number;
  sampledQty: number;
  passedQty: number;
  rejectedQty: number;
  deltaE: number;
  adhesion: 'Pass' | 'Fail';
  boxLabelMatch: 'Pass' | 'Fail';
  oqcStatus: 'Accepted' | 'Rejected' | 'Hold';
  pdiStatus: 'Cleared for Invoicing' | 'Hold';
  inspector: string;
  plantHeadSign: string;
}

// 9. Billing & Reconciliation Invoice (PK-ACC-INV-001) - Problem 1 Fix
export interface BillableLineItem {
  id: string;
  colorName: string;
  orderedQty: number;
  passedAndPackedQty: number;
  billableQty: number;
  excessQty: number;           // over-run e.g. +50
  excessApprovedByClient: boolean;
  unitRate: number;
  lineTotal: number;
  status: 'Contract Fulfilled' | 'Shortfall / Pending' | 'Excess On Hold';
}

export interface BillingInvoice {
  invoiceNo: string;
  invoiceDate: string;
  woNo: string;
  customer: string;
  plant: PlantLocation;
  lineItems: BillableLineItem[];
  subTotal: number;
  gstPercent: number;
  gstAmount: number;
  cgstAmount?: number;
  sgstAmount?: number;
  grandTotal: number;
  totalOrderedQty: number;
  totalBilledQty: number;
  status: 'Draft' | 'Generated' | 'Dispatched' | 'Paid';
  balanceBacklogNote?: string;
  preparedBy: string;
}

// 10. Gate Pass (PK-ADM-GTP-001)
export interface GatePassRecord {
  gatePassNo: string;
  date: string;
  time: string;
  plant: PlantLocation;
  type: 'Inward' | 'Outward';
  movementType: 'Customer Material' | 'Finished Goods' | 'Returnable' | 'Scrap' | 'Tool/Sample';
  partyName: string;
  vehicleNo: string;
  driverPhone?: string;
  itemDescription: string;
  qty: number;
  referenceDoc: string; // GRN or Invoice No
  status: 'Open' | 'Security Out' | 'Security In' | 'Closed';
  securityOfficer: string;
}

// 11. Defect & CAPA Record (PK-QA-REJ-001 & PK-QA-CAP-001)
export interface DefectItem {
  code: string; // D01-D16
  name: string;
  severity: 'Critical' | 'Major' | 'Minor';
  count: number;
}
