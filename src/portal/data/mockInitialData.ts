import { 
  UserProfile, 
  GoodsReceiptNote, 
  CustodyHandover, 
  JobCard, 
  FPARecord, 
  PaintMixingRecord, 
  IPQCRecord, 
  PackingSlipRecord, 
  FinalQualityRelease, 
  BillingInvoice, 
  GatePassRecord,
  DefectItem,
  UniversalJobRecord,
  Capa8DRecord,
  FourMChangeRecord,
  ProductionOfferingReport,
  HRLeaveRecord,
  CalibrationRecord,
  AuditQuestionItem,
  IQCInspectionRecord,
  MaterialInwardRecord,
  MaterialOutwardRecord,
  PlantDayEndClosure,
  MaterialRequisitionNote
} from '../types/portalTypes';
import { INITIAL_MNC_AUDIT_QUESTIONS } from './mncAuditQuestionsData';
export { INITIAL_MNC_AUDIT_QUESTIONS };


export const INITIAL_USER_PROFILES: UserProfile[] = [
  {
    id: 'usr_director_1',
    name: 'Kuldeep Singh',
    role: 'DIRECTOR',
    roleTitle: 'Managing Director & CEO',
    plant: 'Mumbai',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'usr_director_2',
    name: 'Gurprit Singh',
    role: 'DIRECTOR',
    roleTitle: 'Executive Director (Operations & Strategy)',
    plant: 'Vasai',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'usr_planthead_1',
    name: 'Satish Sharma',
    role: 'PLANT_HEAD',
    roleTitle: 'Plant Head (Haridwar & Vasai)',
    plant: 'Haridwar',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'usr_stores_1',
    name: 'Manoj Tiwari',
    role: 'STORES',
    roleTitle: 'Stores & Material Inward Incharge',
    plant: 'Haridwar',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'usr_production_1',
    name: 'Vikram Patel',
    role: 'PRODUCTION',
    roleTitle: 'Senior Production Supervisor',
    plant: 'Haridwar',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'usr_iqc_1',
    name: 'Sunil Rawat',
    role: 'IQC_INSPECTOR',
    roleTitle: 'Incoming Quality Control (IQC) Inspector',
    plant: 'Haridwar',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'usr_fpa_1',
    name: 'Deepak Joshi',
    role: 'FPA_IPQC_INSPECTOR',
    roleTitle: 'FPA Golden Gate & Shift IPQC Inspector',
    plant: 'Haridwar',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'usr_oqc_1',
    name: 'Pankaj Kumar',
    role: 'OQC_PDI_INSPECTOR',
    roleTitle: 'Outgoing Quality (OQC) & PDI Inspector',
    plant: 'Haridwar',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'usr_qa_1',
    name: 'Rajesh Nair',
    role: 'MANAGER_QA',
    roleTitle: 'Head of Quality Assurance & MNC Compliance',
    plant: 'Haridwar',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'usr_operator_1',
    name: 'Raju Painter',
    role: 'OPERATOR',
    roleTitle: 'Master Booth Painter (W.No. 42)',
    plant: 'Haridwar',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'usr_hr_1',
    name: 'Pooja Mehra',
    role: 'HR',
    roleTitle: 'Human Resources & Plant Administration',
    plant: 'Haridwar',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'usr_dept_1',
    name: 'Sanjay Gupta',
    role: 'DEPT_INCHARGE',
    roleTitle: 'Surface Prep & Jigging Department Incharge',
    plant: 'Haridwar',
    avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'usr_billing_1',
    name: 'Neha Gupta',
    role: 'BILLING',
    roleTitle: 'Billing & Commercial Accounts Desk',
    plant: 'Mumbai',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'usr_security_1',
    name: 'Ram Singh',
    role: 'SECURITY',
    roleTitle: 'Main Gate Security Officer',
    plant: 'Haridwar',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80'
  }
];

export const INITIAL_UNIVERSAL_JOBS: UniversalJobRecord[] = [
  {
    jobId: 'PK-JOB-2026-101',
    partyName: 'ROOP POLYMERS LTD',
    customerRefChallan: 'RP/CH/99824',
    vehicleNo: 'UK-08-AL-4412',
    category: 'Party Material',
    createdDate: '2026-09-12',
    createdTime: '08:30 AM',
    materialName: 'Auto AC Center Vent Bezel Substrate (ABS)',
    totalQuantity: 1000,
    unit: 'Pcs',
    colorName: 'Monza Red Gloss',
    colorCode: 'RD-01',
    unitRate: 25.00,
    currentStage: '4. Shop Floor Spraying',
    isPreSprayIqcApproved: true,
    isFinalQaApproved: false,
    preSprayIQC: {
      inspectedQty: 1000,
      approvedQty: 980,
      rejectedQty: 20,
      defectReason: 'Flash Marks',
      inspector: 'Dinesh Pre-Spray IQC',
      timestamp: '2026-09-12 09:15 AM',
      status: 'Passed',
      remarks: '20 raw parts had flash lines on mounting clips'
    },
    pieceTracking: {
      totalInward: 1000,
      preSprayApproved: 980,
      preSprayRejected: 20,
      sprayedGood: 900,
      finalQaPassed: 0,
      finalQaRejected: 0,
      billedQty: 0,
      dispatchedQty: 0
    },
    storeIncharge: 'Manoj Tiwari',
    securityOfficer: 'Ram Singh',
    remarks: 'Pre-spray IQC passed for 980 pcs. Spraying in Booth 2.'
  },
  {
    jobId: 'PK-JOB-2026-102',
    partyName: 'MARUTI SUZUKI INDIA LTD',
    customerRefChallan: 'MS/CH/44120',
    vehicleNo: 'MH-04-GP-8831',
    category: 'Party Material',
    createdDate: '2026-09-12',
    createdTime: '10:00 AM',
    materialName: 'Dashboard Steering Trim (ABS PC Blend)',
    totalQuantity: 500,
    unit: 'Pcs',
    colorName: 'Hydrographic Carbon Weave',
    colorCode: 'HC-03',
    unitRate: 45.00,
    currentStage: '5. Strict Final QA',
    isPreSprayIqcApproved: true,
    isFinalQaApproved: true,
    preSprayIQC: {
      inspectedQty: 500,
      approvedQty: 500,
      rejectedQty: 0,
      inspector: 'Dinesh Pre-Spray IQC',
      timestamp: '2026-09-12 10:30 AM',
      status: 'Passed'
    },
    finalQA: {
      spectrophotometerDeltaE: 0.35,
      adhesionTest: 'Pass (100% Tape)',
      goodQty: 490,
      rejectQty: 10,
      qcEngineer: 'Amit Verma QA',
      timestamp: '2026-09-12 02:00 PM',
      status: 'Approved',
      remarks: 'Delta-E = 0.35 (<= 0.70 limit). Approved for Billing.'
    },
    pieceTracking: {
      totalInward: 500,
      preSprayApproved: 500,
      preSprayRejected: 0,
      sprayedGood: 490,
      finalQaPassed: 490,
      finalQaRejected: 10,
      billedQty: 490,
      dispatchedQty: 0
    },
    storeIncharge: 'Manoj Tiwari',
    securityOfficer: 'Ram Singh'
  },
  {
    jobId: 'PK-JOB-2026-103',
    partyName: 'ASIAN PAINTS PPG LTD',
    customerRefChallan: 'PPG/INV/4412',
    vehicleNo: 'MH-04-CP-8819',
    category: 'Internal Company',
    createdDate: '2026-09-12',
    createdTime: '11:00 AM',
    materialName: 'Monza Red 2K PU Basecoat Paint (20L Drum)',
    totalQuantity: 200,
    unit: 'Litres',
    colorName: 'Monza Red Gloss',
    colorCode: 'PNT-RD-01',
    unitRate: 450.00,
    currentStage: '2. Store Receipt',
    isPreSprayIqcApproved: true,
    isFinalQaApproved: false,
    pieceTracking: {
      totalInward: 200,
      preSprayApproved: 200,
      preSprayRejected: 0,
      sprayedGood: 0,
      finalQaPassed: 0,
      finalQaRejected: 0,
      billedQty: 0,
      dispatchedQty: 0
    },
    storeIncharge: 'Manoj Tiwari',
    securityOfficer: 'Ram Singh',
    remarks: 'Internal paint purchase for production stock'
  }
];

// Ground Problem 1 Scenario Data: Roop Polymers AC Bezel (1000 pcs: 250 Red + 750 Black)
export const INITIAL_GRN_DATA: GoodsReceiptNote[] = [
  {
    docNo: 'DOC NO: 00',
    revNo: '00',
    revDate: '2026-08-01',
    grnNo: 'PK-GRN-2026-0891',
    sourceIqcReportNo: 'IQC-2026-0912-01',
    date: '2026-09-12',
    plant: 'Haridwar',
    vehicleNo: 'UK-08-AL-4412',
    supplierCustomer: 'ROOP POLYMERS LTD',
    invoiceChallanNo: 'RP/CH/99824',
    invoiceDate: '2026-09-11',
    receivedDate: '2026-09-12',
    transporter: 'VRL LOGISTICS',
    items: [
      {
        id: 'grn_item_1',
        partCode: 'RP-8841',
        partDescription: 'Auto AC Center Vent Bezel Substrate (ABS)',
        invoicedQty: 1000,
        actualReceivedQty: 1000,
        shortExcessQty: 0,
        okByIqcQty: 990,
        rejectionQty: 10,
        remark: '10 pcs found with surface scratches at IQC stage'
      }
    ],
    totalQty: 1000,
    iqcStatus: 'Accepted',
    storeIncharge: 'Manoj Tiwari',
    qualityApprovedBy: 'Amit Verma (QA)',
    approvedBy: 'Satish Sharma (Plant Head)',
    remarks: 'Visual substrate check clear. Zero flash/silver lines. Split into RD-01 & BK-09 production lines.',
    partCode: 'RP-8841',
    description: 'Auto AC Center Vent Bezel Substrate (ABS)',
    invoicedQty: 1000,
    actualReceivedQty: 1000,
    colorSplits: [
      {
        colorName: 'Monza Red Gloss',
        colorCode: 'RD-01',
        orderedQty: 250,
        unitRate: 25.00,
        paintedQty: 300,
        passedQty: 300,
        billableQty: 250,
        status: 'Over-Run'
      },
      {
        colorName: 'Matte Jet Black',
        colorCode: 'BK-09',
        orderedQty: 750,
        unitRate: 20.00,
        paintedQty: 700,
        passedQty: 700,
        billableQty: 700,
        status: 'In-Production'
      }
    ]
  },
  {
    docNo: 'DOC NO: 00',
    revNo: '00',
    revDate: '2026-08-01',
    grnNo: 'PK-GRN-2026-0892',
    sourceIqcReportNo: 'IQC-2026-0910-PAINTS',
    date: '2026-09-12',
    plant: 'Haridwar',
    vehicleNo: 'MH-04-CP-8819',
    supplierCustomer: 'ASIAN PAINTS PPG LTD',
    invoiceChallanNo: 'PPG/INV/4412',
    invoiceDate: '2026-09-10',
    receivedDate: '2026-09-12',
    transporter: 'SAFEEXPRESS',
    items: [
      {
        id: 'grn_item_2',
        partCode: 'PNT-RD-01',
        partDescription: 'Monza Red 2K Polyurethane Basecoat (20L Drum)',
        invoicedQty: 200,
        actualReceivedQty: 200,
        shortExcessQty: 0,
        okByIqcQty: 200,
        rejectionQty: 0,
        remark: 'COA verified. Viscosity Ford Cup 4: 15s'
      }
    ],
    totalQty: 200,
    iqcStatus: 'Accepted',
    storeIncharge: 'Manoj Tiwari',
    qualityApprovedBy: 'Amit Verma (QA)',
    approvedBy: 'Satish Sharma (Plant Head)',
    remarks: 'Chemical batch certificate passed.',
    partCode: 'PNT-RD-01',
    description: 'Monza Red 2K Polyurethane Basecoat',
    invoicedQty: 200,
    actualReceivedQty: 200,
    colorSplits: []
  },
  {
    docNo: 'DOC NO: 00',
    revNo: '00',
    revDate: '2026-08-01',
    grnNo: 'PK-GRN-2026-0893',
    sourceIqcReportNo: 'IQC-2026-0905-HRD',
    date: '2026-09-02',
    plant: 'Haridwar',
    vehicleNo: 'MH-04-AZ-9901',
    supplierCustomer: 'COVESTRO CHEMICALS LTD',
    invoiceChallanNo: 'COV/INV/7721',
    invoiceDate: '2026-09-01',
    receivedDate: '2026-09-02',
    transporter: 'DIRECT LOGISTICS',
    items: [
      {
        id: 'grn_item_3',
        partCode: 'CHEM-HRD-2K',
        partDescription: '2K Isocyanate PU Fast Hardener (5L Can)',
        invoicedQty: 50,
        actualReceivedQty: 50,
        shortExcessQty: 0,
        okByIqcQty: 50,
        rejectionQty: 0,
        remark: 'COA moisture test passed. Shelf life: 20 Days'
      }
    ],
    totalQty: 50,
    iqcStatus: 'Accepted',
    storeIncharge: 'Manoj Tiwari',
    qualityApprovedBy: 'Amit Verma (QA)',
    approvedBy: 'Satish Sharma (Plant Head)',
    remarks: 'Critical shelf life chemical. Keep air-tight sealed.',
    partCode: 'CHEM-HRD-2K',
    description: '2K Isocyanate PU Fast Hardener (5L Can)',
    invoicedQty: 50,
    actualReceivedQty: 50,
    colorSplits: []
  },
  {
    docNo: 'DOC NO: 00',
    revNo: '00',
    revDate: '2026-08-01',
    grnNo: 'PK-GRN-2026-0894',
    sourceIqcReportNo: 'IQC-2026-0918-CLR',
    date: '2026-09-18',
    plant: 'Haridwar',
    vehicleNo: 'MH-04-CP-8819',
    supplierCustomer: 'ASIAN PAINTS PPG LTD',
    invoiceChallanNo: 'PPG/INV/4490',
    invoiceDate: '2026-09-16',
    receivedDate: '2026-09-18',
    transporter: 'SAFEEXPRESS',
    items: [
      {
        id: 'grn_item_4',
        partCode: 'CHEM-CLR-GLS',
        partDescription: 'Automotive High Gloss 2K PU Clearcoat (20L Drum)',
        invoicedQty: 100,
        actualReceivedQty: 100,
        shortExcessQty: 0,
        okByIqcQty: 100,
        rejectionQty: 0,
        remark: 'Batch certified. Viscosity Ford Cup 4: 16s'
      }
    ],
    totalQty: 100,
    iqcStatus: 'Accepted',
    storeIncharge: 'Manoj Tiwari',
    qualityApprovedBy: 'Amit Verma (QA)',
    approvedBy: 'Satish Sharma (Plant Head)',
    remarks: 'High solid clearcoat resin. Standard clean store storage.',
    partCode: 'CHEM-CLR-GLS',
    description: 'Automotive High Gloss 2K PU Clearcoat (20L Drum)',
    invoicedQty: 100,
    actualReceivedQty: 100,
    colorSplits: []
  }
];

// Custody Handovers between stages (PK-PRD-TRF-001)
export const INITIAL_HANDOVERS: CustodyHandover[] = [
  {
    transferId: 'TRF-1042-01',
    date: '2026-09-12',
    time: '08:30 AM',
    plant: 'Haridwar',
    woNo: 'WO-1042',
    jobCardNo: 'JC-1042-RED',
    partCode: 'RP-8841',
    color: 'Monza Red Gloss',
    fromStage: 'Raw Stores',
    toStage: 'Surface Prep & Jigging',
    senderName: 'Manoj Tiwari (Stores)',
    senderQty: 320,
    receiverName: 'Dinesh Operator (Jigging)',
    receiverQty: 320,
    status: 'Accepted (Match)'
  },
  {
    transferId: 'TRF-1042-02',
    date: '2026-09-12',
    time: '09:00 AM',
    plant: 'Haridwar',
    woNo: 'WO-1042',
    jobCardNo: 'JC-1042-BLK',
    partCode: 'RP-8841',
    color: 'Matte Jet Black',
    fromStage: 'Raw Stores',
    toStage: 'Surface Prep & Jigging',
    senderName: 'Manoj Tiwari (Stores)',
    senderQty: 750,
    receiverName: 'Dinesh Operator (Jigging)',
    receiverQty: 750,
    status: 'Accepted (Match)'
  },
  {
    transferId: 'TRF-1042-03',
    date: '2026-09-12',
    time: '10:15 AM',
    plant: 'Haridwar',
    woNo: 'WO-1042',
    jobCardNo: 'JC-1042-RED',
    partCode: 'RP-8841',
    color: 'Monza Red Gloss',
    fromStage: 'Base Coat Painting',
    toStage: 'Hydrographic Dipping / UV',
    senderName: 'Ramesh Painter (Booth 2)',
    senderQty: 300,
    receiverName: 'Suresh Kumar (Dipping Line)',
    receiverQty: 270, // PROBLEM 2: 30 PIECES MISSING!
    status: 'Discrepancy Halt',
    discrepancyQty: 30,
    discrepancyReason: 'Left in Drying/Oven Rack',
    discrepancyNote: 'Receiver verified only 270 on trolleys. 15 found stuck on upper oven rack, 10 dropped/chipped, 5 unaccounted.',
    supervisorAction: 'Supervisor Vikram Patel called physical count. 15 rescued from oven, 10 sent to scrap, 5 logged as floor shrinkage penalty.',
    supervisorApprovedBy: 'Vikram Patel'
  },
  {
    transferId: 'TRF-1042-04',
    date: '2026-09-12',
    time: '01:30 PM',
    plant: 'Haridwar',
    woNo: 'WO-1042',
    jobCardNo: 'JC-1042-BLK',
    partCode: 'RP-8841',
    color: 'Matte Jet Black',
    fromStage: 'Surface Prep & Jigging',
    toStage: 'Base Coat Painting',
    senderName: 'Dinesh Operator (Jigging)',
    senderQty: 750,
    receiverName: 'Ramesh Painter (Booth 1)',
    receiverQty: 700,
    status: 'Discrepancy Halt',
    discrepancyQty: 50,
    discrepancyReason: 'Dropped / In-Transit Damage',
    discrepancyNote: '50 raw pieces had clamp breakage during jigging. Kept aside for rework.'
  }
];

// Ground-Truth Operational Data: Master Job Cards + 3-Painter Split + Rework Child Cards
export const INITIAL_JOB_CARDS: JobCard[] = [
  // 1. Master Job Card (Overall Batch: 3,000 pcs)
  {
    docNo: 'Doc No: 001',
    revNo: '00',
    revDate: '2026-08-01',
    jobCardNo: 'JC-1042-RED',
    jobCardType: 'master',
    woNo: 'WO-1042',
    customer: 'ROOP POLYMERS LTD',
    partCode: 'RP-8841',
    partDescription: 'Car AC Vent Bezel',
    model: 'Swift 2026 Model',
    color: 'Monza Red Gloss',
    targetQty: 3000,
    sprayedQty: 1910,
    goodQty: 1875,
    rejectQty: 35,
    reworkFlaggedQty: 35,
    reworkRecoveredQty: 33,
    scrapQty: 2,
    status: 'In Process',
    fpaStatus: 'Approved',
    painterName: 'Split Across 3 Line Painters (P1, P2, P3)',
    wNo: 'WO-1042',
    issueDate: '2026-09-25',
    issueTime: '08:30 AM',
    leadTime: '8 Hours',
    dept: 'Cubic Dipping & Spray Line #2',
    storeIncharge: 'Manoj Tiwari',
    prodSupervisor: 'Vikram Patel',
    approvedBy: 'Satish Sharma (Plant Head)',
    issuedMaterials: [
      {
        id: 'mat_1',
        itemDescription: 'Auto AC Center Vent Bezel Substrate (ABS)',
        qty: 3050,
        colour: 'Raw ABS Black',
        uom: 'Pcs',
        remark: 'Issued from GRN-0891 bay 2'
      },
      {
        id: 'mat_2',
        itemDescription: 'Monza Red 2K PU Basecoat Paint (PPG)',
        qty: 75,
        colour: 'Monza Red Gloss',
        uom: 'Litres',
        remark: 'Batch BAT-PPG-2609-R4'
      }
    ],
    boothNo: 'Booths #1, #2, #3',
    paintBatch: 'BAT-PPG-2609-R4'
  },

  // 1a. Painter 1 Child Job Card (Ramesh Kumar - P1, Booth #1)
  {
    docNo: 'Doc No: 001-P1',
    revNo: '00',
    revDate: '2026-08-01',
    jobCardNo: 'JC-1042-RED-P1',
    jobCardType: 'painter_child',
    parentJobCardId: 'JC-1042-RED',
    assignedPainterId: 'p1_ramesh',
    assignedPainterName: 'Ramesh Kumar (Painter 1)',
    allocatedQty: 1000,
    woNo: 'WO-1042',
    customer: 'ROOP POLYMERS LTD',
    partCode: 'RP-8841',
    partDescription: 'Car AC Vent Bezel',
    model: 'Swift 2026 Model',
    color: 'Monza Red Gloss',
    targetQty: 1000,
    sprayedQty: 650,
    firstPassGoodQty: 638,
    goodQty: 638,
    rejectQty: 12,
    reworkFlaggedQty: 12,
    status: 'In Process',
    fpaStatus: 'Approved',
    painterName: 'Ramesh Kumar',
    wNo: 'WO-1042',
    issueDate: '2026-09-25',
    issueTime: '08:30 AM',
    leadTime: '8 Hours',
    dept: 'Booth #1 (Enclosed)',
    storeIncharge: 'Manoj Tiwari',
    prodSupervisor: 'Vikram Patel',
    approvedBy: 'Satish Sharma',
    boothNo: 'Booth #1',
    paintBatch: 'BAT-PPG-2609-R4',
    issuedMaterials: []
  },

  // 1b. Painter 2 Child Job Card (Suresh Verma - P2, Booth #2)
  {
    docNo: 'Doc No: 001-P2',
    revNo: '00',
    revDate: '2026-08-01',
    jobCardNo: 'JC-1042-RED-P2',
    jobCardType: 'painter_child',
    parentJobCardId: 'JC-1042-RED',
    assignedPainterId: 'p2_suresh',
    assignedPainterName: 'Suresh Verma (Painter 2)',
    allocatedQty: 1000,
    woNo: 'WO-1042',
    customer: 'ROOP POLYMERS LTD',
    partCode: 'RP-8841',
    partDescription: 'Car AC Vent Bezel',
    model: 'Swift 2026 Model',
    color: 'Monza Red Gloss',
    targetQty: 1000,
    sprayedQty: 620,
    firstPassGoodQty: 611,
    goodQty: 611,
    rejectQty: 9,
    reworkFlaggedQty: 9,
    status: 'In Process',
    fpaStatus: 'Approved',
    painterName: 'Suresh Verma',
    wNo: 'WO-1042',
    issueDate: '2026-09-25',
    issueTime: '08:30 AM',
    leadTime: '8 Hours',
    dept: 'Booth #2 (Enclosed)',
    storeIncharge: 'Manoj Tiwari',
    prodSupervisor: 'Vikram Patel',
    approvedBy: 'Satish Sharma',
    boothNo: 'Booth #2',
    paintBatch: 'BAT-PPG-2609-R4',
    issuedMaterials: []
  },

  // 1c. Painter 3 Child Job Card (Mahesh Sharma - P3, Booth #3)
  {
    docNo: 'Doc No: 001-P3',
    revNo: '00',
    revDate: '2026-08-01',
    jobCardNo: 'JC-1042-RED-P3',
    jobCardType: 'painter_child',
    parentJobCardId: 'JC-1042-RED',
    assignedPainterId: 'p3_mahesh',
    assignedPainterName: 'Mahesh Sharma (Painter 3)',
    allocatedQty: 1000,
    woNo: 'WO-1042',
    customer: 'ROOP POLYMERS LTD',
    partCode: 'RP-8841',
    partDescription: 'Car AC Vent Bezel',
    model: 'Swift 2026 Model',
    color: 'Monza Red Gloss',
    targetQty: 1000,
    sprayedQty: 640,
    firstPassGoodQty: 626,
    goodQty: 626,
    rejectQty: 14,
    reworkFlaggedQty: 14,
    status: 'In Process',
    fpaStatus: 'Approved',
    painterName: 'Mahesh Sharma',
    wNo: 'WO-1042',
    issueDate: '2026-09-25',
    issueTime: '08:30 AM',
    leadTime: '8 Hours',
    dept: 'Booth #3 (Enclosed)',
    storeIncharge: 'Manoj Tiwari',
    prodSupervisor: 'Vikram Patel',
    approvedBy: 'Satish Sharma',
    boothNo: 'Booth #3',
    paintBatch: 'BAT-PPG-2609-R4',
    issuedMaterials: []
  },

  // 1d. Rework Child Job Card (35 Defective Pieces routed for salvage)
  {
    docNo: 'Doc No: 001-RW1',
    revNo: '00',
    revDate: '2026-08-01',
    jobCardNo: 'JC-1042-RED-RW1',
    jobCardType: 'rework_child',
    parentJobCardId: 'JC-1042-RED',
    defectCategory: 'dust_nibs',
    reworkInstructions: 'De-nib surface with 1500 grit abrasive paper, solvent wipe, apply light mist topcoat and cure 30 mins at 75°C.',
    reworkStatus: 'Passed QC',
    woNo: 'WO-1042',
    customer: 'ROOP POLYMERS LTD',
    partCode: 'RP-8841',
    partDescription: 'Car AC Vent Bezel [REWORK SALVAGE]',
    model: 'Swift 2026 Model',
    color: 'Monza Red Gloss',
    targetQty: 35,
    sprayedQty: 35,
    goodQty: 33, // 33 recovered out of 35!
    firstPassGoodQty: 33,
    rejectQty: 2, // only 2 non-salvageable scrap
    scrapQty: 2,
    reworkRecoveredQty: 33,
    status: 'Completed',
    fpaStatus: 'Approved',
    painterName: 'Ramesh Kumar & Rework Bench',
    wNo: 'WO-1042',
    issueDate: '2026-09-25',
    issueTime: '02:00 PM',
    leadTime: '2 Hours',
    dept: 'Rework Station & Booth #1',
    storeIncharge: 'Manoj Tiwari',
    prodSupervisor: 'Vikram Patel',
    approvedBy: 'Satish Sharma',
    boothNo: 'Booth #1',
    paintBatch: 'BAT-PPG-2609-R4',
    issuedMaterials: []
  },
  {
    docNo: 'Doc No: 001',
    revNo: '00',
    revDate: '2026-08-01',
    jobCardNo: 'JC-1042-BLK',
    woNo: 'WO-1042',
    customer: 'ROOP POLYMERS LTD',
    partCode: 'RP-8841',
    partDescription: 'Car AC Vent Bezel',
    model: 'Swift 2026 Model',
    color: 'Matte Jet Black',
    targetQty: 750,      // TARGET CAP
    sprayedQty: 700,     // Ground Problem 1: Only 700 sprayed (50 Pending)
    goodQty: 680,
    rejectQty: 20,
    status: 'In Process',
    fpaStatus: 'Approved',

    // INITIAL PROCESS
    painterName: 'Kailash Yadav',
    wNo: 'WO-1042',
    issueDate: '2026-09-12',
    issueTime: '09:00 AM',
    leadTime: '6 Hours',
    dept: 'Cubic Dipping Line #1',

    // FINAL PROCESS
    returnMaterialDesc: 'Matte Jet Black Basecoat (2L)',
    returnPainterName: 'Kailash Yadav',
    returnDate: '2026-09-12',
    returnTime: '04:00 PM',
    returnOkQty: 680,
    returnRejectionQty: 20,
    checkingPerson: 'Amit Verma (QA)',
    headerRemark: '50 pcs in jigging rework rack.',

    // ISSUE MATERIAL DETAILS TABLE
    issuedMaterials: [
      {
        id: 'mat_5',
        itemDescription: 'Auto AC Center Vent Bezel Substrate (ABS)',
        qty: 750,
        colour: 'Raw ABS Black',
        uom: 'Pcs',
        remark: 'Issued from GRN-0891'
      },
      {
        id: 'mat_6',
        itemDescription: 'Matte Jet Black Basecoat (PPG)',
        qty: 25,
        colour: 'Matte Jet Black',
        uom: 'Litres',
        remark: 'Batch BAT-PPG-2609-K1'
      },
      {
        id: 'mat_7',
        itemDescription: 'PU Thinner 400',
        qty: 8,
        colour: 'Clear Liquid',
        uom: 'Litres',
        remark: 'Standard solvent'
      }
    ],

    // SIGNATURES
    storeIncharge: 'Manoj Tiwari',
    prodSupervisor: 'Vikram Patel',
    approvedBy: 'Satish Sharma',

    // 3-STAGE PRODUCTION PROCESS TRACKING
    stageProcessFirst: { totalQty: 750, okQty: 730, rejectionQty: 20 },
    stageProcessSecond: { totalQty: 730, okQty: 700, rejectionQty: 30 },
    stageProcessThird: { totalQty: 700, okQty: 680, rejectionQty: 20 },
    stageRemark: 'Second dipping pass completed.',
    preparedBy: 'Manoj Tiwari (Stores)',
    checkedBy: 'Vikram Patel (Supervisor)',
    stageApprovedBy: 'Satish Sharma (Plant Head)',

    // Legacy fields
    boothNo: 'Booth #1 (Conveyor Line)',
    paintBatch: 'BAT-PPG-2609-K1',
    thinnerBatch: 'THN-2609-02',
    hardenerBatch: 'HDN-2609-01',
    issuedRawQty: 750,
    startTime: '09:00 AM'
  }
];

// FPA Golden Gate Records (PK-QA-FPA-001)
export const INITIAL_FPA_RECORDS: FPARecord[] = [
  {
    reportNo: 'PK-FPA-2026-0312',
    date: '2026-09-12',
    plant: 'Haridwar',
    woNo: 'WO-1042',
    jobCardNo: 'JC-1042-RED',
    customer: 'ROOP POLYMERS LTD',
    partCode: 'RP-8841',
    color: 'Monza Red Gloss',
    paintBatch: 'BAT-PPG-2609-R4',
    painter: 'Ramesh Sharma',
    booth: 'Booth #2',
    viscositySec: 15,
    sample1: 'Pass',
    sample2: 'Pass',
    sample3: 'Pass',
    sample4: 'Pass',
    sample5: 'Pass',
    L: 42.15,
    a: 54.30,
    b: 28.10,
    deltaE: 0.38,        // STRICT RULE: Delta-E <= 0.70 (PASSED)
    adhesionPercent: 100, // STRICT RULE: 100% Adhesion (PASSED)
    crossCutTest: 'Pass',
    tapeTest: 'Pass',
    conductivity: 'Pass',
    overallResult: 'Approved',
    qcEngineer: 'Amit Verma',
    managerQAApproval: true,
    remarks: 'Colorimetry & cross-hatch tape test verified against Master Standard Plaque. Released for mass run.'
  }
];

// Paint Mixing Records (PK-PRD-PMX-001)
export const INITIAL_PAINT_MIXING: PaintMixingRecord[] = [
  {
    mixNo: 'PMX-2026-0419',
    date: '2026-09-12',
    plant: 'Haridwar',
    woNo: 'WO-1042',
    color: 'Monza Red Gloss',
    paintCode: 'PNT-RD-01',
    paintBatch: 'BAT-PPG-2609-R4',
    paintQtyL: 12.0,
    hardenerCode: 'HDN-2609-01',
    hardenerBatch: 'HB-081',
    hardenerQtyL: 3.0,
    thinnerCode: 'THN-2609-02',
    thinnerBatch: 'TB-112',
    thinnerQtyL: 3.0,
    mixRatio: '4:1:1',
    viscosityFordCupSec: 15.2,
    potLifeEnd: '04:30 PM (6h Pot Life)',
    mixedBy: 'Gopal Paint Tech',
    usageBooth: 'Booth #2'
  }
];

// IQC Incoming Inspection Records (PK-STR-IQC-001)
export const INITIAL_IQC_RECORDS: IQCInspectionRecord[] = [
  {
    reportNo: 'IQC-2026-0912-01',
    inwardSrNo: 'INW-2026-001',
    date: '2026-09-12',
    inspectionDate: '2026-09-12',
    inspectionTime: '08:30 AM',
    plant: 'Haridwar',
    vendorCustomer: 'ROOP POLYMERS LTD',
    supplierCustomer: 'ROOP POLYMERS LTD',
    partComponent: 'RP-8841',
    partCode: 'RP-8841',
    partDescription: 'ABS Car AC Vent Bezel Substrates',
    invoiceChallanNo: 'RP/CH/99824',
    invoiceChallanDate: '2026-09-11',
    batchNo: 'B-RP-202609-01',
    invQuantity: 1000,
    totalQty: 1000,
    uom: 'Pcs',
    unit: 'Pcs',
    actualReceived: 1000,
    shortageQty: 0,
    excessQty: 0,
    boxCondition: 'Intact & Clean',
    hasDiscrepancy: false,
    discrepancyReportedToProductionManager: false,
    sampleSize: 50,
    sampledQty: 50,
    passQty: 50,
    rejectQty: 0,
    rejectionPercent: 0,
    rejectionDetail: 'Nil - All parts pass visual and physical checks',
    aspects: [
      { srNo: 1, aspect: 'Packing (Box Condition)', methodOfMeasurement: 'Visual (Cartons Should be Proper Condition)', impact: 'Major', result: 'Pass', observation: '20 tote crates received intact, sealed' },
      { srNo: 2, aspect: 'Traceability (Batch No)', methodOfMeasurement: 'Visual barcode/lot sticker', impact: 'Critical', result: 'Pass', observation: 'Batch lot B-RP-202609-01 verified' },
      { srNo: 3, aspect: 'Quantity', methodOfMeasurement: 'Weight / Physical count', impact: 'Major', result: 'Pass', observation: 'Exact 1000 Pcs verified' },
      { srNo: 4, aspect: 'Physical Inspection', methodOfMeasurement: 'No Damages / Silver Line / Lock Damages / Bend / Flash', impact: 'Critical', result: 'Pass', observation: 'No flash, zero silver lines, locks intact' },
      { srNo: 5, aspect: 'Conductivity', methodOfMeasurement: 'As per Vendor Report', impact: 'Major', result: 'Pass', observation: 'Vendor COA matches standard' },
      { srNo: 6, aspect: 'Adhesion', methodOfMeasurement: 'Cross Cut and then Tape test', impact: 'Critical', result: 'Pass', observation: 'ASTM 5B compliant (100% adhesion)' },
      { srNo: 7, aspect: 'Delta Value', methodOfMeasurement: 'To be checked with Spectrophotometer (Should be within 1)', impact: 'Critical', result: 'Pass (ΔE 0.42)', observation: 'ΔE = 0.42 ≤ 1.00' }
    ],
    damage: 'Pass',
    scratch: 'Pass',
    sinkMark: 'Pass',
    shortFill: 'Pass',
    bubble: 'Pass',
    pinMark: 'Pass',
    dustSpot: 'Pass',
    overPaint: 'Pass',
    paintMissing: 'Pass',
    colour: 'Pass',
    overallFinishing: 'Pass',
    rootCause: 'N/A - Compliant batch',
    correctiveAction: 'N/A',
    preventiveAction: 'Maintain current packing and storage standards',
    status: 'Accepted',
    inspector: 'Manoj Tiwari (IQC Inspector)',
    preparedBy: 'Manoj Tiwari (IQC Inspector)',
    verifiedBy: 'Sanjay Rawat (Production Manager)',
    remarks: 'Raw ABS substrate free of oil contamination or sink marks. Cleared for Pre-Treatment & Primer Spray.'
  },
  {
    reportNo: 'IQC-2026-0922-03',
    inwardSrNo: 'INW-2026-003',
    date: '2026-09-22',
    inspectionDate: '2026-09-22',
    inspectionTime: '11:45 AM',
    generatedAt: '2026-09-22T11:45:00.000Z',
    generatedTimestamp: '22 Sep 2026, 11:45 AM',
    plant: 'Haridwar',
    vendorCustomer: 'SPARK MINDA AUTOMOTIVE LTD',
    supplierCustomer: 'SPARK MINDA AUTOMOTIVE LTD',
    partComponent: 'SM-LC-990',
    partCode: 'SM-LC-990',
    partDescription: 'Lock Cylinder Housing Substrates (ABS/PC)',
    invoiceChallanNo: 'MINDA/CH/88120',
    invoiceChallanDate: '2026-09-21',
    batchNo: 'B-88120-0922',
    invQuantity: 1500,
    totalQty: 1500,
    uom: 'Pcs',
    unit: 'Pcs',
    actualReceived: 1500,
    shortageQty: 0,
    excessQty: 0,
    boxCondition: 'Intact & Clean',
    hasDiscrepancy: false,
    discrepancyReportedToProductionManager: false,
    items: [
      {
        id: 'item_3a',
        materialName: 'Lock Cylinder Housing Substrates (ABS/PC)',
        challanQty: 1500,
        actualQty: 1500,
        unit: 'Pcs',
        isReceived: true,
        condition: 'Intact & Clean',
        shortageQty: 0,
        sampleSize: 80,
        passQty: 80,
        rejectQty: 0,
        rejectionPercent: 0,
        defectDetail: 'Nil - All parts pass dimensional & adhesion tests'
      }
    ],
    sampleSize: 80,
    passQty: 80,
    rejectQty: 0,
    rejectionPercent: 0,
    rejectionDetail: 'Nil - All parts pass dimensional & adhesion tests',
    scratch: 'Pass',
    damage: 'Pass',
    overallFinishing: 'Pass',
    rootCause: 'N/A - Compliant lot',
    correctiveAction: 'N/A',
    preventiveAction: 'Standard cleanroom storage maintained',
    status: 'Accepted',
    inspector: 'Manoj Tiwari (IQC Inspector)',
    preparedBy: 'Manoj Tiwari (IQC Inspector)',
    verifiedBy: 'Sanjay Rawat (Production Manager)',
    remarks: 'Approved for Stores Intake & Production Job Card creation.'
  }
];

// IPQC 3-Hourly Records (PK-QA-IPQ-001)
export const INITIAL_IPQC_RECORDS: IPQCRecord[] = [
  {
    reportNo: 'IPQ-2026-0912-01',
    date: '2026-09-12',
    plant: 'Haridwar',
    shift: 'Day 12H',
    checkTime: '11:30 AM',
    woNo: 'WO-1042',
    partCode: 'RP-8841',
    color: 'Monza Red Gloss',
    painter: 'Ramesh Sharma',
    booth: 'Booth #2',
    bubble: 'Pass',
    dustSpot: 'Pass',
    overPaint: 'Pass',
    paintMissing: 'Pass',
    L: 42.15,
    a: 54.30,
    b: 28.10,
    deltaE: 0.44,
    overallFinishing: 'Pass',
    adhesionTest: 'Pass',
    result: 'Pass',
    inspector: 'Amit Verma'
  },
  {
    reportNo: 'IPQ-2026-0912-02',
    date: '2026-09-12',
    plant: 'Haridwar',
    shift: 'Day 12H',
    checkTime: '02:30 PM',
    woNo: 'WO-1042',
    partCode: 'RP-8841',
    color: 'Matte Jet Black',
    painter: 'Kailash Yadav',
    booth: 'Booth #1',
    bubble: 'Pass',
    dustSpot: 'Fail', // minor dust
    overPaint: 'Pass',
    paintMissing: 'Pass',
    L: 20.10,
    a: 0.15,
    b: -0.20,
    deltaE: 0.51,
    overallFinishing: 'Pass',
    adhesionTest: 'Pass',
    result: 'Hold',
    inspector: 'Amit Verma'
  }
];

// Packing Records (PK-STR-PKG-001)
export const INITIAL_PACKING_SLIPS: PackingSlipRecord[] = [
  {
    slipNo: 'PKG-1042-BOX-01',
    date: '2026-09-12',
    plant: 'Haridwar',
    customer: 'ROOP POLYMERS LTD',
    woNo: 'WO-1042',
    partCode: 'RP-8841',
    model: 'Swift 2026',
    color: 'Monza Red Gloss',
    boxNo: 'BOX-RED-01 to 05 (5 Boxes)',
    packedQty: 250, // Contract batch packed
    painter: 'Ramesh Sharma',
    paintBatch: 'BAT-PPG-2609-R4',
    packedBy: 'Shyam Packer',
    qcVerified: true
  },
  {
    slipNo: 'PKG-1042-BOX-02',
    date: '2026-09-12',
    plant: 'Haridwar',
    customer: 'ROOP POLYMERS LTD',
    woNo: 'WO-1042',
    partCode: 'RP-8841',
    model: 'Swift 2026',
    color: 'Matte Jet Black',
    boxNo: 'BOX-BLK-01 to 14 (14 Boxes)',
    packedQty: 700, // 700 packed, 50 pending
    painter: 'Kailash Yadav',
    paintBatch: 'BAT-PPG-2609-K1',
    packedBy: 'Shyam Packer',
    qcVerified: true
  }
];

// Final Quality Release (PK-QA-OQC-001 & PK-QA-PDI-001)
export const INITIAL_QUALITY_RELEASES: FinalQualityRelease[] = [
  {
    releaseId: 'REL-1042-RED',
    date: '2026-09-12',
    plant: 'Haridwar',
    woNo: 'WO-1042',
    customer: 'ROOP POLYMERS LTD',
    partCode: 'RP-8841',
    color: 'Monza Red Gloss',
    offeredQty: 300,
    sampledQty: 32,
    passedQty: 300,
    rejectedQty: 0,
    packingBoxCondition: 'Pass',
    traceabilityBatchNo: 'Pass',
    quantityMatch: 'Pass',
    physicalInspection: 'Pass',
    conductivity: 'Pass',
    adhesion: 'Pass',
    deltaE: 0.41,
    oqcStatus: 'Accepted',
    pdiStatus: 'Cleared for Invoicing',
    inspector: 'Amit Verma',
    plantHeadSign: 'Satish Sharma'
  },
  {
    releaseId: 'REL-1042-BLK',
    date: '2026-09-12',
    plant: 'Haridwar',
    woNo: 'WO-1042',
    customer: 'ROOP POLYMERS LTD',
    partCode: 'RP-8841',
    color: 'Matte Jet Black',
    offeredQty: 700,
    sampledQty: 50,
    passedQty: 700,
    rejectedQty: 0,
    packingBoxCondition: 'Pass',
    traceabilityBatchNo: 'Pass',
    quantityMatch: 'Pass',
    physicalInspection: 'Pass',
    conductivity: 'Pass',
    adhesion: 'Pass',
    deltaE: 0.48,
    oqcStatus: 'Accepted',
    pdiStatus: 'Cleared for Invoicing',
    inspector: 'Amit Verma',
    plantHeadSign: 'Satish Sharma'
  }
];

// Billing & Invoicing (PK-ACC-INV-001) - Ground Problem 1 Fix
export const INITIAL_BILLING_INVOICES: BillingInvoice[] = [
  {
    invoiceNo: 'PK-TAX-2026-0182',
    invoiceDate: '2026-09-12',
    woNo: 'WO-1042',
    customer: 'ROOP POLYMERS LTD',
    plant: 'Haridwar',
    lineItems: [
      {
        id: 'li_red',
        colorName: 'Monza Red Gloss',
        orderedQty: 250,
        passedAndPackedQty: 300,
        billableQty: 250,  // Billed strictly on 250 as per PO
        excessQty: 50,     // 50 pcs held in buffer
        excessApprovedByClient: false,
        unitRate: 25.00,
        lineTotal: 6250.00,
        status: 'Contract Fulfilled'
      },
      {
        id: 'li_black',
        colorName: 'Matte Jet Black',
        orderedQty: 750,
        passedAndPackedQty: 700,
        billableQty: 700,  // 700 billed, 50 pending
        excessQty: 0,
        excessApprovedByClient: false,
        unitRate: 20.00,
        lineTotal: 14000.00,
        status: 'Shortfall / Pending'
      }
    ],
    subTotal: 20250.00,
    gstPercent: 18,
    gstAmount: 3645.00,
    cgstAmount: 1822.50,
    sgstAmount: 1822.50,
    grandTotal: 23895.00,
    totalOrderedQty: 1000,
    totalBilledQty: 950,
    status: 'Generated',
    balanceBacklogNote: '50 pcs Black pending to be coated on next shift. 50 extra Red held in finished stock awaiting PO amendment.',
    preparedBy: 'Neha Gupta (Billing)'
  }
];

// Gate Passes (PK-ADM-GTP-001)
export const INITIAL_GATE_PASSES: GatePassRecord[] = [
  {
    gatePassNo: 'GTP-IN-2026-0941',
    date: '2026-09-12',
    time: '07:45 AM',
    plant: 'Haridwar',
    type: 'Inward',
    movementType: 'Customer Material',
    partyName: 'ROOP POLYMERS LTD',
    vehicleNo: 'UK-08-AL-4412',
    driverPhone: '+91 98765 43210',
    itemDescription: 'Raw Plastic AC Vent Bezel Substrates (1000 Pcs)',
    qty: 1000,
    referenceDoc: 'RP/CH/99824',
    status: 'Closed',
    securityOfficer: 'Ram Singh'
  },
  {
    gatePassNo: 'GTP-OUT-2026-0512',
    date: '2026-09-12',
    time: '04:15 PM',
    plant: 'Haridwar',
    type: 'Outward',
    movementType: 'Finished Goods',
    partyName: 'ROOP POLYMERS LTD',
    vehicleNo: 'DL-01-EE-7741',
    driverPhone: '+91 99112 33445',
    itemDescription: 'Finished Coated Bezels (250 Red + 700 Black = 950 Pcs in 19 Boxes)',
    qty: 950,
    referenceDoc: 'PK-TAX-2026-0182',
    status: 'Open',
    securityOfficer: 'Ram Singh'
  }
];

// Master Defect Code Library (D01 - D16 from PK_Master Data)
export const MASTER_DEFECTS: DefectItem[] = [
  { code: 'D01', name: 'Bubble', severity: 'Major', count: 12 },
  { code: 'D02', name: 'Dust Spot', severity: 'Major', count: 28 },
  { code: 'D03', name: 'Over Paint / Run', severity: 'Major', count: 8 },
  { code: 'D04', name: 'Paint Missing', severity: 'Major', count: 5 },
  { code: 'D05', name: 'Scratch / Handling Damage', severity: 'Major', count: 19 },
  { code: 'D06', name: 'Colour / ΔE Failure', severity: 'Critical', count: 2 },
  { code: 'D07', name: 'Adhesion Failure', severity: 'Critical', count: 0 },
  { code: 'D08', name: 'Conductivity Failure', severity: 'Critical', count: 0 },
  { code: 'D09', name: 'Sink Mark', severity: 'Major', count: 4 },
  { code: 'D10', name: 'Short Fill', severity: 'Major', count: 3 },
  { code: 'D11', name: 'Pin Mark', severity: 'Major', count: 6 },
  { code: 'D12', name: 'Flash / Bend', severity: 'Major', count: 7 },
  { code: 'D13', name: 'Packing / Label Mismatch', severity: 'Critical', count: 1 },
  { code: 'D14', name: 'Contamination / Oil', severity: 'Major', count: 4 },
  { code: 'D15', name: 'Other Floor Defect', severity: 'Minor', count: 9 },
  { code: 'D16', name: 'Traceability Missing', severity: 'Critical', count: 0 }
];

// Security Gate Inward Register Mock Data (12 Fields + Multi-Item Dynamic Rows)
export const INITIAL_MATERIAL_INWARD: MaterialInwardRecord[] = [
  {
    srNo: 'INW-2026-001',
    date: '2026-09-12',
    challanNo: 'RP/CH/99824',
    challanDate: '2026-09-11',
    receivingDate: '2026-09-12',
    grnNo: 'PK-GRN-2026-0891',
    inTime: '07:45 AM',
    vehicleNo: 'UK-08-AL-4412',
    partyName: 'ROOP POLYMERS LTD',
    items: [
      { id: 'item_1', materialName: 'ABS Car AC Vent Bezel Substrates', quantity: 1000, unit: 'Pcs' }
    ],
    descriptionOfMaterial: 'ABS Car AC Vent Bezel Substrates (1000 Pcs)',
    quantity: 1000,
    unit: 'Pcs',
    totalQuantity: 1000,
    materialCategory: 'Party Material',
    receivedBy: 'Ram Singh (Gate Security)',
    securitySignature: 'RAM_SINGH_VERIFIED',
    remarks: 'Received 1000 pcs intact in 20 tote crates. Handed to Stores Manoj Tiwari.',
    plant: 'Haridwar',
    status: 'Handed to Stores',
    iqcStatus: 'Passed',
    iqcReportNo: 'IQC-2026-0912-01'
  },
  {
    srNo: 'INW-2026-002',
    date: '2026-09-12',
    challanNo: 'PPG/INV/4412',
    challanDate: '2026-09-10',
    receivingDate: '2026-09-12',
    grnNo: 'PK-GRN-2026-882',
    inTime: '09:30 AM',
    vehicleNo: 'MH-04-CP-8819',
    partyName: 'ASIAN PAINTS PPG LTD',
    items: [
      { id: 'item_2a', materialName: 'Monza Red Paint Daba 2KG', quantity: 10, unit: 'Drums', remarks: '20 Litres total' },
      { id: 'item_2b', materialName: 'PU Thinner Can 5L', quantity: 4, unit: 'Drums', remarks: '20 Litres total' },
      { id: 'item_2c', materialName: 'High Gloss Clearcoat', quantity: 2, unit: 'Drums', remarks: '10 Litres total' }
    ],
    descriptionOfMaterial: 'Monza Red Paint Daba 2KG (10 Drums), PU Thinner (4 Drums), Clearcoat (2 Drums)',
    quantity: 16,
    unit: 'Drums',
    totalQuantity: 16,
    materialCategory: 'Internal Company',
    receivedBy: 'Ram Singh (Gate Security)',
    securitySignature: 'RAM_SINGH_VERIFIED',
    remarks: 'Internal company purchase. Passed COA check.',
    plant: 'Haridwar',
    status: 'Handed to Stores',
    iqcStatus: 'Pending'
  },
  {
    srNo: 'INW-2026-003',
    date: '2026-09-22',
    challanNo: 'MINDA/CH/88120',
    challanDate: '2026-09-21',
    receivingDate: '2026-09-22',
    grnNo: '',
    inTime: '11:15 AM',
    vehicleNo: 'HR-55-AK-9921',
    partyName: 'SPARK MINDA AUTOMOTIVE LTD',
    items: [
      { id: 'item_3a', materialName: 'Lock Cylinder Housing Substrates (ABS/PC)', quantity: 1500, unit: 'Pcs' }
    ],
    descriptionOfMaterial: 'Lock Cylinder Housing Substrates (ABS/PC) - 1500 Pcs',
    quantity: 1500,
    unit: 'Pcs',
    totalQuantity: 1500,
    materialCategory: 'Party Material',
    receivedBy: 'Ram Singh (Gate Security)',
    securitySignature: 'RAM_SINGH_VERIFIED',
    remarks: 'Pre-production batch for Maruti Swift lock sets. Handed to IQC Manoj Tiwari.',
    plant: 'Haridwar',
    status: 'Handed to Stores',
    iqcStatus: 'Passed',
    iqcReportNo: 'IQC-2026-0922-03'
  }
];


// Security Gate Outward Register Mock Data (11 Fields)
export const INITIAL_MATERIAL_OUTWARD = [
  {
    srNo: 'OUT-2026-001',
    date: '2026-09-12',
    vehicleNo: 'DL-01-EE-7741',
    gatePassNo: 'GTP-OUT-2026-0512',
    outTime: '04:15 PM',
    partyName: 'ROOP POLYMERS LTD',
    descriptionOfMaterial: 'Finished Coated AC Bezels (250 Red + 700 Black)',
    quantity: 950,
    unit: 'Pcs' as const,
    transporter: 'VRL LOGISTICS',
    securitySignature: 'RAM_SINGH_VERIFIED',
    remarks: 'Dispatched in 19 corrugated master boxes under Delivery Challan PK/DC/2026/0488.',
    plant: 'Haridwar' as const
  }
];

// 12. 8D CAPA Records (PK-QA-8D-001)
export const INITIAL_CAPA_8D_RECORDS: Capa8DRecord[] = [
  {
    id: 'CAPA-8D-2026-001',
    complaintNo: 'CC-SCHN-2026-08',
    customerName: 'Schneider Electric India',
    partName: 'Smart Touch Panel Fascia Frame',
    partCode: 'SE-FAS-9920-W',
    dateOpened: '2026-09-08',
    targetClosureDate: '2026-09-22',
    actualClosureDate: '2026-09-13',
    status: 'Verified & Closed',
    severity: 'Major',

    d1Champion: 'Rajesh Nair (Manager QA)',
    d1Leader: 'Amit Verma (Lead QA Auditor)',
    d1Members: ['Deepak Joshi (IPQC)', 'Raju Painter (Booth Lead)', 'Vikram Patel (Prod. Sup.)'],

    d2What: 'Minor orange peel texturing and slight edge paint thinness observed on left corner',
    d2Where: 'Haridwar Plant - Line 1 (Booth 2)',
    d2When: 'Shift A on Batch PK-BAT-2026-88',
    d2Who: 'Reported by Schneider SQE during incoming sampling inspection',
    d2Why: 'Causes aesthetic mismatch with mating ABS housing',
    d2HowMany: '24 pcs out of 1,200 pcs lot (2.0% defect rate)',
    d2ProblemStatement: 'Orange peel defect on SE-FAS-9920-W exceeding Schneider cosmetic threshold ΔE 0.70 / smooth surface spec.',

    d3ContainmentAction: '100% sorting of all 1,176 pcs at warehouse and customer dock. Quarantined 24 defective pcs in Red Bin. Shipped 500 buffer replacement pcs.',
    d3ContainmentQtyChecked: 1200,
    d3ContainmentQtyRejected: 24,
    d3ImplementedDate: '2026-09-09',
    d3Owner: 'Deepak Joshi (IPQC Inspector)',

    d4Fishbone: {
      man: ['Operator sprayed at faster traverse speed (0.6 m/s instead of 0.4 m/s)'],
      machine: ['Air pressure regulator gauge had needle hysteresis deviation (-0.5 bar)'],
      material: ['Paint viscosity was 18.5s Ford Cup 4 (standard is 14-16s) due to lower thinner ratio'],
      method: ['Flash-off time between coat 1 and coat 2 was shortened from 7 min to 4 min'],
      measurement: ['DFT gauge calibration probe tip had dust deposit'],
      environment: ['Booth temperature rose to 34°C during afternoon run']
    },
    d4FiveWhy: [
      'Why 1: Why did orange peel occur? Paint did not flow and level properly before curing.',
      'Why 2: Why did paint not level? Viscosity was too high (18.5s) and atomization air pressure was insufficient (1.9 bar).',
      'Why 3: Why was viscosity high? Solvent evaporation happened in pot due to temperature rise (34°C).',
      'Why 4: Why was solvent ratio not adjusted? Viscosity was checked only at initial mixing and not monitored every 2 hours.',
      'Why 5 (Root Cause): Lack of dynamic temperature-compensated thinner ratio chart and mandatory 2-hourly viscosity monitoring in SOP PK-SOP-PNT-02.'
    ],
    d4RootCauseSummary: 'High paint viscosity (18.5s vs 15s) combined with 1.9 bar atomization pressure prevented droplet coalescence, creating orange peel.',
    d4EscapePoint: 'IPQC 2-hour interval check missed the viscosity drift during shift transition.',

    d5CorrectiveActions: [
      'Updated Paint Mixing SOP to include 2-hourly Ford Cup 4 viscosity check and log.',
      'Installed temperature-viscosity reference chart next to mixing booth.',
      'Calibrated and locked Booth 2 air pressure regulator at 2.4 bar with tamper tag.'
    ],
    d5PcaOwner: 'Vikram Patel & Rajesh Nair',
    d5TargetDate: '2026-09-11',

    d6ValidationMethod: 'Trial run of 350 pcs with controlled 15s viscosity and 2.4 bar pressure. 100% inspection with 60° Glossmeter and Spectrophotometer.',
    d6TrialQuantity: 350,
    d6TrialDefectRate: 0.0,
    d6ImplementationDate: '2026-09-12',

    d7SopUpdated: true,
    d7ControlPlanUpdated: true,
    d7FmeaUpdated: true,
    d7HorizontalDeploymentParts: ['SE-FAS-9920-B (Black)', 'MINDA-CLUSTER-01', 'ROOP-VENT-BEZEL-01'],

    d8ReviewedByQA: 'Rajesh Nair (Head QA)',
    d8ApprovedByDirector: 'Gurprit Singh (Executive Director)',
    d8ClosureDate: '2026-09-13',
    d8EffectivenessVerified: true
  }
];

// 13. 4M Change Control Register (PK-QA-4MC-001)
export const INITIAL_4M_CHANGE_RECORDS: FourMChangeRecord[] = [
  {
    id: '4M-2026-012',
    date: '2026-09-10',
    changeType: 'Material (Paint/Thinner/Substrate)',
    description: 'Transition from PPG Slow Thinner 300 to Medium Fast PU Thinner 400 for winter drying cycle',
    reasonForChange: 'Customer seasonal ambient change to avoid solvent popping in curing oven',
    impactAssessment: 'Improves leveling and reduces cycle bake time by 3 minutes. Zero effect on adhesion or shade.',
    trialRunApproved: true,
    trialFpaReportNo: 'PK-FPA-2026-041',
    customerIntimationRequired: true,
    customerApprovalReceived: true,
    plant: 'Haridwar',
    proposedBy: 'Manoj Tiwari (Stores/Materials)',
    approvedByQA: 'Rajesh Nair (Manager QA)',
    status: 'Approved'
  },
  {
    id: '4M-2026-013',
    date: '2026-09-13',
    changeType: 'Machine (Gun/Booth/Oven)',
    description: 'Replacement of worn fluid nozzle on Booth 1 Spray Gun with SATAjet 5000 B 1.3mm nozzle',
    reasonForChange: 'Routine tip wear after 100,000 passes to maintain uniform fan pattern',
    impactAssessment: 'Restores spray fan uniformity; verified on test blotter paper and FPA test piece.',
    trialRunApproved: true,
    trialFpaReportNo: 'PK-FPA-2026-042',
    customerIntimationRequired: false,
    customerApprovalReceived: true,
    plant: 'Haridwar',
    proposedBy: 'Vikram Patel (Prod. Supervisor)',
    approvedByQA: 'Rajesh Nair (Manager QA)',
    status: 'Approved'
  }
];

// 14. Production Offering Report Mock Data (PK-PRD-OFF-01 / Doc No: PRD-OFF)
export const INITIAL_PRODUCTION_OFFERING_REPORTS: ProductionOfferingReport[] = [
  {
    id: 'PRD-OFF-2026-089',
    docNo: 'PK-PRD-OFF-01',
    date: '2026-09-14',
    shift: 'Day 12H',
    plant: 'Haridwar',
    lineItems: [
      {
        id: 'off_item_1',
        jobCardNo: 'JC-99824-RED',
        customer: 'ROOP POLYMERS LTD',
        partDescription: 'Car AC Vent Outer Bezel Ring',
        color: 'Monza Red Metallic',
        offeredQty: 250,
        passedQty: 246,
        rejectionQty: 4,
        reworkQty: 2,
        remarks: '2 touch-up rework approved, 2 scrapped due to substrate crack.'
      },
      {
        id: 'off_item_2',
        jobCardNo: 'JC-99824-BLK',
        customer: 'ROOP POLYMERS LTD',
        partDescription: 'Car AC Vent Outer Bezel Ring',
        color: 'Piano Gloss Black',
        offeredQty: 700,
        passedQty: 692,
        rejectionQty: 8,
        reworkQty: 4,
        remarks: 'Batch passes all visual and adhesion requirements.'
      }
    ],
    totalOfferedQty: 950,
    totalPassedQty: 938,
    totalRejectionQty: 12,
    totalReworkQty: 6,
    preparedBy: 'Raju Painter (Booth Incharge)',
    preparedDate: '2026-09-14 15:30',
    checkedBy: 'Vikram Patel (Prod. Supervisor)',
    checkedDate: '2026-09-14 16:00',
    qaCheckedBy: 'Deepak Joshi (FPA/IPQC Inspector)',
    qaDate: '2026-09-14 16:30',
    approvedBy: 'Satish Sharma (Plant Head)',
    approvalDate: '2026-09-14 17:00',
    status: 'Approved'
  }
];

// 15. HR Leave Application Format Mock Data (PK-HR-LV-01)
export const INITIAL_HR_LEAVE_RECORDS: HRLeaveRecord[] = [
  {
    id: 'LV-2026-044',
    docNo: 'PK-HR-LV-01',
    employeeId: 'PK-EMP-042',
    employeeName: 'Raju Painter',
    fatherName: 'Harish Chandra Painter',
    department: 'Production / Liquid Spray Booth',
    designation: 'Senior Booth Painter (Grade A)',
    currentAddress: 'Room 12, Shiv Colony, Sector 4, BHEL Industrial Area, Haridwar',
    permanentAddress: 'Village Rampur, Post Office Nawabganj, Dist. Bareilly, UP',
    reasonForLeave: "Attending sister's wedding in home village. Handover of Booth 1 completed with Dinesh Kumar.",
    leaveFromDate: '2026-09-20',
    leaveToDate: '2026-09-24',
    totalDays: 5,
    employeeSignatureDate: '2026-09-14',

    deptInchargeStatus: 'Recommended',
    deptInchargeName: 'Vikram Patel (Prod. Supervisor)',
    deptInchargeRemarks: 'Shift coverage arranged with night painter. Recommended.',
    deptInchargeSignDate: '2026-09-14 11:30 AM',

    hrStatus: 'Verified',
    hrName: 'Pooja Mehra (HR Executive)',
    hrRemarks: 'Leave balance verified: 8 days privilege leave available.',
    hrSignDate: '2026-09-14 02:15 PM',

    mdStatus: 'Sanctioned',
    mdName: 'Gurprit Singh (Executive Director)',
    mdSignDate: '2026-09-14 04:45 PM',

    finalStatus: 'Sanctioned'
  }
];

// 16. Machine & Equipment Calibration Master Register (PK-MTN-CAL-001)
export const INITIAL_CALIBRATION_RECORDS: CalibrationRecord[] = [
  {
    id: 'CAL-2026-001',
    equipmentName: 'Portable Spectrophotometer (Colorimetry)',
    equipmentCode: 'PK-EQ-SPC-01',
    makeModel: 'X-Rite Ci62 Portable 45/0',
    serialNo: 'XR-88219-IND',
    rangeAccuracy: '400-700nm, repeatability ΔE 0.01 CIELAB',
    calibrationAgency: 'X-Rite India Calibration Lab (NABL CC-2981)',
    certificateNo: 'NABL/XR/2026/0819',
    lastCalibrationDate: '2026-02-15',
    nextCalibrationDue: '2027-02-14',
    calibrationFrequencyMonths: 12,
    status: 'Calibrated (Valid)',
    location: 'QA Testing Lab - Cabinet A',
    custodian: 'Amit Verma (Lead QA Auditor)'
  },
  {
    id: 'CAL-2026-002',
    equipmentName: 'Digital Coating Thickness Gauge (DFT)',
    equipmentCode: 'PK-EQ-DFT-02',
    makeModel: 'Elcometer 456 Dual F/NF',
    serialNo: 'ELC-44102-UK',
    rangeAccuracy: '0 - 1500 μm (Accuracy ±1%)',
    calibrationAgency: 'Zenith Metrology NABL Accredited Lab',
    certificateNo: 'ZEN/CAL/2026/1104',
    lastCalibrationDate: '2025-11-30',
    nextCalibrationDue: '2026-11-29',
    calibrationFrequencyMonths: 12,
    status: 'Calibrated (Valid)',
    location: 'Production Floor - Booth 1 Inspection Stand',
    custodian: 'Deepak Joshi (IPQC Inspector)'
  },
  {
    id: 'CAL-2026-003',
    equipmentName: 'Micro-Tri-Gloss Meter (20° / 60° / 85°)',
    equipmentCode: 'PK-EQ-GLS-03',
    makeModel: 'BYK-Gardner 4446',
    serialNo: 'BYK-99214-DE',
    rangeAccuracy: '0 - 2000 GU (Repeatability 0.2 GU)',
    calibrationAgency: 'Precision Metrology Services (NABL)',
    certificateNo: 'PMS/BYK/2025/998',
    lastCalibrationDate: '2025-10-15',
    nextCalibrationDue: '2026-10-14',
    calibrationFrequencyMonths: 12,
    status: 'Due Soon',
    location: 'QA Testing Lab - Bench 2',
    custodian: 'Amit Verma (Lead QA Auditor)'
  },
  {
    id: 'CAL-2026-004',
    equipmentName: 'Ford Viscosity Cup No. 4 with Stand',
    equipmentCode: 'PK-EQ-VIS-04',
    makeModel: 'Sheen Instruments ASTM D1200',
    serialNo: 'SHN-FC4-019',
    rangeAccuracy: '10 - 60 seconds efflux time (±0.2s)',
    calibrationAgency: 'National Metrology Testing Center',
    certificateNo: 'NMTC/VIS/2026/039',
    lastCalibrationDate: '2026-04-10',
    nextCalibrationDue: '2027-04-09',
    calibrationFrequencyMonths: 12,
    status: 'Calibrated (Valid)',
    location: 'Paint Mixing & Viscosity Control Station',
    custodian: 'Manoj Tiwari (Stores & Mixing)'
  },
  {
    id: 'CAL-2026-005',
    equipmentName: 'Cross-Hatch Adhesion Multi-Blade Cutter Kit',
    equipmentCode: 'PK-EQ-ADH-05',
    makeModel: 'Elcometer 107 (1mm & 2mm blades)',
    serialNo: 'ELC-ADH-882',
    rangeAccuracy: 'ASTM D3359 / ISO 2409 Standard Spacing',
    calibrationAgency: 'Zenith Metrology (Blade Gap Inspection)',
    certificateNo: 'ZEN/ADH/2026/041',
    lastCalibrationDate: '2026-03-20',
    nextCalibrationDue: '2027-03-19',
    calibrationFrequencyMonths: 12,
    status: 'Calibrated (Valid)',
    location: 'QA Lab - Physical Testing Station',
    custodian: 'Amit Verma (Lead QA Auditor)'
  },
  {
    id: 'CAL-2026-006',
    equipmentName: 'Digital Temperature & Humidity Thermo-Hygrometer',
    equipmentCode: 'PK-EQ-THM-06',
    makeModel: 'Testo 625 with Dew Point Calculation',
    serialNo: 'TST-625-771',
    rangeAccuracy: '-10 to +60°C (±0.5°C), 0-100% RH (±2.5%)',
    calibrationAgency: 'Zenith Metrology NABL Lab',
    certificateNo: 'ZEN/THM/2026/055',
    lastCalibrationDate: '2026-05-12',
    nextCalibrationDue: '2027-05-11',
    calibrationFrequencyMonths: 12,
    status: 'Calibrated (Valid)',
    location: 'Cleanroom Spray Booth Chamber 1 & 2',
    custodian: 'Deepak Joshi (IPQC Inspector)'
  }
];

export const INITIAL_DAY_END_CLOSURES: PlantDayEndClosure[] = [
  {
    id: 'EOD-2026-0925',
    plant: 'Vasai',
    closureDate: '2026-09-25',
    shiftName: 'General Day Shift (08:30 - 18:30)',
    totalPiecesSprayed: 1910,
    totalFirstPassGood: 1875,
    totalReworkInQueue: 35,
    totalScrap: 3,
    overnightWipCount: 120,
    status: 'Open Day Active',
    closedBy: 'Vikram Patel (Production Supervisor)',
    closedAt: '2026-09-25 18:35',
    reopenedBy: 'Vikram Patel (Production Supervisor)',
    reopenedAt: '2026-09-26 08:30',
    remarks: 'Evening shutdown verified. Booth filters purged, paint lines cleaned with solvent. Reopened for morning single-shift run.'
  }
];

export const INITIAL_REQUISITIONS: MaterialRequisitionNote[] = [
  {
    mrnNo: 'MRN-2026-001',
    date: '2026-09-28',
    time: '08:45 AM',
    plant: 'Haridwar',
    jobCardNo: 'JC-1042-RED',
    woNo: 'WO-1042',
    customer: 'TATA AUTOCOMP SYSTEMS',
    partCode: 'RP-8841',
    partDescription: 'Automotive Front Fascia Bumper Grille (ABS PC Blend)',
    colorName: 'Monza Red Gloss',
    requestedQty: 1000,
    uom: 'Pcs',
    requiredShift: 'Shift A (Morning)',
    requestedBy: 'Vikram Patel (Production Manager)',
    urgency: 'Normal',
    status: 'Dispatched by Store',
    issuedSlipNo: 'MIN-2026-001',
    sourceGrnNo: 'PK-GRN-2026-1252',
    issuedQty: 1000,
    storeInchargeName: 'Manoj Tiwari (Store Incharge)',
    storeIssuedTimestamp: '2026-09-28 09:15 AM',
    storeRemarks: 'Dispatched 10 boxes (100 pcs/box) via internal electric tugger trolley #02.'
  },
  {
    mrnNo: 'MRN-2026-002',
    date: '2026-09-28',
    time: '09:30 AM',
    plant: 'Haridwar',
    jobCardNo: 'JC-1042-RED',
    woNo: 'WO-1042',
    customer: 'ASIAN PAINTS PPG LTD',
    partCode: 'MR-PNT-99',
    partDescription: 'Monza Red 2K PU Basecoat Paint (20L Drum)',
    colorName: 'Monza Red',
    requestedQty: 20,
    uom: 'Litres',
    requiredShift: 'Shift A (Morning)',
    requestedBy: 'Ramesh Kumar (Line 1 Supervisor)',
    urgency: 'High (Line Stoppage Risk)',
    status: 'Received by Production',
    issuedSlipNo: 'MIN-2026-002',
    sourceGrnNo: 'PK-GRN-2026-1250',
    issuedQty: 20,
    storeInchargeName: 'Manoj Tiwari (Store Incharge)',
    storeIssuedTimestamp: '2026-09-28 09:45 AM',
    storeRemarks: 'Lot batch certified. Pre-warmed to 24°C.',
    receivedQty: 20,
    receivedBy: 'Ramesh Kumar (Line 1 Supervisor)',
    receivedTimestamp: '2026-09-28 10:00 AM',
    productionRemarks: 'Verified viscosity & seal intact. Transferred to booth mixing tank.'
  }
];



