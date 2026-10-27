/**
 * PaintKing Operations OS - Core Domain Types
 * Based on Paintking_Master_Formats_System_v1.xlsx & Floor Dynamics
 */

export type UserRole = 
  | 'DIRECTOR'         // Executive / Director (Kuldeep Singh, Gurprit Singh)
  | 'PLANT_HEAD'       // Plant Head (Vasai / Haridwar / Vapi / Mumbai)
  | 'STORES'           // Stores & Inventory Manager
  | 'PRODUCTION'       // Production Supervisor / Booth Incharge
  | 'QA_QC'            // QA / QC Inspector
  | 'BILLING'          // Billing & Accounts Desk
  | 'SECURITY'         // Security Gate Guard
  | 'IQC_INSPECTOR'    // Incoming Quality Inspector (Gate 1)
  | 'FPA_IPQC_INSPECTOR' // First Part & In-Process Inspector (Gates 2 & 3)
  | 'OQC_PDI_INSPECTOR'  // Outgoing Quality & Pre-Dispatch Inspector (Gates 4 & 5)
  | 'MANAGER_QA'       // Quality Assurance Manager / Final Sign-off
  | 'OPERATOR'         // Painter / Line Operator
  | 'HR'               // HR Desk / Leave Administration
  | 'DEPT_INCHARGE';   // Department Incharge (Leave sanctioning)

export type PlantLocation = 'Vasai' | 'Haridwar' | 'Vapi' | 'Mumbai';

export type ShiftType = 'General Day Shift (08:30 - 18:30)' | 'Day 12H' | 'Night 12H';

export type JobCardType = 'master' | 'painter_child' | 'rework_child';

export type DefectCategory = 
  | 'dust_nibs' 
  | 'paint_run' 
  | 'orange_peel' 
  | 'scratch' 
  | 'undercoat_show' 
  | 'shade_deviation' 
  | 'pinhole' 
  | 'none';

export interface PlantDayEndClosure {
  id: string;
  plant: PlantLocation;
  closureDate: string;
  shiftName: string; // 'General Day Shift (08:30 - 18:30)'
  totalPiecesSprayed: number;
  totalFirstPassGood: number;
  totalReworkInQueue: number;
  totalScrap: number;
  overnightWipCount: number;
  status: 'Open Day Active' | 'EOD Shutdown (Locked)';
  closedBy?: string;
  closedAt?: string;
  reopenedBy?: string;
  reopenedAt?: string;
  remarks?: string;
}

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
  challanDate?: string;
  receivingDate?: string;
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
  receivedDate?: string;
  transporter: string;      // Transport Name
  items?: GRNLineItem[];     // Line items table
  totalQty?: number;         // Sum of actual received qty
  iqcStatus: 'Pending' | 'Accepted' | 'Part Accepted' | 'Rejected' | 'Hold';
  storeIncharge: string;
  qualityApprovedBy?: string;
  approvedBy?: string;
  remarks?: string;
  // Compatibility fields for easy access
  partCode?: string;
  description?: string;
  batchNo?: string;
  invoicedQty?: number;
  actualReceivedQty?: number;
  colorSplits?: OrderColorSplit[];
  sourceIqcReportNo?: string;
}

// 1.5 Material Requisition & Store-to-Production Handshake (PK-PRD-MRN-001 / Doc No: 002)
export type RequisitionStatus = 
  | 'Pending Store Issue'      // Production raised demand, waiting for Store
  | 'Dispatched by Store'     // Store issued MIN slip, waiting for Production to receive
  | 'Received by Production'   // Production Supervisor verified count & accepted
  | 'Discrepancy Flagged'     // Physical count mismatch (e.g. sent 500, received 490)
  | 'Cancelled';

export interface MaterialRequisitionNote {
  mrnNo: string;               // e.g. "MRN-2026-001"
  date: string;
  time: string;
  plant: PlantLocation;
  jobCardNo: string;           // Target Job Card e.g. "JC-1042-RED"
  woNo: string;
  customer: string;
  partCode: string;
  partDescription: string;
  colorName?: string;
  requestedQty: number;
  uom: string;                 // Pcs, Litres, Kg
  requiredShift: ShiftType;
  requestedBy: string;         // Production Manager / Line Supervisor
  urgency: 'Normal' | 'High (Line Stoppage Risk)' | 'Urgent Batch Run';
  status: RequisitionStatus;
  
  // Store Handshake Fields
  issuedSlipNo?: string;       // Generated MIN slip e.g. "MIN-2026-001"
  sourceGrnNo?: string;        // Inward lot allocated e.g. "PK-GRN-2026-1252"
  issuedQty?: number;
  storeInchargeName?: string;
  storeIssuedTimestamp?: string;
  storeRemarks?: string;

  // Production Handshake & Receipt Fields
  receivedQty?: number;
  receivedBy?: string;
  receivedTimestamp?: string;
  discrepancyQty?: number;     // e.g. -10 pcs
  discrepancyReason?: 'Damaged in Trolley Transit' | 'Count Shortage from Store' | 'Wrong Shade / Drum' | 'Packaging Tear';
  productionRemarks?: string;
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

export interface JobCardMaterialAllocation {
  id?: string;
  partCode: string;
  partDescription: string;
  grnTotalQty: number;
  alreadyAllocatedQty: number;
  availableQty: number;
  allocatedQty: number;
  color: string;
  uom?: string;
}

export interface ProcessStageCount {
  totalQty: number;
  okQty: number;
  rejectionQty: number;
  receivedBy?: string;
  receivedTimestamp?: string;
  isReceivedVerified?: boolean;
  receivedDiscrepancyQty?: number;
  stageOperatorNotes?: string;
}

export type PainterJobStatus = 
  | 'Assigned'                           // Production Manager assigned, Painter not started
  | 'In Progress'                        // Painter started spraying
  | 'Painter Finished (Pending Review)'  // Painter marked complete, awaiting PM floor verification
  | 'Verified & Accepted'                // PM inspected & accepted -> releases to QA
  | 'Rework Requested';                  // PM found defects, returned to painter

export interface PainterProfile {
  id: string;
  name: string;
  code: string; // e.g. "P1", "P2"
  avatar: string;
  boothNo: string;
  boothNumber?: string;
  shift: ShiftType;
  specialization: string; // e.g. "PU Metallic Spray", "Clear Coat & Dipping"
  onTimeJobsCount?: number;
  delayedJobsCount?: number;
}

export type JobCardNature = 'STANDARD_PRODUCTION' | 'SAMPLING_RND';

export interface SamplingRecipeSheet {
  basePaintBrand: string;
  basePaintCode: string;
  hardenerCode: string;
  thinnerCode: string;
  mixingRatio: string; // e.g. "4:1:1"
  viscositySec: number; // e.g. 18s Ford Cup 4
  airPressureBar: number; // e.g. 2.2 bar
  nozzleSizeMm: number; // e.g. 1.3 mm
  numberOfCoats: string; // e.g. "1 Primer + 2 Base + 1 Clear"
  flashOffMins: number; // e.g. 10 mins
  bakingTempC: number; // e.g. 65°C
  bakingTimeMins: number; // e.g. 30 mins
  achievedDeltaE: number; // e.g. 0.38
  achievedGloss60: number; // e.g. 92 GU
  technicianPainter: string;
  labChemist: string;
  loggedAt?: string;
  isLockedAsMasterRecipe?: boolean;
  notes?: string;
}

export interface SamplingPartyApproval {
  status: 'Pending In-House Trial' | 'Sample Dispatched to Party' | 'Party Approved' | 'Party Revision Requested';
  dispatchedAt?: string;
  courierOrHandover?: string;
  partyFeedback?: string;
  approvedAt?: string;
  approvedByPartyPerson?: string;
}

export type CoatingProcessStage = 
  | 'stage_1_primer'      // Primer Undercoat / Pre-Treatment
  | 'stage_2_basecoat'    // Basecoat Colour Coat / Hydrographic Immersion
  | 'stage_3_topcoat';    // Clear Topcoat / Final Baking & QC

export type JobCardActionType = 
  | 'BATCH_OUTPUT'         // Production batch sprayed/logged
  | 'MATERIAL_ISSUED'      // Additional paint, solvent or consumable issued
  | 'JOB_CREATED'          // Initial job card created & launched
  | 'STATUS_CHANGE'        // Status transitioned (e.g. Target Met)
  | 'DETAILS_UPDATED';     // Modifications to deadline, booth, painter, etc.

export interface JobCardProductionProgressLog {
  id: string;
  timestamp: string; // ISO string
  timeLabel: string; // e.g. "04:45 PM"
  dateLabel: string; // e.g. "27-10-2026"
  actionType?: JobCardActionType;
  actionTitle?: string;
  exactChanges?: string[]; // Detailed list of exact updates performed
  piecesCompleted: number; // pieces finished in this slot
  goodPieces?: number; // good pieces passed in this slot
  cumulativeGoodQty: number; // running good total
  reworkPieces?: number;
  scrapPieces?: number;
  defectCategory?: DefectCategory;
  defectReason?: string;
  processStage?: CoatingProcessStage;
  stageName?: string;
  painterName: string;
  boothNo?: string;
  recordedBy: string;
  remarks?: string;
}

export interface JobCard {
  jobCardNature?: JobCardNature;
  samplingRecipe?: SamplingRecipeSheet;
  samplingApproval?: SamplingPartyApproval;
  progressLogs?: JobCardProductionProgressLog[];
  materialAllocations?: JobCardMaterialAllocation[];
  primerCompletedQty?: number;
  primerRejectQty?: number;
  basecoatCompletedQty?: number;
  basecoatRejectQty?: number;
  topcoatCompletedQty?: number;
  topcoatRejectQty?: number;
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
  pirStatus?: 'Pending' | 'Passed' | 'Hold' | 'Rejected'; // Quality Gate 1: Pre-Production Substrate Inspection
  pirReportNo?: string;
  pirPassedAt?: string;
  fpaStatus?: 'Pending' | 'Approved' | 'Hold' | 'Rejected'; // Quality Gate 2: First Part Approval
  storesDispatchStatus?: 'Pending' | 'Dispatched';
  storesDispatchedAt?: string;
  
  // Painter Execution & Verification Lifecycle
  painterJobStatus?: PainterJobStatus;
  painterStartedAt?: string;
  painterFinishedAt?: string;
  painterNotes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationRemarks?: string;
  closedAt?: string;
  isOnTimeCompleted?: boolean;

  // 3-Painters & Rework Architecture
  jobCardType?: JobCardType;
  assignedPainterId?: string;
  assignedPainterName?: string; // e.g. "Ramesh Kumar (P1)", "Suresh Verma (P2)", "Mahesh Sharma (P3)"
  parentJobCardId?: string;
  allocatedQty?: number;
  firstPassGoodQty?: number;
  reworkFlaggedQty?: number;
  reworkRecoveredQty?: number;
  scrapQty?: number;
  defectCategory?: DefectCategory;
  reworkInstructions?: string;
  reworkStatus?: 'Pending Sanding' | 'In Re-spray' | 'In Oven Re-bake' | 'Passed QC' | 'Scrapped';

  // SLA & Sequential Gate Control
  processType?: string;
  slaHours?: number;
  slaDeadline?: string;
  deadlineDate?: string;
  deadlineTime?: string;
  remainingQty?: number;
  isSlaBreached?: boolean;
  sourceGrnNo?: string;
  iqcApproved?: boolean;
  oqcApproved?: boolean;
  pdiApproved?: boolean;

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
export interface FPAVisualCheckRow {
  bubble: ('Pass' | 'Fail')[];
  dustSpot: ('Pass' | 'Fail')[];
  overPaint: ('Pass' | 'Fail')[];
  paintMissing: ('Pass' | 'Fail')[];
  colour: ('Pass' | 'Fail')[];
  overallFinishing: ('Pass' | 'Fail')[];
}

export interface FPADeltaValueRow {
  L: (number | string)[];      // 5 Samples S1 - S5
  a: (number | string)[];      // 5 Samples S1 - S5
  b: (number | string)[];      // 5 Samples S1 - S5
  deltaE: (number | string)[]; // 5 Samples S1 - S5
}

// 1c. Pre-Production Inspection Report (PIR / Pre-Treatment & Substrate Gate)
export interface PreProductionInspectionRecord {
  docNo?: string;           // "PK-QA-PIR-001"
  issueDate?: string;       // "01.01.2021"
  revNo?: string;           // "00"
  revDate?: string;         // "00"
  reportNo: string;         // e.g. "PK-PIR-2026-001"
  date: string;
  plant: PlantLocation;
  customer: string;
  workOrderNo: string;
  jobCardNo: string;
  partCode: string;
  partDescription: string;
  substrateMaterial: string; // e.g. 'ABS (Acrylonitrile Butadiene Styrene)', 'PC', 'Aluminum'
  family?: string;
  color?: string;
  paintDescription?: string;
  paintBatch?: string;
  
  // Quantities
  issuedQty: number;        // Total parts issued from Stores
  inspectedQty: number;     // 100% parts inspected
  acceptedQty: number;      // Good clean raw parts
  rejectedQty: number;      // Raw defect parts
  rejectionReason?: string; // Reason for raw defect rejection
  
  // 8 Critical Substrate Checkpoints
  physicalCondition: 'Pass' | 'Fail';       // No transit scratches, dents, cracks
  burrsFlashSinkMarks: 'Pass' | 'Fail';     // Clean edges, parting lines, no sink marks
  oilGreaseChemical: 'Pass' | 'Fail';       // 100% Free from grease/silicone/mold release
  cleaningIpaWiping: 'Pass' | 'Fail';       // Cleaned with IPA (Isopropyl Alcohol)
  staticDedusting: 'Pass' | 'Fail';         // Ionized air blow cleaned
  maskingProtection: 'Pass' | 'Fail' | 'N/A'; // Masking accuracy as per drawing
  jiggingOrientation: 'Pass' | 'Fail';     // Secure hook clamping, no touch points
  quantityVerification: 'Pass' | 'Fail';   // Physical count matches issued qty
  
  // Decision & Authorization
  overallResult: 'Passed' | 'Hold' | 'Rejected';
  remarks?: string;
  inspectedBy: string;          // Substrate / Pre-treatment Inspector
  productionSupervisor: string; // Floor Supervisor
  qaEngineer: string;           // QA Release Engineer
  generatedAt?: string;
}

export interface FPARecord {
  reportNo: string;
  date: string;
  plant: PlantLocation;
  woNo: string;
  jobCardNo: string;
  customer: string;
  partCode: string;
  partDescription?: string;
  family?: string;              // Component Family / Mould Family (e.g. Switch Frame, Bezel, Auto Trim)
  color: string;
  paintDescription?: string;   // e.g. "Monza Red 2K PU Basecoat"
  paintBatch: string;
  thinnerBatch?: string;       // e.g. "THN-2609-02"
  painter: string;
  booth: string;
  startupTime?: string;        // e.g. "08:30 AM"
  approvalTime?: string;       // e.g. "09:15 AM"
  viscositySec: number;        // Ford Cup 4 viscosity (e.g. 14-16s)
  
  // 1. Visual Tests Checklist
  visualChecks?: FPAVisualCheckRow;
  sample1: 'Pass' | 'Fail';
  sample2: 'Pass' | 'Fail';
  sample3: 'Pass' | 'Fail';
  sample4: 'Pass' | 'Fail';
  sample5: 'Pass' | 'Fail';
  
  // 2. Adhesion Test & Tape Impression Space
  adhesionPercent: number;     // Must be 100%
  crossCutTest: 'Pass' | 'Fail';
  tapeTest: 'Pass' | 'Fail';
  tapeImpressionBox?: boolean; // Physical box for sticking 3M adhesive cross-cut tape
  
  // 3. Delta Value Test (Master Reference LAB + 5 Production Samples S1 - S5)
  masterLab?: FPAMasterLab;
  masterL?: number | string;
  masterA?: number | string;
  masterB?: number | string;
  deltaSamples?: FPADeltaValueRow;
  L: number;
  a: number;
  b: number;
  deltaE: number;              // Overall / Avg or Master DeltaE
  deltaToleranceLimit?: number; // Configurable OEM/Client Delta Tolerance Limit (e.g. 0.70, 1.00)
  
  conductivity?: 'Pass' | 'Fail' | 'N/A';
  overallResult: 'Approved' | 'Hold' | 'Rejected';
  
  // Signatures & Notes
  qcEngineer: string;
  managerQAApproval: boolean;
  remarks?: string;
  acceptancePainter?: string;
  acceptanceProductionIncharge?: string;
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
export interface IQCAspectItem {
  srNo: number;
  aspect: string;
  methodOfMeasurement: string;
  impact: 'Critical' | 'Major' | 'Minor';
  result: 'Pass' | 'Fail' | string;
  observation?: string;
}

export interface IQCVerifiedItem {
  id: string;
  materialName: string;
  challanQty: number;
  actualQty: number;
  unit: string;
  isReceived: boolean;
  condition: 'Intact & Clean' | 'Damaged / Scratched' | 'Wet' | 'Repacked';
  shortageQty: number;
  notes?: string;
  sampleSize?: number;
  passQty?: number;
  rejectQty?: number;
  rejectionPercent?: number;
  defectDetail?: string;
}

export interface IQCInspectionRecord {
  reportNo: string;
  inwardSrNo?: string;           // Linked Security Gate Inward Entry
  date: string;
  inspectionDate?: string;
  inspectionTime?: string;
  generatedAt?: string;          // ISO timestamp when report was generated
  generatedTimestamp?: string;   // Formatted human-readable timestamp e.g. "22 Sep 2026, 04:47 PM"
  plant: PlantLocation;
  vendorCustomer: string;
  supplierCustomer?: string;     // Backward compat
  partComponent: string;
  partCode?: string;             // Backward compat
  partDescription?: string;
  invoiceChallanNo: string;
  invoiceChallanDate: string;
  batchNo: string;
  invQuantity: number;
  totalQty?: number;             // Backward compat
  uom: string;
  unit?: string;
  actualReceived: number;
  shortageQty?: number;          // Discrepancy = invQuantity - actualReceived
  excessQty?: number;
  boxCondition?: 'Intact & Clean' | 'Damaged / Crushed' | 'Wet / Moisture' | 'Repacked';
  hasDiscrepancy?: boolean;
  discrepancyReportedToProductionManager?: boolean;
  productionManagerNote?: string;
  
  // Security line items verified by IQC
  items?: IQCVerifiedItem[];

  // The 7 Core + any Optional aspects
  aspects?: IQCAspectItem[];

  sampleSize?: number;
  samplePercentage?: number;     // Standard 20% rule
  sampledQty?: number;           // Backward compat
  passQty?: number;
  rejectQty?: number;
  rejectionPercent?: number;
  rejectionDetail?: string;
  batchRejectionTriggered?: boolean; // Triggered if rejection >= 1.0% in sample
  
  docNo?: string;                // "DOC NO: 00" / "Issue Date - 01.01.2021"
  revNo?: string;                // "00"
  revDate?: string;              // "00"
  
  rootCause?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  remarks?: string;

  // Visual individual defect checks for backward compat
  damage?: 'Pass' | 'Fail';
  scratch?: 'Pass' | 'Fail';
  sinkMark?: 'Pass' | 'Fail';
  shortFill?: 'Pass' | 'Fail';
  bubble?: 'Pass' | 'Fail';
  pinMark?: 'Pass' | 'Fail';
  dustSpot?: 'Pass' | 'Fail';
  overPaint?: 'Pass' | 'Fail';
  paintMissing?: 'Pass' | 'Fail';
  colour?: 'Pass' | 'Fail';
  overallFinishing?: 'Pass' | 'Fail';

  status: 'Accepted' | 'Hold' | 'Rejected' | 'Part Accepted';
  inspector?: string;
  preparedBy?: string;           // IQC Inspector
  verifiedBy?: string;           // Production Manager / QA Manager
}

// 6. Multi-Slot In-Process Inspection Report (PK-QA-IPQ-001 / Exact Format)
export type IPQCTimeSlotKey = 
  | 'slot_08_11' // 08:00 - 11:00 (Shift A)
  | 'slot_11_14' // 11:00 - 14:00 (Shift A)
  | 'slot_14_17' // 14:00 - 17:00 (Shift A)
  | 'slot_17_20' // 17:00 - 20:00 (Shift A)
  | 'slot_20_23' // 20:00 - 23:00 (Shift B)
  | 'slot_23_02' // 23:00 - 02:00 (Shift B)
  | 'slot_02_05' // 02:00 - 05:00 (Shift B)
  | 'slot_05_08'; // 05:00 - 08:00 (Shift B)

export interface IPQCSlotObservation {
  bubble?: 'Pass' | 'Fail' | string;
  dustSpot?: 'Pass' | 'Fail' | string;
  overPaint?: 'Pass' | 'Fail' | string;
  paintMissing?: 'Pass' | 'Fail' | string;
  L?: number | string;
  a?: number | string;
  b?: number | string;
  deltaE?: number | string;
  overallFinishing?: 'Pass' | 'Fail' | 'Perfect' | string;
  adhesionTest?: 'Pass' | 'Fail' | 'Perfect' | string;
}

export interface IPQCRecord {
  reportNo: string;
  date: string;
  plant: PlantLocation;
  
  // Header Meta from Official Sheet
  docNo?: string;                  // e.g. "DOC NO: PK-QA-IPQ-001"
  issueDate?: string;              // "01.01.2021"
  revNo?: string;                  // "00"
  revDate?: string;                // "00"
  
  // Job & Paint Mix Identification
  partDescription?: string;
  partCode: string;
  family?: string;
  customer?: string;
  workOrderNo?: string;
  woNo: string;
  jobCardNo?: string;
  color: string;
  
  paintDescription?: string;
  paintBatchNumber?: string;
  paintBatch?: string;
  thinnerBatchNumber?: string;
  thinnerBatch?: string;
  paintViscosity?: string | number;
  viscositySec?: number;
  paintingBooth?: string;
  booth: string;
  painter: string;
  
  // Supervisors
  supervisorShiftA?: string;
  supervisorShiftB?: string;
  
  // 8 Time-Slot Observations Grid
  timeSlots?: Partial<Record<IPQCTimeSlotKey, IPQCSlotObservation>>;
  
  // Backward-compatible single-slot summary fields
  shift?: ShiftType | 'Day' | 'Night' | 'Day 12H';
  checkTime?: string;              // e.g. 09:00, 11:00, 14:00
  bubble?: 'Pass' | 'Fail';
  dustSpot?: 'Pass' | 'Fail';
  overPaint?: 'Pass' | 'Fail';
  paintMissing?: 'Pass' | 'Fail';
  L?: number;
  a?: number;
  b?: number;
  deltaE?: number;                 // Spectrophotometer ΔE
  overallFinishing?: 'Pass' | 'Fail';
  adhesionTest?: 'Pass' | 'Fail';
  result?: 'Pass' | 'Fail' | 'Hold';
  
  // Signatures & Comments
  commentOfQualityEngineer?: string;
  remarks?: string;
  inspectedByShiftA?: string;
  inspectedByShiftB?: string;
  verifiedBy?: string;
  inspector?: string;
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
  itemCode?: string;    // Optional Item / Part Code e.g. "PK-VENT-01", "ABS-MOLD-77"
  materialName: string; // e.g. "Paint Daba 2KG", "ABS Vent Bezel", "Thinner Drum"
  quantity: number;     // e.g. 5
  unit: 'Pcs' | 'Litres' | 'Drums' | 'Boxes' | 'Kg' | 'Rolls' | 'Packets';
  batchNo?: string;     // Optional Lot / Batch number
  rawSubstrate?: string;// Optional Substrate (ABS, PC, Nylon, Aluminum, Steel, etc.)
  remarks?: string;
}

// 10b. Security Material Inward Register (12 Fields + Multi-Item Dynamic Rows)
export interface MaterialInwardRecord {
  srNo: string;
  date: string;
  challanNo: string;
  challanDate?: string;     // Supplier Challan Date
  receivingDate?: string;   // Physical Material Receiving Date at factory
  grnNo: string;
  inTime: string;
  vehicleNo: string;
  partyName: string;
  descriptionOfMaterial?: string; // Summary of items
  quantity?: number;
  unit?: 'Pcs' | 'Litres' | 'Drums' | 'Boxes' | 'Kg' | 'Rolls' | 'Packets' | 'Mixed';
  items: InwardMaterialLineItem[]; // Multi-item dynamic rows for 1 vehicle!
  totalQuantity: number;
  materialCategory: 'Party Material' | 'Internal Company'; // EXACT 2 OPTIONS REQUESTED!
  transporter?: string;
  driverName?: string;      // Optional Driver Name
  driverPhone?: string;     // Optional Driver Contact
  ewayBillNo?: string;      // Optional GST E-Way Bill Number
  poNumber?: string;        // Optional Customer Purchase Order / Ref
  totalBoxes?: string;      // Optional Box / Package count (e.g. "5 Cartons")
  receivedBy: string;
  securitySignature: string;
  remarks?: string;
  plant: PlantLocation;
  status: 'Received at Gate' | 'Handed to Stores' | 'Issued to Floor';
  iqcStatus?: 'Pending' | 'In-Progress' | 'Passed' | 'Rejected' | 'Discrepancy Halt';
  iqcReportNo?: string;
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

// 12. MNC Vendor Audit Questionnaire Types (100 Questions, Sections A–M)
export type { AuditQuestionItem } from '../data/mncAuditQuestionsData';
export { MNC_AUDIT_SECTIONS } from '../data/mncAuditQuestionsData';

// 13. 8D Problem Solving CAPA Record (PK-QA-8D-001)
export interface Capa8DRecord {
  id: string; // e.g. "CAPA-8D-2026-001"
  complaintNo: string;
  customerName: string;
  partName: string;
  partCode: string;
  dateOpened: string;
  targetClosureDate: string;
  actualClosureDate?: string;
  status: 'Open' | 'Containment Implemented' | 'Root Cause Validated' | 'CAPA Implemented' | 'Verified & Closed';
  severity: 'Critical' | 'Major' | 'Minor';

  // D1: Team Formation
  d1Champion: string;
  d1Leader: string;
  d1Members: string[];

  // D2: Problem Description (5W2H)
  d2What: string;
  d2Where: string;
  d2When: string;
  d2Who: string;
  d2Why: string;
  d2HowMany: string;
  d2ProblemStatement: string;

  // D3: Containment Actions (within 24h)
  d3ContainmentAction: string;
  d3ContainmentQtyChecked: number;
  d3ContainmentQtyRejected: number;
  d3ImplementedDate: string;
  d3Owner: string;

  // D4: Root Cause Analysis (5-Why & Fishbone)
  d4Fishbone: {
    man: string[];
    machine: string[];
    material: string[];
    method: string[];
    measurement: string[];
    environment: string[];
  };
  d4FiveWhy: string[]; // [Why 1, Why 2, Why 3, Why 4, Why 5]
  d4RootCauseSummary: string;
  d4EscapePoint: string;

  // D5: Permanent Corrective Actions (PCA)
  d5CorrectiveActions: string[];
  d5PcaOwner: string;
  d5TargetDate: string;

  // D6: Validate & Implement PCA
  d6ValidationMethod: string;
  d6TrialQuantity: number;
  d6TrialDefectRate: number;
  d6ImplementationDate: string;

  // D7: Prevent Recurrence (Standardization & Horizontal Deployment)
  d7SopUpdated: boolean;
  d7ControlPlanUpdated: boolean;
  d7FmeaUpdated: boolean;
  d7HorizontalDeploymentParts: string[];

  // D8: Closure & Team Sign-off
  d8ReviewedByQA: string;
  d8ApprovedByDirector: string;
  d8ClosureDate?: string;
  d8EffectivenessVerified: boolean;
}

// 14. 4M Change Control Register (PK-QA-4MC-001)
export interface FourMChangeRecord {
  id: string; // e.g. "4M-2026-012"
  date: string;
  changeType: 'Man (Operator/Painter)' | 'Machine (Gun/Booth/Oven)' | 'Material (Paint/Thinner/Substrate)' | 'Method (Jigging/Curing/Pressure)';
  description: string;
  reasonForChange: string;
  impactAssessment: string;
  trialRunApproved: boolean;
  trialFpaReportNo?: string;
  customerIntimationRequired: boolean;
  customerApprovalReceived?: boolean;
  plant: PlantLocation;
  proposedBy: string;
  approvedByQA: string;
  status: 'Requested' | 'In Trial' | 'Approved' | 'Rejected';
}

// 15. Production Offering Report (PK-PRD-OFF-01 / Doc No: PRD-OFF)
export interface ProductionOfferingLineItem {
  id: string;
  jobCardNo: string;
  customer: string;
  partDescription: string;
  color: string;
  offeredQty: number;
  passedQty: number;
  rejectionQty: number;
  reworkQty: number;
  remarks?: string;
}

export interface ProductionOfferingReport {
  id: string; // e.g. "PRD-OFF-2026-089"
  docNo: string; // "PK-PRD-OFF-01"
  date: string;
  shift: ShiftType;
  plant: PlantLocation;
  lineItems: ProductionOfferingLineItem[];
  totalOfferedQty: number;
  totalPassedQty: number;
  totalRejectionQty: number;
  totalReworkQty: number;
  preparedBy: string; // Floor Incharge
  preparedDate?: string;
  checkedBy: string; // Prod. Supervisor
  checkedDate?: string;
  qaCheckedBy: string; // QA Inspector
  qaDate?: string;
  approvedBy: string; // Plant Head / Director
  approvalDate?: string;
  status: 'Draft' | 'Offered to QA' | 'QA Inspected' | 'Approved' | 'Hold';
}

// 16. HR Leave Application Format (PK-HR-LV-01)
export interface HRLeaveRecord {
  id: string; // e.g. "LV-2026-044"
  docNo: string; // "PK-HR-LV-01"
  employeeId: string;
  employeeName: string;
  fatherName: string;
  department: string;
  designation: string;
  currentAddress: string;
  permanentAddress: string;
  reasonForLeave: string;
  leaveFromDate: string;
  leaveToDate: string;
  totalDays: number;
  employeeSignatureDate: string;

  // Multi-tier Sign-off Chain:
  deptInchargeStatus: 'Pending' | 'Recommended' | 'Rejected';
  deptInchargeName?: string;
  deptInchargeRemarks?: string;
  deptInchargeSignDate?: string;

  hrStatus: 'Pending' | 'Verified' | 'Rejected';
  hrName?: string;
  hrRemarks?: string;
  hrSignDate?: string;

  mdStatus: 'Pending' | 'Sanctioned' | 'Rejected';
  mdName?: string;
  mdSignDate?: string;

  finalStatus: 'Draft' | 'Submitted' | 'In Review' | 'Sanctioned' | 'Rejected';
}

// 17. Machine & Measuring Equipment Calibration Register (PK-MTN-CAL-001)
export interface CalibrationRecord {
  id: string; // e.g. "CAL-2026-001"
  equipmentName: string; // e.g. "X-Rite Spectrophotometer", "Elcometer 456 DFT Gauge", "Ford Cup No. 4"
  equipmentCode: string; // e.g. "PK-EQ-SPC-01"
  makeModel: string; // e.g. "X-Rite Ci62"
  serialNo: string;
  rangeAccuracy: string; // e.g. "0-100% reflectance, ΔE 0.01"
  calibrationAgency: string; // e.g. "NABL Accredited Lab / Zenith Metrology"
  certificateNo: string;
  lastCalibrationDate: string;
  nextCalibrationDue: string;
  calibrationFrequencyMonths: number;
  status: 'Calibrated (Valid)' | 'Due Soon' | 'Overdue (Locked)';
  location: string;
  custodian: string;
}




// 18. Plant Head Production Priority Scheduling & Allocation (PK-PPC-SCH-001)
export type ProductionPriorityLevel = 'P1_URGENT' | 'P2_HIGH' | 'P3_NORMAL' | 'HOLD';

export interface PlantHeadPriorityAssignment {
  id: string; // e.g. "PRIO-2026-001"
  grnNo: string;
  challanNo?: string;
  customer: string;
  partCode: string;
  partDescription: string;
  color?: string;
  availableQty: number;
  totalOrderQty?: number;
  uom: string;
  priorityLevel: ProductionPriorityLevel; // P1_URGENT, P2_HIGH, P3_NORMAL, HOLD
  targetDate: string;
  targetShift?: ShiftType;
  recommendedBooth?: string;
  assignedToProductionManager: string; // e.g. "Vikram Patel"
  plantHeadRemarks: string; // e.g. "Tata Autocomp urgent delivery. Paint after White batch on Line 1."
  assignedBy: string; // "Satish Sharma (Plant Head)"
  assignedAt: string;
  status: 'Priority Assigned' | 'Job Card Launched' | 'Completed';
  linkedJobCardNo?: string;
  plant: PlantLocation;
}
