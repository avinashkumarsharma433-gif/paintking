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
  IQCInspectionRecord,
  MaterialInwardRecord,
  MaterialOutwardRecord,
  PlantDayEndClosure,
  MaterialRequisitionNote,
  PainterProfile,
  PreProductionInspectionRecord,
  PlantHeadPriorityAssignment,
  PaintingBooth,
  StockBatch,
  FifoOverrideLog,
  BalanceReturnSlip
} from '../types/portalTypes';
import { INITIAL_MNC_AUDIT_QUESTIONS } from './mncAuditQuestionsData';
export { INITIAL_MNC_AUDIT_QUESTIONS };

export const INITIAL_PAINTING_BOOTHS: PaintingBooth[] = [
  {
    id: 'LINE-1',
    name: 'Booth #1 (Continuous Conveyor Line)',
    type: 'Conveyor Liquid PU',
    status: 'Active',
    capacityPerShift: 1200,
    airPressureBar: 4.2,
    curingTempC: 65,
    plant: 'Haridwar',
    notes: 'Robotic Spindle Liquid Coating with IR Pre-Heating & Curing Oven'
  },
  {
    id: 'LINE-2',
    name: 'Booth #2 (Dust-Free Pressurized Cleanroom)',
    type: 'Dust-Free Cleanroom 2K',
    status: 'Active',
    capacityPerShift: 800,
    airPressureBar: 3.8,
    curingTempC: 60,
    plant: 'Haridwar',
    notes: 'Class 10,000 Enclosed Cleanroom for High Gloss Piano Black & Metallic'
  },
  {
    id: 'LINE-3',
    name: 'Booth #3 (Hydrographic Immersion & Dipping)',
    type: 'Water Transfer Hydrographic',
    status: 'Active',
    capacityPerShift: 600,
    airPressureBar: 3.5,
    curingTempC: 55,
    plant: 'Haridwar',
    notes: '3D Water Immersion PVA Dipping Tank, Automated Activator & Multi-Stage Wash'
  },
  {
    id: 'LINE-4',
    name: 'Booth #4 (Flatbed Industrial Direct UV Plotter)',
    type: 'Direct Flatbed UV Plotter',
    status: 'Active',
    capacityPerShift: 1500,
    airPressureBar: 2.5,
    curingTempC: 45,
    plant: 'Haridwar',
    notes: '1440 DPI Multi-Substrate Flatbed LED-UV Instant Curing Station'
  }
];

export const INITIAL_PAINTERS: PainterProfile[] = [
  {
    id: 'ptr_1',
    name: 'Ramesh Kumar (P1)',
    code: 'P1',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    boothNo: 'Booth #1 (Continuous Conveyor Line)',
    shift: 'General Day Shift (08:30 - 18:30)',
    specialization: 'High Gloss Metallic Red & Basecoat',
    status: 'Active',
    phone: '+91 98765 43210'
  },
  {
    id: 'ptr_2',
    name: 'Suresh Verma (P2)',
    code: 'P2',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
    boothNo: 'Booth #2 (Dust-Free Pressurized Cleanroom)',
    shift: 'General Day Shift (08:30 - 18:30)',
    specialization: 'Carbon Fiber PVA Film Dipping & Base',
    status: 'Active',
    phone: '+91 98765 43211'
  },
  {
    id: 'ptr_3',
    name: 'Mahesh Sharma (P3)',
    code: 'P3',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80',
    boothNo: 'Booth #3 (Hydrographic Immersion & Dipping)',
    shift: 'General Day Shift (08:30 - 18:30)',
    specialization: 'UV Digital Primer & Anti-Scratch Topcoat',
    status: 'Active',
    phone: '+91 98765 43212'
  },
  {
    id: 'ptr_4',
    name: 'Kailash Yadav (Senior Coating Tech)',
    code: 'P4',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    boothNo: 'Booth #1 (Continuous Conveyor Line)',
    shift: 'General Day Shift (08:30 - 18:30)',
    specialization: '2K Polyurethane Satin & Matte Jet Black',
    status: 'Active',
    phone: '+91 98765 43213'
  },
  {
    id: 'ptr_5',
    name: 'Imran Khan (Specialty Finishing Tech)',
    code: 'P5',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    boothNo: 'Booth #4 (Flatbed Industrial Direct UV Plotter)',
    shift: 'Day 12H',
    specialization: 'Soft-Touch Velvet Feel & Dual-Tone',
    status: 'Active',
    phone: '+91 98765 43214'
  },
  {
    id: 'ptr_6',
    name: 'Raju Painter (Booth Specialist)',
    code: 'P6',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    boothNo: 'Booth #2 (Dust-Free Pressurized Cleanroom)',
    shift: 'Night 12H',
    specialization: 'Automotive Clear Lacquer Topcoat 2K',
    status: 'Active',
    phone: '+91 98765 43215'
  }
];

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
    id: 'usr_qa_1',
    name: 'Rajesh Nair',
    role: 'MANAGER_QA',
    roleTitle: 'Head of Quality Assurance & MNC Compliance',
    plant: 'Haridwar',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
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

// Zero Demo Data — All transactional records start empty for live production input
export const INITIAL_UNIVERSAL_JOBS: UniversalJobRecord[] = [];
export const INITIAL_GRN_DATA: GoodsReceiptNote[] = [];
export const INITIAL_HANDOVERS: CustodyHandover[] = [];
export const INITIAL_JOB_CARDS: JobCard[] = [];
export const INITIAL_PRE_PRODUCTION_REPORTS: PreProductionInspectionRecord[] = [];
export const INITIAL_FPA_RECORDS: FPARecord[] = [];
export const INITIAL_PAINT_MIXING: PaintMixingRecord[] = [];
export const INITIAL_IQC_RECORDS: IQCInspectionRecord[] = [];
export const INITIAL_IPQC_RECORDS: IPQCRecord[] = [];
export const INITIAL_PACKING_SLIPS: PackingSlipRecord[] = [];
export const INITIAL_QUALITY_RELEASES: FinalQualityRelease[] = [];
export const INITIAL_BILLING_INVOICES: BillingInvoice[] = [];
export const INITIAL_GATE_PASSES: GatePassRecord[] = [];

export const MASTER_DEFECTS: DefectItem[] = [
  { code: 'D01', name: 'Bubble', severity: 'Major', count: 0 },
  { code: 'D02', name: 'Dust Spot', severity: 'Major', count: 0 },
  { code: 'D03', name: 'Over Paint / Run', severity: 'Major', count: 0 },
  { code: 'D04', name: 'Paint Missing', severity: 'Major', count: 0 },
  { code: 'D05', name: 'Scratch / Handling Damage', severity: 'Major', count: 0 },
  { code: 'D06', name: 'Colour / ΔE Failure', severity: 'Critical', count: 0 },
  { code: 'D07', name: 'Adhesion Failure', severity: 'Critical', count: 0 },
  { code: 'D08', name: 'Conductivity Failure', severity: 'Critical', count: 0 },
  { code: 'D09', name: 'Sink Mark', severity: 'Major', count: 0 },
  { code: 'D10', name: 'Short Fill', severity: 'Major', count: 0 },
  { code: 'D11', name: 'Pin Mark', severity: 'Major', count: 0 },
  { code: 'D12', name: 'Flash / Bend', severity: 'Major', count: 0 },
  { code: 'D13', name: 'Packing / Label Mismatch', severity: 'Critical', count: 0 },
  { code: 'D14', name: 'Contamination / Oil', severity: 'Major', count: 0 },
  { code: 'D15', name: 'Other Floor Defect', severity: 'Minor', count: 0 },
  { code: 'D16', name: 'Traceability Missing', severity: 'Critical', count: 0 }
];

export const INITIAL_MATERIAL_INWARD: MaterialInwardRecord[] = [];
export const INITIAL_MATERIAL_OUTWARD: MaterialOutwardRecord[] = [];
export const INITIAL_CAPA_8D_RECORDS: Capa8DRecord[] = [];
export const INITIAL_4M_CHANGE_RECORDS: FourMChangeRecord[] = [];
export const INITIAL_PRODUCTION_OFFERING_REPORTS: ProductionOfferingReport[] = [];
export const INITIAL_HR_LEAVE_RECORDS: HRLeaveRecord[] = [];

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

export const INITIAL_DAY_END_CLOSURES: PlantDayEndClosure[] = [];
export const INITIAL_REQUISITIONS: MaterialRequisitionNote[] = [];
export const INITIAL_PLANT_HEAD_PRIORITIES: PlantHeadPriorityAssignment[] = [];
export const INITIAL_STOCK_BATCHES: StockBatch[] = [];
export const INITIAL_FIFO_OVERRIDE_LOGS: FifoOverrideLog[] = [];
export const INITIAL_BALANCE_RETURN_SLIPS: BalanceReturnSlip[] = [];
