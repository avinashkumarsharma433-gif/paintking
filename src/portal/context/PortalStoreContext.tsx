import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  UserRole,
  PlantLocation,
  ShiftType,
  GoodsReceiptNote,
  IQCInspectionRecord,
  CustodyHandover,
  JobCard,
  FPARecord,
  PaintMixingRecord,
  IPQCRecord,
  PackingSlipRecord,
  FinalQualityRelease,
  BillingInvoice,
  BillableLineItem,
  GatePassRecord,
  MaterialInwardRecord,
  MaterialOutwardRecord,
  DefectItem,
  UniversalJobRecord,
  PreSprayIQCRecord,
  FinalQAGateRecord,
  JobPipelineStage,
  Capa8DRecord,
  FourMChangeRecord,
  ProductionOfferingReport,
  HRLeaveRecord,
  CalibrationRecord,
  AuditQuestionItem
} from '../types/portalTypes';
import {
  INITIAL_USER_PROFILES,
  INITIAL_UNIVERSAL_JOBS,
  INITIAL_GRN_DATA,
  INITIAL_IQC_RECORDS,
  INITIAL_HANDOVERS,
  INITIAL_JOB_CARDS,
  INITIAL_FPA_RECORDS,
  INITIAL_PAINT_MIXING,
  INITIAL_IPQC_RECORDS,
  INITIAL_PACKING_SLIPS,
  INITIAL_QUALITY_RELEASES,
  INITIAL_BILLING_INVOICES,
  INITIAL_GATE_PASSES,
  INITIAL_MATERIAL_INWARD,
  INITIAL_MATERIAL_OUTWARD,
  MASTER_DEFECTS,
  INITIAL_CAPA_8D_RECORDS,
  INITIAL_4M_CHANGE_RECORDS,
  INITIAL_PRODUCTION_OFFERING_REPORTS,
  INITIAL_HR_LEAVE_RECORDS,
  INITIAL_CALIBRATION_RECORDS,
  INITIAL_MNC_AUDIT_QUESTIONS
} from '../data/mockInitialData';


interface PortalContextType {
  // Authentication & Context
  currentUser: UserProfile;
  switchUser: (userId: string) => void;
  activePlant: PlantLocation;
  setActivePlant: (plant: PlantLocation) => void;
  activeShift: ShiftType;
  setActiveShift: (shift: ShiftType) => void;

  // Data Collections
  universalJobs: UniversalJobRecord[];
  grnList: GoodsReceiptNote[];
  iqcRecords: IQCInspectionRecord[];
  handovers: CustodyHandover[];
  jobCards: JobCard[];
  fpaRecords: FPARecord[];
  paintMixing: PaintMixingRecord[];
  ipqcRecords: IPQCRecord[];
  packingSlips: PackingSlipRecord[];
  qualityReleases: FinalQualityRelease[];
  billingInvoices: BillingInvoice[];
  gatePasses: GatePassRecord[];
  materialInwardLogs: MaterialInwardRecord[];
  materialOutwardLogs: MaterialOutwardRecord[];
  defects: DefectItem[];

  // Next-Gen Universal Job Engine Actions
  addUniversalJob: (job: UniversalJobRecord) => void;
  submitPreSprayIQC: (
    jobId: string,
    inspectedQty: number,
    approvedQty: number,
    rejectedQty: number,
    defectReason?: PreSprayIQCRecord['defectReason'],
    remarks?: string
  ) => void;
  submitFinalQA: (
    jobId: string,
    deltaE: number,
    adhesionTest: 'Pass (100% Tape)' | 'Fail (Flaking)',
    goodQty: number,
    rejectQty: number,
    remarks?: string
  ) => void;
  advanceJobStage: (jobId: string, nextStage: JobPipelineStage) => void;

  // Logic Engine Actions
  addGRN: (grn: GoodsReceiptNote) => void;
  addIQCRecord: (iqc: IQCInspectionRecord) => void;
  addIPQCRecord: (ipqc: IPQCRecord) => void;
  addOQCRelease: (release: FinalQualityRelease) => void;
  addJobCard: (jc: JobCard) => void;
  addMaterialInwardRecord: (record: MaterialInwardRecord) => void;
  addMaterialOutwardRecord: (record: MaterialOutwardRecord) => void;

  
  // Problem 2: Inter-stage Handover & Custody Logic
  sendHandover: (transfer: {
    woNo: string;
    jobCardNo: string;
    partCode: string;
    color: string;
    fromStage: CustodyHandover['fromStage'];
    toStage: CustodyHandover['toStage'];
    senderName: string;
    senderQty: number;
    plant?: PlantLocation;
  }) => void;
  receiveHandover: (
    transferId: string,
    receiverName: string,
    receiverQty: number,
    discrepancyReason?: CustodyHandover['discrepancyReason'],
    discrepancyNote?: string
  ) => void;
  resolveHandoverDiscrepancy: (transferId: string, action: string, supervisorName: string) => void;

  // Problem 1: Job Cards, Target Caps & Color Over-run
  updateJobCardProgress: (jobCardNo: string, addedSprayedQty: number, addedRejectQty?: number) => void;
  updateJobCardSprayed: (
    jobCardNo: string,
    addedSprayedQty: number,
    addedRejectQty?: number,
    defectCategory?: string
  ) => void;

  // Quality FPA Golden Gate
  createFPARecord: (fpa: Omit<FPARecord, 'reportNo' | 'overallResult'>) => void;
  addFPATest: (fpa: Omit<FPARecord, 'reportNo' | 'overallResult'>) => void;

  // Problem 1: Smart Billing Engine Actions
  toggleInvoiceExcessApproval: (invoiceNo: string, lineItemId: string) => void;
  toggleClientConcession: (invoiceNo: string, lineItemId: string) => void;
  generateNewInvoiceFromPDI: (woNo: string) => void;

  // Gate Pass
  createGatePass: (gp: GatePassRecord) => void;
  updateGatePassStatus: (gatePassNo: string, status: GatePassRecord['status']) => void;

  // Active Discrepancy Alerts Counter
  unresolvedHandoversCount: number;
  openOverrunCount: number;

  // 100-Question MNC Audit Engine (Module E)
  auditQuestions: AuditQuestionItem[];
  updateAuditAnswer: (id: string, updates: Partial<AuditQuestionItem>) => void;
  resetAuditToStandard: () => void;

  // 8D CAPA & 4M Change Control (Section J)
  capa8DList: Capa8DRecord[];
  addCapa8D: (capa: Capa8DRecord) => void;
  updateCapa8D: (id: string, updates: Partial<Capa8DRecord>) => void;
  fourMChanges: FourMChangeRecord[];
  addFourMChange: (change: FourMChangeRecord) => void;

  // Production Offering Report (PRD-OFF) (Module C)
  productionOfferings: ProductionOfferingReport[];
  addProductionOffering: (offering: ProductionOfferingReport) => void;
  signProductionOffering: (
    id: string,
    stage: 'Prepared' | 'Checked' | 'QA' | 'Approved',
    signerName: string
  ) => void;

  // HR Leave Application (Module A / Format A.12)
  hrLeaves: HRLeaveRecord[];
  addHRLeave: (leave: HRLeaveRecord) => void;
  approveHRLeave: (
    id: string,
    stage: 'Dept Incharge' | 'HR' | 'MD',
    status: 'Approved' | 'Rejected',
    remarks?: string,
    signerName?: string
  ) => void;

  // Machine Calibration Master Register (Section K)
  calibrationList: CalibrationRecord[];
  updateCalibration: (id: string, updates: Partial<CalibrationRecord>) => void;

  // 5-Stage Sequential Quality Gatekeeper Functions
  canIssueJobCard: (grnNo: string) => { allowed: boolean; reason?: string };
  canStartBulkProduction: (jobCardNo: string) => { allowed: boolean; reason?: string };
  canPrintPackingSlip: (jobCardNo: string) => { allowed: boolean; reason?: string };
}

const PortalContext = createContext<PortalContextType | undefined>(undefined);

export const PortalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current logged in user (defaults to Director for full initial visibility)
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('pk_current_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_USER_PROFILES[0]; // Kuldeep Singh
  });

  const [activePlant, setActivePlant] = useState<PlantLocation>(() => {
    const s = localStorage.getItem('pk_active_plant');
    return (s as PlantLocation) || 'Haridwar';
  });
  const [activeShift, setActiveShift] = useState<ShiftType>(() => {
    const s = localStorage.getItem('pk_active_shift');
    return (s as ShiftType) || 'Day 12H';
  });

  // Operational State Collections with localStorage
  const [universalJobs, setUniversalJobs] = useState<UniversalJobRecord[]>(() => {
    const s = localStorage.getItem('pk_universal_jobs');
    return s ? JSON.parse(s) : INITIAL_UNIVERSAL_JOBS;
  });

  const [grnList, setGrnList] = useState<GoodsReceiptNote[]>(() => {
    const s = localStorage.getItem('pk_grn_data');
    return s ? JSON.parse(s) : INITIAL_GRN_DATA;
  });

  useEffect(() => {
    localStorage.setItem('pk_universal_jobs', JSON.stringify(universalJobs));
  }, [universalJobs]);

  const addUniversalJob = (job: UniversalJobRecord) => {
    setUniversalJobs(prev => [job, ...prev]);
  };

  const submitPreSprayIQC = (
    jobId: string,
    inspectedQty: number,
    approvedQty: number,
    rejectedQty: number,
    defectReason?: PreSprayIQCRecord['defectReason'],
    remarks?: string
  ) => {
    setUniversalJobs(prev => prev.map(job => {
      if (job.jobId !== jobId) return job;
      return {
        ...job,
        currentStage: '4. Shop Floor Spraying',
        isPreSprayIqcApproved: true,
        preSprayIQC: {
          inspectedQty,
          approvedQty,
          rejectedQty,
          defectReason,
          inspector: currentUser.name || 'IQC Inspector',
          timestamp: new Date().toLocaleString(),
          status: 'Passed',
          remarks
        },
        pieceTracking: {
          ...job.pieceTracking,
          preSprayApproved: approvedQty,
          preSprayRejected: rejectedQty,
          sprayedGood: approvedQty
        }
      };
    }));
  };

  const submitFinalQA = (
    jobId: string,
    deltaE: number,
    adhesionTest: 'Pass (100% Tape)' | 'Fail (Flaking)',
    goodQty: number,
    rejectQty: number,
    remarks?: string
  ) => {
    const isPass = deltaE <= 0.70 && adhesionTest === 'Pass (100% Tape)';
    setUniversalJobs(prev => prev.map(job => {
      if (job.jobId !== jobId) return job;
      return {
        ...job,
        currentStage: isPass ? '6. Billing Invoice' : '5. Strict Final QA',
        isFinalQaApproved: isPass,
        finalQA: {
          spectrophotometerDeltaE: deltaE,
          adhesionTest,
          goodQty,
          rejectQty,
          qcEngineer: currentUser.name || 'QA Lead',
          timestamp: new Date().toLocaleString(),
          status: isPass ? 'Approved' : 'Rejected',
          remarks
        },
        pieceTracking: {
          ...job.pieceTracking,
          finalQaPassed: isPass ? goodQty : 0,
          finalQaRejected: rejectQty,
          billedQty: isPass ? goodQty : 0
        }
      };
    }));
  };

  const advanceJobStage = (jobId: string, nextStage: JobPipelineStage) => {
    setUniversalJobs(prev => prev.map(job => {
      if (job.jobId !== jobId) return job;
      return { ...job, currentStage: nextStage };
    }));
  };

  const [iqcRecords, setIqcRecords] = useState<IQCInspectionRecord[]>(() => {
    const s = localStorage.getItem('pk_iqc_data');
    return s ? JSON.parse(s) : INITIAL_IQC_RECORDS;
  });

  const [handovers, setHandovers] = useState<CustodyHandover[]>(() => {
    const s = localStorage.getItem('pk_handovers_data');
    return s ? JSON.parse(s) : INITIAL_HANDOVERS;
  });

  const [jobCards, setJobCards] = useState<JobCard[]>(() => {
    const s = localStorage.getItem('pk_jobcards_data');
    return s ? JSON.parse(s) : INITIAL_JOB_CARDS;
  });

  const [fpaRecords, setFpaRecords] = useState<FPARecord[]>(() => {
    const s = localStorage.getItem('pk_fpa_data');
    return s ? JSON.parse(s) : INITIAL_FPA_RECORDS;
  });

  const [paintMixing, setPaintMixing] = useState<PaintMixingRecord[]>(() => {
    const s = localStorage.getItem('pk_pmx_data');
    return s ? JSON.parse(s) : INITIAL_PAINT_MIXING;
  });

  const [ipqcRecords, setIpqcRecords] = useState<IPQCRecord[]>(() => {
    const s = localStorage.getItem('pk_ipqc_data');
    return s ? JSON.parse(s) : INITIAL_IPQC_RECORDS;
  });

  const [packingSlips, setPackingSlips] = useState<PackingSlipRecord[]>(() => {
    const s = localStorage.getItem('pk_packing_data');
    return s ? JSON.parse(s) : INITIAL_PACKING_SLIPS;
  });

  const [qualityReleases, setQualityReleases] = useState<FinalQualityRelease[]>(() => {
    const s = localStorage.getItem('pk_quality_releases');
    return s ? JSON.parse(s) : INITIAL_QUALITY_RELEASES;
  });

  const [billingInvoices, setBillingInvoices] = useState<BillingInvoice[]>(() => {
    const s = localStorage.getItem('pk_billing_invoices');
    return s ? JSON.parse(s) : INITIAL_BILLING_INVOICES;
  });

  const [gatePasses, setGatePasses] = useState<GatePassRecord[]>(() => {
    const s = localStorage.getItem('pk_gate_passes');
    return s ? JSON.parse(s) : INITIAL_GATE_PASSES;
  });

  const [materialInwardLogs, setMaterialInwardLogs] = useState<MaterialInwardRecord[]>(() => {
    const s = localStorage.getItem('pk_material_inward');
    return s ? JSON.parse(s) : INITIAL_MATERIAL_INWARD;
  });

  const [materialOutwardLogs, setMaterialOutwardLogs] = useState<MaterialOutwardRecord[]>(() => {
    const s = localStorage.getItem('pk_material_outward');
    return s ? JSON.parse(s) : INITIAL_MATERIAL_OUTWARD;
  });

  const [defects, setDefects] = useState<DefectItem[]>(MASTER_DEFECTS);

  // Module E: 100-Question MNC Audit Engine State
  const [auditQuestions, setAuditQuestions] = useState<AuditQuestionItem[]>(() => {
    const s = localStorage.getItem('pk_audit_questions');
    return s ? JSON.parse(s) : INITIAL_MNC_AUDIT_QUESTIONS;
  });

  // Module E / J: 8D CAPA Records State
  const [capa8DList, setCapa8DList] = useState<Capa8DRecord[]>(() => {
    const s = localStorage.getItem('pk_capa_8d');
    return s ? JSON.parse(s) : INITIAL_CAPA_8D_RECORDS;
  });

  // Module E / J: 4M Change Control Register State
  const [fourMChanges, setFourMChanges] = useState<FourMChangeRecord[]>(() => {
    const s = localStorage.getItem('pk_4m_changes');
    return s ? JSON.parse(s) : INITIAL_4M_CHANGE_RECORDS;
  });

  // Module C: Production Offering Report State (PRD-OFF)
  const [productionOfferings, setProductionOfferings] = useState<ProductionOfferingReport[]>(() => {
    const s = localStorage.getItem('pk_prod_offerings');
    return s ? JSON.parse(s) : INITIAL_PRODUCTION_OFFERING_REPORTS;
  });

  // Module A: HR Leave Applications State (Format A.12)
  const [hrLeaves, setHrLeaves] = useState<HRLeaveRecord[]>(() => {
    const s = localStorage.getItem('pk_hr_leaves');
    return s ? JSON.parse(s) : INITIAL_HR_LEAVE_RECORDS;
  });

  // Module K: Machine & Measuring Calibration Register State
  const [calibrationList, setCalibrationList] = useState<CalibrationRecord[]>(() => {
    const s = localStorage.getItem('pk_calibration_list');
    return s ? JSON.parse(s) : INITIAL_CALIBRATION_RECORDS;
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('pk_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('pk_active_plant', activePlant);
  }, [activePlant]);

  useEffect(() => {
    localStorage.setItem('pk_active_shift', activeShift);
  }, [activeShift]);

  useEffect(() => {
    localStorage.setItem('pk_grn_data', JSON.stringify(grnList));
  }, [grnList]);

  useEffect(() => {
    localStorage.setItem('pk_handovers_data', JSON.stringify(handovers));
  }, [handovers]);

  useEffect(() => {
    localStorage.setItem('pk_jobcards_data', JSON.stringify(jobCards));
  }, [jobCards]);

  useEffect(() => {
    localStorage.setItem('pk_fpa_data', JSON.stringify(fpaRecords));
  }, [fpaRecords]);

  useEffect(() => {
    localStorage.setItem('pk_pmx_data', JSON.stringify(paintMixing));
  }, [paintMixing]);

  useEffect(() => {
    localStorage.setItem('pk_ipqc_data', JSON.stringify(ipqcRecords));
  }, [ipqcRecords]);

  useEffect(() => {
    localStorage.setItem('pk_packing_data', JSON.stringify(packingSlips));
  }, [packingSlips]);

  useEffect(() => {
    localStorage.setItem('pk_quality_releases', JSON.stringify(qualityReleases));
  }, [qualityReleases]);

  useEffect(() => {
    localStorage.setItem('pk_billing_invoices', JSON.stringify(billingInvoices));
  }, [billingInvoices]);

  useEffect(() => {
    localStorage.setItem('pk_gate_passes', JSON.stringify(gatePasses));
  }, [gatePasses]);

  useEffect(() => {
    localStorage.setItem('pk_material_inward', JSON.stringify(materialInwardLogs));
  }, [materialInwardLogs]);

  useEffect(() => {
    localStorage.setItem('pk_material_outward', JSON.stringify(materialOutwardLogs));
  }, [materialOutwardLogs]);

  useEffect(() => {
    localStorage.setItem('pk_audit_questions', JSON.stringify(auditQuestions));
  }, [auditQuestions]);

  useEffect(() => {
    localStorage.setItem('pk_capa_8d', JSON.stringify(capa8DList));
  }, [capa8DList]);

  useEffect(() => {
    localStorage.setItem('pk_4m_changes', JSON.stringify(fourMChanges));
  }, [fourMChanges]);

  useEffect(() => {
    localStorage.setItem('pk_prod_offerings', JSON.stringify(productionOfferings));
  }, [productionOfferings]);

  useEffect(() => {
    localStorage.setItem('pk_hr_leaves', JSON.stringify(hrLeaves));
  }, [hrLeaves]);

  useEffect(() => {
    localStorage.setItem('pk_calibration_list', JSON.stringify(calibrationList));
  }, [calibrationList]);

  const addMaterialInwardRecord = (record: MaterialInwardRecord) => {
    setMaterialInwardLogs(prev => [record, ...prev]);

    // AUTOMATIC STORE HANDOVER: Pushes a GRN into grnList so Store Incharge immediately sees it on Stores Dashboard!
    const summaryDesc = record.descriptionOfMaterial || record.items?.map(i => `${i.materialName} (${i.quantity} ${i.unit})`).join(', ') || 'Mixed Goods';
    const totalQtyCount = record.totalQuantity || record.items?.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0) || record.quantity || 1;

    const newGrn: GoodsReceiptNote = {
      grnNo: record.grnNo || `PK-GRN-${Date.now().toString().slice(-4)}`,
      date: record.date,
      plant: record.plant || activePlant,
      supplierCustomer: record.partyName,
      invoiceChallanNo: record.challanNo,
      invoiceDate: record.date,
      vehicleNo: record.vehicleNo,
      transporter: 'Main Gate Transporter',
      partCode: record.materialCategory === 'Party Material' ? 'SUBSTRATE-IN' : 'PAINT-RAW-01',
      description: summaryDesc,
      batchNo: `BAT-IN-${Date.now().toString().slice(-4)}`,
      invoicedQty: totalQtyCount,
      actualReceivedQty: totalQtyCount,
      colorSplits: [],
      iqcStatus: 'Pending',
      storeIncharge: record.receivedBy || currentUser.name,
      remarks: `Auto-ingested from Security Gate Inward Entry [${record.materialCategory}]. Items: ${record.items?.length || 1} rows. Remarks: ${record.remarks || 'None'}`
    };

    setGrnList(prev => [newGrn, ...prev]);
  };


  const addMaterialOutwardRecord = (record: MaterialOutwardRecord) => {
    setMaterialOutwardLogs(prev => [record, ...prev]);

    // Update Gate Pass status to Security Out
    const matchingGp = gatePasses.find(gp => gp.gatePassNo === record.gatePassNo || gp.vehicleNo === record.vehicleNo);
    if (matchingGp) {
      setGatePasses(prev => prev.map(gp => gp.gatePassNo === matchingGp.gatePassNo ? { ...gp, status: 'Closed' } : gp));
    }
  };


  const switchUser = (userId: string) => {
    const found = INITIAL_USER_PROFILES.find(u => u.id === userId);
    if (found) {
      setCurrentUser(found);
    }
  };

  const addJobCard = (jc: JobCard) => {
    setJobCards(prev => [jc, ...prev]);
  };

  const addGRN = (grn: GoodsReceiptNote) => {
    if (!grn || !grn.grnNo) return;
    setGrnList(prev => [grn, ...prev]);

    // Automatically create Color-Split Job Cards for each color requirement!
    if (grn.colorSplits && grn.colorSplits.length > 0) {
      const woSuffix = grn.grnNo.replace(/^PK-GRN-/, '').slice(-4);
      const generatedJobCards: JobCard[] = grn.colorSplits.map((split, idx) => {
        const codeClean = (split.colorCode || `C${idx + 1}`).replace(/[^a-zA-Z0-9]/g, '');
        return {
          docNo: 'Doc No: 001',
          revNo: '00',
          revDate: '2026-08-01',
          jobCardNo: `JC-${woSuffix}-${codeClean}`,
          woNo: `WO-${woSuffix}`,
          customer: grn.supplierCustomer,
          partCode: grn.partCode || 'SUBSTRATE',
          partDescription: grn.description || 'Raw Substrate',
          model: 'OEM Batch',
          color: split.colorName,
          targetQty: Number(split.orderedQty) || 0, // HARD COLOR TARGET CAP
          issuedRawQty: Number(split.orderedQty) || 0,
          sprayedQty: 0,
          goodQty: 0,
          rejectQty: 0,
          boothNo: idx % 2 === 0 ? 'Booth #1 (Conveyor Line)' : 'Booth #2 (Enclosed Dust-Free)',
          painterName: idx % 2 === 0 ? 'Kailash Yadav' : 'Ramesh Sharma',
          wNo: `WO-${woSuffix}`,
          issueDate: grn.date || new Date().toISOString().split('T')[0],
          issueTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          leadTime: '4 Hours',
          dept: 'Cubic Dipping & Spray Line',
          issuedMaterials: [
            {
              id: `mat_${Date.now()}_${idx}`,
              itemDescription: grn.description || 'Raw Part Substrate',
              qty: Number(split.orderedQty) || 0,
              colour: split.colorName,
              uom: 'Pcs',
              remark: `Issued from GRN ${grn.grnNo}`
            }
          ],
          storeIncharge: grn.storeIncharge || 'Manoj Tiwari',
          prodSupervisor: 'Vikram Patel',
          approvedBy: 'Satish Sharma',
          paintBatch: `BAT-${codeClean}-${Date.now().toString().slice(-4)}`,
          thinnerBatch: 'THN-STD-01',
          hardenerBatch: 'HDN-STD-01',
          status: 'Open',
          fpaStatus: 'Pending',
          startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      });

      setJobCards(prev => [...generatedJobCards, ...prev]);

      // Automatically create initial Handover from Raw Stores to Surface Prep
      const initialHandover: CustodyHandover = {
        transferId: `TRF-${woSuffix}-01`,
        date: grn.date || new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        plant: grn.plant || activePlant,
        woNo: `WO-${woSuffix}`,
        jobCardNo: `JC-${woSuffix}-ALL`,
        partCode: grn.partCode,
        color: grn.colorSplits.map(c => c.colorName).join(' + '),
        fromStage: 'Raw Stores',
        toStage: 'Surface Prep & Jigging',
        senderName: grn.storeIncharge || currentUser.name || 'Stores Incharge',
        senderQty: Number(grn.actualReceivedQty) || 0,
        status: 'Pending Receipt'
      };

      setHandovers(prev => [initialHandover, ...prev]);
    }
  };

  // PROBLEM 2: Inter-stage Handover & Custody Logic
  const sendHandover = (transfer: {
    woNo: string;
    jobCardNo: string;
    partCode: string;
    color: string;
    fromStage: CustodyHandover['fromStage'];
    toStage: CustodyHandover['toStage'];
    senderName: string;
    senderQty: number;
    plant?: PlantLocation;
  }) => {
    const woSuffix = transfer.woNo ? transfer.woNo.replace(/^WO-/, '') : Date.now().toString().slice(-4);
    const uniqueTransferId = `TRF-${woSuffix}-${Math.floor(10 + Math.random() * 90)}`;
    const newTransfer: CustodyHandover = {
      transferId: uniqueTransferId,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      plant: transfer.plant || activePlant,
      woNo: transfer.woNo,
      jobCardNo: transfer.jobCardNo,
      partCode: transfer.partCode,
      color: transfer.color,
      fromStage: transfer.fromStage,
      toStage: transfer.toStage,
      senderName: transfer.senderName,
      senderQty: Number(transfer.senderQty) || 0,
      status: 'Pending Receipt'
    };

    setHandovers(prev => [newTransfer, ...prev]);
  };

  const receiveHandover = (
    transferId: string,
    receiverName: string,
    receiverQty: number,
    discrepancyReason?: CustodyHandover['discrepancyReason'],
    discrepancyNote?: string
  ) => {
    setHandovers(prev => prev.map(t => {
      if (t.transferId !== transferId) return t;

      const numReceiver = Number(receiverQty) || 0;
      // Formula: discrepancyQty = senderQty - receiverQty (shortage positive, excess negative)
      const discrepancy = Number(t.senderQty) - numReceiver;

      if (discrepancy === 0) {
        return {
          ...t,
          receiverName,
          receiverQty: numReceiver,
          status: 'Accepted (Match)',
          discrepancyQty: 0
        };
      } else {
        // Discrepancy detected (e.g. 300 sent, 270 received => 30 pieces shortage)
        return {
          ...t,
          receiverName,
          receiverQty: numReceiver,
          status: 'Discrepancy Halt',
          discrepancyQty: discrepancy,
          discrepancyReason: discrepancyReason || 'Unaccounted Loss',
          discrepancyNote: discrepancyNote || `Count mismatch: ${t.senderQty} sent by ${t.senderName}, but ${numReceiver} counted by ${receiverName} (${discrepancy > 0 ? `${discrepancy} Shortage` : `${Math.abs(discrepancy)} Excess`}).`
        };
      }
    }));
  };

  const resolveHandoverDiscrepancy = (transferId: string, action: string, supervisorName: string) => {
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const resolvedAt = `${today} ${time}`;

    setHandovers(prev => prev.map(t => {
      if (t.transferId !== transferId) return t;
      return {
        ...t,
        status: 'Supervisor Resolved',
        supervisorAction: action,
        supervisorApprovedBy: supervisorName,
        resolvedAt
      };
    }));
  };

  // PROBLEM 1: Job Cards & Target Caps
  const updateJobCardProgress = (jobCardNo: string, addedSprayedQty: number, addedRejectQty: number = 0) => {
    setJobCards(prev => prev.map(jc => {
      if (jc.jobCardNo !== jobCardNo) return jc;

      const newSprayed = Math.max(0, jc.sprayedQty + Number(addedSprayedQty || 0));
      const newReject = Math.max(0, jc.rejectQty + Number(addedRejectQty || 0));
      const newGood = Math.max(0, newSprayed - newReject);

      let newStatus: JobCard['status'] = jc.status;
      if (newSprayed > jc.targetQty) {
        newStatus = 'Over-Run Flagged';
      } else if (newSprayed === jc.targetQty) {
        newStatus = 'Target Met';
      } else if (newSprayed > 0) {
        newStatus = 'In Process';
      } else {
        newStatus = 'Open';
      }

      return {
        ...jc,
        sprayedQty: newSprayed,
        goodQty: newGood,
        rejectQty: newReject,
        status: newStatus
      };
    }));
  };

  const updateJobCardSprayed = (
    jobCardNo: string,
    addedSprayedQty: number,
    addedRejectQty: number = 0,
    defectCategory?: string
  ) => {
    updateJobCardProgress(jobCardNo, addedSprayedQty, addedRejectQty);

    if (addedRejectQty > 0 && defectCategory) {
      setDefects(prev => prev.map(d => {
        if (d.code === defectCategory || d.name === defectCategory) {
          return { ...d, count: d.count + Number(addedRejectQty) };
        }
        return d;
      }));
    }
  };

  // Quality FPA Golden Gate
  const createFPARecord = (fpaData: Omit<FPARecord, 'reportNo' | 'overallResult'>) => {
    // STRICT RULE: Delta-E <= 0.70 AND Adhesion == 100% AND crossCutTest == Pass
    const isApproved = fpaData.deltaE <= 0.70 && fpaData.adhesionPercent === 100 && fpaData.crossCutTest === 'Pass';
    const overallResult: FPARecord['overallResult'] = isApproved ? 'Approved' : 'Hold';

    const currentYear = new Date().getFullYear();
    const newFpa: FPARecord = {
      ...fpaData,
      reportNo: `PK-FPA-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`,
      overallResult
    };

    setFpaRecords(prev => [newFpa, ...prev]);

    // Update corresponding Job Card FPA status
    setJobCards(prev => prev.map(jc => {
      const matchJobCard = jc.jobCardNo.toLowerCase() === fpaData.jobCardNo.toLowerCase();
      const matchWoColor = jc.woNo.toLowerCase() === fpaData.woNo.toLowerCase() &&
                           jc.color.toLowerCase() === fpaData.color.toLowerCase();
      if (matchJobCard || matchWoColor) {
        return { ...jc, fpaStatus: overallResult };
      }
      return jc;
    }));
  };

  const addFPATest = createFPARecord;

  // PROBLEM 1: Smart Billing Engine Toggle / Client Concession
  const toggleInvoiceExcessApproval = (invoiceNo: string, lineItemId: string) => {
    setBillingInvoices(prev => prev.map(inv => {
      if (inv.invoiceNo !== invoiceNo) return inv;

      let updatedTotalBilledQty = 0;
      const updatedLines = inv.lineItems.map(item => {
        if (item.id === lineItemId) {
          const newApproved = !item.excessApprovedByClient;
          // If approved by client, bill ordered + excess (e.g. 250 + 50 = 300). If not approved, bill ordered (250).
          const newBillable = newApproved ? item.orderedQty + item.excessQty : item.orderedQty;
          const newLineTotal = Math.round(newBillable * item.unitRate * 100) / 100;
          updatedTotalBilledQty += newBillable;
          return {
            ...item,
            excessApprovedByClient: newApproved,
            billableQty: newBillable,
            lineTotal: newLineTotal,
            status: (newApproved ? 'Contract Fulfilled' : (item.excessQty > 0 ? 'Excess On Hold' : 'Contract Fulfilled')) as BillableLineItem['status']
          };
        }
        updatedTotalBilledQty += item.billableQty;
        return item;
      });

      const newSubTotal = Math.round(updatedLines.reduce((acc, curr) => acc + curr.lineTotal, 0) * 100) / 100;
      // GST: CGST (9%) + SGST (9%) (Total 18%)
      const cgstAmount = Math.round(newSubTotal * 0.09 * 100) / 100;
      const sgstAmount = Math.round(newSubTotal * 0.09 * 100) / 100;
      const newGst = Math.round((cgstAmount + sgstAmount) * 100) / 100;
      const newGrand = Math.round((newSubTotal + newGst) * 100) / 100;

      return {
        ...inv,
        lineItems: updatedLines,
        subTotal: newSubTotal,
        gstPercent: 18,
        gstAmount: newGst,
        cgstAmount,
        sgstAmount,
        grandTotal: newGrand,
        totalBilledQty: updatedTotalBilledQty
      };
    }));
  };

  const toggleClientConcession = toggleInvoiceExcessApproval;

  const generateNewInvoiceFromPDI = (woNo: string) => {
    // Generate invoice from cleared PDI / OQC releases
    const releases = qualityReleases.filter(r => r.woNo === woNo);
    if (!releases.length) return;

    const newLines = releases.map((r, i) => {
      const isRed = r.color.includes('Red');
      const poOrdered = isRed ? 250 : 750;
      const unitRate = isRed ? 25 : 20;
      const billable = Math.min(r.passedQty, poOrdered);
      const excess = Math.max(0, r.passedQty - poOrdered);
      return {
        id: `li_${i}_${Date.now()}`,
        colorName: r.color,
        orderedQty: poOrdered,
        passedAndPackedQty: r.passedQty,
        billableQty: billable,
        excessQty: excess,
        excessApprovedByClient: false,
        unitRate,
        lineTotal: Math.round(billable * unitRate * 100) / 100,
        status: 'Contract Fulfilled' as const
      };
    });

    const subTotal = Math.round(newLines.reduce((acc, curr) => acc + curr.lineTotal, 0) * 100) / 100;
    const cgstAmount = Math.round(subTotal * 0.09 * 100) / 100;
    const sgstAmount = Math.round(subTotal * 0.09 * 100) / 100;
    const gstAmount = Math.round((cgstAmount + sgstAmount) * 100) / 100;
    const currentYear = new Date().getFullYear();

    const newInvoice: BillingInvoice = {
      invoiceNo: `PK-TAX-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      woNo,
      customer: releases[0].customer,
      plant: activePlant,
      lineItems: newLines,
      subTotal,
      gstPercent: 18,
      gstAmount,
      cgstAmount,
      sgstAmount,
      grandTotal: Math.round((subTotal + gstAmount) * 100) / 100,
      totalOrderedQty: newLines.reduce((acc, curr) => acc + curr.orderedQty, 0),
      totalBilledQty: newLines.reduce((acc, curr) => acc + curr.billableQty, 0),
      status: 'Generated',
      preparedBy: currentUser.name
    };

    setBillingInvoices(prev => [newInvoice, ...prev]);
  };

  const createGatePass = (gp: GatePassRecord) => {
    setGatePasses(prev => [gp, ...prev]);
  };

  const updateGatePassStatus = (gatePassNo: string, status: GatePassRecord['status']) => {
    setGatePasses(prev => prev.map(gp => gp.gatePassNo === gatePassNo ? { ...gp, status } : gp));
  };
  const addIQCRecord = (iqc: IQCInspectionRecord) => {
    setIqcRecords(prev => [iqc, ...prev]);
  };

  const addIPQCRecord = (ipqc: IPQCRecord) => {
    setIpqcRecords(prev => [ipqc, ...prev]);
  };

  const addOQCRelease = (release: FinalQualityRelease) => {
    setQualityReleases(prev => [release, ...prev]);

    // Automatically generate/update Tax Invoice for Billing Desk when OQC & PDI is cleared!
    if (release.pdiStatus === 'Cleared for Invoicing') {
      const isRed = release.color.includes('Red');
      const poOrdered = isRed ? 250 : 750;
      const unitRate = isRed ? 25 : 20;
      const billable = Math.min(release.passedQty, poOrdered);
      const excess = Math.max(0, release.passedQty - poOrdered);

      const lineItem: BillableLineItem = {
        id: `li_${Date.now()}`,
        colorName: release.color,
        orderedQty: poOrdered,
        passedAndPackedQty: release.passedQty,
        billableQty: billable,
        excessQty: excess,
        excessApprovedByClient: false,
        unitRate,
        lineTotal: Math.round(billable * unitRate * 100) / 100,
        status: 'Contract Fulfilled'
      };

      const subTotal = lineItem.lineTotal;
      const cgstAmount = Math.round(subTotal * 0.09 * 100) / 100;
      const sgstAmount = Math.round(subTotal * 0.09 * 100) / 100;
      const gstAmount = Math.round((cgstAmount + sgstAmount) * 100) / 100;
      const currentYear = new Date().getFullYear();

      const newInvoice: BillingInvoice = {
        invoiceNo: `PK-TAX-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`,
        invoiceDate: release.date || new Date().toISOString().split('T')[0],
        woNo: release.woNo,
        customer: release.customer,
        plant: release.plant || activePlant,
        lineItems: [lineItem],
        subTotal,
        gstPercent: 18,
        gstAmount,
        cgstAmount,
        sgstAmount,
        grandTotal: Math.round((subTotal + gstAmount) * 100) / 100,
        totalOrderedQty: poOrdered,
        totalBilledQty: billable,
        status: 'Generated',
        preparedBy: release.inspector || currentUser.name,
        balanceBacklogNote: `OQC Release ${release.releaseId} cleared. Billed strictly on ${billable} pcs passed.`
      };

      setBillingInvoices(prev => [newInvoice, ...prev]);
    }
  };

  // Module E: Audit Actions
  const updateAuditAnswer = (id: string, updates: Partial<AuditQuestionItem>) => {
    setAuditQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const resetAuditToStandard = () => {
    setAuditQuestions(INITIAL_MNC_AUDIT_QUESTIONS);
    localStorage.removeItem('pk_audit_questions');
  };

  // Module E / J: 8D CAPA Actions
  const addCapa8D = (capa: Capa8DRecord) => {
    setCapa8DList(prev => [capa, ...prev]);
  };

  const updateCapa8D = (id: string, updates: Partial<Capa8DRecord>) => {
    setCapa8DList(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  // Module E / J: 4M Change Control
  const addFourMChange = (change: FourMChangeRecord) => {
    setFourMChanges(prev => [change, ...prev]);
  };

  // Module C: Production Offering Report
  const addProductionOffering = (offering: ProductionOfferingReport) => {
    setProductionOfferings(prev => [offering, ...prev]);
  };

  const signProductionOffering = (
    id: string,
    stage: 'Prepared' | 'Checked' | 'QA' | 'Approved',
    signerName: string
  ) => {
    const timestamp = new Date().toLocaleString();
    setProductionOfferings(prev => prev.map(rep => {
      if (rep.id !== id) return rep;
      if (stage === 'Prepared') {
        return { ...rep, preparedBy: signerName, preparedDate: timestamp, status: 'Offered to QA' };
      } else if (stage === 'Checked') {
        return { ...rep, checkedBy: signerName, checkedDate: timestamp };
      } else if (stage === 'QA') {
        return { ...rep, qaCheckedBy: signerName, qaDate: timestamp, status: 'QA Inspected' };
      } else if (stage === 'Approved') {
        return { ...rep, approvedBy: signerName, approvalDate: timestamp, status: 'Approved' };
      }
      return rep;
    }));
  };

  // Module A: HR Leave Actions (Format A.12)
  const addHRLeave = (leave: HRLeaveRecord) => {
    setHrLeaves(prev => [leave, ...prev]);
  };

  const approveHRLeave = (
    id: string,
    stage: 'Dept Incharge' | 'HR' | 'MD',
    status: 'Approved' | 'Rejected',
    remarks?: string,
    signerName?: string
  ) => {
    const timestamp = new Date().toLocaleString();
    setHrLeaves(prev => prev.map(lv => {
      if (lv.id !== id) return lv;
      if (stage === 'Dept Incharge') {
        return {
          ...lv,
          deptInchargeStatus: status === 'Approved' ? 'Recommended' : 'Rejected',
          deptInchargeRemarks: remarks,
          deptInchargeName: signerName || currentUser.name,
          deptInchargeSignDate: timestamp,
          finalStatus: status === 'Approved' ? 'In Review' : 'Rejected'
        };
      } else if (stage === 'HR') {
        return {
          ...lv,
          hrStatus: status === 'Approved' ? 'Verified' : 'Rejected',
          hrRemarks: remarks,
          hrName: signerName || currentUser.name,
          hrSignDate: timestamp,
          finalStatus: status === 'Approved' ? 'In Review' : 'Rejected'
        };
      } else if (stage === 'MD') {
        return {
          ...lv,
          mdStatus: status === 'Approved' ? 'Sanctioned' : 'Rejected',
          mdName: signerName || currentUser.name,
          mdSignDate: timestamp,
          finalStatus: status === 'Approved' ? 'Sanctioned' : 'Rejected'
        };
      }
      return lv;
    }));
  };

  // Module K: Calibration Actions
  const updateCalibration = (id: string, updates: Partial<CalibrationRecord>) => {
    setCalibrationList(prev => prev.map(cal => cal.id === id ? { ...cal, ...updates } : cal));
  };

  // Strict 5-Stage Sequential Quality Gatekeeper Functions
  const canIssueJobCard = (grnNo: string): { allowed: boolean; reason?: string } => {
    const grn = grnList.find(g => g.grnNo === grnNo);
    if (!grn) return { allowed: false, reason: 'GRN record not found in system.' };
    if (grn.iqcStatus === 'Rejected' || grn.iqcStatus === 'Hold') {
      return { allowed: false, reason: `Gate 1 Block: GRN ${grnNo} is on IQC ${grn.iqcStatus}. Raw substrate cannot be issued to Job Card.` };
    }
    return { allowed: true };
  };

  const canStartBulkProduction = (jobCardNo: string): { allowed: boolean; reason?: string } => {
    const jc = jobCards.find(j => j.jobCardNo === jobCardNo);
    if (!jc) return { allowed: false, reason: 'Job Card not found.' };
    const matchingFpa = fpaRecords.find(f => f.jobCardNo === jobCardNo || f.woNo === jc.woNo);
    if (!matchingFpa || matchingFpa.overallResult !== 'Approved') {
      return {
        allowed: false,
        reason: `Gate 2 Block (FPA Golden Gate): No approved First Part Approval found for ${jobCardNo}. Spectrophotometer ΔE ≤ 0.70 and 100% tape adhesion approval required before bulk spray run.`
      };
    }
    return { allowed: true };
  };

  const canPrintPackingSlip = (jobCardNo: string): { allowed: boolean; reason?: string } => {
    const jc = jobCards.find(j => j.jobCardNo === jobCardNo);
    if (!jc) return { allowed: false, reason: 'Job Card not found.' };
    const rel = qualityReleases.find(q => q.woNo === jc.woNo || q.partCode === jc.partCode);
    if (rel && (rel.oqcStatus === 'Rejected' || rel.pdiStatus === 'Hold')) {
      return {
        allowed: false,
        reason: `Gate 5 Block (PDI Release): Outgoing quality release is on ${rel.oqcStatus} / ${rel.pdiStatus}. 4"x6" Thermal Packing Slip cannot be released.`
      };
    }
    return { allowed: true };
  };

  // Counts for Top Notification badges
  const unresolvedHandoversCount = handovers.filter(h => h.status === 'Discrepancy Halt').length;
  const openOverrunCount = jobCards.filter(jc => jc.status === 'Over-Run Flagged').length;

  return (
    <PortalContext.Provider
      value={{
        currentUser,
        switchUser,
        activePlant,
        setActivePlant,
        activeShift,
        setActiveShift,
        universalJobs,
        addUniversalJob,
        submitPreSprayIQC,
        submitFinalQA,
        advanceJobStage,
        grnList,
        iqcRecords,
        handovers,
        jobCards,
        fpaRecords,
        paintMixing,
        ipqcRecords,
        packingSlips,
        qualityReleases,
        billingInvoices,
        gatePasses,
        materialInwardLogs,
        materialOutwardLogs,
        defects,
        addGRN,
        addIQCRecord,
        addIPQCRecord,
        addOQCRelease,
        addJobCard,
        addMaterialInwardRecord,
        addMaterialOutwardRecord,
        sendHandover,
        receiveHandover,
        resolveHandoverDiscrepancy,

        updateJobCardProgress,
        updateJobCardSprayed,
        createFPARecord,
        addFPATest,
        toggleInvoiceExcessApproval,
        toggleClientConcession,
        generateNewInvoiceFromPDI,
        createGatePass,
        updateGatePassStatus,
        unresolvedHandoversCount,
        openOverrunCount,

        // Module E: MNC Audit
        auditQuestions,
        updateAuditAnswer,
        resetAuditToStandard,

        // Module E / J: 8D CAPA & 4M
        capa8DList,
        addCapa8D,
        updateCapa8D,
        fourMChanges,
        addFourMChange,

        // Module C: Production Offering
        productionOfferings,
        addProductionOffering,
        signProductionOffering,

        // Module A: HR Leaves
        hrLeaves,
        addHRLeave,
        approveHRLeave,

        // Module K: Calibration
        calibrationList,
        updateCalibration,

        // Gatekeeper helpers
        canIssueJobCard,
        canStartBulkProduction,
        canPrintPackingSlip
      }}
    >
      {children}
    </PortalContext.Provider>
  );
};

export const usePortalStore = () => {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error('usePortalStore must be used within a PortalProvider');
  }
  return context;
};
