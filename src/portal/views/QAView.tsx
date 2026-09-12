import React, { useState } from 'react';
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
  Check
} from 'lucide-react';
import { 
  IQCInspectionRecord, 
  IPQCRecord, 
  FinalQualityRelease 
} from '../types/portalTypes';

export const QAView: React.FC = () => {
  const { 
    fpaRecords, 
    createFPARecord, 
    ipqcRecords, 
    addIPQCRecord,
    iqcRecords,
    addIQCRecord,
    qualityReleases,
    addOQCRelease,
    jobCards,
    grnList,
    activePlant, 
    currentUser 
  } = usePortalStore();

  const [activeSubTab, setActiveSubTab] = useState<'IPQC' | 'IQC' | 'OQC'>('IPQC');

  // Modal Visibility States
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

  // 2. IQC Form State (Image 3: Raw Substrate Inspection)
  const [iqcForm, setIqcForm] = useState({
    supplierCustomer: 'ROOP POLYMERS LTD',
    partCode: 'RP-8841',
    batchNo: 'B-RP-202609-02',
    totalQty: 1000,
    sampledQty: 50,
    damage: 'Pass' as 'Pass' | 'Fail',
    scratch: 'Pass' as 'Pass' | 'Fail',
    sinkMark: 'Pass' as 'Pass' | 'Fail',
    shortFill: 'Pass' as 'Pass' | 'Fail',
    bubble: 'Pass' as 'Pass' | 'Fail',
    pinMark: 'Pass' as 'Pass' | 'Fail',
    dustSpot: 'Pass' as 'Pass' | 'Fail',
    overPaint: 'Pass' as 'Pass' | 'Fail',
    paintMissing: 'Pass' as 'Pass' | 'Fail',
    colour: 'Pass' as 'Pass' | 'Fail',
    overallFinishing: 'Pass' as 'Pass' | 'Fail',
    remarks: 'Substrate meets physical and dimension specifications.'
  });

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

  const isDeltaEPass = fpaForm.deltaE <= 0.70;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ISO Header Banner */}
      <div className="bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 border border-[#ececec] shadow-xs sm:shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5">
            <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[9px] sm:text-[10px] font-mono uppercase tracking-widest font-bold">
              PK-QA-MASTER • QUALITY HUB
            </span>
            <span className="text-[10px] sm:text-xs text-[#777b86]">
              IQC Substrate • IPQC Line • FPA Gate • OQC PDI Release
            </span>
          </div>
          <h1 className="text-xl sm:text-3xl font-serif font-normal text-[#17191c] tracking-tight">
            Industrial Quality Assurance System
          </h1>
          <p className="text-[11px] sm:text-xs text-[#777b86] mt-1">
            Zero-Defect Standard: ΔE ≤ 0.70 Spectrophotometer • 100% Cross-Cut Tape Adhesion
          </p>
        </div>

        {/* Action Button Grid */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full md:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#ececec]">
          <button
            onClick={() => setShowFpaModal(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-[#17191c]" />
            <span>FPA Gate</span>
          </button>
          <button
            onClick={() => setShowIqcModal(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full bg-[#17191c] hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>New IQC</span>
          </button>
          <button
            onClick={() => setShowIpqcModal(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full bg-[#17191c] hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>New IPQC</span>
          </button>
          <button
            onClick={() => setShowOqcModal(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full bg-[#17191c] hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>New OQC</span>
          </button>
        </div>
      </div>

      {/* ISO Specifications Standard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-[16px] sm:rounded-[20px] bg-white border border-[#ececec] shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 sm:p-3 rounded-full bg-[#faf3e0] text-[#c09748] shrink-0">
            <Gauge className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="text-[10px] sm:text-[11px] font-bold text-[#777b86] uppercase tracking-[0.14em]">Colorimetry Mandate</div>
            <div className="text-base sm:text-lg font-serif font-normal text-[#17191c]">ΔE ≤ 0.70 Max</div>
            <div className="text-[10px] text-[#777b86]">CIELAB Spectrophotometer L*a*b*</div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-[16px] sm:rounded-[20px] bg-white border border-[#ececec] shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 sm:p-3 rounded-full bg-emerald-50 text-emerald-700 shrink-0">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="text-[10px] sm:text-[11px] font-bold text-[#777b86] uppercase tracking-[0.14em]">Adhesion Mandate</div>
            <div className="text-base sm:text-lg font-serif font-normal text-emerald-800">100% Cross-Cut Pass</div>
            <div className="text-[10px] text-[#777b86]">ASTM 5B Grid + 3M Tape Pull</div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-[16px] sm:rounded-[20px] bg-white border border-[#ececec] shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 sm:p-3 rounded-full bg-[#fafafb] text-[#17191c] border border-[#ececec] shrink-0">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="text-[10px] sm:text-[11px] font-bold text-[#777b86] uppercase tracking-[0.14em]">Audit Cadence</div>
            <div className="text-base sm:text-lg font-serif font-normal text-[#17191c]">Every 3 Hours</div>
            <div className="text-[10px] text-[#777b86]">5 Sample Pieces per Inspection</div>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="border-b border-[#ececec] pb-2 overflow-x-auto no-scrollbar scrollbar-none">
        <div className="flex items-center gap-2 min-w-max">
          <button
            onClick={() => setActiveSubTab('IPQC')}
            className={`px-3.5 py-2 rounded-full text-xs font-medium cursor-pointer transition flex items-center gap-2 whitespace-nowrap active:scale-95 ${
              activeSubTab === 'IPQC'
                ? 'bg-[#17191c] text-white font-semibold shadow-xs'
                : 'bg-white text-[#777b86] hover:text-[#17191c] border border-[#ececec]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>IPQC & FPA (In-Process Audit)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('IQC')}
            className={`px-3.5 py-2 rounded-full text-xs font-medium cursor-pointer transition flex items-center gap-2 whitespace-nowrap active:scale-95 ${
              activeSubTab === 'IQC'
                ? 'bg-[#17191c] text-white font-semibold shadow-xs'
                : 'bg-white text-[#777b86] hover:text-[#17191c] border border-[#ececec]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>IQC (Incoming Raw Substrate)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('OQC')}
            className={`px-3.5 py-2 rounded-full text-xs font-medium cursor-pointer transition flex items-center gap-2 whitespace-nowrap active:scale-95 ${
              activeSubTab === 'OQC'
                ? 'bg-[#17191c] text-white font-semibold shadow-xs'
                : 'bg-white text-[#777b86] hover:text-[#17191c] border border-[#ececec]'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>OQC / PDI (Outgoing Release)</span>
          </button>
        </div>
      </div>

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

      {/* TAB 2: IQC INCOMING SUBSTRATE VIEW */}
      {activeSubTab === 'IQC' && (
        <div className="bg-white rounded-[20px] sm:rounded-[24px] border border-[#ececec] p-4 sm:p-6 shadow-xs sm:shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f3]">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#777b86]">
                IQC Incoming Substrate Parameter Log
              </h3>
              <p className="text-[11px] text-[#777b86] mt-0.5">Physical & surface defect verification matching Excel sheet criteria</p>
            </div>
            <span className="text-[11px] sm:text-xs font-mono text-[#c09748] font-bold">PK-STR-IQC-001</span>
          </div>

          {/* Mobile Touch Card List View (< 640px) */}
          <div className="block sm:hidden space-y-3">
            {iqcRecords.map(rec => (
              <div key={rec.reportNo} className="p-3.5 bg-[#fafafb] border border-[#ececec] rounded-[16px] space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#ececec]">
                  <div>
                    <span className="font-mono font-bold text-[#c09748] text-xs">{rec.reportNo}</span>
                    <div className="text-[11px] font-medium text-[#17191c]">{rec.supplierCustomer}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${rec.status === 'Accepted' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    {rec.status}
                  </span>
                </div>

                <div className="text-[#777b86] font-mono text-[11px]">Part: {rec.partCode} (Batch: {rec.batchNo})</div>

                <div className="grid grid-cols-3 gap-1.5 pt-1 text-center text-[10px]">
                  <div className="bg-white p-1.5 rounded-[8px] border border-[#ececec]"><span className="text-[#777b86] block">Damage</span><span className="font-bold text-emerald-700">{rec.damage}</span></div>
                  <div className="bg-white p-1.5 rounded-[8px] border border-[#ececec]"><span className="text-[#777b86] block">Scratch</span><span className="font-bold text-emerald-700">{rec.scratch}</span></div>
                  <div className="bg-white p-1.5 rounded-[8px] border border-[#ececec]"><span className="text-[#777b86] block">Sink Mark</span><span className="font-bold text-emerald-700">{rec.sinkMark}</span></div>
                  <div className="bg-white p-1.5 rounded-[8px] border border-[#ececec]"><span className="text-[#777b86] block">Short Fill</span><span className="font-bold text-emerald-700">{rec.shortFill}</span></div>
                  <div className="bg-white p-1.5 rounded-[8px] border border-[#ececec]"><span className="text-[#777b86] block">Bubble</span><span className="font-bold text-emerald-700">{rec.bubble}</span></div>
                  <div className="bg-white p-1.5 rounded-[8px] border border-[#ececec]"><span className="text-[#777b86] block">Colour</span><span className="font-bold text-emerald-700">{rec.colour}</span></div>
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
                  <th className="p-3 font-semibold">Supplier / Customer</th>
                  <th className="p-3 font-semibold">Part Code & Batch</th>
                  <th className="p-3 font-semibold text-center">Damage</th>
                  <th className="p-3 font-semibold text-center">Scratch</th>
                  <th className="p-3 font-semibold text-center">Sink Mark</th>
                  <th className="p-3 font-semibold text-center">Short Fill</th>
                  <th className="p-3 font-semibold text-center">Bubble</th>
                  <th className="p-3 font-semibold text-center">Pin Mark</th>
                  <th className="p-3 font-semibold text-center">Dust Spot</th>
                  <th className="p-3 font-semibold text-center">Color</th>
                  <th className="p-3 font-semibold text-center">Finishing</th>
                  <th className="p-3 font-semibold text-right">IQC Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececec]">
                {iqcRecords.map(rec => (
                  <tr key={rec.reportNo} className="hover:bg-[#fafafb] transition">
                    <td className="p-3 font-mono font-bold text-[#c09748]">{rec.reportNo}</td>
                    <td className="p-3 text-[#17191c] font-medium">{rec.supplierCustomer}</td>
                    <td className="p-3 text-[#777b86] font-mono">{rec.partCode} ({rec.batchNo})</td>
                    <td className="p-3 text-center"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800">{rec.damage}</span></td>
                    <td className="p-3 text-center"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800">{rec.scratch}</span></td>
                    <td className="p-3 text-center"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800">{rec.sinkMark}</span></td>
                    <td className="p-3 text-center"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800">{rec.shortFill}</span></td>
                    <td className="p-3 text-center"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800">{rec.bubble}</span></td>
                    <td className="p-3 text-center"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800">{rec.pinMark}</span></td>
                    <td className="p-3 text-center"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800">{rec.dustSpot}</span></td>
                    <td className="p-3 text-center"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800">{rec.colour}</span></td>
                    <td className="p-3 text-center"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800">{rec.overallFinishing}</span></td>
                    <td className="p-3 text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        rec.status === 'Accepted' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

      {/* MODAL 1: NEW IQC INCOMING SUBSTRATE FORM (WITH SMART PARTY SEARCH & 1-TAP ALL PASS) */}
      {showIqcModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-[20px] sm:rounded-[24px] max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-[#ececec] space-y-4 text-xs max-h-[92vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center pb-3 border-b border-[#ececec]">
              <div>
                <h3 className="text-sm sm:text-base font-serif font-normal text-[#17191c]">New IQC Substrate Inspection (PK-STR-IQC-001)</h3>
                <p className="text-[10px] sm:text-[11px] text-[#777b86]">Select Party Name / WO to auto-fill all substrate details below</p>
              </div>
              <button onClick={() => setShowIqcModal(false)} className="text-[#979799] hover:text-[#17191c] cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIqcSubmit} className="space-y-3 sm:space-y-4">
              {/* SMART PARTY / WORK ORDER DROPDOWN AUTO-FILL */}
              <div className="p-3 bg-[#faf3e0]/50 rounded-[14px] border border-[#f4e5be] space-y-1.5">
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Supplier / Customer</label>
                  <input
                    type="text"
                    value={iqcForm.supplierCustomer}
                    onChange={e => setIqcForm({ ...iqcForm, supplierCustomer: e.target.value })}
                    className="w-full p-2.5 rounded-[12px] sm:rounded-[14px] border border-[#ececec] focus:border-[#c09748] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Substrate Part Code</label>
                  <input
                    type="text"
                    value={iqcForm.partCode}
                    onChange={e => setIqcForm({ ...iqcForm, partCode: e.target.value })}
                    className="w-full p-2.5 rounded-[12px] sm:rounded-[14px] border border-[#ececec] focus:border-[#c09748] focus:outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Vendor Batch No</label>
                  <input
                    type="text"
                    value={iqcForm.batchNo}
                    onChange={e => setIqcForm({ ...iqcForm, batchNo: e.target.value })}
                    className="w-full p-2.5 rounded-[12px] sm:rounded-[14px] border border-[#ececec] focus:border-[#c09748] focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>

              {/* IQC Selection Grid with 1-Tap "Set All Pass" Button */}
              <div className="p-3.5 sm:p-4 bg-[#fafafb] rounded-[16px] sm:rounded-[20px] border border-[#ececec] space-y-2.5 sm:space-y-3">
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

                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
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
                    <div key={item.key} className="flex items-center justify-between p-2 sm:p-2.5 bg-white rounded-[12px] border border-[#ececec]">
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

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowIqcModal(false)} className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86]">Cancel</button>
                <button type="submit" className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-[#c09748] text-[#17191c] font-semibold">Save IQC Inspection</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: NEW IPQC 3-HOURLY AUDIT FORM (WITH SMART PARTY SEARCH & 1-TAP ALL PASS) */}
      {showIpqcModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-[20px] sm:rounded-[24px] max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-[#ececec] space-y-4 text-xs max-h-[92vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center pb-3 border-b border-[#ececec]">
              <div>
                <h3 className="text-sm sm:text-base font-serif font-normal text-[#17191c]">New 3-Hourly IPQC Line Inspection (PK-QA-IPQ-001)</h3>
                <p className="text-[10px] sm:text-[11px] text-[#777b86]">Select Party / Work Order to auto-fill line details below</p>
              </div>
              <button onClick={() => setShowIpqcModal(false)} className="text-[#979799] hover:text-[#17191c] cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIpqcSubmit} className="space-y-3 sm:space-y-4">
              {/* SMART PARTY / WORK ORDER DROPDOWN AUTO-FILL */}
              <div className="p-3 bg-[#faf3e0]/50 rounded-[14px] border border-[#f4e5be] space-y-1.5">
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Work Order No</label>
                  <input
                    type="text"
                    value={ipqcForm.woNo}
                    onChange={e => setIpqcForm({ ...ipqcForm, woNo: e.target.value })}
                    className="w-full p-2.5 rounded-[12px] sm:rounded-[14px] border border-[#ececec] focus:border-[#c09748] focus:outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Part Code</label>
                  <input
                    type="text"
                    value={ipqcForm.partCode}
                    onChange={e => setIpqcForm({ ...ipqcForm, partCode: e.target.value })}
                    className="w-full p-2.5 rounded-[12px] sm:rounded-[14px] border border-[#ececec] focus:border-[#c09748] focus:outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Color / Finish</label>
                  <input
                    type="text"
                    value={ipqcForm.color}
                    onChange={e => setIpqcForm({ ...ipqcForm, color: e.target.value })}
                    className="w-full p-2.5 rounded-[12px] sm:rounded-[14px] border border-[#ececec] focus:border-[#c09748] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* IPQC Selection Grid with 1-Tap "Set All Pass" Button */}
              <div className="p-3.5 sm:p-4 bg-[#fafafb] rounded-[16px] sm:rounded-[20px] border border-[#ececec] space-y-2.5 sm:space-y-3">
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

                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { label: 'Bubble', key: 'bubble' },
                    { label: 'Dust Spot', key: 'dustSpot' },
                    { label: 'Over Paint', key: 'overPaint' },
                    { label: 'Paint Missing', key: 'paintMissing' },
                    { label: 'Overall Finishing', key: 'overallFinishing' },
                    { label: 'Adhesion Test', key: 'adhesionTest' }
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-2 sm:p-2.5 bg-white rounded-[12px] border border-[#ececec]">
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
              <div className="p-3.5 sm:p-4 bg-[#faf3e0]/40 rounded-[16px] sm:rounded-[20px] border border-[#f4e5be] space-y-2">
                <div className="font-semibold text-[#17191c] flex items-center justify-between text-xs">
                  <span>Spectrophotometer Colorimetry (L, A, B, ΔE)</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ipqcForm.deltaE <= 0.70 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    {ipqcForm.deltaE <= 0.70 ? '✓ PASS' : '🚨 REJECT'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] text-[#777b86]">L*</label>
                    <input type="number" step="0.01" value={ipqcForm.L} onChange={e => setIpqcForm({ ...ipqcForm, L: Number(e.target.value) })} className="w-full p-1.5 sm:p-2 rounded-[8px] border border-[#ececec] bg-white font-mono text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#777b86]">a*</label>
                    <input type="number" step="0.01" value={ipqcForm.a} onChange={e => setIpqcForm({ ...ipqcForm, a: Number(e.target.value) })} className="w-full p-1.5 sm:p-2 rounded-[8px] border border-[#ececec] bg-white font-mono text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#777b86]">b*</label>
                    <input type="number" step="0.01" value={ipqcForm.b} onChange={e => setIpqcForm({ ...ipqcForm, b: Number(e.target.value) })} className="w-full p-1.5 sm:p-2 rounded-[8px] border border-[#ececec] bg-white font-mono text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#777b86] font-bold">ΔE (Delta)</label>
                    <input type="number" step="0.01" min={0} value={ipqcForm.deltaE} onChange={e => setIpqcForm({ ...ipqcForm, deltaE: Number(e.target.value) })} className="w-full p-1.5 sm:p-2 rounded-[8px] border-2 border-[#c09748] bg-white font-mono font-bold text-xs" />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowIpqcModal(false)} className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86]">Cancel</button>
                <button type="submit" className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-[#c09748] text-[#17191c] font-semibold">Save IPQC Inspection</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: NEW OQC / PDI RELEASE FORM (WITH SMART PARTY SEARCH & 1-TAP ALL PASS) */}
      {showOqcModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-[20px] sm:rounded-[24px] max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-[#ececec] space-y-4 text-xs max-h-[92vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center pb-3 border-b border-[#ececec]">
              <div>
                <h3 className="text-sm sm:text-base font-serif font-normal text-[#17191c]">New OQC / PDI Quality Release (PK-QA-OQC-001)</h3>
                <p className="text-[10px] sm:text-[11px] text-[#777b86]">Select Party / Work Order to auto-fill release details below</p>
              </div>
              <button onClick={() => setShowOqcModal(false)} className="text-[#979799] hover:text-[#17191c] cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOqcSubmit} className="space-y-3 sm:space-y-4">
              {/* SMART PARTY / WORK ORDER DROPDOWN AUTO-FILL */}
              <div className="p-3 bg-[#faf3e0]/50 rounded-[14px] border border-[#f4e5be] space-y-1.5">
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={oqcForm.customer}
                    onChange={e => setOqcForm({ ...oqcForm, customer: e.target.value })}
                    className="w-full p-2.5 rounded-[12px] sm:rounded-[14px] border border-[#ececec] focus:border-[#c09748] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Work Order</label>
                  <input
                    type="text"
                    value={oqcForm.woNo}
                    onChange={e => setOqcForm({ ...oqcForm, woNo: e.target.value })}
                    className="w-full p-2.5 rounded-[12px] sm:rounded-[14px] border border-[#ececec] focus:border-[#c09748] focus:outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Part Code & Color</label>
                  <input
                    type="text"
                    value={oqcForm.partCode}
                    onChange={e => setOqcForm({ ...oqcForm, partCode: e.target.value })}
                    className="w-full p-2.5 rounded-[12px] sm:rounded-[14px] border border-[#ececec] focus:border-[#c09748] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* OQC Selection Grid with 1-Tap "Set All Pass" Button */}
              <div className="p-3.5 sm:p-4 bg-[#fafafb] rounded-[16px] sm:rounded-[20px] border border-[#ececec] space-y-2.5 sm:space-y-3">
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

                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { label: 'Packing (Box Condition)', key: 'packingBoxCondition' },
                    { label: 'Traceability (Batch No)', key: 'traceabilityBatchNo' },
                    { label: 'Quantity Match', key: 'quantityMatch' },
                    { label: 'Physical Inspection', key: 'physicalInspection' },
                    { label: 'Conductivity', key: 'conductivity', extraOpt: 'N/A' },
                    { label: 'Adhesion Test', key: 'adhesion' }
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-2 sm:p-2.5 bg-white rounded-[12px] border border-[#ececec]">
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
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowOqcModal(false)} className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86]">Cancel</button>
                <button type="submit" className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-[#c09748] text-[#17191c] font-semibold">Grant OQC & PDI Clearance</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: FPA GOLDEN GATE FORM (WITH SMART AUTO-FILL) */}
      {showFpaModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-[20px] sm:rounded-[24px] max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-[#ececec] space-y-4 text-xs max-h-[92vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center pb-3 border-b border-[#ececec]">
              <div>
                <h3 className="text-sm sm:text-base font-serif font-normal text-[#17191c]">New First Part Approval (FPA) Test</h3>
                <p className="text-[10px] sm:text-[11px] text-[#777b86]">Select Party / Work Order to auto-fill FPA details below</p>
              </div>
              <button 
                onClick={() => setShowFpaModal(false)} 
                className="font-bold text-[#979799] hover:text-[#17191c] text-base cursor-pointer transition p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFpaSubmit} className="space-y-3">
              {/* SMART PARTY / WORK ORDER DROPDOWN AUTO-FILL */}
              <div className="p-3 bg-[#faf3e0]/50 rounded-[14px] border border-[#f4e5be] space-y-1.5">
                <label className="block text-[#8a6521] font-bold text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#c09748]" />
                  Select Party Name / Job Card (Auto-Fill Details):
                </label>
                <select
                  onChange={e => selectOrderForFpa(e.target.value)}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Work Order</label>
                  <input
                    type="text"
                    value={fpaForm.woNo}
                    onChange={e => setFpaForm({ ...fpaForm, woNo: e.target.value })}
                    className="w-full p-2.5 rounded-[14px] border border-[#ececec] focus:border-[#c09748] focus:outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Job Card No.</label>
                  <input
                    type="text"
                    value={fpaForm.jobCardNo}
                    onChange={e => setFpaForm({ ...fpaForm, jobCardNo: e.target.value })}
                    className="w-full p-2.5 rounded-[14px] border border-[#ececec] focus:border-[#c09748] focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Color / Finish</label>
                  <input
                    type="text"
                    value={fpaForm.color}
                    onChange={e => setFpaForm({ ...fpaForm, color: e.target.value })}
                    className="w-full p-2.5 rounded-[14px] border border-[#ececec] focus:border-[#c09748] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Ford Cup Viscosity (s)</label>
                  <input
                    type="number"
                    value={fpaForm.viscositySec}
                    onChange={e => setFpaForm({ ...fpaForm, viscositySec: Math.max(0, Number(e.target.value)) })}
                    className="w-full p-2.5 rounded-[14px] border border-[#ececec] focus:border-[#c09748] focus:outline-none"
                    min={0}
                    required
                  />
                </div>
              </div>

              {/* Delta-E Spectrophotometer Calculator Card */}
              <div className={`p-3.5 sm:p-4 rounded-[16px] sm:rounded-[20px] border space-y-2.5 ${
                isDeltaEPass ? 'bg-[#faf3e0]/40 border-[#f4e5be]' : 'bg-red-50 border-red-300'
              }`}>
                <div className="flex justify-between items-center text-xs">
                  <div className="font-semibold text-[#17191c] flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-[#c09748]" />
                    Spectrophotometer ΔE
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                    isDeltaEPass ? 'bg-emerald-100 text-emerald-800' : 'bg-red-600 text-white'
                  }`}>
                    {isDeltaEPass ? '✓ PASS' : '🚨 REJECT'}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] text-[#777b86] font-medium">L*</label>
                    <input
                      type="number"
                      step="0.01"
                      value={fpaForm.L}
                      onChange={e => setFpaForm({ ...fpaForm, L: Number(e.target.value) })}
                      className="w-full p-1.5 sm:p-2 rounded-[8px] sm:rounded-[12px] border border-[#ececec] bg-white font-mono focus:border-[#c09748] text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#777b86] font-medium">a*</label>
                    <input
                      type="number"
                      step="0.01"
                      value={fpaForm.a}
                      onChange={e => setFpaForm({ ...fpaForm, a: Number(e.target.value) })}
                      className="w-full p-1.5 sm:p-2 rounded-[8px] sm:rounded-[12px] border border-[#ececec] bg-white font-mono focus:border-[#c09748] text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#777b86] font-medium">b*</label>
                    <input
                      type="number"
                      step="0.01"
                      value={fpaForm.b}
                      onChange={e => setFpaForm({ ...fpaForm, b: Number(e.target.value) })}
                      className="w-full p-1.5 sm:p-2 rounded-[8px] sm:rounded-[12px] border border-[#ececec] bg-white font-mono focus:border-[#c09748] text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#777b86] font-medium">ΔE</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={fpaForm.deltaE}
                      onChange={e => setFpaForm({ ...fpaForm, deltaE: Math.max(0, Number(e.target.value)) })}
                      className="w-full p-1.5 sm:p-2 rounded-[8px] sm:rounded-[12px] border-2 border-[#c09748] bg-white font-mono font-bold text-xs text-[#17191c] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Adhesion Test Checkbox */}
              <div className="p-3.5 sm:p-4 bg-[#fafafb] border border-[#ececec] rounded-[16px] sm:rounded-[20px] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-[#17191c]">Adhesion & Physical Testing:</div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    fpaForm.adhesionPercent === 100 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {fpaForm.adhesionPercent}%
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[#777b86] font-medium mb-1">Cross-Cut Grid (ASTM 5B)</label>
                    <select
                      value={fpaForm.crossCutTest}
                      onChange={e => {
                        const val = e.target.value as 'Pass' | 'Fail';
                        const newAdhesion = (val === 'Pass' && fpaForm.tapeTest === 'Pass') ? 100 : 0;
                        setFpaForm({ ...fpaForm, crossCutTest: val, adhesionPercent: newAdhesion });
                      }}
                      className="w-full p-2 rounded-[10px] border border-[#ececec] bg-white cursor-pointer text-xs focus:border-[#c09748] focus:outline-none"
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
                      className="w-full p-2 rounded-[10px] border border-[#ececec] bg-white cursor-pointer text-xs focus:border-[#c09748] focus:outline-none"
                    >
                      <option value="Pass">Pass (Zero Paint Transfer)</option>
                      <option value="Fail">Fail (Paint Lifted)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFpaModal(false)}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium cursor-pointer hover:bg-[#fafafb] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-[#c09748] text-[#17191c] font-semibold shadow-xs hover:bg-[#a97e35] cursor-pointer transition active:scale-95"
                >
                  Submit FPA Sign-Off
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
