import React, { useState } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { JobCard, IssuedMaterialItem } from '../types/portalTypes';
import { Plus, Trash2, Save, Printer, CheckCircle2, Layers } from 'lucide-react';

interface JobCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<JobCard>;
}

export const JobCardModal: React.FC<JobCardModalProps> = ({ isOpen, onClose, initialData }) => {
  const { addJobCard, activePlant, currentUser } = usePortalStore();

  // Document Metadata Stamp (Exact Image 1 Header)
  const [docNo] = useState<string>(initialData?.docNo || 'Doc No: 001');
  const [revNo] = useState<string>(initialData?.revNo || 'Rev.No: 00');
  const [revDate] = useState<string>(initialData?.revDate || new Date().toISOString().split('T')[0]);

  // INITIAL PROCESS FIELDS (Left Grid Image 1)
  const [jobCardNo, setJobCardNo] = useState<string>(initialData?.jobCardNo || `JC-${Math.floor(1000 + Math.random() * 9000)}-RD`);
  const [wNo, setWNo] = useState<string>(initialData?.wNo || initialData?.woNo || 'WO-1042');
  const [painterName, setPainterName] = useState<string>(initialData?.painterName || 'Ramesh Sharma');
  const [issueDate, setIssueDate] = useState<string>(initialData?.issueDate || new Date().toISOString().split('T')[0]);
  const [issueTime, setIssueTime] = useState<string>(initialData?.issueTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [customer, setCustomer] = useState<string>(initialData?.customer || 'ROOP POLYMERS LTD');
  const [leadTime, setLeadTime] = useState<string>(initialData?.leadTime || '4 Hours');
  const [dept, setDept] = useState<string>(initialData?.dept || 'Cubic Dipping & Spray Line #2');
  const [headerRemark, setHeaderRemark] = useState<string>(initialData?.headerRemark || 'Target cap enforced for shop floor.');

  // FINAL PROCESS FIELDS (Right Grid Image 1 - Return Tracking)
  const [returnMaterialDesc, setReturnMaterialDesc] = useState<string>(initialData?.returnMaterialDesc || 'Unused Basecoat Monza Red');
  const [returnPainterName, setReturnPainterName] = useState<string>(initialData?.returnPainterName || 'Ramesh Sharma');
  const [returnDate, setReturnDate] = useState<string>(initialData?.returnDate || '');
  const [returnTime, setReturnTime] = useState<string>(initialData?.returnTime || '');
  const [returnOkQty, setReturnOkQty] = useState<number>(initialData?.returnOkQty || 0);
  const [returnRejectionQty, setReturnRejectionQty] = useState<number>(initialData?.returnRejectionQty || 0);
  const [checkingPerson, setCheckingPerson] = useState<string>(initialData?.checkingPerson || 'Amit Verma (QA Lead)');

  // ISSUE MATERIAL DETAILS TABLE (Middle Table Image 1)
  const [issuedMaterials, setIssuedMaterials] = useState<IssuedMaterialItem[]>(
    initialData?.issuedMaterials && initialData.issuedMaterials.length > 0 
      ? initialData.issuedMaterials
      : [
          {
            id: '1',
            itemDescription: initialData?.partDescription || 'Auto AC Center Vent Bezel Substrate (ABS)',
            qty: initialData?.targetQty || 250,
            colour: initialData?.color || 'Monza Red Gloss',
            uom: 'Pcs',
            remark: 'Issued from Stores'
          },
          {
            id: '2',
            itemDescription: 'Monza Red 2K PU Basecoat Paint (PPG)',
            qty: 15,
            colour: 'Monza Red Gloss',
            uom: 'Litres',
            remark: 'Mix ratio 4:1:1'
          },
          {
            id: '3',
            itemDescription: 'PU Thinner 400 Solvent',
            qty: 5,
            colour: 'Clear',
            uom: 'Litres',
            remark: 'Standard thinner'
          }
        ]
  );

  // SIGNATURES
  const [storeIncharge, setStoreIncharge] = useState<string>(initialData?.storeIncharge || currentUser.name || 'Manoj Tiwari');
  const [prodSupervisor, setProdSupervisor] = useState<string>(initialData?.prodSupervisor || 'Vikram Patel');
  const [approvedBy, setApprovedBy] = useState<string>(initialData?.approvedBy || 'Satish Sharma');

  // 3-STAGE PRODUCTION PROCESS TRACKING (Bottom Section Image 1)
  const [firstStage, setFirstStage] = useState({ totalQty: initialData?.stageProcessFirst?.totalQty || 250, okQty: initialData?.stageProcessFirst?.okQty || 245, rejectionQty: initialData?.stageProcessFirst?.rejectionQty || 5 });
  const [secondStage, setSecondStage] = useState({ totalQty: initialData?.stageProcessSecond?.totalQty || 245, okQty: initialData?.stageProcessSecond?.okQty || 240, rejectionQty: initialData?.stageProcessSecond?.rejectionQty || 5 });
  const [thirdStage, setThirdStage] = useState({ totalQty: initialData?.stageProcessThird?.totalQty || 240, okQty: initialData?.stageProcessThird?.okQty || 235, rejectionQty: initialData?.stageProcessThird?.rejectionQty || 5 });
  const [stageRemark, setStageRemark] = useState<string>(initialData?.stageRemark || 'Final lacquer cured at 80°C for 45 mins.');

  const [preparedBy, setPreparedBy] = useState<string>(initialData?.preparedBy || 'Manoj Tiwari (Stores)');
  const [checkedBy, setCheckedBy] = useState<string>(initialData?.checkedBy || 'Vikram Patel (Supervisor)');
  const [stageApprovedBy, setStageApprovedBy] = useState<string>(initialData?.stageApprovedBy || 'Satish Sharma (Plant Head)');

  if (!isOpen) return null;

  // Add Issued Material Row
  const handleAddMaterialRow = () => {
    setIssuedMaterials([
      ...issuedMaterials,
      {
        id: Date.now().toString(),
        itemDescription: 'High-Gloss Clear Lacquer Coat',
        qty: 10,
        colour: 'Transparent High-Gloss',
        uom: 'Litres',
        remark: 'Top protective coat'
      }
    ]);
  };

  // Remove Issued Material Row
  const handleRemoveMaterialRow = (id: string) => {
    if (issuedMaterials.length <= 1) return;
    setIssuedMaterials(issuedMaterials.filter(m => m.id !== id));
  };

  // Update Material Row
  const handleUpdateMaterial = (id: string, field: keyof IssuedMaterialItem, val: any) => {
    setIssuedMaterials(prev => prev.map(item => {
      if (item.id !== id) return item;
      return { ...item, [field]: val };
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const targetQtyVal = issuedMaterials[0]?.qty || 250;
    const colorVal = issuedMaterials[0]?.colour || initialData?.color || 'Monza Red Gloss';

    const newJobCard: JobCard = {
      docNo,
      revNo,
      revDate,
      jobCardNo,
      woNo: wNo,
      customer,
      partCode: initialData?.partCode || 'SUBSTRATE',
      partDescription: issuedMaterials[0]?.itemDescription || 'Raw Part Substrate',
      model: initialData?.model || 'OEM Batch',
      color: colorVal,
      targetQty: targetQtyVal,
      sprayedQty: initialData?.sprayedQty || 0,
      goodQty: initialData?.goodQty || 0,
      rejectQty: initialData?.rejectQty || 0,
      status: initialData?.status || 'Open',
      fpaStatus: initialData?.fpaStatus || 'Approved',

      // INITIAL PROCESS
      painterName,
      wNo,
      issueDate,
      issueTime,
      leadTime,
      dept,

      // FINAL PROCESS
      returnMaterialDesc,
      returnPainterName,
      returnDate,
      returnTime,
      returnOkQty,
      returnRejectionQty,
      checkingPerson,
      headerRemark,

      // ISSUE MATERIAL DETAILS TABLE
      issuedMaterials,

      // SIGNATURES
      storeIncharge,
      prodSupervisor,
      approvedBy,

      // 3-STAGE PROCESS TRACKING
      stageProcessFirst: firstStage,
      stageProcessSecond: secondStage,
      stageProcessThird: thirdStage,
      stageRemark,
      preparedBy,
      checkedBy,
      stageApprovedBy
    };

    addJobCard(newJobCard);
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-[24px] max-w-4xl w-full p-6 shadow-2xl border border-[#ececec] space-y-5 max-h-[94vh] overflow-y-auto no-scrollbar print:max-w-none print:w-full print:p-0 print:shadow-none">
        
        {/* Top Action Bar (Hidden on print) */}
        <div className="flex items-center justify-between pb-3 border-b border-[#ececec] print:hidden">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase font-bold">
              {docNo} • {revNo}
            </span>
            <h2 className="text-xl font-serif text-[#17191c] font-bold">
              Job Card Cubic Paint Frame (Store Material Issue)
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-full bg-[#f2f2f3] text-[#17191c] font-medium text-xs hover:bg-[#e4e4e6] flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print Job Sheet
            </button>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-[#17191c] font-bold flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5 text-xs">
          
          {/* Printable Official Excel Header (Exact Image 1 Header) */}
          <div className="border-2 border-[#17191c] rounded-[12px] p-4 bg-white space-y-4">
            
            <div className="flex items-center justify-between border-b-2 border-[#17191c] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#17191c] text-[#c09748] font-serif font-bold text-xl flex items-center justify-center">
                  PK
                </div>
                <div>
                  <h1 className="text-2xl font-serif font-bold text-[#17191c] tracking-tight uppercase">
                    Job Card Cubic Paint Frame
                  </h1>
                  <p className="text-[10px] text-[#777b86]">Paintking Surface Solutions Pvt. Ltd.</p>
                </div>
              </div>

              <div className="text-right border-l-2 border-[#17191c] pl-4 font-mono text-[11px]">
                <div className="font-bold text-[#17191c]">{docNo}</div>
                <div className="text-gray-600">{revNo}</div>
                <div className="text-gray-500 text-[10px]">Rev. Date: {revDate}</div>
              </div>
            </div>

            {/* SECTION 1: INITIAL PROCESS & FINAL PROCESS GRID (Exact Image 1 Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-12 border-2 border-[#17191c] rounded-lg overflow-hidden divide-y md:divide-y-0 md:divide-x-2 divide-[#17191c]">
              
              {/* Left Column: INITIAL PROCESS */}
              <div className="md:col-span-5 p-3 space-y-2 bg-[#fafafb]">
                <div className="font-serif font-bold text-sm text-[#17191c] uppercase border-b border-[#17191c] pb-1">
                  INITIAL PROCESS
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#777b86]">Painter Name:</span>
                    <input
                      type="text"
                      required
                      value={painterName}
                      onChange={e => setPainterName(e.target.value)}
                      className="p-1 rounded border border-[#ececec] bg-white font-semibold text-right w-44"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#777b86]">W.No. (Work Order):</span>
                    <input
                      type="text"
                      required
                      value={wNo}
                      onChange={e => setWNo(e.target.value)}
                      className="p-1 rounded border border-[#ececec] bg-white font-mono font-bold text-right w-44"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#777b86]">Issue Date:</span>
                    <input
                      type="date"
                      required
                      value={issueDate}
                      onChange={e => setIssueDate(e.target.value)}
                      className="p-1 rounded border border-[#ececec] bg-white text-right w-44"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#777b86]">Issue Time:</span>
                    <input
                      type="text"
                      required
                      value={issueTime}
                      onChange={e => setIssueTime(e.target.value)}
                      className="p-1 rounded border border-[#ececec] bg-white text-right w-44"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#777b86]">Customer:</span>
                    <input
                      type="text"
                      required
                      value={customer}
                      onChange={e => setCustomer(e.target.value)}
                      className="p-1 rounded border border-[#ececec] bg-white font-bold text-right w-44"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#777b86]">Lead Time:</span>
                    <input
                      type="text"
                      value={leadTime}
                      onChange={e => setLeadTime(e.target.value)}
                      className="p-1 rounded border border-[#ececec] bg-white text-right w-44"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#777b86]">Dept.:</span>
                    <input
                      type="text"
                      value={dept}
                      onChange={e => setDept(e.target.value)}
                      className="p-1 rounded border border-[#ececec] bg-white font-semibold text-right w-44"
                    />
                  </div>
                </div>
              </div>

              {/* Middle Column: FINAL PROCESS */}
              <div className="md:col-span-5 p-3 space-y-2 bg-[#fafafb]">
                <div className="font-serif font-bold text-sm text-[#17191c] uppercase border-b border-[#17191c] pb-1">
                  FINAL PROCESS (Return Tracking)
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#777b86]">Return Material Description:</span>
                    <input
                      type="text"
                      value={returnMaterialDesc}
                      onChange={e => setReturnMaterialDesc(e.target.value)}
                      className="p-1 rounded border border-[#ececec] bg-white font-medium text-right w-44"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#777b86]">Return Painter Name:</span>
                    <input
                      type="text"
                      value={returnPainterName}
                      onChange={e => setReturnPainterName(e.target.value)}
                      className="p-1 rounded border border-[#ececec] bg-white text-right w-44"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#777b86]">Return Date :-</span>
                    <input
                      type="date"
                      value={returnDate}
                      onChange={e => setReturnDate(e.target.value)}
                      className="p-1 rounded border border-[#ececec] bg-white text-right w-44"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#777b86]">Return Time :-</span>
                    <input
                      type="text"
                      value={returnTime}
                      onChange={e => setReturnTime(e.target.value)}
                      placeholder="e.g. 04:30 PM"
                      className="p-1 rounded border border-[#ececec] bg-white text-right w-44"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#777b86]">Return Ok Qty :-</span>
                    <input
                      type="number"
                      value={returnOkQty}
                      onChange={e => setReturnOkQty(Number(e.target.value))}
                      className="p-1 rounded border border-[#ececec] bg-white font-mono font-bold text-emerald-800 text-right w-44"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#777b86]">Return Rejection Qty :-</span>
                    <input
                      type="number"
                      value={returnRejectionQty}
                      onChange={e => setReturnRejectionQty(Number(e.target.value))}
                      className="p-1 rounded border border-[#ececec] bg-white font-mono font-bold text-red-600 text-right w-44"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#777b86]">Checking Person :-</span>
                    <input
                      type="text"
                      value={checkingPerson}
                      onChange={e => setCheckingPerson(e.target.value)}
                      className="p-1 rounded border border-[#ececec] bg-white font-semibold text-right w-44"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Remark */}
              <div className="md:col-span-2 p-3 bg-white space-y-2">
                <div className="font-serif font-bold text-sm text-[#17191c] uppercase border-b border-[#17191c] pb-1">
                  Remark
                </div>
                <textarea
                  rows={8}
                  value={headerRemark}
                  onChange={e => setHeaderRemark(e.target.value)}
                  placeholder="Special instructions..."
                  className="w-full h-full p-2 border border-[#ececec] rounded text-[11px] focus:outline-none"
                />
              </div>

            </div>

            {/* SECTION 2: Issue Material Details (Middle Table Image 1) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b-2 border-[#17191c] pb-1">
                <h3 className="text-lg font-serif font-bold text-[#17191c] uppercase tracking-wide">
                  Issue Material Details
                </h3>
                <button
                  type="button"
                  onClick={handleAddMaterialRow}
                  className="px-3 py-1 rounded-full bg-[#17191c] text-[#c09748] text-[11px] font-bold hover:bg-black transition flex items-center gap-1 cursor-pointer print:hidden"
                >
                  <Plus className="w-3.5 h-3.5" /> + Add Issued Material Row
                </button>
              </div>

              <div className="border-2 border-[#17191c] rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#17191c] text-white font-semibold uppercase text-[10px] tracking-wider">
                      <th className="p-2 border-r border-[#333] min-w-[240px]">Item Description</th>
                      <th className="p-2 border-r border-[#333] text-center w-24">Qty</th>
                      <th className="p-2 border-r border-[#333] w-36">Colour</th>
                      <th className="p-2 border-r border-[#333] w-24">UOM</th>
                      <th className="p-2 border-r border-[#333]">Remark</th>
                      <th className="p-2 text-center w-12 print:hidden">Del</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#17191c] bg-white font-medium text-[11px]">
                    {issuedMaterials.map((mat) => (
                      <tr key={mat.id} className="hover:bg-[#fafafb]">
                        <td className="p-1.5 border-r border-[#17191c]">
                          <input
                            type="text"
                            required
                            value={mat.itemDescription}
                            onChange={e => handleUpdateMaterial(mat.id!, 'itemDescription', e.target.value)}
                            className="w-full p-1 rounded border border-[#ececec] font-semibold text-[#17191c]"
                          />
                        </td>
                        <td className="p-1.5 border-r border-[#17191c] text-center">
                          <input
                            type="number"
                            required
                            min="1"
                            value={mat.qty}
                            onChange={e => handleUpdateMaterial(mat.id!, 'qty', Number(e.target.value))}
                            className="w-full p-1 rounded border border-[#ececec] font-mono font-bold text-center text-[#17191c]"
                          />
                        </td>
                        <td className="p-1.5 border-r border-[#17191c]">
                          <input
                            type="text"
                            required
                            value={mat.colour}
                            onChange={e => handleUpdateMaterial(mat.id!, 'colour', e.target.value)}
                            className="w-full p-1 rounded border border-[#ececec] font-medium"
                          />
                        </td>
                        <td className="p-1.5 border-r border-[#17191c]">
                          <input
                            type="text"
                            required
                            value={mat.uom}
                            onChange={e => handleUpdateMaterial(mat.id!, 'uom', e.target.value)}
                            placeholder="Pcs / Litres"
                            className="w-full p-1 rounded border border-[#ececec] font-medium"
                          />
                        </td>
                        <td className="p-1.5 border-r border-[#17191c]">
                          <input
                            type="text"
                            value={mat.remark || ''}
                            onChange={e => handleUpdateMaterial(mat.id!, 'remark', e.target.value)}
                            placeholder="Batch / Note"
                            className="w-full p-1 rounded border border-[#ececec]"
                          />
                        </td>
                        <td className="p-1.5 text-center print:hidden">
                          {issuedMaterials.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMaterialRow(mat.id!)}
                              className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 3: Signatures Bar (Middle Signatures Image 1) */}
            <div className="grid grid-cols-3 gap-4 border-2 border-[#17191c] rounded-lg p-3 bg-[#fafafb] text-center font-bold text-[#17191c]">
              <div>
                <div className="text-[10px] text-[#777b86] uppercase tracking-wider mb-1">Store Incharge</div>
                <input
                  type="text"
                  required
                  value={storeIncharge}
                  onChange={e => setStoreIncharge(e.target.value)}
                  className="w-full p-1 text-center border border-[#ececec] bg-white rounded font-serif text-sm"
                />
              </div>

              <div>
                <div className="text-[10px] text-[#777b86] uppercase tracking-wider mb-1">Prod. Supervisor</div>
                <input
                  type="text"
                  required
                  value={prodSupervisor}
                  onChange={e => setProdSupervisor(e.target.value)}
                  className="w-full p-1 text-center border border-[#ececec] bg-white rounded font-serif text-sm"
                />
              </div>

              <div>
                <div className="text-[10px] text-[#777b86] uppercase tracking-wider mb-1">Approved By:-</div>
                <input
                  type="text"
                  required
                  value={approvedBy}
                  onChange={e => setApprovedBy(e.target.value)}
                  className="w-full p-1 text-center border border-[#ececec] bg-white rounded font-serif text-sm"
                />
              </div>
            </div>

            {/* SECTION 4: 3-Stage Process Tracking (Bottom Table Image 1) */}
            <div className="space-y-2">
              <div className="border-2 border-[#17191c] rounded-lg overflow-hidden">
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className="bg-[#17191c] text-white font-serif font-bold text-xs uppercase">
                      <th className="p-2 border-r border-[#333]">Process First (Base Coat)</th>
                      <th className="p-2 border-r border-[#333]">Process Second (Dipping)</th>
                      <th className="p-2 border-r border-[#333]">Process Third (Final Laquar)</th>
                      <th className="p-2 w-48">Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#17191c] bg-white font-medium text-[11px]">
                    
                    {/* Total Qty Row */}
                    <tr>
                      <td className="p-2 border-r border-[#17191c] flex items-center justify-between px-4">
                        <span className="font-bold text-[#777b86]">Total Qty:</span>
                        <input
                          type="number"
                          value={firstStage.totalQty}
                          onChange={e => setFirstStage({ ...firstStage, totalQty: Number(e.target.value) })}
                          className="w-24 p-1 border border-[#ececec] text-right font-mono font-bold"
                        />
                      </td>
                      <td className="p-2 border-r border-[#17191c] flex items-center justify-between px-4">
                        <span className="font-bold text-[#777b86]">Total Qty:</span>
                        <input
                          type="number"
                          value={secondStage.totalQty}
                          onChange={e => setSecondStage({ ...secondStage, totalQty: Number(e.target.value) })}
                          className="w-24 p-1 border border-[#ececec] text-right font-mono font-bold"
                        />
                      </td>
                      <td className="p-2 border-r border-[#17191c] flex items-center justify-between px-4">
                        <span className="font-bold text-[#777b86]">Total Qty:</span>
                        <input
                          type="number"
                          value={thirdStage.totalQty}
                          onChange={e => setThirdStage({ ...thirdStage, totalQty: Number(e.target.value) })}
                          className="w-24 p-1 border border-[#ececec] text-right font-mono font-bold"
                        />
                      </td>
                      <td rowSpan={3} className="p-2 align-top">
                        <textarea
                          rows={4}
                          value={stageRemark}
                          onChange={e => setStageRemark(e.target.value)}
                          placeholder="Process remarks..."
                          className="w-full h-full p-1.5 border border-[#ececec] rounded text-[11px] focus:outline-none"
                        />
                      </td>
                    </tr>

                    {/* Ok Qty Row */}
                    <tr>
                      <td className="p-2 border-r border-[#17191c] flex items-center justify-between px-4 bg-emerald-50/40">
                        <span className="font-bold text-emerald-800">Ok Qty:</span>
                        <input
                          type="number"
                          value={firstStage.okQty}
                          onChange={e => setFirstStage({ ...firstStage, okQty: Number(e.target.value) })}
                          className="w-24 p-1 border border-emerald-200 text-right font-mono font-bold text-emerald-800"
                        />
                      </td>
                      <td className="p-2 border-r border-[#17191c] flex items-center justify-between px-4 bg-emerald-50/40">
                        <span className="font-bold text-emerald-800">Ok Qty:</span>
                        <input
                          type="number"
                          value={secondStage.okQty}
                          onChange={e => setSecondStage({ ...secondStage, okQty: Number(e.target.value) })}
                          className="w-24 p-1 border border-emerald-200 text-right font-mono font-bold text-emerald-800"
                        />
                      </td>
                      <td className="p-2 border-r border-[#17191c] flex items-center justify-between px-4 bg-emerald-50/40">
                        <span className="font-bold text-emerald-800">Ok Qty:</span>
                        <input
                          type="number"
                          value={thirdStage.okQty}
                          onChange={e => setThirdStage({ ...thirdStage, okQty: Number(e.target.value) })}
                          className="w-24 p-1 border border-emerald-200 text-right font-mono font-bold text-emerald-800"
                        />
                      </td>
                    </tr>

                    {/* Rejection Qty Row */}
                    <tr>
                      <td className="p-2 border-r border-[#17191c] flex items-center justify-between px-4 bg-red-50/40">
                        <span className="font-bold text-red-600">Rejection Qty:</span>
                        <input
                          type="number"
                          value={firstStage.rejectionQty}
                          onChange={e => setFirstStage({ ...firstStage, rejectionQty: Number(e.target.value) })}
                          className="w-24 p-1 border border-red-200 text-right font-mono font-bold text-red-600"
                        />
                      </td>
                      <td className="p-2 border-r border-[#17191c] flex items-center justify-between px-4 bg-red-50/40">
                        <span className="font-bold text-red-600">Rejection Qty:</span>
                        <input
                          type="number"
                          value={secondStage.rejectionQty}
                          onChange={e => setSecondStage({ ...secondStage, rejectionQty: Number(e.target.value) })}
                          className="w-24 p-1 border border-red-200 text-right font-mono font-bold text-red-600"
                        />
                      </td>
                      <td className="p-2 border-r border-[#17191c] flex items-center justify-between px-4 bg-red-50/40">
                        <span className="font-bold text-red-600">Rejection Qty:</span>
                        <input
                          type="number"
                          value={thirdStage.rejectionQty}
                          onChange={e => setThirdStage({ ...thirdStage, rejectionQty: Number(e.target.value) })}
                          className="w-24 p-1 border border-red-200 text-right font-mono font-bold text-red-600"
                        />
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>

              {/* Bottom Footer Signatures (Prepared By, Checked By, Approved By Image 1) */}
              <div className="grid grid-cols-3 gap-4 border-2 border-[#17191c] rounded-lg p-3 bg-[#fafafb] text-center font-bold text-[#17191c]">
                <div>
                  <div className="text-[10px] text-[#777b86] uppercase tracking-wider mb-1">Prepared By:-</div>
                  <input
                    type="text"
                    required
                    value={preparedBy}
                    onChange={e => setPreparedBy(e.target.value)}
                    className="w-full p-1 text-center border border-[#ececec] bg-white rounded font-serif text-sm"
                  />
                </div>

                <div>
                  <div className="text-[10px] text-[#777b86] uppercase tracking-wider mb-1">Checked By:-</div>
                  <input
                    type="text"
                    required
                    value={checkedBy}
                    onChange={e => setCheckedBy(e.target.value)}
                    className="w-full p-1 text-center border border-[#ececec] bg-white rounded font-serif text-sm"
                  />
                </div>

                <div>
                  <div className="text-[10px] text-[#777b86] uppercase tracking-wider mb-1">Approved By:-</div>
                  <input
                    type="text"
                    required
                    value={stageApprovedBy}
                    onChange={e => setStageApprovedBy(e.target.value)}
                    className="w-full p-1 text-center border border-[#ececec] bg-white rounded font-serif text-sm"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Action Buttons (Hidden on print) */}
          <div className="flex justify-end gap-2.5 pt-2 border-t border-[#ececec] print:hidden">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium cursor-pointer hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#17191c] text-[#c09748] font-bold cursor-pointer hover:bg-black flex items-center gap-2 shadow-md"
            >
              <Save className="w-4 h-4 text-[#c09748]" />
              Issue Material & Save Job Card (Doc No: 001)
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
