import React, { useState, useEffect, useMemo } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { GoodsReceiptNote } from '../types/portalTypes';
import { 
  Plus, 
  Clock, 
  CheckCircle2, 
  Package, 
  Droplets, 
  Boxes, 
  ShieldCheck, 
  Download, 
  Search, 
  Eye, 
  Printer, 
  Layers, 
  TrendingUp, 
  AlertTriangle,
  Building2,
  Tag,
  CheckCircle,
  FileText,
  Mail,
  Send,
  Settings,
  Check,
  Bell,
  ChevronDown,
  Filter,
  X,
  ArrowRightLeft,
  CornerDownLeft,
  ShieldAlert,
  Sparkles,
  CheckSquare,
  User,
  MapPin
} from 'lucide-react';
import { CreateGRNModal } from '../components/CreateGRNModal';
import { downloadStandardIQCPdf, downloadStandardGRNPdf, formatDateDDMMYYYY } from '../utils/pdfStandardHeader';
import { OfficialGRNDocument } from '../components/OfficialGRNDocument';

export const StoresView: React.FC = () => {
  const { 
    grnList, 
    materialInwardLogs, 
    iqcRecords, 
    jobCards, 
    activePlant,
    materialRequisitions,
    issueMaterialRequisition,
    currentUser,
    activeSubTab,
    setActiveSubTab
  } = usePortalStore();
  const [showGRNModal, setShowGRNModal] = useState<boolean>(false);
  const [selectedPendingJobForGrn, setSelectedPendingJobForGrn] = useState<any | null>(null);
  const [selectedGrnForView, setSelectedGrnForView] = useState<GoodsReceiptNote | null>(null);
  const [selectedPendingJobForView, setSelectedPendingJobForView] = useState<any | null>(null);

  // 6 Clear Dedicated Tabs for Store Manager:
  // 1. TRACKER: Live Material Inventory Ledger (Customer-wise stock, issued, balance)
  // 2. REQUISITIONS: Production Floor Material Demands (MRN Requests awaiting Issue)
  // 3. ISSUED_SLIPS: Material Issue Slips (MIN) & Floor Dispatch History
  // 4. SHELF_LIFE: Dedicated Shelf-Life & Perishables Aging Dashboard (Paints, Hardeners, Solvents)
  // 5. PENDING: IQC Passed Inwards awaiting Store acceptance
  // 6. GRN_REGISTER: Official GRN Documents (DOC NO: 00) & PDF Prints
  const [activeTab, setActiveTab] = useState<'TRACKER' | 'REQUISITIONS' | 'ISSUED_SLIPS' | 'SHELF_LIFE' | 'PENDING' | 'GRN_REGISTER'>('TRACKER');

  // Synchronize when sidebar sub-item is clicked
  useEffect(() => {
    if (activeSubTab === 'TRACKER' || activeSubTab === 'REQUISITIONS' || activeSubTab === 'ISSUED_SLIPS' || activeSubTab === 'SHELF_LIFE' || activeSubTab === 'PENDING' || activeSubTab === 'GRN_REGISTER') {
      setActiveTab(activeSubTab);
    }
  }, [activeSubTab]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [clientFilter, setClientFilter] = useState<string>('ALL');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState<boolean>(false);
  const [shelfHealthFilter, setShelfHealthFilter] = useState<'ALL' | 'AGING' | 'EXPIRED' | 'FRESH'>('ALL');

  // Selected Requisition to Issue from Store
  const [selectedMrnToFulfill, setSelectedMrnToFulfill] = useState<any | null>(null);

  // Automated Email Trigger System for Aging Materials (>= 10 Days in Store)
  const [emailThresholdDays, setEmailThresholdDays] = useState<number>(10);
  const [alertRecipients, setAlertRecipients] = useState<string>('purchase@paintking.in, stores@paintking.in, production@paintking.in');
  const [emailTriggersEnabled, setEmailTriggersEnabled] = useState<boolean>(true);
  const [showEmailConfigModal, setShowEmailConfigModal] = useState<boolean>(false);
  const [emailSentToast, setEmailSentToast] = useState<string | null>(null);
  const [sentAlertHistory, setSentAlertHistory] = useState<Array<{ id: string; timestamp: string; recipient: string; itemsCount: number; partCodes: string }>>([
    {
      id: 'EML-ALERT-01',
      timestamp: '2026-09-26 09:30 AM',
      recipient: 'stores@paintking.in, production@paintking.in',
      itemsCount: 1,
      partCodes: 'ABSCARAC (Roop Polymers - 14 Days)'
    }
  ]);

  // 1. MATERIAL ISSUE SLIP (MIN - Material Issue Note) SYSTEM
  const [showIssueModal, setShowIssueModal] = useState<boolean>(false);
  const [selectedItemForIssue, setSelectedItemForIssue] = useState<any | null>(null);
  const [issueQtyInput, setIssueQtyInput] = useState<number>(0);
  const [issueTargetJobCard, setIssueTargetJobCard] = useState<string>('');
  const [issuedToPerson, setIssuedToPerson] = useState<string>('Ramesh Kumar (Line 1 Supervisor)');
  const [issueRemarks, setIssueRemarks] = useState<string>('Issued for Coating Production');
  const [selectedIssueSlipForPrint, setSelectedIssueSlipForPrint] = useState<any | null>(null);

  // Local Issue Slips Ledger
  const [customIssuedRecords, setCustomIssuedRecords] = useState<Array<{
    slipNo: string;
    date: string;
    grnNo: string;
    partCode: string;
    customer: string;
    qty: number;
    uom: string;
    issuedTo: string;
    jobCardId: string;
    remarks?: string;
  }>>([
    {
      slipNo: 'MIN-2026-001',
      date: '2026-09-26 11:30 AM',
      grnNo: 'PK-GRN-2026-1252',
      partCode: 'RP-8841',
      customer: 'TATA AUTOCOMP SYSTEMS',
      qty: 1000,
      uom: 'Pcs',
      issuedTo: 'Ramesh Kumar (Line 1 Supervisor)',
      jobCardId: 'JC-2026-001',
      remarks: 'Issued for Primer + Basecoat line'
    },
    {
      slipNo: 'MIN-2026-002',
      date: '2026-09-26 02:15 PM',
      grnNo: 'PK-GRN-2026-1250',
      partCode: 'MR-PNT-99',
      customer: 'ENDURANCE TECHNOLOGIES',
      qty: 20,
      uom: 'Litres',
      issuedTo: 'Suresh Verma (Line 2 Painter)',
      jobCardId: 'JC-2026-002',
      remarks: 'Issued Monza Red Basecoat for batch run'
    }
  ]);

  // Pending Jobs: Material Inward lots cleared by IQC that await official Store Intake & GRN
  const pendingJobs = useMemo(() => {
    const receivedReportNos = new Set<string>();
    grnList.forEach(g => {
      if (g.sourceIqcReportNo) {
        receivedReportNos.add(g.sourceIqcReportNo);
      }
      if (g.remarks) {
        const matches = g.remarks.match(/IQC-[A-Za-z0-9_-]+/g);
        if (matches) {
          matches.forEach(m => receivedReportNos.add(m));
        }
      }
    });

    const acceptedIqcJobs = iqcRecords
      .filter(rec => rec.status === 'Accepted')
      .filter(rec => {
        if (receivedReportNos.has(rec.reportNo)) return false;
        if (grnList.some(g => (g.sourceIqcReportNo && g.sourceIqcReportNo === rec.reportNo) || (g.remarks && g.remarks.includes(rec.reportNo)))) {
          return false;
        }
        return true;
      })
      .map(rec => {
        const matchedInward = materialInwardLogs.find(inw => 
          (rec.inwardSrNo && inw.srNo === rec.inwardSrNo) ||
          (inw.iqcReportNo && inw.iqcReportNo === rec.reportNo) ||
          (rec.invoiceChallanNo && inw.challanNo === rec.invoiceChallanNo)
        );

        const itemsList = rec.items && rec.items.length > 0 
          ? rec.items 
          : matchedInward?.items && matchedInward.items.length > 0
            ? matchedInward.items
            : [{
                id: '1',
                materialName: rec.partDescription || rec.partComponent || matchedInward?.descriptionOfMaterial || 'Raw Substrate',
                quantity: rec.actualReceived || rec.totalQty || 1000,
                unit: rec.uom || rec.unit || 'Pcs'
              }];

        return {
          source: 'IQC' as const,
          inwardRecord: matchedInward,
          iqcRecord: rec,
          reportNo: rec.reportNo,
          inwardSrNo: rec.inwardSrNo || matchedInward?.srNo || 'INW-GEN',
          vendorCustomer: rec.vendorCustomer || rec.supplierCustomer || matchedInward?.partyName || 'Customer',
          partDescription: rec.partDescription || rec.partComponent || matchedInward?.descriptionOfMaterial || 'Raw Substrate',
          partComponent: rec.partComponent || matchedInward?.items?.[0]?.materialName || 'Component',
          invoiceChallanNo: rec.invoiceChallanNo || matchedInward?.challanNo || 'CH-001',
          invoiceChallanDate: rec.invoiceChallanDate || matchedInward?.challanDate || rec.date,
          receivedDate: rec.inspectionDate || matchedInward?.receivingDate || rec.date,
          vehicleNo: matchedInward?.vehicleNo || 'MH-04-AZ-4412',
          totalQty: rec.actualReceived || rec.totalQty || matchedInward?.totalQuantity || 1000,
          uom: rec.uom || rec.unit || matchedInward?.unit || 'Pcs',
          items: itemsList,
          preparedBy: rec.preparedBy || rec.inspector || 'Manoj Tiwari (IQC Inspector)',
          verifiedBy: rec.verifiedBy || 'Sanjay Rawat (Production Manager)',
          generatedTimestamp: rec.generatedTimestamp || rec.date,
          aqlSampleChecked: rec.sampleSize || 50,
          aqlRejectQty: rec.rejectQty || 0
        };
      });

    const inwardPassedJobs = materialInwardLogs
      .filter(inw => {
        const isPassed = inw.iqcStatus === 'Passed' || inw.iqcStatus === 'Accepted';
        if (!isPassed) return false;

        const alreadyCovered = acceptedIqcJobs.some(j => 
          (inw.iqcReportNo && j.reportNo === inw.iqcReportNo) ||
          (j.inwardSrNo && j.inwardSrNo === inw.srNo) ||
          (j.invoiceChallanNo && j.invoiceChallanNo === inw.challanNo)
        );
        if (alreadyCovered) return false;

        const hasGrn = (inw.grnNo && grnList.some(g => g.grnNo === inw.grnNo)) ||
          (inw.iqcReportNo && receivedReportNos.has(inw.iqcReportNo));
        return !hasGrn;
      })
      .map(inw => {
        const repNo = inw.iqcReportNo || `IQC-${inw.srNo}`;
        return {
          source: 'INWARD' as const,
          inwardRecord: inw,
          iqcRecord: undefined,
          reportNo: repNo,
          inwardSrNo: inw.srNo,
          vendorCustomer: inw.partyName,
          partDescription: inw.descriptionOfMaterial,
          partComponent: inw.items?.[0]?.materialName || inw.descriptionOfMaterial,
          invoiceChallanNo: inw.challanNo,
          invoiceChallanDate: inw.challanDate || inw.date,
          receivedDate: inw.receivingDate || inw.date,
          vehicleNo: inw.vehicleNo,
          totalQty: inw.totalQuantity || inw.quantity || 1000,
          uom: inw.unit || 'Pcs',
          items: inw.items && inw.items.length > 0 ? inw.items : [{
            id: '1',
            materialName: inw.descriptionOfMaterial,
            quantity: inw.totalQuantity || inw.quantity || 1000,
            unit: inw.unit || 'Pcs'
          }],
          preparedBy: 'Manoj Tiwari (IQC Inspector)',
          verifiedBy: 'Sanjay Rawat (Production Manager)',
          generatedTimestamp: inw.date,
          aqlSampleChecked: 50,
          aqlRejectQty: 0
        };
      });

    return [...acceptedIqcJobs, ...inwardPassedJobs];
  }, [iqcRecords, materialInwardLogs, grnList]);

  // Shelf-Life & Aging Master Rules for ALL Industrial Materials (Chemicals, Paints & Substrates)
  const getShelfLifeConfig = (partCode: string, partDesc: string) => {
    const text = `${partCode} ${partDesc}`.toLowerCase();
    if (text.includes('hardener') || text.includes('hrd') || text.includes('isocyanate')) {
      return { materialType: 'CHEMICAL', shelfLifeDays: 20, warnAtDays: 14, category: '2K PU Hardener' };
    }
    if (text.includes('paint') || text.includes('basecoat') || text.includes('pnt') || text.includes('monza red')) {
      return { materialType: 'CHEMICAL', shelfLifeDays: 30, warnAtDays: 20, category: 'PU Basecoat Paint' };
    }
    if (text.includes('clear') || text.includes('clr') || text.includes('lacquer')) {
      return { materialType: 'CHEMICAL', shelfLifeDays: 45, warnAtDays: 30, category: 'High Gloss Clearcoat' };
    }
    if (text.includes('thinner') || text.includes('thn') || text.includes('solvent')) {
      return { materialType: 'CHEMICAL', shelfLifeDays: 60, warnAtDays: 45, category: 'PU Thinner / Solvent' };
    }
    if (text.includes('primer') || text.includes('activator')) {
      return { materialType: 'CHEMICAL', shelfLifeDays: 30, warnAtDays: 20, category: 'Primer / Dipping Activator' };
    }
    // Substrates & Components (ABS, PC, Nylon, Metal parts) - Industry standard 90-day storage rotation before surface oxidation/dust contamination
    return { materialType: 'SUBSTRATE', shelfLifeDays: 90, warnAtDays: 60, category: 'Raw Substrate / Component (ABS/PC/Metal)' };
  };

  // Helper to compute calendar days elapsed between received date and today
  const calculateDaysInStore = (dateStr: string) => {
    if (!dateStr) return 0;
    const recDate = new Date(dateStr);
    if (isNaN(recDate.getTime())) return 0;
    const today = new Date();
    const diffMs = today.getTime() - recDate.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  };

  // MATERIAL TRACKER: Live calculation of Inward vs Issued to Floor vs Available Balance
  const materialTrackerList = useMemo(() => {
    return grnList
      .filter(grn => (grn.iqcStatus === 'Accepted' || grn.iqcStatus === 'Passed' || (!grn.iqcStatus && grn.grnNo)) && grn.iqcStatus !== 'Pending' && grn.iqcStatus !== 'Rejected')
      .map(grn => {
      const customer = grn.supplierCustomer;
      const partCode = grn.items?.[0]?.partCode || grn.partCode || 'SUBSTRATE';
      const partDesc = grn.items?.[0]?.partDescription || grn.description || 'Raw Components';
      const totalInward = grn.actualReceivedQty || grn.totalQty || 0;
      const receivedDate = grn.receivedDate || grn.date;
      const uom = (partCode.startsWith('PNT') || partCode.startsWith('CHEM') || partDesc.toLowerCase().includes('drum') || partDesc.toLowerCase().includes('paint')) ? 'Litres' : 'Pcs';

      // Universal shelf-life & age calculation for all materials
      const shelfConfig = getShelfLifeConfig(partCode, partDesc);
      const daysInStore = calculateDaysInStore(receivedDate);
      const daysRemaining = Math.max(0, shelfConfig.shelfLifeDays - daysInStore);
      
      let shelfHealth: 'FRESH' | 'AGING_WARNING' | 'EXPIRED' = 'FRESH';
      if (daysInStore >= shelfConfig.shelfLifeDays) {
        shelfHealth = 'EXPIRED';
      } else if (daysInStore >= shelfConfig.warnAtDays) {
        shelfHealth = 'AGING_WARNING';
      } else {
        shelfHealth = 'FRESH';
      }

      // Find all Job Cards issued against this customer or part code
      const matchingJobCards = jobCards.filter(jc => 
        (jc.customer && jc.customer.trim().toLowerCase() === customer.trim().toLowerCase()) ||
        (jc.partCode && jc.partCode.trim().toLowerCase() === partCode.trim().toLowerCase()) ||
        (jc.woNo && grn.invoiceChallanNo && jc.woNo.includes(grn.invoiceChallanNo))
      );

      // Only count master job cards or standalone job cards (prevent double count of painter child cards)
      const primaryJobCards = matchingJobCards.filter(jc => jc.jobCardType === 'master' || (!jc.jobCardType && !jc.parentJobCardId));
      const totalJobCardDemands = primaryJobCards.reduce((acc, curr) => acc + (curr.targetQty || 0), 0);

      // Add custom manual issue slips
      const customIssuedQty = customIssuedRecords
        .filter(r => r.grnNo === grn.grnNo || (r.partCode === partCode && r.customer === customer))
        .reduce((sum, r) => sum + r.qty, 0);

      const totalIssuedToFloor = Math.max(0, Math.max(totalJobCardDemands, customIssuedQty));
      const balanceAvailable = Math.max(0, totalInward - totalIssuedToFloor);
      
      // Dynamic Re-order / Low Stock Trigger: Less than 20% of inward OR less than 50 pcs / 5 Litres
      const isReorderAlert = balanceAvailable > 0 && (balanceAvailable < (totalInward * 0.2) || (uom === 'Litres' ? balanceAvailable <= 5 : balanceAvailable <= 100));
      const isStockOut = balanceAvailable === 0;

      return {
        grnNo: grn.grnNo,
        challanNo: grn.invoiceChallanNo,
        receivedDate,
        customer,
        partCode,
        partDesc,
        uom,
        totalInward,
        totalIssuedToFloor,
        customIssuedQty,
        balanceAvailable,
        issuedCardsCount: primaryJobCards.length,
        isReorderAlert,
        status: isStockOut ? 'Fully Issued' : isReorderAlert ? 'Low Stock (Re-order Alert)' : 'Available in Store',
        rawGrn: grn,
        // Shelf life tracking fields for all materials
        materialType: shelfConfig.materialType,
        materialCategory: shelfConfig.category,
        shelfLifeDays: shelfConfig.shelfLifeDays,
        warnAtDays: shelfConfig.warnAtDays,
        daysInStore,
        daysRemaining,
        shelfHealth
      };
    });
  }, [grnList, jobCards, customIssuedRecords]);

  // FIFO 1st Priority Lot Calculation: For each part code, the oldest inward lot with available balance > 0
  const fifoPriorityGrnSet = useMemo(() => {
    const prioritySet = new Set<string>();
    const partCodeToOldestLot = new Map<string, { grnNo: string; daysInStore: number }>();

    materialTrackerList.forEach(item => {
      if (item.balanceAvailable > 0) {
        const existing = partCodeToOldestLot.get(item.partCode);
        if (!existing || item.daysInStore > existing.daysInStore) {
          partCodeToOldestLot.set(item.partCode, { grnNo: item.grnNo, daysInStore: item.daysInStore });
        }
      }
    });

    partCodeToOldestLot.forEach(val => prioritySet.add(val.grnNo));
    return prioritySet;
  }, [materialTrackerList]);

  // Count of items needing re-order
  const lowStockReorderCount = useMemo(() => {
    return materialTrackerList.filter(m => m.isReorderAlert).length;
  }, [materialTrackerList]);

  // Aging counts across ALL materials in company
  const allAgingCount = useMemo(() => {
    return materialTrackerList.filter(m => m.shelfHealth === 'AGING_WARNING').length;
  }, [materialTrackerList]);

  const allExpiredCount = useMemo(() => {
    return materialTrackerList.filter(m => m.shelfHealth === 'EXPIRED').length;
  }, [materialTrackerList]);

  const totalShelfAlertCount = allAgingCount + allExpiredCount;

  // Unique customers for dropdown filter
  const uniqueClients = useMemo(() => {
    return Array.from(new Set(materialTrackerList.map(m => m.customer))).filter(Boolean);
  }, [materialTrackerList]);

  // Filtered Tracker List (Clean Part stock list)
  const filteredTracker = useMemo(() => {
    return materialTrackerList.filter(item => {
      if (clientFilter !== 'ALL' && item.customer !== clientFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.customer.toLowerCase().includes(q) ||
        item.partCode.toLowerCase().includes(q) ||
        item.partDesc.toLowerCase().includes(q) ||
        item.grnNo.toLowerCase().includes(q) ||
        item.challanNo.toLowerCase().includes(q)
      );
    });
  }, [materialTrackerList, clientFilter, searchQuery]);

  // Filtered List for Dedicated Shelf-Life Dashboard (ALL Materials: Paints, Chemicals, and Substrates)
  const filteredShelfLife = useMemo(() => {
    return materialTrackerList.filter(item => {
      if (shelfHealthFilter === 'AGING' && item.shelfHealth !== 'AGING_WARNING') return false;
      if (shelfHealthFilter === 'EXPIRED' && item.shelfHealth !== 'EXPIRED') return false;
      if (shelfHealthFilter === 'FRESH' && item.shelfHealth !== 'FRESH') return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.customer.toLowerCase().includes(q) ||
        item.partCode.toLowerCase().includes(q) ||
        item.partDesc.toLowerCase().includes(q) ||
        item.materialCategory.toLowerCase().includes(q)
      );
    });
  }, [materialTrackerList, shelfHealthFilter, searchQuery]);

  // High-signal aggregates
  const totalInwardPieces = materialTrackerList.reduce((acc, curr) => acc + curr.totalInward, 0);
  const totalIssuedPieces = materialTrackerList.reduce((acc, curr) => acc + curr.totalIssuedToFloor, 0);
  const totalBalancePieces = materialTrackerList.reduce((acc, curr) => acc + curr.balanceAvailable, 0);

  const filteredPending = pendingJobs.filter(j => 
    !searchQuery || 
    j.vendorCustomer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.reportNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.invoiceChallanNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGrnList = grnList.filter(g =>
    !searchQuery ||
    g.grnNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.supplierCustomer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.invoiceChallanNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Items qualifying for the Email Trigger (Days in Store >= Threshold Days AND balance > 0)
  const itemsTriggeringEmail = useMemo(() => {
    return materialTrackerList.filter(item => item.daysInStore >= emailThresholdDays && item.balanceAvailable > 0);
  }, [materialTrackerList, emailThresholdDays]);

  // Handler to manually dispatch email notification or test trigger
  const handleSendEmailAlertNow = () => {
    const newLog = {
      id: `EML-ALERT-0${sentAlertHistory.length + 1}`,
      timestamp: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      recipient: alertRecipients,
      itemsCount: itemsTriggeringEmail.length,
      partCodes: itemsTriggeringEmail.map(i => `${i.partCode} (${i.daysInStore}d)`).join(', ') || 'General System Test'
    };
    setSentAlertHistory(prev => [newLog, ...prev]);
    setEmailSentToast(`Email Trigger Dispatched! Alert successfully sent to [${alertRecipients}] for ${itemsTriggeringEmail.length} aging materials (>= ${emailThresholdDays} days).`);
    setTimeout(() => {
      setEmailSentToast(null);
    }, 6000);
  };

  const handleOpenGrnForPending = (job: any) => {
    setSelectedPendingJobForGrn(job);
    setShowGRNModal(true);
  };

  // Handlers for Material Issue Slip (MIN) and Return to Store
  const handleOpenIssueModal = (item: any) => {
    setSelectedItemForIssue(item);
    setIssueQtyInput(Math.min(item.balanceAvailable, 100));
    setIssueTargetJobCard(jobCards[0]?.jobCardId || 'JC-2026-001');
    setIssuedToPerson('Ramesh Kumar (Line 1 Supervisor)');
    setIssueRemarks('Issued for Coating Line batch');
    setShowIssueModal(true);
  };

  const handleConfirmIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForIssue || issueQtyInput <= 0) return;
    if (issueQtyInput > selectedItemForIssue.balanceAvailable) {
      alert(`Warning: Issue quantity (${issueQtyInput}) cannot exceed available store balance (${selectedItemForIssue.balanceAvailable}).`);
      return;
    }

    const nextSlipNumber = `MIN-2026-${String(customIssuedRecords.length + 1).padStart(3, '0')}`;
    const newRecord = {
      slipNo: nextSlipNumber,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      grnNo: selectedItemForIssue.grnNo,
      partCode: selectedItemForIssue.partCode,
      customer: selectedItemForIssue.customer,
      qty: Number(issueQtyInput),
      uom: selectedItemForIssue.uom,
      issuedTo: issuedToPerson,
      jobCardId: issueTargetJobCard,
      remarks: issueRemarks
    };

    setCustomIssuedRecords(prev => [newRecord, ...prev]);
    setShowIssueModal(false);
    setSelectedIssueSlipForPrint(newRecord);
    setEmailSentToast(`✓ Material Issue Note ${nextSlipNumber} created! Issued ${issueQtyInput} ${selectedItemForIssue.uom} to ${issuedToPerson}.`);
    setTimeout(() => setEmailSentToast(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner - Standardized Persona Layout */}
      <div className="bg-white rounded-[24px] p-5 sm:p-6 border border-[#ececec] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
              PK-STR-GRN-001 • STORES & INWARD DESK
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#17191c] text-[10px] font-semibold flex items-center gap-1">
              <User className="w-3 h-3 text-[#777b86]" />
              <span>{currentUser.name} ({currentUser.roleTitle})</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-bold flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-600" />
              <span>{activePlant}</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-normal text-[#17191c] tracking-tight">
            Store Material Stock & Inward Tracker
          </h1>
          <p className="text-xs text-[#777b86] mt-1">
            Har customer ka kitna material aaya, kitna shop floor par issue hua, aur kitna balance bacha hai.
          </p>
        </div>
      </div>

      {/* Real-time Inventory Summary Cards - All 4 Clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: TOTAL INWARD (Clickable -> Stock Tracker) */}
        <div 
          onClick={() => { setActiveTab('TRACKER'); setClientFilter('ALL'); }}
          className={`p-4 rounded-[20px] bg-white border shadow-xs space-y-1 cursor-pointer transition hover:shadow-sm hover:border-[#c09748]/60 active:scale-[0.98] ${
            activeTab === 'TRACKER' ? 'border-[#c09748] ring-1 ring-[#c09748]/30' : 'border-[#ececec]'
          }`}
          title="Click to view all Inward Stock in Material Stock Tracker"
        >
          <div className="text-[10px] font-bold text-[#777b86] uppercase tracking-wider flex items-center justify-between font-mono">
            <span className="flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-[#c09748]" />
              TOTAL INWARD
            </span>
            <span className="text-[9px] underline font-sans text-[#8a6521]">View Stock &rarr;</span>
          </div>
          <div className="text-xl sm:text-2xl font-serif font-bold text-[#17191c]">
            {totalInwardPieces.toLocaleString('en-IN')} pcs
          </div>
          <div className="text-[10px] sm:text-[11px] text-[#777b86] truncate">All verified GRN stock</div>
        </div>

        {/* Card 2: ISSUED TO FLOOR (Clickable -> Issued Slips) */}
        <div 
          onClick={() => setActiveTab('ISSUED_SLIPS')}
          className={`p-4 rounded-[20px] bg-white border shadow-xs space-y-1 cursor-pointer transition hover:shadow-sm hover:border-blue-400 active:scale-[0.98] ${
            activeTab === 'ISSUED_SLIPS' ? 'border-blue-400 ring-1 ring-blue-300' : 'border-[#ececec]'
          }`}
          title="Click to view all Issued Materials & MIN Slips"
        >
          <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider flex items-center justify-between font-mono">
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              ISSUED TO FLOOR
            </span>
            <span className="text-[9px] underline font-sans text-blue-600">View Slips &rarr;</span>
          </div>
          <div className="text-xl sm:text-2xl font-serif font-bold text-blue-900">
            {totalIssuedPieces.toLocaleString('en-IN')} pcs
          </div>
          <div className="text-[10px] sm:text-[11px] text-[#777b86] truncate">
            {customIssuedRecords.length} Issue Slips generated
          </div>
        </div>

        {/* Card 3: STORE BALANCE (Clickable -> Filtered Available Stock) */}
        <div 
          onClick={() => { setActiveTab('TRACKER'); setClientFilter('ALL'); }}
          className={`p-4 rounded-[20px] bg-[#faf7ed] border shadow-xs space-y-1 cursor-pointer transition hover:shadow-sm hover:border-[#c09748] active:scale-[0.98] ${
            activeTab === 'TRACKER' ? 'border-[#c09748] ring-1 ring-[#c09748]/30' : 'border-[#f4e5be]'
          }`}
          title="Click to filter Available Balance Stock in Store"
        >
          <div className="text-[10px] font-bold text-[#8a6521] uppercase tracking-wider flex items-center justify-between font-mono">
            <span className="flex items-center gap-1">
              <Boxes className="w-3.5 h-3.5 text-[#c09748]" />
              STORE BALANCE
            </span>
            <span className="text-[9px] underline font-sans text-[#8a6521]">View Bal &rarr;</span>
          </div>
          <div className="text-xl sm:text-2xl font-serif font-bold text-[#8a6521]">
            {totalBalancePieces.toLocaleString('en-IN')} pcs
          </div>
          <div className="text-[10px] sm:text-[11px] text-[#8a6521]/80 truncate">Available in warehouse</div>
        </div>

        {/* Card 4: SHELF-LIFE WATCH (Clickable -> Shelf Life Watch Tab) */}
        <div 
          onClick={() => setActiveTab('SHELF_LIFE')}
          className={`p-4 rounded-[20px] border shadow-xs space-y-1 cursor-pointer transition hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'SHELF_LIFE' 
              ? 'border-amber-400 ring-1 ring-amber-300' 
              : totalShelfAlertCount > 0 
                ? 'bg-amber-50/70 border-amber-300 hover:border-amber-400' 
                : 'bg-white border-[#ececec] hover:border-[#c09748]/60'
          }`}
          title="Click to inspect Shelf-Life Aging Watch"
        >
          <div className={`text-[10px] font-bold uppercase tracking-wider flex items-center justify-between font-mono ${
            totalShelfAlertCount > 0 ? 'text-amber-800' : 'text-[#777b86]'
          }`}>
            <span className="flex items-center gap-1">
              <Clock className={`w-3.5 h-3.5 ${totalShelfAlertCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`} />
              SHELF-LIFE WATCH
            </span>
            <span className="text-[9px] uppercase tracking-normal underline text-[#8a6521]">View &rarr;</span>
          </div>
          <div className={`text-xl sm:text-2xl font-serif font-bold ${
            totalShelfAlertCount > 0 ? 'text-amber-900' : 'text-emerald-900'
          }`}>
            {materialTrackerList.length} Lots Tracked
          </div>
          <div className="text-[10px] sm:text-[11px] text-[#777b86] truncate">
            {totalShelfAlertCount > 0 ? `${totalShelfAlertCount} material lots need rotation` : 'All materials fresh & compliant'}
          </div>
        </div>
      </div>

      {/* Segmented Sub-Tab Switcher & Search Bar (Standardized UI matching Gate Security & IQC) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white p-2 sm:p-2.5 rounded-[16px] border border-[#ececec] shadow-2xs">
        {/* Horizontal Sub-Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-3.5 sm:px-4 py-2 rounded-full text-[11px] sm:text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-1.5 shrink-0 active:scale-95 ${
              activeTab === 'PENDING'
                ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] font-bold shadow-2xs'
                : 'bg-[#fafafb] text-[#777b86] hover:text-[#17191c] border border-[#ececec]'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${activeTab === 'PENDING' ? 'text-[#8a6521]' : 'text-[#777b86]'}`} />
            <span>Pending IQC Inwards</span>
            <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
              pendingJobs.length > 0 
                ? (activeTab === 'PENDING' ? 'bg-[#f4e5be] text-[#8a6521]' : 'bg-amber-100 text-amber-900 border border-amber-300')
                : 'bg-[#f2f2f3] text-[#777b86]'
            }`}>
              {pendingJobs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('TRACKER')}
            className={`px-3.5 sm:px-4 py-2 rounded-full text-[11px] sm:text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-1.5 shrink-0 active:scale-95 ${
              activeTab === 'TRACKER'
                ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] font-bold shadow-2xs'
                : 'bg-[#fafafb] text-[#777b86] hover:text-[#17191c] border border-[#ececec]'
            }`}
          >
            <Package className={`w-3.5 h-3.5 ${activeTab === 'TRACKER' ? 'text-[#8a6521]' : 'text-[#777b86]'}`} />
            <span>Stock Ledger</span>
            <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'TRACKER' ? 'bg-[#f4e5be] text-[#8a6521]' : 'bg-[#f2f2f3] text-[#777b86]'
            }`}>
              {materialTrackerList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('REQUISITIONS')}
            className={`px-3.5 sm:px-4 py-2 rounded-full text-[11px] sm:text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-1.5 shrink-0 active:scale-95 ${
              activeTab === 'REQUISITIONS'
                ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] font-bold shadow-2xs'
                : 'bg-[#fafafb] text-[#777b86] hover:text-[#17191c] border border-[#ececec]'
            }`}
          >
            <ArrowRightLeft className={`w-3.5 h-3.5 ${activeTab === 'REQUISITIONS' ? 'text-[#8a6521]' : 'text-[#777b86]'}`} />
            <span>Floor Demands</span>
            <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'REQUISITIONS' ? 'bg-[#f4e5be] text-[#8a6521]' : 'bg-[#f2f2f3] text-[#777b86]'
            }`}>
              {materialRequisitions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ISSUED_SLIPS')}
            className={`px-3.5 sm:px-4 py-2 rounded-full text-[11px] sm:text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-1.5 shrink-0 active:scale-95 ${
              activeTab === 'ISSUED_SLIPS'
                ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] font-bold shadow-2xs'
                : 'bg-[#fafafb] text-[#777b86] hover:text-[#17191c] border border-[#ececec]'
            }`}
          >
            <Layers className={`w-3.5 h-3.5 ${activeTab === 'ISSUED_SLIPS' ? 'text-[#8a6521]' : 'text-[#777b86]'}`} />
            <span>Issue Slips</span>
            <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'ISSUED_SLIPS' ? 'bg-[#f4e5be] text-[#8a6521]' : 'bg-[#f2f2f3] text-[#777b86]'
            }`}>
              {customIssuedRecords.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('SHELF_LIFE')}
            className={`px-3.5 sm:px-4 py-2 rounded-full text-[11px] sm:text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-1.5 shrink-0 active:scale-95 ${
              activeTab === 'SHELF_LIFE'
                ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] font-bold shadow-2xs'
                : 'bg-[#fafafb] text-[#777b86] hover:text-[#17191c] border border-[#ececec]'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${activeTab === 'SHELF_LIFE' ? 'text-[#8a6521]' : 'text-[#777b86]'}`} />
            <span>Shelf-Life</span>
            <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
              totalShelfAlertCount > 0 
                ? (activeTab === 'SHELF_LIFE' ? 'bg-[#f4e5be] text-[#8a6521]' : 'bg-amber-100 text-amber-900 border border-amber-300')
                : 'bg-[#f2f2f3] text-[#777b86]'
            }`}>
              {totalShelfAlertCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('GRN_REGISTER')}
            className={`px-3.5 sm:px-4 py-2 rounded-full text-[11px] sm:text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-1.5 shrink-0 active:scale-95 ${
              activeTab === 'GRN_REGISTER'
                ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] font-bold shadow-2xs'
                : 'bg-[#fafafb] text-[#777b86] hover:text-[#17191c] border border-[#ececec]'
            }`}
          >
            <FileText className={`w-3.5 h-3.5 ${activeTab === 'GRN_REGISTER' ? 'text-[#8a6521]' : 'text-[#777b86]'}`} />
            <span>GRN Register</span>
            <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'GRN_REGISTER' ? 'bg-[#f4e5be] text-[#8a6521]' : 'bg-[#f2f2f3] text-[#777b86]'
            }`}>
              {grnList.length}
            </span>
          </button>
        </div>

        {/* Inline Search Bar */}
        <div className="relative flex-1 sm:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-3.5 h-3.5 text-[#777b86]" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search party, part code, GRN, challan..."
            style={{ paddingLeft: '32px' }}
            className="w-full h-8.5 pr-8 rounded-full bg-[#fafafb] border border-[#dcdfe4] text-xs text-[#17191c] placeholder:text-[#a3a6af] focus:outline-none focus:border-[#c09748] focus:bg-white transition"
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

      {/* ====================================================================== */}
      {/* TAB 1: MATERIAL STOCK TRACKER (CLEAN, FOCUSED STOCK LEDGER)            */}
      {/* ====================================================================== */}
      {activeTab === 'TRACKER' && (
        <div className="space-y-4">
          <div className="bg-white rounded-[24px] border border-[#ececec] p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ececec]">
              <div>
                <h3 className="font-serif font-normal text-lg sm:text-xl text-[#17191c]">
                  Customer Material Stock Ledger
                </h3>
                <p className="text-xs text-[#777b86] mt-0.5">
                  Kis party ka kitna part store me aaya, shop floor par kitna gaya, aur kitne pieces bache hain.
                </p>
              </div>

              {/* High-End Styled Custom Customer Filter Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                  className="px-4 py-2 rounded-full bg-white hover:bg-gray-50 border border-[#ececec] hover:border-[#c09748] text-xs font-semibold text-[#17191c] flex items-center gap-2 shadow-2xs cursor-pointer transition select-none"
                >
                  <Filter className="w-3.5 h-3.5 text-[#c09748]" />
                  <span className="text-[#777b86] font-normal">Customer:</span>
                  <span className="font-bold text-[#17191c] max-w-[140px] truncate">
                    {clientFilter === 'ALL' ? `All Customers (${uniqueClients.length})` : clientFilter}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-[#777b86] transition-transform duration-200 ${isCustomerDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu Window */}
                {isCustomerDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-30" 
                      onClick={() => setIsCustomerDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-[20px] border border-[#ececec] shadow-xl py-2 z-40 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3.5 py-1.5 border-b border-[#f2f2f3] flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-[#777b86] uppercase tracking-wider">
                          Select Client Account
                        </span>
                        {clientFilter !== 'ALL' && (
                          <button
                            type="button"
                            onClick={() => {
                              setClientFilter('ALL');
                              setIsCustomerDropdownOpen(false);
                            }}
                            className="text-[10px] text-[#c09748] hover:underline font-semibold cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </div>

                      <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setClientFilter('ALL');
                            setIsCustomerDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-[12px] text-xs font-medium flex items-center justify-between cursor-pointer transition ${
                            clientFilter === 'ALL' 
                              ? 'bg-[#faf7ed] text-[#8a6521] font-bold' 
                              : 'text-[#17191c] hover:bg-[#fafafb]'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-[#c09748]" />
                            <span>All Customers</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white border border-[#f4e5be]">
                            {uniqueClients.length}
                          </span>
                        </button>

                        {uniqueClients.map(c => {
                          const clientItemsCount = materialTrackerList.filter(m => m.customer === c).length;
                          const isSelected = clientFilter === c;

                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                setClientFilter(c);
                                setIsCustomerDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-[12px] text-xs font-medium flex items-center justify-between cursor-pointer transition ${
                                isSelected 
                                  ? 'bg-[#faf7ed] text-[#8a6521] font-bold border border-[#f4e5be]' 
                                  : 'text-[#17191c] hover:bg-[#fafafb]'
                              }`}
                            >
                              <span className="truncate pr-2">{c}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono shrink-0 ${
                                isSelected ? 'bg-[#c09748] text-white' : 'bg-[#f2f2f3] text-[#777b86]'
                              }`}>
                                {clientItemsCount} parts
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Desktop Table View (Hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto border border-[#ececec] rounded-[16px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#fafafb] text-[#777b86] font-semibold uppercase text-[10px] tracking-wider border-b border-[#ececec]">
                    <th className="p-3">Customer / Party Name</th>
                    <th className="p-3">Part Code & Lot Details</th>
                    <th className="p-3 text-center">Total Inward</th>
                    <th className="p-3 text-center">Issued to Floor</th>
                    <th className="p-3 text-center">Store Balance</th>
                    <th className="p-3 text-center">Priority & Alerts</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ececec] text-[#17191c]">
                  {filteredTracker.map((item, idx) => {
                    const isFifoFirst = fifoPriorityGrnSet.has(item.grnNo) && item.balanceAvailable > 0;
                    return (
                      <tr key={idx} className="hover:bg-[#fafafb] transition">
                        <td className="p-3">
                          <div className="font-bold text-[#17191c]">{item.customer}</div>
                          <div className="text-[10px] text-[#777b86] font-mono">GRN: {item.grnNo}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-mono font-bold text-[#c09748]">{item.partCode}</div>
                          <div className="text-[11px] text-[#777b86] line-clamp-1">{item.partDesc}</div>
                          <div className="text-[10px] text-[#a3a6af]">Inward: {formatDateDDMMYYYY(item.receivedDate)} ({item.daysInStore}d ago)</div>
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-[#17191c]">
                          {item.totalInward.toLocaleString('en-IN')} {item.uom}
                        </td>
                        <td className="p-3 text-center font-mono font-semibold text-blue-800 bg-blue-50/20">
                          <div>{item.totalIssuedToFloor.toLocaleString('en-IN')} {item.uom}</div>
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-base bg-[#faf7ed]/60 text-[#8a6521]">
                          {item.balanceAvailable.toLocaleString('en-IN')} {item.uom}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            {isFifoFirst && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
                                <Sparkles className="w-3 h-3 text-emerald-700 shrink-0" />
                                <span>FIFO 1st Priority</span>
                              </span>
                            )}
                            {item.isReorderAlert && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                <ShieldAlert className="w-3 h-3 text-rose-600 shrink-0" />
                                <span>Low Stock (Re-order)</span>
                              </span>
                            )}
                            {!isFifoFirst && !item.isReorderAlert && item.balanceAvailable > 0 && (
                              <span className="text-[10px] text-gray-500 font-mono">Standard Queue</span>
                            )}
                            {item.balanceAvailable === 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-gray-100 text-gray-500">Fully Consumed</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedGrnForView(item.rawGrn)}
                              className="px-3 py-1.5 rounded-full border border-[#ececec] bg-white text-[#17191c] hover:border-[#c09748] text-[11px] font-semibold hover:bg-gray-50 transition inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="View Raw GRN Document"
                            >
                              <Eye className="w-3 h-3 text-[#c09748]" />
                              <span>View GRN</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredTracker.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#777b86]">
                        Koi material stock record nahi mila.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards (Visible on mobile/tablet) */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {filteredTracker.map((item, idx) => {
                const isFifoFirst = fifoPriorityGrnSet.has(item.grnNo) && item.balanceAvailable > 0;
                return (
                  <div key={idx} className="p-4 rounded-[18px] border border-[#ececec] bg-white shadow-2xs space-y-3">
                    <div className="flex items-start justify-between gap-2 border-b border-[#f2f2f3] pb-2">
                      <div>
                        <div className="font-bold text-sm text-[#17191c]">{item.customer}</div>
                        <div className="font-mono text-xs font-bold text-[#c09748]">{item.partCode}</div>
                        <div className="text-[11px] text-[#777b86]">{item.partDesc}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {isFifoFirst && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            ★ FIFO 1st Priority
                          </span>
                        )}
                        {item.isReorderAlert && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            ⚠ Re-order Stock
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.balanceAvailable > 0
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}>
                          {item.balanceAvailable > 0 ? `${item.balanceAvailable} ${item.uom} In Store` : 'Stock Exhausted'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center py-1 bg-[#fafafb] rounded-[12px] p-2">
                      <div>
                        <span className="text-[9px] uppercase font-mono text-[#777b86] block">Inward</span>
                        <span className="font-mono font-bold text-xs text-[#17191c]">{item.totalInward} {item.uom}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-mono text-blue-700 block">Issued</span>
                        <span className="font-mono font-bold text-xs text-blue-800">{item.totalIssuedToFloor} {item.uom}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-mono text-[#8a6521] block">Balance</span>
                        <span className="font-mono font-bold text-xs text-[#8a6521]">{item.balanceAvailable} {item.uom}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-1 text-[11px] text-[#777b86] pt-1">
                      <span className="font-mono text-[10px] truncate max-w-[120px]">GRN: {item.grnNo}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedGrnForView(item.rawGrn)}
                          className="px-3 py-1 rounded-full border border-[#ececec] bg-white text-[#17191c] font-semibold flex items-center gap-1 text-[10px] shadow-2xs"
                        >
                          <Eye className="w-2.5 h-2.5 text-[#c09748]" />
                          <span>View GRN</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 2: PRODUCTION MATERIAL REQUISITIONS (MRN DEMANDS AWAITING ISSUE)   */}
      {/* ====================================================================== */}
      {activeTab === 'REQUISITIONS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-[24px] border border-[#ececec] p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ececec]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-normal text-lg sm:text-xl text-[#17191c]">
                    Production Floor Material Requisitions (MRN)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    Production Demands
                  </span>
                </div>
                <p className="text-xs text-[#777b86] mt-0.5">
                  Production Manager aur Line Supervisors ne store se jin materials ki demand raise ki hai.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#777b86] font-mono">
                  Pending Issues: <strong className="text-amber-700">{materialRequisitions.filter(r => r.status === 'Pending Store Issue').length}</strong>
                </span>
              </div>
            </div>

            {/* Desktop Table of Demands */}
            <div className="hidden md:block overflow-x-auto border border-[#ececec] rounded-[16px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#fafafb] text-[#777b86] font-semibold uppercase text-[10px] tracking-wider border-b border-[#ececec]">
                    <th className="p-3">MRN No & Date</th>
                    <th className="p-3">Job Card & Part Code</th>
                    <th className="p-3">Material Description</th>
                    <th className="p-3 text-center">Requested Qty</th>
                    <th className="p-3">Requested By / Urgency</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Store Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ececec] text-[#17191c]">
                  {materialRequisitions.map((req, idx) => {
                    const isPending = req.status === 'Pending Store Issue';
                    const isDispatched = req.status === 'Dispatched by Store';
                    const isReceived = req.status === 'Received by Production';
                    const isDiscrepant = req.status === 'Discrepancy Flagged';

                    return (
                      <tr key={idx} className="hover:bg-[#fafafb] transition">
                        <td className="p-3">
                          <div className="font-mono font-bold text-[#c09748]">{req.mrnNo}</div>
                          <div className="text-[11px] text-[#777b86]">{req.date} {req.time}</div>
                          <div className="text-[10px] font-mono text-gray-400">{req.plant}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-mono font-bold text-[#17191c]">{req.jobCardNo}</div>
                          <div className="font-mono text-xs text-[#8a6521]">{req.partCode}</div>
                          <div className="text-[10px] text-[#777b86]">{req.customer}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-[#17191c]">{req.partDescription}</div>
                          {req.colorName && (
                            <div className="text-[11px] text-[#777b86]">Color: {req.colorName}</div>
                          )}
                          {req.productionRemarks && (
                            <div className="text-[10px] text-[#8a6521] bg-[#faf7ed] border border-[#f4e5be] p-1 rounded-md mt-1 font-mono">
                              {req.productionRemarks}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-sm bg-[#faf7ed]/60 text-[#8a6521]">
                          {req.requestedQty.toLocaleString('en-IN')} {req.uom}
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-[#17191c]">{req.requestedBy}</div>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            req.urgency.includes('High') || req.urgency.includes('Urgent')
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {req.urgency}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            isPending
                              ? 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse'
                              : isDispatched
                                ? 'bg-blue-50 text-blue-900 border-blue-200'
                                : isReceived
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                  : 'bg-rose-50 text-rose-900 border-rose-300'
                          }`}>
                            {req.status}
                          </span>
                          {req.issuedSlipNo && (
                            <div className="text-[10px] font-mono text-blue-700 mt-0.5">
                              {req.issuedSlipNo}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {isPending ? (
                            <button
                              type="button"
                              onClick={() => {
                                const matchedTracker = materialTrackerList.find(m => m.partCode.toLowerCase() === req.partCode.toLowerCase());
                                const grnToUse = matchedTracker?.grnNo || grnList[0]?.grnNo || 'PK-GRN-2026-1252';
                                const slipNo = `MIN-2026-${String(customIssuedRecords.length + 1).padStart(3, '0')}`;
                                issueMaterialRequisition(
                                  req.mrnNo,
                                  slipNo,
                                  grnToUse,
                                  req.requestedQty,
                                  'Manoj Tiwari (Store Incharge)',
                                  `Dispatched against Requisition ${req.mrnNo}`
                                );
                                // Log in customIssuedRecords
                                setCustomIssuedRecords(prev => [
                                  {
                                    slipNo,
                                    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                                    grnNo: grnToUse,
                                    partCode: req.partCode,
                                    customer: req.customer,
                                    qty: req.requestedQty,
                                    uom: req.uom,
                                    issuedTo: req.requestedBy,
                                    jobCardId: req.jobCardNo,
                                    remarks: `Issued for MRN ${req.mrnNo}`
                                  },
                                  ...prev
                                ]);
                                setEmailSentToast(`✓ MIN Slip ${slipNo} Issued! Transferred ${req.requestedQty} ${req.uom} to Floor.`);
                                setTimeout(() => setEmailSentToast(null), 5000);
                              }}
                              className="px-3.5 py-1.5 rounded-full bg-[#17191c] hover:bg-black text-[#c09748] text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5 text-[#c09748]" />
                              <span>Fulfill & Issue MIN</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-gray-500 font-mono">
                              ✓ Dispatched ({req.issuedQty} {req.uom})
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {materialRequisitions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#777b86]">
                        Koi pending material requisition nahi hai.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View for Requisitions */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {materialRequisitions.map((req, idx) => (
                <div key={idx} className="p-4 rounded-[18px] border border-[#ececec] bg-white shadow-2xs space-y-2.5">
                  <div className="flex items-start justify-between gap-2 border-b border-[#f2f2f3] pb-2">
                    <div>
                      <div className="font-mono font-bold text-xs text-[#c09748]">{req.mrnNo}</div>
                      <div className="font-bold text-sm text-[#17191c]">{req.jobCardNo} • {req.partCode}</div>
                      <div className="text-[11px] text-[#777b86]">{req.customer}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#faf7ed] text-[#8a6521] border border-[#f4e5be]">
                      {req.requestedQty} {req.uom}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 bg-[#fafafb] p-2.5 rounded-[12px]">
                    <div className="text-[11px] text-[#17191c] font-medium">{req.partDescription}</div>
                    {req.productionRemarks && (
                      <div className="text-[10px] text-[#8a6521] bg-[#faf7ed] border border-[#f4e5be] p-1.5 rounded-md font-mono">
                        {req.productionRemarks}
                      </div>
                    )}
                    <div className="flex justify-between text-[#777b86]">
                      <span>Requested By:</span>
                      <span className="text-[#17191c] font-medium">{req.requestedBy}</span>
                    </div>
                    <div className="flex justify-between text-[#777b86]">
                      <span>Status:</span>
                      <span className="font-bold text-[#17191c]">{req.status}</span>
                    </div>
                  </div>

                  {req.status === 'Pending Store Issue' && (
                    <button
                      type="button"
                      onClick={() => {
                        const matchedTracker = materialTrackerList.find(m => m.partCode.toLowerCase() === req.partCode.toLowerCase());
                        const grnToUse = matchedTracker?.grnNo || grnList[0]?.grnNo || 'PK-GRN-2026-1252';
                        const slipNo = `MIN-2026-${String(customIssuedRecords.length + 1).padStart(3, '0')}`;
                        issueMaterialRequisition(
                          req.mrnNo,
                          slipNo,
                          grnToUse,
                          req.requestedQty,
                          'Manoj Tiwari (Store Incharge)',
                          `Dispatched against Requisition ${req.mrnNo}`
                        );
                        setCustomIssuedRecords(prev => [
                          {
                            slipNo,
                            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                            grnNo: grnToUse,
                            partCode: req.partCode,
                            customer: req.customer,
                            qty: req.requestedQty,
                            uom: req.uom,
                            issuedTo: req.requestedBy,
                            jobCardId: req.jobCardNo,
                            remarks: `Issued for MRN ${req.mrnNo}`
                          },
                          ...prev
                        ]);
                        setEmailSentToast(`✓ MIN Slip ${slipNo} Issued!`);
                        setTimeout(() => setEmailSentToast(null), 5000);
                      }}
                      className="w-full py-2 rounded-full bg-[#17191c] text-[#c09748] text-xs font-bold flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-[#c09748]" />
                      <span>Fulfill & Issue MIN Slip</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 3: MATERIAL ISSUE SLIPS (MIN) & FLOOR DISPATCH REGISTER            */}
      {/* ====================================================================== */}
      {activeTab === 'ISSUED_SLIPS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-[24px] border border-[#ececec] p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ececec]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-normal text-lg sm:text-xl text-[#17191c]">
                    Material Issue Notes (MIN) & Floor Dispatch History
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">
                    Floor Custody Transferred
                  </span>
                </div>
                <p className="text-xs text-[#777b86] mt-0.5">
                  Store se shop floor / painters / lines par issue huye saare materials ke official MIN slips ka complete record.
                </p>
              </div>
            </div>

            {/* Desktop Table View of Issued Slips */}
            <div className="hidden md:block overflow-x-auto border border-[#ececec] rounded-[16px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#fafafb] text-[#777b86] font-semibold uppercase text-[10px] tracking-wider border-b border-[#ececec]">
                    <th className="p-3">MIN Slip No & Date</th>
                    <th className="p-3">Customer & Part Details</th>
                    <th className="p-3 text-center">Quantity Issued</th>
                    <th className="p-3">Target Job Card</th>
                    <th className="p-3">Received By (Floor Incharge)</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ececec] text-[#17191c]">
                  {customIssuedRecords.map((slip, idx) => (
                    <tr key={idx} className="hover:bg-[#fafafb] transition">
                      <td className="p-3">
                        <div className="font-mono font-bold text-[#c09748]">{slip.slipNo}</div>
                        <div className="text-[11px] text-[#777b86]">{slip.date}</div>
                        <div className="text-[10px] text-[#a3a6af] font-mono">GRN: {slip.grnNo}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-[#17191c]">{slip.customer}</div>
                        <div className="font-mono font-bold text-xs text-[#8a6521]">{slip.partCode}</div>
                        <div className="text-[11px] text-[#777b86] line-clamp-1">{slip.remarks || 'Issued for coating line'}</div>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-sm bg-blue-50/30 text-blue-900">
                        {slip.qty.toLocaleString('en-IN')} {slip.uom}
                      </td>
                      <td className="p-3">
                        <div className="font-mono font-bold text-[#17191c]">{slip.jobCardId}</div>
                        <div className="text-[10px] text-[#777b86]">Production Line Work Order</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-[#17191c]">{slip.issuedTo}</div>
                        <div className="text-[10px] text-emerald-700">✓ Signed Custody</div>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedIssueSlipForPrint(slip)}
                          className="px-3.5 py-1.5 rounded-full border border-[#ececec] bg-white text-[#17191c] hover:bg-gray-50 text-[11px] font-semibold transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#c09748]" />
                          <span>View & Print Slip</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {customIssuedRecords.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#777b86]">
                        Abhi tak koi material floor par issue nahi kiya gaya hai.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards of Issued Slips */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {customIssuedRecords.map((slip, idx) => (
                <div key={idx} className="p-4 rounded-[18px] border border-[#ececec] bg-white shadow-2xs space-y-2.5">
                  <div className="flex items-start justify-between gap-2 border-b border-[#f2f2f3] pb-2">
                    <div>
                      <div className="font-mono font-bold text-xs text-[#c09748]">{slip.slipNo}</div>
                      <div className="font-bold text-sm text-[#17191c]">{slip.customer}</div>
                      <div className="font-mono text-xs text-[#8a6521]">{slip.partCode}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-900 border border-blue-200">
                      {slip.qty} {slip.uom}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 bg-[#fafafb] p-2.5 rounded-[12px]">
                    <div className="flex justify-between">
                      <span className="text-[#777b86]">Target Job Card:</span>
                      <span className="font-mono font-bold text-[#17191c]">{slip.jobCardId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#777b86]">Issued To:</span>
                      <span className="font-medium text-[#17191c]">{slip.issuedTo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#777b86]">Issue Date:</span>
                      <span className="text-[#17191c]">{slip.date}</span>
                    </div>
                    {slip.remarks && (
                      <div className="text-[11px] text-[#777b86] pt-1 border-t border-[#ececec]">
                        Note: {slip.remarks}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-mono text-[#a3a6af]">Source: {slip.grnNo}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedIssueSlipForPrint(slip)}
                      className="px-3 py-1 rounded-full bg-[#17191c] text-[#c09748] text-xs font-bold flex items-center gap-1 shadow-2xs"
                    >
                      <Printer className="w-3 h-3 text-[#c09748]" />
                      <span>Print MIN Slip</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Email Trigger Toast Notification */}
      {emailSentToast && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-[20px] bg-[#17191c] text-white shadow-xl border border-[#c09748] flex items-center gap-3 animate-bounce">
          <div className="w-8 h-8 rounded-full bg-[#c09748]/20 flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4 text-[#c09748]" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#c09748]">Email Trigger Dispatched</div>
            <div className="text-[11px] text-gray-300">{emailSentToast}</div>
          </div>
          <button
            type="button"
            onClick={() => setEmailSentToast(null)}
            className="text-gray-400 hover:text-white text-xs ml-2 cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 2: DEDICATED SHELF-LIFE & MATERIAL AGING DASHBOARD (ALL MATERIALS)  */}
      {/* ====================================================================== */}
      {activeTab === 'SHELF_LIFE' && (
        <div className="space-y-4">
          <div className="bg-white rounded-[24px] border border-[#ececec] p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ececec]">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-serif font-normal text-lg sm:text-xl text-[#17191c]">
                    Material Shelf-Life & Aging Tracker (All Stock)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#faf7ed] border border-[#f4e5be] text-[#8a6521]">
                    FIFO Auto-Watch
                  </span>
                  {/* Email trigger indicator pill */}
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold inline-flex items-center gap-1 ${
                    emailTriggersEnabled 
                      ? 'bg-blue-50 text-blue-800 border border-blue-200' 
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}>
                    <Mail className="w-3 h-3 text-blue-600" />
                    <span>Auto-Email: {emailTriggersEnabled ? `>= ${emailThresholdDays} Days ON` : 'OFF'}</span>
                  </span>
                </div>
                <p className="text-xs text-[#777b86] mt-0.5">
                  Har material ka inward timestamp aur age tracker. Agar koi bhi part {emailThresholdDays} din se zyada store me rehta hai toh automated email alert trigger hota hai.
                </p>
              </div>

              {/* Action Buttons: Configure Email Alert & Status Filters */}
              <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setShowEmailConfigModal(true)}
                  className="px-3.5 py-1.5 rounded-full border border-[#ececec] bg-white hover:bg-gray-50 text-[#17191c] text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
                >
                  <Settings className="w-3.5 h-3.5 text-[#c09748]" />
                  <span>Configure Email ({emailThresholdDays}d Alert)</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendEmailAlertNow}
                  className="px-4 py-1.5 rounded-full bg-[#17191c] hover:bg-black text-[#c09748] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition active:scale-95"
                  title="Send immediate aging email notification to Purchase, Stores, and Production"
                >
                  <Send className="w-3.5 h-3.5 text-[#c09748]" />
                  <span>Send Email Alert Now ({itemsTriggeringEmail.length})</span>
                </button>
              </div>
            </div>

            {/* Filter Pills Strip */}
            <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
              <div className="flex items-center gap-1 bg-[#fafafb] p-1 rounded-full border border-[#ececec]">
                <button
                  type="button"
                  onClick={() => setShelfHealthFilter('ALL')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition ${
                    shelfHealthFilter === 'ALL' ? 'bg-[#17191c] text-[#c09748]' : 'text-[#777b86] hover:text-[#17191c]'
                  }`}
                >
                  All ({materialTrackerList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setShelfHealthFilter('AGING')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition ${
                    shelfHealthFilter === 'AGING' ? 'bg-amber-500 text-white' : 'text-amber-800 hover:text-amber-900'
                  }`}
                >
                  ⚠ Aging ({allAgingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setShelfHealthFilter('EXPIRED')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition ${
                    shelfHealthFilter === 'EXPIRED' ? 'bg-red-600 text-white' : 'text-red-700 hover:text-red-800'
                  }`}
                >
                  ⛔ Exceeded ({allExpiredCount})
                </button>
                <button
                  type="button"
                  onClick={() => setShelfHealthFilter('FRESH')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition ${
                    shelfHealthFilter === 'FRESH' ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:text-emerald-800'
                  }`}
                >
                  ✓ Fresh
                </button>
              </div>

              {/* Email Trigger Banner Pill */}
              <div className="text-[11px] font-mono text-[#777b86] flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  <strong>{itemsTriggeringEmail.length} items</strong> qualify for {emailThresholdDays}-Day Email Trigger
                </span>
              </div>
            </div>

            {/* Standard Shelf-Life & Rotation Reference Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-3 rounded-[16px] bg-[#fafafb] border border-[#ececec] text-xs">
              <div className="p-2 bg-white rounded-[12px] border border-[#ececec]">
                <span className="text-[10px] font-mono font-bold text-[#777b86] uppercase block">2K PU Hardener</span>
                <span className="font-bold text-sm text-[#17191c]">Max 20 Days</span>
                <span className="text-[10px] text-amber-700 block mt-0.5">Alert at Day 14</span>
              </div>
              <div className="p-2 bg-white rounded-[12px] border border-[#ececec]">
                <span className="text-[10px] font-mono font-bold text-[#777b86] uppercase block">PU Basecoat Paint</span>
                <span className="font-bold text-sm text-[#17191c]">Max 30 Days</span>
                <span className="text-[10px] text-amber-700 block mt-0.5">Alert at Day 20</span>
              </div>
              <div className="p-2 bg-white rounded-[12px] border border-[#ececec]">
                <span className="text-[10px] font-mono font-bold text-[#777b86] uppercase block">High Gloss Clear</span>
                <span className="font-bold text-sm text-[#17191c]">Max 45 Days</span>
                <span className="text-[10px] text-amber-700 block mt-0.5">Alert at Day 30</span>
              </div>
              <div className="p-2 bg-white rounded-[12px] border border-[#ececec]">
                <span className="text-[10px] font-mono font-bold text-[#777b86] uppercase block">PU Solvents / Thinners</span>
                <span className="font-bold text-sm text-[#17191c]">Max 60 Days</span>
                <span className="text-[10px] text-amber-700 block mt-0.5">Alert at Day 45</span>
              </div>
              <div className="p-2 bg-white rounded-[12px] border border-[#ececec]">
                <span className="text-[10px] font-mono font-bold text-[#777b86] uppercase block">Substrates (ABS/PC)</span>
                <span className="font-bold text-sm text-[#17191c]">Max 90 Days</span>
                <span className="text-[10px] text-amber-700 block mt-0.5">Rotation at Day 60</span>
              </div>
            </div>

            {/* Shelf-Life Lots Desktop Table */}
            <div className="hidden md:block overflow-x-auto border border-[#ececec] rounded-[16px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#fafafb] text-[#777b86] font-semibold uppercase text-[10px] tracking-wider border-b border-[#ececec]">
                    <th className="p-3">Material Category & Part</th>
                    <th className="p-3 text-center">Days In Store</th>
                    <th className="p-3 text-center">Shelf-Life Status</th>
                    <th className="p-3 text-center">Available Stock</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ececec] text-[#17191c]">
                  {filteredShelfLife.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#fafafb] transition">
                      <td className="p-3">
                        <div className="font-semibold text-sm text-[#17191c]">{item.materialCategory}</div>
                        <div className="font-mono text-xs text-[#c09748] font-bold">{item.partCode}</div>
                        <div className="text-[11px] text-[#777b86]">{item.customer}</div>
                      </td>
                      <td className="p-3 text-center font-mono">
                        <span className="font-bold text-xs text-[#17191c]">
                          {item.daysInStore} Days
                        </span>
                        <div className="text-[10px] text-[#777b86]">
                          Max: {item.shelfLifeDays}d
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          item.shelfHealth === 'FRESH'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : item.shelfHealth === 'AGING_WARNING'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                              : 'bg-red-100 text-red-800 border border-red-300'
                        }`}>
                          {item.shelfHealth === 'FRESH' && `✓ Safe (${item.daysRemaining}d left)`}
                          {item.shelfHealth === 'AGING_WARNING' && `⚠ Aging (${item.daysRemaining}d left • Use FIFO)`}
                          {item.shelfHealth === 'EXPIRED' && '⛔ Shelf-Life Exceeded'}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-sm bg-[#faf7ed]/60 text-[#8a6521]">
                        {item.balanceAvailable.toLocaleString('en-IN')} {item.uom}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedGrnForView(item.rawGrn)}
                          className="px-3.5 py-1.5 rounded-full border border-[#ececec] bg-white text-[#17191c] text-[11px] font-semibold hover:bg-gray-50 transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#c09748]" />
                          <span>View GRN</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredShelfLife.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[#777b86]">
                        Koi chemical / paint record match nahi hua.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards for Shelf-Life */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {filteredShelfLife.map((item, idx) => (
                <div key={idx} className="p-4 rounded-[18px] border border-[#ececec] bg-white shadow-2xs space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b border-[#f2f2f3] pb-2">
                    <div>
                      <div className="font-bold text-sm text-[#17191c]">{item.materialCategory}</div>
                      <div className="font-mono text-xs font-bold text-[#c09748]">{item.partCode}</div>
                      <div className="text-[11px] text-[#777b86]">{item.customer}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      item.shelfHealth === 'FRESH'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : item.shelfHealth === 'AGING_WARNING'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                          : 'bg-red-100 text-red-800 border border-red-300'
                    }`}>
                      {item.shelfHealth === 'FRESH' && '✓ Fresh'}
                      {item.shelfHealth === 'AGING_WARNING' && '⚠ Use FIFO'}
                      {item.shelfHealth === 'EXPIRED' && '⛔ Exceeded'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center py-1 bg-[#fafafb] rounded-[12px] p-2">
                    <div>
                      <span className="text-[9px] uppercase font-mono text-[#777b86] block">In Store</span>
                      <span className="font-mono font-bold text-xs text-[#17191c]">{item.daysInStore} Days</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-mono text-amber-800 block">Remaining</span>
                      <span className="font-mono font-bold text-xs text-amber-900">{item.daysRemaining}d</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-mono text-[#8a6521] block">Stock</span>
                      <span className="font-mono font-bold text-xs text-[#8a6521]">{item.balanceAvailable} {item.uom}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#777b86] pt-1">
                    <span className="font-mono">Inward: {item.receivedDate}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedGrnForView(item.rawGrn)}
                      className="px-3 py-1 rounded-full border border-[#ececec] bg-white text-[#17191c] font-semibold flex items-center gap-1 shadow-2xs"
                    >
                      <Eye className="w-3 h-3 text-[#c09748]" />
                      <span>View GRN</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 2: PENDING INWARDS (IQC PASSED • AWAITING STORE INTAKE & GRN)       */}
      {/* ====================================================================== */}
      {activeTab === 'PENDING' && (
        <div className="space-y-4">
          <div className="bg-white rounded-[20px] sm:rounded-[24px] border border-[#ececec] p-4 sm:p-6 shadow-xs sm:shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#f2f2f3]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase font-bold tracking-wider">
                    IQC PASSED • AWAITING STORE INTAKE
                  </span>
                  <span className="text-xs text-[#777b86]">
                    Quality passed lots ready for official store intake & GRN generation
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-serif font-normal text-[#17191c]">
                  Pending IQC Inwards ({filteredPending.length})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]">
                  {filteredPending.length} Lots Ready For GRN
                </span>
              </div>
            </div>

            {filteredPending.length === 0 ? (
              <div className="p-10 text-center space-y-3 bg-[#fafafb] rounded-[18px] border border-dashed border-[#ececec]">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-serif text-base font-normal text-[#17191c]">
                  Sabhi IQC Material Process Ho Chuke Hain!
                </h4>
                <p className="text-xs text-[#777b86] max-w-md mx-auto">
                  IQC se pass huye saare materials ke official GRN ban chuke hain. Gate Security aur IQC me naya inward test hone par yaha pending jobs turant dikhenge.
                </p>
              </div>
            ) : (
              <>
                {/* DESKTOP TABLE VIEW (>= 640px): Standard Clean 4-Column Table */}
                <div className="hidden sm:block overflow-x-auto border border-[#ececec] rounded-[16px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#f2f2f3] text-[#17191c] border-b border-[#ececec] font-semibold sticky top-0">
                      <tr>
                        <th className="p-3.5 w-52 whitespace-nowrap">1. IQC REPORT REF & DATE</th>
                        <th className="p-3.5">2. SUPPLIER / PARTY</th>
                        <th className="p-3.5">3. MATERIAL & QUANTITY</th>
                        <th className="p-3.5 text-right w-64 whitespace-nowrap">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ececec] text-[#17191c]">
                      {filteredPending.map((job, idx) => (
                        <tr key={job.reportNo || idx} className="hover:bg-[#fafafb] transition">
                          {/* 1. IQC Report Ref & Date */}
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="font-mono font-bold text-xs text-[#c09748]">{job.reportNo}</div>
                            <div className="text-[11px] text-[#777b86] mt-0.5 font-medium">
                              {formatDateDDMMYYYY(job.receivedDate || job.invoiceChallanDate)}
                            </div>
                          </td>

                          {/* 2. Supplier / Party & Challan */}
                          <td className="p-3.5">
                            <div className="font-semibold text-xs text-[#17191c] line-clamp-1" title={job.vendorCustomer}>
                              {job.vendorCustomer}
                            </div>
                            <div className="text-[11px] text-[#777b86] mt-0.5 font-mono">
                              Ch: <span className="font-semibold text-[#17191c]">{job.invoiceChallanNo}</span>
                            </div>
                          </td>

                          {/* 3. Material Description & Verified Quantity */}
                          <td className="p-3.5">
                            <div className="font-medium text-xs text-[#17191c] max-w-xs truncate" title={job.partDescription}>
                              {job.partDescription || 'Raw Substrate'}
                            </div>
                            <div className="font-mono font-bold text-xs text-emerald-800 mt-0.5">
                              {Number(job.totalQty).toLocaleString('en-IN')} {job.uom || 'Pcs'}
                            </div>
                          </td>

                          {/* 4. Actions: Accept & Create GRN + View Details */}
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenGrnForPending(job)}
                                className="px-3.5 py-1.5 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                                title="Accept Lot into Store & Generate Official GRN (DOC NO: 00)"
                              >
                                <Plus className="w-3.5 h-3.5 text-[#8a6521]" />
                                <span>Accept & Create GRN</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setSelectedPendingJobForView(job)}
                                className="px-3 py-1.5 rounded-full border border-[#dcdfe4] bg-white hover:bg-[#17191c] hover:text-white text-xs font-medium text-[#17191c] transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                title="View Lot & IQC Inspection Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Details</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE VIEW (< 640px): Clean 3-Row Responsive Cards */}
                <div className="sm:hidden space-y-2.5">
                  {filteredPending.map((job, idx) => (
                    <div key={job.reportNo || idx} className="bg-[#fafafb] p-3.5 rounded-[18px] border border-[#ececec] space-y-2 shadow-2xs">
                      {/* Row 1: IQC Report Ref + Inward Ref */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-xs text-[#c09748]">
                          {job.reportNo}
                        </span>
                        <span className="text-[10.5px] font-mono text-[#777b86]">
                          {job.inwardSrNo}
                        </span>
                      </div>

                      {/* Row 2: Party Name + Date */}
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="font-semibold text-xs text-[#17191c] truncate">
                          {job.vendorCustomer}
                        </div>
                        <div className="text-[10.5px] text-[#777b86] shrink-0 font-medium">
                          {formatDateDDMMYYYY(job.receivedDate || job.invoiceChallanDate)}
                        </div>
                      </div>

                      {/* Row 3: Material + Verified Qty */}
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <div className="text-[#777b86] truncate max-w-[60%]" title={job.partDescription}>
                          {job.partDescription || 'Raw Substrate'}
                        </div>
                        <div className="font-mono font-bold text-xs text-emerald-800 shrink-0">
                          {Number(job.totalQty).toLocaleString('en-IN')} {job.uom || 'Pcs'}
                        </div>
                      </div>

                      {/* Row 4: Action Buttons Bar */}
                      <div className="pt-2 border-t border-[#ececec] grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenGrnForPending(job)}
                          className="h-8.5 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer shadow-2xs active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#8a6521]" />
                          <span>Accept & GRN</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedPendingJobForView(job)}
                          className="h-8.5 rounded-full bg-white hover:bg-gray-50 text-[#17191c] border border-[#dcdfe4] text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#777b86]" />
                          <span>View Details</span>
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

      {/* ====================================================================== */}
      {/* TAB 3: OFFICIAL GRN REGISTER (DOC NO: 00 & STORE INVENTORY)             */}
      {/* ====================================================================== */}
      {activeTab === 'GRN_REGISTER' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg text-[#17191c]">
              Official Goods Received Notes (DOC NO: 00) & Stored Lots
            </h3>
            <span className="text-xs text-[#777b86] font-mono">
              Total: {filteredGrnList.length} Official GRNs
            </span>
          </div>

          <div className="space-y-5">
            {filteredGrnList.map(grn => (
              <div 
                key={grn.grnNo} 
                className="bg-white rounded-[24px] border border-[#ececec] p-5 sm:p-6 shadow-sm space-y-4 hover:border-[#c09748]/50 transition"
              >
                {/* Header: Identification & Badges */}
                <div className="pb-3 border-b border-[#f2f2f3] space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                      <span className="font-mono text-xs font-bold text-[#c09748] px-3 py-1 rounded-full bg-[#faf7ed] border border-[#f4e5be] whitespace-nowrap shadow-xs">
                        {grn.grnNo}
                      </span>
                      <span className="text-xs text-[#777b86] font-mono whitespace-nowrap px-2.5 py-0.5 rounded-full bg-[#f2f2f3]">
                        Challan: <strong className="text-[#17191c] font-semibold">{grn.invoiceChallanNo}</strong>
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10px] font-mono font-bold uppercase">
                        {grn.docNo || 'DOC NO: 00'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="text-xs text-[#777b86] font-mono whitespace-nowrap flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#a3a6af]" />
                        Recd Date: {grn.receivedDate || grn.date}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 ${
                        grn.iqcStatus === 'Accepted' 
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                          : 'bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521]'
                      }`}>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        IQC: {grn.iqcStatus || 'Accepted'}
                      </span>
                    </div>
                  </div>

                  {/* Customer / Supplier Title */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="font-serif font-normal text-xl text-[#17191c] tracking-tight pt-0.5">
                      {grn.supplierCustomer}
                    </h3>
                    <span className="text-xs text-[#777b86] font-mono">
                      Transporter: <strong className="text-[#17191c]">{grn.transporter || 'Direct'}</strong> ({grn.vehicleNo || 'Factory Gate'})
                    </span>
                  </div>
                </div>

                {/* Line Items Table */}
                {grn.items && grn.items.length > 0 ? (
                  <div className="overflow-x-auto border border-[#ececec] rounded-[16px]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#fafafb] text-[#777b86] font-semibold uppercase text-[10px] tracking-wider border-b border-[#ececec]">
                          <th className="p-2.5">Part Code</th>
                          <th className="p-2.5">Part Description</th>
                          <th className="p-2.5 text-center">Invoiced Qty</th>
                          <th className="p-2.5 text-center">Actual Received</th>
                          <th className="p-2.5 text-center">Short / Excess</th>
                          <th className="p-2.5 text-center">Ok By IQC</th>
                          <th className="p-2.5 text-center">Rej Qty</th>
                          <th className="p-2.5">Remark</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ececec] text-[#17191c]">
                        {grn.items.map((row, idx) => (
                          <tr key={idx} className="hover:bg-[#fafafb]">
                            <td className="p-2.5 font-mono font-bold text-[#c09748]">{row.partCode}</td>
                            <td className="p-2.5 font-medium">{row.partDescription}</td>
                            <td className="p-2.5 text-center font-mono">{row.invoicedQty}</td>
                            <td className="p-2.5 text-center font-mono font-bold text-emerald-800 bg-emerald-50/40">
                              {row.actualReceivedQty}
                            </td>
                            <td className="p-2.5 text-center font-mono font-bold">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                row.shortExcessQty < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {row.shortExcessQty}
                              </span>
                            </td>
                            <td className="p-2.5 text-center font-mono text-emerald-700 font-semibold">{row.okByIqcQty}</td>
                            <td className="p-2.5 text-center font-mono text-red-600 font-semibold">{row.rejectionQty}</td>
                            <td className="p-2.5 text-gray-500 text-[11px]">{row.remark || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-[16px] bg-[#fafafb] border border-[#ececec] text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-[#777b86] uppercase">Part Code & Description</span>
                      <div className="font-semibold text-[#17191c]">{grn.description || grn.partCode}</div>
                      <div className="font-mono text-[11px] text-[#c09748]">{grn.partCode}</div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#777b86] uppercase">Received Count</span>
                      <div className="font-serif font-bold text-lg text-[#17191c]">{grn.actualReceivedQty || grn.totalQty} pcs</div>
                      <div className="text-[11px] text-[#777b86]">Invoiced: {grn.invoicedQty}</div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#777b86] uppercase">Store Incharge</span>
                      <div className="font-semibold text-[#17191c]">{grn.storeIncharge}</div>
                    </div>
                  </div>
                )}

                {/* Action Bar: View GRN & Download PDF */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-[#ececec]">
                  <div className="flex items-center gap-2 text-xs text-[#777b86] flex-wrap">
                    <span>Store Incharge: <strong className="text-[#17191c]">{grn.storeIncharge}</strong></span>
                    <span>•</span>
                    <span>Quality Approved: <strong className="text-emerald-800">{grn.qualityApprovedBy || 'Amit Verma (QA)'}</strong></span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSelectedGrnForView(grn)}
                      className="px-4 py-2 rounded-full border border-[#ececec] bg-white text-[#17191c] text-xs font-semibold hover:bg-gray-50 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#c09748]" />
                      <span>View Official GRN (DOC NO: 00)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadStandardGRNPdf(grn)}
                      className="px-4 py-2 rounded-full border border-[#ececec] bg-white text-[#17191c] text-xs font-semibold hover:bg-gray-50 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Download Official GRN PDF (DOC NO: 00)"
                    >
                      <Download className="w-3.5 h-3.5 text-[#c09748]" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredGrnList.length === 0 && (
              <div className="bg-white rounded-[24px] border border-[#ececec] p-12 text-center text-[#777b86]">
                Koi completed GRN record nahi mila.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateGRNModal
        isOpen={showGRNModal}
        onClose={() => {
          setShowGRNModal(false);
          setSelectedPendingJobForGrn(null);
        }}
        pendingJob={selectedPendingJobForGrn}
      />

      {selectedGrnForView && (
        <OfficialGRNDocument
          grn={selectedGrnForView}
          isModal={true}
          onClose={() => setSelectedGrnForView(null)}
        />
      )}

      {/* Email Trigger Configuration & History Modal */}
      {showEmailConfigModal && (
        <div className="fixed inset-0 z-50 bg-[#fafafb] sm:bg-white overflow-y-auto flex flex-col animate-in fade-in duration-150">
          {/* Sticky Top Header Bar */}
          <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#ececec] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
                  AUTOMATION & ALERTS
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#777b86] text-[10px] font-mono">
                  Stores Aging Desk
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-normal text-[#17191c]">
                Automated Material Aging Email Trigger
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowEmailConfigModal(false)}
              className="w-9 h-9 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] flex items-center justify-center cursor-pointer transition active:scale-95 shadow-2xs"
              title="Close"
            >
              <X className="w-5 h-5 text-[#17191c]" />
            </button>
          </div>

          <div className="max-w-4xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1 text-xs text-[#17191c]">
            <p className="text-[#777b86] leading-relaxed">
              Set automated threshold rules to notify Purchase, Stores, & Production when material is aging in the warehouse beyond safe limits.
            </p>

            {/* Trigger Switch & Days Setting */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-[20px] bg-[#fafafb] border border-[#ececec]">
              <div>
                <label className="font-bold text-[#17191c] block mb-1">
                  Email Notification Threshold (Days in Store)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={emailThresholdDays}
                    onChange={e => setEmailThresholdDays(Number(e.target.value) || 1)}
                    className="w-28 px-3.5 py-2.5 rounded-[14px] bg-white border border-[#ececec] font-mono font-bold text-center text-sm focus:outline-none focus:border-[#c09748]"
                  />
                  <span className="text-xs text-[#777b86]">Days (Default: 10 Days)</span>
                </div>
                <span className="text-[10px] text-[#777b86] mt-1 block">
                  Material ko company me inward huye itne din hote hi alert trigger hoga.
                </span>
              </div>

              <div>
                <label className="font-bold text-[#17191c] block mb-1">
                  Automated Service Status
                </label>
                <button
                  type="button"
                  onClick={() => setEmailTriggersEnabled(!emailTriggersEnabled)}
                  className={`w-full py-2.5 px-3.5 rounded-[14px] font-bold text-xs flex items-center justify-between border cursor-pointer transition ${
                    emailTriggersEnabled
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-gray-100 border-gray-300 text-gray-700'
                  }`}
                >
                  <span>{emailTriggersEnabled ? '✓ Automated Dispatch ACTIVE' : '✕ Automation PAUSED'}</span>
                  <span className={`w-3 h-3 rounded-full ${emailTriggersEnabled ? 'bg-emerald-500 animate-ping' : 'bg-gray-400'}`} />
                </button>
                <span className="text-[10px] text-[#777b86] mt-1 block">
                  Daily 09:00 AM auto-cron trigger scan enabled.
                </span>
              </div>
            </div>

            {/* Recipient Mailing List */}
            <div className="space-y-1.5">
              <label className="font-bold text-[#17191c] block">
                Alert Recipients (Comma Separated Emails)
              </label>
              <input
                type="text"
                value={alertRecipients}
                onChange={e => setAlertRecipients(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[14px] bg-white border border-[#ececec] text-xs font-mono focus:outline-none focus:border-[#c09748]"
                placeholder="stores@paintking.in, purchase@paintking.in, production@paintking.in"
              />
              <div className="flex items-center gap-2 text-[10px] text-[#777b86]">
                <span>Roles notified:</span>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 font-mono">Store Manager</span>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 font-mono">Production Head</span>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 font-mono">Purchase Lead</span>
              </div>
            </div>

            {/* Live Preview of Qualifying Lots */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#17191c] uppercase text-[10px] tracking-wider font-mono">
                  Currently Qualifying Materials (&ge; {emailThresholdDays} Days In Store):
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono font-bold text-[10px]">
                  {itemsTriggeringEmail.length} Lots
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto border border-[#ececec] rounded-[18px] p-2 space-y-1.5 bg-[#fafafb]">
                {itemsTriggeringEmail.map((it, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-[14px] border border-[#ececec] flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-[#c09748]">{it.partCode}</span>
                      <span className="text-[#777b86] ml-2">({it.customer})</span>
                      <div className="text-[10px] text-[#777b86]">{it.partDesc}</div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                        {it.daysInStore} Days in Store
                      </span>
                      <div className="text-[10px] text-[#8a6521] font-semibold mt-0.5">
                        Bal: {it.balanceAvailable} {it.uom}
                      </div>
                    </div>
                  </div>
                ))}
                {itemsTriggeringEmail.length === 0 && (
                  <div className="p-6 text-center text-[#777b86]">
                    Koi bhi material {emailThresholdDays} din se zyada store me nahi pada hai. All fresh!
                  </div>
                )}
              </div>
            </div>

            {/* Recent Logs Table */}
            <div className="space-y-3">
              <span className="font-bold text-xs uppercase tracking-wider text-[#17191c] block">
                Recent Email Dispatch Logs ({sentAlertHistory.length})
              </span>
              <div className="border border-[#ececec] rounded-[18px] overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f2f2f3] text-[#17191c] font-semibold border-b border-[#ececec]">
                    <tr>
                      <th className="p-3">Log ID</th>
                      <th className="p-3">Dispatched Time</th>
                      <th className="p-3">Items Flagged</th>
                      <th className="p-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ececec]">
                    {sentAlertHistory.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-[#777b86]">
                          No email alerts dispatched yet.
                        </td>
                      </tr>
                    ) : (
                      sentAlertHistory.map((h, i) => (
                        <tr key={i} className="hover:bg-[#fafafb] transition">
                          <td className="p-3 font-mono font-bold text-[#c09748]">{h.id}</td>
                          <td className="p-3 font-mono text-[#777b86]">{h.timestamp}</td>
                          <td className="p-3 truncate max-w-xs">{h.partCodes}</td>
                          <td className="p-3 text-right">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              ✓ Delivered
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-[#ececec] flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-[#777b86]">
                Rule: Auto-sends alert when Days In Company &ge; {emailThresholdDays}
              </span>
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowEmailConfigModal(false)}
                  className="px-5 py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86] hover:bg-gray-50 text-xs font-semibold cursor-pointer transition"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSendEmailAlertNow();
                    setShowEmailConfigModal(false);
                  }}
                  className="px-6 py-2.5 rounded-full bg-[#17191c] hover:bg-black text-[#c09748] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                >
                  <Send className="w-3.5 h-3.5 text-[#c09748]" />
                  <span>Send Immediate Test Alert</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL 1: MATERIAL ISSUE SLIP (MIN - ISSUE TO SHOP FLOOR)               */}
      {/* ====================================================================== */}
      {showIssueModal && selectedItemForIssue && (
        <div className="fixed inset-0 z-50 bg-[#fafafb] sm:bg-white overflow-y-auto flex flex-col animate-in fade-in duration-150">
          {/* Sticky Top Header Bar */}
          <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#ececec] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
                  MIN ISSUE REQUISITION
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#777b86] text-[10px] font-mono">
                  GRN: {selectedItemForIssue.grnNo}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-normal text-[#17191c]">
                Issue Material to Shop Floor (MIN Slip)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowIssueModal(false)}
              className="w-9 h-9 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] flex items-center justify-center cursor-pointer transition active:scale-95 shadow-2xs"
              title="Close"
            >
              <X className="w-5 h-5 text-[#17191c]" />
            </button>
          </div>

          <div className="max-w-3xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1 text-xs">
            {/* Part Details Box */}
            <div className="p-4 bg-[#faf7ed] border border-[#f4e5be] rounded-[20px] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#8a6521] uppercase text-[10px] tracking-wider font-mono">
                  Part & Lot Overview
                </span>
                <span className="font-mono font-bold text-[#8a6521]">
                  GRN: {selectedItemForIssue.grnNo}
                </span>
              </div>
              <div className="text-sm font-bold text-[#17191c]">{selectedItemForIssue.customer}</div>
              <div className="font-mono font-bold text-[#c09748]">{selectedItemForIssue.partCode} — {selectedItemForIssue.partDesc}</div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-[#f4e5be]/70 text-[#8a6521]">
                <span>Available Store Balance:</span>
                <span className="font-bold font-mono text-base">{selectedItemForIssue.balanceAvailable} {selectedItemForIssue.uom}</span>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConfirmIssue} className="space-y-4">
              {/* Quantity Input */}
              <div className="space-y-1">
                <label className="font-bold text-[#17191c] flex items-center justify-between">
                  <span>Issue Quantity ({selectedItemForIssue.uom}) *</span>
                  <button
                    type="button"
                    onClick={() => setIssueQtyInput(selectedItemForIssue.balanceAvailable)}
                    className="text-xs text-[#c09748] hover:underline font-semibold cursor-pointer"
                  >
                    Issue All ({selectedItemForIssue.balanceAvailable})
                  </button>
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedItemForIssue.balanceAvailable}
                  value={issueQtyInput}
                  onChange={e => setIssueQtyInput(Number(e.target.value))}
                  required
                  className="w-full p-3 rounded-[16px] bg-white border border-[#ececec] text-base font-mono font-bold text-[#17191c] focus:outline-none focus:border-[#c09748]"
                />
              </div>

              {/* Job Card Selection */}
              <div className="space-y-1">
                <label className="font-bold text-[#17191c] block">
                  Target Job Card / Work Order
                </label>
                <select
                  value={issueTargetJobCard}
                  onChange={e => setIssueTargetJobCard(e.target.value)}
                  className="w-full p-3 rounded-[16px] bg-white border border-[#ececec] text-xs font-mono focus:outline-none focus:border-[#c09748]"
                >
                  {jobCards.map(jc => (
                    <option key={jc.jobCardId} value={jc.jobCardId}>
                      {jc.jobCardId} — {jc.partCode || 'Part'} (Target: {jc.targetQty || 0} pcs)
                    </option>
                  ))}
                  <option value="GENERAL_PRODUCTION">Line Setup / General Batch</option>
                </select>
              </div>

              {/* Issued To Person */}
              <div className="space-y-1">
                <label className="font-bold text-[#17191c] block">
                  Issued To (Floor Incharge / Painter / Supervisor)
                </label>
                <input
                  type="text"
                  value={issuedToPerson}
                  onChange={e => setIssuedToPerson(e.target.value)}
                  required
                  className="w-full p-3 rounded-[16px] bg-white border border-[#ececec] text-xs focus:outline-none focus:border-[#c09748]"
                  placeholder="e.g. Ramesh Kumar (Line 1 Supervisor)"
                />
              </div>

              {/* Remarks */}
              <div className="space-y-1">
                <label className="font-bold text-[#17191c] block">
                  Issue Remarks / Process Notes
                </label>
                <input
                  type="text"
                  value={issueRemarks}
                  onChange={e => setIssueRemarks(e.target.value)}
                  className="w-full p-3 rounded-[16px] bg-white border border-[#ececec] text-xs focus:outline-none focus:border-[#c09748]"
                  placeholder="e.g. Issued for Primer & Basecoat Application"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-5 py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86] font-semibold hover:bg-[#f2f2f3] cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#17191c] hover:bg-black text-[#c09748] font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition"
                >
                  <CheckSquare className="w-4 h-4 text-[#c09748]" />
                  <span>Confirm Issue & Generate MIN</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL 3: OFFICIAL PRINTABLE MATERIAL ISSUE NOTE (MIN SLIP)              */}
      {/* ====================================================================== */}
      {selectedIssueSlipForPrint && (
        <div className="fixed inset-0 z-50 bg-[#fafafb] sm:bg-white overflow-y-auto flex flex-col animate-in fade-in duration-150">
          {/* Sticky Top Header Bar */}
          <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#ececec] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
                  OFFICIAL MIN SLIP
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#777b86] text-[10px] font-mono">
                  {selectedIssueSlipForPrint.slipNo}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-normal text-[#17191c]">
                Official Material Issue Note
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-full bg-[#17191c] text-[#c09748] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
              >
                <Printer className="w-3.5 h-3.5 text-[#c09748]" />
                <span>Print Slip</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedIssueSlipForPrint(null)}
                className="w-9 h-9 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] flex items-center justify-center cursor-pointer transition active:scale-95 shadow-2xs"
                title="Close"
              >
                <X className="w-5 h-5 text-[#17191c]" />
              </button>
            </div>
          </div>

          {/* Printable Document Sheet */}
          <div className="max-w-3xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1 text-[#17191c] text-xs">
            {/* Plant Header */}
            <div className="border-b-2 border-[#17191c] pb-4 text-center">
              <div className="font-serif font-bold text-2xl tracking-tight text-[#17191c]">PAINTKING SURFACE SOLUTIONS</div>
              <div className="text-xs text-[#777b86] mt-0.5">Specialized Liquid Coating, Hydrographic Dipping & UV Printing</div>
              <div className="text-[11px] font-mono font-bold text-[#c09748] mt-1.5 uppercase tracking-widest">
                INTERNAL STORE MATERIAL ISSUE NOTE (MIN)
              </div>
            </div>

            {/* Slip Meta */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-[#fafafb] border border-[#ececec] rounded-[18px]">
              <div>
                <div className="text-[10px] text-[#777b86]">MIN Slip Number:</div>
                <div className="font-mono font-bold text-sm text-[#c09748]">{selectedIssueSlipForPrint.slipNo}</div>
                <div className="text-[10px] text-[#777b86] mt-2">Issue Date & Time:</div>
                <div className="font-mono text-xs">{selectedIssueSlipForPrint.date}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-[#777b86]">Job Card Reference:</div>
                <div className="font-mono font-bold text-xs text-[#17191c]">{selectedIssueSlipForPrint.jobCardId}</div>
                <div className="text-[10px] text-[#777b86] mt-2">Source GRN:</div>
                <div className="font-mono text-xs">{selectedIssueSlipForPrint.grnNo}</div>
              </div>
            </div>

            {/* Table of Issued Materials */}
            <div className="border border-[#ececec] rounded-[18px] overflow-hidden bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f2f2f3] text-[#17191c] border-b border-[#ececec] font-semibold text-xs">
                  <tr>
                    <th className="p-3">Part Code</th>
                    <th className="p-3">Customer / Account</th>
                    <th className="p-3 text-center">Quantity Issued</th>
                    <th className="p-3">Purpose / Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 font-mono font-bold text-[#c09748]">{selectedIssueSlipForPrint.partCode}</td>
                    <td className="p-3 font-semibold text-[#17191c]">{selectedIssueSlipForPrint.customer}</td>
                    <td className="p-3 text-center font-mono font-bold text-sm text-[#17191c] bg-[#faf7ed]">
                      {selectedIssueSlipForPrint.qty} {selectedIssueSlipForPrint.uom}
                    </td>
                    <td className="p-3 text-[#777b86]">{selectedIssueSlipForPrint.remarks || 'Issued for coating line'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Custody Signature Signoffs */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="border-t border-[#ececec] pt-3">
                <div className="font-bold text-[#17191c]">Store Incharge Sign</div>
                <div className="text-[11px] text-[#777b86] mt-0.5">PK Stores Team</div>
              </div>
              <div className="border-t border-[#ececec] pt-3">
                <div className="font-bold text-[#17191c]">Received By (Floor Incharge)</div>
                <div className="text-[11px] text-[#777b86] mt-0.5">{selectedIssueSlipForPrint.issuedTo}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PENDING IQC LOT VIEW DETAILS MODAL */}
      {selectedPendingJobForView && (
        <div className="fixed inset-0 z-50 bg-[#fafafb] sm:bg-white overflow-y-auto flex flex-col animate-in fade-in duration-150">
          {/* Sticky Top Header Bar */}
          <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#ececec] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <span className="font-mono font-bold text-[#c09748] bg-[#faf7ed] px-2.5 py-0.5 rounded-full border border-[#f4e5be] text-[10px]">
                  {selectedPendingJobForView.inwardSrNo}
                </span>
                <span className="font-mono font-bold text-[#17191c] bg-[#fafafb] px-2.5 py-0.5 rounded-full border border-[#ececec] text-[10px]">
                  IQC: {selectedPendingJobForView.reportNo}
                </span>
                <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>IQC Approved</span>
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-normal text-[#17191c]">
                IQC Cleared Inward Lot Inspection Details
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedPendingJobForView(null)}
              className="w-9 h-9 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] flex items-center justify-center cursor-pointer transition active:scale-95 shadow-2xs"
              title="Close"
            >
              <X className="w-5 h-5 text-[#17191c]" />
            </button>
          </div>

          <div className="max-w-5xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1 text-xs">
            {/* 8 Structured Summary Cards Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1 */}
              <div className="p-4 rounded-[18px] bg-[#fafafb] border border-[#ececec] space-y-1">
                <span className="text-[10px] font-semibold text-[#777b86] uppercase tracking-wider block">Inward & IQC Ref</span>
                <div className="font-mono font-bold text-sm text-[#c09748]">{selectedPendingJobForView.inwardSrNo}</div>
                <div className="text-[11px] text-[#777b86] font-mono">IQC: {selectedPendingJobForView.reportNo}</div>
              </div>

              {/* Card 2 */}
              <div className="p-4 rounded-[18px] bg-[#fafafb] border border-[#ececec] space-y-1">
                <span className="text-[10px] font-semibold text-[#777b86] uppercase tracking-wider block">Supplier / Customer</span>
                <div className="font-semibold text-xs text-[#17191c] truncate" title={selectedPendingJobForView.vendorCustomer}>
                  {selectedPendingJobForView.vendorCustomer}
                </div>
                <div className="text-[11px] font-mono text-[#777b86]">
                  Challan: <strong className="text-[#17191c]">{selectedPendingJobForView.invoiceChallanNo}</strong>
                </div>
              </div>

              {/* Card 3 */}
              <div className="p-4 rounded-[18px] bg-[#fafafb] border border-[#ececec] space-y-1">
                <span className="text-[10px] font-semibold text-[#777b86] uppercase tracking-wider block">Vehicle & Transport</span>
                <div className="font-mono font-bold text-xs text-[#17191c]">{selectedPendingJobForView.vehicleNo}</div>
                <div className="text-[11px] text-[#777b86]">Gate Security Verified</div>
              </div>

              {/* Card 4 */}
              <div className="p-4 rounded-[18px] bg-[#fafafb] border border-[#ececec] space-y-1">
                <span className="text-[10px] font-semibold text-[#777b86] uppercase tracking-wider block">Verified Total Qty</span>
                <div className="font-mono font-bold text-base text-emerald-800">
                  {Number(selectedPendingJobForView.totalQty).toLocaleString('en-IN')} {selectedPendingJobForView.uom}
                </div>
                <div className="text-[11px] text-emerald-700 font-medium">100% Cleared for Store Intake</div>
              </div>

              {/* Card 5 */}
              <div className="p-4 rounded-[18px] bg-[#fafafb] border border-[#ececec] space-y-1">
                <span className="text-[10px] font-semibold text-[#777b86] uppercase tracking-wider block">Material Description</span>
                <div className="font-medium text-xs text-[#17191c] truncate" title={selectedPendingJobForView.partDescription}>
                  {selectedPendingJobForView.partDescription}
                </div>
                <div className="text-[11px] text-[#777b86]">{selectedPendingJobForView.items?.length || 1} Line Item(s)</div>
              </div>

              {/* Card 6 */}
              <div className="p-4 rounded-[18px] bg-[#fafafb] border border-[#ececec] space-y-1">
                <span className="text-[10px] font-semibold text-[#777b86] uppercase tracking-wider block">20% AQL Sampling</span>
                <div className="font-mono font-bold text-xs text-emerald-800">
                  {selectedPendingJobForView.aqlSampleChecked || 50} Sampled • 0 Defect
                </div>
                <div className="text-[11px] text-emerald-700 font-medium">Within IATF Standard Norms</div>
              </div>

              {/* Card 7 */}
              <div className="p-4 rounded-[18px] bg-[#fafafb] border border-[#ececec] space-y-1">
                <span className="text-[10px] font-semibold text-[#777b86] uppercase tracking-wider block">IQC Inspector</span>
                <div className="font-semibold text-xs text-[#17191c] truncate">{selectedPendingJobForView.preparedBy}</div>
                <div className="text-[11px] text-emerald-700 font-medium">Quality Clearance Signed</div>
              </div>

              {/* Card 8 */}
              <div className="p-4 rounded-[18px] bg-[#fafafb] border border-[#ececec] space-y-1">
                <span className="text-[10px] font-semibold text-[#777b86] uppercase tracking-wider block">Production Approval</span>
                <div className="font-semibold text-xs text-emerald-800 truncate">{selectedPendingJobForView.verifiedBy}</div>
                <div className="text-[11px] text-[#777b86]">Sign-off Verified</div>
              </div>
            </div>

            {/* Line Items Breakdown Table */}
            {selectedPendingJobForView.items && selectedPendingJobForView.items.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#17191c] uppercase tracking-wider">
                    Material Line Items Physical Verification ({selectedPendingJobForView.items.length} Items)
                  </span>
                  <span className="text-[11px] font-mono text-[#777b86]">
                    Challan vs IQC Count
                  </span>
                </div>

                <div className="border border-[#ececec] rounded-[18px] overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#f2f2f3] text-[#17191c] font-semibold border-b border-[#ececec]">
                        <tr>
                          <th className="p-3 w-10 text-center">#</th>
                          <th className="p-3 min-w-[180px]">Material Description</th>
                          <th className="p-3 text-center whitespace-nowrap">Challan Inward Qty</th>
                          <th className="p-3 text-center whitespace-nowrap">IQC Verified Qty</th>
                          <th className="p-3 text-center whitespace-nowrap">AQL Sample Status</th>
                          <th className="p-3 text-right min-w-[140px]">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ececec] text-[#17191c]">
                        {selectedPendingJobForView.items.map((item: any, itIdx: number) => {
                          const itName = item.materialName || selectedPendingJobForView.partDescription;
                          const itQty = item.actualQty || item.quantity || selectedPendingJobForView.totalQty;
                          const sSize = item.sampleSize || selectedPendingJobForView.aqlSampleChecked || 50;
                          const rQty = item.rejectQty !== undefined ? item.rejectQty : (selectedPendingJobForView.aqlRejectQty || 0);

                          return (
                            <tr key={itIdx} className="hover:bg-[#fafafb] transition">
                              <td className="p-3 text-center font-mono text-[#777b86]">{itIdx + 1}</td>
                              <td className="p-3 font-medium text-[#17191c]">{itName}</td>
                              <td className="p-3 text-center font-mono">{item.challanQty || itQty} {item.unit || selectedPendingJobForView.uom}</td>
                              <td className="p-3 text-center font-mono font-bold text-emerald-800 bg-emerald-50/40">
                                {itQty} {item.unit || selectedPendingJobForView.uom}
                              </td>
                              <td className="p-3 text-center">
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  {sSize} Sampled • {rQty} Defect • Pass
                                </span>
                              </td>
                              <td className="p-3 text-right text-[11px] text-[#777b86]">
                                {item.defectDetail || 'Clean Intact Substrates'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#ececec]">
              <div className="text-[11px] text-[#777b86] font-mono text-center sm:text-left hidden lg:block">
                ISO 9001:2015 & IATF 16949 Verified Quality Clearance Record
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    const job = selectedPendingJobForView;
                    setSelectedPendingJobForView(null);
                    handleOpenGrnForPending(job);
                  }}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs font-bold shadow-xs transition cursor-pointer active:scale-95 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5 text-[#8a6521]" />
                  <span>Accept & Create GRN</span>
                </button>

                {selectedPendingJobForView.iqcRecord && (
                  <button
                    type="button"
                    onClick={() => downloadStandardIQCPdf(selectedPendingJobForView.iqcRecord)}
                    className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95 whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5 text-[#c09748]" />
                    <span>Download IQC PDF</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedPendingJobForView(null)}
                  className="flex items-center justify-center px-5 py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86] hover:bg-gray-50 text-xs font-semibold transition cursor-pointer shadow-2xs whitespace-nowrap"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
