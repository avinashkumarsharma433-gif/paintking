import React, { useState } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { Capa8DRecord, FourMChangeRecord } from '../types/portalTypes';
import { 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Printer, 
  FileText, 
  Users, 
  HelpCircle, 
  Search, 
  ArrowRight, 
  Check, 
  XCircle,
  TrendingDown,
  Layers,
  Wrench,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Capa8DView: React.FC = () => {
  const { 
    capa8DList, 
    addCapa8D, 
    updateCapa8D, 
    fourMChanges, 
    addFourMChange, 
    currentUser, 
    activePlant 
  } = usePortalStore();

  const [activeTab, setActiveTab] = useState<'8D_CAPA' | '4M_CHANGE'>('8D_CAPA');
  const [selectedCapaId, setSelectedCapaId] = useState<string>(capa8DList[0]?.id || 'CAPA-8D-2026-001');
  const [activeDStep, setActiveDStep] = useState<number>(4); // Default to D4 Root Cause
  const [showNew4MModal, setShowNew4MModal] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  const selectedCapa = capa8DList.find(c => c.id === selectedCapaId) || capa8DList[0];

  const dSteps = [
    { num: 1, label: 'D1: Team', title: 'Team Formation' },
    { num: 2, label: 'D2: Problem', title: 'Problem Description (5W2H)' },
    { num: 3, label: 'D3: Containment', title: 'Interim Containment (24H)' },
    { num: 4, label: 'D4: Root Cause', title: '5-Why & Fishbone Analysis' },
    { num: 5, label: 'D5: PCA', title: 'Permanent Corrective Actions' },
    { num: 6, label: 'D6: Validate', title: 'Verification & Trial Run' },
    { num: 7, label: 'D7: Recurrence', title: 'Horizontal Deployment & SOP' },
    { num: 8, label: 'D8: Closure', title: 'Sign-off & Closure' },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-[#17191c] via-[#212529] to-[#17191c] rounded-[24px] p-6 sm:p-8 text-white border border-[#30333a] shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c09748]/20 border border-[#c09748]/40 text-[#f4e5be] text-xs font-semibold uppercase tracking-wider mb-3">
              <ShieldAlert className="w-3.5 h-3.5 text-[#c09748]" />
              MNC Tier-1 Quality Standard • Audit Section J Compliance
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif font-normal tracking-tight text-white">
              8D Problem Solving & 4M Change Control
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Standardized 8D problem solving lifecycle, 5-Why root cause verification, Ishikawa diagram, and 4M change control register required by Schneider Electric, Tata, and Tier-1 OEMs.
            </p>
          </div>

          {/* Sub-view Switcher Tabs */}
          <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-full border border-white/10">
            <button
              onClick={() => setActiveTab('8D_CAPA')}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
                activeTab === '8D_CAPA'
                  ? 'bg-[#c09748] text-[#17191c] shadow-md'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              8D CAPA Cases ({capa8DList.length})
            </button>
            <button
              onClick={() => setActiveTab('4M_CHANGE')}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
                activeTab === '4M_CHANGE'
                  ? 'bg-[#c09748] text-[#17191c] shadow-md'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              4M Change Register ({fourMChanges.length})
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: 8D PROBLEM SOLVING DOSSIER */}
      {activeTab === '8D_CAPA' && selectedCapa && (
        <div className="space-y-6">
          {/* Active Case Selector Header */}
          <div className="bg-white rounded-[24px] p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[16px] bg-[#faf3e0] border border-[#f4e5be] flex items-center justify-center text-[#8a6521] flex-shrink-0">
                <FileText className="w-6 h-6 text-[#c09748]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-[#17191c]">{selectedCapa.id}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">{selectedCapa.complaintNo}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">{selectedCapa.status}</span>
                </div>
                <div className="text-base font-serif font-medium text-slate-900 mt-0.5">
                  {selectedCapa.customerName} • {selectedCapa.partName} ({selectedCapa.partCode})
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <button
                onClick={() => setShowPrintModal(true)}
                className="px-4 py-2 rounded-full bg-[#17191c] hover:bg-[#25282d] text-white text-xs font-medium transition flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-[#c09748]" />
                Print 8D Report
              </button>
            </div>
          </div>

          {/* D1 - D8 Interactive Stepper */}
          <div className="bg-white rounded-[24px] p-4 border border-slate-200 shadow-xs overflow-x-auto no-scrollbar">
            <div className="flex items-center justify-between min-w-[700px] gap-2">
              {dSteps.map((step) => {
                const isActive = activeDStep === step.num;
                const isPassed = activeDStep > step.num;

                return (
                  <button
                    key={step.num}
                    onClick={() => setActiveDStep(step.num)}
                    className={`flex-1 flex flex-col items-center p-2 rounded-[16px] transition cursor-pointer border ${
                      isActive
                        ? 'bg-[#faf3e0] border-[#c09748] text-[#8a6521] shadow-xs'
                        : isPassed
                        ? 'bg-[#fafafb] border-slate-200 text-slate-700 hover:bg-slate-100'
                        : 'bg-white border-transparent text-slate-400'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                      isActive
                        ? 'bg-[#c09748] text-[#17191c]'
                        : isPassed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {isPassed ? <Check className="w-3.5 h-3.5" /> : step.num}
                    </div>
                    <span className="text-[11px] font-semibold">{step.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* D-Step Body Content */}
          <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">
                  Step D{activeDStep} of 8
                </div>
                <h2 className="text-2xl font-serif text-[#17191c]">
                  {dSteps.find(s => s.num === activeDStep)?.title}
                </h2>
              </div>
              <div className="text-xs text-slate-500">
                Target Closure: <strong className="text-slate-900">{selectedCapa.targetClosureDate}</strong>
              </div>
            </div>

            {/* D1: Team */}
            {activeDStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                <div className="bg-[#fafafb] p-5 rounded-[20px] border border-slate-200 space-y-2">
                  <div className="text-slate-500 font-semibold uppercase tracking-wider">Champion</div>
                  <div className="text-base font-serif text-slate-900">{selectedCapa.d1Champion}</div>
                  <p className="text-slate-500">Management sponsor overseeing resources & sign-off</p>
                </div>
                <div className="bg-[#fafafb] p-5 rounded-[20px] border border-slate-200 space-y-2">
                  <div className="text-slate-500 font-semibold uppercase tracking-wider">Team Leader</div>
                  <div className="text-base font-serif text-slate-900">{selectedCapa.d1Leader}</div>
                  <p className="text-slate-500">Technical lead executing root cause analysis</p>
                </div>
                <div className="bg-[#fafafb] p-5 rounded-[20px] border border-slate-200 space-y-2">
                  <div className="text-slate-500 font-semibold uppercase tracking-wider">CFT Members</div>
                  <ul className="space-y-1 text-slate-800 font-medium">
                    {selectedCapa.d1Members.map((m, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#c09748]"></span>
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* D2: Problem Statement 5W2H */}
            {activeDStep === 2 && (
              <div className="space-y-6">
                <div className="p-4 rounded-[16px] bg-[#faf3e0] border border-[#f4e5be] text-xs">
                  <span className="font-semibold text-[#8a6521]">Synthesized Problem Statement:</span>
                  <div className="text-sm font-serif text-slate-900 mt-1 font-medium">
                    "{selectedCapa.d2ProblemStatement}"
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-[16px] bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 font-medium uppercase tracking-wider">What (Defect)</span>
                    <p className="text-slate-800 font-medium mt-1">{selectedCapa.d2What}</p>
                  </div>
                  <div className="p-4 rounded-[16px] bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 font-medium uppercase tracking-wider">Where (Location/Line)</span>
                    <p className="text-slate-800 font-medium mt-1">{selectedCapa.d2Where}</p>
                  </div>
                  <div className="p-4 rounded-[16px] bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 font-medium uppercase tracking-wider">When (Time/Shift)</span>
                    <p className="text-slate-800 font-medium mt-1">{selectedCapa.d2When}</p>
                  </div>
                  <div className="p-4 rounded-[16px] bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 font-medium uppercase tracking-wider">Who (Found by)</span>
                    <p className="text-slate-800 font-medium mt-1">{selectedCapa.d2Who}</p>
                  </div>
                  <div className="p-4 rounded-[16px] bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 font-medium uppercase tracking-wider">Why (Impact)</span>
                    <p className="text-slate-800 font-medium mt-1">{selectedCapa.d2Why}</p>
                  </div>
                  <div className="p-4 rounded-[16px] bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 font-medium uppercase tracking-wider">How Many (Scope)</span>
                    <p className="text-slate-800 font-medium mt-1 font-mono">{selectedCapa.d2HowMany}</p>
                  </div>
                </div>
              </div>
            )}

            {/* D3: Containment */}
            {activeDStep === 3 && (
              <div className="space-y-6 text-xs">
                <div className="p-5 rounded-[20px] bg-emerald-50/50 border border-emerald-200 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Interim Containment Actions (Implemented within 24 Hours)
                  </div>
                  <p className="text-slate-800 text-sm leading-relaxed">
                    {selectedCapa.d3ContainmentAction}
                  </p>
                  <div className="pt-2 border-t border-emerald-200/60 flex flex-wrap items-center justify-between gap-4 text-slate-600">
                    <span>Total Stock Sorted: <strong className="text-slate-900 font-mono">{selectedCapa.d3ContainmentQtyChecked} Pcs</strong></span>
                    <span>Defective Quarantined: <strong className="text-rose-700 font-mono">{selectedCapa.d3ContainmentQtyRejected} Pcs</strong></span>
                    <span>Owner: <strong className="text-slate-900">{selectedCapa.d3Owner}</strong></span>
                    <span>Date: <strong className="text-slate-900">{selectedCapa.d3ImplementedDate}</strong></span>
                  </div>
                </div>
              </div>
            )}

            {/* D4: 5-Why & Fishbone (Root Cause) */}
            {activeDStep === 4 && (
              <div className="space-y-8">
                {/* 5-Why Builder */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      5-Why Systematic Root Cause Analysis
                    </div>
                    <span className="text-xs text-slate-500 font-medium">Why 1 &rarr; Why 5 (Deep Root)</span>
                  </div>

                  <div className="space-y-2">
                    {selectedCapa.d4FiveWhy.map((why, idx) => {
                      const isLast = idx === selectedCapa.d4FiveWhy.length - 1;
                      return (
                        <div 
                          key={idx}
                          className={`p-3.5 rounded-[16px] text-xs flex items-start gap-3 border ${
                            isLast 
                              ? 'bg-rose-50/70 border-rose-200 text-rose-900 font-medium' 
                              : 'bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-[11px] flex-shrink-0 ${
                            isLast ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            W{idx + 1}
                          </span>
                          <span className="leading-relaxed mt-0.5">{why}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Ishikawa / Fishbone 6M Categories */}
                <div className="space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Ishikawa Fishbone (6M Categories Analysis)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    {(Object.entries(selectedCapa.d4Fishbone) as [string, string[]][]).map(([category, factors]) => (
                      <div key={category} className="bg-[#fafafb] p-4 rounded-[16px] border border-slate-200 space-y-2">
                        <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                          {category}
                        </span>
                        <ul className="space-y-1 text-slate-600">
                          {factors.map((f, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-[#c09748] mt-0.5">•</span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Escape Point */}
                <div className="p-4 rounded-[16px] bg-amber-50/70 border border-amber-200 text-xs flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold text-amber-900">Escape Point Analysis:</strong>
                    <p className="text-amber-800 mt-0.5">{selectedCapa.d4EscapePoint}</p>
                  </div>
                </div>
              </div>
            )}

            {/* D5: Permanent Corrective Actions */}
            {activeDStep === 5 && (
              <div className="space-y-6 text-xs">
                <div className="space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Defined Permanent Corrective Actions (PCA)
                  </div>
                  <div className="space-y-2">
                    {selectedCapa.d5CorrectiveActions.map((pca, i) => (
                      <div key={i} className="p-4 rounded-[16px] bg-[#fafafb] border border-slate-200 flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#c09748] text-[#17191c] font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-slate-800 font-medium leading-relaxed">{pca}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 rounded-[14px] bg-slate-50 border border-slate-200 flex items-center justify-between text-slate-600">
                    <span>PCA Owner: <strong className="text-slate-900">{selectedCapa.d5PcaOwner}</strong></span>
                    <span>Target Date: <strong className="text-slate-900">{selectedCapa.d5TargetDate}</strong></span>
                  </div>
                </div>
              </div>
            )}

            {/* D6: Validate */}
            {activeDStep === 6 && (
              <div className="space-y-6 text-xs">
                <div className="p-5 rounded-[20px] bg-[#fafafb] border border-slate-200 space-y-4">
                  <div className="font-semibold text-slate-900 text-sm">Validation Run Protocol & Results:</div>
                  <p className="text-slate-700 leading-relaxed">{selectedCapa.d6ValidationMethod}</p>
                  <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-200 text-center">
                    <div>
                      <span className="text-slate-400">Trial Batch Qty</span>
                      <div className="text-lg font-bold font-mono text-slate-900 mt-1">{selectedCapa.d6TrialQuantity} Pcs</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Observed Defect Rate</span>
                      <div className="text-lg font-bold font-mono text-emerald-700 mt-1">{selectedCapa.d6TrialDefectRate}%</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Validated On</span>
                      <div className="text-sm font-medium text-slate-900 mt-1">{selectedCapa.d6ImplementationDate}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* D7: Prevent Recurrence & Horizontal Deployment */}
            {activeDStep === 7 && (
              <div className="space-y-6 text-xs">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-[16px] bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <div className="font-bold text-slate-900">Standard SOP</div>
                      <div className="text-slate-600">Updated & Released</div>
                    </div>
                  </div>
                  <div className="p-4 rounded-[16px] bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <div className="font-bold text-slate-900">Control Plan</div>
                      <div className="text-slate-600">Rev 03 Approved</div>
                    </div>
                  </div>
                  <div className="p-4 rounded-[16px] bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <div className="font-bold text-slate-900">Process PFMEA</div>
                      <div className="text-slate-600">RPN Revised: 48</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-[16px] bg-slate-50 border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Horizontal Deployment (Sister Lines & Parts):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedCapa.d7HorizontalDeploymentParts.map((p, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-white border border-slate-200 font-mono font-medium text-slate-700">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* D8: Closure */}
            {activeDStep === 8 && (
              <div className="space-y-6 text-xs">
                <div className="p-6 rounded-[20px] bg-emerald-50 border border-emerald-200 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white mx-auto flex items-center justify-center">
                    <Check className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-serif font-bold text-emerald-950">
                    8D Case Closed & Effectiveness Verified
                  </h3>
                  <p className="text-emerald-800 max-w-md mx-auto">
                    Both internal zero-defect production run and customer incoming lot checks confirmed 100% compliant.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200 text-center">
                  <div className="p-4 rounded-[16px] bg-[#fafafb] border border-slate-200">
                    <span className="text-slate-400">Reviewed by QA Lead</span>
                    <div className="text-sm font-bold text-slate-900 mt-1">{selectedCapa.d8ReviewedByQA}</div>
                  </div>
                  <div className="p-4 rounded-[16px] bg-[#faf3e0] border border-[#f4e5be]">
                    <span className="text-[#8a6521]">Approved by Executive Director</span>
                    <div className="text-sm font-bold text-slate-900 mt-1">{selectedCapa.d8ApprovedByDirector}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Step Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-200">
              <button
                disabled={activeDStep <= 1}
                onClick={() => setActiveDStep(prev => prev - 1)}
                className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous Step
              </button>
              <button
                disabled={activeDStep >= 8}
                onClick={() => setActiveDStep(prev => prev + 1)}
                className="px-5 py-2 rounded-full bg-[#17191c] hover:bg-[#25282d] text-white text-xs font-medium transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next Step (D{activeDStep + 1})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: 4M CHANGE CONTROL REGISTER */}
      {activeTab === '4M_CHANGE' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-serif text-[#17191c]">4M Change Control Register</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Man • Machine • Material • Method formal qualification ledger before floor release
              </p>
            </div>
            <button
              onClick={() => setShowNew4MModal(true)}
              className="px-4 py-2 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] font-semibold text-xs transition flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              Log 4M Change
            </button>
          </div>

          <div className="bg-white rounded-[24px] border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#17191c] text-white">
                <tr>
                  <th className="p-3.5">Change ID</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">4M Category</th>
                  <th className="p-3.5">Description & Reason</th>
                  <th className="p-3.5">Trial FPA</th>
                  <th className="p-3.5">Customer Approval</th>
                  <th className="p-3.5">QA Sign-off</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {fourMChanges.map((ch) => (
                  <tr key={ch.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-mono font-bold text-slate-900">{ch.id}</td>
                    <td className="p-3.5 text-slate-600">{ch.date}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-full bg-[#faf3e0] text-[#8a6521] font-semibold border border-[#f4e5be]">
                        {ch.changeType.split(' ')[0]}
                      </span>
                    </td>
                    <td className="p-3.5 max-w-xs">
                      <div className="font-semibold text-slate-900">{ch.description}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{ch.reasonForChange}</div>
                    </td>
                    <td className="p-3.5 font-mono text-[#c09748] font-medium">{ch.trialFpaReportNo || 'N/A'}</td>
                    <td className="p-3.5">
                      {ch.customerIntimationRequired ? (
                        ch.customerApprovalReceived ? (
                          <span className="text-emerald-700 font-medium">Approved by OEM</span>
                        ) : (
                          <span className="text-amber-700 font-medium">Pending OEM</span>
                        )
                      ) : (
                        <span className="text-slate-400">Internal Only</span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-700 font-medium">{ch.approvedByQA}</td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        ch.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ch.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Log 4M Change */}
      <AnimatePresence>
        {showNew4MModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[24px] max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-lg font-serif text-slate-900">Record 4M Change Request</h3>
                <button
                  onClick={() => setShowNew4MModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const newRec: FourMChangeRecord = {
                    id: `4M-2026-${Math.floor(100 + Math.random() * 900)}`,
                    date: new Date().toISOString().split('T')[0],
                    changeType: (form.elements.namedItem('changeType') as HTMLSelectElement).value as any,
                    description: (form.elements.namedItem('description') as HTMLInputElement).value,
                    reasonForChange: (form.elements.namedItem('reason') as HTMLInputElement).value,
                    impactAssessment: (form.elements.namedItem('impact') as HTMLTextAreaElement).value,
                    trialRunApproved: true,
                    trialFpaReportNo: (form.elements.namedItem('fpaNo') as HTMLInputElement).value || 'PK-FPA-2026-043',
                    customerIntimationRequired: (form.elements.namedItem('custRequired') as HTMLInputElement).checked,
                    customerApprovalReceived: true,
                    plant: activePlant,
                    proposedBy: currentUser.name,
                    approvedByQA: 'Rajesh Nair (Head QA)',
                    status: 'Approved'
                  };
                  addFourMChange(newRec);
                  setShowNew4MModal(false);
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="font-medium text-slate-700 block mb-1">4M Category:</label>
                  <select name="changeType" className="w-full p-2.5 rounded-[12px] border border-slate-300 bg-white">
                    <option value="Man (Operator/Painter)">Man (Operator / Painter switch)</option>
                    <option value="Machine (Gun/Booth/Oven)">Machine (Gun / Booth / Oven parameter)</option>
                    <option value="Material (Paint/Thinner/Substrate)">Material (Paint batch / Thinner formula)</option>
                    <option value="Method (Jigging/Curing/Pressure)">Method (Jigging / Curing cycle / Pressure)</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-slate-700 block mb-1">Description of Change:</label>
                  <input name="description" required placeholder="e.g. New spray nozzle or thinner adjustment" className="w-full p-2.5 rounded-[12px] border border-slate-300" />
                </div>

                <div>
                  <label className="font-medium text-slate-700 block mb-1">Reason for Change:</label>
                  <input name="reason" required placeholder="e.g. Routine maintenance or temperature shift" className="w-full p-2.5 rounded-[12px] border border-slate-300" />
                </div>

                <div>
                  <label className="font-medium text-slate-700 block mb-1">Impact Assessment:</label>
                  <textarea name="impact" rows={2} placeholder="Zero shade deviation, verified tape adhesion..." className="w-full p-2.5 rounded-[12px] border border-slate-300" />
                </div>

                <div>
                  <label className="font-medium text-slate-700 block mb-1">Trial FPA Report Reference:</label>
                  <input name="fpaNo" placeholder="PK-FPA-2026-043" className="w-full p-2.5 rounded-[12px] border border-slate-300 font-mono" />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input type="checkbox" id="custRequired" name="custRequired" className="rounded" />
                  <label htmlFor="custRequired" className="text-slate-700 cursor-pointer">Customer formal approval required</label>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNew4MModal(false)}
                    className="px-4 py-2 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] font-semibold cursor-pointer"
                  >
                    Save 4M Change
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Printable 8D Report */}
      <AnimatePresence>
        {showPrintModal && selectedCapa && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[24px] max-w-4xl w-full p-8 space-y-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar print:p-0 print:border-none print:shadow-none"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
                <span className="font-serif font-medium text-slate-800 text-lg">
                  8D Problem Solving Customer Report
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-full bg-[#c09748] text-[#17191c] font-semibold text-xs transition flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <Printer className="w-4 h-4" />
                    Print / PDF
                  </button>
                  <button
                    onClick={() => setShowPrintModal(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Formal 8D Document Layout */}
              <div className="border-2 border-slate-800 p-6 space-y-6 text-xs text-slate-900 font-sans">
                <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4">
                  <div>
                    <div className="text-2xl font-serif font-bold tracking-tight">PAINTKING SURFACE SOLUTIONS</div>
                    <div className="text-slate-600 text-xs mt-0.5">8D PROBLEM SOLVING CAPA REPORT (Doc No: PK-QA-8D-001)</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="font-bold text-sm text-[#8a6521]">{selectedCapa.id}</div>
                    <div className="text-slate-500">Date: {selectedCapa.actualClosureDate || selectedCapa.dateOpened}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 border border-slate-300">
                  <div><strong>Customer:</strong> {selectedCapa.customerName}</div>
                  <div><strong>Complaint Ref:</strong> {selectedCapa.complaintNo}</div>
                  <div><strong>Part Description:</strong> {selectedCapa.partName}</div>
                  <div><strong>Part Code:</strong> {selectedCapa.partCode}</div>
                </div>

                {/* Steps summary */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold border-b border-slate-300 pb-1">D1: Cross-Functional Team</h4>
                    <p className="mt-1">Champion: {selectedCapa.d1Champion} | Leader: {selectedCapa.d1Leader} | Members: {selectedCapa.d1Members.join(', ')}</p>
                  </div>
                  <div>
                    <h4 className="font-bold border-b border-slate-300 pb-1">D2: Problem Description</h4>
                    <p className="mt-1">{selectedCapa.d2ProblemStatement}</p>
                  </div>
                  <div>
                    <h4 className="font-bold border-b border-slate-300 pb-1">D3: Interim Containment Action</h4>
                    <p className="mt-1">{selectedCapa.d3ContainmentAction} (Sorted: {selectedCapa.d3ContainmentQtyChecked} pcs, Quarantined: {selectedCapa.d3ContainmentQtyRejected} pcs)</p>
                  </div>
                  <div>
                    <h4 className="font-bold border-b border-slate-300 pb-1">D4: Root Cause (5-Why Conclusion)</h4>
                    <p className="mt-1">{selectedCapa.d4RootCauseSummary}</p>
                  </div>
                  <div>
                    <h4 className="font-bold border-b border-slate-300 pb-1">D5: Permanent Corrective Action</h4>
                    <ul className="list-disc pl-5 mt-1 space-y-0.5">
                      {selectedCapa.d5CorrectiveActions.map((pca, idx) => (
                        <li key={idx}>{pca}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold border-b border-slate-300 pb-1">D6: Verification of Effectiveness</h4>
                    <p className="mt-1">{selectedCapa.d6ValidationMethod} (Trial: {selectedCapa.d6TrialQuantity} pcs, Defect: {selectedCapa.d6TrialDefectRate}%)</p>
                  </div>
                  <div>
                    <h4 className="font-bold border-b border-slate-300 pb-1">D7: Preventive Action & Sister Lines</h4>
                    <p className="mt-1">SOP Updated: Yes | Control Plan: Yes | Deployed to: {selectedCapa.d7HorizontalDeploymentParts.join(', ')}</p>
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-8 pt-8 border-t-2 border-slate-800 text-center">
                  <div>
                    <div className="text-slate-400 mb-6">QA Lead Signature</div>
                    <div className="font-bold">{selectedCapa.d8ReviewedByQA}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 mb-6">Director Approval</div>
                    <div className="font-bold">{selectedCapa.d8ApprovedByDirector}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
