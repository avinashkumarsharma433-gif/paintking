import React, { useState, useEffect, useRef } from 'react';
import { downloadStandardGateInwardPdf, downloadStandardGateOutwardPdf, formatUnitBreakdown, formatDateDDMMYYYY } from '../utils/pdfStandardHeader';
import { usePortalStore } from '../context/PortalStoreContext';
import { GatePassRecord, MaterialInwardRecord, MaterialOutwardRecord, InwardMaterialLineItem, MATERIAL_TYPE_OPTIONS, StockMaterialType } from '../types/portalTypes';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Plus, 
  ShieldCheck, 
  Truck, 
  Search, 
  Clock, 
  CheckCircle2, 
  BadgeCheck, 
  ChevronRight, 
  ArrowLeft, 
  Check, 
  Save, 
  Sparkles,
  AlertCircle,
  X,
  Trash2,
  ChevronDown,
  Eye,
  Download,
  Printer,
  FileText,
  Mail,
  Building2,
  Calendar,
  PackageCheck,
  Layers
} from 'lucide-react';
import { UniversalJobModal } from '../components/UniversalJobModal';
import { PaintkingDatePicker } from '../components/PaintkingDatePicker';
import { CenteredSelectModal } from '../components/CenteredSelectModal';
import { ScrollRemainingToast } from '../components/ScrollRemainingToast';
import { UniversalEmailModal } from '../components/UniversalEmailModal';
import { composeGatePassEmailDraft, composeGateOutwardEmailDraft, EmailDispatchPayload } from '../utils/emailDispatchEngine';

export const GatePassView: React.FC = () => {
  const { 
    gatePasses, 
    createGatePass,
    updateGatePassStatus, 
    materialInwardLogs, 
    materialOutwardLogs, 
    addMaterialInwardRecord, 
    addMaterialOutwardRecord, 
    billingInvoices,
    activePlant,
    currentUser,
    activeSubTab,
    setActiveSubTab
  } = usePortalStore();

  const [activeTab, setActiveTab] = useState<'INWARD' | 'OUTWARD' | 'GATE_PASS'>('INWARD');

  useEffect(() => {
    if (activeSubTab === 'INWARD' || activeSubTab === 'OUTWARD' || activeSubTab === 'GATE_PASS') {
      setActiveTab(activeSubTab);
    }
  }, [activeSubTab]);
  const [showInwardModal, setShowInwardModal] = useState<boolean>(false);
  const [showOutwardModal, setShowOutwardModal] = useState<boolean>(false);
  const [showUniversalModal, setShowUniversalModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [submittedToast, setSubmittedToast] = useState<string | null>(null);

  // Selected Inward Record for "View Details" Popup
  const [selectedInward, setSelectedInward] = useState<MaterialInwardRecord | null>(null);

  // Selected Outward Record for "View Details" Popup
  const [selectedOutward, setSelectedOutward] = useState<MaterialOutwardRecord | null>(null);

  // Email Dispatch Modal State
  const [emailModalPayload, setEmailModalPayload] = useState<EmailDispatchPayload | null>(null);

  // Scroll Container Refs for "N MORE ITEMS BELOW" Toast Indicator
  const inwardTableRef = useRef<HTMLDivElement>(null);
  const outwardTableRef = useRef<HTMLDivElement>(null);
  const materialListRef = useRef<HTMLDivElement>(null);

  // Multi-step Inward Wizard State (Step 1 -> Step 2)
  const [inwardStep, setInwardStep] = useState<1 | 2>(1);
  const [formError, setFormError] = useState<string | null>(null);

  // Current formatted time (e.g. "01:30 PM")
  const getCurrentFormattedTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Step 1 Form State (with comprehensive optional fields)
  const [inwardHeader, setInwardHeader] = useState({
    challanNo: '',
    challanDate: new Date().toISOString().split('T')[0],
    receivingDate: new Date().toISOString().split('T')[0],
    vehicleNo: '',
    transporter: 'VRL LOGISTICS',
    partyName: '',
    driverName: '',
    driverPhone: '',
    ewayBillNo: '',
    poNumber: '',
    totalBoxes: '',
    materialCategory: 'Party Material' as 'Party Material' | 'Internal Company',
    receivedBy: 'Manoj Tiwari (Store Dept)',
    securitySignature: currentUser?.name ? `${currentUser.name} (Gate Security)` : 'Ram Singh (Gate Security)',
    remarks: 'Boxes intact, physical seal verified at gate.'
  });

  // Step 2 Dynamic Material Items List (5. Description, 6. Quantity, 7. Unit)
  const [inwardItems, setInwardItems] = useState<InwardMaterialLineItem[]>([
    { id: 'item_1', itemCode: '', materialName: '', quantity: 100, unit: 'Pcs', batchNo: '', rawSubstrate: '' }
  ]);

  // Auto-dismiss toast
  useEffect(() => {
    if (submittedToast) {
      const timer = setTimeout(() => setSubmittedToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [submittedToast]);

  // Outward Form State
  const [outwardForm, setOutwardForm] = useState({
    vehicleNo: '',
    gatePassNo: `GTP-OUT-${Date.now().toString().slice(-4)}`,
    partyName: '',
    descriptionOfMaterial: '',
    quantity: 100,
    unit: 'Pcs' as const,
    transporter: 'VRL LOGISTICS',
    invoiceRef: '',
    remarks: 'Outward verified at Gate. Dispatched to Customer.'
  });

  const openNewInwardModal = () => {
    setFormError(null);
    setInwardStep(1);
    setInwardHeader({
      challanNo: '',
      challanDate: new Date().toISOString().split('T')[0],
      receivingDate: new Date().toISOString().split('T')[0],
      vehicleNo: '',
      transporter: '',
      partyName: '',
      driverName: '',
      driverPhone: '',
      ewayBillNo: '',
      poNumber: '',
      totalBoxes: '',
      materialCategory: 'Party Material',
      receivedBy: 'Manoj Tiwari (Store Dept)',
      securitySignature: currentUser?.name ? `${currentUser.name} (Gate Security)` : 'Ram Singh (Gate Security)',
      remarks: 'Boxes intact, physical seal verified at gate.'
    });
    setInwardItems([
      { id: `item_${Date.now()}`, itemCode: '', materialName: '', materialType: 'substrate', quantity: 100, unit: 'Pcs', batchNo: '', expiryDate: '', rawSubstrate: '' }
    ]);
    setShowInwardModal(true);
  };

  const handleAddItemRow = () => {
    const isCompany = inwardHeader.materialCategory === 'Internal Company';
    setInwardItems(prev => [
      ...prev,
      {
        id: `item_${Date.now()}_${prev.length + 1}`,
        itemCode: '',
        materialName: '',
        materialType: isCompany ? 'paint' : 'substrate',
        quantity: 100,
        unit: isCompany ? 'Litres' : 'Pcs',
        batchNo: '',
        expiryDate: '',
        rawSubstrate: ''
      }
    ]);
  };

  const handleRemoveItemRow = (id: string) => {
    if (inwardItems.length <= 1) return;
    setInwardItems(prev => prev.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof InwardMaterialLineItem, value: any) => {
    setInwardItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleStep1Next = () => {
    if (!inwardHeader.challanNo.trim() || !inwardHeader.vehicleNo.trim() || !inwardHeader.partyName.trim()) {
      setFormError('Kripya Challan No, Vehicle No aur Party Name bharein!');
      return;
    }
    setFormError(null);
    setInwardStep(2);
  };

  const handleInwardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inwardHeader.partyName.trim()) {
      setFormError('Kripya Party Name bharein!');
      return;
    }

    // Check all item rows
    const emptyRow = inwardItems.find(i => !i.materialName.trim());
    if (emptyRow) {
      setFormError('Kripya sabhi rows ka Description of Material bharein!');
      return;
    }

    // For Internal Company Material, validate Supplier Batch No
    if (inwardHeader.materialCategory === 'Internal Company') {
      const missingBatch = inwardItems.find(i => !i.batchNo?.trim());
      if (missingBatch) {
        setFormError('Company Material ke liye sabhi rows me Supplier Batch No bharna zaroori hai!');
        return;
      }
    }

    const currentYear = new Date().getFullYear();
    const newSrNo = `INW-${currentYear}-${Math.floor(100 + Math.random() * 900)}`;

    const totalQty = inwardItems.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);
    const summaryDescription = inwardItems.length === 1
      ? (inwardItems[0].itemCode ? `[${inwardItems[0].itemCode.trim()}] ` : '') + inwardItems[0].materialName
      : inwardItems.map(i => `${i.itemCode ? `[${i.itemCode.trim()}] ` : ''}${i.materialName} (${i.quantity} ${i.unit})`).join(', ');

    // Check if single unit or mixed units
    const distinctUnits = Array.from(new Set(inwardItems.map(i => (i.unit || 'Pcs').trim())));
    const primaryUnit = distinctUnits.length === 1 ? (distinctUnits[0] as any) : 'Mixed';

    // Automatic Live In-Time captured on registration
    const liveInTime = getCurrentFormattedTime();

    const newInward: MaterialInwardRecord = {
      srNo: newSrNo,
      date: new Date().toISOString().split('T')[0], // Creation Date preserved!
      challanNo: inwardHeader.challanNo.trim() || `CH-${Math.floor(1000 + Math.random() * 9000)}`,
      challanDate: inwardHeader.challanDate || new Date().toISOString().split('T')[0],
      receivingDate: inwardHeader.receivingDate || new Date().toISOString().split('T')[0],
      grnNo: 'Pending Store GRN', // GRN is generated later by Stores after IQC!
      inTime: liveInTime, // Creation live In-Time preserved!
      vehicleNo: inwardHeader.vehicleNo.trim(),
      partyName: inwardHeader.partyName.trim(),
      descriptionOfMaterial: summaryDescription,
      quantity: totalQty,
      unit: primaryUnit,
      items: inwardItems.map(i => ({
        id: i.id,
        itemCode: i.itemCode?.trim() || undefined,
        materialName: i.materialName.trim(),
        materialType: i.materialType || (inwardHeader.materialCategory === 'Internal Company' ? 'paint' : 'substrate'),
        quantity: Number(i.quantity) || 1,
        unit: i.unit,
        batchNo: i.batchNo?.trim() || undefined,
        expiryDate: i.expiryDate || undefined,
        category: inwardHeader.materialCategory === 'Internal Company' ? 'COMPANY_CONSUMABLE' : 'PARTY_MATERIAL',
        rawSubstrate: i.rawSubstrate?.trim() || undefined
      })),
      totalQuantity: totalQty,
      materialCategory: inwardHeader.materialCategory,
      transporter: inwardHeader.transporter.trim() || 'Direct Delivery',
      driverName: inwardHeader.driverName.trim() || undefined,
      driverPhone: inwardHeader.driverPhone.trim() || undefined,
      ewayBillNo: inwardHeader.ewayBillNo.trim() || undefined,
      poNumber: inwardHeader.poNumber.trim() || undefined,
      totalBoxes: inwardHeader.totalBoxes.trim() || undefined,
      receivedBy: inwardHeader.receivedBy,
      securitySignature: inwardHeader.securitySignature,
      remarks: inwardHeader.remarks || 'Gate entry logged by Security. Awaiting Store receipt.',
      plant: activePlant,
      status: 'Received at Gate'
    };

    addMaterialInwardRecord(newInward);
    setShowInwardModal(false);
    setActiveTab('INWARD');
    setSubmittedToast(`Inward Entry ${newSrNo} (Challan: ${newInward.challanNo}) safalta se register ho gaya!`);
  };

  const handleOutwardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outwardForm.partyName || !outwardForm.descriptionOfMaterial) return;

    const currentYear = new Date().getFullYear();
    const newOutward: MaterialOutwardRecord = {
      srNo: `OUT-${currentYear}-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().split('T')[0],
      vehicleNo: outwardForm.vehicleNo || 'DL-01-EE-7741',
      gatePassNo: outwardForm.gatePassNo,
      outTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      partyName: outwardForm.partyName,
      descriptionOfMaterial: outwardForm.descriptionOfMaterial,
      quantity: Number(outwardForm.quantity) || 1,
      unit: outwardForm.unit,
      transporter: outwardForm.transporter,
      securitySignature: currentUser?.name ? `${currentUser.name} (Gate Security)` : 'Ram Singh (Gate Security)',
      remarks: outwardForm.remarks || 'Outward verified at Gate. Dispatched to Customer.',
      plant: activePlant
    };

    addMaterialOutwardRecord(newOutward);

    // Also register in central vehicle GatePass registry for physical exit tracking
    const newGatePass: GatePassRecord = {
      gatePassNo: outwardForm.gatePassNo,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      plant: activePlant,
      type: 'Outward',
      movementType: 'Finished Goods',
      partyName: outwardForm.partyName,
      vehicleNo: outwardForm.vehicleNo || 'DL-01-EE-7741',
      itemDescription: outwardForm.descriptionOfMaterial,
      qty: Number(outwardForm.quantity) || 1,
      referenceDoc: outwardForm.invoiceRef || 'INV-2026-001',
      status: 'Open',
      securityOfficer: currentUser?.name || 'Ram Singh (Gate Security)'
    };
    createGatePass(newGatePass);

    setShowOutwardModal(false);
    setSubmittedToast(`Outward Entry Pass ${newOutward.gatePassNo} safalta se record ho gaya!`);
  };

  // Standardized PDF Generator for Gate Inward Pass
  const downloadInwardPDF = (item: MaterialInwardRecord) => {
    downloadStandardGateInwardPdf(item);
  };

  // Standardized PDF Generator for Gate Outward Pass
  const downloadOutwardPDF = (item: MaterialOutwardRecord) => {
    downloadStandardGateOutwardPdf(item);
  };

  // Filtered lists (Robust search across Inward SR No, Party, Vehicle, Challan, GRN, Description & Line Items)
  const filteredInward = materialInwardLogs.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      item.srNo?.toLowerCase().includes(q) ||
      item.partyName?.toLowerCase().includes(q) ||
      item.vehicleNo?.toLowerCase().includes(q) ||
      item.challanNo?.toLowerCase().includes(q) ||
      item.grnNo?.toLowerCase().includes(q) ||
      item.descriptionOfMaterial?.toLowerCase().includes(q) ||
      item.driverName?.toLowerCase().includes(q) ||
      item.transporter?.toLowerCase().includes(q) ||
      item.items?.some(i => i.materialName?.toLowerCase().includes(q) || i.itemCode?.toLowerCase().includes(q))
    );
  });

  const filteredOutward = materialOutwardLogs.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      item.gatePassNo?.toLowerCase().includes(q) ||
      item.partyName?.toLowerCase().includes(q) ||
      item.vehicleNo?.toLowerCase().includes(q) ||
      item.invoiceRef?.toLowerCase().includes(q) ||
      item.descriptionOfMaterial?.toLowerCase().includes(q) ||
      item.transporter?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Toast Notification (Critical Success Notification) */}
      {submittedToast && (
        <div className="p-3.5 px-4 rounded-[14px] bg-[#17191c] text-white shadow-xl flex items-center justify-between gap-3 border border-[#2b2e35] animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#c09748] shrink-0" />
            <span className="text-xs font-medium">{submittedToast}</span>
          </div>
          <button 
            onClick={() => setSubmittedToast(null)}
            className="text-gray-400 hover:text-white text-xs font-bold px-2 py-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* SaaS Contextual Header & Workbench Banner (Clean Editorial Header - No Action Buttons) */}
      <div className="bg-white rounded-[18px] border border-[#ececec] p-4 sm:p-5 shadow-xs flex items-center justify-between gap-4">
        <div className="space-y-1.5">
          {/* Breadcrumb Path & Meta Pills */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10.5px] sm:text-[11px]">
            <span className="font-semibold text-[#17191c]">Gate Security</span>
            <span className="text-gray-300">/</span>
            <span className="text-[#777b86]">
              {activeTab === 'INWARD' ? 'Material Inward' : activeTab === 'OUTWARD' ? 'Material Outward' : 'Vehicle Passes'}
            </span>
            <span className="text-gray-300">•</span>
            <span className="px-2 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] font-mono font-bold text-[10px]">
              {activePlant} Unit
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#fafafb] text-[#777b86] border border-[#ececec] font-mono text-[10px] truncate max-w-[140px] sm:max-w-none">
              {currentUser.name}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <h1 className="text-lg sm:text-2xl font-serif text-[#17191c] font-normal tracking-tight leading-tight">
              {activeTab === 'INWARD' && 'Material Inward Intake Desk'}
              {activeTab === 'OUTWARD' && 'Material Outward Dispatch Desk'}
              {activeTab === 'GATE_PASS' && 'Vehicle Movement & Gate Barrier'}
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-bold shrink-0">
              Live QMS
            </span>
          </div>
        </div>
      </div>

      {/* Segmented View Switcher & Search Bar (Mobile Responsive) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white p-2 sm:p-2.5 rounded-[16px] border border-[#ececec]">
        {/* Segmented View Switcher Buttons (Styled like IQC Dashboard) */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('INWARD')}
            className={`px-3.5 sm:px-4 py-2 sm:py-2 rounded-full text-[11px] sm:text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 active:scale-95 ${
              activeTab === 'INWARD'
                ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] font-bold shadow-2xs'
                : 'bg-[#fafafb] text-[#777b86] hover:text-[#17191c] border border-[#ececec]'
            }`}
          >
            <ArrowDownLeft className={`w-3.5 h-3.5 ${activeTab === 'INWARD' ? 'text-[#8a6521]' : 'text-[#777b86]'}`} />
            <span>Inwards</span>
            <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'INWARD' ? 'bg-[#f4e5be] text-[#8a6521]' : 'bg-[#f2f2f3] text-[#777b86]'
            }`}>
              {materialInwardLogs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('OUTWARD')}
            className={`px-3.5 sm:px-4 py-2 sm:py-2 rounded-full text-[11px] sm:text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 active:scale-95 ${
              activeTab === 'OUTWARD'
                ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] font-bold shadow-2xs'
                : 'bg-[#fafafb] text-[#777b86] hover:text-[#17191c] border border-[#ececec]'
            }`}
          >
            <ArrowUpRight className={`w-3.5 h-3.5 ${activeTab === 'OUTWARD' ? 'text-[#8a6521]' : 'text-[#777b86]'}`} />
            <span>Outwards</span>
            <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'OUTWARD' ? 'bg-[#f4e5be] text-[#8a6521]' : 'bg-[#f2f2f3] text-[#777b86]'
            }`}>
              {materialOutwardLogs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('GATE_PASS')}
            className={`px-3.5 sm:px-4 py-2 sm:py-2 rounded-full text-[11px] sm:text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 active:scale-95 ${
              activeTab === 'GATE_PASS'
                ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] font-bold shadow-2xs'
                : 'bg-[#fafafb] text-[#777b86] hover:text-[#17191c] border border-[#ececec]'
            }`}
          >
            <Truck className={`w-3.5 h-3.5 ${activeTab === 'GATE_PASS' ? 'text-[#8a6521]' : 'text-[#777b86]'}`} />
            <span>Vehicles</span>
            <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'GATE_PASS' ? 'bg-[#f4e5be] text-[#8a6521]' : 'bg-[#f2f2f3] text-[#777b86]'
            }`}>
              {gatePasses.length}
            </span>
          </button>
        </div>

        {/* Inline Compact Search */}
        <div className="relative flex-1 sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-3.5 h-3.5 text-[#777b86]" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search Challan, Party, Vehicle, Material..."
            style={{ paddingLeft: '32px' }}
            className="w-full h-8.5 pr-8 rounded-full bg-[#fafafb] border border-[#dcdfe4] text-xs text-[#17191c] placeholder:text-[#a3a6af] focus:outline-none focus:border-[#17191c] focus:bg-white transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#777b86] hover:text-[#17191c] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------------------------- */}
      {/* TAB 1: SUBMITTED INWARDS (CONCISE 4 KEY COLUMNS + VIEW DETAILS & PDF)      */}
      {/* -------------------------------------------------------------------------- */}
      {activeTab === 'INWARD' && (
        <div className="space-y-4">
          <div className="bg-white rounded-[24px] border border-[#ececec] p-4 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-serif font-normal text-[#17191c]">
                  Submitted Inwards Register ({filteredInward.length} records)
                </h2>
                <span className="text-[11px] text-[#777b86]">
                  Key Summary View • Click &quot;View Details&quot; for complete 12-field verification slip & printable PDF.
                </span>
              </div>
              <button
                onClick={openNewInwardModal}
                className="self-start sm:self-auto px-4 py-2 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-[#c09748]" />
                <span>+ New Inward Entry</span>
              </button>
            </div>

            <div className="relative">
              {/* DESKTOP VIEW: Clean 4-Column Table */}
              <div ref={inwardTableRef} className="hidden sm:block overflow-x-auto max-h-[520px] overflow-y-auto no-scrollbar border border-[#ececec] rounded-[16px]">
                <table className="w-full text-left text-xs overflow-hidden">
                  <thead className="bg-[#f2f2f3] text-[#17191c] border-b border-[#ececec] font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="p-3.5 w-44">1. INWARD REF & DATE</th>
                      <th className="p-3.5">2. SUPPLIER / PARTY</th>
                      <th className="p-3.5">3. MATERIAL & QUANTITY</th>
                      <th className="p-3.5 w-40">4. STATUS</th>
                      <th className="p-3.5 text-right w-44">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ececec] text-[#17191c]">
                    {filteredInward.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-[#777b86]">
                          Koi inward record nahi mila. &quot;+ New Inward Entry&quot; button par click karke naya entry log karein.
                        </td>
                      </tr>
                    ) : (
                      filteredInward.map((item, idx) => {
                        const breakdown = formatUnitBreakdown(
                          item.items && item.items.length > 0
                            ? item.items
                            : [{ quantity: item.quantity || 1, unit: item.unit || 'Pcs' }]
                        );
                        return (
                          <tr key={item.srNo || idx} className="hover:bg-[#fafafb] transition-colors">
                            {/* 1. Inward Ref & Date */}
                            <td className="p-3.5 whitespace-nowrap">
                              <div className="font-mono font-bold text-xs text-[#c09748]">{item.srNo}</div>
                              <div className="text-[11px] text-[#777b86] mt-0.5">
                                {formatDateDDMMYYYY(item.date)}
                              </div>
                            </td>

                            {/* 2. Supplier / Party */}
                            <td className="p-3.5">
                              <div className="font-semibold text-xs text-[#17191c] line-clamp-1" title={item.partyName}>
                                {item.partyName}
                              </div>
                              <div className="text-[11px] text-[#777b86] mt-0.5 font-mono">
                                {item.vehicleNo} • Ch: {item.challanNo}
                              </div>
                            </td>

                            {/* 3. Material & Quantity */}
                            <td className="p-3.5">
                              <div className="font-medium text-xs text-[#17191c] max-w-xs truncate" title={item.descriptionOfMaterial}>
                                {item.descriptionOfMaterial}
                              </div>
                              <div className="font-mono font-bold text-xs text-[#17191c] mt-0.5">
                                {breakdown.displayTotal}
                                {item.items && item.items.length > 1 && (
                                  <span className="text-[10px] text-[#777b86] font-normal font-sans ml-1.5">
                                    ({item.items.length} items)
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* 4. Status */}
                            <td className="p-3.5 whitespace-nowrap">
                              {item.grnNo && !item.grnNo.includes('Pending') ? (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10.5px] font-mono font-bold inline-flex items-center gap-1">
                                  <BadgeCheck className="w-3 h-3 text-emerald-600" />
                                  <span>{item.grnNo}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10.5px] font-medium">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>Pending Store GRN</span>
                                </span>
                              )}
                            </td>

                            {/* 5. Action */}
                            <td className="p-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedInward(item)}
                                  className="px-3 py-1.5 rounded-full border border-[#dcdfe4] bg-white hover:bg-[#17191c] hover:text-white hover:border-[#17191c] text-xs font-medium text-[#17191c] transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                  title="View Full Verification Slip"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View Details</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => downloadInwardPDF(item)}
                                  className="w-8 h-8 rounded-full border border-[#dcdfe4] bg-white hover:bg-[#17191c] hover:text-white hover:border-[#17191c] text-[#777b86] transition cursor-pointer flex items-center justify-center shadow-2xs"
                                  title="Download PDF Pass"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE VIEW (<640px): Ultra-Clean Responsive Cards */}
              <div className="sm:hidden space-y-2.5">
                {filteredInward.length === 0 ? (
                  <div className="p-6 text-center text-[#777b86] bg-[#fafafb] rounded-[16px] border border-[#ececec]">
                    Koi inward record nahi mila.
                  </div>
                ) : (
                  filteredInward.map((item, idx) => {
                    const breakdown = formatUnitBreakdown(
                      item.items && item.items.length > 0
                        ? item.items
                        : [{ quantity: item.quantity || 1, unit: item.unit || 'Pcs' }]
                    );
                    return (
                      <div key={item.srNo || idx} className="bg-[#fafafb] p-3.5 rounded-[18px] border border-[#ececec] space-y-2 shadow-2xs">
                        {/* 1. Header: Ref No + Status Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-xs text-[#c09748] tracking-tight shrink-0">
                            {item.srNo}
                          </span>
                          {item.grnNo && !item.grnNo.includes('Pending') ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-bold shrink-0">
                              {item.grnNo}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-medium shrink-0">
                              Pending Store GRN
                            </span>
                          )}
                        </div>

                        {/* 2. Core Body: Party Name, Date, Material & Total Qty */}
                        <div className="space-y-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <div className="font-semibold text-xs text-[#17191c] truncate" title={item.partyName}>
                              {item.partyName}
                            </div>
                            <div className="text-[10.5px] text-[#777b86] shrink-0 font-medium">
                              {formatDateDDMMYYYY(item.date)}
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 text-[11px]">
                            <div className="text-[#777b86] truncate max-w-[65%]" title={item.descriptionOfMaterial}>
                              {item.descriptionOfMaterial}
                            </div>
                            <div className="font-mono font-bold text-xs text-[#17191c] shrink-0">
                              {breakdown.displayTotal}
                            </div>
                          </div>
                        </div>

                        {/* 3. Actions Footer */}
                        <div className="pt-2 border-t border-[#ececec] flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedInward(item)}
                            className="flex-1 h-8 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#c09748]" />
                            <span>View Details</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadInwardPDF(item)}
                            className="h-8 px-3 rounded-full border border-[#dcdfe4] bg-white hover:bg-gray-100 text-[#17191c] text-xs font-medium flex items-center justify-center gap-1 transition cursor-pointer shrink-0"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Floating scroll indicator toast on desktop table */}
              <ScrollRemainingToast
                containerRef={inwardTableRef}
                totalCount={filteredInward.length}
                label="MORE INWARD RECORDS BELOW"
                position="bottom"
                className="hidden sm:flex"
              />
            </div>
        </div>
      </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* TAB 2: MATERIAL OUTWARD REGISTER (CONCISE 4 KEY COLUMNS + MOBILE CARDS)    */}
      {/* -------------------------------------------------------------------------- */}
      {activeTab === 'OUTWARD' && (
        <div className="space-y-4">
          <div className="bg-white rounded-[24px] border border-[#ececec] p-4 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-serif font-normal text-[#17191c]">
                  Material Outward Register ({filteredOutward.length} records)
                </h2>
                <span className="text-[11px] text-[#777b86]">
                  Key Summary View • Click &quot;View Details&quot; for complete gate pass verification slip & printable PDF.
                </span>
              </div>
              <button
                onClick={() => setShowOutwardModal(true)}
                className="self-start sm:self-auto px-4 py-2 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-[#c09748]" />
                <span>+ New Outward Gate Pass</span>
              </button>
            </div>

            <div className="relative">
              {/* DESKTOP VIEW: Clean 4-Column Table */}
              <div ref={outwardTableRef} className="hidden sm:block overflow-x-auto max-h-[520px] overflow-y-auto no-scrollbar border border-[#ececec] rounded-[16px]">
                <table className="w-full text-left text-xs overflow-hidden">
                  <thead className="bg-[#f2f2f3] text-[#17191c] border-b border-[#ececec] font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="p-3.5 w-44">1. OUTWARD REF & DATE</th>
                      <th className="p-3.5">2. CUSTOMER / PARTY</th>
                      <th className="p-3.5">3. MATERIAL & QUANTITY</th>
                      <th className="p-3.5 w-40">4. STATUS</th>
                      <th className="p-3.5 text-right w-44">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ececec] text-[#17191c]">
                    {filteredOutward.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-[#777b86]">
                          Koi outward record nahi mila. &quot;+ New Outward Gate Pass&quot; button par click karke naya dispatch log karein.
                        </td>
                      </tr>
                    ) : (
                      filteredOutward.map((item, idx) => (
                        <tr key={item.srNo || idx} className="hover:bg-[#fafafb] transition-colors">
                          {/* 1. Outward Ref & Date */}
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="font-mono font-bold text-xs text-[#c09748]">{item.gatePassNo || item.srNo}</div>
                            <div className="text-[11px] text-[#777b86] mt-0.5">
                              {formatDateDDMMYYYY(item.date)} {item.outTime && `• ${item.outTime}`}
                            </div>
                          </td>

                          {/* 2. Customer / Party */}
                          <td className="p-3.5">
                            <div className="font-semibold text-xs text-[#17191c] line-clamp-1" title={item.partyName}>
                              {item.partyName}
                            </div>
                            <div className="text-[11px] text-[#777b86] mt-0.5 font-mono">
                              {item.vehicleNo} • {item.transporter || 'Direct Dispatch'}
                            </div>
                          </td>

                          {/* 3. Material & Quantity */}
                          <td className="p-3.5">
                            <div className="font-medium text-xs text-[#17191c] max-w-xs truncate" title={item.descriptionOfMaterial}>
                              {item.descriptionOfMaterial}
                            </div>
                            <div className="font-mono font-bold text-xs text-[#17191c] mt-0.5">
                              {item.quantity} {item.unit || 'Pcs'}
                            </div>
                          </td>

                          {/* 4. Status */}
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10.5px] font-mono font-bold inline-flex items-center gap-1">
                              <BadgeCheck className="w-3 h-3 text-emerald-600" />
                              <span>Dispatched</span>
                            </span>
                          </td>

                          {/* 5. Action */}
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedOutward(item)}
                                className="px-3 py-1.5 rounded-full border border-[#dcdfe4] bg-white hover:bg-[#17191c] hover:text-white hover:border-[#17191c] text-xs font-medium text-[#17191c] transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                title="View Full Verification Slip"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Details</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => downloadOutwardPDF(item)}
                                className="w-8 h-8 rounded-full border border-[#dcdfe4] bg-white hover:bg-[#17191c] hover:text-white hover:border-[#17191c] text-[#777b86] transition cursor-pointer flex items-center justify-center shadow-2xs"
                                title="Download PDF Pass"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE VIEW (<640px): Ultra-Clean Responsive Cards (Identical to Inward cards) */}
              <div className="sm:hidden space-y-2.5">
                {filteredOutward.length === 0 ? (
                  <div className="p-6 text-center text-[#777b86] bg-[#fafafb] rounded-[16px] border border-[#ececec]">
                    Koi outward record nahi mila.
                  </div>
                ) : (
                  filteredOutward.map((item, idx) => (
                    <div key={item.srNo || idx} className="bg-[#fafafb] p-3.5 rounded-[18px] border border-[#ececec] space-y-2 shadow-2xs">
                      {/* 1. Header: Gate Pass No + Dispatched Status Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-xs text-[#c09748] tracking-tight shrink-0">
                          {item.gatePassNo || item.srNo}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-bold shrink-0">
                          Dispatched
                        </span>
                      </div>

                      {/* 2. Core Body: Party Name, Date, Material & Total Qty */}
                      <div className="space-y-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <div className="font-semibold text-xs text-[#17191c] truncate" title={item.partyName}>
                            {item.partyName}
                          </div>
                          <div className="text-[10.5px] text-[#777b86] shrink-0 font-medium">
                            {formatDateDDMMYYYY(item.date)}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <div className="text-[#777b86] truncate max-w-[65%]" title={item.descriptionOfMaterial}>
                            {item.descriptionOfMaterial}
                          </div>
                          <div className="font-mono font-bold text-xs text-[#17191c] shrink-0">
                            {item.quantity} {item.unit || 'Pcs'}
                          </div>
                        </div>
                      </div>

                      {/* 3. Actions Footer */}
                      <div className="pt-2 border-t border-[#ececec] flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedOutward(item)}
                          className="flex-1 h-8 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#c09748]" />
                          <span>View Details</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadOutwardPDF(item)}
                          className="h-8 px-3 rounded-full border border-[#dcdfe4] bg-white hover:bg-gray-100 text-[#17191c] text-xs font-medium flex items-center justify-center gap-1 transition cursor-pointer shrink-0"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Floating scroll indicator toast on desktop table */}
              <ScrollRemainingToast
                containerRef={outwardTableRef}
                totalCount={filteredOutward.length}
                label="MORE OUTWARD RECORDS BELOW"
                position="bottom"
                className="hidden sm:flex"
              />
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* TAB 3: VEHICLE GATE PASSES                                                 */}
      {/* -------------------------------------------------------------------------- */}
      {activeTab === 'GATE_PASS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-[20px] border border-[#ececec] shadow-xs">
              <div className="text-xs text-[#777b86]">Active Passes</div>
              <div className="text-2xl font-serif font-normal text-[#17191c] mt-1">
                {gatePasses.filter(p => p.status === 'Open').length}
              </div>
            </div>
            <div className="bg-white p-5 rounded-[20px] border border-[#ececec] shadow-xs">
              <div className="text-xs text-[#777b86]">Closed / Exited Today</div>
              <div className="text-2xl font-serif font-normal text-emerald-700 mt-1">
                {gatePasses.filter(p => p.status === 'Closed').length}
              </div>
            </div>
            <div className="bg-white p-5 rounded-[20px] border border-[#ececec] shadow-xs">
              <div className="text-xs text-[#777b86]">Total Vehicles Logged</div>
              <div className="text-2xl font-serif font-normal text-[#c09748] mt-1">
                {gatePasses.length}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gatePasses.map((gp) => (
              <div key={gp.gatePassNo} className="bg-white rounded-[24px] border border-[#ececec] p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#ececec]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-xs text-[#17191c]">{gp.gatePassNo}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      gp.status === 'Open' 
                        ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      {gp.status}
                    </span>
                  </div>
                  <span className="text-xs text-[#777b86]">{gp.date}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#777b86] block text-[11px]">Vehicle No</span>
                    <span className="font-mono font-semibold text-[#17191c]">{gp.vehicleNo}</span>
                  </div>
                  <div>
                    <span className="text-[#777b86] block text-[11px]">Driver & Contact</span>
                    <span className="font-normal text-[#17191c]">{gp.driverName} ({gp.driverPhone})</span>
                  </div>
                  <div>
                    <span className="text-[#777b86] block text-[11px]">Purpose</span>
                    <span className="font-normal text-[#17191c]">{gp.purpose}</span>
                  </div>
                  <div>
                    <span className="text-[#777b86] block text-[11px]">Material Item</span>
                    <span className="font-normal text-[#17191c]">{gp.materialDescription}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#ececec] flex items-center justify-between">
                  <div>
                    <div className="font-serif font-normal text-xl text-[#17191c]">{gp.qty} pcs</div>
                    <div className="text-[11px] text-[#777b86]">Officer: <strong className="text-[#17191c] font-medium">{gp.securityOfficer}</strong></div>
                  </div>
                </div>

                {gp.status === 'Open' && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => updateGatePassStatus(gp.gatePassNo, 'Closed')}
                      className="flex items-center justify-center px-5 py-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-medium transition cursor-pointer shadow-xs w-full sm:w-auto"
                    >
                      Confirm Physical Exit & Close Pass
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* POPUP MODAL: PROFESSIONAL VIEW DETAILS SLIP & PRINT/PDF                    */}
      {/* -------------------------------------------------------------------------- */}
      {selectedInward && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-[24px] max-w-4xl w-full p-5 sm:p-8 shadow-2xl border border-[#ececec] space-y-6 max-h-[92vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="pb-4 border-b border-[#ececec] space-y-2.5">
              {/* Row 1: Title & Close Button */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <h3 className="text-lg sm:text-2xl font-serif text-[#17191c] font-normal tracking-tight">
                    Gate Inward Verification Slip
                  </h3>
                  <p className="text-[11px] font-mono text-[#777b86]">
                    Security Gate Material Intake Record • PaintKing Surface Solutions
                  </p>
                </div>

                <button 
                  onClick={() => setSelectedInward(null)}
                  className="w-8 h-8 rounded-full bg-[#fafafb] hover:bg-gray-100 text-[#777b86] hover:text-[#17191c] border border-[#ececec] flex items-center justify-center cursor-pointer transition shrink-0"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Row 2: Clean Badge Metadata Strip */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-[10px] sm:text-[11px]">
                <span className="px-2.5 py-0.5 rounded-full font-bold bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]">
                  PK-SEC-INW-001 (Rev 00)
                </span>
                <span className="font-mono font-bold text-[#17191c] bg-[#fafafb] px-2.5 py-0.5 rounded-full border border-[#ececec]">
                  Gate Pass: {selectedInward.srNo}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full font-bold border ${
                  selectedInward.grnNo
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {selectedInward.grnNo ? `✓ GRN: ${selectedInward.grnNo}` : 'Pending Store GRN'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full font-mono bg-gray-100 text-[#777b86] border border-gray-200 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#777b86]" />
                  <span>{formatDateDDMMYYYY(selectedInward.receivingDate || selectedInward.date)} at {selectedInward.inTime || '10:30 AM'}</span>
                </span>
              </div>
            </div>

            {/* 8 Structured Summary Cards (2-4 Responsive Grid) */}
            {(() => {
              const breakdown = formatUnitBreakdown(
                selectedInward.items && selectedInward.items.length > 0
                  ? selectedInward.items
                  : [{ quantity: selectedInward.quantity || 1, unit: selectedInward.unit || 'Pcs' }]
              );

              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Card 1 */}
                    <div className="p-3.5 rounded-[14px] bg-[#fafafb] border border-[#ececec] space-y-1">
                      <span className="text-[10px] font-semibold text-[#777b86] uppercase tracking-wider block">Inward Sr No & Time</span>
                      <div className="font-mono font-bold text-sm text-[#c09748]">{selectedInward.srNo}</div>
                      <div className="text-[11px] text-[#777b86]">
                        {formatDateDDMMYYYY(selectedInward.receivingDate || selectedInward.date)} • {selectedInward.inTime || '10:30 AM'}
                      </div>
                    </div>

                    {/* Card 2 */}
                    <div className="p-3.5 rounded-[14px] bg-[#fafafb] border border-[#ececec] space-y-1">
                      <span className="text-[10px] font-semibold text-[#777b86] uppercase tracking-wider block">Supplier / Party</span>
                      <div className="font-semibold text-xs text-[#17191c] truncate" title={selectedInward.partyName}>
                        {selectedInward.partyName}
                      </div>
                      <div className="text-[11px] font-mono text-[#777b86]">
                        Challan: <strong className="text-[#17191c]">{selectedInward.challanNo}</strong>
                      </div>
                    </div>

                    {/* Card 3 */}
                    <div className="p-3.5 rounded-[14px] bg-[#fafafb] border border-[#ececec] space-y-1">
                      <span className="text-[10px] font-semibold text-[#777b86] uppercase tracking-wider block">Vehicle & Driver</span>
                      <div className="font-mono font-bold text-xs text-[#17191c]">{selectedInward.vehicleNo}</div>
                      <div className="text-[11px] text-[#777b86]">
                        Driver: {selectedInward.driverPhone || 'On File'}
                      </div>
                    </div>

                    {/* Card 4 */}
                    <div className="p-3.5 rounded-[14px] bg-[#fafafb] border border-[#ececec] space-y-1">
                      <span className="text-[10px] font-semibold text-[#777b86] uppercase tracking-wider block">Transporter & E-Way</span>
                      <div className="font-medium text-xs text-[#17191c] truncate" title={selectedInward.transporter || 'Direct Delivery'}>
                        {selectedInward.transporter || 'Direct Delivery'}
                      </div>
                      <div className="text-[11px] font-mono text-[#777b86]">
                        E-Way: <span className="font-semibold text-[#17191c]">{selectedInward.ewayBillNo || '-'}</span>
                      </div>
                    </div>

                    {/* Card 5 */}
                    <div className="p-3.5 rounded-[14px] bg-[#fafafb] border border-[#ececec] space-y-1">
                      <span className="text-[10px] font-semibold text-[#777b86] uppercase tracking-wider block">Total Recorded Qty</span>
                      <div className="font-mono font-bold text-xs text-emerald-800">{breakdown.displayTotal}</div>
                      <div className="text-[11px] text-[#777b86]">
                        {selectedInward.items?.length || 1} Line Item(s) Intake
                      </div>
                    </div>

                    {/* Card 6 */}
                    <div className="p-3.5 rounded-[14px] bg-[#fafafb] border border-[#ececec] space-y-1">
                      <span className="text-[10px] font-semibold text-[#777b86] uppercase tracking-wider block">Challan Date</span>
                      <div className="font-medium text-xs text-[#17191c]">
                        {formatDateDDMMYYYY(selectedInward.challanDate || selectedInward.date)}
                      </div>
                      <div className="text-[11px] text-[#777b86]">Vendor Dispatched Date</div>
                    </div>

                    {/* Card 7 */}
                    <div className="p-3.5 rounded-[14px] bg-[#fafafb] border border-[#ececec] space-y-1">
                      <span className="text-[10px] font-semibold text-[#777b86] uppercase tracking-wider block">Store GRN Status</span>
                      <div className={`font-mono font-bold text-xs ${selectedInward.grnNo ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {selectedInward.grnNo || 'Pending Store GRN'}
                      </div>
                      <div className="text-[11px] text-[#777b86]">
                        {selectedInward.grnNo ? 'Material Intake in Stores' : 'Awaiting Store Intake'}
                      </div>
                    </div>

                    {/* Card 8 */}
                    <div className="p-3.5 rounded-[14px] bg-[#fafafb] border border-[#ececec] space-y-1">
                      <span className="text-[10px] font-semibold text-[#777b86] uppercase tracking-wider block">IQC Quality Status</span>
                      <div className={`font-semibold text-xs ${
                        selectedInward.iqcStatus === 'Accepted'
                          ? 'text-emerald-700'
                          : selectedInward.iqcStatus === 'Hold'
                          ? 'text-amber-700'
                          : selectedInward.iqcStatus === 'Rejected'
                          ? 'text-rose-700'
                          : 'text-[#777b86]'
                      }`}>
                        {selectedInward.iqcStatus ? `${selectedInward.iqcStatus}` : 'Pending IQC'}
                      </div>
                      <div className="text-[11px] text-[#777b86]">
                        {selectedInward.iqcStatus === 'Accepted' ? '✓ Cleared for Production' : 'Quality Intake Audit'}
                      </div>
                    </div>
                  </div>

                  {/* Material Items Breakdown Table */}
                  <div className="space-y-2">
                    {(() => {
                      const hasItemCode = selectedInward.items?.some(it => it.itemCode && it.itemCode.trim().length > 0);
                      const totalColSpan = hasItemCode ? 3 : 2;

                      return (
                        <>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-bold text-[#17191c] uppercase tracking-wider">
                              Material Line Items Intake ({selectedInward.items?.length || 1} Items)
                            </span>
                            <span className="text-[11px] font-mono font-semibold text-[#17191c] bg-[#fafafb] px-2.5 py-1 rounded-full border border-[#ececec]">
                              Total: {breakdown.displayTotal}
                            </span>
                          </div>

                          <div className="border border-[#ececec] rounded-[16px] overflow-hidden bg-white">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-[#f2f2f3] text-[#17191c] font-semibold border-b border-[#ececec]">
                                  <tr>
                                    <th className="p-3 w-14 text-center">SR NO.</th>
                                    {hasItemCode && <th className="p-3 w-32 min-w-[120px]">Item / Part Code</th>}
                                    <th className="p-3 min-w-[200px]">Material Description</th>
                                    <th className="p-3 text-center w-28 whitespace-nowrap">Quantity</th>
                                    <th className="p-3 text-center w-20 whitespace-nowrap">Unit</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#ececec] text-[#17191c]">
                                  {selectedInward.items && selectedInward.items.length > 0 ? (
                                    selectedInward.items.map((it, idx) => (
                                      <tr key={it.id || idx} className="hover:bg-[#fafafb] transition">
                                        <td className="p-3 text-center font-mono text-[#777b86] font-semibold">{idx + 1}</td>
                                        {hasItemCode && (
                                          <td className="p-3 font-mono text-xs font-medium text-[#17191c]">
                                            {it.itemCode || '-'}
                                          </td>
                                        )}
                                        <td className="p-3 font-medium text-[#17191c]">
                                          {it.materialName}
                                        </td>
                                        <td className="p-3 text-center font-mono font-bold text-emerald-800">{it.quantity}</td>
                                        <td className="p-3 text-center text-[#777b86]">{it.unit}</td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr className="hover:bg-[#fafafb] transition">
                                      <td className="p-3 text-center font-mono text-[#777b86] font-semibold">1</td>
                                      {hasItemCode && <td className="p-3 text-center font-mono text-[#777b86]">-</td>}
                                      <td className="p-3 font-medium text-[#17191c]">{selectedInward.descriptionOfMaterial}</td>
                                      <td className="p-3 text-center font-mono font-bold text-emerald-800">{selectedInward.quantity}</td>
                                      <td className="p-3 text-center text-[#777b86]">{selectedInward.unit}</td>
                                    </tr>
                                  )}
                                </tbody>
                                <tfoot className="border-t-2 border-[#ececec] bg-[#fafafb]">
                                  {breakdown.isSingleUnit ? (
                                    <tr className="font-bold">
                                      <td colSpan={totalColSpan} className="p-3 text-right text-[11px] uppercase tracking-wider text-[#17191c]">
                                        Total Quantity Received
                                      </td>
                                      <td className="p-3 text-center font-mono text-sm text-[#17191c]">
                                        {breakdown.totalQty}
                                      </td>
                                      <td className="p-3 text-center font-medium text-[#17191c]">
                                        {breakdown.primaryUnit}
                                      </td>
                                    </tr>
                                  ) : (
                                    <>
                                      {breakdown.multiItemUnitTotals.length > 0 &&
                                        breakdown.multiItemUnitTotals.map(u => (
                                          <tr key={u.unit} className="text-xs">
                                            <td colSpan={totalColSpan} className="p-2.5 text-right font-medium text-[#777b86]">
                                              Sub-Total ({u.unit} • {u.itemCount} items)
                                            </td>
                                            <td className="p-2.5 text-center font-mono font-bold text-[#17191c]">
                                              {u.quantity}
                                            </td>
                                            <td className="p-2.5 text-center text-[#777b86]">
                                              {u.unit}
                                            </td>
                                          </tr>
                                        ))}
                                      <tr className="bg-[#f2f2f3] font-bold">
                                        <td colSpan={totalColSpan} className="p-3 text-right text-[11px] uppercase tracking-wider text-[#17191c]">
                                          Consolidated Total ({selectedInward.items?.length || 1} Line Items)
                                        </td>
                                        <td className="p-3 text-center font-mono text-xs text-[#17191c]">
                                          {selectedInward.items?.length || 1} Items
                                        </td>
                                        <td className="p-3 text-center text-xs text-[#777b86]">
                                          Various
                                        </td>
                                      </tr>
                                    </>
                                  )}
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </>
              );
            })()}

            {/* Custody & Inspection Note */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-[14px] bg-[#fafafb] border border-[#ececec] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-[#777b86] uppercase block">Received By (Store Dept)</span>
                  <div className="font-bold text-xs text-[#17191c] mt-0.5">{selectedInward.receivedBy || 'Manoj Tiwari (Store Dept)'}</div>
                  <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                    Physical Store Intake Confirmed
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  ✓ Store Clearance
                </span>
              </div>

              <div className="p-3.5 rounded-[14px] bg-[#fafafb] border border-[#ececec] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-[#777b86] uppercase block">Security Officer Signature</span>
                  <div className="font-bold text-xs text-[#17191c] mt-0.5">{selectedInward.securitySignature || 'Ram Singh (Gate Security)'}</div>
                  <div className="text-[10px] text-[#777b86] font-mono mt-0.5">
                    Gate Seal Verified at Intake
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  ✓ Gate Verified
                </span>
              </div>

              <div className="sm:col-span-2 p-3.5 rounded-[14px] bg-[#fafafb] border border-[#ececec]">
                <span className="text-[10px] font-semibold text-[#777b86] uppercase tracking-wider block mb-0.5">
                  Physical Verification Remarks
                </span>
                <div className="text-xs text-[#17191c] font-medium">{selectedInward.remarks || 'Boxes intact, physical seal verified at gate barrier.'}</div>
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
                  onClick={() => setEmailModalPayload(composeGatePassEmailDraft(selectedInward))}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95 whitespace-nowrap"
                  title="Compose and Email Inward Gate Pass to Party"
                >
                  <Mail className="w-3.5 h-3.5 text-[#c09748]" />
                  <span>Email Pass</span>
                </button>

                <button
                  type="button"
                  onClick={() => downloadInwardPDF(selectedInward)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95 whitespace-nowrap"
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
                  onClick={() => setSelectedInward(null)}
                  className="flex items-center justify-center px-4 py-2 rounded-full border border-[#e5e7eb] bg-white text-[#777b86] hover:bg-gray-50 text-xs font-semibold transition cursor-pointer shadow-2xs whitespace-nowrap"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* POPUP MODAL: OUTWARD VIEW DETAILS SLIP & PRINT/PDF                         */}
      {/* -------------------------------------------------------------------------- */}
      {selectedOutward && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[24px] max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-[#ececec] space-y-6 max-h-[92vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="pb-4 border-b border-[#ececec] space-y-2.5">
              {/* Row 1: Title & Close Button */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <h3 className="text-lg sm:text-2xl font-serif text-[#17191c] font-normal tracking-tight">
                    Gate Outward Verification Slip
                  </h3>
                  <p className="text-[11px] font-mono text-[#777b86]">
                    Finished Goods Dispatch & Exit Record • PaintKing Surface Solutions
                  </p>
                </div>

                <button 
                  onClick={() => setSelectedOutward(null)}
                  className="w-8 h-8 rounded-full bg-[#fafafb] hover:bg-gray-100 text-[#777b86] hover:text-[#17191c] border border-[#ececec] flex items-center justify-center cursor-pointer transition shrink-0"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Row 2: Clean Badge Metadata Strip */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-[10px] sm:text-[11px]">
                <span className="px-2.5 py-0.5 rounded-full font-bold bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]">
                  PK-SEC-OUT-001 (Rev 00)
                </span>
                <span className="font-mono font-bold text-[#17191c] bg-[#fafafb] px-2.5 py-0.5 rounded-full border border-[#ececec]">
                  Gate Pass: {selectedOutward.gatePassNo || selectedOutward.srNo}
                </span>
                <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  ✓ Dispatched & Passed
                </span>
                <span className="px-2.5 py-0.5 rounded-full font-mono bg-gray-100 text-[#777b86] border border-gray-200 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#777b86]" />
                  <span>{formatDateDDMMYYYY(selectedOutward.date)} at {selectedOutward.outTime || '04:30 PM'}</span>
                </span>
              </div>
            </div>

            {/* 9 Structured Summary Cards (3 Rows x 3 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Row 1 */}
              <div className="p-3.5 rounded-[14px] bg-[#fafafb] border border-[#ececec] space-y-1">
                <span className="text-[10px] font-semibold text-[#17191c] uppercase tracking-wider block">Outward Sr No.</span>
                <div className="font-mono font-bold text-sm text-[#c09748]">{selectedOutward.srNo}</div>
              </div>

              <div className="p-3.5 rounded-[14px] bg-[#fafafb] border border-[#ececec] space-y-1">
                <span className="text-[10px] font-semibold text-[#17191c] uppercase tracking-wider block">Gate Pass No.</span>
                <div className="font-mono text-xs font-bold text-[#17191c]">{selectedOutward.gatePassNo}</div>
              </div>

              <div className="p-3.5 rounded-[14px] bg-[#fafafb] border border-[#ececec] space-y-1">
                <span className="text-[10px] font-semibold text-[#17191c] uppercase tracking-wider block">Dispatch Date & Time</span>
                <div className="text-xs font-medium text-[#777b86]">{formatDateDDMMYYYY(selectedOutward.date)} {selectedOutward.outTime && `• ${selectedOutward.outTime}`}</div>
              </div>

              {/* Row 2 */}
              <div className="p-3.5 rounded-[14px] bg-[#fafafb] border border-[#ececec] space-y-1">
                <span className="text-[10px] font-semibold text-[#17191c] uppercase tracking-wider block">Customer / Party Name</span>
                <div className="text-xs font-medium text-[#777b86] truncate" title={selectedOutward.partyName}>{selectedOutward.partyName}</div>
              </div>

              <div className="p-3.5 rounded-[14px] bg-[#fafafb] border border-[#ececec] space-y-1">
                <span className="text-[10px] font-semibold text-[#17191c] uppercase tracking-wider block">Vehicle Number</span>
                <div className="font-mono text-xs font-medium text-[#777b86]">{selectedOutward.vehicleNo}</div>
              </div>

              <div className="p-3.5 rounded-[14px] bg-[#fafafb] border border-[#ececec] space-y-1">
                <span className="text-[10px] font-semibold text-[#17191c] uppercase tracking-wider block">Transporter / Courier</span>
                <div className="text-xs font-medium text-[#777b86]">{selectedOutward.transporter || 'Direct Dispatch'}</div>
              </div>

              {/* Row 3 */}
              <div className="p-3.5 rounded-[14px] bg-[#fafafb] border border-[#ececec] space-y-1">
                <span className="text-[10px] font-semibold text-[#17191c] uppercase tracking-wider block">Total Dispatched Qty</span>
                <div className="font-mono font-bold text-xs text-[#17191c]">{selectedOutward.quantity} {selectedOutward.unit || 'Pcs'}</div>
              </div>

              <div className="p-3.5 rounded-[14px] bg-[#fafafb] border border-[#ececec] space-y-1">
                <span className="text-[10px] font-semibold text-[#17191c] uppercase tracking-wider block">Linked Tax Invoice</span>
                <div className="font-mono text-xs font-medium text-[#777b86]">{(selectedOutward as any).invoiceRef || 'Direct Dispatch'}</div>
              </div>

              <div className="p-3.5 rounded-[14px] bg-[#fafafb] border border-[#ececec] space-y-1">
                <span className="text-[10px] font-semibold text-[#17191c] uppercase tracking-wider block">Operational Plant</span>
                <div className="font-mono text-xs font-medium text-[#777b86]">{selectedOutward.plant || activePlant} Unit</div>
              </div>
            </div>

            {/* Material Items Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#777b86] uppercase tracking-wider">
                  Finished Goods & Material Breakdown
                </span>
                <span className="text-[11px] font-mono font-semibold text-[#17191c] bg-[#fafafb] px-2.5 py-1 rounded-md border border-[#ececec]">
                  Total: {selectedOutward.quantity} {selectedOutward.unit || 'Pcs'}
                </span>
              </div>

              <div className="border border-[#ececec] rounded-[16px] overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#fafafb] text-[#777b86] border-b border-[#ececec] font-semibold text-[11px]">
                    <tr className="divide-x divide-[#ececec]">
                      <th className="p-2.5 w-14 text-center">SR NO.</th>
                      <th className="p-2.5">Material Description</th>
                      <th className="p-2.5 text-center w-28">Quantity</th>
                      <th className="p-2.5 text-center w-20">Unit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ececec] text-[#17191c] text-xs">
                    <tr className="divide-x divide-[#ececec]">
                      <td className="p-2.5 text-center font-mono text-[#777b86]">1</td>
                      <td className="p-2.5 font-medium">{selectedOutward.descriptionOfMaterial}</td>
                      <td className="p-2.5 text-center font-mono font-semibold">{selectedOutward.quantity}</td>
                      <td className="p-2.5 text-center text-[#777b86]">{selectedOutward.unit || 'Pcs'}</td>
                    </tr>
                  </tbody>
                  <tfoot className="border-t-2 border-[#ececec] bg-[#fafafb]">
                    <tr className="divide-x divide-[#ececec] font-bold">
                      <td className="p-2.5 text-right text-[11px] uppercase tracking-wider text-[#17191c]">
                        Total Quantity Dispatched
                      </td>
                      <td className="p-2.5 text-right text-[11px] uppercase tracking-wider text-[#777b86]"></td>
                      <td className="p-2.5 text-center font-mono text-sm text-[#17191c]">
                        {selectedOutward.quantity}
                      </td>
                      <td className="p-2.5 text-center font-medium text-[#17191c]">
                        {selectedOutward.unit || 'Pcs'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Custody & Inspection Note */}
            <div className="p-4 rounded-[16px] bg-[#fafafb] border border-[#ececec] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] font-semibold text-[#777b86] uppercase tracking-wider block mb-1">
                  Dispatch Incharge
                </span>
                <div className="font-medium text-[#17191c]">Authorized Dispatch Desk</div>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-[#777b86] uppercase tracking-wider block mb-1">
                  Security Officer Signature
                </span>
                <div className="font-mono text-[#17191c] flex items-center gap-1.5">
                  <BadgeCheck className="w-4 h-4 text-emerald-600" />
                  <span>{selectedOutward.securitySignature || 'Ram Singh (Gate Security)'}</span>
                </div>
              </div>

              <div className="sm:col-span-2 pt-2 border-t border-[#ececec]">
                <span className="text-[10px] font-semibold text-[#777b86] uppercase tracking-wider block mb-0.5">
                  Gate Verification & Remarks
                </span>
                <div className="text-[#777b86]">{selectedOutward.remarks || 'Outward verified at factory gate barrier. Material cleared for physical transit.'}</div>
              </div>
            </div>

            {/* Modal Actions Bar (Download PDF, Print, Close) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#ececec]">
              <div className="text-[11px] text-[#777b86] font-mono text-center sm:text-left hidden lg:block">
                ISO 9001:2015 & IATF 16949 Certified Operational Record
              </div>

              <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setEmailModalPayload(composeGateOutwardEmailDraft(selectedOutward))}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95 whitespace-nowrap"
                  title="Compose and Email Outward Gate Pass to Party"
                >
                  <Mail className="w-3.5 h-3.5 text-[#c09748]" />
                  <span>Email Pass</span>
                </button>

                <button
                  type="button"
                  onClick={() => downloadOutwardPDF(selectedOutward)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95 whitespace-nowrap"
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
                  onClick={() => setSelectedOutward(null)}
                  className="flex items-center justify-center px-4 py-2 rounded-full border border-[#e5e7eb] bg-white text-[#777b86] hover:bg-gray-50 text-xs font-semibold transition cursor-pointer shadow-2xs whitespace-nowrap"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* FULL-PAGE DEDICATED MATERIAL INWARD VIEW (JobCardModal 1520px Canvas)      */}
      {/* -------------------------------------------------------------------------- */}
      {showInwardModal && (
        <div className="fixed inset-0 z-50 bg-[#fafafb] overflow-y-auto w-screen h-screen min-h-screen flex flex-col font-sans antialiased text-[#17191c]">
          
          {/* 1. STICKY TOP HEADER (Max width 1520px matching JobCardModal) */}
          <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#ececec] px-4 sm:px-8 lg:px-10 py-3.5 shadow-2xs">
            <div className="max-w-[1520px] mx-auto w-full flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowInwardModal(false)}
                  className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] transition cursor-pointer active:scale-95 flex items-center gap-1.5 text-xs font-semibold"
                  title="Return to Gate Pass Register"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back to Gate Pass</span>
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10px] font-mono font-bold uppercase tracking-wider">
                      INWARD ENTRY • PART {inwardStep} OF 2
                    </span>
                    <span className="text-[11px] font-mono text-[#777b86]">
                      Plant: {activePlant} • {inwardHeader.materialCategory}
                    </span>
                  </div>
                  <h1 className="text-sm sm:text-base font-serif text-[#17191c] font-normal leading-tight mt-0.5">
                    {inwardStep === 1 
                      ? 'Part 1: General & Logistics Information' 
                      : `Part 2: Material Line Items Breakdown (${inwardItems.length} Items)`}
                  </h1>
                </div>
              </div>

              {/* Close Button */}
              <button 
                type="button"
                onClick={() => setShowInwardModal(false)}
                className="w-8 h-8 rounded-full bg-[#fafafb] hover:bg-[#f2f2f3] text-[#777b86] hover:text-[#17191c] border border-[#ececec] flex items-center justify-center cursor-pointer transition active:scale-95"
                title="Close Form"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* 2. STANDARDIZED COMPACT CONNECTED PILL STEPPER */}
          <div className="bg-white border-b border-[#ececec] py-2 px-4">
            <div className="flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar">
              {[
                { num: 1, label: '1. General & Logistics' },
                { num: 2, label: `2. Material Items (${inwardItems.length})` }
              ].map((st, idx, arr) => {
                const isActive = inwardStep === st.num;
                const isDone = inwardStep > st.num;
                return (
                  <React.Fragment key={st.num}>
                    <button
                      type="button"
                      onClick={() => {
                        if (st.num === 1) setInwardStep(1);
                        else handleStep1Next();
                      }}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-2 border shrink-0 ${
                        isActive
                          ? 'bg-[#faf3e0] text-[#8a6521] border-[#f4e5be] shadow-2xs ring-1 ring-[#c09748]/20'
                          : isDone
                          ? 'bg-[#faf7ed] text-[#17191c] border-[#f4e5be]'
                          : 'bg-white text-[#777b86] border-[#e5e7eb] hover:border-gray-400'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                        isActive
                          ? 'bg-[#c09748] text-white shadow-2xs'
                          : isDone
                          ? 'bg-[#8a6521] text-white'
                          : 'bg-gray-200 text-[#777b86]'
                      }`}>
                        {isDone ? '✓' : st.num}
                      </span>
                      <span>{st.label}</span>
                    </button>
                    {idx < arr.length - 1 && (
                      <div className="w-6 sm:w-10 h-px bg-[#e5e7eb] shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* 3. MAIN FORM CANVAS (Full 1520px width matching JobCardModal) */}
          <main className="flex-1 max-w-[1520px] mx-auto w-full px-4 sm:px-8 lg:px-10 py-6 space-y-6 pb-24">
            {/* Validation Error Banner */}
            {formError && (
              <div className="p-4 rounded-[20px] bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3 shadow-2xs animate-in fade-in duration-150">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                <span className="font-semibold">{formError}</span>
              </div>
            )}

            <form onSubmit={handleInwardSubmit} className="space-y-6">
              {/* ================================================================ */}
              {/* PART 1: GENERAL & LOGISTICS INFORMATION                         */}
              {/* ================================================================ */}
              {inwardStep === 1 && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  
                  {/* Top Live Security Gate Inward Strip */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 rounded-[24px] bg-[#faf7ed] border border-[#f4e5be] shadow-2xs">
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-full bg-[#f4e5be]/70 flex items-center justify-center shrink-0">
                        <Truck className="w-4 h-4 text-[#8a6521]" />
                      </div>
                      <div className="text-xs">
                        <span className="font-mono uppercase font-bold text-[#8a6521] tracking-wide mr-2">
                          GATE SECURITY INWARD DESK:
                        </span>
                        <span className="text-[#555863]">
                          Log incoming vehicle, verify supplier delivery challan, check package seal, and route for Store verification.
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2 self-start sm:self-auto">
                      <span className="text-[10px] font-mono font-bold bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] px-3.5 py-1 rounded-full uppercase tracking-wider shadow-2xs">
                        Plant: {activePlant} • Gate Verification
                      </span>
                    </div>
                  </div>

                  {/* Section 1: Inward Material Category Selection */}
                  <div className="bg-white p-5 sm:p-6 rounded-[24px] border border-[#ececec] shadow-xs space-y-4">
                    <div className="pb-3 border-b border-[#ececec] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] flex items-center justify-center font-bold font-mono text-xs shadow-2xs">
                          1
                        </span>
                        <div>
                          <span className="text-[10px] font-bold text-[#c09748] uppercase tracking-wider font-mono block">
                            Point 1: Inward Material Classification
                          </span>
                          <h3 className="text-sm sm:text-base font-serif text-[#17191c] font-normal">
                            Select Material Category
                          </h3>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {/* Option 1: Party Material */}
                      <button
                        type="button"
                        onClick={() => {
                          setInwardHeader({ ...inwardHeader, materialCategory: 'Party Material' });
                          setInwardItems(prev => prev.map(item => ({
                            ...item,
                            materialType: 'substrate',
                            unit: item.unit === 'Litres' ? 'Pcs' : item.unit
                          })));
                        }}
                        className={`p-4 sm:p-4.5 rounded-[18px] border text-left transition-all cursor-pointer flex items-center justify-between gap-4 ${
                          inwardHeader.materialCategory === 'Party Material'
                            ? 'border-[#17191c] bg-[#fafafb] ring-2 ring-[#17191c]/15 shadow-2xs'
                            : 'border-[#e5e7eb] bg-white hover:border-gray-300 hover:bg-[#fafafb]/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#faf3e0] border border-[#f4e5be] flex items-center justify-center shrink-0">
                            <Layers className="w-4.5 h-4.5 text-[#8a6521]" />
                          </div>
                          <div className="text-sm sm:text-base font-semibold text-[#17191c] font-sans">
                            Party Material
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          inwardHeader.materialCategory === 'Party Material' ? 'border-[#17191c] bg-[#17191c]' : 'border-gray-300'
                        }`}
                        >
                          {inwardHeader.materialCategory === 'Party Material' && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                      </button>

                      {/* Option 2: Internal Company Material */}
                      <button
                        type="button"
                        onClick={() => {
                          setInwardHeader({ ...inwardHeader, materialCategory: 'Internal Company' });
                          setInwardItems(prev => prev.map(item => ({
                            ...item,
                            materialType: item.materialType === 'substrate' ? 'paint' : item.materialType,
                            unit: item.unit === 'Pcs' ? 'Litres' : item.unit
                          })));
                        }}
                        className={`p-4 sm:p-4.5 rounded-[18px] border text-left transition-all cursor-pointer flex items-center justify-between gap-4 ${
                          inwardHeader.materialCategory === 'Internal Company'
                            ? 'border-[#17191c] bg-[#fafafb] ring-2 ring-[#17191c]/15 shadow-2xs'
                            : 'border-[#e5e7eb] bg-white hover:border-gray-300 hover:bg-[#fafafb]/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#faf7ed] border border-[#f4e5be] flex items-center justify-center shrink-0">
                            <Sparkles className="w-4.5 h-4.5 text-[#8a6521]" />
                          </div>
                          <div className="text-sm sm:text-base font-semibold text-[#17191c] font-sans">
                            Internal Company Material
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          inwardHeader.materialCategory === 'Internal Company' ? 'border-[#17191c] bg-[#17191c]' : 'border-gray-300'
                        }`}
                        >
                          {inwardHeader.materialCategory === 'Internal Company' && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                      </button>
                    </div>
                  </div>


                  {/* Section 2: Supplier Challan & Dispatch Logistics */}
                  <div className="bg-white p-6 sm:p-8 rounded-[24px] border border-[#ececec] shadow-xs space-y-6">
                    <div className="pb-3.5 border-b border-[#ececec] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] flex items-center justify-center font-bold font-mono text-xs shadow-2xs">
                          2
                        </span>
                        <div>
                          <span className="text-[11px] font-bold text-[#c09748] uppercase tracking-wider font-mono block">
                            Point 2: Supplier Challan & Vehicle Logistics
                          </span>
                          <h3 className="text-lg sm:text-xl font-serif text-[#17191c] font-normal">
                            Delivery Challan details aur gaadi ke documents confirm karein
                          </h3>
                        </div>
                      </div>
                      <div className="text-xs text-[#777b86]">
                        Fields with <span className="text-rose-500 font-bold">*</span> are required
                      </div>
                    </div>

                    {/* Row 1: Document Reference & Dates (3 columns) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="space-y-2">
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#17191c] uppercase tracking-wider font-mono">
                          <FileText className="w-3.5 h-3.5 text-[#c09748]" />
                          <span>1. Challan / DC Number</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={inwardHeader.challanNo}
                          onChange={e => {
                            setInwardHeader({ ...inwardHeader, challanNo: e.target.value });
                            if (formError) setFormError(null);
                          }}
                          placeholder="e.g. CH-88219"
                          className="w-full h-11 px-4 rounded-[16px] border border-[#dcdfe4] bg-[#fafafb] hover:bg-white focus:bg-white font-mono font-bold text-xs text-[#17191c] focus:border-[#c09748] focus:ring-2 focus:ring-[#c09748]/15 focus:outline-none transition-all shadow-2xs"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#17191c] uppercase tracking-wider font-mono">
                          <Calendar className="w-3.5 h-3.5 text-[#c09748]" />
                          <span>2. Challan Date</span>
                          <span className="text-[#777b86] font-normal text-[10px]">(on document)</span>
                        </label>
                        <PaintkingDatePicker
                          value={inwardHeader.challanDate}
                          onChange={val => setInwardHeader({ ...inwardHeader, challanDate: val })}
                          placeholder="DD-MM-YYYY"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#17191c] uppercase tracking-wider font-mono">
                          <Clock className="w-3.5 h-3.5 text-[#c09748]" />
                          <span>3. Receiving Date</span>
                          <span className="text-[#777b86] font-normal text-[10px]">(Gate Inward)</span>
                        </label>
                        <PaintkingDatePicker
                          value={inwardHeader.receivingDate}
                          onChange={val => setInwardHeader({ ...inwardHeader, receivingDate: val })}
                          placeholder="DD-MM-YYYY"
                        />
                      </div>
                    </div>

                    {/* Row 2: Supplier, Transporter & Vehicle (3 columns) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="space-y-2">
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#17191c] uppercase tracking-wider font-mono">
                          <Building2 className="w-3.5 h-3.5 text-[#c09748]" />
                          <span>4. Name of Party / Supplier</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={inwardHeader.partyName}
                          onChange={e => {
                            setInwardHeader({ ...inwardHeader, partyName: e.target.value });
                            if (formError) setFormError(null);
                          }}
                          placeholder="e.g. Roop Polymers Ltd / Asian Paints Ltd"
                          className="w-full h-11 px-4 rounded-[16px] border border-[#dcdfe4] bg-[#fafafb] hover:bg-white focus:bg-white font-semibold text-xs text-[#17191c] focus:border-[#c09748] focus:ring-2 focus:ring-[#c09748]/15 focus:outline-none transition-all shadow-2xs"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#17191c] uppercase tracking-wider font-mono">
                          <Truck className="w-3.5 h-3.5 text-[#c09748]" />
                          <span>5. Transporter Name</span>
                        </label>
                        <input
                          type="text"
                          value={inwardHeader.transporter}
                          onChange={e => setInwardHeader({ ...inwardHeader, transporter: e.target.value })}
                          placeholder="e.g. VRL Logistics / Direct Delivery"
                          className="w-full h-11 px-4 rounded-[16px] border border-[#dcdfe4] bg-[#fafafb] hover:bg-white focus:bg-white text-xs text-[#17191c] focus:border-[#c09748] focus:ring-2 focus:ring-[#c09748]/15 focus:outline-none transition-all shadow-2xs"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#17191c] uppercase tracking-wider font-mono">
                          <Truck className="w-3.5 h-3.5 text-[#c09748]" />
                          <span>6. Vehicle Number</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={inwardHeader.vehicleNo}
                          onChange={e => {
                            setInwardHeader({ ...inwardHeader, vehicleNo: e.target.value });
                            if (formError) setFormError(null);
                          }}
                          placeholder="e.g. MH-04-AB-1234"
                          className="w-full h-11 px-4 rounded-[16px] border border-[#dcdfe4] bg-[#fafafb] hover:bg-white focus:bg-white font-mono font-bold text-xs text-[#17191c] uppercase focus:border-[#c09748] focus:ring-2 focus:ring-[#c09748]/15 focus:outline-none transition-all shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 1 Action Bar */}
                  <div className="bg-white p-5 rounded-[24px] border border-[#ececec] shadow-xs flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowInwardModal(false)}
                      className="px-5 py-2.5 rounded-full border border-[#dcdfe4] text-xs font-semibold text-[#777b86] hover:bg-white hover:text-[#17191c] cursor-pointer transition active:scale-95"
                    >
                      Cancel & Discard
                    </button>

                    <button
                      type="button"
                      onClick={handleStep1Next}
                      className="px-6 py-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-2 active:scale-95"
                    >
                      <span>Continue to Material Line Items (Part 2)</span>
                      <ChevronRight className="w-4 h-4 text-[#c09748]" />
                    </button>
                  </div>
                </div>
              )}

              {/* ================================================================ */}
              {/* PART 2: MATERIAL LINE ITEMS & RECEIVING CONFIRMATION             */}
              {/* ================================================================ */}
              {inwardStep === 2 && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  
                  {/* Top Bar with Mode Banner & Add Row Action */}
                  <div className="bg-white p-6 sm:p-7 rounded-[24px] border border-[#ececec] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-6 h-6 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] flex items-center justify-center font-bold font-mono text-xs shadow-2xs">
                          2
                        </span>
                        <span className="text-[11px] font-bold text-[#c09748] uppercase tracking-wider font-mono">
                          {inwardHeader.materialCategory === 'Party Material' ? 'Party Customer Substrates' : 'Internal Paints & Chemicals'}
                        </span>
                        <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#faf7ed] text-[#8a6521] border border-[#f4e5be]">
                          {inwardItems.length} {inwardItems.length === 1 ? 'Line Item' : 'Line Items'}
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-serif text-[#17191c] font-normal">
                        Challan me mention sabhi materials aur unki quantities enter karein
                      </h3>
                      <p className="text-xs text-[#777b86] mt-0.5">
                        Challan: <strong className="font-mono text-[#17191c]">{inwardHeader.challanNo}</strong> • Party: <strong className="text-[#17191c]">{inwardHeader.partyName}</strong> • Vehicle: <strong className="font-mono text-[#17191c]">{inwardHeader.vehicleNo}</strong>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddItemRow}
                      className="px-4 py-2 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 self-start sm:self-auto"
                    >
                      <Plus className="w-4 h-4 text-[#8a6521]" />
                      <span>+ Add Material Row</span>
                    </button>
                  </div>

                  {/* DUAL MODE: 1. Party Material (Clean Wide 12-Column Table) vs 2. Company Material (Full-Width Cards) */}
                  {inwardHeader.materialCategory === 'Party Material' ? (
                    <div className="bg-white p-6 sm:p-8 rounded-[24px] border border-[#ececec] shadow-xs space-y-4">
                      {/* Desktop Table Header */}
                      <div className="hidden sm:grid sm:grid-cols-12 sm:gap-4 sm:items-center px-4 py-3 rounded-[16px] bg-[#fafafb] border border-[#ececec] text-xs font-bold text-[#777b86] uppercase tracking-wider font-mono">
                        <div className="col-span-1 text-center">#</div>
                        <div className="col-span-3">Item / Part Code (Optional)</div>
                        <div className="col-span-4">Material Description *</div>
                        <div className="col-span-2 text-center">Quantity *</div>
                        <div className="col-span-2">Packaging Unit</div>
                      </div>

                      {/* Line Items List */}
                      <div className="relative">
                        <div 
                          ref={materialListRef}
                          className="space-y-3 max-h-[520px] overflow-y-auto no-scrollbar p-1"
                        >
                          {inwardItems.map((item, idx) => (
                            <div
                              key={item.id}
                              className="p-4 sm:p-0 rounded-[18px] bg-[#fafafb] sm:bg-transparent border border-[#ececec] sm:border-0 sm:grid sm:grid-cols-12 sm:gap-4 sm:items-center space-y-3 sm:space-y-0"
                            >
                              {/* Item # */}
                              <div className="sm:col-span-1 flex items-center justify-start sm:justify-center">
                                <span className="w-7 h-7 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] flex items-center justify-center font-bold text-xs font-mono shadow-2xs">
                                  {idx + 1}
                                </span>
                              </div>

                              {/* Part Code */}
                              <div className="sm:col-span-3">
                                <label className="block text-[10px] font-bold text-[#777b86] mb-1 sm:hidden">
                                  Part Code (Optional)
                                </label>
                                <input
                                  type="text"
                                  value={item.itemCode || ''}
                                  onChange={e => handleItemChange(item.id, 'itemCode', e.target.value)}
                                  placeholder="e.g. PK-VENT-01"
                                  className="w-full h-11 px-4 rounded-[16px] border border-[#dcdfe4] bg-white font-mono text-xs text-[#17191c] placeholder:text-gray-400 focus:outline-none focus:border-[#c09748] focus:ring-2 focus:ring-[#c09748]/15 transition shadow-2xs"
                                />
                              </div>

                              {/* Material Description */}
                              <div className="sm:col-span-4">
                                <label className="block text-[10px] font-bold text-[#777b86] mb-1 sm:hidden">
                                  Material Description *
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={item.materialName}
                                  onChange={e => {
                                    handleItemChange(item.id, 'materialName', e.target.value);
                                    if (formError) setFormError(null);
                                  }}
                                  placeholder="e.g. ABS Car AC Vent Bezels"
                                  className="w-full h-11 px-4 rounded-[16px] border border-[#dcdfe4] bg-white text-xs font-semibold text-[#17191c] placeholder:text-gray-400 focus:outline-none focus:border-[#c09748] focus:ring-2 focus:ring-[#c09748]/15 transition shadow-2xs"
                                />
                              </div>

                              {/* Quantity */}
                              <div className="sm:col-span-2">
                                <label className="block text-[10px] font-bold text-[#777b86] mb-1 sm:hidden">
                                  Quantity *
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  required
                                  value={item.quantity}
                                  onChange={e => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                                  placeholder="100"
                                  className="w-full h-11 px-3 rounded-[16px] border border-[#dcdfe4] bg-white font-mono text-xs text-[#17191c] text-center font-bold focus:outline-none focus:border-[#c09748] focus:ring-2 focus:ring-[#c09748]/15 transition shadow-2xs"
                                />
                              </div>

                              {/* Packaging Unit & Delete Action */}
                              <div className="sm:col-span-2 flex items-center gap-2">
                                <div className="flex-1">
                                  <label className="block text-[10px] font-bold text-[#777b86] mb-1 sm:hidden">
                                    Packaging Unit
                                  </label>
                                  <CenteredSelectModal
                                    title="Select Packaging Unit"
                                    value={item.unit}
                                    onChange={val => handleItemChange(item.id, 'unit', val)}
                                    options={['Pcs', 'Boxes', 'Drums', 'Litres', 'Kg', 'Rolls', 'Packets']}
                                    placeholder="Unit"
                                    className="h-11 rounded-[16px] bg-white border border-[#dcdfe4] text-xs font-semibold text-[#17191c]"
                                  />
                                </div>

                                {inwardItems.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItemRow(item.id)}
                                    className="h-11 w-11 rounded-[14px] text-[#777b86] hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 flex items-center justify-center transition cursor-pointer shrink-0"
                                    title="Delete Line Item"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        <ScrollRemainingToast 
                          totalCount={inwardItems.length}
                          containerRef={materialListRef}
                          label="MORE MATERIALS BELOW"
                          position="bottom"
                        />
                      </div>

                      {/* Total Quantities Summary Strip */}
                      <div className="pt-3 border-t border-[#ececec] flex flex-wrap items-center justify-between text-xs font-mono">
                        <span className="text-[#777b86]">
                          Total Line Items: <strong className="text-[#17191c]">{inwardItems.length}</strong>
                        </span>
                        <span className="font-bold text-[#8a6521] bg-[#faf3e0] px-3.5 py-1.5 rounded-full border border-[#f4e5be]">
                          Cumulative Substrate Pieces: {inwardItems.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* 2. Company Material Cards Layout (Paints, Thinners, Hardeners & Consumables) */
                    <div className="space-y-4">
                      <div className="relative">
                        <div 
                          ref={materialListRef}
                          className="space-y-4 max-h-[560px] overflow-y-auto no-scrollbar p-1"
                        >
                          {inwardItems.map((item, idx) => (
                            <div
                              key={item.id}
                              className="bg-white rounded-[24px] border border-[#ececec] p-6 sm:p-7 shadow-xs space-y-4 relative hover:border-[#c09748] transition"
                            >
                              {/* Card Header */}
                              <div className="flex items-center justify-between pb-3.5 border-b border-[#ececec]">
                                <div className="flex items-center gap-3">
                                  <span className="w-7 h-7 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] flex items-center justify-center font-bold text-xs font-mono shadow-2xs">
                                    {idx + 1}
                                  </span>
                                  <div>
                                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#17191c] font-mono">
                                      Company Material #{idx + 1}
                                    </span>
                                    <span className="ml-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#faf7ed] text-[#8a6521] border border-[#f4e5be]">
                                      Batch Tracked (FIFO)
                                    </span>
                                  </div>
                                </div>

                                {inwardItems.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItemRow(item.id)}
                                    className="text-[#777b86] hover:text-rose-600 hover:bg-rose-50 p-2 rounded-full transition cursor-pointer"
                                    title="Delete Item"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>

                              {/* 5 Dedicated Form Fields in Order: Classification -> Batch No -> Description -> Quantity -> Unit */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-5">
                                {/* 1. Classification / Type */}
                                <div className="sm:col-span-1 lg:col-span-3 space-y-2">
                                  <label className="block text-[11px] font-bold text-[#777b86] uppercase font-mono">
                                    Classification / Type <span className="text-rose-500">*</span>
                                  </label>
                                  <CenteredSelectModal
                                    title="Select Chemical Classification"
                                    value={item.materialType || 'paint'}
                                    onChange={val => {
                                      const newType = val as StockMaterialType;
                                      handleItemChange(item.id, 'materialType', newType);
                                      if (['paint', 'thinner', 'hardener', 'primer', 'clear_coat', 'activator'].includes(newType) && item.unit === 'Pcs') {
                                        handleItemChange(item.id, 'unit', 'Litres');
                                      }
                                    }}
                                    options={MATERIAL_TYPE_OPTIONS.filter(o => o.value !== 'substrate').map(opt => ({
                                      value: opt.value,
                                      label: opt.label
                                    }))}
                                    placeholder="Select Classification"
                                    className="h-11 rounded-[16px] bg-white border border-[#dcdfe4] text-xs font-semibold text-[#17191c]"
                                  />
                                </div>

                                {/* 2. Supplier Batch No (Moved directly after Classification) */}
                                <div className="sm:col-span-1 lg:col-span-2 space-y-2">
                                  <label className="block text-[11px] font-bold text-[#777b86] uppercase font-mono">
                                    Supplier Batch No <span className="text-rose-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    value={item.batchNo || ''}
                                    onChange={e => handleItemChange(item.id, 'batchNo', e.target.value)}
                                    placeholder="e.g. BAT-2610-01"
                                    className="w-full h-11 px-4 rounded-[16px] border border-[#dcdfe4] bg-white font-mono text-xs font-bold text-[#17191c] focus:outline-none focus:border-[#c09748] focus:ring-2 focus:ring-[#c09748]/15 transition shadow-2xs"
                                  />
                                </div>

                                {/* 3. Chemical / Shade Description */}
                                <div className="sm:col-span-2 lg:col-span-3 space-y-2">
                                  <label className="block text-[11px] font-bold text-[#777b86] uppercase font-mono">
                                    Chemical / Shade Description <span className="text-rose-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    value={item.materialName}
                                    onChange={e => {
                                      handleItemChange(item.id, 'materialName', e.target.value);
                                      if (formError) setFormError(null);
                                    }}
                                    placeholder={
                                      item.materialType === 'paint' 
                                        ? 'e.g. PPG Rosso Corsa 932 Basecoat' 
                                        : item.materialType === 'thinner' 
                                        ? 'e.g. PU Thinner Medium 400' 
                                        : item.materialType === 'hardener' 
                                        ? 'e.g. 2K Fast Hardener' 
                                        : 'e.g. Chemical / Consumable Name'
                                    }
                                    className="w-full h-11 px-4 rounded-[16px] border border-[#dcdfe4] bg-white text-xs font-semibold text-[#17191c] placeholder:text-gray-400 focus:outline-none focus:border-[#c09748] focus:ring-2 focus:ring-[#c09748]/15 transition shadow-2xs"
                                  />
                                </div>

                                {/* 4. Quantity (Dedicated Title) */}
                                <div className="sm:col-span-1 lg:col-span-2 space-y-2">
                                  <label className="block text-[11px] font-bold text-[#777b86] uppercase font-mono">
                                    Quantity <span className="text-rose-500">*</span>
                                  </label>
                                  <input
                                    type="number"
                                    min="0.1"
                                    step="any"
                                    required
                                    value={item.quantity}
                                    onChange={e => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                                    placeholder="100"
                                    className="w-full h-11 px-3.5 rounded-[16px] border border-[#dcdfe4] bg-white font-mono text-xs font-bold text-[#17191c] text-center focus:outline-none focus:border-[#c09748] focus:ring-2 focus:ring-[#c09748]/15 transition shadow-2xs"
                                  />
                                </div>

                                {/* 5. Unit (Dedicated Title) */}
                                <div className="sm:col-span-1 lg:col-span-2 space-y-2">
                                  <label className="block text-[11px] font-bold text-[#777b86] uppercase font-mono">
                                    Unit <span className="text-rose-500">*</span>
                                  </label>
                                  <CenteredSelectModal
                                    title="Select Packaging Unit"
                                    value={item.unit}
                                    onChange={val => handleItemChange(item.id, 'unit', val)}
                                    options={['Litres', 'Kg', 'Drums', 'Boxes', 'Pcs', 'Packets']}
                                    placeholder="Unit"
                                    className="h-11 rounded-[16px] bg-white border border-[#dcdfe4] text-xs font-semibold text-[#17191c]"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <ScrollRemainingToast 
                          totalCount={inwardItems.length}
                          containerRef={materialListRef}
                          label="MORE MATERIALS BELOW"
                          position="bottom"
                        />
                      </div>
                    </div>
                  )}

                  {/* Section 3: Signatures & Gate Physical Verification Notes */}
                  <div className="bg-white p-6 sm:p-8 rounded-[24px] border border-[#ececec] shadow-xs space-y-5">
                    <div className="pb-3.5 border-b border-[#ececec]">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#c09748] block">
                        Section 3 • Physical Inspection & Verification
                      </span>
                      <h3 className="text-lg sm:text-xl font-serif text-[#17191c] font-normal mt-0.5">
                        Physical Status Notes & Store Officer Handover
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#17191c] uppercase tracking-wider font-mono">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#c09748]" />
                          <span>Security Officer / Logged By</span>
                        </label>
                        <input
                          type="text"
                          value={inwardHeader.securitySignature}
                          onChange={e => setInwardHeader({ ...inwardHeader, securitySignature: e.target.value })}
                          placeholder="e.g. Ram Singh (Gate Security)"
                          className="w-full h-11 px-4 rounded-[16px] border border-[#dcdfe4] bg-[#fafafb] hover:bg-white focus:bg-white text-xs text-[#17191c] focus:border-[#c09748] focus:ring-2 focus:ring-[#c09748]/15 focus:outline-none transition-all shadow-2xs"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#17191c] uppercase tracking-wider font-mono">
                          <PackageCheck className="w-3.5 h-3.5 text-[#c09748]" />
                          <span>Received By (Store Dept)</span>
                        </label>
                        <input
                          type="text"
                          value={inwardHeader.receivedBy}
                          onChange={e => setInwardHeader({ ...inwardHeader, receivedBy: e.target.value })}
                          placeholder="e.g. Manoj Tiwari (Store Dept)"
                          className="w-full h-11 px-4 rounded-[16px] border border-[#dcdfe4] bg-[#fafafb] hover:bg-white focus:bg-white text-xs text-[#17191c] focus:border-[#c09748] focus:ring-2 focus:ring-[#c09748]/15 focus:outline-none transition-all shadow-2xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center justify-between text-[11px] font-bold text-[#17191c] uppercase tracking-wider font-mono">
                        <span>Gate Physical Inspection Remarks & Discrepancy Notes</span>
                        <span className="text-[10px] text-[#777b86] font-normal font-sans">Box seal condition, damages, driver comments</span>
                      </label>
                      <textarea
                        rows={3}
                        value={inwardHeader.remarks}
                        onChange={e => setInwardHeader({ ...inwardHeader, remarks: e.target.value })}
                        placeholder="Type remarks, gate physical verification notes, drum seal condition, or any discrepancy details here..."
                        className="w-full p-4 rounded-[16px] border border-[#dcdfe4] bg-[#fafafb] hover:bg-white focus:bg-white text-xs text-[#17191c] placeholder:text-gray-400 focus:border-[#c09748] focus:ring-2 focus:ring-[#c09748]/15 focus:outline-none transition-all shadow-2xs resize-none leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Step 2 Action Bar */}
                  <div className="bg-white p-5 rounded-[24px] border border-[#ececec] shadow-xs flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setInwardStep(1)}
                      className="px-5 py-2.5 rounded-full border border-[#dcdfe4] text-xs font-semibold text-[#777b86] hover:bg-white hover:text-[#17191c] cursor-pointer transition flex items-center gap-1.5 active:scale-95"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to General Info (Part 1)</span>
                    </button>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowInwardModal(false)}
                        className="px-5 py-2.5 rounded-full border border-[#dcdfe4] text-xs font-semibold text-[#777b86] hover:bg-white hover:text-[#17191c] cursor-pointer transition active:scale-95"
                      >
                        Cancel & Discard
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-2 active:scale-95"
                      >
                        <Check className="w-4 h-4 text-[#c09748]" />
                        <span>Submit & Generate Inward Pass</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </main>
        </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* MODAL 2: MATERIAL OUTWARD FORM                                             */}
      {/* -------------------------------------------------------------------------- */}
      {showOutwardModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[24px] max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-[#ececec] space-y-5 max-h-[92vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-3 border-b border-[#ececec]">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#777b86] text-[10px] font-mono uppercase font-semibold tracking-wider">
                  Security Outward Desk
                </span>
                <h3 className="text-2xl font-serif text-[#17191c] font-normal tracking-tight mt-1">
                  New Outward Gate Pass
                </h3>
              </div>
              <button 
                onClick={() => setShowOutwardModal(false)}
                className="w-8 h-8 rounded-full bg-[#fafafb] hover:bg-gray-100 text-[#777b86] hover:text-[#17191c] border border-[#ececec] flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOutwardSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider mb-1.5">
                    1. Name of Party (Customer) <span className="text-[#17191c]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={outwardForm.partyName}
                    onChange={e => setOutwardForm({ ...outwardForm, partyName: e.target.value })}
                    placeholder="e.g. ROOP POLYMERS LTD"
                    className="w-full h-10 px-3.5 rounded-[12px] border border-[#e5e7eb] bg-white text-xs text-[#17191c] placeholder:text-gray-400 focus:outline-none focus:border-[#17191c] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider mb-1.5">
                    2. Description of Material <span className="text-[#17191c]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={outwardForm.descriptionOfMaterial}
                    onChange={e => setOutwardForm({ ...outwardForm, descriptionOfMaterial: e.target.value })}
                    placeholder="e.g. Finished Coated AC Vent Bezels"
                    className="w-full h-10 px-3.5 rounded-[12px] border border-[#e5e7eb] bg-white text-xs text-[#17191c] placeholder:text-gray-400 focus:outline-none focus:border-[#17191c] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider mb-1.5">
                    3. Vehicle Number <span className="text-[#17191c]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={outwardForm.vehicleNo}
                    onChange={e => setOutwardForm({ ...outwardForm, vehicleNo: e.target.value })}
                    placeholder="e.g. DL-01-EE-7741"
                    className="w-full h-10 px-3.5 rounded-[12px] border border-[#e5e7eb] bg-white font-mono text-xs text-[#17191c] placeholder:text-gray-400 focus:outline-none focus:border-[#17191c] transition-colors uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider mb-1.5">
                    4. Gate Pass No <span className="text-[#17191c]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={outwardForm.gatePassNo}
                    onChange={e => setOutwardForm({ ...outwardForm, gatePassNo: e.target.value })}
                    placeholder="e.g. GTP-OUT-2026-0513"
                    className="w-full h-10 px-3.5 rounded-[12px] border border-[#e5e7eb] bg-white font-mono text-xs text-[#17191c] placeholder:text-gray-400 focus:outline-none focus:border-[#17191c] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider mb-1.5">
                    5. Quantity <span className="text-[#17191c]">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={outwardForm.quantity}
                    onChange={e => setOutwardForm({ ...outwardForm, quantity: Number(e.target.value) })}
                    className="w-full h-10 px-3.5 rounded-[12px] border border-[#e5e7eb] bg-white font-mono font-semibold text-xs text-[#17191c] focus:outline-none focus:border-[#17191c] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider mb-1.5">
                    6. Unit of Measure
                  </label>
                  <div className="relative">
                    <select
                      value={outwardForm.unit}
                      onChange={e => setOutwardForm({ ...outwardForm, unit: e.target.value as any })}
                      className="w-full h-10 appearance-none pl-3.5 pr-8 rounded-[12px] border border-[#e5e7eb] bg-white text-xs font-medium text-[#17191c] focus:outline-none focus:border-[#17191c] transition-colors cursor-pointer"
                    >
                      <option value="Pcs">Pcs (Finished Parts)</option>
                      <option value="Boxes">Master Corrugated Boxes</option>
                      <option value="Litres">Litres</option>
                      <option value="Drums">Drums</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#777b86] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider mb-1.5">
                    Linked Tax Invoice / Challan Ref
                  </label>
                  <select
                    value={outwardForm.invoiceRef}
                    onChange={e => setOutwardForm({ ...outwardForm, invoiceRef: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-[12px] border border-[#e5e7eb] bg-white text-xs font-medium text-[#17191c] focus:outline-none focus:border-[#17191c] transition-colors cursor-pointer"
                  >
                    <option value="">-- Direct Dispatch (No Invoice Link) --</option>
                    {billingInvoices.map(inv => (
                      <option key={inv.invoiceNo} value={inv.invoiceNo}>
                        {inv.invoiceNo} • {inv.customer} (PO: {inv.poNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider mb-1.5">
                    7. Transporter / Courier <span className="text-[#17191c]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={outwardForm.transporter}
                    onChange={e => setOutwardForm({ ...outwardForm, transporter: e.target.value })}
                    placeholder="e.g. VRL LOGISTICS / SAFEEXPRESS"
                    className="w-full h-10 px-3.5 rounded-[12px] border border-[#e5e7eb] bg-white text-xs text-[#17191c] placeholder:text-gray-400 focus:outline-none focus:border-[#17191c] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider mb-1.5">
                  8. Security Remarks & Verification Note
                </label>
                <textarea
                  rows={2}
                  value={outwardForm.remarks}
                  onChange={e => setOutwardForm({ ...outwardForm, remarks: e.target.value })}
                  placeholder="e.g. Physical box count match. Delivery Challan & E-Way bill verified."
                  className="w-full p-3 rounded-[12px] border border-[#e5e7eb] bg-white text-xs text-[#17191c] placeholder:text-gray-400 focus:outline-none focus:border-[#17191c] transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#ececec]">
                <button
                  type="button"
                  onClick={() => setShowOutwardModal(false)}
                  className="px-5 py-2.5 rounded-full border border-[#e5e7eb] bg-white text-[#777b86] hover:bg-gray-50 text-xs font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-medium shadow-xs transition cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4 text-[#c09748]" />
                  <span>Log Outward Entry</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUniversalModal && (
        <UniversalJobModal
          isOpen={showUniversalModal}
          onClose={() => setShowUniversalModal(false)}
        />
      )}

      {/* UNIVERSAL EMAIL DISPATCH MODAL */}
      <UniversalEmailModal
        isOpen={!!emailModalPayload}
        onClose={() => setEmailModalPayload(null)}
        payload={emailModalPayload}
        onSendSuccess={(sentTo) => {
          setSubmittedToast(`Gate Pass successfully emailed to ${sentTo}`);
          setTimeout(() => setSubmittedToast(null), 5000);
        }}
        onViewPdfAttachment={() => {
          if (emailModalPayload?.documentType === 'INWARD_PASS' && selectedInward) {
            downloadInwardPDF(selectedInward);
          } else if (emailModalPayload?.documentType === 'OUTWARD_PASS' && selectedOutward) {
            downloadOutwardPDF(selectedOutward);
          }
        }}
      />
    </div>
  );
};
