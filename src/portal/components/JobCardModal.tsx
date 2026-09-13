import React, { useState } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { JobCard, IssuedMaterialItem } from '../types/portalTypes';
import { Plus, Trash2, Save, Printer, Layers, User, Calendar, Clock, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';

interface JobCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<JobCard>;
}

export const JobCardModal: React.FC<JobCardModalProps> = ({ isOpen, onClose, initialData }) => {
  const { addJobCard, activePlant, currentUser } = usePortalStore();

  const [viewMode, setViewMode] = useState<'PORTAL' | 'PRINT'>('PORTAL');

  // Metadata
  const [docNo] = useState<string>(initialData?.docNo || 'Doc No: 001');
  const [revNo] = useState<string>(initialData?.revNo || 'Rev.No: 00');
  const [revDate] = useState<string>(initialData?.revDate || new Date().toISOString().split('T')[0]);

  // INITIAL PROCESS
  const [jobCardNo, setJobCardNo] = useState<string>(initialData?.jobCardNo || `JC-${Math.floor(1000 + Math.random() * 9000)}-RD`);
  const [wNo, setWNo] = useState<string>(initialData?.wNo || initialData?.woNo || 'WO-1042');
  const [painterName, setPainterName] = useState<string>(initialData?.painterName || 'Ramesh Sharma');
  const [issueDate, setIssueDate] = useState<string>(initialData?.issueDate || new Date().toISOString().split('T')[0]);
  const [issueTime, setIssueTime] = useState<string>(initialData?.issueTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [customer, setCustomer] = useState<string>(initialData?.customer || 'ROOP POLYMERS LTD');
  const [leadTime, setLeadTime] = useState<string>(initialData?.leadTime || '4 Hours');
  const [dept, setDept] = useState<string>(initialData?.dept || 'Cubic Dipping & Spray Line #2');
  const [headerRemark, setHeaderRemark] = useState<string>(initialData?.headerRemark || 'Target cap enforced for shop floor.');

  // FINAL PROCESS
  const [returnMaterialDesc, setReturnMaterialDesc] = useState<string>(initialData?.returnMaterialDesc || 'Unused Basecoat Monza Red');
  const [returnPainterName, setReturnPainterName] = useState<string>(initialData?.returnPainterName || 'Ramesh Sharma');
  const [returnDate, setReturnDate] = useState<string>(initialData?.returnDate || '');
  const [returnTime, setReturnTime] = useState<string>(initialData?.returnTime || '');
  const [returnOkQty, setReturnOkQty] = useState<number>(initialData?.returnOkQty || 0);
  const [returnRejectionQty, setReturnRejectionQty] = useState<number>(initialData?.returnRejectionQty || 0);
  const [checkingPerson, setCheckingPerson] = useState<string>(initialData?.checkingPerson || 'Amit Verma (QA Lead)');

  // ISSUE MATERIAL DETAILS TABLE
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

  // 3-STAGE PRODUCTION PROCESS
  const [firstStage, setFirstStage] = useState({ totalQty: initialData?.stageProcessFirst?.totalQty || 250, okQty: initialData?.stageProcessFirst?.okQty || 245, rejectionQty: initialData?.stageProcessFirst?.rejectionQty || 5 });
  const [secondStage, setSecondStage] = useState({ totalQty: initialData?.stageProcessSecond?.totalQty || 245, okQty: initialData?.stageProcessSecond?.okQty || 240, rejectionQty: initialData?.stageProcessSecond?.rejectionQty || 5 });
  const [thirdStage, setThirdStage] = useState({ totalQty: initialData?.stageProcessThird?.totalQty || 240, okQty: initialData?.stageProcessThird?.okQty || 235, rejectionQty: initialData?.stageProcessThird?.rejectionQty || 5 });
  const [stageRemark, setStageRemark] = useState<string>(initialData?.stageRemark || 'Final lacquer cured at 80°C for 45 mins.');

  const [preparedBy, setPreparedBy] = useState<string>(initialData?.preparedBy || 'Manoj Tiwari (Stores)');
  const [checkedBy, setCheckedBy] = useState<string>(initialData?.checkedBy || 'Vikram Patel (Supervisor)');
  const [stageApprovedBy, setStageApprovedBy] = useState<string>(initialData?.stageApprovedBy || 'Satish Sharma (Plant Head)');

  if (!isOpen) return null;

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

  const handleRemoveMaterialRow = (id: string) => {
    if (issuedMaterials.length <= 1) return;
    setIssuedMaterials(issuedMaterials.filter(m => m.id !== id));
  };

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

      painterName,
      wNo,
      issueDate,
      issueTime,
      leadTime,
      dept,

      returnMaterialDesc,
      returnPainterName,
      returnDate,
      returnTime,
      returnOkQty,
      returnRejectionQty,
      checkingPerson,
      headerRemark,

      issuedMaterials,

      storeIncharge,
      prodSupervisor,
      approvedBy,

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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-[24px] max-w-4xl w-full p-4 sm:p-7 shadow-2xl border border-[#ececec] space-y-6 max-h-[94vh] overflow-y-auto no-scrollbar print:max-w-none print:w-full print:p-0 print:shadow-none">
        
        {/* Top Header & View Toggle (Hidden on print) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#ececec] print:hidden">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#17191c] text-[#c09748] text-[10px] font-mono font-bold uppercase tracking-wider">
                JOB CARD DISPATCH DESK
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10px] font-mono font-bold">
                {docNo} • {revNo}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif text-[#17191c] font-bold">
              Job Card Cubic Paint Frame
            </h2>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* View Switcher Toggle */}
            <div className="flex items-center p-1 rounded-full bg-[#fafafb] border border-[#ececec] text-xs">
              <button
                type="button"
                onClick={() => setViewMode('PORTAL')}
                className={`px-3 py-1 rounded-full font-bold transition cursor-pointer ${
                  viewMode === 'PORTAL' ? 'bg-[#17191c] text-[#c09748]' : 'text-[#777b86]'
                }`}
              >
                Modern Portal View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('PRINT')}
                className={`px-3 py-1 rounded-full font-bold transition cursor-pointer ${
                  viewMode === 'PRINT' ? 'bg-[#17191c] text-[#c09748]' : 'text-[#777b86]'
                }`}
              >
                Print Sheet Format
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-full bg-[#f2f2f3] text-[#17191c] hover:bg-[#e4e4e6] cursor-pointer"
              title="Print Job Sheet"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-[#17191c] font-bold flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* ========================================================================= */}
          {/* MODE 1: MODERN EDITORIAL INDUSTRIAL PORTAL VIEW */}
          {/* ========================================================================= */}
          {viewMode === 'PORTAL' && (
            <div className="space-y-6 text-xs">
              
              {/* SECTION A: INITIAL PROCESS & WORK ORDER HERO CARD */}
              <div className="bg-[#fafafb] p-5 sm:p-6 rounded-[24px] border border-[#ececec] space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#ececec] pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-[#c09748] uppercase tracking-wider font-mono">
                      Initial Process & Dispatch Header
                    </span>
                    <h3 className="text-xl font-serif text-[#17191c] font-bold mt-0.5">
                      {customer}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#c09748] px-3 py-1 rounded-full bg-[#faf7ed] border border-[#f4e5be]">
                      {jobCardNo}
                    </span>
                    <span className="font-mono text-xs text-[#777b86] font-semibold">
                      W.No: {wNo}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1">
                      Painter Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={painterName}
                      onChange={e => setPainterName(e.target.value)}
                      className="w-full p-2.5 rounded-[16px] border border-[#ececec] bg-white font-semibold text-[#17191c]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1">
                      Work Order (W.No) *
                    </label>
                    <input
                      type="text"
                      required
                      value={wNo}
                      onChange={e => setWNo(e.target.value)}
                      className="w-full p-2.5 rounded-[16px] border border-[#ececec] bg-white font-mono font-bold text-[#17191c]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1">
                      Issue Date & Time *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        required
                        value={issueDate}
                        onChange={e => setIssueDate(e.target.value)}
                        className="w-full p-2.5 rounded-[16px] border border-[#ececec] bg-white text-[11px]"
                      />
                      <input
                        type="text"
                        required
                        value={issueTime}
                        onChange={e => setIssueTime(e.target.value)}
                        className="w-24 p-2.5 rounded-[16px] border border-[#ececec] bg-white text-[11px] text-center font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1">
                      Department / Shop Floor *
                    </label>
                    <input
                      type="text"
                      required
                      value={dept}
                      onChange={e => setDept(e.target.value)}
                      className="w-full p-2.5 rounded-[16px] border border-[#ececec] bg-white font-semibold text-[#17191c]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION B: ISSUE MATERIAL DETAILS (Dynamic Items List) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#ececec] pb-2">
                  <div>
                    <span className="text-[11px] font-bold text-[#c09748] uppercase tracking-wider font-mono">
                      Issue Material Details (Store Released Items)
                    </span>
                    <p className="text-xs text-[#777b86]">Add substrates, basecoat paints, thinners, and lacquers issued to painter</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddMaterialRow}
                    className="px-3.5 py-1.5 rounded-full bg-[#17191c] text-[#c09748] text-xs font-bold hover:bg-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" /> + Issue Material Row
                  </button>
                </div>

                <div className="space-y-3">
                  {issuedMaterials.map((mat, idx) => (
                    <div key={mat.id} className="bg-[#fafafb] p-4 rounded-[20px] border border-[#ececec] space-y-2 relative group hover:border-[#c09748]/50 transition">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10px] font-mono font-bold">
                          Material Item #{idx + 1}
                        </span>
                        {issuedMaterials.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMaterialRow(mat.id!)}
                            className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete Row
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-5">
                          <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-0.5">Item Description *</label>
                          <input
                            type="text"
                            required
                            value={mat.itemDescription}
                            onChange={e => handleUpdateMaterial(mat.id!, 'itemDescription', e.target.value)}
                            placeholder="e.g. ABS Substrate / Basecoat Red"
                            className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white font-semibold text-[#17191c]"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-0.5">Qty *</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={mat.qty}
                            onChange={e => handleUpdateMaterial(mat.id!, 'qty', Number(e.target.value))}
                            className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white font-mono font-bold text-center text-[#17191c]"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-0.5">Colour *</label>
                          <input
                            type="text"
                            required
                            value={mat.colour}
                            onChange={e => handleUpdateMaterial(mat.id!, 'colour', e.target.value)}
                            className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white font-medium text-[#17191c]"
                          />
                        </div>

                        <div className="sm:col-span-1">
                          <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-0.5">UOM *</label>
                          <input
                            type="text"
                            required
                            value={mat.uom}
                            onChange={e => handleUpdateMaterial(mat.id!, 'uom', e.target.value)}
                            placeholder="Pcs / L"
                            className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white text-center font-medium text-[#17191c]"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-0.5">Remark</label>
                          <input
                            type="text"
                            value={mat.remark || ''}
                            onChange={e => handleUpdateMaterial(mat.id!, 'remark', e.target.value)}
                            placeholder="Batch / Note"
                            className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white text-[11px]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION C: 3-STAGE PRODUCTION PROCESS LIVE PROGRESS TRACKER */}
              <div className="bg-[#fafafb] p-5 sm:p-6 rounded-[24px] border border-[#ececec] space-y-4">
                <div className="flex items-center justify-between border-b border-[#ececec] pb-3">
                  <div>
                    <span className="text-[11px] font-bold text-[#c09748] uppercase tracking-wider font-mono">
                      3-Stage Production Yield Tracker
                    </span>
                    <p className="text-xs text-[#777b86]">Live total, ok, and rejection counts across production line stages</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Stage 1 */}
                  <div className="p-4 rounded-[20px] bg-white border border-[#ececec] space-y-3">
                    <div className="font-serif font-bold text-sm text-[#17191c] border-b border-[#ececec] pb-1">
                      Stage 1: Base Coat Painting
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[#777b86]">Total Qty:</span>
                        <input
                          type="number"
                          value={firstStage.totalQty}
                          onChange={e => setFirstStage({ ...firstStage, totalQty: Number(e.target.value) })}
                          className="w-24 p-1.5 rounded-[10px] border border-[#ececec] font-mono font-bold text-right text-[#17191c]"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-800 font-bold">Ok Qty:</span>
                        <input
                          type="number"
                          value={firstStage.okQty}
                          onChange={e => setFirstStage({ ...firstStage, okQty: Number(e.target.value) })}
                          className="w-24 p-1.5 rounded-[10px] border border-emerald-200 bg-emerald-50 text-emerald-800 font-mono font-bold text-right"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-red-600 font-bold">Rejection:</span>
                        <input
                          type="number"
                          value={firstStage.rejectionQty}
                          onChange={e => setFirstStage({ ...firstStage, rejectionQty: Number(e.target.value) })}
                          className="w-24 p-1.5 rounded-[10px] border border-red-200 bg-red-50 text-red-600 font-mono font-bold text-right"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stage 2 */}
                  <div className="p-4 rounded-[20px] bg-white border border-[#ececec] space-y-3">
                    <div className="font-serif font-bold text-sm text-[#17191c] border-b border-[#ececec] pb-1">
                      Stage 2: Dipping / Hydrographic
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[#777b86]">Total Qty:</span>
                        <input
                          type="number"
                          value={secondStage.totalQty}
                          onChange={e => setSecondStage({ ...secondStage, totalQty: Number(e.target.value) })}
                          className="w-24 p-1.5 rounded-[10px] border border-[#ececec] font-mono font-bold text-right text-[#17191c]"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-800 font-bold">Ok Qty:</span>
                        <input
                          type="number"
                          value={secondStage.okQty}
                          onChange={e => setSecondStage({ ...secondStage, okQty: Number(e.target.value) })}
                          className="w-24 p-1.5 rounded-[10px] border border-emerald-200 bg-emerald-50 text-emerald-800 font-mono font-bold text-right"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-red-600 font-bold">Rejection:</span>
                        <input
                          type="number"
                          value={secondStage.rejectionQty}
                          onChange={e => setSecondStage({ ...secondStage, rejectionQty: Number(e.target.value) })}
                          className="w-24 p-1.5 rounded-[10px] border border-red-200 bg-red-50 text-red-600 font-mono font-bold text-right"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stage 3 */}
                  <div className="p-4 rounded-[20px] bg-white border border-[#ececec] space-y-3">
                    <div className="font-serif font-bold text-sm text-[#17191c] border-b border-[#ececec] pb-1">
                      Stage 3: Final Lacquer / Curing
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[#777b86]">Total Qty:</span>
                        <input
                          type="number"
                          value={thirdStage.totalQty}
                          onChange={e => setThirdStage({ ...thirdStage, totalQty: Number(e.target.value) })}
                          className="w-24 p-1.5 rounded-[10px] border border-[#ececec] font-mono font-bold text-right text-[#17191c]"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-800 font-bold">Ok Qty:</span>
                        <input
                          type="number"
                          value={thirdStage.okQty}
                          onChange={e => setThirdStage({ ...thirdStage, okQty: Number(e.target.value) })}
                          className="w-24 p-1.5 rounded-[10px] border border-emerald-200 bg-emerald-50 text-emerald-800 font-mono font-bold text-right"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-red-600 font-bold">Rejection:</span>
                        <input
                          type="number"
                          value={thirdStage.rejectionQty}
                          onChange={e => setThirdStage({ ...thirdStage, rejectionQty: Number(e.target.value) })}
                          className="w-24 p-1.5 rounded-[10px] border border-red-200 bg-red-50 text-red-600 font-mono font-bold text-right"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1">
                    Process Remark & Curing Oven Temperature Notes
                  </label>
                  <textarea
                    rows={2}
                    value={stageRemark}
                    onChange={e => setStageRemark(e.target.value)}
                    className="w-full p-3 rounded-[16px] border border-[#ececec] bg-white text-xs text-[#17191c] focus:outline-none"
                  />
                </div>
              </div>

              {/* SECTION D: RETURN MATERIAL & FINAL PROCESS */}
              <div className="bg-[#fafafb] p-5 rounded-[24px] border border-[#ececec] space-y-3">
                <span className="text-[11px] font-bold text-[#c09748] uppercase tracking-wider font-mono">
                  Final Process (Shift Job Return & QA Inspection)
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-0.5">Return Material Desc</label>
                    <input
                      type="text"
                      value={returnMaterialDesc}
                      onChange={e => setReturnMaterialDesc(e.target.value)}
                      className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-0.5">Return Painter Name</label>
                    <input
                      type="text"
                      value={returnPainterName}
                      onChange={e => setReturnPainterName(e.target.value)}
                      className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-0.5">Return Ok Qty</label>
                    <input
                      type="number"
                      value={returnOkQty}
                      onChange={e => setReturnOkQty(Number(e.target.value))}
                      className="w-full p-2.5 rounded-[12px] border border-emerald-200 bg-emerald-50 text-emerald-800 font-mono font-bold text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-0.5">Checking Person</label>
                    <input
                      type="text"
                      value={checkingPerson}
                      onChange={e => setCheckingPerson(e.target.value)}
                      className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* AUTHORIZATIONS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#fafafb] p-5 rounded-[24px] border border-[#ececec]">
                <div>
                  <label className="block text-[11px] font-bold text-[#777b86] uppercase mb-1">Prepared By (Stores) *</label>
                  <input
                    type="text"
                    required
                    value={preparedBy}
                    onChange={e => setPreparedBy(e.target.value)}
                    className="w-full p-2.5 rounded-[16px] border border-[#ececec] bg-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#777b86] uppercase mb-1">Checked By (Supervisor) *</label>
                  <input
                    type="text"
                    required
                    value={checkedBy}
                    onChange={e => setCheckedBy(e.target.value)}
                    className="w-full p-2.5 rounded-[16px] border border-[#ececec] bg-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#777b86] uppercase mb-1">Approved By (Plant Head) *</label>
                  <input
                    type="text"
                    required
                    value={stageApprovedBy}
                    onChange={e => setStageApprovedBy(e.target.value)}
                    className="w-full p-2.5 rounded-[16px] border border-[#ececec] bg-white font-semibold"
                  />
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* MODE 2: PRINT SHEET EXCEL FORMAT VIEW */}
          {/* ========================================================================= */}
          {viewMode === 'PRINT' && (
            <div className="border-2 border-[#17191c] rounded-[12px] p-4 bg-white space-y-4 text-xs">
              
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

              {/* 2-Column Excel Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 border-2 border-[#17191c] rounded-lg overflow-hidden divide-y md:divide-y-0 md:divide-x-2 divide-[#17191c]">
                <div className="md:col-span-6 p-3 space-y-2 bg-[#fafafb]">
                  <div className="font-serif font-bold text-xs uppercase border-b border-[#17191c] pb-1">
                    INITIAL PROCESS
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between"><span>Painter Name:</span><strong>{painterName}</strong></div>
                    <div className="flex justify-between"><span>W.No.:</span><strong>{wNo}</strong></div>
                    <div className="flex justify-between"><span>Issue Date:</span><strong>{issueDate}</strong></div>
                    <div className="flex justify-between"><span>Issue Time:</span><strong>{issueTime}</strong></div>
                    <div className="flex justify-between"><span>Customer:</span><strong>{customer}</strong></div>
                    <div className="flex justify-between"><span>Lead Time:</span><strong>{leadTime}</strong></div>
                    <div className="flex justify-between"><span>Dept.:</span><strong>{dept}</strong></div>
                  </div>
                </div>

                <div className="md:col-span-6 p-3 space-y-2 bg-[#fafafb]">
                  <div className="font-serif font-bold text-xs uppercase border-b border-[#17191c] pb-1">
                    FINAL PROCESS
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between"><span>Return Material Description:</span><strong>{returnMaterialDesc}</strong></div>
                    <div className="flex justify-between"><span>Return Painter Name:</span><strong>{returnPainterName}</strong></div>
                    <div className="flex justify-between"><span>Return Date :-</span><strong>{returnDate || '-'}</strong></div>
                    <div className="flex justify-between"><span>Return Time :-</span><strong>{returnTime || '-'}</strong></div>
                    <div className="flex justify-between"><span>Return Ok Qty :-</span><strong className="text-emerald-800">{returnOkQty}</strong></div>
                    <div className="flex justify-between"><span>Return Rejection Qty :-</span><strong className="text-red-600">{returnRejectionQty}</strong></div>
                    <div className="flex justify-between"><span>Checking Person :-</span><strong>{checkingPerson}</strong></div>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="space-y-1">
                <div className="font-serif font-bold text-sm uppercase">Issue Material Details</div>
                <div className="border-2 border-[#17191c] rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-[#17191c] text-white font-semibold uppercase">
                        <th className="p-2 border-r border-[#333]">Item Description</th>
                        <th className="p-2 border-r border-[#333] text-center">Qty</th>
                        <th className="p-2 border-r border-[#333]">Colour</th>
                        <th className="p-2 border-r border-[#333]">UOM</th>
                        <th className="p-2">Remark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#17191c] bg-white font-medium">
                      {issuedMaterials.map((mat, i) => (
                        <tr key={i}>
                          <td className="p-2 border-r border-[#17191c]">{mat.itemDescription}</td>
                          <td className="p-2 border-r border-[#17191c] text-center font-bold">{mat.qty}</td>
                          <td className="p-2 border-r border-[#17191c]">{mat.colour}</td>
                          <td className="p-2 border-r border-[#17191c]">{mat.uom}</td>
                          <td className="p-2">{mat.remark || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Stage Table */}
              <div className="border-2 border-[#17191c] rounded-lg overflow-hidden text-[11px]">
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className="bg-[#17191c] text-white font-bold uppercase">
                      <th className="p-2 border-r border-[#333]">Process First (Base Coat)</th>
                      <th className="p-2 border-r border-[#333]">Process Second (Dipping)</th>
                      <th className="p-2 border-r border-[#333]">Process Third (Final Laquar)</th>
                      <th className="p-2">Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#17191c] bg-white font-medium">
                    <tr>
                      <td className="p-2 border-r border-[#17191c]">Total Qty: <strong>{firstStage.totalQty}</strong></td>
                      <td className="p-2 border-r border-[#17191c]">Total Qty: <strong>{secondStage.totalQty}</strong></td>
                      <td className="p-2 border-r border-[#17191c]">Total Qty: <strong>{thirdStage.totalQty}</strong></td>
                      <td rowSpan={3} className="p-2 align-top text-left">{stageRemark}</td>
                    </tr>
                    <tr>
                      <td className="p-2 border-r border-[#17191c] text-emerald-800 font-bold">Ok Qty: {firstStage.okQty}</td>
                      <td className="p-2 border-r border-[#17191c] text-emerald-800 font-bold">Ok Qty: {secondStage.okQty}</td>
                      <td className="p-2 border-r border-[#17191c] text-emerald-800 font-bold">Ok Qty: {thirdStage.okQty}</td>
                    </tr>
                    <tr>
                      <td className="p-2 border-r border-[#17191c] text-red-600 font-bold">Rejection Qty: {firstStage.rejectionQty}</td>
                      <td className="p-2 border-r border-[#17191c] text-red-600 font-bold">Rejection Qty: {secondStage.rejectionQty}</td>
                      <td className="p-2 border-r border-[#17191c] text-red-600 font-bold">Rejection Qty: {thirdStage.rejectionQty}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-4 border-2 border-[#17191c] rounded-lg p-3 text-center font-bold">
                <div>Prepared By:- {preparedBy}</div>
                <div>Checked By:- {checkedBy}</div>
                <div>Approved By:- {stageApprovedBy}</div>
              </div>

            </div>
          )}

          {/* Action Buttons (Hidden on print) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#ececec] print:hidden">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium cursor-pointer hover:bg-gray-50 w-full sm:w-auto"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-7 py-3 rounded-full bg-[#17191c] text-[#c09748] font-bold cursor-pointer hover:bg-black flex items-center gap-2 shadow-lg transition active:scale-95 w-full sm:w-auto justify-center"
            >
              <Save className="w-4 h-4 text-[#c09748]" />
              Issue Material & Launch Job Card (Doc No: 001)
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
