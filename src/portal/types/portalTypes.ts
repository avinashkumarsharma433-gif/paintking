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

// NEXT-GEN SINGLE UNIVERSAL JOB RECORD & STRICT GATING TYPES
export type MaterialCategoryOption = 'Party Material' | 'Internal Company';

export type JobPipelineStage = 
  | '1. Gate Intake'
  | '2. Store Receipt'
  | '3. Pre-Spray IQC'
  | '4. Shop Floor Spraying'
  | '5. Strict Final QA'
  | '6. Billing Invoice'
  | '7. Outward Dispatched';

export interface PreSprayIQCRecord {
  inspectedQty: number;
  approvedQty: number;       // Fit for spraying (allowed to move to Spraying booth!)
  rejectedQty: number;       // Raw substrate defect (returned to store/party)
  defectReason?: 'Raw Substrate Crack' | 'Flash Marks' | 'Silver Lines' | 'Surface Oil / Grease' | 'Molding Warp';
  inspector: string;
  timestamp: string;
  status: 'Pending' | 'Passed' | 'Hold';
  remarks?: string;
}

export interface FinalQAGateRecord {
  spectrophotometerDeltaE: number; // Spectrophotometer ΔE (Must be <= 0.70)
  adhesionTest: 'Pass (100% Tape)' | 'Fail (Flaking)';
  goodQty: number;
  rejectQty: number;
  qcEngineer: string;
  timestamp: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Hold'; // Locked if Rejected!
  remarks?: string;
}

export interface PieceTrackingDetails {
  totalInward: number;       // Total received at Gate
  preSprayApproved: number;  // Passed Pre-Spray IQC
  preSprayRejected: number;  // Substrate rejected before spray
  sprayedGood: number;       // Good sprayed parts
  finalQaPassed: number;     // QA approved parts
  finalQaRejected: number;   // QA rejected parts
  billedQty: number;         // Invoiced parts
  dispatchedQty: number;     // Outward dispatched
}

export interface UniversalJobRecord {
  jobId: string;             // SINGLE UNIVERSAL ID e.g. "PK-JOB-2026-101"
  partyName: string;
  customerRefChallan: string;
  vehicleNo: string;
  category: MaterialCategoryOption; // STRICT 2 OPTIONS: 'Party Material' | 'Internal Company'
  createdDate: string;
  createdTime: string;
  
  // Single Job Material Specifications
  materialName: string;
  totalQuantity: number;
  unit: string;              // Pcs, Litres, KG, Drums, Boxes
  colorName: string;
  colorCode: string;
  unitRate: number;

  // Pipeline Status & Strict Gating Flags
  currentStage: JobPipelineStage;
  isPreSprayIqcApproved: boolean; // Must be true to enter Production!
  isFinalQaApproved: boolean;     // Must be true to enter Billing & Dispatch!
  
  // Embedded Stage Data
  preSprayIQC?: PreSprayIQCRecord;
  finalQA?: FinalQAGateRecord;
  pieceTracking: PieceTrackingDetails;
  
  storeIncharge?: string;
  securityOfficer?: string;
  remarks?: string;
}

// 1. Inward Goods Receipt Note (PK-STR-GRN-001 / Doc No: 00)
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

export interface GRNLineItem {
  id?: string;
  partCode: string;
  partDescription: string;
  invoicedQty: number;
  actualReceivedQty: number;
  shortExcessQty: number; // actualReceivedQty - invoicedQty
  okByIqcQty: number;
  rejectionQty: number;
  remark?: string;
}

export interface GoodsReceiptNote {
  docNo?: string;           // "DOC NO: 00"
  revNo?: string;           // "00"
  revDate?: string;
  grnNo: string;            // "PK-GRN-2026-881"
  date: string;             // "2026-09-13"
  plant: PlantLocation;
  vehicleNo: string;
  supplierCustomer: string; // Supplier / Customer Name
  invoiceChallanNo: string;
  invoiceDate: string;
  receivedDate: string;
  transporter: string;      // Transport Name
  items: GRNLineItem[];     // Line items table
  totalQty: number;         // Sum of actual received qty
  iqcStatus: 'Pending' | 'Accepted' | 'Part Accepted' | 'Rejected' | 'Hold';
  storeIncharge: string;
  qualityApprovedBy?: string;
  approvedBy?: string;
  remarks?: string;
  // Compatibility fields for easy access
  partCode?: string;
  description?: string;
  invoicedQty?: number;
  actualReceivedQty?: number;
  colorSplits?: OrderColorSplit[];
}

// 2. Inter-Stage Handover & Custody Transfer (PK-PRD-TRF-001)
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

// 3. Job Card Cubic Paint Frame (PK-PRD-JCR-001 / Doc No: 001)
export interface IssuedMaterialItem {
  id?: string;
  itemDescription: string;  // e.g. ABS TV Bezel / Basecoat Metallic Red / Thinner 400
  qty: number;
  colour: string;
  uom: string;              // Pcs, Litres, KG, Drums, Mtr
  remark?: string;
}

export interface ProcessStageCount {
  totalQty: number;
  okQty: number;
  rejectionQty: number;
}

export interface JobCard {
  docNo?: string;           // "Doc No: 001"
  revNo?: string;           // "00"
  revDate?: string;
  jobCardNo: string;        // "JC-99824-RED"
  woNo: string;             // W.No. (Work Order No)
  customer: string;
  partCode: string;
  partDescription: string;
  model?: string;
  color: string;
  targetQty: number;        // Target Cap e.g. 250
  sprayedQty: number;       // Actual sprayed count
  goodQty: number;
  rejectQty: number;
  status: 'Open' | 'In Process' | 'Target Met' | 'Over-Run Flagged' | 'Completed' | 'Closed';
  fpaStatus?: 'Pending' | 'Approved' | 'Hold' | 'Rejected';

  // INITIAL PROCESS (Exact Screenshot 1)
  painterName: string;
  wNo: string;              // W.No.
  issueDate: string;
  issueTime: string;
  leadTime: string;
  dept: string;             // Dept. e.g. Base Coat, Dipping, UV, Spray

  // FINAL PROCESS (Return tracking - Exact Screenshot 1)
  returnMaterialDesc?: string;
  returnPainterName?: string;
  returnDate?: string;
  returnTime?: string;
  returnOkQty?: number;
  returnRejectionQty?: number;
  checkingPerson?: string;
  headerRemark?: string;

  // ISSUE MATERIAL DETAILS TABLE (Exact Screenshot 1)
  issuedMaterials: IssuedMaterialItem[];

  // SIGNATURES
  storeIncharge: string;
  prodSupervisor: string;
  approvedBy: string;

  // 3-STAGE PRODUCTION PROCESS TRACKING (Exact Screenshot 1)
  stageProcessFirst?: ProcessStageCount;  // Process First (Base Coat)
  stageProcessSecond?: ProcessStageCount; // Process Second (Dipping)
  stageProcessThird?: ProcessStageCount;  // Process Third (Final Laquar)
  stageRemark?: string;
  preparedBy?: string;
  checkedBy?: string;
  stageApprovedBy?: string;

  // Legacy/compatibility fields
  boothNo?: string;
  paintBatch?: string;
  thinnerBatch?: string;
  hardenerBatch?: string;
  issuedRawQty?: number;
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

// 1b. IQC Incoming Material Inspection (PK-STR-IQC-001)
export interface IQCInspectionRecord {
  reportNo: string;
  date: string;
  plant: PlantLocation;
  supplierCustomer: string;
  partCode: string;
  batchNo: string;
  totalQty: number;
  sampledQty: number;
  damage: 'Pass' | 'Fail';
  scratch: 'Pass' | 'Fail';
  sinkMark: 'Pass' | 'Fail';
  shortFill: 'Pass' | 'Fail';
  bubble: 'Pass' | 'Fail';
  pinMark: 'Pass' | 'Fail';
  dustSpot: 'Pass' | 'Fail';
  overPaint: 'Pass' | 'Fail';
  paintMissing: 'Pass' | 'Fail';
  colour: 'Pass' | 'Fail';
  overallFinishing: 'Pass' | 'Fail';
  status: 'Accepted' | 'Hold' | 'Rejected';
  inspector: string;
  remarks?: string;
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
  dustSpot: 'Pass' | 'Fail';
  overPaint: 'Pass' | 'Fail';
  paintMissing: 'Pass' | 'Fail';
  L: number;
  a: number;
  b: number;
  deltaE: number;              // Spectrophotometer ΔE
  overallFinishing: 'Pass' | 'Fail';
  adhesionTest: 'Pass' | 'Fail';
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
  packingBoxCondition: 'Pass' | 'Fail';
  traceabilityBatchNo: 'Pass' | 'Fail';
  quantityMatch: 'Pass' | 'Fail';
  physicalInspection: 'Pass' | 'Fail';
  conductivity: 'Pass' | 'Fail' | 'N/A';
  adhesion: 'Pass' | 'Fail';
  deltaE: number;
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

// 10. Gate Pass & Security Registers (PK-ADM-GTP-001)
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

// 10b. Dynamic Line Item for Material Inward (Supports 4-5 different items per truck arrival)
export interface InwardMaterialLineItem {
  id: string;
  materialName: string; // e.g. "Paint Daba 2KG", "ABS Vent Bezel", "Thinner Drum"
  quantity: number;     // e.g. 5
  unit: 'Pcs' | 'Litres' | 'Drums' | 'Boxes' | 'Kg' | 'Rolls' | 'Packets';
  remarks?: string;
}

// 10b. Security Material Inward Register (12 Fields + Multi-Item Dynamic Rows)
export interface MaterialInwardRecord {
  srNo: string;
  date: string;
  challanNo: string;
  grnNo: string;
  inTime: string;
  vehicleNo: string;
  partyName: string;
  descriptionOfMaterial?: string; // Summary of items
  quantity?: number;
  unit?: 'Pcs' | 'Litres' | 'Drums' | 'Boxes' | 'Kg' | 'Rolls' | 'Packets';
  items: InwardMaterialLineItem[]; // Multi-item dynamic rows for 1 vehicle!
  totalQuantity: number;
  materialCategory: 'Party Material' | 'Internal Company'; // EXACT 2 OPTIONS REQUESTED!
  receivedBy: string;
  securitySignature: string;
  remarks?: string;
  plant: PlantLocation;
  status: 'Received at Gate' | 'Handed to Stores' | 'Issued to Floor';
}


// 10c. Security Material Outward Register (11 Fields)
export interface MaterialOutwardRecord {
  srNo: string;
  date: string;
  vehicleNo: string;
  gatePassNo: string;
  outTime: string;
  partyName: string;
  descriptionOfMaterial: string;
  quantity: number;
  unit: 'Pcs' | 'Litres' | 'Drums' | 'Boxes' | 'Kg';
  transporter: string;
  securitySignature: string;
  remarks?: string;
  plant: PlantLocation;
}

// 11. Defect & CAPA Record (PK-QA-REJ-001 & PK-QA-CAP-001)
export interface DefectItem {
  code: string; // D01-D16
  name: string;
  severity: 'Critical' | 'Major' | 'Minor';
  count: number;
}

