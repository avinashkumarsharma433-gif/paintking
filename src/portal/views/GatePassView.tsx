import React, { useState } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { MaterialInwardRecord, MaterialOutwardRecord, InwardMaterialLineItem } from '../types/portalTypes';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Plus, 
  ShieldCheck, 
  Truck, 
  FileText, 
  Search, 
  Clock, 
  CheckCircle2, 
  Package, 
  UserCheck, 
  Building2,
  Trash2,
  Layers
} from 'lucide-react';

export const GatePassView: React.FC = () => {
  const { 
    gatePasses, 
    updateGatePassStatus, 
    materialInwardLogs, 
    materialOutwardLogs, 
    addMaterialInwardRecord, 
    addMaterialOutwardRecord, 
    activePlant,
    currentUser
  } = usePortalStore();

  const [activeTab, setActiveTab] = useState<'INWARD' | 'OUTWARD' | 'GATE_PASS'>('INWARD');
  const [showInwardModal, setShowInwardModal] = useState<boolean>(false);
  const [showOutwardModal, setShowOutwardModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 12-Field Inward Form State with Dynamic Dynamic Multi-Item Rows!
  const [inwardFormHeader, setInwardFormHeader] = useState({
    challanNo: '',
    vehicleNo: '',
    partyName: '',
    materialCategory: 'Party Material' as 'Party Material' | 'Internal Company', // EXACT 2 OPTIONS!
    receivedBy: currentUser.name || 'Ram Singh (Gate Security)',
    remarks: ''
  });

  const [inwardItems, setInwardItems] = useState<Omit<InwardMaterialLineItem, 'id'>[]>([
    { materialName: 'Paint Daba 2KG', quantity: 5, unit: 'Drums', remarks: '' }
  ]);

  // 11-Field Outward Form State
  const [outwardForm, setOutwardForm] = useState({
    vehicleNo: '',
    gatePassNo: `GTP-OUT-${Date.now().toString().slice(-4)}`,
    partyName: '',
    descriptionOfMaterial: '',
    quantity: 100,
    unit: 'Pcs' as const,
    transporter: 'VRL LOGISTICS',
    remarks: ''
  });

  const handleAddItemRow = () => {
    setInwardItems(prev => [
      ...prev,
      { materialName: '', quantity: 1, unit: 'Pcs', remarks: '' }
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (inwardItems.length === 1) return; // Keep at least 1 row
    setInwardItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setInwardItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleInwardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inwardFormHeader.partyName || inwardItems.some(i => !i.materialName.trim())) return;

    const currentYear = new Date().getFullYear();
    const formattedItems: InwardMaterialLineItem[] = inwardItems.map((item, idx) => ({
      id: `item_${Date.now()}_${idx}`,
      materialName: item.materialName.trim(),
      quantity: Number(item.quantity) || 1,
      unit: item.unit,
      remarks: item.remarks
    }));

    const totalQty = formattedItems.reduce((acc, curr) => acc + curr.quantity, 0);
    const summaryText = formattedItems.map(i => `${i.materialName} (${i.quantity} ${i.unit})`).join(', ');

    const newInward: MaterialInwardRecord = {
      srNo: `INW-${currentYear}-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().split('T')[0],
      challanNo: inwardFormHeader.challanNo || `CH-${Math.floor(1000 + Math.random() * 9000)}`,
      grnNo: `PK-GRN-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`,
      inTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      vehicleNo: inwardFormHeader.vehicleNo || 'UK-08-AL-4412',
      partyName: inwardFormHeader.partyName,
      descriptionOfMaterial: summaryText,
      quantity: totalQty,
      unit: formattedItems[0]?.unit || 'Pcs',
      items: formattedItems,
      totalQuantity: totalQty,
      materialCategory: inwardFormHeader.materialCategory, // EXACT 2 OPTIONS
      receivedBy: inwardFormHeader.receivedBy,
      securitySignature: 'VERIFIED_GATE_01',
      remarks: inwardFormHeader.remarks || 'Gate Inward Verified with Dynamic Items. Auto-sent to Stores.',
      plant: activePlant,
      status: 'Handed to Stores'
    };

    addMaterialInwardRecord(newInward);
    setShowInwardModal(false);

    // Reset Form
    setInwardFormHeader({
      challanNo: '',
      vehicleNo: '',
      partyName: '',
      materialCategory: 'Party Material',
      receivedBy: currentUser.name || 'Ram Singh (Gate Security)',
      remarks: ''
    });
    setInwardItems([{ materialName: 'Paint Daba 2KG', quantity: 5, unit: 'Drums', remarks: '' }]);
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
      outTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      partyName: outwardForm.partyName,
      descriptionOfMaterial: outwardForm.descriptionOfMaterial,
      quantity: Number(outwardForm.quantity) || 1,
      unit: outwardForm.unit,
      transporter: outwardForm.transporter,
      securitySignature: 'VERIFIED_GATE_01',
      remarks: outwardForm.remarks || 'Outward verified at Gate. Dispatched to Customer.',
      plant: activePlant
    };

    addMaterialOutwardRecord(newOutward);
    setShowOutwardModal(false);
    setOutwardForm({
      vehicleNo: '',
      gatePassNo: `GTP-OUT-${Date.now().toString().slice(-4)}`,
      partyName: '',
      descriptionOfMaterial: '',
      quantity: 100,
      unit: 'Pcs',
      transporter: 'VRL LOGISTICS',
      remarks: ''
    });
  };

  // Filtered lists
  const filteredInward = materialInwardLogs.filter(item => 
    item.partyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.vehicleNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.descriptionOfMaterial && item.descriptionOfMaterial.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredOutward = materialOutwardLogs.filter(item => 
    item.partyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.vehicleNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.descriptionOfMaterial.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-[24px] p-6 border border-[#ececec] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
              PK-ADM-GTP-001 • SECURITY GATE REGISTERS
            </span>
            <span className="text-xs text-[#777b86]">
              Material Inward (Multi-Item Rows & 2 Categories) & Outward Physical Register Desk
            </span>
          </div>
          <h1 className="text-3xl font-serif font-normal text-[#17191c] tracking-tight">
            Main Gate Security & Material Desk
          </h1>
          <p className="text-xs text-[#777b86] mt-1">
            Tracks 1-to-1 material entering (Party Material & Internal Company) & finished goods exiting the factory.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto w-full md:w-auto">
          {activeTab === 'INWARD' && (
            <button
              onClick={() => setShowInwardModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] text-xs font-semibold shadow-sm transition cursor-pointer w-full md:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Naya Material Inward (Multi-Item Rows)</span>
            </button>
          )}

          {activeTab === 'OUTWARD' && (
            <button
              onClick={() => setShowOutwardModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition cursor-pointer w-full md:w-auto"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>+ Naya Material Outward Log (11 Fields)</span>
            </button>
          )}
        </div>
      </div>

      {/* Register Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ececec] pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('INWARD')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'INWARD'
                ? 'bg-[#17191c] text-[#c09748] shadow-xs'
                : 'bg-white text-[#777b86] border border-[#ececec] hover:bg-gray-50'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4 text-[#c09748]" />
            <span>1. Material Inward Register ({materialInwardLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('OUTWARD')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'OUTWARD'
                ? 'bg-[#17191c] text-[#c09748] shadow-xs'
                : 'bg-white text-[#777b86] border border-[#ececec] hover:bg-gray-50'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
            <span>2. Material Outward Register ({materialOutwardLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('GATE_PASS')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'GATE_PASS'
                ? 'bg-[#17191c] text-[#c09748] shadow-xs'
                : 'bg-white text-[#777b86] border border-[#ececec] hover:bg-gray-50'
            }`}
          >
            <Truck className="w-4 h-4 text-[#c09748]" />
            <span>3. Vehicle Gate Passes ({gatePasses.length})</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search party, vehicle, material..."
            className="w-full pl-9 pr-3 py-1.5 rounded-full border border-[#ececec] bg-white text-xs text-[#17191c] focus:outline-none focus:border-[#c09748]"
          />
        </div>
      </div>

      {/* -------------------------------------------------------------------------- */}
      {/* TAB 1: MATERIAL INWARD REGISTER (MULTI-ITEM DYNAMIC ROWS + 2 CATEGORIES) */}
      {/* -------------------------------------------------------------------------- */}
      {activeTab === 'INWARD' && (
        <div className="space-y-4">
          <div className="p-4 rounded-[20px] bg-[#faf3e0]/60 border border-[#f4e5be] text-xs text-[#8a6521] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-[#c09748]" />
              <span>
                <strong>Dynamic Multi-Item Logging:</strong> Ek gadi me 4-5 alag alag chize (e.g. Paint Daba 2KG, Thinner, Bezels) hone par dynamic rows add karein. Internal Company & Party Material auto-forward hote hain Store Manager Dashboards ko.
              </span>
            </div>
          </div>

          <div className="bg-white rounded-[24px] border border-[#ececec] p-4 sm:p-6 shadow-sm space-y-4">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs border border-[#ececec] rounded-[16px] overflow-hidden">
                <thead className="bg-[#17191c] text-white font-semibold">
                  <tr>
                    <th className="p-3 text-center">Sr No</th>
                    <th className="p-3">Date & In Time</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Challan / GRN</th>
                    <th className="p-3">Vehicle & Party</th>
                    <th className="p-3">Inward Material Line Items (Dynamic Rows)</th>
                    <th className="p-3 text-center">Total Items</th>
                    <th className="p-3">Received By</th>
                    <th className="p-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ececec] text-[#17191c]">
                  {filteredInward.map((item) => (
                    <tr key={item.srNo} className="hover:bg-[#fafafb]">
                      <td className="p-3 text-center font-mono font-bold text-[#c09748]">{item.srNo}</td>
                      <td className="p-3 font-mono text-[11px]">
                        <div>{item.date}</div>
                        <div className="text-gray-500 font-bold">{item.inTime}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.materialCategory === 'Party Material' 
                            ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]' 
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}>
                          {item.materialCategory}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        <div className="font-bold text-[#17191c]">Challan: {item.challanNo}</div>
                        <div className="text-[#8a6521] text-[10px]">{item.grnNo}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-[#17191c]">{item.partyName}</div>
                        <div className="font-mono text-[11px] text-gray-600 font-semibold">{item.vehicleNo}</div>
                      </td>
                      
                      {/* Dynamic Material Items Breakdown */}
                      <td className="p-3">
                        {item.items && item.items.length > 0 ? (
                          <div className="space-y-1">
                            {item.items.map((row, idx) => (
                              <div key={row.id || idx} className="p-1.5 rounded-lg bg-gray-50 border border-gray-200 text-[11px] flex items-center justify-between gap-2">
                                <span className="font-medium text-[#17191c]">{idx + 1}. {row.materialName}</span>
                                <span className="font-mono font-bold text-emerald-800 shrink-0">
                                  {row.quantity} {row.unit}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="font-medium text-[#17191c]">{item.descriptionOfMaterial}</div>
                        )}
                      </td>

                      <td className="p-3 text-center font-mono text-sm font-bold text-emerald-800">
                        {item.totalQuantity || item.quantity} items
                      </td>
                      <td className="p-3 text-[11px]">
                        <div className="font-medium">{item.receivedBy}</div>
                        <div className="font-mono text-[9px] text-gray-500">Sign: {item.securitySignature}</div>
                      </td>
                      <td className="p-3 text-gray-600 text-[11px]">
                        {item.remarks || 'OK'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* TAB 2: MATERIAL OUTWARD REGISTER */}
      {/* -------------------------------------------------------------------------- */}
      {activeTab === 'OUTWARD' && (
        <div className="space-y-4">
          <div className="p-4 rounded-[20px] bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 shrink-0 text-emerald-700" />
              <span>
                <strong>Factory Outward Check:</strong> Security Outward Entry confirm hone par completed orders automatically system me <strong>Dispatched & Inventory Deducted</strong> mark ho jate hain.
              </span>
            </div>
          </div>

          <div className="bg-white rounded-[24px] border border-[#ececec] p-4 sm:p-6 shadow-sm space-y-4">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs border border-[#ececec] rounded-[16px] overflow-hidden">
                <thead className="bg-[#17191c] text-white font-semibold">
                  <tr>
                    <th className="p-3 text-center">Sr No</th>
                    <th className="p-3">Date & Out Time</th>
                    <th className="p-3">Vehicle No</th>
                    <th className="p-3">Gate Pass No</th>
                    <th className="p-3">Name of Party</th>
                    <th className="p-3">Description of Material</th>
                    <th className="p-3 text-center">Quantity</th>
                    <th className="p-3">Transporter</th>
                    <th className="p-3">Security Signature</th>
                    <th className="p-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ececec] text-[#17191c]">
                  {filteredOutward.map((item) => (
                    <tr key={item.srNo} className="hover:bg-[#fafafb]">
                      <td className="p-3 text-center font-mono font-bold text-[#c09748]">{item.srNo}</td>
                      <td className="p-3 font-mono text-[11px]">
                        <div>{item.date}</div>
                        <div className="text-emerald-800 font-bold">{item.outTime}</div>
                      </td>
                      <td className="p-3 font-mono font-bold">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 border border-emerald-300 text-emerald-900">
                          {item.vehicleNo}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[#8a6521] font-bold">{item.gatePassNo}</td>
                      <td className="p-3 font-bold text-[#17191c]">{item.partyName}</td>
                      <td className="p-3">
                        <div className="font-medium text-[#17191c]">{item.descriptionOfMaterial}</div>
                      </td>
                      <td className="p-3 text-center font-mono text-sm font-bold text-emerald-800">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="p-3 font-mono text-gray-700">{item.transporter}</td>
                      <td className="p-3 font-mono text-[10px] text-gray-600">{item.securitySignature}</td>
                      <td className="p-3 text-gray-600 text-[11px]">{item.remarks || 'Outward Passed'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VEHICLE GATE PASS DESK */}
      {activeTab === 'GATE_PASS' && (
        <div className="space-y-4">
          {gatePasses.map(gp => (
            <div key={gp.gatePassNo} className="bg-white rounded-[24px] border border-[#ececec] p-6 shadow-sm space-y-4">
              <div className="pb-3 border-b border-[#f2f2f3] space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#c09748] px-3 py-1 rounded-full bg-[#faf7ed] border border-[#f4e5be] whitespace-nowrap shadow-xs">
                      {gp.gatePassNo}
                    </span>
                    <span className={`px-3 py-0.5 rounded-full text-xs font-medium flex items-center gap-1.5 whitespace-nowrap ${
                      gp.type === 'Inward' ? 'bg-[#fafafb] border border-[#ececec] text-[#17191c]' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    }`}>
                      {gp.type === 'Inward' ? <ArrowDownLeft className="w-3.5 h-3.5 text-[#c09748]" /> : <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />}
                      {gp.type} ({gp.movementType})
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs self-start sm:self-auto">
                    <span className="text-[#777b86] font-mono whitespace-nowrap">{gp.date} {gp.time}</span>
                    <span className={`px-3 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${
                      gp.status === 'Closed' ? 'bg-[#f2f2f3] text-[#777b86]' : 'bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521]'
                    }`}>
                      {gp.status}
                    </span>
                  </div>
                </div>

                <h3 className="font-serif font-normal text-lg sm:text-xl text-[#17191c] tracking-tight pt-0.5">
                  {gp.partyName}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-[16px] bg-[#fafafb] border border-[#ececec] text-xs">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-semibold text-[#777b86] uppercase tracking-wider block">Vehicle & Driver</span>
                  <div className="font-mono font-semibold text-[#17191c]">{gp.vehicleNo}</div>
                  <div className="text-[#777b86] text-[11px]">{gp.driverPhone}</div>
                </div>
                <div className="sm:col-span-2 space-y-0.5">
                  <span className="text-[11px] font-semibold text-[#777b86] uppercase tracking-wider block">Material & Reference</span>
                  <div className="font-medium text-[#17191c]">{gp.itemDescription}</div>
                  <div className="font-mono text-[#a3a6af] text-[11px]">Ref Doc: {gp.referenceDoc}</div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[11px] font-semibold text-[#777b86] uppercase tracking-wider block">Quantity & Security</span>
                  <div className="font-serif font-normal text-xl text-[#17191c]">{gp.qty} pcs</div>
                  <div className="text-[11px] text-[#777b86]">Officer: <strong className="text-[#17191c] font-medium">{gp.securityOfficer}</strong></div>
                </div>
              </div>

              {gp.status === 'Open' && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => updateGatePassStatus(gp.gatePassNo, 'Closed')}
                    className="flex items-center justify-center px-5 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] text-xs font-semibold transition cursor-pointer shadow-sm w-full sm:w-auto"
                  >
                    Confirm Physical Exit & Close Pass
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* MODAL 1: MATERIAL INWARD FORM WITH DYNAMIC MULTI-ITEM ROWS & 2 CATEGORIES */}
      {/* -------------------------------------------------------------------------- */}
      {showInwardModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[24px] max-w-3xl w-full p-6 shadow-2xl border border-[#ececec] space-y-5 max-h-[94vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-[#ececec]">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase font-bold">
                  SECURITY INWARD REGISTER (MULTI-ITEM ENTRANCE)
                </span>
                <h3 className="text-xl font-serif text-[#17191c] font-bold mt-0.5">
                  12-Field Inward Entry with Dynamic Item Rows
                </h3>
              </div>
              <button 
                onClick={() => setShowInwardModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-[#17191c] font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInwardSubmit} className="space-y-4 text-xs">
              
              {/* Header Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#fafafb] p-4 rounded-[16px] border border-[#ececec]">
                
                <div>
                  <label className="block text-[11px] font-bold text-[#777b86] uppercase mb-1">
                    1. Name of Party / Supplier *
                  </label>
                  <input
                    type="text"
                    required
                    value={inwardFormHeader.partyName}
                    onChange={e => setInwardFormHeader({ ...inwardFormHeader, partyName: e.target.value })}
                    placeholder="e.g. ROOP POLYMERS LTD / ASIAN PAINTS PPG"
                    className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white font-semibold text-[#17191c] focus:border-[#c09748] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#777b86] uppercase mb-1">
                    2. Material Category (EXACT 2 OPTIONS) *
                  </label>
                  <select
                    value={inwardFormHeader.materialCategory}
                    onChange={e => setInwardFormHeader({ ...inwardFormHeader, materialCategory: e.target.value as any })}
                    className="w-full p-2.5 rounded-[12px] border border-[#c09748] bg-amber-50 font-bold text-[#17191c] focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="Party Material">1. Party Material (Customer Substrates for Job Work)</option>
                    <option value="Internal Company">2. Internal Company (Paint, Chemical, Thinner, Spares Purchase)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#777b86] uppercase mb-1">
                    3. Vehicle Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={inwardFormHeader.vehicleNo}
                    onChange={e => setInwardFormHeader({ ...inwardFormHeader, vehicleNo: e.target.value })}
                    placeholder="e.g. UK-08-AL-4412"
                    className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white font-mono font-bold text-[#17191c] focus:border-[#c09748] focus:outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#777b86] uppercase mb-1">
                    4. Supplier Challan No *
                  </label>
                  <input
                    type="text"
                    required
                    value={inwardFormHeader.challanNo}
                    onChange={e => setInwardFormHeader({ ...inwardFormHeader, challanNo: e.target.value })}
                    placeholder="e.g. RP/CH/99824"
                    className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white font-mono font-bold text-[#17191c] focus:border-[#c09748] focus:outline-none"
                  />
                </div>

              </div>

              {/* DYNAMIC MULTI-ITEM ROWS CONTAINER (4-5 items in 1 truck!) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#ececec] pb-2">
                  <span className="text-[11px] font-bold text-[#17191c] uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#c09748]" />
                    Dynamic Material Items List (Add Multiple Items for 1 Truck):
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="px-3 py-1 rounded-full bg-[#faf7ed] border border-[#f4e5be] text-[#8a6521] text-xs font-bold hover:bg-[#faf3e0] transition cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Another Item Row</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto no-scrollbar pr-1">
                  {inwardItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 p-3 bg-white rounded-[14px] border border-[#ececec] items-center">
                      
                      <div className="col-span-5">
                        <label className="block text-[9px] font-bold text-gray-500 uppercase mb-0.5">
                          Material Name ({idx + 1}) *
                        </label>
                        <input
                          type="text"
                          required
                          value={item.materialName}
                          onChange={e => handleItemChange(idx, 'materialName', e.target.value)}
                          placeholder="e.g. Paint Daba 2KG / ABS Vent Bezel"
                          className="w-full p-2 rounded-[8px] border border-[#ececec] font-semibold text-[#17191c] focus:border-[#c09748] focus:outline-none text-xs"
                        />
                      </div>

                      <div className="col-span-3">
                        <label className="block text-[9px] font-bold text-gray-500 uppercase mb-0.5">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
                          className="w-full p-2 rounded-[8px] border border-[#ececec] font-mono font-bold text-[#17191c] focus:border-[#c09748] focus:outline-none text-xs"
                        />
                      </div>

                      <div className="col-span-3">
                        <label className="block text-[9px] font-bold text-gray-500 uppercase mb-0.5">
                          Unit of Measure
                        </label>
                        <select
                          value={item.unit}
                          onChange={e => handleItemChange(idx, 'unit', e.target.value)}
                          className="w-full p-2 rounded-[8px] border border-[#ececec] font-bold text-[#17191c] focus:border-[#c09748] focus:outline-none text-xs cursor-pointer"
                        >
                          <option value="Drums">Drums / Can</option>
                          <option value="Pcs">Pcs (Substrates)</option>
                          <option value="Litres">Litres</option>
                          <option value="Boxes">Boxes</option>
                          <option value="Kg">Kg</option>
                          <option value="Rolls">Rolls</option>
                        </select>
                      </div>

                      <div className="col-span-1 flex items-end justify-center pt-3">
                        {inwardItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="text-red-500 hover:text-red-700 p-1 cursor-pointer transition"
                            title="Remove row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#777b86] uppercase mb-1">
                  Security Remarks & Intake Note
                </label>
                <textarea
                  rows={2}
                  value={inwardFormHeader.remarks}
                  onChange={e => setInwardFormHeader({ ...inwardFormHeader, remarks: e.target.value })}
                  placeholder="e.g. Total 3 item types verified in truck. Handed over to Store Incharge Manoj Tiwari."
                  className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-[#fafafb] font-medium text-[#17191c] focus:border-[#c09748] focus:outline-none"
                />
              </div>

              <div className="p-3 bg-[#faf7ed] border border-[#f4e5be] rounded-[12px] text-[11px] text-[#8a6521]">
                <strong>Dashboard Routing Note:</strong> Selected Category <strong>[{inwardFormHeader.materialCategory}]</strong> ke mutabiq ye items Store Manager ke specific <strong>{inwardFormHeader.materialCategory === 'Party Material' ? 'Party Material Dashboard' : 'Internal Company Material Dashboard'}</strong> me auto-route honge.
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInwardModal(false)}
                  className="px-5 py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium cursor-pointer hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] font-bold shadow-sm cursor-pointer transition active:scale-95"
                >
                  Submit Multi-Item Inward & Route to Stores
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MATERIAL OUTWARD FORM */}
      {showOutwardModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[24px] max-w-2xl w-full p-6 shadow-2xl border border-[#ececec] space-y-5 max-h-[92vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-[#ececec]">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-mono uppercase font-bold">
                  SECURITY OUTWARD REGISTER
                </span>
                <h3 className="text-xl font-serif text-[#17191c] font-bold mt-0.5">
                  11-Field Security Material Outward Entry
                </h3>
              </div>
              <button 
                onClick={() => setShowOutwardModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-[#17191c] font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOutwardSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-[11px] font-bold text-[#777b86] uppercase mb-1">
                    1. Name of Party (Customer) *
                  </label>
                  <input
                    type="text"
                    required
                    value={outwardForm.partyName}
                    onChange={e => setOutwardForm({ ...outwardForm, partyName: e.target.value })}
                    placeholder="e.g. ROOP POLYMERS LTD"
                    className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-[#fafafb] font-semibold text-[#17191c] focus:border-[#c09748] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#777b86] uppercase mb-1">
                    2. Description of Material *
                  </label>
                  <input
                    type="text"
                    required
                    value={outwardForm.descriptionOfMaterial}
                    onChange={e => setOutwardForm({ ...outwardForm, descriptionOfMaterial: e.target.value })}
                    placeholder="e.g. Finished Coated AC Vent Bezels (250 Red + 700 Black)"
                    className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-[#fafafb] font-semibold text-[#17191c] focus:border-[#c09748] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#777b86] uppercase mb-1">
                    3. Vehicle Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={outwardForm.vehicleNo}
                    onChange={e => setOutwardForm({ ...outwardForm, vehicleNo: e.target.value })}
                    placeholder="e.g. DL-01-EE-7741"
                    className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-[#fafafb] font-mono font-bold text-[#17191c] focus:border-[#c09748] focus:outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#777b86] uppercase mb-1">
                    4. Gate Pass No *
                  </label>
                  <input
                    type="text"
                    required
                    value={outwardForm.gatePassNo}
                    onChange={e => setOutwardForm({ ...outwardForm, gatePassNo: e.target.value })}
                    placeholder="e.g. GTP-OUT-2026-0513"
                    className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-[#fafafb] font-mono font-bold text-[#17191c] focus:border-[#c09748] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#777b86] uppercase mb-1">
                    5. Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={outwardForm.quantity}
                    onChange={e => setOutwardForm({ ...outwardForm, quantity: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-[#fafafb] font-mono font-bold text-[#17191c] focus:border-[#c09748] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#777b86] uppercase mb-1">
                    6. Unit of Measure
                  </label>
                  <select
                    value={outwardForm.unit}
                    onChange={e => setOutwardForm({ ...outwardForm, unit: e.target.value as any })}
                    className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-[#fafafb] font-bold text-[#17191c] focus:border-[#c09748] focus:outline-none cursor-pointer"
                  >
                    <option value="Pcs">Pcs (Finished Parts)</option>
                    <option value="Boxes">Master Corrugated Boxes</option>
                    <option value="Litres">Litres</option>
                    <option value="Drums">Drums</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#777b86] uppercase mb-1">
                    7. Transporter / Courier *
                  </label>
                  <input
                    type="text"
                    required
                    value={outwardForm.transporter}
                    onChange={e => setOutwardForm({ ...outwardForm, transporter: e.target.value })}
                    placeholder="e.g. VRL LOGISTICS / SAFEEXPRESS"
                    className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-[#fafafb] font-semibold text-[#17191c] focus:border-[#c09748] focus:outline-none"
                  />
                </div>

              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#777b86] uppercase mb-1">
                  8. Security Remarks & Verification Note
                </label>
                <textarea
                  rows={2}
                  value={outwardForm.remarks}
                  onChange={e => setOutwardForm({ ...outwardForm, remarks: e.target.value })}
                  placeholder="e.g. Physical box count match (19 boxes). Delivery Challan & E-Way bill verified."
                  className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-[#fafafb] font-medium text-[#17191c] focus:border-[#c09748] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOutwardModal(false)}
                  className="px-5 py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium cursor-pointer hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#17191c] text-white font-medium cursor-pointer hover:bg-black flex items-center gap-2"
                >
                  <Save className="w-4 h-4 text-[#c09748]" />
                  Log Outward Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
