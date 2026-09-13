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
  UniversalJobRecord
} from '../types/portalTypes';

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
    roleTitle: 'Executive Director (Operations)',
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
    roleTitle: 'Stores & Inward Material Incharge',
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
    id: 'usr_qa_1',
    name: 'Amit Verma',
    role: 'QA_QC',
    roleTitle: 'Lead QA / QC Engineer (IATF Auditor)',
    plant: 'Haridwar',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
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

// Ground Problem 1 Scenario Data: Sub-Job Cards with Target Caps (Doc No: 001)
export const INITIAL_JOB_CARDS: JobCard[] = [
  {
    docNo: 'Doc No: 001',
    revNo: '00',
    revDate: '2026-08-01',
    jobCardNo: 'JC-1042-RED',
    woNo: 'WO-1042',
    customer: 'ROOP POLYMERS LTD',
    partCode: 'RP-8841',
    partDescription: 'Car AC Vent Bezel',
    model: 'Swift 2026 Model',
    color: 'Monza Red Gloss',
    targetQty: 250,      // TARGET CAP
    sprayedQty: 300,     // Ground Problem 1: Painter sprayed 300 (Over-run +50)
    goodQty: 285,
    rejectQty: 15,
    status: 'Over-Run Flagged',
    fpaStatus: 'Approved',

    // INITIAL PROCESS (Exact Screenshot 1)
    painterName: 'Ramesh Sharma',
    wNo: 'WO-1042',
    issueDate: '2026-09-12',
    issueTime: '08:30 AM',
    leadTime: '4 Hours',
    dept: 'Cubic Dipping & Spray Line #2',

    // FINAL PROCESS (Return tracking - Exact Screenshot 1)
    returnMaterialDesc: 'Unused Basecoat Monza Red & Leftover Thinner',
    returnPainterName: 'Ramesh Sharma',
    returnDate: '2026-09-12',
    returnTime: '01:30 PM',
    returnOkQty: 285,
    returnRejectionQty: 15,
    checkingPerson: 'Amit Verma (QA Lead)',
    headerRemark: 'Target 250 met. 15 rejected for dust spots.',

    // ISSUE MATERIAL DETAILS TABLE (Exact Screenshot 1)
    issuedMaterials: [
      {
        id: 'mat_1',
        itemDescription: 'Auto AC Center Vent Bezel Substrate (ABS)',
        qty: 320,
        colour: 'Raw ABS Black',
        uom: 'Pcs',
        remark: 'Issued from GRN-0891 bay 2'
      },
      {
        id: 'mat_2',
        itemDescription: 'Monza Red 2K PU Basecoat Paint (PPG)',
        qty: 15,
        colour: 'Monza Red Gloss',
        uom: 'Litres',
        remark: 'Batch BAT-PPG-2609-R4'
      },
      {
        id: 'mat_3',
        itemDescription: 'PU Thinner 400 Fast Evaporating',
        qty: 5,
        colour: 'Clear Liquid',
        uom: 'Litres',
        remark: 'Mix ratio 4:1:1'
      },
      {
        id: 'mat_4',
        itemDescription: 'High-Gloss Clear Lacquer Coat',
        qty: 10,
        colour: 'Transparent High-Gloss',
        uom: 'Litres',
        remark: 'Top coat UV protective'
      }
    ],

    // SIGNATURES
    storeIncharge: 'Manoj Tiwari',
    prodSupervisor: 'Vikram Patel',
    approvedBy: 'Satish Sharma',

    // 3-STAGE PRODUCTION PROCESS TRACKING (Exact Screenshot 1)
    stageProcessFirst: { totalQty: 320, okQty: 310, rejectionQty: 10 },
    stageProcessSecond: { totalQty: 310, okQty: 300, rejectionQty: 10 },
    stageProcessThird: { totalQty: 300, okQty: 285, rejectionQty: 15 },
    stageRemark: 'Final lacquer cured at 80°C for 45 mins',
    preparedBy: 'Manoj Tiwari (Stores)',
    checkedBy: 'Vikram Patel (Supervisor)',
    stageApprovedBy: 'Satish Sharma (Plant Head)',

    // Legacy fields
    boothNo: 'Booth #2 (Enclosed Dust-Free)',
    paintBatch: 'BAT-PPG-2609-R4',
    thinnerBatch: 'THN-2609-02',
    hardenerBatch: 'HDN-2609-01',
    issuedRawQty: 320,
    startTime: '08:30 AM',
    endTime: '01:00 PM'
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
    date: '2026-09-12',
    plant: 'Haridwar',
    supplierCustomer: 'ROOP POLYMERS LTD',
    partCode: 'RP-8841',
    batchNo: 'B-RP-202609-01',
    totalQty: 1000,
    sampledQty: 50,
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
    status: 'Accepted',
    inspector: 'Manoj Tiwari',
    remarks: 'Raw ABS substrate free of oil contamination or sink marks.'
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
    status: 'Handed to Stores'
  },
  {
    srNo: 'INW-2026-002',
    date: '2026-09-12',
    challanNo: 'PPG/INV/4412',
    grnNo: 'PK-GRN-2026-0892',
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
    status: 'Handed to Stores'
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

