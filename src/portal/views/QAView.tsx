import React, { useState, useEffect } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { 
  CheckCircle2, 
  Plus, 
  Gauge, 
  Activity, 
  Layers, 
  FileCheck,
  X,
  Sparkles,
  Search,
  Check,
  AlertTriangle,
  Download,
  Eye,
  FileText,
  Package,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  Printer,
  ShieldCheck,
  Clock,
  Truck,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Trash2,
  RotateCcw,
  Wrench,
  Mail
} from 'lucide-react';
import { 
  IQCInspectionRecord, 
  IQCAspectItem,
  IQCVerifiedItem,
  IPQCRecord, 
  FinalQualityRelease,
  MaterialInwardRecord,
  DefectCategory
} from '../types/portalTypes';
import { CustomSelect } from '../components/CustomSelect';
import { PaintkingDatePicker } from '../components/PaintkingDatePicker';
import { downloadStandardIQCPdf, formatDateDDMMYYYY } from '../utils/pdfStandardHeader';
import { UniversalEmailModal } from '../components/UniversalEmailModal';
import { composeIqcEmailDraft, EmailDispatchPayload } from '../utils/emailDispatchEngine';

export const QAView: React.FC = () => {
  const { 
    fpaRecords, 
    createFPARecord, 
    ipqcRecords, 
    addIPQCRecord,
    iqcRecords,
    addIQCRecord,
    submitMasterIQCReport,
    qualityReleases,
    addOQCRelease,
    jobCards,
    grnList,
    universalJobs,
    materialInwardLogs,
    submitPreSprayIQC,
    submitFinalQA,
    routeToRework,
    passReworkClearance,
    activePlant, 
    currentUser,
    activeSubTab: globalSubTab,
    setActiveSubTab: setGlobalSubTab
  } = usePortalStore();

  const [activeSubTab, setActiveSubTab] = useState<'IQC' | 'UNIVERSAL_IQC' | 'UNIVERSAL_QA' | 'IPQC' | 'OQC' | 'REWORK_CLEARANCE'>('IQC');
  const [iqcViewTab, setIqcViewTab] = useState<'PENDING' | 'COMPLETED'>('PENDING');

  useEffect(() => {
    if (globalSubTab === 'PENDING' || globalSubTab === 'COMPLETED') {
      setIqcViewTab(globalSubTab);
      setActiveSubTab('IQC');
    } else if (globalSubTab === 'IQC') {
      setIqcViewTab('PENDING');
      setActiveSubTab('IQC');
    } else if (globalSubTab === 'UNIVERSAL_IQC' || globalSubTab === 'UNIVERSAL_QA' || globalSubTab === 'IPQC' || globalSubTab === 'OQC' || globalSubTab === 'REWORK_CLEARANCE') {
      setActiveSubTab(globalSubTab);
    }
  }, [globalSubTab]);

  // QA Rework Action Modal State
  const [showReworkActionModal, setShowReworkActionModal] = useState<boolean>(false);
  const [selectedJcForRework, setSelectedJcForRework] = useState<string>('JC-1042-RED');
  const [reworkActionQty, setReworkActionQty] = useState<number>(10);
  const [reworkActionDefect, setReworkActionDefect] = useState<DefectCategory>('dust_nibs');
  const [reworkActionNotes, setReworkActionNotes] = useState<string>('Sand defect area with P1500, tack wipe, re-spray basecoat and cure.');

  const [iqcSearchQuery, setIqcSearchQuery] = useState<string>('');

  const pendingInwards = materialInwardLogs.filter(inw => !inw.iqcStatus || inw.iqcStatus === 'Pending');
  const completedInwards = materialInwardLogs.filter(inw => inw.iqcStatus && inw.iqcStatus !== 'Pending');

  const filteredPendingInwards = pendingInwards.filter(inw => {
    if (!iqcSearchQuery.trim()) return true;
    const q = iqcSearchQuery.toLowerCase();
    return (
      inw.srNo?.toLowerCase().includes(q) ||
      inw.partyName?.toLowerCase().includes(q) ||
      inw.challanNo?.toLowerCase().includes(q) ||
      inw.vehicleNo?.toLowerCase().includes(q) ||
      inw.descriptionOfMaterial?.toLowerCase().includes(q)
    );
  });

  const filteredIqcRecords = iqcRecords.filter(rec => {
    if (!iqcSearchQuery.trim()) return true;
    const q = iqcSearchQuery.toLowerCase();
    return (
      rec.reportNo?.toLowerCase().includes(q) ||
      (rec.vendorCustomer || rec.supplierCustomer || '').toLowerCase().includes(q) ||
      rec.invoiceChallanNo?.toLowerCase().includes(q) ||
      (rec.partComponent || rec.partCode || '').toLowerCase().includes(q) ||
      (rec.partDescription || '').toLowerCase().includes(q) ||
      (rec.batchNo || '').toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (currentUser.role === 'IQC_INSPECTOR') {
      setActiveSubTab('IQC');
    }
  }, [currentUser.role]);

  // Modal Visibility States
  const [showUniversalIqcModal, setShowUniversalIqcModal] = useState<boolean>(false);
  const [showUniversalQaModal, setShowUniversalQaModal] = useState<boolean>(false);
  const [selectedUniversalJobId, setSelectedUniversalJobId] = useState<string>('');

  // Form states for Universal Pre-Spray IQC
  const [uniIqcForm, setUniIqcForm] = useState({
    jobId: '',
    approvedPcs: 0,
    rejectedPcs: 0,
    notes: 'Pre-spray substrate inspected. Surface clean, zero cracks or sink marks.'
  });

  // Form states for Universal Final QA Gate
  const [uniQaForm, setUniQaForm] = useState({
    jobId: '',
    deltaE: 0.38,
    adhesionPass: true,
    finalPassedQty: 0,
    notes: 'Spectrophotometer ΔE ≤ 0.70 and ASTM 5B Cross-Cut Adhesion 100% compliant. Cleared for billing.'
  });

  const [showFpaModal, setShowFpaModal] = useState<boolean>(false);
  const [showIpqcModal, setShowIpqcModal] = useState<boolean>(false);
  const [showIqcModal, setShowIqcModal] = useState<boolean>(false);
  const [showOqcModal, setShowOqcModal] = useState<boolean>(false);

  // Auto-Fill Source List from active Job Cards / GRNs
  const availableOrders = jobCards.length > 0 ? jobCards : [
    {
      woNo: 'WO-1042',
      jobCardNo: 'JC-1042-RED',
      customer: 'ROOP POLYMERS LTD',
      partCode: 'RP-8841',
      color: 'Monza Red Gloss',
      painterName: 'Ramesh Sharma',
      boothNo: 'Booth #2',
      paintBatch: 'BAT-PPG-2609-R4',
      targetQty: 250,
      sprayedQty: 300
    },
    {
      woNo: 'WO-1042',
      jobCardNo: 'JC-1042-BLK',
      customer: 'ROOP POLYMERS LTD',
      partCode: 'RP-8841',
      color: 'Matte Jet Black',
      painterName: 'Kailash Yadav',
      boothNo: 'Booth #1',
      paintBatch: 'BAT-PPG-2609-K1',
      targetQty: 750,
      sprayedQty: 700
    }
  ];

  // Legacy IQC Defect Checklist Form State
  const [iqcForm, setIqcForm] = useState({
    supplierCustomer: 'ROOP POLYMERS LTD',
    partCode: 'RP-8841',
    batchNo: 'B-RP8841-2026',
    totalQty: 1000,
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
    overallFinishing: 'Pass'
  });

  // 1. FPA Golden Gate Form State
  const [fpaForm, setFpaForm] = useState({
    woNo: 'WO-1042',
    jobCardNo: 'JC-1042-RED',
    customer: 'ROOP POLYMERS LTD',
    partCode: 'RP-8841',
    color: 'Monza Red Gloss',
    paintBatch: 'BAT-PPG-2609-R4',
    painter: 'Ramesh Sharma',
    booth: 'Booth #2',
    viscositySec: 15,
    sample1: 'Pass' as const,
    sample2: 'Pass' as const,
    sample3: 'Pass' as const,
    sample4: 'Pass' as const,
    sample5: 'Pass' as const,
    L: 42.10,
    a: 54.20,
    b: 28.15,
    deltaE: 0.38,
    adhesionPercent: 100,
    crossCutTest: 'Pass' as const,
    tapeTest: 'Pass' as const,
    conductivity: 'Pass' as const,
    qcEngineer: currentUser.name,
    managerQAApproval: true,
    remarks: 'Visual and adhesion parameters 100% compliant.'
  });

  // 2. Master IQC Form & Workflow States (Matching PaintKing Excel Sheet & Inward Queue)
  const [selectedInwardForIqc, setSelectedInwardForIqc] = useState<MaterialInwardRecord | null>(null);
  const [selectedIqcReportForView, setSelectedIqcReportForView] = useState<IQCInspectionRecord | null>(null);
  const [showMasterIqcModal, setShowMasterIqcModal] = useState<boolean>(false);
  const [iqcToast, setIqcToast] = useState<string | null>(null);
  const [emailModalPayload, setEmailModalPayload] = useState<EmailDispatchPayload | null>(null);

  // Default 7 Core Aspects matching PaintKing's Excel Inspection Format
  const defaultCoreAspects: IQCAspectItem[] = [
    {
      srNo: 1,
      aspect: 'Packing (Box Condition)',
      methodOfMeasurement: 'Visual (Cartons Should be Proper Condition)',
      impact: 'Major',
      result: 'Pass',
      observation: 'Cartons intact, proper strapping, dry'
    },
    {
      srNo: 2,
      aspect: 'Traceability (Batch No)',
      methodOfMeasurement: 'Visual identification / lot label',
      impact: 'Critical',
      result: 'Pass',
      observation: 'Batch identification sticker legible'
    },
    {
      srNo: 3,
      aspect: 'Quantity',
      methodOfMeasurement: 'Weight / Physical count',
      impact: 'Major',
      result: 'Pass',
      observation: 'Physical count matches invoice/challan'
    },
    {
      srNo: 4,
      aspect: 'Physical Inspection',
      methodOfMeasurement: 'No Damages / Silver Line / Lock Damages / Bend / Flash',
      impact: 'Critical',
      result: 'Pass',
      observation: 'No scratches, flash, or molding defects'
    },
    {
      srNo: 5,
      aspect: 'Conductivity',
      methodOfMeasurement: 'As per Vendor Report / Surface Resistivity',
      impact: 'Major',
      result: 'Pass',
      observation: 'Vendor report / COA verified'
    },
    {
      srNo: 6,
      aspect: 'Adhesion',
      methodOfMeasurement: 'Cross Cut and then Tape test',
      impact: 'Critical',
      result: 'Pass',
      observation: 'Cross-cut & 3M tape test on sample substrate'
    },
    {
      srNo: 7,
      aspect: 'Delta Value (Spectrophotometer)',
      methodOfMeasurement: 'Spectrophotometer CIELAB (Target Delta E <= 1.00 for raw substrate)',
      impact: 'Major',
      result: 'Pass',
      observation: 'Colorimetry within OEM standard tolerance (Delta E <= 1.00)'
    }
  ];

  // Wizard Step for Master IQC Modal (1: Inward & Materials, 2: Quality Aspects, 3: 20% Sampling & CAPA)
  const [iqcModalStep, setIqcModalStep] = useState<1 | 2 | 3>(1);
  const [iqcFormError, setIqcFormError] = useState<string | null>(null);
  const [openImpactDropdown, setOpenImpactDropdown] = useState<number | null>(null);
  const [openDispositionDropdown, setOpenDispositionDropdown] = useState<boolean>(false);

  const [masterIqcForm, setMasterIqcForm] = useState({
    reportNo: 'IQC-NEW',
    inwardSrNo: '',
    vendorCustomer: 'ROOP POLYMERS LTD',
    partComponent: 'RP-8841',
    partDescription: 'ABS Car AC Vent Bezel Substrates',
    invoiceChallanNo: 'CH-DIRECT-01',
    invoiceChallanDate: new Date().toISOString().split('T')[0],
    inspectionDate: new Date().toISOString().split('T')[0],
    batchNo: 'B-NEW-01',
    invQuantity: 1000,
    uom: 'Pcs',
    actualReceived: 1000,
    shortageQty: 0,
    boxCondition: 'Intact & Clean' as 'Intact & Clean' | 'Damaged / Crushed' | 'Wet / Moisture' | 'Repacked',
    hasDiscrepancy: false,
    discrepancyReportedToProductionManager: false,
    productionManagerNote: '',
    deltaEValue: 0.42,
    verifiedItems: [] as IQCVerifiedItem[],
    aspects: defaultCoreAspects,
    sampleSize: 200,
    passQty: 200,
    rejectQty: 0,
    rejectionPercent: 0,
    rejectionDetail: 'Nil - All parts pass visual and physical checks',
    rootCause: 'N/A - Compliant material',
    correctiveAction: 'N/A',
    preventiveAction: 'Standard storage and handling maintained',
    remarks: 'Material meets all quality specs. Approved for production issue.',
    status: 'Accepted' as 'Accepted' | 'Rejected' | 'Hold',
    preparedBy: currentUser.name || 'Manoj Tiwari (IQC Inspector)',
    verifiedBy: 'Sanjay Rawat (Production Manager)',
    generatedAt: '',
    generatedTimestamp: ''
  });

  const openMasterIqcForInward = (inward: MaterialInwardRecord) => {
    setSelectedInwardForIqc(inward);
    setIqcModalStep(1);
    setIqcFormError(null);

    const cleanMaterialName = (name: string) => {
      if (!name) return '';
      return name.replace(/^\[.*?\]\s*/g, '').replace(/\[.*?\]/g, '').replace(/\(\d+\s*[a-zA-Z]*\)/g, '').trim();
    };

    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const randNum = Math.floor(10 + Math.random() * 90);
    const repNo = `IQC-${dateStr}-${randNum}`;
    const invQty = inward.totalQuantity || inward.quantity || 1000;
    // 20% Sampling Rule (e.g. 1000 pcs -> 200 pcs sample size)
    const sample20Percent = Math.max(1, Math.ceil(invQty * 0.20));

    const desc = cleanMaterialName(inward.descriptionOfMaterial || inward.items?.[0]?.materialName || 'Raw Substrates');
    const compName = cleanMaterialName(inward.items?.[0]?.materialName || inward.descriptionOfMaterial || 'SUBSTRATE-01');
    const cleanChallan = inward.challanNo ? inward.challanNo.replace(/[^a-zA-Z0-9]/g, '').slice(-6) : '99824';

    // Populate verified items list directly from Security Inward Line Items with 20% sampling
    const rawItems = (inward.items && inward.items.length > 0)
      ? inward.items
      : [{
          id: '1',
          materialName: cleanMaterialName(inward.descriptionOfMaterial || 'Raw Substrates'),
          quantity: invQty,
          unit: inward.unit || 'Pcs'
        }];

    const initialVerifiedItems: IQCVerifiedItem[] = rawItems.map((item, idx) => {
      const itQty = Number(item.quantity) || 1;
      const itSample = Math.max(1, Math.ceil(itQty * 0.20)); // 20% sample for each item
      return {
        id: item.id || String(idx + 1),
        materialName: cleanMaterialName(item.materialName),
        challanQty: itQty,
        actualQty: itQty,
        unit: item.unit || 'Pcs',
        isReceived: true,
        condition: 'Intact & Clean' as const,
        shortageQty: 0,
        notes: '',
        sampleSize: itSample,
        passQty: itSample,
        rejectQty: 0,
        rejectionPercent: 0,
        defectDetail: 'Nil - All parts pass visual & physical checks'
      };
    });

    const totalInitialSample = initialVerifiedItems.reduce((acc, it) => acc + (it.sampleSize || 0), 0) || sample20Percent;

    setMasterIqcForm({
      reportNo: repNo,
      inwardSrNo: inward.srNo,
      vendorCustomer: inward.partyName || 'Vendor',
      partComponent: compName,
      partDescription: desc,
      invoiceChallanNo: inward.challanNo || 'CH-001',
      invoiceChallanDate: inward.challanDate || inward.date || new Date().toISOString().split('T')[0],
      inspectionDate: new Date().toISOString().split('T')[0],
      batchNo: `B-${cleanChallan}-${dateStr.slice(-4)}`,
      invQuantity: invQty,
      uom: inward.unit || inward.items?.[0]?.unit || 'Pcs',
      actualReceived: invQty,
      shortageQty: 0,
      boxCondition: 'Intact & Clean',
      hasDiscrepancy: false,
      discrepancyReportedToProductionManager: false,
      productionManagerNote: '',
      deltaEValue: 0.42,
      verifiedItems: initialVerifiedItems,
      aspects: defaultCoreAspects.map(a => ({ ...a })),
      sampleSize: totalInitialSample,
      passQty: totalInitialSample,
      rejectQty: 0,
      rejectionPercent: 0,
      rejectionDetail: 'Nil - All parts pass visual and physical checks',
      rootCause: 'N/A - Compliant material',
      correctiveAction: 'N/A',
      preventiveAction: 'Standard storage and handling maintained',
      remarks: 'Material meets all quality specs. Approved for production issue.',
      status: 'Accepted',
      preparedBy: currentUser.name || 'Manoj Tiwari (IQC Inspector)',
      verifiedBy: 'Sanjay Rawat (Production Manager)',
      generatedAt: '',
      generatedTimestamp: ''
    });

    setShowMasterIqcModal(true);
  };

  // Recalculates total actual received, shortage, and discrepancies across all security items
  const recalculateIqcVerification = (items: IQCVerifiedItem[]) => {
    const totalActual = items.reduce((acc, it) => acc + (Number(it.actualQty) || 0), 0);
    const totalShortage = items.reduce((acc, it) => acc + (Number(it.shortageQty) || 0), 0);
    const hasUnreceived = items.some(it => !it.isReceived);
    const hasDiscrepancy = totalShortage > 0 || hasUnreceived;

    // Update aspect 3 (Quantity)
    const updatedAspects = masterIqcForm.aspects.map(asp => {
      if (asp.srNo === 3) {
        return {
          ...asp,
          result: totalShortage > 0 ? `Short (${totalShortage} ${masterIqcForm.uom})` : 'Pass',
          observation: totalShortage > 0 
            ? `Shortage of ${totalShortage} ${masterIqcForm.uom} found upon physical count` 
            : 'Physical count matches invoice/challan'
        };
      }
      return asp;
    });

    setMasterIqcForm(prev => ({
      ...prev,
      verifiedItems: items,
      actualReceived: totalActual,
      shortageQty: totalShortage,
      hasDiscrepancy,
      discrepancyReportedToProductionManager: hasDiscrepancy,
      aspects: updatedAspects
    }));
  };

  // Button 1: Mark as Full Match (Received as per Challan)
  const handleItemMarkFullMatch = (itemId: string) => {
    const updatedItems = masterIqcForm.verifiedItems.map(it => {
      if (it.id === itemId) {
        return {
          ...it,
          isReceived: true,
          actualQty: it.challanQty,
          shortageQty: 0
        };
      }
      return it;
    });
    recalculateIqcVerification(updatedItems);
  };

  // Button 2: Mark as Discrepancy / Shortage (Quantity Me Gadbad Hai)
  const handleItemMarkMismatch = (itemId: string) => {
    const updatedItems = masterIqcForm.verifiedItems.map(it => {
      if (it.id === itemId) {
        const shortage = it.shortageQty > 0 ? it.shortageQty : Math.max(1, Math.round(it.challanQty * 0.05));
        const actual = Math.max(0, it.challanQty - shortage);
        return {
          ...it,
          isReceived: true,
          actualQty: actual,
          shortageQty: shortage
        };
      }
      return it;
    });
    recalculateIqcVerification(updatedItems);
  };

  const handleItemActualQtyChange = (itemId: string, newQty: number) => {
    const actual = isNaN(newQty) ? 0 : Math.max(0, newQty);
    const updatedItems = masterIqcForm.verifiedItems.map(it => {
      if (it.id === itemId) {
        const shortage = Math.max(0, it.challanQty - actual);
        return {
          ...it,
          actualQty: actual,
          shortageQty: shortage,
          isReceived: true
        };
      }
      return it;
    });
    recalculateIqcVerification(updatedItems);
  };

  const handleBoxConditionChange = (cond: 'Intact & Clean' | 'Damaged / Crushed' | 'Wet / Moisture' | 'Repacked') => {
    setMasterIqcForm(prev => ({
      ...prev,
      boxCondition: cond
    }));
  };

  const handleStep1Next = () => {
    const unreceived = masterIqcForm.verifiedItems.filter(it => !it.isReceived);
    if (unreceived.length > 0) {
      setIqcFormError(`Dhyan dein: ${unreceived.length} item(s) receive mark nahi hain. Kripya physical verification confirm karein.`);
      return;
    }
    setIqcFormError(null);
    setIqcModalStep(2);
  };

  const toggleAspectResult = (srNo: number, res: 'Pass' | 'Fail') => {
    setMasterIqcForm(prev => ({
      ...prev,
      aspects: prev.aspects.map(a => a.srNo === srNo ? { ...a, result: res } : a)
    }));
  };

  // Allows adding custom aspects with full editability
  const handleAddCustomAspect = (preset?: { aspect: string; methodOfMeasurement: string; impact: 'Critical' | 'Major' | 'Minor' }) => {
    const nextSrNo = masterIqcForm.aspects.length + 1;
    const name = preset?.aspect || 'Custom Inspection Aspect';
    const method = preset?.methodOfMeasurement || 'Visual / Instrument Gauge Check';
    const impact = preset?.impact || 'Major';

    const newAsp: IQCAspectItem = {
      srNo: nextSrNo,
      aspect: name,
      methodOfMeasurement: method,
      impact: impact,
      result: 'Pass',
      observation: 'Compliant with specified quality tolerances'
    };

    setMasterIqcForm(prev => ({
      ...prev,
      aspects: [...prev.aspects, newAsp]
    }));
  };

  // Allows removing ANY aspect from table (keeps at least 1 aspect)
  const handleRemoveAspect = (srNo: number) => {
    if (masterIqcForm.aspects.length <= 1) return;
    const filtered = masterIqcForm.aspects.filter(a => a.srNo !== srNo);
    const reindexed = filtered.map((a, idx) => ({ ...a, srNo: idx + 1 }));
    setMasterIqcForm(prev => ({
      ...prev,
      aspects: reindexed
    }));
  };

  const handleMarkAllAspectsCompliant = () => {
    setMasterIqcForm(prev => ({
      ...prev,
      aspects: prev.aspects.map(a => ({
        ...a,
        result: 'Pass',
        observation: a.observation || 'Compliant with PaintKing standard'
      }))
    }));
  };

  const handleUpdateAspectName = (srNo: number, name: string) => {
    setMasterIqcForm(prev => ({
      ...prev,
      aspects: prev.aspects.map(a => a.srNo === srNo ? { ...a, aspect: name } : a)
    }));
  };

  const handleUpdateAspectMethod = (srNo: number, method: string) => {
    setMasterIqcForm(prev => ({
      ...prev,
      aspects: prev.aspects.map(a => a.srNo === srNo ? { ...a, methodOfMeasurement: method } : a)
    }));
  };

  const handleUpdateAspectImpact = (srNo: number, impact: 'Critical' | 'Major' | 'Minor') => {
    setMasterIqcForm(prev => ({
      ...prev,
      aspects: prev.aspects.map(a => a.srNo === srNo ? { ...a, impact } : a)
    }));
  };

  const handleUpdateAspectObservation = (srNo: number, obs: string) => {
    setMasterIqcForm(prev => ({
      ...prev,
      aspects: prev.aspects.map(a => a.srNo === srNo ? { ...a, observation: obs } : a)
    }));
  };

  // 20% Sampling Rule & Strict 1% Batch Rejection Threshold Logic
  const handleSamplingChange = (sample: number, reject: number) => {
    const s = Math.max(1, sample);
    const r = Math.max(0, reject);
    const p = Math.max(0, s - r);
    const pct = Number(((r / s) * 100).toFixed(2));
    // If reject count >= 1.0% of sample size, batch is disqualified & marked for Return to Vendor
    const isBatchRejected = (r / s) >= 0.01;

    setMasterIqcForm(prev => ({
      ...prev,
      sampleSize: s,
      passQty: p,
      rejectQty: r,
      rejectionPercent: pct,
      status: isBatchRejected ? 'Rejected' : 'Accepted'
    }));
  };

  const handleItemSamplingChange = (itemId: string, sample: number, reject: number, defectDetail?: string) => {
    setMasterIqcForm(prev => {
      const updatedItems = prev.verifiedItems.map(it => {
        if (it.id === itemId) {
          const s = Math.max(1, sample);
          const r = Math.max(0, Math.min(s, reject));
          const p = Math.max(0, s - r);
          const pct = Number(((r / s) * 100).toFixed(2));
          return {
            ...it,
            sampleSize: s,
            passQty: p,
            rejectQty: r,
            rejectionPercent: pct,
            defectDetail: defectDetail !== undefined ? defectDetail : (it.defectDetail || 'Nil - All parts pass visual & physical checks')
          };
        }
        return it;
      });

      const totalSample = updatedItems.reduce((acc, it) => acc + (it.sampleSize || 0), 0);
      const totalReject = updatedItems.reduce((acc, it) => acc + (it.rejectQty || 0), 0);
      const totalPass = Math.max(0, totalSample - totalReject);
      const overallRate = totalSample > 0 ? Number(((totalReject / totalSample) * 100).toFixed(2)) : 0;
      // Strict 1% Batch Rejection Threshold Check
      const isBatchRejected = totalSample > 0 && (totalReject / totalSample) >= 0.01;
      const defectSummary = updatedItems
        .filter(it => (it.rejectQty || 0) > 0)
        .map(it => `${it.materialName}: ${it.defectDetail || `${it.rejectQty} rejects`}`)
        .join('; ') || 'Nil - All parts pass visual and physical checks';

      return {
        ...prev,
        verifiedItems: updatedItems,
        sampleSize: totalSample,
        passQty: totalPass,
        rejectQty: totalReject,
        rejectionPercent: overallRate,
        rejectionDetail: defectSummary,
        status: isBatchRejected ? 'Rejected' : 'Accepted'
      };
    });
  };

  const handleMasterIqcSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const now = new Date();
    const generatedDate = now.toISOString().split('T')[0];
    const generatedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const generatedTimestamp = `${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${generatedTime}`;

    const recordToSave: IQCInspectionRecord = {
      reportNo: masterIqcForm.reportNo,
      inwardSrNo: masterIqcForm.inwardSrNo,
      date: masterIqcForm.invoiceChallanDate,
      inspectionDate: generatedDate,
      inspectionTime: generatedTime,
      generatedAt: now.toISOString(),
      generatedTimestamp: generatedTimestamp,
      plant: activePlant,
      vendorCustomer: masterIqcForm.vendorCustomer,
      supplierCustomer: masterIqcForm.vendorCustomer,
      partComponent: masterIqcForm.partComponent,
      partCode: masterIqcForm.partComponent,
      partDescription: masterIqcForm.partDescription,
      invoiceChallanNo: masterIqcForm.invoiceChallanNo,
      invoiceChallanDate: masterIqcForm.invoiceChallanDate,
      batchNo: masterIqcForm.batchNo,
      invQuantity: masterIqcForm.invQuantity,
      totalQty: masterIqcForm.invQuantity,
      uom: masterIqcForm.uom,
      unit: masterIqcForm.uom,
      actualReceived: masterIqcForm.actualReceived,
      shortageQty: masterIqcForm.shortageQty,
      boxCondition: masterIqcForm.boxCondition,
      hasDiscrepancy: masterIqcForm.hasDiscrepancy,
      discrepancyReportedToProductionManager: masterIqcForm.discrepancyReportedToProductionManager,
      productionManagerNote: masterIqcForm.productionManagerNote,
      items: masterIqcForm.verifiedItems,
      aspects: masterIqcForm.aspects,
      sampleSize: masterIqcForm.sampleSize,
      sampledQty: masterIqcForm.sampleSize,
      passQty: masterIqcForm.passQty,
      rejectQty: masterIqcForm.rejectQty,
      rejectionPercent: masterIqcForm.rejectionPercent,
      rejectionDetail: masterIqcForm.rejectionDetail,
      rootCause: masterIqcForm.rootCause,
      correctiveAction: masterIqcForm.correctiveAction,
      preventiveAction: masterIqcForm.preventiveAction,
      remarks: masterIqcForm.remarks,
      status: masterIqcForm.status,
      preparedBy: masterIqcForm.preparedBy,
      verifiedBy: masterIqcForm.verifiedBy,
      damage: masterIqcForm.aspects.find(a => a.srNo === 1)?.result === 'Pass' ? 'Pass' : 'Fail',
      scratch: masterIqcForm.aspects.find(a => a.srNo === 4)?.result === 'Pass' ? 'Pass' : 'Fail',
      sinkMark: 'Pass',
      shortFill: 'Pass',
      bubble: 'Pass',
      pinMark: 'Pass',
      dustSpot: 'Pass',
      overPaint: 'Pass',
      paintMissing: 'Pass',
      colour: 'Pass',
      overallFinishing: 'Pass',
      inspector: masterIqcForm.preparedBy
    };

    submitMasterIQCReport(recordToSave);
    setShowMasterIqcModal(false);
    setIqcToast(`Master IQC Inspection Report ${recordToSave.reportNo} (${generatedTimestamp}) safalta se generate ho gaya!`);
  };

  // 3. IPQC 3-Hourly Form State (Image 1: In-Process Inspection)
  const [ipqcForm, setIpqcForm] = useState({
    woNo: 'WO-1042',
    partCode: 'RP-8841',
    color: 'Monza Red Gloss',
    painter: 'Ramesh Sharma',
    booth: 'Booth #2',
    shift: 'Day 12H' as const,
    checkTime: '03:00 PM',
    bubble: 'Pass' as 'Pass' | 'Fail',
    dustSpot: 'Pass' as 'Pass' | 'Fail',
    overPaint: 'Pass' as 'Pass' | 'Fail',
    paintMissing: 'Pass' as 'Pass' | 'Fail',
    L: 42.10,
    a: 54.20,
    b: 28.15,
    deltaE: 0.42,
    overallFinishing: 'Pass' as 'Pass' | 'Fail',
    adhesionTest: 'Pass' as 'Pass' | 'Fail'
  });

  // 4. OQC / PDI Form State (Image 2: Outgoing Quality Clearance)
  const [oqcForm, setOqcForm] = useState({
    woNo: 'WO-1042',
    customer: 'ROOP POLYMERS LTD',
    partCode: 'RP-8841',
    color: 'Monza Red Gloss',
    offeredQty: 300,
    sampledQty: 32,
    passedQty: 300,
    rejectedQty: 0,
    packingBoxCondition: 'Pass' as 'Pass' | 'Fail',
    traceabilityBatchNo: 'Pass' as 'Pass' | 'Fail',
    quantityMatch: 'Pass' as 'Pass' | 'Fail',
    physicalInspection: 'Pass' as 'Pass' | 'Fail',
    conductivity: 'Pass' as 'Pass' | 'Fail' | 'N/A',
    adhesion: 'Pass' as 'Pass' | 'Fail',
    deltaE: 0.45,
    plantHeadSign: 'Satish Sharma'
  });

  // Auto-Fill Selectors
  const selectOrderForIqc = (jcNo: string) => {
    const found = availableOrders.find(o => o.jobCardNo === jcNo || o.woNo === jcNo);
    if (found) {
      setIqcForm(prev => ({
        ...prev,
        supplierCustomer: found.customer,
        partCode: found.partCode,
        batchNo: `B-${found.partCode}-2026`,
        totalQty: found.targetQty || 1000
      }));
    }
  };

  const selectOrderForIpqc = (jcNo: string) => {
    const found = availableOrders.find(o => o.jobCardNo === jcNo || o.woNo === jcNo);
    if (found) {
      setIpqcForm(prev => ({
        ...prev,
        woNo: found.woNo,
        partCode: found.partCode,
        color: found.color,
        painter: found.painterName || 'Ramesh Sharma',
        booth: found.boothNo || 'Booth #2'
      }));
    }
  };

  const selectOrderForOqc = (jcNo: string) => {
    const found = availableOrders.find(o => o.jobCardNo === jcNo || o.woNo === jcNo);
    if (found) {
      setOqcForm(prev => ({
        ...prev,
        woNo: found.woNo,
        customer: found.customer,
        partCode: found.partCode,
        color: found.color,
        offeredQty: found.sprayedQty || found.targetQty || 300,
        passedQty: found.sprayedQty || found.targetQty || 300
      }));
    }
  };

  const selectOrderForFpa = (jcNo: string) => {
    const found = availableOrders.find(o => o.jobCardNo === jcNo || o.woNo === jcNo);
    if (found) {
      setFpaForm(prev => ({
        ...prev,
        woNo: found.woNo,
        jobCardNo: found.jobCardNo,
        customer: found.customer,
        partCode: found.partCode,
        color: found.color,
        painter: found.painterName || 'Ramesh Sharma',
        booth: found.boothNo || 'Booth #2',
        paintBatch: found.paintBatch || 'BAT-PPG-2609-R4'
      }));
    }
  };

  // 1-Tap "Set All Pass" Presets
  const setAllIqcPass = () => {
    setIqcForm(prev => ({
      ...prev,
      damage: 'Pass', scratch: 'Pass', sinkMark: 'Pass', shortFill: 'Pass',
      bubble: 'Pass', pinMark: 'Pass', dustSpot: 'Pass', overPaint: 'Pass',
      paintMissing: 'Pass', colour: 'Pass', overallFinishing: 'Pass'
    }));
  };

  const setAllIpqcPass = () => {
    setIpqcForm(prev => ({
      ...prev,
      bubble: 'Pass', dustSpot: 'Pass', overPaint: 'Pass',
      paintMissing: 'Pass', overallFinishing: 'Pass', adhesionTest: 'Pass', deltaE: 0.40
    }));
  };

  const setAllOqcPass = () => {
    setOqcForm(prev => ({
      ...prev,
      packingBoxCondition: 'Pass', traceabilityBatchNo: 'Pass',
      quantityMatch: 'Pass', physicalInspection: 'Pass',
      conductivity: 'Pass', adhesion: 'Pass', deltaE: 0.42
    }));
  };

  // Handlers
  const handleFpaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createFPARecord({
      ...fpaForm,
      plant: activePlant,
      date: new Date().toISOString().split('T')[0]
    });
    setShowFpaModal(false);
  };

  const handleIqcSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasFailures = [
      iqcForm.damage, iqcForm.scratch, iqcForm.sinkMark, iqcForm.shortFill,
      iqcForm.bubble, iqcForm.pinMark, iqcForm.dustSpot, iqcForm.overPaint,
      iqcForm.paintMissing, iqcForm.colour, iqcForm.overallFinishing
    ].some(val => val === 'Fail');

    const newRecord: IQCInspectionRecord = {
      ...iqcForm,
      reportNo: `IQC-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      plant: activePlant,
      status: hasFailures ? 'Hold' : 'Accepted',
      inspector: currentUser.name
    };
    addIQCRecord(newRecord);
    setShowIqcModal(false);
  };

  const handleIpqcSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasFailures = [
      ipqcForm.bubble, ipqcForm.dustSpot, ipqcForm.overPaint,
      ipqcForm.paintMissing, ipqcForm.overallFinishing, ipqcForm.adhesionTest
    ].some(v => v === 'Fail') || ipqcForm.deltaE > 0.70;

    const newRecord: IPQCRecord = {
      ...ipqcForm,
      reportNo: `IPQ-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      plant: activePlant,
      result: hasFailures ? 'Hold' : 'Pass',
      inspector: currentUser.name
    };
    addIPQCRecord(newRecord);
    setShowIpqcModal(false);
  };

  const handleOqcSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasFailures = [
      oqcForm.packingBoxCondition, oqcForm.traceabilityBatchNo,
      oqcForm.quantityMatch, oqcForm.physicalInspection,
      oqcForm.adhesion
    ].some(v => v === 'Fail') || oqcForm.deltaE > 0.70;

    const newRecord: FinalQualityRelease = {
      ...oqcForm,
      releaseId: `REL-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      plant: activePlant,
      oqcStatus: hasFailures ? 'Hold' : 'Accepted',
      pdiStatus: hasFailures ? 'Hold' : 'Cleared for Invoicing',
      inspector: currentUser.name
    };
    addOQCRelease(newRecord);
    setShowOqcModal(false);
  };

  const handleUniIqcSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uniIqcForm.jobId) return;
    submitPreSprayIQC(uniIqcForm.jobId, uniIqcForm.approvedPcs, uniIqcForm.rejectedPcs, uniIqcForm.notes);
    setShowUniversalIqcModal(false);
  };

  const handleUniQaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uniQaForm.jobId) return;
    submitFinalQA(uniQaForm.jobId, uniQaForm.deltaE, uniQaForm.adhesionPass, uniQaForm.finalPassedQty, uniQaForm.notes);
    setShowUniversalQaModal(false);
  };

  const isDeltaEPass = fpaForm.deltaE <= 0.70;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Banner - Dedicated IQC Persona Layout */}
      <div className="bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 border border-[#ececec] shadow-xs sm:shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[9px] sm:text-[10px] font-mono uppercase tracking-widest font-bold">
              PK-QA-IQC-001 • INCOMING QUALITY CONTROL (IQC)
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#17191c] text-[10px] font-semibold">
              👤 {currentUser.name} ({currentUser.roleTitle || 'IQC Inspector'})
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-bold">
              📍 {activePlant}
            </span>
          </div>
          <h1 className="text-xl sm:text-3xl font-serif font-normal text-[#17191c] tracking-tight">
            Incoming Quality Control (IQC) Hub
          </h1>
          <p className="text-[11px] sm:text-xs text-[#777b86] mt-1">
            Real-Time Gate Inward Physical Verification, Shortage Detection, 7 Core Aspects Inspection & Master Reports
          </p>
        </div>
      </div>

      {/* 3 Dedicated IQC Standard Specification Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div 
          onClick={() => { setIqcViewTab('PENDING'); setGlobalSubTab('PENDING'); setActiveSubTab('IQC'); }}
          className="p-4 sm:p-5 rounded-[16px] sm:rounded-[20px] bg-white border border-[#ececec] hover:border-[#c09748] shadow-xs flex items-center justify-between gap-3.5 cursor-pointer transition active:scale-[0.98]"
          title="Click to view pending Gate Inward Ingest queue"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 sm:p-3 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] shrink-0">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-[#c09748]" />
            </div>
            <div>
              <div className="text-[10px] sm:text-[11px] font-bold text-[#777b86] uppercase tracking-[0.14em]">Gate Inward Ingest</div>
              <div className="text-base sm:text-lg font-serif font-normal text-[#17191c]">
                {pendingInwards.length} Pending / {materialInwardLogs.length} Total
              </div>
              <div className="text-[10px] text-[#777b86]">Real-time Security Inward Sync</div>
            </div>
          </div>
          <span className="text-[9px] underline font-sans text-[#8a6521] shrink-0">Inspect &rarr;</span>
        </div>

        <div 
          onClick={() => { setIqcViewTab('COMPLETED'); setGlobalSubTab('COMPLETED'); setActiveSubTab('IQC'); }}
          className="p-4 sm:p-5 rounded-[16px] sm:rounded-[20px] bg-white border border-[#ececec] hover:border-[#c09748] shadow-xs flex items-center justify-between gap-3.5 cursor-pointer transition active:scale-[0.98]"
          title="Click to view completed IQC Master Reports"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 sm:p-3 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#c09748]" />
            </div>
            <div>
              <div className="text-[10px] sm:text-[11px] font-bold text-[#777b86] uppercase tracking-[0.14em]">IQC Inspection Standard</div>
              <div className="text-base sm:text-lg font-serif font-normal text-[#17191c]">PK-QA-IQC-001</div>
              <div className="text-[10px] text-[#777b86]">{iqcRecords.length} Verified Reports</div>
            </div>
          </div>
          <span className="text-[9px] underline font-sans text-[#8a6521] shrink-0">Reports &rarr;</span>
        </div>

        <div 
          className="p-4 sm:p-5 rounded-[16px] sm:rounded-[20px] bg-white border border-[#ececec] shadow-xs flex items-center justify-between gap-3.5"
          title="20% Substrate Sampling & 1% Lot Rejection Rule"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 sm:p-3 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#c09748]" />
            </div>
            <div>
              <div className="text-[10px] sm:text-[11px] font-bold text-[#777b86] uppercase tracking-[0.14em]">20% Sampling Rule</div>
              <div className="text-base sm:text-lg font-serif font-normal text-[#17191c]">20% Sample • &lt;1% Defect Limit</div>
              <div className="text-[10px] text-[#777b86]">7 Core Aspects Inspection</div>
            </div>
          </div>
          <span className="text-[9px] font-mono text-[#8a6521] font-bold shrink-0">IATF SOP</span>
        </div>
      </div>

      {/* Dedicated IQC Tab Switcher & Inline Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white p-2 sm:p-2.5 rounded-[16px] border border-[#ececec]">
        {/* IQC SubTab Switcher Buttons (Champagne Gold, No Black Background!) */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => { setIqcViewTab('PENDING'); setGlobalSubTab('PENDING'); }}
            className={`px-3.5 sm:px-4 py-2 sm:py-2 rounded-full text-[11px] sm:text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-1.5 shrink-0 active:scale-95 ${
              iqcViewTab === 'PENDING'
                ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] font-bold shadow-2xs'
                : 'bg-[#fafafb] text-[#777b86] hover:text-[#17191c] border border-[#ececec]'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${iqcViewTab === 'PENDING' ? 'text-[#8a6521]' : 'text-[#777b86]'}`} />
            <span>1. Pending Jobs (Awaiting IQC)</span>
            <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
              pendingInwards.length > 0 
                ? (iqcViewTab === 'PENDING' ? 'bg-[#f4e5be] text-[#8a6521]' : 'bg-amber-100 text-amber-900 border border-amber-300')
                : 'bg-[#f2f2f3] text-[#777b86]'
            }`}>
              {pendingInwards.length}
            </span>
          </button>

          <button
            onClick={() => { setIqcViewTab('COMPLETED'); setGlobalSubTab('COMPLETED'); }}
            className={`px-3.5 sm:px-4 py-2 sm:py-2 rounded-full text-[11px] sm:text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-1.5 shrink-0 active:scale-95 ${
              iqcViewTab === 'COMPLETED'
                ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] font-bold shadow-2xs'
                : 'bg-[#fafafb] text-[#777b86] hover:text-[#17191c] border border-[#ececec]'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${iqcViewTab === 'COMPLETED' ? 'text-[#8a6521]' : 'text-[#777b86]'}`} />
            <span>2. Completed Jobs (IQC Reports & PDF)</span>
            <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
              iqcViewTab === 'COMPLETED'
                ? 'bg-[#f4e5be] text-[#8a6521]'
                : 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]'
            }`}>
              {iqcRecords.length}
            </span>
          </button>
        </div>

        {/* Inline Compact Search Bar (Right Aligned) */}
        <div className="relative flex-1 sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-3.5 h-3.5 text-[#777b86]" />
          </div>
          <input
            type="text"
            value={iqcSearchQuery}
            onChange={e => setIqcSearchQuery(e.target.value)}
            placeholder={
              iqcViewTab === 'PENDING'
                ? 'Search Pending Challan, Party, Material...'
                : 'Search IQC Report No, Vendor, Part Code...'
            }
            style={{ paddingLeft: '32px' }}
            className="w-full h-8.5 pr-8 rounded-full bg-[#fafafb] border border-[#dcdfe4] text-xs text-[#17191c] placeholder:text-[#a3a6af] focus:outline-none focus:border-[#17191c] focus:bg-white transition"
          />
          {iqcSearchQuery && (
            <button
              type="button"
              onClick={() => setIqcSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#777b86] hover:text-[#17191c] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* TAB 0A: PRE-SPRAY SUBSTRATE IQC (UNIVERSAL JOB ID) */}
      {activeSubTab === 'UNIVERSAL_IQC' && (
        <div className="bg-white rounded-[20px] sm:rounded-[24px] border border-[#ececec] p-4 sm:p-6 shadow-xs sm:shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ececec]">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10px] font-mono font-bold">
                  PRE-SPRAY SUBSTRATE GATE
                </span>
                <h3 className="text-sm sm:text-base font-serif font-normal text-[#17191c]">
                  Pre-Spray IQC Inspection Desk (Raw Substrate Checks)
                </h3>
              </div>
              <p className="text-xs text-[#777b86] mt-1">
                Substrate is inspected BEFORE entering the spray booth. Approved Pcs advance to Spray Booth. Rejected Raw Pcs are isolated.
              </p>
            </div>

            <button
              onClick={() => {
                if (universalJobs.length > 0) {
                  const job = universalJobs[0];
                  setUniIqcForm({
                    jobId: job.jobId,
                    approvedPcs: job.totalQuantity,
                    rejectedPcs: 0,
                    notes: 'Pre-spray substrate inspected. Zero cracks, sink marks, or oil contaminants.'
                  });
                  setShowUniversalIqcModal(true);
                }
              }}
              className="px-4 py-2 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 text-[#17191c]" />
              <span>+ Record Pre-Spray IQC Inspection</span>
            </button>
          </div>

          {/* List of Universal Jobs with Pre-Spray IQC Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {universalJobs.map(job => {
              const isIqcDone = !!job.preSprayIQC;
              const isIqcPass = job.preSprayIQC?.status === 'Pass';

              return (
                <div 
                  key={job.jobId}
                  className={`p-5 rounded-[20px] border transition space-y-3.5 ${
                    isIqcDone && isIqcPass 
                      ? 'bg-emerald-50/30 border-emerald-200' 
                      : isIqcDone && !isIqcPass 
                      ? 'bg-red-50/30 border-red-200' 
                      : 'bg-white border-[#ececec] hover:border-[#c09748]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#ececec]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#c09748] px-2.5 py-0.5 rounded-full bg-[#faf7ed] border border-[#f4e5be]">
                          {job.jobId}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          job.materialCategory === 'Party Material' ? 'bg-[#faf3e0] text-[#8a6521]' : 'bg-blue-50 text-blue-800'
                        }`}>
                          {job.materialCategory}
                        </span>
                      </div>
                      <h4 className="font-serif font-normal text-base text-[#17191c] mt-1">{job.partyName}</h4>
                      <p className="text-xs text-[#777b86]">{job.materialDescription}</p>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                      isIqcDone && isIqcPass
                        ? 'bg-emerald-100 text-emerald-800'
                        : isIqcDone && !isIqcPass
                        ? 'bg-red-100 text-red-800'
                        : 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]'
                    }`}>
                      {isIqcDone ? `IQC ${job.preSprayIQC?.status}` : 'Pending Pre-Spray IQC'}
                    </span>
                  </div>

                  {/* Quantity & Stage Details */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-[14px] bg-[#fafafb] border border-[#ececec] text-xs">
                    <div>
                      <span className="text-[#777b86] text-[10px] font-bold uppercase block">Total Inward Qty</span>
                      <strong className="text-[#17191c] font-mono">{job.totalQuantity} {job.unit}</strong>
                    </div>
                    <div>
                      <span className="text-[#777b86] text-[10px] font-bold uppercase block">IQC Approved Pcs</span>
                      <strong className="text-emerald-800 font-mono">
                        {job.preSprayIQC ? `${job.preSprayIQC.approvedPcs} ${job.unit}` : 'Pending'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#777b86] text-[10px] font-bold uppercase block">Current Stage</span>
                      <strong className="text-[#c09748] font-semibold text-[11px] truncate block">{job.stage}</strong>
                    </div>
                  </div>

                  {job.preSprayIQC && (
                    <div className="text-[11px] text-[#777b86] bg-white p-2.5 rounded-[12px] border border-[#ececec]">
                      <span className="font-semibold text-[#17191c]">Inspector: </span>{job.preSprayIQC.inspectedBy} on {job.preSprayIQC.inspectionDate}
                      <p className="mt-0.5 italic">"{job.preSprayIQC.notes}"</p>
                    </div>
                  )}

                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={() => {
                        setUniIqcForm({
                          jobId: job.jobId,
                          approvedPcs: job.preSprayIQC?.approvedPcs || job.totalQuantity,
                          rejectedPcs: job.preSprayIQC?.rejectedPcs || 0,
                          notes: job.preSprayIQC?.notes || 'Pre-spray substrate inspected. Surface clean, zero cracks or sink marks.'
                        });
                        setShowUniversalIqcModal(true);
                      }}
                      className="px-4 py-2 rounded-full bg-[#17191c] text-[#c09748] text-xs font-bold hover:bg-black transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#c09748]" />
                      <span>{isIqcDone ? 'Re-Inspect Pre-Spray IQC' : 'Perform Pre-Spray IQC Inspection'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 0B: STRICT FINAL QA GATEKEEPER (UNIVERSAL JOB ID) */}
      {activeSubTab === 'UNIVERSAL_QA' && (
        <div className="bg-white rounded-[20px] sm:rounded-[24px] border border-[#ececec] p-4 sm:p-6 shadow-xs sm:shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ececec]">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-bold">
                  STRICT FINAL QA GATE
                </span>
                <h3 className="text-sm sm:text-base font-serif font-normal text-[#17191c]">
                  Final QA Gatekeeper & Invoicing Release Desk
                </h3>
              </div>
              <p className="text-xs text-[#777b86] mt-1">
                Mandatory Stage Gate: Spectrophotometer ΔE ≤ 0.70 & ASTM 5B Adhesion 100%. Unapproved jobs stay locked!
              </p>
            </div>

            <button
              onClick={() => {
                if (universalJobs.length > 0) {
                  const job = universalJobs[0];
                  setUniQaForm({
                    jobId: job.jobId,
                    deltaE: 0.38,
                    adhesionPass: true,
                    finalPassedQty: job.preSprayIQC?.approvedPcs || job.totalQuantity,
                    notes: 'Spectrophotometer ΔE ≤ 0.70 and ASTM 5B Cross-Cut Adhesion 100% compliant. Cleared for billing.'
                  });
                  setShowUniversalQaModal(true);
                }
              }}
              className="px-4 py-2 rounded-full bg-[#17191c] text-[#c09748] text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Gauge className="w-4 h-4 text-[#c09748]" />
              <span>+ Record Final QA Gatekeeper Sign-Off</span>
            </button>
          </div>

          {/* List of Universal Jobs with Final QA Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {universalJobs.map(job => {
              const isQaDone = !!job.finalQA;
              const isQaApproved = job.finalQA?.overallStatus === 'Approved';

              return (
                <div 
                  key={job.jobId}
                  className={`p-5 rounded-[20px] border transition space-y-3.5 ${
                    isQaDone && isQaApproved 
                      ? 'bg-emerald-50/40 border-emerald-300' 
                      : isQaDone && !isQaApproved 
                      ? 'bg-red-50/40 border-red-300' 
                      : 'bg-white border-[#ececec] hover:border-[#c09748]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#ececec]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#c09748] px-2.5 py-0.5 rounded-full bg-[#faf7ed] border border-[#f4e5be]">
                          {job.jobId}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] text-[10px] font-mono font-bold">
                          Stage: {job.stage}
                        </span>
                      </div>
                      <h4 className="font-serif font-normal text-base text-[#17191c] mt-1">{job.partyName}</h4>
                      <p className="text-xs text-[#777b86]">{job.materialDescription}</p>
                    </div>

                    <span className={`px-3.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                      isQaDone && isQaApproved
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : isQaDone && !isQaApproved
                        ? 'bg-red-100 text-red-800 border border-red-300'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {isQaDone ? `QA Gate: ${job.finalQA?.overallStatus}` : '🔒 QA Locked'}
                    </span>
                  </div>

                  {/* Spectrophotometer & Adhesion metrics */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-[14px] bg-[#fafafb] border border-[#ececec] text-xs">
                    <div>
                      <span className="text-[#777b86] text-[10px] font-bold uppercase block">Spectrophoto ΔE</span>
                      <strong className={`font-mono ${job.finalQA && job.finalQA.deltaE <= 0.70 ? 'text-emerald-800' : 'text-[#17191c]'}`}>
                        {job.finalQA ? `${job.finalQA.deltaE} (≤0.70 Pass)` : 'Not Tested'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#777b86] text-[10px] font-bold uppercase block">Adhesion Grid</span>
                      <strong className={`font-semibold ${job.finalQA?.adhesionTest === 'Pass' ? 'text-emerald-800' : 'text-[#17191c]'}`}>
                        {job.finalQA ? `${job.finalQA.adhesionTest} (100%)` : 'Not Tested'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#777b86] text-[10px] font-bold uppercase block">Final Passed Qty</span>
                      <strong className="text-emerald-800 font-mono">
                        {job.finalQA ? `${job.finalQA.passedQty} ${job.unit}` : 'Pending'}
                      </strong>
                    </div>
                  </div>

                  {job.finalQA && (
                    <div className="text-[11px] text-[#777b86] bg-white p-2.5 rounded-[12px] border border-[#ececec]">
                      <span className="font-semibold text-[#17191c]">QA Sign-Off By: </span>{job.finalQA.inspectedBy} on {job.finalQA.inspectionDate}
                      <p className="mt-0.5 italic">"{job.finalQA.notes}"</p>
                    </div>
                  )}

                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={() => {
                        setUniQaForm({
                          jobId: job.jobId,
                          deltaE: job.finalQA?.deltaE || 0.38,
                          adhesionPass: job.finalQA?.adhesionTest === 'Pass',
                          finalPassedQty: job.finalQA?.passedQty || job.preSprayIQC?.approvedPcs || job.totalQuantity,
                          notes: job.finalQA?.notes || 'Spectrophotometer ΔE ≤ 0.70 and ASTM 5B Cross-Cut Adhesion 100% compliant. Cleared for billing.'
                        });
                        setShowUniversalQaModal(true);
                      }}
                      className="px-4 py-2 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] text-xs font-bold transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      <Gauge className="w-3.5 h-3.5 text-[#17191c]" />
                      <span>{isQaDone ? 'Update QA Gate Sign-Off' : 'Perform Final QA Gatekeeper Sign-Off'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 1: IPQC & FPA VIEW */}
      {activeSubTab === 'IPQC' && (
        <div className="space-y-4 sm:space-y-6">
          {/* FPA Section */}
          <div className="bg-white rounded-[20px] sm:rounded-[24px] border border-[#ececec] p-4 sm:p-6 shadow-xs sm:shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f3]">
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#777b86]">
                First Part Approval (FPA) Golden Gate Releases
              </h3>
              <span className="text-[11px] sm:text-xs font-mono text-[#c09748] font-bold">PK-QA-FPA-001</span>
            </div>

            <div className="space-y-3">
              {fpaRecords.map(fpa => (
                <div
                  key={fpa.reportNo}
                  className="p-4 sm:p-5 rounded-[18px] sm:rounded-[20px] border border-[#ececec] hover:border-[#c09748] transition bg-[#fafafb] space-y-3 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#ececec]">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-mono font-bold text-[#c09748] px-2.5 py-0.5 rounded-full bg-white border border-[#f4e5be] whitespace-nowrap text-[11px]">
                        {fpa.reportNo}
                      </span>
                      <span className="font-serif font-normal text-sm sm:text-base text-[#17191c]">{fpa.customer}</span>
                      <span className="text-[#777b86] font-mono text-[11px] whitespace-nowrap">({fpa.partCode} • {fpa.color})</span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold whitespace-nowrap ${
                        fpa.overallResult === 'Approved' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'
                      }`}>
                        Result: {fpa.overallResult}
                      </span>
                      <span className="text-[#777b86] font-mono text-[11px] whitespace-nowrap">{fpa.date}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 p-3 sm:p-4 bg-white rounded-[14px] sm:rounded-[16px] border border-[#ececec]">
                    <div>
                      <span className="text-[#777b86] text-[11px]">Colorimetry ΔE:</span>
                      <div className="font-serif font-normal text-sm sm:text-base text-[#17191c] mt-0.5">
                        {fpa.deltaE} <span className="text-[9px] sm:text-[10px] text-emerald-700 font-sans font-medium">(≤ 0.70)</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[#777b86] text-[11px]">Cross-Cut Adhesion:</span>
                      <div className="font-semibold text-xs sm:text-sm text-emerald-800 mt-0.5">
                        {fpa.adhesionPercent}% ({fpa.crossCutTest})
                      </div>
                    </div>
                    <div>
                      <span className="text-[#777b86] text-[11px]">Viscosity (Ford 4):</span>
                      <div className="font-mono font-semibold text-xs sm:text-sm text-[#17191c] mt-0.5">{fpa.viscositySec}s</div>
                    </div>
                    <div>
                      <span className="text-[#777b86] text-[11px]">Assigned Painter:</span>
                      <div className="font-medium text-[#17191c] mt-0.5 text-xs">{fpa.painter}</div>
                      <div className="text-[10px] text-[#777b86]">{fpa.booth}</div>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-[#777b86] text-[11px]">QC Engineer:</span>
                      <div className="font-medium text-[#17191c] mt-0.5 text-xs">{fpa.qcEngineer}</div>
                      <div className="text-[10px] text-emerald-700 font-medium">✓ Manager QA Signed</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3-Hourly IPQC Inspection */}
          <div className="bg-white rounded-[20px] sm:rounded-[24px] border border-[#ececec] p-4 sm:p-6 shadow-xs sm:shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f3]">
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#777b86]">
                3-Hourly In-Process Quality Control (IPQC) Logs
              </h3>
              <span className="text-[11px] sm:text-xs font-mono text-[#c09748] font-bold">PK-QA-IPQ-001</span>
            </div>

            {/* Mobile Touch Card List View (< 640px) */}
            <div className="block sm:hidden space-y-3">
              {ipqcRecords.map(rec => (
                <div key={rec.reportNo} className="p-3.5 bg-[#fafafb] border border-[#ececec] rounded-[16px] space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[#ececec]">
                    <div>
                      <span className="font-mono font-bold text-[#c09748] text-xs">{rec.reportNo}</span>
                      <div className="text-[11px] text-[#777b86]">{rec.checkTime} ({rec.shift})</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${rec.result === 'Pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {rec.result}
                    </span>
                  </div>

                  <div className="text-[#17191c] font-medium">{rec.partCode} • {rec.color}</div>
                  <div className="text-[11px] text-[#777b86]">{rec.booth} ({rec.painter})</div>

                  <div className="grid grid-cols-3 gap-1.5 pt-1.5 text-center text-[10px]">
                    <div className="bg-white p-1.5 rounded-[8px] border border-[#ececec]">
                      <span className="text-[#777b86] block">Bubble</span>
                      <span className={`font-bold ${rec.bubble === 'Pass' ? 'text-emerald-700' : 'text-red-700'}`}>{rec.bubble}</span>
                    </div>
                    <div className="bg-white p-1.5 rounded-[8px] border border-[#ececec]">
                      <span className="text-[#777b86] block">Dust Spot</span>
                      <span className={`font-bold ${rec.dustSpot === 'Pass' ? 'text-emerald-700' : 'text-red-700'}`}>{rec.dustSpot}</span>
                    </div>
                    <div className="bg-white p-1.5 rounded-[8px] border border-[#ececec]">
                      <span className="text-[#777b86] block">Over Paint</span>
                      <span className={`font-bold ${rec.overPaint === 'Pass' ? 'text-emerald-700' : 'text-red-700'}`}>{rec.overPaint}</span>
                    </div>
                    <div className="bg-white p-1.5 rounded-[8px] border border-[#ececec]">
                      <span className="text-[#777b86] block">Missing Paint</span>
                      <span className={`font-bold ${rec.paintMissing === 'Pass' ? 'text-emerald-700' : 'text-red-700'}`}>{rec.paintMissing}</span>
                    </div>
                    <div className="bg-white p-1.5 rounded-[8px] border border-[#ececec]">
                      <span className="text-[#777b86] block">ΔE (Delta)</span>
                      <span className="font-mono font-bold text-[#17191c]">{rec.deltaE}</span>
                    </div>
                    <div className="bg-white p-1.5 rounded-[8px] border border-[#ececec]">
                      <span className="text-[#777b86] block">Adhesion</span>
                      <span className={`font-bold ${rec.adhesionTest === 'Pass' ? 'text-emerald-700' : 'text-red-700'}`}>{rec.adhesionTest}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= 640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#ececec] text-[#777b86] bg-[#fafafb]">
                    <th className="p-3 font-semibold">Report No</th>
                    <th className="p-3 font-semibold">Time / Shift</th>
                    <th className="p-3 font-semibold">Part Code & Finish</th>
                    <th className="p-3 font-semibold">Booth & Painter</th>
                    <th className="p-3 font-semibold text-center">Bubble</th>
                    <th className="p-3 font-semibold text-center">Dust Spot</th>
                    <th className="p-3 font-semibold text-center">Over Paint</th>
                    <th className="p-3 font-semibold text-center">Missing Paint</th>
                    <th className="p-3 font-semibold text-center">ΔE (Delta)</th>
                    <th className="p-3 font-semibold text-center">Adhesion</th>
                    <th className="p-3 font-semibold text-center">Overall Finishing</th>
                    <th className="p-3 font-semibold text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ececec]">
                  {ipqcRecords.map(rec => (
                    <tr key={rec.reportNo} className="hover:bg-[#fafafb] transition">
                      <td className="p-3 font-mono font-bold text-[#c09748]">{rec.reportNo}</td>
                      <td className="p-3 text-[#17191c] font-medium">{rec.checkTime} <span className="text-[10px] text-[#777b86]">({rec.shift})</span></td>
                      <td className="p-3 text-[#17191c] font-medium">{rec.partCode} • {rec.color}</td>
                      <td className="p-3 text-[#777b86]">{rec.booth} ({rec.painter})</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rec.bubble === 'Pass' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
                          {rec.bubble}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rec.dustSpot === 'Pass' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
                          {rec.dustSpot}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rec.overPaint === 'Pass' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
                          {rec.overPaint}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rec.paintMissing === 'Pass' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
                          {rec.paintMissing}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-[#17191c]">
                        {rec.deltaE}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rec.adhesionTest === 'Pass' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
                          {rec.adhesionTest}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rec.overallFinishing === 'Pass' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
                          {rec.overallFinishing}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          rec.result === 'Pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {rec.result}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MASTER IQC INCOMING SUBSTRATE WORKFLOW (Matching PaintKing Excel Sheet & Gate Inward Queue) */}
      {activeSubTab === 'IQC' && (
        <div className="space-y-6">
          {/* Toast Notification (Champagne Gold, No Black Background!) */}
          {iqcToast && (
            <div className="p-4 rounded-[16px] bg-[#faf3e0] text-[#8a6521] shadow-lg flex items-center justify-between gap-3 border border-[#f4e5be] animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#8a6521] shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-[#8a6521]">{iqcToast}</span>
              </div>
              <button 
                onClick={() => setIqcToast(null)}
                className="text-[#8a6521] hover:text-[#17191c] text-xs font-bold px-2 py-1 cursor-pointer transition"
              >
                ✕
              </button>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 1: PENDING JOBS (AWAITING IQC INSPECTION) */}
          {/* ================================================================ */}
          {iqcViewTab === 'PENDING' && (
            <div className="space-y-4">
              {/* Alert Banner for Production Manager (Discrepancy / Shortage Notification) */}
              {iqcRecords.some(r => r.hasDiscrepancy || (r.shortageQty && r.shortageQty > 0) || r.status === 'Rejected' || r.status === 'Hold') && (
                <div className="p-4 rounded-[20px] bg-amber-50/80 border border-amber-300 text-[#8a6521] space-y-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                      Production Manager Alert: Material Inward Shortage / Quality Discrepancies Noted
                    </h4>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    The following material inward shipments have recorded physical count shortages or transit damage. IQC has held or flagged these batches for Production Manager review:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                    {iqcRecords
                      .filter(r => r.hasDiscrepancy || (r.shortageQty && r.shortageQty > 0) || r.status === 'Rejected' || r.status === 'Hold')
                      .slice(0, 3)
                      .map(r => (
                        <div key={r.reportNo} className="p-2.5 bg-white/90 rounded-[12px] border border-amber-200 text-xs space-y-1">
                          <div className="flex items-center justify-between font-mono font-bold text-amber-900">
                            <span>{r.reportNo}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800">{r.status}</span>
                          </div>
                          <div className="text-[#17191c] font-medium">{r.vendorCustomer || r.supplierCustomer}</div>
                          <div className="text-[11px] text-[#777b86]">Challan: {r.invoiceChallanNo} • Box: {r.boxCondition || 'Damaged'}</div>
                          {r.shortageQty && r.shortageQty > 0 ? (
                            <div className="text-red-700 font-mono font-bold text-[11px] flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
                              <span>Shortage: {r.shortageQty} {r.uom} (Inv: {r.invQuantity} vs Act: {r.actualReceived})</span>
                            </div>
                          ) : null}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Pending Jobs Table / Cards */}
              <div className="bg-white rounded-[20px] sm:rounded-[24px] border border-[#ececec] p-4 sm:p-6 shadow-xs sm:shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#f2f2f3]">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase font-bold tracking-wider">
                        GATE 1 • PENDING IQC QUEUE
                      </span>
                      <span className="text-xs text-[#777b86]">
                        Materials arrived at Security Gate awaiting physical count & quality check
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-serif font-normal text-[#17191c]">
                      Pending Material Inwards ({pendingInwards.length})
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      {pendingInwards.length} Jobs Awaiting Inspection
                    </span>
                  </div>
                </div>

                {pendingInwards.length === 0 ? (
                  <div className="p-10 text-center space-y-3 bg-[#fafafb] rounded-[18px] border border-dashed border-[#ececec]">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h4 className="font-serif text-base font-normal text-[#17191c]">
                      Sabhi Inward Materials ka IQC Complete Hai!
                    </h4>
                    <p className="text-xs text-[#777b86] max-w-md mx-auto">
                      Gate Security se koi bhi material IQC ke liye pending nahi hai. Completed inspection reports dekhne aur PDF download karne ke liye <strong>"Completed Reports"</strong> tab par click karein.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* DESKTOP VIEW (>= 640px): Clean 4-Column Standard Table */}
                    <div className="hidden sm:block overflow-x-auto border border-[#ececec] rounded-[16px]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-[#f2f2f3] text-[#17191c] border-b border-[#ececec] font-semibold sticky top-0">
                          <tr>
                            <th className="p-3.5 w-48 whitespace-nowrap">1. INWARD REF & DATE</th>
                            <th className="p-3.5">2. SUPPLIER / PARTY</th>
                            <th className="p-3.5">3. MATERIAL & QUANTITY</th>
                            <th className="p-3.5 text-right w-44 whitespace-nowrap">ACTION</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#ececec] text-[#17191c]">
                          {filteredPendingInwards.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-[#777b86]">
                                {iqcSearchQuery ? `"${iqcSearchQuery}" se match karta koi pending inward nahi mila.` : 'Koi pending inward record nahi mila.'}
                              </td>
                            </tr>
                          ) : (
                            filteredPendingInwards.map(inw => (
                              <tr key={inw.srNo} className="hover:bg-[#fafafb] transition">
                                {/* 1. Inward Ref & In-Time / Date */}
                                <td className="p-3.5 whitespace-nowrap">
                                  <div className="font-mono font-bold text-xs text-[#c09748]">{inw.srNo}</div>
                                  <div className="text-[11px] text-[#777b86] mt-0.5 font-medium flex items-center gap-1.5">
                                    <span>{formatDateDDMMYYYY(inw.date)}</span>
                                    <span>•</span>
                                    <span className="font-mono">{inw.inTime || '08:30 AM'}</span>
                                  </div>
                                </td>

                                {/* 2. Supplier / Party & Challan */}
                                <td className="p-3.5">
                                  <div className="font-semibold text-xs text-[#17191c] line-clamp-1" title={inw.partyName}>
                                    {inw.partyName}
                                  </div>
                                  <div className="text-[11px] text-[#777b86] mt-0.5 font-mono">
                                    Ch: <span className="font-semibold text-[#17191c]">{inw.challanNo}</span> ({formatDateDDMMYYYY(inw.challanDate || inw.date)}) {inw.vehicleNo ? `• ${inw.vehicleNo}` : ''}
                                  </div>
                                </td>

                                {/* 3. Material Description & Quantity */}
                                <td className="p-3.5">
                                  <div className="font-medium text-xs text-[#17191c] max-w-sm truncate" title={inw.descriptionOfMaterial}>
                                    {inw.descriptionOfMaterial || 'Raw Substrates'}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="font-mono font-bold text-xs text-[#17191c]">
                                      {(inw.totalQuantity || inw.quantity || 0).toLocaleString()} {inw.unit || 'Pcs'}
                                    </span>
                                    {inw.materialCategory && (
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                        inw.materialCategory === 'Party Material' ? 'bg-[#faf3e0] text-[#8a6521]' : 'bg-blue-50 text-blue-800'
                                      }`}>
                                        {inw.materialCategory}
                                      </span>
                                    )}
                                    {inw.items && inw.items.length > 1 && (
                                      <span className="text-[10px] text-[#777b86]">
                                        ({inw.items.length} items)
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* 4. Action */}
                                <td className="p-3.5 text-right whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => openMasterIqcForInward(inw)}
                                    className="px-4 py-2 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold shadow-2xs transition cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
                                    title="Open Pre-Filled IQC Inspection Form"
                                  >
                                    <FileCheck className="w-3.5 h-3.5 text-[#c09748]" />
                                    <span>Create IQC Report</span>
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* MOBILE VIEW (< 640px): 3-Row Responsive Cards */}
                    <div className="sm:hidden space-y-2.5">
                      {filteredPendingInwards.map(inw => (
                        <div key={inw.srNo} className="bg-[#fafafb] p-3.5 rounded-[18px] border border-[#ececec] space-y-2 shadow-2xs">
                          {/* Row 1: Sr No + Category & In-Time */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono font-bold text-xs text-[#c09748]">
                              {inw.srNo}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {inw.materialCategory && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                  inw.materialCategory === 'Party Material' ? 'bg-[#faf3e0] text-[#8a6521]' : 'bg-blue-50 text-blue-800'
                                }`}>
                                  {inw.materialCategory}
                                </span>
                              )}
                              <span className="text-[10.5px] font-mono text-[#777b86]">
                                {inw.inTime || '08:30 AM'}
                              </span>
                            </div>
                          </div>

                          {/* Row 2: Party Name + Date */}
                          <div className="flex items-baseline justify-between gap-2">
                            <div className="font-semibold text-xs text-[#17191c] truncate">
                              {inw.partyName}
                            </div>
                            <div className="text-[10.5px] text-[#777b86] shrink-0 font-medium">
                              {formatDateDDMMYYYY(inw.date)}
                            </div>
                          </div>

                          {/* Row 3: Material + Inward Qty */}
                          <div className="flex items-center justify-between gap-2 text-[11px]">
                            <div className="text-[#777b86] truncate max-w-[65%]" title={inw.descriptionOfMaterial}>
                              {inw.descriptionOfMaterial || 'Raw Material'}
                            </div>
                            <div className="font-mono font-bold text-xs text-[#17191c] shrink-0">
                              {inw.totalQuantity || inw.quantity} {inw.unit || 'Pcs'}
                            </div>
                          </div>

                          {/* Row 4: Action */}
                          <div className="pt-2 border-t border-[#ececec]">
                            <button
                              onClick={() => openMasterIqcForInward(inw)}
                              className="w-full h-8.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                            >
                              <FileCheck className="w-3.5 h-3.5 text-[#c09748]" />
                              <span>Create IQC Report</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 2: COMPLETED JOBS (INSPECTED & GENERATED MASTER REPORTS) */}
          {/* ================================================================ */}
          {iqcViewTab === 'COMPLETED' && (
            <div className="bg-white rounded-[20px] sm:rounded-[24px] border border-[#ececec] p-4 sm:p-6 shadow-xs sm:shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#f2f2f3]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase font-bold tracking-wider">
                      DOC: PK-QA-IQC-001 • REV 00
                    </span>
                    <span className="text-xs text-[#777b86]">
                      Official IATF 16949 & ISO 9001:2015 incoming substrate audit logs matching PaintKing format
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-serif font-normal text-[#17191c]">
                    Completed Master IQC Reports Register ({filteredIqcRecords.length})
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {filteredIqcRecords.length} Reports Generated
                  </span>
                </div>
              </div>

              {filteredIqcRecords.length === 0 ? (
                <div className="p-10 text-center space-y-3 bg-[#fafafb] rounded-[18px] border border-dashed border-[#ececec]">
                  <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif text-base font-normal text-[#17191c]">
                    {iqcSearchQuery ? `"${iqcSearchQuery}" se match karti koi report nahi mili.` : 'Abhi Tak Koi IQC Report Generate Nahi Hui Hai'}
                  </h4>
                  <p className="text-xs text-[#777b86] max-w-md mx-auto">
                    Pending Jobs tab me jakar kisi bhi inward shipment ka inspection complete karein, uske baad reports yahan show hongi.
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile Touch Card List View (< 640px) */}
                  <div className="block sm:hidden space-y-3">
                    {filteredIqcRecords.map(rec => (
                      <div key={rec.reportNo} className="p-3.5 bg-[#fafafb] border border-[#ececec] rounded-[16px] space-y-2.5 text-xs">
                        <div className="flex items-center justify-between pb-2 border-b border-[#ececec]">
                          <div>
                            <span className="font-mono font-bold text-[#c09748] text-xs">{rec.reportNo}</span>
                            <div className="text-[11px] font-medium text-[#17191c]">{rec.vendorCustomer || rec.supplierCustomer}</div>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            rec.status === 'Accepted' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {rec.status}
                          </span>
                        </div>

                        <div className="text-[#17191c] font-medium">{rec.partComponent || rec.partCode}</div>
                        <div className="text-[11px] text-[#777b86]">
                          Challan: {rec.invoiceChallanNo} • Inv Qty: {rec.invQuantity || rec.totalQty} {rec.uom || 'Pcs'}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2 rounded-[10px] border border-[#ececec]">
                          <div>
                            <span className="text-[#777b86] block">Sample Size / Pass:</span>
                            <span className="font-mono font-bold text-emerald-800">{rec.passQty || rec.sampleSize || 50} / {rec.sampleSize || 50}</span>
                          </div>
                          <div>
                            <span className="text-[#777b86] block">Box Condition:</span>
                            <span className="font-medium text-[#17191c]">{rec.boxCondition || 'Intact'}</span>
                          </div>
                        </div>

                        <div className="pt-1 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedIqcReportForView(rec)}
                            className="px-3.5 py-1.5 rounded-full border border-[#dcdfe4] bg-white hover:bg-[#17191c] hover:text-white text-xs font-semibold text-[#17191c] transition cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Report</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadStandardIQCPdf(rec)}
                            className="px-3.5 py-1.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                          >
                            <Download className="w-3.5 h-3.5 text-[#c09748]" />
                            <span>PDF</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View (>= 640px): Clean 5-Column Standard Table */}
                  <div className="hidden sm:block overflow-x-auto border border-[#ececec] rounded-[16px]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#f2f2f3] text-[#17191c] border-b border-[#ececec] font-semibold sticky top-0">
                        <tr>
                          <th className="p-3.5 w-52 whitespace-nowrap">1. REPORT REF & DATE</th>
                          <th className="p-3.5">2. VENDOR / CUSTOMER</th>
                          <th className="p-3.5">3. MATERIAL & QUANTITY</th>
                          <th className="p-3.5 w-44 whitespace-nowrap">4. 20% SAMPLING & STATUS</th>
                          <th className="p-3.5 text-right w-44 whitespace-nowrap">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ececec] text-[#17191c]">
                        {filteredIqcRecords.map(rec => (
                          <tr key={rec.reportNo} className="hover:bg-[#fafafb] transition">
                            {/* 1. Report Ref & Inspection Date/Time */}
                            <td className="p-3.5 whitespace-nowrap">
                              <div className="font-mono font-bold text-xs text-[#c09748]">{rec.reportNo}</div>
                              <div className="text-[11px] text-[#777b86] mt-0.5 font-medium flex items-center gap-1.5">
                                <span>{formatDateDDMMYYYY(rec.inspectionDate || rec.date)}</span>
                                <span>•</span>
                                <span className="font-mono">{rec.inspectionTime || '08:30 AM'}</span>
                              </div>
                            </td>

                            {/* 2. Vendor / Customer & Challan */}
                            <td className="p-3.5">
                              <div className="font-semibold text-xs text-[#17191c] line-clamp-1" title={rec.vendorCustomer || rec.supplierCustomer}>
                                {rec.vendorCustomer || rec.supplierCustomer}
                              </div>
                              <div className="text-[11px] text-[#777b86] mt-0.5 font-mono">
                                Ch: <span className="font-semibold text-[#17191c]">{rec.invoiceChallanNo}</span> {rec.batchNo ? `(Lot: ${rec.batchNo})` : ''}
                              </div>
                            </td>

                            {/* 3. Material Component & Quantity (Actual / Inward) */}
                            <td className="p-3.5">
                              <div className="font-medium text-xs text-[#17191c] max-w-xs truncate" title={rec.partComponent || rec.partCode}>
                                {rec.partComponent || rec.partCode}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 font-mono text-xs">
                                <span className="font-bold text-[#17191c]">
                                  {(rec.actualReceived || rec.totalQty || 0).toLocaleString()} / {(rec.invQuantity || rec.totalQty || 0).toLocaleString()} {rec.uom || 'Pcs'}
                                </span>
                                {rec.shortageQty && rec.shortageQty > 0 ? (
                                  <span className="text-rose-600 font-bold text-[10px] font-sans">
                                    (-{rec.shortageQty} Short)
                                  </span>
                                ) : null}
                              </div>
                            </td>

                            {/* 4. 20% Sampling Result & Final Disposition Status */}
                            <td className="p-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                  rec.status === 'Accepted'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : rec.status === 'Hold'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-rose-50 text-rose-800 border-rose-200'
                                }`}>
                                  {rec.status === 'Accepted' ? '✓ Accepted' : rec.status}
                                </span>
                              </div>
                              <div className="text-[11px] text-[#777b86] mt-0.5 font-mono">
                                Sample: <strong className="text-[#17191c]">{rec.passQty || rec.sampleSize || 50}/{rec.sampleSize || 50}</strong>
                                {rec.rejectQty && rec.rejectQty > 0 ? (
                                  <span className="text-rose-600 font-bold ml-1 font-sans">({rec.rejectQty} rej)</span>
                                ) : null}
                              </div>
                            </td>

                            {/* 5. Action Buttons (View + PDF) */}
                            <td className="p-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedIqcReportForView(rec)}
                                  className="px-3 py-1.5 rounded-full border border-[#dcdfe4] bg-white hover:bg-[#17191c] hover:text-white hover:border-[#17191c] text-xs font-medium text-[#17191c] transition cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                                  title="View Full Excel-Format Inspection Report"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => downloadStandardIQCPdf(rec)}
                                  className="px-3 py-1.5 rounded-full border border-[#dcdfe4] bg-[#f2f2f3] hover:bg-[#e5e7eb] text-xs font-medium text-[#17191c] transition cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                                  title="Download Master IQC PDF"
                                >
                                  <Download className="w-3.5 h-3.5 text-[#c09748]" />
                                  <span>PDF</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: OQC OUTGOING QUALITY RELEASE VIEW */}
      {activeSubTab === 'OQC' && (
        <div className="bg-white rounded-[20px] sm:rounded-[24px] border border-[#ececec] p-4 sm:p-6 shadow-xs sm:shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f3]">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#777b86]">
                OQC & PDI Outgoing Clearance Verification
              </h3>
              <p className="text-[11px] text-[#777b86] mt-0.5">Pre-dispatch box condition, traceability, conductivity & adhesion sign-off</p>
            </div>
            <span className="text-[11px] sm:text-xs font-mono text-[#c09748] font-bold">PK-QA-OQC-001</span>
          </div>

          {/* Mobile Touch Card List View (< 640px) */}
          <div className="block sm:hidden space-y-3">
            {qualityReleases.map(rel => (
              <div key={rel.releaseId} className="p-3.5 bg-[#fafafb] border border-[#ececec] rounded-[16px] space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#ececec]">
                  <div>
                    <span className="font-mono font-bold text-[#c09748] text-xs">{rel.releaseId}</span>
                    <div className="text-[11px] font-medium text-[#17191c]">{rel.customer} ({rel.woNo})</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${rel.pdiStatus === 'Cleared for Invoicing' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    {rel.pdiStatus}
                  </span>
                </div>

                <div className="text-[#777b86] font-mono text-[11px]">{rel.partCode} • {rel.color}</div>

                <div className="grid grid-cols-3 gap-1.5 pt-1 text-center text-[10px]">
                  <div className="bg-white p-1.5 rounded-[8px] border border-[#ececec]"><span className="text-[#777b86] block">Box Condition</span><span className="font-bold text-emerald-700">{rel.packingBoxCondition}</span></div>
                  <div className="bg-white p-1.5 rounded-[8px] border border-[#ececec]"><span className="text-[#777b86] block">Traceability</span><span className="font-bold text-emerald-700">{rel.traceabilityBatchNo}</span></div>
                  <div className="bg-white p-1.5 rounded-[8px] border border-[#ececec]"><span className="text-[#777b86] block">Qty Match</span><span className="font-bold text-emerald-700">{rel.quantityMatch}</span></div>
                  <div className="bg-white p-1.5 rounded-[8px] border border-[#ececec]"><span className="text-[#777b86] block">Physical</span><span className="font-bold text-emerald-700">{rel.physicalInspection}</span></div>
                  <div className="bg-white p-1.5 rounded-[8px] border border-[#ececec]"><span className="text-[#777b86] block">Conductivity</span><span className="font-bold text-emerald-700">{rel.conductivity}</span></div>
                  <div className="bg-white p-1.5 rounded-[8px] border border-[#ececec]"><span className="text-[#777b86] block">ΔE (Delta)</span><span className="font-mono font-bold text-[#17191c]">{rel.deltaE}</span></div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= 640px) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#ececec] text-[#777b86] bg-[#fafafb]">
                  <th className="p-3 font-semibold">Release ID</th>
                  <th className="p-3 font-semibold">Customer & WO</th>
                  <th className="p-3 font-semibold">Part Code & Color</th>
                  <th className="p-3 font-semibold text-center">Packing Box</th>
                  <th className="p-3 font-semibold text-center">Traceability</th>
                  <th className="p-3 font-semibold text-center">Qty Match</th>
                  <th className="p-3 font-semibold text-center">Physical Insp.</th>
                  <th className="p-3 font-semibold text-center">Conductivity</th>
                  <th className="p-3 font-semibold text-center">Adhesion</th>
                  <th className="p-3 font-semibold text-center">ΔE (Delta)</th>
                  <th className="p-3 font-semibold text-right">PDI Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececec]">
                {qualityReleases.map(rel => (
                  <tr key={rel.releaseId} className="hover:bg-[#fafafb] transition">
                    <td className="p-3 font-mono font-bold text-[#c09748]">{rel.releaseId}</td>
                    <td className="p-3 text-[#17191c] font-medium">{rel.customer} <span className="text-[10px] text-[#777b86]">({rel.woNo})</span></td>
                    <td className="p-3 text-[#777b86]">{rel.partCode} • {rel.color}</td>
                    <td className="p-3 text-center"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800">{rel.packingBoxCondition}</span></td>
                    <td className="p-3 text-center"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800">{rel.traceabilityBatchNo}</span></td>
                    <td className="p-3 text-center"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800">{rel.quantityMatch}</span></td>
                    <td className="p-3 text-center"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800">{rel.physicalInspection}</span></td>
                    <td className="p-3 text-center"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800">{rel.conductivity}</span></td>
                    <td className="p-3 text-center"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800">{rel.adhesion}</span></td>
                    <td className="p-3 text-center font-mono font-bold text-[#17191c]">{rel.deltaE}</td>
                    <td className="p-3 text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        rel.pdiStatus === 'Cleared for Invoicing' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {rel.pdiStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: REWORK CLEARANCE QUEUE & SALVAGE GATE */}
      {activeSubTab === 'REWORK_CLEARANCE' && (
        <div className="bg-white rounded-[20px] sm:rounded-[24px] border border-[#ececec] p-4 sm:p-6 shadow-xs sm:shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f2f2f3]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-mono uppercase font-bold tracking-wider">
                  PK-QA-RW-001 • REWORK DISPOSITION & CLEARANCE GATE
                </span>
                <span className="text-xs text-[#777b86]">
                  Defect Re-inspection, Sanding Audit, Re-spray Clearance & Yield Recovery
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-serif font-normal text-[#17191c]">
                Rework on Rejection Clearance Queue
              </h3>
            </div>

            <button
              onClick={() => setShowReworkActionModal(true)}
              className="px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>+ Route Defective Parts to Rework</span>
            </button>
          </div>

          {/* Rework Queue List */}
          {jobCards.filter(j => j.jobCardType === 'rework_child').length === 0 ? (
            <div className="p-8 text-center space-y-2 bg-[#fafafb] rounded-[18px] border border-dashed border-[#ececec]">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <h4 className="font-serif text-base text-[#17191c]">No Active Rework Cards in Floor Queue</h4>
              <p className="text-xs text-[#777b86]">All current floor batches are passing at First Pass Yield without active rework holds.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobCards.filter(j => j.jobCardType === 'rework_child').map(rwCard => (
                <div 
                  key={rwCard.jobCardNo}
                  className="p-5 rounded-[20px] bg-amber-50/20 border border-amber-200 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-900 px-2.5 py-0.5 rounded-full bg-white border border-amber-200">
                        {rwCard.jobCardNo}
                      </span>
                      <span className="text-[#777b86] font-mono">
                        Parent: <strong>{rwCard.parentJobCardId || 'JC-1042-RED'}</strong>
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold text-[10px]">
                      {rwCard.reworkStatus || 'In Re-spray'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-serif text-base text-[#17191c] font-normal">{rwCard.customer}</h4>
                    <div className="text-[#777b86]">{rwCard.partDescription} • Shade: <strong>{rwCard.color}</strong></div>
                  </div>

                  <div className="p-3 bg-white rounded-[14px] border border-amber-200 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#777b86]">Defect Category:</span>
                      <strong className="text-amber-900 uppercase font-mono">{rwCard.defectCategory ? rwCard.defectCategory.replace(/_/g, ' ') : 'DUST NIBS'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#777b86]">Rework Lot Size:</span>
                      <strong className="font-mono text-[#17191c]">{rwCard.targetQty} Pcs</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#777b86]">Salvaged / Good Recovered:</span>
                      <strong className="font-mono text-emerald-800">{rwCard.reworkRecoveredQty || rwCard.goodQty || 0} Pcs</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#777b86]">Unrecoverable Scrap:</span>
                      <strong className="font-mono text-red-600">{rwCard.scrapQty || rwCard.rejectQty || 0} Pcs</strong>
                    </div>
                  </div>

                  <div className="text-[11px] text-amber-900 bg-amber-100/50 p-2.5 rounded-[12px] border border-amber-200 font-mono">
                    SOP: {rwCard.reworkInstructions || 'De-nib with P1500, tack wipe, re-spray basecoat and cure at 65°C.'}
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[10px] text-[#777b86]">Operator: {rwCard.assignedPainterName || rwCard.painterName}</span>
                    <button
                      onClick={() => {
                        const recQty = rwCard.reworkRecoveredQty || rwCard.goodQty || rwCard.targetQty;
                        passReworkClearance(rwCard.jobCardNo, recQty, rwCard.scrapQty || 0);
                        alert(`Rework Card ${rwCard.jobCardNo} QA Clearance Sign-Off Complete!\n\nAll ${recQty} pieces inspected for ΔE ≤ 0.70 & cross-cut adhesion. Salvaged yield returned to Parent Batch.`);
                      }}
                      className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1 active:scale-95"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Inspect & Pass Salvaged Qty</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FULL-SCREEN CANVAS: QA ROUTE TO REWORK ACTION */}
      {showReworkActionModal && (
        <div className="fixed inset-0 z-50 bg-[#fafafb] sm:bg-white overflow-y-auto flex flex-col animate-in fade-in duration-150">
          {/* Sticky Top Header Bar */}
          <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#ececec] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-mono uppercase tracking-widest font-bold">
                  QA Disposition
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#777b86] text-[10px] font-mono">
                  {selectedJcForRework}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-normal text-[#17191c]">
                Route to Rework Child Card
              </h3>
            </div>
            <button 
              type="button"
              onClick={() => setShowReworkActionModal(false)}
              className="w-9 h-9 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] flex items-center justify-center cursor-pointer transition active:scale-95 shadow-2xs"
              title="Close"
            >
              <X className="w-5 h-5 text-[#17191c]" />
            </button>
          </div>

          {/* Form Body */}
          <div className="max-w-2xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1 text-xs">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                routeToRework(selectedJcForRework, reworkActionQty, reworkActionDefect, reworkActionNotes);
                setShowReworkActionModal(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[#17191c] font-semibold mb-1">Target Job Card</label>
                <select
                  value={selectedJcForRework}
                  onChange={(e) => setSelectedJcForRework(e.target.value)}
                  className="w-full p-3 rounded-[12px] border border-[#ececec] bg-white text-xs font-medium cursor-pointer"
                >
                  {jobCards.filter(j => j.jobCardType !== 'rework_child').map(jc => (
                    <option key={jc.jobCardNo} value={jc.jobCardNo}>
                      {jc.jobCardNo} - {jc.customer} ({jc.color})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#17191c] font-semibold mb-1">Rejected Quantity for Rework (Pcs)</label>
                <input
                  type="number"
                  value={reworkActionQty}
                  onChange={(e) => setReworkActionQty(Math.max(1, Number(e.target.value)))}
                  className="w-full p-3 rounded-[12px] border border-[#ececec] bg-white font-mono font-bold text-sm text-[#17191c]"
                  min={1}
                  required
                />
              </div>

              <div>
                <label className="block text-[#17191c] font-semibold mb-1">Defect Category</label>
                <select
                  value={reworkActionDefect}
                  onChange={(e) => setReworkActionDefect(e.target.value as DefectCategory)}
                  className="w-full p-3 rounded-[12px] border border-[#ececec] bg-white text-xs font-medium cursor-pointer"
                >
                  <option value="dust_nibs">Dust Nibs (Surface Dust / Particles)</option>
                  <option value="paint_run">Paint Run / Sagging</option>
                  <option value="orange_peel">Orange Peel Texture</option>
                  <option value="pinholes">Pinholes / Micro-bubbles</option>
                  <option value="color_mismatch">Color Tone / Shade Mismatch</option>
                  <option value="adhesion_failure">Adhesion Flaking / Peeling</option>
                  <option value="scratches">Transit / Handling Scratches</option>
                </select>
              </div>

              <div>
                <label className="block text-[#17191c] font-semibold mb-1">Rework SOP Instructions</label>
                <textarea
                  value={reworkActionNotes}
                  onChange={(e) => setReworkActionNotes(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-[12px] border border-[#ececec] bg-white text-xs leading-relaxed"
                  required
                />
              </div>

              <div className="pt-4 border-t border-[#ececec] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowReworkActionModal(false)}
                  className="px-5 py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold shadow-xs cursor-pointer transition active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-[#c09748]" />
                  <span>Create Rework Child Card</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL-SCREEN CANVAS: IQC INCOMING SUBSTRATE FORM */}
      {showIqcModal && (
        <div className="fixed inset-0 z-50 bg-[#fafafb] sm:bg-white overflow-y-auto flex flex-col animate-in fade-in duration-150">
          {/* Sticky Top Header Bar */}
          <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#ececec] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
                  PK-STR-IQC-001
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#777b86] text-[10px] font-mono">
                  Substrate Check
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-normal text-[#17191c]">
                New IQC Substrate Inspection
              </h3>
            </div>
            <button 
              type="button"
              onClick={() => setShowIqcModal(false)}
              className="w-9 h-9 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] flex items-center justify-center cursor-pointer transition active:scale-95 shadow-2xs"
              title="Close"
            >
              <X className="w-5 h-5 text-[#17191c]" />
            </button>
          </div>

          {/* Form Body */}
          <div className="max-w-3xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1 text-xs">
            <form onSubmit={handleIqcSubmit} className="space-y-4">
              {/* SMART PARTY / WORK ORDER DROPDOWN AUTO-FILL */}
              <div className="p-3.5 bg-[#faf3e0]/50 rounded-[16px] border border-[#f4e5be] space-y-1.5">
                <label className="block text-[#8a6521] font-bold text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#c09748]" />
                  Select Party Name / Active Work Order (Auto-Fill Details):
                </label>
                <select
                  onChange={e => selectOrderForIqc(e.target.value)}
                  className="w-full p-2.5 rounded-[12px] border border-[#f4e5be] bg-white font-medium text-xs text-[#17191c] cursor-pointer focus:outline-none"
                >
                  <option value="">-- Choose Party / WO to Auto-Populate Form --</option>
                  {availableOrders.map(o => (
                    <option key={o.jobCardNo} value={o.jobCardNo}>
                      {o.customer} • {o.woNo} ({o.partCode} - {o.color})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Supplier / Customer</label>
                  <input
                    type="text"
                    value={iqcForm.supplierCustomer}
                    onChange={e => setIqcForm({ ...iqcForm, supplierCustomer: e.target.value })}
                    className="w-full p-2.5 rounded-[12px] border border-[#ececec] focus:border-[#c09748] focus:outline-none bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Substrate Part Code</label>
                  <input
                    type="text"
                    value={iqcForm.partCode}
                    onChange={e => setIqcForm({ ...iqcForm, partCode: e.target.value })}
                    className="w-full p-2.5 rounded-[12px] border border-[#ececec] focus:border-[#c09748] focus:outline-none font-mono bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Vendor Batch No</label>
                  <input
                    type="text"
                    value={iqcForm.batchNo}
                    onChange={e => setIqcForm({ ...iqcForm, batchNo: e.target.value })}
                    className="w-full p-2.5 rounded-[12px] border border-[#ececec] focus:border-[#c09748] focus:outline-none font-mono bg-white"
                    required
                  />
                </div>
              </div>

              {/* IQC Selection Grid with 1-Tap "Set All Pass" Button */}
              <div className="p-4 bg-[#fafafb] rounded-[18px] border border-[#ececec] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#17191c] text-xs">Substrate Defect Checklist Options:</span>
                  <button
                    type="button"
                    onClick={setAllIqcPass}
                    className="px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition flex items-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                    <span>✓ Set All Pass (100% Clean)</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { label: 'Damage', key: 'damage' },
                    { label: 'Scratch', key: 'scratch' },
                    { label: 'Sink Mark', key: 'sinkMark' },
                    { label: 'Short Fill', key: 'shortFill' },
                    { label: 'Bubble', key: 'bubble' },
                    { label: 'Pin Mark', key: 'pinMark' },
                    { label: 'Dust Spot', key: 'dustSpot' },
                    { label: 'Over Paint', key: 'overPaint' },
                    { label: 'Paint Missing', key: 'paintMissing' },
                    { label: 'Colour', key: 'colour' },
                    { label: 'Overall Finishing', key: 'overallFinishing' }
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-2.5 bg-white rounded-[12px] border border-[#ececec]">
                      <span className="font-medium text-[#17191c] text-xs">{item.label}</span>
                      <select
                        value={(iqcForm as any)[item.key]}
                        onChange={e => setIqcForm({ ...iqcForm, [item.key]: e.target.value })}
                        className={`p-1 rounded-[6px] text-xs font-bold border cursor-pointer ${
                          (iqcForm as any)[item.key] === 'Pass' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
                        }`}
                      >
                        <option value="Pass">Pass</option>
                        <option value="Fail">Fail</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#ececec] flex justify-end gap-2">
                <button type="button" onClick={() => setShowIqcModal(false)} className="px-5 py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium cursor-pointer">Cancel</button>
                <button type="submit" className="px-6 py-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold shadow-xs cursor-pointer transition active:scale-95 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#c09748]" />
                  <span>Save IQC Inspection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL-SCREEN CANVAS: IPQC 3-HOURLY AUDIT FORM */}
      {showIpqcModal && (
        <div className="fixed inset-0 z-50 bg-[#fafafb] sm:bg-white overflow-y-auto flex flex-col animate-in fade-in duration-150">
          {/* Sticky Top Header Bar */}
          <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#ececec] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
                  PK-QA-IPQ-001
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#777b86] text-[10px] font-mono">
                  3-Hourly Line Audit
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-normal text-[#17191c]">
                New 3-Hourly IPQC Line Inspection
              </h3>
            </div>
            <button 
              type="button"
              onClick={() => setShowIpqcModal(false)}
              className="w-9 h-9 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] flex items-center justify-center cursor-pointer transition active:scale-95 shadow-2xs"
              title="Close"
            >
              <X className="w-5 h-5 text-[#17191c]" />
            </button>
          </div>

          {/* Form Body */}
          <div className="max-w-3xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1 text-xs">
            <form onSubmit={handleIpqcSubmit} className="space-y-4">
              {/* SMART PARTY / WORK ORDER DROPDOWN AUTO-FILL */}
              <div className="p-3.5 bg-[#faf3e0]/50 rounded-[16px] border border-[#f4e5be] space-y-1.5">
                <label className="block text-[#8a6521] font-bold text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#c09748]" />
                  Select Party Name / Active Job Card (Auto-Fill Details):
                </label>
                <select
                  onChange={e => selectOrderForIpqc(e.target.value)}
                  className="w-full p-2.5 rounded-[12px] border border-[#f4e5be] bg-white font-medium text-xs text-[#17191c] cursor-pointer focus:outline-none"
                >
                  <option value="">-- Choose Party / Job Card to Auto-Populate --</option>
                  {availableOrders.map(o => (
                    <option key={o.jobCardNo} value={o.jobCardNo}>
                      {o.customer} • {o.woNo} ({o.partCode} - {o.color})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Work Order No</label>
                  <input
                    type="text"
                    value={ipqcForm.woNo}
                    onChange={e => setIpqcForm({ ...ipqcForm, woNo: e.target.value })}
                    className="w-full p-2.5 rounded-[12px] border border-[#ececec] focus:border-[#c09748] focus:outline-none font-mono bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Part Code</label>
                  <input
                    type="text"
                    value={ipqcForm.partCode}
                    onChange={e => setIpqcForm({ ...ipqcForm, partCode: e.target.value })}
                    className="w-full p-2.5 rounded-[12px] border border-[#ececec] focus:border-[#c09748] focus:outline-none font-mono bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Color / Finish</label>
                  <input
                    type="text"
                    value={ipqcForm.color}
                    onChange={e => setIpqcForm({ ...ipqcForm, color: e.target.value })}
                    className="w-full p-2.5 rounded-[12px] border border-[#ececec] focus:border-[#c09748] focus:outline-none bg-white"
                    required
                  />
                </div>
              </div>

              {/* IPQC Selection Grid with 1-Tap "Set All Pass" Button */}
              <div className="p-4 bg-[#fafafb] rounded-[18px] border border-[#ececec] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#17191c] text-xs">IPQC Parameter Options:</span>
                  <button
                    type="button"
                    onClick={setAllIpqcPass}
                    className="px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition flex items-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                    <span>✓ Set All Pass (100% Clean)</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { label: 'Bubble', key: 'bubble' },
                    { label: 'Dust Spot', key: 'dustSpot' },
                    { label: 'Over Paint', key: 'overPaint' },
                    { label: 'Paint Missing', key: 'paintMissing' },
                    { label: 'Overall Finishing', key: 'overallFinishing' },
                    { label: 'Adhesion Test', key: 'adhesionTest' }
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-2.5 bg-white rounded-[12px] border border-[#ececec]">
                      <span className="font-medium text-[#17191c] text-xs">{item.label}</span>
                      <select
                        value={(ipqcForm as any)[item.key]}
                        onChange={e => setIpqcForm({ ...ipqcForm, [item.key]: e.target.value })}
                        className={`p-1 rounded-[6px] text-xs font-bold border cursor-pointer ${
                          (ipqcForm as any)[item.key] === 'Pass' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
                        }`}
                      >
                        <option value="Pass">Pass</option>
                        <option value="Fail">Fail</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spectrophotometer LAB & Delta-E Entry */}
              <div className="p-4 bg-[#faf3e0]/40 rounded-[18px] border border-[#f4e5be] space-y-2.5">
                <div className="font-semibold text-[#17191c] flex items-center justify-between text-xs">
                  <span>Spectrophotometer Colorimetry (L, A, B, ΔE)</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${ipqcForm.deltaE <= 0.70 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    {ipqcForm.deltaE <= 0.70 ? '✓ PASS' : '🚨 REJECT'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[10px] text-[#777b86]">L*</label>
                    <input type="number" step="0.01" value={ipqcForm.L} onChange={e => setIpqcForm({ ...ipqcForm, L: Number(e.target.value) })} className="w-full p-2 rounded-[8px] border border-[#ececec] bg-white font-mono text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#777b86]">a*</label>
                    <input type="number" step="0.01" value={ipqcForm.a} onChange={e => setIpqcForm({ ...ipqcForm, a: Number(e.target.value) })} className="w-full p-2 rounded-[8px] border border-[#ececec] bg-white font-mono text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#777b86]">b*</label>
                    <input type="number" step="0.01" value={ipqcForm.b} onChange={e => setIpqcForm({ ...ipqcForm, b: Number(e.target.value) })} className="w-full p-2 rounded-[8px] border border-[#ececec] bg-white font-mono text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#777b86] font-bold">ΔE (Delta)</label>
                    <input type="number" step="0.01" min={0} value={ipqcForm.deltaE} onChange={e => setIpqcForm({ ...ipqcForm, deltaE: Number(e.target.value) })} className="w-full p-2 rounded-[8px] border-2 border-[#c09748] bg-white font-mono font-bold text-xs" />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#ececec] flex justify-end gap-2">
                <button type="button" onClick={() => setShowIpqcModal(false)} className="px-5 py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium cursor-pointer">Cancel</button>
                <button type="submit" className="px-6 py-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold shadow-xs cursor-pointer transition active:scale-95 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#c09748]" />
                  <span>Save IPQC Inspection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL-SCREEN CANVAS: OQC / PDI RELEASE FORM */}
      {showOqcModal && (
        <div className="fixed inset-0 z-50 bg-[#fafafb] sm:bg-white overflow-y-auto flex flex-col animate-in fade-in duration-150">
          {/* Sticky Top Header Bar */}
          <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#ececec] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
                  PK-QA-OQC-001
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#777b86] text-[10px] font-mono">
                  Outgoing Release
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-normal text-[#17191c]">
                New OQC / PDI Quality Release
              </h3>
            </div>
            <button 
              type="button"
              onClick={() => setShowOqcModal(false)}
              className="w-9 h-9 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] flex items-center justify-center cursor-pointer transition active:scale-95 shadow-2xs"
              title="Close"
            >
              <X className="w-5 h-5 text-[#17191c]" />
            </button>
          </div>

          {/* Form Body */}
          <div className="max-w-3xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1 text-xs">
            <form onSubmit={handleOqcSubmit} className="space-y-4">
              {/* SMART PARTY / WORK ORDER DROPDOWN AUTO-FILL */}
              <div className="p-3.5 bg-[#faf3e0]/50 rounded-[16px] border border-[#f4e5be] space-y-1.5">
                <label className="block text-[#8a6521] font-bold text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#c09748]" />
                  Select Party Name / Work Order (Auto-Fill Details):
                </label>
                <select
                  onChange={e => selectOrderForOqc(e.target.value)}
                  className="w-full p-2.5 rounded-[12px] border border-[#f4e5be] bg-white font-medium text-xs text-[#17191c] cursor-pointer focus:outline-none"
                >
                  <option value="">-- Choose Party / WO to Auto-Populate --</option>
                  {availableOrders.map(o => (
                    <option key={o.jobCardNo} value={o.jobCardNo}>
                      {o.customer} • {o.woNo} ({o.partCode} - {o.color})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={oqcForm.customer}
                    onChange={e => setOqcForm({ ...oqcForm, customer: e.target.value })}
                    className="w-full p-2.5 rounded-[12px] border border-[#ececec] focus:border-[#c09748] focus:outline-none bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Work Order</label>
                  <input
                    type="text"
                    value={oqcForm.woNo}
                    onChange={e => setOqcForm({ ...oqcForm, woNo: e.target.value })}
                    className="w-full p-2.5 rounded-[12px] border border-[#ececec] focus:border-[#c09748] focus:outline-none font-mono bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Part Code & Color</label>
                  <input
                    type="text"
                    value={oqcForm.partCode}
                    onChange={e => setOqcForm({ ...oqcForm, partCode: e.target.value })}
                    className="w-full p-2.5 rounded-[12px] border border-[#ececec] focus:border-[#c09748] focus:outline-none bg-white"
                    required
                  />
                </div>
              </div>

              {/* OQC Selection Grid with 1-Tap "Set All Pass" Button */}
              <div className="p-4 bg-[#fafafb] rounded-[18px] border border-[#ececec] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#17191c] text-xs">OQC Outgoing Checklist Options:</span>
                  <button
                    type="button"
                    onClick={setAllOqcPass}
                    className="px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition flex items-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                    <span>✓ Set All Pass (100% Clean)</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { label: 'Packing (Box Condition)', key: 'packingBoxCondition' },
                    { label: 'Traceability (Batch No)', key: 'traceabilityBatchNo' },
                    { label: 'Quantity Match', key: 'quantityMatch' },
                    { label: 'Physical Inspection', key: 'physicalInspection' },
                    { label: 'Conductivity', key: 'conductivity', extraOpt: 'N/A' },
                    { label: 'Adhesion Test', key: 'adhesion' }
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-2.5 bg-white rounded-[12px] border border-[#ececec]">
                      <span className="font-medium text-[#17191c] text-xs">{item.label}</span>
                      <select
                        value={(oqcForm as any)[item.key]}
                        onChange={e => setOqcForm({ ...oqcForm, [item.key]: e.target.value })}
                        className={`p-1 rounded-[6px] text-xs font-bold border cursor-pointer ${
                          (oqcForm as any)[item.key] === 'Pass' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
                        }`}
                      >
                        <option value="Pass">Pass</option>
                        <option value="Fail">Fail</option>
                        {item.extraOpt && <option value="N/A">N/A</option>}
                      </select>
                    </div>
                  ))}
                </div>

                {/* Spectrophotometer Delta-E Input for OQC Clearance */}
                <div className="pt-3 border-t border-[#ececec] flex items-center justify-between">
                  <div>
                    <label className="block text-[11px] font-bold text-[#17191c]">
                      Spectrophotometer ΔE (Colorimetry Verification) *
                    </label>
                    <span className="text-[10px] text-[#777b86]">Standard: Target ΔE ≤ 0.70</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={oqcForm.deltaE}
                      onChange={e => setOqcForm({ ...oqcForm, deltaE: Number(e.target.value) })}
                      className="w-24 p-2 rounded-[8px] border-2 border-[#c09748] bg-white font-mono font-bold text-xs text-center"
                    />
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      oqcForm.deltaE <= 0.70 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {oqcForm.deltaE <= 0.70 ? '✓ PASS' : '🚨 HOLD'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#ececec] flex justify-end gap-2">
                <button type="button" onClick={() => setShowOqcModal(false)} className="px-5 py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium cursor-pointer">Cancel</button>
                <button type="submit" className="px-6 py-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold shadow-xs cursor-pointer transition active:scale-95 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#c09748]" />
                  <span>Grant OQC & PDI Clearance</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: FPA GOLDEN GATE FORM (WITH SMART AUTO-FILL) */}
      {showFpaModal && (
        <div className="fixed inset-0 z-50 bg-[#fafafb] sm:bg-white overflow-y-auto flex flex-col animate-in fade-in duration-150">
          {/* Sticky Top Header Bar */}
          <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#ececec] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
                  QA / FPA Gate
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#777b86] text-[10px] font-mono">
                  First Part Approval
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-normal text-[#17191c]">
                New First Part Approval (FPA) Test
              </h3>
            </div>
            <button 
              type="button"
              onClick={() => setShowFpaModal(false)}
              className="w-9 h-9 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] flex items-center justify-center cursor-pointer transition active:scale-95 shadow-2xs"
              title="Close Form"
            >
              <X className="w-5 h-5 text-[#17191c]" />
            </button>
          </div>

          {/* Body Container */}
          <div className="max-w-3xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1 text-xs">
            <form onSubmit={handleFpaSubmit} className="space-y-5">
              {/* SMART PARTY / WORK ORDER DROPDOWN AUTO-FILL */}
              <div className="p-4 bg-[#faf3e0]/50 rounded-[18px] border border-[#f4e5be] space-y-2">
                <label className="block text-[#8a6521] font-bold text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#c09748]" />
                  Select Party Name / Job Card (Auto-Fill Details):
                </label>
                <select
                  onChange={e => selectOrderForFpa(e.target.value)}
                  className="w-full p-3 rounded-[14px] border border-[#f4e5be] bg-white font-medium text-xs text-[#17191c] cursor-pointer focus:outline-none"
                >
                  <option value="">-- Choose Party / Job Card to Auto-Populate --</option>
                  {availableOrders.map(o => (
                    <option key={o.jobCardNo} value={o.jobCardNo}>
                      {o.customer} • {o.woNo} ({o.partCode} - {o.color})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Work Order</label>
                  <input
                    type="text"
                    value={fpaForm.woNo}
                    onChange={e => setFpaForm({ ...fpaForm, woNo: e.target.value })}
                    className="w-full p-3 rounded-[14px] border border-[#ececec] focus:border-[#c09748] focus:outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Job Card No.</label>
                  <input
                    type="text"
                    value={fpaForm.jobCardNo}
                    onChange={e => setFpaForm({ ...fpaForm, jobCardNo: e.target.value })}
                    className="w-full p-3 rounded-[14px] border border-[#ececec] focus:border-[#c09748] focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Color / Finish</label>
                  <input
                    type="text"
                    value={fpaForm.color}
                    onChange={e => setFpaForm({ ...fpaForm, color: e.target.value })}
                    className="w-full p-3 rounded-[14px] border border-[#ececec] focus:border-[#c09748] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Ford Cup Viscosity (s)</label>
                  <input
                    type="number"
                    value={fpaForm.viscositySec}
                    onChange={e => setFpaForm({ ...fpaForm, viscositySec: Math.max(0, Number(e.target.value)) })}
                    className="w-full p-3 rounded-[14px] border border-[#ececec] focus:border-[#c09748] focus:outline-none"
                    min={0}
                    required
                  />
                </div>
              </div>

              {/* Delta-E Spectrophotometer Calculator Card */}
              <div className={`p-4 sm:p-5 rounded-[20px] border space-y-3 ${
                isDeltaEPass ? 'bg-[#faf3e0]/40 border-[#f4e5be]' : 'bg-red-50 border-red-300'
              }`}>
                <div className="flex justify-between items-center text-xs">
                  <div className="font-semibold text-[#17191c] flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-[#c09748]" />
                    Spectrophotometer ΔE
                  </div>
                  <span className={`px-3 py-1 rounded-full font-bold text-[10px] ${
                    isDeltaEPass ? 'bg-emerald-100 text-emerald-800' : 'bg-red-600 text-white'
                  }`}>
                    {isDeltaEPass ? '✓ PASS' : '🚨 REJECT'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] text-[#777b86] font-medium mb-1">L*</label>
                    <input
                      type="number"
                      step="0.01"
                      value={fpaForm.L}
                      onChange={e => setFpaForm({ ...fpaForm, L: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white font-mono focus:border-[#c09748] text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#777b86] font-medium mb-1">a*</label>
                    <input
                      type="number"
                      step="0.01"
                      value={fpaForm.a}
                      onChange={e => setFpaForm({ ...fpaForm, a: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white font-mono focus:border-[#c09748] text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#777b86] font-medium mb-1">b*</label>
                    <input
                      type="number"
                      step="0.01"
                      value={fpaForm.b}
                      onChange={e => setFpaForm({ ...fpaForm, b: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white font-mono focus:border-[#c09748] text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#777b86] font-medium mb-1">ΔE</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={fpaForm.deltaE}
                      onChange={e => setFpaForm({ ...fpaForm, deltaE: Math.max(0, Number(e.target.value)) })}
                      className="w-full p-2.5 rounded-[12px] border-2 border-[#c09748] bg-white font-mono font-bold text-xs text-[#17191c] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Adhesion Test Checkbox */}
              <div className="p-4 sm:p-5 bg-[#fafafb] border border-[#ececec] rounded-[20px] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-[#17191c]">Adhesion & Physical Testing:</div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    fpaForm.adhesionPercent === 100 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {fpaForm.adhesionPercent}%
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#777b86] font-medium mb-1">Cross-Cut Grid (ASTM 5B)</label>
                    <select
                      value={fpaForm.crossCutTest}
                      onChange={e => {
                        const val = e.target.value as 'Pass' | 'Fail';
                        const newAdhesion = (val === 'Pass' && fpaForm.tapeTest === 'Pass') ? 100 : 0;
                        setFpaForm({ ...fpaForm, crossCutTest: val, adhesionPercent: newAdhesion });
                      }}
                      className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white cursor-pointer text-xs focus:border-[#c09748] focus:outline-none"
                    >
                      <option value="Pass">Pass (100% Adhesion)</option>
                      <option value="Fail">Fail (Flaking / Peeling)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#777b86] font-medium mb-1">3M 600 Tape Pull Test</label>
                    <select
                      value={fpaForm.tapeTest}
                      onChange={e => {
                        const val = e.target.value as 'Pass' | 'Fail';
                        const newAdhesion = (fpaForm.crossCutTest === 'Pass' && val === 'Pass') ? 100 : 0;
                        setFpaForm({ ...fpaForm, tapeTest: val, adhesionPercent: newAdhesion });
                      }}
                      className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white cursor-pointer text-xs focus:border-[#c09748] focus:outline-none"
                    >
                      <option value="Pass">Pass (Zero Paint Transfer)</option>
                      <option value="Fail">Fail (Paint Lifted)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#ececec] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFpaModal(false)}
                  className="px-5 py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium cursor-pointer hover:bg-[#fafafb] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold shadow-2xs cursor-pointer transition active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-[#c09748]" />
                  <span>Submit FPA Sign-Off</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL 5: UNIVERSAL PRE-SPRAY SUBSTRATE IQC MODAL */}
      {showUniversalIqcModal && (
        <div className="fixed inset-0 z-50 bg-[#fafafb] sm:bg-white overflow-y-auto flex flex-col animate-in fade-in duration-150">
          {/* Sticky Top Header Bar */}
          <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#ececec] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
                  Pre-Spray IQC Gate
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#777b86] text-[10px] font-mono">
                  Substrate Gatekeeper
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-normal text-[#17191c]">
                Pre-Spray Substrate IQC Inspection
              </h3>
            </div>
            <button 
              type="button"
              onClick={() => setShowUniversalIqcModal(false)}
              className="w-9 h-9 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] flex items-center justify-center cursor-pointer transition active:scale-95 shadow-2xs"
              title="Close Form"
            >
              <X className="w-5 h-5 text-[#17191c]" />
            </button>
          </div>

          {/* Body Container */}
          <div className="max-w-3xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1 text-xs">
            <form onSubmit={handleUniIqcSubmit} className="space-y-5">
              <div>
                <label className="block text-[#8a6521] font-bold text-xs mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#c09748]" />
                  Select Universal Job ID:
                </label>
                <CustomSelect
                  options={universalJobs.map(j => ({
                    value: j.jobId,
                    label: `${j.jobId} • ${j.partyName} (${j.materialDescription})`,
                    badge: j.materialCategory,
                    badgeColor: j.materialCategory === 'Party Material' ? 'gold' : 'blue'
                  }))}
                  value={uniIqcForm.jobId}
                  onChange={val => {
                    const found = universalJobs.find(j => j.jobId === val);
                    setUniIqcForm(prev => ({
                      ...prev,
                      jobId: val,
                      approvedPcs: found ? (found.preSprayIQC?.approvedPcs || found.totalQuantity) : prev.approvedPcs
                    }));
                  }}
                  placeholder="Select Universal Job ID"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Substrate Approved Pcs (Allowed for Spray)</label>
                  <input
                    type="number"
                    min={0}
                    value={uniIqcForm.approvedPcs}
                    onChange={e => setUniIqcForm({ ...uniIqcForm, approvedPcs: Number(e.target.value) })}
                    className="w-full p-3 rounded-[14px] border border-[#ececec] font-mono text-sm font-bold text-emerald-800 focus:border-[#c09748] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Substrate Rejected Pcs (Raw Defect)</label>
                  <input
                    type="number"
                    min={0}
                    value={uniIqcForm.rejectedPcs}
                    onChange={e => setUniIqcForm({ ...uniIqcForm, rejectedPcs: Number(e.target.value) })}
                    className="w-full p-3 rounded-[14px] border border-[#ececec] font-mono text-sm font-bold text-red-600 focus:border-red-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#777b86] font-medium mb-1">Inspector Notes & Substrate Condition</label>
                <textarea
                  value={uniIqcForm.notes}
                  onChange={e => setUniIqcForm({ ...uniIqcForm, notes: e.target.value })}
                  rows={3}
                  className="w-full p-3 rounded-[14px] border border-[#ececec] text-xs focus:border-[#c09748] focus:outline-none"
                  placeholder="Note down substrate raw defects, surface cleanliness, transit damages, etc."
                />
              </div>

              <div className="pt-4 border-t border-[#ececec] flex justify-end gap-2">
                <button type="button" onClick={() => setShowUniversalIqcModal(false)} className="px-5 py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium cursor-pointer hover:bg-[#fafafb]">Cancel</button>
                <button type="submit" className="px-6 py-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold shadow-2xs cursor-pointer transition active:scale-95 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#c09748]" />
                  <span>Pass Pre-Spray IQC Gate</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: UNIVERSAL FINAL QA GATEKEEPER MODAL */}
      {showUniversalQaModal && (
        <div className="fixed inset-0 z-50 bg-[#fafafb] sm:bg-white overflow-y-auto flex flex-col animate-in fade-in duration-150">
          {/* Sticky Top Header Bar */}
          <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#ececec] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
                  Final QA Gate
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#777b86] text-[10px] font-mono">
                  Stage Gatekeeper
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-normal text-[#17191c]">
                Final QA Gatekeeper Sign-Off
              </h3>
            </div>
            <button 
              type="button"
              onClick={() => setShowUniversalQaModal(false)}
              className="w-9 h-9 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] flex items-center justify-center cursor-pointer transition active:scale-95 shadow-2xs"
              title="Close Form"
            >
              <X className="w-5 h-5 text-[#17191c]" />
            </button>
          </div>

          {/* Body Container */}
          <div className="max-w-3xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1 text-xs">
            <form onSubmit={handleUniQaSubmit} className="space-y-5">
              <div>
                <label className="block text-[#8a6521] font-bold text-xs mb-1.5 flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-[#c09748]" />
                  Select Universal Job ID:
                </label>
                <CustomSelect
                  options={universalJobs.map(j => ({
                    value: j.jobId,
                    label: `${j.jobId} • ${j.partyName} (${j.materialDescription})`,
                    badge: `Stage: ${j.stage}`,
                    badgeColor: j.finalQA?.overallStatus === 'Approved' ? 'emerald' : 'gold'
                  }))}
                  value={uniQaForm.jobId}
                  onChange={val => {
                    const found = universalJobs.find(j => j.jobId === val);
                    setUniQaForm(prev => ({
                      ...prev,
                      jobId: val,
                      finalPassedQty: found ? (found.finalQA?.passedQty || found.preSprayIQC?.approvedPcs || found.totalQuantity) : prev.finalPassedQty
                    }));
                  }}
                  placeholder="Select Universal Job ID"
                />
              </div>

              {/* Colorimetry & Adhesion parameters */}
              <div className="p-4 sm:p-5 bg-[#faf3e0]/40 border border-[#f4e5be] rounded-[20px] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#17191c]">QA Gate Criteria Verification:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    uniQaForm.deltaE <= 0.70 && uniQaForm.adhesionPass
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}>
                    {uniQaForm.deltaE <= 0.70 && uniQaForm.adhesionPass ? '✓ QA GATE PASSED' : '🚨 QA REJECTED'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-[#777b86] font-medium mb-1">Spectrophotometer ΔE (Target ≤ 0.70)</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={uniQaForm.deltaE}
                      onChange={e => setUniQaForm({ ...uniQaForm, deltaE: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-[12px] border-2 border-[#c09748] bg-white font-mono font-bold text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#777b86] font-medium mb-1">ASTM 5B Cross-Cut Adhesion</label>
                    <select
                      value={uniQaForm.adhesionPass ? 'Pass' : 'Fail'}
                      onChange={e => setUniQaForm({ ...uniQaForm, adhesionPass: e.target.value === 'Pass' })}
                      className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white text-xs font-bold cursor-pointer"
                    >
                      <option value="Pass">Pass (100% Cross-Cut Grid)</option>
                      <option value="Fail">Fail (Paint Flaking / Lift)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[#777b86] font-medium mb-1">Final Passed Qty (Approved for Billing)</label>
                <input
                  type="number"
                  min={0}
                  value={uniQaForm.finalPassedQty}
                  onChange={e => setUniQaForm({ ...uniQaForm, finalPassedQty: Number(e.target.value) })}
                  className="w-full p-3 rounded-[14px] border border-[#ececec] font-mono text-sm font-bold text-emerald-800 focus:border-[#c09748] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[#777b86] font-medium mb-1">QA Engineer Certificate Remarks</label>
                <textarea
                  value={uniQaForm.notes}
                  onChange={e => setUniQaForm({ ...uniQaForm, notes: e.target.value })}
                  rows={3}
                  className="w-full p-3 rounded-[14px] border border-[#ececec] text-xs focus:border-[#c09748] focus:outline-none"
                  placeholder="Enter QA inspection verification remarks..."
                />
              </div>

              <div className="pt-4 border-t border-[#ececec] flex justify-end gap-2">
                <button type="button" onClick={() => setShowUniversalQaModal(false)} className="px-5 py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium cursor-pointer hover:bg-[#fafafb]">Cancel</button>
                <button type="submit" className="px-6 py-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold shadow-2xs cursor-pointer transition active:scale-95 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#c09748]" />
                  <span>Authorize QA Gate Release</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: MASTER IQC INSPECTION & VERIFICATION MODAL (MULTI-STEP WIZARD) */}
      {showMasterIqcModal && (
        <div className="fixed inset-0 z-50 bg-[#fafafb] sm:bg-white overflow-y-auto flex flex-col animate-in fade-in duration-150">
          {/* Sticky Top Header Bar */}
          <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#ececec] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
                  IQC Inspection
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#777b86] text-[10px] font-mono">
                  PK-QA-IQC-001
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-normal text-[#17191c]">
                Incoming Quality Control (IQC) Inspection
              </h3>
            </div>
            <button 
              type="button"
              onClick={() => setShowMasterIqcModal(false)}
              className="w-9 h-9 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] flex items-center justify-center cursor-pointer transition active:scale-95 shadow-2xs"
              title="Close Form"
            >
              <X className="w-5 h-5 text-[#17191c]" />
            </button>
          </div>

          {/* Body Container */}
          <div className="max-w-4xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1 text-xs">
            <div className="text-center space-y-1 pb-1">
              <p className="text-xs text-[#777b86]">
                Verify incoming materials from <span className="font-semibold text-[#17191c]">{masterIqcForm.vendorCustomer}</span> against Challan #{masterIqcForm.invoiceChallanNo}
              </p>
            </div>

            {/* Step Stepper Indicator (Plain & Simple Connected Pills matching Inward Form) */}
            <div className="flex items-center gap-1.5 sm:gap-3 py-2 border-b border-[#f0f0f2] mb-3 sm:mb-5 overflow-x-auto no-scrollbar justify-start sm:justify-center w-full px-1">
              {/* Step 1 Pill */}
              <button
                type="button"
                onClick={() => setIqcModalStep(1)}
                className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 sm:gap-2 border shrink-0 ${
                  iqcModalStep === 1
                    ? 'border-[#c09748] text-[#17191c] bg-[#fafafb] shadow-2xs'
                    : 'border-[#dcdfe4] text-[#777b86] hover:border-gray-400'
                }`}
              >
                <span className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full text-[9px] sm:text-[10px] font-bold flex items-center justify-center shrink-0 ${
                  iqcModalStep === 1 ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]' : 'bg-gray-100 text-[#777b86]'
                }`}>
                  1
                </span>
                <span className="truncate">
                  <span className="hidden sm:inline">Materials</span><span className="sm:hidden">Items</span> ({masterIqcForm.verifiedItems.length})
                </span>
              </button>

              <div className="w-3 sm:w-8 h-px bg-[#dcdfe4] shrink-0" />

              {/* Step 2 Pill */}
              <button
                type="button"
                onClick={handleStep1Next}
                className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 sm:gap-2 border shrink-0 ${
                  iqcModalStep === 2
                    ? 'border-[#c09748] text-[#17191c] bg-[#fafafb] shadow-2xs'
                    : 'border-[#dcdfe4] text-[#777b86] hover:border-gray-400'
                }`}
              >
                <span className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full text-[9px] sm:text-[10px] font-bold flex items-center justify-center shrink-0 ${
                  iqcModalStep === 2 ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]' : 'bg-gray-100 text-[#777b86]'
                }`}>
                  2
                </span>
                <span className="truncate">
                  <span className="hidden sm:inline">Quality Aspects</span><span className="sm:hidden">Aspects</span> ({masterIqcForm.aspects.length})
                </span>
              </button>

              <div className="w-3 sm:w-8 h-px bg-[#dcdfe4] shrink-0" />

              {/* Step 3 Pill */}
              <button
                type="button"
                onClick={() => {
                  if (iqcModalStep === 1) handleStep1Next();
                  else setIqcModalStep(3);
                }}
                className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 sm:gap-2 border shrink-0 ${
                  iqcModalStep === 3
                    ? 'border-[#c09748] text-[#17191c] bg-[#fafafb] shadow-2xs'
                    : 'border-[#dcdfe4] text-[#777b86] hover:border-gray-400'
                }`}
              >
                <span className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full text-[9px] sm:text-[10px] font-bold flex items-center justify-center shrink-0 ${
                  iqcModalStep === 3 ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]' : 'bg-gray-100 text-[#777b86]'
                }`}>
                  3
                </span>
                <span className="truncate">
                  <span className="hidden sm:inline">20% Sampling & CAPA</span><span className="sm:hidden">Sampling</span>
                </span>
              </button>
            </div>

            {/* Validation Error Banner */}
            {iqcFormError && (
              <div className="p-2.5 sm:p-3 rounded-[10px] bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 mb-3 sm:mb-4">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{iqcFormError}</span>
              </div>
            )}

            <form onSubmit={handleMasterIqcSubmit} className="space-y-4 sm:space-y-5">
              {/* ================================================================ */}
              {/* STEP 1: INWARD METADATA & MATERIAL ITEMS INTAKE VERIFICATION      */}
              {/* ================================================================ */}
              {iqcModalStep === 1 && (
                <div className="space-y-3.5 sm:space-y-4 animate-in fade-in duration-100">
                  {/* Step Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] sm:text-[11px] font-medium text-[#777b86] block">Step 1</span>
                      <h3 className="text-xs sm:text-sm font-bold text-[#17191c]">Inward Reference & Physical Quantity Intake</h3>
                    </div>
                  </div>

                  {/* Clean Inward Reference Summary Card */}
                  <div className="p-3.5 sm:p-4 rounded-[14px] bg-[#fafafb] border border-[#cbd0d8] shadow-xs sm:shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-[#777b86] uppercase font-semibold block mb-0.5">Supplier / Party</span>
                      <strong className="text-[#17191c] truncate block font-semibold">{masterIqcForm.vendorCustomer}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#777b86] uppercase font-semibold block mb-0.5">Challan No & Date</span>
                      <span className="font-mono text-[#17191c] font-semibold">{masterIqcForm.invoiceChallanNo}</span>
                      <span className="text-[10px] text-[#777b86] block">({formatDateDDMMYYYY(masterIqcForm.invoiceChallanDate)})</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#777b86] uppercase font-semibold block mb-0.5">Vehicle Number</span>
                      <span className="font-mono text-[#17191c] font-semibold">{selectedInwardForIqc?.vehicleNo || 'At Gate'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#777b86] uppercase font-semibold block mb-0.5">Total Inward Qty</span>
                      <span className="font-mono font-bold text-[#c09748] text-xs sm:text-sm">
                        {masterIqcForm.invQuantity.toLocaleString()} {masterIqcForm.uom}
                      </span>
                    </div>
                  </div>

                  {/* Editable Batch / Lot No, Report No & Inspection Date */}
                  <div className="p-3.5 sm:p-4 rounded-[14px] bg-white border border-[#cbd0d8] shadow-xs sm:shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] text-[#777b86] font-semibold uppercase tracking-wider mb-1">
                        Report Number
                      </label>
                      <input
                        type="text"
                        value={masterIqcForm.reportNo}
                        onChange={e => setMasterIqcForm(prev => ({ ...prev, reportNo: e.target.value }))}
                        className="w-full h-9 px-3 rounded-[8px] border border-[#dcdfe4] bg-[#fafafb] font-mono font-semibold text-xs text-[#17191c] focus:outline-none focus:border-[#17191c] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#777b86] font-semibold uppercase tracking-wider mb-1">
                        Batch / Lot No. <span className="text-[#c09748]">*</span>
                      </label>
                      <input
                        type="text"
                        value={masterIqcForm.batchNo}
                        onChange={e => setMasterIqcForm(prev => ({ ...prev, batchNo: e.target.value }))}
                        placeholder="e.g. B-99824-01 / Vendor Lot #"
                        className="w-full h-9 px-3 rounded-[8px] border border-[#dcdfe4] bg-white font-mono font-semibold text-xs text-[#17191c] focus:outline-none focus:border-[#c09748] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#777b86] font-semibold uppercase tracking-wider mb-1">
                        Inspection Date
                      </label>
                      <PaintkingDatePicker
                        value={masterIqcForm.inspectionDate}
                        onChange={val => setMasterIqcForm(prev => ({ ...prev, inspectionDate: val }))}
                        placeholder="DD-MM-YYYY"
                      />
                    </div>
                  </div>

                  {/* Section Title */}
                  <div className="pt-0.5">
                    <h4 className="font-semibold text-[#17191c] text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-[#c09748]" />
                      <span>Security Inward Line Items Verification ({masterIqcForm.verifiedItems.length} Materials)</span>
                    </h4>
                  </div>

                  {/* Line Items Checklist Cards */}
                  <div className="space-y-2.5">
                    {masterIqcForm.verifiedItems.map((item, idx) => {
                      const isFullMatch = item.shortageQty === 0 && item.actualQty === item.challanQty;
                      const hasDiscrepancy = item.shortageQty > 0 || item.actualQty !== item.challanQty;

                      return (
                        <div 
                          key={item.id || idx}
                          className={`p-3.5 sm:p-4 rounded-[14px] border transition-all space-y-3 ${
                            hasDiscrepancy
                              ? 'bg-amber-50/20 border-amber-300 shadow-sm'
                              : 'bg-white border-[#cbd0d8] shadow-xs sm:shadow-sm'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            {/* Material Name & Index */}
                            <div className="flex items-start gap-2.5 flex-1 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <h5 className="font-bold text-xs text-[#17191c] truncate">{item.materialName}</h5>
                                <div className="text-[11px] text-[#777b86] flex items-center gap-2 mt-0.5">
                                  <span>Challan Qty: <strong className="font-mono text-[#17191c] font-semibold">{item.challanQty} {item.unit}</strong></span>
                                </div>
                              </div>
                            </div>

                            {/* 2 Verification Action Buttons */}
                            <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 shrink-0 w-full sm:w-auto">
                              <button
                                type="button"
                                onClick={() => handleItemMarkFullMatch(item.id)}
                                className={`px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
                                  isFullMatch
                                    ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] font-bold shadow-2xs'
                                    : 'bg-[#fafafb] hover:bg-[#f2f2f3] text-[#777b86] hover:text-[#17191c] border border-[#dcdfe4]'
                                }`}
                              >
                                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isFullMatch ? 'text-[#c09748]' : 'text-[#777b86]'}`} />
                                <span className="truncate">✓ Match ({item.challanQty})</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleItemMarkMismatch(item.id)}
                                className={`px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
                                  hasDiscrepancy
                                    ? 'bg-amber-50 text-amber-900 border border-amber-300 ring-1 ring-amber-200 font-bold shadow-2xs'
                                    : 'bg-[#fafafb] hover:bg-[#f2f2f3] text-[#777b86] hover:text-[#17191c] border border-[#dcdfe4]'
                                }`}
                              >
                                <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${hasDiscrepancy ? 'text-amber-600' : 'text-[#777b86]'}`} />
                                <span className="truncate">Flag Shortage</span>
                              </button>
                            </div>
                          </div>

                          {/* Inputs: Physical Count & Shortage Badge */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-[#ececec]">
                            <div>
                              <label className="block text-[10px] text-[#777b86] font-semibold uppercase tracking-wider mb-1">
                                Physical Received Qty <span className="text-[#17191c]">*</span>
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min={0}
                                  value={item.actualQty}
                                  onChange={e => handleItemActualQtyChange(item.id, Number(e.target.value))}
                                  placeholder="Kitne mile? Type karein"
                                  className={`w-full h-9 px-3 pr-12 rounded-[8px] border bg-white font-mono font-bold text-xs text-[#17191c] focus:outline-none transition-colors ${
                                    hasDiscrepancy 
                                      ? 'border-amber-400 focus:border-amber-600 ring-1 ring-amber-200' 
                                      : 'border-[#dcdfe4] focus:border-[#17191c]'
                                  }`}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#777b86] font-medium pointer-events-none">
                                  {item.unit}
                                </span>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] text-[#777b86] font-semibold uppercase tracking-wider mb-1">
                                Shortage / Excess Status
                              </label>
                              <div className={`h-9 px-3 rounded-[8px] flex items-center justify-center font-mono font-bold text-xs border ${
                                item.shortageQty > 0
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-[#faf3e0] text-[#8a6521] border-[#f4e5be]'
                              }`}>
                                {item.shortageQty > 0 
                                  ? `-${item.shortageQty} ${item.unit} SHORT` 
                                  : '✓ Match (Nil Shortage)'}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Consolidated Verification Totals */}
                  <div className="p-3 sm:p-3.5 rounded-[12px] bg-[#fafafb] border border-[#ececec] grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div>
                      <span className="text-[10px] text-[#777b86] font-medium block mb-0.5">Total Line Items</span>
                      <strong className="font-mono text-[#17191c] text-xs sm:text-sm">{masterIqcForm.verifiedItems.length} Materials</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#777b86] font-medium block mb-0.5">Total Challan Qty</span>
                      <strong className="font-mono text-[#17191c] text-xs sm:text-sm">{masterIqcForm.invQuantity.toLocaleString()} {masterIqcForm.uom}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#777b86] font-medium block mb-0.5">Total Physical Count</span>
                      <strong className="font-mono text-[#8a6521] text-xs sm:text-sm">{masterIqcForm.actualReceived.toLocaleString()} {masterIqcForm.uom}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#777b86] font-medium block mb-0.5">Total Shortage</span>
                      <strong className={`font-mono text-xs sm:text-sm ${masterIqcForm.shortageQty > 0 ? 'text-rose-600' : 'text-[#8a6521]'}`}>
                        {masterIqcForm.shortageQty > 0 ? `-${masterIqcForm.shortageQty} Short` : '✓ Nil Shortage'}
                      </strong>
                    </div>
                  </div>

                  {/* Discrepancy Alert Banner to Production Manager */}
                  {masterIqcForm.hasDiscrepancy && (
                    <div className="p-3.5 bg-red-50 border border-red-200 rounded-[12px] flex items-start gap-3 animate-in fade-in duration-150">
                      <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-red-800 text-xs">
                            🚨 DISCREPANCY DETECTED: Automatic Alert sent to Production Manager!
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                            Hold for Review
                          </span>
                        </div>
                        <p className="text-[11px] text-red-700 leading-relaxed">
                          {masterIqcForm.shortageQty > 0 ? `Shortage of ${masterIqcForm.shortageQty} ${masterIqcForm.uom} identified. ` : ''}
                          Production Manager has been flagged for vendor debit note & shortage sign-off.
                        </p>
                        <input
                          type="text"
                          placeholder="Add specific discrepancy note for Production Manager..."
                          value={masterIqcForm.productionManagerNote}
                          onChange={e => setMasterIqcForm({ ...masterIqcForm, productionManagerNote: e.target.value })}
                          className="w-full h-8.5 px-3 rounded-[8px] bg-white border border-red-200 text-xs text-red-900 placeholder:text-red-300 focus:outline-none focus:border-red-400"
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 1 Footer Navigation */}
                  <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 pt-3 sm:pt-4 border-t border-[#ececec]">
                    <button
                      type="button"
                      onClick={() => setShowMasterIqcModal(false)}
                      className="w-full sm:w-auto px-4 py-2 rounded-full border border-[#dcdfe4] text-xs font-semibold text-[#777b86] hover:bg-gray-50 cursor-pointer transition active:scale-95 text-center"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleStep1Next}
                      className="w-full sm:w-auto px-6 py-2 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <span>Continue to Quality Aspects (Step 2)</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#c09748]" />
                    </button>
                  </div>
                </div>
              )}

              {/* ================================================================ */}
              {/* STEP 2: DYNAMIC QUALITY ASPECTS & METHOD / INSTRUMENT CHECKLIST   */}
              {/* ================================================================ */}
              {iqcModalStep === 2 && (
                <div className="space-y-3.5 sm:space-y-4 animate-in fade-in duration-100">
                  {/* Step Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#f0f0f2]">
                    <div>
                      <span className="text-[10px] sm:text-[11px] font-medium text-[#777b86] block">Step 2</span>
                      <h3 className="text-xs sm:text-sm font-bold text-[#17191c]">Quality Inspection Aspects & Parameters ({masterIqcForm.aspects.length})</h3>
                      <p className="text-[11px] text-[#777b86] mt-0.5">
                        Parameters, measurement methods/instruments, impact level, aur Pass/Fail status set karein.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-nowrap self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={handleMarkAllAspectsCompliant}
                        className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-full border border-[#dcdfe4] bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[11px] sm:text-xs font-semibold text-[#17191c] transition cursor-pointer shadow-2xs active:scale-95 shrink-0"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#c09748] shrink-0" />
                        <span>Mark All Compliant</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAddCustomAspect()}
                        className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-full border border-[#dcdfe4] bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[11px] sm:text-xs font-semibold text-[#17191c] transition cursor-pointer shadow-2xs active:scale-95 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#c09748] shrink-0" />
                        <span>Add Aspect</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Preset Chips with Suitable Method & Impact */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[11px]">
                    <span className="text-[10px] text-[#777b86] font-medium shrink-0">Quick Presets:</span>
                    <button
                      type="button"
                      onClick={() => handleAddCustomAspect({
                        aspect: 'Surface Cleanliness (ASTM F22)',
                        methodOfMeasurement: 'Solvent Wipe / Water Break Free Test',
                        impact: 'Major'
                      })}
                      className="px-2.5 py-1 rounded-full bg-[#fafafb] text-[#17191c] border border-[#dcdfe4] hover:bg-[#f2f2f3] text-[10px] font-semibold cursor-pointer transition shrink-0"
                    >
                      + Surface Cleanliness (ASTM F22)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddCustomAspect({
                        aspect: 'Critical Dimensions & Snap Locks',
                        methodOfMeasurement: 'Digital Vernier Caliper (±0.05mm)',
                        impact: 'Critical'
                      })}
                      className="px-2.5 py-1 rounded-full bg-[#fafafb] text-[#17191c] border border-[#dcdfe4] hover:bg-[#f2f2f3] text-[10px] font-semibold cursor-pointer transition shrink-0"
                    >
                      + Dimensions (Caliper)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddCustomAspect({
                        aspect: 'Certificate of Conformance (CoC)',
                        methodOfMeasurement: 'Supplier Test Certificate Verification',
                        impact: 'Major'
                      })}
                      className="px-2.5 py-1 rounded-full bg-[#fafafb] text-[#17191c] border border-[#dcdfe4] hover:bg-[#f2f2f3] text-[10px] font-semibold cursor-pointer transition shrink-0"
                    >
                      + CoC / Mill TC
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddCustomAspect({
                        aspect: 'Raw Substrate Surface Gloss',
                        methodOfMeasurement: '60° Glossmeter (ASTM D523)',
                        impact: 'Minor'
                      })}
                      className="px-2.5 py-1 rounded-full bg-[#fafafb] text-[#17191c] border border-[#dcdfe4] hover:bg-[#f2f2f3] text-[10px] font-semibold cursor-pointer transition shrink-0"
                    >
                      + Substrate Gloss
                    </button>
                  </div>

                  {/* Dynamic Parameters List (With Name, Method/Instrument, Impact & Trash on EVERY Row) */}
                  <div className="space-y-2.5">
                    {masterIqcForm.aspects.map((asp) => {
                      const isPass = asp.result.startsWith('Pass');
                      const isFail = asp.result.startsWith('Fail') || asp.result.startsWith('Short');

                      return (
                        <div 
                          key={asp.srNo} 
                          className={`p-3.5 sm:p-4 rounded-[14px] border transition-all space-y-2.5 ${
                            isFail 
                              ? 'bg-rose-50/20 border-rose-300 shadow-sm' 
                              : 'bg-white border-[#cbd0d8] shadow-xs sm:shadow-sm'
                          }`}
                        >
                          {/* Row 1: Index + Aspect Name + Pass/Fail + Delete */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] font-bold text-[10px] flex items-center justify-center shrink-0">
                                {asp.srNo}
                              </span>

                              <input
                                type="text"
                                value={asp.aspect}
                                onChange={e => handleUpdateAspectName(asp.srNo, e.target.value)}
                                placeholder="Aspect / Parameter Name *"
                                className="w-full h-8.5 px-3 rounded-[8px] border border-[#dcdfe4] bg-white font-semibold text-xs text-[#17191c] placeholder:text-gray-400 focus:outline-none focus:border-[#17191c] transition"
                              />
                            </div>

                            {/* Pass / Fail / Trash Action Controls */}
                            <div className="flex items-center justify-end gap-1.5 shrink-0 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={() => toggleAspectResult(asp.srNo, 'Pass')}
                                className={`px-3 py-1.5 rounded-full font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 ${
                                  isPass
                                    ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] font-bold shadow-2xs'
                                    : 'bg-[#fafafb] text-[#777b86] hover:bg-[#f2f2f3] hover:text-[#17191c] border border-[#dcdfe4]'
                                }`}
                              >
                                <CheckCircle2 className={`w-3.5 h-3.5 ${isPass ? 'text-[#8a6521]' : 'text-[#777b86]'}`} />
                                <span>Pass</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => toggleAspectResult(asp.srNo, 'Fail')}
                                className={`px-3 py-1.5 rounded-full font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 ${
                                  isFail
                                    ? 'bg-rose-50 text-rose-800 border border-rose-300 ring-1 ring-rose-200 font-bold shadow-2xs'
                                    : 'bg-[#fafafb] text-[#777b86] hover:bg-[#f2f2f3] hover:text-rose-700 border border-[#dcdfe4]'
                                }`}
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Fail</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRemoveAspect(asp.srNo)}
                                disabled={masterIqcForm.aspects.length <= 1}
                                className={`p-1.5 rounded-full transition cursor-pointer shrink-0 ${
                                  masterIqcForm.aspects.length <= 1
                                    ? 'opacity-30 cursor-not-allowed text-gray-400'
                                    : 'text-gray-400 hover:text-rose-600 hover:bg-rose-50'
                                }`}
                                title="Aspect hatayein (Remove non-applicable)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Row 2: Method / Tool Input & Redesigned Custom Impact Dropdown */}
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1 border-t border-[#f0f0f2]">
                            <div className="sm:col-span-7">
                              <label className="block text-[10px] text-[#777b86] font-semibold uppercase tracking-wider mb-1">
                                Method of Measurement & Instrument / Tool
                              </label>
                              <input
                                type="text"
                                value={asp.methodOfMeasurement || ''}
                                onChange={e => handleUpdateAspectMethod(asp.srNo, e.target.value)}
                                placeholder="e.g. Cross-Cut & Tape Test / Digital Caliper / Visual"
                                className="w-full h-8.5 px-3 rounded-[8px] border border-[#dcdfe4] bg-white text-xs text-[#17191c] placeholder:text-gray-400 focus:outline-none focus:border-[#17191c] transition"
                              />
                            </div>

                            <div className="sm:col-span-5 relative">
                              <label className="block text-[10px] text-[#777b86] font-semibold uppercase tracking-wider mb-1">
                                Impact Level
                              </label>
                              <button
                                type="button"
                                onClick={() => setOpenImpactDropdown(openImpactDropdown === asp.srNo ? null : asp.srNo)}
                                className="w-full h-8.5 px-2.5 rounded-[8px] border border-[#dcdfe4] bg-white text-xs font-semibold text-[#17191c] flex items-center justify-between hover:border-[#17191c] focus:outline-none transition cursor-pointer"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                                    asp.impact === 'Critical' ? 'bg-rose-500' : asp.impact === 'Minor' ? 'bg-[#777b86]' : 'bg-[#c09748]'
                                  }`} />
                                  <span className="truncate">
                                    {asp.impact || 'Major'} ({asp.impact === 'Critical' ? 'Lot Fail' : asp.impact === 'Minor' ? 'Cosmetic' : 'Functional'})
                                  </span>
                                </div>
                                <ChevronDown className={`w-3.5 h-3.5 text-[#777b86] shrink-0 transition-transform ${openImpactDropdown === asp.srNo ? 'rotate-180' : ''}`} />
                              </button>

                              {/* Custom Redesigned Dropdown Popover */}
                              {openImpactDropdown === asp.srNo && (
                                <div className="absolute top-full right-0 left-0 sm:w-64 mt-1 z-30 bg-white rounded-[12px] border border-[#ececec] shadow-xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                                  {[
                                    { val: 'Critical', label: 'Critical (Lot Fail Impact)', color: 'bg-rose-500', desc: 'Immediate batch return risk' },
                                    { val: 'Major', label: 'Major (Functional Quality)', color: 'bg-[#c09748]', desc: 'Core specifications & fitment' },
                                    { val: 'Minor', label: 'Minor (Cosmetic / Visual)', color: 'bg-[#777b86]', desc: 'Surface aesthetic & packing' }
                                  ].map(lvl => (
                                    <button
                                      key={lvl.val}
                                      type="button"
                                      onClick={() => {
                                        handleUpdateAspectImpact(asp.srNo, lvl.val as any);
                                        setOpenImpactDropdown(null);
                                      }}
                                      className={`w-full px-2.5 py-1.5 text-left text-xs rounded-[8px] flex items-center justify-between transition cursor-pointer ${
                                        asp.impact === lvl.val
                                          ? 'bg-[#fafafb] text-[#17191c] font-bold border border-[#ececec]'
                                          : 'text-[#777b86] hover:bg-[#fafafb] hover:text-[#17191c]'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${lvl.color}`} />
                                        <div>
                                          <div className="font-semibold text-xs text-[#17191c]">{lvl.label}</div>
                                          <div className="text-[10px] text-[#777b86]">{lvl.desc}</div>
                                        </div>
                                      </div>
                                      {asp.impact === lvl.val && (
                                        <Check className="w-3.5 h-3.5 text-[#c09748] shrink-0" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Defect Observation if Fail */}
                          {isFail && (
                            <div className="pt-1.5 border-t border-red-100 flex items-center gap-2 animate-in fade-in duration-100">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                              <input
                                type="text"
                                value={asp.observation || ''}
                                onChange={e => handleUpdateAspectObservation(asp.srNo, e.target.value)}
                                placeholder="Defect observation note likhein (e.g. Peeling off on 3M tape test, scratches on surface)..."
                                className="flex-1 h-8 px-2.5 text-xs rounded-[8px] border border-red-200 bg-white text-red-900 placeholder:text-red-300 focus:outline-none focus:border-red-400"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Step 2 Footer Navigation */}
                  <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 pt-3 sm:pt-4 border-t border-[#ececec]">
                    <button
                      type="button"
                      onClick={() => setIqcModalStep(1)}
                      className="w-full sm:w-auto px-4 py-2 rounded-full border border-[#dcdfe4] text-xs font-semibold text-[#777b86] hover:bg-gray-50 cursor-pointer flex items-center justify-center gap-1.5 transition active:scale-95"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Back to Step 1</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIqcModalStep(3)}
                      className="w-full sm:w-auto px-6 py-2 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <span>Continue to 20% Sampling (Step 3)</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#c09748]" />
                    </button>
                  </div>
                </div>
              )}

              {/* ================================================================ */}
              {/* STEP 3: 20% SAMPLING RULE, 1% BATCH REJECTION & DUAL SIGN-OFF   */}
              {/* ================================================================ */}
              {iqcModalStep === 3 && (
                <div className="space-y-3.5 sm:space-y-4 animate-in fade-in duration-100">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#f0f0f2]">
                    <div>
                      <span className="text-[10px] sm:text-[11px] font-medium text-[#777b86] block">Step 3</span>
                      <h3 className="text-xs sm:text-sm font-bold text-[#17191c]">20% Sampling Inspection & Batch Disposition</h3>
                      <p className="text-[11px] text-[#777b86] mt-0.5">
                        20% sample inspection rule: agar 1% se zyada rejection hoti hai, poora consignment vendor return mark hoga.
                      </p>
                    </div>

                    <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] shrink-0">
                      20% Sample • 1% Limit
                    </span>
                  </div>

                  {/* Summary Bar across all materials */}
                  <div className="p-3 sm:p-3.5 rounded-[12px] bg-[#fafafb] border border-[#ececec] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
                      <div>
                        <span className="text-[#777b86] text-[10px] uppercase font-bold block">Materials</span>
                        <span className="font-bold text-[#17191c]">{masterIqcForm.verifiedItems.length} Types</span>
                      </div>
                      <div>
                        <span className="text-[#777b86] text-[10px] uppercase font-bold block">Total Received</span>
                        <span className="font-mono font-bold text-[#17191c]">{masterIqcForm.actualReceived} {masterIqcForm.uom}</span>
                      </div>
                      <div>
                        <span className="text-[#777b86] text-[10px] uppercase font-bold block">20% Sample Size</span>
                        <span className="font-mono font-bold text-[#c09748]">{masterIqcForm.sampleSize} Units</span>
                      </div>
                      <div>
                        <span className="text-[#777b86] text-[10px] uppercase font-bold block">Rejections</span>
                        <span className={`font-mono font-bold ${masterIqcForm.rejectQty > 0 ? 'text-rose-700' : 'text-[#17191c]'}`}>
                          {masterIqcForm.rejectQty} Units
                        </span>
                      </div>
                      <div>
                        <span className="text-[#777b86] text-[10px] uppercase font-bold block">Reject Rate</span>
                        <span className={`font-mono font-bold ${
                          masterIqcForm.rejectionPercent >= 1.0 ? 'text-rose-700' : masterIqcForm.rejectionPercent > 0 ? 'text-amber-800' : 'text-[#17191c]'
                        }`}>
                          {masterIqcForm.rejectionPercent}%
                        </span>
                      </div>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase shrink-0 border ${
                      masterIqcForm.status === 'Accepted'
                        ? 'bg-[#faf3e0] text-[#8a6521] border-[#f4e5be]'
                        : masterIqcForm.status === 'Hold'
                        ? 'bg-amber-50 text-amber-900 border-amber-200'
                        : 'bg-rose-50 text-rose-900 border-rose-200'
                    }`}>
                      {masterIqcForm.status === 'Accepted' ? '✓ Batch Accepted' : `Lot ${masterIqcForm.status}`}
                    </span>
                  </div>

                  {/* 1% Strict Batch Rejection Alert Banner */}
                  {masterIqcForm.rejectionPercent >= 1.0 ? (
                    <div className="p-3.5 rounded-[12px] bg-rose-50/60 border border-rose-200 text-rose-900 text-xs flex items-start gap-3 animate-in fade-in duration-100 shadow-xs">
                      <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold text-rose-900 block text-xs sm:text-sm">
                          1% Rejection Limit Exceeded (Defect Rate: {masterIqcForm.rejectionPercent}% ≥ 1.0%)
                        </strong>
                        <p className="text-[11px] text-rose-800 mt-1 leading-relaxed">
                          20% sample inspection me 1% se zyada defect identify hua hai. Poora consignment <strong>REJECTED (Return to Vendor)</strong> mark ho gaya hai. Stores GRN par ye hold rahega.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-[12px] bg-[#fafafb] border border-[#ececec] text-[#17191c] text-xs flex items-center gap-2 shadow-xs">
                      <CheckCircle2 className="w-4 h-4 text-[#c09748] shrink-0" />
                      <span>
                        <strong className="font-bold">Quality Standard Verified:</strong> Sample defect rate ({masterIqcForm.rejectionPercent}%) is within allowable &lt; 1.0% limit. Material cleared for Stores GRN.
                      </span>
                    </div>
                  )}

                  {/* Individual Material Sampling Cards */}
                  <div className="space-y-2.5">
                    {masterIqcForm.verifiedItems.map((item, idx) => {
                      const sampleSize = item.sampleSize || Math.max(1, Math.ceil(item.actualQty * 0.20));
                      const rejectQty = item.rejectQty || 0;
                      const passQty = Math.max(0, sampleSize - rejectQty);
                      const rejectPercent = Number(((rejectQty / sampleSize) * 100).toFixed(2));
                      const isItemFail = rejectPercent >= 1.0;

                      return (
                        <div 
                          key={item.id || idx}
                          className={`p-3.5 sm:p-4 rounded-[14px] border transition-all ${
                            isItemFail 
                              ? 'bg-rose-50/20 border-rose-300 shadow-sm' 
                              : 'bg-white border-[#cbd0d8] shadow-xs sm:shadow-sm'
                          }`}
                        >
                          {/* Item Header */}
                          <div className="flex items-center justify-between gap-2.5 pb-2 border-b border-[#f0f0f2]">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] font-bold text-[10px] flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <h5 className="font-bold text-xs text-[#17191c] truncate">
                                  {item.materialName}
                                </h5>
                                <span className="text-[11px] text-[#777b86]">
                                  Actual: <strong className="text-[#17191c]">{item.actualQty} {item.unit}</strong> • 20% Sample: <strong className="text-[#8a6521]">{sampleSize} {item.unit}</strong>
                                </span>
                              </div>
                            </div>

                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase shrink-0 ${
                              isItemFail 
                                ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                                : 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]'
                            }`}>
                              {isItemFail ? `${rejectQty} Rejects (${rejectPercent}%)` : 'Sample Pass'}
                            </span>
                          </div>

                          {/* 4-Column Stats Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                            <div>
                              <label className="block text-[10px] text-[#777b86] font-medium mb-1">
                                Sample Size (20%) <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={item.actualQty || 999999}
                                value={sampleSize}
                                onChange={e => handleItemSamplingChange(item.id, Number(e.target.value), rejectQty, item.defectDetail)}
                                className="w-full h-8.5 px-2.5 rounded-[8px] bg-white border border-[#dcdfe4] font-mono text-xs font-bold text-[#17191c] focus:border-[#17191c] focus:outline-none"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] text-[#777b86] font-medium mb-1">
                                Sample Passed Qty
                              </label>
                              <div className="w-full h-8.5 px-2.5 rounded-[8px] bg-[#faf3e0] border border-[#f4e5be] font-mono text-xs font-bold text-[#8a6521] flex items-center">
                                {passQty} {item.unit}
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] text-[#777b86] font-medium mb-1">
                                Sample Rejected Qty <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={sampleSize}
                                value={rejectQty}
                                onChange={e => handleItemSamplingChange(item.id, sampleSize, Number(e.target.value), item.defectDetail)}
                                className={`w-full h-8.5 px-2.5 rounded-[8px] bg-white border font-mono text-xs font-bold focus:outline-none ${
                                  rejectQty > 0 ? 'border-rose-400 text-rose-600' : 'border-[#dcdfe4] text-[#17191c]'
                                }`}
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] text-[#777b86] font-medium mb-1">
                                Rejection Rate (%)
                              </label>
                              <div className={`w-full h-8.5 px-2.5 rounded-[8px] font-mono text-xs font-bold border flex items-center justify-between ${
                                rejectPercent >= 1.0
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : rejectPercent > 0
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-[#faf3e0] text-[#8a6521] border-[#f4e5be]'
                              }`}>
                                <span>{rejectPercent}%</span>
                                <span className="text-[9px] font-normal">
                                  {rejectPercent >= 1.0 ? '≥1% Fail' : 'Pass'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Defect / Observation Detail Input */}
                          <div className="pt-1.5">
                            <input
                              type="text"
                              value={item.defectDetail || ''}
                              onChange={e => handleItemSamplingChange(item.id, sampleSize, rejectQty, e.target.value)}
                              placeholder={`Observations for ${item.materialName} (e.g. Nil defects / Minor scuffs on ${rejectQty} pcs)...`}
                              className="w-full h-8 px-2.5 rounded-[8px] bg-[#fafafb] border border-[#ececec] text-xs text-[#17191c] placeholder:text-gray-400 focus:bg-white focus:border-[#17191c] focus:outline-none transition"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* CAPA & Quality Disposition */}
                  <div className="p-3.5 sm:p-4 rounded-[14px] bg-white border border-[#cbd0d8] shadow-xs sm:shadow-sm space-y-2.5">
                    <h5 className="font-semibold text-xs text-[#17191c] uppercase tracking-wider">
                      Root Cause & CAPA (Corrective / Preventive Action)
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10px] text-[#777b86] font-medium mb-1">Root Cause (Vendor End)</label>
                        <input
                          type="text"
                          value={masterIqcForm.rootCause}
                          onChange={e => setMasterIqcForm({ ...masterIqcForm, rootCause: e.target.value })}
                          className="w-full h-8.5 px-2.5 rounded-[8px] border border-[#dcdfe4] text-xs bg-white focus:border-[#17191c] focus:outline-none"
                          placeholder="e.g. N/A - Compliant material"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-[#777b86] font-medium mb-1">Corrective Action</label>
                        <input
                          type="text"
                          value={masterIqcForm.correctiveAction}
                          onChange={e => setMasterIqcForm({ ...masterIqcForm, correctiveAction: e.target.value })}
                          className="w-full h-8.5 px-2.5 rounded-[8px] border border-[#dcdfe4] text-xs bg-white focus:border-[#17191c] focus:outline-none"
                          placeholder="e.g. N/A or Vendor sorting requested"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-[#777b86] font-medium mb-1">Preventive Action</label>
                        <input
                          type="text"
                          value={masterIqcForm.preventiveAction}
                          onChange={e => setMasterIqcForm({ ...masterIqcForm, preventiveAction: e.target.value })}
                          className="w-full h-8.5 px-2.5 rounded-[8px] border border-[#dcdfe4] text-xs bg-white focus:border-[#17191c] focus:outline-none"
                          placeholder="e.g. Standard storage maintained"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-[#777b86] font-medium mb-1">Inspector Final Remarks</label>
                        <input
                          type="text"
                          value={masterIqcForm.remarks}
                          onChange={e => setMasterIqcForm({ ...masterIqcForm, remarks: e.target.value })}
                          className="w-full h-8.5 px-2.5 rounded-[8px] border border-[#dcdfe4] text-xs bg-white focus:border-[#17191c] focus:outline-none"
                          placeholder="e.g. Material meets quality specs. Approved for Stores GRN."
                        />
                      </div>

                      <div className="relative">
                        <label className="block text-[10px] text-[#777b86] font-medium mb-1">Final Disposition</label>
                        <button
                          type="button"
                          onClick={() => setOpenDispositionDropdown(!openDispositionDropdown)}
                          className="w-full h-8.5 px-3 rounded-[8px] border border-[#dcdfe4] bg-white text-xs font-semibold text-[#17191c] flex items-center justify-between hover:border-[#17191c] focus:outline-none transition cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${
                              masterIqcForm.status === 'Accepted' ? 'bg-[#c09748]' : masterIqcForm.status === 'Hold' ? 'bg-amber-500' : 'bg-rose-500'
                            }`} />
                            <span className="truncate">
                              {masterIqcForm.status} ({masterIqcForm.status === 'Accepted' ? 'Pass for Store' : masterIqcForm.status === 'Hold' ? 'Hold / Review' : 'Vendor Return'})
                            </span>
                          </div>
                          <ChevronDown className={`w-3.5 h-3.5 text-[#777b86] shrink-0 transition-transform ${openDispositionDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Custom Final Disposition Dropdown Popover */}
                        {openDispositionDropdown && (
                          <div className="absolute bottom-full right-0 left-0 sm:w-64 mb-1 z-30 bg-white rounded-[12px] border border-[#ececec] shadow-xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                            {[
                              { val: 'Accepted', label: 'Accepted (Pass - Cleared for Store)', color: 'bg-[#c09748]', desc: 'Issue to Store GRN & Production' },
                              { val: 'Hold', label: 'Hold (Pending Review / Discrepancy)', color: 'bg-amber-500', desc: 'Hold for Production Manager sign-off' },
                              { val: 'Rejected', label: 'Rejected (Return to Vendor / Scrap)', color: 'bg-rose-500', desc: 'Vendor return debit note' }
                            ].map(opt => (
                              <button
                                key={opt.val}
                                type="button"
                                onClick={() => {
                                  setMasterIqcForm({ ...masterIqcForm, status: opt.val as any });
                                  setOpenDispositionDropdown(false);
                                }}
                                className={`w-full px-2.5 py-1.5 text-left text-xs rounded-[8px] flex items-center justify-between transition cursor-pointer ${
                                  masterIqcForm.status === opt.val
                                    ? 'bg-[#faf3e0] text-[#8a6521] font-bold border border-[#f4e5be]'
                                    : 'text-[#777b86] hover:bg-[#fafafb] hover:text-[#17191c]'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${opt.color}`} />
                                  <div>
                                    <div className="font-semibold text-xs text-[#17191c]">{opt.label}</div>
                                    <div className="text-[10px] text-[#777b86]">{opt.desc}</div>
                                  </div>
                                </div>
                                {masterIqcForm.status === opt.val && (
                                  <Check className="w-3.5 h-3.5 text-[#8a6521] shrink-0" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dual Signatures Preview */}
                  <div className="p-3 rounded-[12px] bg-[#fafafb] border border-[#ececec] shadow-xs grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-[#777b86] uppercase font-bold block mb-0.5">Prepared By (IQC Inspector)</span>
                      <strong className="text-[#17191c] block">{masterIqcForm.preparedBy}</strong>
                      <span className="text-[10px] text-[#777b86]">Live Timestamp Auto-Captured</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#777b86] uppercase font-bold block mb-0.5">Verified By (Production / QA Manager)</span>
                      <strong className="text-[#17191c] block">{masterIqcForm.verifiedBy}</strong>
                      <span className="text-[10px] text-[#8a6521] font-semibold">Dual Sign-Off Standard</span>
                    </div>
                  </div>

                  {/* Step 3 Footer Navigation */}
                  <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 pt-3 sm:pt-4 border-t border-[#ececec]">
                    <button
                      type="button"
                      onClick={() => setIqcModalStep(2)}
                      className="w-full sm:w-auto px-4 py-2 rounded-full border border-[#dcdfe4] text-xs font-semibold text-[#777b86] hover:bg-gray-50 cursor-pointer flex items-center justify-center gap-1.5 transition active:scale-95 text-center"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Back to Step 2</span>
                    </button>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setShowMasterIqcModal(false)}
                        className="flex-1 sm:flex-initial px-4 py-2 rounded-full border border-[#dcdfe4] text-xs font-semibold text-[#777b86] hover:bg-gray-50 cursor-pointer transition active:scale-95 text-center"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 sm:flex-initial px-6 py-2 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 transition text-xs"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Submit IQC Report</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* MODAL 8: VIEW OFFICIAL MASTER IQC REPORT (RESPONSIVE LUXURY EDITORIAL LAYOUT) */}
      {selectedIqcReportForView && (
        <div className="fixed inset-0 z-50 bg-[#fafafb] sm:bg-white overflow-y-auto flex flex-col animate-in fade-in duration-150">
          {/* Sticky Top Header Bar */}
          <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#ececec] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
                  IQC Report
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#777b86] text-[10px] font-mono">
                  {selectedIqcReportForView.reportNo}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  selectedIqcReportForView.status === 'Accepted'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : selectedIqcReportForView.status === 'Hold'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {selectedIqcReportForView.status === 'Accepted' ? '✓ Accepted' : selectedIqcReportForView.status}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-normal text-[#17191c]">
                Incoming Quality Inspection Report
              </h3>
            </div>
            <button 
              type="button"
              onClick={() => setSelectedIqcReportForView(null)}
              className="w-9 h-9 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] flex items-center justify-center cursor-pointer transition active:scale-95 shadow-2xs"
              title="Close Report"
            >
              <X className="w-5 h-5 text-[#17191c]" />
            </button>
          </div>

          {/* Body Container */}
          <div className="max-w-5xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1 text-xs">
            {/* 8 Structured Summary Cards (2-4 Responsive Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1 */}
              <div className="p-3.5 rounded-[14px] bg-[#fafafb] border border-[#ececec] space-y-1">
                <span className="text-[10px] font-semibold text-[#777b86] uppercase tracking-wider block">Report Ref & Date</span>
                <div className="font-mono font-bold text-sm text-[#c09748]">{selectedIqcReportForView.reportNo}</div>
                <div className="text-[11px] text-[#777b86]">
                  {formatDateDDMMYYYY(selectedIqcReportForView.inspectionDate || selectedIqcReportForView.date)} • {selectedIqcReportForView.inspectionTime || '08:30 AM'}
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-3.5 rounded-[14px] bg-[#fafafb] border border-[#ececec] space-y-1">
                <span className="text-[10px] font-semibold text-[#777b86] uppercase tracking-wider block">Vendor / Customer</span>
                <div className="font-semibold text-xs text-[#17191c] truncate" title={selectedIqcReportForView.vendorCustomer || selectedIqcReportForView.supplierCustomer}>
                  {selectedIqcReportForView.vendorCustomer || selectedIqcReportForView.supplierCustomer}
                </div>
                <div className="text-[11px] font-mono text-[#777b86]">
                  Challan: <strong className="text-[#17191c]">{selectedIqcReportForView.invoiceChallanNo || selectedIqcReportForView.challanNo || 'N/A'}</strong>
                </div>
              </div>

              {/* Card 3 */}
              <div className="p-3.5 rounded-[14px] bg-[#fafafb] border border-[#ececec] space-y-1">
                <span className="text-[10px] font-semibold text-[#777b86] uppercase tracking-wider block">Material & Batch</span>
                <div className="font-medium text-xs text-[#17191c] truncate" title={selectedIqcReportForView.partComponent || selectedIqcReportForView.partDescription}>
                  {selectedIqcReportForView.partComponent || selectedIqcReportForView.partDescription}
                </div>
                <div className="text-[11px] font-mono text-[#777b86]">
                  Lot: <span className="font-semibold text-[#17191c]">{selectedIqcReportForView.batchNo || 'N/A'}</span>
                </div>
              </div>

              {/* Card 4 */}
              <div className="p-3.5 rounded-[14px] bg-[#fafafb] border border-[#ececec] space-y-1">
                <span className="text-[10px] font-semibold text-[#777b86] uppercase tracking-wider block">Intake Quantity</span>
                <div className="font-mono font-bold text-xs text-[#17191c]">
                  {(selectedIqcReportForView.actualReceived || selectedIqcReportForView.totalQty || 0).toLocaleString()} / {(selectedIqcReportForView.invQuantity || selectedIqcReportForView.totalQty || 0).toLocaleString()} {selectedIqcReportForView.uom || 'Pcs'}
                </div>
                <div className="text-[11px] flex items-center gap-1">
                  {(selectedIqcReportForView.shortageQty || 0) > 0 ? (
                    <span className="text-rose-600 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                      <span>-{selectedIqcReportForView.shortageQty} Short</span>
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-700 shrink-0" />
                      <span>100% Match</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Card 5 */}
              <div className="p-3.5 rounded-[14px] bg-[#fafafb] border border-[#ececec] space-y-1">
                <span className="text-[10px] font-semibold text-[#777b86] uppercase tracking-wider block">Box Condition</span>
                <div className={`font-semibold text-xs ${
                  selectedIqcReportForView.boxCondition === 'Intact & Clean' ? 'text-emerald-800' : 'text-amber-800'
                }`}>
                  {selectedIqcReportForView.boxCondition || 'Intact & Clean'}
                </div>
                <div className="text-[11px] text-[#777b86]">Physical packing verification</div>
              </div>

              {/* Card 6 */}
              <div className="p-3.5 rounded-[14px] bg-[#fafafb] border border-[#ececec] space-y-1">
                <span className="text-[10px] font-semibold text-[#777b86] uppercase tracking-wider block">Adhesion & Colorimetry</span>
                <div className="font-mono font-bold text-xs text-[#17191c]">
                  Delta-E: {selectedIqcReportForView.deltaEValue || 0.42} (Standard Limit)
                </div>
                <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-700 shrink-0" />
                  <span>ASTM 5B Cross-Hatch: Pass</span>
                </div>
              </div>

              {/* Card 7 */}
              <div className="p-3.5 rounded-[14px] bg-[#fafafb] border border-[#ececec] space-y-1">
                <span className="text-[10px] font-semibold text-[#777b86] uppercase tracking-wider block">20% Sampling Result</span>
                <div className="font-mono font-bold text-xs text-emerald-800">
                  {selectedIqcReportForView.passQty || 50} / {selectedIqcReportForView.sampleSize || 50} Pcs Pass
                </div>
                <div className="text-[11px] font-mono text-[#777b86]">
                  Rejects: <span className={(selectedIqcReportForView.rejectQty || 0) > 0 ? 'text-red-600 font-bold' : 'text-emerald-700 font-semibold'}>{selectedIqcReportForView.rejectQty || 0} Pcs</span>
                </div>
              </div>

              {/* Card 8 */}
              <div className="p-3.5 rounded-[14px] bg-[#fafafb] border border-[#ececec] space-y-1">
                <span className="text-[10px] font-semibold text-[#777b86] uppercase tracking-wider block">Rejection Rate & AQL</span>
                <div className={`font-mono font-bold text-xs ${
                  (selectedIqcReportForView.rejectionPercent || 0) >= 1.0 ? 'text-red-600' : 'text-emerald-700'
                }`}>
                  {selectedIqcReportForView.rejectionPercent || 0}% Rejection
                </div>
                <div className="text-[11px] text-[#777b86]">
                  {(selectedIqcReportForView.rejectionPercent || 0) >= 1.0 ? 'Exceeds 1.0% Threshold' : 'Within AQL Norms'}
                </div>
              </div>
            </div>

            {/* Verified Line Items Table (If multi-item array present) */}
            {selectedIqcReportForView.items && selectedIqcReportForView.items.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#17191c] uppercase tracking-wider">
                    Inward Consignment Items Physical Verification ({selectedIqcReportForView.items.length} Items)
                  </span>
                  <span className="text-[11px] font-mono text-[#777b86]">
                    Gate Pass Cross-Check
                  </span>
                </div>
                <div className="border border-[#ececec] rounded-[16px] overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#f2f2f3] text-[#17191c] font-semibold border-b border-[#ececec]">
                        <tr>
                          <th className="p-3 w-10 text-center">#</th>
                          <th className="p-3 min-w-[180px]">Material Description</th>
                          <th className="p-3 text-center whitespace-nowrap">Challan Qty</th>
                          <th className="p-3 text-center whitespace-nowrap">Actual Received</th>
                          <th className="p-3 text-center whitespace-nowrap">Shortage</th>
                          <th className="p-3 text-center whitespace-nowrap">Box Condition</th>
                          <th className="p-3 text-center whitespace-nowrap">Verification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ececec] text-[#17191c]">
                        {selectedIqcReportForView.items.map((it, idx) => (
                          <tr key={it.id || idx} className="hover:bg-[#fafafb] transition">
                            <td className="p-3 text-center font-mono text-[#777b86] font-semibold">{idx + 1}</td>
                            <td className="p-3 font-medium text-[#17191c]">{it.materialName}</td>
                            <td className="p-3 text-center font-mono font-medium">{it.challanQty} {it.unit}</td>
                            <td className="p-3 text-center font-mono font-bold text-emerald-800">{it.actualQty} {it.unit}</td>
                            <td className={`p-3 text-center font-mono font-bold ${it.shortageQty > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                              {it.shortageQty > 0 ? `-${it.shortageQty} ${it.unit}` : 'Nil'}
                            </td>
                            <td className="p-3 text-center font-medium text-[#777b86]">{it.condition}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                it.isReceived ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                              }`}>
                                {it.isReceived ? '✓ Verified' : 'Not Recv'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 7 Quality Parameters & Inspection Aspects Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#17191c] uppercase tracking-wider">
                  Quality Parameters & Inspection Aspects (7 Core Checkpoints)
                </span>
                <span className="text-[11px] font-mono text-[#777b86]">
                  Standard Operating Protocol
                </span>
              </div>
              <div className="border border-[#ececec] rounded-[16px] overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#f2f2f3] text-[#17191c] font-semibold border-b border-[#ececec]">
                      <tr>
                        <th className="p-3 w-10 text-center">#</th>
                        <th className="p-3 min-w-[160px]">Aspect / Check Item</th>
                        <th className="p-3 min-w-[200px]">Method of Measurement</th>
                        <th className="p-3 w-24 text-center">Impact</th>
                        <th className="p-3 w-28 text-center">Result</th>
                        <th className="p-3 min-w-[200px]">Inspector Observation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ececec] text-[#17191c]">
                      {(selectedIqcReportForView.aspects || []).map((asp, idx) => (
                        <tr key={idx} className="hover:bg-[#fafafb] transition">
                          <td className="p-3 text-center font-mono font-semibold text-[#777b86]">{asp.srNo}</td>
                          <td className="p-3 font-medium text-[#17191c]">{asp.aspect}</td>
                          <td className="p-3 text-[11px] text-[#777b86]">{asp.methodOfMeasurement}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              asp.impact === 'Critical'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : asp.impact === 'Major'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                            }`}>
                              {asp.impact}
                            </span>
                          </td>
                          <td className="p-3 text-center font-bold">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              asp.result.startsWith('Pass')
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}>
                              {asp.result}
                            </span>
                          </td>
                          <td className="p-3 text-[11px] text-[#17191c]">{asp.observation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Rejection, CAPA & Final Disposition Card */}
            <div className="p-4 sm:p-5 rounded-[16px] bg-[#fafafb] border border-[#ececec] space-y-3">
              <div className="text-xs font-bold text-[#17191c] uppercase tracking-wider">
                Defect Analysis, CAPA & Final Quality Disposition
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-[12px] bg-white border border-[#ececec] space-y-1">
                  <span className="text-[10px] font-semibold text-[#777b86] uppercase block">Rejection Detail</span>
                  <div className="text-[#17191c] font-medium">{selectedIqcReportForView.rejectionDetail || 'Nil (Zero Rejections recorded)'}</div>
                </div>
                <div className="p-3 rounded-[12px] bg-white border border-[#ececec] space-y-1">
                  <span className="text-[10px] font-semibold text-[#777b86] uppercase block">Root Cause</span>
                  <div className="text-[#17191c] font-medium">{selectedIqcReportForView.rootCause || 'N/A'}</div>
                </div>
                <div className="p-3 rounded-[12px] bg-white border border-[#ececec] space-y-1">
                  <span className="text-[10px] font-semibold text-[#777b86] uppercase block">Corrective & Preventive Action</span>
                  <div className="text-[#17191c] font-medium">
                    {selectedIqcReportForView.correctiveAction || 'N/A'} | {selectedIqcReportForView.preventiveAction || 'N/A'}
                  </div>
                </div>
              </div>

              {selectedIqcReportForView.productionManagerNote && (
                <div className="p-3 rounded-[12px] bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold mb-0.5">Production Manager Discrepancy Note:</strong>
                    {selectedIqcReportForView.productionManagerNote}
                  </div>
                </div>
              )}

              <div className={`p-3.5 rounded-[12px] border flex items-center justify-between flex-wrap gap-2 ${
                selectedIqcReportForView.status === 'Accepted'
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50/80 border-amber-200 text-amber-900'
              }`}>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider block opacity-75">Final Quality Disposition</span>
                  <span className="text-sm font-bold">
                    [{selectedIqcReportForView.status}] {selectedIqcReportForView.remarks || (selectedIqcReportForView.status === 'Accepted' ? 'Consignment approved for Pre-treatment and Basecoat production line.' : 'Consignment placed on Quality Hold.')}
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white border border-current shadow-2xs">
                  {selectedIqcReportForView.status === 'Accepted' ? '✓ Cleared for Production' : 'Hold / Under Review'}
                </span>
              </div>
            </div>

            {/* Dual Verified Signatures */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-[14px] bg-[#fafafb] border border-[#ececec] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-[#777b86] uppercase block">Prepared By</span>
                  <div className="font-bold text-xs text-[#17191c] mt-0.5">{selectedIqcReportForView.preparedBy || 'IQC Inspector'}</div>
                  <div className="text-[10px] text-[#777b86] font-mono mt-0.5">
                    {selectedIqcReportForView.generatedTimestamp || `${formatDateDDMMYYYY(selectedIqcReportForView.inspectionDate || selectedIqcReportForView.date)}`}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  ✓ Inspector Sign-off
                </span>
              </div>

              <div className="p-3.5 rounded-[14px] bg-[#fafafb] border border-[#ececec] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-[#777b86] uppercase block">Verified & Approved By</span>
                  <div className="font-bold text-xs text-[#17191c] mt-0.5">{selectedIqcReportForView.verifiedBy || 'Production Manager'}</div>
                  <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                    Production & QA Manager Clearance
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  ✓ Digital Authorization
                </span>
              </div>
            </div>

            {/* Modal Actions Bar (Email, Download PDF, Print, Close) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#ececec]">
              <div className="text-[11px] text-[#777b86] font-mono text-center sm:text-left hidden lg:block">
                ISO 9001:2015 & IATF 16949 Certified Operational Record
              </div>

              <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setEmailModalPayload(composeIqcEmailDraft(selectedIqcReportForView))}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95 whitespace-nowrap"
                  title="Compose and Email IQC Inspection Report to Party"
                >
                  <Mail className="w-3.5 h-3.5 text-[#c09748]" />
                  <span>Email Report</span>
                </button>

                <button
                  type="button"
                  onClick={() => downloadStandardIQCPdf(selectedIqcReportForView)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95 whitespace-nowrap"
                  title="Download Master IQC Inspection PDF"
                >
                  <Download className="w-3.5 h-3.5 text-[#c09748]" />
                  <span>Download PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-full border border-[#e5e7eb] bg-white text-[#777b86] hover:bg-gray-50 text-xs font-semibold transition cursor-pointer shadow-2xs whitespace-nowrap"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedIqcReportForView(null)}
                  className="flex items-center justify-center px-4 py-2 rounded-full border border-[#e5e7eb] bg-white text-[#777b86] hover:bg-gray-50 text-xs font-semibold transition cursor-pointer shadow-2xs whitespace-nowrap"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* UNIVERSAL EMAIL DISPATCH MODAL */}
      <UniversalEmailModal
        isOpen={!!emailModalPayload}
        onClose={() => setEmailModalPayload(null)}
        payload={emailModalPayload}
        onSendSuccess={(sentTo) => {
          setIqcToast(`IQC Report successfully emailed to ${sentTo}`);
          setTimeout(() => setIqcToast(null), 5000);
        }}
        onViewPdfAttachment={() => {
          if (selectedIqcReportForView) {
            downloadStandardIQCPdf(selectedIqcReportForView);
          }
        }}
      />
    </div>
  );
};
