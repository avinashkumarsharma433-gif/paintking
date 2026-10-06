import React, { useState, useMemo } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { AuditQuestionItem, MNC_AUDIT_SECTIONS } from '../data/mncAuditQuestionsData';
import { 
  ClipboardCheck, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Search, 
  Printer, 
  FileText, 
  ExternalLink, 
  Award, 
  ChevronRight, 
  Filter, 
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Check,
  Building2,
  Calendar,
  User,
  Info,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const MncAuditView: React.FC = () => {
  const { 
    auditQuestions, 
    updateAuditAnswer, 
    resetAuditToStandard, 
    activePlant,
    currentUser,
    grnList,
    jobCards,
    fpaRecords,
    paintMixing,
    calibrationList,
    capa8DList
  } = usePortalStore();

  const [activeSectionId, setActiveSectionId] = useState<string>('A');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [evidenceModalQuestion, setEvidenceModalQuestion] = useState<AuditQuestionItem | null>(null);

  // Statistics
  const stats = useMemo(() => {
    const total = auditQuestions.length;
    const compliant = auditQuestions.filter(q => q.status === 'Compliant').length;
    const partial = auditQuestions.filter(q => q.status === 'Partially Compliant').length;
    const nonCompliant = auditQuestions.filter(q => q.status === 'Non-Compliant').length;
    const na = auditQuestions.filter(q => q.status === 'NA').length;
    const pending = auditQuestions.filter(q => q.status === 'Pending').length;
    
    // Effective score excludes NA
    const evaluable = total - na;
    const scorePct = evaluable > 0 
      ? Math.round(((compliant * 1.0 + partial * 0.5) / evaluable) * 100) 
      : 100;

    return { total, compliant, partial, nonCompliant, na, pending, scorePct };
  }, [auditQuestions]);

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return auditQuestions.filter(q => {
      const matchSection = searchQuery.trim() !== '' ? true : q.sectionId === activeSectionId;
      const matchQuery = searchQuery === '' || 
        q.questionEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.questionHi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.guide.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.qNo.toString().includes(searchQuery);
      const matchStatus = statusFilter === 'ALL' || q.status === statusFilter;
      return matchSection && matchQuery && matchStatus;
    });
  }, [auditQuestions, activeSectionId, searchQuery, statusFilter]);

  const activeSectionMeta = MNC_AUDIT_SECTIONS.find(s => s.id === activeSectionId) || MNC_AUDIT_SECTIONS[0];

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner & Audit Scorecard */}
      <div className="bg-gradient-to-br from-[#17191c] via-[#212529] to-[#17191c] rounded-[24px] p-6 sm:p-8 text-white border border-[#30333a] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#c09748]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c09748]/20 border border-[#c09748]/40 text-[#f4e5be] text-xs font-semibold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-[#c09748]" />
              MNC Tier-1 Vendor Audit Engine • Schneider / Minda Compliance
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif font-normal tracking-tight text-white">
              100-Question Plant Audit System
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Real-time bilingual (English + Hindi) audit readiness ledger. Linked 1-to-1 with live shopfloor records (GRN, Job Card, FPA Golden Gate, 8D CAPA & Instrument Calibration).
            </p>
          </div>

          {/* Big Score Card */}
          <div className="flex items-center gap-6 bg-white/5 backdrop-blur-md px-6 py-4 rounded-[20px] border border-white/10 w-full lg:w-auto justify-between lg:justify-start">
            <div className="text-center">
              <div className="text-3xl sm:text-5xl font-serif text-[#c09748] font-medium tracking-tight">
                {stats.scorePct}%
              </div>
              <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-300 mt-1">
                Readiness Index
              </div>
            </div>
            
            <div className="h-12 w-px bg-white/15"></div>

            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between gap-4">
                <span className="text-emerald-400 font-medium">Compliant</span>
                <span className="font-mono font-bold text-white">{stats.compliant}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-amber-400 font-medium">Partial</span>
                <span className="font-mono font-bold text-white">{stats.partial}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-rose-400 font-medium">Non-Compliant</span>
                <span className="font-mono font-bold text-white">{stats.nonCompliant}</span>
              </div>
            </div>

            <button
              onClick={() => setShowExportModal(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] font-semibold text-xs transition shadow-lg cursor-pointer ml-2"
            >
              <Printer className="w-4 h-4" />
              Export Dossier
            </button>
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">Plant: <strong className="text-white">{activePlant}</strong></span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Auditor: <strong className="text-white">{currentUser.name} ({currentUser.role})</strong></span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Total Questions: <strong className="text-white">100 / 100</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowExportModal(true)}
              className="sm:hidden flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#c09748] text-[#17191c] font-medium text-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Export
            </button>
            <button
              onClick={() => {
                if (confirm('Reset all 100 audit questions to benchmark baseline?')) {
                  resetAuditToStandard();
                }
              }}
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Benchmark
            </button>
          </div>
        </div>
      </div>

      {/* 13 Section Tabs (A to M) */}
      <div className="bg-white rounded-[24px] p-4 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3 px-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">
            13 Quality & Process Audit Domains (Sections A–M)
          </span>
          <span className="text-xs text-slate-500 font-medium">
            {searchQuery ? `Search matching across all sections` : `Section ${activeSectionId} of M`}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {MNC_AUDIT_SECTIONS.map((sec) => {
            const secQuestions = auditQuestions.filter(q => q.sectionId === sec.id);
            const compCount = secQuestions.filter(q => q.status === 'Compliant').length;
            const isSelected = activeSectionId === sec.id && !searchQuery;

            return (
              <button
                key={sec.id}
                onClick={() => {
                  setActiveSectionId(sec.id);
                  setSearchQuery('');
                }}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium transition cursor-pointer border ${
                  isSelected
                    ? 'bg-[#17191c] text-white border-[#17191c] shadow-md'
                    : 'bg-[#fafafb] text-slate-700 border-slate-200/80 hover:bg-[#f4e5be]/30 hover:border-[#c09748]/50'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isSelected ? 'bg-[#c09748] text-[#17191c]' : 'bg-slate-200 text-slate-700'
                }`}>
                  {sec.id}
                </span>
                <span className="whitespace-nowrap">{sec.title}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  isSelected ? 'bg-white/20 text-[#f4e5be]' : 'bg-slate-100 text-slate-500'
                }`}>
                  {compCount}/{secQuestions.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#fafafb] p-4 rounded-[20px] border border-slate-200/80">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by question text, Hindi keywords, guide or question # (e.g. 17, viscosity, paint)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-[16px] bg-white border border-slate-200 text-sm focus:outline-none focus:border-[#c09748] transition"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          {(['ALL', 'Compliant', 'Partially Compliant', 'Non-Compliant', 'NA'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition whitespace-nowrap border ${
                statusFilter === st
                  ? 'bg-[#c09748] text-[#17191c] border-[#c09748] font-semibold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st === 'ALL' ? 'All Status' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Active Section Header */}
      {!searchQuery && (
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 px-1">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#c09748]">
              Section {activeSectionMeta.id} Audit Scope
            </div>
            <h2 className="text-xl font-serif text-[#17191c]">
              {activeSectionMeta.title} / <span className="text-slate-500 font-sans text-base font-normal">{activeSectionMeta.titleHi}</span>
            </h2>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            {filteredQuestions.length} Questions in this domain
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white rounded-[24px] p-12 text-center border border-slate-200">
            <Info className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <div className="text-base font-serif text-slate-800">No questions found</div>
            <p className="text-xs text-slate-500 mt-1">Try changing your search term or status filter</p>
          </div>
        ) : (
          filteredQuestions.map((q) => {
            return (
              <motion.div
                key={q.id}
                layout
                className="bg-white rounded-[24px] p-5 sm:p-6 border border-slate-200/90 shadow-xs hover:border-[#c09748]/50 transition space-y-4"
              >
                {/* Header Row: Q-Number & Status Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-[14px] bg-[#17191c] text-[#f4e5be] font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
                      Q{q.qNo}
                    </span>
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                      Section {q.sectionId} • {q.sectionTitle}
                    </span>
                  </div>

                  {/* Status Toggle Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 bg-[#fafafb] p-1 rounded-full border border-slate-200">
                    {(['Compliant', 'Partially Compliant', 'Non-Compliant', 'NA'] as const).map(st => {
                      const active = q.status === st;
                      let colorStyle = 'bg-white text-slate-600 hover:bg-slate-100';
                      if (active) {
                        if (st === 'Compliant') colorStyle = 'bg-emerald-600 text-white font-semibold shadow-xs';
                        else if (st === 'Partially Compliant') colorStyle = 'bg-amber-500 text-white font-semibold shadow-xs';
                        else if (st === 'Non-Compliant') colorStyle = 'bg-rose-600 text-white font-semibold shadow-xs';
                        else colorStyle = 'bg-slate-600 text-white font-semibold shadow-xs';
                      }

                      return (
                        <button
                          key={st}
                          onClick={() => updateAuditAnswer(q.id, { status: st })}
                          className={`px-3 py-1 rounded-full text-[11px] transition cursor-pointer ${colorStyle}`}
                        >
                          {st === 'Compliant' && 'OK / Compliant'}
                          {st === 'Partially Compliant' && 'Partial'}
                          {st === 'Non-Compliant' && 'NC / Defect'}
                          {st === 'NA' && 'N/A'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bilingual Question Text */}
                <div className="space-y-1.5 pl-0 sm:pl-12">
                  <div className="text-[15px] sm:text-base font-serif text-[#17191c] leading-snug">
                    {q.questionEn}
                  </div>
                  {q.questionHi && (
                    <div className="text-xs sm:text-[13px] text-slate-600 font-sans leading-relaxed">
                      {q.questionHi}
                    </div>
                  )}
                </div>

                {/* Guide / संकेत Box */}
                {q.guide && (
                  <div className="sm:ml-12 bg-[#faf7ed] border border-[#f4e5be] rounded-[16px] p-3 text-xs text-[#8a6521] flex items-start gap-2">
                    <Info className="w-4 h-4 text-[#c09748] flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold text-[#8a6521]">Audit Guide / संकेत:</strong>{' '}
                      <span>{q.guide}</span>
                    </div>
                  </div>
                )}

                {/* Live Evidence & Notes Row */}
                <div className="sm:ml-12 pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-400 font-medium">Linked Shopfloor Evidence:</span>
                    <button
                      onClick={() => setEvidenceModalQuestion(q)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] border border-[#f4e5be] text-[#8a6521] font-mono font-semibold transition cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#c09748]" />
                      {q.evidenceRefDoc || 'Attach ERP Record'}
                      <ExternalLink className="w-3 h-3 text-[#c09748]" />
                    </button>
                    {q.evidenceNotes && (
                      <span className="text-slate-600 italic">"{q.evidenceNotes}"</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span>Audited: <strong>{q.auditedDate}</strong></span>
                    <span>•</span>
                    <span>By: <strong className="text-slate-700">{q.auditedBy}</strong></span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* MODAL: Evidence Attacher */}
      <AnimatePresence>
        {evidenceModalQuestion && (
          <div className="fixed inset-0 z-50 bg-[#fafafb] sm:bg-white overflow-y-auto flex flex-col animate-in fade-in duration-150">
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#ececec] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
                    MNC AUDIT EVIDENCE
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#777b86] text-[10px] font-mono">
                    QUESTION #{evidenceModalQuestion.qNo}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-serif font-normal text-[#17191c]">
                  Link Shopfloor Evidence to Question #{evidenceModalQuestion.qNo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEvidenceModalQuestion(null)}
                className="w-9 h-9 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] flex items-center justify-center cursor-pointer transition active:scale-95 shadow-2xs"
                title="Close"
              >
                <X className="w-5 h-5 text-[#17191c]" />
              </button>
            </div>

            <div className="max-w-2xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1 text-xs">
              <div className="p-4 bg-white rounded-[18px] border border-[#ececec] shadow-2xs">
                <div className="text-[11px] font-semibold text-[#8a6521] uppercase tracking-wider mb-1">Audit Checkpoint:</div>
                <p className="text-xs text-[#17191c] leading-relaxed font-medium">
                  {evidenceModalQuestion.questionEn}
                </p>
              </div>

              {/* Quick Select Available Real Records */}
              <div className="space-y-3">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#777b86]">
                  Select Matching Live ERP Record:
                </label>
                
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {/* GRN list */}
                  {grnList.slice(0, 2).map(g => (
                    <button
                      key={g.grnNo}
                      onClick={() => {
                        updateAuditAnswer(evidenceModalQuestion.id, { 
                          evidenceRefDoc: g.grnNo,
                          evidenceNotes: `Linked to Inward GRN from ${g.supplierCustomer} (${g.totalQty} pcs)`
                        });
                        setEvidenceModalQuestion(null);
                      }}
                      className="w-full text-left p-3.5 rounded-[16px] bg-white hover:bg-[#faf3e0] border border-[#ececec] hover:border-[#f4e5be] transition cursor-pointer flex items-center justify-between text-xs shadow-2xs"
                    >
                      <div>
                        <strong className="font-mono text-[#17191c]">{g.grnNo}</strong>
                        <span className="text-[#777b86] ml-2">GRN • {g.supplierCustomer}</span>
                      </div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">IQC: {g.iqcStatus}</span>
                    </button>
                  ))}

                  {/* FPA list */}
                  {fpaRecords.slice(0, 2).map(f => (
                    <button
                      key={f.reportNo}
                      onClick={() => {
                        updateAuditAnswer(evidenceModalQuestion.id, { 
                          evidenceRefDoc: f.reportNo,
                          evidenceNotes: `FPA Test ΔE: ${f.deltaE} (Pass), 100% tape adhesion by ${f.painter}`
                        });
                        setEvidenceModalQuestion(null);
                      }}
                      className="w-full text-left p-3.5 rounded-[16px] bg-white hover:bg-[#faf3e0] border border-[#ececec] hover:border-[#f4e5be] transition cursor-pointer flex items-center justify-between text-xs shadow-2xs"
                    >
                      <div>
                        <strong className="font-mono text-[#17191c]">{f.reportNo}</strong>
                        <span className="text-[#777b86] ml-2">FPA Golden Gate • {f.partCode}</span>
                      </div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">ΔE: {f.deltaE}</span>
                    </button>
                  ))}

                  {/* Calibration list */}
                  {calibrationList.slice(0, 2).map(c => (
                    <button
                      key={c.equipmentCode}
                      onClick={() => {
                        updateAuditAnswer(evidenceModalQuestion.id, { 
                          evidenceRefDoc: c.equipmentCode,
                          evidenceNotes: `${c.equipmentName} (${c.makeModel}), Calibrated by ${c.calibrationAgency}, Due: ${c.nextCalibrationDue}`
                        });
                        setEvidenceModalQuestion(null);
                      }}
                      className="w-full text-left p-3.5 rounded-[16px] bg-white hover:bg-[#faf3e0] border border-[#ececec] hover:border-[#f4e5be] transition cursor-pointer flex items-center justify-between text-xs shadow-2xs"
                    >
                      <div>
                        <strong className="font-mono text-[#17191c]">{c.equipmentCode}</strong>
                        <span className="text-[#777b86] ml-2">{c.equipmentName}</span>
                      </div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">{c.status}</span>
                    </button>
                  ))}

                  {/* 8D CAPA */}
                  {capa8DList.map(c => (
                    <button
                      key={c.id}
                      onClick={() => {
                        updateAuditAnswer(evidenceModalQuestion.id, { 
                          evidenceRefDoc: c.id,
                          evidenceNotes: `8D Report for ${c.customerName} (${c.partName}), Status: ${c.status}`
                        });
                        setEvidenceModalQuestion(null);
                      }}
                      className="w-full text-left p-3.5 rounded-[16px] bg-white hover:bg-[#faf3e0] border border-[#ececec] hover:border-[#f4e5be] transition cursor-pointer flex items-center justify-between text-xs shadow-2xs"
                    >
                      <div>
                        <strong className="font-mono text-[#17191c]">{c.id}</strong>
                        <span className="text-[#777b86] ml-2">8D CAPA • {c.customerName}</span>
                      </div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">{c.status}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Evidence Reference Input */}
              <div className="space-y-3 pt-4 border-t border-[#ececec]">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#777b86]">
                  Or Enter Custom Document Reference & Auditor Notes:
                </label>
                <input
                  type="text"
                  defaultValue={evidenceModalQuestion.evidenceRefDoc}
                  id="customDocInput"
                  placeholder="e.g. PK-SOP-PNT-02, PK-MIX-2026-089, CAL-2026-001..."
                  className="w-full h-11 px-3.5 rounded-[16px] border border-[#dcdfe4] bg-white text-xs font-mono text-[#17191c] focus:outline-none focus:border-[#17191c]"
                />
                <textarea
                  id="customNotesInput"
                  defaultValue={evidenceModalQuestion.evidenceNotes}
                  placeholder="Auditor observation / finding notes..."
                  rows={3}
                  className="w-full p-3.5 rounded-[16px] border border-[#dcdfe4] bg-white text-xs text-[#17191c] focus:outline-none focus:border-[#17191c]"
                />
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEvidenceModalQuestion(null)}
                    className="px-5 py-2.5 rounded-full border border-[#ececec] text-xs font-semibold text-[#777b86] hover:bg-gray-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const docEl = document.getElementById('customDocInput') as HTMLInputElement;
                      const notesEl = document.getElementById('customNotesInput') as HTMLTextAreaElement;
                      updateAuditAnswer(evidenceModalQuestion.id, {
                        evidenceRefDoc: docEl?.value || evidenceModalQuestion.evidenceRefDoc,
                        evidenceNotes: notesEl?.value || ''
                      });
                      setEvidenceModalQuestion(null);
                    }}
                    className="px-6 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] font-semibold shadow-xs transition cursor-pointer"
                  >
                    Save Evidence Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Export Dossier & Print View */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 z-50 bg-[#fafafb] sm:bg-white overflow-y-auto flex flex-col animate-in fade-in duration-150 print:bg-white print:static print:inset-auto print:overflow-visible">
            {/* Top Print Actions */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#ececec] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs print:hidden">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
                    MNC VENDOR AUDIT
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#777b86] text-[10px] font-mono">
                    PK-MNC-AUD-2026-V2
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-serif font-normal text-[#17191c]">
                  Vendor Audit Compliance Dossier
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                >
                  <Printer className="w-4 h-4 text-[#c09748]" />
                  <span>Print / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="w-9 h-9 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] flex items-center justify-center cursor-pointer transition active:scale-95 shadow-2xs"
                  title="Close"
                >
                  <X className="w-5 h-5 text-[#17191c]" />
                </button>
              </div>
            </div>

            <div className="max-w-4xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1 text-xs print:p-0 print:border-none print:shadow-none">
              {/* Formal Audit Report Printable Layout */}
              <div className="border border-[#dcdfe4] bg-white rounded-[20px] p-6 sm:p-8 space-y-6 text-[#17191c] font-sans shadow-2xs print:border-none print:shadow-none">
                {/* Formal Header */}
                <div className="border-b border-[#ececec] pb-6 flex items-start justify-between gap-6">
                  <div>
                    <div className="text-2xl font-serif tracking-tight font-normal text-[#17191c]">
                      PAINTKING SURFACE SOLUTIONS
                    </div>
                    <div className="text-xs text-[#777b86] mt-1">
                      ISO 9001:2015 & IATF 16949 Audited Surface Coating Facility
                    </div>
                    <div className="text-xs text-[#777b86] mt-0.5">
                      Plant: {activePlant} Unit • Reg: Mumbai HO
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-[#8a6521] bg-[#faf3e0] px-3 py-1 rounded-full inline-block border border-[#f4e5be]">
                      DOC NO: PK-MNC-AUD-2026-V2
                    </div>
                    <div className="text-xs text-[#777b86] mt-2">
                      Date of Audit: <strong>{new Date().toLocaleDateString('en-GB')}</strong>
                    </div>
                    <div className="text-xs text-[#777b86]">
                      Overall Compliance: <strong className="text-emerald-700 text-sm font-serif">{stats.scorePct}% PASS</strong>
                    </div>
                  </div>
                </div>

                {/* Executive Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-[16px] bg-[#fafafb] border border-[#ececec] text-xs text-center">
                  <div>
                    <div className="text-[#777b86] font-medium">Total Questions</div>
                    <div className="text-lg font-bold font-serif text-[#17191c] mt-1">{stats.total}</div>
                  </div>
                  <div>
                    <div className="text-emerald-700 font-medium">Compliant</div>
                    <div className="text-lg font-bold font-serif text-emerald-700 mt-1">{stats.compliant}</div>
                  </div>
                  <div>
                    <div className="text-amber-700 font-medium">Partially Compliant</div>
                    <div className="text-lg font-bold font-serif text-amber-700 mt-1">{stats.partial}</div>
                  </div>
                  <div>
                    <div className="text-rose-700 font-medium">Non-Compliant / NC</div>
                    <div className="text-lg font-bold font-serif text-rose-700 mt-1">{stats.nonCompliant}</div>
                  </div>
                </div>

                {/* 13 Domain Breakdown Summary Table */}
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#777b86]">
                    Domain-wise Compliance Score Summary:
                  </div>
                  <table className="w-full text-left text-xs border border-[#ececec] rounded-lg overflow-hidden">
                    <thead className="bg-[#f2f2f3] text-[#17191c]">
                      <tr>
                        <th className="p-2.5 font-bold">Sec</th>
                        <th className="p-2.5 font-bold">Audit Domain (English & Hindi)</th>
                        <th className="p-2.5 text-center font-bold">Questions</th>
                        <th className="p-2.5 text-center font-bold">Compliant</th>
                        <th className="p-2.5 text-right font-bold">Domain Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ececec]">
                      {MNC_AUDIT_SECTIONS.map((sec) => {
                        const sq = auditQuestions.filter(q => q.sectionId === sec.id);
                        const sc = sq.filter(q => q.status === 'Compliant').length;
                        const sp = sq.filter(q => q.status === 'Partially Compliant').length;
                        const pct = sq.length > 0 ? Math.round(((sc * 1.0 + sp * 0.5) / sq.length) * 100) : 100;

                        return (
                          <tr key={sec.id} className="hover:bg-[#fafafb]">
                            <td className="p-2.5 font-bold font-mono text-[#8a6521]">{sec.id}</td>
                            <td className="p-2.5">
                              <span className="font-semibold text-[#17191c]">{sec.title}</span>
                              <span className="text-[#777b86] ml-2">({sec.titleHi})</span>
                            </td>
                            <td className="p-2.5 text-center font-mono">{sq.length}</td>
                            <td className="p-2.5 text-center font-mono text-emerald-700 font-semibold">{sc}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-[#17191c]">{pct}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Sign-off Stamps */}
                <div className="pt-8 border-t border-[#ececec] grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-xs">
                  <div className="border border-[#ececec] rounded-[16px] p-4 bg-[#fafafb]">
                    <div className="text-[#777b86] mb-4 text-[10px] uppercase font-semibold">Prepared by QA Lead</div>
                    <div className="font-bold text-[#17191c]">{currentUser.name}</div>
                    <div className="text-[11px] text-[#777b86] mt-0.5">Lead QA Auditor</div>
                  </div>
                  <div className="border border-[#ececec] rounded-[16px] p-4 bg-[#fafafb]">
                    <div className="text-[#777b86] mb-4 text-[10px] uppercase font-semibold">Verified by Plant Head</div>
                    <div className="font-bold text-[#17191c]">Satish Sharma</div>
                    <div className="text-[11px] text-[#777b86] mt-0.5">Plant Head ({activePlant})</div>
                  </div>
                  <div className="border border-[#f4e5be] rounded-[16px] p-4 bg-[#faf3e0]/60">
                    <div className="text-[#8a6521] mb-4 text-[10px] uppercase font-semibold">Approved by Executive Director</div>
                    <div className="font-bold text-[#17191c]">Gurprit Singh</div>
                    <div className="text-[11px] text-[#8a6521] mt-0.5">Executive Director (Operations)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
