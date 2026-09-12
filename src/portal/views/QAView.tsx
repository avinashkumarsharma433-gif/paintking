import React, { useState } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { 
  CheckCircle2, 
  Plus, 
  Gauge, 
  Activity 
} from 'lucide-react';

export const QAView: React.FC = () => {
  const { fpaRecords, createFPARecord, activePlant, currentUser } = usePortalStore();
  const [showFpaModal, setShowFpaModal] = useState<boolean>(false);

  // FPA Form State
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

  const handleFpaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createFPARecord({
      ...fpaForm,
      plant: activePlant,
      date: new Date().toISOString().split('T')[0]
    });
    setShowFpaModal(false);
  };

  const isDeltaEPass = fpaForm.deltaE <= 0.70;

  return (
    <div className="space-y-6">
      {/* ISO Header Banner */}
      <div className="bg-white rounded-[24px] p-6 border border-[#ececec] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
              PK-QA-FPA-001 • QUALITY GATEWAY
            </span>
            <span className="text-xs text-[#777b86]">
              First Part Approval (FPA), In-Process IPQC & OQC Final Release
            </span>
          </div>
          <h1 className="text-3xl font-serif font-normal text-[#17191c] tracking-tight">
            Industrial Quality Assurance Hub
          </h1>
          <p className="text-xs text-[#777b86] mt-1">
            Zero-Defect Standard: ΔE ≤ 0.70 Colorimetry • 100% Cross-Cut Tape Adhesion
          </p>
        </div>

        <button
          onClick={() => setShowFpaModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] text-xs font-semibold shadow-sm transition cursor-pointer w-full md:w-auto"
        >
          <Plus className="w-4 h-4 text-[#17191c]" />
          <span>New FPA Golden Gate Test</span>
        </button>
      </div>

      {/* ISO Specifications Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-[20px] bg-white border border-[#ececec] shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-full bg-[#faf3e0] text-[#c09748]">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#777b86] uppercase tracking-[0.14em]">Colorimetry Limit</div>
            <div className="text-lg font-serif font-normal text-[#17191c]">ΔE ≤ 0.70 Max</div>
            <div className="text-[10px] text-[#777b86]">CIELAB Spectrophotometer</div>
          </div>
        </div>

        <div className="p-5 rounded-[20px] bg-white border border-[#ececec] shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-full bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#777b86] uppercase tracking-[0.14em]">Adhesion Mandate</div>
            <div className="text-lg font-serif font-normal text-emerald-800">100% Cross-Cut Pass</div>
            <div className="text-[10px] text-[#777b86]">ASTM 5B Grid + 3M Tape</div>
          </div>
        </div>

        <div className="p-5 rounded-[20px] bg-white border border-[#ececec] shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-full bg-[#fafafb] text-[#17191c] border border-[#ececec]">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#777b86] uppercase tracking-[0.14em]">Audit Frequency</div>
            <div className="text-lg font-serif font-normal text-[#17191c]">Every 3 Hours</div>
            <div className="text-[10px] text-[#777b86]">5 Sample Pieces per Round</div>
          </div>
        </div>
      </div>

      {/* FPA Records Section */}
      <div className="bg-white rounded-[24px] border border-[#ececec] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f3]">
          <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#777b86]">
            First Part Approval (FPA) Golden Gate Releases
          </h3>
          <span className="text-xs font-mono text-[#c09748] font-bold">PK-QA-FPA-001</span>
        </div>

        <div className="space-y-3">
          {fpaRecords.map(fpa => (
            <div
              key={fpa.reportNo}
              className="p-4 sm:p-5 rounded-[20px] border border-[#ececec] hover:border-[#c09748] transition bg-[#fafafb] space-y-3 text-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-[#ececec]">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span className="font-mono font-bold text-[#c09748] px-2.5 py-0.5 rounded-full bg-white border border-[#f4e5be] whitespace-nowrap">
                    {fpa.reportNo}
                  </span>
                  <span className="font-serif font-normal text-base text-[#17191c]">{fpa.customer}</span>
                  <span className="text-[#777b86] font-mono text-[11px] whitespace-nowrap">({fpa.partCode} • {fpa.color})</span>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <span className={`px-3 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${
                    fpa.overallResult === 'Approved' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'
                  }`}>
                    Result: {fpa.overallResult}
                  </span>
                  <span className="text-[#777b86] font-mono whitespace-nowrap">{fpa.date}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-4 bg-white rounded-[16px] border border-[#ececec]">
                <div>
                  <span className="text-[#777b86]">Colorimetry ΔE:</span>
                  <div className="font-serif font-normal text-base text-[#17191c] mt-0.5">
                    {fpa.deltaE} <span className="text-[10px] text-emerald-700 font-sans font-medium">(≤ 0.70 Pass)</span>
                  </div>
                </div>
                <div>
                  <span className="text-[#777b86]">Cross-Cut Adhesion:</span>
                  <div className="font-semibold text-sm text-emerald-800 mt-0.5">
                    {fpa.adhesionPercent}% ({fpa.crossCutTest})
                  </div>
                </div>
                <div>
                  <span className="text-[#777b86]">Viscosity (Ford 4):</span>
                  <div className="font-mono font-semibold text-sm text-[#17191c] mt-0.5">{fpa.viscositySec}s</div>
                </div>
                <div>
                  <span className="text-[#777b86]">Assigned Painter:</span>
                  <div className="font-medium text-[#17191c] mt-0.5">{fpa.painter}</div>
                  <div className="text-[10px] text-[#777b86]">{fpa.booth}</div>
                </div>
                <div>
                  <span className="text-[#777b86]">QC Engineer:</span>
                  <div className="font-medium text-[#17191c] mt-0.5">{fpa.qcEngineer}</div>
                  <div className="text-[10px] text-emerald-700 font-medium">✓ Manager QA Signed</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: New FPA Golden Gate Test */}
      {showFpaModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-[#ececec] space-y-4 text-xs max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center pb-3 border-b border-[#ececec]">
              <div>
                <h3 className="text-base font-serif font-normal text-[#17191c]">New First Part Approval (FPA) Test</h3>
                <p className="text-[11px] text-[#777b86]">Mass production cannot run until FPA is approved (ΔE ≤ 0.70 & 100% Adhesion)</p>
              </div>
              <button 
                onClick={() => setShowFpaModal(false)} 
                className="font-bold text-[#979799] hover:text-[#17191c] text-base cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFpaSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Work Order</label>
                  <input
                    type="text"
                    value={fpaForm.woNo}
                    onChange={e => setFpaForm({ ...fpaForm, woNo: e.target.value })}
                    className="w-full p-2.5 rounded-[16px] border border-[#ececec] focus:border-[#c09748] focus:outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Job Card No.</label>
                  <input
                    type="text"
                    value={fpaForm.jobCardNo}
                    onChange={e => setFpaForm({ ...fpaForm, jobCardNo: e.target.value })}
                    className="w-full p-2.5 rounded-[16px] border border-[#ececec] focus:border-[#c09748] focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Color / Finish</label>
                  <input
                    type="text"
                    value={fpaForm.color}
                    onChange={e => setFpaForm({ ...fpaForm, color: e.target.value })}
                    className="w-full p-2.5 rounded-[16px] border border-[#ececec] focus:border-[#c09748] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Ford Cup Viscosity (s)</label>
                  <input
                    type="number"
                    value={fpaForm.viscositySec}
                    onChange={e => setFpaForm({ ...fpaForm, viscositySec: Math.max(0, Number(e.target.value)) })}
                    className="w-full p-2.5 rounded-[16px] border border-[#ececec] focus:border-[#c09748] focus:outline-none"
                    min={0}
                    required
                  />
                </div>
              </div>

              {/* Delta-E Spectrophotometer Calculator Card */}
              <div className={`p-4 rounded-[20px] border space-y-2.5 ${
                isDeltaEPass ? 'bg-[#faf3e0]/40 border-[#f4e5be]' : 'bg-red-50 border-red-300'
              }`}>
                <div className="flex justify-between items-center">
                  <div className="font-semibold text-[#17191c] flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-[#c09748]" />
                    Spectrophotometer Color Difference (ΔE)
                  </div>
                  <span className={`px-3 py-0.5 rounded-full font-bold text-[11px] ${
                    isDeltaEPass ? 'bg-emerald-100 text-emerald-800' : 'bg-red-600 text-white'
                  }`}>
                    {isDeltaEPass ? '✓ PASS (≤ 0.70)' : '🚨 REJECT / HOLD (> 0.70)'}
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
                      className="w-full p-2 rounded-[12px] border border-[#ececec] bg-white font-mono focus:border-[#c09748] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#777b86] font-medium">a*</label>
                    <input
                      type="number"
                      step="0.01"
                      value={fpaForm.a}
                      onChange={e => setFpaForm({ ...fpaForm, a: Number(e.target.value) })}
                      className="w-full p-2 rounded-[12px] border border-[#ececec] bg-white font-mono focus:border-[#c09748] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#777b86] font-medium">b*</label>
                    <input
                      type="number"
                      step="0.01"
                      value={fpaForm.b}
                      onChange={e => setFpaForm({ ...fpaForm, b: Number(e.target.value) })}
                      className="w-full p-2 rounded-[12px] border border-[#ececec] bg-white font-mono focus:border-[#c09748] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#777b86] font-medium">Measured ΔE</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={fpaForm.deltaE}
                      onChange={e => setFpaForm({ ...fpaForm, deltaE: Math.max(0, Number(e.target.value)) })}
                      className="w-full p-2 rounded-[12px] border-2 border-[#c09748] bg-white font-mono font-bold text-sm text-[#17191c] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Adhesion Test Checkbox */}
              <div className="p-4 bg-[#fafafb] border border-[#ececec] rounded-[20px] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-[#17191c]">Adhesion & Physical Testing:</div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    fpaForm.adhesionPercent === 100 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    Adhesion: {fpaForm.adhesionPercent}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[#777b86] font-medium mb-1">Cross-Cut Grid Test (ASTM 5B)</label>
                    <select
                      value={fpaForm.crossCutTest}
                      onChange={e => {
                        const val = e.target.value as 'Pass' | 'Fail';
                        const newAdhesion = (val === 'Pass' && fpaForm.tapeTest === 'Pass') ? 100 : 0;
                        setFpaForm({ ...fpaForm, crossCutTest: val, adhesionPercent: newAdhesion });
                      }}
                      className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white cursor-pointer focus:border-[#c09748] focus:outline-none"
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
                      className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white cursor-pointer focus:border-[#c09748] focus:outline-none"
                    >
                      <option value="Pass">Pass (Zero Paint Transfer)</option>
                      <option value="Fail">Fail (Paint Lifted)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowFpaModal(false)}
                  className="px-5 py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium cursor-pointer hover:bg-[#fafafb] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#c09748] text-[#17191c] font-semibold shadow-sm hover:bg-[#a97e35] cursor-pointer transition"
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
